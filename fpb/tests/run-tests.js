// FPB test runner (Node).
//
//   node fpb/tests/run-tests.js [--no-cpp] [--no-faust] [--keep]
//
// For every faust/<name>.fbc:
//   ref   : the FBC reference interpreter (red/fpb/fpb-fbc.js), float32
//   vm    : the compiled FPB in the JS verifier VM (red/fpb/fpb-vm.js)
//   host  : the compiled FPB in the firmware code (FPB.cpp + FPB_ops.cpp) built for the PC with g++
//   faust : the C++ that Faust generated (faust/<name>.cpp), if present
// all with the same input signal and the same parameter changes, and compares them.
// Then a set of broken containers must be rejected by the JS decoder and the C loader with the same
// error, section and record index.
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const LIB = path.join(ROOT, "fpb", "teensy", "FPB", "src");
const BUILD = path.join(__dirname, "build");
const args = process.argv.slice(2);
const useCpp = !args.includes("--no-cpp");
const useFaust = !args.includes("--no-faust");

global.RED = {};
["fpb-core", "fpb-fbc", "fpb-format", "fpb-vm", "fpb-compile-fbc"].forEach(f => require(path.join(ROOT, "red", "fpb", f + ".js")));
const core = RED.fpb.core;
const table = core.parseOpList(fs.readFileSync(path.join(LIB, "FPB_oplist.h"), "utf8"));

fs.mkdirSync(BUILD, { recursive: true });
let failures = 0;
function fail(msg) { failures++; console.log("  FAIL " + msg); }
function ok(msg) { console.log("  ok   " + msg); }

// ------------------------------------------------------------------ host builds

const WIN = process.platform === "win32";
const EXE = WIN ? ".exe" : "";
let gpp = null, gppEnv = process.env;
if (useCpp) {
    const w = spawnSync(WIN ? "where" : "which", ["g++"], { encoding: "utf8" });
    const exe = (w.stdout || "").split(/\r?\n/)[0].trim();
    if (w.status === 0 && exe) {
        gpp = exe;
        // put the compiler's own bin dir first: other MinGW copies on PATH (e.g. Git's) have DLLs that break cc1plus
        const sep = WIN ? ";" : ":";
        gppEnv = Object.assign({}, process.env, { PATH: path.dirname(exe) + sep + process.env.PATH });
        if (spawnSync(gpp, ["--version"], { env: gppEnv }).status !== 0) gpp = null;
    }
    if (!gpp) console.log("g++ not found: the host C++ checks are skipped");
}
function build(out, sources, defines) {
    const r = spawnSync(gpp, ["-std=gnu++17", "-O2", "-Wall", "-Wextra", ...(WIN ? ["-static"] : []), ...(defines || []), ...sources, "-o", out],
        { encoding: "utf8", env: gppEnv });
    if (r.status !== 0) { console.log(r.stderr); throw new Error("build failed: " + out); }
    const warn = (r.stderr || "").split("\n").filter(l => /warning:/.test(l));
    if (warn.length) console.log(warn.slice(0, 5).join("\n"));
}
const hostRun = path.join(BUILD, "host_run" + EXE);
if (gpp) {
    build(hostRun, [path.join(__dirname, "host", "host_run.cpp"), path.join(LIB, "FPB.cpp"), path.join(LIB, "FPB_ops.cpp")]);
    console.log("built " + path.relative(ROOT, hostRun));
}

// ------------------------------------------------------------------ signals

const N = 128, BLOCKS = 120, SR = 44117;
function makeInput(nIn) {
    const ins = [];
    let seed = 12345;
    for (let c = 0; c < nIn; c++) {
        const x = new Float32Array(N * BLOCKS);
        for (let k = 0; k < x.length; k++) {
            seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
            const noise = (seed / 4294967296) - 0.5;
            x[k] = 0.4 * Math.sin(2 * Math.PI * k * 220 / SR) + 0.2 * Math.sin(2 * Math.PI * k * 1375 / SR + c) + 0.05 * noise;
        }
        ins.push(x);
    }
    return ins;
}
function makeSchedule(params) {
    const s = [];
    params.forEach(p => {
        s.push({ block: 40, index: p.index, value: Math.fround(p.min + (p.max - p.min) * 0.1) });
        s.push({ block: 80, index: p.index, value: Math.fround(p.min + (p.max - p.min) * 0.6) });
    });
    return s;
}
function runBlocks(nIn, nOut, ins, schedule, setParam, processBlock) {
    const outs = [];
    for (let c = 0; c < nOut; c++) outs.push(new Float32Array(N * BLOCKS));
    for (let b = 0; b < BLOCKS; b++) {
        schedule.filter(q => q.block === b).forEach(q => setParam(q.index, q.value));
        processBlock(ins.map(x => x.subarray(b * N, (b + 1) * N)), outs.map(y => y.subarray(b * N, (b + 1) * N)));
    }
    return outs;
}
function compare(a, b) {
    let max = 0, at = -1, peak = 0;
    for (let c = 0; c < a.length; c++)
        for (let k = 0; k < a[c].length; k++) {
            const d = Math.abs(a[c][k] - b[c][k]);
            if (!(d <= max)) { max = d; at = k; }
            peak = Math.max(peak, Math.abs(a[c][k]));
        }
    return { max, at, peak };
}
function writePlanar(file, chans) {
    const buf = Buffer.alloc(chans.reduce((n, x) => n + x.length * 4, 0));
    let o = 0;
    chans.forEach(x => { for (let k = 0; k < x.length; k++) { buf.writeFloatLE(x[k], o); o += 4; } });
    fs.writeFileSync(file, buf);
}
function readPlanar(file, nCh) {
    const buf = fs.readFileSync(file), len = buf.length / 4 / nCh, out = [];
    for (let c = 0; c < nCh; c++) {
        const x = new Float32Array(len);
        for (let k = 0; k < len; k++) x[k] = buf.readFloatLE((c * len + k) * 4);
        out.push(x);
    }
    return out;
}

// ------------------------------------------------------------------ patches

const FAUST_DIR = path.join(__dirname, "faust");
const fbcFiles = fs.readdirSync(FAUST_DIR).filter(f => f.endsWith(".fbc")).sort();
for (const file of fbcFiles) {
    const name = path.basename(file, ".fbc");
    console.log("\n== " + name);
    const model = RED.fpb.fbc.parse(fs.readFileSync(path.join(FAUST_DIR, file), "utf8"));
    let res;
    try { res = RED.fpb.compileFBC(model, table, { sampleRate: SR }); }
    catch (e) { fail("compile: " + e.message); continue; }
    const st = res.stats;
    console.log(`  FBC per sample ${st.fbcSample} -> FPB smp ${st.smp}   FBC control ${st.fbcControl} -> FPB blk ${st.blk}`);
    console.log(`  slots f ${st.fSlots} i ${st.iSlots}   arrays ${JSON.stringify(st.arrays)}   container ${st.bytes} bytes`);
    console.log("  params " + res.params.map(p => `${p.index}:${p.path}[${p.min}..${p.max}]=${p.def}`).join("  "));
    res.warnings.forEach(w => console.log("  warn " + w));
    const fpbFile = path.join(BUILD, name + ".fpb");
    fs.writeFileSync(fpbFile, res.bytes);

    const ins = makeInput(model.inputs);
    const schedule = makeSchedule(res.params);

    // reference
    const ref = new RED.fpb.fbc.Interp(model);
    ref.init(SR);
    const refOut = runBlocks(model.inputs, model.outputs, ins, schedule,
        (i, v) => { ref.R[res.params[i].offset] = v; },
        (i, o) => ref.compute(N, i, o));

    // vm
    const vm = RED.fpb.vm.load(res.bytes, table);
    if (vm.error) { fail("vm load: " + vm.errorName); continue; }
    const vmOut = runBlocks(model.inputs, model.outputs, ins, schedule, (i, v) => vm.setParam(i, v), (i, o) => vm.process(i, o, N));
    const c1 = compare(refOut, vmOut);
    (c1.max <= 1e-6 ? ok : fail)(`vm   vs ref   max diff ${c1.max.toExponential(2)} (peak ${c1.peak.toFixed(3)})`);

    // host (firmware code on the PC)
    if (gpp) {
        const inFile = path.join(BUILD, name + ".in.f32"), outFile = path.join(BUILD, name + ".host.f32"), pFile = path.join(BUILD, name + ".params.txt");
        writePlanar(inFile, ins);
        fs.writeFileSync(pFile, schedule.map(q => `${q.block} ${q.index} ${q.value}`).join("\n") + "\n");
        const r = spawnSync(hostRun, [fpbFile, String(BLOCKS), model.inputs ? inFile : "-", outFile, pFile, "7"], { encoding: "utf8" });
        if (r.status !== 0) fail("host: " + (r.stdout || "") + (r.stderr || ""));
        else {
            const hostOut = readPlanar(outFile, model.outputs);
            const c2 = compare(vmOut, hostOut);
            (c2.max <= 1e-4 ? ok : fail)(`host vs vm    max diff ${c2.max.toExponential(2)}   (${r.stdout.trim()})`);
        }
        // Faust's own C++
        const cpp = path.join(FAUST_DIR, name + ".cpp");
        if (useFaust && fs.existsSync(cpp)) {
            const exe = path.join(BUILD, "host_faust_" + name + EXE);
            build(exe, [path.join(__dirname, "host", "host_faust.cpp")], [`-DFAUST_FILE="${cpp.replace(/\\/g, "/")}"`, `-DFAUST_CLASS=${name}`]);
            const fOut = path.join(BUILD, name + ".faust.f32");
            const r2 = spawnSync(exe, ["x", String(BLOCKS), model.inputs ? inFile : "-", fOut, pFile], { encoding: "utf8" });
            if (r2.status !== 0) fail("faust: " + r2.stderr);
            else {
                const c3 = compare(readPlanar(fOut, model.outputs), refOut);
                (c3.max <= 1e-3 ? ok : fail)(`ref  vs faust max diff ${c3.max.toExponential(2)} (FBC prints constants with 6 digits)`);
            }
        }
    }
}

// ------------------------------------------------------------------ functional check of a hand-made program

console.log("\n== hand-made program");
const P0 = {
    nIn: 1, nOut: 1, fSlots: 4, iSlots: 1,
    arrays: [{ tier: "fast", type: "f", len: 4, data: new Float32Array([1, 2, 3, 4]) }],
    fconsts: [{ slot: 3, value: 0.5 }], iconsts: [{ slot: 0, value: 2 }], params: [{ slot: 2, def: 0.25 }],
    blk: [{ op: "mul", ops: [3, 2, 2] }],                                  // F3 = p * p
    smp: [{ op: "rdf", ops: [1, 0, 0] }, { op: "madd", ops: [1, 0, 3, 1] }] // out = arr[2]; out = in * F3 + out
};
const p0 = RED.fpb.format.encode(P0, table);
{
    const vm = RED.fpb.vm.load(p0, table);
    const i = [new Float32Array([0, 1, 2, -4])], o = [new Float32Array(4)];
    vm.process(i, o, 4);
    const want = [3, 3.0625, 3.125, 2.75];
    (want.every((w, k) => o[0][k] === w) ? ok : fail)("vm: out = in * p^2 + arr[2] -> " + Array.from(o[0]).join(" "));
}

// ------------------------------------------------------------------ broken containers

console.log("\n== broken containers (JS decoder and C loader must agree)");
const SEC = RED.fpb.format.SECTION;
function fixCrc(b) { new DataView(b.buffer).setUint32(36, core.crc32(b, 0, 40, b.length), true); return b; }
function variant(fn, keepCrc) { const b = new Uint8Array(p0); fn(b, new DataView(b.buffer)); return keepCrc ? b : fixCrc(b); }
// layout of p0: header 0..39, used ops 40..51 (mul, madd, rdf), array 52..59, fconst 60..65, iconst 66..71,
// param 72..77, code 78..103 (mul 78, rdf 86, madd 94), data 104..119
const cases = [
    ["E_MAGIC", "HEADER", 0, b => { b[0] = 0x58; }],
    ["E_VERSION", "HEADER", 0, b => { b[4] = 2; }],
    ["E_HEADER", "HEADER", 0, (b, d) => d.setUint16(6, 39, true)],
    ["E_HEADER", "HEADER", 0, (b, d) => d.setUint16(12, 1, true)],
    ["E_HEADER", "HEADER", 0, b => { b[5] = 0; }],
    ["E_OPCOUNT", "HEADER", 0, (b, d) => d.setUint16(8, table.count + 1, true)],
    ["E_CODE_SIZE", "HEADER", 0, (b, d) => d.setUint32(28, d.getUint32(28, true) + 1, true)],
    ["E_OP_INDEX", "USEDOPS", 1, b => { b[44] = 200; }],
    ["E_OP_RESERVED", "USEDOPS", 0, b => { b[40] = 20; }],
    ["E_OP_ARITY", "USEDOPS", 2, b => { b[49] = 4; }],
    ["E_OP_FP", "USEDOPS", 1, b => { b[46] ^= 1; }],
    ["E_ARRAY", "ARRAYS", 0, b => { b[52] = 4; }],
    ["E_ARRAY", "ARRAYS", 0, (b, d) => d.setUint32(56, 0, true)],
    ["E_DATA_SIZE", "ARRAYS", 1, b => { b[54] = 0; }],
    ["E_SLOT", "FCONST", 0, (b, d) => d.setUint16(60, 0, true)],
    ["E_SLOT", "ICONST", 0, (b, d) => d.setUint16(66, 1, true)],
    ["E_SLOT", "PARAMS", 0, (b, d) => d.setUint16(72, 1, true)],
    ["E_INSTR_OP", "CODE", 0, b => { b[78] = 2; }],
    ["E_INSTR_ARITY", "CODE", 1, b => { b[87] = 2; }],
    ["E_OPERAND", "CODE", 0, (b, d) => d.setUint16(82, 99, true)],
    ["E_WRITE_INPUT", "CODE", 1, (b, d) => d.setUint16(88, 0, true)],
    ["E_OPERAND", "CODE", 1, (b, d) => d.setUint16(90, 5, true)],
    ["E_CODE_SIZE", "CODE", 1, (b, d) => { d.setUint16(24, 1, true); d.setUint16(26, 1, true); }],
    ["E_CRC", "DONE", 0, b => { b[110] ^= 0x40; }, true],
];
const extra = [
    ["E_INCOMPLETE", "DATA", 0, () => p0.slice(0, p0.length - 1)],
    ["E_TRAILING", "DONE", 0, () => { const b = new Uint8Array(p0.length + 1); b.set(p0); return b; }],
];
function checkCase(want, wantSec, wantIdx, bytes, label) {
    const js = RED.fpb.format.decode(bytes, table);
    const jsTxt = js.error ? `${js.errorName} ${js.errorSection} ${js.errorIndex}` : "OK";
    const wantTxt = want === "OK" ? "OK" : `${want} ${wantSec} ${wantIdx}`;
    let msg = `${label.padEnd(14)} js ${jsTxt}`;
    let good = jsTxt === wantTxt;
    if (gpp) {
        const f = path.join(BUILD, "broken.fpb");
        fs.writeFileSync(f, bytes);
        for (const chunk of ["1", "7", "4096"]) {
            const r = spawnSync(hostRun, [f, "1", "-", path.join(BUILD, "broken.out"), "-", chunk], { encoding: "utf8" });
            const m = /^ERR (\S+) (\d+) (\d+)/.exec(r.stdout || "");
            const cTxt = m ? `${m[1]} ${RED.fpb.format.SECTION_NAMES[+m[2]]} ${m[3]}` : /^OK/.test(r.stdout || "") ? "OK" : (r.stdout || "").trim();
            if (cTxt !== wantTxt) { good = false; msg += `   C(chunk ${chunk}) ${cTxt}`; }
        }
        if (good) msg += "   C same (chunks 1, 7, 4096)";
    }
    (good ? ok : fail)(msg + (good ? "" : "   want " + wantTxt));
}
cases.forEach(([want, sec, idx, fn, keepCrc]) => checkCase(want, sec, idx, variant(fn, keepCrc), want));
extra.forEach(([want, sec, idx, fn]) => checkCase(want, sec, idx, fn(), want));
{
    // the unchanged container loads in both
    checkCase("OK", "", "", p0, "unchanged");
}
// a removed op (JS only: the C side uses the table compiled into it)
{
    const text = fs.readFileSync(path.join(LIB, "FPB_oplist.h"), "utf8").replace('FPB_OP(7,  madd,     "f=fff", PURE)', 'FPB_DEL(7, madd, "f=fff")');
    const t2 = core.parseOpList(text);
    const r = RED.fpb.format.decode(p0, t2);
    (r.errorName === "E_OP_REMOVED" ? ok : fail)("E_OP_REMOVED   js " + r.errorName + " " + r.errorSection + " " + r.errorIndex + " (op table with madd removed)");
}

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
