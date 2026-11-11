// Serial and MIDI for ASDT++ through the bridge, so the browser needs no Web Serial / Web MIDI (works in any
// browser, and the ports reconnect by themselves when the Teensy restarts).
//
// Serial: the Teensy (USB vendor 16C0) is found by itself. With two serial ports (USB type Dual Serial):
//   interface 0 (Serial)     = the debug port   -> text to the second log in ASDT++
//   interface 2 (SerialUSB1) = the OSC port     -> raw bytes to/from ASDT++ (SLIP + OSC stay in the browser)
// With one port, it is the OSC port. --osc-port / --debug-port (a path, or "off") override that, and so does a
// {type:"serial-config"} message from ASDT++.
//
// To ASDT++ (WebSocket):  binary frames  [0x01, bytes...]   OSC port data (both ways)
//                         {type:"io", serial:{...}, midi:{...}}   the state, sent when it changes
//                         {type:"debug", text}                    debug port text
//                         {type:"midi-in", port, data:[...]}      a message from a MIDI input
// From ASDT++:            {type:"serial-config", osc, debug}      "auto" | a path | "off"
//                         {type:"debug-send", text}               text to the debug port
//                         {type:"midi-send", port, data:[...]}    a message to a MIDI output (by name)
"use strict";

const CH_OSC = 0x01;
const SCAN_MS = 1000;
const MIDI_SCAN_MS = 2000;
const DEBUG_FLUSH_MS = 30;
const TEENSY_VID = "16c0";

function tryRequire(name) { try { return require(name); } catch (e) { return null; } }

module.exports = function createIO(options) {
    const log = options.log;
    const broadcast = options.broadcast;            // (obj) JSON to every client
    const broadcastBinary = options.broadcastBinary; // (Buffer) a binary frame to every client
    const sp = options.serialport !== undefined ? options.serialport : tryRequire("serialport");       // injectable for the tests
    const midi = options.midi !== undefined ? options.midi : tryRequire("@julusian/midi");
    if (!sp || !midi) log("serial / MIDI for ASDT++: " + (sp ? "" : "serialport ") + (midi ? "" : "@julusian/midi ") +
        "not installed, run 'npm install' in fpb/server (or start with 'npm start' there)");

    // ------------------------------------------------------------------ serial

    const config = { osc: options.oscPort || "auto", debug: options.debugPort || "auto" };
    const roles = {
        osc: { role: "osc", path: null, port: null, open: false, error: null },
        debug: { role: "debug", path: null, port: null, open: false, error: null },
    };
    let ports = [];             // the last list: {path, label, teensy, iface}
    let scanning = false, scanTimer = null;
    let debugText = "", debugTimer = null;
    let lastState = "";

    function ifaceOf(p) {
        const m = /MI_(\d+)/i.exec(p.pnpId || "") || /-if(\d+)/i.exec(p.pnpId || "");
        return m ? parseInt(m[1], 16) : null;
    }

    function choose(list) {
        const teensy = list.filter(p => p.teensy).sort((a, b) => (a.iface ?? 99) - (b.iface ?? 99) || a.path.localeCompare(b.path, undefined, { numeric: true }));
        const auto = teensy.length >= 2 ? { debug: teensy[0].path, osc: teensy[1].path } : teensy.length === 1 ? { osc: teensy[0].path, debug: null } : { osc: null, debug: null };
        const pick = function (setting, autoPath) {
            if (setting === "off") return null;
            if (setting && setting !== "auto") return list.some(p => p.path === setting) ? setting : null;
            return autoPath;
        };
        return { osc: pick(config.osc, auto.osc), debug: pick(config.debug, auto.debug) };
    }

    async function scan() {
        if (!sp || scanning) return;
        scanning = true;
        try {
            const raw = await sp.SerialPort.list();
            ports = raw.map(p => ({
                path: p.path,
                teensy: String(p.vendorId || "").toLowerCase() === TEENSY_VID,
                iface: ifaceOf(p),
                label: (p.friendlyName || p.manufacturer || p.path).replace(/\s*\(COM\d+\)\s*$/, "")
            }));
            const want = choose(ports);
            for (const r of [roles.osc, roles.debug]) {
                const path = want[r.role];
                if (r.path && r.path !== path) close(r, "not chosen any more");
                if (path && path === (r.role === "osc" ? roles.debug.path : roles.osc.path)) continue;  // one role per port
                if (path && !r.port) openPort(r, path);
            }
        } catch (e) {
            log("serial scan: " + e.message);
        } finally {
            scanning = false;
            sendState();
        }
    }

    function openPort(r, path) {
        r.path = path;
        r.error = null;
        const port = new sp.SerialPort({ path, baudRate: 115200, autoOpen: false });
        r.port = port;
        port.open(function (err) {
            if (r.port !== port) return;
            if (err) {
                if (r.error !== err.message) log("serial " + r.role + " " + path + ": " + err.message);
                r.error = err.message; r.port = null; r.open = false;   // tried again at the next scan (i.e. used by hterm)
                sendState();
                return;
            }
            port.set({ dtr: true, rts: true }, function () { /* DTR: the Teensy's "while(!Serial)" sees the port open */ });
            r.open = true;
            log("serial " + r.role + " port " + path + " open");
            sendState();
        });
        port.on("data", function (buf) {
            if (r.role === "osc") broadcastBinary(Buffer.concat([Buffer.from([CH_OSC]), buf]));
            else queueDebug(buf.toString("utf8"));
        });
        port.on("close", function () {
            if (r.port !== port) return;
            log("serial " + r.role + " port " + path + " closed");
            r.port = null; r.open = false;
            sendState();
        });
        port.on("error", function (e) { r.error = e.message; sendState(); });
    }

    function close(r, why) {
        const p = r.port;
        r.port = null; r.open = false; r.path = null;
        if (p) { try { p.close(); } catch (e) { /* already closed */ } log("serial " + r.role + " closed: " + why); }
    }

    // the last debug text, for a client that connects later (the Teensy's boot text and CrashReport come first)
    const BACKLOG_CHARS = 20000;
    let backlog = "";

    function queueDebug(text) {
        backlog = (backlog + text).slice(-BACKLOG_CHARS);
        debugText += text;
        if (!debugTimer) debugTimer = setTimeout(function () {
            debugTimer = null;
            const t = debugText; debugText = "";
            broadcast({ type: "debug", text: t });
        }, DEBUG_FLUSH_MS);
    }

    // ------------------------------------------------------------------ MIDI

    const midiIn = new Map();    // name -> Input (open)
    const midiOut = new Map();   // name -> Output (opened on first use)
    let midiNames = { inputs: [], outputs: [] };

    function midiPortNames(probe) {
        const names = [];
        try { for (let i = 0; i < probe.getPortCount(); i++) names.push(probe.getPortName(i)); } catch (e) { /* none */ }
        return names;
    }

    // made once and kept: RtMidi prints "no MIDI input devices currently available" every time an Input is made
    // without inputs, and getPortCount() asks the system again on every call anyway
    let probeIn = null, probeOut = null;

    function midiScan() {
        if (!midi) return;
        if (!probeIn) { probeIn = new midi.Input(); probeOut = new midi.Output(); }
        const inputs = midiPortNames(probeIn), outputs = midiPortNames(probeOut);
        // inputs: open the new ones, close the gone ones
        for (const [name, input] of midiIn) if (!inputs.includes(name)) { try { input.closePort(); } catch (e) { /* */ } midiIn.delete(name); }
        inputs.forEach(function (name, index) {
            if (midiIn.has(name)) return;
            try {
                const input = new midi.Input();
                input.ignoreTypes(false, true, true);   // keep sysex, skip timing and active sensing
                input.on("message", function (dt, data) { broadcast({ type: "midi-in", port: name, data: Array.from(data) }); });
                input.openPort(index);
                midiIn.set(name, input);
                log("MIDI input " + name + " open");
            } catch (e) { log("MIDI input " + name + ": " + e.message); }
        });
        for (const [name, output] of midiOut) if (!outputs.includes(name)) { try { output.closePort(); } catch (e) { /* */ } midiOut.delete(name); }
        midiNames = { inputs, outputs };
        sendState();
    }

    function midiSend(name, data) {
        if (!midi) return;
        let out = midiOut.get(name);
        if (!out) {
            const index = midiNames.outputs.indexOf(name);
            if (index < 0) return;
            out = new midi.Output();
            try { out.openPort(index); } catch (e) { log("MIDI output " + name + ": " + e.message); return; }
            midiOut.set(name, out);
        }
        try { out.sendMessage(data.map(Number)); } catch (e) { log("MIDI send: " + e.message); }
    }

    // ------------------------------------------------------------------ state, messages

    function state() {
        const role = r => ({ path: r.path, open: r.open, error: r.error });
        return {
            type: "io",
            serial: { available: !!sp, config, ports, osc: role(roles.osc), debug: role(roles.debug) },
            midi: { available: !!midi, inputs: midiNames.inputs, outputs: midiNames.outputs },
        };
    }

    function sendState() {
        const s = state(), key = JSON.stringify(s);
        if (key === lastState) return;
        lastState = key;
        broadcast(s);
    }

    /** @returns {Boolean} true when the message was for the IO */
    function onMessage(client, msg) {
        switch (msg.type) {
            case "serial-config":
                if (msg.osc !== undefined) config.osc = String(msg.osc || "auto");
                if (msg.debug !== undefined) config.debug = String(msg.debug || "auto");
                close(roles.osc, "config changed"); close(roles.debug, "config changed");
                scan();
                return true;
            case "debug-send":
                if (roles.debug.open) roles.debug.port.write(String(msg.text || ""));
                return true;
            case "midi-send":
                if (Array.isArray(msg.data)) midiSend(String(msg.port), msg.data);
                return true;
        }
        return false;
    }

    function onBinary(client, buf) {
        if (buf.length < 1) return;
        if (buf[0] === CH_OSC && roles.osc.open) roles.osc.port.write(buf.subarray(1));
    }

    function start() {
        if (sp) { scan(); scanTimer = setInterval(scan, SCAN_MS); }
        if (midi) { midiScan(); setInterval(midiScan, MIDI_SCAN_MS); }
    }

    function stop() {
        clearInterval(scanTimer);
        close(roles.osc, "stop"); close(roles.debug, "stop");
        for (const i of midiIn.values()) try { i.closePort(); } catch (e) { /* */ }
        for (const o of midiOut.values()) try { o.closePort(); } catch (e) { /* */ }
        try { if (probeIn) { probeIn.closePort(); probeOut.closePort(); } } catch (e) { /* */ }
    }

    /** what a client gets when it connects: the state, and the debug text so far */
    function welcome(send) {
        send(state());
        if (backlog) send({ type: "debug", text: backlog, backlog: true });
    }

    return { start, stop, state, welcome, onMessage, onBinary, CH_OSC, _choose: choose, _ifaceOf: ifaceOf, _setPorts(p) { ports = p; } };
};
