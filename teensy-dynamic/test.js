#!/usr/bin/env node
// Tests a built Teensy Dynamic Audio package the way a user gets it, before it is published:
// installs it with arduino-cli from its package index, as the Boards Manager does, and compiles
// the test sketches from config.json (OSCAudio's examples) for the test board.
//
//   node teensy-dynamic/test.js [--out DIR] [--work DIR] [--arduino-cli PATH] [--keep]
//
// - The archive isn't published yet, so the index is served from DIR by a small local web server,
//   with the archive URL pointing to it. Everything else in the index stays as it will be published.
// - arduino-cli runs with its own folders (--work, default <temp>/teensy-dynamic-test), the builds
//   included, so an installed Arduino IDE, its packages and libraries are never used or changed.
//   On Windows keep --work short: gcc fails on paths over 260 characters ("No such file" for a
//   header that is there).
// - PJRC's index is added too, for the compiler and the tools, as a user must do.
// - It checks that the core and the libraries swapped in by config.json (Audio, OSCAudio, OSC)
//   used by the compile are the package's own, not other copies.
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const os = require("os");
const { spawn } = require("child_process");

const HERE = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));

function arg(name, def) {
    const i = process.argv.indexOf("--" + name);
    return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
const OUT = path.resolve(arg("out", path.join(HERE, "out")));
const CLI = arg("arduino-cli", process.env.ARDUINO_CLI || "arduino-cli");
const KEEP = process.argv.includes("--keep");   // keep the arduino-cli folder (it has the toolchain: a second run is faster)

function run(args, cfg) {
    return new Promise(function (resolve) {
        const p = spawn(CLI, ["--config-file", cfg].concat(args), { stdio: ["ignore", "pipe", "pipe"] });
        let out = "", err = "";
        p.stdout.on("data", d => { out += d; });
        p.stderr.on("data", d => { err += d; });
        p.on("error", e => resolve({ code: -1, out, err: err + e.message }));
        p.on("close", code => resolve({ code, out, err }));
    });
}

async function main() {
    const build = JSON.parse(fs.readFileSync(path.join(OUT, "build.json"), "utf8"));
    const index = JSON.parse(fs.readFileSync(path.join(OUT, config.indexFile), "utf8"));
    const archive = path.join(OUT, build.archive);
    if (!fs.existsSync(archive)) throw new Error("no " + archive + ": run build.js first");

    // the local server: the test index (archive URL changed to it) and the archive
    const server = http.createServer(function (req, res) {
        if (req.url === "/" + config.indexFile) { res.writeHead(200, { "Content-Type": "application/json" }); res.end(server.testIndex); return; }
        if (req.url === "/" + build.archive) { res.writeHead(200, { "Content-Length": fs.statSync(archive).size }); fs.createReadStream(archive).pipe(res); return; }
        res.writeHead(404); res.end();
    });
    await new Promise(r => server.listen(0, "127.0.0.1", r));
    const base = "http://127.0.0.1:" + server.address().port;
    const test = JSON.parse(JSON.stringify(index));
    const entry = test.packages.find(p => p.name === config.package.name).platforms.find(p => p.version === build.version);
    entry.url = base + "/" + build.archive;
    server.testIndex = JSON.stringify(test);

    // arduino-cli with its own folders
    const work = path.resolve(arg("work", path.join(os.tmpdir(), "teensy-dynamic-test")));
    // --keep keeps PJRC's compiler and tools, never the package itself: an archive rebuilt with the
    // same version would otherwise not be installed again
    if (!KEEP) fs.rmSync(work, { recursive: true, force: true });
    else fs.rmSync(path.join(work, "data", "packages", config.package.name), { recursive: true, force: true });
    fs.mkdirSync(work, { recursive: true });
    const cfg = path.join(work, "arduino-cli.yaml");
    const q = p => JSON.stringify(p.split(path.sep).join("/"));
    fs.writeFileSync(cfg, [
        "directories:",
        "  data: " + q(path.join(work, "data")),
        "  downloads: " + q(path.join(work, "downloads")),
        "  user: " + q(path.join(work, "user")),
        "board_manager:",
        "  additional_urls:",
        "    - " + config.pjrcIndex,
        "    - " + base + "/" + config.indexFile,
        ""].join("\n"));

    let failed = false;
    const step = async function (title, args) {
        process.stdout.write("  " + title + " ... ");
        const r = await run(args, cfg);
        console.log(r.code === 0 ? "ok" : "FAILED");
        if (r.code !== 0) {
            failed = true;
            // with --format json the compiler's messages are in compiler_err
            let text = r.out + r.err;
            try { const j = JSON.parse(r.out); text = (j.compiler_err || "") + "\n" + (j.error || ""); } catch (e) { }
            console.log(text.split("\n").filter(l => l.trim()).slice(-30).map(l => "    " + l).join("\n"));
        }
        return r;
    };

    try {
        console.log("Testing " + build.archive + " with " + CLI);
        await step("update the indexes", ["core", "update-index"]);
        if (failed) return;
        await step("install " + config.package.name + ":avr@" + build.version, ["core", "install", config.package.name + ":avr@" + build.version]);
        if (failed) return;

        const platformDir = path.join(work, "data", "packages", config.package.name, "hardware", entry.architecture, build.version);
        const fqbn = config.package.name + ":" + entry.architecture + ":" + config.testBoard;
        for (const rel of config.testSketches) {
            const sketch = path.join(HERE, ...rel.split("/"));   // relative to teensy-dynamic/
            const r = await step("compile " + path.basename(sketch) + " for " + fqbn, ["compile", "--fqbn", fqbn, "--build-path", path.join(work, "build", path.basename(sketch)), "--format", "json", sketch]);
            if (r.code !== 0) continue;

            // where the core and the libraries came from: all must be in the package
            const j = JSON.parse(r.out);
            const res = j.builder_result || j;
            const inPlatform = dir => path.resolve(dir).toLowerCase().startsWith(platformDir.toLowerCase());
            const platform = res.build_platform || {};
            const libs = res.used_libraries || [];
            const problems = [];
            if (platform.install_dir && !inPlatform(platform.install_dir)) problems.push("the core is from " + platform.install_dir);
            const swapped = Object.values(config.sources).filter(s => s.into.startsWith("libraries/")).map(s => s.into.split("/")[1]);
            for (const name of swapped) {
                const lib = libs.find(l => l.name === name);
                if (!lib) problems.push(name + " was not used");
                else if (!inPlatform(lib.install_dir)) problems.push(name + " is from " + lib.install_dir);
            }
            const size = (res.executable_sections_size || []).map(s => s.name + " " + s.size).join(", ");
            if (problems.length) { failed = true; console.log("    FAILED: " + problems.join("; ")); }
            else console.log("    the core and " + swapped.join(", ") + " from the package" + (size ? "; " + size : ""));
        }
    } finally {
        server.close();
    }
    if (failed) process.exitCode = 1;
    else console.log("All tests passed");
}

main().catch(e => { console.error("test failed: " + e.message); process.exit(1); });
