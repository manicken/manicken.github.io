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

    // the tree and the targets are cached, the cache is valid until the design changes (version) or another tree is used
    const DESIGN_EVENTS = ["nodes:add", "nodes:remove", "nodes:change", "nodes:renamed", "nodes:inputsUpdated",
        "links:add", "links:remove", "flows:add", "flows:remove", "flows:renamed", "flows:change"];
    let version = 0;
    let treeCache = { key: undefined, model: undefined, version: -1, tree: undefined };
    const targetsCache = new Map(); // node id -> {tree, targets} for treeCache.tree

    function designChanged() { version++; }
    for (const e of DESIGN_EVENTS) RED.events.on(e, designChanged);

    /**
     * The design tree that is on the Teensy: the one the OSC live update keeps (it have the real input counts of the mixers),
     * else the design of the current tab. The same object is returned until it changes (so it can be used as a cache key).
     * @returns {{ws:REDWorkspace, model:OscLiveModel, source:"live"|"design"}|undefined}
     */
    function getTree() {
        const live = (OSC.LiveUpdate != undefined && OSC.LiveUpdate.getRootId != undefined) ? OSC.LiveUpdate : undefined;
        if (live != undefined && RED.OSC.settings.LiveUpdate == true) {
            const model = live.getTeensyModel(); // a new model object after every change that is sent
            const key = "live|" + live.getRootId();
            if (treeCache.key == key && treeCache.model === model && model != undefined) return treeCache.tree;
            const ws = RED.nodes.getWorkspace(live.getRootId());
            if (ws != undefined && model != undefined) return setTree(key, model, { ws, model, source: "live" });
        }
        const ws = RED.nodes.currentWorkspace;
        if (ws == undefined) return undefined;
        const key = "ws|" + ws.id;
        if (treeCache.key == key && treeCache.version == version) return treeCache.tree;
        try {
            const model = RED.exporter.oscLive.getModel(ws).model;
            return setTree(key, model, { ws, model, source: "design" });
        }
        catch (err) {
            console.error(err);
            return undefined;
        }
    }

    function setTree(key, model, tree) {
        treeCache = { key, model, version, tree };
        targetsCache.clear();
        return tree;
    }

    /** @returns {Number} changed when the design is changed (the cached bindings are made again) */
    function getVersion() { return version; }

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
        const cached = targetsCache.get(node.id);
        if (cached != undefined && cached.tree === tree) return cached;
        const model = tree.model;
        const targets = [];
        const add = function (item) {
            if (RED.control.methods.get(item.typeName, node) == undefined) return;
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
        const result = { tree, targets };
        targetsCache.set(node.id, result);
        return result;
    }

    /** @param {REDNode} node @param {Object} target @param {Object} [method] @returns {Number} the channels of a perChannel method */
    function getChannelCount(node, target, method) {
        if (method != undefined && method.channels != undefined) return method.channels; // not the inputs (i.e. delay taps)
        if (target != undefined && target.inputs != undefined) return target.inputs; // DynMixer, as it is on the Teensy
        if (node.inputs != undefined && Number(node.inputs) > 0) return Number(node.inputs);
        const def = RED.nodes.getType(node.type);
        return (def != undefined && def.inputs != undefined) ? def.inputs : 0;
    }

    // ******************************************************************
    // values
    // ******************************************************************

    // A node can be many objects on the Teensy (an array, a class group array: /voices/i0/osc, /voices/i1/osc ...).
    // values: node|method|channel -> { all: the values set for all of them, paths: Map(path -> the values set for one) }

    function valueKey(node, method, channel) {
        return node.id + "|" + method.id + "|" + ((channel == undefined) ? "" : channel);
    }

    /**
     * @param {String} [path] one object on the Teensy; without it: the values of all of them
     * @returns {Array} the values of the arguments (that object's own, else the ones for all, else the defaults)
     */
    function getValues(node, method, channel, path) {
        const e = values.get(valueKey(node, method, channel));
        if (e != undefined) {
            if (path && e.paths.has(path)) return [...e.paths.get(path)];
            if (e.all != undefined) return [...e.all];
        }
        return (method.args || []).map(RED.control.methods.getDefault);
    }

    function hasValues(node, method, channel, path) {
        const e = values.get(valueKey(node, method, channel));
        return e != undefined && (e.all != undefined || (!!path && e.paths.has(path)));
    }

    /** @returns {String[]|null} the paths when only some of the node's objects are targets, null for all of them */
    function scopeOf(node, targets) {
        const all = getTargets(node).targets;
        if (all.length <= 1 || targets.length >= all.length) return null;
        return targets.map(function (t) { return t.path; });
    }

    // ******************************************************************
    // sending
    // ******************************************************************

    function createCommand(target, method, channel, argValues) {
        const args = [];
        (method.prefixArgs || []).forEach(function (arg) { args.push({ type: arg.type, value: arg.value }); });
        if (method.perChannel) args.push({ type: "int", value: channel });
        (method.args || []).forEach(function (arg, i) { args.push({ type: arg.type, value: argValues[i], wire: arg.wire }); });
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
     * @param {Object} [source] what made the change (given to the control:valuesChanged listeners, so it can skip itself)
     */
    function invoke(node, targets, method, channel, argValues, send, source) {
        if (method.args != undefined) {
            const key = valueKey(node, method, channel);
            const e = values.get(key) || { all: undefined, paths: new Map() };
            const paths = scopeOf(node, targets);
            if (paths == null) { e.all = [...argValues]; e.paths.clear(); }          // all of them: their own values are replaced
            else for (const p of paths) e.paths.set(p, [...argValues]);
            values.set(key, e);
            // paths: the objects that changed, null = all (see RED.control.gui valuesChanged)
            RED.events.emit("control:valuesChanged", { node, method, channel, values: [...argValues], source, paths });
        }
        if (send == false) return;
        queue(targets, method, channel, argValues);
    }

    /** sends without storing (coalesced) */
    function queue(targets, method, channel, argValues) {
        for (const target of targets) {
            pending.set(target.path + "|" + method.id + "|" + channel, createCommand(target, method, channel, argValues || []));
        }
        if (flushTimer == undefined) flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
    }

    /**
     * @param {Array} [argValues] the arguments of the read (i.e. the bin of fft.read(bin))
     * @returns {Promise<{target, value?, error?}[]>} the result of a "read" method, one per target
     */
    function read(targets, method, argValues) {
        const adapter = getAdapter();
        return Promise.all(targets.map(function (target) {
            if (adapter == undefined || adapter.read == undefined) return Promise.resolve({ target, error: "the protocol can't read" });
            return adapter.read(createCommand(target, method, undefined, argValues || []))
                .then(function (value) { return { target, value }; }, function (err) { return { target, error: String(err) }; });
        }));
    }

    /** Sends every stored value of the node (i.e. after the Teensy is restarted or synced) @returns {Number} the commands sent */
    function resend(node, targets) {
        const methods = RED.control.methods.get(node.type, node) || [];
        let count = 0;
        for (const method of methods) {
            if (method.kind == "action" || method.kind == "read") continue;
            const channels = method.perChannel ? [...Array(getChannelCount(node, targets[0], method)).keys()] : [undefined];
            for (const channel of channels) {
                for (const target of targets) {   // each object its own values (or the ones for all)
                    if (hasValues(node, method, channel, target.path) == false) continue;
                    queue([target], method, channel, getValues(node, method, channel, target.path));
                    count++;
                }
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
            // the node: the identity ends with its id, for an array element it's the identity of the array (the parent group)
            let node = RED.nodes.node(item.identity.split("|").pop());
            if (node == undefined && model.items.has(item.parent)) node = RED.nodes.node(model.items.get(item.parent).identity.split("|").pop());
            if (node == undefined) continue;
            const methods = RED.control.methods.get(item.typeName, node);
            if (methods == undefined) continue;
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
        getVersion,
        getChannelCount,
        getValues,
        hasValues,
        invoke,
        read,
        resend,
    };
})();
