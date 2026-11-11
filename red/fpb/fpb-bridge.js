/**
 * FPB Faust bridge, the ASDT++ side: connects to fpb/server/fpb-faust-server.js over WebSocket, receives compiled
 * patches (from the Faust IDE export or from the code of an AudioEffectFPB node), keeps them in the node
 * (saved with the project) and sends them to the Teensy over OSC (OSCAudioEffectFPB: /begin, /feed b, /end).
 *
 * The parameters of the loaded patch become the live control methods of the node (setParam(index, value)),
 * so the live tab, the GUI objects and "send all again" work like for the other audio objects.
 *
 * Settings: RED.FaustBridge (the settings system finds every RED.<name> with settings).
 */
RED.FaustBridge = (function () {
    'use strict';

    const defSettings = {
        Enabled: false,     // turned on by the "Connect" button in the live tab of an AudioEffectFPB (then remembered)
        ServerUrl: "",      // empty: the bridge that serves this page, else ws://127.0.0.1:8088/asdt
        AutoSend: true,
        ChunkSize: 4096,
    };
    const _settings = Object.assign({}, defSettings);
    const settings = {
        get Enabled() { return _settings.Enabled; },
        set Enabled(v) { _settings.Enabled = v; RED.storage.update(); if (RED.fpb != undefined && RED.fpb.bridge != undefined) RED.fpb.bridge.settingsChanged(); },
        get ServerUrl() { return _settings.ServerUrl; },
        set ServerUrl(v) { _settings.ServerUrl = v; RED.storage.update(); if (RED.fpb != undefined && RED.fpb.bridge != undefined) RED.fpb.bridge.settingsChanged(); },
        get AutoSend() { return _settings.AutoSend; },
        set AutoSend(v) { _settings.AutoSend = v; RED.storage.update(); },
        get ChunkSize() { return _settings.ChunkSize; },
        set ChunkSize(v) { _settings.ChunkSize = Math.max(64, parseInt(v) || defSettings.ChunkSize); RED.storage.update(); },
    };
    const settingsCategory = { label: "Faust bridge (FPB)", expanded: false, bgColor: "#DDD",
        popupText: "Connection to the FPB Faust bridge (fpb/server/fpb-faust-server.js), that compiles Faust code for AudioEffectFPB objects" };
    const settingsEditor = {
        Enabled: { label: "Connect", type: "boolean", popupText: "connect to the bridge (and reconnect when it's restarted)" },
        ServerUrl: { label: "Server", type: "string", popupText: "the WebSocket address of the bridge<br>empty: the bridge that serves this page (http://127.0.0.1:8088/), else ws://127.0.0.1:8088/asdt" },
        AutoSend: { label: "Send to the Teensy", type: "boolean", popupText: "send a patch to the AudioEffectFPB objects on the Teensy when it arrives<br>(needs the OSC live update)" },
        ChunkSize: { label: "Chunk size", type: "number", popupText: "bytes per /feed message" },
    };
    return { defSettings, settings, settingsCategory, settingsEditor };
})();

RED.fpb = RED.fpb || {};
RED.fpb.bridge = (function () {
    'use strict';

    const TYPE = "AudioEffectFPB";
    const RECONNECT_MS = 3000;
    const END_TIMEOUT_MS = 10000;
    const FPB_ERRORS = { 0: "OK", "-1": "E_MAGIC", "-2": "E_VERSION", "-3": "E_HEADER", "-4": "E_OPCOUNT", "-5": "E_OP_INDEX",
        "-6": "E_OP_RESERVED", "-7": "E_OP_REMOVED", "-8": "E_OP_ARITY", "-9": "E_OP_FP", "-10": "E_ARRAY", "-11": "E_NOMEM",
        "-12": "E_SLOT", "-13": "E_INSTR_OP", "-14": "E_INSTR_ARITY", "-15": "E_OPERAND", "-16": "E_WRITE_INPUT",
        "-17": "E_CODE_SIZE", "-18": "E_DATA_SIZE", "-19": "E_CRC", "-20": "E_TRAILING", "-21": "E_INCOMPLETE", "-22": "E_STATE" };

    let ws = undefined;
    let state = "off";            // off | connecting | connected
    let server = undefined;       // the hello message
    let reconnectTimer = undefined;
    let nextId = 1;
    const pending = new Map();    // compile id -> node id
    const status = new Map();     // node id -> { text, error } shown in the live tab
    const infoCache = new Map();  // node id -> { json, info }

    // ------------------------------------------------------------------ connection

    const DEFAULT_URL = "ws://127.0.0.1:8088/asdt";
    let sameOrigin = null;        // the bridge's WebSocket when this page is served by the bridge itself

    /** is this page served by fpb-faust-server? @returns {Promise<String|null>} its WebSocket address */
    function probeSameOrigin() {
        if (typeof location == "undefined" || !/^https?:$/.test(location.protocol) || typeof fetch == "undefined") return Promise.resolve(null);
        return fetch(location.origin + "/faust/bridge.json", { cache: "no-store" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) { return (j && j.bridge) ? ((location.protocol == "https:" ? "wss://" : "ws://") + location.host + j.ws) : null; })
            .catch(function () { return null; });
    }

    /** the Server setting, or (empty) the server of this page when it's the bridge, else 127.0.0.1:8088 */
    function serverUrl() { return RED.FaustBridge.settings.ServerUrl || sameOrigin || DEFAULT_URL; }

    /** connect when it's turned on, or always when this page came from the bridge */
    function wanted() { return RED.FaustBridge.settings.Enabled || (sameOrigin != null && !RED.FaustBridge.settings.ServerUrl); }

    function settingsChanged() {
        disconnect();
        if (wanted()) connect();
        refresh();
    }

    function connect() {
        if (ws != undefined) return;
        clearTimeout(reconnectTimer);
        state = "connecting";
        try { ws = new WebSocket(serverUrl()); }
        catch (e) { ws = undefined; state = "off"; scheduleReconnect(); return; }
        ws.binaryType = "arraybuffer";
        ws.onopen = function () { state = "connected"; refresh(); RED.events.emit("backend:connected"); };
        ws.onmessage = function (e) {
            if (typeof e.data != "string") { RED.events.emit("backend:binary", new Uint8Array(e.data)); return; }   // serial bytes (red/backend-io.js)
            let m; try { m = JSON.parse(e.data); } catch (err) { return; }
            receive(m);
        };
        ws.onclose = function () {
            const was = state;
            ws = undefined; state = "off"; server = undefined;
            if (was == "connected") { RED.notify("Faust bridge: disconnected", "warning", null, 2000); RED.events.emit("backend:disconnected"); }
            refresh();
            scheduleReconnect();
        };
        ws.onerror = function () { /* onclose follows */ };
    }

    function disconnect() {
        clearTimeout(reconnectTimer);
        const was = state;
        if (ws != undefined) { ws.onclose = null; ws.close(); }
        ws = undefined; state = "off"; server = undefined;
        if (was == "connected") RED.events.emit("backend:disconnected");
    }

    /** @param {Uint8Array} bytes a binary frame (the first byte is the channel, see fpb/server/io.js) */
    function sendBinary(bytes) {
        if (state != "connected") return false;
        ws.send(bytes);
        return true;
    }

    function scheduleReconnect() {
        clearTimeout(reconnectTimer);
        if (wanted()) reconnectTimer = setTimeout(connect, RECONNECT_MS);
    }

    function send(obj) {
        if (state != "connected") return false;
        ws.send(JSON.stringify(obj));
        return true;
    }

    // ------------------------------------------------------------------ patches

    function patchName(node) { return node.patch || node.name; }

    function fpbNodes() {
        const list = [];
        RED.nodes.eachNode(function (n) { if (n.type == TYPE) list.push(n); });
        return list;
    }

    function receive(m) {
        if (m.type == "hello") {
            server = m;
            if (!m.faust) RED.notify("Faust bridge: connected, but the server has no faust compiler (start it with --faust <path>)", "warning", null, 5000);
            else RED.notify("Faust bridge: connected (faust " + m.faust + ")", "info", null, 2000);
            refresh();
            return;
        }
        if (m.type == "patch") {
            const byId = (m.id != undefined) ? pending.get(m.id) : undefined;
            pending.delete(m.id);
            const nodes = fpbNodes().filter(function (n) { return patchName(n) == m.name || n.id == byId; });
            if (nodes.length == 0) {
                RED.notify("Faust bridge: patch " + m.name + " compiled, no " + TYPE + " object uses it (set Patch, or name the object " + m.name + ")", "info", null, 4000);
                return;
            }
            for (const n of nodes) apply(n, m);
            RED.notify("Faust: " + m.name + " loaded into " + nodes.map(function (n) { return n.name; }).join(", ") +
                " (" + m.params.length + " params, " + m.stats.smp + " ops/sample)", "info", null, 2500);
            return;
        }
        if (m.type == "error") {
            const byId = (m.id != undefined) ? pending.get(m.id) : undefined;
            pending.delete(m.id);
            for (const n of fpbNodes()) if (patchName(n) == m.name || n.id == byId) status.set(n.id, { error: true, text: m.message });
            RED.notify("Faust " + (m.name || "") + ": " + String(m.message || "").split("\n")[0], "error", null, 5000);
            refresh();
            return;
        }
        RED.events.emit("backend:" + m.type, m);   // io, debug, midi-in: red/backend-io.js
    }

    /** stores the patch in the node (saved with the project) and sends it to the Teensy */
    function apply(node, m) {
        const info = { name: m.name, origin: m.origin, time: m.time, inputs: m.inputs, outputs: m.outputs, sampleRate: m.sampleRate,
                       params: m.params, stats: m.stats, warnings: m.warnings || [] };
        node.fpbData = m.fpb;
        node.fpbInfo = JSON.stringify(info);
        if (node.patch == "" && node.name != m.name) node.patch = m.name;
        node.inputs = m.inputs;
        node.outputs = Math.max(1, m.outputs);
        node.dirty = true;
        RED.nodes.dirty(true);
        status.set(node.id, { text: "compiled " + new Date(m.time).toLocaleTimeString() + " (" + m.origin + ")" });
        RED.events.emit("nodes:change", node);
        if (RED.view != undefined && RED.view.redraw != undefined) RED.view.redraw(true);
        if (RED.FaustBridge.settings.AutoSend) upload(node, undefined, true);
        refresh();
    }

    /** @returns {Object|undefined} the info of the patch in the node (parsed once) */
    function info(node) {
        if (!node.fpbInfo) return undefined;
        const c = infoCache.get(node.id);
        if (c != undefined && c.json === node.fpbInfo) return c.info;
        let parsed;
        try { parsed = JSON.parse(node.fpbInfo); } catch (e) { return undefined; }
        infoCache.set(node.id, { json: node.fpbInfo, info: parsed });
        return parsed;
    }

    /**
     * Faust [style:menu{'Saw':0;'Square':1}] / [style:radio{...}] -> [{label, value}] (undefined for other styles)
     * @param {String} style
     */
    function styleOptions(style) {
        const m = /^\s*(menu|radio)\s*\{(.*)\}\s*$/.exec(style || "");
        if (!m) return undefined;
        const options = [];
        const re = /'([^']*)'\s*:\s*([-+0-9.eE]+)/g;
        let o;
        while ((o = re.exec(m[2]))) options.push({ label: o[1], value: Number(o[2]) });
        return options.length ? options : undefined;
    }

    /**
     * the live control methods of a node: setParam(index, value) per parameter of its patch
     *   sliders / nentry       a float with the Faust range ([scale:log], [unit:Hz])
     *   [style:menu/radio{}]   a list (sent as the float value of the entry)
     *   checkbox               a list off / on
     *   button                 a button: 1 while pressed, 0 when released (the release method is hidden)
     * [tooltip:...] is the help; Faust's ordering keys ([0], [1] ...) and [style:knob] are not used.
     */
    /** what the Teensy object tells about itself (OSCAudioFPB.h), shown last in the live tab */
    const DIAGNOSTICS = [
        { id: "cpu", call: "cpu", kind: "read", returns: "float", label: "CPU % (last block)", help: "percent of one audio block the patch takes" },
        { id: "cpuMax", call: "cpuMax", kind: "read", returns: "float", label: "CPU % (highest)", help: "the highest since the patch was loaded" },
        { id: "isOverloaded", call: "isOverloaded", kind: "read", returns: "bool", label: "stopped by the CPU guard",
          help: "true: the patch took more than the CPU limit (70 % of a block) and was stopped, so the Teensy keeps running" },
    ];

    function methods(node) {
        const i = info(node);
        if (i == undefined) return [];
        return paramMethods(i).concat(DIAGNOSTICS);
    }

    function paramMethods(i) {
        // the label alone when it's unique, else the group path
        const count = {};
        for (const p of i.params) count[p.label] = (count[p.label] || 0) + 1;
        const list = [];
        for (const p of i.params) {
            const meta = p.meta || {};
            const label = (count[p.label] > 1) ? (p.path || p.label) : p.label;
            const help = meta.tooltip ? String(meta.tooltip).replace(/\s+/g, " ").trim() : undefined;
            const base = { id: "p" + p.index, call: "setParam", label, help, prefixArgs: [{ type: "int", value: p.index }] };
            if (p.widget == "Button") {
                list.push(Object.assign({}, base, { kind: "action", release: "p" + p.index + "_up", prefixArgs: [{ type: "int", value: p.index }, { type: "float", value: 1 }] }));
                list.push({ id: "p" + p.index + "_up", call: "setParam", kind: "action", hidden: true, prefixArgs: [{ type: "int", value: p.index }, { type: "float", value: 0 }] });
                continue;
            }
            const options = (p.widget == "CheckButton") ? [{ label: "off", value: 0 }, { label: "on", value: 1 }] : styleOptions(meta.style);
            if (options != undefined) {
                list.push(Object.assign(base, { args: [{ name: p.label, type: "enum", wire: "float", options, default: p.def }] }));
                continue;
            }
            list.push(Object.assign(base, { args: [{ name: p.label, type: "float", min: p.min, max: p.max, default: p.def,
                scale: (meta.scale == "log" && p.min > 0) ? "log" : "lin", unit: meta.unit }] }));
        }
        return list;
    }

    function base64ToBytes(b64) {
        const s = atob(b64), out = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
        return out;
    }

    // ------------------------------------------------------------------ Teensy (OSC)

    /**
     * Sends the patch of the node to its objects on the Teensy: /begin, /feed (chunks), /end; then the stored
     * parameter values again.
     * @param {REDNode} node @param {Object[]} [targets] {path, typeName}, default: all the objects of the node
     * @param {Boolean} [quiet] no notification when it can't be sent
     */
    function upload(node, targets, quiet) {
        if (!node.fpbData) { if (!quiet) RED.notify("no patch in " + node.name + " yet", "warning", null, 2000); return 0; }
        if (typeof OSC == "undefined" || OSC.IsConnected() == false) { if (!quiet) RED.notify("the Teensy is not connected (OSC)", "warning", null, 2000); return 0; }
        targets = targets || RED.control.core.getTargets(node).targets;
        if (targets.length == 0) {
            if (!quiet) RED.notify(node.name + " is not on the Teensy (turn on the OSC live update)", "warning", null, 3000);
            return 0;
        }
        const bytes = base64ToBytes(node.fpbData);
        const chunk = RED.FaustBridge.settings.ChunkSize;
        for (const t of targets) {
            const base = RED.OSC.settings.RootAddress + "/audio" + t.path;
            OSC.SendMessage(base + "/begin", "");
            for (let off = 0; off < bytes.length; off += chunk)   // without the debug log: a blob would fill it
                OSC.SendData(osc.writePacket({ address: base + "/feed", args: [{ type: "b", value: bytes.subarray(off, off + chunk) }] }, { metadata: true }));
            const endAddress = base + "/end";
            waitReply(endAddress, END_TIMEOUT_MS).then(function (result) {
                if (result == 0) {
                    status.set(node.id, { text: "on the Teensy: " + t.path + " (" + bytes.length + " bytes)" });
                    RED.control.core.resend(node, [t]);
                    setTimeout(function () { checkCpu(node, t); }, CPU_CHECK_MS);
                } else {
                    const name = FPB_ERRORS[result] || ("error " + result);
                    status.set(node.id, { error: true, text: "the Teensy refused the patch: " + name });
                    RED.notify(t.path + ": the Teensy refused the patch (" + name + ")", "error", null, 5000);
                }
                refresh();
            }, function (err) {
                status.set(node.id, { error: true, text: t.path + ": " + err });
                refresh();
            });
            OSC.SendMessage(endAddress, "");
        }
        status.set(node.id, { text: "sending " + bytes.length + " bytes to " + targets.length + " object(s) ..." });
        refresh();
        return targets.length;
    }

    const CPU_CHECK_MS = 600;

    /** after a patch is loaded: did the Teensy's CPU guard stop it? (then it needs more CPU than the Teensy has) */
    function checkCpu(node, target) {
        const core = RED.control.core;
        const byId = function (id) { return DIAGNOSTICS.find(function (m) { return m.id == id; }); };
        Promise.all([core.read([target], byId("isOverloaded"), []), core.read([target], byId("cpuMax"), [])]).then(function (r) {
            const over = r[0][0], cpu = r[1][0];
            if (over.error != undefined) return;           // an older firmware without the guard
            const pct = (cpu.error == undefined) ? Number(cpu.value).toFixed(0) + " %" : "?";
            if (over.value === true) {
                status.set(node.id, { error: true, text: target.path + ": stopped by the Teensy's CPU guard, it needs " + pct + " of an audio block (limit 70 %)" });
                RED.notify(node.name + ": the patch needs too much CPU (" + pct + " of a block), the Teensy stopped it", "error", null, 6000);
            } else status.set(node.id, { text: "on the Teensy: " + target.path + ", CPU " + pct + " of a block" });
            refresh();
        });
    }

    /** @returns {Promise<*>} the result in the Teensy's reply to address */
    function waitReply(address, ms) {
        return new Promise(function (resolve, reject) {
            const handler = function (bundle) {
                if (bundle == undefined || bundle.packets == undefined) return;
                for (const p of bundle.packets) {
                    const a = p.args || [];
                    if (a.length < 2 || a[0].value != address) continue;
                    done();
                    const code = a[a.length - 1].value;
                    if (code != 0) reject("OSC error " + code + (code == 8 ? " (INVALID_METHOD: the Teensy firmware has no FPB support?)" : ""));
                    else resolve(a.length >= 4 ? a[a.length - 2].value : 0);
                    return;
                }
            };
            const timer = setTimeout(function () { done(); reject("no reply to /end"); }, ms);
            function done() { clearTimeout(timer); RED.events.off("OSCBundle:Received", handler); }
            RED.events.on("OSCBundle:Received", handler);
        });
    }

    /** the OSC live update / Sync created objects on the Teensy: give the AudioEffectFPB ones their patch */
    function objectsCreated(paths) {
        if (!RED.FaustBridge.settings.AutoSend) return;
        const tree = RED.control.core.getTree();
        if (tree == undefined) return;
        const model = tree.model;
        for (const path of paths) {
            const item = model.items.get(path);
            if (item == undefined || item.kind != "object" || item.typeName != TYPE) continue;
            let node = RED.nodes.node(item.identity.split("|").pop());
            if (node == undefined && model.items.has(item.parent)) node = RED.nodes.node(model.items.get(item.parent).identity.split("|").pop());
            if (node == undefined || !node.fpbData) continue;
            upload(node, [{ path: item.path, typeName: item.typeName }], true);
        }
    }

    // ------------------------------------------------------------------ actions

    function compile(node) {
        if (state != "connected") { RED.notify("the Faust bridge is not connected (start fpb/server/fpb-faust-server.js)", "warning", null, 3000); return; }
        const id = nextId++;
        pending.set(id, node.id);
        send({ type: "compile", id, name: patchName(node), code: node.dsp || "" });
        status.set(node.id, { text: "compiling " + patchName(node) + " ..." });
        refresh();
    }

    function fetchPatch(node) {
        if (!send({ type: "get", name: patchName(node) })) RED.notify("the Faust bridge is not connected", "warning", null, 2000);
    }

    // ------------------------------------------------------------------ live tab

    let refreshTimer = undefined;
    function refresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () { if (RED.control != undefined && RED.control.tab != undefined) RED.control.tab.render(); }, 30);
    }

    /** the FPB part of the live tab for an AudioEffectFPB node (el: the tab's element helper) */
    function renderLive(node, el) {
        const box = el("div", { class: "live-fpb" });
        const connected = state == "connected";
        const bridge = el("div", { class: "live-bar" },
            el("span", {}, el("span", { class: "live-dot" + (connected ? " on" : "") }),
                "Faust bridge: " + (connected ? ("connected" + (server && server.faust ? " (faust " + server.faust + ")" : " (no faust!)")) : state)));
        if (!connected) bridge.append(el("button", { title: serverUrl(), onclick: function () { RED.FaustBridge.settings.Enabled = true; } }, "Connect"));
        box.append(bridge);

        const i = info(node);
        if (i == undefined) box.append(el("div", { class: "live-note" }, "No patch yet: export \"" + patchName(node) + "\" from the Faust IDE (server http://127.0.0.1:8088/faust, teensy / fpb), or compile the code of this object."));
        else {
            box.append(el("div", { class: "live-note" }, "patch ", el("b", {}, i.name), " from " + i.origin + ", " + new Date(i.time).toLocaleString()));
            box.append(el("div", { class: "live-note" }, i.inputs + " in / " + i.outputs + " out, " + i.params.length + " params, " +
                i.stats.smp + " ops/sample, " + i.stats.blk + " ops/block, " + i.stats.bytes + " bytes" +
                (i.stats.arrays.length ? ", arrays " + i.stats.arrays.map(function (a) { return (a.len * 4 / 1024).toFixed(0) + " KB"; }).join(" + ") : "")));
            for (const w of i.warnings || []) box.append(el("div", { class: "live-note" }, "warning: " + w));
        }
        const s = status.get(node.id);
        if (s != undefined) box.append(el(s.error ? "pre" : "div", { class: "live-note", style: s.error ? "color:#b00;white-space:pre-wrap;font-size:11px" : "" }, s.text));

        box.append(el("div", { class: "live-bar" },
            el("button", { title: "compile the Faust code of this object (double click it to edit the code)", onclick: function () { compile(node); } }, "Compile code"),
            el("button", { title: "send the patch to the Teensy again", onclick: function () { upload(node); } }, "Send to Teensy"),
            el("button", { title: "get the last patch named " + patchName(node) + " from the bridge", onclick: function () { fetchPatch(node); } }, "Get " + patchName(node))));
        return box;
    }

    function init() {
        RED.control.methods.registerProvider(TYPE, methods);
        RED.events.on("OSC:liveObjectsCreated", objectsCreated);
        probeSameOrigin().then(function (url) {
            sameOrigin = url;
            if (wanted()) connect();
        });
    }

    return { init, settingsChanged, connect, disconnect, upload, compile, methods, info, renderLive, send, sendBinary,
             get state() { return state; }, get server() { return server; } };
})();
