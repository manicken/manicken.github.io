/**
 * Collects lines of code and takes care of the indentation,
 * so the code generators don't need to add spaces themselves.
 *
 *   const w = new CodeWriter(4);
 *   w.line("class Foo");
 *   w.line("{");
 *   w.indent();
 *   w.line("int bar;");
 *   w.dedent();
 *   w.line("};");
 *   w.toString(); // "class Foo\n{\n    int bar;\n};\n"
 */
class CodeWriter
{
    /** @type {String[]} */
    #lines = [];
    /** @type {String} */
    #indentUnit = "    ";
    /** @type {Number} */
    #level = 0;

    /** @param {Number} indentSize number of spaces per indentation level */
    constructor(indentSize) {
        if (indentSize != undefined) this.#indentUnit = " ".repeat(indentSize);
    }

    /** adds one line at the current indentation, an empty line is never indented */
    line(text) {
        if (text == undefined || text.length == 0) this.#lines.push("");
        else this.#lines.push(this.#indentUnit.repeat(this.#level) + text);
    }

    /**
     * adds text that can have many lines (for example the code from a Function node),
     * the text keeps its own indentation and gets the current indentation added in front.
     * Empty lines at the end are removed.
     * @param {String|String[]} text
     */
    text(text) {
        const lines = Array.isArray(text) ? text.join("\n").split("\n") : String(text).split("\n");
        while (lines.length != 0 && lines[lines.length - 1].trim().length == 0) lines.pop();
        for (const l of lines) this.line(l.trimEnd());
    }

    /** adds an empty line, but never two in a row and never at the start */
    blank() {
        if (this.#lines.length == 0) return;
        if (this.#lines[this.#lines.length - 1].length == 0) return;
        this.#lines.push("");
    }

    indent() { this.#level++; }
    dedent() { if (this.#level > 0) this.#level--; }

    /** removes empty lines at the end, dedents and adds the closing line, i.e. endBlock("}") */
    endBlock(text) {
        while (this.#lines.length != 0 && this.#lines[this.#lines.length - 1].length == 0) this.#lines.pop();
        this.dedent();
        this.line(text);
    }

    /** @returns {Boolean} */
    get isEmpty() { return this.#lines.length == 0; }

    /** @returns {String} all lines, every line ends with a newline */
    toString() {
        if (this.#lines.length == 0) return "";
        return this.#lines.join("\n") + "\n";
    }
}
