// Integration test of the ASDT++ side of the Faust bridge, in Node:
//   the real red/control (methods, core, OSC adapter) + red/fpb/fpb-bridge.js
//   against the real fpb-faust-server.js (with fake-faust.js),
//   with stubs only for the editor (RED.nodes ...) and the serial port (OSC.Send*).
// What would go to the Teensy is collected; the reassembled container is then loaded by the firmware loader
// built for the PC (fpb/tests/build/host_run, made by run-tests.js) when it's there.
//
//   node fpb/tests/bridge-test.js
"use strict";
const path = require("path");
const fs = require("fs");
const { spawn, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const PORT = 18089;
let failures = 0;
function check(cond, msg) { console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) failures++; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function until(fn, ms, what) {
    for (let t = 0; t < (ms || 5000); t += 20) { if (fn()) return; await wait(20); }
    throw new Error("timeout: " + what);
}

// ------------------------------------------------------------------ stubs

const listeners = {};
const notes = [];
const sent = [];          // {address, types, values} of everything sent to the Teensy, in order
global.document = undefined;
global.RED = {
    events: {
        on(e, f) { (listeners[e] = listeners[e] || []).push(f); },
        off(e, f) { const l = listeners[e] || []; const i = l.indexOf(f); if (i >= 0) l.splice(i, 1); },
        emit(e, ...a) { for (const f of (listeners[e] || []).slice()) f(...a); },
    },
    notify(text, type) { notes.push({ text, type }); },
    storage: { update() {} },
    view: { redraw() {} },
    OSC: { settings: { RootAddress: "/teensy*", LiveUpdate: true } },
    exporter: { oscMessages: { getBundle(messages) { return { packets: messages }; } } },
};
const node = { id: "n1", type: "AudioEffectFPB", name: "lp", patch: "", inputs: 1, outputs: 1, z: "ws1",
               dsp: fs.readFileSync(path.join(__dirname, "faust", "lp.dsp"), "utf8") };
let dirty = false;
RED.nodes = {
    eachNode(cb) { cb(node); },
    node(id) { return id === node.id ? node : undefined; },
    dirty(d) { dirty = d; },
    getWorkspace(id) { return { id, label: "Main" }; },
};
const model = { items: new Map([["/fx", { kind: "object", path: "/fx", parent: "", name: "fx", identity: "ws1|n1", typeName: "AudioEffectFPB" }]]),
                connections: new Map() };
global.OSC = {
    connected: true,
    IsConnected() { return this.connected; },
    LiveUpdate: { getRootId() { return "ws1"; }, getTeensyModel() { return model; } },
    SendMessage(address, types, ...values) { sent.push({ address, types, values }); },
    SendBundle(b) { for (const p of b.packets) sent.push({ address: p.address, types: p.types, values: p.values }); },
    SendData(packet) { sent.push({ address: packet.address, types: packet.args.map(a => a.type).join(""), values: packet.args.map(a => a.value) }); },
};
global.osc = { writePacket(p) { return p; } };     // osc.js: the bridge sends the packet object through SendData
global.atob = s => Buffer.from(s, "base64").toString("binary");

["control/control-methods", "control/control", "control/control-osc", "fpb/fpb-bridge", "fpb/fpb-core", "fpb/fpb-format", "fpb/fpb-vm"]
    .forEach(f => require(path.join(ROOT, "red", f + ".js")));
RED.control.tab = { render() {} };
RED.control.oscAdapter.init();
const table = RED.fpb.core.parseOpList(fs.readFileSync(path.join(ROOT, "fpb", "teensy", "FPB", "src", "FPB_oplist.h"), "utf8"));

// the Teensy's reply to a message: [address, object, result, code]
function teensyReply(address, result, code) {
    RED.emitReply = true;
    RED.events.emit("OSCBundle:Received", { packets: [{ address: "/reply", args: [{ type: "s", value: address }, { type: "s", value: "fx" },
        { type: "i", value: result }, { type: "i", value: code || 0 }] }] });
}

// ------------------------------------------------------------------ run

const server = spawn(process.execPath, [path.join(ROOT, "fpb", "server", "fpb-faust-server.js"), "--port", String(PORT),
    "--faust", path.join(__dirname, "fake-faust.js"), "--no-keep", "--no-io"], { stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", d => serverLog += d);
server.stderr.on("data", d => serverLog += d);

(async function main() {
    try {
        await wait(400);
        RED.FaustBridge.settings.ServerUrl = "ws://127.0.0.1:" + PORT + "/asdt";
        RED.FaustBridge.settings.Enabled = true;                                 // what the Connect button does
        RED.FaustBridge.settings.ChunkSize = 64;                                 // several /feed messages
        RED.fpb.bridge.init();
        await until(() => RED.fpb.bridge.server != undefined, 5000, "hello");
        check(RED.fpb.bridge.state === "connected" && RED.fpb.bridge.server.faust === "0.0.0-fake", "connected to the bridge (faust " + RED.fpb.bridge.server.faust + ")");

        console.log("\n== compile the code of the node, the patch is stored in the node");
        check(RED.control.methods.get("AudioEffectFPB", node).length === 0, "no live methods before a patch");
        RED.fpb.bridge.compile(node);
        await until(() => !!node.fpbData, 5000, "patch");
        const info = RED.fpb.bridge.info(node);
        check(info.name === "lp" && node.inputs === 1 && node.outputs === 1 && dirty, `node got patch ${info.name}, ${node.inputs} in / ${node.outputs} out, project marked changed`);
        const all = RED.control.methods.get("AudioEffectFPB", node);
        const methods = all.filter(m => m.call === "setParam");
        check(methods.length === 2 && methods[0].args[0].scale === "log" && methods[0].args[0].unit === "Hz",
            "live methods: " + methods.map(m => `${m.label}[${m.args[0].min}..${m.args[0].max} ${m.args[0].scale}]`).join(", "));
        check(all.filter(m => m.kind === "read").map(m => m.call).join(",") === "cpu,cpuMax,isOverloaded", "and the diagnostics: cpu, cpuMax, isOverloaded");

        console.log("\n== Faust widgets -> live methods");
        {
            const w = { id: "w1", type: "AudioEffectFPB", name: "w", fpbInfo: JSON.stringify({ name: "w", inputs: 0, outputs: 1, params: [
                { index: 0, label: "gate", path: "gate", widget: "Button", min: 0, max: 1, def: 0, meta: {} },
                { index: 1, label: "mute", path: "mute", widget: "CheckButton", min: 0, max: 1, def: 0, meta: {} },
                { index: 2, label: "wave", path: "wave", widget: "HorizontalSlider", min: 0, max: 2, def: 1, meta: { style: "menu{'Saw':0;'Square':1;'Tri':2}" } },
                { index: 3, label: "gain", path: "osc1/gain", widget: "VerticalSlider", min: 0, max: 1, def: 0.5, meta: { tooltip: "the   level" } },
                { index: 4, label: "gain", path: "osc2/gain", widget: "VerticalSlider", min: 0, max: 1, def: 0.5, meta: {} },
            ] }) };
            const ms = RED.fpb.bridge.methods(w);
            const by = id => ms.find(m => m.id === id);
            check(by("p0").kind === "action" && by("p0").release === "p0_up" && by("p0_up").hidden === true, "button: an action, released by a hidden method");
            check(by("p1").args[0].type === "enum" && by("p1").args[0].options.length === 2, "checkbox: a list off / on");
            check(by("p2").args[0].type === "enum" && by("p2").args[0].options.map(o => o.label + "=" + o.value).join(",") === "Saw=0,Square=1,Tri=2", "[style:menu{...}]: a list Saw / Square / Tri");
            check(by("p3").label === "osc1/gain" && by("p4").label === "osc2/gain" && by("p3").help === "the level", "the same label twice: the group path; tooltip -> help");
            const t = [{ path: "/w", typeName: "AudioEffectFPB" }];
            const saved = sent.slice();      // the upload of lp, checked below
            sent.length = 0;
            RED.control.core.invoke(w, t, by("p0"), undefined, []);
            RED.control.core.invoke(w, t, by("p2"), undefined, [2]);
            await until(() => sent.length >= 2, 1000, "widget sends");
            const txt = sent.map(s => `${s.address.split("/").pop()} ${s.types} ${s.values.join(" ")}`).join(" | ");
            check(txt === "setParam if 0 1 | setParam if 2 2", "button press and menu entry are sent as setParam(index, float): " + txt);
            RED.control.core.invoke(w, t, by("p0_up"), undefined, []);
            await until(() => sent.length >= 3, 1000, "release");
            check(sent[2].types === "if" && sent[2].values.join(" ") === "0 0", "button release: setParam 0 0");
            sent.length = 0;
            sent.push(...saved);
        }

        console.log("\n== it is sent to the Teensy object (AutoSend): /begin, /feed..., /end");
        const fx = "/teensy*/audio/fx";
        check(sent[0] && sent[0].address === fx + "/begin", "first " + (sent[0] && sent[0].address));
        const feeds = sent.filter(s => s.address === fx + "/feed");
        const blob = Buffer.concat(feeds.map(f => Buffer.from(f.values[0])));
        const bytes = Buffer.from(node.fpbData, "base64");
        check(feeds.length >= 1 && blob.equals(bytes) && feeds.every(f => f.types === "b"), `${feeds.length} /feed blob(s) = the container (${blob.length} bytes)`);
        check(sent[sent.length - 1].address === fx + "/end", "last " + sent[sent.length - 1].address);
        check(RED.fpb.vm.load(Uint8Array.from(blob), table).error === 0, "the reassembled container loads in the VM");
        const hostRun = path.join(__dirname, "build", "host_run" + (process.platform === "win32" ? ".exe" : ""));
        if (fs.existsSync(hostRun)) {
            const f = path.join(__dirname, "build", "bridge-sent.fpb");
            fs.writeFileSync(f, blob);
            const r = spawnSync(hostRun, [f, "1", "-", path.join(__dirname, "build", "bridge-sent.out"), "-", "4096"], { encoding: "utf8" });
            check(r.status === 0, "the firmware loader (host build) loads what was sent: " + (r.stdout || r.stderr).trim());
        }

        console.log("\n== live control of a parameter, and the values are sent again after the patch is loaded");
        sent.length = 0;
        const target = RED.control.core.getTargets(node).targets;
        check(target.length === 1 && target[0].path === "/fx", "target " + (target[0] && target[0].path));
        RED.control.core.invoke(node, target, methods[0], undefined, [500]);
        await until(() => sent.length > 0, 1000, "setParam");
        check(sent[0].address === fx + "/setParam" && sent[0].types === "if" && sent[0].values[0] === 0 && sent[0].values[1] === 500,
            `cutoff -> ${sent[0].address} ${sent[0].types} ${sent[0].values.join(" ")}`);
        sent.length = 0;
        teensyReply(fx + "/end", 0);
        await until(() => sent.length > 0, 1000, "resend");
        check(sent.some(s => s.address === fx + "/setParam" && s.values[1] === 500), "after /end OK the stored cutoff is sent again");

        console.log("\n== errors");
        RED.fpb.bridge.upload(node);
        teensyReply(fx + "/end", -19);
        await wait(50);
        check(notes.some(n => n.type === "error" && /E_CRC/.test(n.text)), "the Teensy refused the patch: " + (notes.find(n => /E_CRC/.test(n.text)) || {}).text);
        RED.fpb.bridge.upload(node);
        teensyReply(fx + "/end", 0, 8);
        await wait(50);
        node.dsp = "ERROR";
        const before = notes.length;
        RED.fpb.bridge.compile(node);
        await until(() => notes.slice(before).some(n => n.type === "error"), 5000, "faust error");
        check(/syntax error/.test(notes.slice(before).find(n => n.type === "error").text), "a faust error is shown: " + notes.slice(before).find(n => n.type === "error").text);

        console.log("\n== the object is created on the Teensy (live update / Sync): it gets the patch");
        sent.length = 0;
        RED.events.emit("OSC:liveObjectsCreated", ["/fx"]);
        await wait(50);
        check(sent.length > 2 && sent[0].address === fx + "/begin" && sent.some(s => s.address === fx + "/end"), "patch sent to the new object (" + sent.length + " messages)");

        console.log("\n== Faust IDE export -> the bridge pushes it to the node with the same patch name");
        node.fpbData = "";
        const form = new FormData();
        form.append("file", new Blob([makeStoreZip("lp.dsp", fs.readFileSync(path.join(__dirname, "faust", "lp.dsp")))]), "lp.zip");
        const sha = await (await fetch(`http://127.0.0.1:${PORT}/filepost`, { method: "POST", body: form })).text();
        const pc = await (await fetch(`http://127.0.0.1:${PORT}/${sha}/teensy/fpb/precompile`)).text();
        await until(() => !!node.fpbData, 5000, "pushed patch");
        check(pc === "DONE" && RED.fpb.bridge.info(node).origin === "faustide", "export from the Faust IDE reached the node (origin " + RED.fpb.bridge.info(node).origin + ")");
    } catch (e) {
        failures++;
        console.log("  FAIL " + e.stack);
    }
    RED.fpb.bridge.disconnect();
    server.kill();
    if (failures) console.log("\nserver log:\n" + serverLog);
    console.log(failures ? `\n${failures} FAILED` : "\nall passed");
    process.exit(failures ? 1 : 0);
})();

function makeStoreZip(name, data) {
    const n = Buffer.from(name), crc = RED.fpb.core.crc32(data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28);
    const e = Buffer.alloc(22);
    e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(1, 8); e.writeUInt16LE(1, 10); e.writeUInt32LE(46 + n.length, 12); e.writeUInt32LE(30 + n.length + data.length, 16);
    return Buffer.concat([h, n, data, c, n, e]);
}
