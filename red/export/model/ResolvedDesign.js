/**
 * The whole resolved design: all exported workspaces.
 *
 * What it is for:
 *   Holds the workspaces of an export that writes many files (Export Modes 'classes' and 'flathelper'),
 *   and answers questions about all of them together (all errors, all connections a wire is part of).
 *
 * Who makes it:     the resolver (RED.exporter.resolve.resolveDesign), or the exporter for a single workspace.
 * Who uses it:      the exporter (exporter.js).
 */
class ResolvedDesign
{
    /** @type {ResolvedWorkspace[]} */
    workspaces = [];

    /** @returns {{workspace:ResolvedWorkspace, problem:ResolvedProblem}[]} all errors in all workspaces */
    get errors() {
        const result = [];
        for (const rws of this.workspaces) for (const problem of rws.errors) result.push({ workspace: rws, problem });
        return result;
    }

    /** @param {REDWorkspace} ws @returns {ResolvedWorkspace|undefined} the resolved version of an editor workspace */
    get(ws) {
        return this.workspaces.find(function (rws) { return rws.ws === ws; });
    }

    /**
     * Forward lookup: all connections a wire is part of, in any workspace.
     * @param {REDLink} link
     * @returns {ResolvedConnection[]}
     */
    connectionsOf(link) {
        const result = [];
        for (const rws of this.workspaces) result.push(...rws.connectionsOf(link));
        return result;
    }
}
