/**
 * The shared rules of the Open Sound Control (OSC) exports, for h4yn0nnym0u5e's OSCAudio library
 * (https://github.com/h4yn0nnym0u5e/OSCAudio), used by the C++ writer (export-osc-cpp.js)
 * and the message writer (export-osc-messages.js).
 *
 * The OSC tree is the same in all OSC Export Modes, so a design gets the same OSC addresses
 * whether it's compiled (osc_*_cpp) or sent to a Teensy running the dynamic audio objects (osc_*_msg):
 *   audio object      - an OSC object with the same name, its type is OSC + the type (OSCAudioSynthWaveform)
 *   class instance    - an OSC group with the instance name, containing the objects of the class
 *   array (osc[4])    - an OSC group "osc" containing the elements "i0", "i1" ... (objects or class groups)
 *   connection        - an OSCAudioConnection in the group of the class instance that makes it (the owner, see
 *                       OWNERSHIP in export-resolve.js), named <source>_<port>_<target>_<port> with the paths from
 *                       that group, i.e. voices_i0_env_0_mixer_2 (the names only have to be unique in their group)
 * In the simple modes the design is flattened first (like 'flatclassic'), so all objects are at the root with
 * their flat names (voices_0_env), only arrays are still groups.
 *
 * Things the library needs (checked by getProblems):
 *   - every audio object must have an OSC version (the official audio objects, AudioMixer and AudioMixerStereo),
 *     an OSCAudioConnection can only connect OSC objects
 *   - AudioMixer and AudioMixerStereo (any number of inputs) only exist in the Dynamic Audio Objects library,
 *     AudioMixerStereo also needs MULTI_CENTRED
 */
RED.exporter.osc = (function () {
    'use strict';

    const graph = RED.exporter.graph;

    /** the types with an OSC version that are not in the official node definitions */
    const EXTRA_OSC_TYPES = ["AudioMixer", "AudioMixerStereo", "AudioEffectFPB"];

    /** the library include of the C++ modes */
    const LIBRARY_INCLUDE = "#include <OSCAudioBase.h>";

    /** @param {String} typeName @returns {Boolean} true if the OSCAudio library have an OSC version of the type */
    function hasOscVersion(typeName) {
        if (typeName == undefined) return false;
        return EXTRA_OSC_TYPES.includes(typeName) || (NodeDefinitions.officialNodes.types[typeName] != undefined);
    }

    /**
     * @param {ResolvedObject} obj
     * @returns {String} the C++ type: OSC + the type for audio objects, the class name for class instances,
     *                   the type as it is for objects without an OSC version (control objects that are not audio objects)
     */
    function getOscTypeName(obj) {
        if (obj.isClass || hasOscVersion(obj.typeName) == false) return obj.typeName;
        return "OSC" + obj.typeName;
    }

    /** @param {Number} index @returns {String} the OSC name of an array element */
    function getElementName(index) {
        return "i" + index;
    }

    /**
     * @param {ResolvedPathStep} step
     * @returns {String[]} the names of a step in the OSC tree: the name, and the element if it's an array element
     */
    function getStepNames(step) {
        const names = [graph.getBaseName(step.node)];
        if (step.index != undefined) names.push(getElementName(step.index));
        return names;
    }

    /**
     * @param {ResolvedPathStep[]} path
     * @returns {String} the OSC address of a path from its owner group, i.e. "voices/i0/env"
     */
    function getPathAddress(path) {
        return path.map(getStepNames).flat().join("/");
    }

    /**
     * The flat OSC address of an object in a flattened workspace (the simple modes), i.e. "voices_0_env" or "voices_0_osc/i2"
     * @param {ResolvedEndpoint} endpoint
     * @returns {String}
     */
    function getFlatAddress(endpoint) {
        const leaf = endpoint.path[endpoint.path.length - 1];
        const name = RED.exporter.flatten.getFlatName(endpoint.path.slice(0, -1), leaf.node);
        return (leaf.index != undefined) ? (name + "/" + getElementName(leaf.index)) : name;
    }

    /**
     * @param {ResolvedConnection} connection
     * @param {Boolean} flat true for a flattened workspace (the simple modes)
     * @returns {String} the name of the OSCAudioConnection, unique in its group, i.e. "voices_i0_env_0_mixer_2"
     */
    function getConnectionName(connection, flat) {
        const addressOf = function (endpoint) {
            return (flat ? getFlatAddress(endpoint) : getPathAddress(endpoint.path)).split("/").join("_");
        };
        return addressOf(connection.source) + "_" + connection.source.port + "_" + addressOf(connection.target) + "_" + connection.target.port;
    }

    /**
     * The extra constructor values of an object (only AudioEffectDelayExternal have them: memory type and max delay),
     * they are only used by the Dynamic Audio Objects library.
     * @param {ResolvedObject} obj
     * @returns {{types:String, values:Array}} the OSC types ("if") and the values, empty if none
     */
    function getConstructorValues(obj) {
        const node = obj.node;
        const def = node._def.makeConstructor;
        if (def == undefined || node.useMakeConstructor === false || node.useMakeConstructor === "false") return { types: "", values: [] };
        const values = def.valueNames.split(",").map(function (name) {
            const value = node[name.trim()];
            return isNaN(Number(value)) ? value : Number(value);
        });
        return { types: def.valueTypes, values };
    }

    /**
     * @param {REDNode} node a real audio object (not a class instance)
     * @returns {ResolvedProblem|undefined} the error when the object have no OSC version (an OSCAudioConnection can only connect OSC objects)
     */
    function getNoOscVersionProblem(node) {
        if (hasOscVersion(node.type)) return undefined;
        return new ResolvedProblem("error", '"' + graph.getBaseName(node) + '" (' + ((node.type == "AudioStreamObject") ? node.subType : node.type) +
            ") have no OSC version, the OSC Export Modes can only use the audio objects of the OSCAudio library", undefined, node);
    }

    /**
     * The problems of a workspace in the OSC Export Modes, added to the workspace.
     * @param {ResolvedWorkspace} rws
     * @param {Boolean} isMessages true for the message modes (osc_*_msg)
     */
    function addProblems(rws, isMessages) {
        for (const obj of rws.audioObjects) {
            if (obj.isClass) continue;
            const noOscVersion = getNoOscVersionProblem(obj.node);
            if (noOscVersion != undefined) rws.addProblem(noOscVersion); // (the same text as the editor shows, so it's only reported once)
            else if (obj.typeName == "AudioMixerStereo")
                rws.addProblem(new ResolvedProblem("warning", '"' + graph.getBaseName(obj.node) + '" (AudioMixerStereo) needs the Dynamic Audio Objects library with MULTI_CENTRED defined', undefined, obj.node));
        }
        if (isMessages) {
            const code = rws.userCode;
            const hasCode = [...code.functions, ...code.variables, ...code.constructorCode, ...code.destructorCode, ...code.endOfFileCode]
                .some(function (t) { return t != undefined && t.trim().length != 0; });
            if (hasCode) rws.addProblem(new ResolvedProblem("warning", "the code (Function, Variables, Constructor/Destructor/EndOfFile code) of " + rws.name + " is not sent, OSC messages only creates the objects and connections"));
        }
    }

    return {
        LIBRARY_INCLUDE,
        hasOscVersion,
        getOscTypeName,
        getElementName,
        getStepNames,
        getPathAddress,
        getFlatAddress,
        getConnectionName,
        getConstructorValues,
        getNoOscVersionProblem,
        addProblems,
    };
})();
