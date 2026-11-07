/**
 * Live control of the audio objects on a Teensy, the layer between the UI and the protocols.
 *
 *   UI (tab-live.js, later the UI objects)
 *     -> RED.control.core.invoke(targets, method, channel, values)    nothing about the protocol here
 *          the values are kept (per node + method + channel), sends are coalesced (a dragged slider sends the latest value)
 *     -> adapter.send(commands)                                     one adapter per protocol (control-osc.js ...)
 *
 * A target is one object on the Teensy, by its path in the design tree ("/voices/i0/env"), the same tree as the
 * OSC live update (RED.exporter.oscLive). A node in a class gives one target per instance, an array one per element.
 *
 * A command (what an adapter gets):
 *   { path, typeName, method, call, args: [{type, value}] }  the channel of a perChannel method is the first arg (type "int")
 *
 * An adapter:
 *   { id, label, isConnected(), send(commands), read(command) -> Promise<value> }
 */
RED.control = RED.control || {};
RED.control.core = (function () {
    'use strict';

    const FLUSH_DELAY_MS = 25; // the max rate a dragged slider sends at (per target and method)

    const adapters = new Map();
    let activeAdapterId = undefined;
    const values = new Map();  // nodeId|methodId|channel -> the argument values
    const pending = new Map(); // path|methodId|channel -> command (the latest)
    let flushTimer = undefined;

    // ******************************************************************
    // adapters
    // ******************************************************************

    function registerAdapter(adapter) {
        adapters.set(adapter.id, adapter);
        if (activeAdapterId == undefined) activeAdapterId = adapter.id;
    }
    function getAdapters() { return [...adapters.values()]; }
    function getAdapter() { return adapters.get(activeAdapterId); }
    function setAdapter(id) { if (adapters.has(id)) activeAdapterId = id; }

    // ******************************************************************
    // targets
    // ******************************************************************

    /**
     * The design tree that is on the Teensy: the one the OSC live update keeps (it have the real input counts of the mixers),
     * else the design of the current tab
     * @returns {{ws:REDWorkspace, model:OscLiveModel, source:"live"|"design"}|undefined}
     */
    function getTree() {
        const live = (OSC.LiveUpdate != undefined && OSC.LiveUpdate.getRootId != undefined) ? OSC.LiveUpdate : undefined;
        if (live != undefined && RED.OSC.settings.LiveUpdate == true) {
            const ws = RED.nodes.getWorkspace(live.getRootId());
            const model = live.getTeensyModel();
            if (ws != undefined && model != undefined) return { ws, model, source: "live" };
        }
        const ws = RED.nodes.currentWorkspace;
        if (ws == undefined) return undefined;
        try {
            return { ws, model: RED.exporter.oscLive.getModel(ws).model, source: "design" };
        }
        catch (err) {
            console.error(err);
            return undefined;
        }
    }

    /** @param {OscLiveModel} model @param {OscLiveItem} item @returns {Object} the target of the object */
    function makeTarget(model, item) {
        const inputLabels = {};
        for (const c of model.connections.values()) {
            if (c.target != item.path) continue;
            const source = c.source.substring(c.owner.length + 1) || c.source; // relative to the group that makes the connection
            inputLabels[c.targetPort] = source + ((c.sourcePort != 0) ? (":" + c.sourcePort) : "");
        }
        return { path: item.path, typeName: item.typeName, inputs: item.inputs, inputLabels };
    }

    /**
     * @param {REDNode} node
     * @returns {{tree:Object|undefined, targets:Object[]}} the objects on the Teensy made from the node
     *          (a target: {path, typeName, inputs, inputLabels:{port:label}})
     */
    function getTargets(node) {
        const tree = getTree();
        if (tree == undefined) return { tree, targets: [] };
        const model = tree.model;
        const targets = [];
        const add = function (item) {
            if (RED.control.methods.get(item.typeName) == undefined) return;
            targets.push(makeTarget(model, item));
        };
        const suffix = "|" + node.id;
        for (const item of model.items.values()) {
            if (item.identity.endsWith(suffix) == false) continue;
            if (item.kind == "object") { add(item); continue; }
            for (const element of model.items.values()) // an array of objects, the elements are in the group
                if (element.parent == item.path && element.kind == "object") add(element);
        }
        targets.sort(function (a, b) { return a.path.localeCompare(b.path, undefined, { numeric: true }); });
        return { tree, targets };
    }

    /** @param {REDNode} node @param {Object} target @returns {Number} the channels of a perChannel method */
    function getChannelCount(node, target) {
        if (target != undefined && target.inputs != undefined) return target.inputs; // DynMixer, as it is on the Teensy
        if (node.inputs != undefined && Number(node.inputs) > 0) return Number(node.inputs);
        const def = RED.nodes.getType(node.type);
        return (def != undefined && def.inputs != undefined) ? def.inputs : 0;
    }

    // ******************************************************************
    // values
    // ******************************************************************

    function valueKey(node, method, channel) {
        return node.id + "|" + method.id + "|" + ((channel == undefined) ? "" : channel);
    }

    /** @returns {Array} the values of the arguments (the defaults until something is sent) */
    function getValues(node, method, channel) {
        const stored = values.get(valueKey(node, method, channel));
        if (stored != undefined) return [...stored];
        return (method.args || []).map(RED.control.methods.getDefault);
    }

    function hasValues(node, method, channel) {
        return values.has(valueKey(node, method, channel));
    }

    // ******************************************************************
    // sending
    // ******************************************************************

    function createCommand(target, method, channel, argValues) {
        const args = [];
        if (method.perChannel) args.push({ type: "int", value: channel });
        (method.args || []).forEach(function (arg, i) { args.push({ type: arg.type, value: argValues[i] }); });
        return { path: target.path, typeName: target.typeName, method, call: method.call || method.id, args };
    }

    function flush() {
        flushTimer = undefined;
        if (pending.size == 0) return;
        const commands = [...pending.values()];
        pending.clear();
        const adapter = getAdapter();
        if (adapter == undefined) return;
        adapter.send(commands);
    }

    /**
     * Stores the values and sends them to all the targets (coalesced)
     * @param {REDNode} node @param {Object[]} targets @param {Object} method @param {Number|undefined} channel
     * @param {Array} argValues @param {Boolean} [send] false only stores them
     */
    function invoke(node, targets, method, channel, argValues, send) {
        if (method.args != undefined) values.set(valueKey(node, method, channel), [...argValues]);
        if (send == false) return;
        for (const target of targets) {
            pending.set(target.path + "|" + method.id + "|" + channel, createCommand(target, method, channel, argValues || []));
        }
        if (flushTimer == undefined) flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
    }

    /**
     * @returns {Promise<{target, value?, error?}[]>} the result of a "read" method, one per target
     */
    function read(targets, method) {
        const adapter = getAdapter();
        return Promise.all(targets.map(function (target) {
            if (adapter == undefined || adapter.read == undefined) return Promise.resolve({ target, error: "the protocol can't read" });
            return adapter.read(createCommand(target, method, undefined, []))
                .then(function (value) { return { target, value }; }, function (err) { return { target, error: String(err) }; });
        }));
    }

    /** Sends every stored value of the node (i.e. after the Teensy is restarted or synced) @returns {Number} the commands sent */
    function resend(node, targets) {
        const methods = RED.control.methods.get(node.type) || [];
        let count = 0;
        for (const method of methods) {
            if (method.kind == "action" || method.kind == "read") continue;
            const channels = method.perChannel ? [...Array(getChannelCount(node, targets[0])).keys()] : [undefined];
            for (const channel of channels) {
                if (hasValues(node, method, channel) == false) continue;
                invoke(node, targets, method, channel, getValues(node, method, channel));
                count++;
            }
        }
        return count;
    }

    /**
     * Objects are (re)created on the Teensy by the OSC live update / Sync: sends their init methods (sgtl5000.enable())
     * and then the values stored here, so they get what the live tab shows
     * @param {String[]} paths
     */
    function objectsCreated(paths) {
        const tree = getTree();
        if (tree == undefined) return;
        const model = tree.model;
        for (const path of paths) {
            const item = model.items.get(path);
            if (item == undefined || item.kind != "object") continue;
            const methods = RED.control.methods.get(item.typeName);
            if (methods == undefined) continue;
            // the node: the identity ends with its id, for an array element it's the identity of the array (the parent group)
            let node = RED.nodes.node(item.identity.split("|").pop());
            if (node == undefined && model.items.has(item.parent)) node = RED.nodes.node(model.items.get(item.parent).identity.split("|").pop());
            if (node == undefined) continue;
            const target = makeTarget(model, item);
            for (const method of methods) if (method.init == true) invoke(node, [target], method, undefined, []);
            resend(node, [target]);
        }
    }
    RED.events.on("OSC:liveObjectsCreated", objectsCreated);

    return {
        objectsCreated,
        registerAdapter,
        getAdapters,
        getAdapter,
        setAdapter,
        getTree,
        getTargets,
        getChannelCount,
        getValues,
        hasValues,
        invoke,
        read,
        resend,
    };
})();
