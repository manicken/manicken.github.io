/**
 * One resolved workspace (tab): its objects, its connections, its user code and its problems.
 *
 * What it is for:
 *   This is what a code writer turns into one class or one file. It only contains the connections
 *   this workspace owns: the ones that are not completely inside one of its class instances
 *   (those are in the workspace of that class). A flattened workspace (export-flatten.js) instead
 *   contains all objects and all connections from inside its class instances.
 *
 *   It also keeps the wire -> connections lookup (connectionsOf), so for every wire in the editor
 *   it's possible to find the real connections it became.
 *
 * Who makes them:   the resolver (RED.exporter.resolve.resolveWorkspace) and the flattener
 *                   (RED.exporter.flatten.flattenWorkspace).
 * Who uses them:    the code writers (export-cpp.js), the exporter (exporter.js), the Export Mode rules (export-modes.js),
 *                   ResolvedDesign (all exported workspaces).
 */
class ResolvedWorkspace
{
    /** the editor workspace this is made from
     * @type {REDWorkspace} */
    ws;

    /** objects with audio inputs/outputs, including class instances that have ports
     * @type {ResolvedObject[]} */
    audioObjects = [];

    /** objects without audio inputs/outputs (AudioControlSGTL5000, class instances without ports ...)
     * @type {ResolvedObject[]} */
    controlObjects = [];

    /** the connections this workspace owns, in the order of the wires in the editor (use addConnection to add)
     * @type {ResolvedConnection[]} */
    connections = [];

    /** errors and warnings (use addProblem to add)
     * @type {ResolvedProblem[]} */
    problems = [];

    /** @type {ResolvedUserCode} */
    userCode = new ResolvedUserCode();

    /** names of the classes (workspaces) used in this workspace, for the includes and the file order
     * @type {String[]} */
    usedClasses = [];

    /** the input counts of all dyn input mixers, to know which mixer variants (AudioMixer8 ...) to generate
     * @type {{type:String, count:Number}[]} */
    dynMixers = [];

    /** wire -> connections lookup
     * @type {Map<REDLink, ResolvedConnection[]>} */
    #connectionsByLink = new Map();

    /** to not report the same problem twice
     * @type {Set<String>} */
    #problemKeys = new Set();

    /** @param {REDWorkspace} ws */
    constructor(ws) {
        this.ws = ws;
    }

    /** @returns {String} the workspace name, also the class name */
    get name() { return this.ws.label; }

    /** @returns {ResolvedProblem[]} the problems that stops the export */
    get errors() { return this.problems.filter(function (p) { return p.isError; }); }

    /** @returns {ResolvedProblem[]} the problems that are exported as comments */
    get warnings() { return this.problems.filter(function (p) { return p.isError == false; }); }

    /** adds a problem, unless the same problem already is added @param {ResolvedProblem} problem */
    addProblem(problem) {
        const key = problem.severity + problem.text + (problem.link ? (problem.link.source.id + problem.link.sourcePort + problem.link.target.id + problem.link.targetPort) : "");
        if (this.#problemKeys.has(key)) return;
        this.#problemKeys.add(key);
        this.problems.push(problem);
    }

    /** adds a connection and remembers it for each of its wires (see connectionsOf) @param {ResolvedConnection} connection */
    addConnection(connection) {
        this.connections.push(connection);
        for (const link of connection.links) {
            if (this.#connectionsByLink.has(link) == false) this.#connectionsByLink.set(link, []);
            this.#connectionsByLink.get(link).push(connection);
        }
    }

    /**
     * Forward lookup: the connections a wire is part of.
     * note. a wire inside a class is part of connections in every workspace that uses that class,
     * this only returns the ones made in this workspace, use ResolvedDesign.connectionsOf to get all.
     * @param {REDLink} link
     * @returns {ResolvedConnection[]}
     */
    connectionsOf(link) {
        return this.#connectionsByLink.get(link) || [];
    }
}
