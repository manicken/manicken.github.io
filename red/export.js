/* would contain all helper functions needed for exporting */


RED.export = (function () {

    function getClassConnections(class_ws, links, currPath) {
        console.log("*******************************************");
        console.error("getClassConnections  path: \"" + currPath + "\"");
        for (var ni = 0; ni < class_ws.nodes.length; ni++) {
            var n = class_ws.nodes[ni];
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs
            if (node._def.nonObject != undefined) continue;
            var clinks = RED.nodes.links.filter(function(l) { return (l.source === node) && (l.source.type != "TabInput") && (l.target.type != "TabOutput"); });
            clinks.sort(function (a,b) {return a.target.y < b.target.y;})

            var _ws = RED.nodes.isClass(n.type);
            if (_ws)
            {
                console.warn("is class: " + n.name);
                // just disable all array detection for now
                // should have that in a seperate function
                // called expandArrays(links)

                /*var isArray = RED.nodes.isNameDeclarationArray(n.name, _ws.id, true);
                if (isArray) {
                    console.warn("  is array");
                    var name = isArray.name;
                    var count = isArray.arrayLength
                    for (var ai = 0; ai < count; ai++)
                    {
                        //console.error("this 1 @ " + path +" "+ name + "/i" + ai);
                        // TODO. fix this
                        var newPath = currPath + name + "/i" + ai;
                        links.pushArray(expandLinks(clinks, currPath, "i"+ai));
                        console.log("*************************************************************************");
                        console.log("*** adding connections inside "+ _ws.label + " ****************************");
                        console.log("*************************************************************************");
                        getClassConnections(_ws, links, newPath);
                    }
                }
                else {
                    console.warn("  is NOT array");
                    //console.error("this 2 @ " + path + " " + n.name);
                    //var newPath = currPath +"/"+ n.name;*/
                    links.pushArray(expandLinks(clinks, currPath));
                    console.log("*************************************************************************");
                    console.log("*** adding connections inside "+ _ws.label + " ****************************");
                    console.log("*************************************************************************");
                    getClassConnections(_ws, links, n.name);
                //}
            }
            else 
            {
                console.warn("is NOT class: " + n.name);

                /*var isArray = RED.nodes.isNameDeclarationArray(n.name, class_ws.id, true);
                if (isArray) {
                    console.warn("  is array");
                    var name = isArray.name;
                    var count = isArray.arrayLength
                    
                    for (var ai = 0; ai < count; ai++)
                    {
                        // TODO. fix this
                        //var newPath = currPath + name + "/i" + ai;
                        links.pushArray(expandLinks(clinks, currPath, "i"+ai));
                    }
                }
                else {
                    console.warn("  is NOT array");*/
                    links.pushArray(expandLinks(clinks, currPath));
                //}
            }
        }
    }

    function copyLink(l, defaultPath, arrayIndex) {
        return { linkPath:l.linkPath?l.linkPath:defaultPath, arrayIndex:l.arrayIndex?l.arrayIndex:arrayIndex,
                 source:l.source, sourcePort:parseInt(l.sourcePort), sourcePath:l.sourcePath?l.sourcePath:defaultPath,
                 target:l.target, targetPort:parseInt(l.targetPort), targetPath:l.targetPath?l.targetPath:defaultPath,
                 origin:l.origin?l.origin:l};
    }

    function getFinalSource(l,ws) {
        console.warn("l.source isclass " + l.source.name + " to " + l.target.name);

        var port = RED.nodes.getClassIOport(ws.id, "Out", l.sourcePort);
        var newSrc = RED.nodes.getWireInputSourceNode(port.node, 0); // TODO. take care of bus output TabOutputs
        l.sourcePath = l.sourcePath + "/" + l.source.name;
        l.source = newSrc.node;
        l.sourcePort = newSrc.srcPortIndex;
        var _ws = RED.nodes.isClass(l.source.type);
        if (_ws)
        {
            getFinalSource(l,_ws);
        }
    }

    /**
     * returns multiple
     * audioconnections/linknames, i.e. when many wires connect from
     * a TabInput inside a class
     * then the following cases
     * if source is class and dest. is normal
     * if source is normal and dest. is class
     * if source is class and dest. is class
     * @param {*} links 
     */
     function expandLinks(links,classPath,arrayIndex) {
        console.log("*******************************************");
        console.error("expandLinks classPath:\"" + classPath);
        var newLinks = [];
        var ws;
        for (var li = 0; li < links.length; li++)
        {
            var l = links[li];
            var newLink = copyLink(l, classPath, arrayIndex);
            //if (arrayIndex != undefined)
            //    newLink.arrayIndex = arrayIndex;

            // TODO: to early to check this?
            /*if (newLink.arrayIndex != undefined) {
                console.log("expandLinks: is array " + newLink.arrayIndex+ " (" + newLink.sourcePath + ") (" + newLink.targetPath + ")");
                var source = l.origin?l.origin.source:l.source;
                var target = l.origin?l.origin.target:l.target;
                var isArray = RED.nodes.isNameDeclarationArray(source.name, source.z, true);
                if (isArray) newLink.sourcePath = GetNameWithoutArrayDef(newLink.sourcePath) + "/" + l.arrayIndex;
                if (isArray) console.warn("source isArray: " + source.name);
                isArray = RED.nodes.isNameDeclarationArray(target.name, target.z, true);
                if (isArray) newLink.targetPath = GetNameWithoutArrayDef(newLink.targetPath) + "/" + l.arrayIndex;
                if (isArray) console.warn("target isArray: " + target.name);
            }*/
            
            console.warn("newLink: "+printLinkDebug(newLink));

            ws = RED.nodes.isClass(l.source.type)
            if (ws)
            {
                getFinalSource(newLink,ws);
                /* keep the following until we are 100% sure that getFinalSource works as intended
                console.warn("l.source isclass " + l.source.name + " to " + l.target.name);
                
                var port = RED.nodes.getClassIOport(ws.id, "Out", l.sourcePort);
                var newSrc = RED.nodes.getWireInputSourceNode(port.node, 0); // TODO. take care of bus output TabOutputs
                newLink.sourcePath = classPath + "/" + l.source.name;
                newLink.source = newSrc.node;
                newLink.sourcePort = newSrc.srcPortIndex;
                // TODO. check if new src is class
                // the following don't work
                // we actually need annother function called getFinalSource
                // and then call that recursive in itself until non class is found 
                ws = RED.nodes.isClass(newSrc.node.type);
                if (ws)
                    getFinalSource(newLink,ws);

                */
            }

            ws = RED.nodes.isClass(l.target.type);
            if (ws)
            {
                console.warn("l.target isclass " + l.target.name + " from " + l.source.name);

                var port = RED.nodes.getClassIOport(ws.id, "In", l.targetPort);
                //console.warn("port:",port);
                // port can have multiple connections out from it
                var portLinks = RED.nodes.links.filter(function(d) { return d.source === port.node;});

                var newPortLinks = [];
                var newTargetPath = classPath + "/" + l.target.name;
                for (var pli = 0; pli < portLinks.length; pli++)
                {
                    var pl = portLinks[pli];
                    var newPortLink = copyLink(newLink, classPath, arrayIndex);
                    newPortLink.targetPath = newTargetPath;
                    newPortLink.target = pl.target;
                    newPortLink.targetPort = pl.targetPort;
                    newPortLinks.push(newPortLink);
                }
                console.warn("newPortLinks:\n" + printLinksDebug(newPortLinks));
                newLinks.pushArray(expandLinks(newPortLinks,classPath));

            }
            else
            {
                console.error("push link: " + printLinkDebug(newLink));
                
                newLinks.push(newLink);
            }
        }
        return newLinks;
    }

    function printLinkDebug(l) {
        return '"' + l.linkPath + '", "'+ (l.arrayIndex||"") +'", ("' + l.sourcePath + '",' + l.source.name + "," + l.sourcePort + ') -> ("' + l.targetPath + '",'+ l.target.name + "," + l.targetPort + ")\n";
    }
    function printLinksDebug(links) {
        var txt = "";
        for (var i = 0; i < links.length; i++) {
            txt += printLinkDebug(links[i]);
        }
        return txt;
    }

    function haveIO(node) {
        return ((node.outputs > 0) || (node._def.inputs > 0));
    }

    function GetNameWithoutArrayDef(name) {
        var value = 0;
		//console.warn("isNameDeclarationArray: " + name);
		var startIndex = name.indexOf("[");
        //var endIndex = name.indexOf("]");
		if (startIndex == -1) return name;
        //if (endIndex == -1) return name;
        return name.substring(0, startIndex);
    }
    function GetLinkName(l) {
        var srcName = l.origin?l.origin.source.name:l.source.name;
        var dstName = l.origin?l.origin.target.name:l.target.name;
        //srcName = GetNameWithoutArrayDef(srcName);
        //dstName = GetNameWithoutArrayDef(dstName);

        var srcPort = parseInt(l.origin?l.origin.sourcePort:l.sourcePort);
        var dstPort = parseInt(l.origin?l.origin.targetPort:l.targetPort);

        if (l.arrayIndex != undefined) {
            var source = l.origin?l.origin.source:l.source;
            var target = l.origin?l.origin.target:l.target;
            var isArray = RED.nodes.isNameDeclarationArray(source.name, source.z, true);
            if (isArray) srcName += "_" + l.arrayIndex;
            isArray = RED.nodes.isNameDeclarationArray(target.name, target.z, true);
            if (isArray) dstName += "_" + l.arrayIndex;

            var target = l.target;//l.origin?l.origin.target:l.target;
            var arrayIndex = parseInt(l.arrayIndex.substring(1));
            if (target._def.defaults.inputs != undefined)
                dstPort = arrayIndex+dstPort;
        
        }

        if (RED.OSC.settings.UseDebugLinkName == false)
            return srcName + srcPort + dstName + dstPort;
        else
            return srcName + "_" + srcPort +"_"+ dstName +"_"+ dstPort;
    }

    function GetLinkDebugName(link) {
        return "(" + link.source.name + ", " + link.sourcePort + ", " + link.target.name + ", " + link.targetPort + ")";
    }

    function GetNameWithoutArrayDef(name) {
        var value = 0;
		//console.warn("isNameDeclarationArray: " + name);
		var startIndex = name.indexOf("[");
		if (startIndex == -1) return name;
        return name.substring(0, startIndex);
    }

    return {
        GetNameWithoutArrayDef,
        GetLinkDebugName,
        GetLinkName,
        haveIO,

        getClassConnections,
        printLinkDebug,
        printLinksDebug
    };
})();