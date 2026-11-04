/**
 * A text line protocol over the serial port for the scripts of the UI objects, i.e. to make a control panel for a
 * Teensy sketch that answers text commands. It uses the serial port of the OSC menu (Connect serial port),
 * and the received data must be decoded as text lines (the OSC setting Encoding = 'no encoding', see useTextMode).
 *
 *   RED.serial.useTextMode()                          the received data is decoded as text lines
 *   RED.serial.onLine("myPanel", function (line) {})  every received line (without the line end), one handler per name,
 *                                                     so running a setup script again replaces its handler
 *   RED.serial.sendLine("list_files:")                sends the text + "\n"
 *   RED.serial.sendFile(file, function (sent, total) {})   sends the bytes of a File (i.e. from RED.serial.selectFile)
 *   RED.serial.selectFile(function (file) {})         opens a file dialog
 *   RED.serial.isConnected()
 */
RED.serial = (function () {
    'use strict';

    const CHUNK_SIZE = 4096;
    const handlers = new Map(); // name -> function (line)

    function init() {
        RED.events.on("serial:line", function (line) {
            for (const [name, handler] of handlers) {
                try { handler(line); }
                catch (err) { console.error("serial line handler " + name + ": ", err); }
            }
        });
    }

    function useTextMode() {
        RED.OSC.settings.Encoding = 0; // 'no encoding'
    }

    /** @param {String} name @param {Function|undefined} handler undefined removes it */
    function onLine(name, handler) {
        if (handler == undefined) handlers.delete(name);
        else handlers.set(name, handler);
    }

    function isConnected() {
        return OSC.IsConnected();
    }

    /** @param {String} text @returns {Boolean} false when not connected */
    function sendLine(text) {
        if (isConnected() == false) {
            RED.notify("serial port not connected (OSC menu - Connect)", "warning", null, 3000);
            return false;
        }
        OSC.SendTextToSerial(text + "\n");
        return true;
    }

    /** @param {Function} callback called with the selected File */
    function selectFile(callback) {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = function () { if (input.files[0] != undefined) callback(input.files[0]); };
        input.click();
    }

    /**
     * @param {File|Blob} file
     * @param {Function} [onProgress] called with (bytes sent, total bytes)
     * @returns {Promise<Boolean>} true when all is sent
     */
    async function sendFile(file, onProgress) {
        const data = new Uint8Array(await file.arrayBuffer());
        for (let pos = 0; pos < data.length; pos += CHUNK_SIZE) {
            if (isConnected() == false) return false;
            await OSC.SendRawToSerial(data.subarray(pos, pos + CHUNK_SIZE)); // waits until it's written
            if (onProgress != undefined) onProgress(Math.min(pos + CHUNK_SIZE, data.length), data.length);
        }
        return true;
    }

    return {
        init,
        useTextMode,
        onLine,
        isConnected,
        sendLine,
        selectFile,
        sendFile,
    };
})();
