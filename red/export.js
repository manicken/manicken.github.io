/* would contain all helper functions needed for exporting */


RED.export = (function () {

    //var project = {};

    function getArrayDef(s) 
    {
        var si = s.indexOf("[");
        var ei = s.indexOf("]") +1;
        //console.error('getArrayDef "' + s.substring(si, ei) + '"');
        return s.substring(si, ei);
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

    function decimalToHex(d, padding) {
        var hex = Number(d).toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    
        while (hex.length < padding) {
            hex = "0" + hex;
        }
    
        return hex;
    }

    function cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1>>>0);
    };

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
		//console.warn("isNameDeclarationArray: " + name + " @ " + wsId);
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
        console.warn("getConstantNodeValue: " + name + " @ " + wsId);
        var node = RED.nodes.namedNode(name, undefined, wsId)
        if (node == undefined) {
            console.error("did not found ConstantNodeValue:" + name + " @ wsId:" + wsId);
            return 0;
        }
        if (node.type != "ConstValue") {
            console.error(name + " is not a ConstValue @ wsId:" + wsId);
            return 0;
        }
        var value = Number(node.value);
        if (isNaN(value) == true) {
            console.error("ConstValue " + value + " @ "+name+", wsId:" + wsId);
            return 0;
        }
        return parseInt(value); // only return int part
/*
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
		
		return 0;*/
	}
/*
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
*/
    function findMainWs() {
        var foundMains = [];
        var mainSelected = -1;
        for (var wi=0; wi < RED.nodes.workspaces.length; wi++) {
            if (RED.nodes.workspaces[wi].isAudioMain == true) {
                foundMains.push(wi);
                if (RED.nodes.workspaces[wi].id == RED.view.activeWorkspace) {
                    mainSelected = wi;
                }
            }
            
        }
        if (foundMains.length == 0)
            return undefined; // not found
        
        return {items:foundMains, mainSelected}; // let the caller decide what to do
    }
    $("#btn-debugPrintClassUsage").click(function() {getUsageTreeFrom(RED.view.activeWorkspace);});

    function getUsageTreeFrom(wsId) {
        var ws = RED.nodes.getWorkspace(wsId);
        var nodes = RED.nodes.getNodeInstancesOfType(ws.label);
        if (nodes.length == 0) {
            console.warn("no usage found @ " + ws.label);
            return;
        }
        var tree = [];//{items:[]};
        //console.log("\n:getting instances of "+ws.label+" { \n" + getUsageTree(nodes, tree, ws.label) + " }\n\n");
        //getUsageTree(nodes, tree, ws.label);
        var paths = [];
        //getPathsFromTree(paths, tree, [], "MainWaves");
        //console.log(JSON.stringify(tree, null, 2));

        getUsageTree2(paths, nodes, [], "MainWaves");
        console.log(JSON.stringify(paths, null, 2));
        console.log(JSON.stringify(getSimpleOSCpaths(paths), null, 2));
    }

    function getSimpleOSCpaths(paths) {
        var nps = [];
        for (var pi=0;pi<paths.length;pi++) {
            var path = "";
            for (var i=0;i<paths[pi].length;i++) {
                path += "/" + paths[pi][i].name;
            }
            nps.push(path);
        }
        return nps;
    }

    function getPathsFromTree(paths,items,path,onlyIncludeWs) {
        for (var i=0;i<items.length;i++) {
            //var np = path + "/" + items[i].name;

            var np = [];
            np.pushArray(path);
            np.push(items[i]);
            if (items[i].items.length != 0)
                getPathsFromTree(paths, items[i].items, np, onlyIncludeWs);
            else {
                if (items[i].ws == onlyIncludeWs)
                    paths.push(np.reverse());
            }
        }
    }
    function getUsageTree(nodes, paths, wsLabel) {
        //var txt = "";
        //var paths = [];
        
        for (var ni=0;ni<nodes.length;ni++) {
            var n = nodes[ni];
            //var path = [];
            var item = {ws:n.ws.label, name:n.node.name, type:n.node.type, items:[]};
            //path.push(item);

            //txt += "@" + wsLabel + " -> " + n.node.name + " @ " + n.ws.label;
            var nodes2 = RED.nodes.getNodeInstancesOfType(n.ws.label);
            if (nodes2.length == 0) {
                //console.warn("found root @ " + n.ws.label);
                //txt += " root\n"
                paths.push(item);
                continue;
            }
            //txt += "\n\n:getting instances of "+n.ws.label+" { \n" + getUsageTree(nodes2,item.items,n.ws.label) + " }\n\n";
            getUsageTree(nodes2,item.items,n.ws.label);
            paths.push(item);
        }
        
        //return txt;
    }
    
    // TODO make combined function (getUsageTree + getPathsFromTree)
    // yeah really simple now when it's done
    function getUsageTree2(paths, nodes, path, onlyIncludeWs) {

        for (var ni=0;ni<nodes.length;ni++) {
            var n = nodes[ni];
            var np = [];

            var nodes2 = RED.nodes.getNodeInstancesOfType(n.ws.label);
            if (nodes2.length != 0) {
                
                np.push(...path);
                np.push({ws:n.ws.label, name:n.node.name, type:n.node.type});
                
                getUsageTree2(paths,nodes2,np,onlyIncludeWs);
            }
            else {
                if (n.ws.label == onlyIncludeWs) {

                    np.push(...path);
                    np.push({ws:n.ws.label, name:n.node.name, type:n.node.type});

                    paths.push(np.reverse());
                }
            }
        }
    }

    return {
        //set project(_nns) {project = _nns; },
        //get project() { return project;},
        findMainWs,
        //isClass,
        GetNameWithoutArrayDef,
        haveIO,
        isNameDeclarationArray,
        cyrb53,
        getArrayDef,
        getUsageTree,
        getUsageTreeFrom,
    };
})();