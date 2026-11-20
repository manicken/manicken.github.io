// Tests of the project API of the backend (backend/server.js, projects.js, paths.js, faust-native.js).
//   node tests/backend-test.js [--build]
//
// Starts the backend with a temporary projects folder and checks: making and listing projects, the path checks
// (traversal, Windows names, a junction/symlink out of the projects folder), who may call /api, the design file,
// export / unchanged / backup / restore / backup limit, and the static files that must not be served.
// With faust installed it also makes native Faust objects; --build then builds a Teensy 4.1 project with them
// (PlatformIO, nothing is uploaded).
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

global.RED = {};
const zip = require(path.join(__dirname, "..", "red", "zip.js"));
const ROOT = path.resolve(__dirname, "..");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = "http://127.0.0.1:" + PORT;
const BUILD = process.argv.includes("--build");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "asdt-backend-test-"));
const PROJECTS = path.join(TMP, "projects");
const OUTSIDE = path.join(TMP, "outside");
fs.mkdirSync(PROJECTS); fs.mkdirSync(OUTSIDE);
fs.writeFileSync(path.join(OUTSIDE, "secret.txt"), "not yours");

let failures = 0;
function check(cond, msg) { if (cond) console.log("  ok   " + msg); else { failures++; console.log("  FAIL " + msg); } }

async function api(method, url, body, headers) {
    const h = Object.assign({}, headers || {});
    if (body !== undefined && !h["Content-Type"]) h["Content-Type"] = "application/json";
    const res = await fetch(BASE + url, { method, headers: h, body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
    return { status: res.status, json, text };
}

const server = spawn(process.execPath, [path.join(ROOT, "backend", "server.js"), "--port", String(PORT), "--no-io", "--no-keep",
    "--projects", PROJECTS, "--backups", "3", "--settings", path.join(TMP, "no-settings.json").replace("no-settings", "settings")], { cwd: ROOT });
fs.writeFileSync(path.join(TMP, "settings.json"), JSON.stringify({ projectSearchDepth: 3 }));
let serverLog = "";
server.stdout.on("data", d => serverLog += d);
server.stderr.on("data", d => serverLog += d);

async function waitForServer() {
    for (let i = 0; i < 100; i++) {
        try { const r = await fetch(BASE + "/api/info"); if (r.ok) return true; } catch (e) { /* not yet */ }
        await new Promise(r => setTimeout(r, 100));
    }
    return false;
}

(async () => {
    if (!await waitForServer()) { console.log("the backend did not start:\n" + serverLog); process.exit(1); }

    console.log("== info, making and listing projects");
    const info = await api("GET", "/api/info");
    check(info.status === 200 && info.json.sandbox === false && info.json.owned.join() === "src/asdt,.asdt", "GET /api/info " + info.text);
    check(!info.text.includes(TMP.split(path.sep).pop()), "the real path of the projects folder is not sent to the page");

    let r = await api("POST", "/api/projects", { path: "synths/poly1", template: "platformio" });
    check(r.status === 200 && r.json.kind === "platformio", "make a PlatformIO project in a subfolder");
    check(fs.existsSync(path.join(PROJECTS, "synths", "poly1", "src", "main.cpp")) && fs.existsSync(path.join(PROJECTS, "synths", "poly1", ".asdt")), "  with platformio.ini, src/main.cpp and .asdt/");
    r = await api("POST", "/api/projects", { path: "blink", template: "arduino" });
    check(r.status === 200 && fs.existsSync(path.join(PROJECTS, "blink", "blink.ino")), "make an Arduino project (blink/blink.ino)");
    r = await api("POST", "/api/projects", { path: "synths/poly1", template: "none" });
    check(r.status === 409 && r.json.code === "E_EXISTS", "an existing folder is refused (" + r.status + ")");
    fs.mkdirSync(path.join(PROJECTS, "a", "b", "c", "deep"), { recursive: true });
    fs.writeFileSync(path.join(PROJECTS, "a", "b", "c", "deep", "platformio.ini"), "");      // level 4: not found
    fs.mkdirSync(path.join(PROJECTS, "a", "b", "level3"), { recursive: true });
    fs.writeFileSync(path.join(PROJECTS, "a", "b", "level3", "platformio.ini"), "");         // level 3: found
    fs.mkdirSync(path.join(PROJECTS, "synths", "poly1", "sub"), { recursive: true });
    fs.writeFileSync(path.join(PROJECTS, "synths", "poly1", "sub", "platformio.ini"), "");   // inside a project: not searched
    r = await api("GET", "/api/projects");
    const listed = r.json.map(p => p.path);
    check(JSON.stringify(listed) === JSON.stringify(["a/b/level3", "blink", "synths/poly1"]), "list, 3 levels deep, not inside a project: " + listed.join(", "));

    console.log("== path checks");
    for (const bad of ["../outside", "synths/../../outside", "C:/Windows", "/etc", "con", "nul.txt", "a:b", "x.", "x ", "a\\b", "a//b", ""]) {
        r = await api("POST", "/api/projects", { path: bad, template: "none" });
        check(r.status === 403 || r.status === 400, JSON.stringify(bad) + " refused (" + r.status + " " + (r.json && r.json.code) + ")");
    }
    check(!fs.existsSync(path.join(TMP, "outside", ".asdt")), "nothing was made outside the projects folder");
    let linked = false;
    try { fs.symlinkSync(OUTSIDE, path.join(PROJECTS, "link"), "junction"); linked = true; } catch (e) { console.log("  (no junction/symlink: " + e.code + ")"); }
    if (linked) {
        r = await api("POST", "/api/projects", { path: "link/evil", template: "none" });
        check(r.status === 403, "a junction out of the projects folder is refused (" + r.status + ")");
        r = await api("GET", "/api/project?path=link");
        check(r.status === 403, "  also for reading (" + r.status + ")");
        check(!fs.existsSync(path.join(OUTSIDE, "evil")), "  nothing was made through it");
    }

    console.log("== who may call /api");
    r = await api("GET", "/api/projects", undefined, { Origin: "https://faustide.grame.fr" });
    check(r.status === 403, "the Faust IDE may not (" + r.status + ")");
    r = await api("GET", "/faust/targets", undefined, { Origin: "https://faustide.grame.fr" });
    check(r.status === 200, "  but may still use /faust (" + r.status + ")");
    r = await api("GET", "/api/projects", undefined, { Origin: "https://evil.example" });
    check(r.status === 403, "another site may not (" + r.status + ")");
    r = await api("GET", "/api/projects", undefined, { Origin: "https://manicken.github.io" });
    check(r.status === 200, "ASDT++ on GitHub Pages may (" + r.status + ")");
    r = await api("GET", "/api/projects", undefined, { Origin: "http://127.0.0.1:" + PORT });
    check(r.status === 200, "ASDT++ served by the backend may (" + r.status + ")");
    r = await api("POST", "/api/export", JSON.stringify({ path: "blink", files: [] }), { "Content-Type": "text/plain" });
    check(r.status === 415, "a body that is not application/json is refused, so a plain form can't post (" + r.status + ")");
    const rebind = await new Promise(function (resolve) {   // (fetch can't change the Host header)
        require("http").get({ host: "127.0.0.1", port: PORT, path: "/api/projects", headers: { Host: "evil.example:" + PORT } }, res => { res.resume(); resolve(res.statusCode); })
            .on("error", () => resolve(0));
    });
    check(rebind === 403, "a Host that is not loopback (DNS rebinding) is refused (" + rebind + ")");

    console.log("== static files");
    for (const u of ["/backend/server.js", "/backend_sandbox/", "/backend/settings.example.json", "/BACKEND/io.js", "/backend%5cserver.js"]) {
        const s = await fetch(BASE + u);
        check(s.status === 404, "GET " + u + " -> " + s.status);
    }
    check((await fetch(BASE + "/index.html")).status === 200, "GET /index.html still works");

    console.log("== design");
    r = await api("PUT", "/api/design", { path: "synths/poly1", design: [{ type: "tab", id: "1", label: "Main" }] });
    check(r.status === 200, "PUT /api/design");
    r = await api("GET", "/api/project?path=synths/poly1");
    check(r.status === 200 && JSON.parse(r.json.design)[0].label === "Main" && r.json.hasDesign, "GET /api/project gives it back");
    r = await api("PUT", "/api/design", { path: "synths/poly1", design: "not json{" });
    check(r.status === 400, "a design that is not JSON is refused");
    r = await api("PUT", "/api/design", { path: "nothere", design: "[]" });
    check(r.status === 404, "not a project: 404");

    console.log("== export, backup, restore");
    const P = "synths/poly1";
    const exportDir = path.join(PROJECTS, "synths", "poly1", "src", "asdt");
    const v1 = [{ name: "asdt.h", contents: "#include \"Main.h\"\n" }, { name: "Main.h", contents: "// v1\n" }, { name: "old.cpp", contents: "// goes away\n" }, { name: "design.json", contents: "[1]" }];
    r = await api("POST", "/api/export", { path: P, files: v1 });
    check(r.status === 200 && r.json.result === "written" && r.json.backup === null && r.json.written.length === 4, "first export: 4 written, no backup");
    r = await api("POST", "/api/export", { path: P, files: v1 });
    check(r.json.result === "unchanged", "the same export again: unchanged, no backup");
    fs.writeFileSync(path.join(exportDir, "Main.h"), "// edited by hand\n");
    const v2 = [{ name: "asdt.h", contents: "#include \"Main.h\"\n" }, { name: "Main.h", contents: "// v2\n" }, { name: "faust/Faust_lp.h", contents: "// lp\n" }, { name: "design.json", contents: "[2]" }];
    r = await api("POST", "/api/export", { path: P, files: v2 });
    check(r.json.result === "written" && r.json.backup && r.json.removed.join() === "old.cpp", "second export: old.cpp removed, backup " + r.json.backup);
    check(fs.readFileSync(path.join(exportDir, "Main.h"), "utf8") === "// v2\n" && !fs.existsSync(path.join(exportDir, "old.cpp")) && fs.existsSync(path.join(exportDir, "faust", "Faust_lp.h")),
        "src/asdt/ holds exactly the new files (the hand edit is overwritten)");
    const backupZip = zip.read(fs.readFileSync(path.join(PROJECTS, "synths", "poly1", ".asdt", "backup", r.json.backup)));
    check(await backupZip.readText("Main.h") === "// edited by hand\n" && backupZip.has("old.cpp"), "the backup has what was there, with the hand edit");
    check(fs.existsSync(path.join(PROJECTS, "synths", "poly1", "src", "main.cpp")) && fs.existsSync(path.join(PROJECTS, "synths", "poly1", "platformio.ini")), "the user's own files are untouched");
    check(!fs.existsSync(path.join(PROJECTS, "synths", "poly1", ".asdt", "staging")) && !fs.existsSync(path.join(PROJECTS, "synths", "poly1", ".asdt", "old")), "no staging/old left");
    const firstBackup = r.json.backup;
    r = await api("GET", "/api/backup?path=" + P + "&backup=" + firstBackup);
    check(r.status === 200 && r.json.design === "[1]", "the design of a backup can be read (" + (r.json && r.json.design) + ")");
    for (let k = 3; k <= 6; k++) await api("POST", "/api/export", { path: P, files: [{ name: "Main.h", contents: "// v" + k + "\n" }] });
    r = await api("GET", "/api/backups?path=" + P);
    const kept = await Promise.all(r.json.map(async b => (await zip.read(fs.readFileSync(path.join(PROJECTS, "synths", "poly1", ".asdt", "backup", b.name)))).readText("Main.h")));
    check(r.json.length === 3 && kept.join("") === "// v5\n// v4\n// v3\n", "only the newest 3 backups are kept (--backups 3), newest first: " + kept.join(" ").replace(/\n/g, ""));
    r = await api("POST", "/api/restore", { path: P, backup: r.json[r.json.length - 1].name });
    check(r.status === 200 && r.json.result === "written" && r.json.backup, "restore a backup, which backs up what was there first");
    for (const [bad, why] of [[[{ name: "x.ino", contents: "" }], ".ino"], [[{ name: "run.bat", contents: "" }], ".bat"], [[{ name: "../x.h", contents: "" }], "../"],
                              [[{ name: "A.h", contents: "" }, { name: "a.h", contents: "" }], "A.h and a.h"], [[{ name: "con.h", contents: "" }], "con.h"]]) {
        r = await api("POST", "/api/export", { path: P, files: bad });
        check(r.status >= 400 && r.status < 500, "export with " + why + " refused (" + r.status + " " + (r.json && r.json.code) + ")");
    }
    r = await api("POST", "/api/restore", { path: P, backup: "../../x.zip" });
    check(r.status === 400, "a bad backup name is refused (" + r.status + ")");

    console.log("== native Faust objects");
    const faustInfo = info.json.faust;
    if (!faustInfo) console.log("  (faust not found, skipping)");
    else {
        const lp = 'import("stdfaust.lib");\ncutoff = hslider("cutoff[unit:Hz][scale:log]", 1000, 20, 20000, 1);\n' +
                   'q = hslider("q", 0.707, 0.1, 10, 0.01);\ng1 = vslider("v/gain", 0.5, 0, 1, 0.01);\ng2 = vslider("w/gain", 0.5, 0, 1, 0.01);\n' +
                   'process = fi.resonlp(cutoff, q, 1) * g1 * g2;\n';
        const osc = 'import("stdfaust.lib");\nfreq = hslider("freq", 440, 20, 2000, 1);\nupdate = button("update");\nprocess = os.osc(freq) * (0.5 + 0.1 * update) <: _, _;\n';
        r = await api("POST", "/api/faust/native", { items: [{ className: "Faust_lp", code: lp }, { className: "Faust_osc", code: osc }] });
        check(r.status === 200, "POST /api/faust/native " + (r.status !== 200 ? r.text : ""));
        if (r.status === 200) {
            const [a, b] = r.json.results;
            check(a.inputs === 1 && a.outputs === 1 && a.params.map(p => p.name).join() === "cutoff,q,v_gain,w_gain", "lp: 1 in, 1 out, setters " + a.params.map(p => p.name).join(", "));
            check(b.inputs === 0 && b.outputs === 2 && b.params.map(p => p.name).join() === "freq,update_", "osc: 0 in, 2 out, setters " + b.params.map(p => p.name).join(", ") + " (update is AudioStream's)");
            const h = a.files.find(f => f.name === "faust/Faust_lp.h").contents, cpp = a.files.find(f => f.name === "faust/Faust_lp.cpp").contents;
            check(/void cutoff\(float value\);/.test(h) && /friend class Faust_lp;/.test(cpp), "the setters and the friend class are there");
            const ocpp = b.files.find(f => f.name === "faust/Faust_osc.cpp").contents;
            check(/static ASDT_FAUST_BIG_TABLE float ftbl0Faust_osc_dspSIG0\[65536\];/.test(ocpp), "os.osc's 256 KB sine table goes to RAM2");
            check(a.files.find(f => f.name === "faust/asdt_faust.h").contents.includes("asdtFaustAlloc"), "faust/asdt_faust.h is included");

            r = await api("POST", "/api/faust/native", { items: [{ className: "Faust_bad", code: "process = nothere;\n" }] });
            check(r.status === 422 && /nothere|undefined/.test(r.json.error), "a Faust error comes back (" + r.status + ")");
            r = await api("POST", "/api/faust/native", { items: [{ className: "bad name", code: lp }] });
            check(r.status === 422, "a bad class name is refused");

            if (BUILD) {
                console.log("== build a Teensy 4.1 project with them (PlatformIO, no upload)");
                const pio = [path.join(os.homedir(), ".platformio", "penv", "Scripts", "pio.exe"), path.join(os.homedir(), ".platformio", "penv", "bin", "pio"), "pio"]
                    .find(p => p === "pio" || fs.existsSync(p));
                await api("POST", "/api/projects", { path: "build-test", template: "platformio" });
                const main = '#pragma once\n#include <Audio.h>\n#include "faust/Faust_lp.h"\n#include "faust/Faust_osc.h"\n' +
                    "Faust_osc osc;\nFaust_lp lp;\nAudioOutputI2S out;\nAudioConnection c1(osc, 0, lp, 0);\nAudioConnection c2(lp, 0, out, 0);\nAudioConnection c3(osc, 1, out, 1);\n" +
                    "static inline void designSetup() { lp.cutoff(500); lp.q(2); osc.freq(220); osc.setParam(0, 330); }\n";
                const files = [...a.files, ...b.files.filter(f => f.name !== "faust/asdt_faust.h"),
                    { name: "Main.h", contents: main }, { name: "asdt.h", contents: '#pragma once\n#include "Main.h"\n' }];
                r = await api("POST", "/api/export", { path: "build-test", files });
                check(r.json.result === "written", "exported into build-test/src/asdt/");
                const mainCpp = path.join(PROJECTS, "build-test", "src", "main.cpp");
                fs.writeFileSync(mainCpp, fs.readFileSync(mainCpp, "utf8").replace("AudioMemory(40);", "AudioMemory(40);\n    designSetup();"));
                const b0 = Date.now();
                const res = spawnSync(pio, ["run", "-d", path.join(PROJECTS, "build-test")], { encoding: "utf8", timeout: 600000 });
                const out = (res.stdout || "") + (res.stderr || "");
                check(res.status === 0, "pio run: " + (res.status === 0 ? "built in " + Math.round((Date.now() - b0) / 1000) + " s" : "FAILED\n" + out.split("\n").filter(l => /error|Error/.test(l)).slice(0, 20).join("\n")));
                const mem = out.split("\n").filter(l => /FLASH:|RAM1:|RAM2:/.test(l)).map(l => l.trim()).join(" | ");
                if (mem) console.log("       " + mem);
            }
        }
    }

    server.kill();
    if (failures) console.log("\nbackend log:\n" + serverLog);
    try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* a junction on Windows: removed with the folder */ }
    console.log(failures ? `\n${failures} FAILED` : "\nall passed");
    process.exit(failures ? 1 : 0);
})().catch(e => { console.log(e); server.kill(); process.exit(1); });
