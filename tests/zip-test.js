// Tests for red/zip.js (RED.zip).   node tests/zip-test.js
//
// Round trips, zips made by another implementation (Python's zipfile, if python is installed, else Node's zlib
// by hand), zips read by Python, and broken zips that must be refused: bad CRC, cut off, a false size (zip bomb)
// and a too big total.
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

global.RED = {};
const zip = require(path.join(__dirname, "..", "red", "zip.js"));

let failures = 0;
function check(cond, msg) { if (cond) console.log("  ok   " + msg); else { failures++; console.log("  FAIL " + msg); } }
async function rejects(promiseOrFn, re, msg) {
    try { await (typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn); check(false, msg + " (no error)"); }
    catch (e) { check(re.test(e.message), msg + " -> " + e.message); }
}
const eq = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

const python = ["python", "python3", "py"].find(p => spawnSync(p, ["-c", "import zipfile"], { encoding: "utf8" }).status === 0);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "asdt-zip-test-"));

(async () => {
    // ---- round trip
    const big = "AudioConnection patchCord(osc, 0, mixer, 0);\n".repeat(2000);
    const bin = new Uint8Array(require("crypto").randomBytes(1000));  // random: doesn't compress
    const files = [
        { name: "MyProject/design.h", data: big },
        { name: "MyProject\\sub\\noise.bin", data: bin },             // "\" must become "/"
        { name: "åäö €.txt", data: "UTF-8 name" },
        { name: "empty.txt", data: "" },
        { name: "blob.txt", data: new Blob(["from a Blob"]) },
        { name: "buffer.txt", data: Buffer.from("from a Buffer") },
    ];
    const z = await zip.write(files);
    check(z.length < big.length / 10, "compressed: " + z.length + " bytes for " + big.length + " bytes of text");
    const r = zip.read(z);
    check(JSON.stringify(r.names()) === JSON.stringify(["MyProject/design.h", "MyProject/sub/noise.bin", "åäö €.txt", "empty.txt", "blob.txt", "buffer.txt"]), "names: " + r.names().join(", "));
    check(await r.readText("MyProject/design.h") === big, "text round trip (deflate)");
    check(r.entries[1].method === 0 && eq(await r.read("MyProject/sub/noise.bin"), bin), "binary that doesn't shrink is stored, round trip");
    check(await r.readText("åäö €.txt") === "UTF-8 name" && await r.readText("empty.txt") === "", "UTF-8 name and empty file");
    check(await r.readText("blob.txt") === "from a Blob" && await r.readText("buffer.txt") === "from a Buffer", "Blob and Buffer data");
    const stored = zip.read(await zip.write(files, { compress: false }));
    check(stored.entries.every(e => e.method === 0) && await stored.readText("MyProject/design.h") === big, "compress: false stores everything");
    const all = await zip.readAll(z);
    check(all.length === 6 && eq(all[1].data, bin), "readAll");
    const blob = await zip.writeBlob(files);
    check(blob.type === "application/zip" && blob.size === z.length, "writeBlob");
    check(zip.crc32(Buffer.from("123456789")) === 0xcbf43926, "crc32 check value");

    // ---- another implementation reads ours, and we read its
    if (python) {
        const ours = path.join(TMP, "ours.zip");
        fs.writeFileSync(ours, z);
        const py = spawnSync(python, ["-c", `
import zipfile, sys, json
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
print(json.dumps({n: len(z.read(n)) for n in z.namelist()}))`, ours], { encoding: "utf8" });
        const sizes = py.status === 0 ? JSON.parse(py.stdout) : {};
        check(py.status === 0 && sizes["MyProject/design.h"] === big.length && sizes["åäö €.txt"] === 10, "Python's zipfile reads our zip and its CRCs " + (py.stderr || ""));

        const theirs = path.join(TMP, "theirs.zip");
        const mk = spawnSync(python, ["-c", `
import zipfile, sys
with zipfile.ZipFile(sys.argv[1], "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("dir/", "")
    z.writestr("dir/a.txt", "hello " * 1000)
    z.writestr(zipfile.ZipInfo("stored.txt"), "stored")
    z.comment = b"a zip comment"`, theirs], { encoding: "utf8" });
        check(mk.status === 0, "Python made a zip " + (mk.stderr || ""));
        const t = zip.read(fs.readFileSync(theirs));
        check(JSON.stringify(t.names()) === '["dir/a.txt","stored.txt"]', "we read Python's zip (folder entry skipped, comment at the end): " + t.names().join(", "));
        check(await t.readText("dir/a.txt") === "hello ".repeat(1000) && await t.readText("stored.txt") === "stored", "its contents");
    } else console.log("  (python not found, skipping the Python checks)");

    // ---- broken zips
    const one = Buffer.from(await zip.write([{ name: "a.txt", data: "x".repeat(10000) }]));
    const nameLen = 5, dataAt = 30 + nameLen;
    const csize = one.readUInt32LE(18);

    const badCrc = Buffer.from(one); badCrc.writeUInt32LE(one.readUInt32LE(dataAt + csize + 16) ^ 1, dataAt + csize + 16);   // central crc
    await rejects(zip.read(badCrc).read("a.txt"), /CRC/, "a wrong CRC is refused");

    await rejects(() => zip.read(one.subarray(0, one.length - 30)), /not a zip|central/, "a cut off zip is refused");
    await rejects(() => zip.read(Buffer.from("hello, not a zip at all, just some text here")), /not a zip/, "not a zip");

    // a zip bomb: the directory says 10 bytes, the data inflates to 10 MB
    const bombRaw = Buffer.alloc(10 * 1024 * 1024);
    const bomb = Buffer.from(await zip.write([{ name: "bomb", data: bombRaw }]));
    const bombCd = bomb.readUInt32LE(bomb.length - 22 + 16);
    bomb.writeUInt32LE(10, 22); bomb.writeUInt32LE(10, bombCd + 24);    // uncompressed size, local and central
    await rejects(zip.read(bomb).read("bomb"), /more than its stated size/, "a false size (zip bomb) stops at the stated size");
    await rejects(zip.readAll(await zip.write([{ name: "big", data: bombRaw }]), { maxTotal: 1024 * 1024 }), /too big/, "readAll maxTotal");

    fs.rmSync(TMP, { recursive: true, force: true });
    console.log(failures ? `\n${failures} FAILED` : "\nall passed");
    process.exit(failures ? 1 : 0);
})().catch(e => { console.log(e); process.exit(1); });
