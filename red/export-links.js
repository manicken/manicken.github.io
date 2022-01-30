
RED.export.links = (function () {


    $('#btn-deploy-osc-group-links').click(testFinalLinksExport);

    function testFinalLinksExport() {
        
        RED.export.project = RED.nodes.createCompleteNodeSet({newVer:true}); // true mean we get the new structure

        var foundMains = RED.export.findMainWs(RED.export.project);
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
        var ws = RED.export.project.workspaces[mainWorkSpaceIndex];
        var links = [];
        getClassConnections(ws, links, "");
        //RED.export.updateNames(links); // not needed anymore and should never be used either
        links = RED.export.expandArrays(links); // for the moment this fixes array defs that the getClassConnections don't currently solve
        RED.export.fixTargetPortsForDynInputObjects(links);
        var exportDialogText = RED.export.printLinksDebug(links);

        RED.view.dialogs.showExportDialog("OSC Export to Dynamic Audio Lib", exportDialogText, " OSC messages: ", {okText:"send", tips:"this just shows the messages to be sent, first in JSON format then in RAW format"},
        function () {RED.notify("<strong>Nothing sent (development test only)</strong>", "success", null, 2000);});
    }

    

    function getClassConnections(class_ws, links, currPath) {
        //console.log("*******************************************");
        console.error("getClassConnections  path: \"" + currPath + "\"");
        
        for (var ni = 0; ni < class_ws.nodes.length; ni++) {
            var node = RED.nodes.node(class_ws.nodes[ni].id);

            if (node._def.nonObject != undefined) continue;
            if (node.type == "TabInput") continue; 
            
            var isArray = RED.export.isNameDeclarationArray(node.name, node.z, true);
            console.warn("isArray " + node.name,isArray);
            var classWs = RED.export.isClass(node.type)

            if (classWs) {

                if (isArray) {
                    for (var ai = 0; ai < isArray.arrayLength; ai++) {
                        links.push({invalid:currPath + "/" + isArray.name + "/i" + ai});
                        
                        getClassConnections(classWs, links, currPath + "/" + isArray.name + "/i" + ai);
                        isArray.i = ai;
                        links.pushArray(getNodeLinks(node, currPath, isArray));
                    }
                }
                else {
                    getClassConnections(classWs, links, currPath + "/" + node.name);
                    links.pushArray(getNodeLinks(node, currPath));
                }
            } else {

                if (isArray) {
                    //console.error("********************" + node.name + " is array");
                    for (var ai = 0; ai < isArray.arrayLength; ai++) {
                        isArray.i = ai;
                        links.pushArray(getNodeLinks(node, currPath, isArray)); 
                    }
                }
                else {
                    //console.error("********************" + node.name + " is NOT array");
                    links.pushArray(getNodeLinks(node, currPath)); 
                }
            }
        }
    }

    function expandBusWires(links) {
        var newLinks = [];
        // precheck for bus lines
        // and expand/clone them
        for (var li = 0; li < links.length; li++) {
            var l = links[li];
            if (l.info.isBus == true) {
                console.error("*************is bus: " + RED.export.printLinkDebug(l));
                // need to expand bus links
                if ((l.info.tabOut != undefined) && (l.info.tabIn == undefined)) { // only support this combination for now
                    //console.error("***************cloning: " + RED.export.printLinkDebug(l));
                    for (var topi = 0; topi < l.info.tabOut.node.inputs; topi++) {
                        //console.error("***********Making copy of: " + RED.export.printLinkDebug(l));
                        l = RED.export.copyLink(l);
                        //var newSrc = RED.nodes.getWireInputSourceNode(l.info.tabOut.node, topi);
                        l.tabOutPortIndex = topi;
                        console.error("########################## setting tabOutPortIndex to " + l.tabOutPortIndex + " @ " + RED.export.printLinkDebug(l));
                        newLinks.push(l);
                    }
                }
                else // only have this here for debugging proposes, should be replaced with a invalid link containing just info to show in the export
                    newLinks.push(l);
            }
            else
                newLinks.push(l);
        }
        return newLinks;
    }

    function getNodeLinks(node, currPath, nodeIsArray) {
        var nodeLinks = RED.nodes.links.filter(function(l) { return (l.source === node) && (l.target.type != "TabOutput"); });
        nodeLinks.sort(function (a,b) {return a.target.y-b.target.y});
        //console.error(node.name + "\nlinks:\n" + RED.export.printLinksDebug(nodeLinks));
        console.warn(nodeIsArray);

        nodeLinks = expandBusWires(nodeLinks);
        //console.error(node.name + "\nlinks after:\n" + RED.export.printLinksDebug(nodeLinks));
        var newLinks = [];
        
        if (nodeLinks.length != 0)
            newLinks.push({invalid:currPath + "/" + (nodeIsArray?(nodeIsArray.name+"/i"+nodeIsArray.i):node.name)});
        //else
        //    newLinks.push({invalid:nodeLinks.length + "not array " + currPath + "/" + node.name});

        for (var li = 0; li < nodeLinks.length; li++) {
            var l = RED.export.copyLink(nodeLinks[li], currPath);
            var targetIsArray = RED.export.isNameDeclarationArray(l.target.name, l.target.z, true);
            //console.warn(RED.export.printLinkDebug(l));
            ws = RED.export.isClass(l.source.type)
            if (ws)
            {
                var tabOutPortIndex = l.tabOutPortIndex?l.tabOutPortIndex:0;
                //console.error("############################################## " + l.tabOutPortIndex + " # " + tabOutPortIndex + " #" + port.node.name);
                RED.export.getFinalSource(l,ws,tabOutPortIndex);
            }
            if (nodeIsArray != undefined) {
                l.sourceIsArray = nodeIsArray;
                l.sourcePath = l.sourcePath.replace(nodeIsArray.newName, nodeIsArray.name + "/i" + nodeIsArray.i);
                l.sourceName = l.source.name.replace(nodeIsArray.newName, nodeIsArray.name + "/i" + nodeIsArray.i);

            }else {
                l.sourceName = l.source.name;
            }
            ws = RED.export.isClass(l.target.type);
            if (ws)
            {
                RED.export.getFinalTarget_s(ws,l, newLinks, currPath);
            }
            else {
                if (targetIsArray != undefined && nodeIsArray != undefined) {
                    l.targetName = l.target.name.replace(targetIsArray.newName, targetIsArray.name + "/i" + nodeIsArray.i);
                }
                else
                    l.targetName = l.target.name;
                newLinks.push(l);
            }
            // this needs to be taken care of before 'for (var li = 0; li < nodeLinks.length; li++)'
            // in some kind of prescan
            
        }
        
        return newLinks;
    }

    return {
        getClassConnections,
        expandBusWires
    };
})();