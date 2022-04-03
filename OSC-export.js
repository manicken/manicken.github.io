class PacketArray extends Array {
    add(firstArg, valueTypes, ...values) {
        if (typeof firstArg == "object")
            this.push(firstArg);
        else
            this.push(OSC.CreatePacket(firstArg, valueTypes, ...values)); // super shortcut so we can now do bundle.add("/addr", "s", "string")){
    }
}

OSC.export = (function () {

    var ActiveAudioMain;
    function InitButtonPopups(notavailable) {
        var a = "";
        if (notavailable != undefined && notavailable == true)
            a = "Currently not available at the current browser<br>as this functionality currently is implemented using the Web Serial API<br>in the future WebSockets will be supported that will then enable this functionality.<br><br>"
        RED.main.SetPopOver("#btn-save-osc-sd", a+"Saves the current (only audio nodes+links) Design to the connected Teensy SD-Card as a file with the extension .osc<br>so that it can later be loaded using 'Load .osc from SD-card'");
        RED.main.SetPopOver("#btn-load-osc-sd", a+"Loads a .osc file from the SD-card and applies the design");
        RED.main.SetPopOver("#btn-save-json-sd", a+"Saves the current (whole) Design to a .json file on the connected teensy SD-card");
        RED.main.SetPopOver("#btn-load-json-sd", a+"Load/Retreives a saved .json from the connected Teensy SD-Card<br>this is then loaded into this tool.");
        RED.main.SetPopOver("#btn-export-osc", a+"Exports this flat (no arrays/no classes) design to a Teensy Running The Dynamic Audio Framework");
        RED.main.SetPopOver("#btn-export-osc-group", a+"Exports this grouped (full support) design to a Teensy Running The Dynamic Audio Framework<br><br><b>note. This is under development, and may not yet work as intended.</b>");
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

    $('#btn-export-osc').click(function() {
        RED.arduino.export.showIOcheckWarning(do_export);
    });

    $('#btn-export-osc-group').click(function () {
        RED.arduino.export.showIOcheckWarning(function() {do_export(true);});
    });

    function removeBundleComments(bundle){
        for (var i = bundle.packets.length-1; i >= 0; i--) {
            if (bundle.packets[i].address.startsWith("//"))
                bundle.packets.splice(i,1);
        }
    }
    function do_export(groupBased) {

        var clearAllAddr = "/dynamic/clearAl*";
        if (groupBased == undefined)
            //var result = getSimpleExport_bundle(false);
            var result = getSimpleExport_bundle(false);
        else
            var result = getGroupExport_bundle(false);
        if (result == undefined) return; // only happens at getGroupExport_bundle

        var bundle = result.bundle;
        
        
        // generate human readable export text
        var exportDialogText = ""; // use this for debug output

        exportDialogText = OSC.GetBundleCompactForm(bundle);
        /*for (var i = 0; i < bundle.packets.length; i++) {
            exportDialogText += OSC.GetPacketCompactForm(bundle.packets[i]) + "\n";
        }*/
        removeBundleComments(bundle);
        try {
            if (RED.OSC.settings)
            var bundleData = OSC.CreateBundleData(bundle);
            if (RED.OSC.settings.DirectExport == true) {
                OSC.SendData(bundleData);
                return;
            }
        }
        catch (err) {
            OSC.AddLineToLog("OSC.CreateBundleData err",err);
            console.log(bundle);
        }
        
        var dataAsText = OSC.getDataArrayAsAsciiAndHex(bundleData).split('\n').join('<br>').split('<').join('&lt;').split('>').join('&gt;').split('\0').join('&Oslash;');
        
        exportDialogText += "\nTotal AudioObjects:" + result.aposCount + "\n";
        exportDialogText += "Total AudioConnections: " + (result.acsCount/2) + "\n";
        if (bundleData != undefined) // only happen when bundle contain errors
            exportDialogText += "\nRAW data (size "+bundleData.length+" bytes):\n" + dataAsText + "\n";
        RED.view.dialogs.showExportDialog("OSC Export to Dynamic Audio Lib", exportDialogText, " OSC messages: ", {okText:"send", tips:"this just shows the messages to be sent, first in JSON format then in RAW format"},
        function () {OSC.SendData(bundleData);});

    }

    

    function fixLeadingSlash(text) {
        if (text.startsWith("/"))
            return text;
        else
            return "/" + text
    }

    /**
     * 
     * @param {workspaceObject} class_ws 
     * @param {PacketArray} packets 
     * @param {String} path 
     */
    function addObjectsToPacketArray(class_ws, packets, path) {
        //console.error("getClassObjects: " + class_ws.label + " \"" + path + "\"");
        var wildcardArrayItems = RED.OSC.settings.WildcardArrayObjects;

        for (var ni = 0; ni < class_ws.nodes.length; ni++) {
            var n = class_ws.nodes[ni];
            
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs
            if (node._def.nonObject != undefined) continue;

            //console.warn("node:" + n.name);

            var _ws = n._def.isClass;//RED.export.isClass(n.type);
            if (_ws)
            {
                if (_ws.export == false) continue; // skip inactive objects
                //console.warn("is class");
                //var isArray = n.isArray;//RED.export.isNameDeclarationArray(n.name, class_ws.id, true);
                if (n.isArray) {
                    //console.warn("is array");
                    var name = n.isArray.name;
                    var count = n.isArray.arrayLength;
                    packets.add(OSC.GetCreateGroupAddr(),"ss", name, fixLeadingSlash(path))
                    for (var ai = 0; ai < count; ai++)
                    {
                        packets.add(OSC.GetCreateGroupAddr(),"ss", "i"+ai, fixLeadingSlash(path + name));
                        if (wildcardArrayItems == false)
                            addObjectsToPacketArray(_ws, packets, path + name + "/i" + ai);
                    }
                    if (wildcardArrayItems == true)
                        addObjectsToPacketArray(_ws, packets, path + name + "/i*");
                }
                else {
                    //console.warn("is NOT array");
                    packets.add(OSC.GetCreateGroupAddr(),"ss", n.name, fixLeadingSlash(path))
                   
                    addObjectsToPacketArray(_ws, packets, path + "/" + n.name);
                    
                }
            }
            else
            {
                //console.warn("is NOT class");
                //var isArray = n.isArray;//RED.export.isNameDeclarationArray(n.name, class_ws.id, true);

                if (path == '') {
                    if (n.isArray) {
                        //console.warn("is array");
                        var name = n.isArray.name;
                        var count = n.isArray.arrayLength;
                        packets.add(OSC.GetCreateGroupAddr(),"ss", name, "/");
                        for (var ai = 0; ai < count; ai++)
                        {
							var grpName = "i"+ai; // this exact name is needed if the object provides its own OSC constructor
							
                            if (node._def.dynInputs == undefined) { //if (node._def.defaults.inputs == undefined) {
								if (node._def.makeConstructor == undefined)
									packets.add(OSC.GetCreateObjectAddr(),"sss",n.type, grpName, fixLeadingSlash(name));
								else
									eval(node._def.makeConstructor.group);	
                            }
                            else {
                                // AudioMixer or any object supporting dynamic count of inputs
                                var inputCount = RED.export.links.getDynInputDynSizePortStartIndex(node, null);
                                node.RealInputs = inputCount;
                                packets.add(OSC.GetCreateObjectAddr(),"sssi", n.type, grpName, fixLeadingSlash(name), inputCount);//RED.arduino.export.getDynamicInputCount(node, true));
                            }
                        }
                    }
                    else {
                        //console.warn("is NOT array");
                        if (node._def.dynInputs == undefined) { //if (node._def.defaults.inputs == undefined) {
							if (node._def.makeConstructor == undefined)
								packets.add(OSC.GetCreateObjectAddr(),"ss", n.type, n.name);
							else
								eval(node._def.makeConstructor.root);
                        }
                        else {
                            // AudioMixer or any object supporting dynamic count of inputs
                            var inputCount = RED.export.links.getDynInputDynSizePortStartIndex(node, null);
                            node.RealInputs = inputCount;
                            packets.add(OSC.GetCreateObjectAddr(),"ssi", n.type, n.name, inputCount);//RED.arduino.export.getDynamicInputCount(node, true));
                        }
                    }
                }
                else { // inside of class
                    
                    if (n.isArray) {
                        var name = n.isArray.name;
                        var count = n.isArray.arrayLength;
                        //console.warn("this happen isArray: " + name);
                        packets.add(OSC.GetCreateGroupAddr(),"ss", name, path);
                        for (var ai = 0; ai < count; ai++)
                        {
							var grpName = "i"+ai; // this exact name is needed if the object provides its own OSC constructor

                            if (node._def.dynInputs == undefined) { //if (node._def.defaults.inputs == undefined) {
                                packets.add(OSC.GetCreateObjectAddr(),"sss", n.type, grpName, fixLeadingSlash(path + "/" + name));
                            }
                            else {
                                // AudioMixer or any object supporting dynamic count of inputs
                                packets.add(OSC.GetCreateObjectAddr(),"sssi", n.type, grpName, fixLeadingSlash(path + "/" + name), RED.export.links.getDynInputDynSizePortStartIndex(node, null));//RED.arduino.export.getDynamicInputCount(node, true));
                            }
                        }
                    }
                    else {
                        //console.warn("this happen: " + n.name);
						var grpName = fixLeadingSlash(path); // this exact name is needed if the object provides its own OSC constructor
						
                        if (node._def.dynInputs == undefined) { //if (node._def.defaults.inputs == undefined) {
							if (node._def.makeConstructor == undefined)
								packets.add(OSC.GetCreateObjectAddr(),"sss", n.type, n.name, grpName);
							else
								eval(node._def.makeConstructor.group);
                        }
                        else {
                            // AudioMixer or any object supporting dynamic count of inputs
                            var inputCount = RED.export.links.getDynInputDynSizePortStartIndex(node, null);
                            node.RealInputs = inputCount;
                            packets.add(OSC.GetCreateObjectAddr(),"sssi", n.type, n.name, grpName, inputCount);//RED.arduino.export.getDynamicInputCount(node, true));
                        }
                    }
                }
            }
        }
    }

    // need function
    function addLinksToRenameToPacketArray(packets, links, newName, oldName) {
        for (var li = 0; li < links.length; li++) {
            addLinkToRenameToPacketArray(packets, links[li], newName, oldName);
        }
    }
    function addLinkToRenameToPacketArray(packets, l, newName, oldName) {
        if (l.invalid != undefined) {
            packets.add("//********************************************");
            packets.add("//  " + l.invalid);
            packets.add("//********************************************");
            return;
        }
        if ((l.target.type == "TabOutput") || (l.source.type == "TabInput")) return; // failsafe for TabInput or TabOutput objects

        var newLinkName = RED.export.links.GetName(l);
        var linkPath = l.linkPath||""; // make this work for standard links
        var oldLinkName = newLinkName.replace(newName, oldName);
        
        if (linkPath == "") {
            packets.add(OSC.RenameObjectAddr,"ss", oldLinkName, newLinkName);
        }
        else {
            packets.add(OSC.RenameObjectAddr,"ss", linkPath + '/' + oldLinkName, linkPath + '/' + newLinkName);
        }
    }
    
    /**
     * 
     * @param {*} packets 
     * @param {*} links 
     * @param {*} connectionLocationPath where the connection is created
     * @param {*} srcPath 
     * @param {*} dstPath 
     * @param {*} overrideTargetPort 
     */
    function addLinksToCreateToPacketArray(packets, links) {
        for (var li = 0; li < links.length; li++) {
            addLinkToCreateToPacketArray(packets, links[li]);
        }
    }
    function addLinkToCreateToPacketArray(packets,l) {
        if (l.invalid != undefined) {
            packets.add("//********************************************");
            packets.add("//  " + l.invalid);
            packets.add("//********************************************");
            return;
        }
        
        if ((l.target.type == "TabOutput") || (l.source.type == "TabInput")) return; // failsafe for TabInput or TabOutput objects

        // l.sourceName and l.targetName will be set by RED.export.links.expandArrays if used
        var srcName = l.sourceName||l.source.name;//RED.export.GetNameWithoutArrayDef(l.source.name);
        var dstName = l.targetName||l.target.name;//RED.export.GetNameWithoutArrayDef(l.target.name);
        //var srcName = link.source.name;
        //var dstName = link.target.name;
        var sourcePort = parseInt(l.sourcePort); // failsafe
        var targetPort = parseInt(l.targetPort); // failsafe
        
        //packets.add("//");

        var linkName = RED.export.links.GetName(l);
        l.exportLinkName = linkName;
        var sourcePath = l.sourcePath||"";
        var targetPath = l.targetPath||"";
        var linkPath = l.linkPath||""; // make this work for standard links
        
        //if (overrideTargetPort != undefined) dstPort = overrideTargetPort;
        if (linkPath == "") {
            //console.warn("root path / " + linkName);
            if (sourcePath.startsWith("/") == false && sourcePath != "") sourcePath = "/"+sourcePath;
            if (targetPath.startsWith("/") == false && targetPath != "") targetPath = "/"+targetPath;

            packets.add(OSC.GetCreateConnectionAddr(),"s", linkName);
            //packets.add(OSC.GetConnectAddr(linkName),"sisi", "/" + srcName, srcPort, "/" + dstName, dstPort);
            packets.add(OSC.GetConnectAddr(linkName),"sisi", sourcePath + "/" + srcName, sourcePort, targetPath + "/" + dstName, targetPort);
        }
        else {
            // first fix missing / but only if the strings are not empty
            // otherwise there will be duplicate // at the beginnings
            if (linkPath.startsWith("/") == false) linkPath = "/"+linkPath;
            if (sourcePath.startsWith("/") == false && sourcePath != "") sourcePath = "/"+sourcePath;
            if (targetPath.startsWith("/") == false && targetPath != "") targetPath = "/"+targetPath;

            //console.warn("path " + linkPath + " " + linkName);
            packets.add(OSC.GetCreateConnectionAddr(),"ss", linkName, linkPath);
            packets.add(OSC.GetConnectAddr(linkPath +"/"+ linkName),"sisi", sourcePath + "/" + srcName, sourcePort, targetPath + "/" + dstName, targetPort);
        }
    }

    function addLinksToDestroyToPacketArray(packets, links) {
        for (var li = 0; li < links.length; li++) {
            addLinkToDestroyToPacketArray(packets, links[li])
        }
    }
    function addLinkToDestroyToPacketArray(packets,l) {
        if (l.invalid != undefined) {
            packets.add("//********************************************");
            packets.add("//  " + l.invalid);
            packets.add("//********************************************");
            return;
        }
        if ((l.target.type == "TabOutput") || (l.source.type == "TabInput")) return; // failsafe for TabInput or TabOutput objects

        var linkName = RED.export.links.GetName(l);
        var linkPath = l.linkPath||""; // make this work for standard links
        
        if (linkPath == "") {
            packets.add(OSC.DestroyObjectAddr,"s", linkName);
        }
        else {
            packets.add(OSC.DestroyObjectAddr,"ss", linkName, linkPath);
        }
    }
    
    function getGroupExport_bundle(getBundleOnly) {
        if (getBundleOnly == undefined) getBundleOnly = false;

        RED.storage.update();

        //RED.export.project = RED.nodes.createCompleteNodeSet({newVer:true}); // true mean we get the new structure

        var foundMains = RED.export.findMainWs();
        var mainWorkSpaceIndex;

        if (foundMains == undefined) {
            RED.main.verifyDialog("Warning", "Audio Main Entry Tab not set", "Please set the Audio Main Entry tab<br> double click the tab that you want as the main and check the 'Audio Main File' checkbox.<br><br>note. if you select many tabs as audio main only the first is used.", function() {});
            return;
        }

        if (foundMains.items.length > 1) { // multiple AudioMain found
            if (foundMains.mainSelected != -1)
                mainWorkSpaceIndex = foundMains.mainSelected;
            else
                mainWorkSpaceIndex = foundMains.items[0]; // get the first one
        }
        else
            mainWorkSpaceIndex = foundMains.items[0]; // get the only one

        console.warn("AudioMain ", mainWorkSpaceIndex);

        // usage of PacketArray so that we can add OSC packets easly to it
        var apos = new PacketArray(); // Audio Processing Objects
        var acs = new PacketArray(); // Audio Connections 

        var ws = RED.nodes.workspaces[mainWorkSpaceIndex];
        ActiveAudioMain = ws; // this is used by the live edit to determine the path:s for used objects

        console.warn("AudioMain ", mainWorkSpaceIndex, ws);
        addObjectsToPacketArray(ws, apos, '');
        var links = [];
        RED.export.links.getClassConnections(ws, links, ''); // this is a recursive function
        //console.log(RED.export.links.getDebug(links));
        links = RED.export.links.expandArrays(links);// for the moment this fixes array defs that the getClassConnections don't currently solve
        console.log(RED.export.links.getDebug(links));
        RED.export.links.fixTargetPortsForDynInputObjects(links);
        console.log(RED.export.links.getDebug(links));

        setLinksExport(links);
        // as the instancied classes gets the wrong names?

        console.log(RED.export.links.getDebug(links));
        addLinksToCreateToPacketArray(acs, links);

        var bundle = OSC.CreateBundle(0);
        bundle.add(OSC.GetClearAllAddr());
        bundle.add("//**************************");
        bundle.add("//*** create all objects ***");
        bundle.add("//**************************");
        bundle.addPackets(apos); // first add all Audio Processing Objects
        bundle.add("//************************************");
        bundle.add("//*** create all audio connections ***");
        bundle.add("//************************************");
        bundle.addPackets(acs); // second add all Audio Connections

        if (getBundleOnly == true) return bundle;
        else return {bundle:bundle, aposCount:apos.length, acsCount:acs.length};
    }

    function setLinksExport(links) {
        // first clear prev export info
        for (var li=0;li<links.length;li++) {
            var l = links[li];
            if (l.invalid != undefined) continue; // skip invalid/debug info links
            l.origin.export = [];
        }
        // then append the new export info
        // to each origin link
        for (var li=0;li<links.length;li++) {
            var l = links[li];
            if (l.invalid != undefined) continue; // skip invalid/debug info links
            l.origin.export.push(l);
        }
    }

    function getSimpleExport_bundle(getBundleOnly) {
        if (getBundleOnly == undefined) getBundleOnly = false;
        RED.storage.update(); // this will also sort the nodes
        //RED.export.project = RED.nodes.createCompleteNodeSet({newVer:true}); // used by isClass and getDynInputDynSizePortStartIndex
        //var activeWorkspace = RED.view.activeWorkspace;
        var apos = new PacketArray(); // Audio Processing Objects
        var acs = new PacketArray(); // Audio Connections 
        //var nodes = RED.nodes.nodes; // this actually returns the current workspace nodes only
        var ws = RED.nodes.getWorkspace(RED.view.activeWorkspace);
        //RED.nodes.wsEachNode(ws, function(node) {
        for (var i = 0; i < ws.nodes.length; i++) {
            var node = ws.nodes[i];
        //    if (node.z != activeWorkspace) continue; // workspace filter
            if (node._def.nonObject != undefined) continue; // _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes
            
            if (node._def.dynInputs == undefined) //if (node._def.defaults.inputs == undefined) 
                apos.add(OSC.GetCreateObjectAddr(),"ss", node.type, node.name);
            else // only happens for dynamic input objects
                apos.add(OSC.GetCreateObjectAddr(),"ssi", node.type, node.name, node.inputs);

            var links = ws.links.filter(function (l) {return l.source === node});
            addLinksToCreateToPacketArray(acs, links);
        }
        var bundle = OSC.CreateBundle(0);
        bundle.add(OSC.GetClearAllAddr());
        bundle.addPackets(apos); // first add all Audio Processing Objects
        bundle.addPackets(acs); // second add all Audio Connections
        if (getBundleOnly == true)  return bundle;
        else return {bundle:bundle, aposCount:apos.length, acsCount:acs.length};
    }

    return {
        getSimpleExport_bundle,
        getGroupExport_bundle,
        InitButtonPopups,
        addLinksToCreateToPacketArray,
        addLinksToDestroyToPacketArray,
        addLinksToRenameToPacketArray,
        get ActiveAudioMain() {return ActiveAudioMain;},
    };
})();