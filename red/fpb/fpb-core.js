// FPB (float patch bytecode), shared helpers for the tool side.
// The format is described in specs/fpb-bytecode.md; the firmware side is fpb/teensy/FPB.
//
// RED.fpb.core:
//   parseOpList(text)        op table from FPB_oplist.h (the same file the firmware is built from)
//   fingerprint(name, sig)   16-bit op fingerprint (must match fpb_fingerprint in FPB_ops.cpp)
//   crc32(bytes, crc)        IEEE CRC-32, as zlib
//   ERRORS                   loader error codes (same values as FPB_Error in FPB.h)
//   OP_IMPL                  JS semantics of every op, used by the verifier VM (fpb-vm.js)
//   m                        float32/int32 math helpers shared with the FBC reference interpreter
RED.fpb = RED.fpb || {};
RED.fpb.core = (function () {
    "use strict";

    var fround = Math.fround;

    var FLAGS = { PURE: 0x01, STATEFUL: 0x02, ARRAY: 0x04, RESERVED: 0x40, REMOVED: 0x80 };

    var ERRORS = {
        OK: 0, E_MAGIC: -1, E_VERSION: -2, E_HEADER: -3, E_OPCOUNT: -4, E_OP_INDEX: -5, E_OP_RESERVED: -6,
        E_OP_REMOVED: -7, E_OP_ARITY: -8, E_OP_FP: -9, E_ARRAY: -10, E_NOMEM: -11, E_SLOT: -12, E_INSTR_OP: -13,
        E_INSTR_ARITY: -14, E_OPERAND: -15, E_WRITE_INPUT: -16, E_CODE_SIZE: -17, E_DATA_SIZE: -18, E_CRC: -19,
        E_TRAILING: -20, E_INCOMPLETE: -21, E_STATE: -22
    };
    var ERROR_NAMES = {};
    Object.keys(ERRORS).forEach(function (k) { ERROR_NAMES[ERRORS[k]] = k; });

    // ------------------------------------------------------------------ op table

    function sigArity(sig) { return sig.replace("=", "").length; }

    function fingerprint(name, sig) {
        var h = 0x811c9dc5, k;
        function b(x) { h ^= x; h = Math.imul(h, 16777619) >>> 0; }
        for (k = 0; k < name.length; k++) b(name.charCodeAt(k) & 0xff);
        b(0);
        for (k = 0; k < sig.length; k++) b(sig.charCodeAt(k) & 0xff);
        return ((h >>> 16) ^ (h & 0xffff)) & 0xffff;
    }

    function makeOp(index, name, sig, flags) {
        return { index: index, name: name, sig: sig, flags: flags, arity: sigArity(sig), fp: fingerprint(name, sig) };
    }

    // Reads the FPB_OP_LIST from FPB_oplist.h. Returns { ops: [..by index..], byName: {}, groups: [] }.
    function parseOpList(text) {
        var listStart = text.indexOf("#define FPB_OP_LIST");
        if (listStart < 0) throw new Error("FPB_OP_LIST not found");
        var listEnd = text.indexOf("#define", listStart + 10);
        var body = text.substring(listStart, listEnd < 0 ? text.length : listEnd);
        var re = /FPB_(OP|RES|DEL)\(\s*(\d+)\s*(?:,\s*(\w+)\s*,\s*"([^"]*)"\s*(?:,\s*([\w\s|]+?)\s*)?)?\)/g, m;
        var ops = [];
        while ((m = re.exec(body))) {
            var index = parseInt(m[2], 10);
            if (index !== ops.length) throw new Error("FPB_OP_LIST: index " + index + " at position " + ops.length);
            if (m[1] === "RES") { ops.push(makeOp(index, "", "", FLAGS.RESERVED)); continue; }
            if (m[1] === "DEL") { ops.push(makeOp(index, m[3], m[4], FLAGS.REMOVED)); continue; }
            var flags = 0;
            (m[5] || "").split("|").forEach(function (f) {
                f = f.trim();
                if (!f || f === "0") return;
                if (!(f in FLAGS)) throw new Error("FPB_OP_LIST: unknown flag " + f);
                flags |= FLAGS[f];
            });
            ops.push(makeOp(index, m[3], m[4], flags));
        }
        var groups = [];
        var gre = /FPB_GROUP\(\s*"([^"]*)"\s*,\s*(\d+)\s*\)/g;
        while ((m = gre.exec(text))) groups.push({ name: m[1], first: parseInt(m[2], 10) });
        return fromList(ops, groups);
    }

    // Builds a table from rows like the firmware sends them: [{index, name, sig, flags}]
    function fromList(rows, groups) {
        var ops = [], byName = {};
        rows.forEach(function (r) {
            var op = makeOp(r.index, r.name, r.sig, r.flags);
            ops[r.index] = op;
            if (!(op.flags & (FLAGS.RESERVED | FLAGS.REMOVED))) byName[op.name] = op;
        });
        for (var k = 0; k < ops.length; k++) if (!ops[k]) ops[k] = makeOp(k, "", "", FLAGS.RESERVED);
        return { ops: ops, byName: byName, groups: groups || [], count: ops.length };
    }

    // ------------------------------------------------------------------ crc32

    var CRC_TABLE = (function () {
        var t = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();

    function crc32(bytes, crc, start, end) {
        crc = (crc || 0) ^ 0xFFFFFFFF;
        start = start || 0;
        end = (end === undefined) ? bytes.length : end;
        for (var k = start; k < end; k++) crc = CRC_TABLE[(crc ^ bytes[k]) & 0xff] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    // ------------------------------------------------------------------ float32 / int32 math

    var m = {
        f: fround,
        i: function (x) { return x | 0; },
        ftoi: function (x) {
            if (x !== x) return 0;
            if (x >= 2147483647) return 2147483647;
            if (x <= -2147483648) return -2147483648;
            return (x < 0 ? Math.ceil(x) : Math.floor(x)) | 0;
        },
        roundf: function (x) {            // C roundf: half away from zero
            if (!isFinite(x)) return x;
            var r = x < 0 ? -Math.floor(-x + 0.5) : Math.floor(x + 0.5);
            return fround(r === 0 ? (x < 0 ? -0 : 0) : r);
        },
        rintf: function (x) {             // C rintf (round half to even)
            if (!isFinite(x)) return x;
            var r = Math.round(x);
            if (Math.abs(x - Math.trunc(x)) === 0.5) r = 2 * Math.round(x / 2);
            return fround(r);
        },
        idiv: function (a, b) { if (b === 0) return 0; if (b === -1) return (-a) | 0; return (a / b) | 0; },
        irem: function (a, b) { if (b === 0 || b === -1) return 0; return (a % b) | 0; },
        fmin: function (a, b) { return (b < a) ? b : a; },     // std::min(a, b)
        fmax: function (a, b) { return (a < b) ? b : a; },     // std::max(a, b)
        fmodf: function (a, b) { return fround(a % b); }
    };

    // ------------------------------------------------------------------ op semantics (for the verifier VM)
    // impl(F, I, A, o): F/I are the slot arrays (Float32Array / Int32Array), A the arrays (typed arrays),
    // o the operand indices of the instruction.
    function f1(fn) { return function (F, I, A, o) { F[o[0]] = fn(F[o[1]]); }; }
    function f2(fn) { return function (F, I, A, o) { F[o[0]] = fn(F[o[1]], F[o[2]]); }; }
    function cmp(fn) { return function (F, I, A, o) { I[o[0]] = fn(F[o[1]], F[o[2]]) ? 1 : 0; }; }
    function i2(fn) { return function (F, I, A, o) { I[o[0]] = fn(I[o[1]], I[o[2]]); }; }
    function icmp(fn) { return function (F, I, A, o) { I[o[0]] = fn(I[o[1]], I[o[2]]) ? 1 : 0; }; }

    var OP_IMPL = {
        mov: function (F, I, A, o) { F[o[0]] = F[o[1]]; },
        add: f2(function (a, b) { return a + b; }),
        sub: f2(function (a, b) { return a - b; }),
        mul: f2(function (a, b) { return a * b; }),
        div: f2(function (a, b) { return a / b; }),
        neg: f1(function (a) { return -a; }),
        madd: function (F, I, A, o) { F[o[0]] = fround(F[o[1]] * F[o[2]]) + F[o[3]]; },
        msub: function (F, I, A, o) { F[o[0]] = F[o[3]] - fround(F[o[1]] * F[o[2]]); },
        min: f2(m.fmin),
        max: f2(m.fmax),
        abs: f1(Math.abs),
        select: function (F, I, A, o) { F[o[0]] = I[o[1]] ? F[o[2]] : F[o[3]]; },
        lt: cmp(function (a, b) { return a < b; }),
        le: cmp(function (a, b) { return a <= b; }),
        gt: cmp(function (a, b) { return a > b; }),
        ge: cmp(function (a, b) { return a >= b; }),
        eq: cmp(function (a, b) { return a === b; }),
        ne: cmp(function (a, b) { return a !== b; }),
        copysign: f2(function (a, b) { var s = (b < 0 || Object.is(b, -0)) ? -1 : 1; return Math.abs(a) * s; }),

        floor: f1(Math.floor), ceil: f1(Math.ceil), round: f1(m.roundf), rint: f1(m.rintf), sqrt: f1(Math.sqrt),
        sin: f1(Math.sin), cos: f1(Math.cos), tan: f1(Math.tan), asin: f1(Math.asin), acos: f1(Math.acos),
        atan: f1(Math.atan), atan2: f2(Math.atan2), exp: f1(Math.exp), log: f1(Math.log), log10: f1(Math.log10),
        pow: f2(Math.pow), fmod: f2(function (a, b) { return a % b; }), sinh: f1(Math.sinh), cosh: f1(Math.cosh),
        tanh: f1(Math.tanh), asinh: f1(Math.asinh), acosh: f1(Math.acosh), atanh: f1(Math.atanh),

        imov: function (F, I, A, o) { I[o[0]] = I[o[1]]; },
        iadd: i2(function (a, b) { return (a + b) | 0; }),
        isub: i2(function (a, b) { return (a - b) | 0; }),
        imul: i2(Math.imul),
        idiv: i2(m.idiv),
        irem: i2(m.irem),
        iand: i2(function (a, b) { return a & b; }),
        ior: i2(function (a, b) { return a | b; }),
        ixor: i2(function (a, b) { return a ^ b; }),
        ishl: i2(function (a, b) { return a << (b & 31); }),
        ishr: i2(function (a, b) { return a >> (b & 31); }),
        iushr: i2(function (a, b) { return (a >>> (b & 31)) | 0; }),
        imin: i2(function (a, b) { return (b < a) ? b : a; }),
        imax: i2(function (a, b) { return (a < b) ? b : a; }),
        iabs: function (F, I, A, o) { var a = I[o[1]]; I[o[0]] = a < 0 ? (-a) | 0 : a; },
        iselect: function (F, I, A, o) { I[o[0]] = I[o[1]] ? I[o[2]] : I[o[3]]; },
        ilt: icmp(function (a, b) { return a < b; }),
        ile: icmp(function (a, b) { return a <= b; }),
        igt: icmp(function (a, b) { return a > b; }),
        ige: icmp(function (a, b) { return a >= b; }),
        ieq: icmp(function (a, b) { return a === b; }),
        ine: icmp(function (a, b) { return a !== b; }),
        ftoi: function (F, I, A, o) { I[o[0]] = m.ftoi(F[o[1]]); },
        itof: function (F, I, A, o) { F[o[0]] = I[o[1]]; },

        rdf: function (F, I, A, o) { var a = A[o[1]], k = I[o[2]] >>> 0; F[o[0]] = k < a.length ? a[k] : 0; },
        wrf: function (F, I, A, o) { var a = A[o[0]], k = I[o[1]] >>> 0; if (k < a.length) a[k] = F[o[2]]; },
        rdi: function (F, I, A, o) { var a = A[o[1]], k = I[o[2]] >>> 0; I[o[0]] = k < a.length ? a[k] : 0; },
        wri: function (F, I, A, o) { var a = A[o[0]], k = I[o[1]] >>> 0; if (k < a.length) a[k] = I[o[2]]; }
    };

    return {
        FLAGS: FLAGS,
        ERRORS: ERRORS,
        ERROR_NAMES: ERROR_NAMES,
        sigArity: sigArity,
        fingerprint: fingerprint,
        parseOpList: parseOpList,
        fromList: fromList,
        crc32: crc32,
        m: m,
        OP_IMPL: OP_IMPL
    };
})();
