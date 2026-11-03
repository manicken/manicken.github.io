/**
 * Entry point of the C++ export (the "Export (new)" button, that exports in the selected 'Export Mode').
 *
 *   RED design --(export-resolve.js)--> ResolvedDesign --(export-cpp.js)--> code --(this file)--> files
 *
 * This file only puts the generated code into files and delivers them:
 *   export dialog, the IDE webserver extension (http POST) or a zip file.
 */
RED.exporter.main = (function () {
    'use strict';

    const COMPOSITE_FILE = "COMPOSITE"; // the export dialog entry that shows all files in one

    /** @type {ExportFile[]} the files of the last export, used by the export dialog file list */
    let lastFiles = [];
    /** @type {String} */
    let lastCompositeText = "";

    function init() // called from main.js @ init()
    {
        RED.main.SetPopOver("#btn-exporter", "Exports the design in the selected 'Export Mode'<br><br>(new export system, under test)", "left");
        RED.main.SetPopOver("#btn-exporter-zip", "Exports all tabs as classes<br>to separate files in a zip file<br><br>(only in the Export Mode 'Classes')", "left");
    }
    $('#btn-exporter').click(function () { RED.arduino.export.showIOcheckWarning(exportInSelectedMode); });
    $('#btn-exporter-zip').click(function () {
        if (RED.arduino.settings.ExportMode != RED.arduino.EXPORT_MODE.CLASSES) return false; // the menu item is disabled
        RED.arduino.export.showIOcheckWarning(function () { exportClassBased(true); });
    });
    $('#btn-exporter-options').click(function () { // zip only makes sense when every class is in its own file
        $('#btn-exporter-zip').parent().toggleClass("disabled", RED.arduino.settings.ExportMode != RED.arduino.EXPORT_MODE.CLASSES);
    });

    /** exports in the mode selected by the 'Export Mode' selector */
    function exportInSelectedMode() {
        const EXPORT_MODE = RED.arduino.EXPORT_MODE;
        const mode = RED.arduino.settings.ExportMode;
        if (mode == EXPORT_MODE.CLASSIC) exportClassic();
        else if (mode == EXPORT_MODE.FLAT_CLASSIC) exportFlatClassic();
        else if (mode == EXPORT_MODE.FLAT_HELPER) exportFlatHelper();
        else if (mode == EXPORT_MODE.CLASSES) exportClassBased(false);
        else RED.notify("The OSC export is not yet moved to the new export,<br>use the OSC menu for now", "warning", null, 4000);
    }

    /** @returns {CppOptions} */
    function getCppOptions(generateZip) {
        const options = RED.exporter.cpp.getDefaultOptions();
        options.indent = RED.arduino.settings.CodeIndentations;
        options.useMixerTemplate = RED.arduino.settings.UseAudioMixerTemplate;
        options.endOfClassComment = (generateZip == false); // each class is in it's own file in a zip, so no need to mark the end
        options.splitClassFiles = (RED.arduino.settings.SplitClassFiles != false);
        return options;
    }

    // ******************************************************************
    // One tab to one file (Export Modes 'classic' and 'flatclassic')
    // ******************************************************************

    /**
     * The current tab to one file with global objects, no classes allowed (Export Mode 'classic')
     * @returns {ExportFile[]} the exported files (also used by tests)
     */
    function exportClassic() {
        RED.storage.update(); // saves and sorts the nodes and links in export order
        const rws = RED.exporter.resolve.resolveWorkspace(RED.nodes.currentWorkspace);
        RED.exporter.modes.addWorkspaceProblems(rws, RED.arduino.EXPORT_MODE.CLASSIC);
        if (showErrorReport([rws])) return [];
        return exportOneFile(rws, getCppOptions(false), "Classic Export to Arduino");
    }

    /**
     * The current tab to one file with global objects, the class instances are converted
     * into flat objects, voices[2].env -> voices_2_env (Export Mode 'flatclassic')
     * @returns {ExportFile[]} the exported files (also used by tests)
     */
    function exportFlatClassic() {
        RED.storage.update();
        const rws = RED.exporter.flatten.flattenWorkspace(RED.nodes.currentWorkspace);
        RED.exporter.modes.addWorkspaceProblems(rws, RED.arduino.EXPORT_MODE.FLAT_CLASSIC);
        if (showErrorReport([rws])) return [];
        const options = getCppOptions(false);
        options.flattenClasses = true;
        return exportOneFile(rws, options, "Flat Classic Export to Arduino");
    }

    /**
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @param {String} title
     * @returns {ExportFile[]}
     */
    function exportOneFile(rws, options, title) {
        const t0 = performance.now();
        const jsonString = RED.storage.getData();
        const includes = rws.usedClasses.map(function (c) { return '#include "' + c + '.h"'; });
        includes.push(...getUserIncludes(rws));

        let cpp = getCppHeader(jsonString, includes);
        const mixerCode = getMixerCode(collectMixerVariants([rws], options));
        if (mixerCode != undefined) {
            cpp += mixerCode.copyrightNote + "\n" + mixerCode.h + "\n";
            cpp += mixerCode.cpp.replace('#include "mixers.h"', '') + "\n";
        }
        for (const codeFile of rws.userCode.codeFiles) {
            cpp += "\n" + codeFile.contents + "\n";
        }
        cpp += "\n" + RED.exporter.cpp.writeClassicFile(rws, options) + "\n";
        cpp += getCppFooter();

        const files = [
            new ExportFile("GUI_TOOL.json", JSON.stringify(JSON.parse(jsonString), null, 4)),
            new ExportFile(rws.ws.label + ".h", cpp),
        ];
        files.forEach(function (f) { f.finalize(); });
        lastFiles = files;
        lastCompositeText = cpp;

        RED.arduino.httpPostAsync(JSON.stringify(getPostObject(files, [])));
        if (shouldShowDialog(false))
            RED.view.dialogs.showExportDialog(title, cpp, " Source Code:");

        console.log('exporter ' + title + ' took: ' + (performance.now() - t0) + ' milliseconds.');
        return files;
    }

    // ******************************************************************
    // Classes in separate files (Export Modes 'classes' and 'flathelper')
    // ******************************************************************

    /**
     * All exported tabs as classes, each in its own file (Export Mode 'classes')
     * @param {Boolean} generateZip
     * @returns {ExportFile[]} the exported files (also used by tests)
     */
    function exportClassBased(generateZip) {
        RED.storage.update(); // saves and sorts the nodes and links in export order
        const workspaces = getWorkspacesToExport();
        const classGroups = getClassGroupScopes(workspaces);
        const design = RED.exporter.resolve.resolveDesign([...workspaces, ...classGroups.scopes]);
        for (const p of classGroups.problems) design.workspaces[0].addProblem(p);
        if (showErrorReport(design.workspaces)) return [];
        return exportFiles(design, undefined, getCppOptions(generateZip), generateZip, "Class Export to Arduino");
    }

    /**
     * The class groups (groups with a class name) in the exported workspaces, also the ones inside other class groups,
     * each class once. All groups with the same class name must be the same (a class can only have one content),
     * the other class name checks are done for every class group (see graph.getClassGroupNameProblems).
     * @param {REDWorkspace[]} workspaces
     * @returns {{scopes: GroupScope[], problems: ResolvedProblem[]}}
     */
    function getClassGroupScopes(workspaces) {
        const graph = RED.exporter.graph;
        const byClassName = new Map(); // class name -> the scopes of all groups with that class name
        const visit = function (scope) {
            for (const node of graph.getScopeNodes(scope)) {
                const group = graph.isClassGroup(node) ? node : node._def.classGroup; // a group instance uses its source group
                if (group == undefined) continue;
                const groupScope = graph.getGroupScope(group);
                if (byClassName.has(groupScope.label) == false) byClassName.set(groupScope.label, []);
                const sameClass = byClassName.get(groupScope.label);
                if (sameClass.some(function (s) { return s.group === group; })) continue; // already visited
                sameClass.push(groupScope);
                visit(groupScope);
            }
        };
        for (const ws of workspaces) visit(ws);

        const scopes = [];
        const problems = [];
        for (const [className, groupScopes] of byClassName) {
            const first = groupScopes[0];
            scopes.push(first);
            const signature = graph.getScopeSignature(first);
            const describe = function (group) { return graph.getBaseName(group) + " (tab \"" + RED.nodes.getWorkspace(group.z).label + "\")"; };
            for (const other of groupScopes.slice(1)) {
                if (graph.getScopeSignature(other) != signature)
                    problems.push(new ResolvedProblem("error", "the groups " + describe(first.group) + " and " + describe(other.group) + " are both the class " + className +
                        " but they are not the same (a class can only have one content, give one of them another class name)", undefined, other.group));
            }
        }
        return { scopes, problems };
    }

    /**
     * The current tab flattened like 'flatclassic', but all objects and connections are put in one helper class
     * that makes the connections in its constructor, with one instance 'design' (Export Mode 'flathelper').
     * The mixer code and code files are in their own files, the COMPOSITE view shows everything in one text.
     * @returns {ExportFile[]} the exported files (also used by tests)
     */
    function exportFlatHelper() {
        RED.storage.update();
        const rws = RED.exporter.flatten.flattenWorkspace(RED.nodes.currentWorkspace);
        RED.exporter.modes.addWorkspaceProblems(rws, RED.arduino.EXPORT_MODE.FLAT_HELPER);
        if (showErrorReport([rws])) return [];
        const options = getCppOptions(false);
        options.flattenClasses = true;
        const design = new ResolvedDesign();
        design.workspaces.push(rws);
        return exportFiles(design, rws, options, false, "Flat Helper Export to Arduino");
    }

    /**
     * Writes every workspace in the design to its own file and delivers them.
     * @param {ResolvedDesign} design
     * @param {ResolvedWorkspace|undefined} rootRws when set, this (flattened) workspace is written as the helper class file, used by 'flathelper'
     * @param {CppOptions} options
     * @param {Boolean} generateZip
     * @param {String} title
     * @returns {ExportFile[]}
     */
    function exportFiles(design, rootRws, options, generateZip, title) {
        const t0 = performance.now();
        const jsonString = RED.storage.getData();
        const files = [new ExportFile("GUI_TOOL.json", JSON.stringify(JSON.parse(jsonString), null, 4))];
        const globalFiles = []; // files that is put first in the composite view of the export dialog
        const keywords = [];

        for (const rws of design.workspaces) {
            for (const name of rws.userCode.keepFiles) {
                const file = new ExportFile(name, "");
                file.overwrite_file = false; // only tells the IDE extension to not remove the file
                files.push(file);
            }
            for (const codeFile of rws.userCode.codeFiles) {
                if (codeFile.contents == undefined || codeFile.contents.length == 0) continue;
                const file = new ExportFile(codeFile.name, codeFile.contents);
                file.header = "\n// ****** Start Of Included File:" + codeFile.name + " ****** \n";
                file.footer = "\n// ****** End Of Included file:" + codeFile.name + " ******\n";
                globalFiles.push(file);
            }
        }
        const mixerVariants = collectMixerVariants(design.workspaces, options);
        if (getMixerCode(mixerVariants) != undefined)
            globalFiles.push(...Mixers.Export.GetFiles("Mono", mixerVariants, false));

        const jsonWorkspace = generateZip ? undefined : (rootRws || getJsonWorkspace(design.workspaces)); // the zip contains GUI_TOOL.json instead
        const workspaceFiles = [];
        for (const rws of design.workspaces) {
            const json = (rws === jsonWorkspace) ? jsonString : undefined;
            if (rws === rootRws) {
                workspaceFiles.push(...getHelperClassFiles(rws, options, mixerVariants, json));
            }
            else if (isMainWorkspace(rws.ws)) {
                workspaceFiles.push(newWorkspaceFile(getFileName(rws.ws), RED.exporter.cpp.writeMainFile(rws, options),
                    getCppHeader(json, getIncludes(rws, mixerVariants)), { isMain: true, isTop: true, className: rws.name, depends: rws.usedClasses }));
            }
            else {
                workspaceFiles.push(newWorkspaceFile(rws.name + ".h", RED.exporter.cpp.writeClass(rws, options),
                    "#pragma once\n" + getCppHeader(json, getIncludes(rws, mixerVariants)), { className: rws.name, depends: rws.usedClasses }));
                keywords.push({ token: rws.name, type: "KEYWORD2" });
                const source = options.splitClassFiles ? RED.exporter.cpp.writeClassSource(rws, options) : "";
                if (source.length != 0)
                    workspaceFiles.push(newWorkspaceFile(rws.name + ".cpp", source, getCppSourceHeader(rws.name + ".h"), { className: rws.name, depends: rws.usedClasses }));
            }
        }

        files.push(...globalFiles, ...workspaceFiles);
        files.forEach(function (f) { f.finalize(); });
        lastFiles = files;
        lastCompositeText = getCompositeText(jsonString, globalFiles, sortByDependencies(workspaceFiles), design);

        if (generateZip)
            saveAsZip(files);
        else
            RED.arduino.httpPostAsync(JSON.stringify(getPostObject(files, keywords), null, 4));

        if (shouldShowDialog(generateZip)) {
            const fileNames = [COMPOSITE_FILE, ...files.map(function (f) { return f.name; })];
            RED.view.dialogs.showExportDialog(title, lastCompositeText, " Source Code:", undefined, undefined, { cb: showFileInDialog, files: fileNames });
        }
        console.log('exporter ' + title + ' took: ' + (performance.now() - t0) + ' milliseconds.');
        return files;
    }

    /**
     * @param {String} name
     * @param {String} body
     * @param {String} header
     * @param {{isMain:Boolean, isTop:Boolean, className:String, depends:String[]}} props
     *     isTop: the top level file(s), put last in the composite view
     *     className and depends: used to put the files in dependency order in the composite view
     * @returns {ExportFile}
     */
    function newWorkspaceFile(name, body, header, props) {
        const file = new ExportFile(name, body);
        file.isMain = props.isMain == true;
        file.isTop = props.isTop == true;
        file.className = props.className;
        file.depends = props.depends || [];
        file.header = header;
        file.footer = getCppFooter();
        return file;
    }

    /**
     * The files of the helper class of the Export Mode 'flathelper':
     * split:     <Tab>Design.h (the class), <Tab>Design.cpp (constructor + instance) and the tab file (the code)
     * not split: only the tab file
     * @param {ResolvedWorkspace} rws the flattened tab
     * @param {CppOptions} options
     * @param {Number[]} mixerVariants
     * @param {String|undefined} json
     * @returns {ExportFile[]}
     */
    function getHelperClassFiles(rws, options, mixerVariants, json) {
        const parts = RED.exporter.cpp.writeHelperClass(rws, options);
        const className = RED.exporter.cpp.getHelperClassName(rws);
        const isMain = isMainWorkspace(rws.ws);
        const tabFileName = isMain ? getFileName(rws.ws) : (rws.ws.label + ".h");
        if (options.splitClassFiles == false)
            return [newWorkspaceFile(tabFileName, parts.header, getCppHeader(json, getIncludes(rws, mixerVariants)), { isMain, isTop: true, className: rws.name })];

        return [
            newWorkspaceFile(className + ".h", parts.header, "#pragma once\n" + getCppHeader(undefined, getIncludes(rws, mixerVariants)), { className }),
            newWorkspaceFile(className + ".cpp", parts.source, getCppSourceHeader(className + ".h"), { className }),
            newWorkspaceFile(tabFileName, parts.code, getCppHeader(json, ['#include "' + className + '.h"']), { isMain, isTop: true, className: rws.name, depends: [className] }),
        ];
    }

    /** @returns {REDWorkspace[]} */
    function getWorkspacesToExport() {
        return RED.nodes.workspaces.filter(function (ws) {
            if (ws.export == false) return false;
            if (RED.arduino.settings.ExportInstancedTabsOnly == true &&
                ws.isMain == false && ws.isAudioMain == false &&
                RED.nodes.getNodeInstancesOfType(ws.label).length == 0) return false; // classes not in use
            return true;
        });
    }

    /**
     * The design JSON is only written into one file, the top-level one:
     * the main file, else the 'audio main' tab, else a class that no other exported tab uses.
     * @param {ResolvedWorkspace[]} workspaces
     * @returns {ResolvedWorkspace|undefined}
     */
    function getJsonWorkspace(workspaces) {
        const main = workspaces.find(function (rws) { return isMainWorkspace(rws.ws); });
        if (main != undefined) return main;
        const audioMain = workspaces.find(function (rws) { return rws.ws.isAudioMain == true; });
        if (audioMain != undefined) return audioMain;
        const top = workspaces.find(function (rws) {
            return workspaces.every(function (other) { return other.usedClasses.includes(rws.name) == false; });
        });
        return (top != undefined) ? top : workspaces[0];
    }

    /** @param {REDWorkspace} ws */
    function isMainWorkspace(ws) {
        return (ws.isMain == true) || (ws.label == "main.cpp");
    }

    /** @param {REDWorkspace} ws @returns {String} */
    function getFileName(ws) {
        if (ws.label == "main.cpp") return ws.label;
        if (ws.isMain != true) return ws.label + ".h";

        let fileName = ws.label; // this includes ws.mainNameType == "tabName"
        if (ws.mainNameType == "main") fileName = "main";
        else if (ws.mainNameType == "projectName") fileName = RED.arduino.settings.ProjectName;
        return fileName + ws.mainNameExt;
    }

    /**
     * @param {ResolvedWorkspace} rws
     * @param {Number[]} mixerVariants
     * @returns {String[]} the include lines of a workspace file
     */
    function getIncludes(rws, mixerVariants) {
        const includes = rws.usedClasses.map(function (c) { return '#include "' + c + '.h"'; });
        if (mixerVariants.length != 0 && rws.dynMixers.some(function (m) { return m.type == "AudioMixer" && m.count != 4; }))
            includes.push('#include "mixers.h"');
        includes.push(...getUserIncludes(rws));
        return includes;
    }

    /** @param {ResolvedWorkspace} rws @returns {String[]} */
    function getUserIncludes(rws) {
        const includes = rws.userCode.includes.map(function (i) { return "#include " + i; });
        for (const codeFile of rws.userCode.codeFiles) {
            const lower = codeFile.name.toLowerCase();
            if (lower.endsWith(".c") || lower.endsWith(".cpp")) continue; // these are compiled separately
            includes.push('#include "' + codeFile.name + '"');
        }
        return includes;
    }

    /**
     * Puts the classes after the classes they use, the top level file(s) last.
     * (credits to h4yn0nnym0u5e for the idea of exporting in dependency order)
     * @param {ExportFile[]} files
     * @returns {ExportFile[]}
     */
    function sortByDependencies(files) {
        const sorted = [];
        const done = new Set();
        const remaining = files.filter(function (f) { return f.isTop == false; });
        while (remaining.length != 0) {
            const index = remaining.findIndex(function (f) {
                return f.depends.every(function (d) { return done.has(d) || files.some(function (f2) { return f2.className == d; }) == false; });
            });
            if (index == -1) { // circular dependency, keep the order as it is
                console.warn("exporter: circular class dependency between " + remaining.map(function (f) { return f.className; }).join(", "));
                sorted.push(...remaining);
                break;
            }
            const file = remaining.splice(index, 1)[0];
            sorted.push(file);
            done.add(file.className);
        }
        sorted.push(...files.filter(function (f) { return f.isTop == true; }));
        return sorted;
    }

    // ******************************************************************
    // Mixers
    // ******************************************************************

    /**
     * @param {ResolvedWorkspace[]} workspaces
     * @param {CppOptions} options
     * @returns {Number[]} the AudioMixer sizes that needs generated code
     */
    function collectMixerVariants(workspaces, options) {
        const variants = [];
        if (options.useMixerTemplate) return variants; // the template version handles all sizes
        for (const rws of workspaces) {
            for (const mixer of rws.dynMixers) {
                if (mixer.type != "AudioMixer") continue; // there is no generated code for AudioMixerStereo yet
                if (mixer.count == 4) continue; // already in the audio library
                if (variants.includes(mixer.count) == false) variants.push(mixer.count);
            }
        }
        return variants;
    }

    /** @param {Number[]} variants */
    function getMixerCode(variants) {
        if (variants.length == 0) return undefined;
        return Mixers.Export.GetCode("Mono", variants, false);
    }

    // ******************************************************************
    // Output
    // ******************************************************************

    /**
     * @param {String|undefined} jsonString the design JSON, only given for the one file that should contain it (see getJsonWorkspace)
     * @param {String[]} includes the include lines
     */
    function getCppHeader(jsonString, includes) {
        let header = RED.arduino.settings.StandardIncludeHeader
            + includes.join("\n") + "\n\n"
            + "// " + RED.arduino.settings.ProjectName + ": begin automatically generated code\n";
        if (jsonString != undefined && RED.arduino.settings.WriteJSONtoExportedFile == true)
            header += "// the following JSON string contains the whole project,\n// it can be imported into the tool (Import > JSON) to continue editing the design.\n"
                + "// JSON string:" + jsonString + "\n\n";
        return header;
    }

    /** @param {String} headerFileName @returns {String} the start of a .cpp file, it only needs its own header */
    function getCppSourceHeader(headerFileName) {
        return '#include "' + headerFileName + '"\n\n'
            + "// " + RED.arduino.settings.ProjectName + ": begin automatically generated code\n";
    }

    function getCppFooter() {
        return "// " + RED.arduino.settings.ProjectName + ": end automatically generated code\n";
    }

    /**
     * All files in one text, for the export dialog
     * @param {String} jsonString
     * @param {ExportFile[]} globalFiles
     * @param {ExportFile[]} workspaceFiles in dependency order
     * @param {ResolvedDesign} design
     */
    function getCompositeText(jsonString, globalFiles, workspaceFiles, design) {
        const userIncludes = [];
        for (const rws of design.workspaces) {
            for (const i of getUserIncludes(rws)) if (userIncludes.includes(i) == false) userIncludes.push(i);
        }
        let text = getCppHeader(jsonString, userIncludes);
        for (const file of globalFiles) {
            if (file.name == "mixers.cpp") text += file.body.replace('#include "mixers.h"', '') + "\n"; // the include gives a compiler error here
            else if (file.name == "mixers.h") text += file.header + "\n" + file.body + "\n"; // to include the copyright note
            else text += file.body + "\n";
        }
        for (const file of workspaceFiles) {
            text += "\n" + file.body;
        }
        text += getCppFooter();
        return text;
    }

    /**
     * When the design have errors (i.e. array sizes or bus widths that don't match)
     * no code is exported, instead a report of all errors (and warnings) is shown.
     * @param {ResolvedWorkspace[]} workspaces
     * @returns {Boolean} true if there were errors (and the report is shown)
     */
    function showErrorReport(workspaces) {
        const errorCount = workspaces.reduce(function (sum, rws) { return sum + rws.errors.length; }, 0);
        if (errorCount == 0) return false;

        const describe = function (p) {
            let text = "    " + p.text;
            if (p.link != undefined) text += "\n        wire: " + RED.exporter.graph.describeLink(p.link);
            else if (p.node != undefined) text += "\n        node: " + RED.exporter.graph.getBaseName(p.node);
            return text;
        };
        const lines = ["The export was stopped, the design have " + errorCount + " error" + (errorCount != 1 ? "s" : "") + ":", ""];
        for (const rws of workspaces) {
            if (rws.errors.length == 0) continue;
            lines.push('tab "' + rws.name + '"');
            for (const p of rws.errors) lines.push(describe(p));
            lines.push("");
        }
        const withWarnings = workspaces.filter(function (rws) { return rws.warnings.length != 0; });
        if (withWarnings.length != 0) {
            lines.push("", "Warnings (these are exported as comments, they don't stop the export):", "");
            for (const rws of withWarnings) {
                lines.push('tab "' + rws.name + '"');
                for (const p of rws.warnings) lines.push(describe(p));
                lines.push("");
            }
        }
        lastFiles = [];
        RED.notify("<strong>Export stopped</strong>, the design have " + errorCount + " error" + (errorCount != 1 ? "s" : ""), "warning", null, 4000);
        RED.view.dialogs.showExportDialog("Export stopped - " + errorCount + " error" + (errorCount != 1 ? "s" : ""), lines.join("\n"), " Errors:",
            { tips: "Fix the errors in the design and export again." });
        return true;
    }

    function showFileInDialog(fileName) {
        if (fileName == COMPOSITE_FILE) {
            RED.view.dialogs.setExportDialogText(lastCompositeText, fileName);
            return;
        }
        const file = lastFiles.find(function (f) { return f.name == fileName; });
        if (file != undefined) RED.view.dialogs.setExportDialogText(file.contents, file.name);
    }

    function shouldShowDialog(generateZip) {
        if (generateZip) return false;
        return (RED.arduino.settings.useExportDialog == true) || (RED.arduino.serverIsActive() == false);
    }

    /** @param {ExportFile[]} files @param {{token:String, type:String}[]} keywords */
    function getPostObject(files, keywords) {
        return {
            files: files.map(function (f) { return { name: f.name, contents: f.contents, overwrite_file: f.overwrite_file, isMain: f.isMain }; }),
            keywords,
            removeOtherFiles: true,
        };
    }

    /** @param {ExportFile[]} files */
    function saveAsZip(files) {
        const zip = new JSZip();
        const subFolder = RED.arduino.settings.ZipExportUseSubFolder ? (RED.arduino.settings.ProjectName + "/") : "";
        for (const file of files) {
            if (file.overwrite_file == false) continue; // only a placeholder for a file that already exists in the target project
            zip.file(subFolder + file.name, file.contents);
        }
        const compression = (RED.arduino.settings.ZipExportCompress == true) ? "DEFLATE" : "STORE";
        zip.generateAsync({ type: "blob", compression }).then(function (blob) {
            RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName + ".zip", function (fileName) { saveAs(blob, fileName); }); // saveAs is from FileSaver.js
        });
    }

    return {
        init,
        exportInSelectedMode,
        exportClassic,
        exportFlatClassic,
        exportFlatHelper,
        exportClassBased,
        get lastFiles() { return lastFiles; },
    };
})();
