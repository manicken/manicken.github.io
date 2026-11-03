/**
 * The model of a design as it is on a Teensy running h4yn0nnym0u5e's OSCAudio library with the Dynamic Audio Objects,
 * and the OSC messages that change one model into another (used by the OSC live update, see OSC-liveUpdate.js).
 *
 * The model is the same OSC tree as the Export Mode 'osc_class_msg' creates (see export-osc.js), so after that export
 * the model of the same workspace is what's on the Teensy. Every array element is its own item (no wildcards).
 *   items        - the groups (class instances, arrays) and objects, by path ("/voices/i0/env")
 *   connections  - by owner group + endpoints, with the name it was created with on the Teensy
 *
 * getChanges(oldModel, newModel) gives the messages, in this order:
 *   1. renames        an item with the same node in the same group but a new name (keeps its state on the Teensy)
 *   2. /deOb          the removed connections, then the removed items (only the topmost, a group deletes its members)
 *   3. /crGrp /crOb   the new items, parents first
 *   4. /crCo + /co    the new connections
 * An item is recreated (removed + created) when its kind, type or constructor values changes, or when a mixer needs
 * more inputs than it was created with (the inputs are never reduced, as a smaller mixer is not needed and
 * recreating it would loose its gains). All connections to a recreated item are recreated too, as reconnecting an existing
 * OSCAudioConnection adds it to the lists of its groups once more (it's never removed from them).
 */
RED.exporter.oscLive = (function () {
    'use strict';

    const graph = RED.exporter.graph;
    const osc = RED.exporter.osc;
    const MAX_DEPTH = 32; // failsafe for classes that contain themselves

    /**
     * @typedef {Object} OscLiveItem
     * @property {"group"|"object"} kind
     * @property {String} path i.e. "/voices/i0/env"
     * @property {String} parent the path of the group it's in, "" for the root
     * @property {String} name
     * @property {String} identity the same node in the same group gives the same identity (used to find renames)
     * @property {String} [typeName] the audio type of an object
     * @property {Number} [inputs] the inputs of AudioMixer/AudioMixerStereo
     * @property {{types:String, values:Array}} [extra] the constructor values (AudioEffectDelayExternal)
     *
     * @typedef {Object} OscLiveConnection
     * @property {String} owner the path of the group that makes it, "" for the root
     * @property {String} name
     * @property {String} source
     * @property {Number} sourcePort
     * @property {String} target
     * @property {Number} targetPort
     *
     * @typedef {Object} OscLiveModel
     * @property {Map<String, OscLiveItem>} items
     * @property {Map<String, OscLiveConnection>} connections by getConnectionKey
     */

    /** @returns {OscLiveModel} */
    function createEmptyModel() {
        return { items: new Map(), connections: new Map() };
    }

    function join(groupPath, name) {
        return groupPath + "/" + name;
    }

    /** @param {OscLiveConnection} c @returns {String} */
    function getConnectionKey(c) {
        return c.owner + "|" + c.source + ":" + c.sourcePort + ">" + c.target + ":" + c.targetPort;
    }

    /** @param {String} path @returns {Number} */
    function getDepth(path) {
        return path.split("/").length;
    }

    /** @param {String} path @param {String} groupPath @returns {Boolean} true if the path is the group or inside it */
    function isInside(path, groupPath) {
        return path == groupPath || path.startsWith(groupPath + "/");
    }

    // ******************************************************************
    // the model of a workspace
    // ******************************************************************

    /**
     * @param {REDWorkspace} ws the root of the OSC tree
     * @returns {{model:OscLiveModel, problems:ResolvedProblem[]}} the model, and the errors of the design
     *                                                              (the objects and connections that can be resolved are still in the model)
     */
    function getModel(ws) {
        const model = createEmptyModel();
        const rws = RED.exporter.resolve.resolveWorkspace(ws);
        const resolvedClasses = new Map(); // class id -> ResolvedWorkspace
        const problems = [...rws.errors];

        const getClass = function (obj) {
            const classWs = graph.getClassWorkspace(obj.node);
            if (resolvedClasses.has(classWs.id) == false) {
                const crws = RED.exporter.resolve.resolveWorkspace(classWs);
                problems.push(...crws.errors);
                resolvedClasses.set(classWs.id, crws);
            }
            return resolvedClasses.get(classWs.id);
        };
        const addItem = function (item) {
            model.items.set(item.path, item);
        };
        const addGroup = function (parent, name, identity) {
            const path = join(parent, name);
            addItem({ kind: "group", path, parent, name, identity });
            return path;
        };
        const addObject = function (obj, parent, name, identity) {
            const item = { kind: "object", path: join(parent, name), parent, name, identity, typeName: obj.typeName, extra: osc.getConstructorValues(obj) };
            if (obj.dynInputCount != undefined) item.inputs = obj.dynInputCount;
            addItem(item);
        };
        const addScope = function (scope, groupPath, depth) {
            if (depth > MAX_DEPTH) return;
            for (const obj of [...scope.audioObjects, ...scope.controlObjects]) {
                const name = graph.getBaseName(obj.node);
                const identity = groupPath + "|" + obj.node.id;
                if (obj.isClass == false && osc.hasOscVersion(obj.typeName) == false) continue; // not an OSC object (reported by the export)
                if (obj.isClass == false && obj.arrayLength == 0) {
                    addObject(obj, groupPath, name, identity);
                    continue;
                }
                const path = addGroup(groupPath, name, identity);
                if (obj.isClass == false) { // an array of objects
                    for (let i = 0; i < obj.arrayLength; i++) addObject(obj, path, osc.getElementName(i), path + "|" + osc.getElementName(i));
                    continue;
                }
                const crws = getClass(obj);
                if (obj.arrayLength == 0) {
                    addScope(crws, path, depth + 1);
                    continue;
                }
                for (let i = 0; i < obj.arrayLength; i++) {
                    const elementPath = addGroup(path, osc.getElementName(i), path + "|" + osc.getElementName(i));
                    addScope(crws, elementPath, depth + 1);
                }
            }
            for (const c of scope.connections) {
                const connection = {
                    owner: groupPath, name: osc.getConnectionName(c, false),
                    source: join(groupPath, osc.getPathAddress(c.source.path)), sourcePort: c.source.port,
                    target: join(groupPath, osc.getPathAddress(c.target.path)), targetPort: c.target.port,
                };
                model.connections.set(getConnectionKey(connection), connection);
            }
        };
        addScope(rws, "", 0);
        return { model, problems };
    }

    // ******************************************************************
    // the changes between two models
    // ******************************************************************

    /** @param {OscLiveModel} model @returns {OscLiveModel} a copy (the items and connections are copied too) */
    function copyModel(model) {
        const copy = createEmptyModel();
        for (const [path, item] of model.items) copy.items.set(path, { ...item });
        for (const [key, c] of model.connections) copy.connections.set(key, { ...c });
        return copy;
    }

    /** @param {String} path @param {String} from @param {String} to @returns {String} the path with the prefix 'from' replaced by 'to' */
    function movePath(path, from, to) {
        return isInside(path, from) ? (to + path.substring(from.length)) : path;
    }

    /** @param {OscLiveItem} a @param {OscLiveItem} b @returns {Boolean} true if b can't be made from a without recreating it */
    function needsRecreate(a, b) {
        if (a.kind != b.kind) return true;
        if (a.kind == "group") return false;
        if (a.typeName != b.typeName) return true;
        if (JSON.stringify(a.extra) != JSON.stringify(b.extra)) return true;
        return (b.inputs != undefined) && (b.inputs > (a.inputs || 0));
    }

    /**
     * Finds the renamed items (top down, so the members of a renamed group are moved with it) and renames them in the old model
     * @param {OscLiveModel} old the old model, changed
     * @param {OscLiveModel} next
     * @returns {{from:String, name:String}[]} the renames, in the order they are sent
     */
    function applyRenames(old, next) {
        const renames = [];
        const nextByIdentity = new Map();
        for (const item of next.items.values()) nextByIdentity.set(item.identity, item);

        const paths = [...old.items.keys()].sort(function (a, b) { return getDepth(a) - getDepth(b); });
        for (let i = 0; i < paths.length; i++) {
            const item = old.items.get(paths[i]);
            if (item == undefined) continue;
            const target = nextByIdentity.get(item.identity);
            if (target == undefined || target.path == item.path) continue;
            if (target.parent != item.parent || old.items.has(target.path) || next.items.has(item.path)) continue; // moved, or the name is taken
            if (needsRecreate(item, target)) continue; // it's removed and created instead

            const from = item.path;
            renames.push({ from, name: target.name });
            const moved = [...old.items.values()].filter(function (it) { return isInside(it.path, from); });
            for (const it of moved) old.items.delete(it.path);
            for (const it of moved) {
                it.path = movePath(it.path, from, target.path);
                it.parent = movePath(it.parent, from, target.path);
                it.identity = it.identity.split("|").map(function (part, index) { return (index == 0) ? movePath(part, from, target.path) : part; }).join("|");
                if (it.path == target.path) it.name = target.name;
                old.items.set(it.path, it);
            }
            const connections = [...old.connections.values()];
            old.connections.clear();
            for (const c of connections) {
                c.owner = movePath(c.owner, from, target.path);
                c.source = movePath(c.source, from, target.path);
                c.target = movePath(c.target, from, target.path);
                old.connections.set(getConnectionKey(c), c);
            }
            for (let j = i + 1; j < paths.length; j++) paths[j] = movePath(paths[j], from, target.path);
        }
        return renames;
    }

    /**
     * @param {OscLiveModel} oldModel what is on the Teensy (not changed)
     * @param {OscLiveModel} newModel the design
     * @returns {{messages:OscMessage[], model:OscLiveModel}} the messages, and the model of the Teensy after them
     *          (the design, with the names and input counts it really have on the Teensy)
     */
    function getChanges(oldModel, newModel) {
        const old = copyModel(oldModel);
        const messages = [];
        const message = function (address, types, ...values) { messages.push({ address, types, values }); };

        for (const r of applyRenames(old, newModel)) message(OSC.GetRenameObjectAddr(), "ss", r.from, r.name);

        // the items to remove (recreated items too)
        const removed = new Set();
        for (const item of old.items.values()) {
            const next = newModel.items.get(item.path);
            if (next == undefined || needsRecreate(item, next)) removed.add(item.path);
        }
        const isRemoved = function (path) {
            for (const r of removed) if (isInside(path, r)) return true;
            return false;
        };
        // the connections to keep, the others are removed
        const result = createEmptyModel();
        const namesInUse = new Map(); // owner -> Set of names on the Teensy
        const useName = function (owner, name) {
            if (namesInUse.has(owner) == false) namesInUse.set(owner, new Set());
            namesInUse.get(owner).add(name);
        };
        for (const [key, c] of old.connections) {
            const lost = isRemoved(c.owner) || isRemoved(c.source) || isRemoved(c.target);
            if (lost == false && newModel.connections.has(key)) {
                result.connections.set(key, c);
                useName(c.owner, c.name);
                continue;
            }
            if (isRemoved(c.owner) == false) message(OSC.GetDestroyObjectAddr(), "s", join(c.owner, c.name));
        }
        const topRemoved = [...removed].filter(function (path) {
            const item = old.items.get(path);
            return item.parent == "" || isRemoved(item.parent) == false;
        });
        for (const path of topRemoved) message(OSC.GetDestroyObjectAddr(), "s", path);

        // the items to create
        for (const item of old.items.values()) {
            if (isRemoved(item.path)) continue;
            const next = newModel.items.get(item.path);
            const kept = { ...next };
            if (item.inputs != undefined && next.inputs != undefined) kept.inputs = Math.max(item.inputs, next.inputs); // never smaller
            result.items.set(item.path, kept);
            useName(item.parent, item.name);
        }
        const created = [...newModel.items.values()].filter(function (item) { return result.items.has(item.path) == false; })
            .sort(function (a, b) { return getDepth(a.path) - getDepth(b.path); });
        for (const item of created) {
            const parentArg = (item.parent == "") ? "/" : item.parent;
            if (item.kind == "group") message(OSC.GetCreateGroupAddr(), "ss", item.name, parentArg);
            else {
                let types = (item.parent == "") ? "ss" : "sss";
                const values = (item.parent == "") ? [item.typeName, item.name] : [item.typeName, item.name, item.parent];
                if (item.inputs != undefined) { types += "i"; values.push(item.inputs); }
                types += item.extra.types;
                values.push(...item.extra.values);
                message(OSC.GetCreateObjectAddr(), types, ...values);
            }
            result.items.set(item.path, { ...item });
            useName(item.parent, item.name);
        }

        // the connections to create, a name that is already used in the group (i.e. by a renamed connection) gets a number
        for (const [key, c] of newModel.connections) {
            if (result.connections.has(key)) continue;
            const names = namesInUse.get(c.owner) || new Set();
            let name = c.name;
            for (let n = 2; names.has(name); n++) name = c.name + "_" + n;
            useName(c.owner, name);
            if (c.owner == "") message(OSC.GetCreateConnectionAddr(), "s", name);
            else message(OSC.GetCreateConnectionAddr(), "ss", name, c.owner);
            message(OSC.GetConnectAddr(join(c.owner, name)), "sisi", c.source, c.sourcePort, c.target, c.targetPort);
            result.connections.set(key, { ...c, name });
        }
        return { messages, model: result };
    }

    /** @param {OscLiveModel} model @returns {OscMessage[]} the messages that creates the model on an empty Teensy (clearAll first) */
    function getCreateMessages(model) {
        const changes = getChanges(createEmptyModel(), model);
        return { messages: [{ address: OSC.GetClearAllAddr(), types: "", values: [] }, ...changes.messages], model: changes.model };
    }

    return {
        createEmptyModel,
        getModel,
        getChanges,
        getCreateMessages,
    };
})();
