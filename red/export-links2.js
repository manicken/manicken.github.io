
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
            for (var topi = 0; topi < l.info.tabOut.inputs; topi++)
            {
                var nl = copy(l);
                nl.tabOutPortIndex = topi;
                l.export.push(nl);
            }
        }
        else // only have this here for debugging proposes, should be replaced with a invalid link containing just info to show in the export
            l.export.push({invalid:"//(not supported yet)" + RED.export.links.getDebug(l)});
    }
    function fixFinalSources_Targets(ws, link) {
        var ws = RED.nodes.getWorkspace(link.source.z);
        var node = link.source;

        var newLinks = [];
        for (var li = 0; li < link.export.length; li++)
        {
            if (link.export[li].invalid != undefined) continue; // skip invalid/unsupported links

            var l = copy(link.export[li], "");

            var targetIsArray = l.target.isArray;//RED.export.isNameDeclarationArray(l.target.name, l.target.z, true);
            
            //console.warn(RED.export.links.getDebug(l));
            ws = l.source._def.isClass;//RED.export.isClass(l.source.type)
            if (ws)
            {
                var tabOutPortIndex = l.tabOutPortIndex?l.tabOutPortIndex:0;
                //console.error("############################################## " + l.tabOutPortIndex + " # " + tabOutPortIndex + " #" + port.node.name);
                RED.export.links.getFinalSource(l,ws,tabOutPortIndex);
            }
            if (node.isArray != undefined) {
                l.sourceIsArray = node.isArray;
                l.sourcePath = l.sourcePath.replace(node.isArray.newName, node.isArray.name + "/i" + node.isArray.i);
                l.sourceName = l.source.name.replace(node.isArray.newName, node.isArray.name + "/i" + node.isArray.i);

            }else {
                l.sourceName = l.source.name;
            }
            ws = l.target._def.isClass;//RED.export.isClass(l.target.type);
            if (ws)
            {
                RED.export.links.getFinalTarget_s(ws,l, newLinks, "");
            }
            else {
                if (targetIsArray != undefined && node.isArray != undefined) {
                    l.targetName = l.target.name.replace(targetIsArray.newName, targetIsArray.name + "/i" + node.isArray.i);
                }
                else
                    l.targetName = l.target.name;
                newLinks.push(l);
            }           
        }
        link.export.pushArray(newLinks);
    }

    function generateAndAddExportInfo(link) {
        //console.log("generateAndAddExportInfo", link);
        if (link.source.type == "TabInput" || link.target.type == "TabOutput") return; // don't generate export info for tabIO links as they are virtual only
/*
        link.export = [];
        if (link.info.isBus == true)
            expandBusWire(link);
        else
            link.export.push(copy(link));

        fixFinalSources_Targets(link);*/
    }


    return {
        generateAndAddExportInfo,
    };
})(); // RED.export.links2