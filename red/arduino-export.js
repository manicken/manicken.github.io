/** Added in addition to original Node-Red source, for audio system visualization
 * this file is intended to work as an interface between Node-Red flow and Arduino
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


RED.arduino.export = (function () {


    /**
   * this take a multiline text, 
   * break it up into linearray, 
   * then each line is added to a new text + the incrementText added in front of every line
   * @param {*} text 
   * @param {*} increment
   */
    function incrementTextLines(text, increment) {
        var lines = text.split("\n");
        var newText = "";
        if (typeof increment == "number")
            increment = getNrOfSpaces(increment);
        for (var i = 0; i < lines.length; i++) {
            newText += increment + lines[i] + "\n";
        }
        return newText;
    }
    function getNrOfSpaces(count) {
        var str = "";
        for (var i = 0; i < count; i++)
            str += " ";
        return str;
    }

    function showExportErrorDialog() {
        $("#node-dialog-error-deploy").dialog({
            title: "Error exporting data to Arduino IDE",
            modal: true,
            autoOpen: false,
            width: 410,
            height: 245,
            buttons: [{
                text: "Ok",
                click: function () {
                    $(this).dialog("close");
                }
            }]
        }).dialog("open");
    }
    function showExportDialog(title, text, textareaLabel) {
        var box = document.querySelector('.ui-droppable'); // to get window size
        function float2int(value) {
            return value | 0;
        }
        RED.view.state(RED.state.EXPORT);
        var t2 = performance.now();
        RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
            if (textareaLabel != undefined)
                $("#export-clipboard-dialog-textarea-label").text(textareaLabel);

            $("#node-input-export").val(text).focus(function () {
                var textarea = $(this);

                textarea.select();
                //console.error(textarea.height());
                var textareaNewHeight = float2int((box.clientHeight - 220) / 20) * 20;// 20 is the calculated text line height @ 12px textsize, 220 is the offset
                textarea.height(textareaNewHeight);

                textarea.mouseup(function () {
                    textarea.unbind("mouseup");
                    return false;
                });
            }).focus();



            //console.warn(".ui-droppable.box.clientHeight:"+ box.clientHeight);
            //$( "#dialog" ).dialog("option","title","Export to Arduino").dialog( "open" );
            $("#dialog").dialog({
                title: title,
                width: box.clientWidth * 0.60, // setting the size of dialog takes ~170mS
                height: box.clientHeight,
                buttons: [
                    {
                        text: "Ok",
                        click: function () {
                            RED.console_ok("Export dialog OK pressed!");
                            $(this).dialog("close");
                        }
                    },
                    {
                        text: "Cancel",
                        click: function () {
                            RED.console_ok("Export dialog Cancel pressed!");
                            $(this).dialog("close");
                        }
                    }
                ],
            }).dialog("open");

        });
        //RED.view.dirty(false);
        const t3 = performance.now();
        console.log('arduino-export-save-show-dialog took: ' + (t3 - t2) + ' milliseconds.');
    }

    /*function isSpecialNode(nt)
    {
      if (nt == "ClassComment") return true;
      else if (nt == "Comment") return true;
      else if (nt == "TabInput") return true;
      else if (nt == "TabOutput") return true;
      else if (nt == "Function") return true;
      else if (nt == "Variables") return true;
      else if (nt == "CodeFile") return true;
      else if (nt == "ConstValue") return true;
      else if (nt == "tab") return true;
      else if (nt == "PointerArray") return true;
      else return false;
    }*/
    /**
     * This is only for the moment to get special type AudioMixer<n> and AudioStreamObject
     * @param {*} nns nodeArray
     * @param {Node} n node
     */
    function getTypeName(nns, n) {
        var cpp = "";
        var typeLength = n.type.length;
        if (n.type == "AudioMixer") {
            var tmplDef = "";
            if (n.inputs == 1) // special case 
            {
                // check if source is a array
                var src = RED.nodes.getWireInputSourceNode(nns, n.z, n.id);
                if (src && (src.node.name)) // if not src.node.name is defined then it is not an array, because the id never defines a array
                {
                    var isArray = RED.nodes.isNameDeclarationArray(src.node.name);
                    if (isArray) tmplDef = "<" + isArray.arrayLength + ">";
                    console.log("special case AudioMixer connected from array " + src.node.name + ", new AudioMixer def:" + tmplDef);
                }
                else
                    tmplDef = "<" + n.inputs + ">";
            }
            else
                tmplDef = "<" + n.inputs + ">";

            cpp += n.type + tmplDef + " ";
            typeLength += tmplDef.length;
        }
        else if (n.type == "AudioStreamObject") {
            cpp += n.subType + " ";
            typeLength = n.subType.length;
        }
        else
            cpp += n.type + " ";

        for (var j = typeLength; j < 32; j++) cpp += " ";
        return cpp;
    }

    function getCppHeader(jsonString, includes) {
        if (includes == undefined)
            includes = "";
        var returnStr = RED.arduino.settings.StandardIncludeHeader
            + includes + "\n"
            + "// " + RED.arduino.settings.ProjectName + ": begin automatically generated code\n";
        if (RED.arduino.settings.WriteJSONtoExportedFile == true)
            returnStr += "// the following JSON string contains the whole project, \n// it's included in all generated files.\n"
                + "// JSON string:" + jsonString + "\n\n";
        return returnStr;
    }
    function getCppFooter() {
        return "// " + RED.arduino.settings.ProjectName + ": end automatically generated code\n";
    }
    function getNewWsCppFile(name, contents) {
        //contents = contents.replace("undefined", "").replace("undefined", "");
        return { name: name, contents: contents, header: "", footer: "", overwrite_file: true, isMain: false };
    }
    /**
     * 
     * @param {*} wsCppFiles array of type "getNewWsCppFile"
     * @param {*} removeOtherFiles remove files not present in JSON POST
     */
    function getPOST_JSON(wsCppFiles, removeOtherFiles) {
        return { files: wsCppFiles, removeOtherFiles: removeOtherFiles };
    }
    function getNewAudioConnectionType(workspaceId, minorIncrement, majorIncrement) {
        return {
            workspaceId: workspaceId,
            base: getNrOfSpaces(majorIncrement) + "AudioConnection        patchCord",
            arrayBase: getNrOfSpaces(majorIncrement) + "patchCord[pci++] = new AudioConnection(",
            dstRootIsArray: false,
            srcRootIsArray: false,
            arrayLength: 0,
            srcName: "",
            srcPort: 0,
            dstName: "",
            dstPort: 0,
            count: 1,
            totalCount: 0,
            cppCode: "",
            ifAnyIsArray: function () {
                return (this.dstRootIsArray || this.srcRootIsArray);
            },
            appendToCppCode: function () {
                //if ((this.srcPort == 0) && (this.dstPort == 0))
                //	this.cppCode	+= "\n" + this.base + this.count + "(" + this.srcName + ", " + this.dstName + ");"; // this could be used but it's generating code that looks more blurry

                if (this.dstRootIsArray) {
                    this.cppCode += getNrOfSpaces(minorIncrement) + this.arrayBase + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", " + this.dstPort + ");\n";
                    this.totalCount += this.arrayLength;
                }
                else if (this.srcRootIsArray) {
                    this.cppCode += getNrOfSpaces(minorIncrement) + this.arrayBase + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", i);\n";
                    this.totalCount += this.arrayLength;
                }
                else {
                    this.cppCode += this.arrayBase + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", " + this.dstPort + ");\n";
                    this.count++;
                    this.totalCount++;
                }

            },
            checkIfDstIsArray: function () {
                var isArray = RED.nodes.isNameDeclarationArray(this.dstName, this.workspaceId);
                if (!isArray) {
                    this.dstRootIsArray = false;
                    return false;
                }
                this.arrayLength = isArray.arrayLength;
                this.dstName = isArray.newName;
                this.dstRootIsArray = true;
                return true;
            },
            checkIfSrcIsArray: function () {

                var isArray = RED.nodes.isNameDeclarationArray(this.srcName, this.workspaceId);
                if (!isArray) {
                    this.srcRootIsArray = false;
                    return false;
                }
                this.arrayLength = isArray.arrayLength;
                this.srcName = isArray.newName;
                this.srcRootIsArray = true;
                return true;
            }
        };
    }
    /**
     * Checks if a node have any Input(s)/Output(s)
     * @param {Node} node 
     * @returns {Boolean} ((node.outputs > 0) || (node._def.inputs > 0))
     */
    function haveIO(node) {
        return ((node.outputs > 0) || (node._def.inputs > 0));
    }

    $('#btn-deploy').click(function () { export_simple(); });
    function export_simple() {
        const t0 = performance.now();
        RED.storage.update();

        if (!RED.nodes.hasIO() && RED.arduino.settings.IOcheckAtExport) {
            showExportErrorDialog();
            return;
        }
        var nns = RED.nodes.createCompleteNodeSet(false);
        // sort is made inside createCompleteNodeSet
        var wsCppFiles = [];
        wsCppFiles.push(getNewWsCppFile("GUI_TOOL.json", JSON.stringify(nns, null, 4))); // JSON beautifier
        var jsonString = JSON.stringify(nns); // one liner JSON

        //console.log(JSON.stringify(nns));
        var includes = ""; // Include Def nodes
        var globalVars = "";
        var codeFiles = "";
        var functions = "";
        var cppAPN = "// Audio Processing Nodes\n";
        var cppAC = "// Audio Connections (all connections (aka wires or links))\n";
        var cppCN = "// Control Nodes (all control nodes (no inputs or outputs))\n";
        var cordcount = 1;
        var activeWorkspace = RED.view.getWorkspace();

        console.log("save1(simple) workspace:" + activeWorkspace);

        for (var i = 0; i < nns.length; i++) {
            var n = nns[i];
            if (n.type == "tab" || n.type == "settings") continue;
            if (n.z != activeWorkspace) continue; // workspace filter

            //if (isSpecialNode(n.type) || (n.type == "PointerArray")) continue; // simple export don't support Array-node, it's replaced by "real" node-array, TODO: remove Array-type
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs

            if (node == null) { console.warn("node == null:" + "type:" + n.type + ",id:" + n.id); continue; } // this should never happen (because now "tab" type checked at top)
            // first handle special nodes
            if (node.type == "IncludeDef") { if (!includes.includes("#include " + node.name)) includes += "#include " + node.name + "\n"; }
            else if (node.type == "Variables") globalVars += node.comment + "\n";
            else if (node.type == "CodeFile") codeFiles += "\n" + node.comment + "\n";
            else if (node.type == "Function") functions += "\n" + node.comment + "\n";
            else if (node.type == "AudioStreamObject") { if (!includes.includes("#include " + node.includeFile)) includes += "#include " + node.includeFile + "\n"; }
            else if (node.type == "DontRemoveCodeFiles") {
                var files = node.comment.split("\n");
                for (var fi = 0; fi < files.length; fi++) {
                    var wsFile = getNewWsCppFile(files[fi], "");
                    wsFile.overwrite_file = false;
                    wsCppFiles.push(wsFile);
                }
            }

            if (node._def.nonObject != undefined) continue; // _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes

            if (haveIO(node)) {
                // generate code for audio processing node instance
                cppAPN += getTypeName(nns, n);
                var name = RED.nodes.make_name(n)
                cppAPN += name + "; ";
                for (var j = n.id.length; j < 14; j++) cppAPN += " ";
                cppAPN += "//xy=" + n.x + "," + n.y + "\n";

                // generate code for node connections (aka wires or links)
                RED.nodes.eachWire(n, function (pi, dstId, dstPortIndex) {
                    var src = RED.nodes.node(n.id);
                    var dst = RED.nodes.node(dstId);
                    var src_name = RED.nodes.make_name(src);
                    var dst_name = RED.nodes.make_name(dst);
                    cppAC += "AudioConnection          patchCord" + cordcount + "(";
                    //if (pi == 0 && dstPortIndex == 0 && src && src.outputs == 1 && dst && dst._def.inputs == 1) {
                    //	cppAC += src_name + ", " + dst_name;
                    //} else {
                    cppAC += src_name + ", " + pi + ", " + dst_name + ", " + dstPortIndex;
                    //}
                    cppAC += ");\n";
                    cordcount++;
                });
            } else { // generate code for control node (no inputs or outputs)
                cppCN += n.type + " ";
                for (var j = n.type.length; j < 24; j++) cppCN += " ";
                cppCN += n.name + "; ";
                for (var j = n.name.length; j < 14; j++) cppCN += " ";
                cppCN += "//xy=" + n.x + "," + n.y + "\n";
            }
        }

        var cpp = getCppHeader(jsonString, includes);
        cpp += "\n" + codeFiles + "\n" + cppAPN + "\n" + cppAC + "\n" + cppCN + "\n" + globalVars + "\n" + functions + "\n";
        cpp += getCppFooter();
        //console.log(cpp);

        wsCppFiles.push(getNewWsCppFile(RED.nodes.getWorkspace(activeWorkspace).label + ".h", cpp));

        var wsCppFilesJson = getPOST_JSON(wsCppFiles, true);
        RED.arduino.httpPostAsync(JSON.stringify(wsCppFilesJson));
        const t1 = performance.now();

        var useExportDialog = (RED.arduino.settings.useExportDialog || !RED.arduino.serverIsActive())

        if (useExportDialog)
            showExportDialog("Simple Export to Arduino", cpp, " Source Code:");
        //showExportDialog("Simple Export to Arduino", JSON.stringify(wsCppFilesJson, null, 4));	// dev. test

        const t2 = performance.now();
        console.log('arduino-export-save1 took generating: ' + (t1 - t0) + ' milliseconds.');
        console.log('arduino-export-save1 took total: ' + (t2 - t0) + ' milliseconds.');

    }

    $('#btn-deploy2').click(function () { export_classBased(); });
    $('#btn-deploy2zip').click(function () { export_classBased(true); });
    function export_classBased(generateZip) {
        var minorIncrement = RED.arduino.settings.CodeIndentations;
        var majorIncrement = minorIncrement * 2;
        const t0 = performance.now();
        RED.storage.update();

        if (!RED.nodes.hasIO() && RED.arduino.settings.IOcheckAtExport) {
            showExportErrorDialog();
            return;
        }
        var useExportDialog = (RED.arduino.settings.useExportDialog || !RED.arduino.serverIsActive() && (generateZip == undefined))

        var nns = RED.nodes.createCompleteNodeSet(false);
        // sort is made inside createCompleteNodeSet

        var tabNodes = RED.nodes.getClassIOportsSorted();

        //console.log(JSON.stringify(nns)); // debug test

        // to make splitting the classes to different files
        // wsCpp and newWsCpp is used
        var wsCppFiles = [];
        var newWsCpp;
        var codeFileIncludes = [];
        var classAdditional = [];
        // first create the json strings, 
        // because when replacing constant def with values destroys the design
        var jsonString = JSON.stringify(nns); // one liner JSON
        wsCppFiles.push(getNewWsCppFile("GUI_TOOL.json", JSON.stringify(nns, null, 4))); // JSON beautifier
        wsCppFiles.push(getNewWsCppFile("preferences.txt", RED.arduino.board.export_arduinoIDE()));
        wsCppFiles.push(getNewWsCppFile("platformio.ini", RED.arduino.board.export_platformIO()));
        // first scan for code files to include them first
        for (var i = 0; i < nns.length; i++) {
            var n = nns[i];
            if (n.type == "CodeFile") // very special case
            {
                if (n.comment.length != 0) {
                    var wsFile = getNewWsCppFile(n.name, n.comment);
                    wsFile.header = "\n// ****** Start Of Included File:" + n.name + " ****** \n";
                    wsFile.footer = "\n// ****** End Of Included file:" + n.name + " ******\n";
                    wsCppFiles.push(wsFile);
                }
            }
            else if (n.type == "DontRemoveCodeFiles") {
                var files = n.comment.split("\n");
                for (var fi = 0; fi < files.length; fi++) {
                    var wsFile = getNewWsCppFile(files[fi], "");
                    wsFile.overwrite_file = false;
                    wsCppFiles.push(wsFile);
                }
            }
        }

        for (var wsi = 0; wsi < RED.nodes.workspaces.length; wsi++) // workspaces
        {
            var ws = RED.nodes.workspaces[wsi];
            if (!ws.export) continue; // this skip export
            if (ws.isMain == true)
            {
                var fileName = "";
                if (ws.mainNameType == "main")
                    fileName = "main";
                else if (ws.mainNameType == "projectName")
                    fileName = RED.arduino.settings.ProjectName;
                else // this includes if (ws.mainNameType == "tabName")
                    fileName = ws.label;
                newWsCpp = getNewWsCppFile(fileName + ws.mainNameExt, "");
                newWsCpp.isMain = true;
            }
            else if (ws.label == "main.cpp") {
                newWsCpp = getNewWsCppFile(ws.label, "");
                newWsCpp.isMain = true;
            }
            else
                newWsCpp = getNewWsCppFile(ws.label + ".h", "");

            // first go through special types
            var classComment = "";
            var classConstructorCode = "";
            var classFunctions = "";
            var classVars = "";
            var classAdditional = [];
            var classIncludes = [];
            var arrayNodes = [];

            for (var i = 0; i < nns.length; i++) {
                var n = nns[i];

                if (n.z != ws.id) continue; // workspace filter
                if (n.type == "ClassComment") {
                    //if (n.name == "TestMultiline")
                    //	RED.nodes.node(n.id).name = "Test\nMultiline";
                    classComment += " * " + n.name + "\n";
                }
                else if (n.type == "Function") {
                    classFunctions += n.comment + "\n"; // we use comment field for function-data
                }
                else if (n.type == "Variables") {
                    classVars += n.comment + "\n" // we use comment field for vars-data
                }
                else if (n.type == "PointerArray") // this is special thingy that was before real-node, now it's obsolete, it only generates more code
                {
                    arrayNodes.push({ type: n.objectType, name: n.name, cppCode: n.arrayItems, objectCount: n.arrayItems.split(",").length });
                }
                else if (RED.nodes.isClass(n.type)) {
                    var includeName = '#include "' + n.type + '.h"';
                    if (!classAdditional.includes(includeName)) classAdditional.push(includeName);
                }
                else if (n.type == "CodeFile") // very special case
                {
                    var includeName = '#include "' + n.name + '"';
                    if (includeName.toLowerCase().endsWith(".c") || includeName.toLowerCase().endsWith(".cpp")) continue;

                    if (!classIncludes.includes(includeName)) classIncludes.push(includeName);
                }
                else if (n.type == "IncludeDef") {
                    var includeName = '#include ' + n.name;
                    if (!classIncludes.includes(includeName)) classIncludes.push(includeName);
                }
                else if (n.type == "ConstValue") {
                    classVars += "const static " + n.valueType + " " + n.name + " = " + n.value + ";\n";
                }
                else if (n.type == "ConstructorCode") {
                    classConstructorCode += n.comment + "\n";
                }
            }
            if (classComment.length > 0) {
                newWsCpp.contents += "\n/**\n" + classComment + " */"; // newline not needed because it allready in beginning of class definer (check down)
            }
            if (newWsCpp.isMain == false)
                newWsCpp.contents += "\nclass " + ws.label + "\n{\npublic:\n";
            if (classVars.trim().length > 0) {
                if (newWsCpp.isMain == false)
                    newWsCpp.contents += incrementTextLines(classVars, minorIncrement);
                else
                    newWsCpp.contents += classVars;
            }

            if (newWsCpp.isMain == false) // audio processing nodes should not be in the main file
            {
                // generate code for all audio processing nodes
                for (var i = 0; i < nns.length; i++) {
                    var n = nns[i];
                    if (n.type == "tab" || n.type == "settings") continue; // constant special objects
                    if (n.z != ws.id) continue; // workspace filter
                    var node = RED.nodes.node(n.id);
                    if (node == null) { continue; }
                    if (node._def.nonObject != undefined) continue; // _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes

                    //if(isSpecialNode(n.type)) continue;
                    if ((node.outputs <= 0) && (node._def.inputs <= 0)) continue;

                    var isArray = RED.nodes.isNameDeclarationArray(n.name, ws.id, true);
                    if (isArray) {
                        n.name = isArray.newName;
                    }

                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + getTypeName(nns, n);
                    //console.log(">>>" + n.type +"<<<"); // debug test
                    var name = RED.nodes.make_name(n)

                    if (n.comment && (n.comment.trim().length != 0))
                        newWsCpp.contents += name + "; /* " + n.comment + "*/\n";
                    else
                        newWsCpp.contents += name + ";\n";
                }
            }
            // generate code for all control/standard class nodes (no inputs or outputs)
            for (var i = 0; i < nns.length; i++) {
                var n = nns[i];

                if (n.z != ws.id) continue;
                var node = RED.nodes.node(n.id);
                if (node == null) { continue; }
                if (node._def.nonObject != undefined) continue;// _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes
                if (node._def.outputs != 0) continue;
                if (node._def.inputs != 0) continue;
                if (node.type == "AudioStreamObject") continue;

                //if(isSpecialNode(n.type)) continue; // replaced by if (node._def.nonObject != undefined) 
                if (newWsCpp.isMain == false)
                    newWsCpp.contents += getNrOfSpaces(minorIncrement);

                newWsCpp.contents += n.type + " ";
                for (var j = n.type.length; j < 32; j++) cpp += " ";
                var name = RED.nodes.make_name(n)
                newWsCpp.contents += name + ";\n";
            }

            if (newWsCpp.isMain == false) // don't generate either audio connections or constructor in main file
            {
                // generate code for all connections (aka wires or links)
                var ac = getNewAudioConnectionType(ws.id, minorIncrement, majorIncrement);
                ac.count = 1;
                var cppPcs = "";
                var cppArray = "";
                for (var i = 0; i < nns.length; i++) {
                    var n = nns[i];

                    if (n.z != ws.id) continue; // workspace check
                    if (n.type.startsWith("Junction")) continue;

                    RED.nodes.eachWire(n, function (pi, dstId, dstPortIndex) {

                        var src = RED.nodes.node(n.id);
                        var dst = RED.nodes.node(dstId);

                        if (src.type == "TabInput" || dst.type == "TabOutput") return; // now with JSON string at top, place-holders not needed anymore

                        if (dst.type.startsWith("Junction"))// && )
                        {
                            var dstNodes = { nodes: [] };
                            getJunctionFinalDestinations(dst, dstNodes);
                            for (var dni = 0; dni < dstNodes.nodes.length; dni++) {
                                if (src === dstNodes.nodes[dni].node) continue; // can't make connections back to itself

                                //console.error(src.name +":"+ pi + "->" + dstNodes.nodes[dni].node.name + ":" + dstNodes.nodes[dni].dstPortIndex);
                                dst = dstNodes.nodes[dni].node;
                                ac.cppCode = "";
                                ac.srcName = RED.nodes.make_name(src);
                                ac.dstName = RED.nodes.make_name(dst);
                                ac.srcPort = pi;
                                ac.dstPort = dstNodes.nodes[dni].dstPortIndex;

                                ac.checkIfSrcIsArray(); // we ignore the return value, there is no really use for it
                                if (RED.nodes.isClass(n.type)) { // if source is class
                                    //console.log("root src is class:" + ac.srcName);
                                    RED.nodes.classOutputPortToCpp(nns, tabNodes.outputs, ac, n);
                                }

                                ac.checkIfDstIsArray(); // we ignore the return value, there is no really use for it
                                if (RED.nodes.isClass(dst.type)) {
                                    //console.log("dst is class:" + dst.name + " from:" + n.name);
                                    RED.nodes.classInputPortToCpp(tabNodes.inputs, ac.dstName, ac, dst);
                                } else {
                                    ac.appendToCppCode(); // this don't return anything, the result is in ac.cppCode
                                }
                                if (ac.ifAnyIsArray())
                                    cppArray += ac.cppCode;
                                else
                                    cppPcs += ac.cppCode;
                            }
                        }
                        else {
                            ac.cppCode = "";
                            ac.srcName = RED.nodes.make_name(src);
                            ac.dstName = RED.nodes.make_name(dst);
                            ac.srcPort = pi;
                            ac.dstPort = dstPortIndex;

                            ac.checkIfSrcIsArray(); // we ignore the return value, there is no really use for it
                            if (RED.nodes.isClass(n.type)) { // if source is class
                                //console.log("root src is class:" + ac.srcName);
                                RED.nodes.classOutputPortToCpp(nns, tabNodes.outputs, ac, n);
                            }

                            ac.checkIfDstIsArray(); // we ignore the return value, there is no really use for it
                            if (RED.nodes.isClass(dst.type)) {
                                //console.log("dst is class:" + dst.name + " from:" + n.name);
                                RED.nodes.classInputPortToCpp(tabNodes.inputs, ac.dstName, ac, dst);
                            } else {
                                ac.appendToCppCode(); // this don't return anything, the result is in ac.cppCode
                            }
                            if (ac.ifAnyIsArray())
                                cppArray += ac.cppCode;
                            else
                                cppPcs += ac.cppCode;
                        }
                    });
                }
                if (ac.totalCount != 0) {
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + "AudioConnection ";
                    newWsCpp.contents += getNrOfSpaces(32 - "AudioConnection".length);
                    newWsCpp.contents += "*patchCord[" + ac.totalCount + "]; // total patchCordCount:" + ac.totalCount + " including array typed ones.\n";
                }
                for (var ani = 0; ani < arrayNodes.length; ani++) {
                    var arrayNode = arrayNodes[ani];
                    newWsCpp.contents += getNrOfSpaces(minorIncrement) + arrayNode.type + " ";
                    newWsCpp.contents += getNrOfSpaces(32 - arrayNode.type.length);
                    newWsCpp.contents += "*" + arrayNode.name + ";\n";
                }


                newWsCpp.contents += "\n" + getNrOfSpaces(minorIncrement) + ws.label + "() { // constructor (this is called when class-object is created)\n";
                if (ac.totalCount != 0)
                    newWsCpp.contents += getNrOfSpaces(majorIncrement) + "int pci = 0; // used only for adding new patchcords\n\n"

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
                }
                newWsCpp.contents += incrementTextLines(classConstructorCode, majorIncrement);
                newWsCpp.contents += getNrOfSpaces(minorIncrement) + "}\n";
            } // don't generate constructor in main file END

            if (classFunctions.trim().length > 0) {
                if (newWsCpp.isMain == false)
                    newWsCpp.contents += "\n" + incrementTextLines(classFunctions, minorIncrement);
                else
                    newWsCpp.contents += "\n" + classFunctions;
            }

            if (newWsCpp.isMain == false) // don't include end of class marker when doing main.cpp 
                newWsCpp.contents += "};\n"; // end of class


            newWsCpp.header = getCppHeader(jsonString, classAdditional.join("\n") + "\n" + classIncludes.join("\n") + "\n ");
            newWsCpp.footer = getCppFooter();
            wsCppFiles.push(newWsCpp);

            if (useExportDialog)
                for (var cai = 0; cai < classIncludes.length; cai++) {
                    if (!codeFileIncludes.includes(classIncludes[cai]))
                        codeFileIncludes.push(classIncludes[cai]);
                }
        } // workspaces loop
        console.error("@export as class RED.arduino.serverIsActive=" + RED.arduino.serverIsActive());
        // time to generate the final result
        var cpp = "";
        if (useExportDialog)
            cpp = getCppHeader(jsonString);//, codeFileIncludes.join("\n"));
        for (var i = 0; i < wsCppFiles.length; i++) {
            // don't include beautified json string here
            // and only append to cpp when useExportDialog
            if (isCodeFile(wsCppFiles[i].name) && showExportDialog)
                cpp += wsCppFiles[i].contents;

            wsCppFiles[i].contents = wsCppFiles[i].header + wsCppFiles[i].contents + wsCppFiles[i].footer;
            delete wsCppFiles[i].header;
            delete wsCppFiles[i].footer;
        }
        cpp += getCppFooter();
        //console.log(cpp);

        //console.log(jsonString);
        var wsCppFilesJson = getPOST_JSON(wsCppFiles, true);
        var jsonPOSTstring = JSON.stringify(wsCppFilesJson, null, 4);
        //if (RED.arduino.isConnected())
        if (generateZip == undefined)
            RED.arduino.httpPostAsync(jsonPOSTstring); // allways try to POST but not when exporting to zip
        //console.warn(jsonPOSTstring);


        // only show dialog when server is active and not generating zip
        if (useExportDialog)
            showExportDialog("Class Export to Arduino", cpp, " Source Code:");
        //showExportDialog("Class Export to Arduino", JSON.stringify(wsCppFilesJson, null, 4));	// dev. test
        const t1 = performance.now();
        console.log('arduino-export-save2 took: ' + (t1 - t0) + ' milliseconds.');

        if (generateZip != undefined && (generateZip == true)) {
            var zip = new JSZip();

            for (var i = 0; i < wsCppFiles.length; i++) {
                var wsCppfile = wsCppFiles[i];

                if (wsCppfile.overwrite_file == false) continue; // don't include in zip as it's only a placeholder for existing files

                zip.file(wsCppfile.name, wsCppfile.contents);
            }
            zip.generateAsync({ type: "blob", compression: "DEFLATE" }).then(function (blob) {
                console.log("typeof:" + typeof content);
                localStorage.setItem("test.zip", blob);
                RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName + ".zip", function (fileName) { saveAs(blob, fileName); });//RED.main.download(fileName, content); });
            });
        }
    }

    function isCodeFile(fileName) {
        if (fileName.endsWith(".h")) return true;
        else if (fileName.endsWith(".cpp")) return true;
        else if (fileName.endsWith(".tpp")) return true;
        else if (fileName.endsWith(".hpp")) return true;
        else if (fileName.endsWith(".c")) return true;
        else if (fileName.endsWith(".t")) return true;
        return false;
    }

    function getJunctionFinalDestinations(junctionNode, dstNodes) {
        junctionNode = RED.nodes.convertNode(junctionNode);
        RED.nodes.eachWire(junctionNode, function (pi, dstId, dstPortIndex) {
            var dst = RED.nodes.node(dstId)

            if (dst.type.startsWith("Junction"))
                getJunctionFinalDestinations(dst, dstNodes);
            else
                dstNodes.nodes.push({ node: dst, dstPortIndex: dstPortIndex });
        });
    }

    $('#btn-pushJSON').click(function () { pushJSON(); });
    function pushJSON() {
        var json = localStorage.getItem("audio_library_guitool");
        var wsCppFiles = [];
        wsCppFiles.push(getNewWsCppFile("GUI_TOOL.json", json)); // JSON beautifier
        var wsCppFilesJson = getPOST_JSON(wsCppFiles, false); // false == don't remove other files
        RED.arduino.httpPostAsync(JSON.stringify(wsCppFilesJson));
    }
    $('#btn-deploy2singleLineJson').click(function () { exportSingleLineJSON(); });
    function exportSingleLineJSON() {
        var json = localStorage.getItem("audio_library_guitool");
        showExportDialog("Single line JSON", json, " JSON:");
    }

    /*$("#node-input-export2").val("second text").focus(function() { // this can be used for additional setup loop code in future
            // future is now and with direct communication to from arduino ide this is no longer needed.
            var textarea = $(this);
            textarea.select();
            textarea.mouseup(function() {
              textarea.unbind("mouseup");
              return false;
            });
            }).focus();*/

    return {
        //isSpecialNode:isSpecialNode,
        showExportDialog: showExportDialog,
        pushJSON: pushJSON,
    };
})();