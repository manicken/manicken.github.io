/**
 * Merge import: adds the tabs of a design (a component, see components/*.js) to the open design, instead of replacing it.
 *
 * Every tab of the design is added as a new tab, with its nodes, wires and groups. A tab is a class (its label is a type)
 * and a class group is a class (its className is a type), so these names must not be taken already. When one is taken
 * it's renamed automatically (StereoAmp -> StereoAmp1, the same way pasted objects get a free name), and everything in
 * the design that uses it follows: instances of a class tab (node type = tab label) and of a class group
 * (node type = className). Names in code (Function, CodeFile ...) are text and are not changed.
 *
 * The design is changed on a copy, before it's imported:
 *   - new ids for every tab and node (so it can be merged any number of times), the references follow:
 *     node.z, the wires ("id:port"), node.parentGroup, the node list of a group, liveBind.node of a bound GUI object
 *   - the settings of the design are not used (the open project keeps its own)
 *   - 'isMain'/'isAudioMain' are turned off (the open project already have its main tab)
 * Then it's imported with RED.nodes.importNodes, the same function that loads a saved design.
 */
RED.designMerge = (function () {
    'use strict';

    /**
     * @param {String} name
     * @param {(n:String)=>Boolean} isTaken
     * @returns {String} name, or the first free name made from it: Voice -> Voice1, Voice2 -> Voice3
     */
    function getFreeName(name, isTaken) {
        if (isTaken(name) == false) return name;
        const m = name.match(/^(.*?)(\d*)$/);
        const base = m[1];
        let count = (m[2] != "") ? parseInt(m[2]) + 1 : 1;
        while (isTaken(base + count)) count++;
        return base + count;
    }

    /** @returns {String} the class name of a group as it's saved (also older designs), "" when it's not a class */
    function getGroupClassName(nn) {
        if (nn.type != "group") return "";
        const className = RED.nodes.convertOldGroupClassName(nn).className;
        return (typeof className == "string") ? className.trim() : "";
    }

    /**
     * @param {Object} design a saved design: { version, settings, workspaces: [{ id, label, nodes: [...] }] }
     * @returns {{ tabs: String[], renamed: {from:String, to:String}[] }} the labels of the added tabs, and the classes that got another name
     */
    function merge(design) {
        if (design == undefined || Array.isArray(design.workspaces) == false || design.workspaces.length == 0)
            throw new Error("the design have no tabs");
        const workspaces = JSON.parse(JSON.stringify(design.workspaces)); // the design itself is never changed

        // --- the class names: a tab label or a class group name that is taken gets a free name ---
        const ownNames = new Set(); // the class names of the design (a free name must not be one of them either)
        for (const ws of workspaces) {
            ownNames.add(ws.label);
            for (const nn of (ws.nodes || [])) { const c = getGroupClassName(nn); if (c != "") ownNames.add(c); }
        }
        const newNames = new Set();
        const isTakenInProject = function (name) {
            return RED.nodes.hasType(name) || RED.nodes.workspaces.some(function (ws) { return ws.label == name; });
        };
        const renames = new Map(); // old class name -> new class name
        for (const name of ownNames) {
            if (isTakenInProject(name) == false) { newNames.add(name); continue; }
            const free = getFreeName(name, function (n) { return isTakenInProject(n) || ownNames.has(n) || newNames.has(n); });
            renames.set(name, free);
            newNames.add(free);
        }

        // --- new ids ---
        const ids = new Map(); // old id -> new id
        const newId = function (oldId) { const id = RED.nodes.getNewUID(); ids.set(oldId, id); return id; };
        for (const ws of workspaces) {
            newId(ws.id);
            for (const nn of (ws.nodes || [])) newId(nn.id);
        }
        const mapId = function (id) { return ids.has(id) ? ids.get(id) : id; };
        const mapWire = function (wire) { // "id:port", or { def: "id:port", style, name, comment }
            const remap = function (def) { const i = def.lastIndexOf(":"); return (i < 0) ? def : (mapId(def.substring(0, i)) + def.substring(i)); };
            if (typeof wire == "string") return remap(wire);
            if (wire != null && typeof wire == "object" && typeof wire.def == "string") { wire.def = remap(wire.def); return wire; }
            return wire;
        };

        // --- apply ---
        for (const ws of workspaces) {
            const oldWsId = ws.id;
            ws.id = mapId(ws.id);
            if (renames.has(ws.label)) ws.label = renames.get(ws.label);
            ws.isMain = false;
            ws.isAudioMain = false;
            for (const nn of (ws.nodes || [])) {
                nn.id = mapId(nn.id);
                nn.z = (nn.z == undefined || nn.z == oldWsId) ? ws.id : mapId(nn.z);
                if (renames.has(nn.type)) nn.type = renames.get(nn.type); // an instance of a renamed class
                const className = getGroupClassName(nn);
                if (className != "" && renames.has(className)) nn.className = renames.get(className);
                if (Array.isArray(nn.wires)) nn.wires = nn.wires.map(function (port) { return Array.isArray(port) ? port.map(mapWire) : mapWire(port); });
                if (nn.parentGroup != undefined) nn.parentGroup = mapId(nn.parentGroup);
                if (nn.type == "group" && Array.isArray(nn.nodes)) nn.nodes = nn.nodes.map(mapId);
                if (nn.liveBind != undefined && nn.liveBind !== "" && typeof nn.liveBind == "object" && nn.liveBind.node != undefined) nn.liveBind.node = mapId(nn.liveBind.node);
            }
        }

        RED.nodes.import({ version: (design.version != undefined) ? design.version : 1, workspaces }, false, false);
        RED.nodes.addClassTabsToPalette();
        RED.nodes.refreshClassNodes();
        RED.nodes.addUsedNodeTypesToPalette();
        RED.nodes.dirty(true);
        RED.view.redraw(true);
        RED.storage.update();
        return {
            tabs: workspaces.map(function (ws) { return ws.label; }),
            renamed: [...renames].map(function (r) { return { from: r[0], to: r[1] }; }),
        };
    }

    return {
        merge,
        getFreeName,
    };
})();
