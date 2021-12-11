

OSC.export = (function () {

    

    $('#btn-deploy-osc').click(function () { export_simple(); });
    function export_simple() {
        //const t0 = performance.now();
        RED.storage.update();

        if (!RED.nodes.hasIO() && RED.arduino.settings.IOcheckAtExport) {
            showExportErrorDialog();
            return;
        }
        var nns = RED.nodes.createCompleteNodeSet(false);
        // sort is made inside createCompleteNodeSet
        var wsCppFiles = [];
        //wsCppFiles.push(getNewWsCppFile("GUI_TOOL.json", JSON.stringify(nns, null, 4))); // JSON beautifier
        //var jsonString = JSON.stringify(nns); // one liner JSON

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

        
        var addr = "";
        var apos = []; // Audio Processing Objects
        var acs = []; // Audio Connections 

        for (var i = 0; i < nns.length; i++) {
            var n = nns[i];
            if (n.type == "tab" || n.type == "settings") continue;
            if (n.z != activeWorkspace) continue; // workspace filter

            //if (isSpecialNode(n.type) || (n.type == "PointerArray")) continue; // simple export don't support Array-node, it's replaced by "real" node-array, TODO: remove Array-type
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs

            if (node == null) { console.warn("node == null:" + "type:" + n.type + ",id:" + n.id); continue; } // this should never happen (because now "tab" type checked at top)
            
            if (node._def.nonObject != undefined) continue; // _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes

            var nodeType = getTypeName(nns, n);
            var nodeName = RED.nodes.make_name(n);

            addr = RED.OSC.settings.RootAddress + "/dynamic/createObject*";
            apos.push(OSC.CreatePacket(addr,"ss", nodeType, nodeName));

            if (haveIO(node)) {
                RED.nodes.eachWire(n, function (pi, dstId, dstPortIndex) {
                    var src = RED.nodes.node(n.id);
                    var dst = RED.nodes.node(dstId);
                    var src_name = RED.nodes.make_name(src);
                    var dst_name = RED.nodes.make_name(dst);
                    var linkName = src_name+pi+dst_name+dstPortIndex;
                    addr = RED.OSC.settings.RootAddress + "/dynamic/createObject*";
                    acs.push(OSC.CreatePacket(addr,"s", linkName));
                    addr = RED.OSC.settings.RootAddress + "/audio/" + linkName + "/connect*";
                    acs.push(OSC.CreatePacket(addr,"sisi", src_name, pi, dst_name, dstPortIndex));
                });
            }
        }
        var exportDialogText = ""; // use this for debug output

        var bundle = OSC.CreateBundle(0);
        addr = RED.OSC.settings.RootAddress + "/dynamic/clearAll*";
        var clearAllPacket = OSC.CreatePacket(addr, "");
        bundle.packets.push(clearAllPacket);
        exportDialogText += JSON.stringify(clearAllPacket) + "\n";
        // first add all Audio Processing Objects
        for (var i = 0; i < apos.length; i++) {
            bundle.packets.push(apos[i]);
            exportDialogText += JSON.stringify(apos[i]) + "\n";
        }
        // second add all Audio Connections
        for (var i = 0; i < acs.length; i++) {
            bundle.packets.push(acs[i]);
            exportDialogText += JSON.stringify(acs[i]) + "\n";
        }
        var bundleData = OSC.CreateBundleData(bundle);

        var dataAsText = new TextDecoder("utf-8").decode(bundleData);

        showExportDialog("OSC Export to Dynamic Audio Lib", exportDialogText + "\nRAW data:\n" + dataAsText, " OSC messages: (" + bundleData.length + " bytes)", "send",
        function () {OSC.SendData(bundleData)});

    }

    /** have to put this here as JAVASCRIPT is broken shit
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
    function haveIO(node) {
        return ((node.outputs > 0) || (node._def.inputs > 0));
    }
    function showExportDialog(title, text, textareaLabel,okText,okPressedCb) {
        if (okText == undefined) okText = "Ok";
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
                        text: okText,
                        click: function () {
                            RED.console_ok("Export dialog OK pressed!");
                            $(this).dialog("close");
                            if (okPressedCb != undefined)
                                okPressedCb();
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

    return {
        
    };
})();