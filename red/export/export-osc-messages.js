/**
 * Generates the OSC messages that create a design on a Teensy running h4yn0nnym0u5e's OSCAudio library with the
 * Dynamic Audio Objects (Export Modes 'osc_simple_msg' and 'osc_class_msg'), see export-osc.js for the OSC tree.
 *
 * The messages (the root address is the OSC setting 'Root Address', i.e. /teensy*):
 *   <root>/dynamic/clearAl*                                  removes the current design
 *   <root>/dynamic/crGrp   name, parentPath                  a group (parentPath "/" is the root)
 *   <root>/dynamic/crOb    type, name [, groupPath] [, inputs] [, constructor values]
 *                                                           an object, type is the audio type (AudioSynthWaveform),
 *                                                           inputs for AudioMixer/AudioMixerStereo
 *   <root>/dynamic/crCo    name [, groupPath]                a connection (in the group of its owner)
 *   <root>/audio/<groupPath>/<name>/co  sourcePath, port, targetPath, port
 *                                                           connects it (the paths are from the root, i.e. /voices/i0/env)
 * First all groups and objects are created, then all connections.
 *
 * osc_simple_msg: the current tab flattened (like 'flatclassic'), all objects at the root with their flat names
 * osc_class_msg:  the current tab is the root, a class instance is a group with the contents of its class,
 *                 the connections are made by the class instance that owns them (the same as the C++ export),
 *                 with the OSC setting 'Wildcard Array Objects' the contents of the elements of a class array
 *                 are created once for all elements (/voices/i*), the connections are always made one by one
 */
RED.exporter.oscMessages = (function () {
    'use strict';

    const graph = RED.exporter.graph;
    const osc = RED.exporter.osc;
    const MAX_DEPTH = 32; // failsafe for classes that contain themselves

    /**
     * @typedef {Object} OscMessage
     * @property {String} address
     * @property {String} types the OSC type tags, i.e. "ss"
     * @property {Array} values
     */

    /** @returns {OscMessage} */
    function message(address, types, ...values) {
        return { address, types, values };
    }

    /** @param {String} groupPath "" for the root, i.e. "/voices/i0" @param {String} name @returns {String} */
    function join(groupPath, name) {
        return groupPath + "/" + name;
    }

    /**
     * The messages that create an object (or the group and elements of an array of objects)
     * @param {OscMessage[]} messages
     * @param {ResolvedObject} obj
     * @param {String} name the OSC name
     * @param {String} groupPath "" for the root
     */
    function addObject(messages, obj, name, groupPath) {
        const extra = osc.getConstructorValues(obj);
        const create = function (objectName, path) {
            let types = (path == "") ? "ss" : "sss";
            const values = (path == "") ? [obj.typeName, objectName] : [obj.typeName, objectName, path];
            if (obj.dynInputCount != undefined) { types += "i"; values.push(obj.dynInputCount); }
            types += extra.types;
            values.push(...extra.values);
            messages.push(message(OSC.GetCreateObjectAddr(), types, ...values));
        };
        if (obj.arrayLength == 0) {
            create(name, groupPath);
            return;
        }
        messages.push(message(OSC.GetCreateGroupAddr(), "ss", name, (groupPath == "") ? "/" : groupPath));
        for (let i = 0; i < obj.arrayLength; i++) create(osc.getElementName(i), join(groupPath, name));
    }

    /**
     * The messages that create and connect a connection
     * @param {OscMessage[]} messages
     * @param {String} name
     * @param {String} groupPath the group of the owner, "" for the root
     * @param {String} sourcePath from the root, i.e. "/voices/i0/env"
     * @param {Number} sourcePort
     * @param {String} targetPath
     * @param {Number} targetPort
     */
    function addConnection(messages, name, groupPath, sourcePath, sourcePort, targetPath, targetPort) {
        if (groupPath == "") messages.push(message(OSC.GetCreateConnectionAddr(), "s", name));
        else messages.push(message(OSC.GetCreateConnectionAddr(), "ss", name, groupPath));
        messages.push(message(OSC.GetConnectAddr(join(groupPath, name)), "sisi", sourcePath, sourcePort, targetPath, targetPort));
    }

    /**
     * osc_simple_msg: a flattened workspace (RED.exporter.flatten)
     * @param {ResolvedWorkspace} rws
     * @returns {OscMessage[]}
     */
    function getFlatMessages(rws) {
        const messages = [message(OSC.GetClearAllAddr(), "")];
        for (const obj of [...rws.audioObjects, ...rws.controlObjects]) {
            if (osc.hasOscVersion(obj.typeName) == false) continue; // reported by osc.addProblems / addNotCreatedWarnings
            const name = (obj.classPath.length != 0) ? RED.exporter.flatten.getFlatName(obj.classPath, obj.node) : graph.getBaseName(obj.node);
            addObject(messages, obj, name, "");
        }
        for (const c of rws.connections) {
            addConnection(messages, osc.getConnectionName(c, true), "", "/" + osc.getFlatAddress(c.source), c.source.port, "/" + osc.getFlatAddress(c.target), c.target.port);
        }
        return messages;
    }

    /**
     * osc_class_msg: the workspace is the root, the class instances are groups
     * @param {ResolvedWorkspace} rws
     * @returns {{messages:OscMessage[], classes:ResolvedWorkspace[]}} the messages, and the resolved classes (for their problems)
     */
    function getTreeMessages(rws) {
        const objectMessages = [message(OSC.GetClearAllAddr(), "")];
        const connectionMessages = [];
        const resolvedClasses = new Map(); // class id -> ResolvedWorkspace (each class is only resolved once)
        const wildcard = (RED.OSC.settings.WildcardArrayObjects == true);

        const getClass = function (obj) {
            const classWs = graph.getClassWorkspace(obj.node);
            if (resolvedClasses.has(classWs.id) == false) {
                const crws = RED.exporter.resolve.resolveWorkspace(classWs);
                osc.addProblems(crws, true);
                resolvedClasses.set(classWs.id, crws);
            }
            return resolvedClasses.get(classWs.id);
        };
        /** the groups and objects of a scope, groupPath can contain wildcards (/voices/i*) */
        const addObjects = function (scope, groupPath, depth) {
            if (depth > MAX_DEPTH) return;
            for (const obj of [...scope.audioObjects, ...scope.controlObjects]) {
                const name = graph.getBaseName(obj.node);
                if (obj.isClass == false) {
                    if (osc.hasOscVersion(obj.typeName)) addObject(objectMessages, obj, name, groupPath);
                    continue;
                }
                const crws = getClass(obj);
                objectMessages.push(message(OSC.GetCreateGroupAddr(), "ss", name, (groupPath == "") ? "/" : groupPath));
                if (obj.arrayLength == 0) {
                    addObjects(crws, join(groupPath, name), depth + 1);
                    continue;
                }
                for (let i = 0; i < obj.arrayLength; i++) {
                    objectMessages.push(message(OSC.GetCreateGroupAddr(), "ss", osc.getElementName(i), join(groupPath, name)));
                    if (wildcard == false) addObjects(crws, join(join(groupPath, name), osc.getElementName(i)), depth + 1);
                }
                if (wildcard) addObjects(crws, join(join(groupPath, name), "i*"), depth + 1);
            }
        };
        /** the connections of a scope and of all class instances in it, groupPath is the path of the instance (no wildcards) */
        const addConnections = function (scope, groupPath, depth) {
            if (depth > MAX_DEPTH) return;
            for (const c of scope.connections) {
                addConnection(connectionMessages, osc.getConnectionName(c, false), groupPath,
                    join(groupPath, osc.getPathAddress(c.source.path)), c.source.port, join(groupPath, osc.getPathAddress(c.target.path)), c.target.port);
            }
            for (const obj of [...scope.audioObjects, ...scope.controlObjects]) { // (a class without ports is a control object)
                if (obj.isClass == false) continue;
                const crws = getClass(obj);
                const name = graph.getBaseName(obj.node);
                if (obj.arrayLength == 0) addConnections(crws, join(groupPath, name), depth + 1);
                else for (let i = 0; i < obj.arrayLength; i++) addConnections(crws, join(join(groupPath, name), osc.getElementName(i)), depth + 1);
            }
        };
        addObjects(rws, "", 0);
        addConnections(rws, "", 0);
        return { messages: [...objectMessages, ...connectionMessages], classes: [...resolvedClasses.values()] };
    }

    /**
     * The control objects that are not created, as they have no OSC version (the audio objects without one are errors).
     * @param {ResolvedWorkspace} rws
     */
    function addNotCreatedWarnings(rws) {
        for (const obj of rws.controlObjects) {
            if (obj.isClass || osc.hasOscVersion(obj.typeName)) continue;
            rws.addProblem(new ResolvedProblem("warning", '"' + graph.getBaseName(obj.node) + '" (' + obj.typeName + ") is not an OSC object, it's not created", undefined, obj.node));
        }
    }

    /** @param {OscMessage[]} messages @returns {Object} an OSC bundle (OSC.CreateBundle) with the messages */
    function getBundle(messages) {
        const bundle = OSC.CreateBundle(0);
        for (const m of messages) bundle.add(m.address, m.types, ...m.values);
        return bundle;
    }

    /** @param {OscMessage[]} messages @returns {String} one message per line, i.e. <root>/dynamic/crOb "AudioSynthWaveform" "osc" */
    function getText(messages) {
        return messages.map(function (m) {
            return m.address + m.values.map(function (v) { return " " + ((typeof v == "string") ? ('"' + v + '"') : v); }).join("");
        }).join("\n") + "\n";
    }

    return {
        getFlatMessages,
        getTreeMessages,
        addNotCreatedWarnings,
        getBundle,
        getText,
    };
})();
