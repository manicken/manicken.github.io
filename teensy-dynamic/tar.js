// tar read/write for the Teensy Dynamic Audio package build (Node, no packages).
//
// A tar file is a list of entries. Each entry is a 512 byte header and then its data,
// padded up to the next 512 bytes. The file ends with two zero blocks.
//
// Header fields used here (offset, length; numbers are octal text):
//   name 0,100   mode 100,8   size 124,12   mtime 136,12   chksum 148,8
//   typeflag 156,1   linkname 157,100   magic 257,6 ("ustar")   prefix 345,155
// typeflag: '0' or NUL = file, '5' = folder, '2' = symlink,
//           'x' = pax header for the next entry (e.g. a long "path"), 'g' = global pax header,
//           'L' / 'K' = GNU long name / long link name for the next entry.
"use strict";

const BLOCK = 512;

/** Read an octal field, or a base-256 one (first byte 0x80, used by GNU tar for big sizes). */
function readNumber(buf, off, len) {
    if (buf[off] & 0x80) {
        let n = 0;
        for (let i = off + 1; i < off + len; i++) n = n * 256 + buf[i];
        return n;
    }
    const s = buf.toString("latin1", off, off + len).replace(/\0.*$/s, "").trim();
    return s === "" ? 0 : parseInt(s, 8);
}

function readString(buf, off, len) {
    const end = buf.indexOf(0, off);
    return buf.toString("utf8", off, end >= 0 && end < off + len ? end : off + len);
}

/** pax records: "<length> <key>=<value>\n" ..., the length counts the whole record. */
function parsePax(data) {
    const out = {};
    let i = 0;
    while (i < data.length) {
        const sp = data.indexOf(0x20, i);
        if (sp < 0) break;
        const len = parseInt(data.toString("latin1", i, sp), 10);
        if (!(len > 0)) break;
        const rec = data.toString("utf8", sp + 1, i + len - 1);   // without the "\n"
        const eq = rec.indexOf("=");
        if (eq > 0) out[rec.slice(0, eq)] = rec.slice(eq + 1);
        i += len;
    }
    return out;
}

/**
 * @param {Buffer} buf  a whole (uncompressed) tar file
 * @returns {{name:string, type:"file"|"dir"|"symlink", mode:number, mtime:number, data:Buffer, linkname:string}[]}
 */
function readTar(buf) {
    const entries = [];
    let off = 0;
    let pax = {}, longName = null, longLink = null;
    while (off + BLOCK <= buf.length) {
        const h = buf.subarray(off, off + BLOCK);
        if (h.every(b => b === 0)) break;                    // end of archive

        // the checksum: the sum of the header bytes with the checksum field as spaces
        let sum = 0;
        for (let i = 0; i < BLOCK; i++) sum += (i >= 148 && i < 156) ? 0x20 : h[i];
        if (sum !== readNumber(h, 148, 8)) throw new Error("tar: bad header checksum at byte " + off);

        const size = readNumber(h, 124, 12);
        const type = String.fromCharCode(h[156] || 0x30);
        const dataStart = off + BLOCK;
        if (dataStart + size > buf.length) throw new Error("tar: entry goes past the end of the file");
        const data = buf.subarray(dataStart, dataStart + size);
        off = dataStart + Math.ceil(size / BLOCK) * BLOCK;

        if (type === "x") { pax = parsePax(data); continue; }
        if (type === "g") continue;                           // global settings: nothing we need
        if (type === "L") { longName = readString(data, 0, data.length); continue; }
        if (type === "K") { longLink = readString(data, 0, data.length); continue; }

        let name = readString(h, 0, 100);
        const prefix = h.toString("latin1", 257, 262) === "ustar" ? readString(h, 345, 155) : "";
        if (prefix) name = prefix + "/" + name;
        if (longName != null) name = longName;
        if (pax.path != null) name = pax.path;
        let linkname = readString(h, 157, 100);
        if (longLink != null) linkname = longLink;
        if (pax.linkpath != null) linkname = pax.linkpath;
        pax = {}; longName = null; longLink = null;

        let kind;
        if (type === "0" || type === "\0" || type === "7") kind = "file";
        else if (type === "5") kind = "dir";
        else if (type === "2") kind = "symlink";
        else continue;                                        // hard links, devices ...: not in a platform package
        entries.push({
            name: name.replace(/^\.\//, "").replace(/\/+$/, ""),
            type: kind,
            mode: readNumber(h, 100, 8) & 0o7777,
            mtime: readNumber(h, 136, 12),
            data: kind === "file" ? Buffer.from(data) : Buffer.alloc(0),
            linkname
        });
    }
    return entries;
}

function writeOctal(h, off, len, n) {
    h.write(n.toString(8).padStart(len - 1, "0") + "\0", off, len, "latin1");
}

function header(name, type, mode, size, mtime, linkname) {
    const h = Buffer.alloc(BLOCK);
    let prefix = "";
    let short = name;
    if (Buffer.byteLength(name) > 100) {
        // ustar: split at a "/" into prefix (max 155) and name (max 100); pax is used when that can't be done
        const cut = name.lastIndexOf("/", 155);
        if (cut > 0 && Buffer.byteLength(name.slice(cut + 1)) <= 100) { prefix = name.slice(0, cut); short = name.slice(cut + 1); }
        else short = name.slice(0, 100);                      // the pax "path" before it has the real name
    }
    h.write(short, 0, 100, "utf8");
    writeOctal(h, 100, 8, mode);
    writeOctal(h, 108, 8, 0);                                 // uid
    writeOctal(h, 116, 8, 0);                                 // gid
    writeOctal(h, 124, 12, size);
    writeOctal(h, 136, 12, mtime);
    h.fill(0x20, 148, 156);                                   // checksum counted as spaces
    h.write(type, 156, 1, "latin1");
    h.write(linkname || "", 157, 100, "utf8");
    h.write("ustar\0", 257, 6, "latin1");
    h.write("00", 263, 2, "latin1");
    h.write(prefix, 345, 155, "utf8");
    let sum = 0;
    for (let i = 0; i < BLOCK; i++) sum += h[i];
    h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "latin1");
    return h;
}

function paxRecord(key, value) {
    // the record length includes its own digits: grow it until the digit count stops changing
    const body = " " + key + "=" + value + "\n";
    const bodyLen = Buffer.byteLength(body);
    let len = bodyLen + 1;
    while (String(len).length + bodyLen !== len) len = String(len).length + bodyLen;
    return Buffer.from(len + body, "utf8");
}

/**
 * @param {{name:string, type:"file"|"dir"|"symlink", mode?:number, mtime?:number, data?:Buffer, linkname?:string}[]} entries
 * @param {number} mtime  used for every entry (a fixed time makes the archive the same on every build)
 */
function writeTar(entries, mtime) {
    const parts = [];
    const pad = n => { const r = n % BLOCK; if (r) parts.push(Buffer.alloc(BLOCK - r)); };
    for (const e of entries) {
        const name = e.type === "dir" ? e.name + "/" : e.name;
        const needsPax = Buffer.byteLength(name) > 100 && !(function () {
            const cut = name.lastIndexOf("/", 155);
            return cut > 0 && Buffer.byteLength(name.slice(cut + 1)) <= 100;
        })();
        const linkTooLong = e.type === "symlink" && Buffer.byteLength(e.linkname) > 100;
        if (needsPax || linkTooLong) {
            const rec = Buffer.concat([needsPax ? paxRecord("path", name) : Buffer.alloc(0), linkTooLong ? paxRecord("linkpath", e.linkname) : Buffer.alloc(0)]);
            parts.push(header("PaxHeader", "x", 0o644, rec.length, mtime, ""), rec);
            pad(rec.length);
        }
        const data = e.type === "file" ? e.data : Buffer.alloc(0);
        const type = e.type === "file" ? "0" : e.type === "dir" ? "5" : "2";
        const mode = e.mode != null ? e.mode : (e.type === "dir" ? 0o755 : 0o644);
        parts.push(header(name, type, mode, data.length, mtime, e.type === "symlink" ? e.linkname : ""), data);
        pad(data.length);
    }
    parts.push(Buffer.alloc(BLOCK * 2));
    return Buffer.concat(parts);
}

module.exports = { readTar, writeTar };
