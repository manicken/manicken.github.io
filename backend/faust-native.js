// Faust -> a real (native) Teensy audio object, for the C++ export of ASDT++ (specs/asdt-backend.md, section 9).
//
// For a Faust patch named <name> (an AudioEffectFPB node in ASDT++) this makes three files for src/asdt/faust/:
//   asdt_faust.h      the small base classes the Faust C++ needs (backend/faust/asdt_faust.h, the same for all)
//   Faust_<name>.h    class Faust_<name> : public AudioStream, with a setter per Faust parameter
//   Faust_<name>.cpp  the code Faust generated (class Faust_<name>_dsp) and the AudioStream part
//
// The setters are named by the Faust label, and by the path only when two labels are the same: that is Faust's
// own "shortname" in its JSON (hslider("cutoff") -> cutoff(float), two "gain" in groups v and w -> v_gain, w_gain).
// They write the parameter field directly (the field is in Faust's JSON as "varname"); the AudioStream class is a
// friend of the generated class for that.
//
// Faust is run as: faust -lang cpp -cn Faust_<name>_dsp -scn FaustDsp -json <name>.dsp
"use strict";
const fs = require("fs");
const path = require("path");

const ARCH_HEADER = path.join(__dirname, "faust", "asdt_faust.h");

// names a setter can't have: C++ keywords, and what AudioStream (and this class) already has
const RESERVED = new Set(("alignas alignof and asm auto bitand bitor bool break case catch char class compl const constexpr " +
    "const_cast continue decltype default delete do double dynamic_cast else enum explicit export extern false float for " +
    "friend goto if inline int long mutable namespace new noexcept not nullptr operator or private protected public " +
    "register reinterpret_cast return short signed sizeof static static_assert static_cast struct switch template this " +
    "throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor " +
    "update active isActive processorUsage processorUsageMax processorUsageMaxReset cpu_cycles cpu_cycles_max " +
    "receiveReadOnly receiveWritable transmit allocate release setParam ok numParams dsp").split(" "));

const BIG_TABLE_BYTES = 16 * 1024;

function cIdent(s) {
    let n = String(s).replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    if (n === "") n = "param";
    if (/^[0-9]/.test(n)) n = "p" + n;
    return n;
}

/** the widgets of Faust's JSON ui tree, in order */
function widgetsOf(ui) {
    const out = [];
    const walk = items => { for (const it of items || []) { if (it.items) walk(it.items); else out.push(it); } };
    walk(ui);
    return out;
}

/**
 * The parameters of the patch, with the setter names.
 * @returns {{name, label, address, kind, varname, init, min, max, step, unit}[]}
 */
function paramsOf(json) {
    const used = new Set();
    const params = [];
    for (const w of widgetsOf(json.ui)) {
        if (w.type === "soundfile") throw new Error("soundfile " + w.label + ": soundfiles are not supported in a Teensy object");
        if (!w.varname) throw new Error("the Faust JSON has no varname for " + w.label + " (Faust 2.30 or newer is needed)");
        let name = cIdent(w.shortname || w.label);
        if (RESERVED.has(name)) name += "_";
        while (used.has(name)) name += "_";
        used.add(name);
        const meta = Object.assign({}, ...(w.meta || []));
        params.push({ name, label: w.label, address: w.address, kind: w.type, varname: w.varname,
            init: w.init, min: w.min, max: w.max, step: w.step, unit: meta.unit });
    }
    return params;
}

/** the generated code, made ready for the Teensy: the friend class, and the big static tables in RAM2 */
function adaptGenerated(cpp, cls, dspCls) {
    if (/#include\s*[<"]faust\//.test(cpp)) throw new Error("the generated code includes Faust architecture files, which is not supported");
    const head = new RegExp("(class " + dspCls + " : public FaustDsp \\{)");
    if (!head.test(cpp)) throw new Error("internal: class " + dspCls + " not found in Faust's output");
    cpp = cpp.replace(head, "$1\n\tfriend class " + cls + ";   // (added by ASDT++: its setters write the parameters)");
    const sizes = { float: 4, int: 4, double: 8 };
    cpp = cpp.replace(/^static (float|int|double) (\w+)\[(\d+)\];/gm, function (all, type, name, count) {
        return (sizes[type] * Number(count) > BIG_TABLE_BYTES) ? "static ASDT_FAUST_BIG_TABLE " + type + " " + name + "[" + count + "];   // (ASDT++: in RAM2)" : all;
    });
    return cpp;
}

const num = v => (v === undefined || v === null) ? "" : String(+(+v).toPrecision(7));

function headerFile(cls, dspCls, patch, json, params) {
    const L = [];
    L.push(`// ${cls}.h: the Faust patch "${patch}" as a Teensy audio object, made by ASDT++ from ${patch}.dsp.`);
    L.push(`// Replaced on every export (src/asdt/ belongs to ASDT++). Inputs ${json.inputs}, outputs ${json.outputs}.`);
    L.push(`#pragma once`, `#include "asdt_faust.h"`, ``, `class ${dspCls};`, ``);
    L.push(`class ${cls} : public AudioStream`, `{`, `public:`);
    L.push(`    ${cls}();`, `    ~${cls}();`, `    virtual void update(void);`, ``);
    L.push(`    /** false when there was no memory for the patch (it then outputs nothing) */`);
    L.push(`    bool ok() const { return dsp != nullptr; }`, ``);
    for (const p of params) {
        const range = (p.min !== undefined) ? ` ${num(p.min)} .. ${num(p.max)}` + (p.init !== undefined ? `, default ${num(p.init)}` : "") : "";
        const what = { button: "button, 1 = pressed", checkbox: "checkbox, 0 or 1" }[p.kind] || p.kind;
        L.push(`    /** ${p.label}${p.unit ? " [" + p.unit + "]" : ""}: ${what}${range} (${p.address}) */`);
        if (p.kind === "hbargraph" || p.kind === "vbargraph") L.push(`    float ${p.name}();`);
        else L.push(`    void ${p.name}(float value);`);
    }
    L.push(``, `    /** a parameter by its index in the list above; returns false for a bad index or a bargraph */`);
    L.push(`    bool setParam(int index, float value);`);
    L.push(`    static const int numParams = ${params.length};`, ``);
    L.push(`private:`);
    if (json.inputs > 0) L.push(`    audio_block_t* inputQueueArray[${json.inputs}];`);
    L.push(`    ${dspCls}* dsp;`, `};`, ``);
    return L.join("\n");
}

function sourceFile(cls, dspCls, patch, generated, json, params) {
    const NI = json.inputs, NO = json.outputs;
    const L = [];
    L.push(`// ${cls}.cpp: the Faust patch "${patch}" as a Teensy audio object, made by ASDT++ (see ${cls}.h)`);
    L.push(`#include "${cls}.h"`, ``);
    L.push(`// ****** the code Faust generated: faust -lang cpp -cn ${dspCls} -scn FaustDsp ${patch}.dsp ******`, ``);
    L.push(generated.trim(), ``);
    L.push(`// ****** end of the code Faust generated ******`, ``);
    L.push(`${cls}::${cls}() : AudioStream(${NI}, ${NI > 0 ? "inputQueueArray" : "NULL"}), dsp(nullptr)`, `{`);
    L.push(`    // the whole DSP state (delay lines too) is in one object: RAM2 first, PSRAM when it doesn't fit`);
    L.push(`    void* mem = asdtFaustAlloc(sizeof(${dspCls}));`);
    L.push(`    if (mem == nullptr) return;`);
    L.push(`    dsp = new (mem) ${dspCls}();`);
    L.push(`    static bool classDone = false;   // the static tables (shared by all objects of this patch) are filled once`);
    L.push(`    if (!classDone) { ${dspCls}::classInit((int)AUDIO_SAMPLE_RATE_EXACT); classDone = true; }`);
    L.push(`    dsp->instanceInit((int)AUDIO_SAMPLE_RATE_EXACT);`, `}`, ``);
    L.push(`${cls}::~${cls}()`, `{`, `    if (dsp == nullptr) return;`, `    dsp->~${dspCls}();`, `    asdtFaustFree(dsp);`, `}`, ``);
    L.push(`void ${cls}::update(void)`, `{`, `    if (dsp == nullptr) return;`);
    if (NI > 0) L.push(`    float in[${NI}][AUDIO_BLOCK_SAMPLES];`, `    float* ins[${NI}];`);
    if (NO > 0) L.push(`    float out[${NO}][AUDIO_BLOCK_SAMPLES];`, `    float* outs[${NO}];`);
    if (NI > 0) {
        L.push(`    for (int c = 0; c < ${NI}; c++) {`, `        ins[c] = in[c];`);
        L.push(`        audio_block_t* block = receiveReadOnly(c);`);
        L.push(`        if (block == NULL) { for (int i = 0; i < AUDIO_BLOCK_SAMPLES; i++) in[c][i] = 0.0f; continue; }   // nothing connected / silence`);
        L.push(`        for (int i = 0; i < AUDIO_BLOCK_SAMPLES; i++) in[c][i] = asdtFaustFromInt16(block->data[i]);`);
        L.push(`        release(block);`, `    }`);
    }
    if (NO > 0) L.push(`    for (int c = 0; c < ${NO}; c++) outs[c] = out[c];`);
    L.push(`    dsp->compute(AUDIO_BLOCK_SAMPLES, ${NI > 0 ? "ins" : "NULL"}, ${NO > 0 ? "outs" : "NULL"});`);
    if (NO > 0) {
        L.push(`    for (int c = 0; c < ${NO}; c++) {`, `        audio_block_t* block = allocate();`, `        if (block == NULL) continue;`);
        L.push(`        for (int i = 0; i < AUDIO_BLOCK_SAMPLES; i++) block->data[i] = asdtFaustToInt16(out[c][i]);`);
        L.push(`        transmit(block, c);`, `        release(block);`, `    }`);
    }
    L.push(`}`, ``);
    for (const p of params) {
        if (p.kind === "hbargraph" || p.kind === "vbargraph")
            L.push(`float ${cls}::${p.name}() { return (dsp != nullptr) ? (float)dsp->${p.varname} : 0.0f; }`);
        else
            L.push(`void ${cls}::${p.name}(float value) { if (dsp != nullptr) dsp->${p.varname} = (FAUSTFLOAT)value; }`);
    }
    L.push(``, `bool ${cls}::setParam(int index, float value)`, `{`, `    switch (index) {`);
    params.forEach(function (p, i) { if (p.kind !== "hbargraph" && p.kind !== "vbargraph") L.push(`        case ${i}: ${p.name}(value); return true;`); });
    L.push(`        default: return false;`, `    }`, `}`, ``);
    return L.join("\n");
}

/**
 * @param {Object} o
 * @param {Function} o.runFaust  (args, cwd) -> Promise<{code, out, err}>
 * @param {String} o.faustlib    extra -I for the Faust libraries ("" = faust's own)
 * @param {String} o.work        a temp folder (backend_sandbox/fpb_temp)
 * @param {String|null} o.patches the kept compiles of the Faust IDE exports (backend_sandbox/fpb_patches)
 * @param {Function} o.log
 */
function createFaustNative(o) {
    /**
     * @param {{className: String, code?: String, patch?: String}} item  code: the Faust code; patch: the name of a
     *        patch exported from the Faust IDE (its kept sources, with its own libraries, are used)
     * @returns {Promise<{className, patch, inputs, outputs, params, files: {name, contents}[]}>}
     */
    async function compile(item) {
        const cls = String(item.className || "");
        if (!/^[A-Za-z_][A-Za-z0-9_]{0,60}$/.test(cls)) throw new Error("bad class name " + cls);
        const dspCls = cls + "_dsp";
        const dir = path.join(o.work, "native-" + cls);
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
        let main;
        if (typeof item.code === "string" && item.code.trim() !== "") {
            main = cls + ".dsp";
            fs.writeFileSync(path.join(dir, main), item.code);
        } else if (item.patch) {
            const name = String(item.patch);
            if (!/^[A-Za-z0-9_]+$/.test(name) || o.patches == null) throw new Error("no Faust code for " + cls);
            const from = path.join(o.patches, name);
            if (!fs.existsSync(path.join(from, name + ".dsp"))) throw new Error("no kept Faust patch " + name + " (export it from the Faust IDE again)");
            for (const f of fs.readdirSync(from)) if (/\.(dsp|lib)$/i.test(f)) fs.copyFileSync(path.join(from, f), path.join(dir, f));
            main = name + ".dsp";
        } else throw new Error("no Faust code for " + cls);

        const out = path.join(dir, cls + ".cpp");
        const args = ["-lang", "cpp", "-cn", dspCls, "-scn", "FaustDsp", "-json", "-I", dir];
        if (o.faustlib) args.push("-I", o.faustlib);
        args.push(main, "-o", out);
        const r = await o.runFaust(args, dir);
        if (r.code !== 0 || !fs.existsSync(out)) throw new Error(cls + ": " + (r.err || r.out || ("faust exited with " + r.code)).trim());
        const jsonFile = path.join(dir, main + ".json");
        if (!fs.existsSync(jsonFile)) throw new Error("internal: faust made no " + main + ".json");
        // On Windows the JSON has paths with unescaped backslashes in two fields (one line each), which are not needed
        const raw = fs.readFileSync(jsonFile, "utf8").replace(/^\s*"(library_list|include_pathnames)":.*$/gm, "");
        let json;
        try { json = JSON.parse(raw); } catch (e) { throw new Error("internal: can't read faust's " + main + ".json: " + e.message); }
        const params = paramsOf(json);
        const generated = adaptGenerated(fs.readFileSync(out, "utf8"), cls, dspCls);
        const patch = main.replace(/\.dsp$/, "");
        o.log("native Faust object " + cls + ": " + json.inputs + " in, " + json.outputs + " out, " + params.length + " parameters");
        return {
            className: cls, patch, inputs: json.inputs, outputs: json.outputs,
            params: params.map(p => ({ name: p.name, label: p.label, address: p.address, kind: p.kind, init: p.init, min: p.min, max: p.max })),
            files: [
                { name: "faust/asdt_faust.h", contents: fs.readFileSync(ARCH_HEADER, "utf8") },
                { name: "faust/" + cls + ".h", contents: headerFile(cls, dspCls, patch, json, params) },
                { name: "faust/" + cls + ".cpp", contents: sourceFile(cls, dspCls, patch, generated, json, params) }
            ]
        };
    }
    return { compile };
}

module.exports = { createFaustNative, paramsOf, cIdent };
