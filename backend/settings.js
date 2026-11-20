// Settings of the backend: backend/settings.json (or --settings <file>), then the command line, which wins.
// The names in settings.json are the command line options in camelCase: --project-search-depth -> projectSearchDepth.
// A setting is never changed from the browser. See settings.example.json and specs/asdt-backend.md, section 3.
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const camel = name => name.replace(/^--/, "").replace(/-([a-z])/g, (m, c) => c.toUpperCase());

/**
 * @param {String[]} argv the command line (process.argv.slice(2))
 * @param {String} defaultFile backend/settings.json
 */
function loadSettings(argv, defaultFile) {
    const i = argv.indexOf("--settings");
    const file = i >= 0 && i + 1 < argv.length ? path.resolve(argv[i + 1]) : defaultFile;
    let values = {};
    if (fs.existsSync(file)) {
        try { values = JSON.parse(fs.readFileSync(file, "utf8")); }
        catch (e) { throw new Error("bad settings file " + file + ": " + e.message); }
    } else if (i >= 0) throw new Error("no settings file " + file);

    /** an option with a value: the command line, else settings.json, else def (always a String, or def) */
    function opt(name, def) {
        const k = argv.indexOf(name);
        if (k >= 0 && k + 1 < argv.length) return argv[k + 1];
        const v = values[camel(name)];
        return (v === undefined || v === null) ? def : String(v);
    }
    /** an option that can be given more than once (also comma separated); settings.json: an array */
    function optAll(name) {
        const list = [];
        for (let k = 0; k < argv.length - 1; k++) if (argv[k] === name) list.push(...argv[k + 1].split(","));
        const v = values[camel(name)];
        if (Array.isArray(v)) list.push(...v.map(String));
        else if (typeof v === "string") list.push(...v.split(","));
        return list.map(s => s.trim()).filter(Boolean);
    }
    /** a flag: on the command line, or true in settings.json */
    function flag(name) {
        return argv.includes(name) || values[camel(name)] === true;
    }
    return { file: fs.existsSync(file) ? file : null, values, opt, optAll, flag };
}

/** "~/ASDT" -> the home folder */
function expandHome(p) {
    return p.startsWith("~") ? path.join(os.homedir(), p.substring(1)) : p;
}

module.exports = { loadSettings, expandHome };
