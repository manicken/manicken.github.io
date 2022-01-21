/* would contain all helper functions needed for exporting */


RED.export = (function () {

    function getClassConnections(class_ws, links, currPath) {
        //console.log("*******************************************");
        console.error("getClassConnections  path: \"" + currPath + "\"");
        for (var ni = 0; ni < class_ws.nodes.length; ni++) {
            var n = class_ws.nodes[ni];
            var node = RED.nodes.node(n.id); // to get access to node.outputs and node._def.inputs
            if (node._def.nonObject != undefined) continue;
            if (node.type == "TabInput") continue; 
            
            var ws = isClass(n.type)
            if (ws) getClassConnections(ws, links, currPath + "/" + n.name);
            
            var classLinks = RED.nodes.links.filter(function(l) { return (l.source === node) && (l.target.type != "TabOutput"); });
            classLinks.sort(function (a,b) {return a.target.y-b.target.y});

            console.error("classLinks: " + node.name + " \n" + printLinksDebug(classLinks));
            
            var newLinks = [];
            for (var li = 0; li < classLinks.length; li++) {
                var l = copyLink(classLinks[li], currPath);
                console.warn(printLinkDebug(l));
                ws = isClass(l.source.type)
                if (ws)
                {
                    getFinalSource(l,ws);
                }
                ws = isClass(l.target.type);
                if (ws)
                {
                    getFinalTarget_s(ws,l, newLinks, currPath);
                }
                else
                    newLinks.push(l);
            }
            console.error("links.pushArray(newLinks): \n" + printLinksDebug(newLinks));
            links.pushArray(newLinks);

            
        }
    }

    function copyLink(l, defaultPath) {
        //console.warn("copyLink from: " + printLinkDebug(l));
        var newL = { 
            linkPath:(l.linkPath!=undefined)?l.linkPath:defaultPath,

            sourcePath:(l.sourcePath!=undefined)?l.sourcePath:defaultPath,
            source:l.source,
            sourcePort:parseInt(l.sourcePort),
            sourceName:(l.sourceName!=undefined)?l.sourceName:l.source.name,
            
            targetPath:(l.targetPath!=undefined)?l.targetPath:defaultPath,
            target:l.target,
            targetPort:parseInt(l.targetPort),
            targetName:(l.targetName!=undefined)?l.targetName:l.target.name,
            
            origin:(l.origin!=undefined)?l.origin:l
        };
        //console.warn("copyLink to: " + printLinkDebug(newL));
        return newL;
    }

    function getFinalSource(l,ws) {
        //console.warn("l.source isclass " + l.source.name + " to " + l.target.name);

        var port = RED.nodes.getClassIOport(ws.id, "Out", l.sourcePort);
        if (port.inputs > 1) {
            // do someting special here
        }
            
        var newSrc = RED.nodes.getWireInputSourceNode(port.node, 0); // TODO. take care of bus output TabOutputs
        l.sourcePath = l.sourcePath + "/" + l.source.name;
        l.source = newSrc.node;
        l.sourcePort = newSrc.srcPortIndex;
        var _ws = isClass(l.source.type);
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
     function getFinalTarget_s(ws,link,links,classPath) {
        //console.log("*******************************************");
        console.error("expandLinks classPath:\"" + classPath);
        var newLink = copyLink(link, classPath);
        
        var port = RED.nodes.getClassIOport(ws.id, "In", link.targetPort);
        // port can have multiple connections out from it
        var portLinks = RED.nodes.links.filter(function(d) { return d.source === port.node;});

        var newTargetPath = newLink.targetPath + "/" + link.target.name;
        console.warn('newTargetPath "' + newTargetPath + '"');
        for (var pli = 0; pli < portLinks.length; pli++)
        {
            var pl = portLinks[pli];
            var newPortLink = copyLink(newLink, classPath);
            newPortLink.targetPath = newTargetPath;
            newPortLink.target = pl.target;
            newPortLink.targetPort = pl.targetPort;
            newPortLink.targetName = pl.target.name;
            
            ws = isClass(newPortLink.target.type);
            if (ws)
            {
                getFinalTarget_s(ws,newPortLink,links,newTargetPath);
            }
            else
                links.push(newPortLink);

        }       
    }
    function getArrayDef(s) 
    {
        var si = s.indexOf("[");
        var ei = s.indexOf("]") +1;
        //console.error('getArrayDef "' + s.substring(si, ei) + '"');
        return s.substring(si, ei);
    }

    function expandArray(link,isArrayObject,propertyName) {
        var newLinks = [];
        for (var i = 0; i < isArrayObject.arrayLength; i++) {
            var newLink = copyLink(link, "", "");
            //var newName = isArrayObject.name + "/i" + i;

            newLink[propertyName] = newLink[propertyName].replace(getArrayDef(newLink[propertyName]), "/i"+i);
            newLinks.push(newLink);
        }
        //console.warn(printLinksDebug(newLinks));
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
                //console.error('linkPathIsArray: "' + l.linkPath + '"')
                var linksToCheck = [];
                for (var i = 0; i < linkPathIsArray.arrayLength; i++) {
                    //console.warn("before: "+ printLinkDebug(l));
                    var newLink = copyLink(l);
                    var newPathName = linkPathIsArray.name + "/i" + i;
                    newLink.sourcePath = newLink.sourcePath.replace(newLink.linkPath, newPathName);
                    newLink.targetPath = newLink.targetPath.replace(newLink.linkPath, newPathName);
                    newLink.linkPath = newPathName;
                    //console.warn("after: "+ printLinkDebug(newLink));
                    linksToCheck.push(newLink);
                }
                linksToCheck = expandArrays(linksToCheck);
                //console.error(printLinksDebug(linksToCheck));
                expandedLinks.pushArray(linksToCheck);

                continue;
            }
            //var sourceFullPath = (l.sourcePath + "/" + l.sourceName).split('/'); 
            //var targetFullPath = (l.targetPath + "/" + l.targetName).split('/'); 
            //console.error(sourceFullPath,targetFullPath);

            var sourcePathIsArray = isNameDeclarationArray(l.sourcePath, wsId, true);
            var sourceNameIsArray = isNameDeclarationArray(l.sourceName?l.sourceName:l.source.name, wsId, true);
            var targetPathIsArray = isNameDeclarationArray(l.targetPath, wsId, true);
            var targetNameIsArray = isNameDeclarationArray(l.targetName?l.targetName:l.target.name, wsId, true);

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

    /**
     * 
     * @param {*} dynInputObj 
     * @param {*} source if this is null then the total amount of inputs needed is returned
     * @returns 
     */
    function getDynInputDynSizePortStartIndex(dynInputObj, source) {
        var links = RED.nodes.links.filter(function(l) {return l.target === dynInputObj;});
        links = links.sort(function (a,b) {return (parseInt(a.targetPort) - parseInt(b.targetPort)); });
        //console.log(printLinksDebug(links));
        var offset = 0;
        for (var li = 0; li < links.length; li++) {
            var l = links[li];
            if (l.source === source) {
                //console.warn("found source " + source.name + " @" + offset );
                return offset;
            }
            else {
                var toAdd = 0;
                var isArray = isNameDeclarationArray(l.source.name, l.source.z, true);
                if (isArray) {
                    //console.error("is array " + l.source.name + " " + isArray.arrayLength)
                    toAdd = isArray.arrayLength;
                    
                }
                else {
                    toAdd = 1; // non array sources still have one output
                }
                var ws = isClass(l.source.type)
                if (ws){
                    var lc = copyLink(l, "");
                    getFinalSource(lc, ws);
                    var isArray = isNameDeclarationArray(lc.source.name, lc.source.z, true);
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

    function printLinkDebug(l,options) {
        var txt  = "";
        if (l.invalid != undefined) return l.invalid;
        if( options == undefined) options = {asFullPath:false};
        if (options.asFullPath != undefined && options.asFullPath == true)
            txt += '("' + l.sourcePath +"/"+ (l.sourceName||l.source.name) + '",' + l.sourcePort + ') -> ("' + l.targetPath + '/'+ (l.targetName||l.target.name) + '",' + l.targetPort + ')  @ "' + l.linkPath + '"';
        else
            txt += '("' + l.sourcePath + '",' + (l.sourceName||l.source.name) + "," + l.sourcePort + ') -> ("' + l.targetPath + '",'+ (l.targetName||l.target.name) + "," + l.targetPort + ')  @ "' + l.linkPath + '"';
        /*if (l.origin) {
            //for (var i = 0; i < (l.linkPath.length + 3); i++) txt += " ";

            txt += '  origin (' + l.origin.source.name + "," + l.origin.sourcePort + ') -> ('+ l.origin.target.name + "," + l.origin.targetPort + ")";
            
        }*/
        return txt + "\n";
    }
    function printLinksDebug(links,options) {
        var txt = "";
        if( options == undefined) options = {asFullPath:false,showUndefined:false};

        for (var i = 0; i < links.length; i++) {
            txt += printLinkDebug(links[i],options);
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
        
        var srcIsArray = l.sourcePath?getArrayIndexersFromPath(l.sourcePath+"/"+l.sourceName):"";
        var dstIsArray = l.targetPath?getArrayIndexersFromPath(l.targetPath+"/"+l.targetName):"";
        
        if (srcIsArray.length != 0 || dstIsArray.length != 0) {

            srcPort = parseInt(l.sourcePort);
            src = src = srcName + (dbg?"_":"") + srcPort;
            dstPort = parseInt(l.targetPort);

            var srcIsArray = getArrayIndexersFromPath(l.sourcePath+"/"+l.sourceName);
            //console.error("-------------------------- " +l.sourcePath+"/"+l.sourceName+ " "+srcIsArray);
            if (srcIsArray.length != 0) src += (dbg?"_":"") + srcIsArray;

            var dstIsArray = getArrayIndexersFromPath(l.targetPath+"/"+l.targetName);
            //console.error("-------------------------- " + l.targetPath+"/"+l.targetName + " " + dstIsArray);
            if (dstIsArray.length != 0) dst = dstName + (dbg?"_":"") + dstPort + (dbg?"_":"") + dstIsArray;
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

    var project = {};

    function isClass(type) // TODO rename to getClass
	{
		for (var wsi = 0; wsi < project.workspaces.length; wsi++)
		{
			var ws = project.workspaces[wsi];
			if (type == ws.label) return ws;
			//console.log(node.type  + "!="+ ws.label);
		}
		return undefined;
	}

    return {
        set project(_nns) {project = _nns; },
        get project() { return project;},
        getFinalTarget_s,
        isClass,
        GetNameWithoutArrayDef,
        GetLinkDebugName,
        GetLinkName,
        haveIO,
        getDynInputDynSizePortStartIndex,
        updateNames,
        isNameDeclarationArray,
        getClassConnections,
        expandArrays,
        printLinkDebug,
        printLinksDebug
    };
})();