/* would contain all helper functions needed for exporting */


RED.export = (function () {

    var project = {};

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
		console.warn("isNameDeclarationArray: " + name + " @ " + wsId);
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

    function findMainWs() {
        var foundMains = [];
        var mainSelected = -1;
        for (var wi=0; wi < project.workspaces.length; wi++) {
            if (project.workspaces[wi].isAudioMain == true) {
                foundMains.push(wi);
                if (project.workspaces[wi].id == RED.view.activeWorkspace) {
                    mainSelected = wi;
                }
            }
            
        }
        if (foundMains.length == 0)
            return undefined; // not found
        
        return {items:foundMains, mainSelected}; // let the caller decide what to do
    }

    return {
        set project(_nns) {project = _nns; },
        get project() { return project;},
        findMainWs,
        isClass,
        GetNameWithoutArrayDef,
        haveIO,
        isNameDeclarationArray,
        cyrb53,
        getArrayDef,
    };
})();