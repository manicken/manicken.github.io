/**
 * OSC live update: changes the design on a Teensy running h4yn0nnym0u5e's OSCAudio library with the Dynamic Audio Objects
 * while it's edited.
 *
 * It keeps the model of what is on the Teensy (RED.exporter.oscLive, the same OSC tree as the Export Mode 'osc_class_msg'),
 * after every change of the design (debounced) the model of the design is made again, and the differences are sent
 * as one bundle. So it works the same for every kind of change: objects, wires, junctions, classes (all instances),
 * arrays, group classes, paste, undo/redo.
 *
 * The root of the OSC tree is one workspace, the root is set when:
 *   - the live update is turned on (the current tab, its design is expected to be on the Teensy already, see Sync)
 *   - the 'osc_class_msg' export is sent (the exported tab)
 *   - Sync is used (clears the Teensy and sends the whole design of the current tab)
 * When the Teensy is not connected the changes are kept, and sent when it's connected.
 */
OSC.LiveUpdate = (function () {
    'use strict';

    const UPDATE_DELAY_MS = 150;
    const EVENTS = ["nodes:add", "nodes:remove", "nodes:change", "nodes:renamed", "nodes:moved", "nodes:inputsUpdated",
        "links:add", "links:remove", "flows:add", "flows:remove", "flows:renamed", "flows:change"];

    let rootId = undefined;       // the id of the workspace that is the root of the OSC tree
    let teensyModel = undefined;  // what is on the Teensy (OscLiveModel)
    let updateTimer = undefined;
    let notConnectedLogged = false;

    function isEnabled() {
        return RED.OSC.settings.LiveUpdate == true;
    }

    function log(text, style) {
        if (RED.OSC.settings.ShowOutputDebug == true) OSC.AddLineToLog("live update: " + text, undefined, style);
    }

    function logWarning(text) {
        OSC.AddLineToLog("live update: " + text, undefined, "background-color:#fcf8e3;");
    }

    /** @param {REDWorkspace} ws @returns {OscLiveModel|undefined} the model of the design, undefined if it can't be made */
    function getDesignModel(ws) {
        try {
            const result = RED.exporter.oscLive.getModel(ws);
            if (result.problems.length != 0) logWarning(result.problems.length + " design error(s), the parts with errors are not sent (use Export to see them)");
            return result.model;
        }
        catch (err) {
            console.error(err);
            logWarning("could not make the model of the design: " + err);
            return undefined;
        }
    }

    /**
     * The design of the workspace is now on the Teensy (after the 'osc_class_msg' export is sent)
     * @param {REDWorkspace} ws
     */
    function setBaseline(ws) {
        const model = getDesignModel(ws);
        if (model == undefined) return;
        rootId = ws.id;
        teensyModel = model;
        log("the root is the tab " + ws.label);
    }

    /** Clears the Teensy and sends the whole design of the current tab, which becomes the root */
    function sync() {
        const ws = RED.nodes.currentWorkspace;
        const model = getDesignModel(ws);
        if (model == undefined) return;
        if (OSC.IsConnected() == false) {
            RED.notify("Sync: the Teensy is not connected", "warning", null, 3000);
            return;
        }
        const result = RED.exporter.oscLive.getCreateMessages(model);
        OSC.SendBundle(RED.exporter.oscMessages.getBundle(result.messages));
        rootId = ws.id;
        teensyModel = result.model;
        log("synced the tab " + ws.label + " (" + result.messages.length + " messages)");
    }

    /** @param {Boolean} state */
    function setEnabled(state) {
        RED.OSC.settings.LiveUpdate = state;
        if (state == false) {
            clearTimeout(updateTimer);
            return;
        }
        setBaseline(RED.nodes.currentWorkspace);
        logWarning("on, the root is the tab " + RED.nodes.currentWorkspace.label + ", use OSC - Sync if the Teensy don't have this design");
    }

    function scheduleUpdate() {
        if (isEnabled() == false) return;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(update, UPDATE_DELAY_MS);
    }

    /** Sends the differences between the design and the Teensy */
    function update() {
        if (isEnabled() == false || rootId == undefined) return;
        const ws = RED.nodes.getWorkspace(rootId);
        if (ws == undefined) {
            logWarning("the root tab is removed, use OSC - Sync to start again");
            rootId = undefined;
            return;
        }
        const model = getDesignModel(ws);
        if (model == undefined) return;
        const changes = RED.exporter.oscLive.getChanges(teensyModel, model);
        if (changes.messages.length == 0) return;
        if (OSC.IsConnected() == false) {
            if (notConnectedLogged == false) logWarning("the Teensy is not connected, the changes are sent when it's connected");
            notConnectedLogged = true;
            return; // the model of the Teensy is not changed, so the changes are sent later
        }
        notConnectedLogged = false;
        OSC.SendBundle(RED.exporter.oscMessages.getBundle(changes.messages));
        teensyModel = changes.model;
        log(changes.messages.length + " message(s) sent");
    }

    function replyErrors(errors) {
        if (isEnabled() == false) return;
        RED.notify("OSC live update: the Teensy reported " + errors.length + " error(s), see the log<br>use OSC - Sync if the design is not the same on the Teensy", "warning", null, 5000);
    }

    function RegisterEvents() {
        for (const eventName of EVENTS) RED.events.on(eventName, scheduleUpdate);
        RED.events.on("OSC:connected", scheduleUpdate);
        RED.events.on("OSC:replyErrors", replyErrors);
        $('#btn-osc-live-sync').click(sync);
        if (isEnabled()) setBaseline(RED.nodes.currentWorkspace);
    }

    return {
        RegisterEvents,
        setEnabled,
        setBaseline,
        sync,
    };
})();
