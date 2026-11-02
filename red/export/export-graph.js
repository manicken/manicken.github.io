/**
 * Read-only questions about the design graph.
 *
 * Everything in here only READS the editor structures (REDNode, REDLink, REDWorkspace)
 * and never changes them, so these helpers are safe to use from any exporter
 * (C++ export now, OSC export / live update later).
 *
 * Terms used:
 *   class node   - a node whose type is another workspace (tab), node._def.classWs is that workspace
 *   class group  - a group with 'export as class' set: a class defined inline, its className is the type
 *                  and its name is the instance (voices[8]), see getClassWorkspace/getGroupScope
 *   class scope  - what a class is made of: a workspace (tab), or the contents of a class group,
 *                  getScopeNodes/getScopeLinks gives the nodes/wires of a scope (not the ones inside class groups in it)
 *   class port   - the TabInput/TabOutput node inside a class workspace that a class node port maps to,
 *                  or an IO junction of a class group (ClassIOtype 1 = input, 0 = output),
 *                  the wires outside of a class group are connected directly to its IO junctions
 *   loose wire   - a wire straight from an object inside a class group to an object outside of it (or the other way),
 *                  without IO junctions, it belongs to the outside, see getLinkOwner
 *   bus port     - a class port with more than one lane (TabOutput.inputs > 1 or TabInput.outputs > 1)
 *   array node   - a node with a name like "osc[4]" or "osc[NUM]" (NUM being a ConstValue node)
 *   junction     - a virtual node that only forwards wires (JunctionLR, JunctionRL)
 *   bus node     - BusJoin (combines its inputs into one bus wire) and BusSplit (splits a bus wire into its signals)
 *   dyn input    - an object whose input count is decided by what is connected to it (AudioMixer, AudioMixerStereo)
 */
RED.exporter = RED.exporter || {};

RED.exporter.graph = (function () {
    'use strict';

    /** @param {REDNode} node @returns {boolean} true for a junction that only forwards wires (not a class group IO junction) */
    function isJunction(node) {
        return node.type.startsWith("Junction") && isGroupPort(node) == false;
    }

    /** @param {REDNode} node @returns {boolean} true for BusJoin and BusSplit, virtual nodes that combines/splits wires */
    function isBusNode(node) {
        return node.type == "BusJoin" || node.type == "BusSplit";
    }

    /** @param {REDNode} node @returns {boolean} true if the node is an instance of a class (another workspace, or a class group) */
    function isClass(node) {
        return node._def.classWs != undefined || isClassGroup(node);
    }

    /**
     * @param {REDNode} node a class node or a class group
     * @returns {REDWorkspace|GroupScope} what the class is made of: the workspace, or the scope of the class group
     */
    function getClassWorkspace(node) {
        if (isClassGroup(node)) return getGroupScope(node);
        return node._def.classWs;
    }

    /** @param {REDNode} node a class node or a class group @returns {String} the class (type) name */
    function getClassName(node) {
        if (isClassGroup(node)) return node.className;
        return node.type;
    }

    /** @param {REDNode} node @returns {boolean} true for nodes that never becomes a C++ object (junctions, tab IO, code nodes, ui nodes ...) */
    function isVirtual(node) {
        if (isClassGroup(node)) return false; // a group is a ui object, but a class group is a class instance
        return node._def.nonObject != undefined;
    }

    // ******************************************************************
    // class groups
    // ******************************************************************

    /**
     * The scope of a class group, made to look like a REDWorkspace for the resolver
     * (label = the class name, nodes/links = what's inside the group).
     * @typedef {Object} GroupScope
     * @property {String} id the group id
     * @property {String} label the class name (group.className)
     * @property {REDNode} group
     * @property {Boolean} isGroupScope always true
     * @property {REDNode[]} nodes the nodes in the class (see getScopeNodes)
     * @property {REDLink[]} links the wires in the class (see getScopeLinks)
     */

    /** @param {REDNode} node @returns {boolean} true for a group with 'export as class' set */
    function isClassGroup(node) {
        return node.type == "group" && (node.exportAsClass === true || node.exportAsClass === "true");
    }

    /** @param {REDNode} node @returns {REDNode|undefined} the class group the node is inside of (the closest one), undefined if none */
    function getClassGroupOf(node) {
        let group = node.parentGroup;
        while (group != undefined) {
            if (isClassGroup(group)) return group;
            group = group.parentGroup;
        }
        return undefined;
    }

    /**
     * @param {REDNode} node
     * @returns {boolean} true for an IO junction of a class group (a class port),
     *                    its ClassIOtype is the number 0 or 1 (a normal junction have "", and "" == 0 is true, so === is used)
     */
    function isGroupPort(node) {
        return node.type.startsWith("Junction") && (node.ClassIOtype === 0 || node.ClassIOtype === 1) &&
               node.parentGroup != undefined && isClassGroup(node.parentGroup);
    }

    /** @param {REDNode} node @returns {boolean} true for a TabInput or an input junction of a class group */
    function isClassInputPort(node) {
        return node.type == "TabInput" || (isGroupPort(node) && node.ClassIOtype == 1);
    }

    /** @param {REDNode} node @returns {boolean} true for a TabOutput or an output junction of a class group */
    function isClassOutputPort(node) {
        return node.type == "TabOutput" || (isGroupPort(node) && node.ClassIOtype == 0);
    }

    /** @param {REDNode} group a class group @returns {GroupScope} */
    function getGroupScope(group) {
        return {
            id: group.id,
            label: group.className,
            group,
            isGroupScope: true,
            get nodes() { return getScopeNodes(this); },
            get links() { return getScopeLinks(this); },
            z: group.z,
            tabInputs: [], // the ports of a class group are its IO junctions, see isGroupPort
            tabOutputs: [],
            export: true,
            isMain: false,
            isAudioMain: false,
            extraClassDeclarations: "",
            generateCppDestructor: false,
        };
    }

    /**
     * @param {REDWorkspace|GroupScope} scope
     * @returns {REDNode[]} the nodes that belongs to the scope itself: the nodes inside a class group belongs
     *                      to the class group, the class group node itself belongs to the scope it's in
     */
    function getScopeNodes(scope) {
        if (scope.isGroupScope) {
            const ws = getWorkspaceOf(scope.group);
            return ws.nodes.filter(function (n) { return n !== scope.group && getClassGroupOf(n) === scope.group; });
        }
        return scope.nodes.filter(function (n) { return getClassGroupOf(n) == undefined; });
    }

    /**
     * The wires of a scope, see getLinkOwner.
     * @param {REDWorkspace|GroupScope} scope
     * @returns {REDLink[]}
     */
    function getScopeLinks(scope) {
        const ws = scope.isGroupScope ? getWorkspaceOf(scope.group) : scope;
        const scopeGroup = scope.isGroupScope ? scope.group : undefined;
        return ws.links.filter(function (l) { return getLinkOwner(l) === scopeGroup; });
    }

    /**
     * @param {REDNode} node
     * @returns {REDNode[]} the class groups the node is inside of, the outermost first
     */
    function getClassGroupChain(node) {
        const chain = [];
        for (let group = getClassGroupOf(node); group != undefined; group = getClassGroupOf(group)) chain.unshift(group);
        return chain;
    }

    /**
     * The class groups a wire end is inside of. An IO junction of a class group is inside of the group when seen
     * from inside (an input junction as a source, an output junction as a target), but it's the group instance itself
     * when seen from outside (a wire into an input junction, a wire from an output junction).
     * @param {REDNode} node
     * @param {Boolean} isSource true for the source end of a wire
     * @returns {REDNode[]} the outermost first
     */
    function getEndChain(node, isSource) {
        const seenFromOutside = isGroupPort(node) && (isSource ? isClassOutputPort(node) : isClassInputPort(node));
        return getClassGroupChain(seenFromOutside ? node.parentGroup : node);
    }

    /**
     * A wire belongs to the innermost class group both its ends are inside of (undefined = the workspace itself).
     * A wire that goes straight from an object inside a class group to an object outside of it (without IO junctions),
     * a 'loose' wire, belongs to the outside: it's made by the one that uses the class, into/out of the class instance.
     * @param {REDLink} link
     * @returns {REDNode|undefined} the class group
     */
    function getLinkOwner(link) {
        const sourceChain = getEndChain(link.source, true);
        const targetChain = getEndChain(link.target, false);
        let owner = undefined;
        for (let i = 0; i < sourceChain.length && sourceChain[i] === targetChain[i]; i++) owner = sourceChain[i];
        return owner;
    }

    /**
     * Describes the contents of a class group, used to check that groups with the same class name are the same
     * (the positions and ids are not part of it).
     * @param {GroupScope} scope
     * @returns {String}
     */
    function getScopeSignature(scope) {
        const describeNode = function (n) {
            if (isClassGroup(n)) return "class " + n.className + " " + n.name + " {" + getScopeSignature(getGroupScope(n)) + "}";
            return n.type + " " + n.name + " " + (n.comment || "") + " " + ((n.ClassIOtype === 0 || n.ClassIOtype === 1) ? ("io" + n.ClassIOtype) : "");
        };
        const nodes = getScopeNodes(scope).filter(function (n) { return n.type != "group" || isClassGroup(n); }).map(describeNode).sort();
        const wires = getScopeLinks(scope).map(function (l) { return l.source.name + ":" + l.sourcePort + ">" + l.target.name + ":" + l.targetPort; }).sort();
        return nodes.join("\n") + "\n" + wires.join("\n");
    }

    /** @param {REDNode} node @returns {boolean} true if the object have audio inputs or outputs */
    function hasAudioIO(node) {
        return (node._def.inputs > 0) || (node._def.outputs > 0) ||
               (node.inputs > 0) || (node.outputs > 0); // node.inputs/outputs is used by AudioStreamObject
    }

    /**
     * @param {REDNode} node
     * @returns {boolean} true if the input count is decided by the connected wires (AudioMixer, AudioMixerStereo)
     */
    function hasDynInputs(node) {
        if (isVirtual(node)) return false; // such as BusJoin that have selectable input counts
        if (node.type == "AudioStreamObject") return false; // have a user defined fixed input count
        return node._def.dynInputs != undefined;
    }

    /**
     * @typedef {Object} ArrayInfo
     * @property {String} name   the name without the array part, "osc[NUM]" gives "osc"
     * @property {Number} length the array size, "osc[NUM]" gives the value of the ConstValue node NUM
     */
    /**
     * @param {REDNode} node
     * @returns {ArrayInfo|undefined} undefined when the node is not an array
     */
    function getArrayInfo(node) {
        if (isVirtual(node)) return undefined;
        if (node.name == undefined) return undefined;
        const arrayDef = RED.export.isNameDeclarationArray(node.name, node.z, true);
        if (arrayDef == undefined) return undefined;
        return { name: arrayDef.name, length: arrayDef.arrayLength };
    }

    /** @param {REDNode} node @returns {String} the name without any array part */
    function getBaseName(node) {
        const arrayInfo = getArrayInfo(node);
        if (arrayInfo != undefined) return arrayInfo.name;
        return node.name ? node.name : node.id;
    }

    /** @param {REDNode} node @returns {REDWorkspace} */
    function getWorkspaceOf(node) {
        return RED.nodes.getWorkspace(node.z);
    }

    /**
     * @param {REDNode} node
     * @param {Number} [port] when given only wires from that output port are returned
     * @returns {REDLink[]} in the same order as they are in the workspace
     */
    function getLinksFrom(node, port) {
        return getWorkspaceOf(node).links.filter(function (l) {
            return (l.source === node) && (port == undefined || Number(l.sourcePort) == port);
        });
    }

    /**
     * @param {REDNode} node
     * @param {Number} [port] when given only wires to that input port are returned
     * @returns {REDLink[]} in the same order as they are in the workspace
     */
    function getLinksTo(node, port) {
        return getWorkspaceOf(node).links.filter(function (l) {
            return (l.target === node) && (port == undefined || Number(l.targetPort) == port);
        });
    }

    /**
     * Gets the TabInput/TabOutput node inside a class that represents a port on the class node.
     * The ports are ordered top to bottom (that order is kept by RED.nodes in ws.tabInputs/ws.tabOutputs)
     * @param {REDWorkspace} classWs
     * @param {"In"|"Out"} direction
     * @param {Number} index the port index on the class node
     * @returns {REDNode|undefined} undefined if there is no such port
     */
    function getClassPort(classWs, direction, index) {
        const ports = (direction == "In") ? classWs.tabInputs : classWs.tabOutputs;
        if (ports == undefined || index < 0 || index >= ports.length) return undefined;
        return ports[index];
    }

    /**
     * @param {REDNode} portNode a class port (TabInput, TabOutput or a class group IO junction)
     * @returns {Number} the number of lanes, 1 for a normal port, more than 1 for a bus port
     */
    function getClassPortWidth(portNode) {
        const count = isClassOutputPort(portNode) ? Number(portNode.inputs) : Number(portNode.outputs);
        return (count > 1) ? count : 1;
    }

    /**
     * The array info of what a wire comes from: for an output junction of a class group it's the
     * class group instance (voices[8]), as that's what the junction is a port of.
     * @param {REDNode} node the source of a wire
     * @returns {ArrayInfo|undefined}
     */
    function getSourceArrayInfo(node) {
        if (isGroupPort(node)) return getArrayInfo(node.parentGroup);
        return getArrayInfo(node);
    }

    /**
     * Does the input a wire goes to take one signal? (used to split a bus into an array, one signal per element)
     *   a class input with one lane, a normal object input: yes
     *   a class input with more lanes (a bus input), a dyn input object (mixer), virtual nodes: no
     * @param {REDLink} link
     * @returns {Boolean}
     */
    function takesOneSignal(link) {
        const target = link.target;
        if (isGroupPort(target)) return getClassPortWidth(target) == 1;
        if (isClass(target)) {
            const portNode = getClassPort(getClassWorkspace(target), "In", Number(link.targetPort));
            return portNode != undefined && getClassPortWidth(portNode) == 1;
        }
        if (isVirtual(target) || hasDynInputs(target)) return false;
        return true;
    }

    /**
     * The array info of what a wire goes to: for an input junction of a class group it's the class group instance.
     * @param {REDLink} link
     * @returns {ArrayInfo|undefined}
     */
    function getTargetArrayInfo(link) {
        if (isGroupPort(link.target)) return getArrayInfo(link.target.parentGroup);
        return getArrayInfo(link.target);
    }

    /**
     * @typedef {Object} WireEnd
     * @property {REDNode} node   the node at the end of the wire(s)
     * @property {Number} port    the port on that node
     * @property {REDLink[]} links all wires passed on the way (in signal flow order)
     */
    /**
     * Follows a wire forward through any junctions.
     * @param {REDLink} link
     * @returns {WireEnd[]} every real (non junction) end, a junction can split into many wires
     */
    function followJunctionsForward(link) {
        const ends = [];
        followForward(link, [], new Set(), ends);
        return ends;
    }
    function followForward(link, linksSoFar, visited, ends) {
        const links = [...linksSoFar, link];
        if (isJunction(link.target) == false) {
            ends.push({ node: link.target, port: Number(link.targetPort), links });
            return;
        }
        if (visited.has(link.target)) return; // wire loop between junctions
        visited.add(link.target);
        for (const next of getLinksFrom(link.target)) {
            followForward(next, links, visited, ends);
        }
    }

    /**
     * Follows a wire backward through any junctions to the node the signal comes from.
     * @param {REDLink} link
     * @returns {WireEnd|undefined} undefined if a junction on the way have no input
     */
    function followJunctionsBackward(link) {
        const links = [link];
        const visited = new Set();
        while (isJunction(link.source)) {
            if (visited.has(link.source)) return undefined; // wire loop between junctions
            visited.add(link.source);
            const incoming = getLinksTo(link.source);
            if (incoming.length == 0) return undefined;
            link = incoming[0]; // a junction can only have one input
            links.unshift(link);
        }
        return { node: link.source, port: Number(link.sourcePort), links };
    }

    /**
     * @param {REDNode} node
     * @returns {REDLink[]} the wires into a node sorted by input port (the order the signals get on a dyn input object)
     */
    function getLinksToSorted(node) {
        return getLinksTo(node).sort(function (a, b) { return Number(a.targetPort) - Number(b.targetPort); });
    }

    /**
     * @param {REDNode} node a node that don't have dyn inputs
     * @returns {Number} the number of audio inputs the object have
     */
    function getInputCount(node) {
        if (node.type == "AudioStreamObject") return Number(node.inputs);
        return Number(node._def.inputs);
    }

    /** @param {REDLink} link @returns {String} the wire as drawn in the editor, for comments and reports, i.e. osc:0 -> mixer:1 */
    function describeLink(link) {
        return getBaseName(link.source) + ":" + link.sourcePort + " -> " + getBaseName(link.target) + ":" + link.targetPort;
    }

    /** @param {REDNode} classNode @param {REDNode} tabInput @returns {Number} the class node input port that the TabInput represents */
    function getClassInputIndex(classNode, tabInput) {
        return getClassWorkspace(classNode).tabInputs.indexOf(tabInput);
    }

    return {
        isJunction,
        isBusNode,
        isClass,
        getClassWorkspace,
        getClassName,
        isVirtual,
        isClassGroup,
        getClassGroupOf,
        isGroupPort,
        isClassInputPort,
        isClassOutputPort,
        getGroupScope,
        getScopeNodes,
        getScopeLinks,
        getClassGroupChain,
        getEndChain,
        getLinkOwner,
        getScopeSignature,
        getSourceArrayInfo,
        getTargetArrayInfo,
        takesOneSignal,
        hasAudioIO,
        hasDynInputs,
        getArrayInfo,
        getBaseName,
        getWorkspaceOf,
        getLinksFrom,
        getLinksTo,
        getClassPort,
        getClassPortWidth,
        followJunctionsForward,
        followJunctionsBackward,
        getLinksToSorted,
        getInputCount,
        getClassInputIndex,
        describeLink,
    };
})();
