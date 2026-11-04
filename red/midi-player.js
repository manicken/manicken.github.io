/**
 * MIDI file player, plays a standard MIDI file (.mid) to the MIDI output selected in the MIDI menu (RED.midi).
 * The file is read and timed by the JZZ library (jzz/JZZ.js + jzz/JZZ.midi.SMF.js, MIT, by Jazz-Soft).
 *
 * It's controlled from the MIDI menu, or from the scripts of the UI objects (sendCommand), i.e.
 *   RED.midiPlayer.load()                       opens a file dialog
 *   RED.midiPlayer.play() / pause() / stop()
 *   RED.midiPlayer.seek(seconds)                i.e. a UI_Slider 0-100: RED.midiPlayer.seek(d.val / 100 * RED.midiPlayer.duration())
 *   RED.midiPlayer.setSpeed(1.5)                1 is the normal speed
 *   RED.midiPlayer.setLoop(true)
 *   RED.midiPlayer.position() / duration()      in seconds
 * The notes that are played lights the keys of the UI_Piano objects in the current tab (note = octave * 12 + key).
 * When it's stopped, paused or moved, all notes that are on are turned off, and after a move the last
 * program, controllers and pitch bend of every channel are sent again (so the instruments sounds as they should).
 */
RED.midiPlayer = (function () {
    'use strict';

    let smf = undefined;        // the loaded file (JZZ.MIDI.SMF)
    let player = undefined;     // JZZ SMF player
    let fileName = "";
    const notesOn = new Map();  // "channel:note" -> {channel, note}, the notes that are on

    /** @returns {Boolean} true if a file is loaded, else a notice is shown */
    function hasFile() {
        if (player != undefined) return true;
        RED.notify("MIDI player: no file loaded (MIDI menu - Load MIDI file)", "warning", null, 3000);
        return false;
    }

    /** Opens a file dialog to load a .mid file */
    function load() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".mid,.midi,.kar,.rmi";
        input.onchange = function () {
            const file = input.files[0];
            if (file == undefined) return;
            file.arrayBuffer().then(function (data) { loadData(data, file.name); });
        };
        input.click();
    }

    /**
     * @param {ArrayBuffer|Uint8Array} data the contents of a standard MIDI file
     * @param {String} name
     * @returns {Boolean} true if it could be read
     */
    function loadData(data, name) {
        stop();
        try {
            smf = JZZ.MIDI.SMF(data);
            player = smf.player();
        }
        catch (err) {
            smf = undefined;
            player = undefined;
            RED.notify("MIDI player: could not read " + name + "<br>" + err, "error", null, 5000);
            return false;
        }
        fileName = name;
        player.connect(onMessage);
        // the player sends 'all sound off' when it stops, pauses or jumps (in its next tick), not every synth
        // handles that so the notes that are on are turned off one by one too
        const allSoundOff = player.sndOff;
        player.sndOff = function () {
            allSoundOff.call(player);
            releaseNotes();
        };
        RED.notify("MIDI player: loaded " + name + " (" + formatTime(duration()) + ")", "info", null, 3000);
        return true;
    }

    function play() {
        if (hasFile() == false) return;
        if (player.playing) return;
        if (player.paused) sendChannelStates(player.position()); // the pause sent 'reset all controllers'
        player.resume(); // resume plays from the start when it's not paused
    }

    function pause() {
        if (player == undefined || player.playing == false) return;
        player.pause(); // the notes are released in the next tick (sndOff)
    }

    function stop() {
        if (player == undefined) return;
        const wasPlaying = player.playing;
        player.stop(); // the next play starts from the beginning
        if (wasPlaying == false) releaseNotes(); // else in the next tick (sndOff)
    }

    /** @param {Number} seconds */
    function seek(seconds) {
        if (hasFile() == false) return;
        player.jumpMS(Math.max(0, Number(seconds) * 1000)); // releases the notes when playing (sndOff)
        if (player.playing) sendChannelStates(player.position()); // else play() sends them
    }

    /** @param {Number} speed 1 is normal speed */
    function setSpeed(speed) {
        if (hasFile() == false) return;
        player.speed(speed);
    }

    /** @param {Boolean|Number} loop true for endless, a number for that many times */
    function setLoop(loop) {
        if (hasFile() == false) return;
        player.loop(loop);
    }

    /** @returns {Number} the position in seconds */
    function position() {
        return (player == undefined) ? 0 : player.positionMS() / 1000;
    }

    /** @returns {Number} the length of the file in seconds */
    function duration() {
        return (player == undefined) ? 0 : player.durationMS() / 1000;
    }

    function isPlaying() {
        return player != undefined && player.playing == true;
    }

    /** @param {Number} seconds @returns {String} m:ss */
    function formatTime(seconds) {
        const s = Math.round(seconds);
        return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }

    // ******************************************************************
    // sending
    // ******************************************************************

    /** @param {Object} msg a JZZ MIDI message (an array of bytes, meta events have no bytes) */
    function onMessage(msg) {
        if (msg.length == 0) return; // meta event (tempo, text ...)
        const status = msg[0];
        if (status >= 0xF0) return; // system exclusive: Web MIDI needs an extra permission for that
        const bytes = Array.from(msg);
        RED.midi.send(...bytes);

        const type = status & 0xF0;
        const channel = status & 0x0F;
        if (type == 0x90 && bytes[2] > 0) noteChanged(channel, bytes[1], true);
        else if (type == 0x80 || type == 0x90) noteChanged(channel, bytes[1], false);
    }

    function noteChanged(channel, note, on) {
        const key = channel + ":" + note;
        if (on == notesOn.has(key)) return; // (a note on for a note that is on, is not lit twice)
        if (on) notesOn.set(key, { channel, note });
        else notesOn.delete(key);
        for (const node of getPianos()) {
            if (Number(node.octave) == Math.floor(note / 12)) RED.view.ui.setPianoKeyLit(node, note % 12, on);
        }
    }

    /** @returns {REDNode[]} the UI_Piano objects in the current tab */
    function getPianos() {
        return RED.nodes.cwsNodes.filter(function (n) { return n.type == "UI_Piano"; });
    }

    /** Turns off all notes that are on (and unlights the piano keys) */
    function releaseNotes() {
        for (const n of notesOn.values()) RED.midi.send(0x80 | n.channel, n.note, 0);
        notesOn.clear();
        for (const node of getPianos()) RED.view.ui.clearPianoKeys(node);
        RED.view.redraw();
    }

    /**
     * Sends the last program change, controllers and pitch bend of every channel before a position (after a move)
     * @param {Number} tick the position in ticks
     */
    function sendChannelStates(tick) {
        if (smf == undefined || smf.type == 2) return; // in type 2 files every track is a song of its own
        const programs = new Map();     // channel -> message
        const controllers = new Map();  // "channel:controller" -> message
        const pitchBends = new Map();   // channel -> message
        for (let t = 0; t < smf.length; t++) {
            const track = smf[t];
            if (track.type != "MTrk") continue;
            for (const e of track) {
                if (e.tt >= tick) break;
                if (e.length == 0 || e[0] >= 0xF0) continue;
                const type = e[0] & 0xF0;
                const channel = e[0] & 0x0F;
                if (type == 0xC0) programs.set(channel, Array.from(e));
                else if (type == 0xE0) pitchBends.set(channel, Array.from(e));
                else if (type == 0xB0 && e[1] < 120) controllers.set(channel + ":" + e[1], Array.from(e)); // 120-127 are channel modes
            }
        }
        for (const m of [...programs.values(), ...controllers.values(), ...pitchBends.values()]) RED.midi.send(...m);
    }

    return {
        load,
        loadData,
        play,
        pause,
        stop,
        seek,
        setSpeed,
        setLoop,
        position,
        duration,
        isPlaying,
        get fileName() { return fileName; },
        formatTime,
    };
})();
