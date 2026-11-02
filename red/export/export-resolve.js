/**
 * Turns the editor design into a ResolvedDesign (see the model/ folder).
 *
 * This is where all the 'hard' things are solved, once, for every kind of export.
 *
 * THE RULE: every audio input has exactly one source, so every connection is found by
 * starting at a real audio object input and following the wire backwards until a real
 * audio object output is found. On the way back the following only forwards the signal:
 *   junction      - the wire continues from the junction input
 *   class output  - continues inside the class, from what is connected to the TabOutput
 *   class input   - continues outside the class, from what is connected to the class node input (pass through)
 *   BusJoin       - its output carries the signals of input 0, then input 1, ...
 *   BusSplit      - output k carries signal k of the bus on its input
 *
 * A class can be a workspace (tab) or a class group (a group with 'export as class', see export-graph.js),
 * the IO junctions of a class group are its ports: the wires outside of the group are connected directly
 * to them, so they are both the port and the instance input/output. A 'scope' is the nodes/wires of one
 * class: the nodes inside a class group belongs to the class group, not to the workspace it's drawn in.
 *
 * A wire can carry more than one signal (a bus):
 *   array into a non array          - one signal per element
 *   class output, BusJoin           - see above, buses can be nested
 *   class input with N lanes        - (TabInput.outputs = N) lane k gets signal k of the wire
 *   into a dyn input object (mixer) - every signal gets its own input, after the signals of the wires above
 *   into a normal object            - the signals go to the inputs after each other, starting at the wire input
 * and arrays:
 *   array to array      - element i to element i
 *   non array to array  - to every element
 *   bus to array        - signal i to element i, when the bus have as many signals as the array have elements
 *                         and the array takes one signal per element (a normal object or a class input with one lane)
 *
 * OWNERSHIP: a connection is made in the innermost workspace that contains both its ends.
 * A connection that only exists inside a class is the same for every instance of that class,
 * everything that crosses a class border is made in the workspace that uses the class
 * (with the full path into the class, i.e. voice[2].env).
 * So when a class is exported on its own, the connections from its TabInputs are not made,
 * they are made in every workspace that uses the class.
 *
 * PROBLEMS: every wire in the workspace is checked (validateWires), mismatching array sizes or
 * bus widths are errors that stops the export, unsupported things are warnings.
 *
 * Nothing here changes the editor structures.
 */
RED.exporter.resolve = (function () {
    'use strict';

    const graph = RED.exporter.graph;
    const MAX_DEPTH = 64; // failsafe for classes that contain themselves and bus loops

    /** a signal that comes from a TabInput of the workspace being resolved, i.e. from outside of it */
    const OUTSIDE = Object.freeze({ outside: true });

    /** used when only counting signals, the problems are reported when the wires are validated */
    function SILENT() {}

    /**
     * @typedef {Object} ResolvedSignal
     * @property {ResolvedPathStep[]} path from the workspace being resolved to the real audio object
     * @property {Number} port the output port on the real audio object
     * @property {REDLink[]} links all wires the signal passed, in signal flow order
     */
    /**
     * A wire carries a list of these:
     *   ResolvedSignal - a real audio object output
     *   OUTSIDE        - comes from outside of the workspace being resolved
     *   undefined      - nothing (i.e. a class output that is not connected inside the class),
     *                    still takes a place so the following signals keep their positions
     * @typedef {ResolvedSignal|OUTSIDE|undefined} WireSignal
     */
    /** @callback Report @param {ResolvedProblem} problem */

    /**
     * @param {REDWorkspace[]} workspaces
     * @returns {ResolvedDesign}
     */
    function resolveDesign(workspaces) {
        const design = new ResolvedDesign();
        for (const ws of workspaces) {
            design.workspaces.push(resolveWorkspace(ws));
        }
        return design;
    }

    /**
     * @param {REDWorkspace} ws
     * @param {{allConnections:Boolean}} [options] allConnections: makes all connections in the workspace and inside all its
     *                                            class instances, instead of only the ones it owns (used when flattening)
     * @returns {ResolvedWorkspace}
     */
    function resolveWorkspace(ws, options) {
        const allConnections = (options != undefined && options.allConnections == true);
        const rws = new ResolvedWorkspace(ws);
        for (const node of graph.getScopeNodes(ws)) { // not the nodes inside class groups, they belong to the class group
            addNode(rws, node);
        }
        validateWires(rws);
        findConnections(rws, [], ws, 0, allConnections);
        sortConnectionsInWireOrder(rws);
        checkInputsUsedOnce(rws);
        return rws;
    }

    // ******************************************************************
    // nodes
    // ******************************************************************

    /**
     * @param {ResolvedWorkspace} rws
     * @param {REDNode} node
     */
    function addNode(rws, node) {
        const code = rws.userCode;

        if (node.type == "ClassComment") code.classComments.push(node.name);
        else if (node.type == "Function") code.functions.push(node.comment); // code nodes use the comment field for the code
        else if (node.type == "Variables") code.variables.push(node.comment);
        else if (node.type == "ConstValue") code.constants.push({ name: node.name, type: node.valueType, value: node.value });
        else if (node.type == "ConstructorCode") code.constructorCode.push(node.comment);
        else if (node.type == "DestructorCode") code.destructorCode.push(node.comment);
        else if (node.type == "EndOfFileCode") code.endOfFileCode.push(node.comment);
        else if (node.type == "IncludeDef") addUnique(code.includes, node.name);
        else if (node.type == "CodeFile") code.codeFiles.push({ name: node.name, contents: node.comment });
        else if (node.type == "DontRemoveCodeFiles") code.keepFiles.push(...splitLines(node.comment));
        else if (node.type == "PointerArray") code.pointerArrays.push({ type: node.objectType, name: node.name, items: node.arrayItems });
        else if (node.type == "AudioStreamObject" && node.includeFile) addUnique(code.includes, node.includeFile);

        if (graph.isVirtual(node)) return; // the rest is about nodes that becomes C++ objects

        const obj = new ResolvedObject(node);
        obj.typeName = (node.type == "AudioStreamObject") ? node.subType : graph.getClassName(node); // getClassName gives the node type for a normal object
        obj.isClass = graph.isClass(node);
        if (obj.typeName == undefined || obj.typeName.length == 0) {
            if (graph.isClassGroup(node)) rws.addProblem(new ResolvedProblem("error", "the class name of the group " + graph.getBaseName(node) + " is not set", undefined, node));
            else rws.addProblem(new ResolvedProblem("error", "the Sub Type of " + node.type + " " + graph.getBaseName(node) + " is not set", undefined, node));
        }
        else if (graph.isClassGroup(node)) { // a group name is free text, but a class group name is the instance name
            if (/^[A-Za-z_]\w*$/.test(obj.typeName) == false)
                rws.addProblem(new ResolvedProblem("error", "the class name '" + obj.typeName + "' of the group " + node.name + " is not a valid C++ name", undefined, node));
            if (/^[A-Za-z_]\w*(\[\s*\w+\s*\])?$/.test(node.name) == false)
                rws.addProblem(new ResolvedProblem("error", "the group name '" + node.name + "' is not a valid C++ instance name (the name is the instance, i.e. voices or voices[8], the class name is set by the class name)", undefined, node));
        }

        const arrayInfo = graph.getArrayInfo(node);
        if (arrayInfo != undefined) obj.arrayLength = arrayInfo.length;

        if (graph.hasDynInputs(node)) {
            obj.dynInputCount = getDynInputCount(node);
            rws.dynMixers.push({ type: node.type, count: obj.dynInputCount });
        }
        if (obj.isClass) addUnique(rws.usedClasses, obj.typeName);

        if (graph.hasAudioIO(node)) rws.audioObjects.push(obj);
        else rws.controlObjects.push(obj);
    }

    /**
     * @param {REDNode} node a dyn input node
     * @returns {Number} the number of inputs the object needs (at least 1)
     */
    function getDynInputCount(node) {
        let count = 0;
        for (const wire of graph.getLinksToSorted(node)) {
            count += getWireWidth(wire);
        }
        return Math.max(1, count);
    }

    /**
     * @param {REDLink} wire
     * @returns {Number} the number of signals the wire carries (into one element if the target is an array)
     */
    function getWireWidth(wire) {
        const targetIndex = (graph.getTargetArrayInfo(wire) != undefined) ? 0 : undefined;
        return getWireSignals(getWireCtx(wire), wire, targetIndex, SILENT, 0).length;
    }

    /**
     * The class group instances (the first element of arrays) the target of a wire is inside of, in the workspace,
     * used when a wire is checked on its own (so a loose wire into class groups can be followed out of them).
     * @param {REDLink} wire
     * @returns {ResolvedPathStep[]}
     */
    function getWireCtx(wire) {
        return graph.getEndChain(wire.target, false).map(function (group) {
            return new ResolvedPathStep(group, (graph.getArrayInfo(group) != undefined) ? 0 : undefined);
        });
    }

    // ******************************************************************
    // following signals backwards
    // ******************************************************************

    /**
     * Gets the signals a wire carries into its target.
     * @param {ResolvedPathStep[]} ctx the class instances (from the workspace being resolved) the wire is inside of
     * @param {REDLink} wire
     * @param {Number|undefined} targetIndex the target array element, if the target is an array
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal[]}
     */
    function getWireSignals(ctx, wire, targetIndex, report, depth) {
        if (depth > MAX_DEPTH) {
            report(new ResolvedProblem("error", "classes or buses nested too deep (does a class contain itself, or is there a bus loop?)", wire));
            return [undefined];
        }
        const from = graph.followJunctionsBackward(wire);
        if (from == undefined) {
            report(new ResolvedProblem("warning", "the wire comes from a junction without input", wire));
            return [undefined];
        }
        const crossing = getWireCrossing(wire, from);
        if (crossing.entered.length != 0) { // a loose wire into class groups, the wire is outside of them
            const outerCtxLength = ctx.length - crossing.entered.length;
            const isInCtx = function (group, i) { return ctx[outerCtxLength + i] != undefined && ctx[outerCtxLength + i].node === group; };
            if (outerCtxLength < 0 || crossing.entered.every(isInCtx) == false)
                return [OUTSIDE]; // the class group being resolved is one of them
            if (crossing.targetArrayGroup != -1) targetIndex = ctx[outerCtxLength + crossing.targetArrayGroup].index;
            ctx = ctx.slice(0, outerCtxLength);
        }
        const sourceArray = crossing.sourceArray;
        const targetArray = crossing.targetArray;
        let indexes = [undefined];
        if (sourceArray != undefined) {
            if (targetArray != undefined) // element to element
                indexes = (targetIndex < sourceArray.length) ? [targetIndex] : []; // mismatch is reported by validateWires
            else // all elements as a bus
                indexes = range(sourceArray.length);
        }
        const signals = [];
        for (const index of indexes) {
            const outputSignals = (crossing.crossed.length != 0)
                ? getLooseSourceSignals(ctx, crossing.crossed, index, from, report, depth + 1)
                : getSourceSignals(ctx, from, index, report, depth + 1);
            for (const signal of outputSignals) {
                signals.push(withLinks(signal, from.links));
            }
        }
        if (isBusSplitIntoArray(wire, sourceArray, targetArray, signals.length) && targetIndex != undefined)
            return [signals[targetIndex]]; // signal i to element i
        return signals;
    }

    /**
     * @typedef {Object} WireCrossing
     * @property {REDNode[]} crossed  the class groups the wire goes out of (the source is inside of them), the outermost first
     * @property {REDNode[]} entered  the class groups the wire goes into (the target is inside of them), the outermost first
     * @property {ArrayInfo|undefined} sourceArray the array the wire comes from: the outermost crossed group, or the source itself
     * @property {ArrayInfo|undefined} targetArray the array the wire goes to: the outermost entered array group, or the target itself
     * @property {Number} targetArrayGroup the index in entered of the target array group, -1 when the target array is the target itself
     */
    /**
     * A normal wire have both ends in the same class scope, a loose wire goes straight out of and/or into class groups
     * (without IO junctions), it's the same as if there was an IO junction at every group border it passes:
     *   out of a class group array - one signal per element (a bus), or element to element into an array of the same size
     *   into a class group array   - to every element, element to element, or a bus split, the same as any array target
     * @param {REDLink} wire
     * @param {WireEnd} from the source end of the wire (after the junctions)
     * @returns {WireCrossing}
     */
    function getWireCrossing(wire, from) {
        const sourceChain = graph.getEndChain(from.node, true);
        const targetChain = graph.getEndChain(wire.target, false);
        let common = 0;
        while (common < sourceChain.length && sourceChain[common] === targetChain[common]) common++;
        const crossed = sourceChain.slice(common);
        const entered = targetChain.slice(common);

        let sourceArray = undefined;
        if (crossed.length != 0) sourceArray = graph.getArrayInfo(crossed[0]);
        else if (graph.isClassInputPort(from.node) == false) sourceArray = graph.getSourceArrayInfo(from.node);

        const targetArrayGroup = entered.findIndex(function (group) { return graph.getArrayInfo(group) != undefined; });
        const targetArray = (targetArrayGroup != -1) ? graph.getArrayInfo(entered[targetArrayGroup]) : graph.getTargetArrayInfo(wire);
        return { crossed, entered, sourceArray, targetArray, targetArrayGroup };
    }

    /**
     * The signals of a wire end, seen from the scope the end is in.
     * @param {ResolvedPathStep[]} ctx
     * @param {WireEnd} from
     * @param {Number|undefined} index the array element of the source
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal[]}
     */
    function getSourceSignals(ctx, from, index, report, depth) {
        if (graph.isClassInputPort(from.node)) // TabInput or the input junction of a class group (seen from inside the class)
            return [getClassInputSignal(ctx, from.node, from.port, report, depth)];
        if (graph.isGroupPort(from.node)) // the output junction of a class group (seen from outside of the class)
            return getPortOutputSignals(ctx, new ResolvedPathStep(from.node.parentGroup, index), from.node, report, depth);
        return getOutputSignals(ctx, new ResolvedPathStep(from.node, index), from.port, report, depth);
    }

    /**
     * The signals of a loose wire out of class groups: goes into every crossed class group instance (all elements of the
     * inner ones), and gives the signals of the source in each of them, after each other.
     * @param {ResolvedPathStep[]} ctx the scope the wire is in
     * @param {REDNode[]} crossed see WireCrossing
     * @param {Number|undefined} index the element of the outermost crossed group
     * @param {WireEnd} from
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal[]}
     */
    function getLooseSourceSignals(ctx, crossed, index, from, report, depth) {
        let ctxs = [[...ctx, new ResolvedPathStep(crossed[0], index)]];
        for (const group of crossed.slice(1)) {
            ctxs = ctxs.flatMap(function (c) { return indexesOf(graph.getArrayInfo(group)).map(function (i) { return [...c, new ResolvedPathStep(group, i)]; }); });
        }
        const signals = [];
        for (const innerCtx of ctxs) {
            const sourceArray = graph.isClassInputPort(from.node) ? undefined : graph.getSourceArrayInfo(from.node);
            for (const i of indexesOf(sourceArray)) {
                signals.push(...getSourceSignals(innerCtx, from, i, report, depth));
            }
        }
        return signals;
    }

    /**
     * A bus (a wire with more than one signal, not from an array) into an array that takes one signal per element,
     * with as many signals as the array have elements, is split: signal i goes to element i
     * (the opposite of an array into a non array, that gives a bus with one signal per element).
     * @param {REDLink} wire
     * @param {ArrayInfo|undefined} sourceArray
     * @param {ArrayInfo|undefined} targetArray
     * @param {Number} signalCount
     * @returns {Boolean}
     */
    function isBusSplitIntoArray(wire, sourceArray, targetArray, signalCount) {
        return sourceArray == undefined && targetArray != undefined && signalCount > 1 &&
               signalCount == targetArray.length && graph.takesOneSignal(wire);
    }

    /**
     * Gets the signals an output gives.
     * @param {ResolvedPathStep[]} ctx
     * @param {ResolvedPathStep} step the node with the output
     * @param {Number} port
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal[]}
     */
    function getOutputSignals(ctx, step, port, report, depth) {
        const node = step.node;
        if (graph.isClass(node))
            return getClassOutputSignals(ctx, step, port, report, depth);

        if (node.type == "BusJoin") {
            const signals = [];
            for (let input = 0; input < Math.max(1, Number(node.inputs)); input++) {
                const wires = graph.getLinksTo(node, input);
                if (wires.length == 0) {
                    report(new ResolvedProblem("warning", "BusJoin " + graph.getBaseName(node) + " input " + input + " is not connected"));
                    signals.push(undefined);
                }
                else signals.push(...getWireSignals(ctx, wires[0], undefined, report, depth + 1));
            }
            return signals;
        }
        if (node.type == "BusSplit") {
            const wires = graph.getLinksTo(node, 0);
            if (wires.length == 0) return [undefined];
            return [getWireSignals(ctx, wires[0], undefined, report, depth + 1)[port]]; // a mismatch is reported by validateWires
        }
        if (graph.isVirtual(node)) {
            report(new ResolvedProblem("warning", "wires from " + node.type + " are not supported by the export"));
            return [undefined];
        }
        return [{ path: [...ctx, step], port, links: [] }];
    }

    /**
     * A class node output port, see getPortOutputSignals.
     * @param {ResolvedPathStep[]} ctx
     * @param {ResolvedPathStep} step the class node
     * @param {Number} port
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal[]}
     */
    function getClassOutputSignals(ctx, step, port, report, depth) {
        const node = step.node;
        const portNode = graph.getClassPort(graph.getClassWorkspace(node), "Out", port);
        if (portNode == undefined) {
            report(new ResolvedProblem("error", graph.getClassName(node) + " don't have output " + port, undefined, node));
            return [undefined];
        }
        return getPortOutputSignals(ctx, step, portNode, report, depth);
    }

    /**
     * A class output gives the signals connected to its output port inside the class
     * (TabOutput, or the output junction of a class group), lane by lane.
     * @param {ResolvedPathStep[]} ctx
     * @param {ResolvedPathStep} instanceStep the class instance (class node or class group)
     * @param {REDNode} portNode the output port
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal[]}
     */
    function getPortOutputSignals(ctx, instanceStep, portNode, report, depth) {
        const instance = instanceStep.node;
        const innerCtx = [...ctx, instanceStep];
        const signals = [];
        for (let lane = 0; lane < graph.getClassPortWidth(portNode); lane++) {
            const wires = graph.getLinksTo(portNode, lane);
            if (wires.length == 0) {
                report(new ResolvedProblem("warning", graph.getClassName(instance) + " output " + getPortName(portNode) + (lane != 0 ? (" lane " + lane) : "") + " is not connected inside the class", undefined, instance));
                signals.push(undefined);
            }
            else signals.push(...getWireSignals(innerCtx, wires[0], undefined, report, depth + 1));
        }
        return signals;
    }

    /**
     * A class input port lane gives signal 'lane' of the wire connected to the class instance input (outside of the class):
     * for a TabInput that's the wire to the class node port, for the input junction of a class group
     * it's the wire to the junction itself (it's both the port and the instance input).
     * @param {ResolvedPathStep[]} ctx the last item is the class instance the port is inside of
     * @param {REDNode} portNode TabInput or the input junction of a class group
     * @param {Number} lane
     * @param {Report} report
     * @param {Number} depth
     * @returns {WireSignal}
     */
    function getClassInputSignal(ctx, portNode, lane, report, depth) {
        if (ctx.length == 0) return OUTSIDE; // an input port of the workspace (or class group) being resolved

        const instance = ctx[ctx.length - 1];
        const wires = graph.isGroupPort(portNode)
            ? graph.getLinksTo(portNode)
            : graph.getLinksTo(instance.node, graph.getClassInputIndex(instance.node, portNode));
        if (wires.length == 0) return undefined; // the class input is not connected

        const signals = getWireSignals(ctx.slice(0, -1), wires[0], instance.index, report, depth + 1);
        return signals[lane]; // a mismatch between the wire and the lanes is reported by validateWires
    }

    /** @param {WireSignal} signal @param {REDLink[]} links @returns {WireSignal} the signal with the links added at the end */
    function withLinks(signal, links) {
        if (signal == undefined || signal === OUTSIDE) return signal;
        return { path: signal.path, port: signal.port, links: [...signal.links, ...links] };
    }

    // ******************************************************************
    // checking all wires
    // ******************************************************************

    /**
     * Checks every wire in the workspace, reports errors and warnings.
     * @param {ResolvedWorkspace} rws
     */
    function validateWires(rws) {
        const report = function (problem) { rws.addProblem(problem); };
        for (const wire of graph.getScopeLinks(rws.ws)) { // not the wires inside class groups, they belong to the class group
            validateWire(wire, report);
        }
    }

    /**
     * Checks one wire, used by the editor to show the wires that can't be exported.
     * note. a wire to a junction is checked as part of the wire(s) after the junction, so it never have problems itself
     * @param {REDLink} wire
     * @returns {ResolvedProblem[]} the errors and warnings of the wire
     */
    function validateLink(wire) {
        const problems = [];
        validateWire(wire, function (problem) { if (problem.link === wire || problem.link == undefined) problems.push(problem); });
        return problems;
    }

    /**
     * @param {REDLink} wire
     * @param {Report} report
     */
    function validateWire(wire, report) {
        const source = wire.source;
        const target = wire.target;
        const port = Number(wire.targetPort);
        if (graph.isJunction(target)) return; // checked as part of the wire(s) after the junction

        if (graph.isVirtual(source) && graph.isJunction(source) == false && graph.isBusNode(source) == false && graph.isClassInputPort(source) == false && graph.isGroupPort(source) == false) {
            report(new ResolvedProblem("warning", "wires from " + source.type + " are not supported by the export", wire));
            return;
        }
        if (graph.isVirtual(target) && graph.isBusNode(target) == false && graph.isClassOutputPort(target) == false && graph.isGroupPort(target) == false) {
            report(new ResolvedProblem("warning", "wires to " + target.type + " are not supported by the export", wire));
            return;
        }
        if (graph.getLinksTo(target, port).length > 1)
            report(new ResolvedProblem("error", "input " + port + " of " + graph.getBaseName(target) + " have more than one wire", wire));

        const from = graph.followJunctionsBackward(wire);
        if (from == undefined) {
            report(new ResolvedProblem("warning", "the wire comes from a junction without input", wire));
            return;
        }
        const crossing = getWireCrossing(wire, from);
        const sourceArray = crossing.sourceArray;
        const targetArray = crossing.targetArray;
        if (sourceArray != undefined && targetArray != undefined && sourceArray.length != targetArray.length) {
            report(new ResolvedProblem("error", "the array sizes don't match, " + sourceArray.name + " have " + sourceArray.length + " and " + targetArray.name + " have " + targetArray.length, wire));
            return;
        }
        // the problems of the wires on the way that are in another scope are reported when that scope is checked
        const owner = graph.getLinkOwner(wire);
        const reportOwnScope = function (problem) { if (problem.link == undefined || graph.getLinkOwner(problem.link) === owner) report(problem); };
        const width = getWireSignals(getWireCtx(wire), wire, (targetArray != undefined) ? 0 : undefined, reportOwnScope, 0).length;
        // a bus into an array that takes one signal per element is split one signal per element (see isBusSplitIntoArray),
        // when that don't happen, it's because the number of signals don't match, so tell that
        const arrayHint = (sourceArray == undefined && targetArray != undefined && width > 1 && graph.takesOneSignal(wire))
            ? " (a bus into the array " + targetArray.name + " gives one signal per element, so it must have " + targetArray.length + " signals)" : "";
        const signalsText = width + " signal" + (width != 1 ? "s" : "");

        if (graph.isClass(target) || (graph.isGroupPort(target) && graph.isClassInputPort(target))) {
            // a class node port, or the input junction of a class group (that is both the port and the instance input)
            const instance = graph.isGroupPort(target) ? target.parentGroup : target;
            const portNode = graph.isGroupPort(target) ? target : graph.getClassPort(graph.getClassWorkspace(target), "In", port);
            if (portNode == undefined) {
                report(new ResolvedProblem("error", graph.getClassName(instance) + " don't have input " + port, wire));
                return;
            }
            const lanes = graph.getClassPortWidth(portNode);
            if (width != lanes)
                report(new ResolvedProblem("error", "the wire carries " + signalsText + " but " + graph.getClassName(instance) + " input " + getPortName(portNode) + " have " + lanes + " lane" + (lanes != 1 ? "s" : "") + arrayHint, wire));
        }
        else if (target.type == "BusSplit") {
            const outputs = Math.max(1, Number(target.outputs));
            if (width != outputs)
                report(new ResolvedProblem("error", "the wire carries " + signalsText + " but BusSplit " + graph.getBaseName(target) + " have " + outputs + " outputs", wire));
        }
        else if (target.type == "BusJoin" || graph.isClassOutputPort(target) || graph.hasDynInputs(target)) {
            // takes any number of signals
        }
        else {
            const inputCount = graph.getInputCount(target);
            if (isNaN(inputCount) == false && port + width > inputCount)
                report(new ResolvedProblem("error", "the wire carries " + signalsText + " into input " + port + " but " + graph.getBaseName(target) + " only have " + inputCount + " input" + (inputCount != 1 ? "s" : "") + arrayHint, wire));
        }
    }

    // ******************************************************************
    // finding the connections
    // ******************************************************************

    /**
     * Goes through every real audio object in the workspace and inside all class instances in it,
     * and makes the connections into their inputs that this workspace owns.
     * @param {ResolvedWorkspace} rws
     * @param {ResolvedPathStep[]} ctx the class instances to the current workspace
     * @param {REDWorkspace} ws the current workspace
     * @param {Number} depth
     * @param {Boolean} allConnections see resolveWorkspace
     */
    function findConnections(rws, ctx, ws, depth, allConnections) {
        if (depth > MAX_DEPTH) {
            rws.addProblem(new ResolvedProblem("error", "classes nested too deep (does a class contain itself?)"));
            return;
        }
        for (const node of graph.getScopeNodes(ws)) {
            if (graph.isVirtual(node)) continue;
            for (const index of indexesOf(graph.getArrayInfo(node))) {
                const step = new ResolvedPathStep(node, index);
                if (graph.isClass(node)) findConnections(rws, [...ctx, step], graph.getClassWorkspace(node), depth + 1, allConnections);
                else addConnectionsInto(rws, ctx, step, allConnections);
            }
        }
    }

    /**
     * @param {ResolvedWorkspace} rws
     * @param {ResolvedPathStep[]} ctx
     * @param {ResolvedPathStep} targetStep a real audio object (or an element of it)
     * @param {Boolean} allConnections see resolveWorkspace
     */
    function addConnectionsInto(rws, ctx, targetStep, allConnections) {
        const target = targetStep.node;
        const dynInputs = graph.hasDynInputs(target);
        let dynIndex = 0; // the real input of the first signal of the current wire

        for (const wire of graph.getLinksToSorted(target)) {
            const signals = getWireSignals(ctx, wire, targetStep.index, SILENT, 0);
            for (let i = 0; i < signals.length; i++) {
                const signal = signals[i];
                if (signal == undefined || signal === OUTSIDE) continue;
                if (allConnections == false && isOwnedHere(signal.path, ctx) == false) continue;

                const port = dynInputs ? (dynIndex + i) : (Number(wire.targetPort) + i);
                rws.addConnection(new ResolvedConnection(
                    new ResolvedEndpoint(signal.path, signal.port),
                    new ResolvedEndpoint([...ctx, targetStep], port),
                    signal.links));
            }
            dynIndex += signals.length;
        }
    }

    /**
     * A connection is owned by the workspace being resolved, if it's not completely inside one of its class instances.
     * @param {ResolvedPathStep[]} sourcePath
     * @param {ResolvedPathStep[]} targetCtx the class instances the target is inside of
     */
    function isOwnedHere(sourcePath, targetCtx) {
        if (targetCtx.length == 0 || sourcePath.length == 1) return true;
        return (sourcePath[0].node !== targetCtx[0].node) || (sourcePath[0].index !== targetCtx[0].index);
    }

    /**
     * The connections are found input by input, this puts them in the order of the wires in the workspace
     * (that is sorted by the editor), so the generated code follows the design.
     * @param {ResolvedWorkspace} rws
     */
    function sortConnectionsInWireOrder(rws) {
        const wireIndex = new Map(graph.getScopeLinks(rws.ws).map(function (l, i) { return [l, i]; }));
        const orderOf = function (c) {
            let order = Infinity;
            for (const l of c.links) if (wireIndex.has(l)) order = Math.min(order, wireIndex.get(l));
            return order;
        };
        const orders = new Map(rws.connections.map(function (c) { return [c, orderOf(c)]; }));
        rws.connections.sort(function (a, b) { return orders.get(a) - orders.get(b); }); // sort is stable, so the signal order is kept
    }

    /**
     * An audio input can only have one connection,
     * catches overlapping buses (the inputs that more than one wire is connected to is already reported by validateWires).
     * @param {ResolvedWorkspace} rws
     */
    function checkInputsUsedOnce(rws) {
        const used = new Map();
        for (const c of rws.connections) {
            const key = c.target.toString();
            const other = used.get(key);
            used.set(key, c);
            if (other == undefined) continue;

            const wire = c.links[c.links.length - 1], otherWire = other.links[other.links.length - 1];
            const sameDrawnInput = (wire !== otherWire) && (wire.target === otherWire.target) && (wire.targetPort == otherWire.targetPort);
            if (sameDrawnInput) continue; // two wires drawn to the same input, already reported by validateWires
            rws.addProblem(new ResolvedProblem("error", "input " + key + " gets more than one signal (do two buses overlap?)", wire));
        }
    }

    // ******************************************************************
    // small helpers
    // ******************************************************************

    function getPortName(portNode) {
        return portNode.name ? ('"' + portNode.name + '"') : portNode.id;
    }

    /** @param {ArrayInfo|undefined} arrayInfo @returns {(Number|undefined)[]} the element indexes, [undefined] when not an array */
    function indexesOf(arrayInfo) {
        return (arrayInfo != undefined) ? range(arrayInfo.length) : [undefined];
    }

    function range(count) {
        return [...Array(Math.max(0, count)).keys()];
    }

    function addUnique(array, item) {
        if (array.includes(item) == false) array.push(item);
    }

    function splitLines(text) {
        if (text == undefined) return [];
        return text.split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s.length != 0; });
    }

    return {
        resolveDesign,
        resolveWorkspace,
        validateLink,
    };
})();
