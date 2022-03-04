
class WsExport
{
    
    fileName = "";
    name = ""; // the actual name of the workspace/class
    comments = []; //  user specified class comment node(s) contents
    constructorCode = []; // user specified constructor node(s) contents
    destructorCode = []; // user specified destructor node(s) contents
    eofCode = []; // user specified eof node(s) contents
    functions = []; // user function node(s) contents
    variables = []; // user variable node(s) contents
    workspaceIncludes = []; // the design workspace includes, i.e. the dependencies  
    userIncludes = []; // user specified includes
    arrayNodes = {}; // this would contain all code that will be put into different for loops in the constructor

    audioObjects = []; // contain all AudioStream Objects
    audioControlObjects = []; // contain all Audio Control Objects
    audioConnections = []; // contain all AudioConnection code that don't belong to the array code

    isMain = false;

    constructor(ws)
    {
        this.name = ws.label;
        if (ws.isMain == true)
        {
            this.isMain = true;

            var fileName = "";
            if (ws.mainNameType == "main")
                fileName = "main";
            else if (ws.mainNameType == "projectName")
                fileName = RED.arduino.settings.ProjectName;
            else // this includes if (ws.mainNameType == "tabName")
                fileName = ws.label;
            this.fileName = fileName + ws.mainNameExt;
        }
        else if (ws.label == "main.cpp") {
            this.isMain = true;
            this.fileName = ws.label;
        }
        else {
            this.fileName = ws.label + ".h";
        }
    }
    
    /**
     * used to generate a 'wsfile' object
     * from all collected data
     */
    generateWsFile()
    {
        var n = new REDNode();
        

        var newWsCpp = getNewWsCppFile(this.fileName, "");
        if (classComment.length > 0) {
            newWsCpp.contents += "\n/**\n" + classComment + " */"; // newline not needed because it allready in beginning of class definer (check down)
        }
        if (isMain == false) {
            newWsCpp.contents += "\nclass " + this.name + " " + ws.extraClassDeclarations +"\n{\npublic:\n";
        }
        if (this.variables.trim().length > 0) {
            if (newWsCpp.isMain == false)
                newWsCpp.contents += incrementTextLines(this.variables, RED.arduino.settings.CodeIndentations);
            else
                newWsCpp.contents += this.variables;
        }
    }
}



RED.arduino.export2 = (function () {
    'use strict';

    /**
     * 
     * @param {REDNode} n 
     * @param {WSExport} wse 
     * @param {Array} globalCppFiles 
     * @returns 
     */
    function checkAndAddNonAudioObject(n,wse,globalCppFiles) {
        if (n.type == "ClassComment") {
            wse.comments.push(" * " + n.name);
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
        else if (n._def.isClass != undefined) {//RED.nodes.isClass(n.type)) {
            var includeName = '#include "' + n.type + '.h"';
            if (!wse.workspaceIncludes.includes(includeName)) wse.workspaceIncludes.push(includeName);
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
                var wsFile = getNewWsCppFile(n.name, n.comment);
                wsFile.header = "\n// ****** Start Of Included File:" + n.name + " ****** \n";
                wsFile.footer = "\n// ****** End Of Included file:" + n.name + " ******\n";
                globalCppFiles.push(wsFile);
            }

            var includeName = '#include "' + n.name + '"';
            if (includeName.toLowerCase().endsWith(".c") || includeName.toLowerCase().endsWith(".cpp")) return true; // return true because type taken care of

            if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
        }
        else if (n.type == "DontRemoveCodeFiles") {
            var files = n.comment.split("\n");
            for (var fi = 0; fi < files.length; fi++) {
                var wsFile = getNewWsCppFile(files[fi], "");
                wsFile.overwrite_file = false;
                globalCppFiles.push(wsFile);
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
        else
            return false;
        return true;
    }

    /**
     * // TODO create class for NewAudioConnection
     * @param {WsExport} wse 
     * @param {RED.arduino.export.getNewAudioConnectionType} ac 
     * @param {*} src 
     * @param {*} dst 
     * @param {*} pi 
     * @param {*} dstPortIndex 
     */
    function appendAudioConnection_s(wse, ac, src, dst, pi, dstPortIndex) {
        
        ac.cppCode = "";
        ac.srcName = RED.nodes.make_name(src);
        ac.dstName = RED.nodes.make_name(dst);
        ac.srcPort = pi;
        ac.dstPort = dstPortIndex; // default

        ac.checkIfSrcIsArray(); // we ignore the return value, there is no really use for it
        if (src._def.isClass != undefined) { //RED.nodes.isClass(n.type)) { // if source is class
            //console.log("root src is class:" + ac.srcName);
            RED.nodes.classOutputPortToCpp(nns, tabNodes.outputs, ac, n);
        }

        ac.checkIfDstIsArray(); // we ignore the return value, there is no really use for it
        if (dst._def.isClass != undefined) { //RED.nodes.isClass(dst.type)) {
            //console.log("dst is class:" + dst.name + " from:" + n.name);
            RED.nodes.classInputPortToCpp(tabNodes.inputs, ac.dstName, ac, dst);
        } else {
            if (dst._def.dynInputs != undefined){
                //console.error(dstPortIndex);
                ac.dstPort = RED.export.links.getDynInputDynSizePortStartIndex(dst, src, pi);
                //console.error(ac.dstPort);
            }
            ac.appendToCppCode(); // this don't return anything, the result is in ac.cppCode
        }
        if (ac.ifAnyIsArray())
            wse.arrayNodes[ac.arrayLength].push(...ac.cppCode.split('\n'));
        else
            wse.audioConnections.push(...ac.cppCode.split('\n'));  // TODO fix so that cppCode can be returned as array, have split as workaround for now
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

    function export_classBased(generateZip) {
        var minorIncrement = RED.arduino.settings.CodeIndentations;
        var majorIncrement = minorIncrement * 2;
        
        if (generateZip == undefined) generateZip = false;

        var useExportDialog = (RED.arduino.settings.useExportDialog || !RED.arduino.serverIsActive() && (generateZip == undefined))

        RED.storage.update(); // sort is made inside update
        var jsonString = RED.storage.getData(); //RED.nodes.createCompleteNodeSet({newVer:false});
        
        var tabNodes = RED.nodes.getClassIOportsSorted(undefined,nns);

        // to make splitting the classes to different files
        // wsCpp and newWsCpp is used
        var globalCppFiles = []; // contain files that need to be before all wsCppFiles
        var wsCppFiles = [];
        var exportFiles = []; // contain all export files
        var newWsCpp; // would not be needed as the WsExport.generateWsFile would generate all file contents in one go
        //var mainFileName = ""; // only used by zip function to determine the folder name
        //var codeFileIncludes = []; // don't know what this did, it's now obsolete?

        exportFiles.push(getNewWsCppFile("GUI_TOOL.json", JSON.stringify(JSON.parse(jsonString), null, 4))); // JSON beautifier
        exportFiles.push(getNewWsCppFile("preferences.txt", RED.arduino.board.export_arduinoIDE()));
        exportFiles.push(getNewWsCppFile("platformio.ini", RED.arduino.board.export_platformIO()));

        var mixervariants = undefined;
        var mixerStereoVariants = undefined;
        
        if (RED.arduino.settings.UseAudioMixerTemplate != true) {
            mixervariants = [];
            mixerStereoVariants = [];
        }
        // only create one object that is reused
        //var ac = getNewAudioConnectionType("", minorIncrement, majorIncrement, false);
        var ac = new ACExport();
        ac.minorIncrement = minorIncrement;
        ac.majorIncrement = majorIncrement;
        //ac.staticType = false;
        
        var keywords = [];
        for (var wsi = 0; wsi < RED.nodes.workspaces.length; wsi++) // workspaces
        {
            var ws = RED.nodes.workspaces[wsi];
            if (!ws.export) continue; // this skip export
            if (RED.nodes.getNodeInstancesOfType(ws.label).length == 0 && ws.isMain == false && ws.isAudioMain == false) continue; // don't export classes/tabs not in use
            
            var wse = new WsExport(ws);

            ac.workspaceId = ws.id;
            ac.count = 1;
            ac.totalCount = 0;
            ac.staticType = wse.isMain; 

            for (var i = 0; i < ws.nodes.length; i++) {
                var n = ws.nodes[i];

                //if (n.z != ws.id) continue; // workspace filter
                if (checkAndAddNonAudioObject(n, wse, globalCppFiles)) {
                    continue;
                }
                else if (n.type == "AudioMixer" && mixervariants != undefined && RED.arduino.settings.ExportMode < 3) {
                    var inputCount = RED.export.links.getDynInputDynSize(n);
                    if (inputCount != 4) { // 4 input variant is allready in the audio lib
    
                        if (!mixervariants.includes(inputCount)) {
                            mixervariants.push(inputCount);
                        } 

                        var includeName = '#include "mixers.h"';
                        if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
                    }
                }
                else if (n.type == "AudioMixerStereo" && mixerStereoVariants != undefined && RED.arduino.settings.ExportMode < 3) {
                    // for future implementation
                }
                else if (n._def.nonObject != undefined) {
                    console.warn("!!!!WARNING!!!! (unhandled nonObject)\n" + n.type); // in case we forgot something
                    continue; // skip
                }

                if ((n.outputs <= 0) && (n.inputs <= 0) && (n._def.inputs <= 0) && (n._def.outputs <= 0)) { // Audio Control/class nodes without any IO
                    var name = getName(n);
                    var typeName = getTypeName(n);
                    var comment = (n.comment!=undefined && n.comment.trim().length != 0)?n.comment:"";
                    wse.audioControlObjects.push({name, typeName, comment});
                    continue; // as they don't have any wires connected just skip to next node
                }
                else { // Audio Processing Nodes and Class nodes that have IO
                    var name = getName(n);
                    var typeName = getTypeName(n);
                    var comment = (n.comment!=undefined && n.comment.trim().length != 0)?n.comment:"";
                    wse.audioObjects.push({name, typeName, comment});
                }
                // add audio object wires/connections
                var src = n;//RED.nodes.node(n.id, n.z);

                RED.nodes.eachWire(n, function (pi, dstId, dstPortIndex) {

                    var dst = RED.nodes.node(dstId);

                    if (src.type == "TabInput" || dst.type == "TabOutput") return; // now with JSON string at top, place-holders not needed anymore

                    if (dst.type.startsWith("Junction"))// && )
                    {
                        var dstNodes = { nodes: [] };
                        getJunctionFinalDestinations(dst, dstNodes);
                        for (var dni = 0; dni < dstNodes.nodes.length; dni++) {
                            if (src === dstNodes.nodes[dni].node) continue; // can't make connections back to itself
                            appendAudioConnection_s(wse, ac, src, dstNodes.nodes[dni].node, pi, dstNodes.nodes[dni].dstPortIndex);
                        }
                    }
                    else {
                        appendAudioConnection_s(wse, ac,src,dst, pi, dstPortIndex);
                    }
                });
            }

                // TODO move the following to a function
                var cppPcs = "";
                var cppArray = "";
                for (var i = 0; i < nns.length; i++) {
                    var n = nns[i];

                    if (n.z != ws.id) continue; // workspace check
                    if (n.type.startsWith("Junction")) continue;

                    
                }
                if (ac.totalCount != 0) {
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + getAudioConnectionTypeName() + " ";
                    newWsCpp.contents += getNrOfSpaces(32 - getAudioConnectionTypeName().length);
                    newWsCpp.contents += "*patchCord[" + ac.totalCount + "]; // total patchCordCount:" + ac.totalCount + " including array typed ones.\n";
                }
                for (var ani = 0; ani < arrayNodes.length; ani++) {
                    var arrayNode = arrayNodes[ani];
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + arrayNode.type + " ";
                    newWsCpp.contents += getNrOfSpaces(32 - arrayNode.type.length);
                    newWsCpp.contents += "*" + arrayNode.name + ";\n";
                }

                // generate constructor code
                newWsCpp.contents += "\n// constructor (this is called when class-object is created)\n";
                if (RED.arduino.settings.ExportMode < 3)
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + ws.label + "() { \n";
                else {
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + ws.label + "(const char* _name,OSCAudioGroup* parent) : \n";
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + "  OSCAudioGroup(_name,parent), // construct our base class instance\n";
                }

                if (ac.totalCount != 0)
                    newWsCpp.contents += getNrOfSpaces(majorIncrement) + "int pci = 0; // used only for adding new patchcords\n"
                if (RED.arduino.settings.ExportMode == 3)
                    newWsCpp.contents += getNrOfSpaces(majorIncrement) + "OSCAudioGroup& grp = *this;\n"
                
                newWsCpp.contents += "\n";
                for (var ani = 0; ani < arrayNodes.length; ani++) {
                    var arrayNode = arrayNodes[ani];
                    newWsCpp.contents += getNrOfSpaces(majorIncrement) + arrayNode.name + " = new " + arrayNode.type + "[" + arrayNode.objectCount + "]";
                    if (arrayNode.autoGenerate)
                        newWsCpp.contents += "{" + arrayNode.cppCode.substring(0, arrayNode.cppCode.length - 1) + "}"
                    else
                        newWsCpp.contents += arrayNode.cppCode;

                    newWsCpp.contents += "; // pointer array\n";
                }
                newWsCpp.contents += "\n";
                newWsCpp.contents += cppPcs;
                if (ac.arrayLength != 0) {
                    newWsCpp.contents += getNrOfSpaces(majorIncrement) + "for (int i = 0; i < " + ac.arrayLength + "; i++) {\n";
                    newWsCpp.contents += cppArray;
                    newWsCpp.contents += getNrOfSpaces(majorIncrement) + "}\n";
                }else {
                    newWsCpp.contents += cppArray;
                }
                newWsCpp.contents += incrementTextLines(classConstructorCode, majorIncrement);
                newWsCpp.contents += getNrOfSpaces(minorIncrement) + "}\n";

                
                // generate destructor code if enabled
                if (ws.generateCppDestructor == true) {
                    newWsCpp.contents += "\n" + getNrOfSpaces(minorIncrement) + "~" + ws.label + "() { // destructor (this is called when the class-object is deleted)\n";
                    if (ac.totalCount != 0) {
                        newWsCpp.contents += getNrOfSpaces(majorIncrement) + "for (int i = 0; i < " + ac.totalCount + "; i++) {\n";
                        newWsCpp.contents += getNrOfSpaces(majorIncrement + minorIncrement) + "patchCord[i]->disconnect();\n"
                        newWsCpp.contents += getNrOfSpaces(majorIncrement + minorIncrement) + "delete patchCord[i];\n"
                        newWsCpp.contents += getNrOfSpaces(majorIncrement) + "}\n";
                    }
                    newWsCpp.contents += incrementTextLines(classDestructorCode, majorIncrement);
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + "}\n";
                }


            if (classFunctions.trim().length > 0) {
                if (newWsCpp.isMain == false)
                    newWsCpp.contents += "\n" + incrementTextLines(classFunctions, minorIncrement);
                else
                    newWsCpp.contents += "\n" + classFunctions;
            }

            if (newWsCpp.isMain == false) {// don't include end of class marker when doing main.cpp 
                newWsCpp.contents += "};\n"; // end of class
                newWsCpp.contents += class_eofCode; // after end of class
            }


            newWsCpp.header = getCppHeader(jsonString, classAdditionalIncludes.join("\n") + "\n" + classIncludes.join("\n") + "\n ", generateZip);
            newWsCpp.footer = getCppFooter();
            wsCppFiles.push(newWsCpp);

            /*if (useExportDialog)
                for (var cai = 0; cai < classIncludes.length; cai++) {
                    if (!codeFileIncludes.includes(classIncludes[cai]))
                        codeFileIncludes.push(classIncludes[cai]);
                }*/
        } // workspaces loop

        if (mixervariants != undefined && mixervariants.length > 0) {
            var mfiles = Mixers.GetCode(mixervariants);
            var file = getNewWsCppFile("mixers.h", mfiles.h);
            file.header = mfiles.copyrightNote;
            globalCppFiles.push(file);
            file = getNewWsCppFile("mixers.cpp", mfiles.cpp);
            file.header = mfiles.copyrightNote;
            globalCppFiles.push(file);
        }
        console.error("@export as class RED.arduino.serverIsActive=" + RED.arduino.serverIsActive());
        // time to generate the final result
        var cpp = "";
        if (useExportDialog)
            cpp = getCppHeader(jsonString, undefined, false);//, codeFileIncludes.join("\n"));
        for (var i = 0; i < wsCppFiles.length; i++) {
            // don't include beautified json string here
            // and only append to cpp when useExportDialog
            if (isCodeFile(wsCppFiles[i].name) && useExportDialog) {
                if (wsCppFiles[i].name == "mixers.cpp") { // special case
                    cpp += wsCppFiles[i].contents.replace('#include "mixers.h"', '') + "\n"; // don't use that here as it generates compiler error
                }
                else if (wsCppFiles[i].name == "mixers.h") // special case
                    cpp += wsCppFiles[i].header + "\n" + wsCppFiles[i].contents + "\n"; // to include the copyright note
                else
                    cpp += wsCppFiles[i].contents;
            }

            wsCppFiles[i].contents = wsCppFiles[i].header + wsCppFiles[i].contents + wsCppFiles[i].footer;
            delete wsCppFiles[i].header;
            delete wsCppFiles[i].footer;
        }
        cpp += getCppFooter();
        //console.log(cpp);

        //console.log(jsonString);
        var wsCppFilesJson = getPOST_JSON(wsCppFiles, true);
        wsCppFilesJson.keywords = keywords;
        var jsonPOSTstring = JSON.stringify(wsCppFilesJson, null, 4);
        //if (RED.arduino.isConnected())

        if (generateZip == false)
            RED.arduino.httpPostAsync(jsonPOSTstring); // allways try to POST but not when exporting to zip
        //console.warn(jsonPOSTstring);


        // only show dialog when server is active and not generating zip
        if (useExportDialog)
            RED.view.dialogs.showExportDialog("Class Export to Arduino", cpp, " Source Code:");
        //RED.view.dialogs.showExportDialog("Class Export to Arduino", JSON.stringify(wsCppFilesJson, null, 4));	// dev. test
        const t1 = performance.now();
        console.log('arduino-export-save2 took: ' + (t1 - t0) + ' milliseconds.');

        if (generateZip == true) {
            var zip = new JSZip();
            let useSubfolder = RED.arduino.settings.ZipExportUseSubFolder;
            let subFolder = /*(mainFileName != "") ? mainFileName : */RED.arduino.settings.ProjectName;
            for (var i = 0; i < wsCppFiles.length; i++) {
                var wsCppfile = wsCppFiles[i];

                if (wsCppfile.overwrite_file == false) continue; // don't include in zip as it's only a placeholder for existing files
                if (useSubfolder == false)
                    zip.file(wsCppfile.name, wsCppfile.contents);
                else
                    zip.file(subFolder + "\\" + wsCppfile.name, wsCppfile.contents);
            }
            var compression = (RED.arduino.settings.ZipExportCompress==true)?"DEFLATE":"STORE";
            zip.generateAsync({ type: "blob", compression}).then(function (blob) {
                const t2 = performance.now();
                console.log('arduino-export-toZip took: ' + (t2 - t1) + ' milliseconds.');
                RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName + ".zip", function (fileName) { saveAs(blob, fileName); });//RED.main.download(fileName, content); });
            });
        }
    }

    return {

    };
})();