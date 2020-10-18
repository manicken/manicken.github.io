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
RED.bottombar = (function() {

	//$('#bottombar').tabs();
	var bottombar_tabs = RED.tabs.create({
		id:"bottombar-tabs",
		onchange:function(tab) {
			$("#bottombar-content").children().hide();
			$("#"+tab.id).show();
		},
		onremove: function(tab) {
			$("#"+tab.id).remove();
		}
	});
	function addTab(title,content,closeable) {
		$("#bottombar-content").append(content);
		$(content).hide();
		bottombar_tabs.addTab({id:"tab-"+title,label:title,closeable:closeable});
		//content.style.position = "absolute";
		//$('#bottombar').tabs("refresh");
	}
	
	$('#btn-bottombar').click(function() {togglebottombar();});
	RED.keyboard.add(/* b */ 66,{ctrl:true},function(){togglebottombar();d3.event.preventDefault();});

	var bottombarSeparator =  {};
	$("#bottombar-separator").draggable({
			axis: "y",
			start:function(event,ui) {
				bottombarSeparator.closing = false;
				bottombarSeparator.opening = false;
				var winHeight= $(window).height();
				bottombarSeparator.start = ui.position.top;
				bottombarSeparator.chartHeight= $("#workspace").height();
				bottombarSeparator.chartBottom = winHeight - $("#workspace").height() - $("#workspace").offset().top - 2;

				if (!btnbottombar.hasClass("active")) 
				{
					bottombarSeparator.opening = true;
					var newChartBottom = 0;
					$("#bottombar").addClass("closing");
					$("#workspace").css("bottom", newChartBottom);
					$("#chart-zoom-controls").css("bottom", newChartBottom + 20);
					$("#bottombar").height(0);
					togglebottombar();
					RED.view.resize();
				}
				bottombarSeparator.height = $("#bottombar").height();
			},
			drag: function (event, ui) {
				var d = ui.position.top-bottombarSeparator.start;
				var newbottombarHeight = bottombarSeparator.height - d;
				if (bottombarSeparator.opening) {
				    newbottombarHeight -= 13;
				}
				//console.log("height:" + newbottombarHeight);
				/*if (newbottombarHeight > 60) {
					if (bottombarSeparator.chartHeight+d < 200) {
						ui.position.top = 200+bottombarSeparator.start-bottombarSeparator.chartHeight;
						d = ui.position.top-bottombarSeparator.start;
						newbottombarHeight = bottombarSeparator.height - d;
					}
				}*/
				
					
				if (newbottombarHeight < 60) {
					if (!bottombarSeparator.closing) {
						//console.log("!bottombarSeparator.closing");
						$("#bottombar").addClass("closing");
						bottombarSeparator.closing = true;
					}
					if (!bottombarSeparator.opening) {
						//console.log("!bottombarSeparator.opening");
					    newbottombarHeight = 60;
					    ui.position.top = bottombarSeparator.height - (60 - bottombarSeparator.start);
						d = ui.position.top-bottombarSeparator.start;
					}
				} else if (newbottombarHeight > 60 && (bottombarSeparator.closing || bottombarSeparator.opening)) {
					//console.log("else if (newbottombarHeight > 60 && (bottombarSeparator.closing || bottombarSeparator.opening))");
					bottombarSeparator.closing = false;
					$("#bottombar").removeClass("closing");
				}
				else
				{
					//console.log("else");
				}

				var newChartBottom = bottombarSeparator.chartBottom-d;
				$("#workspace").css("bottom",newChartBottom);
				$("#chart-zoom-controls").css("bottom", newChartBottom + 20);
				$("#bottombar").height(newbottombarHeight);
				$("#messages").css("height", newbottombarHeight-50);
				$("#console_messages").css("height", newbottombarHeight - 80);

				bottombar_tabs.resize();
				RED.view.resize();
					
			},
			stop:function(event,ui) {
				//console.log("stop:function(event,ui) {");
				RED.view.resize();
				if (bottombarSeparator.closing) {
					//console.log("stop:function @ bottombarSeparator.closing")
					$("#bottombar").removeClass("closing");
					togglebottombar();
					if ($("#bottombar").height() < 180) {
					    $("#bottombar").height(180);
						$("#workspace").css("bottom",30);
						$("#chart-zoom-controls").css("bottom",60);
					}
				}
				$("#bottombar-separator").css("top","auto");
				$("#bottombar-separator").css("bottom",($("#bottombar").height()+13)+"px");
			}
	});
	
	var btnbottombar = $("#btn-bottombar");
	function togglebottombar() {
		//if ($('#bottombar').tabs( "option", "active" ) === false) {
		//    $('#bottombar').tabs( "option", "active",0);
		//}
		btnbottombar.toggleClass("active");
		
		if (!btnbottombar.hasClass("active")) {
			$("#main-container").addClass("bottombar-closed");
		} else {
			$("#main-container").removeClass("bottombar-closed");
		}
	}
	togglebottombar();
	togglebottombar();
	
	function showbottombar(id) {
		if (!$("#btn-bottombar").hasClass("active")) {
			togglebottombar();
		}
		bottombar_tabs.activateTab("tab-"+id);
	}
	
	function hidebottombar(id) {
	    if ($("#btn-bottombar").hasClass("active")) {
	        togglebottombar();
	    }
	    bottombar_tabs.activateTab("tab-" + id);
	}

	function containsTab(id) {
		return bottombar_tabs.contains("tab-"+id);
	}
	
	return {
		addTab: addTab,
		show: showbottombar,
		hide: hidebottombar,
		containsTab: containsTab
	}
	
})();
