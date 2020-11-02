/** Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
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
RED.sidebar.palette = (function() {
	var minimumSize = 100;
	var minChartSize = 200;
/*
	//$('#sidebar').tabs();
	var sidebar_tabs = RED.tabs.create({
		id:"sidebar-tabs",
		onchange:function(tab) {
			$("#sidebar-content").children().hide();
			$("#"+tab.id).show();
		},
		onremove: function(tab) {
			$("#"+tab.id).remove();
		}
	});
	function addTab(title,content,closeable) {
		$("#sidebar-content").append(content);
		$(content).hide();
		sidebar_tabs.addTab({id:"tab-"+title,label:title,closeable:closeable});
		//content.style.position = "absolute";
		//$('#sidebar').tabs("refresh");
	}*/
	var btnSidebar = $("#btn-sidebar-palette");
	$('#btn-sidebar-palette').click(function() {toggleSidebar();});
	//RED.keyboard.add(/* SPACE */ 32,{ctrl:true},function(){toggleSidebar();d3.event.preventDefault();}); // can't have multiple actions on same key
	// 

	var sidebarSeparator =  {};
	$("#sidebar-palette-separator").draggable({
			axis: "x",
			start:function(event,ui) {
				console.warn("sb-pal-start");
				sidebarSeparator.closing = false;
				sidebarSeparator.opening = false;
				var winWidth = $(window).width();
				sidebarSeparator.start = ui.position.left;
				sidebarSeparator.chartWidth = $("#workspace").width();
				//sidebarSeparator.chartLeft = winWidth-$("#workspace").width()-$("#workspace").offset().right-2;
				sidebarSeparator.chartLeft = $("#workspace").css("left");
				console.log("sidebarSeparator.chartLeft="+sidebarSeparator.chartLeft);
				if (!btnSidebar.hasClass("active")) {
					sidebarSeparator.opening = true;
					var newChartLeft = 15;
					$("#sidebar-palette").addClass("closing");
					$("#workspace").css("left",newChartLeft);
					//$("#chart-zoom-controls").css("left",newChartLeft+20);
					$("#sidebar-palette").width(0);
					toggleSidebar();
					RED.view.resize();
				}

				
				sidebarSeparator.width = $("#sidebar-palette").width();
			},
			drag: function(event,ui) {
				//console.log("ui.position.left="+ui.position.left);
				//console.log("sidebarSeparator.start="+sidebarSeparator.start);
				var d = ui.position.left-sidebarSeparator.start;

				var newSidebarWidth = sidebarSeparator.width+d ;
				/*if (sidebarSeparator.opening) {
					newSidebarWidth += 13;
				}*/
				
				// takes care of chart minimum size
				if (newSidebarWidth > minimumSize) {
					//console.warn("newSidebarWidth > minimumSize");
					if (sidebarSeparator.chartWidth-d < minChartSize) { 
						//console.warn("sidebarSeparator.chartWidth-d < minChartSize");
						ui.position.left = minChartSize-sidebarSeparator.start+sidebarSeparator.chartWidth;
						d = ui.position.left-sidebarSeparator.start;
						newSidebarWidth = sidebarSeparator.width+d;
					}
				}
				
				// take care of opening/closing of sidebar
				if (newSidebarWidth < minimumSize) {
					console.warn("newSidebarWidth < minimumSize");
					if (!sidebarSeparator.closing) {
						$("#sidebar-palette").addClass("closing");
						sidebarSeparator.closing = true;
					}
					if (!sidebarSeparator.opening) {
						console.warn("!sidebarSeparator.opening");
						newSidebarWidth = minimumSize;
						ui.position.left = minimumSize; //sidebarSeparator.width-(minimumSize - sidebarSeparator.start);
						d = ui.position.left-sidebarSeparator.start;
					}
				} else if (newSidebarWidth > minimumSize && (sidebarSeparator.closing || sidebarSeparator.opening)) {
					sidebarSeparator.closing = false;
					$("#sidebar-palette").removeClass("closing");
				}

				//var newChartLeft = sidebarSeparator.chartLeft-d;
				$("#workspace").css("left",newSidebarWidth+15);
				$("#bottombar").css("left",newSidebarWidth+15);
				$("#sidebar-palette").width(newSidebarWidth);
				//sidebar_tabs.resize();
				RED.view.resize();
					
			},
			stop:function(event,ui) {
				console.warn("sb-pal stop");
				RED.view.resize();
				if (sidebarSeparator.closing) {
					$("#sidebar-palette").removeClass("closing");
					toggleSidebar(); // just for the button
					if ($("#sidebar-palette").width() < 180) {
						//$("#sidebar-palette").width(0); // taken care of by stylesheet @ sidebar-palette-closed class
						//$("#workspace").css("left",0);
						//$("#bottombar").css("left",0);
						//$("#chart-zoom-controls").css("right",228);
					}
				}
				$("#sidebar-palette-separator").css("right","auto");
				$("#sidebar-palette-separator").css("left",($("#sidebar-palette").width())+"px");
			}
	});
	
	
	function toggleSidebar() {
		//if ($('#sidebar').tabs( "option", "active" ) === false) {
		//    $('#sidebar').tabs( "option", "active",0);
		//}
		btnSidebar.toggleClass("active");
		
		if (!btnSidebar.hasClass("active")) {
			$("#main-container").addClass("sidebar-palette-closed");
		} else {
			$("#main-container").removeClass("sidebar-palette-closed");
		}
	}
	toggleSidebar();
	
	function showSidebar(id) {
		if (!$("#btn-sidebar-palette").hasClass("active")) {
			toggleSidebar();
		}
		//sidebar_tabs.activateTab("tab-"+id);
	}
	/*
	function containsTab(id) {
		return sidebar_tabs.contains("tab-"+id);
	}*/
	
	return {
		//addTab: addTab,
		show: showSidebar,
		toggleSidebar,toggleSidebar
		//containsTab: containsTab
	}
	
})();
