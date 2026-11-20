// The project API (specs/asdt-backend.md, sections 4, 6 and 7): list and make projects, save the current design,
// export into src/asdt/ with a zipped backup of what was there, list and restore backups.
//
// In a project the backend writes only in its two own folders, src/asdt/ and .asdt/, and a new project's starter
// files once, when its folder is made. Nothing else in a project is ever written, renamed or removed.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { segmentsOf, apiError } = require("./paths.js");

const EXPORT_DIR = ["src", "asdt"];          // the export, replaced on every export
const STATE_DIR = ".asdt";                   // design.json, backup/, staging/, project.json
const EXPORT_EXTENSIONS = [".h", ".hpp", ".c", ".cpp", ".json", ".txt", ".md"];
const MAX_FILES = 2000;
const SKIP_DIRS = new Set(["node_modules", ".pio", ".git", STATE_DIR]);

/**
 * @param {Object} o
 * @param {ReturnType<import("./paths.js").createPaths>} o.paths  checked paths in the projects folder
 * @param {Number} o.backups        how many backup zips to keep
 * @param {Number} o.searchDepth    folder levels searched for projects
 * @param {Number} o.maxTotal       the most bytes in one export
 * @param {Object} o.zip            RED.zip
 * @param {Function} o.log
 * @param {Function} o.broadcast    (obj) to every ASDT++ on the WebSocket
 */
function createProjects(o) {
    const { paths, zip, log } = o;

    // ------------------------------------------------------------------ projects

    /** @returns {"platformio"|"arduino"|"asdt"|null} */
    function kindOf(dir) {
        if (fs.existsSync(path.join(dir, "platformio.ini"))) return "platformio";
        if (fs.existsSync(path.join(dir, path.basename(dir) + ".ino"))) return "arduino";
        if (fs.existsSync(path.join(dir, STATE_DIR))) return "asdt";
        return null;
    }

    /** the project folder of a request path, which must be an existing project */
    function projectDir(rel) {
        const dir = paths.resolve(rel);
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw apiError(404, "E_NOT_FOUND", "no project " + rel);
        if (kindOf(dir) == null) throw apiError(404, "E_NOT_FOUND", rel + " is not a project (no platformio.ini, " + path.basename(dir) + ".ino or .asdt)");
        return dir;
    }

    function readJson(file) {
        try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; }
    }

    function projectInfo(dir) {
        const last = readJson(path.join(dir, STATE_DIR, "project.json"));
        return {
            path: path.relative(paths.BASE, dir).split(path.sep).join("/"),
            kind: kindOf(dir),
            hasDesign: fs.existsSync(path.join(dir, STATE_DIR, "design.json")),
            lastExport: last ? last.time : null
        };
    }

    /** every project in the projects folder, searchDepth levels deep; links and junctions are not followed */
    function list() {
        const found = [];
        const walk = function (dir, depth) {
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
            for (const e of entries) {
                if (!e.isDirectory() || e.isSymbolicLink() || e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
                const sub = path.join(dir, e.name);
                if (kindOf(sub) != null) found.push(projectInfo(sub));   // a project: not searched inside
                else if (depth < o.searchDepth) walk(sub, depth + 1);
            }
        };
        walk(paths.BASE, 1);
        return found.sort((a, b) => a.path.localeCompare(b.path));
    }

    // a new project's starter files: written once, when the folder is made, never again
    function starterFiles(name, template) {
        const head = `// ${name}: made by ASDT++. This file is yours: ASDT++ never writes it again.\n` +
                     `// ASDT++ exports the design to src/asdt/ (replaced on every export), asdt.h includes all of it.\n` +
                     `// If the main tab of the design has setup() and loop(), remove them here.\n` +
                     `// In the Export Mode "classes" the design is a class: make one here, i.e. Main design;\n`;
        const body = `\nvoid setup() {\n    AudioMemory(40);\n}\n\nvoid loop() {\n}\n`;
        if (template === "platformio") return [
            { name: "platformio.ini", contents: "; made by ASDT++, it's yours\n[env:teensy41]\nplatform = teensy\nboard = teensy41\nframework = arduino\n" },
            { name: "src/main.cpp", contents: head + "#include <Arduino.h>\n#include <Audio.h>\n#include \"asdt/asdt.h\"\n" + body }
        ];
        if (template === "arduino") return [
            { name: name + ".ino", contents: head + "#include <Audio.h>\n#include \"src/asdt/asdt.h\"\n" + body }
        ];
        return [];
    }

    function create(body) {
        const rel = String(body.path || "");
        const template = body.template || "platformio";
        if (!["platformio", "arduino", "none"].includes(template)) throw apiError(400, "E_ARG", "template must be platformio, arduino or none");
        const segs = segmentsOf(rel);
        const name = segs[segs.length - 1];
        if (template === "arduino" && !/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name)) throw apiError(400, "E_ARG", "an Arduino sketch name can only have letters, digits, _ . -");
        const dir = paths.resolve(rel);
        if (fs.existsSync(dir)) throw apiError(409, "E_EXISTS", rel + " already exists");
        paths.mkdirChecked(path.join(dir, STATE_DIR));
        for (const f of starterFiles(name, template)) {
            const file = path.join(dir, ...f.name.split("/"));
            paths.mkdirChecked(path.dirname(file));
            fs.writeFileSync(file, f.contents, { flag: "wx" });   // wx: never over an existing file
        }
        log("project made: " + rel + " (" + template + ")");
        return projectInfo(dir);
    }

    function get(rel) {
        const dir = projectDir(rel);
        const design = path.join(dir, STATE_DIR, "design.json");
        return Object.assign(projectInfo(dir), {
            design: fs.existsSync(design) ? fs.readFileSync(design, "utf8") : null,
            backups: listBackups(dir)
        });
    }

    /** the current design (as the browser's local storage), saved as is, no backup */
    function putDesign(body) {
        const dir = projectDir(String(body.path || ""));
        const text = typeof body.design === "string" ? body.design : JSON.stringify(body.design);
        try { JSON.parse(text); } catch (e) { throw apiError(400, "E_ARG", "design is not JSON"); }
        const state = path.join(dir, STATE_DIR);
        paths.mkdirChecked(state);
        const file = path.join(state, "design.json"), tmp = file + ".tmp";
        fs.writeFileSync(tmp, text);
        fs.renameSync(tmp, file);
        o.broadcast({ type: "design", path: projectInfo(dir).path, time: Date.now() });
        return { saved: true, size: text.length };
    }

    // ------------------------------------------------------------------ export

    const locks = new Map();   // project dir -> the promise of the export running in it

    /** runs fn(dir) for one project at a time */
    function locked(dir, fn) {
        const prev = locks.get(dir) || Promise.resolve();
        const run = prev.catch(() => {}).then(() => fn());
        locks.set(dir, run);
        return run.finally(() => { if (locks.get(dir) === run) locks.delete(dir); });
    }

    /** all files under dir: Map rel ("a/b.h") -> Buffer */
    function readTree(dir) {
        const out = new Map();
        const walk = function (d, prefix) {
            let entries;
            try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
            for (const e of entries) {
                const rel = prefix + e.name;
                if (e.isDirectory() && !e.isSymbolicLink()) walk(path.join(d, e.name), rel + "/");
                else if (e.isFile()) out.set(rel, fs.readFileSync(path.join(d, e.name)));
            }
        };
        walk(dir, "");
        return out;
    }

    function sameTree(a, b) {
        if (a.size !== b.size) return false;
        for (const [k, v] of a) if (!b.has(k) || Buffer.compare(v, b.get(k)) !== 0) return false;
        return true;
    }

    /** checks the files of an export: names, extensions, count and size -> Map rel -> Buffer */
    function checkFiles(files) {
        if (!Array.isArray(files)) throw apiError(400, "E_ARG", "files must be an array");
        if (files.length > MAX_FILES) throw apiError(413, "E_TOO_BIG", "more than " + MAX_FILES + " files");
        const map = new Map();
        const lower = new Set();   // Windows and macOS: "Main.h" and "main.h" are the same file
        let total = 0;
        for (const f of files) {
            const name = String(f && f.name || "").replace(/\\/g, "/");
            segmentsOf(name);
            const ext = path.extname(name).toLowerCase();
            if (!EXPORT_EXTENSIONS.includes(ext)) throw apiError(403, "E_PATH", name + ": only " + EXPORT_EXTENSIONS.join(" ") + " files can be exported");
            const key = name.toLowerCase();
            if (lower.has(key)) throw apiError(400, "E_ARG", "the file " + name + " is twice in the export");
            lower.add(key);
            const data = f.encoding === "base64" ? Buffer.from(String(f.contents || ""), "base64") : Buffer.from(String(f.contents == null ? "" : f.contents), "utf8");
            total += data.length;
            if (total > o.maxTotal) throw apiError(413, "E_TOO_BIG", "the export is bigger than " + o.maxTotal + " bytes");
            map.set(name, data);
        }
        return map;
    }

    function writeTree(dir, map) {
        for (const [rel, data] of map) {
            const file = path.join(dir, ...rel.split("/"));
            paths.mkdirChecked(path.dirname(file));
            fs.writeFileSync(file, data);
        }
    }

    // 2026-11-20_14-32-05-123: sorted by name = sorted by time (a second one in the same ms gets _02, which sorts
    // after the name without it because "." < "_")
    function timestamp(d) {
        const p = (n, w) => String(n).padStart(w || 2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}`;
    }

    function listBackups(dir) {
        const bdir = path.join(dir, STATE_DIR, "backup");
        let names;
        try { names = fs.readdirSync(bdir).filter(n => /^[\w.-]+\.zip$/.test(n)); } catch (e) { return []; }
        return names.sort().reverse().map(function (name) {
            const st = fs.statSync(path.join(bdir, name));
            return { name, time: st.mtimeMs, size: st.size };
        });
    }

    /** the transaction of specs/asdt-backend.md section 6 */
    async function exportFiles(dir, map, what) {
        const state = path.join(dir, STATE_DIR);
        const target = path.join(dir, ...EXPORT_DIR);
        const staging = path.join(state, "staging");
        const old = path.join(state, "old");
        paths.mkdirChecked(state);
        // what a crash may have left
        fs.rmSync(staging, { recursive: true, force: true });
        fs.rmSync(old, { recursive: true, force: true });

        const current = fs.existsSync(target) ? readTree(target) : new Map();
        const rel = projectInfo(dir).path;
        if (sameTree(current, map)) {
            log(what + " " + rel + ": unchanged");
            return { result: "unchanged", written: [], removed: [], backup: null };
        }
        paths.mkdirChecked(staging);
        writeTree(staging, map);

        // the backup of what is there now
        let backup = null;
        if (current.size > 0) {
            const bdir = path.join(state, "backup");
            paths.mkdirChecked(bdir);
            const stamp = timestamp(new Date());
            let name = stamp;
            for (let k = 2; fs.existsSync(path.join(bdir, name + ".zip")); k++) name = stamp + "_" + String(k).padStart(2, "0");
            backup = name + ".zip";
            const bytes = await zip.write([...current].map(([n, d]) => ({ name: n, data: d })));
            fs.writeFileSync(path.join(bdir, backup), bytes);
            for (const b of listBackups(dir).slice(o.backups)) fs.rmSync(path.join(bdir, b.name), { force: true });
        }

        // the swap: two renames; when Windows refuses (a file is open), file by file
        paths.mkdirChecked(path.dirname(target));
        let swapped = false;
        try {
            if (fs.existsSync(target)) fs.renameSync(target, old);
            try { fs.renameSync(staging, target); swapped = true; }
            catch (e) { if (fs.existsSync(old) && !fs.existsSync(target)) fs.renameSync(old, target); throw e; }
        } catch (e) {
            if (!["EPERM", "EBUSY", "EACCES", "ENOTEMPTY"].includes(e.code)) throw e;
            log(what + " " + rel + ": the folder is in use (" + e.code + "), replacing the files one by one");
        }
        if (swapped) fs.rmSync(old, { recursive: true, force: true });
        else {
            paths.mkdirChecked(target);
            writeTree(target, map);
            for (const name of current.keys()) if (!map.has(name)) fs.rmSync(path.join(target, ...name.split("/")), { force: true });
            removeEmptyFolders(target);
            fs.rmSync(staging, { recursive: true, force: true });
        }

        const written = [...map.keys()].filter(n => !current.has(n) || Buffer.compare(current.get(n), map.get(n)) !== 0);
        const removed = [...current.keys()].filter(n => !map.has(n));
        fs.writeFileSync(path.join(state, "project.json"), JSON.stringify({
            time: Date.now(),
            files: [...map].map(([n, d]) => ({ name: n, size: d.length, sha1: crypto.createHash("sha1").update(d).digest("hex") }))
        }, null, 2));
        log(what + " " + rel + ": " + written.length + " written, " + removed.length + " removed" + (backup ? ", backup " + backup : ""));
        o.broadcast({ type: "export", path: rel, result: "written", time: Date.now() });
        return { result: "written", written, removed, backup };
    }

    function removeEmptyFolders(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!e.isDirectory() || e.isSymbolicLink()) continue;
            const sub = path.join(dir, e.name);
            removeEmptyFolders(sub);
            if (fs.readdirSync(sub).length === 0) fs.rmdirSync(sub);
        }
    }

    function doExport(body) {
        const dir = projectDir(String(body.path || ""));
        const map = checkFiles(body.files);
        return locked(dir, () => exportFiles(dir, map, "export"));
    }

    function backupFile(dir, name) {
        if (!/^[\w.-]+\.zip$/.test(String(name || ""))) throw apiError(400, "E_ARG", "bad backup name");
        const file = path.join(dir, STATE_DIR, "backup", name);
        if (!fs.existsSync(file)) throw apiError(404, "E_NOT_FOUND", "no backup " + name);
        paths.checkReal(file);
        return file;
    }

    async function readBackup(dir, name) {
        return zip.readAll(fs.readFileSync(backupFile(dir, name)), { maxTotal: o.maxTotal });
    }

    async function backupDesign(rel, name) {
        const dir = projectDir(rel);
        const files = await readBackup(dir, name);
        const d = files.find(f => f.name === "design.json");
        if (!d) throw apiError(404, "E_NOT_FOUND", "no design.json in " + name);
        return { design: Buffer.from(d.data).toString("utf8") };
    }

    async function restore(body) {
        const dir = projectDir(String(body.path || ""));
        const files = await readBackup(dir, body.backup);
        const map = checkFiles(files.map(f => ({ name: f.name, contents: Buffer.from(f.data).toString("base64"), encoding: "base64" })));
        return locked(dir, () => exportFiles(dir, map, "restore " + body.backup + " to"));
    }

    return {
        list, create, get, putDesign, doExport, restore, backupDesign,
        backups: rel => listBackups(projectDir(rel)),
        kindOf, STATE_DIR, EXPORT_DIR: EXPORT_DIR.join("/")
    };
}

module.exports = { createProjects };
