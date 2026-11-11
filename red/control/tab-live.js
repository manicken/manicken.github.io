/**
 * Live control, the sidebar tab "live": the methods of the selected audio object, made from RED.control.methods,
 * sent with RED.control.core (so the protocol is chosen here, not in the controls).
 * "+" creates bound GUI objects (RED.control.gui) for a method, "Create GUI" for all of them.
 * Selecting a bound GUI object shows the audio object it controls.
 */
RED.control = RED.control || {};
RED.control.tab = (function () {
    'use strict';

    const SLIDER_STEPS = 1000;
    const REFRESH_DELAY_MS = 300;

    let content = undefined;
    let currentNode = undefined;
    let selectedGui = undefined; // the bound GUI object that is selected (currentNode is what it controls)
    let targetChoice = "*"; // "*" all targets, else the path of one
    let refreshTimer = undefined;

    const CSS = `
#tab-live { font-size: 12px; }
#tab-live .live-head { margin: 4px 0 6px 0; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
#tab-live .live-head b { font-size: 13px; }
#tab-live .live-type { color: #888; }
#tab-live .live-bar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 4px; }
#tab-live .live-bar select { width: auto; max-width: 100%; margin: 0; height: 24px; padding: 0 4px; font-size: 12px; }
#tab-live .live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #c33; margin-right: 3px; }
#tab-live .live-dot.on { background: #3a3; }
#tab-live .live-note { color: #888; margin: 2px 0 6px 0; }
#tab-live .live-bound { background: #eef5ff; border: 1px solid #cddcf0; border-radius: 3px; padding: 3px 6px; margin-bottom: 6px; }
#tab-live .live-method { border-top: 1px solid #ddd; padding: 4px 0; }
#tab-live .live-label { font-weight: bold; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }
#tab-live .live-row { display: flex; align-items: center; gap: 4px; margin: 2px 0; }
#tab-live .live-row .live-name { flex: 0 0 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #555; }
#tab-live .live-row input[type=range] { flex: 1 1 auto; min-width: 60px; margin: 0; }
#tab-live .live-row input[type=number] { flex: 0 0 70px; width: 70px; margin: 0; height: 22px; padding: 0 3px; font-size: 12px; }
#tab-live .live-row input[type=text] { flex: 1 1 auto; margin: 0; height: 22px; padding: 0 3px; font-size: 12px; }
#tab-live .live-row select { flex: 1 1 auto; margin: 0; height: 24px; padding: 0 4px; font-size: 12px; }
#tab-live .live-unit { flex: 0 0 22px; color: #888; }
#tab-live .live-result { margin-left: 6px; font-family: monospace; }
#tab-live .live-result.err { color: #c33; }
#tab-live button { font-size: 12px; padding: 1px 8px; margin: 0; }
#tab-live button.live-add { padding: 0 5px; font-weight: normal; line-height: 16px; }
`;

    function createTab() {
        content = document.createElement("div");
        content.id = "tab-live";
        content.style.padding = "4px";
        RED.sidebar.addTab("live", content);
        const style = document.createElement("style");
        style.textContent = CSS;
        document.head.appendChild(style);

        RED.events.on("view:selectionChanged", function (nodes) {
            let node = (nodes.length == 1) ? nodes[0] : undefined;
            let gui = undefined;
            if (node != undefined && RED.control.gui.isBound(node)) { // show what it controls
                const r = RED.control.gui.resolve(node, true);
                gui = node;
                node = (r != undefined) ? r.node : undefined;
            }
            showTabIfLive(node);
            if (node === currentNode && gui === selectedGui) return; // i.e. after a move
            const sameNode = node === currentNode;
            currentNode = node;
            selectedGui = gui;
            if (sameNode == false) {
                const bind = (gui != undefined) ? RED.control.gui.getBind(gui) : undefined;
                targetChoice = (bind != undefined && bind.path) ? bind.path : "*";
            }
            render();
        });
        for (const e of ["OSC:connected", "nodes:inputsUpdated", "links:add", "links:remove", "nodes:renamed", "nodes:remove", "flows:change"])
            RED.events.on(e, refreshLater);
        RED.events.on("control:valuesChanged", function (e) { // changed by a GUI object
            if (e.source != undefined && e.node === currentNode) refreshLater();
        });
        render();
    }

    /** shows this tab instead of the info tab (that is shown on select) when the OSC live update is on, an OSC setting */
    function showTabIfLive(node) {
        if (node == undefined || RED.OSC.settings.LiveUpdate != true || RED.OSC.settings.LiveShowControlTab != true) return;
        RED.sidebar.show("live"); // for every object, the tab tells when a type have no live control yet
    }

    function refreshLater() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(render, REFRESH_DELAY_MS);
    }

    function el(tag, attrs, ...children) {
        const e = document.createElement(tag);
        for (const k in attrs || {}) {
            if (k == "class") e.className = attrs[k];
            else if (k.startsWith("on")) e.addEventListener(k.substring(2), attrs[k]);
            else e.setAttribute(k, attrs[k]);
        }
        for (const c of children) if (c != undefined) e.append(c);
        return e;
    }

    function formatValue(arg, value) {
        if (typeof value != "number") return String(value);
        if (arg.type == "int") return String(Math.round(value));
        const abs = Math.abs(value);
        return String(Number(value.toFixed(abs >= 100 ? 1 : abs >= 10 ? 2 : 3)));
    }

    /** @returns {String|undefined} the path when one object is chosen (its own values are shown) */
    function onePath(targets) { return (targets.length == 1) ? targets[0].path : undefined; }

    function getSelectedTargets(all) {
        return (targetChoice == "*") ? all : all.filter(function (t) { return t.path == targetChoice; });
    }

    function render() {
        if (content == undefined) return;
        content.innerHTML = "";
        const node = currentNode;
        if (selectedGui != undefined && (node == undefined || RED.nodes.node(node.id) == undefined)) {
            content.append(el("div", { class: "live-note" }, (selectedGui.name || selectedGui.id) + " is bound to an object that is removed."));
            return;
        }
        if (node == undefined || RED.nodes.node(node.id) == undefined) {
            content.append(el("div", { class: "live-note" }, "Select one audio object to control it live on the Teensy."));
            content.append(el("div", { class: "live-note" }, "Types: " + Object.keys(RED.control.methods.types).sort().join(", ")));
            return;
        }
        if (selectedGui != undefined) {
            const gui = RED.control.gui, d = selectedGui;
            const bind = gui.getBind(d);
            const box = el("div", { class: "live-bound" }, "GUI object ", el("b", {}, d.name || d.id),
                " controls " + bind.methodId + ((bind.ch != null) ? (" (" + bind.ch + ")") : "") + " of:");
            // which instance it controls: the instances of the same array (or all, for one bound to all)
            const paths = gui.siblingPaths(d);
            if (paths.length > 1 || bind.path == "") {
                const select = el("select", { title: "the object (array instance) this GUI object controls", onchange: function () {
                    gui.setPath(d, this.value);
                    targetChoice = this.value || "*";
                    render();
                } });
                if (bind.path == "") select.append(el("option", { value: "" }, "all " + paths.length));
                for (const p of paths) select.append(el("option", { value: p }, p));
                select.value = bind.path;
                box.append(el("div", { class: "live-bar" }, select));
            }
            content.append(box);
        }
        const methods = RED.control.methods.get(node.type, node);
        const head = el("div", { class: "live-head" }, el("b", {}, node.name || node.id), el("span", { class: "live-type" }, node.type));
        content.append(head);
        if (node.type == "AudioEffectFPB" && RED.fpb != undefined && RED.fpb.bridge != undefined) content.append(RED.fpb.bridge.renderLive(node, el));
        if (methods == undefined) {
            content.append(el("div", { class: "live-note" }, "No live control for " + node.type + " yet."));
            return;
        }
        const found = RED.control.core.getTargets(node);
        renderBar(node, found);
        if (found.targets.length == 0) {
            content.append(el("div", { class: "live-note" }, "The object is not in the design of the tab " +
                ((found.tree != undefined) ? ('"' + found.tree.ws.label + '"') : "") + " (turn on OSC live update, or select the root tab)."));
            return;
        }
        const targets = getSelectedTargets(found.targets);
        if (targets.length == 0) { targetChoice = "*"; render(); return; }

        head.append(el("button", { class: "live-add", title: "creates vertical sliders, list boxes and buttons for all the settings, bound to this object, in the current tab",
            onclick: function () { createGui(node, methods.filter(function (m) { return !m.hidden; })); } }, "+ Create GUI"));
        for (const method of methods) if (!method.hidden) content.append(renderMethod(node, targets, method));
    }

    function createGui(node, methods) {
        const n = RED.control.gui.create(node, methods, (targetChoice == "*") ? "" : targetChoice);
        if (n != 0) RED.notify("live: " + n + " GUI object(s) created", "info", null, 1500);
    }

    function renderBar(node, found) {
        const core = RED.control.core;
        const adapter = core.getAdapter();
        const bar = el("div", { class: "live-bar" });

        const protocol = el("select", { title: "protocol", onchange: function () { core.setAdapter(this.value); render(); } });
        for (const a of core.getAdapters()) {
            const o = el("option", { value: a.id }, a.label);
            if (adapter != undefined && a.id == adapter.id) o.selected = true;
            protocol.append(o);
        }
        const connected = adapter != undefined && adapter.isConnected();
        bar.append(protocol, el("span", {}, el("span", { class: "live-dot" + (connected ? " on" : "") }), connected ? "connected" : "not connected"));
        content.append(bar);

        if (found.targets.length > 1) {
            const select = el("select", { title: "which object(s) on the Teensy (the GUI objects created get this too)", onchange: function () { targetChoice = this.value; render(); } });
            select.append(el("option", { value: "*" }, "all " + found.targets.length + " (instances / elements)"));
            for (const t of found.targets) {
                const o = el("option", { value: t.path }, t.path);
                if (t.path == targetChoice) o.selected = true;
                select.append(o);
            }
            content.append(el("div", { class: "live-bar" }, select));
        }
        else if (found.targets.length == 1) content.append(el("div", { class: "live-note" }, found.targets[0].path));

        if (found.tree != undefined) {
            const resend = el("button", { title: "sends every value set here again (i.e. after the Teensy is restarted)", onclick: function () {
                const n = core.resend(node, getSelectedTargets(found.targets));
                RED.notify("live: " + n + " value(s) sent again", "info", null, 1500);
            } }, "Send all again");
            content.append(el("div", { class: "live-bar" }, resend, el("span", { class: "live-note" },
                (found.tree.source == "live") ? "tree: OSC live update" : "tree: current tab")));
        }
    }

    function addButton(node, method) {
        return el("button", { class: "live-add", title: "create GUI object(s) for " + (method.label || method.id) + " in the current tab",
            onclick: function () { createGui(node, [method]); } }, "+");
    }

    function renderMethod(node, targets, method) {
        const label = method.label || method.id;
        const core = RED.control.core;
        const box = el("div", { class: "live-method" });

        if (method.kind == "action" || method.kind == "read") {
            const result = el("span", { class: "live-result" });
            const values = core.getValues(node, method, undefined, onePath(targets));
            const run = function () {
                if (method.kind == "action") {
                    core.invoke(node, targets, method, undefined, values);
                    return;
                }
                if (method.args != undefined) core.invoke(node, targets, method, undefined, values, false); // keep the arguments
                result.textContent = "…";
                result.className = "live-result";
                core.read(targets, method, values).then(function (results) {
                    const err = results.some(function (r) { return r.error != undefined; });
                    result.className = "live-result" + (err ? " err" : "");
                    result.textContent = results.map(function (r) {
                        const v = (r.error != undefined) ? r.error : formatValue({ type: method.returns }, r.value);
                        return (results.length > 1) ? (r.target.path.split("/").slice(-2).join("/") + ": " + v) : v;
                    }).join("  ");
                });
            };
            let button;
            if (method.kind == "action" && method.release != undefined) { // pressed / released (i.e. a Faust button: 1 then 0)
                const release = RED.control.methods.getMethod(node.type, method.release, node);
                let down = false;
                const up = function () { if (!down) return; down = false; if (release != undefined) core.invoke(node, targets, release, undefined, core.getValues(node, release, undefined, onePath(targets))); };
                button = el("button", { title: method.help || "", onpointerdown: function () { down = true; run(); }, onpointerup: up, onpointerleave: up }, label);
            }
            else button = el("button", { title: method.help || "", onclick: run }, label);
            const row = el("div", { class: "live-row" }, button, result);
            if (method.kind == "action") row.append(addButton(node, method));
            box.append(row);
            if (method.args != undefined) box.append(renderArgs(node, targets, method, undefined, undefined, values, false));
            return box;
        }

        const title = el("div", { class: "live-label", title: method.help || "" }, label, addButton(node, method));
        box.append(title);
        if (method.perChannel) {
            const count = core.getChannelCount(node, targets[0], method);
            const labels = (targets.length == 1 && method.channels == undefined) ? targets[0].inputLabels : {};
            const channelName = method.channelName || "in";
            for (let ch = 0; ch < count; ch++) {
                box.append(renderArgs(node, targets, method, ch, channelName + " " + ch + (labels[ch] ? (" ← " + labels[ch]) : "")));
            }
            if (count == 0) box.append(el("div", { class: "live-note" }, "no inputs"));
            return box;
        }
        box.append(renderArgs(node, targets, method, undefined));
        return box;
    }

    /**
     * the controls of all the arguments of one call (one channel), a change sends all of them
     * @param {Array} [values] the values to change (default: the stored ones)
     * @param {Boolean} [sendOnChange] false: a change is only stored (the arguments of an action / read)
     */
    function renderArgs(node, targets, method, channel, rowLabel, values, sendOnChange) {
        const methods = RED.control.methods;
        const core = RED.control.core;
        if (values == undefined) values = core.getValues(node, method, channel, onePath(targets));
        const wrap = el("div", {});
        const send = function (argIndex) {
            core.invoke(node, targets, method, channel, values, sendOnChange != false && method.args[argIndex].send != false);
        };
        method.args.forEach(function (arg, i) {
            const name = (method.args.length == 1 && rowLabel != undefined) ? rowLabel : ((rowLabel != undefined ? rowLabel + " " : "") + arg.name);
            const row = el("div", { class: "live-row" }, el("span", { class: "live-name", title: name }, name));

            if (arg.type == "enum") {
                const select = el("select", { onchange: function () { values[i] = Number(this.value); send(i); } });
                arg.options.forEach(function (option, index) {
                    const value = (typeof option == "object") ? option.value : index;
                    const o = el("option", { value }, (typeof option == "object") ? option.label : option);
                    if (value == values[i]) o.selected = true;
                    select.append(o);
                });
                row.append(select);
            }
            else if (arg.type == "bool") {
                const box = el("input", { type: "checkbox", onchange: function () { values[i] = this.checked; send(i); } });
                box.checked = values[i] == true;
                row.append(box);
            }
            else if (arg.type == "string") {
                const text = el("input", { type: "text" });
                text.value = values[i];
                text.addEventListener("change", function () { values[i] = text.value; send(i); });
                row.append(text);
            }
            else {
                const hasRange = arg.min != undefined && arg.max != undefined;
                const number = el("input", { type: "number", step: (arg.type == "int") ? "1" : "any" });
                number.value = formatValue(arg, values[i]);
                let slider = undefined;
                if (hasRange) {
                    slider = el("input", { type: "range", min: "0", max: String(SLIDER_STEPS), step: "1" });
                    slider.value = String(Math.round(methods.toSlider(arg, values[i]) * SLIDER_STEPS));
                    slider.addEventListener("input", function () {
                        let v = methods.fromSlider(arg, Number(slider.value) / SLIDER_STEPS);
                        if (arg.type == "int") v = Math.round(v);
                        values[i] = v;
                        number.value = formatValue(arg, v);
                        send(i);
                    });
                    row.append(slider);
                }
                number.addEventListener("change", function () {
                    const v = Number(number.value);
                    if (isNaN(v)) return;
                    values[i] = (arg.type == "int") ? Math.round(v) : v;
                    if (slider != undefined) slider.value = String(Math.round(methods.toSlider(arg, values[i]) * SLIDER_STEPS));
                    send(i);
                });
                row.append(number);
                if (arg.unit != undefined) row.append(el("span", { class: "live-unit" }, arg.unit));
            }
            wrap.append(row);
        });
        return wrap;
    }

    return { createTab, render };
})();
