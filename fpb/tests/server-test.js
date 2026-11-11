// End-to-end test of fpb/server/fpb-faust-server.js with fake-faust.js (no faust install needed).
//
//   node fpb/tests/server-test.js
//
// Does what the Faust IDE export dialog does (targets, filepost with a zip, precompile, binary.zip) and what
// ASDT++ does (WebSocket: hello, the patch pushed by the export, compile requests, errors).
"use strict";
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const PORT = 18088;
const HOST = "http://127.0.0.1:" + PORT;
const KEEP = path.join(__dirname, "build", "patches");    // where the server keeps every compile (default fpb/patches)
fs.rmSync(KEEP, { recursive: true, force: true });
const BASE = HOST + "/faust";         // what goes in the Faust IDE export dialog
let failures = 0;
function check(cond, msg) { console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) failures++; }

global.RED = {};
["fpb-core", "fpb-fbc", "fpb-format", "fpb-vm"].forEach(f => require(path.join(ROOT, "red", "fpb", f + ".js")));
const table = RED.fpb.core.parseOpList(fs.readFileSync(path.join(ROOT, "fpb", "teensy", "FPB", "src", "FPB_oplist.h"), "utf8"));

const server = spawn(process.execPath, [path.join(ROOT, "fpb", "server", "fpb-faust-server.js"), "--port", String(PORT),
    "--faust", path.join(__dirname, "fake-faust.js"), "--keep", KEEP, "--no-io"], { stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", d => serverLog += d);
server.stderr.on("data", d => serverLog += d);

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function waitForServer() {
    for (let i = 0; i < 50; i++) {
        try { const r = await fetch(HOST + "/targets"); if (r.ok) return; } catch (e) { /* not yet */ }
        await wait(100);
    }
    throw new Error("server did not start:\n" + serverLog);
}

// a client like ASDT++: collects messages, can wait for one
function connect() {
    const ws = new WebSocket("ws://127.0.0.1:" + PORT + "/asdt");
    const got = [], waiters = [];
    ws.onmessage = function (e) {
        const m = JSON.parse(e.data);
        const w = waiters.findIndex(x => x.match(m));
        if (w >= 0) waiters.splice(w, 1)[0].resolve(m); else got.push(m);
    };
    return {
        ws, got,
        open: new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }),
        next(match, ms) {
            const i = got.findIndex(match);
            if (i >= 0) return Promise.resolve(got.splice(i, 1)[0]);
            return new Promise((resolve, reject) => {
                const w = { match, resolve };
                waiters.push(w);
                setTimeout(() => { const k = waiters.indexOf(w); if (k >= 0) { waiters.splice(k, 1); reject(new Error("timeout")); } }, ms || 5000);
            });
        },
        send(obj) { ws.send(JSON.stringify(obj)); }
    };
}

function checkPatch(m, name, wantParams) {
    const bytes = Uint8Array.from(Buffer.from(m.fpb, "base64"));
    const vm = RED.fpb.vm.load(bytes, table);
    check(vm.error === 0, `${name}: the pushed container loads in the VM (${bytes.length} bytes, ${m.stats.smp} instructions per sample)`);
    check(m.params.length === wantParams && m.params.every(p => typeof p.min === "number"), `${name}: ${m.params.length} params with ranges (${m.params.map(p => p.path).join(", ")})`);
}

(async function main() {
    try {
        console.log("== finding faust");
        const serverJs = path.join(ROOT, "fpb", "server", "fpb-faust-server.js");
        const viaEnv = require("child_process").spawnSync(process.execPath, [serverJs, "--find-faust"],
            { encoding: "utf8", env: Object.assign({}, process.env, { FAUST: path.join(__dirname, "fake-faust.js") }) });
        check(viaEnv.status === 0 && /0\.0\.0-fake.*\$FAUST/.test(viaEnv.stdout), "--find-faust with $FAUST: " + (viaEnv.stdout.split("\n")[1] || "").trim());
        const badFaust = require("child_process").spawnSync(process.execPath, [serverJs, "--find-faust", "--faust", path.join(__dirname, "no-such-faust.exe")],
            { encoding: "utf8", env: Object.assign({}, process.env, { FAUST: "" }) });
        check(/is not a working faust compiler, searching/.test(badFaust.stdout), "a bad --faust is reported and the search goes on (" + ((/faust:\s+(.*)/.exec(badFaust.stdout) || [])[1] || "") + ")");

        await waitForServer();
        console.log("\n== Faust IDE export protocol");
        const targets = await (await fetch(BASE + "/targets")).json();
        check(JSON.stringify(targets) === '{"source":["cplusplus"],"teensy":["fpb","fpb-zip"]}', "GET /targets " + JSON.stringify(targets) + " (source/cplusplus is the IDE's default)");
        const pre = await fetch(BASE + "/targets", { method: "OPTIONS", headers: { "Access-Control-Request-Private-Network": "true" } });
        check(pre.status === 204 && pre.headers.get("access-control-allow-private-network") === "true", "CORS / private network preflight");

        const asdt = connect();
        await asdt.open;
        const hello = await asdt.next(m => m.type === "hello");
        check(hello.faust === "0.0.0-fake" && hello.opCount === table.count, "WebSocket hello: faust " + hello.faust + ", op table " + hello.opCount);

        // the IDE zips the project (JSZip, deflate here to test that path too) and posts it as "file"
        const zlib = require("zlib");
        const dsp = fs.readFileSync(path.join(__dirname, "faust", "lp.dsp"));
        const zip = makeZip([{ name: "lp.dsp", data: dsp, deflate: true }, { name: "mylib.lib", data: Buffer.from("// lib\n") }], zlib);
        const form = new FormData();
        form.append("file", new Blob([zip]), "lp.zip");
        const sha = await (await fetch(BASE + "/filepost", { method: "POST", body: form })).text();
        check(/^[0-9a-f]{40}$/.test(sha), "POST /filepost -> " + sha.substring(0, 12));

        const pc = await fetch(`${BASE}/${sha}/teensy/fpb/precompile`);
        const pcText = await pc.text();
        check(pc.ok && pcText === "DONE", "GET precompile -> " + pcText);
        const pushed = await asdt.next(m => m.type === "patch" && m.name === "lp");
        check(pushed.origin === "faustide" && pushed.inputs === 1 && pushed.outputs === 1, "the export pushed the patch to ASDT++ (origin " + pushed.origin + ")");
        checkPatch(pushed, "lp", 2);

        const closePage = await fetch(`${BASE}/${sha}/teensy/fpb/binary.zip`);
        const pageText = await closePage.text();
        check(/text\/html/.test(closePage.headers.get("content-type")) && /window\.close\(\)/.test(pageText) && !closePage.headers.get("content-disposition"),
            "fpb binary.zip (the toolbar Export opens it): a page that closes itself, no file to save");
        const bin = Buffer.from(await (await fetch(`${BASE}/${sha}/teensy/fpb-zip/binary.zip`)).arrayBuffer());
        const names = readZipNames(bin);
        check(["lp.fpb", "lp.fbc", "lp_fpb.h", "lp.json", "lp.dsp"].every(n => names.includes(n)), "fpb-zip binary.zip: " + names.join(", "));

        const cpp = await fetch(`${BASE}/${sha}/source/cplusplus/precompile`);
        const cppZip = Buffer.from(await (await fetch(`${BASE}/${sha}/source/cplusplus/binary.zip`)).arrayBuffer());
        check(cpp.ok && (await cpp.text()) === "DONE" && readZipNames(cppZip).includes("lp.cpp"), "source/cplusplus: " + readZipNames(cppZip).join(", "));

        const bad = await fetch(`${BASE}/${sha}/teensy/other/precompile`);
        check(bad.status === 404, "unknown architecture -> 404");

        console.log("\n== ASDT++ compile requests");
        asdt.send({ type: "compile", id: 7, name: "echo", code: fs.readFileSync(path.join(__dirname, "faust", "echo.dsp"), "utf8") });
        const echo = await asdt.next(m => m.id === 7);
        check(echo.type === "patch" && echo.origin === "asdt", "compile echo -> " + echo.type);
        if (echo.type === "patch") checkPatch(echo, "echo", 2);

        asdt.send({ type: "compile", id: 8, name: "osc", code: "ERROR here" });
        const err = await asdt.next(m => m.id === 8);
        check(err.type === "error" && /syntax error/.test(err.message), "a faust error comes back: " + (err.message || "").split("\n")[0]);

        const kept = n => fs.existsSync(path.join(KEEP, n)) ? fs.readdirSync(path.join(KEEP, n)).sort() : [];
        check(["lp.dsp", "lp.fbc", "lp.fpb", "lp.json", "lp_fpb.h", "mylib.lib"].every(f => kept("lp").includes(f)), "kept in patches/lp/: " + kept("lp").join(", "));
        check(kept("osc").includes("osc.dsp") && /syntax error/.test(fs.readFileSync(path.join(KEEP, "osc", "osc.error.txt"), "utf8")),
            "a failed compile is kept too, with osc.error.txt: " + kept("osc").join(", "));

        asdt.send({ type: "get", name: "lp" });
        const again = await asdt.next(m => m.type === "patch" && m.name === "lp");
        check(again.fpb === pushed.fpb, "get: the last lp patch");

        const second = connect();
        await second.open;
        const hello2 = await second.next(m => m.type === "hello");
        check(hello2.patches.includes("lp") && hello2.patches.includes("echo"), "a new client hears about the patches: " + hello2.patches.join(", "));
        asdt.ws.close(); second.ws.close();

        const page = await (await fetch(BASE + "/")).text();
        check(/FPB Faust bridge/.test(page) && /0\.0\.0-fake/.test(page), "status page at /faust/");

        console.log("\n== the same port serves ASDT++");
        const index = await fetch(HOST + "/");
        const html = await index.text();
        check(index.ok && /index\.html|<script src="red\/main\.js">/.test(html) && /fpb-bridge\.js/.test(html), "GET / -> the tool's index.html");
        const js = await fetch(HOST + "/red/fpb/fpb-bridge.js");
        check(js.ok && /javascript/.test(js.headers.get("content-type")), "GET /red/fpb/fpb-bridge.js (" + js.headers.get("content-type") + ")");
        check((await fetch(HOST + "/.git/config")).status === 404 && (await fetch(HOST + "/%2e%2e/%2e%2e/Windows/win.ini")).status === 404, "no .git, no path outside the repo");
        const dbl = await (await fetch(HOST + "/faust//targets")).json();
        check(dbl.teensy != undefined, "a server URL with a trailing slash (/faust//targets) works");
        const bj = await (await fetch(BASE + "/bridge.json")).json();
        check(bj.bridge === "fpb-faust" && bj.ws === "/asdt", "/faust/bridge.json tells a page served from here where the WebSocket is");
    } catch (e) {
        failures++;
        console.log("  FAIL " + e.stack);
    }
    server.kill();
    if (failures) console.log("\nserver log:\n" + serverLog);
    console.log(failures ? `\n${failures} FAILED` : "\nall passed");
    process.exit(failures ? 1 : 0);
})();

// ---- small zip helpers for the test (a deflate entry like JSZip can make, and reading names)
function makeZip(files, zlib) {
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
        const name = Buffer.from(f.name), raw = Buffer.from(f.data);
        const data = f.deflate ? zlib.deflateRawSync(raw) : raw;
        const crc = RED.fpb.core.crc32(raw);
        const h = Buffer.alloc(30);
        h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(f.deflate ? 8 : 0, 8);
        h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(name.length, 26);
        const c = Buffer.alloc(46);
        c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(f.deflate ? 8 : 0, 10);
        c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28);
        c.writeUInt32LE(offset, 42);
        parts.push(h, name, data); central.push(c, name);
        offset += 30 + name.length + data.length;
    }
    const cd = Buffer.concat(central), e = Buffer.alloc(22);
    e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10);
    e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(offset, 16);
    return Buffer.concat([...parts, cd, e]);
}
function readZipNames(buf) {
    const names = [];
    let p = buf.readUInt32LE(buf.length - 22 + 16);
    while (p < buf.length - 22 && buf.readUInt32LE(p) === 0x02014b50) {
        const n = buf.readUInt16LE(p + 28), e = buf.readUInt16LE(p + 30), c = buf.readUInt16LE(p + 32);
        names.push(buf.toString("utf8", p + 46, p + 46 + n));
        p += 46 + n + e + c;
    }
    return names;
}
