// for future extract of GroupBox stuff

RED.view.groupbox = (function() {

    var activeGroups = [];
	var currentHoveredGroup = undefined; // used to select the current hovered group
	var lastHoveredGroup = undefined; // this contains the last hovered group so that a node can be moved outside a group

	
    

    $('#btn-debugShowGroupElements').click(function() { moveGroupToFront(null); });
	function moveGroupToFront(group)
	{
		let wrapper=document.querySelector(".workspace-chart-groups");
		let children=wrapper.children;

		for ( var i = 0; i < children.length; i++)
		{
			if (children[i].id == group.id)
			{
				if (i == children.length - 1) return; // allready at the end

				// first move the child to the second last position
				wrapper.insertBefore(children[i], children[children.length-1]);
				// swap the last items (now the selected child is at the end)
				wrapper.insertBefore(children[children.length-1], children[children.length-2]);
				RED.nodes.moveNodeToEnd(group);
				return;
			}
		}
	}


	function getSelectionExtents()
	{
		var xmin=RED.view.settings.space_width,xmax=0,ymin=RED.view.settings.space_height,ymax=0;
		for (var i = 0; i < RED.view.moving_set.length; i++)
		{
			var n = RED.view.moving_set[i].n;
            var nr = getNodeExtents(n);

			if (nr.xmin < xmin) xmin = nr.xmin;
			if (nr.xmax > xmax) xmax = nr.xmax;
			if (nr.ymin < ymin) ymin = nr.ymin;
			if (nr.ymax > ymax) ymax = nr.ymax;
		}
		return {xmin:xmin,xmax:xmax,ymin:ymin,ymax:ymax};
	}

	var allreadyVisited = [];
	/**
	 * This includes all items in subgroups as well (by recursive calls)
	 * @param {*} group 
	 */
	function SelectAllInGroup(group)
	{
		//if (allreadyVisited.includes(group)) return;
		//allreadyVisited.push(group); // failsafe until the group loop is fixed
		
		//console.error("select all in:" + group.name);
		for (var ni = 0;ni < group.nodes.length; ni++)
		{
			group.nodes[ni].selected = true;
            group.nodes[ni].svgRect.classed("node_selected", true);
            group.nodes[ni].svgRect.selectAll(".node").classed("node_selected", true);
			group.nodes[ni].dirty = true;
			RED.view.moving_set.push({n:group.nodes[ni]});

			if (group.nodes[ni].nodes != undefined && group.nodes[ni].nodes.length != 0)
				SelectAllInGroup(group.nodes[ni]);
		}
	}
	function getGroupAt(x,y) {
		//var candidates = [];
        var foundGroup = undefined;
        var gxmin=0, gymin=0, gxmax=0, gymax=0;
        var posMode = RED.view.posMode;
		var el = "none";

		for (var gi = 0; gi < activeGroups.length; gi++)
		{
			var g = activeGroups[gi];
			
			if (posMode == 2) // middle point based pos
			{
				gxmin = g.x - g.w/posMode; 
				gymin = g.y - g.h/posMode;
				gxmax = g.x + g.w/posMode;
				gymax = g.y + g.h/posMode;
			}
			else
			{
				gxmin = g.x; 
				gymin = g.y;
				gxmax = g.x + g.w;
				gymax = g.y + g.h;
			}
            
            if ((x >= gxmin) && (x <= gxmax) && (y >= gymin) && (y <= gymax)) {
				if (g !== RED.view.mousedown_node) {
                	foundGroup = g;
                    var gxmid1 = gxmin + 10;//(gxmax-gxmin)/3;
                    var gxmid2 = gxmax - 10;//(gxmax-gxmin)/3;
                    var gymid1 = gymin + 10;//(gymax-gymin)/3;
                    var gymid2 = gymax - 10;//(gymax-gymin)/3;
                    

                    /*if      ((x >= gxmin) && (x < gxmid1) && (y >= gymin) && (y < gymid1)) el = "tl"; // top left
                    else if ((x > gxmid2) && (x <= gxmax) && (y >= gymin) && (y < gymid1)) el = "tr"; // top right
                    else if ((x >= gxmin) && (x < gxmid1) && (y > gymid2) && (y <= gymax)) el = "bl"; // bottom left
                    else if ((x > gxmid2) && (x <= gxmax) && (y > gymid2) && (y <= gymax)) el = "br"; // bottom right
                    else */if ((x > gxmid1) && (x < gxmid2) && (y >= gymin) && (y < gymid1)) el = "tm"; // top middle
                    else if ((x >= gxmin) && (x < gxmid1) && (y > gymid1) && (y < gymid2)) el = "ml"; // middle left
                    else if ((x > gxmid2) && (x <= gxmax) && (y > gymid1) && (y < gymid2)) el = "mr"; // middle right
                    else if ((x > gxmid1) && (x < gxmid2) && (y > gymid2) && (y <= gymax)) el = "bm"; // bottom middle
                    //if ((x >= gxmi) && (x <= (gxmi + 10))) enterLocation = "l"; // left
                    //else if ((x <= gxma) && (x >= (gxma - 10))) enterLocation = "r" // right
                    //else if ((y >= gymi) && (y <= (gymi + 10))) enterLocation = "t" // top
                    //else if ((y <= gyma) && (y >= (gyma - 10))) enterLocation = "b" // bottom


                }
            }
		}
        if (foundGroup == undefined) return undefined;

        return {g:foundGroup, el};
	}

	/**
	 * 
	 * @param {REDNode} group 
	 * @param {REDNode} node 
	 */
	function removeNodeFromGroup(group, node)
	{
		//console.warn(" try remove " + node.name + " from the group " + group.name)
		for (var i = 0; i < group.nodes.length; i++)
		{
            if (group.nodes[i] == node)
			{
                if (node.locked != undefined && node.locked == true) {console.log("node locked @ removeNodeFromGroup"); continue;}

                node.parentGroup = undefined;
                //RED.events.emit("nodes:remove",node);
                group.nodes.splice(i,1);
                //RED.events.emit("nodes:add",node);

				//console.warn(node.name + " was removed from the group " + group.name)
                RED.notify(node.name + " was removed from the group " + group.name,false,false, 2000);

                
			}
        }
        //RED.events.emit("groups:change",group);
        RED.events.emit("nodes:change",node);
	}
	function moveSelectionToFromGroupMouseUp()
	{
		var currentHoveredGroupDef = (currentHoveredGroup != undefined);
		var lastHoveredGroupDef = (lastHoveredGroup != undefined);
		//console.error(currentHoveredGroupDef + ":" + lastHoveredGroupDef);

		if (lastHoveredGroupDef == true)
		{
			//console.log("lastHoveredGroupDef == true");
			for (var i = 0; i < RED.view.moving_set.length; i++)
			{
				let node = RED.view.moving_set[i].n;
				if (lastHoveredGroup == node) continue;

				removeNodeFromGroup(lastHoveredGroup, node);
			}
			lastHoveredGroup.hovered = false;
			lastHoveredGroup = undefined;
		}
		if (currentHoveredGroupDef == true)
		{
			//console.log("currentHoveredGroupDef == true");
			for (var i = 0; i < RED.view.moving_set.length; i++)
			{
				//moveToFromGroupMouseUp(moving_set[i].n);
				let node = RED.view.moving_set[i].n;
				if (currentHoveredGroup == node) continue;
				if (currentHoveredGroup.nodes.includes(node)) continue;
				if (node.parentGroup != undefined) continue;
				
				// here a parent "recursive prevention" root check needs to be done
				// if any parent of currentHoveredGroup is equal to d
				// then that parent should never be added
				if (ifAnyRootParent(currentHoveredGroup, node)){ console.log("(recursive prevention) cannot add " + node.name + " into " + currentHoveredGroup.name); continue; }

                // TODO. check so that the whole node is actually inside the group rectangle 
                // otherwise don't add it


                //RED.events.emit("nodes:remove", node);
                currentHoveredGroup.nodes.push(node);
                //RED.events.emit("groups:change", currentHoveredGroup);
                node.parentGroup = currentHoveredGroup;
                //RED.events.emit("nodes:add", node);

				console.warn(node.name + " was added to the group " + currentHoveredGroup.name);
                RED.notify(node.name + " was added to the group " + currentHoveredGroup.name,false,false, 2000);

                
                RED.events.emit("nodes:change",node);
                
            }
            //RED.events.emit("groups:change",currentHoveredGroup);

            currentHoveredGroup.hovered = false;
			currentHoveredGroup = undefined;
		}
		 
	}
	function ifAnyRootParent(childGroup,parentGroup)
	{
		//var check = false;
		if ((childGroup.parentGroup != undefined) && (childGroup.parentGroup != parentGroup))
		{	
			console.warn(childGroup.parentGroup.name + "!=" + parentGroup.name);
			return ifAnyRootParent(childGroup.parentGroup, parentGroup);
		}
		if (childGroup.parentGroup == undefined)
		{
			console.warn(childGroup.name +".parentGroup == undefinded");
			return false;
		}
		if (childGroup.parentGroup == parentGroup)
		{
			console.warn(childGroup.name +".parentGroup ==" + parentGroup.name);
			return true;
		}
	}
	function setUInode_Xmin(node, val) // used by group
	{
        var posMode = RED.view.posMode;
		if (posMode === 2)
		{
			var dx = (node.x - node.w/posMode) - val;
			node.w = node.w + dx;
			node.x = node.x - dx/posMode;
		}
		else
		{
			var dx = node.x - val;
			node.w = node.w + dx;
			node.x = node.x - dx;
		}
	}
	function setUInode_Xmax(node, val) // used by group
	{
        var posMode = RED.view.posMode;
		if (posMode === 2)
		{
			var dx = (node.x + node.w/posMode) - val;
			node.w = node.w - dx;
			node.x = node.x - dx/posMode;
		}
		else
		{
			var dx = (node.x + node.w) - val;
			node.w = node.w - dx;
			//node.x = node.x - dx;
		}
	}
	function setUInode_Ymin(node, val) // used by group
	{
        var posMode = RED.view.posMode;
		if (posMode === 2)
		{
			var dy = (node.y - node.h/posMode) - val;
			node.h = node.h + dy;
			node.y = node.y - dy/posMode;
		}
		else
		{
			var dy = node.y - val;
			node.h = node.h + dy;
			node.y = node.y - dy;
		}
	}
	function setUInode_Ymax(node, val) // used by group
	{
        var posMode = RED.view.posMode;
		if (posMode === 2)
		{
			var dy = (node.y + node.h/posMode) - val;
			node.h = node.h - dy;
			node.y = node.y - dy/posMode;
		}
		else
		{
			var dy = (node.y + node.h) - val;
			node.h = node.h - dy;
			//node.y = node.y - dy;
		}
	}
	function saveOldSizeAndPos(node) // used by group
	{
		node.xo = node.x;
		node.yo = node.y;
		node.wo = node.w;
		node.ho = node.h;
	}
	function restoreOldSizeAndPos(node) // used by group
	{
		if (node.xo != undefined) node.x = node.xo;
		if (node.yo != undefined) node.y = node.yo;
		if (node.wo != undefined) node.w = node.wo;
		if (node.ho != undefined) node.h = node.ho;
	}
	function getNodeExtents(node) // used by group
	{
        var posMode = RED.view.posMode;
		if (posMode === 2)
		{
			return {xmin: node.x - node.w/posMode,
					xmax: node.x + node.w/posMode,
					ymin: node.y - node.h/posMode,
					ymax: node.y + node.h/posMode}
		}
		else
		{
			return {xmin: node.x,
					xmax: node.x + node.w,
					ymin: node.y,
					ymax: node.y + node.h}
		}
	}
	function moveToFromGroup_update()
	{
        var mouse_position = RED.view.mouse_position;
        var mousedown_node = RED.view.mousedown_node;
        //const t0 = performance.now();
		var groupAt = getGroupAt(mouse_position[0], mouse_position[1]);
        //const t1 = performance.now();
        //console.warn((t1-t0)+"ms");
		if (groupAt != undefined)
		{
			if (currentHoveredGroup != undefined) // used when hovering from child-to-parent or parent-to-child
			{
				if (groupAt.g == currentHoveredGroup) return;
                currentHoveredGroup.hovered = false;
                if (RED.main.settings.addToGroupAutosize == true || d3.event.shiftKey)
				    restoreOldSizeAndPos(currentHoveredGroup);
				lastHoveredGroup = currentHoveredGroup;
				//console.warn("group leave2:" + currentHoveredGroup.name);
			}
			currentHoveredGroup = groupAt.g;
			currentHoveredGroup.hovered = true;
			//console.trace("group enter:" + currentHoveredGroup.name);

			if (mousedown_node.type == "group")
			{
				// prevents parent group to be before child
				if (currentHoveredGroup.parentGroup !== mousedown_node)
					moveGroupToFront(mousedown_node);
			}
			// currentHoveredGroup.parentGroup !== mousedown_node  ???prevents child group to be resized outside parent???
			if (currentHoveredGroup.parentGroup !== mousedown_node && (RED.main.settings.addToGroupAutosize == true || d3.event.shiftKey))
			{
                console.log("enterLocation: " + groupAt.el);

				var selExtents = getSelectionExtents();
				var chgExtents = getNodeExtents(currentHoveredGroup);
				saveOldSizeAndPos(currentHoveredGroup);

                // TODO. make us of tl, tr, bl, br scheme instead that will work much better I think
                /*if (groupAt.el == "tl") {
                    setUInode_Ymin(currentHoveredGroup, chgExtents.ymin - (selExtents.ymax - selExtents.ymin) - 30);
                    setUInode_Xmin(currentHoveredGroup, chgExtents.xmin - (selExtents.xmax - selExtents.xmin) - 30);
                }
                else if (groupAt.el == "tr") {
                    setUInode_Ymin(currentHoveredGroup, chgExtents.ymin - (selExtents.ymax - selExtents.ymin) - 30);
                    setUInode_Xmax(currentHoveredGroup, chgExtents.xmax + (selExtents.xmax - selExtents.xmin) + 30);
                }
                else if (groupAt.el == "bl") {
                    setUInode_Ymax(currentHoveredGroup, chgExtents.ymax + (selExtents.ymax - selExtents.ymin) + 30);
                    setUInode_Xmin(currentHoveredGroup, chgExtents.xmin - (selExtents.xmax - selExtents.xmin) - 30);
                }
                else if (groupAt.el == "br") {
                    setUInode_Ymax(currentHoveredGroup, chgExtents.ymax + (selExtents.ymax - selExtents.ymin) + 30);
                    setUInode_Xmax(currentHoveredGroup, chgExtents.xmax + (selExtents.xmax - selExtents.xmin) + 30);
                }
                else */if (groupAt.el == "tm") {
                    setUInode_Ymin(currentHoveredGroup, chgExtents.ymin - (selExtents.ymax - selExtents.ymin) - 30);
                    var sew = selExtents.xmax - selExtents.xmin;
                    var chgw = chgExtents.xmax - chgExtents.xmin;
                    if (sew > chgw) {
                        setUInode_Xmin(currentHoveredGroup, chgExtents.xmin - (sew-chgw)/2 - 30);
                        setUInode_Xmax(currentHoveredGroup, chgExtents.xmax + (sew-chgw)/2 + 30);
                    } // else no width resize needed
                }
                else if (groupAt.el == "ml") {
                    setUInode_Xmin(currentHoveredGroup, chgExtents.xmin - (selExtents.xmax - selExtents.xmin) - 30);
                    var seh = selExtents.ymax - selExtents.ymin;
                    var chgh = chgExtents.ymax -chgExtents.ymin;
                    if (seh > chgh) {
                        setUInode_Ymin(currentHoveredGroup, chgExtents.ymin - (seh-chgh)/2 - 30);
                        setUInode_Ymax(currentHoveredGroup, chgExtents.ymax + (seh-chgh)/2 + 30);
                    }
                }
                else if (groupAt.el == "mr") {
                    setUInode_Xmax(currentHoveredGroup, chgExtents.xmax + (selExtents.xmax - selExtents.xmin) + 30);
                    var seh = selExtents.ymax - selExtents.ymin;
                    var chgh = chgExtents.ymax -chgExtents.ymin;
                    if (seh > chgh) {
                        setUInode_Ymin(currentHoveredGroup, chgExtents.ymin - (seh-chgh)/2 - 30);
                        setUInode_Ymax(currentHoveredGroup, chgExtents.ymax + (seh-chgh)/2 + 30);
                    }
                }
                else if (groupAt.el == "bm") {
                    setUInode_Ymax(currentHoveredGroup, chgExtents.ymax + (selExtents.ymax - selExtents.ymin) + 30);
                    var sew = selExtents.xmax - selExtents.xmin;
                    var chgw = chgExtents.xmax - chgExtents.xmin;
                    if (sew > chgw) {
                        setUInode_Xmin(currentHoveredGroup, chgExtents.xmin - (sew-chgw)/2 - 30);
                        setUInode_Xmax(currentHoveredGroup, chgExtents.xmax + (sew-chgw)/2 + 30);
                    } // else no width resize needed
                }
                
                //if (groupAt.enterLocation == "t") setUInode_Ymin(currentHoveredGroup, chgExtents.ymin - (selExtents.ymax - selExtents.ymin) - 30);
                //else if (groupAt.enterLocation == "b") setUInode_Ymax(currentHoveredGroup, chgExtents.ymax + (selExtents.ymax - selExtents.ymin) + 30);
                //else if (groupAt.enterLocation == "l") setUInode_Xmin(currentHoveredGroup, chgExtents.xmin - (selExtents.xmax - selExtents.xmin) - 30);
                //else if (groupAt.enterLocation == "r") setUInode_Xmax(currentHoveredGroup, chgExtents.xmax + (selExtents.xmax - selExtents.xmin) + 30);


				/*
                if (selExtents.xmin < chgExtents.xmin){setUInode_Xmin(currentHoveredGroup, selExtents.xmin - 30); }
				if (selExtents.xmax > chgExtents.xmax){setUInode_Xmax(currentHoveredGroup, selExtents.xmax + 30); }
				if (selExtents.ymin < chgExtents.ymin){setUInode_Ymin(currentHoveredGroup, selExtents.ymin - 30); }
				if (selExtents.ymax > chgExtents.ymax){setUInode_Ymax(currentHoveredGroup, selExtents.ymax + 30); }
                */
				
			}
			redraw_groups(true);
		}
		else if (currentHoveredGroup != undefined)
		{
			lastHoveredGroup = currentHoveredGroup;
			//console.warn("group leave1:" + currentHoveredGroup.name);
			currentHoveredGroup.hovered = false;
            if (RED.main.settings.addToGroupAutosize == true || d3.event.shiftKey)
                restoreOldSizeAndPos(currentHoveredGroup);
			currentHoveredGroup = undefined;
			redraw_groups(true);
		}
	}
	function redraw_groups_init()
	{
		activeGroups = RED.nodes.getWorkspace(RED.view.activeWorkspace).nodes.filter(function(d)
		{
			return (d.type == "group");
		});
		//console.error(activeGroups);
		// just use .nodegroup for now
		// it should maybe have seperate class later
		var visGroupAll = RED.view.visGroups.selectAll(".nodegroup").data(activeGroups, function(d){return d.id;});
		var groupExit = visGroupAll.exit().remove();
		groupExit.each(function(d,i) // this happens only when a node exits(is removed) from the current workspace.
		{
			// here it could remove the nodes that is inside a group
			// or it could also just remove the group leaving the nodes "behind"
			// it should be done with a selector
		});

		var groupEnter = visGroupAll.enter().insert("svg:g").attr("class", "node nodegroup");
		anyGroupEnter = false;
		groupEnter.each(function(d,i) // this happens only when a node enter(is added) to the current workspace.
		{
			anyGroupEnter = true; // could probally just check if (groupEnter.length > 0)

			var groupRect = d3.select(this);
            d.svgRect = groupRect;
			groupRect.attr("id",d.id);

			d.oldNodeText = undefined;
			d.oldWidth = undefined;
			d.oldHeight = undefined;

			var selRectBG = groupRect.append("rect").attr("class", "nodeGroupSelOutlineBG");
			var selRect = groupRect.append("rect").attr("class", "nodeGroupSelOutline");
			//groupRect.classed("nodeGroupSelOutline-hovered", function(d) { return d.hovered; })

			//redraw_nodeMainRect_init(groupRect, d);
			var mainRect = groupRect.append("rect")
									.attr("class", "node")
									.attr("fill",function(d) { return d._def.color;})
									.attr("rx", 6)
									.attr("ry", 6)
									.on("mouseup", RED.view.nodeMouseUp)
									.on("mousedown",RED.view.nodeMouseDown)
									.on("mousemove", RED.view.nodeMouseMove)
									.on("mouseover", RED.view.nodeMouseOver)
									.on("mouseout", RED.view.nodeMouseOut)
									.on("touchstart",RED.view.nodeTouchStart)
									.on("touchend", RED.view.nodeTouchEnd);

			var text = groupRect.append('svg:text').attr('class','node_label').attr('x', 38).attr('dy', '0.35em').attr('text-anchor','start');

			if (d._def.align) { // replace with custom thingy
				text.attr('class','node_label node_label_'+d._def.align);
				text.attr('text-anchor','end');
			}

			//RED.view.redraw_nodeInputs(groupRect, d);
			//RED.view.redraw_nodeOutputs(groupRect, d);

		});
		return visGroupAll;
	}
	function redraw_groups(fullUpdate)
	{
		//console.log("whello");
		var visGroupAll = redraw_groups_init();

		visGroupAll.each( function(d,i) { // redraw all nodes in active workspace
			var groupRect = d3.select(this);

			if (RED.view.posMode === 2)
				groupRect.attr("transform", function(d) { return "translate(" + (d.x-d.w/2) + "," + (d.y-d.h/2) + ")"; });
			else
				groupRect.attr("transform", function(d) { return "translate(" + (d.x) + "," + (d.y) + ")"; });
				
			groupRect.selectAll(".node")
				.attr("width",function(d){return d.w})
				.attr("height",function(d){return d.h})
				.attr("fill", d.bgColor)
				.attr("style", "stroke:" + d.border_color + ";");
				//.attr("stroke", d.border_color);

			var groupLabel = groupRect.selectAll('text.node_label').text(d.name);

			RED.view.redraw_update_label(groupRect, d);
			//RED.view.redraw_nodeInputs(groupRect, d);
			//RED.view.redraw_nodeOutputs(groupRect, d);
			
			redrawGroupOutline(d);
		});
	}
    function redrawGroupOutline(d) {
        d.svgRect.selectAll(".nodeGroupSelOutlineBG")
            .attr("x", -6).attr("y", -6)
            .attr("rx", 4).attr("ry", 4)
            .attr("width", d.w + 12)
            .attr("height", d.h + 12)
            .attr("class", function(d) { if (d.selected) return "nodeGroupSelOutlineBG nodeGroupSelOutlineBG-selected";
                                        else if (d.hovered) return "nodeGroupSelOutlineBG nodeGroupSelOutlineBG-hovered"; 
                                        else return "nodeGroupSelOutlineBG"});
        d.svgRect.selectAll(".nodeGroupSelOutline")
            .attr("x", -6).attr("y", -6)
            .attr("rx", 4).attr("ry", 4)
            .attr("width", d.w + 12)
            .attr("height", d.h + 12)
            .attr("class", function(d) { if (d.selected) return "nodeGroupSelOutline nodeGroupSelOutline-selected";
                                        else if (d.hovered) return "nodeGroupSelOutline nodeGroupSelOutline-hovered"; 
                                        else return "nodeGroupSelOutline"});
    }
	function AddIOnodes(group ,count, type) {
		var typeText = ((type==0)?"Out":"In");
		//console.log(typeText + " to add: "+count);
		if (type == 0) var totalCount = group.outputs;
		else var totalCount = group.inputs;
		var currentCount = totalCount-count;
		
		var spacing = group.ioNodeSize+group.ioNodeSpacing;
		var CenterBasedPositions = RED.view.settings.useCenterBasedPositions;
		var PosModeCorrection_Xpos = (CenterBasedPositions == true)?0:(group.ioNodeSize/2);
		var yOffset = group.y + group.h/2 - (spacing*(totalCount-1))/2;
		var c = currentCount;
		var xPos = ((type == 0)?(group.x+group.w):(group.x)) - PosModeCorrection_Xpos;
		if (CenterBasedPositions) xPos -= group.w/2;
		while (count > 0) {
			
			var yPos = yOffset + c*spacing;
			if (CenterBasedPositions == true) {
				yPos -= group.h/2;
			}
			var newIOnode = RED.view.AddNewNode(xPos,yPos, "JunctionLR");
			newIOnode.name = typeText + (c + 1);
			newIOnode.locked = true;
			newIOnode.size = group.ioNodeSize;
			//newIOnode.anchor = ((type == 0)?AnchorTypes.Right:AnchorTypes.Left); //not really needed as RearrangeIONodes takes care of that
			newIOnode.ClassIOtype = type;
			newIOnode.parentGroup = group;
			group.nodes.push(newIOnode);
			count--;
			c++;
		}
		RED.view.redraw();
		RearrangeIONodes(group, type);
		RED.view.redraw_links();
	}
	function RearrangeIONodes(group, type) {
		var spacing = group.ioNodeSize+group.ioNodeSpacing;
		var CenterBasedPositions = RED.view.settings.useCenterBasedPositions;
		if (type == 0) var totalCount = group.outputs;
		else var totalCount = group.inputs;
		var c = 0;
		var yOffset = group.y + group.h/2 - (spacing*(totalCount-1))/2;
		var PosModeCorrection_Xpos = (CenterBasedPositions == true)?0:(group.ioNodeSize/2);
		var xPos = ((type == 0)?(group.x+group.w):(group.x)) - PosModeCorrection_Xpos;
		if (CenterBasedPositions == true)
			xPos -= group.w/2;
		for (var ni=0;ni<group.nodes.length;ni++) {
			var node = group.nodes[ni];
			if (node.ClassIOtype != type) continue;
			var yPos = yOffset + c*spacing;
			if (CenterBasedPositions == true) {
				yPos -= group.h/2;
			}
			node.y = yPos;
			node.x = xPos;
			node.size = group.ioNodeSize;
			c++;
			RED.view.redraw_node(node);
		}
	}
	function RemoveIOnodes(group, count, type) {
		//console.log((type==0?"Out":"In") + " to remove: "+count);
		for (var ni=group.nodes.length-1; (ni>=0) && (count>0);ni--) {
			var node = group.nodes[ni];
			if (node.ClassIOtype != type) continue;
			group.nodes.splice(ni, 1);
			RED.nodes.remove(node.id);
			count--;
		}
		RearrangeIONodes(group, type);
		RED.view.redraw_links();
	}
	function NodeChanged(node, changes) {
		if (node.type != "group") return;
		var group = node; // make the code easier to read
		if (changes.inputs != undefined) {
			//console.log("group box inputs changed from:"+changes.inputs+" to "+group.inputs);
			if (changes.inputs > group.inputs)
				RemoveIOnodes(group, changes.inputs - group.inputs, 1);
			else
				AddIOnodes(group, group.inputs - changes.inputs, 1)
		}
		if (changes.outputs != undefined) {
			//console.log("group box ouputs changed from:"+changes.outputs+" to "+group.outputs);
			if (changes.outputs > group.outputs)
				RemoveIOnodes(group, changes.outputs - group.outputs, 0);
			else
				AddIOnodes(group, group.outputs - changes.outputs, 0)
		}
		if (changes.ioNodeSize != undefined || changes.ioNodeSpacing != undefined) {
			RearrangeIONodes(group, 0);
			RearrangeIONodes(group, 1);
			RED.view.redraw_links();
		}
	}
	function Init() {
		RED.events.on("nodes:change", NodeChanged);
	}
    return {
		Init,
        redraw_groups,
        redraw_groups_init,
        redrawGroupOutline,
        moveToFromGroup_update,
        moveSelectionToFromGroupMouseUp,
        removeNodeFromGroup,
        SelectAllInGroup,
		RearrangeIONodes
    };
})();