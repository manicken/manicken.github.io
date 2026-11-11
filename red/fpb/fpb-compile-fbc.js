// FBC -> FPB compiler (front end for Faust).
//
// RED.fpb.compileFBC(model, table, opts) -> { bytes, program, params, stats, warnings }
//   model: RED.fpb.fbc.parse(text)
//   table: RED.fpb.core.parseOpList(...) or the table read from the firmware
//   opts:  { sampleRate (default 44117, the int Faust gets on a Teensy), bigArrayTier ("any"), fastArrayMax (1024) }
//
// How it works:
//  1. The FBC reference interpreter runs static_init, constants, reset_ui and clear at the given sample rate.
//     The resulting heap gives every initial value, so those blocks never reach the Teensy.
//  2. control_block (-> blk) and the body of the dsp_block loop (-> smp) are run symbolically: the stack
//     machine becomes statements with expression trees. Heap locations that blk/smp never write and that
//     are not UI parameters are folded into constants.
//  3. Heap regions accessed with a computed index become arrays; everything else becomes slots.
//  4. Each statement is emitted as 3-address instructions writing straight into its destination slot;
//     mul+add / sub of mul become madd / msub.
RED.fpb = RED.fpb || {};
RED.fpb.compileFBC = (function () {
    "use strict";

    var core = RED.fpb.core, fround = Math.fround;

    var BIN_F = { kAddReal: "add", kSubReal: "sub", kMultReal: "mul", kDivReal: "div", kRemReal: "fmod", kFmodf: "fmod",
                  kPowf: "pow", kAtan2f: "atan2", kMaxf: "max", kMinf: "min", kCopysignf: "copysign" };
    var CMP_F = { kGTReal: "gt", kLTReal: "lt", kGEReal: "ge", kLEReal: "le", kEQReal: "eq", kNEReal: "ne" };
    var BIN_I = { kAddInt: "iadd", kSubInt: "isub", kMultInt: "imul", kDivInt: "idiv", kRemInt: "irem", kLshInt: "ishl",
                  kARshInt: "ishr", kLRshInt: "iushr", kANDInt: "iand", kORInt: "ior", kXORInt: "ixor", kMax: "imax",
                  kMin: "imin", kGTInt: "igt", kLTInt: "ilt", kGEInt: "ige", kLEInt: "ile", kEQInt: "ieq", kNEInt: "ine" };
    var UN_F = { kAbsf: "abs", kAcosf: "acos", kAcoshf: "acosh", kAsinf: "asin", kAsinhf: "asinh", kAtanf: "atan",
                 kAtanhf: "atanh", kCeilf: "ceil", kCosf: "cos", kCoshf: "cosh", kExpf: "exp", kFloorf: "floor",
                 kLogf: "log", kLog10f: "log10", kRintf: "rint", kRoundf: "round", kSinf: "sin", kSinhf: "sinh",
                 kSqrtf: "sqrt", kTanf: "tan", kTanhf: "tanh" };
    var PARAM_WIDGETS = { kAddButton: 1, kAddCheckButton: 1, kAddHorizontalSlider: 1, kAddVerticalSlider: 1, kAddNumEntry: 1 };
    var BARGRAPHS = { kAddHorizontalBargraph: 1, kAddVerticalBargraph: 1 };

    function CompileError(msg) { var e = new Error("FBC->FPB: " + msg); e.fpb = true; return e; }

    // ------------------------------------------------------------------ expression nodes

    function C(t, v) { return { k: "c", t: t, v: t === "f" ? fround(v) : (v | 0) }; }
    function isC(n) { return n.k === "c"; }

    // fold an op on constants with exactly the VM semantics (core.OP_IMPL)
    function foldOp(op, t, args) {
        var F = new Float32Array(4), I = new Int32Array(4), o = [0];
        var sig = OP_SIG[op];
        var k = 1;
        args.forEach(function (a, j) {
            var kind = sig[2 + j];        // sig is "x=yy.."; args start after "x="
            if (kind === "f") F[k] = a.v; else I[k] = a.v;
            o.push(k++);
        });
        core.OP_IMPL[op](F, I, null, o);
        return C(t, t === "f" ? F[0] : I[0]);
    }
    var OP_SIG = {};   // filled from the table when compiling

    function mkOp(t, op, args) {
        if (args.every(isC)) return foldOp(op, t, args);
        return { k: "op", t: t, op: op, a: args };
    }

    // does the node read heap type t in [lo, hi)?
    function reads(n, t, lo, hi) {
        switch (n.k) {
            case "ld": return n.t === t && n.off >= lo && n.off < hi;
            case "lx":
                if (n.t === t) {
                    if (isC(n.idx)) { var o = n.base + n.idx.v; if (o >= lo && o < hi) return true; }
                    else if (n.base < hi && n.base + n.size > lo) return true;
                }
                return reads(n.idx, t, lo, hi);
            case "op": return n.a.some(function (a) { return reads(a, t, lo, hi); });
            case "sel": return reads(n.c, t, lo, hi) || reads(n.a, t, lo, hi) || reads(n.b, t, lo, hi);
        }
        return false;
    }

    // ------------------------------------------------------------------ symbolic execution

    function Sym(ctx, mode) { this.ctx = ctx; this.mode = mode; this.stmts = []; }

    Sym.prototype.written = function (t, off) {
        var ctx = this.ctx;
        if (ctx.writes[t + off]) return true;
        return ctx.writeRegions.some(function (r) { return r.t === t && off >= r.base && off < r.base + r.size; });
    };

    Sym.prototype.load = function (t, off) {
        var ctx = this.ctx;
        if (ctx.folding && !this.written(t, off) && !(t === "f" && ctx.paramOffsets[off] !== undefined))
            return C(t, t === "f" ? ctx.R[off] : ctx.I[off]);
        return { k: "ld", t: t, off: off };
    };

    Sym.prototype.loadx = function (t, base, size, idx) {
        if (isC(idx)) {
            if (idx.v < 0 || idx.v >= size) throw CompileError("constant index " + idx.v + " out of range");
            var off = base + idx.v, n = this.load(t, off);
            if (isC(n)) return n;
            return { k: "lx", t: t, base: base, size: size, idx: idx };
        }
        this.ctx.dyn[t + ":" + base + ":" + size] = { t: t, base: base, size: size };
        return { k: "lx", t: t, base: base, size: size, idx: idx };
    };

    // a store is about to happen: values still on the stack that read the stored range are saved first
    Sym.prototype.hazard = function (st, t, lo, hi) {
        for (var j = 0; j < st.length; j++) {
            if (!isC(st[j]) && reads(st[j], t, lo, hi)) {
                var n = this.ctx.hazards++;
                this.stmts.push({ k: "hs", t: st[j].t, n: n, v: st[j] });
                st[j] = { k: "h", t: st[j].t, n: n };
            }
        }
    };

    Sym.prototype.store = function (st, t, off, v) {
        this.hazard(st, t, off, off + 1);
        this.ctx.writes[t + off] = true;
        this.stmts.push({ k: "st", t: t, off: off, v: v });
    };

    Sym.prototype.storex = function (st, t, base, size, idx, v) {
        if (isC(idx)) {
            if (idx.v < 0 || idx.v >= size) throw CompileError("constant index " + idx.v + " out of range");
            var off = base + idx.v;
            this.hazard(st, t, off, off + 1);
            this.ctx.writes[t + off] = true;
            this.stmts.push({ k: "sx", t: t, base: base, size: size, idx: idx, v: v });
            return;
        }
        this.hazard(st, t, base, base + size);
        this.ctx.dyn[t + ":" + base + ":" + size] = { t: t, base: base, size: size };
        if (!this.ctx.writeRegions.some(function (r) { return r.t === t && r.base === base; }))
            this.ctx.writeRegions.push({ t: t, base: base, size: size });
        this.stmts.push({ k: "sx", t: t, base: base, size: size, idx: idx, v: v });
    };

    Sym.prototype.exec = function (block, st, inSelect) {
        var ctx = this.ctx, model = ctx.model, a, b, idx, v;
        function pop() { if (!st.length) throw CompileError("stack underflow"); return st.pop(); }
        for (var pc = 0; pc < block.length; pc++) {
            var ins = block[pc], op = ins.op;
            if (inSelect && /^kStore/.test(op)) throw CompileError("a select branch with a store is not supported yet");
            switch (op) {
                case "kRealValue": st.push(C("f", ins.r)); break;
                case "kInt32Value": st.push(C("i", ins.i)); break;
                case "kLoadReal": st.push(this.load("f", ins.o1)); break;
                case "kLoadInt":
                    if (this.mode === "smp" && ins.o1 === ctx.loopVar) st.push({ k: "li", t: "i" });
                    else if (ins.o1 === model.countOffset) st.push({ k: "count", t: "i" });
                    else st.push(this.load("i", ins.o1));
                    break;
                case "kStoreReal": v = pop(); this.store(st, "f", ins.o1, v); break;
                case "kStoreInt":
                    v = pop();
                    if (this.mode === "smp" && ins.o1 === ctx.loopVar) break;   // the loop counter increment
                    this.store(st, "i", ins.o1, v);
                    break;
                case "kStoreRealValue": this.store(st, "f", ins.o1, C("f", ins.r)); break;
                case "kStoreIntValue": this.store(st, "i", ins.o1, C("i", ins.i)); break;
                case "kLoadIndexedReal": idx = pop(); st.push(this.loadx("f", ins.o1, ins.o2, idx)); break;
                case "kLoadIndexedInt": idx = pop(); st.push(this.loadx("i", ins.o1, ins.o2, idx)); break;
                case "kStoreIndexedReal": idx = pop(); v = pop(); this.storex(st, "f", ins.o1, ins.o2, idx, v); break;
                case "kStoreIndexedInt": idx = pop(); v = pop(); this.storex(st, "i", ins.o1, ins.o2, idx, v); break;
                case "kLoadInput":
                    idx = pop();
                    if (idx.k !== "li") throw CompileError("input read with an index other than the sample loop");
                    st.push({ k: "in", t: "f", ch: ins.o1 });
                    break;
                case "kStoreOutput":
                    idx = pop(); v = pop();
                    if (idx.k !== "li") throw CompileError("output write with an index other than the sample loop");
                    this.stmts.push({ k: "out", ch: ins.o1, v: v });
                    break;
                case "kCastReal": st.push(mkOp("f", "itof", [pop()])); break;
                case "kCastInt": st.push(mkOp("i", "ftoi", [pop()])); break;
                case "kAbs": st.push(mkOp("i", "iabs", [pop()])); break;
                case "kCondBranch":
                    if (this.mode !== "smp") throw CompileError("branch outside the sample loop");
                    pop();          // the loop condition
                    break;
                case "kReturn": return;
                case "kSelectReal": case "kSelectInt": {
                    var c = pop(), t = op === "kSelectReal" ? "f" : "i";
                    var x = this.branch(ins.sub[0]), y = this.branch(ins.sub[1]);
                    if (isC(c)) st.push(c.v ? x : y);
                    else st.push({ k: "sel", t: t, c: c, a: x, b: y });
                    break;
                }
                case "kLoop": throw CompileError("loops are only supported as the dsp_block sample loop (compile Faust in scalar mode)");
                default:
                    if (BIN_F[op]) { a = pop(); b = pop(); st.push(mkOp("f", BIN_F[op], [a, b])); break; }
                    if (CMP_F[op]) { a = pop(); b = pop(); st.push(mkOp("i", CMP_F[op], [a, b])); break; }
                    if (BIN_I[op]) { a = pop(); b = pop(); st.push(mkOp("i", BIN_I[op], [a, b])); break; }
                    if (UN_F[op]) { st.push(mkOp("f", UN_F[op], [pop()])); break; }
                    throw CompileError("FBC instruction " + op + " is not supported");
            }
        }
    };

    Sym.prototype.branch = function (block) {
        var st = [];
        this.exec(block, st, true);
        if (st.length !== 1) throw CompileError("a select branch left " + st.length + " values");
        return st[0];
    };

    function runSymbolic(ctx) {
        var b = ctx.model.blocks;
        var blk = new Sym(ctx, "blk"), st = [];
        blk.exec(b.control_block, st, false);
        if (st.length) throw CompileError("control_block left values on the stack");

        var dsp = b.dsp_block;
        if (!(dsp.length === 2 && dsp[0].op === "kLoop" && dsp[1].op === "kReturn"))
            throw CompileError("dsp_block must be one sample loop (compile Faust in scalar mode)");
        var init = dsp[0].sub[0];
        if (!(init.length === 3 && init[0].op === "kInt32Value" && init[0].i === 0 && init[1].op === "kStoreInt"))
            throw CompileError("unexpected sample loop header");
        ctx.loopVar = init[1].o1;
        var smp = new Sym(ctx, "smp");
        st = [];
        smp.exec(dsp[0].sub[1], st, false);
        if (st.length) throw CompileError("the sample loop left values on the stack");
        return { blk: blk.stmts, smp: smp.stmts };
    }

    // ------------------------------------------------------------------ code generation

    function Gen(cls) {
        this.cls = cls;
        this.code = [];
        this.tmp = { f: 0, i: 0 };
        this.maxTmp = { f: 0, i: 0 };
    }

    Gen.prototype.emit = function (op, ops) { this.code.push({ op: op, ops: ops }); };
    Gen.prototype.newTmp = function (t) {
        var n = this.tmp[t]++;
        if (this.tmp[t] > this.maxTmp[t]) this.maxTmp[t] = this.tmp[t];
        return { s: t, kind: "tmp", n: n };
    };
    Gen.prototype.loc = function (t, off) {
        if (t === "f" && this.cls.paramOffsets[off] !== undefined) return { s: "f", kind: "param", n: this.cls.paramOffsets[off] };
        if (this.cls.inDynRegion(t, off)) throw CompileError("a scalar access inside an array region (offset " + off + ")");
        var a = this.cls.alias[t + off];                 // a one-sample copy that was removed: the same slot as its source
        if (a !== undefined) off = a;
        return { s: t, kind: "loc", key: t + off, off: off };
    };

    /**
     * a delay line access: idx = (x & mask) or ((a - b) & mask) with mask = len - 1 of a power-of-two array
     * @returns {{x}|{a, b}|undefined}
     */
    function delayIndex(n, idx) {
        if (n.t !== "f" || (n.size & (n.size - 1)) !== 0 || idx.k !== "op" || idx.op !== "iand") return undefined;
        var mask = n.size - 1, x;
        if (isC(idx.a[1]) && idx.a[1].v === mask) x = idx.a[0];
        else if (isC(idx.a[0]) && idx.a[0].v === mask) x = idx.a[1];
        else return undefined;
        if (x.k === "op" && x.op === "isub") return { a: x.a[0], b: x.a[1] };
        return { x: x };
    }
    Gen.prototype.isDyn = function (n) { return !!this.cls.dyn[n.t + ":" + n.base + ":" + n.size]; };
    Gen.prototype.arr = function (n) { return { s: "a", kind: "arr", key: n.t + ":" + n.base + ":" + n.size }; };
    Gen.prototype.same = function (a, b) {
        return a.s === b.s && a.kind === b.kind && a.n === b.n && a.key === b.key && a.ch === b.ch && a.v === b.v;
    };
    Gen.prototype.mov = function (dst, r) {
        if (!this.same(dst, r)) this.emit(dst.s === "f" ? "mov" : "imov", [dst, r]);
        return dst;
    };

    function isMul(n) { return n.k === "op" && n.op === "mul"; }

    Gen.prototype.gen = function (n, dst) {
        var r, d;
        switch (n.k) {
            case "c": r = { s: n.t, kind: "const", v: n.v, bits: n.t === "f" ? floatBits(n.v) : n.v }; break;
            case "ld": r = this.loc(n.t, n.off); break;
            case "in": r = { s: "f", kind: "in", ch: n.ch }; break;
            case "h": r = { s: n.t, kind: "h", n: n.n }; break;
            case "li": throw CompileError("the sample index is used as a value (not supported)");
            case "count": throw CompileError("'count' is used as a value (not supported)");
            case "lx":
                if (isC(n.idx) && !this.isDyn(n)) { r = this.loc(n.t, n.base + n.idx.v); break; }
                var di = this.cls.delayOps ? delayIndex(n, n.idx) : undefined;
                if (di !== undefined && di.a !== undefined) {           // arr[(a - b) & mask]: one op instead of three
                    var da = this.gen(di.a), db = this.gen(di.b);
                    d = dst || this.newTmp(n.t);
                    this.emit("dlyrd", [d, this.arr(n), da, db]);
                    return d;
                }
                if (di !== undefined) {                                  // arr[x & mask]
                    var dx = this.gen(di.x);
                    d = dst || this.newTmp(n.t);
                    this.emit("rdfm", [d, this.arr(n), dx]);
                    return d;
                }
                var ix = this.gen(n.idx);
                d = dst || this.newTmp(n.t);
                this.emit(n.t === "f" ? "rdf" : "rdi", [d, this.arr(n), ix]);
                return d;
            case "sel":
                var c = this.gen(n.c), x = this.gen(n.a), y = this.gen(n.b);
                d = dst || this.newTmp(n.t);
                this.emit(n.t === "f" ? "select" : "iselect", [d, c, x, y]);
                return d;
            case "op":
                var op = n.op, args = n.a;
                if (n.t === "f" && op === "add" && isMul(args[0])) { op = "madd"; args = [args[0].a[0], args[0].a[1], args[1]]; }
                else if (n.t === "f" && op === "add" && isMul(args[1])) { op = "madd"; args = [args[1].a[0], args[1].a[1], args[0]]; }
                else if (n.t === "f" && op === "sub" && isMul(args[1])) { op = "msub"; args = [args[1].a[0], args[1].a[1], args[0]]; }
                var refs = [];
                for (var k = 0; k < args.length; k++) refs.push(this.gen(args[k]));
                d = dst || this.newTmp(n.t);
                this.emit(op, [d].concat(refs));
                return d;
            default: throw CompileError("internal: node " + n.k);
        }
        return dst ? this.mov(dst, r) : r;
    };

    Gen.prototype.statement = function (s) {
        this.tmp = { f: 0, i: 0 };
        switch (s.k) {
            case "st": this.gen(s.v, this.loc(s.t, s.off)); break;
            case "sx":
                if (isC(s.idx) && !this.isDyn(s)) { this.gen(s.v, this.loc(s.t, s.base + s.idx.v)); break; }
                var di = this.cls.delayOps ? delayIndex(s, s.idx) : undefined;
                if (di !== undefined && di.x !== undefined) {           // arr[x & mask] = v
                    var wx = this.gen(di.x), wv = this.gen(s.v);
                    this.emit("wrfm", [this.arr(s), wx, wv]);
                    break;
                }
                var ix = this.gen(s.idx), v = this.gen(s.v);
                this.emit(s.t === "f" ? "wrf" : "wri", [this.arr(s), ix, v]);
                break;
            case "out": this.gen(s.v, { s: "f", kind: "out", ch: s.ch }); break;
            case "hs": this.gen(s.v, { s: s.t, kind: "h", n: s.n }); break;
            default: throw CompileError("internal: statement " + s.k);
        }
    };

    // ------------------------------------------------------------------ optimisations

    /**
     * Removes one-sample copies "B = A" (Faust's fRec[1] = fRec[0] at the end of the loop) by giving B the slot of A.
     * Allowed when, in the sample code:
     *   - B is written only by the copy, A only once (W), W comes before the copy, neither in the control code;
     *   - B is not read between W and the copy (it would then see the new A);
     *   - B and A start with the same value, and neither is a parameter.
     * The next sample then reads A's slot where it read B, which holds the same value. Chains (fRec[2] = fRec[1];
     * fRec[1] = fRec[0]) fail the "not read between" rule and stay; those become mov2 pairs.
     * @returns {Object} alias: "t" + off -> off of the slot to use
     */
    function eliminateCopies(stm, cls, ref) {
        var alias = {};
        function resolve(t, off) { var k = t + off; while (alias[k] !== undefined) { off = alias[k]; k = t + off; } return off; }
        function scalar(t, base, size, idx) { return isC(idx) && !cls.dyn[t + ":" + base + ":" + size] ? base + idx.v : undefined; }
        function dest(s) {
            if (s.k === "st") return { t: s.t, off: resolve(s.t, s.off) };
            if (s.k === "sx") { var o = scalar(s.t, s.base, s.size, s.idx); if (o !== undefined) return { t: s.t, off: resolve(s.t, o) }; }
            return undefined;
        }
        function source(v) {
            if (v.k === "ld") return { t: v.t, off: resolve(v.t, v.off) };
            if (v.k === "lx") { var o = scalar(v.t, v.base, v.size, v.idx); if (o !== undefined) return { t: v.t, off: resolve(v.t, o) }; }
            return undefined;
        }
        function reads(n, t, off) {
            switch (n.k) {
                case "ld": return n.t === t && resolve(n.t, n.off) === off;
                case "lx":
                    var o = scalar(n.t, n.base, n.size, n.idx);
                    if (o !== undefined && n.t === t && resolve(n.t, o) === off) return true;
                    return reads(n.idx, t, off);
                case "op": return n.a.some(function (a) { return reads(a, t, off); });
                case "sel": return reads(n.c, t, off) || reads(n.a, t, off) || reads(n.b, t, off);
            }
            return false;
        }
        function stmReads(s, t, off) { return reads(s.v, t, off) || (s.idx !== undefined && reads(s.idx, t, off)); }
        function sameInit(t, a, b) { var A = (t === "f") ? ref.R : ref.I; return Object.is(A[a], A[b]); }

        var smp = stm.smp.slice(), removed = 0;
        for (var si = 0; si < smp.length; si++) {
            var S = smp[si], d = dest(S), src = (d !== undefined) ? source(S.v) : undefined;
            if (src === undefined || src.t !== d.t) continue;
            var t = d.t, B = d.off, A = src.off;
            if (t === "f" && (cls.paramOffsets[B] !== undefined || cls.paramOffsets[A] !== undefined)) continue;
            if (A === B) { smp.splice(si--, 1); removed++; continue; }
            if (stm.blk.some(function (s) { var x = dest(s); return x !== undefined && x.t === t && (x.off === A || x.off === B); })) continue;
            var wB = 0, wA = [];
            smp.forEach(function (s, i) {
                var x = dest(s);
                if (x === undefined || x.t !== t) return;
                if (x.off === B) wB++;
                if (x.off === A) wA.push(i);
            });
            if (wB !== 1 || wA.length !== 1 || wA[0] >= si) continue;
            var between = false;
            for (var k = wA[0] + 1; k < si && !between; k++) between = stmReads(smp[k], t, B);
            if (between || !sameInit(t, A, B)) continue;
            alias[t + B] = A;
            smp.splice(si--, 1);
            removed++;
        }
        // resolve chains once, for Gen.loc
        Object.keys(alias).forEach(function (k) { alias[k] = resolve(k.charAt(0), alias[k]); });
        stm.smp = smp;
        return { alias: alias, removed: removed };
    }

    /** two movs in a row -> mov2 (the same order of the copies, one dispatch instead of two) */
    function pairMovs(code) {
        var out = [];
        for (var k = 0; k < code.length; k++) {
            var a = code[k], b = code[k + 1];
            if (a.op === "mov" && b !== undefined && b.op === "mov") {
                out.push({ op: "mov2", ops: [a.ops[0], b.ops[0], a.ops[1], b.ops[1]] });
                k++;
            } else out.push(a);
        }
        return out;
    }

    function floatBits(v) { var b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, v); return b.getUint32(0); }

    // ------------------------------------------------------------------ parameters (UI)

    function collectParams(model, warnings) {
        var params = [], path = [], declares = {};
        model.ui.forEach(function (u) {
            switch (u.op) {
                case "kOpenVerticalBox": case "kOpenHorizontalBox": case "kOpenTabBox": path.push(u.label); break;   // "0x00": anonymous
                case "kCloseBox": path.pop(); break;
                case "kDeclare":
                    if (u.offset >= 0) (declares[u.offset] = declares[u.offset] || {})[u.key] = u.value;
                    break;
                case "kAddSoundfile": throw CompileError("soundfile is not supported yet");
                default:
                    if (BARGRAPHS[u.op]) { warnings.push("bargraph '" + u.label + "' is not exported (outputs to the tool are not supported yet)"); break; }
                    if (!PARAM_WIDGETS[u.op]) break;
                    var isButton = u.op === "kAddButton" || u.op === "kAddCheckButton";
                    params.push({
                        index: params.length,
                        label: u.label,
                        // the groups without the outermost (the patch) and without the anonymous ones, as Faust's own UIs do
                        path: path.slice(1).filter(function (g) { return g != "" && g != "0x00"; }).concat([u.label]).join("/"),
                        widget: u.op.replace(/^kAdd/, ""),
                        offset: u.offset,
                        init: isButton ? 0 : u.init,
                        min: isButton ? 0 : u.min,
                        max: isButton ? 1 : u.max,
                        step: isButton ? 1 : u.step,
                        meta: declares[u.offset] || {}
                    });
            }
        });
        return params;
    }

    // ------------------------------------------------------------------ main

    function compile(model, table, opts) {
        opts = opts || {};
        var sampleRate = opts.sampleRate || 44117;
        var fastMax = opts.fastArrayMax || 1024;
        var bigTier = opts.bigArrayTier || "any";
        var warnings = [];

        OP_SIG = {};
        Object.keys(table.byName).forEach(function (nm) { OP_SIG[nm] = table.byName[nm].sig; });

        // 1. initial heap
        var ref = new RED.fpb.fbc.Interp(model);
        ref.init(sampleRate);
        var params = collectParams(model, warnings);
        var paramOffsets = {};
        params.forEach(function (p) { paramOffsets[p.offset] = p.index; p.def = ref.R[p.offset]; });

        // 2. symbolic execution: pass 1 finds what blk/smp write, pass 2 folds everything else
        var ctx = { model: model, R: ref.R, I: ref.I, paramOffsets: paramOffsets, folding: false,
                    writes: {}, writeRegions: [], dyn: {}, hazards: 0 };
        runSymbolic(ctx);
        ctx = { model: model, R: ref.R, I: ref.I, paramOffsets: paramOffsets, folding: true,
                writes: ctx.writes, writeRegions: ctx.writeRegions, dyn: {}, hazards: 0 };
        var stm = runSymbolic(ctx);

        // 3. classification
        var dynList = Object.keys(ctx.dyn).map(function (k) { return ctx.dyn[k]; });
        var has = function (op) { return table.byName[op] !== undefined; };   // an older firmware may not have the newer ops
        var cls = {
            paramOffsets: paramOffsets,
            dyn: ctx.dyn,
            alias: {},
            delayOps: has("dlyrd") && has("rdfm") && has("wrfm"),
            inDynRegion: function (t, off) {
                return dynList.some(function (r) { return r.t === t && off >= r.base && off < r.base + r.size; });
            }
        };
        var opt = opts.optimize === false ? { removed: 0 } : eliminateCopies(stm, cls, ref);
        if (opt.alias) cls.alias = opt.alias;

        // 4. code
        var gen = new Gen(cls);
        stm.blk.forEach(function (s) { gen.statement(s); });
        var blkCode = gen.code;
        gen.code = [];
        stm.smp.forEach(function (s) { gen.statement(s); });
        var smpCode = gen.code;
        if (opts.optimize !== false && has("mov2")) { blkCode = pairMovs(blkCode); smpCode = pairMovs(smpCode); }

        // 5. slots
        var nIn = model.inputs, nOut = model.outputs;
        var fSlot = nIn + nOut + params.length, iSlot = 0;
        var fLoc = {}, iLoc = {}, fConst = {}, iConst = {}, fconsts = [], iconsts = [];
        var all = blkCode.concat(smpCode);
        all.forEach(function (ins) {
            ins.ops.forEach(function (r) {
                if (r.kind === "loc") {
                    if (r.s === "f" && fLoc[r.key] === undefined) {
                        fLoc[r.key] = fSlot++;
                        var fv = ref.R[r.off];
                        if (fv !== 0 || Object.is(fv, -0)) fconsts.push({ slot: fLoc[r.key], value: fv });
                    } else if (r.s === "i" && iLoc[r.key] === undefined) {
                        iLoc[r.key] = iSlot++;
                        if (ref.I[r.off] !== 0) iconsts.push({ slot: iLoc[r.key], value: ref.I[r.off] });
                    }
                }
            });
        });
        all.forEach(function (ins) {
            ins.ops.forEach(function (r) {
                if (r.kind !== "const") return;
                if (r.s === "f" && fConst[r.bits] === undefined) { fConst[r.bits] = fSlot++; fconsts.push({ slot: fConst[r.bits], value: r.v }); }
                if (r.s === "i" && iConst[r.v] === undefined) { iConst[r.v] = iSlot++; if (r.v !== 0) iconsts.push({ slot: iConst[r.v], value: r.v }); }
            });
        });
        var fH = fSlot, iH = iSlot;
        fSlot += ctx.hazards; iSlot += ctx.hazards;       // hazard temps (one per hazard, both kinds reserved)
        var fT = fSlot, iT = iSlot;
        fSlot += gen.maxTmp.f; iSlot += gen.maxTmp.i;

        var arrays = [], arrIndex = {};
        dynList.forEach(function (r) {
            var key = r.t + ":" + r.base + ":" + r.size;
            arrIndex[key] = arrays.length;
            var src = r.t === "f" ? ref.R : ref.I;
            arrays.push({ key: key, tier: r.size <= fastMax ? "fast" : bigTier, type: r.t, len: r.size,
                          data: src.slice(r.base, r.base + r.size) });
        });

        function resolve(r) {
            switch (r.kind) {
                case "in": return r.ch;
                case "out": return nIn + r.ch;
                case "param": return nIn + nOut + r.n;
                case "loc": return r.s === "f" ? fLoc[r.key] : iLoc[r.key];
                case "const": return r.s === "f" ? fConst[r.bits] : iConst[r.v];
                case "h": return (r.s === "f" ? fH : iH) + r.n;
                case "tmp": return (r.s === "f" ? fT : iT) + r.n;
                case "arr": return arrIndex[r.key];
            }
            throw CompileError("internal: operand " + r.kind);
        }
        function fin(code) { return code.map(function (ins) { return { op: ins.op, ops: ins.ops.map(resolve) }; }); }

        var program = {
            nIn: nIn, nOut: nOut, fSlots: fSlot, iSlots: iSlot,
            arrays: arrays,
            fconsts: fconsts, iconsts: iconsts,
            params: params.map(function (p) { return { slot: nIn + nOut + p.index, def: p.def }; }),
            blk: fin(blkCode), smp: fin(smpCode)
        };
        var bytes = RED.fpb.format.encode(program, table);

        var memFast = 0, memBig = 0;
        arrays.forEach(function (a) { if (a.tier === "fast") memFast += a.len * 4; else memBig += a.len * 4; });
        var body = model.blocks.dsp_block[0].sub[1];
        var stats = {
            fbcControl: RED.fpb.fbc.countInstr(model.blocks.control_block),
            fbcSample: RED.fpb.fbc.countInstr(body),
            blk: program.blk.length,
            smp: program.smp.length,
            copiesRemoved: opt.removed,
            fSlots: fSlot, iSlots: iSlot,
            arrays: arrays.map(function (a) { return { type: a.type, len: a.len, tier: a.tier }; }),
            arrayBytesFast: memFast,
            arrayBytesBig: memBig,
            bytes: bytes.length
        };
        return { bytes: bytes, program: program, params: params, stats: stats, warnings: warnings, sampleRate: sampleRate };
    }

    return compile;
})();
