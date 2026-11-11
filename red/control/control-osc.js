/**
 * Live control, the OSC adapter: h4yn0nnym0u5e's OSCAudio library (OSC-teensy.js is the transport, the serial port + SLIP).
 *
 * The address of a method is <root>/audio<path>/<C++ name>, OSCAudio matches the full name against its short patterns
 * ("/gain" matches "/ga*", "/frequencyModulation" matches "/frequencyM*"). A name that don't match goes in ADDRESS.
 * The Teensy replies every message: [the address, the object, (the result), the error code].
 */
RED.control = RED.control || {};
RED.control.oscAdapter = (function () {
    'use strict';

    const READ_TIMEOUT_MS = 1000;
    const REPLY_CODES = ["OK", "NOT_FOUND", "BLANK_NAME", "DUPLICATE_NAME", "NO_DYNAMIC", "NO_MEMORY",
        "AMBIGUOUS_PATH", "NOT_ROUTED", "INVALID_METHOD", "NOT_CONNECTED", "IN_USE"];

    /** typeName -> { call -> the OSC method address }, only where "/" + the C++ name don't work */
    const ADDRESS = {};

    const waitingReads = []; // {address, resolve, reject, timer}

    function getAddress(command) {
        const overrides = ADDRESS[command.typeName];
        const method = (overrides != undefined && overrides[command.call] != undefined) ? overrides[command.call] : ("/" + command.call);
        return RED.OSC.settings.RootAddress + "/audio" + command.path + method;
    }

    function toMessage(command) {
        let types = "";
        const values = [];
        for (const arg of command.args) {
            if (arg.type == "float" || arg.wire == "float") { types += "f"; values.push(Number(arg.value)); } // wire: an enum sent as a float
            else if (arg.type == "string") { types += "s"; values.push(String(arg.value)); }
            else if (arg.type == "bool") { types += arg.value ? "T" : "F"; values.push(0); } // CreatePacket absorbs a value for T/F
            else { types += "i"; values.push(Math.round(Number(arg.value))); } // int, enum, the channel
        }
        return { address: getAddress(command), types, values };
    }

    function isConnected() {
        return OSC.IsConnected();
    }

    /** @param {Object[]} commands sent as one bundle */
    function send(commands) {
        if (isConnected() == false) return;
        OSC.SendBundle(RED.exporter.oscMessages.getBundle(commands.map(toMessage)));
    }

    /** @returns {Promise} the result in the reply */
    function read(command) {
        if (isConnected() == false) return Promise.reject("not connected");
        const message = toMessage(command);
        return new Promise(function (resolve, reject) {
            const waiting = { address: message.address, resolve, reject };
            waiting.timer = setTimeout(function () {
                const index = waitingReads.indexOf(waiting);
                if (index != -1) waitingReads.splice(index, 1);
                reject("no reply");
            }, READ_TIMEOUT_MS);
            waitingReads.push(waiting);
            OSC.SendBundle(RED.exporter.oscMessages.getBundle([message]));
        });
    }

    function bundleReceived(bundle) {
        if (waitingReads.length == 0 || bundle == undefined || bundle.packets == undefined) return;
        for (const packet of bundle.packets) {
            const args = packet.args || [];
            if (args.length < 2 || args[0].value == undefined) continue;
            const index = waitingReads.findIndex(function (w) { return w.address == args[0].value; });
            if (index == -1) continue;
            const waiting = waitingReads.splice(index, 1)[0];
            clearTimeout(waiting.timer);
            const code = args[args.length - 1].value;
            if (code != 0) { waiting.reject(REPLY_CODES[code] || ("error " + code)); continue; }
            const result = args[args.length - 2];
            if (result.type == "T") waiting.resolve(true);
            else if (result.type == "F") waiting.resolve(false);
            else waiting.resolve(result.value);
        }
    }

    const adapter = { id: "osc", label: "OSC (OSCAudio)", isConnected, send, read, getAddress, toMessage };

    function init() {
        RED.events.on("OSCBundle:Received", bundleReceived);
        RED.control.core.registerAdapter(adapter);
    }

    return { init, adapter, ADDRESS };
})();
