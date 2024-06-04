/** Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * A Node-RED Node object, (cannot use Node because that is a reserved name for DOM Node:s)
 * note. this only acts as a base structure and some nodes types can contain properties
 * that is not documented here, see NodeDefinitions.js specially the default properties
 * for more information
 */
class REDNode
{
    _def = {};
    
    type = "";
    /** the node UID, should never be changed, except when a new node is created */
    id = "";
    /** the name of the node, also used for the node label */
    name = "";
    /** this is used mostly to create a comment for objects, but is also used to store scripts/c++ code @ such node types */
    comment = "";

    /** only used by UI objects */
    tag = ""; // 
    x = 0;
    y = 0;
    /** defines which workspace it belongs to */
    z = ""; // 
    /** node width */
    w = 0;
    /** node height */
    h = 0;

    /** in some cases this would be used for the text color */
    color = "";
    /** the node background color */
    bgColor = "";

    outputs = 0;
    inputs = 0;

    /** Child nodes of the current node, only used by 'groupbox' and 'scriptbutton'
     * @type {REDNode[]} 
     */
    nodes = [];

    /** used in RED.view */
    changed = false;
    /** used in RED.view */
    dirty = false;
    /** used in RED.view */
    valid = true;
    /** used in RED.view */
    selected = false;
    /** used in RED.view */
    resize  = false;
    /** used in RED.view, contains a list of the actual svgRect:s used to visualize the input ports */
    inputlist = [];
    /** used in RED.view, this is actually the output port list, only contains numbers */
    ports = [];
    /** used in RED.view, contains a list of the actual svgRect:s used to visualize the output ports */
    _ports = [];
    /** used in RED.view, the root svg rect used to visualize this node object, this is used to improve the performance when updating a node */
    svgRect = {};
    /** used in RED.view, to buffer the label text dimensions, may be obsolete because of the new text dimensions cache system*/
    textDimensions = {};
    /** used in RED.view */
    textSize = 14;
    /** used in RED.view, by the move function (old x) */
    ox = 0;
    /** used in RED.view, by the move function (old y) */
    oy = 0;

    /**
     * 
     * @param {*} nn new node (type JSON node)
     * @param {*} def node definition
     */
    constructor(nn, def) {
        this.id = nn.id;
        this.name = nn.name;
        this.nodes = nn.nodes;
        this.inputs = nn.inputs;
        this.outputs = nn.outputs;
        this.bgColor = nn.bgColor;
        this.color = nn.color||nn.bgColor;
        this.x = nn.x;
        this.y = nn.y;
        this.z = nn.z;
        this.type = nn.type;
        this._def = def;
        this.wires = nn.wires; // wires is only a temporary property used at node import, it will be deleted after node is imported
        /*,wireNames:n.wireNames*/
        this.changed = false;

        if (def.uiObject != undefined) {
            this.w = nn.w;
            console.log(nn.type + " " + nn.h);
            this.h = nn.h;
        }
    }
};

/**
 * Defines a workspace/class/tab object
 */
class REDWorkspace 
{
    /** defines the type of this object, will never be changed, only used by old export structure */
    type = "tab";

    id = "";
    label = "";
    /** @type {REDNode[]} */
    nodes = [];
    /** @type {REDLink[]} */
    links = [];
    export = true;
    isMain = false;
    mainNameType = "";
    mainNameExt = "";
    isAudioMain = false;
    generateCppDestructor = false;
    extraClassDeclarations = "";
    settings = {};
    /** @type {REDNode[]} */
    tabOutputs = [];
    /** @type {REDNode[]} */
    tabInputs = [];

    constructor(id, label, _export, isMain, mainNameType, mainNameExt, isAudioMain, settings, generateCppDestructor, extraClassDeclarations)
    {
        
        this.id = id;
        this.label = label;
        this.export = (_export != undefined)?_export:true;
        this.isMain = (isMain != undefined)?isMain:false;
        this.mainNameType = (mainNameType != undefined)?mainNameType:"tabName";
        this.mainNameExt = (mainNameExt != undefined)?mainNameExt:".ino";
        this.isAudioMain = (isAudioMain != undefined)?isAudioMain:false;
        this.generateCppDestructor = (generateCppDestructor != undefined)?generateCppDestructor:false;
        this.extraClassDeclarations = (extraClassDeclarations != undefined)?extraClassDeclarations:"";
        if (settings == undefined){ this.settings = RED.settings.getChangedSettings(RED.view); console.warn("Converting old global workspace settings to new individual:" + label + " " + id); }
        else this.settings = settings;
    }
};

class REDLink
{
    /** @type {REDNode} */
    source = {};
    sourcePort = 0;
    /** @type {REDNode} */
    target = {};
    targetPort = 0;

    // the following are mostly used by RED.view visuals
    selected = false;
    /** @type {REDLinkInfo} */
    info = new REDLinkInfo();
    /** @type {REDLinkSvgPaths} */
    svgPath = undefined;
    svgRoot = undefined;
    x1 = 0;
    x2 = 0;
    y1 = 0;
    y2 = 0;

    constructor(source, sourcePort, target, targetPort)
    {
        this.source = source;
        this.sourcePort = parseInt(sourcePort);
        this.target = target;
        this.targetPort = parseInt(targetPort);
    }
    /** used for debug */
    ToString()
    {
        return `sourceName:${this.source.name}, sourcePort:${this.sourcePort}, targetName:${this.target.name}, targetPort:${this.targetPort}`;
    }
};

class REDLinkSvgPaths
{
    background = undefined;
    outline = undefined;
    line = undefined;
    constructor() {}
}

class REDLinkInfo
{
    /** @type {Boolean} */
    isBus = false;
    /** @type {Boolean} */
    valid = true;
    /** @type {String} */
    invalidText = undefined;
    /** @type {REDNode} */
    tabOut = undefined;
    /** @type {REDNode} */
    tabIn = undefined;

    constructor() {}
    /*constructor(isBus,valid,invalidText,tabOut,tabIn) {
        this.isBus = isBus; this.valid = valid; this.invalidText = invalidText; this.tabOut = tabOut; this.tabIn = tabIn;
    }
    setAll(isBus,valid,invalidText,tabOut,tabIn) {
        this.isBus = isBus; this.valid = valid; this.invalidText = invalidText; this.tabOut = tabOut; this.tabIn = tabIn;
    }*/
}

RED.nodes = (function() {

	var node_defs = {}; // TODO remove this and direct use NodeDefinitions in NodeDefinitions.js

    /** @type {REDWorkspace[]} */
    var workspaces = [];
    //var iconSets = {};

    /** @param {REDNode} node */
	function moveNodeToEnd(node)
	{
        // new structure
        var ws = getWorkspace(node.z);
        ws.nodes.push(ws.nodes.splice(ws.nodes.indexOf(node), 1)[0]);
        // old structure TODO remove
		//nodes.push(nodes.splice(nodes.indexOf(node), 1)[0]);
	}
	$('#btn-moveWorkSpaceLeft').click(function() { moveWorkSpaceLeft(); });
	$('#btn-moveWorkSpaceRight').click(function() { moveWorkSpaceRight();  });
	function moveWorkSpaceLeft()
	{
		var index = getWorkspaceIndex(RED.view.getWorkspace());
		if (index == 0) return;

		let wrapper=document.querySelector(".red-ui-tabs");
		let children=wrapper.children;
		
		wrapper.insertBefore(children[index], children[index-1]); // children[index] is inserted before children[index-1]
		var wsTemp = workspaces[index-1];
		workspaces[index-1] = workspaces[index];
		workspaces[index] = wsTemp;
		RED.storage.update();
	}
	function moveWorkSpaceRight()
	{
		var index = getWorkspaceIndex(RED.view.getWorkspace());
		if (index == (workspaces.length-1)) return;

		let wrapper=document.querySelector(".red-ui-tabs");
		let children=wrapper.children;
		
		wrapper.insertBefore(children[index+1], children[index]); // children[index+1] is inserted before children[index]

		var wsTemp = workspaces[index+1];
		workspaces[index+1] = workspaces[index];
		workspaces[index] = wsTemp;
		RED.storage.update();
    }
    
	function arraySpliceExample()
	{
		var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
		console.error("original:" + arr);
		var removed = arr.splice(2,2,4,3);
		console.error("removed:" + removed);
		console.error("modified:" + arr);
	}
    /**
     * this initializes the initClassNodeDefCategory if it don't exists
     */
    function initClassNodeDefCategory() {
        if (node_defs["classNodes"] == undefined) {
            node_defs["classNodes"] = {
                label:"Class Nodes", 
                description:"Class/Tab Autogenerated Node Types",
                url:"",
                types:{}
            };
        }
    }
    function Init_BuiltIn_NodeDefinitions() {
        //var str = $("script[data-container-name|='NodeDefinitions']").html();
        //var nodeDefinitions = $.parseJSON(str);
        //if (nodeDefinitions == undefined) return;
        registerNodeDefinitionGroups(NodeDefinitions); // NodeDefinitions is in NodeDefinitions.js
    }
    function registerNodeDefinitionGroups(nodeDefinitionGroups) {
        var nodeDefGroupNames = Object.getOwnPropertyNames(nodeDefinitionGroups);
        for (var i = 0; i < nodeDefGroupNames.length; i++) {
            var groupName = nodeDefGroupNames[i];
            var group = nodeDefinitionGroups[groupName];
            registerNodeDefinitionGroup(group, groupName);
        }
    }
    function registerNodeDefinitionGroup(nodeDefinitionGroup, uid, dontReplaceExisting) {
        if (nodeDefinitionGroup.disabled != undefined && nodeDefinitionGroup.disabled == true)
            return;
        initNodeDefinitions(nodeDefinitionGroup, uid); // avoid overriding current groups
        if (nodeDefinitionGroup.categoryItems != undefined){
            
            var categoryLabel = "";
            if (nodeDefinitionGroup.categoryLabel!=undefined && nodeDefinitionGroup.categoryLabel.trim().length!=0)
                categoryLabel = nodeDefinitionGroup.categoryLabel;
            else
                categoryLabel = uid;

            var categoryUid = uid;

            var categoryPopupText = `<b>${nodeDefinitionGroup.credits}'s AudioObjects</b><br><br>${nodeDefinitionGroup.description}<br>${nodeDefinitionGroup.homepage}`;

            console.log("adding custom nodeDefinitionGroup.categoryItems, categoryUid:"+categoryUid+", categoryLabel:"+categoryLabel);
            // first create the 'root' category 
            if (categoryUid.length != 0)
                RED.palette.createCategoryContainer(categoryUid, "", false, nodeDefinitionGroup.categoryHeaderStyle, categoryLabel, categoryPopupText);
            // add the sub-categories
            RED.palette.addCategories(nodeDefinitionGroup.categoryItems, categoryUid);
        }
        var types = nodeDefinitionGroup["types"];
        if (types == undefined) {
            RED.notify("error @ RED.nodes.registerNodeDefinitionGroup " + uid + " don't contain a types object", "error", null, 6000);
            console.warn(nodeDefinitionGroup);
        }
        var typesNames = Object.getOwnPropertyNames(types);
        for (var ti = 0; ti < typesNames.length; ti++) {
            var typeName = typesNames[ti];
            var type = types[typeName];
            registerType(typeName, type, uid, dontReplaceExisting);
        }
    }
    function initNodeDefinitions(nodeDefinitions, uid) {
        if (node_defs[uid] == undefined) {
            node_defs[uid] = nodeDefinitions;
        }
    }
	function registerType(nt,def,nodeDefGroupName,dontReplaceExisting) {
        if (dontReplaceExisting != undefined && dontReplaceExisting == "true") {
            return;
        }
        
        node_defs[nodeDefGroupName].types[nt] = def;

        // fix old type of category def.
        if (def.category != undefined && def.category.endsWith("-function")) def.category = def.category.replace("-function", "");

        if (def.defaults == undefined) return; // discard this node def

        if (def.defaults.color == undefined) def.defaults.color = {};
        if (def.defaults.color.value == undefined) def.defaults.color.value = def.color;

        if (def.inputTypes != undefined) {
            def.inputTypes = convertPortTypeRange(def.inputTypes);
            def.inputs = Object.getOwnPropertyNames(def.inputTypes).length;
        }
        if (def.outputTypes != undefined) {
            def.outputTypes = convertPortTypeRange(def.outputTypes);
            def.outputs = Object.getOwnPropertyNames(def.outputTypes).length;
        }

        // TODO: too tightly coupled into palette UI (@NodeRED team)

        try{
		
        //console.log("nodeDefGroupName:"+nodeDefGroupName);
            
            if (def.dontShowInPalette == undefined) {

                var isInSubCat = node_defs[nodeDefGroupName].categoryItems != undefined;
                RED.palette.add(nt,def,node_defs[nodeDefGroupName].categoryRoot,nodeDefGroupName,isInSubCat);
            }
        }
        catch (ex) { console.error(ex);RED.notify("<strong>Warning</strong>: Fail to add this type to the palette<br>" + nt,"warning");} // failsafe
	}

    function convertPortTypeRange(types) {
        var newList = {};
        var ti = 0;
        var typeNames = Object.getOwnPropertyNames(types);
        for (var i = 0; i < typeNames.length; i++) {
            var tn = typeNames[i];
            if (tn.startsWith('x')) {
                var count = parseInt(tn.substring(1));
                for (var ci = 0; ci < count; ci++, ti++)
                    newList[ti] = types[tn];
            }
            else if (tn == "n") {
                return {"n":types.n}; // type n will override everything
            }
            else newList[tn] = types[tn];
        }
        return newList;
    }
    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

	function getNewUID() {
		//var str = (1+Math.random()*4294967295).toString(16);
        var str = new Date().toISOString().split('-').join('').split(':').join('').replace('.','_') + "_" + getRandomInt(65535).toString(16);
		//console.log("getID = " + str);
		return str;
	}

	function checkID(id) {
        return eachNodeRet(function(n,ws){
            if (n.id == id) return true;
        },false);
	}
    /**
     * 
     * @param {String} name 
     * @param {String} wsId 
     * @param {REDNode} node 
     * @returns 
     */
	function checkName(name, wsId, node) { // jannik add
		var nodes = getWorkspace(wsId).nodes;
        //var arrayName = getArrayName(name);
		for (var i=0;i<nodes.length;i++) {
			if (nodes[i]._def.nonObject != undefined) continue; // don't check against nonObjects
            if (nodes[i] == node) continue; // don't check against itself
            var nodeName = getArrayName(nodes[i].name);//.split('['); // get array name without array def,
            
			if (nodeName == name){
                return {node:node, nodeDuplicate:nodes[i]};
            }
		}
		return undefined;
	}
    function getArrayName(name) {
        var si = name.indexOf("[");
        if (si == -1) return name;
        return name.substring(0,si);
    }
    function getArrayDef(name) {
        var si = name.indexOf("[");
        if (si == -1) return "";
        return name.substring(si);
    }

	function createUniqueCppName(n, wsId, nameShouldEndWithNumber) {
		//console.log("getUniqueCppName, n.type=" + n.type + ", n.name=" + n.name + ", n._def.shortName=" + n._def.shortName);
		var arrayDef = getArrayDef(n.name);
        var basename = getArrayName(n.name); //(n._def.shortName) ? n._def.shortName : n.type.replace(/^Analog/, "");
		if (checkName(basename, wsId) == undefined) {
            console.warn("name dont need change " + basename);
            return basename; // no need to change
        }
		var count = 1;
        if (nameShouldEndWithNumber == undefined) {
            //console.log("generate name from: " + basename);
            var ret = getBaseName(basename);
            basename = ret.basename;
            count = ret.count;
        }
        else
        {
            var sep = /[0-9]$/.test(basename) ? "_" : ""; // expression checks if basename ends with a number, sep = seperator
            basename = basename + sep;
        }
		//console.log("getUniqueCppName, using basename=" + basename);
		
		//
        //console.log("sep:" + sep);
		var name;
		while (1) {
			//name = basename + sep + count;
            name = basename + count;
			if (checkName(name, wsId) == undefined) break;
			count++;
		}
		//console.log("getUniqueCppName, unique name=" + name);
		return name + arrayDef; // add arrayDef if it had that
	}
    function getBaseName(name) {
        var index = name.length - 1;
        var number = "";
        while (index >= 0 && charIsNumber(name[index])) {
            number = name[index] + number;
            index--;
        }
        var basename = name.substring(0, index+1);
        //console.log(basename + " " + number);
        if (number == "") number = "1";
        return {basename:basename, count:parseInt(number)};
    }
    function charIsNumber(char) {
        return (char >= '0') && (char <= '9');
    }
	
	function createUniqueCppId(n, workspaceName) {
		//console.log("getUniqueCppId, n.type=" + n.type + ", n.name=" + n.name + ", n._def.shortName=" + n._def.shortName);
		var basename = (n._def.shortName) ? n._def.shortName : n.type.replace(/^Analog/, "");
		console.warn("createUniqueCppId:", n.id, " @ " + workspaceName);
		if (workspaceName != undefined)
			basename = workspaceName + "_" + basename; // Jannik added

		//console.log("getUniqueCppId, using basename=" + basename);
		var count = 1;
		var sep = /[0-9]$/.test(basename) ? "_" : "";
		var name;
		while (1) {
			name = basename + sep + count;
			if (checkID(name) == false) break;
			count++;
		}
		//console.log("getUniqueCppId, unique id=" + name);
		return name;
	}

	function getUniqueName(n) {
		var newName = n.name;
		if (typeof newName === "string") {
			var parts = newName.match(/(\d*)$/);
			var count = 0;
			var base = newName;
			if (parts) {
				count = isNaN(parseInt(parts[1])) ? 0 : parseInt(parts[1]);
				base = newName.replace(count, "");
			}
			while (RED.nodes.namedNode(newName) !== null) {
				count += 1;
				newName = base + count;
			}
		}
		return newName;
	}

	function getTypeDef(type) {
        var defCatNames = Object.getOwnPropertyNames(node_defs);
        for (var i = 0; i < defCatNames.length; i++) {
            var defCatName = defCatNames[i];
            var defCat = node_defs[defCatName];
            if (defCat.types[type] != undefined) return defCat.types[type];
        }
        console.error("did not found type: " + type);
		return undefined;
	}
	function selectNode(name) {
        var info = "";
        if (name.trim() != "") info = '?info=' + name;
		if (!((document.origin == 'null') && (window.chrome))) {
			window.history.pushState(null, null, window.location.protocol + "//"
				+ window.location.host + window.location.pathname + info);
		}
	}
	/**
	 * 
	 * @param {REDNode} n
     * @param {REDWorkspace} ws
	 */
	function addNode(n,ws) {
		/*if (n.type == "AudioMixerX")
		{
			if (!n.inputs)
				n.inputs = n._def.inputs;
		}*/
        //n.isArray = RED.export.isNameDeclarationArray(n.name, n.z, true);
        n.dirty = true;
        
        //nodes.push(n);

        if (ws == undefined)
            ws = getWorkspace(n.z);
        if (ws.nodes == undefined) ws.nodes = [];
        ws.nodes.push(n);
        
        RED.events.emit('nodes:add',n);
	}
    /**
     * 
     * @param {REDLink} l 
     * @param {REDWorkspace} ws 
     */
	function addLink(l,ws) {
		//links.push(l);

        if (ws == undefined)
            ws = getWorkspace(l.source.z);
        if (ws.links == undefined)
            ws.links = [];

        ws.links.push(l);

        if (loadingWorkspaces == false) {
            setLinkInfo(l);
            //RED.export.links2.generateAndAddExportInfo(l); // should be used when exporting links instead, this was only a dev-test
        }
        RED.events.emit('links:add',l);
	}
    
	function checkForIO() {
		var hasIO = false;
		eachNode(function (node) {
            if (node._def.category == undefined) return;
			if (node._def.category.startsWith("input-") ||
				node._def.category.startsWith("output-")) {
				hasIO = true;
			}
		});
		return hasIO;
	}

    function checkForAudio() {
		var hasAudio = false;
		eachNode(function (node) {

			if (node.type.includes("Audio")) {
				hasAudio = true;
			}
		});
		return hasAudio;
	}

    /**
     * 
     * @param {String} id 
     * @param {String} wsId 
     * @returns {REDNode}
     */
	function getNode(id,wsId) {
        if (wsId == undefined) {
            return eachNodeRet(function(n,ws) {
                if (n.id == id) return n;
            },null);
        }
        else {
            var ws = getWorkspace(wsId);
            return wsEachNodeRet(ws, function(n) {
                if (n.id == id) return n;
            },null);
        }
	}

    /**
     * 
     * @param {String} name 
     * @param {REDNode[]} nodes 
     * @param {String} wsId 
     * @returns {REDNode}
     */
	function getNodeByName(name,nodes,wsId) {
        if (wsId == undefined) wsId = RED.view.activeWorkspace;
        var ws = getWorkspace(wsId);
        if (ws == undefined) return undefined;
        if (nodes == undefined) nodes = ws.nodes;
        //console.trace(nns);
        //console.log("getNodeByName " + name + " @ " + wsId);
		for (var i=0; i < nodes.length; i++) {
            var node = nodes[i];
            //console.log("checking ", node)
            if (wsId != undefined && node.z != wsId) continue; // workspace filter
			if (getArrayName(node.name) == name) {
                //console.warn("################# found " + node.name + "==" + name);
				return node;
			}
            //else
                //console.warn(nodes[i].name + "!=" + name);
		}
        //console.warn("################# did not found " + name + " @ " + wsId);
		return undefined;
	}

	function removeNode(id) {
        /** @type {REDLink[]} */
		var removedLinks = [];
		
        var node = getNode(id);
        
        if (!node) return removedLinks; // cannot continue if node don't exists

        if (node.type == "TabInput" || node.type == "TabOutput")
        {
            var wsLabel = getWorkspaceLabel(RED.view.getWorkspace());
            RED.console_ok("workspace label:" + wsLabel);
            refreshClassNodes();
        }

        var ws = getWorkspace(node.z);
        ws.nodes.splice(ws.nodes.indexOf(node),1);
    
        removedLinks = ws.links.filter(function(l) { return (l.source === node) || (l.target === node); });
        removedLinks.map(function(l) {ws.links.splice(ws.links.indexOf(l), 1); });
		
        // to use with OSC event
        RED.events.emit('nodes:removed', node, removedLinks);

        // normal event
        RED.events.emit('nodes:remove',node);

		return removedLinks;
	}

	function removeLink(l) {
        var ws = getWorkspace(l.source.z);
        RED.events.emit('links:remove',l); // OSC liveupdate need this to happen before actually removing the link
		var index = ws.links.indexOf(l);
		if (index == -1) return;
		ws.links.splice(index,1);
	}

	function refreshValidation() {
        eachNode(function (n,ws) {
            RED.editor.validateNode(n);
        });
	}

    /**
     * @param {REDWorkspace} ws 
     * @param {Number} position 
     */
	function addWorkspace(ws,position) {
        if (position == undefined)
		    workspaces.push(ws);
        else
            workspaces.splice(position, 0, ws);
		//currentWorkspace = ws;
        addClassTabsToPalette();
        RED.events.emit('flows:add',ws);
	}
    /**
     * @param {String} id 
     * @returns {String}
     */
	function getWorkspaceLabel(id)
	{
		//console.warn("getWorkspaceLabel:" +id);
		for (var i = 0; i < workspaces.length; i++)
		{
			if (workspaces[i].id == id)
				return workspaces[i].label;
		}
		return undefined;
	}
    /**
     * @param {String} id 
     * @returns {Number} -1 if not found
     */
	function getWorkspaceIndex(id)
	{
		for (var i = 0; i < workspaces.length; i++)
		{
			if (workspaces[i].id == id)
				return i;
		}
		return -1;
	}
    /**
     * @param {String} id 
     * @returns {REDWorkspace} or undefined if not found
     */
	function getWorkspace(id) {
		for (var i = 0; i < workspaces.length; i++)
		{
			if (workspaces[i].id == id)
				return workspaces[i];
		}
		return undefined;
	}
	function removeWorkspace(id) {
		console.trace("workspace removed " + id);
        var wsIndex = getWorkspaceIndex(id);
        var ws = workspaces[wsIndex];
		var wsLbl = ws.label;
		if (wsIndex != -1) workspaces.splice(wsIndex, 1);
		
		var removedNodes = [];
		var removedLinks = [];
		var n;
		for (n=0;n<ws.nodes.length;n++) {
			var node = ws.nodes[n];
			//if (node.z == id) {
				removedNodes.push(node);
			//}
		}
		for (n=0;n<removedNodes.length;n++) {
			var rmlinks = removeNode(removedNodes[n].id);
			removedLinks = removedLinks.concat(rmlinks);
		}
		if (node_defs["classNodes"].types[wsLbl] != undefined)
		{
			delete node_defs["classNodes"].types[wsLbl];

			console.log("class type deleted "+ wsLbl);
		}
		removeClassNodes(wsLbl);
		addClassTabsToPalette();
        refreshClassNodes();
        RED.events.emit('flows:remove',ws);
		return {nodes:removedNodes,links:removedLinks,workspaceIndex:wsIndex};
	}

    /**
     * 
     * @param {REDNode} node 
     * @returns {REDNode[]}
     */
	function getAllFlowNodes(node) {
		var visited = {};
		visited[node.id] = true;
		var nns = [node];
		var stack = [node];
		while(stack.length !== 0) {
			var n = stack.shift();
            var ws = getWorkspace(n.z);
			var childLinks = ws.links.filter(function(d) { return (d.source === n) || (d.target === n);});
			for (var i=0;i<childLinks.length;i++) {
				var child = (childLinks[i].source === n)?childLinks[i].target:childLinks[i].source;
				if (!visited[child.id]) {
					visited[child.id] = true;
					nns.push(child);
					stack.push(child);
				}
			}
		}
		return nns;
	}
    /**
     * 
     * @param {REDNode[]} nodes 
     * @returns {String[]}
     */
	function getNodesIds(nodes)
	{
		if (nodes == undefined) return [];
		var nids = [];
		for (var i = 0; i < nodes.length; i++)
		{
			if (nodes[i] == undefined) continue;
			nids.push(nodes[i].id);
		}
		return nids;
	}
	/**
	 * Converts a node to an exportable JSON Object
     * @param {REDNode} node 
     * @param {REDWorkspace} ws
     * @returns {*} exportable node JSON, TODO create a type for this called JSONNode
	 **/
	function convertNode(n,ws,newVer) {
        if (n.wires != undefined) return n; // if wires is defined, node is allready converted
        if (newVer == undefined) newVer = false;
		var node = {};
		node.id = n.id;
		node.type = n.type;

		for (var d in n._def.defaults) {
			if (n._def.defaults.hasOwnProperty(d)) {
				if (d === "nodes")
					node[d] = getNodesIds(n[d]);
                else if (n._def.defaults[d].type!=undefined && n._def.defaults[d].type == "dontsave")
                    continue;
				else if (d != "color")
					node[d] = n[d];
			}
		}
		if (n.parentGroup != undefined)
		{
			node.parentGroup = n.parentGroup.id;
		}
		
        node.x = n.x;
        node.y = n.y;
        node.z = n.z;
        node.bgColor = n.bgColor;
        node.wires = [];
        //node.wireNames = [];
        for(var i=0;i<n.outputs;i++) {
            node.wires.push([]);
            //node.wireNames.push([]);
        }
        if (ws == undefined)
            ws = getWorkspace(n.z);
        var wires = ws.links.filter(function(d){return d.source === n;});
        for (var j=0;j<wires.length;j++) {
            var w = wires[j];
            try{
            if (newVer == false)
                node.wires[w.sourcePort].push(w.target.id + ":" + w.targetPort);
            else
            {
                var newVerWire = {
                    "def":w.target.id + ":" + w.targetPort,
                    "name":w.name,
                    "comment":w.comment,
                    "style":w.style
                };
                node.wires[w.sourcePort].push(newVerWire);
            }
            //node.wireNames[w.sourcePort].push(RED.export.links.GetName(w));
            }
            catch (e)
            {
                // when a TabInput/TabOutput is removed and that pin is connected to parent flow

            }
        }

		//console.warn("convert node: " + n.name);
		//console.warn("from:" + Object.getOwnPropertyNames(n._def));
		//console.warn("to:" + Object.getOwnPropertyNames(node));
		return node;
	}

	/**
	 * Converts the current node selection to an exportable JSON Object
	 **/
	function createExportableNodeSet(set) {
		var nns = [];
		//var exportedConfigNodes = {};
		for (var n=0;n<set.length;n++) {
			var node = set[n].n;
			var convertedNode = RED.nodes.convertNode(node);
			nns.push(convertedNode);
		}
		return nns;
	}

    /** this sorts both the nodes and the links, so that they are exported in the right order */
    function sortNodes() {
        //console.error("nodecount before sort: "+nodes.length);
        //var sortedNodes = [];
        for (wsi=0;wsi<workspaces.length;wsi++)
		{
			var ws = workspaces[wsi];

            var absoluteXposMax = 0;
            var absoluteYposMax = 0;
            var workspaceColSize = RED.view.defSettings.gridVmajorSize;
            
            // if the ws.settings.gridVmajorSize is defined then use that instead
            if (ws.settings.gridVmajorSize != undefined) workspaceColSize = ws.settings.gridVmajorSize;
            // calculate absolute node max and min positions
            for (var ni = 0; ni < ws.nodes.length; ni++)
            {
                var node = ws.nodes[ni];
                //if (node.z != ws.id) continue; // workspace filter
                if (node.x > absoluteXposMax) absoluteXposMax = node.x;
                if (node.y > absoluteYposMax) absoluteYposMax = node.y;
            }
            // ensure that every node is included 
            absoluteXposMax += workspaceColSize*4; 
            absoluteYposMax += RED.view.node_def.height*4;
            var otherNodes = [];
			// sort audio nodes by columns (xpos)
			for (var xPosMin = 0; xPosMin < absoluteXposMax; xPosMin+=workspaceColSize)
			{
				var nnsCol = []; // current column
				var xPosMax = xPosMin+workspaceColSize;

				for (ni=0;ni<ws.nodes.length;ni++)
				{
					var node = ws.nodes[ni];
					//if (node.z != ws.id) continue; // workspace filter

					if (node._def.uiObject != undefined) continue; // skip 'ui nodes' they are added down (and should never be sorted because then it will mess up ui layout)
                    if (node.type == "TabInput" || node.type == "TabOutput") continue; // skip TabInputs TabOutputs they are added down

					if ((node.x >= xPosMin) && (node.x < xPosMax))
						nnsCol.push(node);
				}
				// sort "new" nodes by ypos
				nnsCol.sort(function(a,b){return(a.y-b.y);});
                otherNodes.push(...nnsCol);
            }
            var classIOnodes = [];
            var uiNodes = [];
            // add ui nodes last and as they are in draw order
			for (var ni=0;ni<ws.nodes.length;ni++)
			{
				var node = ws.nodes[ni];
				//if (node.z != ws.id) continue; // workspace filter
                if (node.type == "TabInput" || node.type == "TabOutput") { // handle TabInputs TabOutputs separately as they should be sorted top to bottom regardless of x pos
                    classIOnodes.push(node);
                    continue;
                }
				if (node._def.uiObject == undefined) continue; // skip other non ui nodes
                // just add ui nodes as is to preserve draw order
                uiNodes.push(node);
			}
            classIOnodes.sort(function(a,b){return(a.y-b.y);});

            ws.nodes.length = 0;
            ws.nodes.push(...uiNodes);
            ws.nodes.push(...classIOnodes);
            ws.nodes.push(...otherNodes);

            var nodeIndex = 0;
            for (var i = 0; i < ws.nodes.length; i++)
                ws.nodes[i].sortIndex = nodeIndex++;

            var linksSorted = [];
            /*var linksListBeforeSort = [];
            for (let i = 0;i< ws.links.length; i++) {
                var link = ws.links[i];
                linksListBeforeSort.push({srcName:link.source.name, srcPort:link.sourcePort, dstName:link.target.name, dstPort:link.targetPort});
            }
            console.log("linksBeforeSort:",linksListBeforeSort);*/
            for (var ni = 0; ni < ws.nodes.length; ni++) {
                var node = ws.nodes[ni];
                var nodeLinks = ws.links.filter(function(d){return d.source === node;});
                nodeLinks.sort(function (a,b) { return ( (a.sourcePort-b.sourcePort)+(a.target.sortIndex-b.target.sortIndex) ); });
                linksSorted.push(...nodeLinks);
            }
            ws.links.length = 0;
            ws.links.push(...linksSorted);
            /*var linksListAfterSort = [];
            for (let i = 0;i< linksSorted.length; i++) {
                var link = linksSorted[i];
                linksListAfterSort.push({srcName:link.source.name, srcPort:link.sourcePort, dstName:link.target.name, dstPort:link.targetPort});
            }
            console.log("linksListAfterSort:",linksListAfterSort);*/
		}
        
        //console.error("nodecount after sort: "+nodes.length);
    }
    /**
     * 
     * @param {REDWorkspace} ws 
     * @returns {REDWorkspace} copy with empty arrays of nodes and links(not used at export)
     */
	function createExportableWorkspace(ws) {
        return new REDWorkspace(ws.id, ws.label, ws.export, ws.isMain, ws.mainNameType, ws.mainNameExt, ws.isAudioMain, ws.settings, ws.generateCppDestructor, ws.extraClassDeclarations);
        //return createWorkspaceObject(ws.id, ws.label, ws.export, ws.isMain, ws.mainNameType, ws.mainNameExt, ws.isAudioMain, ws.settings, ws.generateCppDestructor, ws.extraClassDeclarations);
        //return JSON.parse(JSON.stringify(ws));
    }

	function createCompleteNodeSet(args) {

        var sort;
        if (args == undefined) args = {};

        if (args.newVer == undefined) var newVersion = false;
        else var newVersion = args.newVer;

        if (args.sort == undefined) sort = true; // default is allways sort
        else sort = args.sort;

        if (sort == true) sortNodes();

		if(newVersion == true) var project = {version:1};
        else var nns = [];
        
        if (newVersion == true)
            project.settings = RED.settings.getAsJSONobj();
        else
            nns.push({"type":"settings", "data":RED.settings.getAsJSONobj()});
        
        if (newVersion == false) {
            // first add all workspaces/tabs to the nns
            for (let wsi=0;wsi<workspaces.length;wsi++) {
                nns.push(createExportableWorkspace(workspaces[wsi]));
            }
        }
		var _workspaces = [];
		// sort nodes by workspace
		for (var wsi=0;wsi<workspaces.length;wsi++)
		{
            var _ws = workspaces[wsi];

            if (newVersion == true) {
                // so that we don't work with the active set, that resulted in a nasty suprice once
                // this is also to eliminate circular references when doing JSON.stringify later
                var ws = createExportableWorkspace(_ws); 
                //console.log(ws);
                ws.nodes = [];
                _workspaces.push(ws);
            }

            // have finalVersion check for here now, 
            // that make it possible to try it out
            //if (finalVersion == true) var _nodes = _ws.nodes;
            //else                      var _nodes = nodes;

            for (var ni = 0; ni < _ws.nodes.length; ni++) {
                var node = _ws.nodes[ni];
                //if (node.z != _ws.id) continue; // workspace filter, still OLD internal structure

                if (newVersion == true)
                    ws.nodes.push(convertNode(node, undefined, true));
                else
				    nns.push(convertNode(node)); 
            }
		}
        if (newVersion == true) {
            project.workspaces = _workspaces;
            project.nodeAddons = getNodeAddons();
            exportedSet = workspaces;
            return project;
        }
        else {
            exportedSet = nns;
		    return nns;
        }
	}

    function getNodeAddons() {
        var naddons = {};
        var ndcn = Object.getOwnPropertyNames(node_defs);
        for (var ndi = 0; ndi < ndcn.length; ndi++) {
            var ndn = ndcn[ndi];
            var nd = node_defs[ndn];
            if (nd.isAddon != undefined && nd.isAddon == true) {
                naddons[ndn] = nd;
            }
            //else console.warn("skippin ", nd);
        }
        return naddons;
    }
	
	
	function createNewDefaultWorkspace() // Jannik Add function
	{
		console.trace();
		if (workspaces.length != 0) return;
        var newWorkspace = new REDWorkspace("Main", "Main");
		//var newWorkspace = createWorkspaceObject("Main","Main");
		console.warn("add new default workspace Main");
		addWorkspace(newWorkspace);
		RED.view.addWorkspace(newWorkspace);
	}

	function importWorkspaces(nns, createNewIds) // nns = (new node s) or maybe (new node set)
	{
		var newWorkspaces = [];
        // scan and load workspaces and settings first
        for (i=0;i<nns.length;i++) { 
            n = nns[i];
            
            // filter for workspace and tab types
            if (n.type !== "tab" && n.type !== "workspace") continue;

            if (n.type === "workspace") n.type = "tab"; // type conversion

            var ws = new REDWorkspace(n.id, n.label, n.export, n.isMain, n.mainNameType, n.mainNameExt, n.isAudioMain, n.settings, n.generateCppDestructor, n.extraClassDeclarations);

            addWorkspace(ws);
            newWorkspaces.push(ws);
            
            //console.warn("added new workspace lbl:" + ws.label + ",inputs:" + ws.inputs + ",outputs:" + ws.outputs + ",id:" + ws.id);

            initClassNodeDefCategory();
            registerType(ws.label, getClassNodeDefinition(ws.label, ws.inputs, ws.outputs, ws), "classNodes");
        }
        RED.storage.dontSave = true; // prevent save between tab switch
        for (i=0; i < newWorkspaces.length; i++) {
            RED.view.addWorkspace(newWorkspaces[i]); // "final" function is in tabs.js
        }
        RED.storage.dontSave = false;
	}

    // new version import workspace nodes
    function importWorkspacesNodes(workspaces, createNewIds) {
        const t0 = performance.now();
        for (var i = 0; i < workspaces.length; i++) {
            var iws = workspaces[i]; // import workspace
            var ws = getWorkspace(iws.id); // this is the actual loaded workspace
            // failsafe check
            if (iws.nodes != undefined && iws.nodes.length != 0) {
                importNewNodes(iws.nodes, createNewIds, ws);
            }
        }
        const t1 = performance.now();
        console.warn("importWorkspacesNodes total load time:" + (t1-t0));
    }

    function loadAndApplySettings(jsonObj) {
        for (i=0;i<jsonObj.length;i++) { 
            n = jsonObj[i];
            if (n.type !== "settings") continue;
			
            console.warn('Loading Project Settings');
			RED.settings.setFromJSONobj(n.data);
			return;
        }
    }

    function isNewVersion(newNodes) {
        // new version have either of theese defined
        if (newNodes.version != undefined)
            return true;
        else if (newNodes.workspaces != undefined)
            return true;
        else if (newNodes.settings != undefined)
            return true;
        else if (newNodes.nodeAddons != undefined)
            return true;
        return false;
    }
    var loadingWorkspaces = false;
	function importNodes(newNodesObj, createNewIds, clearCurrentFlow) {
		//console.trace("@ importNodes - createNewIds:" + createNewIds);
		loadingWorkspaces = true;
		var newNodes;
		if (createNewIds == undefined)
			createNewIds = false; // not really necessary?
		if (clearCurrentFlow)
		{
			//console.trace("clear flow");
			//node_defs = {};
			//nodes.length = 0;
			//configNodes = {};
			//links.length = 0; // link structure {source:,sourcePort:,target:,targetPort:};
			//workspaces.length = 0;
			//currentWorkspace = {};
		}
		try {
			if (typeof newNodesObj === "string") {
				if (newNodesObj === "") {
					//console.trace("newNodexObj == null create");
					createNewDefaultWorkspace();
                    loadingWorkspaces = false;
                    refreshLinksInfo();
                    refreshDynInputsObjects_connectedTo();
					return;
				}
				newNodes = JSON.parse(newNodesObj);
			} else {
				newNodes = newNodesObj;
			}

            if (isNewVersion(newNodes) == true)
            {
                //RED.notify("new json structure detected, ver: " + newNodes.version, "info", null, 2000);
                if (newNodes.settings != undefined) {
                    RED.settings.setFromJSONobj(newNodes.settings);
                }
                //else
                //    RED.notify("newNodes.settings is undefined, using defaults", "warning", null, 2000); //  this is for the future version of structure, not yet implemented
                
                if (newNodes.nodeAddons != undefined) {
                    // here the new node addons loading should happen
                    // I belive the easiest way is to store the node defs inside the project instead of the indexedDB
                    var nodeDefinitionCategoryNames = Object.getOwnPropertyNames(newNodes.nodeAddons);
                    for (var i = 0; i < nodeDefinitionCategoryNames.length; i++) {
                        var catName = nodeDefinitionCategoryNames[i];
                        var cat = newNodes.nodeAddons[catName];
                        registerNodeDefinitionGroup(cat, catName);
                    }
                }

                if (newNodes.workspaces != undefined)
                {
                    importWorkspaces(newNodes.workspaces, createNewIds);
                    // import the workspace nodes can only be done 
                    // after all workspaces have been loaded in importWorkspaces function above
                    importWorkspacesNodes(newNodes.workspaces, createNewIds);
                }
                else {
                    RED.notify("newNodes.workspaces is undefined, cannot import workspaces", "warning", null, 2000);
                    loadingWorkspaces = false;
                    refreshLinksInfo();
                    refreshDynInputsObjects_connectedTo();
                    return;
                }
            }
            else // old version or single node(s) import
            {
                if (!$.isArray(newNodes)) { // if only one node is imported
                    console.warn("@ !$.isArray(newNodes)");
                    newNodes = [newNodes];
                }
                loadAndApplySettings(newNodes);
                importWorkspaces(newNodes);
                if (workspaces.length == 0) {
                    createNewDefaultWorkspace(); // jannik changed to function
                }
                loadingWorkspaces = false;
                refreshLinksInfo();
                refreshDynInputsObjects_connectedTo();
                return importNewNodes(newNodes, createNewIds);
            }
		}
		catch(error) { // hijack import errors so that a notification can be shown to the user
			createNewDefaultWorkspace();
			var newException = error.message + " " +  error.stack;
			RED.notify("<strong>import nodes Error</strong>: " + newException, "error",null,false,20000); // better timeout
            loadingWorkspaces = false;
            //refreshLinksInfo();
			throw newException; // throw exception so it can be shown in webbrowser console
		}
        loadingWorkspaces = false;
        //console.warn(workspaces);
        checkForAndSetNodeIsArray();
        refreshLinksInfo();
        refreshDynInputsObjects_connectedTo();
	}

    /**
     * 
     * @param {*} nns 
     * @param {*} createNewIds 
     * @param {REDWorkspace} ws 
     * @returns 
     */
    function importNewNodes(nns, createNewIds, ws) { // nns = New Node s
        var i;
		var nn;
        var node_map = {};
        /** @type {REDNode[]} */
        var new_nodes = [];
        /** @type {REDLink[]} */
        var new_links = [];
        // scan and display list of unknown types, also import ConstValues so that they are added first
        var unknownTypes = [];
        for (i=0;i<nns.length;i++) {
            nn = nns[i];
            //if (n.type == "AudioMixerX") n.type = "AudioMixer"; // type conversion
            if (nn.type == "Array") nn.type = "PointerArray"; // type conversion
            // TODO: remove workspace in next release+1(Node-Red team comment)
            if (nn.type != "workspace" && nn.type != "tab" && nn.type != "settings" && !getTypeDef(nn.type)) {
                console.warn("whello");
                // TODO: get this UI thing out of here! (see below as well) (Node-Red team comment)
                //n.name = n.type;
                //n.type = "unknown";
                //n.unknownType = true;
                if (unknownTypes.indexOf(nn.type + ":" + nn.name)==-1) {
                    unknownTypes.push(nn.type + ":" + nn.name);
                }
                if (nn.x == null && nn.y == null) {
                    // config node - remove it
                    nns.splice(i,1);
                    i--;
                }
            }
            if (nn.type == "ConstValue") { // import here so it can be accessed by RED.editor.validateNode(node);
                var node = importNewNode(nn,createNewIds,ws);
                if (node == undefined) continue;
                
                node_map[nn.id] = node; // node_map is used for simple access to destinations when generating wires
                new_nodes.push(node);
            }
        }
        if (unknownTypes.length > 0) {
            var typeList = "<ul><li>"+unknownTypes.join("</li><li>")+"</li></ul>";
            var type = "type"+(unknownTypes.length > 1?"s":"");
            RED.notify("<strong>Imported unrecognised "+type+":</strong>"+typeList,"error",false,10000);
            //"DO NOT DEPLOY while in this state.<br/>Either, add missing types to Node-RED, restart and then reload page,<br/>or delete unknown "+n.name+", rewire as required, and then deploy.","error");
        }

        for (i=0;i<nns.length;i++) {
            nn = nns[i];

            // theese two are for backward compatibility
            if (nn.type === "workspace" || nn.type === "tab") continue;
            else if (nn.type === "settings") continue;
            else if (nn.type === "ConstValue") continue; // imported above

            var node = importNewNode(nn,createNewIds,ws);
            if (node == undefined) continue;
            
            node_map[nn.id] = node; // node_map is used for simple access to destinations when generating wires
            new_nodes.push(node);
        }
        // adding the links (wires) and group childNodes
        for (i=0;i<new_nodes.length;i++)
        {
            nn = new_nodes[i];
            //console.error(n);
            for (var w1=0;w1<nn.wires.length;w1++)
            {
                var wires = (nn.wires[w1] instanceof Array)?nn.wires[w1]:[nn.wires[w1]]; // if not array then convert to array
                var allreadyAdded = []; // to check for duplicates
                for (var w2=0;w2<wires.length;w2++)
                {
                    var wire = wires[w2];
                    var wireDef = "";
                    if (wire == null) continue;
                    //console.log(typeof(wire));
                    if (typeof(wire) == "string") wireDef = wire;
                    else if (typeof(wire) == "object") wireDef = wire.def;
                    else continue;

                    // duplicate failsafe check
                    if (allreadyAdded.includes(wireDef)) continue;
                    allreadyAdded.push(wireDef);

                    var parts = wireDef.split(":");
                    if (parts.length != 2) continue;
                    if ((parts[0] in node_map) == false) continue;

                    var dst = node_map[parts[0]];
                    
                    var link = new REDLink(nn, w1, dst, parts[1]);

                    if (typeof(wire) == "object") {
                        link.style = wire.style;
                        link.name = wire.name;
                        link.comment = wire.comment;
                    }
                    //var link = {source:nn,sourcePort:w1,target:dst,targetPort:parts[1]};
                    //link.info = new REDLinkInfo();
                    /*
                    if (n.wireNames != undefined) {
                        try { var linkName = n.wireNames[w1][w2]; }
                        catch (err) { console.warn(" could not get prev link names  @ " +n.name); var linkName = RED.export.links.GetName(link);}
                    } else { var linkName = RED.export.links.GetName(link); }
                    link.name = linkName;
                    */
                    addLink(link,ws);
                    new_links.push(link);
                }
            }
            // add group childnodes
            if (nn.nodes != undefined)
            {
                var newNodesList = [];
                for (var ni = 0; ni < nn.nodes.length; ni++)
                {
                    var nodeRef = node_map[nn.nodes[ni]];
                    if (nodeRef != undefined) newNodesList.push(nodeRef);
                }
                nn.nodes = newNodesList;
            }
            // set node parent group
            if (nn.parentGroup != undefined)
            {
                nn.parentGroup = node_map[nn.parentGroup]; // convert id to ref
            }
            
            delete nn.wires;
            
            //delete n.wireNames;
        }
        return [new_nodes,new_links];
    }

    function createUnknownNodeTypeDef(nn) {
        return {
            unknownType:true,
            color:"#fee",
            defaults: {"name":{"value":"new"},"id":{"value":"new"},"comment":{"value":""}},
            label: nn.name,
            labelStyle: "node_label_italic",
            icon:"arrow-in.png",
            outputs: nn.outputs||nn.wires.length,
            inputs: nn.inputs||1    //getNodeInputCount(newNodes, nn.z, nn.id)
        }
    }

    /**
     * 
     * @param {*} nn JSONNode type
     * @param {Boolean} createNewIds 
     * @param {REDWorkspace} ws 
     * @returns 
     */
    function importNewNode(nn,createNewIds,ws) {
        var def = getTypeDef(nn.type);
        if (def == undefined) def = createUnknownNodeTypeDef(nn);// return undefined;

        //var node = {x:nn.x, y:nn.y, z:nn.z, type:nn.type, _def:def, wires:nn.wires/*,wireNames:n.wireNames*/,changed:false};
        var node = new REDNode(nn, def);

        if (nn.parentGroup != undefined)
        {
            node.parentGroup = nn.parentGroup;
        }

        if (createNewIds == true) { // this is only used by import dialog and paste function
            node.name = nn.name; // set temporary
            //node.id = nn.id;
            //console.log("@createNewIds srcnode: " + n.id + ":" + n.name);
            if (nn.z == RED.view.getWorkspace())	{ // only generate new names on currentWorkspace
                node.name = createUniqueCppName(node, nn.z); // jannik add
                //console.warn("make new name: n.name=" + node.name);
            }
            else {// this allow different workspaces to have nodes that have same name
                node.name = nn.name;
                console.trace("keep name:" + n.name);
            }
            node.z = RED.view.getWorkspace();
            // allways create unique id:s
            node.id = getNewUID();// createUniqueCppId(node, getWorkspace(RED.view.getWorkspace()).label); // jannik add
            //console.warn("############## new id #########" + node.id);
        } else {
            node.name = nn.name;
            node.id = nn.id;
            if (node.z == null || node.z == "0") { //!workspaces[node.z]) {
                var currentWorkspaceId = RED.view.getWorkspace();
                console.warn('node.z == null || node.z == "0" -> add node to current workspace ' + currentWorkspaceId);
                
                node.z = currentWorkspaceId; // failsafe to set node workspace as current
            }
            else if (getWorkspaceIndex(node.z) == -1)
            {
                var currentWorkspaceId = RED.view.getWorkspace();
                console.warn("getWorkspaceIndex("+node.z+") == -1 -> add node to current workspace " + currentWorkspaceId);
                //console.error(workspaces);
                node.z = currentWorkspaceId; // failsafe to set node workspace as current
            }
        }
        for (var d2 in node._def.defaults) {
            
            if (node._def.defaults.hasOwnProperty(d2)) {
                //console.log("node._def.defaults.hasOwnProperty(d2) d2=" + d2 + " " + nn[d2]);
                if (d2 == "name" || d2 == "id") continue;
                if (nn[d2] == undefined && node._def.defaults[d2].value != undefined) { 
                    node[d2] = node._def.defaults[d2].value;
                    if (d2 != "color") // TODO replace all color with bgColor
                        console.warn("setting default value: "+node._def.defaults[d2].value+", for new property: "+d2 + " @ " + node._def.shortName );
                }
                else
                    node[d2] = nn[d2];
            }
        }
        if (nn.bgColor == undefined)	node.bgColor = node._def.color; 
        else node.bgColor = nn.bgColor;

        node.outputs = nn.outputs?nn.outputs:node._def.outputs?node._def.outputs:0;

        /*node.outputs_ = 0;
        Object.defineProperty(node, 'outputs', {
            set: function(value) { console.trace(node.name); this.outputs_ = value;  },
            get: function() { console.trace(node.name); return this.outputs_; }
        });*/
        
        addNode(node,ws);
        
        RED.editor.validateNode(node);
        return node;
    }

	function findNodeById(newNodes, id)
	{
		for (var i = 0; i < newNodes.length; i++)
		{
			if (newNodes[i].id == id) return newNodes[i];
		}
		return undefined;
	}
	/**
		 * this function checks for !node.wires at beginning and returns if so.
		 * @param {*} srcNode 
		 * @param {*} cb is function pointer with following format cb(srcPortIndex,dstId,dstPortIndex);
		 */
	function eachWire(srcNode, cb) {
		if (!srcNode.wires){ console.log("!node.wires: " + srcNode.type + ":" + srcNode.name); return;}

		//if (srcNode.wires.length == 0) console.log("port.length == 0:" + srcNode.type + ":" + srcNode.name)

		for (var pi=0; pi<srcNode.wires.length; pi++) // pi = port index
		{
			var port = srcNode.wires[pi];
			if (!port){ /*console.log("!port(" + pi + "):" + n.type + ":" + n.name);*/ continue;} // failsafe
			//if (port.length == 0) console.log("portWires.length == 0:"+n.type + ":" + n.name) // debug check
			for (var pwi=0; pwi<port.length; pwi++) // pwi = port wire index
			{
				var wire = port[pwi];
				if (!wire){ /*console.log("!wire(" + pwi + "):" + n.type + ":" + n.name);*/ continue;} // failsafe

				var parts = wire.split(":");
				if (parts.length != 2){ /*console.log("parts.length != 2 (" + pwi + "):" + n.type + ":" + n.name);*/ continue;} // failsafe
				
				var retVal = cb(pi,parts[0],parts[1]);

				if (retVal) return retVal; // only abort/return if cb returns something, and return the value
			}
		}
	}
    /**
     * This callback is displayed as a global member.
     * @callback nodeEachLinkCallback
     * @param {number} sourcePort
     * @param {REDNode} target
     * @param {number} targetPort
     */
    /**
     * 
     * @param {REDNode} node 
     * @param {nodeEachLinkCallback} cb 
     */
    function nodeEachLink(node, cb) {
        var ws = getWorkspace(node.z);
        var links = ws.links.filter(function (l) { return l.source === node});
        for (var li=0;li<links.length;li++)
        {
            cb(links[li].sourcePort, links[li].target, links[li].targetPort);
        }
    }
	/**
	 * 
	 * @param {REDNode} srcNode 
	 * @param {*} cb is function pointer with following format cb(link);
	 */
	function getEachLink(srcNode, cb)
	{
        var ws = getWorkspace(srcNode.z);
		for (var li = 0; li < ws.links.length; li++)
		{
			var link = ws.links[li];
			if (link.source === srcNode)
			var retVal = cb(link);
			if (retVal) return retVal; // only abort/return if cb returns something, and return the value
		}
	}

	function workspaceNameChanged(oldName, newName)
	{
		var changedCount = 0;
        eachNode(function (n,ws) {
            if (n.type != oldName) return;
            
            n.type = newName;
            changedCount++;
        });
		
		addClassTabsToPalette();
		refreshClassNodes();
		//RED.palette.remove(oldName);
		delete node_defs["classNodes"].types[oldName];

		console.log("workspaceNameChanged:" + oldName + " to " + newName + " with " + changedCount + " objects changed");

		//RED.arduino.httpGetAsync("renameFile:" + oldName + ".h:" + newName + ".h");
	}
	function workspaceNameCheck(newName)
	{
		for (var wsi=0; wsi < workspaces.length; wsi++)
		{
			if (workspaces[wsi].label == newName)
				return true;
		}
		return false;
	}
	/**
	 * this is the internal type,  different from the saved one which is smaller
	 * @typedef {"id":"Main_Array_"+type+"_"+name ,
				 "type":"PointerArray",
				 "name":type + " " + name + " " + cppString,
				 "x":500,"y":55,"z":items[0].n.z,
				 "wires":[],
				 "_def":node_defs["PointerArray"]} Node 
	 */

	/**
	 * this autogenerate a array-node from same-type selection
	 * caller class is tab-info
	 * @param {*} items is of type moving_set from view
	 */
	function generateArrayNode(items)
	{
		var arrayItems = "{";
		var type = items[0].n.type;
		//var name = type.toLowerCase();
		var name = items[0].n.name + "s"

		for (var i = 0; i < items.length ; i++)
		{
			arrayItems += items[i].n.name;
			if (i < (items.length-1)) arrayItems += ",";
		}
		arrayItems += "}";
		addNode({"id":"Main_pArray_"+type+"_"+name ,
				 "type":"PointerArray",
				 "name":name,
				 "objectType":type,
				 "arrayItems":arrayItems,
				 "x":500,"y":500,"z":items[0].n.z,
				 "wires":[],
				 "_def":node_defs["officialNodes"].types["PointerArray"]});
				 RED.view.redraw();
				 RED.storage.update();
	}
	
    function getIndexes(name, ...params) {
        var indexes = [];
        for (var i=0;i<params.length;i++) {
            var index = name.indexOf(params[i]);
            if (index == -1) continue;
            indexes.push(index);
        }
        return indexes;
    }
    /**
     * this function sets the isBus to true if the portcount is > 1 
     * and if it is a bus also takes care of the tabIO individual wire naming
     * 
     * this function would be soon obsolete as I added additional parameters to the 
     * tabIO nodes so that both isBus and the names can easier be set by a multiline textbox
     * when having isBus unchecked together with portcount > 1 would then mean that it's actually 
     * representing the class IO:s instead, this to make cleaner class/tabs 
     * so instead of having multiple tabOutputs and/or tabInputs there would only be one of each type
     * 
     * @param {REDNode[]} tabIO_Nodes 
     * @param {String} ioCountType this is the port count property, 'inputs' for tabOutput and 'outputs' for tabInput
     * @param {number} index 
     * @returns 
     */
    function getClassIOport_BusCheck(tabIO_Nodes, ioCountType, index)
    {
        if (tabIO_Nodes == undefined) return undefined;
        if (index >= tabIO_Nodes.length) index = (tabIO_Nodes.length - 1); // failsafe
        if (tabIO_Nodes[index][ioCountType] > 1) {
            var indexes = getIndexes(tabIO_Nodes[index].name, '[', ']');
            if (indexes.length == 2) {
                tabIO_Nodes[index].busWireNames = tabIO_Nodes[index].name.substring(indexes[0]+1, indexes[1]).split(",");
                tabIO_Nodes[index].namename = tabIO_Nodes[index].name.substring(0, indexes[0]);
            }
            tabIO_Nodes[index].isBus = true;
        }
        else {
            tabIO_Nodes[index].isBus = false;
        }
        return tabIO_Nodes[index];
    }
	/**
	 * Gets all TabInput or TabOutput belonging to a class, and then sorting them vertically top->bottom (normal view)
	 * then the correct port-node based by index is returned
	 * @param {String} ws_id workspace id
	 * @param {String} type "TabInput" or "TabOutput"
	 * @returns {tabOutNodes:outNodes, tabInNodes:inNodes}
	 */
	function getClassIOport(ws_id, type, index)
	{
        if (!ws_id) return undefined; // failsafe
        if (typeof ws_id == "string") var ws = getWorkspace(ws_id);
        else var ws = ws_id
        if (index < 0) index = 0; // failsafe

        if (type == "Out")
            return getClassIOport_BusCheck(ws.tabOutputs, "inputs", index);
        else if (type == "In")
            return getClassIOport_BusCheck(ws.tabInputs, "outputs", index); 
        else  // failsafe
            return undefined;
	}
	function getClassComments(wsId)
	{
        if (!wsId) return;
        var ws = getWorkspace(wsId);
        var _nodes = ws.nodes;

		var comment = "";
		for (var i = 0; i < _nodes.length; i++)
		{
			var node = _nodes[i];
			if (wsId && (node.z != wsId)) continue;

			if (node.type != "ClassComment") continue;

			comment += node.name;
		}
		return comment;
	}

	function printLinks() // debug to see links contents
	{
		// link structure {source:n,sourcePort:w1,target:dst,targetPort:parts[1]};
        var ws = getWorkspace(RED.view.activeWorkspace);
		for (var i = 0; i < ws.links.length; i++)
		{
			var link = ws.links[i];
			console.log("createCompleteNodeSet links["+i+"]: " + 
				link.source.name + ":" + link.sourcePort + ", " + link.target.name + ":" + link.targetPort); 
		}
	}
	function getWorkspaceFromClassName(type)
	{
		for (var wsi = 0; wsi < workspaces.length; wsi++)
		{
			var ws = workspaces[wsi];
			if (type == ws.label) return ws;
			//console.log(node.type  + "!="+ ws.label);
		}
		return undefined;
	}
	
	function getWorkspaceIdFromClassName(type)
	{
		for (var wsi = 0; wsi < workspaces.length; wsi++)
		{
			var ws = workspaces[wsi];
			if (type == ws.label)  return ws.id;
		}
		return "";
	}
	
    /**
     * This is used to find what is connected to a input-pin
     * Only used to get whats connected to DynInput objects such as AudioMixer and AudioMixerStereo
     * @param {REDNode} node 
     * @param {Number} port 
     * @returns 
     */
	function getWireInputSourceNode(node, port)
	{
        if (port == undefined) port = 0; // default
        var ws = getWorkspace(node.z);
        var _links = ws.links.filter(function(l) { return ((l.target === node) && (l.targetPort == port)); });
        //console.log("_links:" + node.name ,_links);
        if (_links.length == 0) return undefined;
        // there is only be one link found
        return {node:_links[0].source, srcPortIndex:_links[0].sourcePort};
	}

    /**
     * used by ace autocomplete via getWorkspaceNodesAsCompletions
     * @param {String} name 
     * @returns 
     */
	function getArrayDeclarationWithoutSizeSyntax(name)
	{
		var value = 0;
		//console.warn("isNameDeclarationArray: " + name);
		var startIndex = name.indexOf("[");
		if (startIndex == -1) return name;
		var endIndex = name.indexOf("]");
		if (endIndex == -1){ console.log("isNameDeclarationArray: missing end ] in " + name); return name;}
		var arrayDef = name.substring(startIndex,endIndex+1); // this includes the []
		//var valueDef = name.substring(startIndex+1,endIndex)
		return name.replace(arrayDef, "[]");
	}
	
	
	//var AceAutoCompleteKeywords = null;
	/**
	 * this takes both the current workspace node-names and also the external AceAutoCompleteKeywords
	 * @param {String} wsId 
	 */
	function getWorkspaceNodesAsCompletions(wsId) // this is used by ace editor for autocompletions
	{
		/*if (AceAutoCompleteKeywords == null) // if not allready loaded the data
		{
			var aackw_json = $("script[data-container-name|='AceAutoCompleteKeywordsMetadata']").html(); // this cannot happen globally because of the load order in html
			//console.log(aackw_json);
			var aackw_metaData = $.parseJSON(aackw_json);
			AceAutoCompleteKeywords = aackw_metaData["AceAutoCompleteKeywords"];
		}*/
        var ws = getWorkspace(wsId);
		var items = []; // here we will append current workspace node names
		for (var ni = 0; ni < ws.nodes.length; ni++)
		{
			var n = ws.nodes[ni];
			if (n.z != wsId) continue; // workspace filter
			//if (RED.arduino.export.isSpecialNode(n.type)) continue;
			if (n.type == "Function")
			{
				getFunctions(n, items);
			}
            else if (n.type == "Variables")
            {
                getVaribles(n, items);
            }
			if (n._def.nonObject != undefined) continue;
			var data = RED.NodeHelpManager.getHelp(n.type); //  $("script[data-help-name|='" + n.type + "']").html();
			//var firstP = $("<div/>").append(data).children("div").first().html();
			if (data == undefined) data = n.type;
			else
			{
				var div = document.createElement('div');
				
				div.innerHTML = data.trim();
				var headerElements = div.getElementsByTagName("h3");
				var notes = "<h4>Notes</h4>";
				for (var i2 = 0; i2 < headerElements.length; i2++)
				{
					if (headerElements[i2].textContent == "Notes")
					{
						var eleSibl = headerElements[i2].nextElementSibling;
						while(eleSibl)
						{
							notes += eleSibl.outerHTML;
							eleSibl = eleSibl.nextElementSibling;
						}
						//notes = headerElements[i2].nextElementSibling.innerHTML;
						//console.log("notes:" + notes);
						break;
					}
				}
				var summary = "<h4>Summary</h4>" + $("<div/>").append(data).children("div").first().html();
				data = summary +"<br>"+ notes;
			}
			
			var name = getArrayDeclarationWithoutSizeSyntax(n.name);
			if (name.endsWith("]"))
				items.push({ name:name, snippet:name.replace("[]","[${1}]"), value:name, type:n.type, html: data, meta: n.type, score:(1000)  });
			else
				items.push({ name:name, value:name, type:n.type, html: data, meta: n.type, score:(1000)  });
		}
		AceAutoComplete.Extension.forEach(function(kw) { // AceAutoCompleteKeywords is in AceAutoCompleteKeywords.js
			items.push(kw);
		});
		return items;
	}
	function getAllFunctionNodeFunctions(wsId)
	{
        var ws = getWorkspace(wsId);
		var items = [];
		for (var ni = 0; ni < ws.nodes.length; ni++)
		{
			var n = ws.nodes[ni];
			//if (n.z != wsId) continue; // workspace filter
			//if (RED.arduino.export.isSpecialNode(n.type)) continue;
			if (n.type == "Function")
			{
				getFunctions(n, items);
			}
		}
		return items;
	}
    /**
     * 
     * @param {REDNode} functionNode 
     * @param {Array} completeItems 
     */
	function getFunctions(functionNode, completeItems)
	{
		var functions = [...functionNode.comment.matchAll(/\s*(unsigned|signed)?\s*(void|int|byte|char|short|long|float|double|bool)\s+(\w+)\s*(\([^)]*\))\s*/g)];
		//var functionsStr = "Functions("+functions.length+"):\n";
		//console.error("functions.length:" + functions.length + ' @ "' + n.name + '"');
		for (var fi = 0; fi < functions.length; fi++)
		{					
			//if (functions[fi] == undefined) continue;
			if (functions[fi][1] == undefined) functions[fi][1] = "";
			var returnType = functions[fi][1] + " " + functions[fi][2].trim();
			var name = functions[fi][3].trim();
			var param = functions[fi][4].trim();
			//console.error(functions[fi]);
			completeItems.push({ name:(name+param), value:(name+param), type:returnType, html: "@ " + functionNode.name + "<br> returns " + returnType, meta: returnType, score:(1000)  });
		}
	}
    /**
     * 
     * @param {REDNode} varNode 
     * @param {Array} completeItems 
     */
    function getVaribles(varNode, completeItems)
    {
        //var vars = [...varNode.comment.matchAll(/(?:\w+\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*[\[;,=]/g)];
        //var vars = [...varNode.comment.matchAll(/\b(?:(?:auto\s*|const\s*|unsigned\s*|signed\s*|register\s*|volatile\s*|static\s*|void\s*|short\s*|uint8_t\s*|uint16_t\s*|uint32_t\s*|uint64_t\s*|int8_t\s*|int16_t\s*|int32_t\s*|int64_t\s*|long\s*|char\s*|int\s*|float\s*|double\s*|bool\s*|complex\s*)+)(?:\s+\*?\*?\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*[\[;,=)]/gm)];
        var vars = [...varNode.comment.matchAll(/^[ \t]*(?!return|typedef)((\w+[ \t,]*\*?[ \t,]+)+)*(\w+)(\[\w*\])?([ \t,]*=\s*(\w)|;)/gm)];
        for (var fi = 0; fi < vars.length; fi++)
		{		
            //console.error(vars[fi]);
            			
			//if (vars[fi] == undefined) continue;
			if (vars[fi][1] == undefined) vars[fi][1] = "";
			var returnType = vars[fi][1].trim();
			var name = vars[fi][3].trim();
			//var param = vars[fi][6].trim();
			//console.error(functions[fi]);
			completeItems.push({ name:(name), value:(name), type:returnType, html: "@ <b>" + varNode.name + "</b><br> " + vars[fi][0], meta: returnType, score:(1000)  });
		    
        }
    }

    /**
	 * function used by addClassTabsToPalette()
     * @param {String} wsId 
     * @returns {Number}
     */
	function getClassNrOfInputs(wsId)// Jannik add function
	{
		var count = 0;
        var ws = getWorkspace(wsId);
		for (var i = 0; i  < ws.nodes.length; i++)
		{
			var n = ws.nodes[i];
			//if (n.z == wsId)
			//{
				if (n.type == "TabInput")
				{
					count++;
					//console.log("TabInput:" + n.name);
				}
			//}
		}
		return count;
	}
	/**
	 * function used by addClassTabsToPalette()
     * @param {String} wsId 
     * @returns {Number}
	 */
	function getClassNrOfOutputs(wsId)// Jannik add function
	{
		var count = 0;
        var ws = getWorkspace(wsId);
		for (var i = 0; i  < ws.nodes.length; i++)
		{
			var n = ws.nodes[i];
			//if (n.z == wsId)
			//{
				if (n.type == "TabOutput")
				{
					//count++;
                    //if (n.isBus == undefined && n.isBus == true) // future use
                        count++;
                    //else
                    //    count+=n.inputs; // future use
					//console.log("TabOutput:" + n.name); // future use
				}
			//}
		}
		return count;
	}

	function removeClassNodes(type)
	{
        eachNode(function (n,ws) {
            //console.log("n.type:" + n.type); // debug
            if (n.type != type)  return;
            removeNode(n.id);
        });
	}
	/**
     * this updates all class instances, i.e. nodes that have any type of class
     */
	function refreshClassNodes()// Jannik add function
	{
	    //console.warn("refreshClassNodes");
	    for ( var wsitc = 0; wsitc < workspaces.length; wsitc++)
	    {
		    var wstc = workspaces[wsitc];
            eachNode(function (n,ws) {
                //console.log("n.type:" + n.type); // debug
                if (n.type != wstc.label)  return;
            
                // node is class
                //console.log("updating " + n.type);
                //var node = RED.nodes.node(n.id);
                var def = RED.nodes.getType(n.type); // refresh type def
                if (def == undefined)
                {
                    console.error("@refreshClassNodes: node._def is undefined!!!")
                    return;
                }
                //else
                //	console.error(def);
                n._def = def;
                var newInputCount = getClassNrOfInputs(wstc.id);
                var newOutputCount = getClassNrOfOutputs(wstc.id); 
                
                //var doRemoveUnusedWires = false;
                //if ((newInputCount < node._def.inputs) || (newOutputCount < node._def.outputs)) // this dont work at the moment
                //	doRemoveUnusedWires = true;
                //console.error("newInputCount:" + newInputCount + " oldInputCount:" + node._def.inputs);
                //console.error("newOutputCount:" + newOutputCount + " oldOutputCount:" + node._def.outputs);

                // set defaults
                n._def.inputs = newInputCount;
                n._def.outputs = newOutputCount;
                // update this because that is whats used in view redraw
                n.outputs = n._def.outputs;

                //if (doRemoveUnusedWires)// this dont work at the moment
                    removeUnusedWires(n); // so updating all for now

                n.resize = true; // trigger redraw of ports
                n.dirty = true;
            });
		}
	}
    function getJunctionSrcLink(junctionNode)
    {
        var ws = getWorkspace(junctionNode.z);
		for (var i = 0; i < ws.links.length; i++)
		{
			var lnk = ws.links[i];
			if (lnk.target === junctionNode)
			{
				if (lnk.source.type.startsWith("Junction"))
					return getJunctionSrcLink(lnk.source);
				else
					return lnk;
			}
		}
		return null;
    }
    /**
     * 
     * @param {REDNode} junctionNode 
     * @returns {REDNode}
     */
	function getJunctionSrcNode(junctionNode)
	{
        var ws = getWorkspace(junctionNode.z);
		for (var i = 0; i < ws.links.length; i++)
		{
			var lnk = ws.links[i];
			if (lnk.target === junctionNode)
			{
				if (lnk.source.type.startsWith("Junction"))
					return getJunctionSrcNode(lnk.source);
				else
					return lnk.source;
			}
		}
		return null;
	}
    /**
     * 
     * @param {REDNode} junctionNode 
     * @param {REDNode} dstNode 
     * @returns {Boolean}
     */
	function getJunctionDstNodeEquals(junctionNode, dstNode)
	{
		var found = false;
        var ws = getWorkspace(junctionNode.z);
		for (var i = 0; i < ws.links.length; i++)
		{
			var lnk = ws.links[i];
			if (lnk.source === junctionNode)
			{
				if (lnk.target.type.startsWith("Junction"))
					found = getJunctionDstNodeEquals(lnk.target, dstNode);
				else
					found = lnk.target == dstNode;

				if (found) return true;
			}
		}
		return false;
	}
    /**
     * 
     * @param {REDNode} node 
     */
	function removeUnusedWires(node)
	{
        var ws = getWorkspace(node.z);
		//console.log("check and remove Unused Wires: " + node.type);
		for (var li = 0; li < ws.links.length; li++)
		{
            var l = ws.links[li]
			if (l.source == node)
			{
				if (l.sourcePort > (node._def.outputs - 1))
				{
					ws.links.splice(li, 1);
				}
			} 
			else if (l.target == node)
			{
				if (l.targetPort > (node._def.inputs - 1))
				{
					ws.links.splice(li, 1);
				}
			}
		}
	}
	function addClassTabsToPalette()// Jannik add function
	{
		//console.warn("addClassTabsToPalette");
		RED.palette.clearCategory("tabs");
		for (var i=0; i < workspaces.length; i++)
		{
            var ws = workspaces[i];
            if (ws.isMain == true) continue; // never add main file to tabs cat.
			var inputCount = getClassNrOfInputs(ws.id);
			var outputCount = getClassNrOfOutputs(ws.id);

            initClassNodeDefCategory();
			registerType(ws.label, getClassNodeDefinition(ws.label, inputCount, outputCount, ws), "classNodes");
		}
	}
    
	function addUsedNodeTypesToPalette()
	{
		//console.trace("addUsedNodeTypesToPalette");
		RED.palette.clearCategory("used");
        eachNode(function (n,ws) {
            if (n._def.nonObject != undefined) return; // _def.nonObject is defined in index.html @ NodeDefinitions only for special nodes
            if (n._def.classWs != undefined) return;
            if (n._def.unknownType != undefined) return;
            if (n._def.category == undefined) {console.error("error at addUsedNodeTypesToPalette(): nodes[i].type=" + n.type); return;}
            if (n._def.category.startsWith("input")) return;
            if (n._def.category.startsWith("output")) return;
            if (n._def.category.startsWith("control")) return;

            RED.palette.add(n.type, n._def, "used", undefined, undefined, true);
                //console.error(nodes[i].type);
        });
	}
	
    function init() {
        Init_BuiltIn_NodeDefinitions();
        RED.events.on("nodes:inputs", NodeInputsChanged);
        RED.events.on("flows:renamed", workspaceNameChanged);
        RED.events.on("nodes:add", NodeAdded);
        RED.events.on("nodes:renamed", NodeRenamed);
        RED.events.on("nodes:change", NodeChanged);
        RED.events.on("nodes:remove", NodeRemoved);
        RED.events.on("nodes:moved", NodesMoved);
    }
    /**
     * 
     * @param {REDNode} node 
     * @param {Number} oldCount 
     * @param {Number} newCount 
     * @param {Boolean} dynExpand 
     * @returns 
     */
    function NodeInputsChanged(node, oldCount, newCount, dynExpand) {
        // update the visuals
        if (newCount >= oldCount) {
            RED.events.emit("nodes:inputsUpdated", node, oldCount, newCount,undefined, dynExpand);
            return;
        }
        var ws = getWorkspace(node.z);
        var linksToRemove = ws.links.filter(function(l) { return (l.target === node) && (l.targetPort > (newCount-1)); });
        for (var i = 0; i < linksToRemove.length; i++)  {
            var link = linksToRemove[i];
            var index = ws.links.indexOf(link);
            if (index != -1) {
                ws.links.splice(index,1);
            }
        }
        //console.error("links removed");
        RED.events.emit("nodes:inputsUpdated", node, oldCount, newCount, linksToRemove, dynExpand);

        RED.view.redraw();
    }
    /**
     * 
     * @param {REDNNode} node 
     * @param {String} oldName 
     */
    function NodeRenamed(node, oldName) {
        node.isArray = RED.export.isNameDeclarationArray(node.name, node.z, true);
        if (node.isArray != undefined) node.arraySize = node.isArray.arrayLength;

        if (node.type == "ConstValue") {
            var findConstUsage = "[" + oldName + "]";
            var ws = getWorkspace(node.z); // consts allways on the same workspace/tab, in the same class 
            for (var ni=0;ni<ws.nodes.length;ni++) {
                if (ws.nodes[ni].z != node.z) continue;
                if (ws.nodes[ni].name.includes(findConstUsage)) {
                    //RED.events.emit("nodes:renamed", nodes[ni], nodes[ni].name);
                    ws.nodes[ni].name = ws.nodes[ni].name.replace(findConstUsage, "[" + node.name + "]");
                    ws.nodes[ni].isArray = RED.export.isNameDeclarationArray(ws.nodes[ni].name, ws.nodes[ni].z, true);
                    if (ws.nodes[ni].isArray != undefined) ws.nodes[ni].arraySize = ws.nodes[ni].isArray.arrayLength;

                    RED.view.redraw_node(ws.nodes[ni]);
                }
            }
        }else {
            console.warn("######### node renamed - refreshLinksInfo");
            var links = getWorkspace(node.z).links.filter(function (l) { return (l.source === node || l.target === node); });
            refreshLinksInfo(links);
            refreshDynInputsObjects_connectedTo(links);
            RED.view.redraw_links_notations(links);
        }

    }
    /**
     * 
     * @param {REDNode} node 
     * @param {Object} changes 
     */
    function NodeChanged(node, changes) {
        if (node.type == "ConstValue" && changes.value != undefined) {
            var findConstUsage = "[" + node.name + "]";
            var ws = getWorkspace(node.z);
            for (var ni=0;ni<ws.nodes.length;ni++) {
                if (ws.nodes[ni].z != node.z) continue;
                if (ws.nodes[ni].name.includes(findConstUsage)) {
                
                    ws.nodes[ni].isArray = RED.export.isNameDeclarationArray(ws.nodes[ni].name, ws.nodes[ni].z, true);
                    if (ws.nodes[ni].isArray != undefined) ws.nodes[ni].arraySize = ws.nodes[ni].isArray.arrayLength;

                    console.warn("found ", ws.nodes[ni], " applying new const value");
                    //RED.view.redraw_node(nodes[ni]);
                }
            }
        }
        //console.warn("node changed:", node, changes);
    }
    /**
     * 
     * @param {REDNode} node 
     */
    function NodeRemoved(node) {
        if (node.type == "ConstValue") {
            var findConstUsage = "[" + node.name + "]";
            var ws = getWorkspace(node.z);
            for (var ni=0;ni<ws.nodes.length;ni++) {
                if (ws.nodes[ni].z != node.z) continue;
                if (ws.nodes[ni].name.includes(findConstUsage)) {
                    ws.nodes[ni].name = ws.nodes[ni].name.replace(findConstUsage, "[" + node.value + "]");
                    ws.nodes[ni].isArray = RED.export.isNameDeclarationArray(ws.nodes[ni].name, ws.nodes[ni].z, true);
                    if (ws.nodes[ni].isArray != undefined) ws.nodes[ni].arraySize = ws.nodes[ni].isArray.arrayLength;
                    
                    console.warn("found ", ws.nodes[ni], " applying new const value");
                    RED.view.redraw_node(ws.nodes[ni]);
                }
            }
        }
        else if (node.type == "TabOutput" || node.type == "TabInput")
            TabIOsChanged(node);
    }
    /**
     * 
     * @param {REDNode} node 
     */
    function NodeAdded(node) {
        if (node.type == "TabOutput" || node.type == "TabInput")
            TabIOsChanged(node);
    }
    /**
     * 
     * @param {REDNode[]} ns 
     */
    function NodesMoved(ns) {
        //console.warn(ns);
        for (var i=0;i<ns.length;i++) {
            if (ns[i].n.type == "TabOutput" || ns[i].n.type == "TabInput") {
                TabIOsChanged(ns[i].n);
            }
        }
    }
    /**
     * 
     * @param {REDNode} node 
     */
    function TabIOsChanged(node) {
        var ws = getWorkspace(node.z);
        if (node.type == "TabOutput") {
            var tabOs = ws.nodes.filter(function (n) { return (n.type == "TabOutput"); });
            tabOs.sort(function (a,b) { return (a.y - b.y); });
            ws.tabOutputs = tabOs;
        }
        else if (node.type == "TabInput") {
            var tabIs = ws.nodes.filter(function (n) { return (n.type == "TabInput"); });
            tabIs.sort(function (a,b) { return (a.y - b.y); });
            ws.tabInputs = tabIs;
        }
    }
    /**
     * 
     * @param {REDNode} node 
     * @returns {Number}
     */
    function FindNextFreeInputPort(node) {
        var ws = getWorkspace(node.z);
        var links = ws.links.filter(function(l) { return (l.target === node); });
        if (links.length == 0) return 0; // first index
        
        let inputs = node.inputs ? node.inputs: node._def.inputs ? node._def.inputs : 0;
        if (inputs == 0) return -1; 
        
        links.sort(function(a,b){ return (a.targetPort - b.targetPort); });
        //console.error(links);
        for (var index = 0; index < links.length; index++) {
            if (links[index].targetPort == index) continue;
            
            return index;
        }
        if (links.length == inputs)
            return -1;
        else
            return index;
    }
    /**
     * note this can also be used to correct the number of inputs needed, for example when doing undo of removed links
     * @param {REDNode} node 
     * @returns 
     */
    function recheckAndReduceUnusedDynInputs(node) {
        var ws = getWorkspace(node.z);

        if (node._def.dynInputs == undefined) return; // not a dyn inputs object, failsafe abort
        if (node.inputs == 1) return; // don't change below 1 input
        var links = ws.links.filter(function(l) { return (l.target === node); });
        if (links.length == 0) {
            if (newCount != node.inputs) {
                var oldCount = node.inputs;
                node.inputs = 1; // don't change below 1 input
                return {oldCount,newCount:1};
            }
        }
        links.sort(function(a,b){ return (a.targetPort - b.targetPort); });
        var newCount = Number(links[links.length-1].targetPort)+1;
        if (newCount != node.inputs) {
            var oldCount = node.inputs;
            node.inputs = newCount;
            return {oldCount,newCount};
        }
        return undefined;
    }

    function subflowContains(sfid,nodeid,path) {
        console.error("subflow contains");
        var wsRoot = getWorkspace(sfid);
        for (var ni = 0; ni < wsRoot.nodes.length; ni++) {

            var node = wsRoot.nodes[ni];
            
            var ws = node._def.classWs;//isClass(node.type);
            if (ws == undefined) continue;
            //if (ws) {
                if (ws.id === nodeid) {
                    path.path.push(node.name+" (" +node.type + ")");
                    return true;
                } else {
                    
                    var result = subflowContains(ws.id,nodeid,path);
                    if (result) {
                        path.path.push(node.name+" (" +node.type + ")");
                        return true;
                    }
                }
            //}
            
        }
        return false;
    }

    function refreshLinksInfo(links) { // _links allow just a set of links to be updated
        //console.warn("refreshLinksInfo:",links);
        if (loadingWorkspaces == true) return;

        if (links == undefined) {
            eachLink(function (l, ws) {
                setLinkInfo(l);
                //RED.export.links2.generateAndAddExportInfo(l); // should be used when exporting links instead, this was only a dev-test
            });
            /*for (var wsi=0;wsi<workspaces.length;wsi++) {
                var ws = workspaces[wsi];
                for (var li = 0; li < ws.links.length; li++)
                    setLinkInfo(ws.links[li]);
            }*/
        }
        else {
            for (var li = 0; li < links.length; li++) {
                setLinkInfo(links[li]);
                //RED.export.links2.generateAndAddExportInfo(links[li]); // should be used when exporting links instead, this was only a dev-test
            }
        }
    }

    function refreshDynInputsObjects_connectedTo_link(link)
    {
        if (link.target._def.dynInputs != undefined){
            var inputCount = RED.export.links.getDynInputDynSizePortStartIndex(link.target, null);
            link.target.RealInputs = inputCount;
        }
    }
    
    function refreshDynInputsObjects_connectedTo(links) {
        if (loadingWorkspaces == true) return;
        
        if (links == undefined) {
            eachLink(refreshDynInputsObjects_connectedTo_link);
        }
        else {
            console.warn("refreshDynInputsObjects_connectedTo links.length:" + links.length);
            for (var li = 0; li < links.length; li++) {
                refreshDynInputsObjects_connectedTo_link(links[li]);
            }
        }
    }
    /**
     * this function gets the linktype
     * and TODO is to check for validity
     * @param {REDLink} l 
     * @returns 
     */
    function setLinkInfo(l) {
        l.info.tabOut = l.source._def.classWs?getClassIOport(l.source._def.classWs.id, "Out", l.sourcePort):undefined;
        l.info.tabIn = l.target._def.classWs?getClassIOport(l.target._def.classWs.id, "In", l.targetPort):undefined;
        
        l.info.isBus = (l.info.tabOut != undefined && l.info.tabOut.isBus) ||
                    (l.info.tabIn != undefined && l.info.tabIn.isBus) ||
                    (l.source.type == "BusJoin" || l.target.type == "BusSplit");

        if ((l.source.isArray!=undefined) && (l.target.isArray!=undefined) && (l.target._def.dynInputs!=undefined)) {
            l.info.valid = false;
            l.info.invalidText = "array to 'array of dynmixers' not yet supported in OSC export<br> non priority to implement";
        }
        else if (l.info.isBus && (l.source.type == "TabInput" || l.target.type == "TabOutput")) {
            l.info.valid = false;
            l.info.invalidText = "connecting bus wires to either TabInput or TabOutput not yet supported";
        }
        else if (l.info.isBus && (l.source._def.classWs != undefined && l.target._def.classWs != undefined)) {
            l.info.valid = false;
            l.info.invalidText = "connecting bus wires between classes not yet supported";
        }
        else if (l.info.isBus && l.target._def.classWs != undefined) {
            l.info.valid = false;
            l.info.invalidText = "connecting bus wires to classes not yet supported";
        }
        else if ((l.source.type == "BusJoin" || l.target.type == "BusSplit" || l.source.type == "BusSplit" || l.target.type == "BusJoin")) {
            l.info.valid = false;
            l.info.invalidText = "BusJoin and BusSplit not yet supported";
        }
        else if ((l.source.type != "TabInput") && (l.source.isArray!=undefined) && (l.target._def.dynInputs==undefined) && (l.target.isArray==undefined)) {
            l.info.valid = false;
            l.info.invalidText = "array sources can only be connected to dynInput objects such as AudioMixer and AudioMixerStereo<br>unless the target is a array";
        }
        else if ((l.source.isArray!=undefined) && (l.target.isArray!=undefined) && (l.source.isArray.arrayLength != l.target.isArray.arrayLength)) {
            l.info.valid = false;
            l.info.invalidText = "the array source size don't match the target array size";
        }
        else {
            l.info.valid = true;
            l.info.invalidText = "";
        }
    }

    function checkForAndSetNodeIsArray() {
        
        eachNode(
            /**
             * @param {REDNode} n 
             * @param {REDWorkspace} ws 
             */
            function(n,ws) {
            if (n._def.nonObject != undefined) return; // skip 'non objects'(AudioObjects) 
            n.isArray = RED.export.isNameDeclarationArray(n.name, ws.id, true);
            if (n.isArray != undefined) n.arraySize = n.isArray.arrayLength;
        });
    }
    function getNodeInstancesOfType(type) {
        var nodes = [];
        eachNode(
            /**
             * @param {REDNode} n 
             * @param {REDWorkspace} ws 
             */
            function(node,ws) {
            if (node.type == type)
                nodes.push({node,ws});
        });
        return nodes;
    }
    /**
     * 
     * @param {REDWorkspace} ws 
     * @param {(REDNode)} cb 
     */
    function wsEachNode(ws,cb) {
        for (var ni=0;ni<ws.nodes.length;ni++) {
            cb(ws.nodes[ni]);
        }
    }
    /**
     * 
     * @param {REDWorkspace} ws 
     * @param {(REDNode)} cb 
     * @param {*} defRet 
     * @returns 
     */
    function wsEachNodeRet(ws,cb,defRet) {
        for (var ni=0;ni<ws.nodes.length;ni++) {
            var ret = cb(ws.nodes[ni]);
            if (ret != undefined) return ret;
        }
        return defRet;
    }
    /**
     * @param {(REDNode,Workspace)} cb 
     */
    function eachNode(cb) {
        for (var wsi=0;wsi<workspaces.length;wsi++) {
            for (var ni=0;ni<workspaces[wsi].nodes.length;ni++) {
                cb(workspaces[wsi].nodes[ni],workspaces[wsi]);
            }
        }
    }
    /**
     * @param {(REDNode,Workspace)} cb 
     * @param {*} defRet 
     * @returns 
     */
    function eachNodeRet(cb,defRet) {
        for (var wsi=0;wsi<workspaces.length;wsi++) {
            for (var ni=0;ni<workspaces[wsi].nodes.length;ni++) {
                var ret = cb(workspaces[wsi].nodes[ni],workspaces[wsi]);
                if (ret != undefined) return ret;
            }
        }
        return defRet;
    }
    function eachLink(cb) {
        for (var wsi=0;wsi<workspaces.length;wsi++) {
            for (var li=0;li<workspaces[wsi].links.length;li++) {
                cb(workspaces[wsi].links[li]);
            }
        }
    }
    function moveWorkspace(start, end) {
        if (start > end)
        {
            workspaces.splice(end,0,workspaces[start]);
            workspaces.splice(start+1,1);
            RED.storage.update();
        }
        else if (start < end)
        {

            workspaces.splice(end+1,0,workspaces[start]);
            workspaces.splice(start,1);
            RED.storage.update();
        }
        
        //workspaces[index+1] = workspaces[index];
        //workspaces[index] = wsTemp;
    }
	return {
        get loadingWorkspaces() {return loadingWorkspaces;},
        getNodeInstancesOfType,
        //getLinkInfo: setLinkInfo,
        recheckAndReduceUnusedDynInputs,
        subflowContains,
        init,
        sortNodes,
        moveWorkspace,
        FindNextFreeInputPort,
		moveNodeToEnd,
		//createWorkspaceObject, // obsolete replaced by Workspace class
        createExportableWorkspace,
		createNewDefaultWorkspace,
        Init_BuiltIn_NodeDefinitions,
        registerNodeDefinitionGroups,
        registerNodeDefinitionGroup,
		registerType,
        initNodeDefinitions,
		getType: getTypeDef,
		convertNode,
		selectNode,
		getJunctionSrcNode,
		getJunctionDstNodeEquals,
		add: addNode,
		addLink: addLink,
		remove: removeNode,
		removeLink,
		addWorkspace,
		removeWorkspace,
		workspace: getWorkspace,
		eachNode,
        eachNodeRet,
        wsEachNode,
        wsEachNodeRet,
		
		eachLink,
		getEachLink,
		eachWire,
        nodeEachLink, // to replace eachWire in most cases
		workspaceNameChanged,
		workspaceNameCheck,
		node: getNode,
		namedNode: getNodeByName,
		//importWorkspaces, // (new structure) this function is not used outside of here anyway
		import: importNodes,
		refreshValidation,
		getAllFlowNodes,
		createExportableNodeSet,
		createCompleteNodeSet,
		getNewUID,
		getUniqueName:getUniqueName,
		cppName: createUniqueCppName,
		cppId: createUniqueCppId,
		hasIO: checkForIO,
        hasAudio:checkForAudio,
		generateArrayNode:generateArrayNode,
		
		getClassComments,
        getWorkspace,
        getWorkspaceIdFromClassName,
		getWorkspaceFromClassName,
		
		getWireInputSourceNode,
		getClassIOport, // used by node port tooltip popup
		getWorkspaceNodesAsCompletions,
		getAllFunctionNodeFunctions,
		getArrayDeclarationWithoutSizeSyntax,
		updateClassTypes: function () {addClassTabsToPalette(); refreshClassNodes(); /*console.warn("@updateClassTypes");*/},
		addUsedNodeTypesToPalette,
		addClassTabsToPalette,
		refreshClassNodes,

        get currentWorkspace() {return getWorkspace(RED.view.activeWorkspace);},
        getWorkspaceIndex: function(id) {
            for (var i = 0; i < workspaces.length; i++)
                if (workspaces[i].id == id) return i;
            return -1;
        },
        setNodes:function(nodes) {
            var ws = getWorkspace(RED.view.activeWorkspace)
            ws.nodes.length = 0;
            ws.nodes.addArray(nodes);
        },
        /**
         * Returns the Current Workspace Nodes
         * @type {REDNode[]}
         */
        get cwsNodes()
        {
            return getWorkspace(RED.view.activeWorkspace).nodes;
        },
        set cwsNodes(nodes) {
            var ws = getWorkspace(RED.view.activeWorkspace)
            ws.nodes.length = 0;
            ws.nodes.addArray(nodes);
        },
        get workspaces() {return workspaces;},
        set workspaces(wss) {workspaces = wss;},
        get cwsLinks() {
            return getWorkspace(RED.view.activeWorkspace).links;
        },
        set cwsLinks(links) {
            var ws = getWorkspace(RED.view.activeWorkspace)
            ws.links.length = 0;
            ws.links.addArray(links);
        },
        get node_defs() {return node_defs;},
        set node_defs(nds) {node_defs = nds;},
        checkName:checkName
	};
})();
