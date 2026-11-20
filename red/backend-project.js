/**
 * The project in the backend (backend/server.js, the /api of specs/asdt-backend.md), the ASDT++ side:
 *   - choose or make a project in the backend's projects folder
 *   - the current design is saved to <project>/.asdt/design.json as you work (as the browser's local storage), so a
 *     cleared browser cache loses nothing and the project opens in any browser
 *   - "Export to the project": the export of the selected Export Mode goes to <project>/src/asdt/ (replaced on every
 *     export, the backend keeps a zip of what was there), with the AudioEffectFPB objects as native Faust objects
 *     (compiled by the backend: faust/Faust_<patch>.h/.cpp, see backend/faust-native.js)
 *
 * Without a backend nothing here does anything, and everything works as before.
 * Settings: RED.BackendProject (they are saved with the design).
 */
RED.BackendProject = (function () {
    'use strict';

    const defSettings = {
        Project: "",          // the project path in the projects folder, i.e. "synths/poly1"; empty: none
        SaveDesign: true,     // save the current design in the project as you work
        FaustNative: true,    // AudioEffectFPB objects as native Faust objects in the export to the project
    };
    const _settings = Object.assign({}, defSettings);
    const settings = {
        get Project() { return _settings.Project; },
        set Project(v) { _settings.Project = String(v || "").trim(); RED.storage.update(); },
        get SaveDesign() { return _settings.SaveDesign; },
        set SaveDesign(v) { _settings.SaveDesign = v; RED.storage.update(); },
        get FaustNative() { return _settings.FaustNative; },
        set FaustNative(v) { _settings.FaustNative = v; RED.storage.update(); },
    };
    const settingsCategory = { label: "Project (backend)", expanded: false, bgColor: "#DDD",
        popupText: "A project on disk through the ASDT++ backend (backend/server.js, npm start in backend/).<br>" +
                   "The export goes into its src/asdt/ folder, which ASDT++ owns: it is replaced on every export and changes made by hand are overwritten " +
                   "(the backend keeps the last versions as zips in .asdt/backup/)." };
    const settingsEditor = {
        Project: { label: "Project", type: "string", popupText: "the project in the backend's projects folder, i.e. synths/poly1 (use Choose to pick or make one)" },
        Choose: { label: "Choose or make a project...", type: "button", action: function () { RED.backendProject.chooseDialog(); } },
        SaveDesign: { label: "Save the design in the project", type: "boolean", popupText: "save the current design to the project's .asdt/design.json as you work<br>(as the browser's local storage, which it doesn't replace)" },
        FaustNative: { label: "Faust as native objects", type: "boolean", popupText: "in the export to the project, the AudioEffectFPB objects become real Teensy audio objects<br>(the backend compiles their Faust code to C++: faust/Faust_&lt;patch&gt;.h/.cpp)<br>not in the OSC export modes, there they stay runtime (FPB) objects" },
        Export: { label: "Export to the project", type: "button", action: function () { RED.backendProject.exportToProject(); } },
    };
    return { defSettings, settings, settingsCategory, settingsEditor };
})();

RED.backendProject = (function () {
    'use strict';

    const SAVE_DELAY_MS = 2000;     // the design is saved this long after the last change
    const EXPORT_EXTENSIONS = [".h", ".hpp", ".c", ".cpp", ".json", ".txt", ".md"];

    function base() {
        return (RED.fpb != undefined && RED.fpb.bridge != undefined && RED.fpb.bridge.httpBase) ? RED.fpb.bridge.httpBase() : "http://127.0.0.1:8088";
    }

    /** a request to the backend's /api; rejects with an Error with the backend's message */
    function api(method, path, body) {
        const init = { method, cache: "no-store" };
        if (body !== undefined) { init.headers = { "Content-Type": "application/json" }; init.body = JSON.stringify(body); }
        return fetch(base() + "/api" + path, init).then(function (r) {
            return r.text().then(function (text) {
                let json = null;
                try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
                if (!r.ok) throw new Error((json && json.error) || (r.status + " " + text));
                return json;
            });
        }, function () {
            throw new Error("the backend is not running (npm start in backend/, it serves " + base() + ")");
        });
    }

    const esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

    // ------------------------------------------------------------------ the design, saved as you work

    let saveTimer = undefined;
    let pendingDesign = undefined;
    let lastSaveFailed = false;

    /** called by RED.storage.update() with the design it saved to local storage */
    function designChanged(json) {
        if (RED.BackendProject.settings.Project == "" || RED.BackendProject.settings.SaveDesign != true) return;
        pendingDesign = json;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDesignNow, SAVE_DELAY_MS);
    }

    function saveDesignNow() {
        if (pendingDesign == undefined) return Promise.resolve();
        const design = pendingDesign;
        pendingDesign = undefined;
        const project = RED.BackendProject.settings.Project;
        return api("PUT", "/design", { path: project, design }).then(function () {
            if (lastSaveFailed) RED.notify("Saved the design in the project " + esc(project) + " again", "success", null, 2000);
            lastSaveFailed = false;
        }, function (e) {
            if (!lastSaveFailed) RED.notify("Could not save the design in the project " + esc(project) + ":<br>" + esc(e.message), "warning", null, 6000);
            lastSaveFailed = true;   // told once, not on every change
        });
    }

    // ------------------------------------------------------------------ export to the project

    /** the patch name of an AudioEffectFPB node (as red/fpb/fpb-bridge.js: Patch, else the name) */
    function patchName(node) { return (node.patch && node.patch.trim() != "") ? node.patch.trim() : node.name; }

    function cIdent(s) {
        let n = String(s).replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
        return n == "" ? "patch" : n;
    }

    /** the native class of an AudioEffectFPB node: Faust_<patch> */
    function classOf(node) { return "Faust_" + cIdent(patchName(node)); }

    /**
     * the Faust code of every AudioEffectFPB, one per class: its own code, or the kept sources of a Faust IDE export
     * @returns {{items: {className, code?, patch?}[], nodes: REDNode[], error?: String}}
     */
    function faustItems() {
        const byClass = new Map();
        const nodes = [];
        let error;
        RED.nodes.eachNode(function (node) {
            if (node.type != "AudioEffectFPB") return;
            nodes.push(node);
            const cls = classOf(node);
            const info = RED.fpb.bridge.info(node);
            const item = (info != undefined && info.origin == "faustide") ? { className: cls, patch: cIdent(patchName(node)) } : { className: cls, code: node.dsp || "" };
            const prev = byClass.get(cls);
            if (prev == undefined) byClass.set(cls, { item, node });
            else if (prev.item.code !== item.code || prev.item.patch !== item.patch)
                error = "the objects " + prev.node.name + " and " + node.name + " are both the Faust patch " + patchName(node) + " but their code differs (give one of them another Patch name)";
        });
        return { items: [...byClass.values()].map(function (v) { return v.item; }), nodes, error };
    }

    /**
     * the export files as the project wants them: no placeholders, GUI_TOOL.json -> design.json, the main file
     * (.ino / main.cpp) as a .h, plus asdt.h that includes the top file(s), which the user's main file includes
     * @param {ExportFile[]} files
     */
    function projectFiles(files) {
        const out = [];
        const tops = [];
        for (const f of files) {
            if (f.overwrite_file == false) continue;
            let name = f.name;
            if (name == "GUI_TOOL.json") name = "design.json";
            else if (f.isMain && !/\.h$/i.test(name)) name = name.replace(/\.[^.]*$/, "") + ".h";
            if (!EXPORT_EXTENSIONS.some(function (e) { return name.toLowerCase().endsWith(e); })) {
                RED.notify("not exported to the project: " + esc(f.name) + " (only " + EXPORT_EXTENSIONS.join(" ") + ")", "warning", null, 4000);
                continue;
            }
            if (f.isTop || f.isMain) tops.push(name);
            out.push({ name, contents: f.contents });
        }
        const includes = (tops.length != 0 ? tops : out.map(function (f) { return f.name; }).filter(function (n) { return /\.h$/i.test(n) && n.indexOf("/") < 0; }));
        out.push({ name: "asdt.h", contents: "// asdt.h: made by ASDT++ on every export, includes the exported design.\n" +
            "// Include it once from your main file: #include \"asdt/asdt.h\" (PlatformIO) or #include \"src/asdt/asdt.h\" (Arduino)\n" +
            "#pragma once\n" + includes.map(function (n) { return '#include "' + n + '"\n'; }).join("") });
        return out;
    }

    function exportToProject() {
        const project = RED.BackendProject.settings.Project;
        if (project == "") { chooseDialog(); return; }
        if (RED.exporter.main.isCppMode() == false) {
            RED.notify("Export to the project needs an Export Mode that writes C++ (not the OSC message modes)", "warning", null, 4000);
            return;
        }
        RED.storage.update();
        const osc = [RED.arduino.EXPORT_MODE.OSC_SIMPLE_CPP, RED.arduino.EXPORT_MODE.OSC_CLASS_CPP].includes(RED.arduino.settings.ExportMode);
        const faust = (RED.BackendProject.settings.FaustNative && !osc) ? faustItems() : { items: [], nodes: [] };
        if (faust.error) { RED.notify(esc(faust.error), "error", null, 6000); return; }
        RED.notify("Exporting to " + esc(project) + (faust.items.length ? " (compiling " + faust.items.length + " Faust patch" + (faust.items.length > 1 ? "es" : "") + ")" : "") + "...", "info", null, 2000);

        const compiled = faust.items.length ? api("POST", "/faust/native", { items: faust.items }) : Promise.resolve({ results: [] });
        compiled.then(function (r) {
            const byClass = new Map(r.results.map(function (x) { return [x.className, x]; }));
            for (const node of faust.nodes) {
                const x = byClass.get(classOf(node));
                if (x != undefined && (x.inputs != node.inputs || Math.max(1, x.outputs) != node.outputs))
                    RED.notify(esc(node.name) + ": the Faust code has " + x.inputs + " inputs / " + x.outputs + " outputs, the object " + node.inputs + " / " + node.outputs +
                        " (compile it in the live tab to update the object)", "warning", null, 6000);
            }
            const files = RED.exporter.main.exportForProject(function (node) { return byClass.has(classOf(node)) ? classOf(node) : undefined; });
            if (files == undefined || files.length == 0) return undefined;   // the error report is shown
            const all = projectFiles(files);
            const seen = new Set(all.map(function (f) { return f.name; }));
            for (const x of r.results) for (const f of x.files) if (!seen.has(f.name)) { seen.add(f.name); all.push(f); }
            return api("POST", "/export", { path: project, files: all });
        }).then(function (res) {
            if (res == undefined) return;
            if (res.result == "unchanged") RED.notify("Export to " + esc(project) + ": nothing changed", "info", null, 2500);
            else RED.notify("Exported to " + esc(project) + "/src/asdt/: " + res.written.length + " written, " + res.removed.length + " removed" +
                (res.backup ? "<br>the previous version is in .asdt/backup/" + esc(res.backup) : "") +
                "<br>your main file: #include \"asdt/asdt.h\"", "success", null, 5000);
        }).catch(function (e) {
            RED.notify("Export to " + esc(project) + " failed:<br>" + esc(e.message).replace(/\n/g, "<br>"), "error", null, 8000);
        });
    }

    // ------------------------------------------------------------------ choose / make / open a project

    function useProject(path) {
        RED.BackendProject.settings.Project = path;   // (saves, and so saves the design in it)
        RED.notify("Project: " + esc(path), "success", null, 2000);
    }

    function openProject(path) {
        api("GET", "/project?path=" + encodeURIComponent(path)).then(function (p) {
            if (!p.design) { RED.notify(esc(path) + " has no saved design", "warning", null, 3000); return; }
            if (!confirm("Open the design of " + path + "?\nThe design in this browser is replaced (save or export it first if you need it).")) return;
            RED.storage.loadContents(p.design);   // the design has its own settings, Project included
        }).catch(function (e) { RED.notify(esc(e.message), "error", null, 5000); });
    }

    function chooseDialog() {
        const dlg = $('<div title="Project (backend)"></div>');
        const render = function () {
            dlg.html("<p>Loading...</p>");
            Promise.all([api("GET", "/info"), api("GET", "/projects")]).then(function (r) {
                const info = r[0], list = r[1];
                const current = RED.BackendProject.settings.Project;
                let html = '<p style="font-size:12px">Projects in the backend\'s projects folder' + (info.sandbox ? " (backend_sandbox/projects)" : "") +
                    ", searched " + info.projectSearchDepth + " levels deep. The export goes into <code>src/asdt/</code> of the project, which ASDT++ owns: " +
                    "it is replaced on every export, changes made by hand there are overwritten (the last " + info.backups + " versions are kept in <code>.asdt/backup/</code>).</p>";
                html += '<table class="table table-condensed" style="font-size:13px"><tr><th>project</th><th>kind</th><th>design</th><th></th></tr>';
                if (list.length == 0) html += '<tr><td colspan="4"><i>no projects yet</i></td></tr>';
                for (const p of list) {
                    html += "<tr" + (p.path == current ? ' style="font-weight:bold"' : "") + "><td>" + esc(p.path) + "</td><td>" + esc(p.kind) + "</td><td>" + (p.hasDesign ? "yes" : "") + "</td><td>" +
                        // a project with a design can only be opened (its design replaces the one here), never just chosen:
                        // choosing it would let the next change save over its design, which has no backup.
                        // A project without one has nothing to lose, so the design here can start being saved in it.
                        (p.hasDesign ? '<button class="btn btn-xs btn-default asdt-open" data-path="' + esc(p.path) + '">Open its design</button>'
                                     : '<button class="btn btn-xs btn-primary asdt-use" data-path="' + esc(p.path) + '">Save this design in it</button>') + "</td></tr>";
                }
                html += "</table>";
                html += '<p><b>New project</b>: <input class="asdt-new-path" type="text" placeholder="folder/name" style="width:200px"> ' +
                    '<select class="asdt-new-template"><option value="platformio">PlatformIO (Teensy 4.1)</option><option value="arduino">Arduino (.ino)</option><option value="none">no build files</option></select> ' +
                    '<button class="btn btn-xs btn-success asdt-new">Make and use</button></p>';
                dlg.html(html);
                dlg.find(".asdt-use").click(function () { useProject($(this).data("path")); dlg.dialog("close"); });
                dlg.find(".asdt-open").click(function () { const p = $(this).data("path"); dlg.dialog("close"); openProject(p); });
                dlg.find(".asdt-new").click(function () {
                    const path = dlg.find(".asdt-new-path").val().trim().replace(/\\/g, "/");
                    api("POST", "/projects", { path, template: dlg.find(".asdt-new-template").val() }).then(function (p) {
                        useProject(p.path);
                        dlg.dialog("close");
                    }).catch(function (e) { RED.notify(esc(e.message), "error", null, 5000); });
                });
            }).catch(function (e) {
                dlg.html("<p>" + esc(e.message) + "</p>");
            });
        };
        dlg.dialog({ modal: true, width: 620, close: function () { dlg.dialog("destroy").remove(); },
            buttons: [{ text: "Refresh", click: render }, { text: "Close", click: function () { dlg.dialog("close"); } }] });
        render();
    }

    $('#btn-exporter-project').click(function () { RED.arduino.export.showIOcheckWarning(exportToProject); });
    $('#btn-exporter-choose-project').click(function () { chooseDialog(); });

    return { designChanged, saveDesignNow, exportToProject, chooseDialog, openProject, classOf, projectFiles, api };
})();
