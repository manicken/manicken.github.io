/**
 * Direct MIDI using the Web MIDI API (Chromium based browsers: Chrome, Edge, Opera), so the UI objects can play
 * a MIDI device (i.e. a Teensy as USB MIDI) without the websocket gateway.
 *
 * The output is selected in the MIDI menu (it's remembered, and selected again when the device is connected).
 * In the scripts of the UI objects (sendCommand):
 *   midiSend(status, data1, data2)   i.e. midiSend(d.keyDown + midiCh, d.octave*12 + d.keyIndex, 127) for UI_Piano
 * Incoming Control Change messages (0xBn) from every MIDI input sets the UI_Slider/UI_ListBox with the same midiId,
 * the same as the websocket gateway does (RED.BiDirDataWebSocketBridge.setUiItemValue).
 */
RED.midi = (function () {
    'use strict';

    const STORAGE_KEY = "midiOutputName";
    let access = undefined;  // MIDIAccess
    let output = undefined;  // the selected MIDIOutput
    let noOutputNotified = false;

    function isAvailable() {
        return navigator.requestMIDIAccess != undefined;
    }

    function getSavedOutputName() {
        try { return localStorage.getItem(STORAGE_KEY); }
        catch (e) { return null; }
    }

    function saveOutputName(name) {
        try {
            if (name == undefined) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, name);
        }
        catch (e) { /* the selection is just not remembered */ }
    }

    /** @returns {Promise<MIDIAccess>} asks for the permission the first time */
    async function requestAccess() {
        if (access != undefined) return access;
        access = await navigator.requestMIDIAccess();
        access.onstatechange = onStateChange;
        listenToInputs();
        const savedName = getSavedOutputName();
        if (savedName != null) output = findOutput(savedName);
        return access;
    }

    /** @param {String} name @returns {MIDIOutput|undefined} */
    function findOutput(name) {
        if (access == undefined) return undefined;
        for (const o of access.outputs.values()) if (o.name == name) return o;
        return undefined;
    }

    /** @param {String|undefined} name undefined for none */
    function selectOutput(name) {
        output = (name == undefined) ? undefined : findOutput(name);
        saveOutputName(name);
        noOutputNotified = false;
        RED.notify("MIDI output: " + ((output != undefined) ? output.name : "none"), "info", null, 2000);
    }

    function onStateChange(e) {
        const port = e.port;
        if (port.type == "input") listenToInputs();
        if (port.type != "output") return;
        if (port.state == "disconnected" && output != undefined && output.id == port.id) {
            output = undefined;
            RED.notify("MIDI output " + port.name + " disconnected", "warning", null, 3000);
        }
        else if (port.state == "connected" && output == undefined && port.name == getSavedOutputName()) {
            output = port;
            RED.notify("MIDI output " + port.name + " connected", "info", null, 2000);
        }
    }

    function listenToInputs() {
        for (const input of access.inputs.values()) input.onmidimessage = onMessage;
    }

    function onMessage(e) {
        const status = e.data[0];
        if ((status & 0xF0) == 0xB0 && e.data.length >= 3) RED.BiDirDataWebSocketBridge.setUiItemValue(e.data[1], e.data[2]);
    }

    /**
     * Sends a MIDI message to the selected output
     * @param {Number} status i.e. 0x90 note on (+ the channel 0-15)
     * @param {Number} [data1]
     * @param {Number} [data2]
     * @returns {Boolean} true if it was sent
     */
    function send(status, data1, data2) {
        const bytes = [status, data1, data2].filter(function (v) { return v != undefined; }).map(Number);
        if (bytes.some(function (v) { return isNaN(v) || v < 0 || v > 255; })) {
            console.warn("midiSend: invalid MIDI bytes", status, data1, data2);
            return false;
        }
        if (output == undefined) {
            if (noOutputNotified == false) RED.notify("MIDI: no output selected, select one in the MIDI menu", "warning", null, 3000);
            noOutputNotified = true;
            return false;
        }
        output.send(bytes);
        return true;
    }

    /** Fills the MIDI menu with the outputs (asks for the MIDI permission the first time) */
    async function fillMenu() {
        const list = $('#menu-midi-list');
        const addItem = function (text, onClick, checked) {
            const a = $('<a class="btn" href="#"></a>');
            a.append($('<i></i>').addClass(checked ? "fa fa-check" : "fa fa-fw"));
            a.append(document.createTextNode(" " + text));
            if (onClick != undefined) a.click(function (e) { e.preventDefault(); onClick(); });
            list.append($('<li></li>').append(a));
        };
        const addPlayerItems = function () {
            const player = RED.midiPlayer;
            list.append($('<li class="divider"></li>'));
            list.append($('<li class="nav-header"></li>').text("MIDI file player" + (player.fileName ? (": " + player.fileName) : "")));
            addItem("Load MIDI file...", player.load);
            addItem("Play", player.play, player.isPlaying());
            addItem("Pause", player.pause);
            addItem("Stop", player.stop);
        };
        list.empty();
        if (isAvailable() == false) {
            addItem("Web MIDI is not available in this browser (use Chrome or Edge)");
            return;
        }
        try { await requestAccess(); }
        catch (err) {
            list.empty();
            addItem("MIDI access was denied: " + err);
            return;
        }
        list.empty();
        list.append($('<li class="nav-header"></li>').text("MIDI output (midiSend)"));
        addItem("none", function () { selectOutput(undefined); }, output == undefined);
        for (const o of access.outputs.values()) {
            const name = o.name;
            addItem(name, function () { selectOutput(name); }, output != undefined && output.id == o.id);
        }
        addPlayerItems();
    }

    function init() {
        $('#menu-midi').click(fillMenu);
        if (isAvailable() && getSavedOutputName() != null) // used before, so the permission is most likely given
            requestAccess().catch(function (err) { console.warn("MIDI: " + err); });
    }

    return {
        init,
        isAvailable,
        send,
        selectOutput,
    };
})();

/** for the scripts of the UI objects, see RED.midi.send */
function midiSend(status, data1, data2) {
    return RED.midi.send(status, data1, data2);
}
