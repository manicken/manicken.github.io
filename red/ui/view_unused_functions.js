function showEverything() {
    visLinks.attr("class", "workspace-chart-links");
    visNodes.attr("class", "workspace-chart-nodes");
}
function hideEverything() {
    visLinks.attr("class", "workspace-chart-links hidden");
    visNodes.attr("class", "workspace-chart-nodes hidden");
}

function removeNode(node)
	{
		node.selected = false;
		if (node.x < 0) {
			node.x = 25
		}
						
		var rmlinks = RED.nodes.remove(node.id);
		for (var j=0; j < rmlinks.length; j++) {
			var link = rmlinks[j];
			//console.log("delete link: " + link.source.id + ":" + link.sourcePort
			//	+ " -> " + link.target.id + ":" + link.targetPort);
			if (link.source == node) {
				// reenable input port
				var n = link.targetPort;
				var rect = link.target.inputlist[n];
				rect.on("mousedown", (function(d,n){return function(d){portMouseDown(d,1,n);}})(rect, n))
					.on("touchstart", (function(d,n){return function(d){portMouseDown(d,1,n);}})(rect, n))
					.on("mouseup", (function(d,n){return function(d){portMouseUp(d,1,n);}})(rect, n))
					.on("touchend", (function(d,n){return function(d){portMouseUp(d,1,n);}})(rect, n))
					.on("mouseenter", nodeInput_mouseover)
					.on("mouseout", nodePort_mouseout)//function () {nodePort_mouseout(link.target, d3.select(this))})
					//.on("mouseover",function(d) { var port = d3.select(this); port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 1 ));})
					//.on("mouseout",function(d) { var port = d3.select(this); port.classed("port_hovered",false);})
			}
		}
	}

/**
     * 
     * @param {REDNode} node 
     * @returns 
     */
function getNodeRect(node) {
    var ws = RED.nodes.getWorkspace(node.z);
    var visNodesAll2 = visNodes.selectAll("#"+node.id).data(/*RED.nodes*/ws.nodes.filter(function(d2)
    { 
        return (node===d2);

    }),function(d3){return d3.id});
    var nodeRect; 
    visNodesAll2.each( function(d,i) { 
        nodeRect = d3.select(this); // there should be only one
    });
    return nodeRect;
}

function doSort (arr) {
    arr.sort(function (a, b) {
        var nameA = a.name ? a.name : a.id;
        var nameB = b.name ? b.name : b.id;
        return nameA.localeCompare(nameB, 'en', {numeric: 'true'});
    });
}

function setNewCoords (lastX, lastY, arr) {
    var x = lastX;
    var y = lastY;
    for (var i = 0; i < arr.length; i++) {
        var node = arr[i];
        var name = node.name ? node.name : node.id;
        var def = node._def;
        var dH = Math.max(RED.view.defaults.height, (Math.max(def.outputs, def.inputs) || 0) * 15);
        x = lastX + Math.max(RED.view.defaults.width, RED.view.calculateTextWidth(name) + 50 + (def.inputs > 0 ? 7 : 0));
        node.x = x;
        node.y = y + dH/posMode;
        y = y + dH + 15;
        node.dirty = true;
    }
    return { x: x, y: y };
}

function arrangeAll() {
    var ioNoIn = [];
    var ioInOut = [];
    var ioMultiple = [];
    var ioNoOut = [];
    var ioCtrl = [];
    var ws = RED.nodes.getWorkspace(activeWorkspace);
    RED.nodes.wsEachNode(ws, function (node) {
        //if (node.z != activeWorkspace) return;
        var inputs = 0;
        if (node.inputs == undefined)
            inputs = node._def.inputs;
        else
            inputs = node.inputs;

        if (inputs == 0 && node._def.outputs == 0) {
            ioCtrl.push(node);
        } else if (inputs == 0) {
            ioNoIn.push(node);
        } else if (node._def.outputs == 0) {
            ioNoOut.push(node);
        } else if (inputs == 1 && node._def.outputs == 1) {
            ioInOut.push(node);
        } else if (inputs > 1 || node._def.outputs > 1) {
            ioMultiple.push(node);
        }
    });

    var cols = new Array(ioNoIn, ioInOut, ioMultiple, ioNoOut, ioCtrl);
    var lowestY = 0;

    for (var i = 0; i < cols.length; i++) {
        var dX = ((i < cols.length - 1) ?  i : 0) * (RED.view.defaults.width * 2) + (RED.view.defaults.width / 2) + 15;
        var dY = ((i < cols.length - 1) ?  (RED.view.defaults.height / 4) : lowestY) + 15;
        var startX = 0;
        var startY = 0;

        doSort(cols[i]);
        var last = setNewCoords(startX + dX, startY + dY, cols[i]);
        lowestY = Math.max(lowestY, last.y);
        startX = ((i < cols.length - 1) ? last.x : 0) + (RED.view.defaults.width) * 4;
        startY = lowestY + (RED.view.defaults.height * 1.5);
    }
    RED.storage.update();
    redraw(true);
    redraw_links_init();
    redraw_links();
}