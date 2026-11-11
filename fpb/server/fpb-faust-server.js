#!/usr/bin/env node
// FPB Faust bridge: a local Faust compile service that closes the loop
//
//   Faust IDE (export, server = http://127.0.0.1:8088)  ─┐
//                                                        ├─> faust -lang interp -> FBC -> FPB  ─> ASDT++ (WebSocket)
//   ASDT++ (compile the code of an AudioEffectFPB node) ─┘                                         └─> Teensy (OSC)
//
//   node fpb/server/fpb-faust-server.js [--port 8088] [--host 127.0.0.1] [--faust path/to/faust(.exe)] [--find-faust]
//                                       [--faustlib path/to/share/faust] [--sr 44117] [--www dir | --no-www]
//                                       [--keep dir | --no-keep]   every compile is kept in <dir>/<name>/ (default fpb/patches)
//                                       [--osc-port COMx|off] [--debug-port COMy|off] [--no-io]   serial / MIDI (io.js)
//
// One port for everything:
//   /            ASDT++ itself (static files of this repo, or --www dir), so http://127.0.0.1:8088/ is the tool
//   /asdt        the WebSocket for ASDT++
//   /faust/...   the Faust API below (Faust IDE: Export -> Server http://127.0.0.1:8088/faust)
//                (/targets, /filepost and /<sha>/... also work without /faust, they don't clash with the repo)
//
// HTTP, the faustservice API used by the Faust IDE export dialog (under /faust):
//   GET  /targets                                   {"source": ["cplusplus"], "teensy": ["fpb", "fpb-zip"]}
//   POST /filepost                                  multipart "file" = zip of the project -> SHA key
//   GET  /<sha>/teensy/fpb/precompile               compiles, sends the patch to ASDT++, "DONE"
//   GET  /<sha>/teensy/fpb/binary.zip               a page that closes itself (no save dialog: the patch is in ASDT++)
//   GET  /<sha>/teensy/fpb-zip/precompile|binary.zip    the same compile, binary.zip = <name>.fpb .fbc _fpb.h .json .dsp
//   GET  /<sha>/source/cplusplus/precompile|binary.zip   plain C++ (faust -lang cpp), i.e. for fixed firmware
//   ("source/cplusplus" is also the Faust IDE's default target: without it the export dialog fails to load)
//   GET  /faust/                                    status page
//   GET  /oplist                                    the FPB op table the server compiles for (FPB_oplist.h)
//
// WebSocket (any path, i.e. ws://127.0.0.1:8088/asdt), JSON text messages:
//   server -> client  {type:"hello", version, faust, sampleRate, opCount, patches:[names]}
//                     {type:"patch", name, origin:"faustide"|"asdt", id?, inputs, outputs, params, stats, warnings,
//                      fpb:<base64>, time}
//                     {type:"error", name, origin, id?, message}
//   client -> server  {type:"compile", id, name, code}     compile Faust code (the reply goes to that client only)
//                     {type:"get", name}                   the last compiled patch with that name
//
// No npm packages: the WebSocket, multipart and zip code is in this file. Listens on 127.0.0.1 by default.
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const { spawn, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const OPLIST = path.join(ROOT, "fpb", "teensy", "FPB", "src", "FPB_oplist.h");

global.RED = global.RED || {};
["fpb-core", "fpb-fbc", "fpb-format", "fpb-vm", "fpb-compile-fbc"].forEach(f => require(path.join(ROOT, "red", "fpb", f + ".js")));

// ------------------------------------------------------------------ options

const argv = process.argv.slice(2);
function opt(name, def) { const i = argv.indexOf(name); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : def; }
const PORT = parseInt(opt("--port", "8088"), 10);
const HOST = opt("--host", "127.0.0.1");
const SR = parseInt(opt("--sr", "44117"), 10);
let FAUSTLIB = opt("--faustlib", process.env.FAUSTLIB || "");
const WORK = path.join(os.tmpdir(), "fpb-faust-server");
const OUT = argv.includes("--no-keep") ? null : path.resolve(opt("--keep", path.join(ROOT, "fpb", "patches")));   // a folder per patch
const MAX_UPLOAD = 32 * 1024 * 1024;
const PLATFORM = "teensy", ARCH = "fpb";
const API = "/faust";
const WWW = argv.includes("--no-www") ? null : path.resolve(opt("--www", ROOT));
const ARCH_ZIP = "fpb-zip";       // the same, but binary.zip is the files
const TARGETS = { source: ["cplusplus"], [PLATFORM]: [ARCH, ARCH_ZIP] };

// ------------------------------------------------------------------ finding faust

// a .js "faust" runs with node (used by the tests); anything else is the real compiler
function spawnArgsFor(exe, args) {
    return exe.endsWith(".js") ? [process.execPath, [exe, ...args]] : [exe, args];
}
function faustSpawnArgs(args) { return spawnArgsFor(FAUST, args); }

/** @returns {String|null} the version when exe is a working faust compiler */
function versionOf(exe) {
    const [cmd, args] = spawnArgsFor(exe, ["--version"]);
    try {
        const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 10000, windowsHide: true });
        if (r.error || r.status !== 0) return null;
        const m = /Version\s+(\S+)/i.exec(r.stdout || "");
        return m ? m[1] : ((r.stdout || "").trim().split("\n")[0] || null);
    } catch (e) { return null; }
}

/** the places a faust install usually ends up, for this platform; Faust-<version> folders included */
function standardFaustPaths() {
    const home = os.homedir(), exe = process.platform === "win32" ? "faust.exe" : "faust";
    const list = [];
    // <parent>/<Faust*>/bin/faust: the installers put the version in the folder name (Faust-2.88.0)
    const versioned = function (parent) {
        try {
            return fs.readdirSync(parent).filter(d => /^faust/i.test(d)).sort().reverse()   // newest first
                .map(d => path.join(parent, d, "bin", exe));
        } catch (e) { return []; }
    };
    if (process.platform === "win32") {
        const pf = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.ProgramW6432, "C:\\Program Files"]
            .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
        for (const p of pf) list.push(path.join(p, "Faust", "bin", exe), ...versioned(p));
        if (process.env.LOCALAPPDATA) list.push(path.join(process.env.LOCALAPPDATA, "Programs", "Faust", "bin", exe), ...versioned(path.join(process.env.LOCALAPPDATA, "Programs")));
        list.push("C:\\Faust\\bin\\" + exe, path.join(home, "scoop", "shims", exe), "C:\\ProgramData\\chocolatey\\bin\\" + exe,
                  "C:\\msys64\\mingw64\\bin\\" + exe, "C:\\msys64\\ucrt64\\bin\\" + exe);
    } else if (process.platform === "darwin") {
        list.push("/usr/local/bin/faust", "/opt/homebrew/bin/faust", "/opt/local/bin/faust", path.join(home, ".local", "bin", "faust"),
                  ...versioned("/Applications"), ...versioned(path.join(home, "Applications")), ...versioned("/usr/local"));
    } else {
        list.push("/usr/local/bin/faust", "/usr/bin/faust", path.join(home, ".local", "bin", "faust"), "/opt/faust/bin/faust",
                  "/snap/bin/faust", "/var/lib/flatpak/exports/bin/faust", ...versioned("/opt"), ...versioned(path.join(home, "opt")));
    }
    return list;
}

/**
 * --faust, then $FAUST, then faust on the PATH, then the standard places (each is tried with --version).
 * @returns {{exe:String, version:String|null, how:String, tried:String[]}}
 */
function findFaust() {
    const tried = [];
    const given = opt("--faust", "") || process.env.FAUST || "";
    const candidates = [];
    if (given) candidates.push({ exe: given, how: opt("--faust", "") ? "--faust" : "$FAUST" });
    candidates.push({ exe: "faust", how: "PATH" });
    for (const p of standardFaustPaths()) candidates.push({ exe: p, how: "standard place" });
    for (const c of candidates) {
        if (c.how === "standard place" && !fs.existsSync(c.exe)) continue;
        if (tried.includes(c.exe)) continue;
        tried.push(c.exe);
        const version = versionOf(c.exe);
        if (version) {
            let exe = c.exe;
            if (c.how === "PATH") {    // the full path, for the log and the libraries
                const w = spawnSync(process.platform === "win32" ? "where" : "which", ["faust"], { encoding: "utf8" });
                const first = (w.stdout || "").split(/\r?\n/)[0].trim();
                if (first) exe = first;
            }
            return { exe, version, how: c.how, tried };
        }
        if (c.how !== "PATH" && c.how !== "standard place") log("warning: " + c.how + " " + c.exe + " is not a working faust compiler, searching");
    }
    return { exe: given || "faust", version: null, how: "not found", tried };
}

/** faust --libdir, else <faust>/../share/faust, else the usual share dirs */
function findFaustLib(exe) {
    const has = d => d && fs.existsSync(path.join(d, "stdfaust.lib"));
    try {
        const [cmd, args] = spawnArgsFor(exe, ["--libdir"]);
        const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 10000, windowsHide: true });
        const d = (r.stdout || "").trim().split(/\r?\n/)[0];
        if (r.status === 0 && has(d)) return d;
    } catch (e) { /* older faust */ }
    const guesses = [path.join(path.dirname(exe), "..", "share", "faust"), "/usr/local/share/faust", "/usr/share/faust", "/opt/homebrew/share/faust"];
    return guesses.find(has) || "";
}

const FOUND = findFaust();
const FAUST = FOUND.exe;
const FAUST_VERSION = FOUND.version;
if (!FAUSTLIB && FAUST_VERSION) FAUSTLIB = findFaustLib(FAUST);

if (argv.includes("--find-faust")) {
    console.log("platform:  " + process.platform);
    console.log("faust:     " + (FAUST_VERSION ? FAUST + "  (version " + FAUST_VERSION + ", found via " + FOUND.how + ")" : "NOT FOUND"));
    console.log("libraries: " + (FAUSTLIB || "(faust's own)"));
    console.log("tried:     " + (FOUND.tried.join("\n           ") || "-"));
    process.exit(FAUST_VERSION ? 0 : 1);
}
fs.mkdirSync(WORK, { recursive: true });

const table = RED.fpb.core.parseOpList(fs.readFileSync(OPLIST, "utf8"));

function log(...a) { console.log(new Date().toISOString().substring(11, 19), ...a); }

// ------------------------------------------------------------------ compile

const patches = new Map();     // name -> the last patch message
const projects = new Map();    // sha -> { dir, name, result? }

function safeName(name) {
    const n = String(name || "").replace(/\.dsp$/i, "").replace(/[^A-Za-z0-9_]/g, "_");
    return /^[A-Za-z_]/.test(n) ? n : "p_" + n;
}

function runFaust(args, cwd) {
    return new Promise(function (resolve) {
        const [cmd, a] = faustSpawnArgs(args);
        let out = "", err = "";
        let child;
        try { child = spawn(cmd, a, { cwd }); }
        catch (e) { resolve({ code: -1, out, err: String(e) }); return; }
        const timer = setTimeout(function () { child.kill(); err += "\n(timeout)"; }, 60000);
        child.stdout.on("data", d => out += d);
        child.stderr.on("data", d => err += d);
        child.on("error", e => { err += String(e); });
        child.on("close", code => { clearTimeout(timer); resolve({ code, out, err }); });
    });
}

/**
 * compiles <dir>/<name>.dsp; resolves to a patch message, rejects with an Error (message = the faust/compiler text).
 * Everything is also kept in OUT/<name>/ (the sources, the .fbc, and the results or <name>.error.txt).
 */
async function compileDir(dir, name, origin) {
    let result, error;
    try { result = await compileIn(dir, name, origin); }
    catch (e) { error = e; }
    keep(dir, name, error);
    if (error) throw error;
    return result;
}

/** copies the sources and results of a compile to OUT/<name>/ */
function keep(dir, name, error) {
    if (OUT == null) return;
    try {
        const to = path.join(OUT, name);
        fs.mkdirSync(to, { recursive: true });
        for (const f of fs.readdirSync(dir)) {
            const from = path.join(dir, f);
            if (fs.statSync(from).isFile()) fs.copyFileSync(from, path.join(to, f));
        }
        const errFile = path.join(to, name + ".error.txt");
        if (error) fs.writeFileSync(errFile, new Date().toISOString() + "\n" + error.message + "\n");
        else fs.rmSync(errFile, { force: true });
    } catch (e) { log("could not keep " + name + " in " + OUT + ": " + e.message); }
}

async function compileIn(dir, name, origin) {
    const main = name + ".dsp";
    if (!fs.existsSync(path.join(dir, main))) throw new Error("no " + main + " in the project");
    const fbcFile = path.join(dir, name + ".fbc");
    const args = ["-lang", "interp", "-single", "-I", dir];
    if (FAUSTLIB) args.push("-I", FAUSTLIB);
    args.push(main, "-o", fbcFile);
    fs.rmSync(fbcFile, { force: true });
    const r = await runFaust(args, dir);
    if (r.code !== 0 || !fs.existsSync(fbcFile)) {
        throw new Error((r.err || r.out || ("faust exited with " + r.code)).trim() +
            (FAUST_VERSION ? "" : "\n(the faust compiler was not found: start the server with --faust <path to faust.exe>)"));
    }
    const fbcText = fs.readFileSync(fbcFile, "utf8");
    const model = RED.fpb.fbc.parse(fbcText);
    const res = RED.fpb.compileFBC(model, table, { sampleRate: SR });
    verify(model, res);
    const msg = {
        type: "patch", name, origin, time: Date.now(),
        inputs: model.inputs, outputs: model.outputs, sampleRate: SR,
        params: res.params.map(p => ({ index: p.index, label: p.label, path: p.path, widget: p.widget,
                                       min: p.min, max: p.max, step: p.step, def: p.def, meta: p.meta })),
        stats: res.stats, warnings: res.warnings,
        fpb: Buffer.from(res.bytes).toString("base64")
    };
    fs.writeFileSync(path.join(dir, name + ".fpb"), res.bytes);
    fs.writeFileSync(path.join(dir, name + ".json"), JSON.stringify(Object.assign({}, msg, { fpb: undefined }), null, 2));
    fs.writeFileSync(path.join(dir, name + "_fpb.h"), cHeader(name, res, model));
    patches.set(name, msg);
    return msg;
}

// the container must load and give the same output as the FBC reference (as fpbc does)
function verify(model, res) {
    const vm = RED.fpb.vm.load(res.bytes, table);
    if (vm.error) throw new Error("internal: the compiled container does not load: " + vm.errorName);
    const ref = new RED.fpb.fbc.Interp(model);
    ref.init(SR);
    const N = 128, ins = [], o1 = [], o2 = [];
    for (let c = 0; c < model.inputs; c++) ins.push(new Float32Array(N).map((_, k) => Math.sin(k * 0.3 + c) * 0.5));
    for (let c = 0; c < model.outputs; c++) { o1.push(new Float32Array(N)); o2.push(new Float32Array(N)); }
    let max = 0;
    for (let b = 0; b < 8; b++) {
        ref.compute(N, ins, o1);
        vm.process(ins, o2, N);
        for (let c = 0; c < model.outputs; c++) for (let k = 0; k < N; k++) max = Math.max(max, Math.abs(o1[c][k] - o2[c][k]));
    }
    if (!(max <= 1e-6)) throw new Error("internal: the compiled patch differs from the FBC reference by " + max);
}

function cHeader(name, res, model) {
    const sym = name + "_fpb", L = [];
    L.push(`// ${name}_fpb.h: compiled by fpb-faust-server from ${name}.dsp (FPB, see AudioEffectFPB::load)`);
    L.push(`// inputs ${model.inputs}, outputs ${model.outputs}, sample rate ${SR}, ${res.bytes.length} bytes`);
    res.params.forEach(p => L.push(`//   param ${p.index}: ${p.path}  ${p.min}..${p.max}  default ${+(+p.def).toPrecision(7)}`));
    L.push("#pragma once", "#include <stdint.h>", "#ifndef PROGMEM", "#define PROGMEM", "#endif");
    res.params.forEach(p => L.push(`#define ${sym.toUpperCase()}_${p.path.replace(/\W/g, "_").toUpperCase()} ${p.index}`));
    L.push(`static const uint8_t ${sym}[${res.bytes.length}] PROGMEM = {`);
    for (let i = 0; i < res.bytes.length; i += 16)
        L.push("    " + Array.from(res.bytes.subarray(i, i + 16)).map(b => "0x" + b.toString(16).padStart(2, "0")).join(",") + ",");
    L.push("};", "");
    return L.join("\n");
}

// ------------------------------------------------------------------ zip (store / deflate read, store write)

function unzip(buf) {
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("not a zip file");
    const count = buf.readUInt16LE(eocd + 10);
    let p = buf.readUInt32LE(eocd + 16);
    const files = [];
    let total = 0;
    for (let k = 0; k < count; k++) {
        if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip central directory");
        const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
        const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
        const local = buf.readUInt32LE(p + 42);
        const name = buf.toString("utf8", p + 46, p + 46 + nlen);
        p += 46 + nlen + elen + clen;
        if (name.endsWith("/")) continue;
        if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error("bad zip local header");
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const raw = buf.subarray(start, start + csize);
        let data;
        if (method === 0) data = Buffer.from(raw);
        else if (method === 8) data = zlib.inflateRawSync(raw);
        else throw new Error("zip compression method " + method + " is not supported");
        if (data.length !== usize) throw new Error("zip: bad size for " + name);
        total += data.length;
        if (total > MAX_UPLOAD) throw new Error("zip: too big");
        files.push({ name, data });
    }
    return files;
}

function zipStore(files) {
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
        const name = Buffer.from(f.name, "utf8"), data = Buffer.from(f.data);
        const crc = RED.fpb.core.crc32(data);
        const h = Buffer.alloc(30);
        h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6);
        h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
        const c = Buffer.alloc(46);
        c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8);
        c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28);
        c.writeUInt32LE(offset, 42);
        parts.push(h, name, data);
        central.push(c, name);
        offset += 30 + name.length + data.length;
    }
    const cd = Buffer.concat(central);
    const e = Buffer.alloc(22);
    e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10);
    e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(offset, 16);
    return Buffer.concat([...parts, cd, e]);
}

// writes the files of a zip under dir, refusing paths that leave it
function extractTo(files, dir) {
    for (const f of files) {
        const rel = path.normalize(f.name).replace(/^([/\\])+/, "");
        if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("zip: bad path " + f.name);
        const out = path.join(dir, rel);
        if (!out.startsWith(dir)) throw new Error("zip: bad path " + f.name);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, f.data);
    }
}

// ------------------------------------------------------------------ multipart

function multipartFile(body, contentType) {
    const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
    if (!m) throw new Error("no multipart boundary");
    const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
    let pos = body.indexOf(boundary);
    while (pos >= 0) {
        const headStart = pos + boundary.length + 2;               // after "\r\n"
        const headEnd = body.indexOf("\r\n\r\n", headStart);
        if (headEnd < 0) break;
        const headers = body.toString("utf8", headStart, headEnd);
        const next = body.indexOf(boundary, headEnd + 4);
        if (next < 0) break;
        const data = body.subarray(headEnd + 4, next - 2);           // minus the "\r\n" before the boundary
        const fn = /filename="([^"]*)"/i.exec(headers);
        if (/name="file"/i.test(headers)) return { filename: fn ? fn[1] : "project.zip", data };
        pos = next;
    }
    throw new Error("no 'file' part in the upload");
}

// ------------------------------------------------------------------ WebSocket (RFC 6455, text frames)

const clients = new Set();

function wsAccept(req, socket) {
    const key = req.headers["sec-websocket-key"];
    if (!key) { socket.destroy(); return; }
    const accept = crypto.createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n");
    const client = { socket, buf: Buffer.alloc(0), frag: [], name: req.socket.remoteAddress };
    clients.add(client);
    log("ASDT++ connected (" + clients.size + ")");
    socket.setNoDelay(true);
    socket.on("data", function (d) { client.buf = Buffer.concat([client.buf, d]); wsParse(client); });
    socket.on("close", function () { clients.delete(client); log("ASDT++ disconnected (" + clients.size + ")"); });
    socket.on("error", function () { clients.delete(client); });
    wsSend(client, { type: "hello", version: 1, faust: FAUST_VERSION, sampleRate: SR, opCount: table.count, patches: [...patches.keys()] });
    if (io) io.welcome(function (m) { wsSend(client, m); });
}

function wsFrame(op, payload) {
    const len = payload.length;
    let head;
    if (len < 126) head = Buffer.from([0x80 | op, len]);
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
    return Buffer.concat([head, payload]);
}

function wsSend(client, obj) {
    try { client.socket.write(wsFrame(1, Buffer.from(JSON.stringify(obj), "utf8"))); } catch (e) { /* closed */ }
}

function broadcast(obj) { for (const c of clients) wsSend(c, obj); }

function broadcastBinary(buf) {
    const frame = wsFrame(2, buf);
    for (const c of clients) { try { c.socket.write(frame); } catch (e) { /* closed */ } }
}

function wsParse(client) {
    for (;;) {
        const b = client.buf;
        if (b.length < 2) return;
        const fin = (b[0] & 0x80) !== 0, op = b[0] & 0x0f, masked = (b[1] & 0x80) !== 0;
        let len = b[1] & 0x7f, off = 2;
        if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
        else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
        if (len > MAX_UPLOAD) { client.socket.destroy(); return; }
        const maskOff = off;
        if (masked) off += 4;
        if (b.length < off + len) return;
        const payload = Buffer.from(b.subarray(off, off + len));
        if (masked) for (let i = 0; i < len; i++) payload[i] ^= b[maskOff + (i & 3)];
        client.buf = b.subarray(off + len);
        if (op === 8) { try { client.socket.end(wsFrame(8, Buffer.alloc(0))); } catch (e) { /* */ } return; }
        if (op === 9) { try { client.socket.write(wsFrame(10, payload)); } catch (e) { /* */ } continue; }
        if (op === 10) continue;
        if (op === 2) { if (io) io.onBinary(client, payload); continue; }   // OSC bytes for the serial port
        if (op === 1 || op === 0) {
            client.frag.push(payload);
            if (!fin) continue;
            const text = Buffer.concat(client.frag).toString("utf8");
            client.frag = [];
            let msg;
            try { msg = JSON.parse(text); } catch (e) { wsSend(client, { type: "error", message: "bad JSON" }); continue; }
            onClientMessage(client, msg);
        }
    }
}

async function onClientMessage(client, msg) {
    if (io && io.onMessage(client, msg)) return;
    if (msg.type === "compile") {
        const name = safeName(msg.name);
        const dir = path.join(WORK, "asdt-" + name);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, name + ".dsp"), String(msg.code || ""));
        log("compile " + name + " (from ASDT++)");
        try {
            const patch = await compileDir(dir, name, "asdt");
            wsSend(client, Object.assign({ id: msg.id }, patch));
            log("  ok, " + patch.stats.smp + " instructions per sample, " + patch.stats.bytes + " bytes");
        } catch (e) {
            wsSend(client, { type: "error", name, origin: "asdt", id: msg.id, message: e.message });
            log("  error: " + e.message.split("\n")[0]);
        }
    } else if (msg.type === "get") {
        const p = patches.get(safeName(msg.name));
        wsSend(client, p ? p : { type: "error", name: msg.name, message: "no patch named " + msg.name });
    }
}

// ------------------------------------------------------------------ HTTP

function cors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Private-Network", "true");   // a https page (faustide.grame.fr) calling localhost
    res.setHeader("Access-Control-Expose-Headers", "Location");
}
function reply(res, code, body, type) {
    res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
    res.end(body);
}

function readBody(req) {
    return new Promise(function (resolve, reject) {
        const chunks = [];
        let size = 0;
        req.on("data", function (d) { size += d.length; if (size > MAX_UPLOAD) { reject(new Error("upload too big")); req.destroy(); } else chunks.push(d); });
        req.on("end", function () { resolve(Buffer.concat(chunks)); });
        req.on("error", reject);
    });
}

async function precompile(sha) {
    const p = projects.get(sha);
    if (!p) throw new Error("unknown project " + sha + " (upload it again)");
    if (!p.result) {
        log("compile " + p.name + " (from the Faust IDE)");
        p.result = await compileDir(p.dir, p.name, "faustide");
        broadcast(p.result);
        log("  ok, " + p.result.stats.smp + " instructions per sample, " + p.result.stats.bytes + " bytes, sent to " + clients.size + " ASDT++");
    }
    return p;
}

async function precompileCpp(sha) {
    const p = projects.get(sha);
    if (!p) throw new Error("unknown project " + sha + " (upload it again)");
    if (!p.cpp) {
        log("compile " + p.name + " to C++ (from the Faust IDE)");
        const out = path.join(p.dir, p.name + ".cpp");
        const args = ["-lang", "cpp", "-single", "-cn", p.name, "-I", p.dir];
        if (FAUSTLIB) args.push("-I", FAUSTLIB);
        args.push(p.name + ".dsp", "-o", out);
        fs.rmSync(out, { force: true });
        const r = await runFaust(args, p.dir);
        if (r.code !== 0 || !fs.existsSync(out)) throw new Error((r.err || r.out || ("faust exited with " + r.code)).trim());
        p.cpp = true;
    }
    return p;
}

/** @returns {String|null} the path within the Faust API, or null for a static file */
function apiPath(pathname) {
    const p = pathname.replace(/\/{2,}/g, "/");          // "http://host/faust/" in the IDE gives "/faust//targets"
    if (p === API || p.startsWith(API + "/")) return p.substring(API.length) || "/";
    if (p === "/targets" || p === "/filepost" || /^\/[0-9a-f]{40}\//.test(p)) return p;   // without the prefix
    return null;
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
    ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
    ".h": "text/plain; charset=utf-8", ".wasm": "application/wasm", ".zip": "application/zip", ".map": "application/json" };

/** serves the files of WWW (ASDT++); no dot files / dot folders (.git) */
function serveStatic(req, res, pathname) {
    if (WWW == null || (req.method !== "GET" && req.method !== "HEAD")) return reply(res, 404, "not found");
    let rel;
    try { rel = decodeURIComponent(pathname); } catch (e) { return reply(res, 400, "bad path"); }
    if (rel.endsWith("/")) rel += "index.html";
    if (rel.split("/").some(seg => seg.startsWith("."))) return reply(res, 404, "not found");
    const file = path.resolve(WWW, "." + rel);
    if (file !== WWW && !file.startsWith(WWW + path.sep)) return reply(res, 404, "not found");
    fs.stat(file, function (err, st) {
        if (err || !st.isFile()) {
            if (!err && st.isDirectory()) { res.writeHead(301, { Location: pathname + "/" }); res.end(); return; }
            return reply(res, 404, "not found");
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
                             "Content-Length": st.size, "Cache-Control": "no-cache" });
        if (req.method === "HEAD") { res.end(); return; }
        fs.createReadStream(file).pipe(res);
    });
}

async function handle(req, res) {
    cors(res);
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, "http://localhost");
    const api = apiPath(url.pathname);
    if (api == null) return serveStatic(req, res, url.pathname);
    const parts = api.split("/").filter(Boolean);
    try {
        if (req.method === "GET" && parts.length === 0) return reply(res, 200, statusPage(), "text/html; charset=utf-8");
        if (req.method === "GET" && api === "/targets") return reply(res, 200, JSON.stringify(TARGETS), "application/json");
        if (req.method === "GET" && api === "/oplist") return reply(res, 200, fs.readFileSync(OPLIST, "utf8"));
        if (req.method === "GET" && api === "/bridge.json")     // lets a page served from here find the bridge
            return reply(res, 200, JSON.stringify({ bridge: "fpb-faust", ws: "/asdt", faust: FAUST_VERSION }), "application/json");
        if (req.method === "POST" && api === "/filepost") {
            const body = await readBody(req);
            const file = multipartFile(body, req.headers["content-type"]);
            const sha = crypto.createHash("sha1").update(file.data).digest("hex");
            const name = safeName(path.basename(file.filename).replace(/\.zip$/i, ""));
            const dir = path.join(WORK, sha);
            if (!projects.has(sha)) {
                fs.rmSync(dir, { recursive: true, force: true });
                fs.mkdirSync(dir, { recursive: true });
                const files = unzip(file.data);
                extractTo(files, dir);
                // the IDE names the main file after the project; use the only .dsp otherwise
                let main = name;
                if (!fs.existsSync(path.join(dir, main + ".dsp"))) {
                    const dsps = files.map(f => f.name).filter(n => /\.dsp$/i.test(n) && !n.includes("/"));
                    if (dsps.length === 1) main = path.basename(dsps[0], ".dsp");
                }
                projects.set(sha, { dir, name: main });
            }
            log("upload " + name + " -> " + sha.substring(0, 12));
            return reply(res, 200, sha);
        }
        if (req.method === "GET" && parts.length === 4) {
            const [sha, platform, arch, target] = parts;
            if (!(TARGETS[platform] || []).includes(arch)) return reply(res, 404, "unknown target " + platform + "/" + arch);
            if (platform === "source") {
                let p;
                try { p = await precompileCpp(sha); }
                catch (e) { return reply(res, 500, e.message); }
                if (target === "precompile") return reply(res, 200, "DONE");
                if (target === "binary.zip") {
                    const files = [p.name + ".cpp", p.name + ".dsp"].filter(f => fs.existsSync(path.join(p.dir, f)))
                        .map(f => ({ name: f, data: fs.readFileSync(path.join(p.dir, f)) }));
                    res.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${p.name}-cpp.zip"` });
                    res.end(zipStore(files));
                    return;
                }
                return reply(res, 404, "not found");
            }
            if (target === "precompile") {
                try { await precompile(sha); }
                catch (e) {
                    broadcast({ type: "error", name: projects.has(sha) ? projects.get(sha).name : "?", origin: "faustide", message: e.message });
                    return reply(res, 500, e.message);
                }
                return reply(res, 200, "DONE");
            }
            if (target === "binary.zip" && arch === ARCH) {
                // The IDE's toolbar Export button opens this in a new tab right after precompile, which would give a
                // save dialog for a zip. The patch is already in ASDT++, so: a page that closes itself (a tab with one
                // history entry may close itself). The files: architecture fpb-zip.
                const p = await precompile(sha);
                return reply(res, 200, `<!doctype html><meta charset="utf-8"><title>${p.name}: sent to ASDT++</title>
<body style="font:14px system-ui;margin:2em"><p><b>${p.name}</b> was sent to ASDT++ (${clients.size} connected), there is nothing to save.</p>
<p>To download the files (.fpb, .fbc, _fpb.h, .json), export with the architecture <b>${ARCH_ZIP}</b>.</p>
<script>window.close()</script>`, "text/html; charset=utf-8");
            }
            if (target === "binary.zip") {
                const p = await precompile(sha);
                const n = p.name;
                const files = [n + ".fpb", n + ".fbc", n + "_fpb.h", n + ".json", n + ".dsp"]
                    .filter(f => fs.existsSync(path.join(p.dir, f)))
                    .map(f => ({ name: f, data: fs.readFileSync(path.join(p.dir, f)) }));
                res.writeHead(200, { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${n}-fpb.zip"` });
                res.end(zipStore(files));
                return;
            }
        }
        reply(res, 404, "not found");
    } catch (e) {
        reply(res, 500, e.message);
    }
}

function statusPage() {
    const rows = [...patches.values()].map(p => `<tr><td>${p.name}</td><td>${p.origin}</td><td>${p.inputs}/${p.outputs}</td>` +
        `<td>${p.params.length}</td><td>${p.stats.smp}</td><td>${p.stats.bytes}</td><td>${new Date(p.time).toLocaleTimeString()}</td></tr>`).join("");
    return `<!doctype html><meta charset="utf-8"><title>FPB Faust bridge</title>
<style>body{font:14px system-ui;margin:2em;max-width:60em}td,th{padding:2px 10px;text-align:left}code{background:#eee;padding:1px 4px}</style>
<h2>FPB Faust bridge</h2>
<p>faust: <b>${FAUST_VERSION || "NOT FOUND (start with --faust &lt;path to faust.exe&gt;)"}</b>, libraries: <code>${FAUSTLIB || "(faust's own)"}</code>, sample rate ${SR}, op table ${table.count} entries</p>
<p>ASDT++: ${WWW ? `<a href="/">http://${HOST}:${PORT}/</a>` : "(not served, --no-www)"}, connected: <b>${clients.size}</b> (ws://${HOST}:${PORT}/asdt)</p>
<p>Faust IDE: Export → Server: <code>http://${HOST}:${PORT}${API}</code>, platform <code>${PLATFORM}</code>, architecture <code>${ARCH}</code> (or <code>${ARCH_ZIP}</code> to download the files)</p>
<table><tr><th>patch</th><th>from</th><th>in/out</th><th>params</th><th>ops/sample</th><th>bytes</th><th>time</th></tr>${rows}</table>`;
}

// serial (the Teensy's OSC and debug ports) and MIDI for ASDT++, see io.js; --no-io turns it off
const FAKE_IO = opt("--fake-io", "");   // tests: fake serialport / MIDI modules (fpb/tests/fake-io.js)
const io = argv.includes("--no-io") ? null : require("./io.js")(Object.assign({
    log, broadcast, broadcastBinary, oscPort: opt("--osc-port", ""), debugPort: opt("--debug-port", "")
}, FAKE_IO ? require(path.resolve(FAKE_IO)) : {}));

const server = http.createServer(function (req, res) { handle(req, res); });
server.on("upgrade", function (req, socket) { wsAccept(req, socket); });
server.listen(PORT, HOST, function () {
    if (io) io.start();
    log(`FPB Faust bridge on http://${HOST}:${PORT}`);
    log(`  ASDT++:              ${WWW ? `http://${HOST}:${PORT}/  (${WWW})` : "not served (--no-www)"}`);
    log(`  Faust IDE server:    http://${HOST}:${PORT}${API}   (Export -> platform ${PLATFORM}, architecture ${ARCH})`);
    log(`  WebSocket (ASDT++):  ws://${HOST}:${PORT}/asdt`);
    log("  compiled patches:    " + (OUT ? OUT + path.sep + "<name>" : "not kept (--no-keep)"));
    log("faust: " + (FAUST_VERSION ? FAUST_VERSION + " (" + FAUST + ")" : "NOT FOUND (" + FAUST + "), use --faust <path>") +
        (FAUSTLIB ? ", libraries " + FAUSTLIB : ""));
});

module.exports = { server, unzip, zipStore, multipartFile };
