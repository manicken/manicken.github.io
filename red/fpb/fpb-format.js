// FPB container: encoder and decoder (specs/fpb-bytecode.md, section 4).
//
// RED.fpb.format:
//   encode(program, table) -> Uint8Array
//       program = { nIn, nOut, fSlots, iSlots,
//                   arrays:  [{ tier, type: "f"|"i", len, data: typed array or null }],
//                   fconsts: [{ slot, value }], iconsts: [{ slot, value }],
//                   params:  [{ slot, def }],
//                   blk: [{ op: name, ops: [numbers] }], smp: [...] }
//   decode(bytes, table)   -> { error, errorName, errorSection, errorIndex, header, ...runtime parts }
//       Runs the same checks in the same order as FPB_Loader (fpb/teensy/FPB/src/FPB.cpp), so the error
//       codes, sections and record indices can be compared one to one.
RED.fpb = RED.fpb || {};
RED.fpb.format = (function () {
    "use strict";

    var core = RED.fpb.core, E = core.ERRORS, FLAGS = core.FLAGS;

    var HEADER_SIZE = 40, VERSION = 1, MAX_ARITY = 8;
    var TIER = { fast: 0, dma: 1, ext: 2, any: 3 };
    var SECTION = { HEADER: 0, HEADER_SKIP: 1, USEDOPS: 2, ARRAYS: 3, FCONST: 4, ICONST: 5, PARAMS: 6, CODE: 7, DATA: 8, DONE: 9 };
    var SECTION_NAMES = Object.keys(SECTION);

    // ------------------------------------------------------------------ encode

    function Writer() { this.buf = new Uint8Array(1024); this.n = 0; this.dv = new DataView(this.buf.buffer); }
    Writer.prototype.room = function (k) {
        if (this.n + k <= this.buf.length) return;
        var size = this.buf.length * 2;
        while (size < this.n + k) size *= 2;
        var nb = new Uint8Array(size); nb.set(this.buf.subarray(0, this.n));
        this.buf = nb; this.dv = new DataView(nb.buffer);
    };
    Writer.prototype.u8 = function (v) { this.room(1); this.buf[this.n++] = v & 0xff; };
    Writer.prototype.u16 = function (v) { this.room(2); this.dv.setUint16(this.n, v, true); this.n += 2; };
    Writer.prototype.u32 = function (v) { this.room(4); this.dv.setUint32(this.n, v >>> 0, true); this.n += 4; };
    Writer.prototype.i32 = function (v) { this.room(4); this.dv.setInt32(this.n, v | 0, true); this.n += 4; };
    Writer.prototype.f32 = function (v) { this.room(4); this.dv.setFloat32(this.n, v, true); this.n += 4; };
    Writer.prototype.bytes = function () { return this.buf.slice(0, this.n); };

    function encode(p, table) {
        var used = {}, usedList = [];
        function resolve(ins) {
            var op = table.byName[ins.op];
            if (!op) throw new Error("FPB encode: the op table has no op '" + ins.op + "'");
            if (op.arity !== ins.ops.length) throw new Error("FPB encode: " + ins.op + " takes " + op.arity + " operands, got " + ins.ops.length);
            if (!used[op.index]) { used[op.index] = true; usedList.push(op); }
            return op;
        }
        var blk = p.blk.map(function (ins) { return { op: resolve(ins), ops: ins.ops }; });
        var smp = p.smp.map(function (ins) { return { op: resolve(ins), ops: ins.ops }; });
        usedList.sort(function (a, b) { return a.index - b.index; });

        var body = new Writer();
        usedList.forEach(function (op) { body.u8(op.index); body.u8(op.arity); body.u16(op.fp); });
        var dataBytes = 0;
        p.arrays.forEach(function (a) {
            var init = a.data && hasNonZero(a.data) ? 1 : 0;
            body.u8(TIER[a.tier] !== undefined ? TIER[a.tier] : a.tier);
            body.u8(a.type === "i" ? 1 : 0);
            body.u8(init); body.u8(0);
            body.u32(a.len);
            a._init = init;
            if (init) dataBytes += a.len * 4;
        });
        p.fconsts.forEach(function (c) { body.u16(c.slot); body.f32(c.value); });
        p.iconsts.forEach(function (c) { body.u16(c.slot); body.i32(c.value); });
        p.params.forEach(function (c) { body.u16(c.slot); body.f32(c.def); });
        var codeStart = body.n;
        blk.concat(smp).forEach(function (ins) {
            body.u8(ins.op.index); body.u8(ins.ops.length);
            ins.ops.forEach(function (v) { body.u16(v); });
        });
        var codeBytes = body.n - codeStart;
        p.arrays.forEach(function (a) {
            if (!a._init) return;
            for (var k = 0; k < a.len; k++) { if (a.type === "i") body.i32(a.data[k]); else body.f32(a.data[k]); }
        });
        var bodyBytes = body.bytes();

        check(p.nIn <= 255 && p.nOut <= 255 && p.arrays.length <= 255 && usedList.length <= 255 && p.params.length <= 255,
            "FPB encode: a u8 count overflows");
        check(p.fSlots <= 65535 && p.iSlots <= 65535 && blk.length <= 65535 && smp.length <= 65535, "FPB encode: a u16 count overflows");

        var h = new Writer();
        h.u8(0x46); h.u8(0x50); h.u8(0x42); h.u8(0);   // "FPB\0"
        h.u8(VERSION);
        h.u8(dataBytes ? 1 : 0);
        h.u16(HEADER_SIZE);
        h.u16(table.count);
        h.u8(p.nIn); h.u8(p.nOut);
        h.u16(p.fSlots); h.u16(p.iSlots);
        h.u8(p.arrays.length); h.u8(usedList.length);
        h.u16(p.fconsts.length); h.u16(p.iconsts.length);
        h.u8(p.params.length); h.u8(0);
        h.u16(blk.length); h.u16(smp.length);
        h.u32(codeBytes); h.u32(dataBytes);
        h.u32(core.crc32(bodyBytes));
        var out = new Uint8Array(HEADER_SIZE + bodyBytes.length);
        out.set(h.bytes(), 0);
        out.set(bodyBytes, HEADER_SIZE);
        return out;
    }

    function hasNonZero(a) { for (var k = 0; k < a.length; k++) if (a[k] !== 0 || Object.is(a[k], -0)) return true; return false; }
    function check(c, msg) { if (!c) throw new Error(msg); }

    // ------------------------------------------------------------------ decode / validate

    function decode(bytes, table) {
        var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        var pos = 0, sec = SECTION.HEADER, rec = 0;
        var res = { error: E.OK };
        function fail(e) {
            res.error = e; res.errorName = core.ERROR_NAMES[e];
            res.errorSection = SECTION_NAMES[sec]; res.errorIndex = rec;
            return res;
        }
        function have(k) { return pos + k <= bytes.length; }

        if (!have(HEADER_SIZE)) return fail(E.E_INCOMPLETE);
        if (bytes[0] !== 0x46 || bytes[1] !== 0x50 || bytes[2] !== 0x42 || bytes[3] !== 0) return fail(E.E_MAGIC);
        var h = {
            version: bytes[4], flags: bytes[5], headerSize: dv.getUint16(6, true), opCount: dv.getUint16(8, true),
            nIn: bytes[10], nOut: bytes[11], fSlots: dv.getUint16(12, true), iSlots: dv.getUint16(14, true),
            nArr: bytes[16], nUsedOps: bytes[17], nFConst: dv.getUint16(18, true), nIConst: dv.getUint16(20, true),
            nParam: bytes[22], nBlkInstr: dv.getUint16(24, true), nSmpInstr: dv.getUint16(26, true),
            codeBytes: dv.getUint32(28, true), dataBytes: dv.getUint32(32, true), crc: dv.getUint32(36, true)
        };
        res.header = h;
        if (h.version !== VERSION) return fail(E.E_VERSION);
        if (h.headerSize < HEADER_SIZE) return fail(E.E_HEADER);
        if (h.nIn + h.nOut > h.fSlots) return fail(E.E_HEADER);
        if (((h.flags & 1) !== 0) !== (h.dataBytes !== 0)) return fail(E.E_HEADER);
        if (h.opCount > table.count) return fail(E.E_OPCOUNT);
        var nInstr = h.nBlkInstr + h.nSmpInstr;
        if (h.codeBytes < 2 * nInstr || ((h.codeBytes - 2 * nInstr) & 1)) return fail(E.E_CODE_SIZE);
        pos = HEADER_SIZE;
        if (h.headerSize > HEADER_SIZE) {
            sec = SECTION.HEADER_SKIP;
            if (!have(h.headerSize - HEADER_SIZE)) return fail(E.E_INCOMPLETE);
            pos = h.headerSize;
        }
        var crcStart = pos;

        // used ops
        sec = SECTION.USEDOPS;
        var used = {};
        for (rec = 0; rec < h.nUsedOps; rec++) {
            if (!have(4)) return fail(E.E_INCOMPLETE);
            var opi = bytes[pos], arity = bytes[pos + 1], fp = dv.getUint16(pos + 2, true);
            pos += 4;
            if (opi >= h.opCount) return fail(E.E_OP_INDEX);
            var def = table.ops[opi];
            if (def.flags & FLAGS.RESERVED) return fail(E.E_OP_RESERVED);
            if (def.flags & FLAGS.REMOVED) return fail(E.E_OP_REMOVED);
            if (arity > MAX_ARITY || arity !== def.arity) return fail(E.E_OP_ARITY);
            if (fp !== def.fp) return fail(E.E_OP_FP);
            used[opi] = def;
        }

        // arrays
        sec = SECTION.ARRAYS;
        var arrays = [], dataExpected = 0;
        for (rec = 0; rec < h.nArr; rec++) {
            if (!have(8)) return fail(E.E_INCOMPLETE);
            var tier = bytes[pos], type = bytes[pos + 1], init = bytes[pos + 2], pad = bytes[pos + 3], len = dv.getUint32(pos + 4, true);
            pos += 8;
            if (tier > 3 || type > 1 || init > 1 || pad !== 0) return fail(E.E_ARRAY);
            if (len === 0 || len > (1 << 26)) return fail(E.E_ARRAY);
            if (init) { dataExpected += len * 4; if (dataExpected > 0xFFFFFFFF) return fail(E.E_DATA_SIZE); }
            arrays.push({ tier: tier, type: type ? "i" : "f", init: !!init, len: len,
                          data: type ? new Int32Array(len) : new Float32Array(len) });
        }
        if (dataExpected !== h.dataBytes) return fail(E.E_DATA_SIZE);

        var F = new Float32Array(h.fSlots), I = new Int32Array(h.iSlots);
        // float constants
        sec = SECTION.FCONST;
        for (rec = 0; rec < h.nFConst; rec++) {
            if (!have(6)) return fail(E.E_INCOMPLETE);
            var fs = dv.getUint16(pos, true), fv = dv.getFloat32(pos + 2, true); pos += 6;
            if (fs >= h.fSlots || fs < h.nIn) return fail(E.E_SLOT);
            F[fs] = fv;
        }
        // int constants
        sec = SECTION.ICONST;
        for (rec = 0; rec < h.nIConst; rec++) {
            if (!have(6)) return fail(E.E_INCOMPLETE);
            var is = dv.getUint16(pos, true), iv = dv.getInt32(pos + 2, true); pos += 6;
            if (is >= h.iSlots) return fail(E.E_SLOT);
            I[is] = iv;
        }
        // params
        sec = SECTION.PARAMS;
        var params = [];
        for (rec = 0; rec < h.nParam; rec++) {
            if (!have(6)) return fail(E.E_INCOMPLETE);
            var ps = dv.getUint16(pos, true), pv = dv.getFloat32(pos + 2, true); pos += 6;
            if (ps >= h.fSlots || ps < h.nIn + h.nOut) return fail(E.E_SLOT);
            F[ps] = pv;
            params.push(ps);
        }
        // code
        sec = SECTION.CODE;
        rec = 0;
        var codeLeft = h.codeBytes, blk = [], smp = [];
        if (nInstr === 0 && codeLeft) return fail(E.E_CODE_SIZE);
        for (rec = 0; rec < nInstr; rec++) {
            if (!have(2)) return fail(E.E_INCOMPLETE);
            var op = bytes[pos], n = bytes[pos + 1];
            if (!used[op]) return fail(E.E_INSTR_OP);
            var d = used[op];
            if (n !== d.arity) return fail(E.E_INSTR_ARITY);
            if (codeLeft < 2 + 2 * n) return fail(E.E_CODE_SIZE);
            if (!have(2 + 2 * n)) return fail(E.E_INCOMPLETE);
            var ops = [], written = true, k = 0;
            for (var c = 0; c < d.sig.length; c++) {
                var kind = d.sig[c];
                if (kind === "=") { written = false; continue; }
                var v = dv.getUint16(pos + 2 + 2 * k, true);
                if (kind === "f") {
                    if (v >= h.fSlots) return fail(E.E_OPERAND);
                    if (written && v < h.nIn) return fail(E.E_WRITE_INPUT);
                } else if (kind === "i") {
                    if (v >= h.iSlots) return fail(E.E_OPERAND);
                } else if (kind === "a") {
                    if (v >= h.nArr) return fail(E.E_OPERAND);
                } else if (kind !== "c") return fail(E.E_OP_ARITY);
                ops.push(v);
                k++;
            }
            pos += 2 + 2 * n;
            codeLeft -= 2 + 2 * n;
            (rec < h.nBlkInstr ? blk : smp).push({ op: d, ops: ops });
            if (rec === nInstr - 1 && codeLeft) return fail(E.E_CODE_SIZE);
        }
        // data
        sec = SECTION.DATA;
        rec = 0;
        if (!have(h.dataBytes)) return fail(E.E_INCOMPLETE);
        arrays.forEach(function (a) {
            if (!a.init) return;
            for (var j = 0; j < a.len; j++) a.data[j] = a.type === "i" ? dv.getInt32(pos + 4 * j, true) : dv.getFloat32(pos + 4 * j, true);
            pos += a.len * 4;
        });
        sec = SECTION.DONE;
        if (core.crc32(bytes, 0, crcStart, pos) !== h.crc) return fail(E.E_CRC);
        if (pos !== bytes.length) return fail(E.E_TRAILING);

        res.F = F; res.I = I; res.arrays = arrays; res.params = params; res.blk = blk; res.smp = smp;
        res.size = bytes.length;
        return res;
    }

    return {
        HEADER_SIZE: HEADER_SIZE,
        VERSION: VERSION,
        TIER: TIER,
        SECTION: SECTION,
        SECTION_NAMES: SECTION_NAMES,
        encode: encode,
        decode: decode
    };
})();
