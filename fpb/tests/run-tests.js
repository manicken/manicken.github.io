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

// ------------------------------------------------------------------ FBC move instructions (short delay lines)

// A hand-written FBC sample loop with every move instruction: kBlockShift (heap[i] = heap[i-1] for i = o1 down to
// o2+1), kBlockPairMove (heap[i+1] = heap[i] for i = o1, o1+2, .. < o2), kPairMove (heap[o1] = heap[o1-1],
// heap[o2] = heap[o2-1]) and kMove (heap[o1] = heap[o2]), Real and Int. Values pushed before a block shift read the
// shifted slots (they must be saved first), and a kMoveReal is a one-sample copy that eliminateCopies removes.
console.log("\n== FBC move instructions");
{
    // real heap: 0..3 shifted line, 4..9 pair moves, 10..13 pair move, 14 move, 16 recursion, 17 its one-sample copy
    // int heap:  0 sr, 1 count, 2 loop var, 3..5 shifted line, 6..9 pair moves, 10..13 pair move, 14 move
    const I = (op, o1 = -1, o2 = -1, i = 0, r = 0) => `opcode 0 ${op} int ${i} real ${r} offset1 ${o1} offset2 ${o2}`;
    const ld = o => I("kLoadReal", o), sto = o => I("kStoreReal", o), ldi = o => I("kLoadInt", o), stoi = o => I("kStoreInt", o);
    const rv = r => I("kRealValue", -1, -1, 0, r), iv = i => I("kInt32Value", -1, -1, i);
    const blk = lines => [`block_size ${lines.length}`].concat(lines);
    const sumR = offs => offs.flatMap(o => [ld(o), I("kAddReal")]);
    const sumI = offs => offs.flatMap(o => [ldi(o), I("kCastReal"), I("kAddReal")]);
    const body = [
        ldi(2), I("kLoadInput", 0), sto(0),                                        // R0 = in
        ...[[4, 2], [6, 3], [8, 4], [10, 5], [12, 6]].flatMap(([o, k]) => [rv(k), ld(0), I("kMultReal"), sto(o)]),
        ld(17), rv(0.5), ld(0), I("kMultReal"), I("kAddReal"), sto(16),            // R16 = R0 * 0.5 + R17
        rv(100), ld(0), I("kMultReal"), I("kCastInt"), stoi(3),                    // I3 = int(R0 * 100)
        ...[[6, 1], [8, 2], [10, 3], [12, 4]].flatMap(([o, k]) => [iv(k), ldi(3), I("kAddInt"), stoi(o)]),
        ld(3), ldi(5), I("kCastReal"),                                              // old R3, old I5: still on the stack
        I("kBlockShiftReal", 3, 0), I("kBlockShiftInt", 5, 3),
        I("kAddReal"), ...sumR([1, 2, 3]),
        I("kBlockPairMoveReal", 4, 9), I("kPairMoveReal", 11, 13), I("kMoveReal", 14, 0),
        I("kBlockPairMoveInt", 6, 9), I("kPairMoveInt", 11, 13), I("kMoveInt", 14, 3),
        ...sumR([5, 7, 9, 11, 13, 14, 16]), ...sumI([4, 7, 9, 11, 13, 14]),
        rv(0.01), I("kMultReal"), ldi(2), I("kStoreOutput", 0),
        I("kMoveReal", 17, 16),                                                     // fRec[1] = fRec[0]
        ldi(2), iv(1), I("kAddInt"), stoi(2), ldi(1), ldi(2), I("kLTInt"), I("kCondBranch"), I("kReturn")
    ];
    const ret = blk([I("kReturn")]);
    const fbcText = (sampleBody, subLines = 0) => [      // subLines: lines of sub-blocks, not counted in block_size
        "interpreter_dsp_factory float", "file_version 8", "Faust version 2.94.1", "name moves", "opt_level 6",
        "inputs 1 outputs 1", "int_heap_size 16 real_heap_size 18 sr_offset 0 count_offset 1 iota_offset -1",
        "meta_block", "block_size 0", "user_interface_block", "block_size 0",
        "static_init_block", ...ret, "constants_block", ...ret, "reset_ui", ...ret, "clear_block", ...ret, "control_block", ...ret,
        "dsp_block", "block_size 2", I("kLoop"), ...blk([iv(0), stoi(2), I("kReturn")]),
        `block_size ${sampleBody.length - subLines}`, ...sampleBody, I("kReturn")
    ].join("\n") + "\n";
    const model = RED.fpb.fbc.parse(fbcText(body));

    // structure, unoptimised: the shifts are one mov per element, top down, after the saves of the stacked values
    const r0 = RED.fpb.compileFBC(model, table, { sampleRate: SR, optimize: false, fuse: false });
    const dis = r0.program.smp.map(ins => {
        const names = r0.debug[table.byName[ins.op].sig[0] === "i" ? "i" : "f"];
        return ins.op + " " + ins.ops.map((s, j) => j === 0 ? names[s] : (/^i/.test(ins.op) ? r0.debug.i : r0.debug.f)[s]).join(" ");
    });
    const at = dis.indexOf("mov fheap3 fheap2");
    const wantR = ["mov saved0 fheap3", "mov fheap3 fheap2", "mov fheap2 fheap1", "mov fheap1 fheap0",
                   "itof saved1 iheap5", "imov iheap5 iheap4", "imov iheap4 iheap3"];
    const gotR = dis.slice(at - 1, at + 6);
    (JSON.stringify(gotR) === JSON.stringify(wantR) ? ok : fail)("block shifts -> " + gotR.join(", "));
    const wantP = ["mov fheap5 fheap4", "mov fheap7 fheap6", "mov fheap9 fheap8", "mov fheap11 fheap10", "mov fheap13 fheap12",
                   "mov fheap14 fheap0", "imov iheap7 iheap6", "imov iheap9 iheap8", "imov iheap11 iheap10", "imov iheap13 iheap12",
                   "imov iheap14 iheap3"];
    const atP = dis.indexOf(wantP[0]), gotP = dis.slice(atP, atP + wantP.length);
    (JSON.stringify(gotP) === JSON.stringify(wantP) ? ok : fail)("pair moves and moves -> " + gotP.join(", "));

    // results, unoptimised and optimised (the kMoveReal recursion copy removed), against the FBC reference
    const ins = makeInput(1).map(x => x.subarray(0, N * 8)), NB = 8;
    const ref = new RED.fpb.fbc.Interp(model);
    ref.init(SR);
    const refOut = [new Float32Array(N * NB)];
    for (let b = 0; b < NB; b++) ref.compute(N, [ins[0].subarray(b * N, (b + 1) * N)], [refOut[0].subarray(b * N, (b + 1) * N)]);
    const r1 = RED.fpb.compileFBC(model, table, { sampleRate: SR });
    [["unoptimised", r0], ["optimised", r1]].forEach(([what, r]) => {
        const vm = RED.fpb.vm.load(r.bytes, table), o = [new Float32Array(N * NB)];
        vm.process(ins, o, N * NB);
        const d = compare(refOut, o).max;
        (d <= 1e-6 && refOut[0].some(x => x !== 0) ? ok : fail)(
            `vm vs ref ${what}: max diff ${d.toExponential(2)} (${r.stats.smp} steps, ${r.stats.copiesRemoved} copies removed)`);
    });
    (r1.stats.copiesRemoved >= 1 ? ok : fail)("the kMoveReal one-sample copy is removed by eliminateCopies");

    // a move in a select branch is a store there: refused, like the other stores
    const sel = [rv(1), ld(0), I("kGTReal"), I("kSelectReal")];
    const selBody = body.slice();
    const k = selBody.indexOf(I("kBlockShiftReal", 3, 0)), branches = [...blk([I("kBlockShiftReal", 3, 0), rv(1)]), ...blk([rv(2)])];
    selBody.splice(k, 1, ...sel, ...branches, I("kAddReal"));
    let msg = null;
    try { RED.fpb.compileFBC(RED.fpb.fbc.parse(fbcText(selBody, branches.length)), table, { sampleRate: SR }); }
    catch (e) { msg = e.message; }
    (msg && /select branch with a store/.test(msg) ? ok : fail)("block shift in a select branch: " + msg);
}

// ------------------------------------------------------------------ rem (Faust's remainder, FBC kRemReal)

// rem is C remainderf (x - n*y, n = x/y rounded to the nearest integer, ties to even), not fmod (Faust's %).
// The VM (fpb-core.js m.remainderf) must give the same bits as the firmware code (libm remainderf) on edge values:
// exact ties, signed zeros, negative values and widely varying exponents.
console.log("\n== rem (remainder, not fmod)");
{
    const xs = [], ys = [];
    const push = (x, y) => { xs.push(Math.fround(x)); ys.push(Math.fround(y)); };
    for (const y of [2, 3, 0.5, 1.5, -2, -3])
        for (let k = -6; k <= 6; k++) push((k + 0.5) * y, y);          // exact ties: n is rounded to even
    for (const [x, y] of [[0, 1], [-0, 1], [4, 2], [-4, 2], [5.5, 2], [-5.5, 2], [1, 0.37], [-1, 0.37], [1e-30, 3], [3, 1e-30]])
        push(x, y);
    let seed = 24680;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    while (xs.length < N * 4) {
        const ex = Math.floor(rnd() * 40) - 20, ey = Math.floor(rnd() * 40) - 20;
        push((rnd() - 0.5) * Math.pow(2, ex), (rnd() - 0.5 || 0.25) * Math.pow(2, ey));
    }
    const ins = [Float32Array.from(xs), Float32Array.from(ys)], NB = xs.length / N;
    const PR = { nIn: 2, nOut: 1, fSlots: 3, iSlots: 0, arrays: [], fconsts: [], iconsts: [], params: [], blk: [],
                 smp: [{ op: "rem", ops: [2, 0, 1] }] };
    const pr = RED.fpb.format.encode(PR, table);
    const vm = RED.fpb.vm.load(pr, table), vo = [new Float32Array(xs.length)];
    vm.process(ins, vo, xs.length);
    const bits = a => new Uint32Array(a.buffer, a.byteOffset, a.length);
    // the classic difference with fmod, checked in the VM alone: remainder(5.5, 2) = -0.5, fmod(5.5, 2) = 1.5
    const k55 = xs.findIndex((x, i) => x === 5.5 && ys[i] === 2);
    (vo[0][k55] === -0.5 ? ok : fail)(`vm: rem(5.5, 2) = ${vo[0][k55]} (fmod would give 1.5)`);
    if (gpp) {
        const f = path.join(BUILD, "rem.fpb"), inF = path.join(BUILD, "rem.in.f32"), outF = path.join(BUILD, "rem.out.f32");
        fs.writeFileSync(f, pr);
        writePlanar(inF, ins);
        const r = spawnSync(hostRun, [f, String(NB), inF, outF, "-"], { encoding: "utf8" });
        if (r.status !== 0) fail("host: " + r.stdout + r.stderr);
        else {
            const ho = readPlanar(outF, 1)[0], hb = bits(ho), vb = bits(vo[0]);
            let bad = -1;
            for (let k = 0; k < hb.length; k++) if (hb[k] !== vb[k]) { bad = k; break; }
            (bad < 0 ? ok : fail)(`host rem on ${xs.length} values (ties, signed zeros, exponents -20..20): ` +
                (bad < 0 ? "same bits as the VM" : `differs at rem(${xs[bad]}, ${ys[bad]}): C ${ho[bad]}, VM ${vo[0][bad]}`));
        }
    } else console.log("  C++ comparison skipped (g++ not found)");
    // an op table without rem (an older firmware): kRemReal must not compile, rather than turn into fmod
    const opListText = fs.readFileSync(path.join(LIB, "FPB_oplist.h"), "utf8");
    const oldTable = core.parseOpList(opListText.replace(/FPB_OP\(55, rem,\s*"f=ff",\s*PURE\)/, "FPB_RES(55)"));
    let msg = null;
    try { RED.fpb.compileFBC(RED.fpb.fbc.parse(fs.readFileSync(path.join(FAUST_DIR, "rem.fbc"), "utf8")), oldTable, { sampleRate: SR }); }
    catch (e) { msg = e.message; }
    (msg && /needs the op 'rem'/.test(msg) && oldTable.byName.rem === undefined ? ok : fail)("op table without rem: " + msg);
}

// ------------------------------------------------------------------ super-instructions

// For every fusion rule: a program with the pair (a writes a temporary, b reads it) and the same program with the
// fused op must give bit-identical outputs, in the VM and in the firmware code built with g++, on inputs whose
// exponents vary a lot (rounding of every intermediate result matters there).
console.log("\n== super-instructions (fused op == the pair it replaces)");
{
    const FUSE_RULES = RED.fpb.compileFBC.FUSE_RULES;
    const NB = 8, NIN = 4;
    let seed = 987654321;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const ins = [];
    for (let c = 0; c < NIN; c++) {
        const x = new Float32Array(N * NB);
        for (let k = 0; k < x.length; k++) x[k] = (rnd() - 0.5) * Math.pow(2, Math.floor(rnd() * 40) - 20);
        ins.push(x);
    }
    const inF = path.join(BUILD, "fuse.in.f32");
    if (gpp) writePlanar(inF, ins);
    const OUT = NIN, TMP = NIN + 1;             // float slots: 0..3 inputs, 4 output, 5 temporary
    const covered = new Set();
    for (const rule of FUSE_RULES) {
        const sa = table.byName[rule.a].sig, sb = table.byName[rule.b].sig;
        const tmp = sa[0] === "f" ? TMP : 1;    // int slots: 0 the array index (constant 3), 1 the temporary (gt)
        const A = [tmp], aReads = sa.slice(sa.indexOf("=") + 1);
        for (let j = 0; j < aReads.length; j++) A.push(j % NIN);
        const B = [], wb = sb.indexOf("="), bReads = sb.slice(wb + 1);
        for (let j = 0; j < wb; j++) B.push(OUT);
        for (let j = 0, c = 0; j < bReads.length; j++) {
            if (j === rule.p) B.push(tmp);
            else if (bReads[j] === "f") B.push(NIN - 1 - (c++ % NIN));   // inputs 3, 2, 1, ...
            else B.push(0);                     // "a": array 0, "i": the index slot
        }
        const observe = wb === 0 ? [{ op: "rdfm", ops: [OUT, 0, 0] }] : [];   // a store: read the cell back
        const base = { nIn: NIN, nOut: 1, fSlots: TMP + 1, iSlots: 2, params: [], fconsts: [], iconsts: [{ slot: 0, value: 3 }],
                       arrays: [{ tier: "fast", type: "f", len: 8, data: null }], blk: [] };
        const pair = RED.fpb.format.encode(Object.assign({}, base, { smp: [{ op: rule.a, ops: A }, { op: rule.b, ops: B }].concat(observe) }), table);
        const fused = RED.fpb.format.encode(Object.assign({}, base, { smp: [{ op: rule.op, ops: rule.build(A, B) }].concat(observe) }), table);
        const runVM = bytes => { const v = RED.fpb.vm.load(bytes, table); const o = [new Float32Array(N * NB)]; v.process(ins, o, N * NB); return o; };
        const vp = runVM(pair), vf = runVM(fused);
        let msg = `${(rule.a + "→" + rule.b + "@" + rule.p).padEnd(16)} ${rule.op.padEnd(8)}`;
        let good = compare(vp, vf).max === 0 && vp[0].some(x => x !== 0);
        if (!good) msg += "  VM: fused differs from the pair";
        if (gpp) {
            const f = path.join(BUILD, "fuse.fpb"), o = path.join(BUILD, "fuse.out.f32");
            fs.writeFileSync(f, fused);
            const r = spawnSync(hostRun, [f, String(NB), inF, o, "-"], { encoding: "utf8" });
            if (r.status !== 0) { good = false; msg += "  host: " + r.stdout + r.stderr; }
            else {
                const d = compare(vf, readPlanar(o, 1)).max;
                if (d !== 0) { good = false; msg += `  host: differs by ${d}`; }
                else msg += "  identical in the VM and the firmware code";
            }
        }
        covered.add(rule.op);
        (good ? ok : fail)(msg);
    }
    const fusedOps = table.ops.filter(op => op.index >= 128 && !(op.flags & (core.FLAGS.RESERVED | core.FLAGS.REMOVED))).map(op => op.name);
    const missing = fusedOps.filter(n => !covered.has(n));
    (missing.length === 0 ? ok : fail)(`every fused op of the table has a rule (${fusedOps.length})` + (missing.length ? ": missing " + missing.join(", ") : ""));
    // an op table without the fused ops (an older firmware) gets the unfused code, which is also what fuse: false gives
    const opListText = fs.readFileSync(path.join(LIB, "FPB_oplist.h"), "utf8");
    const oldTable = core.parseOpList(opListText.replace(/FPB_OP\((1[2-5]\d), (\w+),\s*"[^"]*",\s*[\w |]+\)/g, "FPB_RES($1)"));
    const text = fs.readFileSync(path.join(FAUST_DIR, "djembe_verb.fbc"), "utf8");
    const rOld = RED.fpb.compileFBC(RED.fpb.fbc.parse(text), oldTable, { sampleRate: SR });
    const rNoFuse = RED.fpb.compileFBC(RED.fpb.fbc.parse(text), table, { sampleRate: SR, fuse: false });
    const rFuse = RED.fpb.compileFBC(RED.fpb.fbc.parse(text), table, { sampleRate: SR });
    const sameCode = JSON.stringify(rOld.program.smp) === JSON.stringify(rNoFuse.program.smp);
    (sameCode && !rOld.program.smp.some(i => FUSE_RULES.some(r => r.op === i.op)) ? ok : fail)(
        `old op table: unfused code (djembe_verb ${rOld.stats.smp} steps; with the fused ops ${rFuse.stats.smp})`);
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
    ["E_OP_RESERVED", "USEDOPS", 0, b => { b[40] = 21; }],          // 21: still a reserved slot (20 is mov2)
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
