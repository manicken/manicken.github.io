
// note. RED.export.links.getDebug is in export-links-getDebug.js

RED.export.links2 = (function () {

    //this new structure should not create a new set of links
    // except when making links for arrays and buslinks
    // but then the new links should be stored inside the 'master'-link
    // also it should just add the necessary information to them
    // the origin should be replaced with a array containing only one or more links
    // that is then used at the export
    // also the source target sourcePort targetPort should be kept
    // at the original states
    var exampleLink = {
        source:{/*node*/}, sourcePort:0, target:{/*node*/}, targetPort:0, // original propeties

        export:[ // should be added by this module, and contains the 'real' wires
            {linkPath:"",
             source:{/*node*/}, sourcePort:0, sourcePath:[], sourceName:"", 
             target:{/*node*/}, targetPort:0, targetPath:[], targetName:""}
        ],
        
        /*info:{ // added by setLinkInfo @ RED.nodes
            isBus,
            valid,
            inValidText,
            tabOut,
            tabIn
        }*/
    }
    function copy(l, defaultPath) {
        //console.warn("link copy from: " + RED.export.links.getDebug(l));
        var newL = {
            //nextLink:l.nextLink,
            info:l.info,
            tabOutPortIndex:undefined,
            groupFirstLink:l.groupFirstLink,
            
            sourceIsArray:l.sourceIsArray,
            sourcePath:(l.sourcePath!=undefined)?l.sourcePath:defaultPath,
            source:l.source,
            sourcePort:parseInt(l.sourcePort),
            
            sourceName:l.sourceName,//!=undefined)?l.sourceName:l.source.name,
            
            targetPath:(l.targetPath!=undefined)?l.targetPath:defaultPath,
            target:l.target,
            targetPort:parseInt(l.targetPort),
            targetName:l.targetName,//!=undefined)?l.targetName:l.target.name,

        };
        //console.warn("link copy to: " + RED.export.links.getDebug(newL));
        return newL;
    }
    
    function expandBusWire(l) {
        
        if ((l.info.tabOut != undefined) && (l.info.tabIn == undefined)) // only support this combination for now
        {
            var groupFirstLink;
            for (var topi = 0; topi < l.info.tabOut.inputs; topi++)
            {
                var nl = copy(l,"");
                if (topi == 0) groupFirstLink = nl;
                else nl.groupFirstLink = groupFirstLink;

                nl.tabOutPortIndex = topi;
                l.export.push(nl);
            }
        }
        else {
            l.export.push({invalid:"//(not supported yet)" + RED.export.links2.getDebug(l)});
        }
    }
    function fixFinal_Sources_Targets(link) {
        var ws = RED.nodes.getWorkspace(link.source.z);
        var node = link.source;

        var newLinks = [];
        for (var li = 0; li < link.export.length; li++)
        {
            if (link.export[li].invalid != undefined) continue; // skip invalid/unsupported links

            var l = link.export[li];

            var targetIsArray = l.target.isArray;//RED.export.isNameDeclarationArray(l.target.name, l.target.z, true);
            
            //console.warn(RED.export.links.getDebug(l));
            ws = l.source._def.isClass;//RED.export.isClass(l.source.type)
            if (ws)
            {
                var tabOutPortIndex = l.tabOutPortIndex?l.tabOutPortIndex:0;
                //console.error("############################################## " + l.tabOutPortIndex + " # " + tabOutPortIndex + " #" + port.node.name);
                getFinalSource(l,ws,tabOutPortIndex);
            }
            if (node.isArray != undefined) {
                l.sourceIsArray = node.isArray;
                //l.sourcePath = l.sourcePath.replace(node.isArray.newName, node.isArray.name + "/i" + node.isArray.i);
                //l.sourceName = l.source.name.replace(node.isArray.newName, node.isArray.name + "/i" + node.isArray.i);

            }else {
                l.sourceName = l.source.name;
            }
            ws = l.target._def.isClass;//RED.export.isClass(l.target.type);
            if (ws)
            {
                getFinalTarget_s(ws,l, newLinks, "");
            }
            else {
                /*if (targetIsArray != undefined && node.isArray != undefined) {
                    l.targetName = l.target.name.replace(targetIsArray.newName, targetIsArray.name + "/i" + node.isArray.i);
                }
                else*/
                    l.targetName = l.target.name;
                //newLinks.push(l);
            }           
        }
        link.export.pushArray(newLinks);
    }

    function getFinalTarget_s(ws,link,links,classPath) {
        var newLink = copy(link, classPath);
        
        var portNode = RED.nodes.getClassIOport(ws.id, "In", link.targetPort);
        if (portNode.isBus == true) {
            l.tabIn = portNode;// store it for later use
        }
        // port can have multiple connections out from it
        var ws = RED.nodes.getWorkspace(portNode.z);
        var portLinks = ws.links.filter(function(d) { return d.source === portNode;});

        var newTargetPath = newLink.targetPath + "/" + link.target.name;
        for (var pli = 0; pli < portLinks.length; pli++)
        {
            var pl = portLinks[pli];
            var newPortLink = copy(newLink, classPath);
            newPortLink.targetPath = newTargetPath;
            newPortLink.target = pl.target;
            newPortLink.targetPort = pl.targetPort;
            newPortLink.targetName = pl.target.name;
            
            ws = newPortLink.target._def.isClass;//RED.export.isClass(newPortLink.target.type);
            if (ws)
            {
                getFinalTarget_s(ws,newPortLink,links,newTargetPath);
            }
            else
                links.push(newPortLink);

        }       
    }

    function getFinalSource(l,ws,tabOutPortIndex) {
        var portNode = RED.nodes.getClassIOport(ws.id, "Out", l.sourcePort);
        if (portNode.isBus == true) {
            l.tabOut = portNode;// store it for later use
        }
        if (tabOutPortIndex == undefined) tabOutPortIndex = 0;
        
        var newSrc = RED.nodes.getWireInputSourceNode(portNode, tabOutPortIndex); // TODO. take care of bus output TabOutputs
        if (newSrc == undefined) {
            l.invalid = " the class output is unconnected";
            return;
        }
        l.sourcePath = l.sourcePath + "/" + l.source.name;
        l.source = newSrc.node;
        l.sourceName = l.source.name;
        l.sourcePort = newSrc.srcPortIndex;
        var _ws = l.source._def.isClass;//RED.export.isClass(l.source.type);
        if (_ws)
        {
            getFinalSource(l,_ws);
        }
    }

    function generateAndAddExportInfo(link) {
        //return;
        //console.log("generateAndAddExportInfo", link);
        if (link.source.type == "TabInput" || link.target.type == "TabOutput") return; // don't generate export info for tabIO links as they are virtual only

        link.export = [];
        if (link.info.isBus == true)
            expandBusWire(link);
        else
            link.export.push(copy(link, ""));

        fixFinal_Sources_Targets(link);
    }


    return {
        generateAndAddExportInfo,
    };
})(); // RED.export.links2