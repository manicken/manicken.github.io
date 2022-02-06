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
		var xmin=settings.space_width,xmax=0,ymin=settings.space_height,ymax=0;
        var posMode = RED.view.posMode;
		for (var i = 0; i < moving_set.length; i++)
		{
			var n = moving_set[i].n;
			var nxmin = (n.x - n.w/posMode);
			var nxmax = (n.x + n.w/posMode);
			var nymin = (n.y - n.h/posMode);
			var nymax = (n.y + n.h/posMode);

			if (nxmin < xmin) xmin = nxmin;
			if (nxmax > xmax) xmax = nxmax;
			if (nymin < ymin) ymin = nymin;
			if (nymax > ymax) ymax = nymax;
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
			group.nodes[ni].dirty = true;
			RED.view.moving_set.push({n:group.nodes[ni]});

			if (group.nodes[ni].nodes != undefined && group.nodes[ni].nodes.length != 0)
				SelectAllInGroup(group.nodes[ni]);
		}
	}
	function getGroupAt(x,y) {
		var candidates = [];
        var posMode = RED.view.posMode;
		for (var gi = 0; gi < activeGroups.length; gi++)
		{
			var g = activeGroups[gi];
			// because the nodes are middle point based
			if (posMode === 2)
			{
				var gxmi = g.x - g.w/posMode; 
				var gymi = g.y - g.h/posMode;
				var gxma = g.x + g.w/posMode;
				var gyma = g.y + g.h/posMode;
			}
			else
			{
				var gxmi = g.x; 
				var gymi = g.y;
				var gxma = g.x + g.w;
				var gyma = g.y + g.h;
			}
            if ((x >= gxmi) && (x <= gxma) && (y >= gymi) && (y <= gyma)) {
				if (g !== RED.view.mousedown_node)
                	candidates.push(g);
            }
		}
		if (candidates.length != 0)
			return candidates[candidates.length-1]; // return last item
		return undefined;
	}

	
	function removeNodeFromGroup(group, node)
	{
		console.warn(" try remove " + node.name + " from the group " + group.name)
		for (var i = 0; i < group.nodes.length; i++)
		{
            if (group.nodes[i] == node)
			{
                
                node.parentGroup = undefined;
                //RED.events.emit("nodes:remove",node);
                group.nodes.splice(i,1);
                //RED.events.emit("nodes:add",node);

				console.warn(node.name + " was removed from the group " + group.name)
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
        
		var groupAt = getGroupAt(mouse_position[0], mouse_position[1]);
		if (groupAt != undefined)
		{
			if (currentHoveredGroup != undefined) // used when hovering from child-to-parent or parent-to-child
			{
				if (groupAt == currentHoveredGroup) return;
                currentHoveredGroup.hovered = false;
                if (RED.workspaces.settings.addToGroupAutosize == true)
				    restoreOldSizeAndPos(currentHoveredGroup);
				lastHoveredGroup = currentHoveredGroup;
				console.warn("group leave2:" + currentHoveredGroup.name);
			}
			currentHoveredGroup = groupAt;
			currentHoveredGroup.hovered = true;
			console.trace("group enter:" + currentHoveredGroup.name);

			if (mousedown_node.type == "group")
			{
				// prevents parent group to be before child
				if (currentHoveredGroup.parentGroup !== mousedown_node)
					moveGroupToFront(mousedown_node);
			}
			// prevents child group to be resized outside parent
			if (currentHoveredGroup.parentGroup !== mousedown_node && RED.workspaces.settings.addToGroupAutosize == true)
			{
				var selExtents = getSelectionExtents();
				var chgExtents = getNodeExtents(currentHoveredGroup);
				saveOldSizeAndPos(currentHoveredGroup);
				if (selExtents.xmin < chgExtents.xmin){setUInode_Xmin(currentHoveredGroup, selExtents.xmin - 30); }
				if (selExtents.xmax > chgExtents.xmax){setUInode_Xmax(currentHoveredGroup, selExtents.xmax + 30); }
				if (selExtents.ymin < chgExtents.ymin){setUInode_Ymin(currentHoveredGroup, selExtents.ymin - 30); }
				if (selExtents.ymax > chgExtents.ymax){setUInode_Ymax(currentHoveredGroup, selExtents.ymax + 30); }

				console.log(selExtents);
			}
			redraw_groups(true);
		}
		else if (currentHoveredGroup != undefined)
		{
			lastHoveredGroup = currentHoveredGroup;
			console.warn("group leave1:" + currentHoveredGroup.name);
			currentHoveredGroup.hovered = false;
            if (RED.workspaces.settings.addToGroupAutosize == true)
                restoreOldSizeAndPos(currentHoveredGroup);
			currentHoveredGroup = undefined;
			redraw_groups(true);
		}
	}
	function redraw_groups_init()
	{
        var _nodes = RED.nodes.getWorkspace(RED.view.activeWorkspace).nodes;
		activeGroups = /*RED.nodes.*/_nodes.filter(function(d)
		{
			return (/*d.z == RED.view.activeWorkspace && */d.type == "group");
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

		});
		return visGroupAll;
	}
	function redraw_groups(fullUpdate)
	{
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
			
			groupRect.selectAll(".nodeGroupSelOutlineBG")
				.attr("x", -6).attr("y", -6)
				.attr("rx", 4).attr("ry", 4)
				.attr("width", d.w + 12)
				.attr("height", d.h + 12)
				.attr("class", function(d) { if (d.selected) return "nodeGroupSelOutlineBG nodeGroupSelOutlineBG-selected";
											 else if (d.hovered) return "nodeGroupSelOutlineBG nodeGroupSelOutlineBG-hovered"; 
											else return "nodeGroupSelOutlineBG"});
			groupRect.selectAll(".nodeGroupSelOutline")
				.attr("x", -6).attr("y", -6)
				.attr("rx", 4).attr("ry", 4)
				.attr("width", d.w + 12)
				.attr("height", d.h + 12)
				.attr("class", function(d) { if (d.selected) return "nodeGroupSelOutline nodeGroupSelOutline-selected";
											 else if (d.hovered) return "nodeGroupSelOutline nodeGroupSelOutline-hovered"; 
											else return "nodeGroupSelOutline"});
		});
	}
    return {
        redraw_groups,
        redraw_groups_init,
        moveToFromGroup_update,
        moveSelectionToFromGroupMouseUp,
        removeNodeFromGroup,
        SelectAllInGroup
    };
})();