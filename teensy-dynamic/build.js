#!/usr/bin/env node
// Builds the unofficial "Teensy Dynamic Audio" Boards Manager package:
// PJRC's official Teensyduino platform with h4yn0nnym0u5e's Dynamic Audio forks of the core
// and the Audio library swapped in, plus OSCAudio.
//
//   node teensy-dynamic/build.js [--td 1.62.0] [--rev N] [--out DIR] [--release-repo owner/repo]
//
// Steps:
//   1. read PJRC's package index and download the official platform archive for --td,
//      checked against the SHA-256 and size in the index;
//   2. download each source in config.json (a GitHub repository at a branch) as a tarball,
//      pinned to the commit the branch points to now;
//   3. swap the sources into the platform (cores: only the folders the official core has;
//      a library: the whole folder), rename the platform and the boards;
//   4. write the archive (.tar.zst), the package index with the new version added,
//      and release notes that list the exact commits.
//
// The compiler and the tools are not in the package: the index refers to PJRC's own
// (packager "teensy"), so Arduino installs them from PJRC's index, like for the official package.
//
// Needs Node 22 or later (zstd is built into zlib from 22.15). No npm packages.
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { readTar, writeTar } = require("./tar.js");

const HERE = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));

function arg(name, def) {
    const i = process.argv.indexOf("--" + name);
    return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}

const TD = arg("td", config.teensyduino);
const OUT = path.resolve(arg("out", path.join(HERE, "out")));
const RELEASE_REPO = arg("release-repo", "manicken/manicken.github.io");
const INDEX_IN = path.resolve(arg("index", path.join(HERE, config.indexFile)));   // the published index, the new version is added to it

if (typeof zlib.zstdDecompressSync !== "function") {
    console.error("Node " + process.version + " has no zstd: Node 22.15 or later is needed");
    process.exit(1);
}

// ------------------------------------------------------------------ downloads

function githubHeaders() {
    const h = { "User-Agent": "teensy-dynamic-build" };
    if (process.env.GITHUB_TOKEN) h.Authorization = "Bearer " + process.env.GITHUB_TOKEN;   // in GitHub Actions: a higher API rate limit
    return h;
}

async function download(url, headers) {
    const res = await fetch(url, { headers: headers || { "User-Agent": "teensy-dynamic-build" }, redirect: "follow" });
    if (!res.ok) throw new Error("download failed: " + res.status + " " + url);
    return Buffer.from(await res.arrayBuffer());
}

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

/** The commit a branch (or tag, or sha) points to: {sha, date (seconds)}. */
async function resolveRef(repo, ref) {
    const j = JSON.parse((await download("https://api.github.com/repos/" + repo + "/commits/" + encodeURIComponent(ref), githubHeaders())).toString("utf8"));
    if (!j.sha) throw new Error("no commit for " + repo + " " + ref);
    return { sha: j.sha, date: Math.floor(Date.parse(j.commit.committer.date) / 1000), message: j.commit.message.split("\n")[0] };
}

/** The files of a repository at a commit, with the "<repo>-<sha>/" root folder of GitHub's tarball removed. */
async function repoFiles(repo, sha) {
    const tgz = await download("https://codeload.github.com/" + repo + "/tar.gz/" + sha, githubHeaders());
    const entries = readTar(zlib.gunzipSync(tgz));
    const out = [];
    for (const e of entries) {
        const i = e.name.indexOf("/");
        if (i < 0) continue;                       // the root folder itself
        const name = e.name.slice(i + 1);
        if (name === "") continue;
        if (e.type === "dir") continue;            // folders are written again from the file paths
        out.push(Object.assign({}, e, { name }));
    }
    return out;
}

// ------------------------------------------------------------------ the build

function topName(name) { return name.split("/")[0]; }

/** The GitHub Pages address of a repository's files: <owner>.github.io/ for the repository named so, else <owner>.github.io/<repo>/. */
function pagesUrl(repo) {
    const [owner, name] = repo.split("/");
    const host = "https://" + owner.toLowerCase() + ".github.io/";
    return name.toLowerCase() === owner.toLowerCase() + ".github.io" ? host : host + name + "/";
}

/** Repository files that don't belong in an installed library or core: .git*, .github/, CI files. */
function isRepoOnly(name) {
    return name.split("/").some(seg => seg.startsWith("."));
}

async function main() {
    console.log("Teensy Dynamic Audio package, Teensyduino " + TD);

    // 1. PJRC's index and the official platform
    const pjrcIndex = JSON.parse((await download(config.pjrcIndex)).toString("utf8"));
    const pjrc = pjrcIndex.packages.find(p => p.name === "teensy");
    const official = pjrc && pjrc.platforms.find(p => p.version === TD);
    if (!official) throw new Error("Teensyduino " + TD + " is not in PJRC's index");
    console.log("  official platform: " + official.url);
    const officialZst = await download(official.url);
    const want = official.checksum.replace(/^SHA-256:/, "").toLowerCase();
    if (officialZst.length !== Number(official.size) || sha256(officialZst) !== want)
        throw new Error("the official archive doesn't match PJRC's index (size or SHA-256)");
    let files = readTar(zlib.zstdDecompressSync(officialZst));

    // every path of the official package starts with one root folder ("avr")
    const root = topName(files[0].name);
    if (!files.every(e => topName(e.name) === root)) throw new Error("the official archive has more than one root folder");
    files = files.filter(e => e.type !== "dir").map(e => Object.assign({}, e, { name: e.name.slice(root.length + 1) }));

    // 2. + 3. the sources
    const used = [];
    let newest = 0;
    for (const [key, src] of Object.entries(config.sources)) {
        const c = await resolveRef(src.repo, src.ref);
        newest = Math.max(newest, c.date);
        const fork = (await repoFiles(src.repo, c.sha)).filter(e => !isRepoOnly(e.name));
        const into = src.into.replace(/\/$/, "");
        const inside = e => e.name === into || e.name.startsWith(into + "/");
        const before = files.filter(inside);

        let added;
        if (into === "cores") {
            // the cores repository also has things the platform doesn't (Makefiles for other boards, tools ...):
            // take only the top folders/files the official cores folder has, and all of them must be there
            const wanted = new Set(before.map(e => topName(e.name.slice(into.length + 1))));
            const have = new Set(fork.map(e => topName(e.name)));
            const missing = [...wanted].filter(n => !have.has(n));
            if (missing.length) throw new Error(src.repo + " has no " + missing.join(", ") + " (the official cores folder has)");
            added = fork.filter(e => wanted.has(topName(e.name)));
        } else {
            added = fork;
            if (before.length === 0) console.log("  " + key + ": new in the platform");
        }
        const beforeNames = new Map(before.map(e => [e.name.slice(into.length + 1), e]));
        let changed = 0, isNew = 0;
        for (const e of added) {
            const o = beforeNames.get(e.name);
            if (!o) isNew++;
            else if (!o.data.equals(e.data)) changed++;
            beforeNames.delete(e.name);
        }
        console.log("  " + key + ": " + src.repo + " " + src.ref + " @ " + c.sha.slice(0, 10) + " (" + c.message + ")" +
            "\n      " + added.length + " files: " + changed + " changed, " + isNew + " new, " + beforeNames.size + " removed from the official one");

        files = files.filter(e => !inside(e)).concat(added.map(e => Object.assign({}, e, { name: into + "/" + e.name })));
        used.push({ key, repo: src.repo, ref: src.ref, sha: c.sha, message: c.message, into });
    }

    // the platform's and the boards' names, so it is never mistaken for the official one
    const edit = (name, fn) => {
        const e = files.find(f => f.name === name);
        if (!e) throw new Error("no " + name + " in the platform");
        e.data = Buffer.from(fn(e.data.toString("utf8")), "utf8");
    };
    edit("platform.txt", s => {
        if (!/^name=.*$/m.test(s)) throw new Error("platform.txt has no name=");
        return s.replace(/^name=.*$/m, "name=" + config.package.platformName);
    });
    const boardNames = [];
    edit("boards.txt", s => s.replace(/^(\w+)\.name=(.*?)\s*$/gm, function (m, id, name) {
        boardNames.push(name + config.package.boardSuffix);
        return id + ".name=" + name + config.package.boardSuffix;
    }));

    // the version: <Teensyduino>-dyn.<n>, n one more than the last build for this Teensyduino
    const index = fs.existsSync(INDEX_IN) ? JSON.parse(fs.readFileSync(INDEX_IN, "utf8")) : { packages: [] };
    let pkg = index.packages.find(p => p.name === config.package.name);
    if (!pkg) { pkg = { name: config.package.name }; index.packages.push(pkg); }
    Object.assign(pkg, {
        maintainer: config.package.maintainer,
        websiteURL: config.package.websiteURL,
        help: { online: "https://forum.pjrc.com/" },
        platforms: pkg.platforms || [],
        tools: []                                   // all tools are PJRC's, from PJRC's index
    });
    let rev = Number(arg("rev", 0));
    if (!rev) {
        rev = 1;
        for (const p of pkg.platforms) {
            const m = new RegExp("^" + TD.replace(/\./g, "\\.") + "-dyn\\.(\\d+)$").exec(p.version);
            if (m) rev = Math.max(rev, Number(m[1]) + 1);
        }
    }
    const version = TD + "-dyn." + rev;
    const tag = "teensy-dynamic-" + version;

    // a file in the platform that says what it is made of
    const sourcesText = "Teensy Dynamic Audio " + version + " (unofficial, not from PJRC)\n\n" +
        "PJRC's Teensyduino " + TD + " platform (" + official.url + ", SHA-256 " + want + ")\nwith these swapped in:\n\n" +
        used.map(u => "  " + u.into + ": https://github.com/" + u.repo + " " + u.ref + " @ " + u.sha + "\n      " + u.message).join("\n") +
        "\n\nBuilt by teensy-dynamic/build.js in https://github.com/" + RELEASE_REPO + "\n";
    files = files.filter(e => e.name !== "DYNAMIC_AUDIO.txt");
    files.push({ name: "DYNAMIC_AUDIO.txt", type: "file", mode: 0o644, data: Buffer.from(sourcesText, "utf8") });

    // 4. the archive: the same root folder as PJRC's, a folder entry for every folder, sorted, one fixed time,
    //    so the same sources give the same archive
    const dirs = new Set();
    for (const e of files) {
        const segs = e.name.split("/");
        for (let i = 1; i < segs.length; i++) dirs.add(segs.slice(0, i).join("/"));
    }
    const entries = [{ name: root, type: "dir", mode: 0o755 }]
        .concat([...dirs].map(d => ({ name: root + "/" + d, type: "dir", mode: 0o755 })))
        .concat(files.map(e => Object.assign({}, e, { name: root + "/" + e.name })))
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const tar = writeTar(entries, newest);
    const zst = zlib.zstdCompressSync(tar, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } });
    const archiveName = tag + ".tar.zst";

    // the index: PJRC's entry with our name, archive and boards; the same tool, discovery and monitor dependencies
    const entry = {
        name: config.package.platformName,
        architecture: official.architecture,
        version,
        category: "Contributed",
        help: { online: "https://github.com/" + RELEASE_REPO + "/releases/tag/" + tag },
        url: "https://github.com/" + RELEASE_REPO + "/releases/download/" + tag + "/" + archiveName,
        archiveFileName: archiveName,
        checksum: "SHA-256:" + sha256(zst),
        size: String(zst.length),
        boards: boardNames.map(name => ({ name })),
        toolsDependencies: official.toolsDependencies,
        discoveryDependencies: official.discoveryDependencies,
        monitorDependencies: official.monitorDependencies
    };
    pkg.platforms = pkg.platforms.filter(p => p.version !== version).concat([entry]);

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, archiveName), zst);
    fs.writeFileSync(path.join(OUT, config.indexFile), JSON.stringify(index, null, 2) + "\n");
    fs.writeFileSync(path.join(OUT, "release-notes.md"),
        "Unofficial Boards Manager package: PJRC's Teensyduino " + TD + " with the Dynamic Audio forks by h4yn0nnym0u5e (Jonathan Oakley), OSCAudio, and the OSC library version OSCAudio needs.\n\n" +
        "Add this URL in Arduino IDE → Preferences → Additional boards manager URLs (PJRC's URL must be there too, for the compiler and tools):\n\n" +
        "    " + pagesUrl(RELEASE_REPO) + "teensy-dynamic/" + config.indexFile + "\n\n" +
        "It installs beside the official Teensy package: choose a board marked \"" + config.package.boardSuffix.trim() + "\".\n\n" +
        "Sources:\n\n" + used.map(u => "- `" + u.into + "`: [" + u.repo + "](https://github.com/" + u.repo + "/tree/" + u.sha + ") " + u.ref + " @ `" + u.sha.slice(0, 10) + "` " + u.message).join("\n") + "\n");
    fs.writeFileSync(path.join(OUT, "build.json"), JSON.stringify({ version, tag, archive: archiveName, sources: used }, null, 2) + "\n");

    console.log("  " + archiveName + ": " + (zst.length / 1e6).toFixed(1) + " MB (" + entries.length + " entries)");
    console.log("  written to " + OUT);

    // for GitHub Actions: the version and the tag as step outputs
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, "version=" + version + "\ntag=" + tag + "\narchive=" + archiveName + "\n");
}

main().catch(e => { console.error("build failed: " + e.message); process.exit(1); });
