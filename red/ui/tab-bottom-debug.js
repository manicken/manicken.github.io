/**
 * The second log in the bottom panel, beside the output log: the Teensy's debug serial port (Serial), received
 * through the bridge server (red/backend-io.js). It shows itself when text arrives, unless it was hidden with the
 * split button; the button's state is remembered. A line typed at the bottom is sent to the port.
 */
RED.bottombar.debug = (function () {
    'use strict';

    const STORAGE_KEY = "bottomDebugPane";   // "shown" | "hidden" (set by the button), nothing: automatic
    const MAX_CHARS = 200000;                 // older text is dropped
    let pane, head, pre, input;
    let sender = null;                        // function (text) set by the backend

    function pref() { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }
    function setPref(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* not remembered */ } }

    function create() {
        const host = document.getElementById("tab-output");
        if (host == null || pane != undefined) return;
        pane = document.createElement("div");
        pane.id = "debug-pane";
        head = document.createElement("div");
        head.className = "dbg-head";
        const clear = document.createElement("a");
        clear.href = "#";
        clear.title = "clear the debug log";
        clear.innerHTML = '<i class="fa fa-trash"></i>';
        clear.onclick = function (e) { e.preventDefault(); pre.textContent = ""; };
        const title = document.createElement("span");
        title.className = "dbg-title";
        head.append(title, clear);
        pre = document.createElement("pre");
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = "send a line to the debug port (Enter)";
        input.disabled = true;
        input.onkeydown = function (e) {
            if (e.key != "Enter" || sender == null) return;
            sender(input.value + "\n");
            input.value = "";
        };
        pane.append(head, pre, input);
        host.append(pane);
        setSource(null, false);
        $("#btn-split-log").click(function (e) { e.preventDefault(); show(!isShown(), true); });
        if (pref() == "shown") show(true, false);
    }

    function isShown() { return $("#tab-output").hasClass("split"); }

    /** @param {Boolean} on @param {Boolean} remember true when the user asked for it */
    function show(on, remember) {
        create();
        $("#tab-output").toggleClass("split", on);
        $("#btn-split-log").toggleClass("active", on);
        if (remember) setPref(on ? "shown" : "hidden");
        if (on) RED.bottombar.show("output");
    }

    /** @param {String} text from the port (any chunk, not only whole lines) */
    function add(text) {
        create();
        if (!isShown() && pref() != "hidden") show(true, false);
        const atBottom = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 4;
        pre.append(document.createTextNode(text.replace(/\r\n/g, "\n")));
        if (pre.textContent.length > MAX_CHARS) pre.textContent = pre.textContent.slice(-MAX_CHARS / 2);
        if (atBottom) pre.scrollTop = pre.scrollHeight;
    }

    /** @param {String|null} label the port (i.e. COM13) @param {Boolean} open */
    function setSource(label, open) {
        create();
        if (head == undefined) return;
        head.querySelector(".dbg-title").textContent = "Teensy debug" + (label ? " (" + label + ")" : "") + (open ? "" : (label ? ", not open" : ": start the bridge server"));
        input.disabled = !open;
    }

    function setSender(fn) { sender = fn; }

    return { create, show, isShown, add, setSource, setSender };
})();
