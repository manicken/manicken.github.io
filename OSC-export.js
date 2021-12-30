

OSC.export = (function () {

    function InitButtonPopups(notavailable) {
        var a = "";
        if (notavailable != undefined && notavailable == true)
            a = "Currently not available at the current browser<br>as this functionality currently is implemented using the Web Serial API<br>in the future WebSockets will be supported that will then enable this functionality.<br><br>"
        RED.main.SetPopOver("#btn-save-osc-sd", a+"Saves the current (only audio nodes+links) Design to the connected Teensy SD-Card as a file with the extension .osc<br>so that it can later be loaded using 'Load .osc from SD-card'");
        RED.main.SetPopOver("#btn-load-osc-sd", a+"Loads a .osc file from the SD-card and applies the design");
        RED.main.SetPopOver("#btn-save-json-sd", a+"Saves the current (whole) Design to a .json file on the connected teensy SD-card");
        RED.main.SetPopOver("#btn-load-json-sd", a+"Load/Retreives a saved .json from the connected Teensy SD-Card<br>this is then loaded into this tool.");
        RED.main.SetPopOver("#btn-deploy-osc", a+"Exports this design to a Teensy Running The Dynamic Audio Framework");
        RED.main.SetPopOver("#btn-osc-clearAll", a+"Clears the current design in the teensy<br>this is good if something got messed up and you want a fresh start.");
    }
    $('#btn-save-osc-sd').click(function () {RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName, saveOscToSDcard, "Save as .osc (.osc is added automatically)");});
    function saveOscToSDcard(name) {
        var addr = RED.OSC.settings.RootAddress + "/fs/save";
        var bundle = OSC.export.getSimpleExport_bundle(true);
        var data = OSC.CreateBundleData(bundle);
        OSC.SendMessage(addr,'sb',name + ".osc", data);
    }

    $('#btn-load-osc-sd').click(function () {OSC.fileSelector.show({title:"Load .osc",filter:".osc",okCallback:loadOscFromSDcard});});
    function loadOscFromSDcard(selectedItem) {
        var addr = RED.OSC.settings.RootAddress + "/fs/load";
        OSC.SendMessage(addr,'s',selectedItem.fullPath());
    }

    $('#btn-save-json-sd').click(function () {RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName, saveJSONToSDcard, "Save as .json (.json is added automatically)");});
    function saveJSONToSDcard(name) {
        var nns = RED.nodes.createCompleteNodeSet(false);
        var jsonString = JSON.stringify(nns);
        var data = new TextEncoder("utf-8").encode(jsonString);
        var addr = RED.OSC.settings.RootAddress + "/fs/save";
        OSC.SendMessage(addr,'sb',name + ".json", data);
    }

    $('#btn-load-json-sd').click(function () {OSC.fileSelector.show({title:"Load .json",filter:".json",okCallback:loadJSONFromSDcard});});
    function loadJSONFromSDcard(selectedItem) {
        var addr = RED.OSC.settings.RootAddress + "/fs/send";
        OSC.SendMessage(addr,'s',selectedItem.fullPath());
        //OSC.SetLog("not implemented yet")
    }

    $('#btn-deploy-osc').click(do_export);

    $('#btn-deploy-osc-group').click(function () {do_export(true); });
    function do_export(groupBased) {

        var clearAllAddr = "/dynamic/clearAl*";
        if (groupBased == undefined)
            var result = getSimpleExport_bundle(false);
        else
            var result = getGroupExport_bundle(false);
        if (result == undefined) return; // only happens at getGroupExport_bundle

        var bundle = result.bundle;
        var bundleData = OSC.CreateBundleData(bundle);

        if (RED.OSC.settings.DirectExport == true) {
            OSC.SendData(bundleData);
            return;
        }
        // generate human readable export text
        var exportDialogText = ""; // use this for debug output

        for (var i = 0; i < bundle.packets.length; i++) {
            exportDialogText += JSON.stringify(bundle.packets[i]) + "\n";
        }
        
        var dataAsText = new TextDecoder("utf-8").decode(bundleData);
        
        exportDialogText += "\nTotal AudioObjects:" + result.apos.length + "\n";
        exportDialogText += "Total AudioConnections: " + (result.acs.length/2) + "\n";

        exportDialogText += "\nRAW data (size "+bundleData.length+" bytes):\n" + dataAsText + "\n";
        showExportDialog("OSC Export to Dynamic Audio Lib", exportDialogText, " OSC messages: ", {okText:"send", tips:"this just shows the messages to be sent, first in JSON format then in RAW format"},
        function () {OSC.SendData(bundleData);});

    }

    function getSimpleExport_bundle(getBundleOnly) {
        if (getBundleOnly == undefined) getBundleOnly = false;

        RED.storage.update();

        if (!RED.nodes.hasIO() && RED.arduino.settings.IOcheckAtExport) {
            showExportErrorDialog();
            return;
        }
        var nns = RED.nodes.createCompleteNodeSet(false);

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

            //var nodeType = getTypeName(nns, n);
            var nodeName = n.name;//RED.nodes.make_name(n);

            if (node.type != "AudioMixer")
                apos.push(OSC.CreatePacket(OSC.GetCreateObjectAddr(),"ss", node.type, nodeName));
            else
                apos.push(OSC.CreatePacket(OSC.GetCreateObjectAddr(),"ssi", node.type, node.name, node.inputs));

            if (haveIO(node)) {
                RED.nodes.eachWire(n, function (pi, dstId, dstPortIndex) {
                    var src = RED.nodes.node(n.id);
                    var dst = RED.nodes.node(dstId);
                    var src_name = RED.nodes.make_name(src);
                    var dst_name = RED.nodes.make_name(dst);
                    if (RED.OSC.settings.UseDebugLinkName == false)
                        var linkName = src_name + pi + dst_name + dstPortIndex;
                    else
                        var linkName = src_name + "_" + pi +"_"+ dst_name +"_"+ dstPortIndex;
                    acs.push(OSC.CreatePacket(OSC.GetCreateConnectionAddr(),"s", linkName));
                    acs.push(OSC.CreatePacket(OSC.GetConnectAddr(linkName),"sisi", src_name, pi, dst_name, dstPortIndex));
                });
            }
        }

        var bundle = OSC.CreateBundle(0);
        bundle.add(OSC.GetClearAllAddr());
        // first add all Audio Processing Objects
        for (var i = 0; i < apos.length; i++) {
            bundle.add(apos[i]);
        }
        // second add all Audio Connections
        for (var i = 0; i < acs.length; i++) {
            bundle.add(acs[i]);

        }
        if (getBundleOnly == true) 
            return bundle;
        else
            return {bundle:bundle, apos:apos, acs:acs};
    }

    function findMainWs(nns) {
        for (var wi=0; wi < nns.workspaces.length; wi++) {
            if (nns.workspaces[wi].isMain == true) {
                return wi;
            }
        }
        return -1; // not found
    }

    function isClass(nns, type)
	{
		for (var wsi = 0; wsi < nns.workspaces.length; wsi++)
		{
			var ws = nns.workspaces[wsi];
			if (type == ws.label) return {is:true, ws:ws};
			//console.log(node.type  + "!="+ ws.label);
		}
		return {is:false};
	}

    function getClassObjects(nns, ws, bundle, path, wildcardArrayItems) {
        for (var ni = 0; ni < ws.nodes.length; ni++) {
            var n = ws.nodes[ni];
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs
            if (node._def.nonObject != undefined) continue;

            var maybeClass = isClass(nns, n.type);
            if (maybeClass.is == true)
            {
                var isArray = RED.nodes.isNameDeclarationArray(n.name, ws.id, true);
                if (isArray) {
                    var name = isArray.name;
                    var count = isArray.arrayLength
                    bundle.add(OSC.GetCreateGroupAddr(),"ss", name, path)
                    for (var ai = 0; ai < count; ai++)
                    {
                        bundle.add(OSC.GetCreateGroupAddr(),"ss", "i"+ai, path + name);
                        if (wildcardArrayItems == false)
                            getClassObjects(nns, maybeClass.ws, bundle, path + name + "/i" + ai, wildcardArrayItems);
                    }
                    if (wildcardArrayItems == true)
                        getClassObjects(nns, maybeClass.ws, bundle, path + name + "/i*", wildcardArrayItems);
                }
                else {
                    bundle.add(OSC.GetCreateGroupAddr(),"ss", n.name, path)
                    getClassObjects(nns, maybeClass.ws, bundle, path + "/" + n.name);
                }
            }
            else
            {
                if (path == '/')
                    bundle.add(OSC.GetCreateObjectAddr(),"ss", n.type, n.name);
                else
                    bundle.add(OSC.GetCreateObjectAddr(),"sss", n.type, n.name, path);
            }
        }
    }

    function getClassConnections(nns, ws, bundle, path, wildcardArrayItems) {
        for (var ni = 0; ni < ws.nodes.length; ni++) {
            var n = ws.nodes[ni];
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs
            if (node._def.nonObject != undefined) continue;
            var links = RED.nodes.links.filter(function(l) { return (l.source === node); });

            var maybeClass = isClass(nns, n.type);
            if (maybeClass.is == true)
            {
                var isArray = RED.nodes.isNameDeclarationArray(n.name, ws.id, true);
                if (isArray) {
                    var name = isArray.name;
                    var count = isArray.arrayLength
                    //bundle.add(OSC.GetCreateGroupAddr(),"ss", n.name, path)
                    for (var ai = 0; ai < count; ai++)
                    {
                        //bundle.add(OSC.GetCreateGroupAddr(),"ss", "i"+ai, path + n.name);
                        console.error("this 1 @ " + path +" "+ name + "/i" + ai);
                        addLinksToBundle(bundle, links, path + name + "/i" + ai, path + name + "/i" + ai,path + name + "/i" + ai);
                        getClassConnections(nns, maybeClass.ws, bundle, path + name + "/i" + ai, wildcardArrayItems);
                    }
                }
                else {
                    console.error("this 2 @ " + path + " " + n.name);
                    //bundle.add(OSC.GetCreateGroupAddr(),"ss", n.name, path)
                    addLinksToBundle(bundle, links, path + n.name , path + n.name ,path + n.name);
                    getClassConnections(nns, maybeClass.ws, bundle, n.name);
                }
            }
            else 
            {
                console.error("this 3 @ " + path);
                addLinksToBundle(bundle, links, path , path ,path);
                /*if (path == '/')
                    bundle.add(OSC.GetCreateObjectAddr(),"ss", n.type, n.name);
                else
                    bundle.add(OSC.GetCreateObjectAddr(),"sss", n.type, n.name, path);*/
            }
        }
    }

    function GetNameWithoutArrayDef(name) {
        var value = 0;
		//console.warn("isNameDeclarationArray: " + name);
		var startIndex = name.indexOf("[");
		if (startIndex == -1) return name;
        return name.substring(0, startIndex);
    }
    function addLinksToBundle(bundle, links, path, srcPath, dstPath) {
        for (var li = 0; li < links.length; li++) {
            var link = links[li];
            if ((link.target._def.nonObject != undefined) || (link.source._def.nonObject != undefined)) continue; // Input or Output objects

            var linkName = OSC.GetLinkName(link);
            var srcName = GetNameWithoutArrayDef(link.source.name);
            var dstName = GetNameWithoutArrayDef(link.target.name);
            if (path == "/") {
                bundle.add(OSC.GetCreateConnectionAddr(),"ss", linkName);
                bundle.add(OSC.GetConnectAddr(linkName),"sisi", srcName, link.sourcePort, dstName, link.targetPort);
            }
            else {
                bundle.add(OSC.GetCreateConnectionAddr(),"ss", linkName, path);
                bundle.add(OSC.GetConnectAddr(path +"/"+ linkName),"sisi", srcPath + "/" + srcName, link.sourcePort, dstPath + "/" + dstName, link.targetPort);
            }
        }
    }
    

    function getGroupExport_bundle(getBundleOnly) {
        if (getBundleOnly == undefined) getBundleOnly = false;

        RED.storage.update();

        if (!RED.nodes.hasIO() && RED.arduino.settings.IOcheckAtExport) {
            showExportErrorDialog();
            return;
        }
        var nns = RED.nodes.createCompleteNodeSet(true); // true mean we get the new structure

        var mainWorkSpace = findMainWs(nns);
        if (mainWorkSpace == -1) {
            RED.main.verifyDialog("Main Tab not set", "Main Tab not set", "The main file is not set<br> please set the main entry file<br> double click the tab that you want as the main and check the 'Main File' checkbox,<br><br>ignore the 'exported Main File Name' as it's not used with OSC", function() {});
            return;
        }
        var apos = []; // Audio Processing Objects
        var acs = []; // Audio Connections 
        var ws = nns.workspaces[mainWorkSpace];
        var bundle = OSC.CreateBundle(0);
        bundle.add(OSC.GetClearAllAddr());
        getClassObjects(nns, ws, bundle, '/', RED.OSC.settings.WildcardArrayObjects);
        getClassConnections(nns, ws, bundle, '/', RED.OSC.settings.WildcardArrayObjects);

        if (getBundleOnly == true) 
            return bundle;
        else
            return {bundle:bundle, apos:apos, acs:acs};

        /*
        

        for (var i = 0; i < nns.length; i++) {
            var n = nns[i];
            if (n.type == "tab" || n.type == "settings") continue;
            if (n.z != activeWorkspace) continue; // workspace filter

            //if (isSpecialNode(n.type) || (n.type == "PointerArray")) continue; // simple export don't support Array-node, it's replaced by "real" node-array, TODO: remove Array-type
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs

            if (node == null) { console.warn("node == null:" + "type:" + n.type + ",id:" + n.id); continue; } // this should never happen (because now "tab" type checked at top)
            
            if (node._def.nonObject != undefined) continue; // _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes

            //var nodeType = getTypeName(nns, n);
            var nodeName = n.name;//RED.nodes.make_name(n);

            if (node.type != "AudioMixer")
                apos.push(OSC.CreatePacket(OSC.GetCreateObjectAddr(),"ss", node.type, nodeName));
            else
                apos.push(OSC.CreatePacket(OSC.GetCreateObjectAddr(),"ssi", node.type, node.name, node.inputs));

            if (haveIO(node)) {
                RED.nodes.eachWire(n, function (pi, dstId, dstPortIndex) {
                    var src = RED.nodes.node(n.id);
                    var dst = RED.nodes.node(dstId);
                    var src_name = RED.nodes.make_name(src);
                    var dst_name = RED.nodes.make_name(dst);
                    if (RED.OSC.settings.UseDebugLinkName == false)
                        var linkName = src_name + pi + dst_name + dstPortIndex;
                    else
                        var linkName = src_name + "_" + pi +"_"+ dst_name +"_"+ dstPortIndex;
                    acs.push(OSC.CreatePacket(OSC.GetCreateConnectionAddr(),"s", linkName));
                    acs.push(OSC.CreatePacket(OSC.GetConnectAddr(linkName),"sisi", src_name, pi, dst_name, dstPortIndex));
                });
            }
        }
*/
        /*var bundle = OSC.CreateBundle(0);
        
        // first add all Audio Processing Objects
        for (var i = 0; i < apos.length; i++) {
            bundle.add(apos[i]);
        }
        // second add all Audio Connections
        for (var i = 0; i < acs.length; i++) {
            bundle.add(acs[i]);

        }*/
        
    }

    /**
     * This is only for the moment to get special type AudioMixer<n> and AudioStreamObject
     * @param {*} nns nodeArray
     * @param {Node} n node
     */
     function getTypeName(nns, n) {
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
            return n.type + tmplDef;
        }
        else if (n.type == "AudioStreamObject")
            return n.subType;
        else
            return n.type;
    }
    function haveIO(node) {
        return ((node.outputs > 0) || (node._def.inputs > 0));
    }
    function showExportDialog(title, text, textareaLabel,overrides,okPressedCb) {
        if (overrides == undefined) var overrides = {};
        if (overrides.okText == undefined) overrides.okText = "Ok";

        var box = document.querySelector('.ui-droppable'); // to get window size
        function float2int(value) {
            return value | 0;
        }
        RED.view.state(RED.state.EXPORT);
        var t2 = performance.now();
        RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
            if (textareaLabel != undefined)
                $("#export-clipboard-dialog-textarea-label").text(textareaLabel);
                if (overrides.tips != undefined)
                    $("#export-clipboard-dialog-tips").text(overrides.tips);
            $("#node-input-export").val(text).focus(function () {
                var textarea = $(this);

                //textarea.select();
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
                        text: overrides.okText,
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
        getSimpleExport_bundle:getSimpleExport_bundle,
        InitButtonPopups:InitButtonPopups
    };
})();