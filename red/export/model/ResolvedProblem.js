/**
 * Something wrong in the design, found when the design is resolved or checked for an Export Mode.
 *
 * What it is for:
 *   error   - the design can't be exported as it is (i.e. array sizes or bus widths that don't match,
 *             a class instance in the Export Mode 'classic'), the export is stopped and an
 *             error report is shown instead (RED.exporter.main showErrorReport)
 *   warning - something that is not supported by the export, it's exported as a comment in the code
 *
 *   The same problems are also shown directly in the editor: the wires and nodes with errors are
 *   drawn as invalid and explain why when hovered (RED.exporter.modes, RED.nodes.setLinkInfo, RED.view).
 *
 * Who makes them:   the resolver (export-resolve.js), the flattener (export-flatten.js)
 *                   and the Export Mode rules (export-modes.js).
 * Who uses them:    the error report, the code writers (warnings as comments), the editor.
 */
class ResolvedProblem
{
    /** @type {"error"|"warning"} */
    severity;

    /** what is wrong, written for the user
     * @type {String} */
    text;

    /** the wire it's about, if any (shown as 'wire: osc:0 -> mixer:1' in the report)
     * @type {REDLink|undefined} */
    link;

    /** the node it's about, if any
     * @type {REDNode|undefined} */
    node;

    /** @param {"error"|"warning"} severity @param {String} text @param {REDLink} [link] @param {REDNode} [node] */
    constructor(severity, text, link, node) {
        this.severity = severity;
        this.text = text;
        this.link = link;
        this.node = node;
    }

    /** @returns {Boolean} true for an error (stops the export), false for a warning */
    get isError() { return this.severity == "error"; }
}
