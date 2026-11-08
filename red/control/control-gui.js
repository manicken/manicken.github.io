/**
 * Live control, the GUI objects (UI_Slider, UI_Button, UI_ListBox) that are bound to a method of an audio object.
 *
 * A bound GUI object have liveBind, a LiveBind (below): direct references to the audio node, the method, the argument and
 * the objects on the Teensy, made again only when the design changes (RED.control.core.getVersion / getTree), so moving a
 * slider don't search for anything. It's saved with ids (toJSON, used by RED.nodes convertNode):
 *   { "node": the id of the audio node, "method": the method id, "ch": the channel (perChannel) or null,
 *     "arg": the index of the argument it sets, "path": "" for all the objects of the node (instances, elements) or one path }
 * and made from that again when it's loaded or pasted (importBind, called by RED.nodes importNewNodes).
 * Instead of running its sendCommand script it calls the method with RED.control.core, so it don't know the protocol,
 * and it follows the value when it's changed elsewhere (the live tab, another GUI object).
 *
 * create(node, methods, path) makes the GUI objects for methods of a node: vertical sliders for the numbers,
 * list boxes for the enums, buttons for the actions, placed side by side to the right of the node.
 */
RED.control = RED.control || {};
RED.control.gui = (function () {
    'use strict';

    const SLIDER_STEPS = 1000;
    const SIZE = {
        UI_Slider: { w: 30, h: 150 },
        UI_Button: { w: 90, h: 30 },
        UI_ListBox: { w: 150 }, // h from the items
    };
    const GAP_X = 20;
    const LISTBOX_ROWS = 6;
    const LISTBOX_ROW_H = 22;
    const LISTBOX_HEADER_H = 26;

    const warned = new Set(); // the GUI objects that are told to be unbound once

    // ******************************************************************
    // the binding
    // ******************************************************************

    class LiveBind {
        /** @param {{node:String|REDNode, method:String, ch?:Number|null, arg?:Number, path?:String}} data */
        constructor(data) {
            this.nodeId = (typeof data.node == "object") ? data.node.id : data.node;
            this.methodId = data.method;
            this.ch = (data.ch == undefined) ? null : data.ch;
            this.arg = data.arg || 0;
            this.path = data.path || "";
            this._node = (typeof data.node == "object") ? data.node : undefined; // a known reference (create / paste)
            this._resolved = undefined;
            this._version = -1;
            this._tree = undefined;
        }

        /** @returns {LiveBind|undefined} from what is saved (an object, or the JSON text of the first version) */
        static from(value) {
            if (value instanceof LiveBind) return value;
            if (value == undefined || value === "") return undefined;
            let data = value;
            if (typeof value == "string") {
                try { data = JSON.parse(value); }
                catch (err) { return undefined; }
            }
            if (data == null || typeof data != "object" || data.node == undefined || data.method == undefined) return undefined;
            return new LiveBind(data);
        }

        /** what is saved, the references as ids */
        toJSON() {
            return { node: this.nodeId, method: this.methodId, ch: this.ch, arg: this.arg, path: this.path };
        }

        /** the node is found again (once) after the design is changed (it can be removed, or the type changed) */
        getNode() {
            const core = RED.control.core;
            if (this._version != core.getVersion()) {
                this._version = core.getVersion();
                this._tree = undefined;
                this._resolved = undefined;
                if (this._node == undefined || RED.nodes.node(this._node.id) !== this._node) this._node = RED.nodes.node(this.nodeId) || undefined;
            }
            return this._node;
        }

        /** @returns {{bind, node, method, arg, channel, targets}|undefined} what it controls, cached */
        resolve() {
            const node = this.getNode();
            if (node == undefined) return undefined;
            const tree = RED.control.core.getTree(); // the same object until the tree is changed
            if (this._resolved != undefined && this._tree === tree) return this._resolved;
            const method = RED.control.methods.getMethod(node.type, this.methodId);
            if (method == undefined) return undefined;
            let targets = RED.control.core.getTargets(node).targets;
            const path = this.path;
            if (path != "") targets = targets.filter(function (t) { return t.path == path; });
            const arg = (method.args != undefined) ? method.args[this.arg] : undefined;
            const channel = (this.ch == null) ? undefined : this.ch;
            this._tree = tree;
            this._resolved = { bind: this, node, method, arg, channel, targets };
            return this._resolved;
        }
    }

    /** @param {REDNode} d a GUI object @returns {LiveBind|undefined} its binding (a saved one is made a LiveBind the first time) */
    function getBind(d) {
        if (d.liveBind == undefined || d.liveBind === "") return undefined;
        if (d.liveBind instanceof LiveBind) return d.liveBind;
        const bind = LiveBind.from(d.liveBind);
        d.liveBind = bind; // undefined if it can't be read
        return bind;
    }

    function isBound(d) { return getBind(d) != undefined; }

    /** @returns {{bind, node, method, arg, channel, targets}|undefined} what the GUI object controls (undefined if it's not there) */
    function resolve(d, quiet) {
        const bind = getBind(d);
        if (bind == undefined) return undefined;
        const r = bind.resolve();
        if (r == undefined && quiet != true && warned.has(d.id) == false) {
            warned.add(d.id);
            RED.notify("live: " + (d.name || d.id) + " is bound to an object that is removed", "warning", null, 3000);
        }
        return r;
    }

    /**
     * The binding of a loaded / pasted GUI object (from RED.nodes importNewNodes)
     * @param {*} saved what was saved
     * @param {Object} nodeMap the saved id -> the imported node (a pasted audio node gets a new id, its GUI objects follow it)
     * @returns {LiveBind|undefined}
     */
    function importBind(saved, nodeMap) {
        const bind = LiveBind.from(saved);
        if (bind == undefined) return undefined;
        const node = (nodeMap != undefined) ? nodeMap[bind.nodeId] : undefined;
        if (node != undefined) {
            bind.nodeId = node.id;
            bind._node = node;
        }
        return bind;
    }

    /** @returns {String} the read only text the script editor shows for a bound GUI object (not saved) */
    function describe(d) {
        const bind = getBind(d);
        const lines = ["// Live bind: this GUI object calls a method of an audio object directly, it don't use a script",
            "// (made by \"+ Create GUI\" in the live tab, a normal GUI object is made from the palette)", "//"];
        const r = (bind != undefined) ? resolve(d, true) : undefined;
        if (r == undefined) {
            lines.push("//   bound to:  " + ((bind != undefined) ? (bind.nodeId + " " + bind.methodId) : "?") + "  (not found, the object is removed?)");
            return lines.join("\n") + "\n";
        }
        const m = r.method;
        const argText = function (a) {
            let t = a.name + " (" + a.type;
            if (a.min != undefined) t += ", " + a.min + " … " + a.max;
            if (a.unit != undefined) t += " " + a.unit;
            if (a.scale != undefined && a.scale != "lin") t += ", " + a.scale;
            return t + ")";
        };
        const params = [...(m.perChannel ? ["channel"] : []), ...(m.args || []).map(function (a) { return a.name; })];
        lines.push("//   object:    " + (r.node.name || r.node.id) + "  (" + r.node.type + ")");
        lines.push("//   method:    " + (m.call || m.id) + "(" + params.join(", ") + ")" + ((m.label != undefined) ? ("  \"" + m.label + "\"") : ""));
        if (r.channel != undefined) lines.push("//   channel:   " + r.channel);
        if (d.type == "UI_Button") {
            lines.push("//   press:     " + (m.call || m.id) + ((m.release != undefined) ? ("    release: " + m.release) : ""));
            if (m.args != undefined) lines.push("//   arguments: " + m.args.map(argText).join(", ") + "  (set in the live tab / by its sliders)");
        }
        else if (r.arg != undefined) {
            const isSet = (m.kind || "set") == "set";
            lines.push("//   sets:      " + argText(r.arg) + (isSet ? "" : ("  (sent by the " + (m.label || m.id) + " button)")));
        }
        lines.push("//   targets:   " + ((r.targets.length == 0) ? "none on the Teensy now" : r.targets.map(function (t) { return t.path; }).join(", ")) +
            ((bind.path == "") ? "  (all instances / elements)" : ""));
        const adapter = RED.control.core.getAdapter();
        lines.push("//   protocol:  " + ((adapter != undefined) ? adapter.label : "none") + "  (selected in the live tab)");
        return lines.join("\n") + "\n";
    }

    // ******************************************************************
    // slider <-> value
    // ******************************************************************

    /** an int argument with a linear range uses the values themselves, the others 0..SLIDER_STEPS */
    function isDirectInt(arg) {
        return arg.type == "int" && arg.scale != "log" && arg.scale != "curve";
    }

    function sliderToValue(d, arg) {
        if (isDirectInt(arg)) return d.val;
        const t = (d.val - d.minVal) / (d.maxVal - d.minVal);
        const v = RED.control.methods.fromSlider(arg, t);
        return (arg.type == "int") ? Math.round(v) : v;
    }

    function valueToSlider(d, arg, value) {
        if (isDirectInt(arg)) return Math.round(value);
        return Math.round(d.minVal + RED.control.methods.toSlider(arg, value) * (d.maxVal - d.minVal));
    }

    function formatValue(arg, value) {
        if (typeof value != "number") return String(value);
        if (arg.type == "int") return String(Math.round(value));
        const abs = Math.abs(value);
        return String(Number(value.toFixed(abs >= 100 ? 0 : abs >= 10 ? 1 : 2)));
    }

    /** @returns {String} the bottom label of a bound slider (the value and the unit) */
    function sliderText(d) {
        const r = resolve(d, true);
        if (r == undefined || r.arg == undefined) return "unbound";
        const value = RED.control.core.getValues(r.node, r.method, r.channel)[r.bind.arg || 0];
        return formatValue(r.arg, value) + (r.arg.unit ? (" " + r.arg.unit) : "");
    }

    // ******************************************************************
    // sending (called from RED.ControlGUI instead of the sendCommand script)
    // ******************************************************************

    function setArg(r, value, source) {
        const values = RED.control.core.getValues(r.node, r.method, r.channel);
        values[r.bind.arg || 0] = value;
        // the arguments of an action (i.e. the frequency of karplus.noteOn) are only stored, its button sends them
        const isSet = r.method.kind == undefined || r.method.kind == "set";
        RED.control.core.invoke(r.node, r.targets, r.method, r.channel, values, isSet && r.arg.send != false, source);
    }

    function slider(d) {
        const r = resolve(d);
        if (r == undefined || r.arg == undefined) return;
        setArg(r, sliderToValue(d, r.arg), d);
    }

    function listBox(d) {
        const r = resolve(d);
        if (r == undefined || r.arg == undefined || d.selectedIndex == undefined || d.selectedIndex < 0) return;
        const option = r.arg.options[d.selectedIndex];
        if (option == undefined) return;
        setArg(r, (typeof option == "object") ? option.value : d.selectedIndex, d);
    }

    function button(d, pressed) {
        const r = resolve(d);
        if (r == undefined) return;
        const core = RED.control.core;
        if (pressed) {
            core.invoke(r.node, r.targets, r.method, r.channel, core.getValues(r.node, r.method, r.channel), true, d);
            return;
        }
        if (r.method.release == undefined) return;
        const release = RED.control.methods.getMethod(r.node.type, r.method.release);
        if (release != undefined) core.invoke(r.node, r.targets, release, r.channel, core.getValues(r.node, release, r.channel), true, d);
    }

    // ******************************************************************
    // following the value
    // ******************************************************************

    function valuesChanged(e) {
        RED.nodes.eachNode(function (n) {
            if (n === e.source || n.liveBind == undefined || n.liveBind == "") return;
            const bind = getBind(n);
            if (bind == undefined || bind.nodeId != e.node.id || bind.methodId != e.method.id) return;
            if (((bind.ch == null) ? undefined : bind.ch) !== e.channel) return;
            const arg = e.method.args[bind.arg || 0];
            const value = e.values[bind.arg || 0];
            if (n.type == "UI_Slider") n.val = valueToSlider(n, arg, value);
            else if (n.type == "UI_ListBox") n.selectedIndex = (arg.options || []).findIndex(function (o, i) { return ((typeof o == "object") ? o.value : i) == value; });
            else return;
            if (n.z == RED.view.activeWorkspace) {
                n.dirty = true;
                RED.view.redraw_node(n);
            }
        });
    }

    // ******************************************************************
    // creating
    // ******************************************************************

    function makeUiNode(type, x, y, props) {
        const def = RED.nodes.getType(type);
        let nn = { x, y, z: RED.view.activeWorkspace, type, bgColor: def.color, id: RED.nodes.getNewUID(), outputs: def.outputs || 0, w: 100, h: 30 };
        nn = new REDNode(nn, def);
        for (const d in def.defaults) {
            if (def.defaults.hasOwnProperty(d) == false || d == "id" || d == "x" || d == "y") continue;
            nn[d] = (def.defaults[d].value != undefined) ? def.defaults[d].value : "";
        }
        Object.assign(nn, props);
        nn.changed = true;
        RED.nodes.add(nn);
        RED.editor.validateNode(nn);
        return nn;
    }

    /**
     * @param {REDNode} node @param {Object} method @param {Number|undefined} channel @param {Number} argIndex @param {String} path
     * @returns {Object[]} the GUI objects to create for one argument [{type, props}]
     */
    function controlsForArg(node, method, channel, argIndex, path, label) {
        const arg = method.args[argIndex];
        const liveBind = new LiveBind({ node, method: method.id, ch: (channel == undefined) ? null : channel, arg: argIndex, path: path || "" });
        const value = RED.control.core.getValues(node, method, channel)[argIndex];
        const common = { name: label, tag: node.name, liveBind, sendCommand: "" };
        if (arg.type == "enum") {
            const rows = Math.min(LISTBOX_ROWS, arg.options.length);
            const items = arg.options.map(function (o) { return (typeof o == "object") ? o.label : o; });
            const selectedIndex = arg.options.findIndex(function (o, i) { return ((typeof o == "object") ? o.value : i) == value; });
            return [{ type: "UI_ListBox", props: { ...common, items: items.join("\n"), selectedIndex, scrollable: arg.options.length > rows, visibleItems: rows,
                headerHeight: LISTBOX_HEADER_H, w: SIZE.UI_ListBox.w, h: LISTBOX_HEADER_H + rows * LISTBOX_ROW_H + 4 } }];
        }
        if ((arg.type == "float" || arg.type == "int") && arg.min != undefined && arg.max != undefined) {
            const direct = isDirectInt(arg);
            const props = { ...common, orientation: "v", label: "", divVal: 1, minVal: direct ? arg.min : 0, maxVal: direct ? arg.max : SLIDER_STEPS,
                w: SIZE.UI_Slider.w, h: SIZE.UI_Slider.h };
            props.val = valueToSlider(props, arg, value);
            return [{ type: "UI_Slider", props }];
        }
        return []; // bool, string, numbers without a range: only in the live tab
    }

    /** @returns {Object[]} the GUI objects to create for a method */
    function controlsForMethod(node, method, path, target) {
        const label = method.label || method.id;
        if (method.kind == "read") return [];
        if (method.kind == "action") {
            const liveBind = new LiveBind({ node, method: method.id, ch: null, arg: 0, path: path || "" });
            const result = [{ type: "UI_Button", props: { name: label, tag: node.name, liveBind, sendCommand: "", sendMode: (method.release != undefined) ? 2 : 0,
                w: SIZE.UI_Button.w, h: SIZE.UI_Button.h } }];
            (method.args || []).forEach(function (arg, i) { result.push(...controlsForArg(node, method, undefined, i, path, arg.name)); });
            return result;
        }
        const result = [];
        const channels = method.perChannel ? [...Array(RED.control.core.getChannelCount(node, target, method)).keys()] : [undefined];
        for (const channel of channels) {
            method.args.forEach(function (arg, i) {
                let name = (method.args.length == 1) ? label : arg.name;
                if (channel != undefined) name += " " + channel;
                result.push(...controlsForArg(node, method, channel, i, path, name));
            });
        }
        return result;
    }

    /**
     * Creates bound GUI objects in the current tab (one undo step)
     * @param {REDNode} node the audio node
     * @param {Object[]} methods
     * @param {String} [path] one target, "" or undefined for all of them
     * @returns {Number} the GUI objects created
     */
    function create(node, methods, path) {
        const target = RED.control.core.getTargets(node).targets[0];
        const items = [];
        for (const method of methods) items.push(...controlsForMethod(node, method, path, target));
        if (items.length == 0) {
            RED.notify("live: nothing to create a GUI object for (only numbers with a range, enums and actions)", "info", null, 2500);
            return 0;
        }
        // to the right of the node when it's in this tab, else at the top left of the view
        let x, y;
        if (node.z == RED.view.activeWorkspace) {
            x = node.x + (node.w || 100) + 60;
            y = node.y;
        }
        else {
            const chart = document.getElementById("chart");
            const scale = (RED.view.settings && RED.view.settings.scaleFactor) || 1;
            x = ((chart ? chart.scrollLeft : 0) / scale) + 60;
            y = ((chart ? chart.scrollTop : 0) / scale) + 60;
        }
        const ids = [];
        for (const item of items) {
            const nn = makeUiNode(item.type, x, y, item.props);
            ids.push(nn.id);
            x += item.props.w + GAP_X;
        }
        RED.history.push({ t: 'add', nodes: ids, dirty: RED.nodes.dirty() });
        RED.nodes.dirty(true);
        RED.storage.update();
        RED.view.redraw();
        return ids.length;
    }

    function init() {
        RED.events.on("control:valuesChanged", valuesChanged);
    }

    return {
        init,
        LiveBind,
        getBind,
        isBound,
        resolve,
        importBind,
        describe,
        slider,
        listBox,
        button,
        sliderText,
        create,
        controlsForMethod,
    };
})();
