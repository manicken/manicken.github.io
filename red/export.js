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

            links.pushArray(getFinalIO(clinks, currPath));

            var _ws = RED.nodes.isClass(n.type);
            if (_ws)
            {
                console.warn("is class: " + n.name);
                console.log("*************************************************************************");
                console.log("*** adding connections inside "+ _ws.label + " ****************************");
                console.log("*************************************************************************");
                getClassConnections(_ws, links, currPath + "/" + n.name);
            }
            else 
            {
                console.warn("is NOT class: " + n.name);
            }
        }
    }

    function copyLink(l, defaultPath, arrayIndex) {
        if (updateNames == undefined) updateNames = false;
        return { linkPath:l.linkPath?l.linkPath:defaultPath, /*arrayIndex:l.arrayIndex?l.arrayIndex:arrayIndex,*/
                 source:l.source, sourcePort:parseInt(l.sourcePort), sourcePath:l.sourcePath?l.sourcePath:defaultPath,
                 target:l.target, targetPort:parseInt(l.targetPort), targetPath:l.targetPath?l.targetPath:defaultPath,
                 origin:l.origin?l.origin:l,
                 sourceName:l.sourceName?l.sourceName:l.source.name, 
                 targetName:l.targetName?l.targetName:l.target.name};
    }

    function getFinalSource(l,ws) {
        console.warn("l.source isclass " + l.source.name + " to " + l.target.name);

        var port = RED.nodes.getClassIOport(ws.id, "Out", l.sourcePort);
        if (port.inputs > 1) {
            // do someting special here
        }
            
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
     function getFinalIO(links,classPath/*,arrayIndex*/) {
        console.log("*******************************************");
        console.error("expandLinks classPath:\"" + classPath);
        var newLinks = [];
        var ws;
        for (var li = 0; li < links.length; li++)
        {
            var l = links[li];
            var newLink = copyLink(l, classPath/*, arrayIndex*/);
            
            console.warn("newLink: "+printLinkDebug(newLink));

            ws = RED.nodes.isClass(l.source.type)
            if (ws)
            {
                getFinalSource(newLink,ws);
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
                    var newPortLink = copyLink(newLink, classPath/*, arrayIndex*/);
                    newPortLink.targetPath = newTargetPath;
                    newPortLink.target = pl.target;
                    newPortLink.targetPort = pl.targetPort;
                    newPortLinks.push(newPortLink);
                }
                console.warn("newPortLinks:\n" + printLinksDebug(newPortLinks));
                newLinks.pushArray(getFinalIO(newPortLinks,classPath));
            }
            else
            {
                console.error("push link: " + printLinkDebug(newLink));
                
                newLinks.push(newLink);
            }
        }
        return newLinks;
    }

    function expandArray(link,isArrayObject,propertyName) {
        var newLinks = [];
        for (var i = 0; i < isArrayObject.arrayLength; i++) {
            var newLink = copyLink(link, "", "");
            var newName = isArrayObject.name + "/i" + i;
            newLink.arrayIndex = "i" + i;
            newLink[propertyName] = newLink[propertyName].replace(newLink[propertyName], newName);
            newLinks.push(newLink);
        }
        console.warn(printLinksDebug(newLinks));
        return newLinks;
    }
    function updateNames(links) {
        for (var li = 0; li < links.length; li++)
        {
            var l = links[li];
            l.sourceName = l.source.name;
            l.targetName = l.target.name;
            
        }
    }

    function expandArrays(links) {
        // this should take care of array sources/targets
        var expandedLinks = [];

        for (var li = 0; li < links.length; li++)
        {
            var l = links[li];

            var wsId = l.origin.source.z;
            var linkPathIsArray = isNameDeclarationArray(l.linkPath, wsId, true);
            if (linkPathIsArray) {
                var linksToCheck = [];
                for (var i = 0; i < linkPathIsArray.arrayLength; i++) {
                    var newLink = copyLink(l, "", "");
                    var newPathName = linkPathIsArray.name + "/i" + i;
                    newLink.arrayIndex = "i" + i;
                    newLink.sourcePath = newLink.sourcePath.replace(newLink.linkPath, newPathName);
                    newLink.targetPath = newLink.targetPath.replace(newLink.linkPath, newPathName);
                    newLink.linkPath = newPathName;
                    linksToCheck.push(newLink);
                }
                linksToCheck = expandArrays(linksToCheck);
                console.error(printLinksDebug(linksToCheck));
                expandedLinks.pushArray(linksToCheck);

                continue;
            }
            var sourceFullPath = (l.sourcePath + "/" + l.sourceName).split('/'); 
            var targetFullPath = (l.targetPath + "/" + l.targetName).split('/'); 
            console.error(sourceFullPath,targetFullPath);

            var sourcePathIsArray = isNameDeclarationArray(l.sourcePath, wsId, true);
            var sourceNameIsArray = isNameDeclarationArray(l.sourceName?l.sourceName:l.source.name, wsId, true);
            var targetPathIsArray = isNameDeclarationArray(l.targetPath, wsId, true);
            var targetNameIsArray = isNameDeclarationArray(l.targetName?l.targetName:l.target.name, wsId, true);

            // here are 9 combinations just for array source and array destinations
            if (!sourcePathIsArray && sourceNameIsArray && !targetPathIsArray && targetNameIsArray) { // 0101

            } else if (!sourcePathIsArray && sourceNameIsArray && targetPathIsArray && !targetNameIsArray) { // 0110
            
            }
            else if (!sourcePathIsArray && sourceNameIsArray && targetPathIsArray && targetNameIsArray) { // 0111
            
            }
            else if (sourcePathIsArray && !sourceNameIsArray && !targetPathIsArray && targetNameIsArray) { // 1001
            
            }
            else if (sourcePathIsArray && !sourceNameIsArray && targetPathIsArray && !targetNameIsArray) { // 1010
            
            }
            else if (sourcePathIsArray && !sourceNameIsArray && targetPathIsArray && targetNameIsArray) { // 1011
            
            }
            else if (sourcePathIsArray && sourceNameIsArray && !targetPathIsArray && targetNameIsArray) { // 1101
            
            }
            else if (sourcePathIsArray && sourceNameIsArray && targetPathIsArray && !targetNameIsArray) { // 1110
            
            }
            else if (sourcePathIsArray && sourceNameIsArray && targetPathIsArray && targetNameIsArray) { // 1111
            
            }
            // take care of every combination actually there are 16 of them
            // or 9 if we need to support putting arrays after one and annother
            // but is reduced to 6 as every one of them would be very much for the moment
            // this following 6 are certain useful anyway
            if (sourcePathIsArray && !sourceNameIsArray) {
                expandedLinks.pushArray(expandArray(l, sourcePathIsArray, "sourcePath"));
                continue;
            }
            else if (!sourcePathIsArray && sourceNameIsArray) {
                expandedLinks.pushArray(expandArray(l, sourceNameIsArray, "sourceName"));
                continue;
            }
            else if (sourcePathIsArray && sourceNameIsArray) {
                // this is a multi step thingy
                expandedLinks.pushArray(expandArrays(expandArray(l, sourcePathIsArray, "sourcePath")));
                continue;
            }
            
            if (targetPathIsArray && !targetNameIsArray) {
                expandedLinks.pushArray(expandArray(l, targetPathIsArray, "targetPath"));
                continue;
            }
            else if (!targetPathIsArray && targetNameIsArray) {
                expandedLinks.pushArray(expandArray(l, targetNameIsArray, "targetName"));
                continue;
            }
            else if (targetPathIsArray && targetNameIsArray) {
                // this is a multi step thingy
                expandedLinks.pushArray(expandArrays(expandArray(l, targetPathIsArray, "targetPath")));
                continue;
            }
            // non array stuff
            expandedLinks.push(l);

        }
        return expandedLinks;
    }

    function getDynInputDynSizePortIndex(dynInputObj, source) {
        var links = RED.nodes.links.filter(function(l) {return l.target === dynInputObj;});
        links = links.sort(function (a,b) {return (parseInt(a.targetPort) - parseInt(b.targetPort)); });
        console.log(printLinksDebug(links));
        var offset = 0;
        for (var li = 0; li < links.length; li++) {
            var l = links[li];
            if (l.source === source) {
                //console.warn("found source " + source.name + " @" + offset );
                return offset;
            }
            else {
                var isArray = isNameDeclarationArray(l.source.name, l.source.z, true);
                if (isArray) {
                    //console.error("is array " + l.source.name + " " + isArray.arrayLength)
                    offset += isArray.arrayLength;
                }
                else {
                    offset++; // non array sources still have one output
                }
            }
        }
        //console.error("did not found source " + source.name + " @" + offset )
        return offset;
    }

    function printLinkDebug(l) {
        var txt  = "";
        //txt += '("' + (l.sourcePath||"")+ '",' + (l.sourceName||l.source.name) + "," + l.sourcePort + ') -> ("' + (l.targetPath||"") + '",'+ (l.targetName||l.target.name) + "," + l.targetPort + ')  @ "' + (l.linkPath||"") + '"';
        txt += '("' + (l.sourcePath||"") +"/"+ (l.sourceName||l.source.name) + '",' + l.sourcePort + ') -> ("' + (l.targetPath||"") + '/'+ (l.targetName||l.target.name) + '",' + l.targetPort + ')  @ "' + (l.linkPath||"") + '"';
        
        /*if (l.origin) {
            //for (var i = 0; i < (l.linkPath.length + 3); i++) txt += " ";

            txt += '  origin (' + l.origin.source.name + "," + l.origin.sourcePort + ') -> ('+ l.origin.target.name + "," + l.origin.targetPort + ")";
            
        }*/
        return txt + "\n";
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
        // l.sourceName and l.targetName will be set by RED.export.expandArrays if used
        var srcName = l.origin?l.origin.source.name:l.source.name;
        var dstName = l.origin?l.origin.target.name:l.target.name;
        srcName = GetNameWithoutArrayDef(srcName);
        dstName = GetNameWithoutArrayDef(dstName);

        var srcPort = parseInt(l.origin?l.origin.sourcePort:l.sourcePort);
        var dstPort = parseInt(l.origin?l.origin.targetPort:l.targetPort);

        var dbg = RED.OSC.settings.UseDebugLinkName;
        var src = src = srcName + (dbg?"_":"") + srcPort;
        var dst = "";
        
        // this should maybe be take care of in expandArrays
        if (l.arrayIndex != undefined) {

            var arrayIndex = parseInt(l.arrayIndex.substring(1));
            if (l.target._def.defaults.inputs != undefined)
                dstPort = arrayIndex+dstPort;

            var source = l.origin?l.origin.source:l.source;
            var target = l.origin?l.origin.target:l.target;
            var isArray = isNameDeclarationArray(source.name, source.z, true);
            if (isArray) src += (dbg?"_":"") + getArrayIndexersFromPath(l.sourcePath+"/"+l.sourceName);//l.arrayIndex;
            isArray = isNameDeclarationArray(target.name, target.z, true);
            if (isArray) dst = dstName + (dbg?"_":"") + dstPort + (dbg?"_":"") + getArrayIndexersFromPath(l.targetPath+"/"+l.targetName);// l.arrayIndex;
            else dst = dstName + (dbg?"_":"") + dstPort;
        }
        else
        {
            dst = dstName + (dbg?"_":"") + dstPort;
        }

        return src + (dbg?"_":"") + dst;
    }

    function getArrayIndexersFromPath(path) {
        var dbg = RED.OSC.settings.UseDebugLinkName;
        var res = [];
        var split = path.split("/");
        for (var i = 0; i < split.length; i++){
            var item = split[i];
            if (item[0] == 'i' && item[1]>='0' && item[1]<='9')
                res.push(item);
        }
        return res.join((dbg?"_":""));
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

    function isNameDeclarationArray(name,wsId,replaceConstWithValue)
	{
		var value = 0;
		//console.warn("isNameDeclarationArray: " + name);
		var startIndex = name.indexOf("[");
		if (startIndex == -1) return undefined;
		var endIndex = name.indexOf("]");
		if (endIndex == -1){ console.log("isNameDeclarationArray: missing end ] in " + name); return undefined;}
		var arrayDef = name.substring(startIndex,endIndex+1); // this includes the []
		var valueDef = name.substring(startIndex+1,endIndex)
		if (isNaN(valueDef))
		{
			value = Number(getConstantNodeValue(valueDef, wsId));
			if (replaceConstWithValue)
			{
				name = name.replace(arrayDef, "[" + Number(value) + "]");
			}
			else
				name = name.replace(arrayDef, "[i]");
		} 
		else
		{
			value = Number(valueDef);
			if (replaceConstWithValue)
			{
				name = name.replace(arrayDef, "["+value+"]");
			}
			else
				name = name.replace(arrayDef, "[i]");
		}
		//console.log("NameDeclaration is Array:" + name);
		return {newName:name, name:name.substring(0, startIndex), arrayLength:value};
	}
    function getConstantNodeValue(name, wsId)
	{
		for (var i = 0; i < RED.nodes.nodes.length; i++)
		{
			var n = RED.nodes.nodes[i];
			if (n.z != wsId) continue; // workspace filter
			if (n.type != "ConstValue") continue; // type filter
			if (n.name === name)
			{
				return Number(n.value);
			}
		}
		console.error("did not found ConstantNodeValue:" + name + " @ wsId:" + wsId);
		return 0;
	}

    return {
        GetNameWithoutArrayDef,
        GetLinkDebugName,
        GetLinkName,
        haveIO,
        getDynInputDynSizePortIndex,
        updateNames,
        isNameDeclarationArray,
        getClassConnections,
        expandArrays,
        printLinkDebug,
        printLinksDebug
    };
})();