/** Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013, 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


RED.view = (function() {
	var redrawTotalTime = 0.0;
	var redrawCount = 0;

	var posMode = 2; // position mode (1 = topLeft, 2 = center)

	var activeGroups = [];
	var currentHoveredGroup = undefined; // used to select the current hovered group
	var lastHoveredGroup = undefined; // this contains the last hovered group so that a node can be moved outside a group

	var anyLinkEnter = false;
	var anyNodeEnter = false;

	var _settings = {
		showWorkspaceToolbar: true,
		showNodeToolTip:true,
		guiEditMode: true,
		lockWindowMouseScrollInRunMode: true,
		space_width: 5000,
		space_height: 5000,
		workspaceBgColor: "#FFF",
		scaleFactor: 1,	
		showGridHminor: true,
		showGridHmajor: true,
		showGridVminor: true,
		showGridVmajor: true,
		nodeMouseDownShowGridHminor: false,
		nodeMouseDownShowGridHmajor: true,
		nodeMouseDownShowGridVminor: false,
		nodeMouseDownShowGridVmajor: true,
		gridHminorSize: 10,
		gridHmajorSize: 100,
		gridVminorSize: 10,
		gridVmajorSize: 100,
		gridMinorColor: "#eee",
		gridMajorColor: "#ddd",
		snapToGrid: true, // this is allready implemented with shift button, this locks that mode
	    snapToGridHsize: 5,
	    snapToGridVsize: 5,
		lineCurveScale: 0.75,
		lineConnectionsScale: 1.5,
		useCenterBasedPositions: true // default back compatible
	};
	var uiItemResizeBorderSize= 6;

	var settings = {
		get showWorkspaceToolbar() { return _settings.showWorkspaceToolbar; },
		set showWorkspaceToolbar(state) { _settings.showWorkspaceToolbar = state; setShowWorkspaceToolbarVisible(state); },

		get showNodeToolTip() { return _settings.showNodeToolTip; },
		set showNodeToolTip(value) { _settings.showNodeToolTip = value; },

		get guiEditMode() { return _settings.guiEditMode; },
		set guiEditMode(state) { _settings.guiEditMode = state; $('#' + settingsEditor.otherSubCat.items.guiEditMode.valueId).prop('checked', state); },

		get lockWindowMouseScrollInRunMode() { return _settings.lockWindowMouseScrollInRunMode; },
		set lockWindowMouseScrollInRunMode(value) { _settings.lockWindowMouseScrollInRunMode = value; },

		get space_width() { return parseInt(_settings.space_width); },
		set space_width(value) { _settings.space_width = value; initWorkspace(); initGrid(); },

		get space_height() { return parseInt(_settings.space_height); },
		set space_height(value) { _settings.space_height = value; initWorkspace(); initGrid(); },

		get workspaceBgColor() { return _settings.workspaceBgColor; },
		set workspaceBgColor(value) { _settings.workspaceBgColor = value; initWorkspace(); },

		get scaleFactor() { return parseFloat(_settings.scaleFactor); },
		set scaleFactor(value) { value = parseFloat(value);
								 _settings.scaleFactor = value.toFixed(2);
								 $("#btn-zoom-zero").text(value.toFixed(2));
								 $("#" + settingsEditor.otherSubCat.items.scaleFactor.valueId).val(value.toFixed(2));
								 redraw(true);
								 redraw_links_init();
								 redraw_links(); },

		get showGridHminor() { return _settings.showGridHminor; },
		set showGridHminor(state) { _settings.showGridHminor = state; showHideGridHminor(state); },

		get showGridHmajor() { return _settings.showGridHmajor; },
		set showGridHmajor(state) { _settings.showGridHmajor = state; showHideGridHmajor(state); },

		get showGridVminor() { return _settings.showGridVminor; },
		set showGridVminor(state) { _settings.showGridVminor = state; showHideGridVminor(state); },

		get showGridVmajor() { return _settings.showGridVmajor; },
		set showGridVmajor(state) { _settings.showGridVmajor = state; showHideGridVmajor(state); },

		get nodeMouseDownShowGridHminor() { return _settings.nodeMouseDownShowGridHminor; },
		set nodeMouseDownShowGridHminor(state) { _settings.nodeMouseDownShowGridHminor = state; },

		get nodeMouseDownShowGridHmajor() { return _settings.nodeMouseDownShowGridHmajor; },
		set nodeMouseDownShowGridHmajor(state) { _settings.nodeMouseDownShowGridHmajor = state; },

		get nodeMouseDownShowGridVminor() { return _settings.nodeMouseDownShowGridVminor; },
		set nodeMouseDownShowGridVminor(state) { _settings.nodeMouseDownShowGridVminor = state; },

		get nodeMouseDownShowGridVmajor() { return _settings.nodeMouseDownShowGridVmajor; },
		set nodeMouseDownShowGridVmajor(state) { _settings.nodeMouseDownShowGridVmajor = state; },

		get gridHminorSize() { return parseInt(_settings.gridHminorSize); },
		set gridHminorSize(value) { _settings.gridHminorSize = value; initHminorGrid(); },

		get gridHmajorSize() { return parseInt(_settings.gridHmajorSize); },
		set gridHmajorSize(value) { _settings.gridHmajorSize = value; initHmajorGrid(); },

		get gridVminorSize() { return parseInt(_settings.gridVminorSize); },
		set gridVminorSize(value) { _settings.gridVminorSize = value; initVminorGrid(); },

		get gridVmajorSize() { return parseInt(_settings.gridVmajorSize); },
		set gridVmajorSize(value) { _settings.gridVmajorSize = value; initVmajorGrid(); },

		get gridMinorColor() { return _settings.gridMinorColor; },
		set gridMinorColor(value) { _settings.gridMinorColor = value; setMinorGridColor(); },

		get gridMajorColor() { return _settings.gridMajorColor; },
		set gridMajorColor(value) { _settings.gridMajorColor = value; setMajorGridColor(); },

		get snapToGrid() { return _settings.snapToGrid; },
		set snapToGrid(state) { _settings.snapToGrid = state; },

		get snapToGridHsize() { return parseInt(_settings.snapToGridHsize); },
		set snapToGridHsize(value) { _settings.snapToGridHsize = value; },

		get snapToGridVsize() { return parseInt(_settings.snapToGridVsize); },
		set snapToGridVsize(value) { _settings.snapToGridVsize = value; },

		get lineCurveScale() { return parseFloat(_settings.lineCurveScale);},
		set lineCurveScale(value) { value = parseFloat(value);
									if (value < 0.01) value = 0.01;
									_settings.lineCurveScale = value;
									$("#" + settingsEditor.lineCurveSubCat.items.lineCurveScale.valueId).val(value.toFixed(2));
									anyLinkEnter=true; redraw_links(); },

		get lineConnectionsScale() { return parseFloat(_settings.lineConnectionsScale);},
		set lineConnectionsScale(value) { value = parseFloat(value); 
										  if (value < 0.01) value = 0.01;
										  _settings.lineConnectionsScale = value;
										  $("#" + settingsEditor.lineCurveSubCat.items.lineConnectionsScale.valueId).val(value.toFixed(2));
										  anyLinkEnter=true; redraw_links(); },

		get useCenterBasedPositions() { return _settings.useCenterBasedPositions;},
		set useCenterBasedPositions(value) { _settings.useCenterBasedPositions = value; if (value == true) posMode = 2; else posMode = 1; completeRedraw();},
	};

	var settingsCategory = { Title:"Workspace", Expanded:false };

	var settingsEditor = {
		gridSubCat: {label:"Grid", expanded:false, popupText: "Change workspace grid appearence.", 
			items: {
				gridNodeMoveShowSubCat: {label:"Node Move Show", expanded:false, popupText: "if grid is not visible enabling each here makes the grid visible when moving a node.<br><br>note. showing the minor grid can be sluggish specially when the gridsize is small and the workspace big.", 
					items: {
						nodeMouseDownShowGridHminor: {label:"Show minor h-grid.", type:"boolean"},
						nodeMouseDownShowGridHmajor: {label:"Show major h-grid.", type:"boolean"},
						nodeMouseDownShowGridVminor: {label:"Show minor v-grid.", type:"boolean"},
						nodeMouseDownShowGridVmajor: {label:"Show major v-grid.", type:"boolean"},
					}
				},
				gridShowHideSubCat: {label:"Show/Hide", expanded:false,
					items: {
						showGridHminor: {label:"Show minor h-grid.", type:"boolean"},
						showGridHmajor: {label:"Show major h-grid.", type:"boolean"},
						showGridVminor: {label:"Show minor v-grid.", type:"boolean"},
						showGridVmajor: {label:"Show major v-grid.", type:"boolean"},
					}
				},
				gridColorsSubCat: {label:"Colors", expanded:false,
					items: {	
						gridMinorColor: {label:"Minor grid color.", type:"color"},
						gridMajorColor: {label:"Major grid color.", type:"color"},
					}
				},
				gridSizesSubCat: {label:"Sizes", expanded:false,
					items: {
						gridHminorSize: {label:"Minor h-grid Size.", type:"number"},
						gridHmajorSize: {label:"Major h-grid Size.", type:"number"},
						gridVminorSize: {label:"Minor v-grid Size.", type:"number"},
						gridVmajorSize: {label:"Major v-grid Size.", type:"number", popupText:"This also affects the export sorting of nodes<br> that means nodes are first sorted by xpos<br>then in each v-grid-column they are sorted by ypos.<br><br>note. that when using non center-based positioning the sorting is using the node topLeft position instead of the center"},
					}
				},
				gridSnapSubCat: {label:"Snap", expanded:false,
					items: {
						snapToGrid: {label:"Snap to grid.", type:"boolean", popupText:"Enables/Disables snap node positions to grid<br><br>When this is enabled the snapping can be temporary disabled by holding the shift-key<br><br>When this is disabled the snapping can be temporary enabled by holding the shift-key"},
						snapToGridHsize: {label:"Snap to grid h-size.", type:"number"},
						snapToGridVsize: {label:"Snap to grid v-size.", type:"number"},
					}
				},
			}
		},
		wsSizeSubCat: {label:"Workspace size", expanded:false, popupText: "Change the workspace size<br>This can be used to make a bigger or smaller workspace area.<br>Note when changing the size it can be a little sluggish, and sometimes the space is not updated<br> that is fixed by zooming out/in.", 
			items: {
				space_width:  {label:"Width.", type:"number"},
				space_height:  {label:"Height.", type:"number"},
			}
		},
		lineCurveSubCat: {label:"Line Curve Scales", expanded:false, popupText: "adjust the different line curve scales, smaller values means that lines are more straight,<br> and bigger values means more curvy lines.<br>note. this cannot be set to zero.", 
			items: {
				lineCurveScale: {label:"Forward", type:"number", popupText: "curve scale of wires going forward"},
				lineConnectionsScale: {label:"Backward", type:"number", valueId:"", popupText: "curve scale of wires going backward"},
			}
		},
		otherSubCat: {label:"Other", expanded:false,
			items: {
				workspaceBgColor:  {label:"BG color.", type:"color"},
				scaleFactor:  {label:"Workspace Zoom.", type:"number", valueId:"", popupText: "fine adjust of the current zoomlevel"},
				showWorkspaceToolbar:  {label:"Show toolbar.", type:"boolean"},
				showNodeToolTip:  {label:"Show Node Tooltip Popup.", type:"boolean"},
				guiEditMode:  {label:"GUI edit mode.", type:"boolean", valueId:""},
				lockWindowMouseScrollInRunMode:  {label:"Lock Window MouseScroll In Run Mode", type:"boolean", popupText: "when enabled and in GUI run mode<br>this locks the default window scroll,<br> when enabled it makes it easier to scroll on sliders."},
				useCenterBasedPositions: {label:"Center Based Positions", type:"boolean", popupText: "Center bases positions is the default mode of 'Node-Red' and this tool.<br><br>When this is unchecked everything is drawn from that previous center point and it's using the top-left corner as the object position reference,<br><br>that makes everything jump when switching between modes.<br><br> (the jumping will be fixed in a future release)"},
			}
		}
	}

	function setMinorGridColor()
	{
		var color = settings.gridMinorColor;
		$("#grid-h-mi").find(".horizontal").each( function(i,e) { $(e).attr("stroke", color); });
		$("#grid-v-mi").find(".vertical").each( function(i,e) { $(e).attr("stroke", color); });
	}
	function setMajorGridColor()
	{
		var color = settings.gridMajorColor;
		$("#grid-h-ma").find(".horizontal").each( function(i,e) { $(e).attr("stroke", color); });
		$("#grid-v-ma").find(".vertical").each( function(i,e) { $(e).attr("stroke", color); });
	}
	function setWorkspaceBgColor()
	{
		outer_background.attr('fill',_settings.bgColor);
	}

	/*var space_width = 5000,
		space_height = 5000,
		gridVmajorSize = 100,
		gridVminorSize = 10,
		gridHminorSize = 10,
		scaleFactor = 1,*/
	var maxZoomFactor = 3.0;
	var node_def = {
		width: 30, // minimum default
		height: 34, // minimum default
		pin_rx: 2, // The horizontal corner radius of the rect.
		pin_ry: 2, // The vertical corner radius of the rect.
		pin_xsize: 10,
		pin_ysize: 10,
		pin_xpos: -5,
		pin_ypadding: 3,
		pin_yspaceToEdge: 4,

		get pin_ydistance() { return this.pin_ysize + this.pin_ypadding; }
	};
	

	var touchLongPressTimeout = 1000,
		startTouchDistance = 0,
		startTouchCenter = [],
		moveTouchCenter = [],
		touchStartTime = 0;

	var activeWorkspace = 0;
	var workspaceScrollPositions = {};

	var selected_link = null,
		currentUiObject = null,
		//currentUiObjectMouseX = 0,
		//currentUiObjectMouseY = 0,
		mousedown_link = null,
		mousedown_node = null,
		mousedown_node_w = 0,
		mousedown_node_h = 0,
		mousedown_node_x = 0,
		mousedown_node_y = 0,
		mousedown_port_type = null,
		mousedown_port_index = 0,
		mouseup_node = null,
		mouse_offset = [0,0],
		mouse_offset_resize_x = 0,
		mouse_offset_resize_y = 0,
		mouse_position = null,
		mouse_mode = 0,
		moving_set = [], // the data type of this is a rect
		current_popup_rect = null,
		dirty = false,
		lasso = null,
		showStatus = false,
		lastClickNode = null,
		dblClickPrimed = null,
		clickTime = 0,
		clickElapsed = 0;

	var clipboard = "";

	var status_colours = {
		"red":    "#c00",
		"green":  "#5a8",
		"yellow": "#F9DF31",
		"blue":   "#53A3F3",
		"grey":   "#d3d3d3"
	};

	var outer = d3.select("#chart")
		.append("svg:svg")
		.attr("class", "ws-chart-outer")
		.attr("width", settings.space_width)
		.attr("height", settings.space_height)
		.attr("pointer-events", "all")
		.style("cursor","crosshair");

	 var vis = outer
		.append('svg:g')
		.attr("class", "ws-chart-vis")
		.on("dblclick.zoom", null)
		.append('svg:g')
		.attr("class", "ws-chart-vis-transform")
		.on("mousemove", canvasMouseMove)
		.on("mousedown", canvasMouseDown)
		.on("mouseup", canvasMouseUp)
		.on("touchend", canvasTouchEnd)
		.on("touchcancel", canvasMouseUp)
		.on("touchstart", canvasTouchStart)
		.on("touchmove", canvasTouchMove);
	
	var outer_background = vis.append('svg:rect').attr("class", "ws-chart-outer-background");

	var gridScale = d3.scale.linear().range([0,1000]).domain([0,1000]);
	//var gridScaleTicks = gridScale.ticks(50); // this returns a array with the spacing ex:
	//0,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200,2300,2400,2500,2600,2700,2800,2900,3000,3100,3200,3300,3400,3500,3600,3700,3800,3900,4000,4100,4200,4300,4400,4500,4600,4700,4800,4900,5000
	
	var grid = vis.append('g').attr("class", "ws-chart-grid").attr("style", "visibility: visble;");

	// minors gets rendered first
	var gridHminor = grid.append('g').attr({
		"id":"grid-h-mi",
		"style":"display:none;"
		});
	
	var gridVminor = grid.append('g').attr({ 
		"id":"grid-v-mi",
		"style":"display:none;"
	});
    // major then gets rendered over the minors
	var gridHmajor = grid.append('g').attr({
		"id":"grid-h-ma",
		"style":"display:none;"
		});
	var gridVmajor = grid.append('g').attr({ 
		"id":"grid-v-ma",
		"style":"display:none;"
		});

	var visGroups = vis.append('g').attr("class", "workspace-chart-groups");

	var visLinks = vis.append('g').attr("class", "workspace-chart-links");

	var drag_line = vis.append("svg:path").attr("class", "drag_line");

	var visNodes = vis.append('g').attr("class", "workspace-chart-nodes");
	
	function initView() // called from main.js - document ready function
	{
		initWorkspace();
		initGrid();
		//document.getElementById("chart").addEventListener("scroll", chartScrolled); // used by partial render, now obsolete, maybe it can be used for something else later
	}
	/*function chartScrolled()// used by partial render, now obsolete, maybe it can be used for something else later
	{
		if (settings.partialRenderLinks)
		redraw_links();
	}*/
	function initWorkspace()
	{
		outer_background.attr('width', settings.space_width)
							  .attr('height', settings.space_height)
						      .attr('fill',settings.workspaceBgColor);
	}
	
	function initGrid()
	{
		initHminorGrid();
		initHmajorGrid();
		initVminorGrid();
		initVmajorGrid();

		// sets visibility according to vars, so that it's only changed at one place
		showHideGridHminor(settings.showGridHminor);
		showHideGridHmajor(settings.showGridHmajor);
		showHideGridVminor(settings.showGridVminor);
		showHideGridVmajor(settings.showGridVmajor);
	}
	function initHminorGrid()
	{
		var gridScaleTicks = [];
		for (var i = settings.gridHminorSize; i <= settings.space_height; i+=settings.gridHminorSize)
			gridScaleTicks.push(i);
		//console.log("gridScaleTicks:"+gridScaleTicks);
		gridHminor.selectAll("line.horizontal").remove();
		gridHminor.selectAll("line.horizontal").data(gridScaleTicks).enter()
	    	.append("line")
	        .attr(
	        {
	            "class":"horizontal",
	            "x1" : 0,
	            "x2" : settings.space_width,
	            "y1" : function(d){ return gridScale(d);},
	            "y2" : function(d){ return gridScale(d);},
	            "fill" : "none",
	            "shape-rendering" : "optimizeSpeed",
	            "stroke" : _settings.gridMinorColor,
				//"stroke-dasharray":"2",
	            "stroke-width" : "1px"
			});
	}
	function initHmajorGrid()
	{
		var gridScaleTicks = [];
		for (var i = settings.gridHmajorSize; i <= settings.space_height; i+=settings.gridHmajorSize)
			gridScaleTicks.push(i);
		//console.log("gridScaleTicks:"+gridScaleTicks);
		gridHmajor.selectAll("line.horizontal").remove();
		gridHmajor.selectAll("line.horizontal").data(gridScaleTicks).enter()
	    	.append("line")
	        .attr(
	        {
	            "class":"horizontal",
	            "x1" : 0,
	            "x2" : settings.space_width,
	            "y1" : function(d){ return gridScale(d);},
	            "y2" : function(d){ return gridScale(d);},
	            "fill" : "none",
	            "shape-rendering" : "optimizeSpeed",
	            "stroke" : _settings.gridMajorColor,
				//"stroke-dasharray":"2",
	            "stroke-width" : "3px"
			});
	}
	function initVminorGrid()
	{
		gridScaleTicks = [];
		for (var i = settings.gridVminorSize; i <= settings.space_height; i+=settings.gridVminorSize)
			gridScaleTicks.push(i);
		//console.log("gridScaleTicks:"+gridScaleTicks);
		gridVminor.selectAll("line.vertical").remove();
		gridVminor.selectAll("line.vertical").data(gridScaleTicks).enter()
	     	.append("line")
	        .attr(
	        {
				"class":"vertical",
				"x1" : function(d){ return gridScale(d);},
	            "x2" : function(d){ return gridScale(d);},
	            "y1" : 0,
	            "y2" : settings.space_height,
	            "fill" : "none",
	            "shape-rendering" : "optimizeSpeed",
		        "stroke" : _settings.gridMinorColor,
				//"stroke-dasharray":"2",
	            "stroke-width" : "1px"
			});
	}
	function initVmajorGrid()
	{
		var gridScaleTicks = [];
		for (var i = settings.gridVmajorSize; i <= settings.space_height; i+=settings.gridVmajorSize)
			gridScaleTicks.push(i);
		//console.log("gridScaleTicks:"+gridScaleTicks);
		gridVmajor.selectAll("line.vertical").remove();
		gridVmajor.selectAll("line.vertical").data(gridScaleTicks).enter()
	     	.append("line")
	        .attr(
	        {
				"class":"vertical",
				"x1" : function(d){ return gridScale(d);},
	            "x2" : function(d){ return gridScale(d);},
	            "y1" : 0,
	            "y2" : settings.space_height,
	            "fill" : "none",
	            "shape-rendering" : "optimizeSpeed",
		        "stroke" : _settings.gridMajorColor,
				//"stroke-dasharray":"2",
	            "stroke-width" : "3px"
			});
	}
	function showHideGrid(state)
	{
		if (settings.nodeMouseDownShowGridHminor == true)
			showHideGridHminor(settings.showGridHminor || state);
		if (settings.nodeMouseDownShowGridHmajor == true)
			showHideGridHmajor(settings.showGridHmajor || state);
		if (settings.nodeMouseDownShowGridVmajor == true)
			showHideGridVmajor(settings.showGridVmajor || state);
		if (settings.nodeMouseDownShowGridVminor == true)
			showHideGridVminor(settings.showGridVminor || state);
	}

	function showHideGridHminor(state)
	{
		if (state == true) {
			/*$('#grid-h-mi')*/gridHminor.attr("style", "visibility:visible;");
		} else {
			/*$('#grid-h-mi')*/gridHminor.attr("style", "visibility:hidden;");
		}
	}
	function showHideGridHmajor(state)
	{
		if (state == true) {
			/*$('#grid-h-ma')*/gridHmajor.attr("style", "visibility:visible;");
		} else {
			/*$('#grid-h-ma')*/gridHmajor.attr("style", "visibility:hidden;");
		}
	}
	function showHideGridVmajor(state)
	{
		if (state == true) {
			/*$('#grid-v-ma')*/gridVmajor.attr("style", "visibility:visible;");
		} else {
			/*$('#grid-v-ma')*/gridVmajor.attr("style", "visibility:hidden;");
		}
	}
	function showHideGridVminor(state)
	{
		if (state == true) {
			/*$('#grid-v-mi')*/gridVminor.attr("style", "visibility:visible;");
		} else {
			/*$('#grid-v-mi')*/gridVminor.attr("style", "visibility:hidden;");
		}
	}
	

	$('#btn-cut').click(function() {copySelection();deleteSelection();});
	$('#btn-copy').click(function() {copySelection()});
	$('#btn-paste').click(function() {importNodes(clipboard,null, true)});

	var workspace_tabs = RED.tabs.create({
		id: "workspace-tabs",
		onchange: function(tab) {
			setShowWorkspaceToolbarVisible(_settings.showWorkspaceToolbar);
						
			console.log("workspace_tabs onchange:" + tab);
			var chart = $("#chart");
			if (activeWorkspace !== 0) {
				workspaceScrollPositions[activeWorkspace] = {
					left:chart.scrollLeft(),
					top:chart.scrollTop()
				};
			}
			var scrollStartLeft = chart.scrollLeft();
			var scrollStartTop = chart.scrollTop();

			activeWorkspace = tab.id;
			RED.nodes.selectWorkspace(activeWorkspace);

			if (workspaceScrollPositions[activeWorkspace]) {
				chart.scrollLeft(workspaceScrollPositions[activeWorkspace].left);
				chart.scrollTop(workspaceScrollPositions[activeWorkspace].top);
			} else {
				chart.scrollLeft(0);
				chart.scrollTop(0);
			}
			var scrollDeltaLeft = chart.scrollLeft() - scrollStartLeft;
			var scrollDeltaTop = chart.scrollTop() - scrollStartTop;
			if (mouse_position != null) {
				mouse_position[0] += scrollDeltaLeft;
				mouse_position[1] += scrollDeltaTop;
			}

			clearSelection();
			RED.nodes.eachNode(function(n) {
					n.dirty = true;
			});
			redraw(true);
			redraw_links_init();
			redraw_links();
		},
		ondblclick: function(tab) {
			showRenameWorkspaceDialog(tab.id);
		},
		onadd: function(tab) { // this is a callback called from tabs.js
			var menuli = $("<li/>");
			var menuA = $("<a/>",{tabindex:"-1",href:"#"+tab.id}).appendTo(menuli);
			menuA.html(tab.label);
			menuA.on("click",function() {
				workspace_tabs.activateTab(tab.id);
			});

			$('#workspace-menu-list').append(menuli);

			if (workspace_tabs.count() == 1) {
				$('#btn-workspace-delete').parent().addClass("disabled");
			} else {
				$('#btn-workspace-delete').parent().removeClass("disabled");
			}

			var link = $("#workspace-tabs a[href='#"+tab.id+"']");
			if (!tab.export)
				link.attr("style", "color:#b3b3b3;");
			else // 
				link.attr("style", "color:#000000;");
		},
		onremove: function(tab) {
			if (workspace_tabs.count() == 1) {
				$('#btn-workspace-delete').parent().addClass("disabled");
			} else {
				$('#btn-workspace-delete').parent().removeClass("disabled");
			}
			$('#workspace-menu-list a[href="#'+tab.id+'"]').parent().remove();

		}
	});

	var workspaceIndex = 0;

	function addWorkspace() {
		var tabId = RED.nodes.id();
		do {
			workspaceIndex += 1;
		} while($("#workspace-tabs a[title='Sheet_"+workspaceIndex+"']").size() !== 0);

		var ws = RED.nodes.createWorkspaceObject(tabId, "Sheet_"+workspaceIndex, 0, 0, true);
		RED.nodes.addWorkspace(ws);
		workspace_tabs.addTab(ws);
		workspace_tabs.activateTab(tabId);
		RED.history.push({t:'add',workspaces:[ws],dirty:dirty});
		RED.view.dirty(true);
		//RED.arduino.httpGetAsync("addFile:" + ws.label + ".h");
		
	}
	$('#btn-workspace-add-tab').on("click",addWorkspace);
	$('#btn-workspace-add').on("click",addWorkspace);
	$('#btn-workspace-edit').on("click",function() {
		showRenameWorkspaceDialog(activeWorkspace);
	});
	$('#btn-workspace-delete').on("click",function() {
		deleteWorkspace(activeWorkspace);
	});

	function deleteWorkspace(id) {
		if (workspace_tabs.count() == 1) {
			return;
		}
		var ws = RED.nodes.workspace(id);
		$( "#node-dialog-delete-workspace" ).dialog('option','workspace',ws);
		$( ".node-dialog-delete-workspace-name" ).text(ws.label);
		//$( "#node-dialog-delete-workspace-name2" ).text(ws.label);
		$( "#node-dialog-delete-workspace" ).dialog('open');

		
	}

	function canvasMouseDown() {
		if (!mousedown_node && !mousedown_link) {
			clearLinkSelection();
			updateSelection();
			redraw(true);
		}
		if (mouse_mode === 0) {
			if (lasso) {
				lasso.remove();
				lasso = null;
			}
			
			if (!touchStartTime) {
				var point = d3.mouse(this);
				lasso = vis.append('rect')
					.attr("ox",point[0])
					.attr("oy",point[1])
					.attr("rx",2)
					.attr("ry",2)
					.attr("x",point[0])
					.attr("y",point[1])
					.attr("width",0)
					.attr("height",0)
					.attr("class","lasso");
				d3.event.preventDefault();
			}
		}
	}

	function canvasMouseMove() {
		mouse_position = d3.touches(this)[0]||d3.mouse(this);
		// Prevent touch scrolling...
		//if (d3.touches(this)[0]) {
		//    d3.event.preventDefault();
		//}
		var chart = $("#chart");
		
		// TODO: auto scroll the container
		//var point = d3.mouse(this);
		//if (point[0]-container.scrollLeft < 30 && container.scrollLeft > 0) { container.scrollLeft -= 15; }
		//console.log(d3.mouse(this));//,container.offsetWidth,container.offsetHeight,container.scrollLeft,container.scrollTop);

		if (lasso) {
			
			var ox = parseInt(lasso.attr("ox"));
			var oy = parseInt(lasso.attr("oy"));
			var x = parseInt(lasso.attr("x"));
			var y = parseInt(lasso.attr("y"));
			
			var w;
			var h;
			if (mouse_position[0] < ox) {
				x = mouse_position[0];
				w = ox-x;
			} else {
				w = mouse_position[0]-x;
			}
			if (mouse_position[1] < oy) {
				y = mouse_position[1];
				h = oy-y;
			} else {
				h = mouse_position[1]-y;
			}
			lasso
				.attr("x",x)
				.attr("y",y)
				.attr("width",w)
				.attr("height",h)
			;
			return;
		}

		if (mouse_mode != RED.state.IMPORT_DRAGGING && !mousedown_node && selected_link == null) {
			return;
		}

		var mousePos;
		if (mouse_mode == RED.state.JOINING) {
			// update drag line
			drag_line.attr("class", "drag_line");
			mousePos = mouse_position;
			
			var numOutputs = 0;
			if (mousedown_node.inputs) numOutputs = (mousedown_port_type === 0)?(mousedown_node.outputs || 1):(mousedown_node.inputs || 1); // Jannik
			else numOutputs = (mousedown_port_type === 0)?(mousedown_node.outputs || 1):(mousedown_node._def.inputs || 1);

			var sourcePort = mousedown_port_index;
			if (posMode === 2)
				var portY = -((numOutputs-1)/2)*node_def.pin_ydistance + node_def.pin_ydistance*sourcePort;
			else
				var portY = -((numOutputs-1)/2)*node_def.pin_ydistance +node_def.pin_ydistance*sourcePort + mousedown_node.h/2;

			

			if (mousedown_node.type == "JunctionRL")
			{
				var sc = (mousedown_port_type === 0)?-1:1;
			}
			else
			{
				var sc = (mousedown_port_type === 0)?1:-1;
			}
			var dy = mousePos[1]-(mousedown_node.y+portY);
			var dx = mousePos[0]-(mousedown_node.x+sc*mousedown_node.w/posMode);
			var delta = Math.sqrt(dy*dy+dx*dx);
			var scale = settings.lineCurveScale; // use of getter which uses parseFloat
			var scaleY = 0;

			if (delta < node_def.width) {
				scale = 0.75-0.75*((node_def.width-delta)/node_def.width);
			}
			if (dx*sc < 0) {
				scale += 2*(Math.min(5*node_def.width,Math.abs(dx))/(5*node_def.width));
				if (Math.abs(dy) < 3*node_def.height) {
					scaleY = ((dy>0)?0.5:-0.5)*(((3*node_def.height)-Math.abs(dy))/(3*node_def.height))*(Math.min(node_def.width,Math.abs(dx))/(node_def.width)) ;
				}
			}
			

			//drag_line.attr("d", redraw_link);
			if (posMode === 2)
			{
				drag_line.attr("d",
					"M "+(mousedown_node.x+sc*mousedown_node.w/2)+" "+(mousedown_node.y+portY)+
					" C "+(mousedown_node.x+sc*(mousedown_node.w/2+node_def.width*scale))+" "+(mousedown_node.y+portY+scaleY*node_def.height)+" "+
					(mousePos[0]-sc*(scale)*node_def.width)+" "+(mousePos[1]-scaleY*node_def.height)+" "+
					mousePos[0]+" "+mousePos[1]
					);
			}
			else
			{
				/*drag_line.attr("d",
					"M "+(mousedown_node.x+sc*1)+" "+(mousedown_node.y+portY)+
					" C "+(mousedown_node.x+sc*(1+node_def.width*scale))+" "+(mousedown_node.y+portY+scaleY*node_def.height)+" "+
					(mousePos[0]-sc*(scale)*node_def.width)+" "+(mousePos[1]-scaleY*node_def.height)+" "+
					mousePos[0]+" "+mousePos[1]
					);*/

					drag_line.attr("d",
					"M "+(mousedown_node.x+sc*1)+" "+(mousedown_node.y+portY)+
					" L "+mousePos[0]+" "+mousePos[1]
					);
			}
				

			d3.event.preventDefault();
		} else if (mouse_mode == RED.state.MOVING) {
			
			mousePos = mouse_position;
			var d = (mouse_offset[0]-mousePos[0])*(mouse_offset[0]-mousePos[0]) + (mouse_offset[1]-mousePos[1])*(mouse_offset[1]-mousePos[1]);
			if (d > 2) {
				mouse_mode = RED.state.MOVING_ACTIVE;
				clickElapsed = 0;
			}
		} else if (mouse_mode == RED.state.MOVING_ACTIVE || mouse_mode == RED.state.IMPORT_DRAGGING) {
			showHideGrid(true);
			moveSelection_mouse();
			moveToFromGroup_update();
			
		} 
		// ui object resize mouse move
		else
		{ 
			uiNodeResize();
		}
		redraw(false);
		//redraw_links_init();
		redraw_links();
		//console.log("redraw from canvas mouse move");
	}
	

	function canvasMouseUp() {
		if (mousedown_node && mouse_mode == RED.state.JOINING) {
			drag_line.attr("class", "drag_line_hidden");
		}
		if (lasso) {
			//console.warn("canvasMouseUp lasso happend");
			var x = parseInt(lasso.attr("x"));
			var y = parseInt(lasso.attr("y"));
			var x2 = x+parseInt(lasso.attr("width"));
			var y2 = y+parseInt(lasso.attr("height"));
			if (!d3.event.ctrlKey) {
				clearSelection();
			}
			RED.nodes.eachNode(function(n) {
				if (n.z == activeWorkspace && !n.selected) {
					// don't select groups with lasso (only with ctrl pressed) 
					if (n.type == "group" && !d3.event.ctrlKey)
						return; // return is used because this is a function not a loop

					n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
					if (n.selected) {
						n.dirty = true;
						moving_set.push({n:n});
					}
				}
			});
			updateSelection();
			lasso.remove();
			lasso = null;
		} else if (mouse_mode == RED.state.DEFAULT && mousedown_link == null) {
			
			//console.warn("canvasMouseUp mouse_mode == RED.state.DEFAULT && mousedown_link == null) happend");
			clearSelection();
			updateSelection();
		}
		if (mouse_mode == RED.state.MOVING_ACTIVE) {
			//console.warn("canvasMouseUp mouse_mode == RED.state.MOVING_ACTIVE happend");
			if (moving_set.length > 0) {
				var ns = [];
				for (var j=0;j<moving_set.length;j++) {
					ns.push({n:moving_set[j].n,ox:moving_set[j].ox,oy:moving_set[j].oy});
				}
				RED.history.push({t:'move',nodes:ns,dirty:dirty});
				RED.storage.update();
			}
		}
		if (mouse_mode == RED.state.MOVING || mouse_mode == RED.state.MOVING_ACTIVE) {
			for (var i=0;i<moving_set.length;i++) {
				delete moving_set[i].ox;
				delete moving_set[i].oy;
			}
		}
		if (mouse_mode == RED.state.IMPORT_DRAGGING) {
			RED.keyboard.remove(/* ESCAPE */ 27);
			setDirty(true);
		}
		redraw(true);
		//redraw_links_init();
		redraw_links();
		// clear mouse event vars
		resetMouseVars();
	}

	$('#btn-zoom-out').click(function() {zoomOut();});
	$('#btn-zoom-zero').click(function() {zoomZero();});
	$('#btn-zoom-in').click(function() {zoomIn();});
	$("#chart").on('DOMMouseScroll mousewheel', function (evt) {
		if (currentUiObject != undefined)
		{
			evt.preventDefault();
			evt.stopPropagation();
			var move = -(evt.originalEvent.detail) || evt.originalEvent.wheelDelta;
			uiObjectMouseScroll(move);
			return;
		}
		if ((settings.guiEditMode == false) && (settings.lockWindowMouseScrollInRunMode == true))
		{
			evt.preventDefault();
			evt.stopPropagation();
		}
		if ( evt.altKey ) {
			evt.preventDefault();
			evt.stopPropagation();
			var move = -(evt.originalEvent.detail) || evt.originalEvent.wheelDelta;
			if (move <= 0) { zoomOut(); }
			else { zoomIn(); }
		}
	});
	$("#chart").droppable({
			accept:".palette_node",
			drop: function( event, ui ) {
				d3.event = event;
				var mousePos = d3.touches(this)[0]||d3.mouse(this);
				mousePos[1] += this.scrollTop;
				mousePos[0] += this.scrollLeft;
				mousePos[1] /= settings.scaleFactor;
				mousePos[0] /= settings.scaleFactor;

				var nn = AddNewNode(mousePos[0],mousePos[1], ui.draggable[0].type);
				setDirty(true);
				// auto select dropped node - so info shows (if visible)
				clearSelection();
				nn.selected = true;
				moving_set.push({n:nn});
				updateSelection();
				redraw(true);
				//redraw_links_init();
				//redraw_links();
				if (nn._def.autoedit) {
					RED.editor.edit(nn);
				}
			}
	});
	function AddNewNode(xPos, yPos, typeName)
	{
		var nn = {x: xPos,y:yPos,w:node_def.width,z:activeWorkspace};
		

		nn.type = typeName;
		nn._def = RED.nodes.getType(nn.type);
		nn.bgColor = nn._def.color;
		
		nn.id = RED.nodes.cppId(nn, RED.nodes.getWorkspace(activeWorkspace).label);  // jannik add/change
		nn.name = (nn._def.shortName) ? nn._def.shortName : nn.type.replace(/^Analog/, "");// jannik add/change temp name
		nn.name = RED.nodes.cppName(nn); // jannik add/change create unique name

		nn._def.defaults = nn._def.defaults ? nn._def.defaults  : {};
		nn._def.defaults.name = { value: nn.id };

		nn.outputs = nn._def.outputs;
		nn.changed = true;

		
		for (var d in nn._def.defaults) {
			if (nn._def.defaults.hasOwnProperty(d)) {
				if (d == "name" || d == "id" || d == "x" || d == "y") continue; // jannik add (this prevent above assigment to be overwritten)

				// this creates a new array instance
				// instead of taking it from nn._def.defaults["nodes"].value;
				// (otherwise all new nodes uses the same instance see note below)
				if (nn.type == "group" && d == "nodes") { nn.nodes = []; continue;} 

				nn[d] = nn._def.defaults[d].value;
			}
		}
		// note. 
		// if (nn.type == "group" && d == "nodes") { nn.nodes = []; continue;} 
		// removes a very annoying odd bug:
		// 1. when a new group has been added and a node is placed inside it, 
		// 2. then when annother group is added that node is also "inside"(not visually) that new group
		// it's like string theory where a object can be at two places at the same "time"(how can that even be measured?)
		
		if (nn._def.onadd) {
			nn._def.onadd.call(nn);
		}
	
		

		//nn.h = Math.max(node_def.height,(nn.outputs||0) * 15);
		RED.history.push({t:'add',nodes:[nn.id],dirty:dirty});
		RED.nodes.add(nn);
		RED.nodes.addUsedNodeTypesToPalette();
		RED.editor.validateNode(nn);
		
		//console.log("drop happend:" + typeName);
		return nn;
	}
	function zoomIn() {
		if (settings.scaleFactor < 0.3)
			settings.scaleFactor += 0.05;
		else if (settings.scaleFactor < maxZoomFactor)
			settings.scaleFactor += 0.1;
	}
	function zoomOut() {
		if (settings.scaleFactor > 0.3)
			settings.scaleFactor -= 0.1;
		else if (settings.scaleFactor > 0.1)
			settings.scaleFactor -= 0.05;
	}
	function zoomZero() {
		settings.scaleFactor = 1;
	}

	function selectAll() {
		RED.nodes.eachNode(function(n) {
			if (n.z == activeWorkspace) {
				if (!n.selected) {
					n.selected = true;
					n.dirty = true;
					moving_set.push({n:n});
				}
			}
		});
		clearLinkSelection();
		updateSelection();
		redraw(true);
		redraw_links_init();
		redraw_links();
	}

	function clearSelection() {
		//console.trace("clearSelection");
		for (var i=0;i<moving_set.length;i++) {
			var n = moving_set[i];
			n.n.dirty = true;
			n.n.selected = false;
		}
		moving_set = [];
		clearLinkSelection();
	}

	function updateSelection() {
		if (moving_set.length === 0) {
			$("#li-menu-export").addClass("disabled");
			$("#li-menu-export-clipboard").addClass("disabled");
			$("#li-menu-export-library").addClass("disabled");
		} else {
			$("#li-menu-export").removeClass("disabled");
			$("#li-menu-export-clipboard").removeClass("disabled");
			$("#li-menu-export-library").removeClass("disabled");
		}
		if (moving_set.length === 0 && selected_link == null) {
			RED.keyboard.remove(/* backspace */ 8);
			RED.keyboard.remove(/* delete */ 46);
			RED.keyboard.remove(/* c */ 67);
			RED.keyboard.remove(/* x */ 88);
		} else {
			//RED.keyboard.add(/* backspace */ 8,function(){deleteSelection();d3.event.preventDefault();}); // jannik thinks this is unlogical and unnecessary
			RED.keyboard.add(/* delete */ 46,function(){deleteSelection();d3.event.preventDefault();});
			RED.keyboard.add(/* c */ 67,{ctrl:true},function(){copySelection();d3.event.preventDefault();});
			RED.keyboard.add(/* x */ 88,{ctrl:true},function(){copySelection();deleteSelection();d3.event.preventDefault();});
		}
		if (moving_set.length === 0) {
			RED.keyboard.remove(/* up   */ 38);
			RED.keyboard.remove(/* down */ 40);
			RED.keyboard.remove(/* left */ 37);
			RED.keyboard.remove(/* right*/ 39);
			RED.keyboard.add(/* up   */ 38, function() { moveView(0,-1); d3.event.preventDefault(); });
			RED.keyboard.add(/* down */ 40, function() { moveView(0,1); d3.event.preventDefault(); });
			RED.keyboard.add(/* left */ 37, function() { moveView(-1,0); d3.event.preventDefault(); });
			RED.keyboard.add(/* right*/ 39, function() { moveView(1,0); d3.event.preventDefault(); });
		} else {
			
			RED.keyboard.add(/* up   */ 38, function() { moveSelection_keyboard( 0,-1); d3.event.preventDefault(); }, endKeyboardMove);
			RED.keyboard.add(/* down */ 40, function() { moveSelection_keyboard( 0, 1); d3.event.preventDefault(); }, endKeyboardMove);
			RED.keyboard.add(/* left */ 37, function() { moveSelection_keyboard(-1, 0); d3.event.preventDefault(); }, endKeyboardMove);
			RED.keyboard.add(/* right*/ 39, function() { moveSelection_keyboard( 1, 0); d3.event.preventDefault(); }, endKeyboardMove);
		}
		if (moving_set.length == 1 || (moving_set[0] != undefined && moving_set[0].n.type == "group")) {
			RED.sidebar.info.refresh(moving_set[0].n);
			RED.nodes.selectNode(moving_set[0].n.type);
		} else if (moving_set.length > 1) {
			RED.sidebar.info.showSelection(moving_set);
		} else {
			RED.sidebar.info.clear();
		}

		for (var i = 0; i < moving_set.length; i++)
		{
			var n = moving_set[i].n;
			var links = RED.nodes.links.filter(function(l) {  return l.source.z == activeWorkspace && l.target.z == activeWorkspace; });
			vis.selectAll(".link").data(links,function(l) {  if (l.source == n) { l.selected = true; } if (l.target == n){ l.selected = true; } return l.source.id+":"+l.sourcePort+":"+l.target.id+":"+l.targetPort;});
		}
		redraw_links_init();
	}
	$('#btn-debugShowSelection').click(function() {RED.sidebar.info.showSelection(moving_set);});

	function moveView(dx, dy)
	{
		var chart = $("#chart");
		if (dx > 0) chart.scrollLeft(chart.scrollLeft() + 10/settings.scaleFactor);
		else if (dx < 0) chart.scrollLeft(chart.scrollLeft() - 10/settings.scaleFactor);
		if (dy > 0) chart.scrollTop(chart.scrollTop() + 10/settings.scaleFactor);
		else if (dy < 0) chart.scrollTop(chart.scrollTop() - 10/settings.scaleFactor);
	}
	function endKeyboardMove() {
		var ns = [];
		for (var i=0;i<moving_set.length;i++) {
			ns.push({n:moving_set[i].n,ox:moving_set[i].ox,oy:moving_set[i].oy});
			delete moving_set[i].ox;
			delete moving_set[i].oy;
		}
		RED.history.push({t:'move',nodes:ns,dirty:dirty});// TODO: is this nessesary
	}
	function XOR(bool1, bool2)
	{
		return (bool1 && !bool2) || (!bool1 && bool2);
	}
	function moveSelection_keyboard(dx,dy) { // used when moving by keyboard keys
		var snapToGrid = XOR(d3.event.shiftKey, settings.snapToGrid);
		if(snapToGrid)
		{
			if (dx !== 0) dx *= settings.snapToGridHsize;
			if (dy !== 0) dy *= settings.snapToGridVsize;
		}

		var minX = 0;
		var minY = 0;
		var node;

		for (var i=0;i<moving_set.length;i++) {
			node = moving_set[i];
			if (node.ox == null && node.oy == null) {
				node.ox = node.n.x;
				node.oy = node.n.y;
			}
			node.n.x += dx;
			node.n.y += dy;
			node.n.dirty = true;

			// gets the node locations that is the minimum in the selection
			// limits so that the node(s) cannot be moved outside of workspace

			if (posMode === 2)
			{
				minX = Math.min(node.n.x-node.n.w/2-5,minX);
				minY = Math.min(node.n.y-node.n.h/2-5,minY);
			}
			else
			{
				minX = Math.min(node.n.x-5,minX);
				minY = Math.min(node.n.y-5,minY);
			}
		}
		if (minX !== 0 || minY !== 0) { // limit so that the node(s) cannot be moved outside of workspace
			console.warn("nodes tried to move outside workspace " + minX + " " +  minY);
			for (var n = 0; n<moving_set.length; n++) {
				node = moving_set[n];
				node.n.x -= minX;
				node.n.y -= minY;
			}
		}

		// snap to grid
		if (snapToGrid && moving_set.length > 0) {
			var gridOffsetX = 0;
			var gridOffsetY = 0;

			node = moving_set[0];
			//gridOffset[0] = node.n.x-(_settings.snapToGridXsize*Math.floor((node.n.x-node.n.w/posMode)/_settings.snapToGridXsize)+node.n.w/posMode);
			gridOffsetX = node.n.x-(settings.snapToGridHsize*Math.floor(node.n.x/settings.snapToGridHsize)); // this works much better than above
			gridOffsetY = node.n.y-(settings.snapToGridVsize*Math.floor(node.n.y/settings.snapToGridVsize));

			//if (gridOffsetX !== 0 || gridOffsetY !== 0) {
				for (i = 0; i<moving_set.length; i++) {
					node = moving_set[i];
					
					// having this here makes all selected nodes realign automatically
					//gridOffsetX = /*node.n.x-*/(settings.snapToGridHsize*Math.floor(node.n.x/settings.snapToGridHsize)); // this works much better than above
					//gridOffsetY = /*node.n.y-*/(settings.snapToGridVsize*Math.floor(node.n.y/settings.snapToGridVsize));
					if (gridOffsetX === 0 && gridOffsetY === 0) continue
					console.error("gridOffsetX:" + gridOffsetX + ", gridOffsetY:" + gridOffsetY);
					node.n.x -= gridOffsetX; // +1 for correction to zero location based grid
					node.n.y -= gridOffsetY;
					if (node.n.x == node.n.ox && node.n.y == node.n.oy) {
						node.dirty = false;
					}
				}
			//}
		}
		redraw(false);
		//redraw_links_init();
		redraw_links();
	}
	function moveSelection_mouse()
	{
		mousePos = mouse_position;
		var snapToGrid = XOR(d3.event.shiftKey, settings.snapToGrid);
		var node;
		var i;
		var minX = 0;
		var minY = 0;
		for (var n = 0; n<moving_set.length; n++) {
			node = moving_set[n];
			if (snapToGrid) {
				node.n.ox = node.n.x;
				node.n.oy = node.n.y;
			}
			node.n.x = mousePos[0]+node.dx;
			node.n.y = mousePos[1]+node.dy;
			node.n.dirty = true;
			
			// gets the node locations that is the minimum in the selection
			// limits so that the node(s) cannot be moved outside of workspace
			if (posMode === 2)
			{
				minX = Math.min(node.n.x-node.n.w/2-5,minX);
				minY = Math.min(node.n.y-node.n.h/2-5,minY);
			}
			else
			{
				minX = Math.min(node.n.x-5,minX);
				minY = Math.min(node.n.y-5,minY);
			}
		}
		if (minX !== 0 || minY !== 0) { // limit so that the node(s) cannot be moved outside of workspace
			for (i = 0; i<moving_set.length; i++) {
				node = moving_set[i];
				node.n.x -= minX;
				node.n.y -= minY;
			}
		}
		// snap to grid
		if (snapToGrid && moving_set.length > 0) {
			var gridOffsetX = 0;
			var gridOffsetY = 0;
			node = moving_set[0];

			//gridOffset[0] = node.n.x-(_settings.snapToGridXsize*Math.floor((node.n.x-node.n.w/posMode)/_settings.snapToGridXsize)+node.n.w/posMode);

			gridOffsetX = node.n.x-(settings.snapToGridHsize*Math.floor(node.n.x/settings.snapToGridHsize)); // this works much better than above
			gridOffsetY = node.n.y-(settings.snapToGridVsize*Math.floor(node.n.y/settings.snapToGridVsize));
			
			//if (gridOffsetX !== 0 || gridOffsetY !== 0) {
				for (i = 0; i<moving_set.length; i++) {
					node = moving_set[i];

					// having this here makes all selected nodes realign automatically
					//gridOffsetX = node.n.x-(settings.snapToGridHsize*Math.floor(node.n.x/settings.snapToGridHsize)); // this works much better than above
					//gridOffsetY = node.n.y-(settings.snapToGridVsize*Math.floor(node.n.y/settings.snapToGridVsize));
					if (gridOffsetX === 0 && gridOffsetY === 0) continue

					node.n.x -= gridOffsetX; // +1 for correction to zero location based grid
					node.n.y -= gridOffsetY;
					if (node.n.x == node.n.ox && node.n.y == node.n.oy) {
						node.dirty = false;
					}
				}
			//}
		}
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
					.on("mouseover", nodeInput_mouseover)
					.on("mouseout", nodePort_mouseout)
					//.on("mouseover",function(d) { var port = d3.select(this); port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 1 ));})
					//.on("mouseout",function(d) { var port = d3.select(this); port.classed("port_hovered",false);})
			}
		}
	}
	function deleteSelection() {
		var removedNodes = [];
		var removedLinks = [];
		var startDirty = dirty;
		if (current_popup_rect)
			$(current_popup_rect).popover("destroy");
		if (moving_set.length > 0) {
			for (var i=0;i<moving_set.length;i++) {
				var node = moving_set[i].n; // moving_set[i] is a rect?
				node.selected = false;
				if (node.x < 0) {
					node.x = 25
				}

				if (node.parentGroup != undefined)
					removeNodeFromGroup(node.parentGroup, node);

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
							.on("mouseover", nodeInput_mouseover)
							.on("mouseout", nodePort_mouseout)
							//.on("mouseover",function(d) { var port = d3.select(this); port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 1 ));})
							//.on("mouseout",function(d) { var port = d3.select(this); port.classed("port_hovered",false);})
					}
				}
				removedNodes.push(node);
				removedLinks = removedLinks.concat(rmlinks);
			}
			moving_set = [];
			setDirty(true);
		}
		if (selected_link) {
			// reenable input port
			var n = selected_link.targetPort;
			var rect = selected_link.target.inputlist[n];
			rect.on("mousedown", (function(d,n){return function(d){portMouseDown(d,1,n);}})(rect, n))
				.on("touchstart", (function(d,n){return function(d){portMouseDown(d,1,n);}})(rect, n))
				.on("mouseup", (function(d,n){return function(d){portMouseUp(d,1,n);}})(rect, n))
				.on("touchend", (function(d,n){return function(d){portMouseUp(d,1,n);}})(rect, n))
				.on("mouseover", nodeInput_mouseover)
				.on("mouseout", nodePort_mouseout)
				//.on("mouseover",function(d) { var port = d3.select(this); port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 1 ));})
				//.on("mouseout",function(d) { var port = d3.select(this); port.classed("port_hovered",false);});
			RED.nodes.removeLink(selected_link);
			removedLinks.push(selected_link);
			setDirty(true);
		}
		RED.history.push({t:'delete',nodes:removedNodes,links:removedLinks,dirty:startDirty});

		clearLinkSelection();
		updateSelection();
		
		redraw(true);
		redraw_links_init();
		redraw_links();
		RED.nodes.addUsedNodeTypesToPalette();
	}

	function copySelection() {
		if (moving_set.length > 0) {
			var nns = [];
			for (var n=0;n<moving_set.length;n++) {
				var node = moving_set[n].n;
				nns.push(RED.nodes.convertNode(node));
			}
			clipboard = JSON.stringify(nns);
			RED.notify(moving_set.length+" node"+(moving_set.length>1?"s":"")+" copied");
		}
	}
	var calculateTextSizeElement = undefined;
	function calculateTextSize(str,fontSize) {
		
		//if (str == undefined)
		//	return {w:0, h:0};
		//console.error("@calculateTextSize str type:" + typeof str);
		if (calculateTextSizeElement == undefined)
		{
			console.error("@calculateTextSize created new");
			var sp = document.createElement("span");
			sp.className = "node_label";
			sp.style.position = "absolute";
			sp.style.top = "-1000px";
			document.body.appendChild(sp);
			calculateTextSizeElement = sp;
		}
		var sp = calculateTextSizeElement;
		if (fontSize != undefined)
			sp.style.fontSize = fontSize + "px";
		/*var sp = document.createElement("span");
		sp.className = "node_label";
		sp.style.position = "absolute";
		sp.style.top = "-1000px";*/
		sp.innerHTML = (str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
		const t0 = performance.now();
		var w = sp.offsetWidth;
		var h = sp.offsetHeight;
		//document.body.removeChild(sp);
		const t1 = performance.now();
		//console.error("@calculateTextSize time:" + (t1-t0));
		return {w:parseInt(w), h:parseInt(h)};
	}

	function resetMouseVars() {
		mousedown_node = null;
		mouseup_node = null;
		mousedown_link = null;
		mouse_mode = 0;
		mousedown_port_type = 0;
	}

	function portMouseDown(d,portType,portIndex) {
		// disable zoom
		//vis.call(d3.behavior.zoom().on("zoom"), null);
		mousedown_node = d;
		clearLinkSelection();
		mouse_mode = RED.state.JOINING;
		mousedown_port_type = portType;
		mousedown_port_index = portIndex || 0;
		document.body.style.cursor = "crosshair";
		d3.event.preventDefault();
	}

	function portMouseUp(d,portType,portIndex) {
		document.body.style.cursor = "";
		if (mouse_mode == RED.state.JOINING && mousedown_node) {
			if (typeof TouchEvent != "undefined" && d3.event instanceof TouchEvent) {
				RED.nodes.eachNode(function(n) {
						if (n.z == activeWorkspace) {
							var hw = n.w/posMode;
							var hh = n.h/posMode;
							if (n.x-hw<mouse_position[0] && n.x+hw> mouse_position[0] &&
								n.y-hh<mouse_position[1] && n.y+hh>mouse_position[1]) {
									mouseup_node = n;
									
									if (mouseup_node.inputs) portType = mouseup_node.inputs>0?1:0; // Jannik add so that input count can be changed on the fly
									else portType = mouseup_node._def.inputs>0?1:0;
									
									portIndex = 0;
							}
						}
				});
			} else {
				mouseup_node = d;
			}
			// TODO: fix so that a Junction cannot be used to
			// override mouseup_node === mousedown_node
			if (mouseup_node === mousedown_node ) { 
				stopDragLine();
				RED.notify("<strong>A connection cannot be made directly to itself!!!</strong>" + portType + mousedown_port_type, "warning", false, 2000);
				return;
			}
			if (portType == mousedown_port_type)
			{
				stopDragLine(); return;
			}
			
			var src,dst,src_port,dst_port;
			if (mousedown_port_type === 0) {
				src = mousedown_node;
				src_port = mousedown_port_index;
				dst = mouseup_node;
				dst_port = portIndex;
			} else if (mousedown_port_type == 1) {
				src = mouseup_node;
				src_port = portIndex;
				dst = mousedown_node;
				dst_port = mousedown_port_index;
			}
			var srcIsJunction = src.type.startsWith("Junction");
			var dstIsJunction = dst.type.startsWith("Junction");
			if (srcIsJunction || dstIsJunction)
			{
				var newSrc,newDst;
				if (srcIsJunction)
					newSrc = RED.nodes.getJunctionSrcNode(src);
				else
					newSrc = src;
				if (newSrc != null)
				{
					if (dstIsJunction)
					{
						if (RED.nodes.getJunctionDstNodeEquals(dst, newSrc))
						{
							stopDragLine();
							RED.notify("<strong>A connection cannot be made indirectly to itself!!!</strong>", "warning", false, 2000);
							return;
						}
					}
					else
						newDst = dst;
					
					if (newSrc === newDst)
					{
						stopDragLine();
						RED.notify("<strong>A connection cannot be made indirectly to itself!!!</strong>", "warning", false, 2000);
						return;
					}
					RED.notify("<strong>" + src.name  + "->" + newSrc.name +  ":" + dst.name  + "</strong>", "warning", false, 5000);
				}
			}
			var existingLink = false;
			RED.nodes.eachLink(function(d) {
					existingLink = existingLink || (d.source === src && d.target === dst && d.sourcePort == src_port && d.targetPort == dst_port);

			});
			if (!existingLink) {
				var link = {source: src, sourcePort:src_port, target: dst, targetPort: dst_port};
				RED.nodes.addLink(link);
				RED.history.push({t:'add',links:[link],dirty:dirty});
				setDirty(true);
				// disallow new links to this destination - each input can have only a single link
				dst.inputlist[dst_port]
					.classed("port_hovered",false)
					.on("mousedown",null)
					.on("touchstart", null)
					.on("mouseup", null)
					.on("touchend", null)
					.on("mouseover", nodeInput_mouseover)
					.on("mouseout", nodePort_mouseout);
			}
			clearLinkSelection();
			redraw(true);
			redraw_links_init();
			redraw_links();
		}
	}
	function stopDragLine()
	{
		drag_line.attr("class", "drag_line_hidden");
		resetMouseVars();
	}
	function nodeTouchStart(d)
	{
		var obj = d3.select(this);
		var touch0 = d3.event.touches.item(0);
		var pos = [touch0.pageX,touch0.pageY];
		startTouchCenter = [touch0.pageX,touch0.pageY];
		startTouchDistance = 0;
		touchStartTime = setTimeout(function() {
			showTouchMenu(obj,pos);
		},touchLongPressTimeout);
		nodeMouseDown.call(this,d)
	}
	function nodeTouchEnd(d)
	{
		clearTimeout(touchStartTime);
		touchStartTime = null;
		if  (RED.touch.radialMenu.active()) {
			d3.event.stopPropagation();
			return;
		}
		nodeMouseUp.call(this,d);
	}

	function nodeMouseOver(d) {
		//if (d != mousedown_node)
			//console.error(" >>>>>>>>>>>>>> node mouseover:" + d.name);

		if (d._def.uiObject != undefined && settings.guiEditMode == false)
		{
			var mousePos = d3.mouse(this)
			var x = mousePos[0];
			var y = mousePos[1];
			var rect = d3.select(this);
			uiObjectMouseOver(d,x,y,rect); // here the event is passed down to the ui object
			return;
		}
		if (mouse_mode === 0) {
			var nodeRect = d3.select(this);
			nodeRect.classed("node_hovered",true);

			//
			//console.log(d3.mouse(this));

			$(current_popup_rect).popover("destroy"); // destroy prev
			

			if (settings.showNodeToolTip && (d._def.uiObject == undefined)) // dont show popup on gui objects
			{
				var popoverText = "<b>" + d.type + "</b><br>";
				if (d.comment && (d.comment.trim().length != 0))
					popoverText+="<p>"+d.comment.replace("    ", "&emsp;").replace("\t", "&emsp;").replace(/\n/g, "<br>") + "</p>";
				//console.warn("popoverText:" +popoverText);
				

				if (d.type == "Function" || d.type == "Variables" || d.type == "CodeFile")
					showPopOver(this, true, popoverText, "right");
				else
					showPopOver(this, true, popoverText, "top");
			}
		}
	}
	function nodeMouseOut(d)
	{
		if (d._def.uiObject != undefined && settings.guiEditMode == false)
		{
			var mousePos = d3.mouse(this)
			var x = mousePos[0];
			var y = mousePos[1];
			var rect = d3.select(this);
			uiObjectMouseOut(d,x,y,rect); // here the event is passed down to the ui object
			return;
		}
		var nodeRect = d3.select(this);
		nodeRect.classed("node_hovered",false);
		//console.log("node mouseout:" + d.name);
		$(current_popup_rect).popover("destroy");
	}

	function nodeMouseMove(d) {
		// for non ui object this method is not used
		if (d._def.uiObject == undefined) return;
		var mousePos = d3.mouse(this)
		var x = mousePos[0];
		var y = mousePos[1];

		if (settings.guiEditMode == false) {
			this.style.cursor = "default";
			//currentUiObjectMouseX = x;
			//currentUiObjectMouseY = y;
			uiObjectMouseMove(d, x, y);
			return;
		}

		if (mouse_mode !== 0) return;


		var nodeRect = d3.select(this);
		
		if ((y > uiItemResizeBorderSize) && (y < (d.h-uiItemResizeBorderSize))) // width resize
		{
			if (x < uiItemResizeBorderSize)
				this.style.cursor = "w-resize";
			else if (x > (d.w-uiItemResizeBorderSize))
				this.style.cursor = "e-resize";
			else
				this.style.cursor = "move";
		}
		else if ((x > uiItemResizeBorderSize) && (x < (d.w-uiItemResizeBorderSize))) // height resize
		{
			if (y < uiItemResizeBorderSize)
				this.style.cursor = "n-resize";
			else if (y > (d.h-uiItemResizeBorderSize))
				this.style.cursor = "s-resize";
			else
				this.style.cursor = "move";
		}
		else if ((x < uiItemResizeBorderSize) && (y < uiItemResizeBorderSize)) // top left resize
		{
			this.style.cursor = "nw-resize";
		}
		else if ((x < uiItemResizeBorderSize) && (y>(d.h-uiItemResizeBorderSize))) // bottom left resize
		{
			this.style.cursor = "sw-resize";
		}
		else if ((y < uiItemResizeBorderSize) && (x>(d.w-uiItemResizeBorderSize))) // top right resize
		{
			this.style.cursor = "ne-resize";
		}
		else if ((y > (d.h-uiItemResizeBorderSize)) && (x > (d.w-uiItemResizeBorderSize))) // bottom right resize
		{
			this.style.cursor = "se-resize";
		}
		else
			this.style.cursor = "move";
	}

	
	
	function nodeMouseDown(d,i) { // this only happens once

		if (d._def.uiObject != undefined && settings.guiEditMode == false)
		{
			var mousePos = d3.mouse(this)
			var x = mousePos[0];
			var y = mousePos[1];
			var rect = d3.select(this);
			uiObjectMouseDown(d, x, y, rect); // here the event is passed down to the ui object
			return;
		}

		//showHideGrid(true);
		//var touch0 = d3.event;
		//var pos = [touch0.pageX,touch0.pageY];
		//RED.touch.radialMenu.show(d3.select(this),pos);
		if (mouse_mode == RED.state.IMPORT_DRAGGING) {
			RED.keyboard.remove(/* ESCAPE */ 27);
			updateSelection();
			setDirty(true);
			redraw(true);
			//redraw_links_init();
			//redraw_links();
			resetMouseVars();
			d3.event.stopPropagation();
			return;
		}
		mousedown_node = d;
		
		var now = Date.now();
		clickElapsed = now-clickTime;
		clickTime = now;

		dblClickPrimed = (lastClickNode == mousedown_node);
		lastClickNode = mousedown_node;

		var i;

		if (d.selected && d3.event.ctrlKey) {
			console.error("selection splice");
			d.selected = false;
			for (i=0;i<moving_set.length;i+=1) {
				if (moving_set[i].n === d) {
					moving_set.splice(i,1);
					break;
				}
			}
		} else {
			
			if (d3.event.shiftKey) {
				clearSelection();
				var cnodes = RED.nodes.getAllFlowNodes(mousedown_node);
				for (var n=0;n<cnodes.length;n++) {
					console.log("asmfjkl.nodes[ni].name:" +cnodes[n].name);
					cnodes[n].selected = true;
					cnodes[n].dirty = true;
					moving_set.push({n:cnodes[n]});
				}
				
			} else if (!d.selected || d.type == "group") {
				
				if (!d3.event.ctrlKey) {
					clearSelection();
				}
				mousedown_node.selected = true;
				moving_set.push({n:mousedown_node});//, rect:this});

				if (mousedown_node.nodes != undefined && mousedown_node.nodes.length != 0)
				{
					SelectAllInGroup(mousedown_node);
				}
			}
			if (!d3.event.ctrlKey)
				clearLinkSelection();
			if (d3.event.button == 0) {
				
				// ui object resize mouse down
				if (d._def.uiObject != undefined)
				{
					mousedown_node_w = d.w;
					mousedown_node_h = d.h;
					mousedown_node_x = d.x;
					mousedown_node_y = d.y;
					mouse_offset_resize_x = mouse_position[0];
					mouse_offset_resize_y = mouse_position[1];
					//console.log("mousedown_node_w:" + mousedown_node_w +
					//", mousedown_node_h:" + mousedown_node_h +
					//", mouse_offset_resize_x:" + mouse_offset_resize_x +
					//", mouse_offset_resize_y:" + mouse_offset_resize_y);

					//var nodeRect = d3.select(this);
					var mousePos = d3.mouse(this)
					var x = mousePos[0];
					var y = mousePos[1];

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
					else
						mouse_mode = RED.state.MOVING;
					//console.log("resize mouse_mode:" + mouse_mode);
				}
				else
					mouse_mode = RED.state.MOVING;
				
					//console.log("mouse down mouse_mode:" + mouse_mode);
				
				var mouse = d3.touches(this)[0]||d3.mouse(this);
				if (posMode === 2)
				{
					mouse[0] += d.x-d.w/2;
					mouse[1] += d.y-d.h/2;
				}
				else
				{
					mouse[0] += d.x;
					mouse[1] += d.y;
				}
				for (i=0;i<moving_set.length;i++) {
					moving_set[i].ox = moving_set[i].n.x;
					moving_set[i].oy = moving_set[i].n.y;
					moving_set[i].dx = moving_set[i].n.x-mouse[0];
					moving_set[i].dy = moving_set[i].n.y-mouse[1];
				}
				mouse_offset = d3.mouse(document.body);
				if (isNaN(mouse_offset[0])) {
					mouse_offset = d3.touches(document.body)[0];
				}
			}
		}
		d.dirty = true;
		updateSelection();
		
		//console.log("nodeMouseDown:" + d.name);
		
		redraw(true);
		redraw_links_init();
		redraw_links();
		d3.event.stopPropagation();
	}
	function nodeMouseUp(d,i) {
		console.log("nodeMouseUp "+ d.name+" i:" + i);

		
		if (d._def.uiObject != undefined && settings.guiEditMode == false)
		{
			var mousePos = d3.mouse(this)
					var x = mousePos[0];
					var y = mousePos[1];
			var rect = d3.select(this);
			uiObjectMouseUp(d, x, y, rect); // here the event is passed down to the ui object
			return;
		}
		showHideGrid(false);
		moveSelectionToFromGroupMouseUp();
		
		if (dblClickPrimed && mousedown_node == d && clickElapsed > 0 && clickElapsed < 750) {
			RED.editor.edit(d);
			clickElapsed = 0;
			d3.event.stopPropagation();
			return;
		}
		if (d.inputs) portMouseUp(d, d.inputs > 0 ? 1 : 0, 0); // Jannik add so that input count can be changed on the fly
		else portMouseUp(d, d._def.inputs > 0 ? 1 : 0, 0);
	}
	function uiObjectMouseMove (d, mouseX, mouseY)
	{
		if (mouse_mode != RED.state.UI_OBJECT_MOUSE_DOWN) return;

		//console.warn("uiObjectMouseMove " + mouseX + ":" + mouseY);
		
		if (d.type == "UI_Button") {
			
		} else if (d.type == "UI_Slider") {
			setUiSliderValueFromMouse(d, mouseX, mouseY);
			if (d.sendMode == "m")
				sendUiSliderValue(d);
		}
	}
	function sendUiSliderValue(d)
	{
		if (d.lastSentValue != undefined)
		{
			if (d.lastSentValue === d.val) return;
		}
		d.lastSentValue = d.val;

		if (d.sendFormat != undefined && d.sendFormat.trim() != "")
		{
			var formatted = eval(d.sendFormat);
			RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
		}
		else if (d.sendSpace == true)
			RED.BiDirDataWebSocketBridge.SendToWebSocket(d.name + " " + d.val); // n.name is the labelID
		else
			RED.BiDirDataWebSocketBridge.SendToWebSocket(d.name + d.val); // n.name is the labelID
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
			d.dirty = true;
			redraw_nodes(true);
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
			d.dirty = true;
			redraw_nodes(true);
		}
	}
	function subtractColor(colorA, colorB)
	{
		var color_R = parseInt(colorA.substring(1,3), 16) - parseInt(colorB.substring(1,3), 16);
		var color_G = parseInt(colorA.substring(3,5), 16) - parseInt(colorB.substring(3,5), 16);
		var color_B = parseInt(colorA.substring(5), 16) - parseInt(colorB.substring(5), 16);
		if (color_R < 0) color_R = 0;
		if (color_G < 0) color_G = 0;
		if (color_B < 0) color_B = 0;
		return "#" + getTwoHex(color_R) + getTwoHex(color_G) + getTwoHex(color_B);
	}
	function generateColorMap()
	{
		// FF0000 -> FFFF00 upcount   G
		// FEFF00 -> 00FF00 downcount R
		// 00FF01 -> 00FFFF upcount   B
		// 00FEFF -> 0000FF downcount G
		// 0000FF -> FF00FF upcount   R
		// FF00FF -> FF0000 downcount B

		var colorMap = [];
		var cR = 255;
		var cG = 0;
		var cB = 0;

		// upcount   G
		while(cG != 255) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cG++; }
		// downcount R
		while(cR != 0) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cR--; }
		// upcount   B
		while(cB != 255) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cB++; }
		// downcount G
		while(cG != 0) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cG--; }
		// upcount   R
		while(cR != 255) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cR++; }
		// downcount B
		while(cB != 0) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cB--; }
		return colorMap;
	}
	function getTwoHex(value)
	{
		if (value < 0x10)
			return "0" + value.toString(16);
		else
			return value.toString(16);
	}
	function uiObjectMouseOver (d, mouseX, mouseY, rect)
	{
		if (mouse_mode == RED.state.UI_OBJECT_MOUSE_DOWN)
			uiObjectMouseDown(d, mouseX, mouseY, rect);
		currentUiObject = d; // used by scroll event
	}

	function uiObjectMouseOut (d, mouseX, mouseY, rect)
	{
		if (mouse_mode == RED.state.UI_OBJECT_MOUSE_DOWN)
			uiObjectMouseUp(d, mouseX, mouseY, rect, true);
		currentUiObject = null; // used by scroll event
	}
	function uiObjectMouseDown(d, mouseX, mouseY, rect)
	{
		mouse_mode = RED.state.UI_OBJECT_MOUSE_DOWN;
		//console.warn("uiObjectMouseDown " + mouseX + ":" + mouseY);

		if (d.type == "UI_Button") {
			setRectFill(rect);
			if (d.pressAction != "") RED.BiDirDataWebSocketBridge.SendToWebSocket(d.pressAction);
		
		} else if (d.type == "UI_Slider") {
			setUiSliderValueFromMouse(d, mouseX, mouseY);
			if (d.sendMode == "m")
				sendUiSliderValue(d);
		} else if (d.type == "UI_ListBox") {
			var newIndex = rect.attr("listItemIndex");
			if (newIndex == undefined) {
				console.warn("listbox title clicked");
				return; // this happenns when click title bar
			}
			d.selectedIndex = parseInt(newIndex);
			d.dirty = true;
			console.warn("ui_listBoxMouseDown " + d.sendCommand + " " + d.selectedIndex);
			var formatted = eval(d.sendCommand);

			//setRectFill(rect);
			if (d.parentGroup != undefined && d.parentGroup.individualListBoxMode == false)
			{

				UI_ListBoxDeselectOther(d);
			}

			RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
			//redraw(true);
			redraw_update_UI_ListBox(rect, d);
		} else if (d.type == "UI_Piano") {
			var newKeyIndex = rect.attr("keyIndex");
			if (newKeyIndex == undefined) {
				console.warn("piano title clicked");
				return; // this happenns when click title bar
			}
			d.keyIndex = parseInt(newKeyIndex);
			d.keyDown = 0x90;
			setRectFill(rect, "#ff7f0e");
			setRectStroke(rect, "#ff7f0e");
			var formatted = eval(d.sendCommand);
			//console.warn("ui_PianoMouseDown " + formatted  + " "+ d.keyIndex);
			RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
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
		mouse_mode = RED.state.UI_OBJECT_MOUSE_UP;
		
		//console.warn("uiObjectMouseUp " + mouseX + ":" + mouseY);
		if (d.type == "UI_Button") {
			resetRectFill(rect)
			if (d.releaseAction != "") RED.BiDirDataWebSocketBridge.SendToWebSocket(d.releaseAction);
		} else if (d.type == "UI_Slider") {
			if (d.sendMode == "r")
				sendUiSliderValue(d);
		} else if (d.type == "UI_ListBox") {
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
			d.keyDown = 0x80;
			resetRectFill(rect);
			resetRectStroke(rect);
			var formatted = eval(d.sendCommand);
			//console.warn("ui_PianoMouseUp " + formatted  + " "+ d.keyIndex);
			RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
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
				if (d.sendMode == "m")
					sendUiSliderValue(d);
				d.dirty = true;
				redraw_nodes(true);
			}
			else if (delta < 0)
			{
				//console.log("uiObjectMouseScroll down");
				d.val -= 1;
				if (d.val < d.minVal) d.val = d.minVal;
				if (d.sendMode == "m")
					sendUiSliderValue(d);
				d.dirty = true;
				redraw_nodes(true);
			}
		}
	}
	function setRectFill(rect, setColor)
	{
		//console.warn('rect.attr("fillOld")' + rect.attr("fillOld"));
		//console.warn('rect.attr("fill")' + rect.attr("fill"));

		if (rect.attr("fillOld") != undefined)
			rect.attr("fill", rect.attr("fillOld")); // failsafe
		rect.attr("fillOld", rect.attr("fill"));
		if (setColor == undefined)
			rect.attr("fill", subtractColor(rect.attr("fill"), "#202020"));
		else
			rect.attr("fill", setColor);
	}
	function resetRectFill(rect)
	{
		if (rect.attr("fillOld") != undefined)
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
			rect.attr("stroke", subtractColor(rect.attr("stroke"), "#202020"));
		else
			rect.attr("stroke", setColor);
	}
	function resetRectStroke(rect)
	{
		if (rect.attr("strokeOld") != undefined)
			rect.attr("stroke", rect.attr("strokeOld"));
	}

	function clearLinkSelection()
	{
		selected_link = null;
		var links = RED.nodes.links.filter(function(l) { return l.source.z == activeWorkspace && l.target.z == activeWorkspace });
		vis.selectAll(".link").data(links, function(l) { l.selected = false; return l.source.id+":"+l.sourcePort+":"+l.target.id+":"+l.targetPort;});
	}

	function nodeButtonClicked(d) {
		console.warn("node button pressed@"+d.name); // jannik add so that we can see, just maybe for future use of button?
		if (d._def.button.toggle) {
			d[d._def.button.toggle] = !d[d._def.button.toggle];
			d.dirty = true;
		}
		if (d._def.button.onclick) {
			d._def.button.onclick.call(d);
		}
		if (d.dirty) {
			redraw(false);
		}
		d3.event.preventDefault();
	}

	function showTouchMenu(obj,pos) {
		var mdn = mousedown_node;
		var options = [];
		options.push({name:"delete",disabled:(moving_set.length===0),onselect:function() {deleteSelection();}});
		options.push({name:"cut",disabled:(moving_set.length===0),onselect:function() {copySelection();deleteSelection();}});
		options.push({name:"copy",disabled:(moving_set.length===0),onselect:function() {copySelection();}});
		options.push({name:"paste",disabled:(clipboard.length===0),onselect:function() {importNodes(clipboard,true, true);}});
		options.push({name:"edit",disabled:(moving_set.length != 1),onselect:function() { RED.editor.edit(mdn);}});
		options.push({name:"select",onselect:function() {selectAll();}});
		options.push({name:"undo",disabled:(RED.history.depth() === 0),onselect:function() {RED.history.pop();}});

		RED.touch.radialMenu.show(obj,pos,options);
		resetMouseVars();
	}

	
	function checkRequirements(d) {
		//Add requirements
		d.requirementError = false;
		d.conflicts = new Array();
		d.requirements = new Array();
		
		RED.main.requirements.forEach(function(r) {
			if (r.type == d.type) d.requirements.push(r);
		});

		// above could be:
		// d.requirements = RED.main.requirements[d.type];
		// if the structure is changed a little

		//check for conflicts with other nodes:
		d.requirements.forEach(function(r) {
			RED.nodes.eachNode(function (n2) {
				if (n2 != d && n2.requirements != null ) {
					n2.requirements.forEach(function(r2) {
						if (r["resource"] == r2["resource"]) {
							if (r["shareable"] == false ) {
								var msg = "Conflict: shareable '"+r["resource"]+"'  "+d.name+" and "+n2.name;
								//console.log(msg);
								msg = n2.name + " uses " + r["resource"] + ", too";
								d.conflicts.push(msg);
								d.requirementError = true;
							}
							//else
							if (r["setting"] != r2["setting"]) {
								var msg = "Conflict: "+ d.name + " setting['"+r["setting"]+"'] and "+n2.name+" setting['"+r2["setting"]+"']";
								//console.log(msg);
								msg = n2.name + " has different settings: " + r["setting"] + " ./. " + r2["setting"];
								d.conflicts.push(msg);
								d.requirementError = true;
							}
						}
					});
				}
			});
		});		
	}
	
	function redraw_calcNewNodeSize(d)
	{
		//var l = d._def.label;
		//l = (typeof l === "function" ? l.call(d) : l)||"";
		var l = d.name ? d.name : "";//d.id;
		if (d.unknownType != undefined) l = d.type;
		if (d.type == "JunctionLR" || d.type == "JunctionRL")
		{
			d.w = node_def.height;
			d.h = node_def.height;
			return;
		}
		if (d.type == "ConstValue")
		{
			l = d.name + " (" + d.valueType + ")=" + d.value;
		}
		if (d.inputs) // Jannik
		{
			d.w = Math.max(node_def.width,(calculateTextSize(l).w)+50+(d.inputs>0?7:0) );
			d.h = Math.max(node_def.height, (Math.max(d.outputs,d.inputs)||0) * node_def.pin_ydistance + node_def.pin_yspaceToEdge*2);
		}
		else
		{
			d.w = Math.max(node_def.width,(calculateTextSize(l).w)+50+(d._def.inputs>0?7:0) );
			d.h = Math.max(node_def.height,(Math.max(d.outputs,d._def.inputs)||0) * node_def.pin_ydistance + node_def.pin_yspaceToEdge*2);
		}
	}
	function redraw_nodeBadge(nodeRect, d)
	{
		var badge = nodeRect.append("svg:g").attr("class","node_badge_group");
		var badgeRect = badge.append("rect").attr("class","node_badge").attr("rx",5).attr("ry",5).attr("width",40).attr("height",15);
		badge.append("svg:text").attr("class","node_badge_label").attr("x",35).attr("y",11).attr('text-anchor','end').text(d._def.badge());
		if (d._def.onbadgeclick) {
			badgeRect.attr("cursor","pointer")
				.on("click",function(d) { d._def.onbadgeclick.call(d);d3.event.preventDefault();});
		}
	}
	
	function redraw_nodeButton(nodeRect, d)
	{
		var nodeButtonGroup = nodeRect.append('svg:g')
			.attr("transform",function(d) { return "translate("+((d._def.align == "right") ? 94 : -25)+",2)"; })
			.attr("class",function(d) { return "node_button "+((d._def.align == "right") ? "node_right_button" : "node_left_button"); });
		nodeButtonGroup.append('rect')
			.attr("rx",8)
			.attr("ry",8)
			.attr("width",32)
			.attr("height",node_def.height-4)
			.attr("fill","#eee");//function(d) { return d._def.color;})
		nodeButtonGroup.append('rect')
			.attr("x",function(d) { return d._def.align == "right"? 10:5})
			.attr("y",4)
			.attr("rx",5)
			.attr("ry",5)
			.attr("width",16)
			.attr("height",node_def.height-12)
			.attr("fill",function(d) { return d._def.color;})
			.attr("cursor","pointer")
			.on("mousedown",function(d) {if (!lasso) { d3.select(this).attr("fill-opacity",0.2);d3.event.preventDefault(); d3.event.stopPropagation();}})
			.on("mouseup",function(d) {if (!lasso) { d3.select(this).attr("fill-opacity",0.4);d3.event.preventDefault();d3.event.stopPropagation();}})
			.on("mouseover",function(d) {if (!lasso) { d3.select(this).attr("fill-opacity",0.4);}})
			.on("mouseout",function(d) {if (!lasso) {
				var op = 1;
				if (d._def.button.toggle) {
					op = d[d._def.button.toggle]?1:0.2;
				}
				d3.select(this).attr("fill-opacity",op);
			}})
			.on("click",nodeButtonClicked)
			.on("touchstart",nodeButtonClicked)
	}
	function redraw_nodeMainRect_init(nodeRect, d)
	{
		var mainRect = nodeRect.append("rect");

			if (d.type == "UI_Label")
				mainRect.attr("class", "node uiLabel");
			else
				mainRect.attr("class", "node");

		mainRect.classed("node_unknown",function(d) { if (d.unknownType != undefined) return true; return (d.type == "unknown"); });
		mainRect.attr("rx", 6)
			.attr("ry", 6)
			.on("mouseup",nodeMouseUp)
			.on("mousedown",nodeMouseDown)
			.on("mousemove", nodeMouseMove)
			.on("mouseover", nodeMouseOver)
			.on("mouseout", nodeMouseOut)
			.on("touchstart",nodeTouchStart)
			.on("touchend", nodeTouchEnd);
		if (d.type == "UI_Slider")
		{
			mainRect.attr("fill",function(d) { return "#505050";});
			redraw_init_UI_Slider(nodeRect);
		}
		else if (d.type == "UI_ListBox")
		{
			//mainRect.attr("listItemIndex", -1);
			redraw_init_UI_ListBox(nodeRect,d);
		}
		else if (d.type == "UI_Piano")
		{
			redraw_init_UI_Piano(nodeRect,d);
		}
		else
			mainRect.attr("fill",function(d) { return d._def.color;});
			
		//nodeRect.append("rect").attr("class", "node-gradient-top").attr("rx", 6).attr("ry", 6).attr("height",30).attr("stroke","none").attr("fill","url(#gradient-top)").style("pointer-events","none");
		//nodeRect.append("rect").attr("class", "node-gradient-bottom").attr("rx", 6).attr("ry", 6).attr("height",30).attr("stroke","none").attr("fill","url(#gradient-bottom)").style("pointer-events","none");
	}	
	
	function redraw_nodeIcon(nodeRect, d)
	{
		nodeRect.selectAll(".node_icon_group").remove();
		
		var icon_group = nodeRect.append("g")
			.attr("class","node_icon_group")
			.attr("x",0).attr("y",0);

		var icon_shade = icon_group.append("rect")
			.attr("x",0).attr("y",0)
			.attr("class","node_icon_shade")
			.attr("width","30")
			.attr("stroke","none")
			.attr("fill","#000")
			.attr("fill-opacity","0.05")
			.attr("height",function(d){return Math.min(50,d.h-4);});

		var icon = icon_group.append("image")
			.attr("xlink:href","icons/"+d._def.icon)
			.attr("class","node_icon")
			.attr("x",0)
			.attr("width","30")
			.attr("height","30");

		var icon_shade_border = icon_group.append("path")
			.attr("d",function(d) { return "M 30 1 l 0 "+(d.h-2)})
			.attr("class","node_icon_shade_border")
			.attr("stroke-opacity","0.1")
			.attr("stroke","#000")
			.attr("stroke-width","2");

		if ("right" == d._def.align) {
			icon_group.attr('class','node_icon_group node_icon_group_'+d._def.align);
			icon_shade_border.attr("d",function(d) { return "M 0 1 l 0 "+(d.h-2)});
			//icon.attr('class','node_icon node_icon_'+d._def.align);
			//icon.attr('class','node_icon_shade node_icon_shade_'+d._def.align);
			//icon.attr('class','node_icon_shade_border node_icon_shade_border_'+d._def.align);
		}

		/*if (d._def.inputs > 0 && d._def.align == null) {
		    icon_shade.attr("width",35);
		    icon.attr("transform","translate(5,0)");
		    icon_shade_border.attr("transform","translate(5,0)");
		}*/
		//if (d._def.outputs > 0 && "right" == d._def.align) {
		//    icon_shade.attr("width",35); //icon.attr("x",5);
		//}

		var img = new Image();
		img.src = "icons/"+d._def.icon;
		img.onload = function() {
			icon.attr("width",Math.min(img.width,30));
			icon.attr("height",Math.min(img.height,30));
			icon.attr("x",15-Math.min(img.width,30)/2);
			//if ("right" == d._def.align) {
			//    icon.attr("x",function(d){return d.w-img.width-1-(d.outputs>0?5:0);});
			//    icon_shade.attr("x",function(d){return d.w-30});
			//    icon_shade_border.attr("d",function(d){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2);});
			//}
		};

		//icon.style("pointer-events","none");
		icon_group.style("pointer-events","none");			
	}
	function redraw_nodeText(nodeRect, d)
	{
		var text = nodeRect.append('svg:text').attr('class','node_label').attr('x', 38).attr('dy', '0.35em').attr('text-anchor','start');
				
		if (d._def.align) {
			text.attr('class','node_label node_label_'+d._def.align);
			text.attr('text-anchor','end');
		}
	}
	function redraw_label(nodeRect, d)
	{
		var nodeText = "";
		var nodeRects = nodeRect.selectAll('text.node_label').text(function(d,i){
			/* if (d._def.label) {
				if (typeof d._def.label == "function") {
					return d._def.label.call(d);
				} else {
					return d._def.label;
				}
			}
			return "n.a.";
			 */
			if (d.type == "ConstValue")
			{
				nodeText = d.name + " (" + d.valueType + ")=" + d.value;
				return nodeText;
			}
			else if (d.type == "UI_Slider")
			{
				nodeText = d.name ? d.name : "";
				if (nodeText == "") 
				if (nodeText.includes("#")) nodeText = nodeText.replace("#", "d.val");
				try{nodeText = new String(eval(nodeText)); }
				catch (e) { 
					//nodeText = d.label;
				}
				
				return nodeText + "";
			}
			nodeText = d.name ? d.name : "";// d.id;
			return nodeText;
		})
		.attr('class',function(d){
			return 'node_label';//+
			//(d._def.align?' node_label_'+d._def.align:''); //+
			//(d._def.label?' '+(typeof d._def.labelStyle == "function" ? d._def.labelStyle.call(d):d._def.labelStyle):'') ;
		});
		
		if (d.textSize != undefined)
			nodeRects.attr("style", "font-size: "+d.textSize+"px;");

		if ((d.oldNodeText != undefined && nodeText.localeCompare(d.oldNodeText) == 0 ) &&
			(d.oldWidth != undefined && d.oldWidth === d.w) &&
			(d.oldHeight != undefined && d.oldHeight === d.h) &&
			(d.oldTextSize != undefined && d.oldTextSize === d.textSize))
			return;

		//console.error(d.oldNodeText + "==" + nodeText + ":"+ (nodeText.localeCompare(d.oldNodeText)) +  "\n" +
		//			  d.oldWidth + "==" + d.w + ":" + (d.oldWidth == d.w) + "\n" +
		//			  d.oldHeight + "!=" + d.h + ":" + (d.oldHeight == d.h));
		d.oldNodeText = nodeText;
		d.oldWidth = parseFloat(d.w);
		d.oldHeight = parseFloat(d.h);
		if (d.textSize != undefined)
			d.oldTextSize = parseFloat(d.textSize);

		var textSize = calculateTextSize(nodeText, d.textSize);
		
		//console.warn("textSize:" + textSize.h + ":" + textSize.w);
		nodeRects.attr('y', function(d){
			if (d.type == "UI_Slider")
			{
				return parseInt(textSize.h) - 30;
			}
			else if (d.type == "UI_ListBox") return parseInt(textSize.h);
			else if (d.type == "UI_Piano") return parseInt(textSize.h);
			else if (d.type == "group") return parseInt(textSize.h);
			else return (d.h/2)-1; // allways divide by 2
		});

		if (d._def.uiObject != undefined)
		nodeRects.attr('x', function(d)
		{
			//console.log("text width:" + calculateTextSize(d.name).w);
			//console.log("node width:" + d.w);
			return (d.w-(textSize.w))/2; // allways divide by 2
		});
	}

	function redraw_nodeStatus(nodeRect)
	{
		var status = nodeRect.append("svg:g").attr("class","node_status_group").style("display","none");

		var statusRect = status.append("rect").attr("class","node_status")
			.attr("x",6).attr("y",1).attr("width",9).attr("height",9)
			.attr("rx",2).attr("ry",2).attr("stroke-width","3");

		var statusLabel = status.append("svg:text")
			.attr("class","node_status_label")
			.attr('x',20).attr('y',9)
			.style({
				'stroke-width': 0,
				'fill': '#888',
				'font-size':'9pt',
				'stroke':'#000',
				'text-anchor':'start'
			});
	}
	function redraw_nodeInputs(nodeRect, d)
	{
		var numInputs = 0;
		if (d.inputs) // Jannik
			numInputs = d.inputs;
		else
			numInputs = d._def.inputs;
		
		var inputPorts = nodeRect.selectAll(".port_input");

		for (var i = 0; i < inputPorts.length; i++)
		{
			//console.warn(inputPorts[i]); // debug
			$(inputPorts[i]).popover("destroy");
		}
		inputPorts.remove();
		
		var inputlist = [];
		for (var n=0; n < numInputs; n++) {
			var link = RED.nodes.links.filter(function(l){return (l.target == d && l.targetPort == n);}); // used to see if any link is connected to the input
			
			var y = (d.h/2)-((numInputs-1)/2)*node_def.pin_ydistance; // allways divide by 2
			//console.error("in node y:" + y);
			y = (y+node_def.pin_ydistance*n)-node_def.pin_ysize/2;// allways divide by 2

			var rect = nodeRect.append("rect");
			inputlist[n] = rect;
			rect.attr("class","port port_input").attr("rx",node_def.pin_rx).attr("ry",node_def.pin_ry)
				.attr("y",y).attr("width",node_def.pin_xsize).attr("height",node_def.pin_ysize).attr("index",n);

			if (d.type == "JunctionRL")
				rect.attr("x",d.w - node_def.pin_ysize/2);// allways divide by 2
			else
				rect.attr("x",node_def.pin_xpos);
			

			if (link && link.length > 0) {
				// this input already has a link connected, so disallow new links
				rect.on("mousedown",null)
				    .on("mouseup", null)
					//.on("touchstart", null)
					//.on("touchend", null)
					.on("mouseover", nodeInput_mouseover) // used by popOver
					.on("mouseout", nodePort_mouseout) // used by popOver
					.classed("port_hovered",false);
			} else {
				// allow new link on inputs without any link connected
				rect.on("mousedown", (function(nn){return function(d2){portMouseDown(d2,1,nn);}})(n))
				    .on("mouseup", (function(nn){return function(d2){portMouseUp(d2,1,nn);}})(n))
					//.on("touchstart", (function(nn){return function(d){portMouseDown(d,1,nn);}})(n))
					//.on("touchend", (function(nn){return function(d){portMouseUp(d,1,nn);}})(n))
					.on("mouseover", nodeInput_mouseover)
					.on("mouseout", nodePort_mouseout)
					//.on("mouseover", function(d) { var port = d3.select(this); port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 1 ));})
					//.on("mouseout", function(d) { var port = d3.select(this); port.classed("port_hovered",false);})
					
			}
		}
		d.inputlist = inputlist;

		nodeRect.selectAll(".port_input").each(function(d,i) {
			var port = d3.select(this);
			var numInputs = 0;
			if (d.inputs) numInputs = d.inputs;
			else numInputs = d._def.inputs;
				
			var y = (d.h/2)-((numInputs-1)/2)*node_def.pin_ydistance;// allways divide by 2
			y = (y+node_def.pin_ydistance*i)-node_def.pin_ysize/2;// allways divide by 2
			port.attr("y",y)
		});
	}
		
	function redraw_nodeOutputs(nodeRect, d)
	{
		var numOutputs = d.outputs;

		var y = (d.h/2)-((numOutputs-1)/2)*node_def.pin_ydistance;

		//if (d.type == "Mod") // debug test only
		//{
		//	console.error("before:" + d.ports);
		//	console.error("d3.range(numOutputs):" + d3.range(numOutputs));
		//}

		//d.ports = d.ports || d3.range(numOutputs);
		d.ports = d3.range(numOutputs);

		//if (d.type == "Mod") // debug test only
		//	console.error("after:" + d.ports);
		
		d._ports = nodeRect.selectAll(".port_output").data(d.ports);
		d._ports.enter().append("rect")
		    .attr("class","port port_output").attr("rx",node_def.pin_rx).attr("ry",node_def.pin_ry).attr("width",node_def.pin_xsize).attr("height",node_def.pin_ysize)
			.attr("nodeType",d.type)
			.on("mousedown",(function(){var node = d; return function(d,i){console.error(d +":"+ i); portMouseDown(node,0,i);}})() )
			.on("mouseup",(function(){var node = d; return function(d,i){console.error(d +":"+ i); portMouseUp(node,0,i);}})() )
			//.on("touchstart",(function(){var node = d; return function(d,i){portMouseDown(node,0,i);}})() )
			//.on("touchend",(function(){var node = d; return function(d,i){portMouseUp(node,0,i);}})() )
			.on("mouseover", nodeOutput_mouseover)
			.on("mouseout", nodePort_mouseout)
			//.on("mouseover",function(d,i) { var port = d3.select(this); port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type !== 0 ));})
			//.on("mouseout",function(d,i) { var port = d3.select(this); port.classed("port_hovered",false);});
		d._ports.exit().remove();
		if (d._ports) {
			numOutputs = d.outputs || 1;
			y = (d.h/2)-((numOutputs-1)/2)*node_def.pin_ydistance; // allways divide by 2 (local space)
			var x = 0;
			if (d.type == "JunctionRL")
				x = node_def.pin_xpos
			else
				x = d.w - node_def.pin_ysize/2;// allways divide by 2 (local space)
			d._ports.each(function(d,i) {
				var port = d3.select(this);
				port.attr("y",(y+node_def.pin_ydistance*i)-node_def.pin_ysize/2);// allways divide by 2 (local space)
				
				port.attr("x",x);
			});
		}
	}
	function redraw_links_init()
	{
		//const t0 = performance.now();
		var wsLinks = RED.nodes.links.filter(function(d)
		{ 
			return (d.source.z == activeWorkspace) &&
					(d.target.z == activeWorkspace);

		});
		//const t1 = performance.now();
		var visLinksAll = visLinks.selectAll(".link").data(wsLinks, function(d) { return d.source.id+":"+d.sourcePort+":"+d.target.id+":"+d.targetPort;});
		//const t2 = performance.now();

		var linkEnter = visLinksAll.enter().insert("g",".node").attr("class","link");
		anyLinkEnter = false;
		linkEnter.each(function(d,i) {
			anyLinkEnter = true;
			
			console.log("link enter" + Object.getOwnPropertyNames(d));
			var l = d3.select(this);
			l.append("svg:path").attr("class","link_background link_path")
			   .on("mousedown",function(d) {
					mousedown_link = d;
					if (!d3.event.ctrlKey)
						clearSelection();
					selected_link = mousedown_link;
					d.selected = true;
					updateSelection();
					//redraw();
					redraw_links_init();
					redraw_links();
					d3.event.stopPropagation();
				})
				.on("touchstart",function(d) {
					mousedown_link = d;
					clearSelection();
					selected_link = mousedown_link;
					updateSelection();
					//redraw();
					redraw_links_init();
					redraw_links();
					d3.event.stopPropagation();
				});
			l.append("svg:path").attr("class","link_outline link_path");
			l.append("svg:path").attr("class","link_line link_path");
		});

		visLinksAll.exit().remove();

		visLinksAll.classed("link_selected", function(d) { return d === selected_link || d.selected; });
		visLinksAll.classed("link_unknown",function(d) { if (d.target.unknownType != undefined) return true; return d.target.type == "unknown" || d.source.type == "unknown"});
		//const t3 = performance.now();

		//console.log("redraw_links_init filter:"+ (t1-t0) +  "ms, select all:" + (t2-t1) + " ms, linkEnterEdit: " + (t3-t2) + " ms");
	}

	function redraw_links()
	{
		//const t0 = performance.now();
		// only redraw links that is selected and where the node is moving
		if (anyLinkEnter)
			var links = vis.selectAll(".link_path");
		else
			var links = vis.selectAll(".link_selected").selectAll(".link_path");
		anyLinkEnter = false;
		links.attr("d",redraw_link);
		//const t1 = performance.now();
		//console.log("redraw_links :"+ (t1-t0) +  "ms");
	}
	function redraw_link(d)
	{
		var numOutputs = d.source.outputs || 1;
		var sourcePort = d.sourcePort || 0;
		
		var numInputs = 0;
		if (d.target.inputs) numInputs = d.target.inputs || 1; //Jannik
		else numInputs = d.target._def.inputs || 1;
		
		var targetPort = d.targetPort || 0;
		
		if (posMode === 2)
		{
			var ytarget = -((numInputs-1)/2)*node_def.pin_ydistance +node_def.pin_ydistance*targetPort;
			var ysource = -((numOutputs-1)/2)*node_def.pin_ydistance +node_def.pin_ydistance*sourcePort;
			var dy = (d.target.y+ytarget)-(d.source.y+ysource);
			var dx = (d.target.x-d.target.w/2)-(d.source.x+d.source.w/2);
		}
		else
		{
			var ytarget = -((numInputs-1)/2)*node_def.pin_ydistance +node_def.pin_ydistance*targetPort + d.target.h/2;
			var ysource = -((numOutputs-1)/2)*node_def.pin_ydistance +node_def.pin_ydistance*sourcePort + d.source.h/2;
			var dy = (d.target.y+ytarget)-(d.source.y+ysource);
			if (d.target.type == "JunctionRL" && d.source.type == "JunctionRL") // Left Out to Right In
				var dx = (d.source.x)-(d.target.x+d.target.w);
			else if (d.source.type == "JunctionRL") // Left Out to Left In
				var dx = (d.source.x) - (d.target.x);
			else if (d.target.type == "JunctionRL") // Right Out to Right In
				var dx = (d.source.x+d.source.w) - (d.target.x+d.target.w);
			else // standard
				var dx = (d.target.x)-(d.source.x+d.source.w);

		}
		var delta = Math.sqrt(dy*dy+dx*dx);
		var scale = settings.lineCurveScale;// use of getter which uses parseFloat
		var scaleY = 0;
		if (delta < node_def.width) {
			scale = 0.75-0.75*((node_def.width-delta)/node_def.width);
		}

		if (dx < 0) {
			scale += 2*(Math.min(5*node_def.width,Math.abs(dx))/(5*node_def.width));
			if (Math.abs(dy) < 3*node_def.height) {
				scaleY = ((dy>0)?0.5:-0.5)*(((3*node_def.height)-Math.abs(dy))/(3*node_def.height))*(Math.min(node_def.width,Math.abs(dx))/(node_def.width)) ;
			}
		}
		if (d.target.type == "JunctionRL" && d.source.type == "JunctionRL") // Left Out to Right In
		{
			if (posMode == 2)
			{
				d.x1 = d.source.x-d.source.w/2;
				d.x2 = d.target.x+d.target.w/2;
			}
			else
			{
				d.x1 = d.source.x;
				d.x2 = d.target.x+d.target.w;
			}
			d.y1 = d.source.y+ysource;
			d.y2 = d.target.y+ytarget;

			return generateLinkPath(d.source,d.target,d.x1, d.y1, d.x2, d.y2, -3);
			return "M "+(d.x1)+" "+(d.y1)+
				" C "+(d.x1-scale*d.target.w)+" "+(d.y1+0.25*node_def.height)+" "+
						(d.x2+scale*d.target.w)+" "+(d.y2-0.25*node_def.height)+" "+
						(d.x2)+" "+d.y2;
		}
		else if (d.source.type == "JunctionRL") // Left Out to Left In
		{
			if (posMode == 2)
			{
				d.x1 = d.source.x-d.source.w/2;
				d.x2 = d.target.x-d.target.w/2;
			}
			else
			{
				d.x1 = d.source.x;
				d.x2 = d.target.x;
			}
			d.y1 = d.source.y+ysource;
			d.y2 = d.target.y+ytarget;

			return generateLinkPath(d.source,d.target,d.x1, d.y1, d.x2, d.y2, -2.5, 2.5);
			return "M "+(d.x1)+" "+(d.y1)+
				" C "+(d.x1-scale*d.source.w*3.5)+" "+(d.y1-scaleY*node_def.height*2)+" "+
						(d.x2-scale*d.source.w*2.0)+" "+(d.y2-scaleY*node_def.height)+" "+
						(d.x2)+" "+d.y2;
		}
		else if (d.target.type == "JunctionRL") // Right Out to Right In
		{
			if (posMode == 2)
			{
				d.x1 = d.source.x+d.source.w/2;
				d.x2 = d.target.x+d.target.w/2;
			}
			else
			{
				d.x1 = d.source.x+d.source.w;
				d.x2 = d.target.x+d.target.w;
			}
			d.y1 = d.source.y+ysource;
			d.y2 = d.target.y+ytarget;

			return generateLinkPath(d.source,d.target,d.x1, d.y1, d.x2, d.y2, 2.5, -2.5);
			return "M "+(d.x1)+" "+(d.y1)+
				" C "+(d.x1+scale*d.target.w*2)+" "+(d.y1+scaleY*node_def.height)+" "+
						(d.x2+scale*d.target.w*2)+" "+(d.y2+scaleY*node_def.height)+" "+
						(d.x2)+" "+d.y2;		
		}
		else // standard
		{
			if (posMode == 2)
			{
				d.x1 = d.source.x+d.source.w/2;
				d.x2 = d.target.x-d.target.w/2;
			}
			else
			{
				d.x1 = d.source.x+d.source.w;
				d.x2 = d.target.x;
			}
			d.y1 = d.source.y+ysource;
			d.y2 = d.target.y+ytarget;

			return generateLinkPath(d.source,d.target,d.x1, d.y1, d.x2, d.y2, settings.lineConnectionsScale);
			return "M "+(d.x1)+" "+(d.y1)+
				" C "+(d.x1+scale*node_def.width)+" "+(d.y1+scaleY*d.source.h)+" "+
						(d.x2-scale*node_def.width)+" "+(d.y2-scaleY*d.target.h)+" "+
						(d.x2)+" "+d.y2;
		}
	}
	
	
	var linksPosMode = 2;
	function generateLinkPath(orig, dest, origX,origY, destX, destY, sc1, sc2) {
		var node_height = orig.h; //node_def.height;
		var node_width = node_def.width;
		var node_dest_height = node_def.height;
		var node_dest_width = node_def.width;
        var dy = destY-origY;
        var dx = destX-origX;
        var delta = Math.sqrt(dy*dy+dx*dx);
        var scale = settings.lineCurveScale;
		var scaleY = 0;
		if (sc2 == undefined) sc2 = sc1;
        if (dx*sc1 > 0 || dx*sc2 > 0) {
            if (delta < node_width) {
                scale = 0.75-0.75*((node_width-delta)/node_width);
                // scale += 2*(Math.min(5*node_width,Math.abs(dx))/(5*node_width));
                // if (Math.abs(dy) < 3*node_height) {
                //     scaleY = ((dy>0)?0.5:-0.5)*(((3*node_height)-Math.abs(dy))/(3*node_height))*(Math.min(node_width,Math.abs(dx))/(node_width)) ;
                // }
            }
        } else {
            scale = 0.4-0.2*(Math.max(0,(node_width-Math.min(Math.abs(dx),Math.abs(dy)))/node_width));
        }
        if (dx*sc1 > 0 || dx*sc2 > 0) {
            return "M "+origX+" "+origY+
                " C "+(origX+sc1*(node_width*scale))+" "+(origY+scaleY*node_height)+" "+
                (destX-sc2*(scale)*node_width)+" "+(destY-scaleY*node_dest_height)+" "+
                destX+" "+destY
        } else {
			console.error("Test");
            var midX = Math.floor(destX-dx/linksPosMode);
            var midY = Math.floor(destY-dy/linksPosMode);
            //
            if (dy === 0) {
                midY = destY + node_height;
            }
			var cp_height = node_height/linksPosMode;
			var cp_dest_height = node_dest_height/linksPosMode;
            var y1 = (destY + midY)/linksPosMode
            var topX =origX + sc1*node_width*scale;
            var topY = dy>0?Math.min(y1 - dy/linksPosMode , origY+cp_height):Math.max(y1 - dy/linksPosMode , origY-cp_height);
            var bottomX = destX - sc2*node_width*scale;
            var bottomY = dy>0?Math.max(y1, destY-cp_height):Math.min(y1, destY+cp_height);
            var x1 = (origX+topX)/linksPosMode;
            var scy = dy>0?1:-1;
            var cp = [
                // Orig -> Top
                [x1,origY],
                [topX,dy>0?Math.max(origY, topY-cp_height):Math.min(origY, topY+cp_height)],
                // Top -> Mid
                // [Mirror previous cp]
                [x1,dy>0?Math.min(midY, topY+cp_height):Math.max(midY, topY-cp_height)],
                // Mid -> Bottom
                // [Mirror previous cp]
                [bottomX,dy>0?Math.max(midY, bottomY-cp_height):Math.min(midY, bottomY+cp_height)],
                // Bottom -> Dest
                // [Mirror previous cp]
                [(destX+bottomX)/linksPosMode,destY]
            ];
            if (cp[2][1] === topY+scy*cp_height) {
                if (Math.abs(dy) < cp_height*10) {
                    cp[1][1] = topY-scy*cp_height/linksPosMode;
                    cp[3][1] = bottomY-scy*cp_height/linksPosMode;
                }
                cp[2][0] = topX;
            }
            return "M "+origX+" "+origY+
                " C "+
                   cp[0][0]+" "+cp[0][1]+" "+
                   cp[1][0]+" "+cp[1][1]+" "+
                   topX+" "+topY+
                " S "+
                   cp[2][0]+" "+cp[2][1]+" "+
                   midX+" "+midY+
               " S "+
                  cp[3][0]+" "+cp[3][1]+" "+
                  bottomX+" "+bottomY+
                " S "+
                    cp[4][0]+" "+cp[4][1]+" "+
                    destX+" "+destY
        }
	}
	
	function redraw_paletteNodesReqError(d)
	{
		var cat = d._def.category;
		if (cat == undefined) return;
		if (!cat.startsWith("input") && !cat.startsWith("output")) return;
		//console.error(cat);
		//cat = cat.substring(0, cat.lastIndexOf("-"));
		//console.warn("catname @ redraw_paletteNodesReqError:" + cat);
		var e1 = document.getElementById("palette_node_"+cat + "_"+d.type);

		//console.error("palette_node_"+cat + "_"+d.type);
		var e2 = e1.getElementsByClassName("palette_req_error")[0]; // palette_req_error is using a style, where the position of the icon is defined
		e2.addEventListener("click", 
							function(){RED.notify('Conflicts:<ul><li>'+d.conflicts.join('</li><li>')+'</li></ul>',null,false, 5000);},
							{once: true});
		if (d.requirementError)
			e2.classList.remove("hidden");
		else
			e2.classList.add("hidden");
	}
	function redraw_nodeReqError(nodeRect, d)
	{
		nodeRect.selectAll(".node_reqerror")
			.attr("x",function(d){return d.w-25-(d.changed?13:0)})
			.classed("hidden",function(d){ return !d.requirementError; })
			.on("click", function(){RED.notify(
				'Conflicts:<ul><li>'+d.conflicts.join('</li><li>')+'</li></ul>',
				null,
				false,
				5000
				)});
	}
	
	function redraw_nodeRefresh(nodeRect, d) // this contains the rest until they get own functions
	{
		//nodeRect.selectAll(".centerDot").attr({"cx":function(d) { return d.w/posMode;},"cy":function(d){return d.h/posMode}});
		if (posMode === 2)
			nodeRect.attr("transform", function(d) { return "translate(" + (d.x-d.w/2) + "," + (d.y-d.h/2) + ")"; });
		else
			nodeRect.attr("transform", function(d) { return "translate(" + (d.x) + "," + (d.y) + ")"; });

		var nodenodeRect = nodeRect.selectAll(".node")			
			.classed("node_selected",function(d) { return d.selected; })
			.classed("node_highlighted",function(d) { return d.highlighted; })
		;
		if (d.type != "UI_Piano")
		{
			nodenodeRect.attr("width",function(d){return d.w});
			nodenodeRect.attr("height",function(d){return d.h;});
		}
		//nodeRect.selectAll(".node-gradient-top").attr("width",function(d){return d.w});
		//nodeRect.selectAll(".node-gradient-bottom").attr("width",function(d){return d.w}).attr("y",function(d){return d.h-30});

		nodeRect.selectAll(".node_icon_group_right").attr('transform', function(d){return "translate("+(d.w-30)+",0)"});
		nodeRect.selectAll(".node_label_right").attr('x', function(d){return d.w-38});
		//nodeRect.selectAll(".node_icon_right").attr("x",function(d){return d.w-d3.select(this).attr("width")-1-(d.outputs>0?5:0);});
		//nodeRect.selectAll(".node_icon_shade_right").attr("x",function(d){return d.w-30;});
		//nodeRect.selectAll(".node_icon_shade_border_right").attr("d",function(d){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2)});
		
		nodeRect.selectAll(".node_icon").attr("y",function(d){return (d.h-d3.select(this).attr("height"))/posMode;});
		
		nodeRect.selectAll(".node_icon_shade").attr("height",function(d){return d.h;});
		//nodeRect.selectAll(".node_icon_shade_border").attr("d",function(d){ return "M "+(("right" == d._def.align) ?0:30)+" 1 l 0 "+(d.h-2)});

		//nodeRect.selectAll(".node_tools").attr("x",function(d){return d.w-35;}).attr("y",function(d){return d.h-20;});

		/*nodeRect.selectAll(".node_changed")
			.attr("x",function(d){return d.w-10})
			.classed("hidden",function(d) { return !d.changed; });*/ // this is disabled above

		/*nodeRect.selectAll(".node_error")
			.attr("x",function(d){return d.w-10-(d.changed?13:0)})
			.classed("hidden",function(d) { return d.valid; });*/  // this is disabled above
		
		/*nodeRect.selectAll('.node_right_button').attr("transform",function(d){
				var x = d.w-6;
				if (d._def.button.toggle && !d[d._def.button.toggle]) {
					x = x - 8;
				}
				return "translate("+x+",2)";
		});
		nodeRect.selectAll('.node_right_button rect').attr("fill-opacity",function(d){
				if (d._def.button.toggle) {
					return d[d._def.button.toggle]?1:0.2;
				}
				return 1;
		});*/ // maybe we don't need this

		//nodeRect.selectAll('.node_right_button').attr("transform",function(d){return "translate("+(d.w - d._def.button.width.call(d))+","+0+")";}).attr("fill",function(d) {
		//         return typeof d._def.button.color  === "function" ? d._def.button.color.call(d):(d._def.button.color != null ? d._def.button.color : d._def.color)
		//});
		/*
		nodeRect.selectAll('.node_badge_group').attr("transform",function(d){return "translate("+(d.w-40)+","+(d.h+3)+")";});
		nodeRect.selectAll('text.node_badge_label').text(function(d,i) {
			 if (d._def.badge) {
				if (typeof d._def.badge == "function") {
					return d._def.badge.call(d);
				} else {
					return d._def.badge;
				}
			}
			//return "";
			return d.name ? d.name : d.id;
		});*/
		/*if (!showStatus || !d.status) {
			nodeRect.selectAll('.node_status_group').style("display","none");
		} else {
			nodeRect.selectAll('.node_status_group').style("display","inline").attr("transform","translate(3,"+(d.h+3)+")");
			var fill = status_colours[d.status.fill]; // Only allow our colours for now
			if (d.status.shape == null && fill == null) {
				nodeRect.selectAll('.node_status').style("display","none");
			} else {
				var style;
				if (d.status.shape == null || d.status.shape == "dot") {
					style = {
						display: "inline",
						fill: fill,
						stroke: fill
					};
				} else if (d.status.shape == "ring" ){
					style = {
						display: "inline",
						fill: '#fff',
						stroke: fill
					}
				}
				nodeRect.selectAll('.node_status').style(style);
			}
			if (d.status.text) {
				nodeRect.selectAll('.node_status_label').text(d.status.text);
			} else {
				nodeRect.selectAll('.node_status_label').text("");
			}
		}*/
	}
	function nodeOutput_mouseover(pi) // here d is the portindex
	{
		var port = d3.select(this); 
		
		$(this).popover("destroy"); // destroy prev
		var data = getIOpinInfo(this, undefined, pi);
		showPopOver(this, true, data, "left");
						
		port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 0 ));
		//console.log("nodeOutput_mouseover: " + this.getAttribute("nodeZ") + "." + this.getAttribute("nodeName") +" , port:" + pi);
	}
	function nodeInput_mouseover(d) // here d is the node
	{
		var port = d3.select(this); 
		
		$(this).popover("destroy"); // destroy prev
		var data = getIOpinInfo(this, d, this.getAttribute("index")); // d is the node
		showPopOver(this, true, data, "right");
						
		port.classed("port_hovered",(mouse_mode!=RED.state.JOINING || mousedown_port_type != 1 ));
		//console.log("nodeInput_mouseover: " + d.name +" , port:" + this.getAttribute("index"));
	}
	function nodePort_mouseout(d)
	{
		var port = d3.select(this); 
		port.classed("port_hovered",false);
		$(this).popover("destroy"); // destroy prev
	}

	//#region Group redraw init/update

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
			moving_set.push({n:group.nodes[ni]});

			if (group.nodes[ni].nodes != undefined && group.nodes[ni].nodes.length != 0)
				SelectAllInGroup(group.nodes[ni]);
		}
	}
	function getGroupAt(x,y) {
		var candidates = [];
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
				if (g !== mousedown_node)
                	candidates.push(g);
            }
		}
		if (candidates.length != 0)
			return candidates[candidates.length-1]; // return last item
		return undefined;
	}

	
	function removeNodeFromGroup(group, node)
	{
		
		for (var i = 0; i < group.nodes.length; i++)
		{
			if (group.nodes[i] == node)
			{
				node.parentGroup = undefined;
				group.nodes.splice(i,1);
				console.warn(node.name + " was removed from the group " + group.name)
				RED.notify(node.name + " was removed from the group " + group.name,false,false, 2000);
			}
		}
	}
	function moveSelectionToFromGroupMouseUp()
	{
		var currentHoveredGroupDef = (currentHoveredGroup != undefined);
		var lastHoveredGroupDef = (lastHoveredGroup != undefined);
		//console.error(currentHoveredGroupDef + ":" + lastHoveredGroupDef);

		if (lastHoveredGroupDef == true)
		{
			//console.log("lastHoveredGroupDef == true");
			for (var i = 0; i < moving_set.length; i++)
			{
				var d = moving_set[i].n;
				if (lastHoveredGroup == d) continue;

				removeNodeFromGroup(lastHoveredGroup, d);
			}
			lastHoveredGroup.hovered = false;
			lastHoveredGroup = undefined;
		}
		if (currentHoveredGroupDef == true)
		{
			//console.log("currentHoveredGroupDef == true");
			for (var i = 0; i < moving_set.length; i++)
			{
				//moveToFromGroupMouseUp(moving_set[i].n);
				var d = moving_set[i].n;
				if (currentHoveredGroup == d) continue;
				if (currentHoveredGroup.nodes.includes(d)) continue;
				if (d.parentGroup != undefined) continue;
				
				// here a parent "recursive prevention" root check needs to be done
				// if any parent of currentHoveredGroup is equal to d
				// then that parent should never be added
				if (ifAnyRootParent(currentHoveredGroup, d)){ console.log("(recursive prevention) cannot add " + d.name + " into " + currentHoveredGroup.name); continue; }

				currentHoveredGroup.nodes.push(d);
				d.parentGroup = currentHoveredGroup;
				console.warn(d.name + " was added to the group " + currentHoveredGroup.name);
				RED.notify(d.name + " was added to the group " + currentHoveredGroup.name,false,false, 2000);
			}
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
	function setUInode_Xmin(node, val)
	{
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
	function setUInode_Xmax(node, val)
	{
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
	function setUInode_Ymin(node, val)
	{
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
	function setUInode_Ymax(node, val)
	{
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
	function saveOldSizeAndPos(node)
	{
		node.xo = node.x;
		node.yo = node.y;
		node.wo = node.w;
		node.ho = node.h;
	}
	function restoreOldSizeAndPos(node)
	{
		if (node.xo != undefined) node.x = node.xo;
		if (node.yo != undefined) node.y = node.yo;
		if (node.wo != undefined) node.w = node.wo;
		if (node.ho != undefined) node.h = node.ho;
	}
	function getNodeExtents(node)
	{
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
		var groupAt = getGroupAt(mouse_position[0], mouse_position[1]);
		if (groupAt != undefined)
		{
			if (currentHoveredGroup != undefined) // used when hovering from child-to-parent or parent-to-child
			{
				if (groupAt == currentHoveredGroup) return;
				currentHoveredGroup.hovered = false;
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
			if (currentHoveredGroup.parentGroup !== mousedown_node)
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
			restoreOldSizeAndPos(currentHoveredGroup);
			currentHoveredGroup = undefined;
			redraw_groups(true);
		}
	}
	function redraw_groups_init()
	{
		activeGroups = RED.nodes.nodes.filter(function(d)
		{
			return (d.z == activeWorkspace && d.type == "group");
		});
		//console.error(activeGroups);
		// just use .nodegroup for now
		// it should maybe have seperate class later
		var visGroupAll = visGroups.selectAll(".nodegroup").data(activeGroups, function(d){return d.id;});
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
									.on("mouseup",nodeMouseUp)
									.on("mousedown",nodeMouseDown)
									.on("mousemove", nodeMouseMove)
									.on("mouseover", nodeMouseOver)
									.on("mouseout", nodeMouseOut)
									.on("touchstart",nodeTouchStart)
									.on("touchend", nodeTouchEnd);

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

			if (posMode === 2)
				groupRect.attr("transform", function(d) { return "translate(" + (d.x-d.w/2) + "," + (d.y-d.h/2) + ")"; });
			else
				groupRect.attr("transform", function(d) { return "translate(" + (d.x) + "," + (d.y) + ")"; });
				
			groupRect.selectAll(".node")
				.attr("width",function(d){return d.w})
				.attr("height",function(d){return d.h})
				.attr("fill", d.bgColor)
				.attr("style", "stroke:" + d.border_color + ";");
				//.attr("stroke", d.border_color);

			redraw_label(groupRect, d);
			
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
	//#endregion Group redraw init/update

	//#region UI items redraw init/update
	function uiNodeResize()
	{
		if (mouse_mode == RED.state.RESIZE_LEFT || mouse_mode == RED.state.RESIZE_TOP_LEFT || mouse_mode == RED.state.RESIZE_BOTTOM_LEFT) {
			var dx = mouse_offset_resize_x - mouse_position[0];
			mousedown_node.w = parseInt(mousedown_node_w + dx);
			
			if (mousedown_node.w <= node_def.width) mousedown_node.w = node_def.width;
			else mousedown_node.x = mousedown_node_x - dx/posMode;
			mousedown_node.dirty = true;
		} 
		if (mouse_mode == RED.state.RESIZE_RIGHT || mouse_mode == RED.state.RESIZE_TOP_RIGHT || mouse_mode == RED.state.RESIZE_BOTTOM_RIGHT) {
			var dx = mouse_offset_resize_x - mouse_position[0];
			mousedown_node.w = parseInt(mousedown_node_w - dx);
			
			if (mousedown_node.w <= node_def.width) mousedown_node.w = node_def.width;
			else if (posMode === 2) mousedown_node.x = mousedown_node_x - dx/2;
			mousedown_node.dirty = true;
		} 
		if (mouse_mode == RED.state.RESIZE_TOP || mouse_mode == RED.state.RESIZE_TOP_LEFT || mouse_mode == RED.state.RESIZE_TOP_RIGHT) {
			var dy = mouse_offset_resize_y - mouse_position[1];
			mousedown_node.h = parseInt(mousedown_node_h + dy);
			
			if (mousedown_node.h <= node_def.height) mousedown_node.h = node_def.height;
			else mousedown_node.y = mousedown_node_y - dy/posMode;
			mousedown_node.dirty = true;
		}
		if (mouse_mode == RED.state.RESIZE_BOTTOM || mouse_mode == RED.state.RESIZE_BOTTOM_LEFT || mouse_mode == RED.state.RESIZE_BOTTOM_RIGHT) {
			var dy = mouse_offset_resize_y - mouse_position[1];
			mousedown_node.h = parseInt(mousedown_node_h - dy);
			
			if (mousedown_node.h <= node_def.height) mousedown_node.h = node_def.height;
			else if (posMode === 2) mousedown_node.y = parseInt(mousedown_node_y - dy/2);
			mousedown_node.dirty = true;
		}
	}
	function redraw_init_UI_Slider(nodeRect)
	{
		var sliderRect = nodeRect.append("rect")
			.attr("class", "slidernode")
			.attr("rx", 4)
			.attr("ry", 4)
			.on("mouseup",nodeMouseUp)
			.on("mousedown",nodeMouseDown)
			.on("mousemove", nodeMouseMove)
			.on("mouseover", nodeMouseOver)
			.on("mouseout", nodeMouseOut)
			.attr("fill",function(d) { return d._def.color;})

		var sliderValueLabel = nodeRect.append("text")
			.attr("class", "slider_value_label")
			.attr("text-anchor", "start")
			.attr("dy", "0.35em");
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
				d.maxVal = parseInt(d.maxVal);
				d.minVal = parseInt(d.minVal);
				d.val = parseInt(d.val);
				if (d.val < d.minVal) d.val = d.minVal;
				if (d.val > d.maxVal) d.val = d.maxVal;
				if (d.orientation == "v") return d.h - ((d.val - d.minVal) / (d.maxVal - d.minVal)) * d.h ;
				else if (d.orientation == "h") return 0;
			})
			.attr("width", function(d) {
				d.maxVal = parseInt(d.maxVal);
				d.minVal = parseInt(d.minVal);
				d.val = parseInt(d.val);
				if (d.val < d.minVal) d.val = d.minVal;
				if (d.val > d.maxVal) d.val = d.maxVal;
				if (d.orientation == "v") return d.w;
				else if (d.orientation == "h") return ((d.val - d.minVal) / (d.maxVal - d.minVal)) * d.w;
			})
			.attr("height", function(d) {
				d.maxVal = parseInt(d.maxVal);
				d.minVal = parseInt(d.minVal);
				d.val = parseInt(d.val);
				if (d.val < d.minVal) d.val = d.minVal;
				if (d.val > d.maxVal) d.val = d.maxVal;
				if (d.orientation == "v") return  ((d.val - d.minVal) / (d.maxVal - d.minVal)) * d.h;
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

				var textSize = calculateTextSize(nodeText)
				ti.attr('x', (d.w-textSize.w)/2);
				ti.attr('y', (d.h+textSize.h));

		});

	}
	function redraw_init_UI_ListBox(nodeRect,n)
	{
		var items = n.items.split("\n");

		nodeRect.selectAll(".ui_listBox_item").remove();
		nodeRect.selectAll(".node_label_uiListBoxItem").remove();

		for ( var i = 0; i < items.length; i++)
		{
			var item = nodeRect.append("rect")
				.attr("class", "ui_listBox_item")
				.attr("rx", 6)
				.attr("ry", 6)
				.attr("listItemIndex", i)
				.attr("selected", false)
				.on("mouseup",  nodeMouseUp) //function (d) { nodeMouseUp(d); d.selectedIndex = i; })
				.on("mousedown", nodeMouseDown) // function (d) { nodeMouseDown(d); d.selectedIndex = i; })
				.on("mousemove", nodeMouseMove)
				.on("mouseover", nodeMouseOver)
				.on("mouseout", nodeMouseOut)
				.attr("fill",function(d) { return d.bgColor;});

			var itemText = nodeRect.append("text")
				.attr("class", "node_label_uiListBoxItem")
				.attr("text-anchor", "start")
				.attr("dy", "0.35em")
				.text(items[i]);
		}
	}
	function redraw_update_UI_ListBox(nodeRect, d)
	{
		if (d.itemCountChanged != undefined && d.itemCountChanged == true)
		{
			redraw_init_UI_ListBox(nodeRect, d);
		}

		var items = d.items.split("\n");
		d.headerHeight = parseInt(d.headerHeight)
		var itemHeight = (d.h-d.headerHeight-4) / (items.length);
		nodeRect.selectAll(".node").attr("height", d.h+4)
								.attr("fill", d.bgColor);

		nodeRect.selectAll('.ui_listBox_item').each(function(d,i) {
			var li = d3.select(this);
			li.attr('y', ((i)*itemHeight + d.headerHeight));
			li.attr("width", d.w-8);
			li.attr("x", 4);
			li.attr("height", itemHeight);
			if (d.selectedIndex == i)
				li.attr("fill", subtractColor(d.itemBGcolor, "#303030"));
			else
				li.attr("fill", d.itemBGcolor);
		});

		nodeRect.selectAll('text.node_label_uiListBoxItem').each(function(d,i) {
			var ti = d3.select(this);
			ti.attr('x', (d.w-(calculateTextSize(items[i]).w))/2);
			ti.attr('y', ((i)*itemHeight+itemHeight/2 + d.headerHeight));
			ti.text(items[i]);
		});
	}
	function redraw_init_UI_Piano(nodeRect,n)
	{
		nodeRect.selectAll(".ui_piano_item").remove();
		nodeRect.selectAll(".node_label_uiPianoKey").remove();
		var keyTexts =     ['C','D','E','F','G','A','B','C#','D#','F#','G#','A#'];
		var keyIndex = [0  ,2  ,4  ,5  ,7  ,9  ,11 ,1   ,3   ,6   ,8   ,10];
		for ( var i = 0; i < 12; i++)
		{
			var keyRect = nodeRect.append("rect")
				.attr("class", "ui_piano_item")
				.attr("keyIndex", keyIndex[i])
				.attr("selected", false)
				.on("mouseup",  nodeMouseUp) //function (d) { nodeMouseUp(d); d.selectedIndex = i; })
				.on("mousedown", nodeMouseDown) // function (d) { nodeMouseDown(d); d.selectedIndex = i; })
				.on("mousemove", nodeMouseMove)
				.on("mouseover", nodeMouseOver)
				.on("mouseout", nodeMouseOut)
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
				li.attr("stroke", subtractColor(d.whiteKeysColor, "#303030"));
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
						ti.attr('x', i*keyWidth + ((keyWidth-(calculateTextSize(keyTexts[i]).w))/2) + i + 0.5);
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
						ti.attr('x', (i-7)*keyWidth + ((keyWidth-(calculateTextSize(keyTexts[i]).w))/2)+keyWidth/2 + (i-7)+ 0.5 );
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
						ti.attr('x', (i-6)*keyWidth + ((keyWidth-(calculateTextSize(keyTexts[i]).w))/2)+keyWidth/2 + (i-6)+ 0.5 );
						ti.attr('y', d.headerHeight + blackKeyHeight/2 + 3);
					}
					else
						ti.attr("visibility", "hidden");
				}
			}
			ti.text(keyTexts[i]);
		});
	}
	//#endregion UI items redraw init/update

	function redraw_nodes_init()
	{
		var nodesFilter = RED.nodes.nodes.filter(function(d)
		{ 
			return (d.z == activeWorkspace && d.type != "group");
		});
		var visNodesAll = visNodes.selectAll(".nodegroup").data(nodesFilter, function(d){return d.id;}); // second parameter is the name given to each item

		var updatedClassTypes =	false; // flag so that it only run once at each redraw()

		var nodeExit = visNodesAll.exit().remove();
		nodeExit.each(function(d,i) // this happens only when a node exits(is removed) from the current workspace.
		{
			//console.error("redraw nodeExit:" + d.type);
			if (d.type == "TabInput" || d.type == "TabOutput")
			{
				if (!updatedClassTypes) { updatedClassTypes = true; RED.nodes.updateClassTypes(); }
			}
		});
		anyNodeEnter = false;
		var nodeEnter = visNodesAll.enter().insert("svg:g").attr("class", "node nodegroup");
		nodeEnter.each(function(d,i) // this happens only when a node enter(is added) to the current workspace.
		{
			anyNodeEnter = true;
			d.oldNodeText = undefined;
			d.oldWidth = undefined;
			d.oldHeight = undefined;

			//console.error("redraw nodeEnter:" + d.type);
			if (d.type == "TabInput" || d.type == "TabOutput")
			{
				if (!updatedClassTypes) { updatedClassTypes = true; RED.nodes.updateClassTypes(); }
			}
			
			var nodeRect = d3.select(this);
			nodeRect.attr("id",d.id);
			if (d._def.uiObject == undefined)
				redraw_calcNewNodeSize(d);
			
			if (d._def.category != undefined && (d._def.category.startsWith("output") || d._def.category.startsWith("input"))) // only need to check I/O
			{	
				checkRequirements(d); // this update nodes that allready exist
				if (d.requirementError) console.warn("@nodeEnter reqError on:" + d.name);
				redraw_nodeReqError(nodeRect, d);
				redraw_paletteNodesReqError(d);
			}

			//if (d._def.badge) redraw_nodeBadge(nodeRect, d);
			//if (d._def.button) redraw_nodeButton(nodeRect, d);
			redraw_nodeMainRect_init(nodeRect, d);
			if (d._def.icon) redraw_nodeIcon(nodeRect, d);
			redraw_nodeInputs(nodeRect, d);
			redraw_nodeOutputs(nodeRect, d);
			if (d.type != "JunctionLR" && d.type != "JunctionRL")
				redraw_nodeText(nodeRect, d);
			//redraw_nodeStatus(nodeRect);

			//nodeRect.append("circle").attr({"class":"centerDot","cx":0,"cy":0,"r":5});
			// never show these little status icons
			// people try clicking on them, thinking they're buttons
			// or some sort of user interface widget
			//nodeRect.append("path").attr("class","node_error").attr("d","M 3,-3 l 10,0 l -5,-8 z");
			//nodeRect.append("image").attr("class","node_error hidden").attr("xlink:href","icons/node-error.png").attr("x",0).attr("y",-6).attr("width",10).attr("height",9);
			//nodeRect.append("image").attr("class","node_changed hidden").attr("xlink:href","icons/node-changed.png").attr("x",12).attr("y",-6).attr("width",10).attr("height",10);
			nodeRect.append("image").attr("class","node_reqerror hidden").attr("xlink:href","icons/error.png").attr("x",0).attr("y",-12).attr("width",20).attr("height",20);
		
		});
		visNodesAll.classed("node_selected",function(d) { return d.selected; })
		return visNodesAll;
	}
	function redraw_nodes(fullUpdate,superUpdate) // fullUpdate means that it checks for removed/added nodes as well
	{
		if (fullUpdate != undefined && fullUpdate == true) {
			var visNodesAll = redraw_nodes_init();
		} else {
			var visNodesAll = visNodes.selectAll(".node_selected").data(RED.nodes.nodes.filter(function(d)
			{ 
				return ((d.z == activeWorkspace) && (d.type != "group"));

			}),function(d){return d.id});
		}
		visNodesAll.each( function(d,i) { // redraw all nodes in active workspace
			var nodeRect = d3.select(this);
			
			if (d._def.category != undefined && (d._def.category.startsWith("output") || d._def.category.startsWith("input"))) // only need to check I/O
			{	
				checkRequirements(d); // this update nodes that allready exist
				//if (d.requirementError) console.warn("@node.each reqError on:" + d.name);
				redraw_nodeReqError(nodeRect, d);
			}
			if (superUpdate != undefined && superUpdate == true)
			{
				d.dirty = true;
				d.resize = true;
			}
			if (d.dirty == false) return;
			d.dirty = false;

			if (d.bgColor == null)
				d.bgColor = d._def.color;
				
			if (d.type == "UI_Slider") {
				redraw_update_UI_Slider(nodeRect, d);
			} else if (d.type == "UI_ListBox") {
				redraw_update_UI_ListBox(nodeRect, d);
			} else if (d.type == "UI_Piano") {
				redraw_update_UI_Piano(nodeRect, d);
			} else {
				nodeRect.selectAll(".node").attr("fill", d.bgColor);
			}
			if (d.resize) {
				d.resize = false;
				if (d._def.uiObject == undefined) {
					redraw_calcNewNodeSize(d);
					redraw_nodeInputs(nodeRect, d);
					redraw_nodeOutputs(nodeRect, d);
				} else {// UI object

				}
			}
			redraw_paletteNodesReqError(d);
			redraw_nodeRefresh(nodeRect, d);
			if (d.type != "JunctionLR" && d.type != "JunctionRL")
				redraw_label(nodeRect, d);
		});
	}
	/*********************************************************************************************************************************/
	/*********************************************************************************************************************************/
	/**
	 * 
	 * @param {boolean} fullUpdate 
	 */
	function redraw(fullUpdate) {
		const t0 = performance.now();
		//console.trace("redraw");
		/*var chart = $("#chart");
		var chartViewYmin = chart.scrollTop() / settings.scaleFactor;
		var chartViewXmin = chart.scrollLeft() / settings.scaleFactor;
		var chartViewYmax = (chart.height() + chart.scrollTop()) / settings.scaleFactor;
		var chartViewXmax = (chart.width() + chart.scrollLeft()) / settings.scaleFactor;*/
		//console.log("redraw:" + chartViewYmin + ":" + chartViewYmax + ", " + chartViewXmin + ":" + chartViewXmax);
		
		vis.attr("transform","scale("+settings.scaleFactor+")");
		outer.attr("width", settings.space_width*settings.scaleFactor).attr("height", settings.space_height*settings.scaleFactor);
		
		// Don't bother redrawing nodes if we're drawing links
		if (mouse_mode != RED.state.JOINING)
		{
			redraw_nodes(fullUpdate);
			redraw_groups(fullUpdate);
		}
		//const t1 = performance.now();
		//redraw_links(); // this now only redraws links that was added and links that are selected (i.e. they are selected when a node is selected)
		const t2 = performance.now();
		if (d3.event) {	d3.event.preventDefault(); }

		redrawCount++;
		var currentTotalTime = t2-t0;
		//var currentLinksTime = t2-t1;
		redrawTotalTime += currentTotalTime;

		//console.log('redraw average time: ' + (redrawTotalTime/redrawCount) + ' ms, curr. tot. time:' + currentTotalTime + " ms");
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

		RED.nodes.eachNode(function (node) {
			if (node.z != activeWorkspace) return;
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

	RED.keyboard.add(/* z */ 90,{ctrl:true},function(){RED.history.pop();});
	//RED.keyboard.add(/* o */ 79,{ctrl:true},function(){arrangeAll();d3.event.preventDefault();}); // have at other place, to close to print
	RED.keyboard.add(/* a */ 65,{ctrl:true},function(){selectAll();d3.event.preventDefault();});
	RED.keyboard.add(/* = */ 187,{ctrl:true},function(){zoomIn();d3.event.preventDefault();});
	RED.keyboard.add(/* - */ 189,{ctrl:true},function(){zoomOut();d3.event.preventDefault();});
	RED.keyboard.add(/* 0 */ 48,{ctrl:true},function(){zoomZero();d3.event.preventDefault();});
	RED.keyboard.add(/* v */ 86,{ctrl:true},function(){importNodes(clipboard, null, true);d3.event.preventDefault();});
	RED.keyboard.add(/* e */ 69,{ctrl:true},function(){showExportNodesDialog();d3.event.preventDefault();});
	RED.keyboard.add(/* i */ 73,{ctrl:true},function(){showImportNodesDialog(true);d3.event.preventDefault();});
	RED.keyboard.add(/* s */ 83,{ctrl:true},function(){RED.storage.update();  d3.event.preventDefault();});
	RED.keyboard.add(/* p */ 80,{ctrl:true},function(){RED.main.print();d3.event.preventDefault();});

	// TODO: 'dirty' should be a property of RED.nodes - with an event callback for ui hooks
	function setDirty(d) {
		dirty = d;
		if (dirty) {
			$("#btn-deploy").removeClass("disabled").addClass("btn-danger");
			RED.storage.update();
		} else {
			$("#btn-deploy").addClass("disabled").removeClass("btn-danger");
		}
	}

	/**
	 * Imports a new collection of nodes from a JSON String.
	 *  - all get new IDs assigned
	 *  - all 'selected'
	 *  - attached to mouse for placing - 'IMPORT_DRAGGING'
	 */
	function importNodes(newNodesStr,touchImport, createNewIds) {
		console.trace("view: importNodes");
		if (createNewIds == undefined) createNewIds = true;
		var replaceFlow = $("#node-input-replace-flow").prop('checked');

		if ($("#node-input-arduino").prop('checked') === true) {
			var nodesJSON = RED.arduino.import.cppToJSON(newNodesStr);
			if (nodesJSON.count <= 0) {
				var note = "No nodes imported!";
				RED.notify("<strong>Note</strong>: " + note, "warning");
			}

			newNodesStr = nodesJSON.data;
			//createNewIds = false;
		}
		if (replaceFlow) {
			RED.storage.clear();
			//console.warn(newNodesStr);
			//debugger;
			
			localStorage.setItem("audio_library_guitool", newNodesStr);
			window.location.reload(); // better way because it frees up memory.
			//RED.storage.load();
			//redraw();

			return;
		}
		try {
			var result = RED.nodes.import(newNodesStr,createNewIds);
			if (!result) return;
			
			var new_nodes = result[0];
			var new_links = result[1];
			var new_ms = new_nodes.map(function(n) { n.z = activeWorkspace; return {n:n};});
			var new_node_ids = new_nodes.map(function(n){ return n.id; });

			// TODO: pick a more sensible root node
			var root_node = new_ms[0].n;
			var dx = root_node.x;
			var dy = root_node.y;

			if (mouse_position == null) {
				mouse_position = [0,0];
			}

			var minX = 0;
			var minY = 0;
			var i;
			var node;

			for (i=0;i<new_ms.length;i++) {
				node = new_ms[i];
				node.n.selected = true;
				node.n.changed = true;
				node.n.x -= dx - mouse_position[0];
				node.n.y -= dy - mouse_position[1];
				node.dx = node.n.x - mouse_position[0];
				node.dy = node.n.y - mouse_position[1];
				minX = Math.min(node.n.x-node_def.width/posMode-5,minX);
				minY = Math.min(node.n.y-node_def.height/posMode-5,minY);
			}
			for (i=0;i<new_ms.length;i++) {
				node = new_ms[i];
				node.n.x -= minX;
				node.n.y -= minY;
				node.dx -= minX;
				node.dy -= minY;
			}
			if (!touchImport) {
				mouse_mode = RED.state.IMPORT_DRAGGING;
			}

			RED.keyboard.add(/* ESCAPE */ 27,function(){
					RED.keyboard.remove(/* ESCAPE */ 27);
					clearSelection();
					RED.history.pop();
					mouse_mode = 0;
			});

			RED.history.push({t:'add',nodes:new_node_ids,links:new_links,dirty:RED.view.dirty()});

			clearSelection();
			moving_set = new_ms;

			redraw(true);
			redraw_links_init();
			redraw_links();
			updateSelection(); // this selects the wires, because the optimized wire redraw is used
		} catch(error) {
			console.log(error);
			RED.notify("<strong>Error</strong>: "+error,"error");
		}
	}

	function getForm(formId, key, callback) {
		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);
		var form = $("<h2>No form found.</h2>");

		if (!server) {
			data = $("script[data-template-name|='" + key + "']").html();
			//console.log('%c' + typeof data + "%c"+ data, 'background: #bada55; color: #555 ', 'background: #555; color: #bada55 ');
			form = $("#" + formId);
			$(form).empty();
			$(form).append(data);
			if(typeof callback == 'function') {
				callback.call(this, form);
			}
		} else {
			var frmPlugin = "resources/form/" + key + ".html";
			$.get(frmPlugin, function(data) {
				form = $("#" + formId);
				$(form).empty();
				$(form).append(data);
				if(typeof callback == 'function') {
					callback.call(this, form);
				}
			});
		}

		return form;
	}

	$('#btn-import-json').click(function() {showImportNodesDialog(false);});
	$('#btn-import-arduino').click(function() {showImportNodesDialog(true);});
	$('#btn-export-clipboard').click(function() {showExportNodesDialog();});
	$('#btn-export-library').click(function() {showExportNodesLibraryDialog();});

	function showExportNodesDialog() {
		RED.editor.init_edit_dialog();
		mouse_mode = RED.state.EXPORT;
		var nns = RED.nodes.createExportableNodeSet(moving_set);
		//$("#dialog-form").html(getForm("dialog-form", "export-clipboard-dialog"));
		var frm = getForm("dialog-form", "export-clipboard-dialog", function (d, f) {
			$("#node-input-export").val(JSON.stringify(nns)).focus(function() {
				var textarea = $(this);
				textarea.select();
				textarea.mouseup(function() {
						textarea.unbind("mouseup");
						return false;
				});
			}).focus();
		$( "#dialog" ).dialog("option","title","Export nodes to clipboard").dialog( "open" );
		});
	}

	function showExportNodesLibraryDialog() {
		RED.editor.init_edit_dialog();
		mouse_mode = RED.state.EXPORT;
		var nns = RED.nodes.createExportableNodeSet(moving_set);
		//$("#dialog-form").html(this.getForm('export-library-dialog'));
		getForm("dialog-form", "export-library-dialog", function(d, f) {
		$("#node-input-filename").attr('nodes',JSON.stringify(nns));
		$( "#dialog" ).dialog("option","title","Export nodes to library").dialog( "open" );
		});
	}

	function showImportNodesDialog(is_arduino_code) {
		RED.editor.init_edit_dialog();
		$("#btnEditorRunScript").hide();
		$("#btnEditorApply").hide();
		mouse_mode = RED.state.IMPORT;
		//$("#dialog-form").html(this.getForm('import-dialog'));
		getForm("dialog-form", "import-dialog", function(d, f) {
		$("#node-input-import").val("");
		$( "#node-input-arduino" ).prop('checked', is_arduino_code);
		var title = "";
		if (is_arduino_code)
		{
			title = "Import Arduino Code";
			$("#node-input-import").prop('placeholder', "Paste Arduino Code here.");
			$("#import-dialog-textarea-label").text(" Code:");
		}			
		else
		{
			title = "Import JSON";
			$("#node-input-import").prop('placeholder', "Paste JSON string here.");
			$("#import-dialog-textarea-label").text(" JSON:");
		}
			
		$( "#dialog" ).dialog("option","title",title).dialog( "open" );
		});
	}

	function showRenameWorkspaceDialog(id) {
		var ws = RED.nodes.workspace(id);
		$( "#node-dialog-rename-workspace" ).dialog("option","workspace",ws);

		if (workspace_tabs.count() == 1) {
			$( "#node-dialog-rename-workspace").next().find(".leftButton")
				.prop('disabled',true)
				.addClass("ui-state-disabled");
		} else {
			$( "#node-dialog-rename-workspace").next().find(".leftButton")
				.prop('disabled',false)
				.removeClass("ui-state-disabled");
		}
		$( "#node-input-export-workspace" ).prop('checked',  ws.export);
		$( "#node-input-workspace-name" ).val(ws.label);
		$( "#node-dialog-rename-workspace" ).dialog("open");
	}

	$("#node-dialog-rename-workspace form" ).submit(function(e) { e.preventDefault();});
	$( "#node-dialog-rename-workspace" ).dialog({
		modal: true,
		autoOpen: false,
		width: 500,
		title: "Rename sheet",
		buttons: [
			{
				class: 'leftButton',
				text: "Delete",
				click: function() {
					var workspace = $(this).dialog('option','workspace');
					$( this ).dialog( "close" );
					deleteWorkspace(workspace.id);
				}
			},
			{
				text: "Ok",
				click: function() {
					var workspace = $(this).dialog('option','workspace');
					var label = $( "#node-input-workspace-name" ).val();
					if (workspace.label != label) {

						if (RED.nodes.workspaceNameCheck(label)) // Jannik add start
						{
							RED.notify("<strong>Warning</strong>: Name:"+label + " allready exist, choose annother name.","warning");
							return; // abort name change if name allready exist
						} 
						

						workspace.label = label;

						// update the tab text
						var link = $("#workspace-tabs a[href='#"+workspace.id+"']");
						link.attr("title",label);
						link.text(label);
						// update the menu item text
						var menuItem = $("#workspace-menu-list a[href='#"+workspace.id+"']");
						menuItem.attr("title",label);
						menuItem.text(label);

						RED.view.dirty(true);
						RED.nodes.workspaceNameChanged(workspace.label, label); // Jannik add end
					}
					var exportNew = $( "#node-input-export-workspace" ).prop('checked')
					if (workspace.export != exportNew)
					{
						workspace.export = exportNew;
						var link = $("#workspace-tabs a[href='#"+workspace.id+"']");
						if (!exportNew)
							link.attr("style", "color:#b3b3b3;");
						else // 
							link.attr("style", "color:#000000;");
					}
					console.warn("exportWorkspace:"+workspace.export);

					$( this ).dialog( "close" );
				}
			},
			{
				text: "Cancel",
				click: function() {
					$( this ).dialog( "close" );
				}
			}
		],
		open: function(e) {
			RED.keyboard.disable();
		},
		close: function(e) {
			RED.keyboard.enable();
		}
	});
	$( "#node-dialog-delete-workspace" ).dialog({
		modal: true,
		autoOpen: false,
		width: 500,
		title: "Confirm delete",
		buttons: [
			{
				text: "Ok",
				click: function() {
					var workspace = $(this).dialog('option','workspace');
					RED.view.removeWorkspace(workspace);
					var historyEvent = RED.nodes.removeWorkspace(workspace.id);
					historyEvent.t = 'delete';
					historyEvent.dirty = dirty;
					historyEvent.workspaces = [workspace];
					RED.history.push(historyEvent);
					RED.view.dirty(true);
					$( this ).dialog( "close" );
				}
			},
			{
				text: "Cancel",
				click: function() {
					$( this ).dialog( "close" );
				}
			}
		],
		open: function(e) {
			RED.keyboard.disable();
		},
		close: function(e) {
			RED.keyboard.enable();
		}

	});
	
	function getIOpinInfo(pinRect, node, index)
	{
		var classAttr = pinRect.getAttribute("class");
		//console.log("classAttr:"+classAttr); // development debug
		var portType;
		var nodeType;
		if (classAttr == "port port_input")
		{
			nodeType = node.type;
			portType = "In";
		}
		else if (classAttr == "port port_output")
		{
			nodeType = pinRect.getAttribute("nodeType");
			portType = "Out";
			
		}
		
		var data = $("script[data-help-name|='" + nodeType + "']");
		var data2 = $("<div/>").append(data.html()).children("table").first().children("tbody").html();
		
		var portName = portType + " " + index;

		if (!data2 || (data2 == null)) // shows workspace user custom class io
		{
			// TODO: extract portinfo from class
			if (RED.nodes.isClass(nodeType))
			{
				var wsId = RED.nodes.getWorkspaceIdFromClassName(nodeType);
				portName = portName + ": " + RED.nodes.getClassIOportName(wsId, "Tab"+portType+ "put", index);
			}
			data2 = $("<div/>").append("<p>" + portName + "</p></div>").html();
		}
		/*else if (nodeType == "AudioMixer" && portType == "In")
		{
			data2 = $("<div/>").append("<p>" + portName + ": Input Signal #" + (Number(index) + 1) + "</p></div>").html();
		}*/
		else // here we must extract info from Audio Connections table
		{
			var tableRows = data2.split("\n");
			for (var i = 1; i < tableRows.length; i++)
			{
				var tableCols = tableRows[i].split("</td><td>");
				if (tableCols.length < 2) continue;

				var pin = tableCols[0];
				var desc = tableCols[1];
				pin = pin.substring(pin.lastIndexOf(">") + 1);
				desc = desc.substring(0, desc.indexOf("<"));

				if (pin == portName)
				{
					data2 = $("<div/>").append("<p>" + pin + ": " + desc + "</p></div>").html();
					//console.log(pin + " " + desc); // development debug
					break;
				}
			}
			console.log("table contens: type("+ typeof data2 + "):\n"+ data2); // development debug
		}
		//console.log(data2); // development debug
		return data2;
	}

	function showPopOver(rect, htmlMode, content,placement)
	{
		if (placement == null) placement = "top";
		current_popup_rect = rect;
		var options = {
			placement: placement,
			trigger: "manual",
			html: htmlMode,
			container:'body',
			rootClose:true, // failsafe
			content : content
		};
		$(rect).popover(options).popover("show");
		//console.warn("content type:" + typeof content);
		//console.warn("content:" + content);
		//console.warn("showPopOver retVal:" + Object.getOwnPropertyNames(retVal)); // debug
		//console.warn("showPopOver retVal.context:" + retVal.context); // debug
		//console.warn("showPopOver retVal.length:" + retVal.length); // debug
	}

	function setShowWorkspaceToolbarVisible(state)
	{
		if (state)
		{
			$("#workspace-toolbar").show();
			$("#chart").css("top", 67);
		}
		else
		{
			$("#workspace-toolbar").hide();
			$("#chart").css("top", 31);
		}
	}

	function canvasTouchEnd()
	{
		clearTimeout(touchStartTime);
		touchStartTime = null;
		if  (RED.touch.radialMenu.active()) {
			return;
		}
		if (lasso) {
			outer_background.attr("fill","#fff");
		}
		canvasMouseUp.call(this);
	}
	function canvasTouchStart()
	{
		var touch0;
		if (d3.event.touches.length>1) {
			clearTimeout(touchStartTime);
			touchStartTime = null;
			d3.event.preventDefault();
			touch0 = d3.event.touches.item(0);
			var touch1 = d3.event.touches.item(1);
			var a = touch0['pageY']-touch1['pageY'];
			var b = touch0['pageX']-touch1['pageX'];

			var offset = $("#chart").offset();
			var scrollPos = [$("#chart").scrollLeft(),$("#chart").scrollTop()];
			startTouchCenter = [
				(touch1['pageX']+(b/posMode)-offset.left+scrollPos[0])/settings.scaleFactor,
				(touch1['pageY']+(a/posMode)-offset.top+scrollPos[1])/settings.scaleFactor
			];
			moveTouchCenter = [
				touch1['pageX']+(b/posMode),
				touch1['pageY']+(a/posMode)
			];
			startTouchDistance = Math.sqrt((a*a)+(b*b));
		} else {
			var obj = d3.select(document.body);
			touch0 = d3.event.touches.item(0);
			var pos = [touch0.pageX,touch0.pageY];
			startTouchCenter = [touch0.pageX,touch0.pageY];
			startTouchDistance = 0;
			var point = d3.touches(this)[0];
			touchStartTime = setTimeout(function() {
				touchStartTime = null;
				showTouchMenu(obj,pos);
				//lasso = vis.append('rect')
				//    .attr("ox",point[0])
				//    .attr("oy",point[1])
				//    .attr("rx",2)
				//    .attr("ry",2)
				//    .attr("x",point[0])
				//    .attr("y",point[1])
				//    .attr("width",0)
				//    .attr("height",0)
				//    .attr("class","lasso");
				//outer_background.attr("fill","#e3e3f3");
			},touchLongPressTimeout);
		}
	}
	function canvasTouchMove()
	{
		if  (RED.touch.radialMenu.active()) {
			d3.event.preventDefault();
			return;
		}
		var touch0;
		if (d3.event.touches.length<2) {
			if (touchStartTime) {
				touch0 = d3.event.touches.item(0);
				var dx = (touch0.pageX-startTouchCenter[0]);
				var dy = (touch0.pageY-startTouchCenter[1]);
				var d = Math.abs(dx*dx+dy*dy);
				if (d > 64) {
					clearTimeout(touchStartTime);
					touchStartTime = null;
				}
			} else if (lasso) {
				d3.event.preventDefault();
			}
			canvasMouseMove.call(this);
		} else {
			touch0 = d3.event.touches.item(0);
			var touch1 = d3.event.touches.item(1);
			var a = touch0['pageY']-touch1['pageY'];
			var b = touch0['pageX']-touch1['pageX'];
			var offset = $("#chart").offset();
			var scrollPos = [$("#chart").scrollLeft(),$("#chart").scrollTop()];
			var moveTouchDistance = Math.sqrt((a*a)+(b*b));
			var touchCenter = [
				touch1['pageX']+(b/posMode),
				touch1['pageY']+(a/posMode)
			];

			if (!isNaN(moveTouchDistance)) {
				oldScaleFactor = settings.scaleFactor;
				settings.scaleFactor = Math.min(2,Math.max(0.3, settings.scaleFactor + (Math.floor(((moveTouchDistance*100)-(startTouchDistance*100)))/10000)));

				var deltaTouchCenter = [                             // Try to pan whilst zooming - not 100%
					startTouchCenter[0]*(settings.scaleFactor-oldScaleFactor),//-(touchCenter[0]-moveTouchCenter[0]),
					startTouchCenter[1]*(settings.scaleFactor-oldScaleFactor) //-(touchCenter[1]-moveTouchCenter[1])
				];

				startTouchDistance = moveTouchDistance;
				moveTouchCenter = touchCenter;

				$("#chart").scrollLeft(scrollPos[0]+deltaTouchCenter[0]);
				$("#chart").scrollTop(scrollPos[1]+deltaTouchCenter[1]);
				//redraw();
				//redraw_links_init();
				//redraw_links();
			}
		}
	}
	function completeRedraw()
	{
		vis.attr("transform","scale("+settings.scaleFactor+")");
		outer.attr("width", settings.space_width*settings.scaleFactor).attr("height", settings.space_height*settings.scaleFactor);
		redraw_nodes(true,true);
		redraw_groups(true);
		redraw_links_init();
		anyLinkEnter = true;
		redraw_links();
	}
	return {
		evalHere: function(string,d) { eval(string); },
		settings:settings,
		settingsCategory:settingsCategory,
		settingsEditor:settingsEditor,
		init:initView,
		AddNewNode:AddNewNode,
		resetMouseVars:resetMouseVars, // exposed for editor
		state:function(state) {
			if (state == null) {
				return mouse_mode
			} else {
				mouse_mode = state;
			}
		},
		addWorkspace: function(ws) {
			workspace_tabs.addTab(ws); // see tabs.js
			//workspace_tabs.resize(); // see tabs.js // this is not needed because workspace_tabs.addTab() does it internally
		},
		removeWorkspace: function(ws) {
			workspace_tabs.removeTab(ws.id); // see tabs.js
			//RED.arduino.httpGetAsync("removeFile:" + ws.label + ".h");
		},
		getWorkspace: function() {
			return activeWorkspace;
		},
		showWorkspace: function(id) {
			workspace_tabs.activateTab(id); // see tabs.js
		},
		redraw: function() {
			completeRedraw();
			/*redraw(true);
			redraw_links_init();
			anyLinkEnter = true;
			redraw_links();*/
		},
		dirty: function(d) {
			if (d == null) {
				return dirty;
			} else {
				setDirty(d);
			}
		},
		importNodes: importNodes,
		resize: function() {
			workspace_tabs.resize();
		},
		status: function(s) {
			showStatus = s;
			RED.nodes.eachNode(function(n) { n.dirty = true;});
			//TODO: subscribe/unsubscribe here
			redraw(false);
		},
		getForm: getForm,
		calculateTextSize: calculateTextSize,
		showExportNodesDialog: showExportNodesDialog,
		showPopOver:showPopOver,
		node_def:node_def,
		defaults: {
			width: node_def.width,
			height: node_def.height
		}
	};
})();
