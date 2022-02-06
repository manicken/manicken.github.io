
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
             source:{/*node*/}, sourcePort:0, sourcePath:"", sourceName:"", 
             target:{/*node*/}, targetPort:0, targetPath:"", targetName:""}
        ],
        
        /*info:{ // added by setLinkInfo @ RED.nodes, but should maybe also be set here instead???
            isBus,
            valid,
            inValidText,
            tabOut,
            tabIn
        }*/
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
                console.error("*************is bus: " + RED.export.links.getDebug(l));
                // need to expand bus links
                if ((l.info.tabOut != undefined) && (l.info.tabIn == undefined)) { // only support this combination for now
                    //console.error("***************cloning: " + RED.export.links.getDebug(l));
                    for (var topi = 0; topi < l.info.tabOut.node.inputs; topi++) {
                        //console.error("***********Making copy of: " + RED.export.links.getDebug(l));
                        l = RED.export.links.copy(l);
                        //var newSrc = RED.nodes.getWireInputSourceNode(l.info.tabOut.node, topi);
                        l.tabOutPortIndex = topi;
                        console.error("########################## setting tabOutPortIndex to " + l.tabOutPortIndex + " @ " + RED.export.links.getDebug(l));
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
        var ws = RED.nodes.getWorkspace(node.z);
        var nodeLinks = ws.links.filter(function(l) { return (l.source === node) && (l.target.type != "TabOutput"); });
        nodeLinks.sort(function (a,b) {return a.target.y-b.target.y});
        //console.error(node.name + "\nlinks:\n" + RED.export.links.getDebug(nodeLinks));
        console.warn(nodeIsArray);

        nodeLinks = expandBusWires(nodeLinks);
        //console.error(node.name + "\nlinks after:\n" + RED.export.links.getDebug(nodeLinks));
        var newLinks = [];
        
        if (nodeLinks.length != 0)
            newLinks.push({invalid:currPath + "/" + (nodeIsArray?(nodeIsArray.name+"/i"+nodeIsArray.i):node.name)});
        //else
        //    newLinks.push({invalid:nodeLinks.length + "not array " + currPath + "/" + node.name});

        for (var li = 0; li < nodeLinks.length; li++) {
            var l = RED.export.links.copy(nodeLinks[li], currPath);
            var targetIsArray = RED.export.isNameDeclarationArray(l.target.name, l.target.z, true);
            //console.warn(RED.export.links.getDebug(l));
            ws = RED.export.isClass(l.source.type)
            if (ws)
            {
                var tabOutPortIndex = l.tabOutPortIndex?l.tabOutPortIndex:0;
                //console.error("############################################## " + l.tabOutPortIndex + " # " + tabOutPortIndex + " #" + port.node.name);
                getFinalSource(l,ws,tabOutPortIndex);
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
                getFinalTarget_s(ws,l, newLinks, currPath);
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

    /**
     * 
     * @param {*} dynInputObj 
     * @param {*} source if this is null then the total amount of inputs needed is returned
     * @returns 
     */
     function getDynInputDynSizePortStartIndex(dynInputObj, source, sourcePort) { // TODO fix support for bus links
        var ws = RED.nodes.getWorkspace(dynInputObj.z);
        var links = ws.links.filter(function(l) {return l.target === dynInputObj;});
        links = links.sort(function (a,b) {return (parseInt(a.targetPort) - parseInt(b.targetPort)); });
        //console.log("getDynInputDynSizePortStartIndex \n" + RED.export.links.getDebug(links));
        var offset = 0;
        for (var li = 0; li < links.length; li++) {
            var l = links[li];
            if (l.source === source && l.sourcePort === sourcePort) {
                //console.warn("found source " + source.name + " @" + offset );
                return offset;
            }
            else {
                var toAdd = 0;
                var isArray = RED.export.isNameDeclarationArray(l.source.name, l.source.z, true);
                if (isArray) {
                    //console.error("is array " + l.source.name + " " + isArray.arrayLength)
                    toAdd = isArray.arrayLength;
                    
                }
                else {
                    toAdd = 1; // non array sources still have one output
                }
                if (l.info.isBus == true) {
                    toAdd *= l.info.tabOut.node.inputs;
                }
                // the following adds support for object array output from class/tab
                var ws = RED.export.isClass(l.source.type)
                if (ws){
                    var lc = RED.export.links.copy(l, ""); // so that it don't mess up the original links
                    getFinalSource(lc, ws);
                    var isArray = RED.export.isNameDeclarationArray(lc.source.name, lc.source.z, true);
                    if (isArray) {
                        //console.error("is array " + l.source.name + " " + isArray.arrayLength)
                        toAdd *= isArray.arrayLength;
                        
                    }
                }

                offset += toAdd;
            }
        }
        //console.error("did not found source " + source.name + " @" + offset )
        return offset;
    }

    function tagSameSourceLinksThatConnectsTo(_links,source,target) {
        var links = _links.filter(function(l) { return (l.invalid == undefined) && (l.origin.source === source) && (l.target === target); });
        links.sort(function(a,b) { return a.sourcePort-b.sourcePort;});

        for (var i = 1; i < links.length; i++) {
            if (links[i].groupFirstLink == undefined) {
                links[i].groupFirstLink = links[0];
            }
        }
        //if (links.length > 1)
        //    console.error("group",RED.export.links.getDebug(links));
        return links.length;
    }

    function fixTargetPortsForDynInputObjects(links) {
        for (var li = 0; li < links.length; li++) {
            var l = links[li];
            if (l.invalid != undefined) continue;
            if ((l.target.type == "TabOutput") || (l.source.type == "TabInput")) continue; // failsafe for TabInput or TabOutput objects
            
            if (l.target._def.dynInputs == undefined) continue; //if (l.target._def.defaults.inputs == undefined) continue; // skip non dyn input object
            if (l.target._def.nonObject != undefined) continue; // skip virtual objects (such as busJoiner) that have selectable input counts
            
            //dynamic input audio object
            
            //console.error("common Links: " + commonLinkCount);
            //if (l.groupFirstLink == undefined)
            var groupItemCount = tagSameSourceLinksThatConnectsTo(links,l.origin.source, l.target);
            console.error("¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤ groupItemCount:" + groupItemCount);
            var pathIndices = getOSCIndices(l.sourcePath);
            var nameIndices = getOSCIndices(l.sourceName);
            //packets.add("//************* array source and dyn input  " + l.sourcePath + "/" + l.sourceName + " -> " + l.targetPath + "/" + l.targetName);
            if (l.groupFirstLink == undefined) {
                console.error("######################## l.groupFirstLink == undefined " + RED.export.links.getDebug(l));
                var startIndex = getDynInputDynSizePortStartIndex(l.target, l.origin?l.origin.source:l.source, l.origin?l.origin.sourcePort:l.sourcePort);
            }
            else {
                console.error("######################## l.groupFirstLink != undefined " + RED.export.links.getDebug(l));
                var startIndex = getDynInputDynSizePortStartIndex(l.groupFirstLink.target, l.groupFirstLink.origin?l.groupFirstLink.origin.source:l.groupFirstLink.source, l.groupFirstLink.origin?l.groupFirstLink.origin.sourcePort:l.groupFirstLink.sourcePort);
            }
            console.error("############## startindex #######" + startIndex);
            //packets.add("// dstPort: " + dstPort + " ");
            if (pathIndices.length == 0 && nameIndices.length == 1) {
                var isArraySn = RED.export.isNameDeclarationArray(l.source.name, l.source.z, true);
                if (l.groupFirstLink == undefined)
                    l.targetPort = startIndex + nameIndices[0];
                else
                    l.targetPort = startIndex + nameIndices[0]*(groupItemCount/isArraySn.arrayLength) + ((l.tabOutPortIndex!=undefined)?l.tabOutPortIndex:(l.origin?l.origin.sourcePort:l.sourcePort));
                console.warn("01 pathIndices.length == 0 && ["+nameIndices.join(",")+"].length == 1 ");
            }
            else if (pathIndices.length == 1 && nameIndices.length == 0) {
                var isArraySn = RED.export.isNameDeclarationArray(l.origin.source.name, l.source.z, true);
                if (l.source.z != l.target.z){
                    if (l.groupFirstLink == undefined)
                        l.targetPort = startIndex + pathIndices[0];
                    else {
                        //console.error("############" + startIndex  + " + " + pathIndices[0] +" * (" + groupItemCount+"/"+isArraySn.arrayLength + ") +" + "("+l.tabOutPortIndex+"?"+l.tabOutPortIndex+":("+l.origin+"?"+l.origin.sourcePort+":"+l.sourcePort+"))");
                        l.targetPort = startIndex + pathIndices[0]*(groupItemCount/isArraySn.arrayLength) + ((l.tabOutPortIndex!=undefined)?l.tabOutPortIndex:(l.origin?l.origin.sourcePort:l.sourcePort));
                    }
                    console.warn("l.source.z != l.target.z ");
                }
                else {
                    //l.targetPort = dstPort + pathIndices[0];
                    console.warn("l.source.z == l.target.z ");
                }
                console.warn("10 ["+pathIndices.join(",")+"].length == 1 && nameIndices.length == 0 ");
            }
            else if (pathIndices.length == 1 && nameIndices.length == 1)  {
                
                var isArraySn = RED.export.isNameDeclarationArray(l.source.name, l.source.z, true);
                if (l.source.z != l.target.z) {
                    l.targetPort = startIndex + isArraySn.arrayLength*pathIndices[0] + nameIndices[0];
                    console.warn("l.source.z != l.target.z ");
                }
                else {
                    l.targetPort = startIndex + nameIndices[0];
                    console.warn("l.source.z == l.target.z ");
                }
                console.warn("11 ["+pathIndices.join(",") + "].length == 1 && [" + nameIndices.join(",")+"].length == 1 ");
            }
            else {
                if (l.groupFirstLink == undefined) {
                    l.targetPort = startIndex;
                }
                else {
                    l.targetPort = startIndex + (l.tabOutPortIndex?l.tabOutPortIndex:(l.origin?l.origin.sourcePort:l.sourcePort));
                }
                console.warn("pathIndices.length == 0 && nameIndices.length == 0 ");
            }
            console.warn("final >>" + RED.export.links.getDebug(l) + "<<");
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
     function getFinalTarget_s(ws,link,links,classPath) {
        //console.log("*******************************************");
        console.error("expandLinks classPath:\"" + classPath);
        var newLink = RED.export.links.copy(link, classPath);
        
        var port = RED.nodes.getClassIOport(ws.id, "In", link.targetPort);
        if (port.isBus == true) {
            // store it for later use
            l.tabIn = port.node;
        }
        // port can have multiple connections out from it
        var ws = RED.nodes.getWorkspace(port.node.z);
        var portLinks = ws.links.filter(function(d) { return d.source === port.node;});

        var newTargetPath = newLink.targetPath + "/" + link.target.name;
        console.warn('newTargetPath "' + newTargetPath + '"');
        for (var pli = 0; pli < portLinks.length; pli++)
        {
            var pl = portLinks[pli];
            var newPortLink = RED.export.links.copy(newLink, classPath);
            newPortLink.targetPath = newTargetPath;
            newPortLink.target = pl.target;
            newPortLink.targetPort = pl.targetPort;
            newPortLink.targetName = pl.target.name;
            
            ws = RED.export.isClass(newPortLink.target.type);
            if (ws)
            {
                getFinalTarget_s(ws,newPortLink,links,newTargetPath);
            }
            else
                links.push(newPortLink);

        }       
    }

    function getOSCIndices(path) {
        var indices = [];
        var split = path.split("/");
        split.forEach( function(str){
            //if (str.length < 2) continue;
            //console.log(str);
            if ((str.length > 1) && (str[0] == 'i') && ((str[1]>='0')&&(str[1]<='9')))
                indices.push(parseInt(str.substring(1)));
        });
        return indices;
    }

    function getFinalSource(l,ws,tabOutPortIndex) {
        
        //console.warn("l.source isclass " + l.source.name + " to " + l.target.name);

        var port = RED.nodes.getClassIOport(ws.id, "Out", l.sourcePort);
        //console.error(port);
        if (port.isBus == true) {
            // store it for later use
            //console.error("**** port.inputs > 1 " + port.node.inputs);
            l.tabOut = port.node;
            //l.sourcePort = tabOutPortIndex;
        }
        if (tabOutPortIndex == undefined) tabOutPortIndex = 0;
        
        var newSrc = RED.nodes.getWireInputSourceNode(port.node, tabOutPortIndex); // TODO. take care of bus output TabOutputs
        if (newSrc == undefined) {
            l.invalid = " the class output is unconnected";
            return;
        }
        l.sourcePath = l.sourcePath + "/" + l.source.name;
        l.source = newSrc.node;
        l.sourceName = l.source.name;
        l.sourcePort = newSrc.srcPortIndex;
        var _ws = RED.export.isClass(l.source.type);
        if (_ws)
        {
            getFinalSource(l,_ws);
        }
    }

    function expandArrays(links) {
        // this should take care of array sources/targets
        var expandedLinks = [];

        for (var li = 0; li < links.length; li++)
        {
            var l = links[li];
            if (l.invalid != undefined) { expandedLinks.push(l); continue; }

            var wsId = l.origin.source.z;
            var linkPathIsArray = RED.export.isNameDeclarationArray(l.linkPath, wsId, true);
            if (linkPathIsArray) {
                //console.error('linkPathIsArray: "' + l.linkPath + '"')
                var linksToCheck = [];
                for (var i = 0; i < linkPathIsArray.arrayLength; i++) {
                    //console.warn("before: "+ RED.export.links.getDebug(l));
                    var newLink = RED.export.links.copy(l);
                    var newPathName = linkPathIsArray.name + "/i" + i;
                    newLink.sourcePath = newLink.sourcePath.replace(newLink.linkPath, newPathName);
                    newLink.targetPath = newLink.targetPath.replace(newLink.linkPath, newPathName);
                    newLink.linkPath = newPathName;
                    //console.warn("after: "+ RED.export.links.getDebug(newLink));
                    linksToCheck.push(newLink);
                }
                linksToCheck = expandArrays(linksToCheck);
                //console.error(RED.export.links.getDebug(linksToCheck));
                expandedLinks.pushArray(linksToCheck);

                continue;
            }
            //var sourceFullPath = (l.sourcePath + "/" + l.sourceName).split('/'); 
            //var targetFullPath = (l.targetPath + "/" + l.targetName).split('/'); 
            //console.error(sourceFullPath,targetFullPath);

            var sourcePathIsArray = RED.export.isNameDeclarationArray(l.sourcePath, wsId, true);
            var sourceNameIsArray = RED.export.isNameDeclarationArray(l.sourceName?l.sourceName:l.source.name, wsId, true);
            var targetPathIsArray = RED.export.isNameDeclarationArray(l.targetPath, wsId, true);
            var targetNameIsArray = RED.export.isNameDeclarationArray(l.targetName?l.targetName:l.target.name, wsId, true);

            // here are 9 combinations just for array source and array destinations
            if (!sourcePathIsArray && sourceNameIsArray && !targetPathIsArray && targetNameIsArray) { // 0101
                console.log("0101 !sourcePathIsArray && sourceNameIsArray && !targetPathIsArray && targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            } else if (!sourcePathIsArray && sourceNameIsArray && targetPathIsArray && !targetNameIsArray) { // 0110
                console.log("0110 !sourcePathIsArray && sourceNameIsArray && targetPathIsArray && !targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (!sourcePathIsArray && sourceNameIsArray && targetPathIsArray && targetNameIsArray) { // 0111
                console.log("0111 !sourcePathIsArray && sourceNameIsArray && targetPathIsArray && targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (sourcePathIsArray && !sourceNameIsArray && !targetPathIsArray && targetNameIsArray) { // 1001
                console.log("1001 sourcePathIsArray && !sourceNameIsArray && !targetPathIsArray && targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (sourcePathIsArray && !sourceNameIsArray && targetPathIsArray && !targetNameIsArray) { // 1010
                console.log("1010 sourcePathIsArray && !sourceNameIsArray && targetPathIsArray && !targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (sourcePathIsArray && !sourceNameIsArray && targetPathIsArray && targetNameIsArray) { // 1011
                console.log("1011 sourcePathIsArray && !sourceNameIsArray && targetPathIsArray && targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (sourcePathIsArray && sourceNameIsArray && !targetPathIsArray && targetNameIsArray) { // 1101 not valid very hard to implement
                console.log("1101 sourcePathIsArray && sourceNameIsArray && !targetPathIsArray && targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (sourcePathIsArray && sourceNameIsArray && targetPathIsArray && !targetNameIsArray) { // 1110 not valid very hard to implement
                console.log("1110 sourcePathIsArray && sourceNameIsArray && targetPathIsArray && !targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            else if (sourcePathIsArray && sourceNameIsArray && targetPathIsArray && targetNameIsArray) { // 1111 not valid hard to implement
                console.log("1111 sourcePathIsArray && sourceNameIsArray && targetPathIsArray && targetNameIsArray " + l.sourcePath + "/" + l.sourceName + "->" + l.targetPath+"/"+l.targetName);
                expandedLinks.push({invalid:'"'+l.sourcePath + "/" + l.sourceName + '" -> "' + l.targetPath+"/"+l.targetName + '" is not supported '});
                continue; // skip this
            }
            // take care of every combination actually there are 16 of them
            // or 9 if we need to support putting arrays after one and annother
            // but is reduced to 6 as every one of them would be very much for the moment
            // this following 6 are certain useful anyway
            if (sourcePathIsArray && !sourceNameIsArray) {
                console.log("sourcePathIsArray && !sourceNameIsArray");
                expandedLinks.pushArray(expandArray(l, sourcePathIsArray, "sourcePath"));
                continue;
            }
            else if (!sourcePathIsArray && sourceNameIsArray) {
                console.log("!sourcePathIsArray && sourceNameIsArray");
                expandedLinks.pushArray(expandArray(l, sourceNameIsArray, "sourceName"));
                continue;
            }
            else if (sourcePathIsArray && sourceNameIsArray) {
                console.log("sourcePathIsArray && sourceNameIsArray");
                // not supported
                expandedLinks.pushArray(expandArrays(expandArray(l, sourcePathIsArray, "sourcePath")));
                continue;
            }
            
            if (targetPathIsArray && !targetNameIsArray) {
                console.log("targetPathIsArray && !targetNameIsArray");
                expandedLinks.pushArray(expandArray(l, targetPathIsArray, "targetPath"));
                continue;
            }
            else if (!targetPathIsArray && targetNameIsArray) {
                console.log("!targetPathIsArray && targetNameIsArray");
                expandedLinks.pushArray(expandArray(l, targetNameIsArray, "targetName"));
                continue;
            }
            else if (targetPathIsArray && targetNameIsArray) {
                console.log("targetPathIsArray && targetNameIsArray");
                // this is a multi step thingy
                expandedLinks.pushArray(expandArrays(expandArray(l, targetPathIsArray, "targetPath")));
                continue;
            }
            console.log("non array stuff");
            // non array stuff
            expandedLinks.push(l);

        }
        return expandedLinks;
    }

    function expandArray(link,isArrayObject,propertyName) {
        var newLinks = [];
        for (var i = 0; i < isArrayObject.arrayLength; i++) {
            
            var newLink = RED.export.links.copy(link, "", "");
            //var newName = isArrayObject.name + "/i" + i;

            newLink[propertyName] = newLink[propertyName].replace(RED.export.getArrayDef(newLink[propertyName]), "/i"+i);
            newLinks.push(newLink);
        }
        //console.warn(RED.export.links.getDebug(newLinks));
        return newLinks;
    }

    function GetName(l) {
        var dbg = RED.OSC.settings.UseDebugLinkName;

        if (l.origin == undefined) {
            var sourceName = l.source.name;
            var targetName = l.target.name;
            sourceName = RED.export.GetNameWithoutArrayDef(sourceName);
            targetName = RED.export.GetNameWithoutArrayDef(targetName);
        }
        else {
            var sourcePath = l.sourcePath!=undefined?(l.sourcePath.replaceAllVal("/", (dbg?"_":""))):"";
            var targetPath = l.targetPath!=undefined?(l.targetPath.replaceAllVal("/", (dbg?"_":""))):"";
            if (sourcePath.startsWith('_')) sourcePath = sourcePath.substring(1);
            if (targetPath.startsWith('_')) targetPath = targetPath.substring(1);
            var sourceName = l.sourceName.replaceAllVal("/", (dbg?"_":""));
            var targetName = l.targetName.replaceAllVal("/", (dbg?"_":""));
            if (l.linkPath != undefined) {
                var lp = l.linkPath.replaceAllVal("/", (dbg?"_":""));
                if (lp.startsWith('_')) lp = lp.substring(1);
                if (sourcePath.startsWith(lp) && targetPath.startsWith(lp)) {
                    sourcePath = sourcePath.substring(lp.length);
                    targetPath = targetPath.substring(lp.length);
                }
            }
        }
        if (sourceName.startsWith('_')) sourceName = sourceName.substring(1);
        if (targetName.startsWith('_')) targetName = targetName.substring(1);

        var sourceId = (sourcePath?(sourcePath+(dbg?"_":"")):"") + sourceName + (dbg?"_":"") + l.sourcePort;
        var targetId = (targetPath?(targetPath+(dbg?"_":"")):"") + targetName + (dbg?"_":"") + l.targetPort;

        if (RED.OSC.settings.HashLinkNames == true)
            var name = RED.OSC.settings.HashLinkNamesHeader||"L" + (RED.export.cyrb53(sourceId + (dbg?"_":"") + targetId)).toString(16);
        else
            var name = (sourceId + (dbg?"_":"") + targetId);
        
        return name;
    }

    function copy(l, defaultPath) {
        //console.warn("link copy from: " + RED.export.links.getDebug(l));
        var newL = {
            //nextLink:l.nextLink,
            info:l.info,
            tabOutPortIndex:((l.tabOutPortIndex!=undefined)?parseInt(l.tabOutPortIndex):undefined),
            tabOut:l.tabOut, tabIn:l.tabIn,

            linkPath:(l.linkPath!=undefined)?l.linkPath:defaultPath,
            sourceIsArray:l.sourceIsArray,
            sourcePath:(l.sourcePath!=undefined)?l.sourcePath:defaultPath,
            source:l.source,
            sourcePort:parseInt(l.sourcePort),
            
            sourceName:l.sourceName,//!=undefined)?l.sourceName:l.source.name,
            
            targetPath:(l.targetPath!=undefined)?l.targetPath:defaultPath,
            target:l.target,
            targetPort:parseInt(l.targetPort),
            targetName:l.targetName,//!=undefined)?l.targetName:l.target.name,
            
            
            origin:(l.origin!=undefined)?l.origin:l
        };
        //console.warn("link copy to: " + RED.export.links.getDebug(newL));
        return newL;
    }
    function getLinksDebug(links) {
        var txt = "";
        for (var i = 0; i < links.length; i++) {
            txt += getLinkDebugInfo(links[i]) + "\n";
        }
        return txt;
    }
    function getLinkDebugInfo(link) {
        return "(" + link.source.z + ", " + link.source.name + ", " + link.sourcePort + ", " + link.target.z + ", " + link.target.name + ", " + link.targetPort + ")";
    }

    return {
        getClassConnections,
        expandBusWires,
        getDynInputDynSizePortStartIndex,
        fixTargetPortsForDynInputObjects,
        expandArrays,
        GetName,
        copy,
        getLinksDebug

    };
})(); // RED.export.links2