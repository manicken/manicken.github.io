/**
 * A node that becomes a C++ object: an audio object, a control object or a class instance.
 *
 * What it is for:
 *   Everything the code writers need to declare the object (AudioMixer8 mixer;), without the
 *   C++ text itself, so the same object can be written differently by different export modes
 *   (AudioMixer8 or AudioMixer<8>, mixer or voices_2_mixer ...).
 *
 * Who makes them:   the resolver (export-resolve.js) for every node in a workspace that is not virtual
 *                   (junctions, tab IO, code nodes ... are virtual), the flattener (export-flatten.js)
 *                   copies the objects from inside class instances and sets classPath.
 * Who uses them:    ResolvedWorkspace.audioObjects/controlObjects, the code writers (export-cpp.js).
 */
class ResolvedObject
{
    /** the node the object is made from, the name is always read from it (never stored)
     * @type {REDNode} */
    node;

    /** the C++ type without any decoration, is the node type except for AudioStreamObject (its Sub Type)
     * @type {String} */
    typeName;

    /** 0 when not an array
     * @type {Number} */
    arrayLength = 0;

    /** only set for dyn input objects (AudioMixer, AudioMixerStereo): the number of inputs it needs,
     * that is the number of signals of all wires into it
     * @type {Number|undefined} */
    dynInputCount;

    /** true for an instance of a class (another workspace)
     * @type {Boolean} */
    isClass = false;

    /** only used when flattening (Export Modes 'flatclassic' and 'flathelper'): the class instances
     * this object was inside of, i.e. [voices[2]] for the env inside voices[2], that gives the flat name voices_2_env
     * @type {ResolvedPathStep[]} */
    classPath = [];

    /** @param {REDNode} node */
    constructor(node) {
        this.node = node;
    }
}
