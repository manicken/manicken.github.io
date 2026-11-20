// RED.zip: a small zip reader/writer, used by the browser (exports, project files) and by the Node server.
// No dependencies: deflate is the built-in CompressionStream / DecompressionStream("deflate-raw"), i.e. the
// browser's (or Node's) own zlib, so it is fast and runs off the main thread. Works in browsers and Node 18+.
// Based on the zip code in WebScope (frontend/js/fileformats/sigrok-sr.js), same author.
//
//   RED.zip.write(entries, opts)  -> Promise<Uint8Array>
//       entries: [{ name, data }], data = string (saved as UTF-8) | Uint8Array | ArrayBuffer | typed array | Blob
//       names use "/" for folders ("MyProject/design.h"); "\" is turned into "/"
//       opts.compress (default true): deflate, but an entry that doesn't get smaller is stored
//   RED.zip.writeBlob(entries, opts) -> Promise<Blob>   (the same, as an application/zip Blob for saveAs)
//   RED.zip.read(bytes)           -> zip (throws if it is not a zip)
//       zip.entries                [{ name, size, csize, method }]  (files only, no folder entries)
//       zip.names() / zip.has(name)
//       zip.read(name)             -> Promise<Uint8Array>   (checks the CRC)
//       zip.readText(name)         -> Promise<string>
//   RED.zip.readAll(bytes, opts)  -> Promise<[{ name, data: Uint8Array }]>
//       opts.maxTotal: refuse a zip whose files are bigger than this together (before and after inflating)
//   RED.zip.crc32(bytes)          -> IEEE CRC-32, as zlib
//
// Not supported: ZIP64 (files or zips over 4 GB), encryption, other compression methods than store/deflate.
//
// Layout of a zip (all numbers little endian):
//   [local header 30 B + name][data]  ... one per file
//   [central directory header 46 B + name] ... one per file, points back at its local header
//   [end of central directory 22 B]: file count, size and offset of the central directory
// A reader starts at the end: it finds the end record, then walks the central directory.
var RED = (typeof RED !== "undefined") ? RED : (typeof global !== "undefined" ? (global.RED = global.RED || {}) : {});

RED.zip = (function () {
    "use strict";

    var SIG_LOCAL = 0x04034b50, SIG_CENTRAL = 0x02014b50, SIG_END = 0x06054b50;
    var FLAG_UTF8 = 0x0800;     // general purpose flag bit 11: the names are UTF-8
    var STORE = 0, DEFLATE = 8;

    // ------------------------------------------------------------------ crc32

    var CRC_TABLE = (function () {
        var t = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();

    function crc32(buf) {
        var c = 0xffffffff;
        for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
    }

    // ------------------------------------------------------------------ helpers

    // any typed array, DataView, ArrayBuffer or Node Buffer as a Uint8Array over the same bytes (no copy)
    function toBytes(d) {
        if (d instanceof Uint8Array) return d;
        if (d instanceof ArrayBuffer) return new Uint8Array(d);
        if (ArrayBuffer.isView(d)) return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
        throw new Error("zip: data must be a string, a Blob, an ArrayBuffer or a typed array");
    }

    // string, Blob or bytes -> Uint8Array
    async function dataBytes(d) {
        if (typeof d === "string") return new TextEncoder().encode(d);
        if (typeof Blob !== "undefined" && d instanceof Blob) return new Uint8Array(await d.arrayBuffer());
        if (d === undefined || d === null) return new Uint8Array(0);
        return toBytes(d);
    }

    async function pipeThrough(data, transform) {
        var stream = new Blob([data]).stream().pipeThrough(transform);
        return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    function deflateRaw(d) { return pipeThrough(d, new CompressionStream("deflate-raw")); }

    // inflate, but stop as soon as the output gets bigger than `size` (the size the zip says): a zip with a false
    // size can then never fill the memory (a "zip bomb" inflates a few KB into GBs)
    async function inflateRaw(d, size) {
        var reader = new Blob([d]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
        var chunks = [], got = 0;
        for (;;) {
            var r = await reader.read();
            if (r.done) break;
            got += r.value.length;
            if (got > size) { reader.cancel(); throw new Error("zip: a file inflates to more than its stated size"); }
            chunks.push(r.value);
        }
        return concat(chunks);
    }

    function concat(parts) {
        var len = 0, i;
        for (i = 0; i < parts.length; i++) len += parts[i].length;
        var out = new Uint8Array(len), o = 0;
        for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
        return out;
    }

    // MS-DOS time and date, as zip stores them: time = h<<11 | m<<5 | s/2, date = (year-1980)<<9 | month<<5 | day
    function dosDateTime(d) {
        return {
            time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
            date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
        };
    }

    // ------------------------------------------------------------------ write

    async function write(entries, opts) {
        var compress = !(opts && opts.compress === false);
        var enc = new TextEncoder();
        // every entry is read and compressed at the same time (each CompressionStream is its own job)
        var packed = await Promise.all(entries.map(async function (e) {
            var data = await dataBytes(e.data);
            var body = data, method = STORE;
            if (compress && data.length > 0) {
                var c = await deflateRaw(data);
                if (c.length < data.length) { body = c; method = DEFLATE; }
            }
            var name = String(e.name).replace(/\\/g, "/");
            return { name: enc.encode(name), size: data.length, crc: crc32(data), body: body, method: method };
        }));

        var dt = dosDateTime(new Date());
        var parts = [], central = [], offset = 0;
        packed.forEach(function (p) {
            if (p.body.length > 0xfffffffe || offset > 0xfffffffe) throw new Error("zip: ZIP64 is not supported (over 4 GB)");

            var lh = new Uint8Array(30 + p.name.length), lv = new DataView(lh.buffer);
            lv.setUint32(0, SIG_LOCAL, true);
            lv.setUint16(4, 20, true);              // version needed to extract (2.0: deflate, folders)
            lv.setUint16(6, FLAG_UTF8, true);
            lv.setUint16(8, p.method, true);
            lv.setUint16(10, dt.time, true);
            lv.setUint16(12, dt.date, true);
            lv.setUint32(14, p.crc, true);
            lv.setUint32(18, p.body.length, true);  // compressed size
            lv.setUint32(22, p.size, true);         // uncompressed size
            lv.setUint16(26, p.name.length, true);  // (28: extra field length = 0)
            lh.set(p.name, 30);
            parts.push(lh, p.body);

            var ch = new Uint8Array(46 + p.name.length), cv = new DataView(ch.buffer);
            cv.setUint32(0, SIG_CENTRAL, true);
            cv.setUint16(4, 20, true);              // version made by
            cv.setUint16(6, 20, true);              // version needed
            cv.setUint16(8, FLAG_UTF8, true);
            cv.setUint16(10, p.method, true);
            cv.setUint16(12, dt.time, true);
            cv.setUint16(14, dt.date, true);
            cv.setUint32(16, p.crc, true);
            cv.setUint32(20, p.body.length, true);
            cv.setUint32(24, p.size, true);
            cv.setUint16(28, p.name.length, true);  // (30..41: extra, comment, disk, attributes = 0)
            cv.setUint32(42, offset, true);         // where its local header is
            ch.set(p.name, 46);
            central.push(ch);

            offset += lh.length + p.body.length;
        });

        var cd = concat(central);
        var end = new Uint8Array(22), ev = new DataView(end.buffer);
        ev.setUint32(0, SIG_END, true);
        ev.setUint16(8, packed.length, true);       // files on this disk
        ev.setUint16(10, packed.length, true);      // files in total
        ev.setUint32(12, cd.length, true);
        ev.setUint32(16, offset, true);             // the central directory starts right after the last file
        parts.push(cd, end);
        return concat(parts);
    }

    async function writeBlob(entries, opts) {
        return new Blob([await write(entries, opts)], { type: "application/zip" });
    }

    // ------------------------------------------------------------------ read

    function read(input) {
        var bytes = toBytes(input);
        var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        var dec = new TextDecoder();

        // the end record is the last 22 bytes, unless the zip has a comment (at most 65535 bytes) after it
        var eocd = -1;
        for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
            if (view.getUint32(i, true) === SIG_END) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error("not a zip file");
        var count = view.getUint16(eocd + 10, true);
        var pos = view.getUint32(eocd + 16, true);
        if (count === 0xffff || pos === 0xffffffff) throw new Error("zip: ZIP64 is not supported");

        var files = new Map();
        for (var k = 0; k < count; k++) {
            if (pos + 46 > bytes.length || view.getUint32(pos, true) !== SIG_CENTRAL) throw new Error("zip: bad central directory");
            var nlen = view.getUint16(pos + 28, true), elen = view.getUint16(pos + 30, true), clen = view.getUint16(pos + 32, true);
            var name = dec.decode(bytes.subarray(pos + 46, pos + 46 + nlen));
            if (!name.endsWith("/")) {              // a folder entry has no data
                files.set(name, {
                    name: name,
                    method: view.getUint16(pos + 10, true),
                    crc: view.getUint32(pos + 16, true),
                    csize: view.getUint32(pos + 20, true),
                    size: view.getUint32(pos + 24, true),
                    lho: view.getUint32(pos + 42, true)     // local header offset
                });
            }
            pos += 46 + nlen + elen + clen;
        }

        async function readEntry(name) {
            var f = files.get(name);
            if (!f) throw new Error('zip: no file "' + name + '"');
            if (f.lho + 30 > bytes.length || view.getUint32(f.lho, true) !== SIG_LOCAL) throw new Error('zip: bad local header for "' + name + '"');
            // the local header has its own name and extra field lengths, they can differ from the central ones
            var start = f.lho + 30 + view.getUint16(f.lho + 26, true) + view.getUint16(f.lho + 28, true);
            if (start + f.csize > bytes.length) throw new Error('zip: "' + name + '" is cut off');
            var raw = bytes.subarray(start, start + f.csize);
            var out;
            if (f.method === STORE) out = raw.slice();      // a copy, so it doesn't keep the whole zip alive
            else if (f.method === DEFLATE) out = await inflateRaw(raw, f.size);
            else throw new Error("zip: compression method " + f.method + ' is not supported ("' + name + '")');
            if (out.length !== f.size) throw new Error('zip: wrong size for "' + name + '"');
            if (crc32(out) !== f.crc) throw new Error('zip: CRC error in "' + name + '"');
            return out;
        }

        return {
            entries: Array.from(files.values()).map(function (f) { return { name: f.name, size: f.size, csize: f.csize, method: f.method }; }),
            names: function () { return Array.from(files.keys()); },
            has: function (name) { return files.has(name); },
            read: readEntry,
            readText: async function (name) { return dec.decode(await readEntry(name)); }
        };
    }

    async function readAll(input, opts) {
        var zip = read(input);
        var maxTotal = (opts && opts.maxTotal) || Infinity;
        // the sizes in the directory are checked before anything is inflated, and inflateRaw stops at the stated
        // size, so a zip with false sizes can't get past this
        var total = zip.entries.reduce(function (s, e) { return s + e.size; }, 0);
        if (total > maxTotal) throw new Error("zip: too big (" + total + " bytes unpacked)");
        var out = [];
        for (var i = 0; i < zip.entries.length; i++) {
            var name = zip.entries[i].name;
            out.push({ name: name, data: await zip.read(name) });
        }
        return out;
    }

    return { write: write, writeBlob: writeBlob, read: read, readAll: readAll, crc32: crc32 };
})();

if (typeof module !== "undefined" && module.exports) module.exports = RED.zip;
