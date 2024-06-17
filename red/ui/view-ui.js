// for future extract of UI objects stuff

RED.view.ui = (function() {

	var UI_BUTTON_SEND_MODES = {
		ON_PRESS:0,
		ON_RELEASE:1,
		ON_BOTH:2
	};

    var allowUiItemTextInput = false;
    var uiItemResizeBorderSize= 6;
    var currentUiObject = null;
    var mousedown_node_resize = {x:0, y:0, w:0, h:0, ox:0, oy:0}

    function nodeMouseMove(d,_this) {
        //console.warn("nodeMouseMove");
        var mousePos = d3.mouse(_this);
		var x = mousePos[0];
		var y = mousePos[1];

		if (RED.view.settings.guiEditMode == false) {
			_this.style.cursor = "default";
            if (RED.view.state != RED.state.UI_OBJECT_MOUSE_DOWN) return;
			uiObjectMouseMove(d, x, y);
            
			return;
		}

        // following is for resize

		if (RED.view.state !== RED.state.DEFAULT) return;
        //var uiItemResizeBorderSize = RED.view.ui.get_uiItemResizeBorderSize();
		//var nodeRect = d3.select(this);
		
		if ((y > uiItemResizeBorderSize) && (y < (d.h-uiItemResizeBorderSize))) // width resize
		{
			if (x < uiItemResizeBorderSize)
				_this.style.cursor = "w-resize";
			else if (x > (d.w-uiItemResizeBorderSize))
				_this.style.cursor = "e-resize";
			else
				_this.style.cursor = "move";
		}
		else if ((x > uiItemResizeBorderSize) && (x < (d.w-uiItemResizeBorderSize))) // height resize
		{
			if (y < uiItemResizeBorderSize)
				_this.style.cursor = "n-resize";
			else if (y > (d.h-uiItemResizeBorderSize))
				_this.style.cursor = "s-resize";
			else
				_this.style.cursor = "move";
		}
		else if ((x < uiItemResizeBorderSize) && (y < uiItemResizeBorderSize)) // top left resize
		{
			_this.style.cursor = "nw-resize";
		}
		else if ((x < uiItemResizeBorderSize) && (y>(d.h-uiItemResizeBorderSize))) // bottom left resize
		{
			_this.style.cursor = "sw-resize";
		}
		else if ((y < uiItemResizeBorderSize) && (x>(d.w-uiItemResizeBorderSize))) // top right resize
		{
			_this.style.cursor = "ne-resize";
		}
		else if ((y > (d.h-uiItemResizeBorderSize)) && (x > (d.w-uiItemResizeBorderSize))) // bottom right resize
		{
			_this.style.cursor = "se-resize";
		}
		else
			_this.style.cursor = "move";
	}

    function uiObjectMouseMove (d, mouseX, mouseY)
	{
		//console.warn("uiObjectMouseMove " + mouseX + ":" + mouseY);
		if (d.type == "UI_Button") {
	
		} else if (d.type == "UI_Slider") {
			setUiSliderValueFromMouse(d, mouseX, mouseY);
			//if (d.sendMode == "m") // don' work at the moment
				RED.ControlGUI.sendUiSliderValue(d);
		}
	}
	
	function setUiSliderValueFromMouse(d, mouseX, mouseY)
	{
		//console.error("setUiSliderValueFromMouse");
		if (d.orientation == "v")
		{
			if (mouseY < 0 || mouseY >= d.h) return;
			d.maxVal = parseInt(d.maxVal);
			d.minVal = parseInt(d.minVal);
			//console.log(typeof mouseY + typeof mouseX + typeof d.maxVal + typeof d.minVal + typeof d.h);
			var interval = parseInt(d.maxVal - d.minVal);

			d.val = parseInt(((d.h - mouseY) * interval / d.h) + d.minVal);

			if (d.val < d.minVal) d.val = d.minVal;
			if (d.val > d.maxVal) d.val = d.maxVal;
			//d.dirty = true;
			RED.view.redraw_node(d);
			//RED.view.redraw_nodes(true);
		}
		else if (d.orientation == "h")
		{
			if (mouseX < 0 || mouseX > d.w) return;
			d.maxVal = parseInt(d.maxVal);
			d.minVal = parseInt(d.minVal);
			var interval = parseInt(d.maxVal - d.minVal);
			d.val = parseInt(((mouseX * interval) / d.w) + d.minVal);

			if (d.val < d.minVal) d.val = d.minVal;
			if (d.val > d.maxVal) d.val = d.maxVal;
			//d.dirty = true;
			RED.view.redraw_node(d);
			//RED.view.redraw_nodes(true);
		}
        if (d.divVal == undefined || d.divVal == "" || d.divVal == 0) d.divVal = 1;
        d.divVal = parseInt(d.divVal);
        d.fval = d.val/d.divVal;
	}
	
	function uiObjectMouseOver (d, mouseX, mouseY, rect)
	{
		if (RED.view.state == RED.state.UI_OBJECT_MOUSE_DOWN)
			uiObjectMouseDown(d, mouseX, mouseY, rect);
		currentUiObject = d; // used by scroll event
	}

	function uiObjectMouseOut (d, mouseX, mouseY, rect)
	{
		if (RED.view.state == RED.state.UI_OBJECT_MOUSE_DOWN)
			uiObjectMouseUp(d, mouseX, mouseY, rect, true);
		currentUiObject = null; // used by scroll event
	}
	function uiObjectMouseDown(d, mouseX, mouseY, rect)
	{
		RED.view.state = RED.state.UI_OBJECT_MOUSE_DOWN;
		//console.warn("uiObjectMouseDown " + mouseX + ":" + mouseY);

		if (d.type == "UI_Button") {
			setRectFill(rect, undefined, d.bgColor);
			if (d.sendMode == UI_BUTTON_SEND_MODES.ON_PRESS || d.sendMode == UI_BUTTON_SEND_MODES.ON_BOTH)
				RED.ControlGUI.sendUiButton(true, d);
		
		} else if (d.type == "UI_Slider") {
			setUiSliderValueFromMouse(d, mouseX, mouseY);
			//if (d.sendMode == "m") // don' work at the moment
                RED.ControlGUI.sendUiSliderValue(d);
		} else if (d.type == "UI_ListBox") {
			var newIndex = rect.attr("listItemIndex");
			if (newIndex == undefined) {
				console.warn("listbox title clicked");
				return; // this happenns when click title bar
			}
			d.selectedIndex = parseInt(newIndex);
			d.dirty = true;
			console.warn("ui_listBoxMouseDown " + d.sendCommand + " " + d.selectedIndex);
			RED.ControlGUI.sendUiListBox(d);
	
			if (d.parentGroup != undefined && d.parentGroup.individualListBoxMode == false)
			{
				UI_ListBoxDeselectOther(d);
			}

			redraw_update_UI_ListBox(d);

		} else if (d.type == "UI_Piano") {
			var newKeyIndex = rect.attr("keyIndex");
			if (newKeyIndex == undefined) {
				console.warn("piano title clicked");
				return; // this happenns when click title bar
			}
			d.keyIndex = parseInt(newKeyIndex);
			d.pressed = true;
			setRectFill(rect, d.pressedKeyColor);
			setRectStroke(rect, d.pressedKeyColor);
			RED.ControlGUI.sendUiPiano(d);
		}
		else if (d.type == "UI_ScriptButton") {
			setRectFill(rect);
		}
	}

	function UI_ListBoxDeselectOther(d)
	{

		for (var i = 0; i < d.parentGroup.nodes.length; i++)
		{
			if (d.parentGroup.nodes[i] != d)
			{
				d.parentGroup.nodes[i].selectedIndex = -1;
				d.parentGroup.nodes[i].dirty = true;
			}
		}
	}
	
	function uiObjectMouseUp(d, mouseX, mouseY, rect, mouse_still_down)
	{
		if (mouse_still_down == undefined)
		    RED.view.state = RED.state.UI_OBJECT_MOUSE_UP;
		
		//console.warn("uiObjectMouseUp " + mouseX + ":" + mouseY);
		if (d.type == "UI_Button") {
			if (d.bgColorChanged != undefined && d.bgColorChanged == true) {
				d.bgColorChanged = false;
				resetRectFill(rect, d.bgColor);
			}
			else
				resetRectFill(rect);
			if (d.sendMode == UI_BUTTON_SEND_MODES.ON_RELEASE || d.sendMode == UI_BUTTON_SEND_MODES.ON_BOTH)
				RED.ControlGUI.sendUiButton(false, d);
		}
		else if (d.type == "UI_Slider") {
			//if (d.sendMode == "r") // don' work at the moment
                RED.ControlGUI.sendUiSliderValue(d);
		}
		else if (d.type == "UI_ListBox") {
			//ui_listBoxMouseUp(d, rect);
			//resetRectFill(rect);
		}
		else if (d.type == "UI_Piano") {
			var newKeyIndex = rect.attr("keyIndex");
			if (newKeyIndex == undefined) {
				console.warn("piano title clicked");
				return; // this happenns when click title bar
			}
			d.keyIndex = parseInt(newKeyIndex);
            d.pressed = false;
			
			resetRectFill(rect);
			resetRectStroke(rect);
            
            RED.ControlGUI.sendUiPiano(d);
		}
		else if (d.type == "UI_ScriptButton") {
			resetRectFill(rect);
			eval(d.comment);
		}
	}
	function uiObjectMouseScroll(delta)
	{
		var d = currentUiObject;
		if (d.type == "UI_Button") {
			
		} else if (d.type == "UI_Slider") {
			if (delta > 0)
			{
				//console.log("uiObjectMouseScroll up");
				d.val += 1;
				if (d.val > d.maxVal) d.val = d.maxVal;
                if (d.divVal == undefined || d.divVal == "" || d.divVal == 0) d.divVal = 1;
                d.divVal = parseInt(d.divVal);
                d.fval = d.val/d.divVal;
                RED.ControlGUI.sendUiSliderValue(d);
				RED.view.redraw_node(d);
				//d.dirty = true;
				//RED.view.redraw_nodes(true);
                
			}
			else if (delta < 0)
			{
				//console.log("uiObjectMouseScroll down");
				d.val -= 1;
				if (d.val < d.minVal) d.val = d.minVal;
                if (d.divVal == undefined || d.divVal == "" || d.divVal == 0) d.divVal = 1;
                d.divVal = parseInt(d.divVal);
                d.fval = d.val/d.divVal;
                RED.ControlGUI.sendUiSliderValue(d);
				RED.view.redraw_node(d);
				//d.dirty = true;
				//RED.view.redraw_nodes(true);
                
			}
		}
	}
	function setRectFill(rect, setColor, initialColor)
	{
		//console.warn('rect.attr("fillOld")' + rect.attr("fillOld"));
		//console.warn('rect.attr("fill")' + rect.attr("fill"));

		if (rect.attr("fillOld") != undefined)
			rect.attr("fill", rect.attr("fillOld")); // failsafe
		rect.attr("fillOld", rect.attr("fill"));
		if (setColor == undefined) {
			if (initialColor == undefined)
				rect.attr("fill", RED.color.subtractColor(rect.attr("fill"), "#202020"));
			else
				rect.attr("fill", RED.color.subtractColor(initialColor, "#202020"));
		}
		else
			rect.attr("fill", setColor);
	}
	function resetRectFill(rect, resetColor)
	{
		if (resetColor != undefined)
			rect.attr("fill", resetColor);
		else if (rect.attr("fillOld") != undefined)
			rect.attr("fill", rect.attr("fillOld"));
	}
	function setRectStroke(rect, setColor)
	{
		//console.warn('rect.attr("fillOld")' + rect.attr("fillOld"));
		//console.warn('rect.attr("fill")' + rect.attr("fill"));

		if (rect.attr("strokeOld") != undefined)
			rect.attr("stroke", rect.attr("strokeOld")); // failsafe
		rect.attr("strokeOld", rect.attr("stroke"));
		if (setColor == undefined)
			rect.attr("stroke", RED.color.subtractColor(rect.attr("stroke"), "#202020"));
		else
			rect.attr("stroke", setColor);
	}
	function resetRectStroke(rect)
	{
		if (rect.attr("strokeOld") != undefined)
			rect.attr("stroke", rect.attr("strokeOld"));
	}
	function handleGroupAnchorNodes(init) {
		if (init == undefined) init = false;
		var mousedown_node = RED.view.mousedown_node;
		if (mousedown_node.type == "group" && RED.state.IsResizing(RED.view.state)) {
			if (init == true)
				console.log("last resize was:" + RED.state.ToName(RED.view.state));

			var centerBasedLocations = RED.view.settings.useCenterBasedPositions;
			var ResizeLeft = RED.state.IsResizingLeft(RED.view.state);
			var ResizeRight = RED.state.IsResizingRight(RED.view.state);
			var ResizeTop = RED.state.IsResizingTop(RED.view.state);
			var ResizeBottom = RED.state.IsResizingBottom(RED.view.state);

			// update all anchored items
			var grpNode = mousedown_node;
			for (var ni=0;ni<grpNode.nodes.length;ni++) {
				var node = grpNode.nodes[ni];
				if (node.anchor == undefined) continue;
				if (node.anchor == AnchorTypes.None) continue;
				
				if (ResizeTop && (node.anchor == AnchorTypes.Top)) {
					if (init == true) {
						node.oy = node.y;
					}
					else {
						node.y = node.oy + (mousedown_node_resize.h - mousedown_node.h);
						
						RED.view.redraw_node(node);
						RED.view.redraw_links();
					}
				}
				else if (ResizeBottom && (node.anchor == AnchorTypes.Bottom)) {
					if (init == true) {
						node.oy = node.y;
					}
					else {
						node.y = node.oy - (mousedown_node_resize.h - mousedown_node.h);
						
						RED.view.redraw_node(node);
						RED.view.redraw_links();
					}
				}
				else if (ResizeLeft && (node.anchor == AnchorTypes.Left)) {
					if (init == true) {
						node.ox = node.x;
					}
					else {
						node.x = node.ox + (mousedown_node_resize.w - mousedown_node.w);
						
						RED.view.redraw_node(node);
						RED.view.redraw_links();
					}
				}
				else if (ResizeRight && (node.anchor == AnchorTypes.Right)) {
					if (init == true) {
						node.ox = node.x;
					}
					else {
						node.x = node.ox - (mousedown_node_resize.w - mousedown_node.w);
						RED.view.redraw_node(node);
						RED.view.redraw_links();
					}
				}
			}
		}
	}
    function uiNodeResize_changedCheck() {
        var mousedown_node = RED.view.mousedown_node;
		var widthChanged = (mousedown_node_resize.w != mousedown_node.w);
		var heightChanged = (mousedown_node_resize.h != mousedown_node.h);
		var xPosChanged = (mousedown_node_resize.x != mousedown_node.x);
		var yPosChanged = (mousedown_node_resize.y != mousedown_node.y);
		
		
        return (widthChanged || heightChanged || xPosChanged || yPosChanged)
    }

    function uiNodeResize()
	{
        //console.warn("uiNodeResize");

        var mousedown_node = RED.view.mousedown_node;
		if (mousedown_node.locked != undefined && mousedown_node.locked == true) return; 
        var mouse_mode = RED.view.state;
        var posMode = RED.view.posMode;


		if (mouse_mode == RED.state.RESIZE_LEFT || mouse_mode == RED.state.RESIZE_TOP_LEFT || mouse_mode == RED.state.RESIZE_BOTTOM_LEFT) {
			var dx = mousedown_node_resize.ox - RED.view.mouse_position[0];
			mousedown_node.w = parseInt(mousedown_node_resize.w + dx);
			
			if (mousedown_node.w <= RED.view.node_def.width) mousedown_node.w = RED.view.node_def.width;
			else mousedown_node.x = mousedown_node_resize.x - dx/posMode;
			mousedown_node.dirty = true;
		} 
		if (mouse_mode == RED.state.RESIZE_RIGHT || mouse_mode == RED.state.RESIZE_TOP_RIGHT || mouse_mode == RED.state.RESIZE_BOTTOM_RIGHT) {
			var dx = mousedown_node_resize.ox - RED.view.mouse_position[0];
			mousedown_node.w = parseInt(mousedown_node_resize.w - dx);
			
			if (mousedown_node.w <= RED.view.node_def.width) mousedown_node.w = RED.view.node_def.width;
			else if (posMode === 2) mousedown_node.x = mousedown_node_resize.x - dx/2;
			mousedown_node.dirty = true;
		} 
		if (mouse_mode == RED.state.RESIZE_TOP || mouse_mode == RED.state.RESIZE_TOP_LEFT || mouse_mode == RED.state.RESIZE_TOP_RIGHT) {
			var dy = mousedown_node_resize.oy - RED.view.mouse_position[1];
			mousedown_node.h = parseInt(mousedown_node_resize.h + dy);
			
			if (mousedown_node.h <= RED.view.node_def.height) mousedown_node.h = RED.view.node_def.height;
			else mousedown_node.y = mousedown_node_resize.y - dy/posMode;
			mousedown_node.dirty = true;
		}
		if (mouse_mode == RED.state.RESIZE_BOTTOM || mouse_mode == RED.state.RESIZE_BOTTOM_LEFT || mouse_mode == RED.state.RESIZE_BOTTOM_RIGHT) {
			var dy = mousedown_node_resize.oy - RED.view.mouse_position[1];
			mousedown_node.h = parseInt(mousedown_node_resize.h - dy);
			
			if (mousedown_node.h <= RED.view.node_def.height) mousedown_node.h = RED.view.node_def.height;
			else if (posMode === 2) mousedown_node.y = parseInt(mousedown_node_resize.y - dy/2);
			mousedown_node.dirty = true;
		}
		handleGroupAnchorNodes();
		if (mousedown_node.type == "group") {
			RED.view.groupbox.RearrangeIONodes(mousedown_node, 0);
			RED.view.groupbox.RearrangeIONodes(mousedown_node, 1);
			RED.view.redraw_links();
		}
    }
    function redraw_init_UI_Textbox(mainRect,nodeRect, n)
    {
        mainRect.attr("fill",function(d) { return n._def.color;});
       var fo = nodeRect.append("foreignObject")
            .attr("width", n.w-4).attr("height", n.h)
            .attr("x", 3).attr("y", 3)

       var ta = fo.append("xhtml:textarea")
            .attr("class","settings-item-multilinetextInput")
            .attr("id", n.id + "_textArea")
            .attr("rows", 4).attr("cols", 100)
            .style("width", n.w-8 + "px").style("height", (n.h- 8) + "px")
            .on("mouseover", function(d,i) {if (RED.view.settings.guiEditMode == true){ /*nodeMouseOver(d,i);*/ return; } RED.keyboard.disable(); allowUiItemTextInput=true;})
            .on("mouseout", function(d,i) {if (RED.view.settings.guiEditMode == true){ /*nodeMouseOut(d,i);*/ return; }RED.keyboard.enable(); allowUiItemTextInput=false; })
           // .on("resize", function () {})
            .on("keyup", function(d,i) {
                if (RED.view.settings.guiEditMode == true) return;
                n.comment = this.value;
                //console.warn("changed by keyup");
            })
            .on("paste", function(d,i) {
                if (RED.view.settings.guiEditMode == true) return;
                n.comment = this.value;
                //console.warn("changed by paste");
            })
            .text(n.comment);

            $(ta).resizable({
                resize: function() {
                    console.error("textArea resize");
                    //$("body").append("<pre>resized!</pre>");
                }
            });

        var textAreaRect = nodeRect.append("rect")
            .attr("class", "ui_textbox_textarea")
            .attr("width", n.w).attr("height", n.h)
            .attr("x", 0).attr("y", 0)
            .attr("rx", 6).attr("ry", 6)
            .attr("fill", "rgba(255,255,255,0)")
			.on("mouseup", RED.view.nodeMouseUp)
			.on("mousedown",RED.view.nodeMouseDown)
			.on("mousemove", RED.view.nodeMouseMove)
			.on("mouseover", RED.view.nodeMouseOver)
            .on("mouseout", RED.view.nodeMouseOut)

        if (RED.view.settings.guiEditMode == true)
            $('.ui_textbox_textarea').css("pointer-events", "all");
		else
			$('.ui_textbox_textarea').css("pointer-events", "none");
    }

    function redraw_update_UI_TextBox(nodeRect, n)
    {
        nodeRect.selectAll(".node").attr("fill", n.bgColor);
        nodeRect.selectAll("foreignObject")
            .attr("width", n.w-4).attr("height", n.h)
        nodeRect.selectAll("textarea")
            .style("width", n.w-8 + "px").style("height", (n.h- 8) + "px").text(n.comment);
        nodeRect.selectAll(".ui-wrapper")
            .style("width", n.w-8 + "px").style("height", (n.h- 8) + "px");
        nodeRect.selectAll(".ui_textbox_textarea")
            .attr("width", n.w).attr("height", n.h)
    }

	function redraw_init_UI_Slider(mainRect,nodeRect)
	{
        mainRect.attr("fill",function(d) { return "#505050";});
		var sliderRect = nodeRect.append("rect")
			.attr("class", "slidernode")
			.attr("rx", 4)
			.attr("ry", 4)
			.on("mouseup",RED.view.nodeMouseUp)
			.on("mousedown",RED.view.nodeMouseDown)
			.on("mousemove", RED.view.nodeMouseMove)
			.on("mouseover", RED.view.nodeMouseOver)
			.on("mouseout", RED.view.nodeMouseOut)
			.attr("fill",function(d) { return d._def.color;})

		var sliderValueLabel = nodeRect.append("text")
			.attr("class", "slider_value_label")
			.attr("text-anchor", "start")
			.attr("dy", "0.35em");
	}
    function UI_slider_sanitate_values(d) {
        if (d.divVal == undefined || d.divVal == "" || d.divVal == 0) d.divVal = 1;
        d.divVal = parseInt(d.divVal);
        d.fval = d.val/d.divVal;
        
        d.maxVal = parseInt(d.maxVal);
        d.minVal = parseInt(d.minVal);
        d.val = parseInt(d.val);
        
        if (d.val < d.minVal) d.val = d.minVal;
        if (d.val > d.maxVal) d.val = d.maxVal;
    }
    function UI_slider_calc_pos_multipler(d) {
        return ((d.val - d.minVal) / (d.maxVal - d.minVal));
    }
	function redraw_update_UI_Slider(nodeRect, d)
	{
		//console.warn("UI_Slider was dirty")
		nodeRect.selectAll(".node").attr("fill", d.bgColor);

		nodeRect.selectAll(".slidernode")
			.attr("fill", d.barFGcolor)
			.attr("x", function(d) {
				if (d.orientation == "v") return 0; 
				else if (d.orientation == "h") return 0;
			})
			.attr("y", function(d) {
				UI_slider_sanitate_values(d);
				if (d.orientation == "v") return d.h - UI_slider_calc_pos_multipler(d) * d.h ;
				else if (d.orientation == "h") return 0;
			})
			.attr("width", function(d) {
				UI_slider_sanitate_values(d);
				if (d.orientation == "v") return d.w;
				else if (d.orientation == "h") return UI_slider_calc_pos_multipler(d) * d.w;
			})
			.attr("height", function(d) {
				UI_slider_sanitate_values(d);
				if (d.orientation == "v") return  UI_slider_calc_pos_multipler(d) * d.h;
				else if (d.orientation == "h") return d.h;
			});
		nodeRect.selectAll('text.slider_value_label').each(function(d,i) {
				var ti = d3.select(this);
				
				

				var nodeText = d.label ? d.label : "";
				if (nodeText == "") 
				if (nodeText.includes("#")) nodeText = nodeText.replace("#", "d.val");
				try{nodeText = new String(eval(nodeText)); }
				catch (e) { 
					//nodeText = d.label;
				}
				ti.text(nodeText);
			

				var textSize = RED.view.calculateTextSize(nodeText,d.textSize)
				ti.attr('x', (d.w-textSize.w)/2);
				ti.attr('y', (d.h+textSize.h));

		});

	}
	function redraw_init_UI_ListBox(nodeRect,n)
	{
		var items = n.items.split("\n");

		nodeRect.selectAll(".ui_listBox_item").remove();
		nodeRect.selectAll(".node_label_uiListBoxItem").remove();
		n.itemsTextDimensions = [];

		for ( var i = 0; i < items.length; i++)
		{
			var item = nodeRect.append("rect")
				.attr("class", "ui_listBox_item")
				.attr("rx", 6)
				.attr("ry", 6)
				.attr("listItemIndex", i)
				.attr("selected", false)
				.on("mouseup",  RED.view.nodeMouseUp) //function (d) { nodeMouseUp(d); d.selectedIndex = i; })
				.on("mousedown", RED.view.nodeMouseDown) // function (d) { nodeMouseDown(d); d.selectedIndex = i; })
				.on("mousemove", RED.view.nodeMouseMove)
				.on("mouseover", RED.view.nodeMouseOver)
				.on("mouseout", RED.view.nodeMouseOut)
				.attr("fill",function(d) { return d.bgColor;});

			var itemText = nodeRect.append("text")
			//.attr("contentEditable", true)
				.attr("class", "node_label_uiListBoxItem")
				.attr("text-anchor", "start")
				.attr("dy", "0.35em")
				.text(items[i]);
			if (n.itemTextSize == undefined) n.itemTextSize = 14;
			n.itemsTextDimensions.push(RED.view.calculateTextSize(items[i], n.itemTextSize));
		}
	}
	function redraw_update_UI_ListBox(d)
	{
        

		if (d.itemCountChanged != undefined && d.itemCountChanged == true)
		{
			d.itemCountChanged = false;
			redraw_init_UI_ListBox(d.svgRect, d);
		}
		var updateTextDimensions = false;
		if (d.anyItemChanged != undefined && d.anyItemChanged == true)
		{
			d.anyItemChanged = false;
			updateTextDimensions = true;
		}

		var items = d.items.split("\n");
        
		d.headerHeight = parseInt(d.headerHeight)
		var itemHeight = (d.h-d.headerHeight-4) / (items.length);
		d.svgRect.selectAll(".node").attr("height", d.h+4)
								.attr("fill", d.bgColor);

		d.svgRect.selectAll('.ui_listBox_item').each(function(d,i) {

			var li = d3.select(this);
			li.attr('y', ((i)*itemHeight + d.headerHeight));
			li.attr("width", d.w-8);
			li.attr("x", 4);
            if (itemHeight < 0){
                console.log("what the motherfuck", d);
            }

			li.attr("height", itemHeight);
            
            
			if (d.selectedIndex == i)
				li.attr("fill", RED.color.subtractColor(d.itemBGcolor, "#303030"));
			else
				li.attr("fill", d.itemBGcolor);
                
		});

		d.svgRect.selectAll('text.node_label_uiListBoxItem').each(function(d,i) {
			var ti = d3.select(this);
			if (updateTextDimensions)
			{
				d.itemsTextDimensions[i] = RED.view.calculateTextSize(items[i], d.itemTextSize);
				if (d.itemTextSize != undefined)
					ti.style({'font-size':d.itemTextSize+'px'});
			}
			var textDimension = d.itemsTextDimensions[i];
			ti.attr('x', (d.w-textDimension.w)/2);
			ti.attr('y', ((i)*itemHeight+itemHeight/2 + d.headerHeight));
			
			ti.text(items[i]);
		});
		updateTextDimensions = false;
	}
	function redraw_init_UI_Piano(nodeRect,n)
	{
		nodeRect.selectAll(".ui_piano_item").remove();
		nodeRect.selectAll(".node_label_uiPianoKey").remove();
		var keyTexts =     ['C','D','E','F','G','A','B','C#','D#','F#','G#','A#'];
		var keyIndex = [0  ,2  ,4  ,5  ,7  ,9  ,11 ,1   ,3   ,6   ,8   ,10];
		n.keysTextDimensions = [];
		for ( var i = 0; i < 12; i++)
		{
			var keyRect = nodeRect.append("rect")
				.attr("class", "ui_piano_item")
				.attr("keyIndex", keyIndex[i])
				.attr("selected", false)
				.on("mouseup",  RED.view.nodeMouseUp) //function (d) { nodeMouseUp(d); d.selectedIndex = i; })
				.on("mousedown", RED.view.nodeMouseDown) // function (d) { nodeMouseDown(d); d.selectedIndex = i; })
				.on("mousemove", RED.view.nodeMouseMove)
				.on("mouseover", RED.view.nodeMouseOver)
				.on("mouseout", RED.view.nodeMouseOut)
				.attr("fill",function(d) { return d.bgColor;});

			if (i < 7)
				keyRect.attr("rx", 2).attr("ry", 2); // white keys corner roundness
			else
				keyRect.attr("rx", 1).attr("ry", 1); // black keys corner roundness

			var itemText = nodeRect.append("text")
				.attr("text-anchor", "start")
				.attr("dy", "0.35em")
				.text(keyTexts[i]);
			if (i < 7)
				itemText.attr("class", "node_label_uiPianoKey node_label_uiPianoKeyWhite");
			else
				itemText.attr("class", "node_label_uiPianoKey node_label_uiPianoKeyBlack");
			if (n.textSize == undefined) n.textSize = 14;
			n.keysTextDimensions.push(RED.view.calculateTextSize(keyTexts[i],n.textSize));
		}
	}
	function redraw_update_UI_Piano(nodeRect, d)
	{
		//d.headerHeight = 30;//parseInt(d.headerHeight)
		//d.whiteKeysColor = "#FFFFFF";
		//d.blackKeysColor = "#A0A0A0";
		var keyTexts = ['C','D','E','F','G','A','B','C#','D#','F#','G#','A#'];
		var keyWidth = d.w/7-1;
		var whiteKeyHeight = (d.h - d.headerHeight);
		var blackKeyHeight = (whiteKeyHeight * 0.55);
		nodeRect.selectAll('.node').attr("height", d.headerHeight+8)//d.h+4)
								   .attr("width", d.w-4)
								   .attr("x", 2)
								   .attr("fill", d.bgColor)
								   .attr("stroke-width", "1px");

		nodeRect.selectAll('.ui_piano_item').each(function(d,i) {
			var li = d3.select(this);
			li.attr('y', d.headerHeight);
			li.attr("stroke-width", "1px");

			if (i <= 6)
			{
				li.attr("x", i*keyWidth + i + 0.5);
				li.attr("height", whiteKeyHeight);
				li.attr("fill", d.whiteKeysColor);
				li.attr("stroke", RED.color.subtractColor(d.whiteKeysColor, "#303030"));
				li.attr("width", keyWidth);
			}
			else if (i >= 7 && i <= 8)
			{
				li.attr("x", (i-7)*keyWidth + keyWidth/2 + d.blackKeysWidthDiff/2 + (i-7)+ 1 );
				li.attr("height", blackKeyHeight);
				li.attr("fill", d.blackKeysColor);
				li.attr("stroke", d.blackKeysColor);
				li.attr("width", keyWidth-d.blackKeysWidthDiff);
			}
			else if (i >= 9)
			{
				li.attr("x", (i-6)*keyWidth + keyWidth/2 + d.blackKeysWidthDiff/2 + (i-6)+ 1 );
				li.attr("height", blackKeyHeight);
				li.attr("fill", d.blackKeysColor);
				li.attr("stroke", d.blackKeysColor);
				li.attr("width", keyWidth-d.blackKeysWidthDiff);
			}
			
		});

		nodeRect.selectAll('text.node_label_uiPianoKey').each(function(d,i) {
			var ti = d3.select(this);
			if (i <= 6)
			{
				if (d.whiteKeyLabelsVisible != undefined)
				{
					if (d.whiteKeyLabelsVisible == true)
					{
						ti.attr("visibility", "visible");
						ti.attr('x', i*keyWidth + ((keyWidth-d.keysTextDimensions[i].w)/2) + i + 0.5);
						ti.attr('y', d.headerHeight + whiteKeyHeight - 15);
					}
					else
						ti.attr("visibility", "hidden");
				}
			}
			else if (i >= 7 && i <= 8)
			{
				if (d.blackKeyLabelsVisible != undefined)
				{
					if (d.blackKeyLabelsVisible == true)
					{
						ti.attr("visibility", "visible");
						ti.attr('x', (i-7)*keyWidth + ((keyWidth-d.keysTextDimensions[i].w)/2)+keyWidth/2 + (i-7)+ 0.5 );
						ti.attr('y', d.headerHeight + blackKeyHeight/2 + 3);
					}
					else
						ti.attr("visibility", "hidden");
				}
				
			}
			else if (i >= 9)
			{
				if (d.blackKeyLabelsVisible != undefined)
				{
					if (d.blackKeyLabelsVisible == true)
					{
						ti.attr("visibility", "visible");
						ti.attr('x', (i-6)*keyWidth + ((keyWidth-d.keysTextDimensions[i].w)/2)+keyWidth/2 + (i-6)+ 0.5 );
						ti.attr('y', d.headerHeight + blackKeyHeight/2 + 3);
					}
					else
						ti.attr("visibility", "hidden");
				}
			}
			ti.text(keyTexts[i]);
		});
	}

    function redraw_init_UI_Image(mainRect,nodeRect, n)
    {
        mainRect.attr("fill",function(d) { return n._def.color;});
       var fo = nodeRect.append("foreignObject")
            //.attr("width", n.w-4).attr("height", n.h)
            .attr("x", 5).attr("y", 5)

       var ta = fo.append("xhtml:canvas")
			.on("mouseup", RED.view.nodeMouseUp)
			.on("mousedown",RED.view.nodeMouseDown)
			.on("mousemove", RED.view.nodeMouseMove)
			.on("mouseover", RED.view.nodeMouseOver)
            .on("mouseout", RED.view.nodeMouseOut);
    }
    
    function redraw_update_UI_Image(nodeRect, n)
    {
        nodeRect.selectAll(".node").attr("fill", n.bgColor);
        var scale = 1;
        var xscale = (n.w-10)/n.imageWidth;
        var yscale = (n.h-10)/n.imageHeight;
        if (xscale < yscale) scale = xscale;
        else scale = yscale;

        nodeRect.select("foreignObject")
            .attr("width", n.imageWidth).attr("height", n.imageHeight)
            .attr("transform", "scale("+scale+")")
            .attr("x", 5/scale).attr("y", 5/scale)
        nodeRect.select("canvas")
            .attr("width", n.imageWidth).attr("height", n.imageHeight)
        if (n.imageRawData != undefined)
            drawImageData(n, n.imageRawData);
        else
        {
            drawImageData(n, generateEmptyImageData(n.imageWidth*n.imageHeight, {r:0,g:0,b:0}));
        }
        //nodeRect.selectAll(".ui-wrapper")
        //    .style("width", n.w-8 + "px").style("height", (n.h- 8) + "px");
    }

    function generateEmptyImageData(pixelCount, defaultColor)
    { 
        var data = [];
        for (var i=0;i<pixelCount;i++)
        {
            data.push(defaultColor.r);
            data.push(defaultColor.g);
            data.push(defaultColor.b);
        }
        return data;
    }

    function uiNodeResizeMouseDown(d,_this) {
		console.log("uiNodeResizeMouseDown");

        mousedown_node_resize.w = d.w;
        mousedown_node_resize.h = d.h;
        mousedown_node_resize.x = d.x;
        mousedown_node_resize.y = d.y;
        var mouse_position = RED.view.mouse_position;
        mousedown_node_resize.ox = mouse_position[0];
        mousedown_node_resize.oy = mouse_position[1];
        //console.log("mousedown_node_old.w:" + mousedown_node_old.w +
        //", mousedown_node_old.h:" + mousedown_node_old.h +
        //", mousedown_node_resize.ox:" + mousedown_node_resize.ox +
        //", mousedown_node_resize.oy:" + mousedown_node_resize.oy);
		
        //var nodeRect = d3.select(this);
        var mousePos = d3.mouse(_this)
        var x = mousePos[0];
        var y = mousePos[1];
        var mouse_mode = RED.state.MOVING;

        if ((y > uiItemResizeBorderSize) && (y < (d.h-uiItemResizeBorderSize))) // width resize
        {
            if (x < uiItemResizeBorderSize)
                mouse_mode = RED.state.RESIZE_LEFT;
            else if (x > (d.w-uiItemResizeBorderSize))
                mouse_mode = RED.state.RESIZE_RIGHT;
            else
                mouse_mode = RED.state.MOVING; 
        }
        else if ((x > uiItemResizeBorderSize) && (x < (d.w-uiItemResizeBorderSize)))
        {
            if (y < uiItemResizeBorderSize)
                mouse_mode = RED.state.RESIZE_TOP;
            else if (y > (d.h-uiItemResizeBorderSize))
                mouse_mode = RED.state.RESIZE_BOTTOM;
            else
                mouse_mode = RED.state.MOVING;
        }
        else if ((x < uiItemResizeBorderSize) && (y < uiItemResizeBorderSize)) // top left resize
        {
            mouse_mode = RED.state.RESIZE_TOP_LEFT;
        }
        else if ((x < uiItemResizeBorderSize) && (y>(d.h-uiItemResizeBorderSize))) // bottom left resize
        {
            mouse_mode = RED.state.RESIZE_BOTTOM_LEFT;
        }
        else if ((y < uiItemResizeBorderSize) && (x>(d.w-uiItemResizeBorderSize))) // top right resize
        {
            mouse_mode = RED.state.RESIZE_TOP_RIGHT;
        }
        else if ((y > (d.h-uiItemResizeBorderSize)) && (x > (d.w-uiItemResizeBorderSize))) // bottom right resize
        {
            mouse_mode = RED.state.RESIZE_BOTTOM_RIGHT;
        }
        //else // default above is moving
        //    RED.view.set_mouse_mode(RED.state.MOVING);
        RED.view.state = mouse_mode;
        //console.log("resize mouse_mode:" + mouse_mode);
		handleGroupAnchorNodes(true);
    }

    function checkIf_UI_AndInit(d,mainRect,nodeRect)
    {
        if (d.type == "UI_Slider"){ redraw_init_UI_Slider(mainRect,nodeRect); }
        else if (d.type == "UI_ListBox"){ redraw_init_UI_ListBox(nodeRect,d); }
        else if (d.type == "UI_Piano"){ redraw_init_UI_Piano(nodeRect,d); }
        else if (d.type == "UI_TextBox"){ redraw_init_UI_Textbox(mainRect,nodeRect,d); }
        else if (d.type == "UI_Image") { redraw_init_UI_Image(mainRect,nodeRect,d);}
		
        else { return false; }
        return true; // default for ui objects
    }
    function checkIf_UI_AndUpdate(nodeRect,d) {
        if (d.type == "UI_Slider") { redraw_update_UI_Slider(nodeRect,d); }
        else if (d.type == "UI_ListBox") { redraw_update_UI_ListBox(d); }
        else if (d.type == "UI_Piano") { redraw_update_UI_Piano(nodeRect,d); }
        else if (d.type == "UI_TextBox") { redraw_update_UI_TextBox(nodeRect,d); }
        else if (d.type == "UI_Image") { redraw_update_UI_Image(nodeRect,d); } // only for resizing
		else if (d.type == "group") { RED.view.groupbox.redrawGroupOutline(d);}
        else { return false; }
        return true; // default for ui objects
    }

    function arrayBufferToBase64( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );

    }

    function drawImageData(node, data)
    {
        node.imageRawData = data;
        //var n =  RED.nodes.namedNode(nodeName);

        var canvas = node.svgRect.select("canvas").node();
        var width = parseInt(node.imageWidth);
        var height = parseInt(node.imageHeight)

        var ctx = canvas.getContext("2d");
        
        var imageData = ctx.createImageData(width, height);
        
        var pixels = data.length/3;

        //console.log("Rx PixelCount:" + pixels + ", wanted:" + (imageData.data.length/4))
        
        for (var i = 0; i < pixels; i++) {
            imageData.data[4 * i] = data[3 * i];
            imageData.data[4 * i + 1] = data[3 * i + 1];
            imageData.data[4 * i + 2] = data[3 * i + 2];
            imageData.data[4 * i + 3] = 255; // non transparent
        }
        
        
        //var b64encoded = arrayBufferToBase64(imageData.data);
        //console.log(b64encoded);
        ctx.putImageData(imageData,0,0);
    }

    return {
        get allowUiItemTextInput() {return allowUiItemTextInput;},
        uiNodeResizeMouseDown,
        uiNodeResize,
        uiNodeResize_changedCheck,


        uiObjectMouseScroll,
        uiObjectMouseOver,
        uiObjectMouseOut,
        uiObjectMouseMove,
        uiObjectMouseDown,
        uiObjectMouseUp,

        nodeMouseMove,
        checkIf_UI_AndInit,
        checkIf_UI_AndUpdate,
        currentUiObject:function() {return currentUiObject;},
        get_uiItemResizeBorderSize:function() { return uiItemResizeBorderSize;},

        drawImageData
    };
})();