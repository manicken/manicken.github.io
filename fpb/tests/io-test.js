// Tests fpb/server/io.js (serial / MIDI for ASDT++) with fake serialport and MIDI modules, no hardware.
//
//   node fpb/tests/io-test.js
"use strict";
const path = require("path");
const createIO = require(path.join(__dirname, "..", "server", "io.js"));

let failures = 0;
function check(cond, msg) { console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) failures++; }
const wait = ms => new Promise(r => setTimeout(r, ms));

// ------------------------------------------------------------------ fake serialport
let portList = [];
const opened = new Map();          // path -> FakePort
const busy = new Set();            // paths that fail to open (another program has them)
class FakePort {
    constructor(o) { this.path = o.path; this.handlers = {}; this.written = []; this.isOpen = false; this.signals = null; }
    open(cb) {
        setTimeout(() => {
            if (busy.has(this.path)) return cb(new Error("Access denied"));
            this.isOpen = true; opened.set(this.path, this); cb(null);
        }, 1);
    }
    set(s, cb) { this.signals = s; cb && cb(); }
    on(e, f) { this.handlers[e] = f; }
    write(b) { this.written.push(Buffer.from(b)); }
    close() { this.isOpen = false; opened.delete(this.path); this.handlers.close && this.handlers.close(); }
    emit(e, v) { this.handlers[e] && this.handlers[e](v); }
}
const fakeSerial = { SerialPort: Object.assign(function (o) { return new FakePort(o); }, { list: async () => portList }) };
const teensy = (com, mi) => ({ path: com, vendorId: "16C0", productId: "048B", pnpId: `USB\\VID_16C0&PID_048B&MI_0${mi}\\X`, friendlyName: `Seriell USB-enhet (${com})` });

// ------------------------------------------------------------------ fake MIDI
let midiIns = [], midiOuts = [];
const midiSent = [];
let lastInput = null, openedInput = null;
const fakeMidi = {
    Input: class { constructor() { this.h = null; lastInput = this; } getPortCount() { return midiIns.length; } getPortName(i) { return midiIns[i]; }
        ignoreTypes() {} on(e, f) { this.h = f; } openPort(i) { this.name = midiIns[i]; openedInput = this; } closePort() {} },
    Output: class { getPortCount() { return midiOuts.length; } getPortName(i) { return midiOuts[i]; }
        openPort(i) { this.name = midiOuts[i]; } closePort() {} sendMessage(d) { midiSent.push({ port: this.name, data: d }); } },
};

(async function main() {
    const msgs = [], bins = [];
    portList = [teensy("COM14", 2), { path: "COM20", pnpId: "BTHENUM\\x" }, teensy("COM13", 0)];
    midiIns = ["Keystation"]; midiOuts = ["Teensy MIDI", "Synth"];
    const io = createIO({ log() {}, broadcast: m => msgs.push(m), broadcastBinary: b => bins.push(b), serialport: fakeSerial, midi: fakeMidi });

    console.log("== choosing the Teensy ports");
    check(io._ifaceOf({ pnpId: "USB\\VID_16C0&PID_048B&MI_02\\A" }) === 2 && io._ifaceOf({ pnpId: "usb-Teensyduino_Dual_Serial_1-if02" }) === 2,
        "interface number from Windows (MI_02) and Linux (-if02) pnpIds");
    io.start();
    await wait(30);
    let st = io.state();
    check(st.serial.osc.path === "COM14" && st.serial.osc.open && st.serial.debug.path === "COM13" && st.serial.debug.open,
        `dual serial: OSC = interface 2 (${st.serial.osc.path}), debug = interface 0 (${st.serial.debug.path}), the Bluetooth port is left alone`);
    check(opened.get("COM13").signals && opened.get("COM13").signals.dtr === true, "DTR is set (the Teensy's while(!Serial) sees the port open)");

    console.log("\n== data both ways");
    opened.get("COM14").emit("data", Buffer.from([0xC0, 1, 2, 0xC0]));
    check(bins.length === 1 && bins[0][0] === 0x01 && bins[0].subarray(1).equals(Buffer.from([0xC0, 1, 2, 0xC0])), "OSC port bytes -> a binary frame [0x01, bytes]");
    io.onBinary(null, Buffer.from([0x01, 9, 8, 7]));
    check(opened.get("COM14").written[0].equals(Buffer.from([9, 8, 7])), "binary frame [0x01, bytes] -> written to the OSC port");
    opened.get("COM13").emit("data", Buffer.from("processing!\r\n"));
    opened.get("COM13").emit("data", Buffer.from("objects: 3\r\n"));
    await wait(50);
    const dbg = msgs.filter(m => m.type === "debug");
    check(dbg.length === 1 && dbg[0].text === "processing!\r\nobjects: 3\r\n", "debug port text is batched into one message");
    io.onMessage(null, { type: "debug-send", text: "hello\n" });
    check(opened.get("COM13").written[0].toString() === "hello\n", "text from ASDT++ to the debug port");

    console.log("\n== the Teensy restarts, a port busy in another program");
    opened.get("COM14").close(); opened.get("COM13").close();
    check(!io.state().serial.osc.open, "closed when the Teensy goes away");
    busy.add("COM13");
    await wait(1100);                                  // the next scan
    st = io.state();
    check(st.serial.osc.open && !st.serial.debug.open && /Access denied/.test(st.serial.debug.error), "reopened: OSC open, debug busy (" + st.serial.debug.error + ")");
    busy.delete("COM13");
    await wait(1100);
    check(io.state().serial.debug.open, "the debug port is opened when it is free again");

    console.log("\n== single serial, and settings");
    portList = [teensy("COM7", 0)];
    io.onMessage(null, { type: "serial-config", osc: "auto", debug: "auto" });
    await wait(30);
    st = io.state();
    check(st.serial.osc.path === "COM7" && st.serial.debug.path === null, "one Teensy port: it is the OSC port");
    portList = [teensy("COM14", 2), teensy("COM13", 0)];
    io.onMessage(null, { type: "serial-config", osc: "COM13", debug: "off" });
    await wait(30);
    st = io.state();
    check(st.serial.osc.path === "COM13" && st.serial.debug.path === null && !opened.has("COM14"), "a chosen OSC port, debug off");

    console.log("\n== MIDI");
    st = io.state();
    check(st.midi.inputs.join() === "Keystation" && st.midi.outputs.join() === "Teensy MIDI,Synth", "ports listed: " + st.midi.inputs + " / " + st.midi.outputs);
    openedInput.h(0, [0xB0, 7, 100]);
    check(msgs.some(m => m.type === "midi-in" && m.port === "Keystation" && m.data.join() === "176,7,100"), "input message -> midi-in");
    io.onMessage(null, { type: "midi-send", port: "Synth", data: [0x90, 60, 127] });
    check(midiSent.length === 1 && midiSent[0].port === "Synth" && midiSent[0].data.join() === "144,60,127", "midi-send -> the named output");

    io.stop();
    console.log(failures ? `\n${failures} FAILED` : "\nall passed");
    process.exit(failures ? 1 : 0);
})();
