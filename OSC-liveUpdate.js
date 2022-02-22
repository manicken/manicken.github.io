
OSC.LiveUpdate = (function() {


    function NodeAdded(node) {
        // skip if not liveupdate
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (RED.OSC.settings.ShowOutputDebug == true)
            OSC.AddLineToLog("added node (" + node.type + ") " + node.name);

        if (node._def.nonObject != undefined) return; // don't care about non audio objects
        var createAt = [];
        if (RED.nodes.getWorkspace(node.z).isAudioMain == false) {
            // how to know where to create if not root
            // it can be fixed, but would not prioritize it for now
            // to fix this there can only be one active audio main
            // the active one mean the one from the first export was done
            // then from the point of that main get att paths that leads to the current tab/class
            // thoose will be the targets
            // createAt = ????
            OSC.AddLineToLog("Warning: cannot add node live (" + node.type + ") " + node.name + " because this is not created at root", undefined, "background-color:#fcf8e3;");
            return;
        }

        if (node._def.isClass != undefined) {
            if (createAt.length == 0) { // create at root
                OSC.SendMessage(OSC.CreateGroupAddr,"ss", node.name, "/");
                // TODO: fetch all class items
                // inclusive links
            }
        }
        else if (node._def.dynInputs == undefined) {//if (node._def.defaults.inputs == undefined) // if inputs is defined in defaults that mean it's user editable
            if (createAt.length == 0) { // create at root
                OSC.SendMessage(OSC.CreateObjectAddr,"ss", node.type, node.name);
            }
        }
        else {
            if (createAt.length == 0) { // create at root
                OSC.SendMessage(OSC.CreateObjectAddr,"ssi", node.type, node.name, node.inputs);
            }
        }
        
    }

    function NodeRenamed(node, oldName) {
        // skip if not liveupdate
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        // TODO. this function must take care of when a node is changed to/from array type
        // that would actually mean that this function need to split into four parts
        // 1. normal rename
        // 2. array object rename
        // 3. array resized
        // 4. to/from array happens

        if (node.name.includes("[") == true && oldName.includes("[") == false) {
            console.log("node is now array");
        }
        else if (node.name.includes("[") == false && oldName.includes("[") == true) {
            console.log("node was array");
        }
        else if (node.name.includes("[") == true && oldName.includes("[") == true) {
            console.log("node is still array");
        }
        else {
            console.log("node is still non array");
        }
        var bundle = OSC.CreateBundle();

        var links = RED.nodes.cwsLinks.filter(function(d) { return (d.source === node) || (d.target === node);});
		for (var i=0;i<links.length;i++) {
            var link = links[i];
            
            var newLinkName = RED.export.links.GetName(link);
            var oldLinkName = newLinkName.split(node.newName).join(oldName);
            bundle.add(OSC.RenameObjectAddr, "ss", oldLinkName, newLinkName);
            
            if (RED.OSC.settings.ShowOutputDebug == true)
                OSC.AddLineToLog("renamed link: " + oldLinkName + " to " + newLinkName);
        }
        bundle.add(OSC.RenameObjectAddr, "ss", oldName, node.newName);
        
        OSC.SendBundle(bundle);

        if (RED.OSC.settings.ShowOutputDebug == true)
            OSC.AddLineToLog("renamed node from " + oldName + " to " + node.newName);
    }

    function NodeRemoved(node, links) {
        // skip if not liveupdate
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var bundle = OSC.CreateBundle();
        AddLinksRemovedToBundle(bundle, links);
        bundle.add(OSC.DestroyObjectAddr, "s", node.name);
        OSC.SendBundle(bundle);

        if (RED.OSC.settings.ShowOutputDebug == true)
            OSC.AddLineToLog("removed node " + node.name);
    }

    function LinkAdded(link) {
        if (RED.OSC.settings.LiveUpdate == false) return;
        
        if (NodeInputsUpdated_postponed == true) {
            NodeInputsUpdated(NodeInputsUpdated_postponed_node, 
                              NodeInputsUpdated_postponed_oldCount,
                              NodeInputsUpdated_postponed_newCount,
                              NodeInputsUpdated_postponed_removedLinks);
        }

        if (link.info.valid == false) {
            OSC.AddLineToLog("Warning invalid link skipped: ("+link.info.inValidText+")<br>" + RED.export.links.getDebug(link), undefined, "background-color:#fcf8e3;");
            return;
        }
        if (link.info.isBus) {
            OSC.AddLineToLog("Warning (cannot create 'bus links' live yet), skipped: <br>" + RED.export.links.getDebug(link), undefined, "background-color:#fcf8e3;");
            return;
        }
        if (link.source.isArray != undefined || link.target.isArray != undefined) {
            OSC.AddLineToLog("Warning (cannot create 'array' links live yet), skipped: <br>" + RED.export.links.getDebug(link), undefined, "background-color:#fcf8e3;");
            return;
        }
        
        var bundle = OSC.CreateBundle();
        if (link.target._def.dynInputs != undefined){
            
        }
            
        var linkName = RED.export.links.GetName(link);
        bundle.add(OSC.CreateConnectionAddr, "s", linkName);
        if (link.target._def.dynInputs == undefined)
            bundle.add(OSC.GetConnectAddr(linkName), "sisi", link.source.name, link.sourcePort, link.target.name, link.targetPort);
        else {
            var nextFreeIndex = RED.export.links.getDynInputDynSizePortStartIndex(link.target, link.source, link.sourcePort);
            bundle.add(OSC.GetConnectAddr(linkName), "sisi", link.source.name, link.sourcePort, link.target.name, nextFreeIndex);
        }

        OSC.SendBundle(bundle);
        
        if (RED.OSC.settings.ShowOutputDebug == true)
            OSC.AddLineToLog("added link [" + linkName  + "] " + RED.export.links.getDebug(link, {simple:true}));
    }
    
    function LinkRemoved(link) {
        // skip if not liveupdate
        if (RED.OSC.settings.LiveUpdate == false) return;

        var linkName = RED.export.links.GetName(link);
        OSC.SendMessage(OSC.DestroyObjectAddr,"s", linkName);

        if (RED.OSC.settings.ShowOutputDebug == true)
            OSC.AddLineToLog("removed link [" + linkName  + "] " + RED.export.links.getDebug(link, {simple:true}));
    }
    var NodeInputsUpdated_postponed = false;
    var NodeInputsUpdated_postponed_node = {};
    var NodeInputsUpdated_postponed_oldCount = 0;
    var NodeInputsUpdated_postponed_newCount = 0;
    var NodeInputsUpdated_postponed_removedLinks = [];

    function NodeInputsUpdated(node, oldCount, newCount, removedLinks, dynExpand) {
        // skip if not liveupdate
        if (RED.OSC.settings.LiveUpdate == false) return;
        // skip non dynamic input objects
        if (node._def.dynInputs == undefined) return;

        OSC.AddLineToLog(node.name + " node inputs changed from " + oldCount + " to " + newCount + (removedLinks?(", removedLinks.length:" + removedLinks.length):", remLL:0"));
        console.warn(node.name + " node inputs changed from " + oldCount + " to " + newCount);

        if (newCount < oldCount) { OSC.AddLineToLog("skipping because newCount < oldCount");return; }// no changes needed for now, TODO add setting so the end user could decide what happens

        // this event happens to early, so the new links added what leaded to this change
        // have not yet been added
        if (dynExpand != undefined && dynExpand == true && NodeInputsUpdated_postponed == false) {
            NodeInputsUpdated_postponed = true;
            NodeInputsUpdated_postponed_node = node;
            NodeInputsUpdated_postponed_oldCount = oldCount;
            NodeInputsUpdated_postponed_newCount = newCount;
            NodeInputsUpdated_postponed_removedLinks = removedLinks;
            console.log("NodeInputsUpdated postponed until link add event");
            console.trace();
            return;
        }
        NodeInputsUpdated_postponed = false;
        newCount = RED.export.links.getDynInputDynSizePortStartIndex(node, null);

        var ws = RED.nodes.getWorkspace(node.z);
        var linksToUpdate = ws.links.filter(function(l) { return (l.source === node) || (l.target === node); });

        var bundle = OSC.CreateBundle();
        if (removedLinks != undefined) AddLinksRemovedToBundle(bundle, removedLinks); // destroy additional links
        AddLinksRemovedToBundle(bundle, linksToUpdate); // destroy other links temporary
        bundle.add(OSC.DestroyObjectAddr, "s", node.name); // destroy node temporary to change number of inputs
        bundle.add(OSC.CreateObjectAddr,"ssi", node.type, node.name, newCount); // create new node with new number of inputs
        AddLinksToCreateToBundle(bundle, linksToUpdate); // recreate other links again
        OSC.SendBundle(bundle);
    }

    // ******************************
    // ***** helper functions *******
    // ******************************
    function AddLinksToCreateToBundle(bundle, links) {
        for (var i = 0; i < links.length; i++) {
            var l = links[i];
            var linkName = RED.export.links.GetName(l);
            bundle.add(OSC.CreateConnectionAddr, "s", linkName);
            bundle.add(OSC.GetConnectAddr(linkName), "sisi", l.source.name, l.sourcePort, l.target.name, l.targetPort);
        }
    }
    
    function AddLinksRemovedToBundle(bundle, links) {
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (RED.OSC.settings.ShowOutputDebug == true)
                OSC.AddLineToLog("removed link " + RED.export.links.getDebug(link, {simple:true}));
            var linkName = RED.export.links.GetName(link);
            bundle.add(OSC.DestroyObjectAddr, "s", linkName);
        }
    }

    function RegisterEvents() {
        RED.events.on("nodes:add", NodeAdded);
        RED.events.on("nodes:renamed", NodeRenamed);
        RED.events.on("nodes:inputsUpdated", NodeInputsUpdated); // happens when the input count is changed is usually fired from nodes.js (NodeInputsChanged)
        RED.events.on("nodes:removed", NodeRemoved); // note usage of nodes:removed instead of the normal nodes:remove
        RED.events.on("links:add", LinkAdded);
        RED.events.on("links:remove", LinkRemoved);
    }

    return {
        RegisterEvents
    };

})();