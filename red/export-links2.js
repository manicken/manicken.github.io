
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
    function copy(l) {
        //console.warn("link copy from: " + RED.export.links.getDebug(l));
        var newL = {

            info:l.info,
            tabOutPortIndex:undefined,
            groupFirstLink:l.groupFirstLink,
            
            sourceIsArray:l.sourceIsArray,
            sourcePath:(l.sourcePath!=undefined)?l.sourcePath:[], // initialized the first time this function is used when copied from a original link
            source:l.source,
            sourcePort:parseInt(l.sourcePort),
            
            sourceName:l.sourceName,
            
            targetPath:(l.targetPath!=undefined)?l.targetPath:[], // initialized the first time this function is used when copied from a original link
            target:l.target,
            targetPort:parseInt(l.targetPort),
            targetName:l.targetName,

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
                var nl = copy(l);
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
        var node = link.source;

        var newLinks = [];
        for (var li = 0; li < link.export.length; li++)
        {
            if (link.export[li].invalid != undefined) continue; // skip invalid/unsupported links
            var l = link.export[li];
            if (l.source._def.isClass != undefined)
            {
                var tabOutPortIndex = l.tabOutPortIndex?l.tabOutPortIndex:0;
                getFinalSource(l,l.source._def.isClass,tabOutPortIndex);
            }
            if (node.isArray != undefined) {
                l.sourceIsArray = node.isArray;
            }else {
                l.sourceName = l.source.name;
            }
            if (l.target._def.isClass != undefined)
            {
                getFinalTarget_s(l, newLinks);
                link.export = newLinks;
            }
            else {
                l.targetName = l.target.name;
            }           
        }
    }

    function getFinalTarget_s(link,links) {
        var ws = link.target._def.isClass;
        var newLink = copy(link);
        
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
            var npl = copy(newLink); // npl = new port link
            npl.targetPath = []; // this makes sure that every targetPath array is unique
            npl.targetPath.push(...newLink.targetPath);
            npl.targetPath.push(link.target.name);
            npl.target = pl.target;
            npl.targetPort = pl.targetPort;
            npl.targetName = pl.target.name;

            if (npl.target._def.isClass != undefined)
            {
                getFinalTarget_s(npl,links);
            }
            else
            {
                links.push(npl);
            }
        }       
    }

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
        //console.log(l.source.name + JSON.stringify(l.sourcePath,null,2));
        //l.sourcePath.push(...l.sourcePath);
        l.sourcePath.push(l.source.name);
        l.source = newSrc.node;
        l.sourceName = l.source.name;
        l.sourcePort = newSrc.srcPortIndex;
        var _ws = l.source._def.isClass;//RED.export.isClass(l.source.type);
        if (_ws)
        {
            getFinalSource(l,_ws);
        }
    }

    //function expandArrays()

    function generateAndAddExportInfo(link) {
        //return;
        //console.log("generateAndAddExportInfo", link);
        if (link.source.type == "TabInput" || link.target.type == "TabOutput") return; // don't generate export info for tabIO links as they are virtual only

        link.export = [];
        if (link.info.isBus == true)
            expandBusWire(link);
        else
            link.export.push(copy(link));

        fixFinal_Sources_Targets(link);
    }
    

    

    $("#btn-debugPrintLinks2").click(function() {console.warn(RED.export.links2.getDebug(RED.nodes.cwsLinks));});
    $("#btn-debugPrintLinks3").click(function() {console.warn(RED.nodes.cwsLinks);});
    return {
        generateAndAddExportInfo,
    };
})(); // RED.export.links2