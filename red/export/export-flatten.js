/**
 * Converts a class-based design into classic flat code (Export Mode 'flatclassic').
 *
 * The class instances are removed and everything inside them becomes global objects,
 * named by the path through the class instances joined with _
 *   voices[2].env       -> voices_2_env
 *   voices[2].osc[3]    -> voices_2_osc[3]   (an array inside a class stays an array)
 * and all connections, also the ones inside the classes, are made between the flat objects.
 *
 * Classes with code can't be flattened (the code refers to the class members),
 * that is checked by RED.exporter.modes.
 */
RED.exporter.flatten = (function () {
    'use strict';

    const graph = RED.exporter.graph;
    const MAX_DEPTH = 64; // failsafe for classes that contain themselves

    /**
     * @param {ResolvedPathStep[]} classPath the class instances
     * @param {REDNode} node the object inside them
     * @returns {String} the flat name, i.e. voices_2_env (without any array part of the object itself)
     */
    function getFlatName(classPath, node) {
        const parts = classPath.map(function (step) {
            return graph.getBaseName(step.node) + ((step.index != undefined) ? ("_" + step.index) : "");
        });
        parts.push(graph.getBaseName(node));
        return parts.join("_");
    }

    /**
     * @param {REDWorkspace} ws the tab to export
     * @returns {ResolvedWorkspace} the tab with all class instances replaced by their contents
     */
    function flattenWorkspace(ws) {
        const rws = RED.exporter.resolve.resolveWorkspace(ws, { allConnections: true });
        const classInstances = rws.audioObjects.concat(rws.controlObjects).filter(function (obj) { return obj.isClass; });
        rws.audioObjects = rws.audioObjects.filter(function (obj) { return obj.isClass == false; });
        rws.controlObjects = rws.controlObjects.filter(function (obj) { return obj.isClass == false; });
        rws.usedClasses = []; // there are no classes left

        const resolvedClasses = new Map(); // each class is only resolved once (the key is the workspace id or the class group id)
        for (const instance of classInstances) {
            for (const index of indexesOf(instance)) {
                addClassContents(rws, [new ResolvedPathStep(instance.node, index)], graph.getClassWorkspace(instance.node), resolvedClasses, 0);
            }
        }
        checkFlatNames(rws);
        warnAboutCodeUsingClassInstances(rws, classInstances);
        return rws;
    }

    /**
     * @param {ResolvedWorkspace} rws the flat workspace
     * @param {ResolvedPathStep[]} classPath
     * @param {REDWorkspace} classWs
     * @param {Map<String, ResolvedWorkspace>} resolvedClasses
     * @param {Number} depth
     */
    function addClassContents(rws, classPath, classWs, resolvedClasses, depth) {
        if (depth > MAX_DEPTH) {
            rws.addProblem(new ResolvedProblem("error", "classes nested too deep (does a class contain itself?)"));
            return;
        }
        let crws = resolvedClasses.get(classWs.id);
        if (crws == undefined) {
            crws = RED.exporter.resolve.resolveWorkspace(classWs);
            resolvedClasses.set(classWs.id, crws);
            // the problems inside the class becomes problems of the flat design
            for (const p of crws.problems) rws.addProblem(new ResolvedProblem(p.severity, "in class " + classWs.label + ": " + p.text, p.link, p.node));
            for (const include of crws.userCode.includes) if (rws.userCode.includes.includes(include) == false) rws.userCode.includes.push(include);
            for (const codeFile of crws.userCode.codeFiles) if (rws.userCode.codeFiles.some(function (c) { return c.name == codeFile.name; }) == false) rws.userCode.codeFiles.push(codeFile);
        }
        for (const obj of crws.audioObjects.concat(crws.controlObjects)) {
            if (obj.isClass) {
                for (const index of indexesOf(obj)) {
                    addClassContents(rws, [...classPath, new ResolvedPathStep(obj.node, index)], graph.getClassWorkspace(obj.node), resolvedClasses, depth + 1);
                }
                continue;
            }
            const flat = Object.assign(new ResolvedObject(obj.node), obj, { classPath });
            if (crws.audioObjects.includes(obj)) rws.audioObjects.push(flat);
            else rws.controlObjects.push(flat);
            if (flat.dynInputCount != undefined) rws.dynMixers.push({ type: obj.node.type, count: flat.dynInputCount });
        }
    }

    /**
     * Two objects can't get the same flat name, i.e. a top level object called voices_2_env
     * @param {ResolvedWorkspace} rws
     */
    function checkFlatNames(rws) {
        const used = new Map();
        for (const obj of rws.audioObjects.concat(rws.controlObjects)) {
            const name = getFlatName(obj.classPath, obj.node);
            const describe = function (o) { return (o.classPath.length != 0) ? ("the object " + graph.getBaseName(o.node) + " inside " + getFlatName(o.classPath.slice(0, -1), o.classPath[o.classPath.length - 1].node)) : ("the object " + graph.getBaseName(o.node)); };
            if (used.has(name))
                rws.addProblem(new ResolvedProblem("error", "the flat name " + name + " is used by both " + describe(used.get(name)) + " and " + describe(obj) + ", rename one of them", undefined, obj.node));
            else used.set(name, obj);
        }
    }

    /**
     * The code in the tab can use the class instances (voices[i].env.noteOn()),
     * that code must use the flat names instead, so warn about it.
     * @param {ResolvedWorkspace} rws
     * @param {ResolvedObject[]} classInstances
     */
    function warnAboutCodeUsingClassInstances(rws, classInstances) {
        const code = rws.userCode;
        const texts = [...code.functions, ...code.variables].filter(function (t) { return t != undefined; }).join("\n");
        for (const instance of classInstances) {
            const name = graph.getBaseName(instance.node);
            const usage = new RegExp("\\b" + name + "\\s*(\\[[^\\]]*\\])?\\s*\\.");
            if (usage.test(texts)) {
                rws.addProblem(new ResolvedProblem("warning", "the code in this tab uses " + name + " (" + graph.getClassName(instance.node) + "), but in a flat export the objects inside it are named " +
                    name + ((instance.arrayLength != 0) ? "_0" : "") + "_..., update the code to use those names" +
                    " (in the Export Mode 'flathelper' through the helper instance, " + RED.exporter.cpp.HELPER_INSTANCE_NAME + "." + name + "_...)", undefined, instance.node));
            }
        }
    }

    /** @param {ResolvedObject} obj @returns {(Number|undefined)[]} */
    function indexesOf(obj) {
        return (obj.arrayLength != 0) ? [...Array(obj.arrayLength).keys()] : [undefined];
    }

    return {
        getFlatName,
        flattenWorkspace,
    };
})();
