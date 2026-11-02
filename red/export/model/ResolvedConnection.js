/**
 * One real audio connection between two real audio objects, i.e. one AudioConnection in C++.
 *
 * What it is for:
 *   One wire in the editor can become many connections (bus wires, arrays, class inputs connected
 *   to many objects inside the class), and one connection can be made from many wires (through
 *   junctions and class ports). This is the result after all of that is followed.
 *
 *   'links' remembers which editor wires the connection was made from, that is the reverse lookup
 *   (connection -> wires), the forward lookup (wire -> connections) is ResolvedWorkspace.connectionsOf.
 *   That is what an OSC live update needs to know which connections to change when a wire changes.
 *
 * Who makes them:   the resolver (export-resolve.js), added with ResolvedWorkspace.addConnection.
 * Who uses them:    the code writers (export-cpp.js), one 'patchCord' per connection.
 */
class ResolvedConnection
{
    /** where the signal comes from
     * @type {ResolvedEndpoint} */
    source;

    /** where the signal goes to
     * @type {ResolvedEndpoint} */
    target;

    /** all editor wires this connection was made from, in signal flow order,
     * more than one when the connection goes through junctions, class ports or bus nodes
     * @type {REDLink[]} */
    links = [];

    /** @param {ResolvedEndpoint} source @param {ResolvedEndpoint} target @param {REDLink[]} links */
    constructor(source, target, links) {
        this.source = source;
        this.target = target;
        this.links = links;
    }

    /** @returns {String} only for debug, i.e. "osc:0 -> voice[2].env:0" */
    toString() { return this.source.toString() + " -> " + this.target.toString(); }
}
