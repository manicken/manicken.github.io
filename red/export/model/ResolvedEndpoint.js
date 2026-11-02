/**
 * One end of a connection: which real audio object, and which port on it.
 *
 * What it is for:
 *   The path starts with a node in the workspace being exported and continues into class
 *   instances until the real audio object, so [voice[2], env] with port 0 means voice[2].env input/output 0.
 *   Junctions, class ports and bus nodes never appear here, they are already followed by the resolver.
 *
 * Who makes them:   the resolver (export-resolve.js).
 * Who uses them:    ResolvedConnection.source/target, the code writers (export-cpp.js) write them as
 *                   'voice[2].env, 0' (or 'voice_2_env, 0' when flattening).
 */
class ResolvedEndpoint
{
    /** from the workspace being exported down to the real audio object
     * @type {ResolvedPathStep[]} */
    path = [];

    /** the output port (source) or input port (target) on the real audio object,
     * for a mixer it's the real input (after all signals of the wires above), not the port as drawn
     * @type {Number} */
    port = 0;

    /** @param {ResolvedPathStep[]} path @param {Number} port */
    constructor(path, port) {
        this.path = path;
        this.port = port;
    }

    /** @returns {REDNode} the real audio object */
    get node() { return this.path[this.path.length - 1].node; }

    /** @returns {String} only for debug and for finding inputs used twice, i.e. "voice[2].env:0" */
    toString() {
        return this.path.map(function (s) { return RED.exporter.graph.getBaseName(s.node) + (s.index != undefined ? "[" + s.index + "]" : ""); }).join(".") + ":" + this.port;
    }
}
