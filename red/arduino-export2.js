
/** this file is only for developing the new export system
 * and it's structure may change drastically
 */

RED.arduino.export2 = (function () {
    'use strict';
    var nns = {}; // workaround for now, used by appendAudioConnection_s
    var tabNodes = []; // workaround for now, used by appendAudioConnection_s
    
    function init() // called from main.js @ init()
    {
        RED.main.SetPopOver("#menu-export2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-simple2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-class2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-class-dev2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-class-zip2", "(under development)", "right");
    }
    $('#btn-export-simple2').click(function () { Export(CPP_EXPORT_MODE.SIMPLE_FLAT); });
    $('#btn-export-class2').click(function () { Export(CPP_EXPORT_MODE.CLASS_COMPLETE); });
    $('#btn-export-class-dev2').click(function () { Export(CPP_EXPORT_MODE.CLASS_SINGLE); });
    $('#btn-export-class-zip2').click(function () { Export(CPP_EXPORT_MODE.CLASS_COMPLETE_ZIP); });
    
    
    /**
     * This is the main entry point for all exports
     * @param {CPP_EXPORT_MODE} export_mode 
     */
    function Export(export_mode) {
        const t0 = performance.now();

        if (export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE_ZIP) var generateZip = true;
        else var generateZip = false;
        
        RED.storage.update(); // sort is made inside update

        
        nns = RED.nodes.createCompleteNodeSet({newVer:false}); // workaround for now, used by appendAudioConnection_s
        tabNodes = RED.arduino.export.getClassIOportsSorted(undefined, nns); // workaround for now, used by appendAudioConnection_s

        var coex = new CompleteExport(generateZip, export_mode);

        if (export_mode == CPP_EXPORT_MODE.SIMPLE_FLAT) {
            coex.ac.staticType = true; // allways true for SIMPLE FLAT
            export_workspace(coex, RED.nodes.currentWorkspace); 
        }
        else if (export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE || export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE_ZIP) {
            coex.allFiles.push(new ExportFile("GUI_TOOL.json", JSON.stringify(JSON.parse(coex.jsonString), null, 4))); // JSON beautifier
            //coex.allFiles.push(new ExportFile("preferences.txt", RED.arduino.board.export_arduinoIDE())); // skip for now as it don't properly work for the moment
            //coex.allFiles.push(new ExportFile("platformio.ini", RED.arduino.board.export_platformIO())); // skip for now as it don't properly work for the moment
            export_classBased(coex);
        }
        else if (export_mode == CPP_EXPORT_MODE.CLASS_SINGLE) {
            coex.ac.staticType = false; // allways false for CLASS SINGLE development export
            export_workspace(coex, RED.nodes.currentWorkspace);
        }
        else { // failsafe
            RED.notify("Error export mode not selected", "warning", null, 3000);
            return;
        }

        if (coex.mixervariants != undefined && coex.mixervariants.length > 0) {
            coex.globalCppFiles.push(...Mixers.GetFiles(coex.mixervariants));
        }
        console.error("@export as class RED.arduino.serverIsActive=" + RED.arduino.serverIsActive());

        // only show dialog when server is not active and not generating zip
        // or when export modes: SIMPLE_FLAT or CLASS_SINGLE
        var useExportDialog = ((RED.arduino.settings.useExportDialog == true) ||
                               (generateZip == false) || 
                               (export_mode == CPP_EXPORT_MODE.CLASS_SINGLE) || 
                               (export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE) ||
                               (export_mode == CPP_EXPORT_MODE.SIMPLE_FLAT));
        
        if (useExportDialog == true) 
            ShowExportDialog(coex);

        const t1 = performance.now();
        console.log('arduino-export-save2 took: ' + (t1 - t0) + ' milliseconds.');

        if (generateZip == false && export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE)
            SendToHttpBridge(coex); // allways try to POST but not when exporting to zip
        else if (generateZip == true)
            GenerateZip(coex);
    }

    /**
     * 
     * @param {CompleteExport} coex 
     */
     function export_classBased(coex)
     {
         for (var wsi = 0; wsi < RED.nodes.workspaces.length; wsi++)
         {
             var ws = RED.nodes.workspaces[wsi];
             if (ws.export == false)
                 continue; // this skip export
             if (RED.nodes.getNodeInstancesOfType(ws.label).length == 0 && ws.isMain == false && ws.isAudioMain == false)
                 continue; // don't export classes/tabs not in use
             coex.ac.staticType = ws.isMain || (ws.label.toLowerCase() == "main.cpp");
             export_workspace(coex, ws);
         }
     }

    /**
     * 
     * @param {CompleteExport} coex
     * @param {REDWorkspace} ws
     */
    function export_workspace(coex, ws) {
        var wse = new WsExport(ws);
        coex.keywords.push({token:ws.label, type:"KEYWORD2"});

        // add nodes (Audio objects, special nodes, class nodes)
        for (var i = 0; i < ws.nodes.length; i++) {
            var n = ws.nodes[i];

            if (checkAndAddNonAudioObject(n, wse, coex.globalCppFiles)) {
                //continue;
            }
            else if (n.type == "AudioMixer" && coex.mixervariants != undefined && RED.arduino.settings.ExportMode < 3) {
                var inputCount = RED.export.links.getDynInputDynSize(n);
                if (inputCount != 4) { // 4 input variant is allready in the audio lib

                    if (!coex.mixervariants.includes(inputCount)) {
                        coex.mixervariants.push(inputCount);
                    } 

                    var includeName = '#include "mixers.h"';
                    if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
                }
            }
            else if (n.type == "AudioMixerStereo" && coex.mixerStereoVariants != undefined && RED.arduino.settings.ExportMode < 3) {
                // for future implementation
            }
            else if (n._def.nonObject != undefined) {
                console.warn("!!!!WARNING!!!! (unhandled nonObject)\n" + n.type); // in case we forgot something
                //continue; // skip
            }
            // Audio Control/class node without any IO
            // TODO. to make objects that don't have any io have a special def identifier
            // both to make this code clearer and to sort non Audio Control objects in a different list
            else if (/*(n.outputs <= 0) && (n.inputs <= 0) && */(n._def.inputs <= 0) && (n._def.outputs <= 0)) { 
                var name = getName(n);
                var typeName = getTypeName(n);
                var comment = (n.comment!=undefined && n.comment.trim().length != 0)?n.comment:"";
                wse.audioControlObjects.push(new ExportObject(typeName, name, comment));
            }
            else // Audio Processing Node and Class node that have IO
            { 
                console.log(n);
                var name = getName(n);
                var typeName = getTypeName(n);
                var comment = (n.comment!=undefined && n.comment.trim().length != 0)?n.comment:"";
                wse.audioObjects.push(new ExportObject(typeName, name, comment));
            }

            if (n._def.classWs != undefined) // (h4yn0nnym0u5e) keep track of class dependencies so we can export in valid order
				wse.depends.push(n.type);
        }

        //coex.ac.workspaceId = ws.id;
        //coex.ac.count = 1;
        //coex.ac.totalCount = 0;

        // add audio object wires/connections
        // TODO rewrite this to use internal structrure directly
        for (var i = 0;i<ws.links.length; i++) {
            var src = ws.links[i].source;
            var dst = ws.links[i].target;
            var srcPortIndex = ws.links[i].sourcePort;
            var dstPortIndex = ws.links[i].targetPort;
            
            if (src.type == "TabInput" || dst.type == "TabOutput") continue; // ignore these 'virtual' wires they are created outside the class
            if (src.type.startsWith("Junction")) continue; // wires coming out from junctions are ignored

            if (dst.type.startsWith("Junction"))
            {
                var dstNodes = { nodes: [] };
                getJunctionFinalDestinations(dst, dstNodes);
                for (var dni = 0; dni < dstNodes.nodes.length; dni++) {
                    if (src === dstNodes.nodes[dni].node) continue; // failsafe, can't make connections back to itself
                    appendAudioConnection_s(wse, coex.ac, src, dstNodes.nodes[dni].node, srcPortIndex, dstNodes.nodes[dni].dstPortIndex);
                }
            }
            else {
                appendAudioConnection_s(wse, coex.ac, src, dst, srcPortIndex, dstPortIndex);
            }
        }
        //wse.acArrayLength = coex.ac.arrayLength; // workaround for now TODO remove usage
        //wse.totalAudioConnectionCount = coex.ac.totalCount;
        coex.wsCppFiles.push(wse.generateWsFile(coex.exportMode));
    }
    /**
     * 
     * @param {REDNode} n 
     * @param {WsExport} wse 
     * @param {CompleteExport} completeExport 
     * @returns 
     */
    function checkAndAddNonAudioObject(n,wse,completeExport) {
        if (n.type == "ClassComment") {
            wse.classComments.push(" * " + n.name);
        }
        else if (n.type == "Function") {
            wse.functions.push(n.comment); // we use comment field for function-data
        }
        else if (n.type == "Variables") {
            wse.variables.push(n.comment); // we use comment field for vars-data
        }
        else if (n.type == "PointerArray") {// this is special thingy that was before real-node, now it's obsolete, it only generates more code
            wse.arrayNodes.push({ type: n.objectType, name: n.name, cppCode: n.arrayItems, objectCount: n.arrayItems.split(",").length });
        }
        else if (n._def.classWs != undefined) {
            var includeName = '#include "' + n.type + '.h"';
            if (!wse.workspaceIncludes.includes(includeName)) wse.workspaceIncludes.push(includeName);
            return false;
        }
        else if (n.type == "IncludeDef") {
            var includeName = '#include ' + n.name;
            if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
        }
        else if (n.type == "ConstValue") {
            wse.variables.push("const static " + n.valueType + " " + n.name + " = " + n.value + ";");
        }
        else if (n.type == "ConstructorCode") {
            wse.constructorCode.push(n.comment);
        }
        else if (n.type == "DestructorCode") {
            wse.destructorCode.push(n.comment);
        }
        else if (n.type == "EndOfFileCode") {
            wse.eofCode.push(n.comment);
        }
        else if (n.type == "CodeFile") // very special case
        {
            if (n.comment.length != 0) {
                var wsFile = new ExportFile(n.name, n.comment);
                wsFile.header = "\n// ****** Start Of Included File:" + n.name + " ****** \n";
                wsFile.footer = "\n// ****** End Of Included file:" + n.name + " ******\n";
                completeExport.globalCppFiles.push(wsFile);
            }

            var includeName = '#include "' + n.name + '"';
            if (includeName.toLowerCase().endsWith(".c") || includeName.toLowerCase().endsWith(".cpp")) return true; // return true because type taken care of

            if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
        }
        else if (n.type == "DontRemoveCodeFiles") {
            var files = n.comment.split("\n");
            for (var fi = 0; fi < files.length; fi++) {
                var wsFile = new ExportFile(files[fi].trim(), "");
                wsFile.overwrite_file = false;
                completeExport.allFiles.push(wsFile); // push special files to the beginning 
            }
        }
        else if (n.type.startsWith("Junction")) {
            // don't do anything with junctions as they are only virtual objects
        }
        else if (n.type == "TabInput" || n.type == "TabOutput") {
            // don't do anything with Tab IO as they are only virtual objects
        }
        else if (n.type == "BusJoin" || n.type == "BusSplit") {
            // don't do anything with BusJoin/BusSplit as they are only virtual objects
        }
        else if (n.type == "Comment") {
            // don't do anything with comments for now, they are mostly visual objects to comment things
        }
        else if (n.type == "group") {
            // don't do anything with groups, they are only virtual objects
        }
        else
            return false;
        return true;
    }

    /**
     * // TODO create class for NewAudioConnection
     * @param {WsExport} wse 
     * @param {AudioConnectionExport} ac 
     * @param {REDNode} src 
     * @param {REDNode} dst 
     * @param {*} pi 
     * @param {*} dstPortIndex 
     */
    function appendAudioConnection_s(wse, ac, src, dst, pi, dstPortIndex) {
        
        ac.cppCode = "";
        ac.srcName = RED.arduino.export.make_name(src);
        ac.dstName = RED.arduino.export.make_name(dst);
        ac.srcPort = pi;
        ac.dstPort = dstPortIndex; // default

        ac.checkIfSrcIsArray(); // we ignore the return value, there is no really use for it
        if (src._def.classWs != undefined) { // if source is class
            //console.log("root src is class:" + ac.srcName);
            RED.arduino.export.classOutputPortToCpp(nns, tabNodes.outputs, ac, n);
        }

        ac.checkIfDstIsArray(); // we ignore the return value, there is no really use for it
        if (dst._def.classWs != undefined) {
            //console.log("dst is class:" + dst.name + " from:" + n.name);
            RED.arduino.export.classInputPortToCpp(tabNodes.inputs, ac.dstName, ac, dst);
        }
        else
        {
            if (dst._def.dynInputs != undefined) {
                //console.error(dstPortIndex);
                ac.dstPort = RED.export.links.getDynInputDynSizePortStartIndex(dst, src, pi);
                //console.error(ac.dstPort);
            }
            ac.appendToCppCode(); // this don't return anything, the result is in ac.cppCode
        }
        if (ac.ifAnyIsArray())
            wse.arrayAudioConnections.push(...ac.cppCode.split('\n')); // TODO fix so that different size arrays are allowed
        else
            wse.nonArrayAudioConnections.push(...ac.cppCode.split('\n'));  // TODO fix so that cppCode can be returned as array, have split as workaround for now
    }

    /**
     * This is only for the moment to get special type AudioMixer<n>, AudioMixerNNN or AudioStreamObject
     * @param {Node} node node(internal)
     */
     function getTypeName(node)
     {
        if (node.type == "AudioStreamObject") // special case
            var cpp = node.subType?node.subType:"// warning AudioStreamObject subType not set";
        else
            var cpp = node.type;

        if (node._def.dynInputs != undefined && RED.arduino.settings.ExportMode < 3)
        {
            var dynInputSize = RED.export.links.getDynInputDynSize(node).toString();

            if (RED.arduino.settings.UseAudioMixerTemplate == true)
                dynInputSize = '<' + dynInputSize + '>'; // include the template def.

            cpp += dynInputSize;
        }

        if (RED.arduino.settings.ExportMode == 3)
            cpp = cpp.replace("Audio", "OSCAudio");

        //cpp += " "; // add at least one space
        //for (var j = cpp.length; j < 32; j++) cpp += " ";
        return cpp;
    }

    function getName(node) {
        if (RED.arduino.settings.ExportMode == 3) { // mode 3 == OSC
            if (node.isArray != undefined)
                var name = node.isArray.name;

            if (node._def.dynInputs != undefined)
                name += '{"' +name+ '", ' + RED.export.links.getDynInputDynSize(node) + "}";
            else
                name += '{"' +name+ '"}';
            return name;
        }
        else
        {
            if (node.isArray != undefined)
                return node.isArray.name;
            return node.name;
        }
    }

    function getAudioConnectionTypeName() {
        if (RED.arduino.settings.ExportMode < 3)
            return "AudioConnection";
        else
            return "OSCAudioConnection";
    }

    /** @param {CompleteExport} ce */
    function GenerateZip(ce)
    {
        ce.finalize(); // makes this export ready for Zip export
        const t1 = performance.now();
        var zip = new JSZip();
        let useSubfolder = RED.arduino.settings.ZipExportUseSubFolder;
        let subFolder = /*(mainFileName != "") ? mainFileName : */RED.arduino.settings.ProjectName;
        for (var i = 0; i < ce.allFiles.length; i++) {
            var file = ce.allFiles[i];

            if (file.overwrite_file == false) continue; // don't include in zip as it's only a placeholder for existing files
            
            if (useSubfolder == false)
                zip.file(file.name, file.contents);
            else
                zip.file(subFolder + "\\" + file.name, file.contents);
        }
        var compression = (RED.arduino.settings.ZipExportCompress==true)?"DEFLATE":"STORE";
        zip.generateAsync({ type: "blob", compression}).then(function (blob) {
            const t2 = performance.now();
            console.log('arduino-export-toZip took: ' + (t2 - t1) + ' milliseconds.');
            RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName + ".zip", function (fileName) { saveAs(blob, fileName); }); // saveAs is from FileSaver.js
        });
    }

    /** @param {CompleteExport} ce */
    function SendToHttpBridge(ce)
    {
        ce.finalize(); // makes this export ready for Http Post export
        RED.arduino.httpPostAsync(ce.getPostJSON());
    }

    /** @param {CompleteExport} ce */
    function ShowExportDialog(ce)
    {
        var cpp = convertCompleteExportToString(ce);
        RED.view.dialogs.showExportDialog("Class Export to Arduino", cpp, " Source Code:");
    }

    /** @param {CompleteExport} ce */
    function convertCompleteExportToString(ce) {
        // time to generate the final result
        var cpp = "";
        cpp = getCppHeader(ce.jsonString, undefined, false); // false mean zip mode, which in this case appends the design JSON to the export 
        // first add global files
        for (var i = 0; i < ce.globalCppFiles.length; i++)
        {
            if (ce.globalCppFiles[i].name == "mixers.cpp")
            { // special case
                cpp += ce.globalCppFiles[i].body.replace('#include "mixers.h"', '') + "\n"; // don't use that here as it generates compiler error
            }
            else if (ce.globalCppFiles[i].name == "mixers.h") 
            { // special case
                cpp += ce.globalCppFiles[i].header + "\n" + ce.globalCppFiles[i].body + "\n"; // to include the copyright note
            }
            else
            {
                cpp += ce.globalCppFiles[i].body;
            }
        }
        // second add cpp files in dependency order
        // credits to h4yn0nnym0u5e for the dependency order sorting
        var exportComplete = false;
        var exported = [];
        while (!exportComplete)
        {
            exportComplete = true;
            
            for (var i = 0; i < ce.wsCppFiles.length; i++) {

                /*if (!ce.wsCppFiles[i].isExported) {
                    // check that anything we depend on has already been output
                    var skip = false;
                    //console.log(ce.wsCppFiles[i]);
                    for (var depend in ce.wsCppFiles[i].depends) {
                        if (!exported.includes(depend))
                        {
                            exportComplete = false;
                            skip = true;
                            break;
                        }
                    }
                    if (skip)
                        continue;
*/
                    cpp += ce.wsCppFiles[i].body;
                   // ce.wsCppFiles[i].isExported = true;
                //}
                
               // if (ce.wsCppFiles[i].className)
                //    exported.push(ce.wsCppFiles[i].className);
            }
        }
        cpp += getCppFooter();
        
        return cpp.split('\n\n').join('\n').split('\t').join("    "); // removes some double newlines for now
    }

    function getCppHeader(jsonString, includes, generateZip) {
        if (includes == undefined)
            includes = "";
        var returnStr = RED.arduino.settings.StandardIncludeHeader
            + includes + "\n"
            + "// " + RED.arduino.settings.ProjectName + ": begin automatically generated code\n";
        // don't include JSON in files when exporting as zip, 
        // the zip contains the json as separate file.
        // this makes the zip generating much faster
        if (RED.arduino.settings.WriteJSONtoExportedFile == true && generateZip == false)
            returnStr += "// the following JSON string contains the whole project, \n// it's included in all generated files.\n"
                + "// JSON string:" + jsonString + "\n\n";
        return returnStr;
    }
    function getCppFooter() {
        return "// " + RED.arduino.settings.ProjectName + ": end automatically generated code\n";
    }
    function getJunctionFinalDestinations(junctionNode, dstNodes) {
        RED.nodes.nodeEachLink(junctionNode, function (srcPortIndex, dst, dstPortIndex)
        {
            if (dst.type.startsWith("Junction"))
                getJunctionFinalDestinations(dst, dstNodes);
            else
                dstNodes.nodes.push({ node: dst, dstPortIndex: dstPortIndex });
        });
    }

    return {
        init,
        Export,
        getCppFooter,
        getCppHeader,
        getAudioConnectionTypeName
    };
})();

if (TEXT == undefined)
    var TEXT = {};
/**
* this take a multiline text, 
* break it up into linearray, 
* then if increment is a string then that is added before every line, if increment is a number then it specifies the number of spaces added before every line
* @param {*} text 
* @param {*} increment if this is a string then that is added before every line, if it's a number then it specifies the number of spaces added before every line
*/
TEXT.incrementLines = function(text, increment) {
    var lines = text.split("\n");
    var newText = "";
    if (typeof increment == "number")
        increment = TEXT.getNrOfSpaces(increment);
    for (var i = 0; i < lines.length; i++) {
        newText += increment + lines[i] + "\n";
    }
    return newText;
};

TEXT.getNrOfSpaces = function(count) {
    var str = "";
    for (var i = 0; i < count; i++)
        str += " ";
    return str;
}