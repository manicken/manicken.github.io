// A pretend Teensy for fpb-faust-server.js --fake-io (tests only): fake "serialport" and "@julusian/midi" modules.
//   COM101 (interface 0) = the debug port: says hello when opened, and "processing!" for every OSC packet
//   COM102 (interface 2) = the OSC port: answers every SLIP packet with a /reply bundle, one reply message per
//                          message (address, "fake", 0 = OK), like the OSCAudio firmware
//   MIDI: input "Fake Keys", output "Fake Synth"
"use strict";

const ports = [
    { path: "COM101", vendorId: "16C0", productId: "048B", pnpId: "USB\\VID_16C0&PID_048B&MI_00\\FAKE", friendlyName: "Fake Teensy (COM101)" },
    { path: "COM102", vendorId: "16C0", productId: "048B", pnpId: "USB\\VID_16C0&PID_048B&MI_02\\FAKE", friendlyName: "Fake Teensy (COM102)" },
];
const open = {};

// ---- SLIP / OSC, just enough for the replies
const END = 0xC0, ESC = 0xDB, ESC_END = 0xDC, ESC_ESC = 0xDD;
function slipEncode(b) {
    const out = [END];
    for (const x of b) { if (x === END) out.push(ESC, ESC_END); else if (x === ESC) out.push(ESC, ESC_ESC); else out.push(x); }
    out.push(END);
    return Buffer.from(out);
}
function oscString(s) { const b = Buffer.from(s + "\0"); return Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4)]); }
function readString(b, off) { const end = b.indexOf(0, off); return [b.toString("utf8", off, end), (end + 4) & ~3]; }
function addresses(packet) {
    if (packet.toString("utf8", 0, 8) === "#bundle\0") {
        const list = [];
        for (let off = 16; off + 4 <= packet.length;) {
            const size = packet.readInt32BE(off);
            list.push(...addresses(packet.subarray(off + 4, off + 4 + size)));
            off += 4 + size;
        }
        return list;
    }
    return [readString(packet, 0)[0]];
}
function replyBundle(addrs) {
    const msgs = addrs.map(a => {
        const i = Buffer.alloc(4); i.writeInt32BE(0);
        const m = Buffer.concat([oscString("/reply"), oscString(",ssi"), oscString(a), oscString("fake"), i]);
        const size = Buffer.alloc(4); size.writeInt32BE(m.length);
        return Buffer.concat([size, m]);
    });
    return Buffer.concat([oscString("#bundle"), Buffer.alloc(8), ...msgs]);
}

class FakePort {
    constructor(o) { this.path = o.path; this.h = {}; this.rx = []; }
    open(cb) {
        setTimeout(() => {
            open[this.path] = this;
            cb(null);
            if (this.path === "COM101") setTimeout(() => this.emit("data", Buffer.from("fake Teensy booted\r\n")), 50);
        }, 5);
    }
    set(s, cb) { cb && cb(); }
    on(e, f) { this.h[e] = f; }
    emit(e, v) { this.h[e] && this.h[e](v); }
    close() { delete open[this.path]; this.emit("close"); }
    write(bytes) {
        if (this.path === "COM101") { this.emit("data", Buffer.from("echo: " + Buffer.from(bytes).toString())); return; }
        // collect SLIP packets
        for (const x of bytes) {
            if (x === END) {
                if (this.rx.length) this.packet(Buffer.from(unslip(this.rx)));
                this.rx = [];
            } else this.rx.push(x);
        }
    }
    packet(p) {
        let addrs;
        try { addrs = addresses(p); } catch (e) { return; }
        setTimeout(() => {
            this.emit("data", slipEncode(replyBundle(addrs)));
            if (open.COM101) open.COM101.emit("data", Buffer.from("processing! " + addrs.length + " message(s)\r\n"));
        }, 2);
    }
}
function unslip(a) {
    const out = [];
    for (let i = 0; i < a.length; i++) {
        if (a[i] === ESC) { i++; out.push(a[i] === ESC_END ? END : ESC); } else out.push(a[i]);
    }
    return out;
}

const serialport = { SerialPort: Object.assign(function (o) { return new FakePort(o); }, { list: async () => ports }) };

const midiIn = ["Fake Keys"], midiOut = ["Fake Synth"];
const midi = {
    Input: class { getPortCount() { return midiIn.length; } getPortName(i) { return midiIn[i]; } ignoreTypes() {} on() {} openPort() {} closePort() {} },
    Output: class { getPortCount() { return midiOut.length; } getPortName(i) { return midiOut[i]; } openPort() {} closePort() {}
        sendMessage(d) { if (open.COM101) open.COM101.emit("data", Buffer.from("midi out: " + d.join(" ") + "\r\n")); } },
};

module.exports = { serialport, midi };
