
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

        export:[ // should be added by this module, and contains the 'real'(final) wires
            /** type ExportAudioConnection */
        ],
        
        /*info:{ // added by setLinkInfo @ RED.nodes
            isBus,
            valid,
            invalidText,
            tabOut,
            tabIn
        }*/
    }

    function expandBusWire(link) {
        
        if ((link.info.tabOut != undefined) && (link.info.tabIn == undefined)) // only support this combination for now
        {
            var groupFirstLink;
            for (var topi = 0; topi < link.info.tabOut.inputs; topi++)
            {
                var nl = new ExportAudioConnection(link);// copy(l);
                if (topi == 0) groupFirstLink = nl;
                else nl.groupFirstLink = groupFirstLink;

                nl.tabOutPortIndex = topi;
                link.export.push(nl);
            }
        }
        else {
            link.export.push({invalid:"//(not supported yet)" + RED.export.links2.getDebug(link)});
        }
    }
    function fixFinal_Sources_Targets(link) {
        var node = link.source;

        var newLinks = [];
        for (var li = 0; li < link.export.length; li++)
        {
            if (link.export[li].invalid != undefined) continue; // skip invalid/unsupported links
            var expLink = link.export[li];
            if (expLink.source._def.classWs != undefined)
            {
                var tabOutPortIndex = expLink.tabOutPortIndex?expLink.tabOutPortIndex:0;
                getFinalSource(expLink,expLink.source._def.classWs,tabOutPortIndex);
            }
            else if (expLink.source.type.startsWith("Junction") == true) {
                expLink.source = RED.nodes.getJunctionSrcNode(expLink.source);
            }

            if (node.isArray != undefined) {
                expLink.sourceIsArray = node.isArray;
            }else {
                expLink.sourceName = expLink.source.name;
            }

            if (expLink.target._def.classWs != undefined)
            {
                getFinalTarget_s(expLink, newLinks);
                link.export = newLinks;
            }
            else {
                expLink.targetName = expLink.target.name;
            }           
        }
    }

    function getFinalTarget_s(link,links) {
        var ws = link.target._def.classWs;
        var newLink = new ExportAudioConnection(link);//copy(link);
        
        var portNode = RED.nodes.getClassIOport(ws.id, "In", link.targetPort);
        if (portNode.isBus == true) {
            link.tabIn = portNode;// store it for later use
        }
        // port can have multiple connections out from it
        var ws = RED.nodes.getWorkspace(portNode.z);
        var portLinks = ws.links.filter(function(d) { return d.source === portNode;});
        
        for (var pli = 0; pli < portLinks.length; pli++)
        {
            var pl = portLinks[pli];
            var npl = new ExportAudioConnection(newLink);//copy(newLink); // npl = new port link
            npl.targetPath = []; // this makes sure that every targetPath array is unique
            npl.targetPath.push(...newLink.targetPath);
            npl.targetPath.push(link.target.name);
            npl.target = pl.target;
            npl.targetPort = pl.targetPort;
            npl.targetName = pl.target.name;

            if (npl.target._def.classWs != undefined)
            {
                getFinalTarget_s(npl,links);
            }
            else
            {
                links.push(npl);
            }
        }       
    }
    /** this is only to get the final source of a class connected link */
    function getFinalSource(l,ws,tabOutPortIndex) {
        
        var portNode = RED.nodes.getClassIOport(ws, "Out", l.sourcePort);
        if (portNode.isBus == true) {
            l.tabOut = portNode;// store it for later use
        }
        if (tabOutPortIndex == undefined) tabOutPortIndex = 0;
        
        var newSrc = RED.nodes.getWireInputSourceNode(portNode, tabOutPortIndex);
        if (newSrc == undefined) {
            l.invalid = " the class output is unconnected";
            return;
        }
        if (l.source.type.startsWith("Junction") == true) {
            l.source = RED.nodes.getJunctionSrcNode(l.source);
        }
        //console.log(l.source.name + JSON.stringify(l.sourcePath,null,2));
        //l.sourcePath.push(...l.sourcePath);
        l.sourcePath.push(l.source.name);
        l.source = newSrc.node;
        l.sourceName = l.source.name;
        l.sourcePort = newSrc.srcPortIndex;
        var _ws = l.source._def.classWs;//RED.export.isClass(l.source.type);
        if (_ws)
        {
            getFinalSource(l,_ws);
        }
    }

    //function expandArrays()

    function generateAndAddExportInfo(link) {
        //return;
        console.log("generateAndAddExportInfo", link);
        if (link.source.type == "TabInput" || link.target.type == "TabOutput") return; // don't generate export info for tabIO links as they are virtual only

        link.export = [];
        if (link.info.isBus == true)
            expandBusWire(link);
        else
            link.export.push(new ExportAudioConnection(link));//copy(link));

        fixFinal_Sources_Targets(link);
    }
    
    // TODO fix this function to work with new structure
    function getJunctionFinalDestinations(junctionNode, dstNodes) {
        RED.nodes.nodeEachLink(junctionNode, function (srcPortIndex, dst, dstPortIndex)
        {
            if (dst.type.startsWith("Junction"))
                getJunctionFinalDestinations(dst, dstNodes);
            else
                dstNodes.nodes.push({ node: dst, dstPortIndex: dstPortIndex });
        });
    }
    

    $("#btn-debugPrintLinks2").click(function() {console.warn(RED.export.links2.getDebug(RED.nodes.cwsLinks));});
    $("#btn-debugPrintLinks3").click(function() {console.warn(RED.nodes.cwsLinks);});
    return {
        generateAndAddExportInfo,
    };
})(); // RED.export.links2