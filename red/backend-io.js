/**
 * Serial and MIDI through the bridge server (fpb/server/io.js), used by itself when the server is connected:
 *   - the Teensy's OSC port: OSC (red/arduino/OSC-teensy.js) sends and receives through the server instead of Web Serial
 *   - the Teensy's debug port: the second log in the bottom panel (red/ui/tab-bottom-debug.js)
 *   - MIDI: RED.midi uses the server's ports instead of Web MIDI
 * Nothing to choose; the label beside the Serial menu shows what goes through the server.
 * The connection itself is RED.fpb.bridge (red/fpb/fpb-bridge.js): it forwards "backend:*" events.
 */
RED.backendIO = (function () {
    'use strict';

    const CH_OSC = 0x01;
    let connected = false;
    let io = null;            // the server's last {type:"io"} state

    function oscOpen() { return connected && io != null && io.serial.osc.open; }
    function debugOpen() { return connected && io != null && io.serial.debug.open; }

    const transport = {
        isOpen: oscOpen,
        write: function (bytes) {
            const b = new Uint8Array(bytes.length + 1);
            b[0] = CH_OSC;
            b.set(bytes, 1);
            RED.fpb.bridge.sendBinary(b);
        },
        get label() { return (io && io.serial.osc.path) || "?"; },
    };

    function apply() {
        OSC.EnableSerialButtons(oscOpen() || navigator.serial != undefined);
        const midiOk = connected && io != null && io.midi.available;
        RED.midi.setBackend(midiOk ? { outputs: io.midi.outputs, send: function (name, data) { RED.fpb.bridge.send({ type: "midi-send", port: name, data: Array.from(data) }); } } : null);
        RED.bottombar.debug.setSource(connected && io ? io.serial.debug.path : null, debugOpen());
        render();
    }

    function onIo(m) {
        const was = oscOpen();
        io = m;
        apply();
        if (!was && oscOpen()) {
            RED.notify("Serial: the Teensy's OSC port " + io.serial.osc.path + " is open through the bridge server", "info", null, 2500);
            RED.events.emit("OSC:connected");
        } else if (was && !oscOpen()) RED.notify("Serial: the Teensy's OSC port " + (io.serial.osc.path || "") + " closed (it's opened again when the Teensy is back)", "warning", null, 3000);
    }

    /** the label beside the Serial menu */
    function render() {
        const lbl = $("#lbl-io-status");
        if (lbl.length == 0) return;
        if (!connected) {
            lbl.html('<span class="io-dot"></span>' + (navigator.serial != undefined ? "Web Serial" : "no serial"))
                .attr("title", "Serial and MIDI go through the bridge server when it's connected (fpb/server: npm start).\nClick to connect to it.");
            return;
        }
        const part = function (name, r) {
            if (!r.path) return '<span class="io-off">' + name + ' -</span>';
            return '<span class="' + (r.open ? "io-on" : "io-err") + '">' + name + " " + r.path + "</span>";
        };
        const s = io ? io.serial : null;
        let html = '<span class="io-dot on"></span>bridge: ';
        if (!s || !s.available) html += '<span class="io-err">serial not installed</span>';
        else html += part("OSC", s.osc) + " · " + part("debug", s.debug);
        if (io && io.midi.available) html += " · MIDI " + io.midi.inputs.length + "/" + io.midi.outputs.length;
        let title = "Serial and MIDI go through the bridge server.";
        if (s && s.available) {
            title += "\nOSC port: " + (s.osc.path || "no Teensy found") + (s.osc.error ? " (" + s.osc.error + ")" : "") +
                     "\ndebug port: " + (s.debug.path || "-") + (s.debug.error ? " (" + s.debug.error + ")" : "") +
                     "\nports: " + s.ports.map(function (p) { return p.path + (p.teensy ? " (Teensy" + (p.iface != null ? ", interface " + p.iface : "") + ")" : ""); }).join(", ");
        }
        if (io && io.midi.available) title += "\nMIDI in: " + (io.midi.inputs.join(", ") || "-") + "\nMIDI out: " + (io.midi.outputs.join(", ") || "-");
        lbl.html(html).attr("title", title);
    }

    // the listeners are added when this file is loaded: the bridge can connect before init() (the settings are loaded first)
    function listen() {
        OSC.SetBackendTransport(transport);
        RED.events.on("backend:connected", function () { connected = true; apply(); });
        RED.events.on("backend:disconnected", function () {
            const was = oscOpen();
            connected = false; io = null;
            apply();
            if (was) RED.notify("Serial: the bridge server is gone, the OSC port is closed", "warning", null, 3000);
        });
        RED.events.on("backend:io", onIo);
        RED.events.on("backend:binary", function (bytes) { if (bytes[0] == CH_OSC) OSC.ReceiveRaw(bytes.subarray(1)); });
        RED.events.on("backend:debug", function (m) { RED.bottombar.debug.add(m.text); });
        RED.events.on("backend:midi-in", function (m) { RED.midi.receive(m.data); });
    }
    listen();

    function init() {
        RED.bottombar.debug.setSender(function (text) { RED.fpb.bridge.send({ type: "debug-send", text }); });
        $("#lbl-io-status").click(function (e) {
            e.preventDefault();
            if (!connected) RED.FaustBridge.settings.Enabled = true;
        });
        RED.bottombar.debug.create();
        render();
    }

    return { init, get oscOpen() { return oscOpen(); }, get state() { return io; } };
})();
