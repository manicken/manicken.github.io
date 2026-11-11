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
        /** @param {{node:String|REDNode, method:String, ch?:Number|null, arg?:Number, path?:String, min?:Number, max?:Number}} data */
        constructor(data) {
            this.nodeId = (typeof data.node == "object") ? data.node.id : data.node;
            this.methodId = data.method;
            this.ch = (data.ch == undefined) ? null : data.ch;
            this.arg = data.arg || 0;
            this.path = data.path || "";
            // a range of its own (a slider): instead of the method's (i.e. frequency 50 … 2000 Hz instead of 1 … 20000)
            this.min = (data.min == undefined || data.min === "") ? undefined : Number(data.min);
            this.max = (data.max == undefined || data.max === "") ? undefined : Number(data.max);
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
            const json = { node: this.nodeId, method: this.methodId, ch: this.ch, arg: this.arg, path: this.path };
            if (this.min != undefined) json.min = this.min;
            if (this.max != undefined) json.max = this.max;
            return json;
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
            const method = RED.control.methods.getMethod(node.type, this.methodId, node);
            if (method == undefined) return undefined;
            let targets = RED.control.core.getTargets(node).targets;
            const path = this.path;
            if (path != "") targets = targets.filter(function (t) { return t.path == path; });
            let arg = (method.args != undefined) ? method.args[this.arg] : undefined;
            if (arg != undefined && (this.min != undefined || this.max != undefined))
                arg = Object.assign({}, arg, { min: (this.min != undefined) ? this.min : arg.min, max: (this.max != undefined) ? this.max : arg.max });
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

    /**
     * The objects a GUI object can be switched to: the instances of the same array (the last /iN in its path),
     * or all of them for a GUI object bound to all
     * @param {REDNode} d a bound GUI object @returns {String[]} paths
     */
    function siblingPaths(d) {
        const r = resolve(d, true);
        const bind = getBind(d);
        if (r == undefined || bind == undefined) return [];
        const all = RED.control.core.getTargets(r.node).targets.map(function (t) { return t.path; });
        if (bind.path == "") return all;
        const re = /\/i\d+(?=\/|$)/g;
        let m, last = null;
        while ((m = re.exec(bind.path)) != null) last = m;
        if (last == null) return [bind.path];
        const esc = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
        const same = new RegExp("^" + esc(bind.path.slice(0, last.index)) + "/i\\d+" + esc(bind.path.slice(last.index + last[0].length)) + "$");
        return all.filter(function (p) { return same.test(p); });
    }

    // ******************************************************************
    // the edit dialog of a bound GUI object (red/ui/editor.js calls these)
    // ******************************************************************

    function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

    /**
     * Adds a "Live bind" part to the dialog: which object it controls (the array instance) and, for a slider,
     * its range in the value's own unit. The slider's Min/Max Value (the slider steps) are hidden.
     */
    function editorPrepare(d) {
        const bind = getBind(d);
        const r = resolve(d, true);
        if (bind == undefined || r == undefined) return;
        const paths = siblingPaths(d);
        let html = '<div id="live-bind-form"><div class="form-row-divider"></div>' +
            '<div class="form-row"><label style="width:150px"><i class="fa fa-link"></i> Controls</label>' +
            '<select id="live-bind-path" style="width:auto" title="the object (array instance) this GUI object controls">';
        if (bind.path == "" || paths.length == 0) html += '<option value="">all ' + paths.length + '</option>';
        for (const p of paths) html += '<option value="' + esc(p) + '">' + esc(p) + '</option>';
        html += '</select></div>';
        const base = (r.method.args != undefined) ? r.method.args[bind.arg || 0] : undefined;   // the method's own range
        const isRange = d.type == "UI_Slider" && base != undefined && (base.type == "float" || base.type == "int") && base.min != undefined;
        if (isRange) {
            const unit = base.unit ? " (" + esc(base.unit) + ")" : "";
            html += '<div class="form-row"><label style="width:150px"><i class="fa fa-arrows-v"></i> Range min' + unit + '</label>' +
                '<input type="text" id="live-bind-min" style="width:100px" placeholder="' + base.min + '" value="' + (bind.min != undefined ? bind.min : "") + '"></div>' +
                '<div class="form-row"><label style="width:150px"><i class="fa fa-arrows-v"></i> Range max' + unit + '</label>' +
                '<input type="text" id="live-bind-max" style="width:100px" placeholder="' + base.max + '" value="' + (bind.max != undefined ? bind.max : "") + '"></div>' +
                '<div class="form-row" style="color:#888;font-size:11px">' + esc(r.method.label || r.method.id) + ": " + base.min + " … " + base.max +
                (base.unit ? " " + esc(base.unit) : "") + ((base.scale && base.scale != "lin") ? ", " + base.scale : "") + " (empty: that)</div>";
        }
        html += "</div>";
        const minRow = $("#node-input-minVal").closest("div[class^=form-row]"), maxRow = $("#node-input-maxVal").closest("div[class^=form-row]");
        if (d.type == "UI_Slider" && maxRow.length != 0) {
            maxRow.after(html);
            minRow.hide(); maxRow.hide();   // the slider steps, set by the binding
        } else {
            const nameRow = $("#node-input-name").closest("div[class^=form-row]");
            if (nameRow.length != 0) nameRow.after(html); else $("#dialog-form").prepend(html);
        }
        $("#live-bind-path").val(bind.path);
    }

    /**
     * Reads the "Live bind" part of the dialog.
     * @returns {LiveBind|undefined} the binding before (for undo) when something changed, else undefined
     */
    function editorSave(d) {
        const old = getBind(d);
        if (old == undefined || $("#live-bind-form").length == 0) return undefined;
        const path = $("#live-bind-path").length ? String($("#live-bind-path").val() || "") : old.path;
        const num = function (sel) {
            const t = String($(sel).val() == undefined ? "" : $(sel).val()).trim();
            if (t === "") return undefined;
            const v = Number(t);
            return isNaN(v) ? undefined : v;
        };
        let min = $("#live-bind-min").length ? num("#live-bind-min") : old.min;
        let max = $("#live-bind-max").length ? num("#live-bind-max") : old.max;
        const r = resolve(d, true);
        const base = (r != undefined && r.method.args != undefined) ? r.method.args[old.arg || 0] : undefined;
        if (base != undefined && base.min != undefined) {
            const lo = (min != undefined) ? min : base.min, hi = (max != undefined) ? max : base.max;
            if (!(hi > lo) || (base.scale == "log" && lo <= 0)) {
                RED.notify("live: the range " + lo + " … " + hi + " can't be used" + (base.scale == "log" ? " (a log scale needs min > 0)" : "") + ", the range before is kept", "warning", null, 4000);
                min = old.min; max = old.max;
            }
        }
        if (path == old.path && min === old.min && max === old.max) return undefined;
        const bind = new LiveBind({ node: old._node || old.nodeId, method: old.methodId, ch: old.ch, arg: old.arg, path, min, max });
        bind.nodeId = old.nodeId;
        d.liveBind = bind;
        // the slider steps follow the range (a linear int slider uses the values directly), and it shows that object's value
        const nr = resolve(d, true);
        if (nr != undefined && nr.arg != undefined) {
            if (d.type == "UI_Slider" && isDirectInt(nr.arg)) { d.minVal = nr.arg.min; d.maxVal = nr.arg.max; }
            const value = RED.control.core.getValues(nr.node, nr.method, nr.channel, path)[bind.arg || 0];
            if (d.type == "UI_Slider") d.val = valueToSlider(d, nr.arg, value);
            else if (d.type == "UI_ListBox") d.selectedIndex = (nr.arg.options || []).findIndex(function (o, i) { return ((typeof o == "object") ? o.value : i) == value; });
        }
        return old;
    }

    /** binds a GUI object to another object of its node ("" = all of them), i.e. another instance of the array */
    function setPath(d, path) {
        const bind = getBind(d);
        if (bind == undefined || bind.path == path) return;
        bind.path = path;
        bind._resolved = undefined;     // found again with the new path
        const r = resolve(d, true);
        if (r != undefined && r.arg != undefined) {   // show that object's value
            const value = RED.control.core.getValues(r.node, r.method, r.channel, path)[bind.arg || 0];
            if (d.type == "UI_Slider") d.val = valueToSlider(d, r.arg, value);
            else if (d.type == "UI_ListBox") d.selectedIndex = (r.arg.options || []).findIndex(function (o, i) { return ((typeof o == "object") ? o.value : i) == value; });
        }
        d.changed = true;
        d.dirty = true;
        RED.nodes.dirty(true);
        RED.storage.update();
        if (d.z == RED.view.activeWorkspace) RED.view.redraw_node(d);
    }

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
        const value = RED.control.core.getValues(r.node, r.method, r.channel, r.bind.path)[r.bind.arg || 0];
        return formatValue(r.arg, value) + (r.arg.unit ? (" " + r.arg.unit) : "");
    }

    // ******************************************************************
    // sending (called from RED.ControlGUI instead of the sendCommand script)
    // ******************************************************************

    function setArg(r, value, source) {
        const values = RED.control.core.getValues(r.node, r.method, r.channel, r.bind.path);
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
            core.invoke(r.node, r.targets, r.method, r.channel, core.getValues(r.node, r.method, r.channel, r.bind.path), true, d);
            return;
        }
        if (r.method.release == undefined) return;
        const release = RED.control.methods.getMethod(r.node.type, r.method.release, r.node);
        if (release != undefined) core.invoke(r.node, r.targets, release, r.channel, core.getValues(r.node, release, r.channel, r.bind.path), true, d);
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
            // e.paths null: all the objects changed; else only those (a GUI object bound to all of them is not one of them)
            if (e.paths != null && (bind.path == "" || e.paths.includes(bind.path) == false)) return;
            const resolved = bind.resolve();
            const arg = (resolved != undefined && resolved.arg != undefined) ? resolved.arg : e.method.args[bind.arg || 0]; // its own range
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
        const value = RED.control.core.getValues(node, method, channel, path)[argIndex];
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
        siblingPaths,
        setPath,
        editorPrepare,
        editorSave,
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
