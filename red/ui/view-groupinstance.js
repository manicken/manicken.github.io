/**
 * The expanded view of a class instance: a class tab node or a group instance (see red/group-classes.js).
 *
 * A class instance is drawn as a node (collapsed). When its 'expanded' setting is on (in its edit dialog) it shows
 * a read-only copy of everything its class is made of, drawn by the same code as the real ones (RED.view.drawNodeCopy,
 * RED.view.drawLinkCopy and RED.view.groupbox.drawGroupCopy) so they look exactly the same:
 *   class group - the instance gets the size and color of the group, its ports are where the IO junctions are
 *   class tab   - the instance gets the size of the tab contents (with a margin) and the tab color,
 *                 its ports are where the TabInput/TabOutput nodes are
 * The copies are only drawn, they are not real nodes: the instance is still one node (moved, selected and wired
 * as one), and it's marked "instance of ...".
 * With the 'expandedAudioOnly' setting only the audio objects (and the junctions, buses and ports that wires them)
 * are shown, not the code, comments and ui objects (isShownWhenAudioOnly), a tidier view for prints and screenshots.
 *
 * The copy is redrawn every time the instance is redrawn, RED.groupClasses marks the expanded instances
 * to be redrawn when anything is changed (so a change of a class group is shown directly, a class tab is
 * always on another tab so it's redrawn when its tab is shown).
 */
RED.view.groupInstance = (function () {
    'use strict';

    const MIRROR_CLASS = "group_instance_mirror";
    const NOTE_CLASS = "group_instance_note";
    const TAB_MARGIN = 20; // around the contents of a class tab, and the space for the label at the top
    /** the classes being drawn right now, a class that contains an instance of itself is only drawn once */
    const drawing = new Set();

    /**
     * What a class instance shows when expanded.
     * @typedef {Object} ClassSource
     * @property {String} key the id of the class group or tab
     * @property {REDWorkspace} ws where the contents are
     * @property {REDNode[]} contents the nodes (also groups) to copy
     * @property {{x:Number, y:Number}} origin the top left corner of the area, in the workspace
     * @property {Number} w
     * @property {Number} h
     * @property {String} bgColor
     * @property {{In:REDNode[], Out:REDNode[]}} ports the nodes that are the ports, top to bottom
     * @property {String} className
     */

    /** @param {REDNode} d @returns {Boolean} true for a class instance (class tab node or group instance) that is expanded */
    function isExpanded(d) {
        return (d._def.classGroup != undefined || d._def.classWs != undefined) && (d.expanded === true || d.expanded === "true");
    }

    /** @param {REDNode} d @returns {Boolean} true if the expanded view only shows the audio objects */
    function isAudioOnly(d) {
        return d.expandedAudioOnly === true || d.expandedAudioOnly === "true";
    }

    /**
     * @param {REDNode} n a node that is not a group
     * @returns {Boolean} true for the nodes that are shown when only audio objects are shown: everything with audio
     *                    inputs/outputs (also class instances, junctions, BusJoin/BusSplit and the class ports)
     */
    function isShownWhenAudioOnly(n) {
        return RED.exporter.graph.hasAudioIO(n);
    }

    /**
     * @param {REDNode[]} contents the contents of a class
     * @param {Boolean} audioOnly
     * @returns {REDNode[]} what is shown, when only audio objects are shown a group is only shown if anything inside it is shown
     */
    function filterContents(contents, audioOnly) {
        if (audioOnly == false) return contents;
        const shown = contents.filter(function (n) { return n.type != "group" && isShownWhenAudioOnly(n); });
        const shownGroups = contents.filter(function (g) { return g.type == "group" && shown.some(function (n) { return isInside(n, g); }); });
        return [...shownGroups, ...shown];
    }

    /**
     * @param {REDNode} d a class instance
     * @returns {ClassSource|undefined}
     */
    function getClassSource(d) {
        if (d._def.classGroup != undefined) {
            const group = d._def.classGroup;
            const ws = RED.nodes.getWorkspace(group.z);
            return {
                key: group.id, ws, className: RED.exporter.graph.getClassName(group),
                contents: filterContents(ws.nodes.filter(function (n) { return isInside(n, group); }), isAudioOnly(d)),
                origin: getTopLeft(group), w: Number(group.w) || 0, h: Number(group.h) || 0, bgColor: group.bgColor,
                ports: { In: RED.exporter.graph.getGroupPorts(group, "In"), Out: RED.exporter.graph.getGroupPorts(group, "Out") },
            };
        }
        if (d._def.classWs != undefined) {
            const ws = d._def.classWs;
            const contents = filterContents(ws.nodes.slice(), isAudioOnly(d)); // the size is only what is shown
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const n of contents) {
                if (!n.w || !n.h) RED.view.calcNodeSize(n); // never drawn (the tab is not shown yet)
                const tl = getTopLeft(n);
                minX = Math.min(minX, tl.x); minY = Math.min(minY, tl.y);
                maxX = Math.max(maxX, tl.x + (Number(n.w) || 0)); maxY = Math.max(maxY, tl.y + (Number(n.h) || 0));
            }
            if (contents.length == 0) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
            return {
                key: ws.id, ws, className: ws.label, contents,
                origin: { x: minX - TAB_MARGIN, y: minY - TAB_MARGIN * 2 }, w: maxX - minX + TAB_MARGIN * 2, h: maxY - minY + TAB_MARGIN * 3,
                bgColor: (ws.settings && ws.settings.workspaceBgColor) || "#fff",
                ports: { In: ws.tabInputs || [], Out: ws.tabOutputs || [] },
            };
        }
        return undefined;
    }

    /**
     * Used when the size of a node is calculated, an expanded instance is at least as big as what it shows.
     * @param {REDNode} d
     */
    function adjustSize(d) {
        if (isExpanded(d) == false) return;
        const source = getClassSource(d);
        d.w = Math.max(d.w, source.w);
        d.h = Math.max(d.h, source.h);
    }

    /** @param {REDNode} n @returns {{x:Number, y:Number}} the top left corner of a node or group (see posMode) */
    function getTopLeft(n) {
        if (RED.view.posMode === 2) return { x: n.x - (Number(n.w) || 0) / 2, y: n.y - (Number(n.h) || 0) / 2 };
        return { x: n.x, y: n.y };
    }

    /**
     * Used by RED.view for the position of the ports, an expanded instance have its ports where the port nodes of its class are.
     * @param {REDNode} d
     * @param {String} portDir "In" or "Out"
     * @param {Number} index
     * @returns {Number|undefined} the y position (center) of the port in the local space of the instance, undefined for the normal position
     */
    function getPortY(d, portDir, index) {
        if (isExpanded(d) == false) return undefined;
        const source = getClassSource(d);
        const port = source.ports[portDir][index];
        if (port == undefined) return undefined;
        const portCenterY = (RED.view.posMode === 2) ? port.y : (port.y + (Number(port.h) || 0) / 2);
        return portCenterY - source.origin.y;
    }

    /** @param {REDNode} node @param {REDNode} group @returns {Boolean} true if the node is inside the group (at any depth) */
    function isInside(node, group) {
        for (let parent = node.parentGroup; parent != undefined; parent = parent.parentGroup) {
            if (parent === group) return true;
        }
        return false;
    }

    /** @param {REDNode} group @returns {Number} how many groups the group is inside of */
    function getDepth(group) {
        let depth = 0;
        for (let parent = group.parentGroup; parent != undefined; parent = parent.parentGroup) depth++;
        return depth;
    }

    /**
     * Draws (or removes) the expanded look of an instance, used when the instance is redrawn.
     * @param {*} nodeRect the d3 selection of the instance svg group
     * @param {REDNode} d the instance
     */
    function redraw(nodeRect, d) {
        if (d._def.classGroup == undefined && d._def.classWs == undefined) return;
        nodeRect.selectAll("." + MIRROR_CLASS + ", ." + NOTE_CLASS).remove();
        const expanded = isExpanded(d);
        nodeRect.selectAll(".node_icon_group, .in_label, .port_label").style("display", expanded ? "none" : null);
        if (expanded == false) {
            nodeRect.selectAll("text.node_label").attr("x", 38 + (d.inputLabelMaxSize || 0)); // where redraw_init_nodeLabel puts it
            return;
        }
        const source = getClassSource(d);

        // the instance looks like what it shows (a class group looks like RED.view.groupbox updateGroupSvg)
        nodeRect.selectAll(".node").attr("fill", source.bgColor);
        nodeRect.selectAll("text.node_label").attr("x", 38).attr("y", d.textDimensions ? parseInt(d.textDimensions.h) : 14);
        nodeRect.append("svg:text").attr("class", "group_class_note " + NOTE_CLASS).attr("dy", "0.35em").attr("text-anchor", "end")
            .attr("x", d.w - 6).attr("y", d.h - 9).text("instance of " + source.className); // like the note of a class group (RED.view.groupbox)

        if (drawing.has(source.key)) return; // the class contains an instance of itself
        drawing.add(source.key);
        try {
            // the copy is just after the main rect, so it's above its fill but below the ports and the label
            const mirrorElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
            const mainRect = nodeRect.select(".node").node();
            mainRect.parentNode.insertBefore(mirrorElement, mainRect.nextSibling);
            const mirror = d3.select(mirrorElement).attr("class", MIRROR_CLASS).style("pointer-events", "none");
            drawContents(mirror, source);
        }
        finally {
            drawing.delete(source.key);
        }
    }

    /**
     * Draws copies of the contents of a class, relative to the top left corner of its area.
     * @param {*} mirror d3 selection of the svg group to draw in
     * @param {ClassSource} source
     */
    function drawContents(mirror, source) {
        const origin = source.origin;
        const groupLayer = mirror.append("svg:g"); // the same order as the real ones: groups, wires, objects
        const linkLayer = mirror.append("svg:g");
        const nodeLayer = mirror.append("svg:g");

        const groups = source.contents.filter(function (n) { return n.type == "group"; }).sort(function (a, b) { return getDepth(a) - getDepth(b); });
        for (const g of groups) RED.view.groupbox.drawGroupCopy(groupLayer, g, g.x - origin.x, g.y - origin.y);

        const copies = new Map(); // node -> its copy (used as the ends of the wire copies)
        for (const n of source.contents) {
            if (n.type == "group") continue;
            copies.set(n, RED.view.drawNodeCopy(nodeLayer, n, n.x - origin.x, n.y - origin.y));
        }
        for (const l of source.ws.links) {
            if (copies.has(l.source) && copies.has(l.target)) RED.view.drawLinkCopy(linkLayer, l, copies.get(l.source), copies.get(l.target));
        }
    }

    return {
        isExpanded,
        adjustSize,
        getPortY,
        redraw,
    };
})();
