/**
 * One step on the way from a workspace down to an audio object: a node, and which element if it's an array.
 *
 * What it is for:
 *   A path of steps tells exactly which object is meant, also inside class instances and arrays,
 *   without storing any names. [voices[2], env] is the env inside the third element of the voices array.
 *
 * Who makes them:   the resolver (export-resolve.js) when it follows wires into class instances and arrays.
 * Who uses them:    ResolvedEndpoint.path (the ends of a connection),
 *                   ResolvedObject.classPath (where a flattened object came from),
 *                   the code writers (export-cpp.js) that turn a path into a name: voices[2].env or voices_2_env.
 */
class ResolvedPathStep
{
    /** the node: a class instance, or (the last step) the real audio object
     * @type {REDNode} */
    node;

    /** the array element, undefined when the node is not an array
     * @type {Number|undefined} */
    index;

    /** @param {REDNode} node @param {Number} [index] */
    constructor(node, index) {
        this.node = node;
        this.index = index;
    }
}
