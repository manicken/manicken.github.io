/**
 * Class groups as reusable types (the editor side, the export side is in red/export/export-graph.js).
 *
 * A group with a class name is a class (RED.exporter.graph.isClassGroup). The first group with a class name
 * is the SOURCE of that class: its contents is the class, and it's also an instance itself (the group name is
 * the instance name). Only the source is saved with the contents.
 *
 * Every source gets a type in the palette (in the same category as the class tabs), a node of that type is
 * another instance of the class, a GROUP INSTANCE: it's drawn like a class tab node, its ports are the IO junctions
 * of the source (top to bottom, see RED.exporter.graph.getGroupPorts) and node._def.classGroup is the source.
 * A group instance is saved like any other node, its type is the class name.
 *
 * refresh() keeps it all up to date, it runs after any change (delayed a bit, so many changes only gives one refresh):
 *   - a new class name gives a new type, a removed source (or class name) removes the type
 *   - a source that gets another class name renames its instances
 *   - when the ports of a source change, the wires of the instances follow their port (IO junction),
 *     a wire to a removed port is removed
 *
 * When a design is loaded the instances are created before their source, so the types are first registered
 * from the saved design (registerFromJson), and connected to the sources after the load (refresh).
 *
 * The rules that keeps a class valid:
 *   - a source can't be removed while it have instances (getNodesToKeep, used when deleting)
 *   - another group with the same class name must have the same contents (getClassNameConflict, shown as an error),
 *     older designs used copies of groups with the same class name, when loaded these are converted into
 *     instances of the source (convertCopiesToInstances)
 */
RED.groupClasses = (function () {
    'use strict';

    const DEF_GROUP = "classNodes"; // the node definition group of the class tabs, see RED.nodes.getClassNodeTypes
    let refreshTimer = undefined;
    /** the groups that have the class name of a source but not the same contents (group -> source), see refresh */
    let conflicts = new Map();

    function init() {
        for (const eventName of ["nodes:add", "nodes:remove", "nodes:change", "nodes:renamed", "nodes:moved", "flows:add", "flows:remove", "flows:renamed"])
            RED.events.on(eventName, scheduleRefresh);
    }

    function scheduleRefresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refresh, 50);
    }

    /**
     * @param {String} className
     * @param {Number} inputCount
     * @param {Number} outputCount
     * @returns {Object} the node definition of a class group type (see getClassNodeDefinition in NodeDefinitions.js)
     */
    function createTypeDef(className, inputCount, outputCount) {
        const def = getClassNodeDefinition(className, inputCount, outputCount, undefined);
        def.isGroupClass = true;
        return def;
    }

    /**
     * @param {REDNode} group the source
     * @returns {Object} the node definition, with the source and the ids of its ports (to make the wires follow the ports)
     */
    function createSourceTypeDef(group) {
        const graph = RED.exporter.graph;
        const inputs = graph.getGroupPorts(group, "In");
        const outputs = graph.getGroupPorts(group, "Out");
        const def = createTypeDef(graph.getClassName(group), inputs.length, outputs.length);
        def.classGroup = group;
        def.portIds = { inputs: inputs.map(function (n) { return n.id; }), outputs: outputs.map(function (n) { return n.id; }) };
        return def;
    }

    /** @returns {Boolean} true if the two definitions gives the same instances (the same source and ports) */
    function isSameTypeDef(a, b) {
        return a != undefined && a.isGroupClass == true && a.classGroup === b.classGroup && JSON.stringify(a.portIds) == JSON.stringify(b.portIds);
    }

    /**
     * @returns {Map<String,REDNode>} class name -> the source, the first group (in tab order) with that class name,
     *                                if the class name is valid and not taken (see RED.exporter.graph.getClassNameProblem)
     */
    function getSources() {
        const graph = RED.exporter.graph;
        const sources = new Map();
        for (const ws of RED.nodes.workspaces) {
            for (const node of ws.nodes) {
                if (graph.isClassGroup(node) == false) continue;
                const className = graph.getClassName(node);
                if (sources.has(className) || graph.getClassNameProblem(node) != undefined) continue;
                sources.set(className, node);
            }
        }
        return sources;
    }

    /** @param {function(REDNode):void} cb called for every group instance (also the ones that are not connected to a source yet) */
    function eachInstance(cb) {
        RED.nodes.eachNode(function (node) {
            if (node._def != undefined && node._def.isGroupClass == true) cb(node);
        });
    }

    function refresh() {
        clearTimeout(refreshTimer);
        const types = RED.nodes.getClassNodeTypes();
        const sources = getSources();
        let paletteChanged = false;
        let instancesChanged = false;

        // a source that got another class name, its instances follows it
        eachInstance(function (node) {
            const group = node._def.classGroup;
            if (group == undefined || group.className == undefined) return;
            const className = group.className.trim();
            if (className != node.type && sources.get(className) === group) {
                node.type = className;
                instancesChanged = true;
            }
        });
        // the types without a source
        for (const typeName of Object.keys(types)) {
            if (types[typeName].isGroupClass != true || sources.has(typeName)) continue;
            delete types[typeName];
            paletteChanged = true;
        }
        // new and changed types, the instances gets the new definition
        for (const [className, group] of sources) {
            const def = createSourceTypeDef(group);
            if (isSameTypeDef(types[className], def) == false) {
                RED.nodes.registerType(className, def, DEF_GROUP);
                paletteChanged = true;
            }
            if (updateInstances(className, types[className])) instancesChanged = true;
        }

        const conflictsChanged = updateConflicts(sources);

        if (paletteChanged) RED.nodes.addClassTabsToPalette(); // the class groups are added last (addToPalette)
        if (paletteChanged || instancesChanged || conflictsChanged) {
            RED.nodes.refreshLinksInfo();
            RED.view.redraw(true);
        }
        else if (redrawExpandedInstances()) RED.view.redraw(true);
    }

    /**
     * The expanded instances shows the contents of the source (RED.view.groupInstance), so they are redrawn after a change.
     * @returns {Boolean} true if any expanded instance is shown (and needs a redraw)
     */
    function redrawExpandedInstances() {
        let any = false;
        eachInstance(function (node) {
            if (node.z != RED.view.activeWorkspace || RED.view.groupInstance.isExpanded(node) == false) return;
            node.dirty = true;
            node.resize = true;
            any = true;
        });
        return any;
    }

    /**
     * Finds the groups that have the class name of a source, but other contents.
     * @param {Map<String,REDNode>} sources
     * @returns {Boolean} true if the conflicts changed
     */
    function updateConflicts(sources) {
        const graph = RED.exporter.graph;
        const newConflicts = new Map();
        const signatures = new Map(); // source -> its signature (only made when needed)
        RED.nodes.eachNode(function (node) {
            if (graph.isClassGroup(node) == false) return;
            const source = sources.get(graph.getClassName(node));
            if (source == undefined || source === node) return;
            if (signatures.has(source) == false) signatures.set(source, graph.getScopeSignature(graph.getGroupScope(source)));
            if (graph.getScopeSignature(graph.getGroupScope(node)) != signatures.get(source)) newConflicts.set(node, source);
        });
        const changed = (newConflicts.size != conflicts.size) || [...newConflicts].some(function (e) { return conflicts.get(e[0]) !== e[1]; });
        conflicts = newConflicts;
        return changed;
    }

    /**
     * @param {REDNode} group a class group
     * @returns {String|undefined} the error when the class name is used by another group with other contents
     */
    function getClassNameConflict(group) {
        const source = conflicts.get(group);
        if (source == undefined) return undefined;
        return "the class name '" + RED.exporter.graph.getClassName(group) + "' of the group " + group.name + " is taken by the group " + source.name +
            " (tab \"" + RED.nodes.getWorkspace(source.z).label + "\") that have other contents, a class can only have one content (give this group another class name)";
    }

    /**
     * The note shown in the top right corner of a class group, so the source of a class is easy to tell from its instances
     * (an expanded instance shows "instance of ...", see RED.view.groupInstance).
     * @param {REDNode} group
     * @returns {String} empty for a group that is not a class
     */
    function getGroupNote(group) {
        const graph = RED.exporter.graph;
        if (graph.isClassGroup(group) == false) return "";
        const count = getInstancesOf(group).length;
        return "class " + graph.getClassName(group) + ((count != 0) ? (" \u00b7 " + count + " instance" + ((count != 1) ? "s" : "")) : "");
    }

    /** @param {REDNode} group @returns {REDNode[]} the group instances that uses the group as their class */
    function getInstancesOf(group) {
        const instances = [];
        eachInstance(function (node) { if (node._def.classGroup === group) instances.push(node); });
        return instances;
    }

    /** @param {REDNode} node @param {REDNode} group @returns {Boolean} true if the node is inside the group (at any depth) */
    function isInside(node, group) {
        for (let parent = node.parentGroup; parent != undefined; parent = parent.parentGroup) {
            if (parent === group) return true;
        }
        return false;
    }

    /**
     * A source can't be removed while it have instances (they would have no class), used when deleting,
     * tells the user why a group is not removed.
     * @param {REDNode[]} removing the nodes that are about to be removed
     * @returns {Set<REDNode>} the nodes to keep: the sources that have instances that are not removed, and their contents
     */
    function getNodesToKeep(removing) {
        const removingSet = new Set(removing);
        const keep = new Set();
        for (const group of removing) {
            if (group.type != "group") continue;
            const instances = getInstancesOf(group).filter(function (n) { return removingSet.has(n) == false; });
            if (instances.length == 0) continue;
            keep.add(group);
            for (const node of removing) { if (isInside(node, group)) keep.add(node); }
            RED.notify("the group <b>" + group.name + "</b> is the class <b>" + RED.exporter.graph.getClassName(group) + "</b>, it can't be removed while it have instances (" +
                instances.map(function (n) { return n.name; }).join(", ") + "), remove the instances first", "warning", null, 6000);
        }
        return keep;
    }

    /**
     * Gives all instances of a class the (new) definition.
     * @param {String} className
     * @param {Object} def
     * @returns {Boolean} true if any instance was changed
     */
    function updateInstances(className, def) {
        let changed = false;
        RED.nodes.eachNode(function (node) {
            if (node.type != className || node._def === def) return;
            const oldDef = node._def;
            if (oldDef.isGroupClass == true && oldDef.portIds != undefined) // (a just loaded instance have the same ports as the saved source)
                movePortWires(node, oldDef.portIds, def.portIds);
            node._def = def;
            node.outputs = def.outputs;
            node.resize = true;
            node.dirty = true;
            changed = true;
        });
        return changed;
    }

    /**
     * Makes the wires of an instance follow their port (IO junction of the source) when the ports are reordered,
     * the wires to removed ports are removed.
     * @param {REDNode} node a group instance
     * @param {{inputs:String[], outputs:String[]}} oldPortIds
     * @param {{inputs:String[], outputs:String[]}} newPortIds
     */
    function movePortWires(node, oldPortIds, newPortIds) {
        const ws = RED.nodes.getWorkspace(node.z);
        const newIndex = function (oldIds, newIds, port) {
            return newIds.indexOf(oldIds[Number(port)]);
        };
        for (const link of ws.links.slice()) {
            if (link.target === node) {
                const index = newIndex(oldPortIds.inputs, newPortIds.inputs, link.targetPort);
                if (index == -1) RED.nodes.removeLink(link);
                else link.targetPort = (typeof link.targetPort == "string") ? String(index) : index;
            }
            if (link.source === node) {
                const index = newIndex(oldPortIds.outputs, newPortIds.outputs, link.sourcePort);
                if (index == -1) RED.nodes.removeLink(link);
                else link.sourcePort = (typeof link.sourcePort == "string") ? String(index) : index;
            }
        }
    }

    /**
     * Registers the class group types of a design that is about to be loaded, so the instances get their type
     * (they are connected to their source by refresh, after the load).
     * @param {Object[]} jsonWorkspaces the saved workspaces
     */
    function registerFromJson(jsonWorkspaces) {
        RED.nodes.getClassNodeTypes(); // makes sure the definition group exists
        for (const jws of jsonWorkspaces) {
            const jsonNodes = jws.nodes || [];
            for (const nn of jsonNodes) {
                if (nn.type != "group") continue;
                const className = RED.nodes.convertOldGroupClassName(nn).className;
                if (className.length == 0 || RED.nodes.hasType(className)) continue;
                const portCount = function (ioType) {
                    return jsonNodes.filter(function (p) { return p.parentGroup == nn.id && p.type.startsWith("Junction") && p.ClassIOtype === ioType; }).length;
                };
                RED.nodes.registerType(className, createTypeDef(className, portCount(1), portCount(0)), DEF_GROUP);
            }
        }
    }

    /** Adds the class group types to the palette, used when the palette category is rebuilt (RED.nodes.addClassTabsToPalette) */
    function addToPalette() {
        const types = RED.nodes.getClassNodeTypes();
        for (const typeName of Object.keys(types)) {
            if (types[typeName].isGroupClass == true) RED.palette.add(typeName, types[typeName], undefined, DEF_GROUP, false);
        }
    }

    // ******************************************************************
    // older designs: copies of a group with the same class name
    // ******************************************************************

    /**
     * Converts the groups that are copies of a source (the same class name and contents) into instances of it,
     * used when a design is loaded. A copy is not converted if it have wires straight to/from its contents
     * (loose wires, an instance can only be connected through its ports) or if it contains the source of another class.
     * @returns {String[]} the converted groups, for the notification
     */
    function convertCopiesToInstances() {
        const graph = RED.exporter.graph;
        const sources = getSources();
        const signatures = new Map();
        const signatureOf = function (group) {
            if (signatures.has(group) == false) signatures.set(group, graph.getScopeSignature(graph.getGroupScope(group)));
            return signatures.get(group);
        };
        // the outermost first, the copies inside a converted copy are removed with it
        const copies = [];
        RED.nodes.eachNode(function (node) {
            if (graph.isClassGroup(node) == false) return;
            const source = sources.get(graph.getClassName(node));
            if (source != undefined && source !== node) copies.push({ group: node, source });
        });
        copies.sort(function (a, b) { return graph.getClassGroupChain(a.group).length - graph.getClassGroupChain(b.group).length; });

        const converted = [];
        for (const copy of copies) {
            const group = copy.group;
            if (RED.nodes.node(group.id) !== group) continue; // removed with a converted copy
            if (signatureOf(group) != signatureOf(copy.source)) continue; // other contents, see getClassNameConflict
            if (canBeInstance(group, sources) == false) continue;
            convertToInstance(group, copy.source);
            converted.push(group.name + " (" + graph.getClassName(group) + ", tab \"" + RED.nodes.getWorkspace(group.z).label + "\")");
        }
        return converted;
    }

    /**
     * @param {REDNode} group
     * @param {Map<String,REDNode>} sources
     * @returns {Boolean} true if the group is only connected through its ports and don't contain a source
     */
    function canBeInstance(group, sources) {
        const sourceGroups = new Set(sources.values());
        const ws = RED.nodes.getWorkspace(group.z);
        if (ws.nodes.some(function (n) { return isInside(n, group) && sourceGroups.has(n); })) return false;
        const isPortOf = function (node, ioType) { return node.parentGroup === group && node.type.startsWith("Junction") && node.ClassIOtype === ioType; };
        return ws.links.every(function (l) {
            const sourceInside = isInside(l.source, group), targetInside = isInside(l.target, group);
            if (sourceInside == targetInside) return true; // inside the group, or not connected to it
            if (targetInside) return isPortOf(l.target, 1); // into an input port
            return isPortOf(l.source, 0); // out of an output port
        });
    }

    /**
     * Replaces a copy with an instance node of the source, at the same place and with the same name,
     * the wires to the ports of the copy are connected to the ports of the instance.
     * @param {REDNode} group the copy
     * @param {REDNode} source
     */
    function convertToInstance(group, source) {
        const graph = RED.exporter.graph;
        const ws = RED.nodes.getWorkspace(group.z);
        const className = graph.getClassName(group);
        const def = RED.nodes.getType(className);

        const nn = { id: RED.nodes.getNewUID(), type: className, name: group.name, x: group.x, y: group.y, z: group.z,
                     bgColor: def.color, outputs: def.outputs, wires: [] };
        const instance = new REDNode(nn, def);
        for (const d in def.defaults) { if (instance[d] == undefined && def.defaults[d].value != undefined) instance[d] = def.defaults[d].value; }
        delete instance.wires;

        // the port of the instance that a port junction of the copy is (the source port with the same name, otherwise the same position)
        const portIndex = function (junction, direction) {
            const copyPorts = graph.getGroupPorts(group, direction), sourcePorts = graph.getGroupPorts(source, direction);
            const sameName = sourcePorts.filter(function (p) { return p.name == junction.name; });
            return (sameName.length == 1) ? sourcePorts.indexOf(sameName[0]) : copyPorts.indexOf(junction);
        };
        const newLinks = [];
        for (const l of ws.links) {
            const sourceInside = isInside(l.source, group), targetInside = isInside(l.target, group);
            if (targetInside && sourceInside == false) newLinks.push(new REDLink(l.source, l.sourcePort, instance, portIndex(l.target, "In")));
            else if (sourceInside && targetInside == false) newLinks.push(new REDLink(instance, portIndex(l.source, "Out"), l.target, l.targetPort));
        }
        // remove the copy and its contents
        const contents = ws.nodes.filter(function (n) { return isInside(n, group); });
        const parent = group.parentGroup;
        for (const n of [...contents, group]) RED.nodes.remove(n.id);
        if (parent != undefined) parent.nodes.splice(parent.nodes.indexOf(group), 1);

        RED.nodes.add(instance, ws);
        if (parent != undefined) { instance.parentGroup = parent; parent.nodes.push(instance); }
        for (const l of newLinks) RED.nodes.addLink(l, ws);
    }

    return {
        init,
        refresh,
        registerFromJson,
        addToPalette,
        getClassNameConflict,
        getGroupNote,
        getInstancesOf,
        getNodesToKeep,
        convertCopiesToInstances,
    };
})();
