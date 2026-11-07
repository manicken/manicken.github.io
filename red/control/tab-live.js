/**
 * Live control, the sidebar tab "live": the methods of the selected audio object, made from RED.control.methods,
 * sent with RED.control.core (so the protocol is chosen here, not in the controls).
 */
RED.control = RED.control || {};
RED.control.tab = (function () {
    'use strict';

    const SLIDER_STEPS = 1000;
    const REFRESH_DELAY_MS = 300;

    let content = undefined;
    let currentNode = undefined;
    let targetChoice = "*"; // "*" all targets, else the path of one
    let refreshTimer = undefined;

    const CSS = `
#tab-live { font-size: 12px; }
#tab-live .live-head { margin: 4px 0 6px 0; }
#tab-live .live-head b { font-size: 13px; }
#tab-live .live-type { color: #888; margin-left: 6px; }
#tab-live .live-bar { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 4px; }
#tab-live .live-bar select { width: auto; max-width: 100%; margin: 0; height: 24px; padding: 0 4px; font-size: 12px; }
#tab-live .live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #c33; margin-right: 3px; }
#tab-live .live-dot.on { background: #3a3; }
#tab-live .live-note { color: #888; margin: 2px 0 6px 0; }
#tab-live .live-method { border-top: 1px solid #ddd; padding: 4px 0; }
#tab-live .live-method > .live-label { font-weight: bold; margin-bottom: 2px; }
#tab-live .live-row { display: flex; align-items: center; gap: 4px; margin: 2px 0; }
#tab-live .live-row .live-name { flex: 0 0 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #555; }
#tab-live .live-row input[type=range] { flex: 1 1 auto; min-width: 60px; margin: 0; }
#tab-live .live-row input[type=number] { flex: 0 0 70px; width: 70px; margin: 0; height: 22px; padding: 0 3px; font-size: 12px; }
#tab-live .live-row select { flex: 1 1 auto; margin: 0; height: 24px; padding: 0 4px; font-size: 12px; }
#tab-live .live-unit { flex: 0 0 22px; color: #888; }
#tab-live .live-result { margin-left: 6px; font-family: monospace; }
#tab-live .live-result.err { color: #c33; }
#tab-live button { font-size: 12px; padding: 1px 8px; margin: 0; }
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
            const node = (nodes.length == 1) ? nodes[0] : undefined;
            if (node === currentNode) return; // i.e. after a move
            targetChoice = "*";
            currentNode = node;
            render();
        });
        const refreshLater = function () {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(render, REFRESH_DELAY_MS);
        };
        for (const e of ["OSC:connected", "nodes:inputsUpdated", "links:add", "links:remove", "nodes:renamed", "nodes:remove", "flows:change"])
            RED.events.on(e, refreshLater);
        render();
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
        if (arg.type == "int") return String(Math.round(value));
        const abs = Math.abs(value);
        return String(Number(value.toFixed(abs >= 100 ? 1 : abs >= 10 ? 2 : 3)));
    }

    function render() {
        if (content == undefined) return;
        content.innerHTML = "";
        const node = currentNode;
        if (node == undefined || RED.nodes.node(node.id) == undefined) {
            content.append(el("div", { class: "live-note" }, "Select one audio object to control it live on the Teensy."));
            content.append(el("div", { class: "live-note" }, "Pilot types: " + Object.keys(RED.control.methods.types).join(", ")));
            return;
        }
        const methods = RED.control.methods.get(node.type);
        content.append(el("div", { class: "live-head" }, el("b", {}, node.name || node.id), el("span", { class: "live-type" }, node.type)));
        if (methods == undefined) {
            content.append(el("div", { class: "live-note" }, "No live control for " + node.type + " yet."));
            return;
        }
        const found = RED.control.core.getTargets(node);
        const allTargets = found.targets;
        renderBar(node, found);
        if (allTargets.length == 0) {
            content.append(el("div", { class: "live-note" }, "The object is not in the design of the tab " +
                ((found.tree != undefined) ? ('"' + found.tree.ws.label + '"') : "") + " (turn on OSC live update, or select the root tab)."));
            return;
        }
        const targets = (targetChoice == "*") ? allTargets : allTargets.filter(function (t) { return t.path == targetChoice; });
        if (targets.length == 0) { targetChoice = "*"; render(); return; }

        for (const method of methods) content.append(renderMethod(node, targets, method));
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
            const select = el("select", { title: "which object(s) on the Teensy", onchange: function () { targetChoice = this.value; render(); } });
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
            const resend = el("button", { title: "sends every value set here again (i.e. after the Teensy is restarted or synced)", onclick: function () {
                const t = (targetChoice == "*") ? found.targets : found.targets.filter(function (x) { return x.path == targetChoice; });
                const n = core.resend(node, t);
                RED.notify("live: " + n + " value(s) sent again", "info", null, 1500);
            } }, "Send all again");
            content.append(el("div", { class: "live-bar" }, resend, el("span", { class: "live-note" },
                (found.tree.source == "live") ? "tree: OSC live update" : "tree: current tab")));
        }
    }

    function renderMethod(node, targets, method) {
        const label = method.label || method.id;
        const box = el("div", { class: "live-method" });

        if (method.kind == "action") {
            box.append(el("div", { class: "live-row" }, el("button", { onclick: function () {
                RED.control.core.invoke(node, targets, method, undefined, []);
            } }, label)));
            return box;
        }
        if (method.kind == "read") {
            const result = el("span", { class: "live-result" });
            box.append(el("div", { class: "live-row" }, el("button", { onclick: function () {
                result.textContent = "…";
                result.className = "live-result";
                RED.control.core.read(targets, method).then(function (results) {
                    const err = results.some(function (r) { return r.error != undefined; });
                    result.className = "live-result" + (err ? " err" : "");
                    result.textContent = results.map(function (r) {
                        const v = (r.error != undefined) ? r.error : (typeof r.value == "number" ? formatValue({ type: method.returns }, r.value) : String(r.value));
                        return (results.length > 1) ? (r.target.path.split("/").slice(-2).join("/") + ": " + v) : v;
                    }).join("  ");
                });
            } }, label), result));
            return box;
        }

        box.append(el("div", { class: "live-label" }, label));
        if (method.perChannel) {
            const count = RED.control.core.getChannelCount(node, targets[0]);
            const labels = (targets.length == 1) ? targets[0].inputLabels : {};
            for (let ch = 0; ch < count; ch++) {
                box.append(renderArgs(node, targets, method, ch, "in " + ch + (labels[ch] ? (" ← " + labels[ch]) : "")));
            }
            if (count == 0) box.append(el("div", { class: "live-note" }, "no inputs"));
            return box;
        }
        box.append(renderArgs(node, targets, method, undefined));
        return box;
    }

    /** the controls of all the arguments of one call (one channel), a change sends all of them */
    function renderArgs(node, targets, method, channel, rowLabel) {
        const methods = RED.control.methods;
        const core = RED.control.core;
        const values = core.getValues(node, method, channel);
        const wrap = el("div", {});
        const send = function (argIndex) {
            core.invoke(node, targets, method, channel, values, method.args[argIndex].send != false);
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
