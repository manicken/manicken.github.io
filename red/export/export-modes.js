/**
 * The rules of the different Export Modes (RED.arduino.EXPORT_MODE).
 *
 * The same rules are used by the editor (to show invalid wires and nodes directly when drawing)
 * and by the export (to stop with an error report), so the editor always shows what the export would say.
 *
 *   classic      - no class instances
 *   flatclassic  - class instances only if their classes (and the classes inside them) have no code,
 *                  as the classes are converted into flat objects (voice_2_env)
 *   flathelper   - same as flatclassic (it's flattened the same way, but into one helper class),
 *                  and the code in the tab should use the objects through the helper instance (design.amp)
 *   classes      - anything
 * In classic, flatclassic and flathelper the exported tab is the top of the design,
 * so it can't be a class itself (have TabInput/TabOutput), that is only checked when exporting.
 */
RED.exporter.modes = (function () {
    'use strict';

    const graph = RED.exporter.graph;

    /** node types that contains user code, these can't be flattened */
    const CODE_NODE_TYPES = ["Function", "Variables", "ConstructorCode", "DestructorCode", "EndOfFileCode", "PointerArray"];

    /** @returns {String} the selected export mode */
    function getMode() {
        return RED.arduino.settings.ExportMode;
    }

    /** @param {String} mode @returns {Boolean} true for the modes that export one tab as the top of the design */
    function isSingleTabMode(mode) {
        const M = RED.arduino.EXPORT_MODE;
        return mode == M.CLASSIC || mode == M.FLAT_CLASSIC || mode == M.FLAT_HELPER;
    }

    /**
     * The errors a node have in an export mode.
     * @param {REDNode} node
     * @param {String} [mode] default is the selected mode
     * @returns {ResolvedProblem[]}
     */
    function getNodeProblems(node, mode) {
        if (mode == undefined) mode = getMode();
        const M = RED.arduino.EXPORT_MODE;
        if (node._def.isGroupClass == true) { // in every mode
            const instanceProblem = graph.getGroupInstanceProblem(node);
            if (instanceProblem != undefined) return [new ResolvedProblem("error", instanceProblem, undefined, node)];
        }
        if (graph.isClass(node) == false) return [];

        if (graph.isClassGroup(node)) { // in every mode
            const nameProblems = graph.getClassGroupNameProblems(node);
            const conflict = RED.groupClasses.getClassNameConflict(node); // another group with the class name and other contents
            if (conflict != undefined) nameProblems.push(conflict);
            if (nameProblems.length != 0) return nameProblems.map(function (text) { return new ResolvedProblem("error", text, undefined, node); });
        }
        const name = '"' + graph.getBaseName(node) + '"';
        if (mode == M.CLASSIC) {
            return [new ResolvedProblem("error", name + " is an instance of the class " + graph.getClassName(node) +
                ", the Export Mode 'classic' can't contain classes (use 'flatclassic', 'flathelper' or 'classes')", undefined, node)];
        }
        if (mode == M.FLAT_CLASSIC || mode == M.FLAT_HELPER) {
            const reasons = getReasonsClassCantBeFlattened(graph.getClassWorkspace(node), new Set());
            if (reasons.length != 0)
                return [new ResolvedProblem("error", name + " (class " + graph.getClassName(node) + ") can't be flattened (Export Mode '" + mode + "'), " + reasons.join(", ") +
                    " (use 'classes')", undefined, node)];
        }
        return [];
    }

    /**
     * @param {REDWorkspace} classWs
     * @param {Set<String>} visited the ids of the classes already checked (also stops classes that contain themselves)
     * @returns {String[]} why the class can't be flattened, empty if it can
     */
    function getReasonsClassCantBeFlattened(classWs, visited) {
        if (visited.has(classWs.id)) return [];
        visited.add(classWs.id);
        const reasons = [];
        const scopeNodes = graph.getScopeNodes(classWs); // a workspace or a class group
        const codeNodes = scopeNodes.filter(function (n) { return CODE_NODE_TYPES.includes(n.type); });
        if (codeNodes.length != 0)
            reasons.push(classWs.label + " contains code (" + codeNodes.map(function (n) { return n.type + (n.name ? (' "' + n.name + '"') : ""); }).join(", ") + ")");
        if (classWs.extraClassDeclarations != undefined && classWs.extraClassDeclarations.trim().length != 0)
            reasons.push(classWs.label + " have extra class declarations (" + classWs.extraClassDeclarations.trim() + ")");
        for (const n of scopeNodes) {
            if (graph.isClass(n)) reasons.push(...getReasonsClassCantBeFlattened(graph.getClassWorkspace(n), visited));
        }
        return reasons;
    }

    /**
     * The errors a wire have in an export mode, both the general ones (see RED.exporter.resolve.validateLink)
     * and the ones of the nodes at its ends.
     * @param {REDLink} link
     * @param {String} [mode] default is the selected mode
     * @returns {ResolvedProblem[]} only the errors
     */
    function getLinkErrors(link, mode) {
        if (mode == undefined) mode = getMode();
        const errors = RED.exporter.resolve.validateLink(link).filter(function (p) { return p.isError; });
        if (graph.isJunction(link.target)) return errors; // checked on the wire(s) after the junction

        const from = graph.followJunctionsBackward(link);
        const ends = [link.target];
        if (from != undefined) ends.push(from.node);
        for (const end of [...ends]) { // a wire to/from a class group IO junction is a wire to/from the class group instance
            if (graph.isGroupPort(end)) ends.push(end.parentGroup);
        }
        for (const node of ends) errors.push(...getNodeProblems(node, mode));
        return errors;
    }

    /**
     * Adds the export mode errors of the exported tab, used when exporting.
     * @param {ResolvedWorkspace} rws the tab being exported
     * @param {String} mode
     */
    function addWorkspaceProblems(rws, mode) {
        for (const node of rws.ws.nodes) {
            for (const problem of getNodeProblems(node, mode)) rws.addProblem(problem);
        }
        if (isSingleTabMode(mode) && (rws.ws.tabInputs.length != 0 || rws.ws.tabOutputs.length != 0)) {
            rws.addProblem(new ResolvedProblem("error", "this tab have class inputs/outputs (TabInput/TabOutput) so it's a class, " +
                "the Export Mode '" + mode + "' exports the selected tab as the top of the design, select the tab that uses this class (or use 'classes')"));
        }
        if (mode == RED.arduino.EXPORT_MODE.FLAT_HELPER) warnAboutCodeNotUsingHelperInstance(rws);
    }

    /**
     * In 'flathelper' the objects are inside the helper class but the code of the tab is not,
     * so the code must use the objects through the helper instance (design.amp), warn about code that don't.
     * note. it's only a text search, so it's a warning and not an error
     * @param {ResolvedWorkspace} rws
     */
    function warnAboutCodeNotUsingHelperInstance(rws) {
        const instance = RED.exporter.cpp.HELPER_INSTANCE_NAME;
        const code = [...rws.userCode.functions, ...rws.userCode.variables].filter(function (t) { return t != undefined; }).join("\n");
        for (const node of rws.ws.nodes) {
            if (graph.isVirtual(node) || graph.isClass(node)) continue; // class instances are warned about by RED.exporter.flatten
            const name = graph.getBaseName(node);
            const directUse = new RegExp("(?<![\\w.])" + name + "\\s*(\\[[^\\]]*\\])?\\s*\\.");
            if (directUse.test(code))
                rws.addProblem(new ResolvedProblem("warning", "the code in this tab uses " + name + " directly, in the Export Mode 'flathelper' the objects are inside the helper class, use " + instance + "." + name, undefined, node));
        }
    }

    return {
        CODE_NODE_TYPES,
        isSingleTabMode,
        getNodeProblems,
        getLinkErrors,
        addWorkspaceProblems,
    };
})();
