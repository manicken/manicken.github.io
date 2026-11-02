/**
 * One exported file, i.e. Voice.h, Voice.cpp, mixers.h or GUI_TOOL.json.
 *
 * What it is for:
 *   The export writes the generated code into ExportFiles, then the files are delivered,
 *   to the export dialog (with a file list), to the IDE webserver extension (http POST)
 *   or into a zip file.
 *
 * Who makes them:
 *   RED.exporter.main (exporter.js) for the generated code and GUI_TOOL.json,
 *   Mixers.Export.GetFiles for mixers.h/.cpp,
 *   RED.export 'Push JSON to the IDE' for GUI_TOOL.json.
 *
 * A file is made of three parts, header + body + footer:
 *   header - the includes and the 'begin automatically generated code' comment
 *   body   - the code itself, the COMPOSITE view of the export dialog only uses the bodies,
 *            so that all files can be shown as one text
 *   footer - the 'end automatically generated code' comment
 * finalize() puts them together into 'contents', that is what is saved/sent.
 */
class ExportFile
{
    /** the file name with extension, i.e. Voice.h
     * @type {String} */
    name = "";

    /** the code without header and footer
     * @type {String} */
    body = "";

    /** the includes etc. before the body
     * @type {String} */
    header = "";

    /** the end comment after the body
     * @type {String} */
    footer = "";

    /** the whole file, this is what is saved or sent, set by finalize()
     * (before that it's the body, so a file without header/footer don't need finalize)
     * @type {String} */
    contents = "";

    /** used by the IDE webserver extension (http POST):
     * true  - the file is written to the target project (normal)
     * false - the file is only a placeholder for a file that already exists in the target project
     *         and should be kept (DontRemoveCodeFiles node), as all other files there are removed
     * @type {Boolean} */
    overwrite_file = true;

    /** true for the main file (.ino/main.cpp)
     * @type {Boolean} */
    isMain = false;

    /** true for the top level file(s) of an export (the main file, or the tab file in 'flathelper'),
     * these are put last in the COMPOSITE view of the export dialog
     * @type {Boolean} */
    isTop = false;

    /** the class (workspace) the file is for, used to put the files in dependency order in the COMPOSITE view
     * (credits to h4yn0nnym0u5e for the dependency order)
     * @type {String} */
    className = "";

    /** the classes this file uses, they are put before it in the COMPOSITE view
     * @type {String[]} */
    depends = [];

    /** only used by the old export2 (arduino-export2.js) when sorting
     * @type {Boolean} */
    isExported = false;

    /** @param {String} name @param {String} body */
    constructor(name, body) {
        this.name = name;
        this.body = body;
        this.contents = body;
    }

    /** puts header + body + footer together into contents, makes the file ready to be saved or sent */
    finalize() {
        this.contents = this.header + this.body + this.footer;
    }
}
