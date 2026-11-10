// Faust FBC (faust -lang interp) parser and reference interpreter.
//
// RED.fpb.fbc:
//   parse(text)        -> model { name, inputs, outputs, intHeap, realHeap, srOffset, countOffset, iotaOffset,
//                                 meta: [{key, value}], ui: [...], blocks: {static_init_block, constants_block,
//                                 reset_ui, clear_block, control_block, dsp_block} }
//   new Interp(model)  -> reference interpreter in float32: init(sr), setParam(offset, v), compute(count, ins, outs)
//
// FBC notes (checked against Faust 2.88):
//  - a stack machine; for binary ops the value pushed LAST is the LEFT operand ("2, x, kPowf" = pow(x, 2))
//  - kLoop has two sub-blocks (init, body); the body ends with kCondBranch, which jumps back to the body start
//  - kSelectReal / kSelectInt pop the condition and run one of their two sub-blocks, which push the value
//  - indexed stores: the index is on top, the value below it; kStoreOutput likewise
RED.fpb = RED.fpb || {};
RED.fpb.fbc = (function () {
    "use strict";

    var core = RED.fpb.core, m = core.m, fround = Math.fround;

    var SUB_BLOCKS = { kLoop: 2, kSelectReal: 2, kSelectInt: 2 };
    var SECTIONS = ["static_init_block", "constants_block", "reset_ui", "clear_block", "control_block", "dsp_block"];

    function tokenize(line) {
        var out = [], re = /"((?:[^"\\]|\\.)*)"|(\S+)/g, mm;
        while ((mm = re.exec(line))) out.push(mm[1] !== undefined ? { q: mm[1] } : mm[2]);
        return out;
    }
    function str(t) { return (t && typeof t === "object") ? t.q : t; }
    function num(t) {
        t = str(t);
        if (t === "inf") return Infinity;
        if (t === "-inf") return -Infinity;
        if (t === "nan" || t === "-nan") return NaN;
        return parseFloat(t);
    }
    function kv(tokens, from) {
        var r = {};
        for (var k = from; k + 1 < tokens.length; k += 2) r[str(tokens[k])] = tokens[k + 1];
        return r;
    }

    function parse(text) {
        var lines = text.split(/\r?\n/), pos = 0;
        function fail(msg) { throw new Error("FBC line " + pos + ": " + msg); }
        function next() {
            while (pos < lines.length && lines[pos].trim() === "") pos++;
            if (pos >= lines.length) fail("unexpected end of file");
            return lines[pos++];
        }
        function more() {
            while (pos < lines.length && lines[pos].trim() === "") pos++;
            return pos < lines.length;
        }
        function blockSize() {
            var t = tokenize(next());
            if (t[0] !== "block_size") fail("expected block_size, got " + t[0]);
            return parseInt(t[1], 10);
        }
        function readInstr() {
            var t = tokenize(next());
            if (t[0] !== "opcode") fail("expected opcode");
            var a = kv(t, 3);
            var ins = {
                code: parseInt(t[1], 10), op: t[2],
                i: parseInt(str(a["int"]), 10) || 0, r: num(a.real) || 0,
                o1: parseInt(str(a.offset1), 10), o2: parseInt(str(a.offset2), 10),
                name: a.name !== undefined ? str(a.name) : undefined
            };
            var nsub = SUB_BLOCKS[ins.op];
            if (nsub) { ins.sub = []; for (var k = 0; k < nsub; k++) ins.sub.push(readBlock()); }
            return ins;
        }
        function readBlock() {
            var n = blockSize(), block = [];
            for (var k = 0; k < n; k++) block.push(readInstr());
            return block;
        }

        var model = { meta: [], ui: [], blocks: {} };
        // header
        for (;;) {
            var line = next(), t = tokenize(line);
            if (t[0] === "meta_block") break;
            switch (t[0]) {
                case "interpreter_dsp_factory": model.precision = t[1]; break;
                case "file_version": model.fileVersion = parseInt(t[1], 10); break;
                case "Faust": model.faustVersion = t[2]; break;
                case "compile_options": model.compileOptions = line.substring(line.indexOf(" ") + 1).trim(); break;
                case "name": model.name = t[1]; break;
                case "opt_level": model.optLevel = parseInt(t[1], 10); break;
                case "inputs": model.inputs = parseInt(t[1], 10); model.outputs = parseInt(t[3], 10); break;
                case "int_heap_size":
                    var h = kv(t, 0);
                    model.intHeap = parseInt(h.int_heap_size, 10);
                    model.realHeap = parseInt(h.real_heap_size, 10);
                    model.srOffset = parseInt(h.sr_offset, 10);
                    model.countOffset = parseInt(h.count_offset, 10);
                    model.iotaOffset = parseInt(h.iota_offset, 10);
                    break;
            }
        }
        if (model.precision !== "float") throw new Error("FBC: only single precision (-single) is supported, got " + model.precision);
        // meta
        var n = blockSize();
        for (var k = 0; k < n; k++) {
            var mt = kv(tokenize(next()), 1);
            model.meta.push({ key: str(mt.key), value: str(mt.value) });
        }
        // user interface
        if (tokenize(next())[0] !== "user_interface_block") fail("expected user_interface_block");
        n = blockSize();
        for (k = 0; k < n; k++) {
            var ut = tokenize(next()), ua = kv(ut, 3);
            model.ui.push({
                op: ut[2], offset: parseInt(str(ua.offset), 10), label: str(ua.label), key: str(ua.key),
                value: str(ua.value), init: num(ua.init), min: num(ua.min), max: num(ua.max), step: num(ua.step)
            });
        }
        // code sections
        while (more()) {
            var sec = tokenize(next())[0];
            if (SECTIONS.indexOf(sec) < 0) fail("unknown section " + sec);
            model.blocks[sec] = readBlock();
        }
        SECTIONS.forEach(function (s) { if (!model.blocks[s]) throw new Error("FBC: missing " + s); });
        return model;
    }

    // ------------------------------------------------------------------ reference interpreter (float32)

    var BIN_REAL = {
        kAddReal: function (a, b) { return a + b; }, kSubReal: function (a, b) { return a - b; },
        kMultReal: function (a, b) { return a * b; }, kDivReal: function (a, b) { return a / b; },
        kRemReal: function (a, b) { return a % b; }, kFmodf: function (a, b) { return a % b; },
        kPowf: Math.pow, kAtan2f: Math.atan2, kMaxf: m.fmax, kMinf: m.fmin,
        kCopysignf: function (a, b) { return Math.abs(a) * ((b < 0 || Object.is(b, -0)) ? -1 : 1); }
    };
    var CMP_REAL = {
        kGTReal: function (a, b) { return a > b; }, kLTReal: function (a, b) { return a < b; },
        kGEReal: function (a, b) { return a >= b; }, kLEReal: function (a, b) { return a <= b; },
        kEQReal: function (a, b) { return a === b; }, kNEReal: function (a, b) { return a !== b; }
    };
    var BIN_INT = {
        kAddInt: function (a, b) { return (a + b) | 0; }, kSubInt: function (a, b) { return (a - b) | 0; },
        kMultInt: Math.imul, kDivInt: m.idiv, kRemInt: m.irem,
        kLshInt: function (a, b) { return a << (b & 31); }, kARshInt: function (a, b) { return a >> (b & 31); },
        kLRshInt: function (a, b) { return (a >>> (b & 31)) | 0; },
        kANDInt: function (a, b) { return a & b; }, kORInt: function (a, b) { return a | b; },
        kXORInt: function (a, b) { return a ^ b; },
        kMax: function (a, b) { return (a < b) ? b : a; }, kMin: function (a, b) { return (b < a) ? b : a; },
        kGTInt: function (a, b) { return a > b ? 1 : 0; }, kLTInt: function (a, b) { return a < b ? 1 : 0; },
        kGEInt: function (a, b) { return a >= b ? 1 : 0; }, kLEInt: function (a, b) { return a <= b ? 1 : 0; },
        kEQInt: function (a, b) { return a === b ? 1 : 0; }, kNEInt: function (a, b) { return a !== b ? 1 : 0; }
    };
    var UN_REAL = {
        kAbsf: Math.abs, kAcosf: Math.acos, kAcoshf: Math.acosh, kAsinf: Math.asin, kAsinhf: Math.asinh,
        kAtanf: Math.atan, kAtanhf: Math.atanh, kCeilf: Math.ceil, kCosf: Math.cos, kCoshf: Math.cosh,
        kExpf: Math.exp, kFloorf: Math.floor, kLogf: Math.log, kLog10f: Math.log10, kRintf: m.rintf,
        kRoundf: m.roundf, kSinf: Math.sin, kSinhf: Math.sinh, kSqrtf: Math.sqrt, kTanf: Math.tan, kTanhf: Math.tanh
    };

    function Interp(model) {
        this.m = model;
        this.R = new Float32Array(model.realHeap);
        this.I = new Int32Array(model.intHeap);
        this.inputs = null;
        this.outputs = null;
    }

    Interp.prototype.init = function (sampleRate) {
        var b = this.m.blocks;
        this.I[this.m.srOffset] = sampleRate;
        this.run(b.static_init_block);
        this.run(b.constants_block);
        this.run(b.reset_ui);
        this.run(b.clear_block);
    };

    Interp.prototype.compute = function (count, inputs, outputs) {
        this.I[this.m.countOffset] = count;
        this.inputs = inputs;
        this.outputs = outputs;
        this.run(this.m.blocks.control_block);
        this.run(this.m.blocks.dsp_block);
    };

    Interp.prototype.run = function (block) { this.exec(block, []); };

    Interp.prototype.exec = function (block, st) {
        var R = this.R, I = this.I, a, b, idx, fn;
        for (var pc = 0; pc < block.length; pc++) {
            var ins = block[pc], op = ins.op;
            switch (op) {
                case "kRealValue": st.push(fround(ins.r)); break;
                case "kInt32Value": st.push(ins.i); break;
                case "kLoadReal": st.push(R[ins.o1]); break;
                case "kLoadInt": st.push(I[ins.o1]); break;
                case "kStoreReal": R[ins.o1] = st.pop(); break;
                case "kStoreInt": I[ins.o1] = st.pop(); break;
                case "kStoreRealValue": R[ins.o1] = ins.r; break;
                case "kStoreIntValue": I[ins.o1] = ins.i; break;
                case "kLoadIndexedReal": idx = st.pop(); this.check(ins, idx); st.push(R[ins.o1 + idx]); break;
                case "kLoadIndexedInt": idx = st.pop(); this.check(ins, idx); st.push(I[ins.o1 + idx]); break;
                case "kStoreIndexedReal": idx = st.pop(); this.check(ins, idx); R[ins.o1 + idx] = st.pop(); break;
                case "kStoreIndexedInt": idx = st.pop(); this.check(ins, idx); I[ins.o1 + idx] = st.pop(); break;
                case "kLoadInput": idx = st.pop(); st.push(fround(this.inputs[ins.o1][idx])); break;
                case "kStoreOutput": idx = st.pop(); this.outputs[ins.o1][idx] = st.pop(); break;
                case "kCastReal": st.push(fround(st.pop())); break;
                case "kCastInt": st.push(m.ftoi(st.pop())); break;
                case "kAbs": a = st.pop(); st.push(a < 0 ? (-a) | 0 : a); break;
                case "kLoop": this.exec(ins.sub[0], st); this.exec(ins.sub[1], st); break;
                case "kCondBranch": if (st.pop()) pc = -1; break;     // back to the start of this (loop body) block
                case "kReturn": return;
                case "kSelectReal": case "kSelectInt":
                    this.exec(st.pop() ? ins.sub[0] : ins.sub[1], st); break;
                default:
                    if ((fn = BIN_REAL[op])) { a = st.pop(); b = st.pop(); st.push(fround(fn(a, b))); break; }
                    if ((fn = CMP_REAL[op])) { a = st.pop(); b = st.pop(); st.push(fn(a, b) ? 1 : 0); break; }
                    if ((fn = BIN_INT[op])) { a = st.pop(); b = st.pop(); st.push(fn(a, b) | 0); break; }
                    if ((fn = UN_REAL[op])) { st.push(fround(fn(st.pop()))); break; }
                    throw new Error("FBC interpreter: unsupported " + op);
            }
        }
    };

    Interp.prototype.check = function (ins, idx) {
        if (idx < 0 || idx >= ins.o2) throw new Error("FBC: index " + idx + " out of range for " + (ins.name || ins.op));
    };

    // count the instructions per block (sub-blocks included); used for the statistics
    function countInstr(block) {
        var n = 0;
        block.forEach(function (ins) {
            n++;
            if (ins.sub) ins.sub.forEach(function (s) { n += countInstr(s); });
        });
        return n;
    }

    return {
        parse: parse,
        Interp: Interp,
        countInstr: countInstr,
        BIN_REAL: BIN_REAL, CMP_REAL: CMP_REAL, BIN_INT: BIN_INT, UN_REAL: UN_REAL
    };
})();
