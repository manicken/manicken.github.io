

OSC.export = (function () {

    function InitButtonPopups(notavailable) {
        var a = "";
        if (notavailable != undefined && notavailable == true)
            a = "Currently not available at the current browser<br>as this functionality currently is implemented using the Web Serial API<br>in the future WebSockets will be supported that will then enable this functionality.<br><br>"
        RED.main.SetPopOver("#btn-save-osc-sd", a+"Saves the current (only audio nodes+links) Design to the connected Teensy SD-Card as a file with the extension .osc<br>so that it can later be loaded using 'Load .osc from SD-card'");
        RED.main.SetPopOver("#btn-load-osc-sd", a+"Loads a .osc file from the SD-card and applies the design");
        RED.main.SetPopOver("#btn-save-json-sd", a+"Saves the current (whole) Design to a .json file on the connected teensy SD-card");
        RED.main.SetPopOver("#btn-load-json-sd", a+"Load/Retreives a saved .json from the connected Teensy SD-Card<br>this is then loaded into this tool.");
        RED.main.SetPopOver("#btn-deploy-osc", a+"Exports this flat (no arrays/no classes) design to a Teensy Running The Dynamic Audio Framework");
        RED.main.SetPopOver("#btn-deploy-osc-group", a+"Exports this grouped (full support) design to a Teensy Running The Dynamic Audio Framework<br><br><b>note. This is under development, and may not yet work as intended.</b>");
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
        RED.storage.update();
        var nns = RED.nodes.createCompleteNodeSet({newVer:true});
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

    $('#btn-deploy-osc').click(function() {
        RED.arduino.export.showIOcheckWarning(do_export);
    });

    $('#btn-deploy-osc-group').click(function () {
        RED.arduino.export.showIOcheckWarning(function() {do_export(true);});
    });
    function do_export(groupBased) {

        var clearAllAddr = "/dynamic/clearAl*";
        if (groupBased == undefined)
            var result = getSimpleExport_bundle(false);
        else
            var result = getGroupExport_bundle(false);
        if (result == undefined) return; // only happens at getGroupExport_bundle

        var bundle = result.bundle;
        try {
            var bundleData = OSC.CreateBundleData(bundle);
            if (RED.OSC.settings.DirectExport == true) {
                OSC.SendData(bundleData);
                return;
            }
        }
        catch (err) {
            OSC.AddLineToLog(err);
        }
        
        // generate human readable export text
        var exportDialogText = ""; // use this for debug output

        for (var i = 0; i < bundle.packets.length; i++) {
            exportDialogText += OSC.GetPacketCompactForm(bundle.packets[i]) + "\n";
        }

        /*exportDialogText += "\nPackets raw data:\n";
        for (var i = 0; i < bundle.packets.length; i++) {
            exportDialogText += new TextDecoder("utf-8").decode(osc.writePacket(bundle.packets[i])) + "\n";
        }*/
        
        var dataAsText = new TextDecoder("utf-8").decode(bundleData);
        
        exportDialogText += "\nTotal AudioObjects:" + result.apos.length + "\n";
        exportDialogText += "Total AudioConnections: " + (result.acs.length/2) + "\n";
        if (bundleData != undefined) // only happen when bundle contain errors
            exportDialogText += "\nRAW data (size "+bundleData.length+" bytes):\n" + dataAsText + "\n";
        RED.view.dialogs.showExportDialog("OSC Export to Dynamic Audio Lib", exportDialogText, " OSC messages: ", {okText:"send", tips:"this just shows the messages to be sent, first in JSON format then in RAW format"},
        function () {OSC.SendData(bundleData);});

    }

    function getSimpleExport_bundle(getBundleOnly) {
        if (getBundleOnly == undefined) getBundleOnly = false;

        RED.storage.update();

        var nns = RED.nodes.createCompleteNodeSet({newVer:false});

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
            if (nns.workspaces[wi].isAudioMain == true) {
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

    function getClassObjects(class_ws, bundle, path) {
        console.error("getClassObjects: " + class_ws.label + " \"" + path + "\"");
        var wildcardArrayItems = RED.OSC.settings.WildcardArrayObjects;

        for (var ni = 0; ni < class_ws.nodes.length; ni++) {
            var n = class_ws.nodes[ni];
            
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs
            if (node._def.nonObject != undefined) continue;

            console.warn("node:" + n.name);

            var _ws = RED.nodes.isClass(n.type);
            if (_ws)
            {
                console.warn("is class");
                var isArray = RED.nodes.isNameDeclarationArray(n.name, class_ws.id, true);
                if (isArray) {
                    console.warn("is array");
                    var name = isArray.name;
                    var count = isArray.arrayLength;
                    bundle.add(OSC.GetCreateGroupAddr(),"ss", name, path)
                    for (var ai = 0; ai < count; ai++)
                    {
                        bundle.add(OSC.GetCreateGroupAddr(),"ss", "i"+ai, path + name);
                        if (wildcardArrayItems == false)
                            getClassObjects(_ws, bundle, path + name + "/i" + ai);
                    }
                    if (wildcardArrayItems == true)
                        getClassObjects(_ws, bundle, path + name + "/i*");
                }
                else {
                    console.warn("is NOT array");
                    bundle.add(OSC.GetCreateGroupAddr(),"ss", n.name, path)
                   
                    getClassObjects(_ws, bundle, path + "/" + n.name);
                    
                }
            }
            else
            {
                console.warn("is NOT class");
                var isArray = RED.nodes.isNameDeclarationArray(n.name, class_ws.id, true);

                if (path == '') {
                    if (isArray) {
                        console.warn("is array");
                        var name = isArray.name;
                        var count = isArray.arrayLength;
                        bundle.add(OSC.GetCreateGroupAddr(),"ss", name, "/");
                        for (var ai = 0; ai < count; ai++)
                        {
                            if (node._def.defaults.inputs == undefined) {
                                bundle.add(OSC.GetCreateObjectAddr(),"sss",n.type, "i"+ai, name);
                            }
                            else {
                                // AudioMixer or any object supporting dynamic count of inputs
                                bundle.add(OSC.GetCreateObjectAddr(),"sssi", n.type, "i"+ai, name, RED.arduino.export.getDynamicInputCount(node, true));
                            }
                        }
                    }
                    else {
                        console.warn("is NOT array");
                        if (node._def.defaults.inputs == undefined) {
                            bundle.add(OSC.GetCreateObjectAddr(),"ss", n.type, n.name);
                        }
                        else {
                            // AudioMixer or any object supporting dynamic count of inputs
                            bundle.add(OSC.GetCreateObjectAddr(),"ssi", n.type, n.name, RED.arduino.export.getDynamicInputCount(node, true));
                        }
                    }
                }
                else { // inside of class
                    
                    if (isArray) {
                        var name = isArray.name;
                        var count = isArray.arrayLength;
                        //console.warn("this happen isArray: " + name);
                        bundle.add(OSC.GetCreateGroupAddr(),"ss", name, path);
                        for (var ai = 0; ai < count; ai++)
                        {
                            if (node._def.defaults.inputs == undefined) {
                                bundle.add(OSC.GetCreateObjectAddr(),"sss", n.type, "i"+ai, path + "/" + name);
                            }
                            else {
                                // AudioMixer or any object supporting dynamic count of inputs
                                bundle.add(OSC.GetCreateObjectAddr(),"sssi", n.type, "i"+ai, path + "/" + name, RED.arduino.export.getDynamicInputCount(node, true));
                            }
                        }
                    }
                    else {
                        //console.warn("this happen: " + n.name);
                        if (node._def.defaults.inputs == undefined) {
                            bundle.add(OSC.GetCreateObjectAddr(),"sss", n.type, n.name, path);
                        }
                        else {
                            // AudioMixer or any object supporting dynamic count of inputs
                            bundle.add(OSC.GetCreateObjectAddr(),"sssi", n.type, n.name, path, RED.arduino.export.getDynamicInputCount(node, true));
                        }
                    }

                }
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

    /**
     * 
     * @param {*} bundle 
     * @param {*} links 
     * @param {*} connectionLocationPath where the connection is created
     * @param {*} srcPath 
     * @param {*} dstPath 
     * @param {*} overrideTargetPort 
     */
    function addLinksToBundle(bundle, links) {
        for (var li = 0; li < links.length; li++) {
            var link = links[li];
            if ((link.target.type == "TabOutput") || (link.source.type == "TabInput")) continue; // failsafe for TabInput or TabOutput objects

            var srcName = GetNameWithoutArrayDef(link.source.name);
            var dstName = GetNameWithoutArrayDef(link.target.name);
            var srcPort = link.sourcePort;
            var dstPort = link.targetPort;

            var linkName = OSC.GetLinkName(link);

            
            
            //if (overrideTargetPort != undefined) dstPort = overrideTargetPort;
            if (link.linkPath == "") {
                console.warn("path / " + linkName);
                bundle.add(OSC.GetCreateConnectionAddr(),"ss", linkName);
                bundle.add(OSC.GetConnectAddr(linkName),"sisi", "/" + srcName, srcPort, "/" + dstName, dstPort);
            }
            else {
                // first fix missing / but only if the strings are not empty
                // otherwise there will be duplicate // at the beginnings
                if (link.linkPath.startsWith("/") == false && link.linkPath != "") link.linkPath = "/"+link.linkPath;
                if (link.sourcePath.startsWith("/") == false && link.sourcePath != "") link.sourcePath = "/"+link.sourcePath;
                if (link.targetPath.startsWith("/") == false && link.targetPath != "") link.targetPath = "/"+link.targetPath;

                console.warn("path " + link.linkPath + " " + linkName);
                bundle.add(OSC.GetCreateConnectionAddr(),"ss", linkName, link.linkPath);
                bundle.add(OSC.GetConnectAddr(link.linkPath +"/"+ linkName),"sisi", link.sourcePath + "/" + srcName, srcPort, link.targetPath + "/" + dstName, dstPort);
            }
        }
    }
    
    function getGroupExport_bundle(getBundleOnly) {
        if (getBundleOnly == undefined) getBundleOnly = false;

        RED.storage.update();

        var nns = RED.nodes.createCompleteNodeSet({newVer:true}); // true mean we get the new structure

        var mainWorkSpace = findMainWs(nns);
        if (mainWorkSpace == -1) {
            RED.main.verifyDialog("Warning", "Audio Main Entry Tab not set", "Please set the Audio Main Entry tab<br> double click the tab that you want as the main and check the 'Audio Main File' checkbox.<br><br>note. if you select many tabs as audio main only the first is used.", function() {});
            return;
        }
        var apos = []; // Audio Processing Objects
        var acs = []; // Audio Connections 
        var ws = nns.workspaces[mainWorkSpace];
        var bundle = OSC.CreateBundle(0);
        bundle.add(OSC.GetClearAllAddr());
        bundle.add("/comment", "s", "**************************");
        bundle.add("/comment", "s", "*** create all objects ***");
        bundle.add("/comment", "s", "**************************");
        getClassObjects(ws, bundle, ''); // now this is working so uncomment it until we get getClassConnections working
        bundle.add("/comment", "s", "************************************");
        bundle.add("/comment", "s", "*** create all audio connections ***");
        bundle.add("/comment", "s", "************************************");
        var links = [];
        RED.export.getClassConnections(ws, links, '');
        console.log(RED.export.printLinksDebug(links));
        addLinksToBundle(bundle, links);

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
                var src = RED.nodes.getWireInputSourceNode(RED.nodes.node(n.id), 0);
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

    return {
        getSimpleExport_bundle:getSimpleExport_bundle,
        InitButtonPopups:InitButtonPopups
    };
})();