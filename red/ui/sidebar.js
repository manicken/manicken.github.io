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
RED.sidebar = (function() {
    var _settings = {
        autoSwitchTabToInfoTab: true
    }
    var settings = {
        get autoSwitchTabToInfoTab() { return _settings.autoSwitchTabToInfoTab; },
        set autoSwitchTabToInfoTab(state) { _settings.autoSwitchTabToInfoTab = state; RED.storage.update();},
    }
    var settingsCategory = { Title:"Right Sidebar", Expanded:false };
    var settingsEditor = {
        autoSwitchTabToInfoTab: { label:"Auto switch to info-tab when selecting/deselecting node(s).", type:"boolean"},
    }

	//$('#sidebar').tabs();
	var sidebar_tabs = RED.tabs.create({
		id:"sidebar-tabs",
		onchange:function(tab) { // happens when switching between tabs
			//console.warn("sidebar-tabs@onchange");
			$("#sidebar-content").children().hide();
			$("#"+tab.id).show();
		},
		onremove: function(tab) {
			$("#"+tab.id).remove();
        },
        minimumActiveTabWidth: 90,
	});
	function addTab(title,content,closeable) {
		$("#sidebar-content").append(content);
		$(content).hide();
		sidebar_tabs.addTab({id:"tab-"+title,label:title,closeable:closeable});
		//content.style.position = "absolute";
		//$('#sidebar').tabs("refresh");
	}
	
	$('#btn-sidebar').click(function() {toggleSidebar();});
	RED.keyboard.add(/* SPACE */ 32,{ctrl:true},function(){toggleSidebar(); RED.sidebar.palette.toggleSidebar();d3.event.preventDefault();});

	var sidebarSeparator =  {};
	$("#sidebar-separator").draggable({
			axis: "x",
			start:function(event,ui) {
				sidebarSeparator.closing = false;
				sidebarSeparator.opening = false;
				var winWidth = $(window).width();
				sidebarSeparator.start = ui.position.left;
				sidebarSeparator.chartWidth = $("#workspace").width();
				sidebarSeparator.chartRight = winWidth-$("#workspace").width()-$("#workspace").offset().left-2;


				if (!btnSidebar.hasClass("active")) {
					sidebarSeparator.opening = true;
					var newChartRight = 15;
					$("#sidebar").addClass("closing");
					$("#workspace").css("right",newChartRight);
					$("#chart-zoom-controls").css("right",newChartRight+20);
					$("#sidebar").width(0);
					toggleSidebar();
					RED.view.resize();
				}

				
				sidebarSeparator.width = $("#sidebar").width();
			},
			drag: function(event,ui) {
				var d = ui.position.left-sidebarSeparator.start;
				var newSidebarWidth = sidebarSeparator.width-d;
				if (sidebarSeparator.opening) {
					newSidebarWidth -= 13;
				}
				
				// takes care of chart minimum size
				if (newSidebarWidth > 150) {
					if (sidebarSeparator.chartWidth+d < 200) { // 200 is the minimum chart width
						ui.position.left = 200+sidebarSeparator.start-sidebarSeparator.chartWidth;
						d = ui.position.left-sidebarSeparator.start;
						newSidebarWidth = sidebarSeparator.width-d;
					}
				}
					
				if (newSidebarWidth < 150) {
					if (!sidebarSeparator.closing) {
						$("#sidebar").addClass("closing");
						sidebarSeparator.closing = true;
					}
					if (!sidebarSeparator.opening) {
						newSidebarWidth = 150;
						ui.position.left = sidebarSeparator.width-(150 - sidebarSeparator.start);
						d = ui.position.left-sidebarSeparator.start;
					}
				} else if (newSidebarWidth > 150 && (sidebarSeparator.closing || sidebarSeparator.opening)) {
					sidebarSeparator.closing = false;
					$("#sidebar").removeClass("closing");
				}

				var newChartRight = sidebarSeparator.chartRight-d;
				$("#workspace").css("right",newChartRight);
				$("#bottombar").css("right",newChartRight);
				$("#chart-zoom-controls").css("right",newChartRight+20);
				$("#sidebar").width(newSidebarWidth);

				sidebar_tabs.resize();
				RED.view.resize();
					
			},
			stop:function(event,ui) {
				RED.view.resize();
				if (sidebarSeparator.closing) {
					$("#sidebar").removeClass("closing");
					toggleSidebar();
					if ($("#sidebar").width() < 180) {
						$("#sidebar").width(180);
						$("#workspace").css("right",208);
						$("#chart-zoom-controls").css("right",228);
					}
				}
				$("#sidebar-separator").css("left","auto");
				$("#sidebar-separator").css("right",($("#sidebar").width()+13)+"px");
			}
	});
	
	var btnSidebar = $("#btn-sidebar");
	function toggleSidebar() {
		//if ($('#sidebar').tabs( "option", "active" ) === false) {
		//    $('#sidebar').tabs( "option", "active",0);
		//}
		btnSidebar.toggleClass("active");
		
		if (!btnSidebar.hasClass("active")) {
			$("#main-container").addClass("sidebar-closed");
		} else {
			$("#main-container").removeClass("sidebar-closed");
		}
	}
	toggleSidebar();
	
	function showSidebar(id) {
		if (!$("#btn-sidebar").hasClass("active")) {
			toggleSidebar();
		}
		sidebar_tabs.activateTab("tab-"+id);
	}
	
	function containsTab(id) {
		return sidebar_tabs.contains("tab-"+id);
	}
	
	return {
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        
		addTab: addTab,
		show: showSidebar,
		containsTab: containsTab
	}
	
})();
