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
var RED = (function() {

	$('#btn-keyboard-shortcuts').click(function(){showHelp();});

	function hideDropTarget() {
		$("#dropTarget").hide();
		RED.keyboard.remove(/* ESCAPE */ 27);
	}

	$('#chart').on("dragenter",function(event) {
		if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
			$("#dropTarget").css({display:'table'});
			RED.keyboard.add(/* ESCAPE */ 27,hideDropTarget);
		}
	});

	$('#dropTarget').on("dragover",function(event) {
		if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
			event.preventDefault();
		}
	})
	.on("dragleave",function(event) {
		hideDropTarget();
	})
	.on("drop",function(event) {
		var data = event.originalEvent.dataTransfer.getData("text/plain");
		hideDropTarget();
		RED.view.importNodes(data);
		event.preventDefault();
	});
	function make_name(n) {
		var name = (n.name ? n.name : n.id);
		name = name.replace(" ", "_").replace("+", "_").replace("-", "_");
		return name
	}

	function save(force) {
		RED.storage.update();

		if (RED.nodes.hasIO()) {
			var nns = RED.nodes.createCompleteNodeSet();
			// sort by horizontal position, plus slight vertical position,
			// for well defined update order that follows signal flow
			nns.sort(function(a,b){ return (a.x + a.y/250) - (b.x + b.y/250); });
			//console.log(JSON.stringify(nns));

			var cpp = "#include <Audio.h>\n#include <Wire.h>\n"
				+ "#include <SPI.h>\n#include <SD.h>\n#include <SerialFlash.h>\n\n"
				+ "// GUItool: begin automatically generated code\n";
			// generate code for all audio processing nodes
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];
				var node = RED.nodes.node(n.id);
				if (node && (node.outputs > 0 || node._def.inputs > 0)) {
					cpp += n.type + " ";
					for (var j=n.type.length; j<24; j++) cpp += " ";
					var name = make_name(n)
					cpp += name + "; ";
					for (var j=n.id.length; j<14; j++) cpp += " ";
					cpp += "//xy=" + n.x + "," + n.y + "\n";
				}
			}
			// generate code for all connections (aka wires or links)
			var cordcount = 1;
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];
				if (n.wires) {
					for (var j=0; j<n.wires.length; j++) {
						var wires = n.wires[j];
						if (!wires) continue;
						for (var k=0; k<wires.length; k++) {
							var wire = n.wires[j][k];
							if (wire) {
								var parts = wire.split(":");
								if (parts.length == 2) {
									cpp += "AudioConnection          patchCord" + cordcount + "(";
									var src = RED.nodes.node(n.id);
									var dst = RED.nodes.node(parts[0]);
									var src_name = make_name(src);
									var dst_name = make_name(dst);
									if (j == 0 && parts[1] == 0 && src && src.outputs == 1 && dst && dst._def.inputs == 1) {
										cpp += src_name + ", " + dst_name;
									} else {
										cpp += src_name + ", " + j + ", " + dst_name + ", " + parts[1];
									}
									cpp += ");\n";
									cordcount++;
								}
							}
						}
					}
				}
			}
			// generate code for all control nodes (no inputs or outputs)
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];
				var node = RED.nodes.node(n.id);
				if (node && node.outputs == 0 && node._def.inputs == 0) {
					cpp += n.type + " ";
					for (var j=n.type.length; j<24; j++) cpp += " ";
					cpp += n.id + "; ";
					for (var j=n.id.length; j<14; j++) cpp += " ";
					cpp += "//xy=" + n.x + "," + n.y + "\n";
				}
			}
			cpp += "// GUItool: end automatically generated code\n";
			//console.log(cpp);

			RED.view.state(RED.state.EXPORT);
			RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
				$("#node-input-export").val(cpp).focus(function() {
				var textarea = $(this);
				textarea.select();
				textarea.mouseup(function() {
					textarea.unbind("mouseup");
					return false;
				});
				}).focus();
			$( "#dialog" ).dialog("option","title","Export to Arduino").dialog( "open" );
			});
			//RED.view.dirty(false);
		} else {
			$( "#node-dialog-error-deploy" ).dialog({
				title: "Error exporting data to Arduino IDE",
				modal: true,
				autoOpen: false,
				width: 410,
				height: 245,
				buttons: [{
					text: "Ok",
					click: function() {
						$( this ).dialog( "close" );
					}
				}]
			}).dialog("open");
		}
	}

	$('#btn-deploy').click(function() { save(); });

	function isClass(node)
	{
		var wns = RED.nodes.getWorkspacesAsNodeSet();

		for (var wsi = 0; wsi < wns.length; wsi++)
		{
			var ws = wns[wsi];
			if (node.type == ws.label) return true;
			//console.log(node.type  + "!="+ ws.label);
		}
		return false;
	}
	
	function getWorkspaceIdFromClassName(node)
	{
		var wns = RED.nodes.getWorkspacesAsNodeSet();

		for (var wsi = 0; wsi < wns.length; wsi++)
		{
			var ws = wns[wsi];
			if (node.type == ws.label)  return ws.id;
		}
		return "";
	}

	function getWireInputSourceNode(wsId, nId)
	{
		var nns = RED.nodes.createCompleteNodeSet();

		console.log("try get WireInputSourceNode:" + wsId + ":" + nId);
		for (var ni = 0; ni < nns.length; ni++)
		{
			var n = nns[ni];
			if (n.z != wsId) continue; // workspace check

			if (!n.wires){/* console.log("!n.wires: "+n.type + ":" + n.name);*/ continue;}

			//if (n.wires.length == 0) console.log("port.length == 0:"+n.type + ":" + n.name)

			for (var pi=0; pi<n.wires.length; pi++) // pi = port index
			{
				var port = n.wires[pi];
				if (!port){ /*console.log("!port(" + pi + "):" + n.type + ":" + n.name);*/ continue;}

				//if (port.length == 0) console.log("portWires.length == 0:"+n.type + ":" + n.name)

				for (var pwi=0; pwi<port.length; pwi++) // pwi = port wire index
				{
					var wire = port[pwi];
					if (!wire){ /*console.log("!wire(" + pwi + "):" + n.type + ":" + n.name); */continue;}

					var parts = wire.split(":");
					if (parts.length != 2){/* console.log("parts.length != 2 (" + pwi + "):" + n.type + ":" + n.name);*/ continue;}
						
					if (parts[0] == nId)
						{
							console.log("we found the WireInputSourceNode:" + n.name + " , "+ n.id)
							return n;
						}
					
				}
			}
		}
	}
	function getClassOutputPort(node, index)
	{
		var wsId = getWorkspaceIdFromClassName(node);
		var currIndex = 0;
		for (var i = 0; i < RED.nodes.nodes.length; i++)
		{
			var n = RED.nodes.nodes[i];
			if (n.z != wsId) continue;
			
			if (n.type != "TabOutput") continue;

			if (currIndex == index) // we found the port
			{
				// then we get what is connected to that port inside the class
				
				return getWireInputSourceNode(wsId, n.id);
			}
			currIndex++; // check if we can find the port
		}
	}
	function save2(force) {
		
		//TODO: to use this following sort, 
		//it's more meaningfull if we first sort nodes by workspace
		//RED.nodes.nodes.sort(function(a,b){ return (a.x + a.y/250) - (b.x + b.y/250); }); 

		RED.storage.update();

		//if (RED.nodes.hasIO()) {
			
			var nns = RED.nodes.createCompleteNodeSet();
			// sort by horizontal position, plus slight vertical position,
			// for well defined update order that follows signal flow
			nns.sort(function(a,b){ return (a.x + a.y/250) - (b.x + b.y/250); });
			//console.log(JSON.stringify(nns));

			var wns = RED.nodes.getWorkspacesAsNodeSet();

			var cpp = "#include <Audio.h>\n#include <Wire.h>\n"
				+ "#include <SPI.h>\n#include <SD.h>\n#include <SerialFlash.h>\n\n"
				+ "\n// GUItool: begin automatically generated code\n"

			for (var wsi=0; wsi < wns.length; wsi++)
			{
				cpp += "\nclass " + wns[wsi].label + "\n{\n"
				+ "  public:\n";

			
				//cpp += wns[i].id + ":" + wns[i].label + "\n"; // test 
			
			// generate code for all audio processing nodes
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];

				if (n.z != wns[wsi].id) continue; // workspace check

				var node = RED.nodes.node(n.id);
				if (node && (node.outputs > 0 || node._def.inputs > 0)) {
					
					if (n.type == "TabInput" || n.type == "TabOutput")
						cpp += "//  "; 
					else
						cpp += "    "
					cpp += n.type + " ";
					for (var j=n.type.length; j<32; j++) cpp += " ";
					var name = make_name(n)
					cpp += name + "; ";
					for (var j=n.name.length; j<26; j++) cpp += " ";
					
					cpp += "//xy=" + n.x + "," + n.y + "," + n.z;

					if (n.type == "TabInput" || n.type == "TabOutput")
						cpp += " // placeholder\n"; 
					else
						cpp += "\n";
				}
			}
			// generate code for all control nodes (no inputs or outputs)
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];

				if (n.z != wns[wsi].id) continue;

				var node = RED.nodes.node(n.id);
				if (node && node.outputs == 0 && node._def.inputs == 0) {
					cpp += "    " + n.type + " ";
					for (var j=n.type.length; j<32; j++) cpp += " ";
					var name = make_name(n)
					cpp += name + "; ";
					for (var j=n.name.length; j<26; j++) cpp += " ";
					cpp += "//xy=" + n.x + "," + n.y + "," + n.z + "\n";
				}
			}
			cpp+= "\n    " + wns[wsi].label + "() // constructor (this is called when class-object is created)\n    {\n";
			
			// generate code for all connections (aka wires or links)
			var cordcount = 1;
			for (var i=0; i<nns.length; i++) {
				var n = nns[i];

				if (n.z != wns[wsi].id) continue; // workspace check

				if (!n.wires){ console.log("!n.wires: "+n.type + ":" + n.name); continue;}

				if (n.wires.length == 0) console.log("port.length == 0:"+n.type + ":" + n.name)

				for (var pi=0; pi<n.wires.length; pi++) // pi = port index
				{
					var port = n.wires[pi];
					if (!port){ /*console.log("!port(" + pi + "):" + n.type + ":" + n.name);*/ continue;}

					//if (port.length == 0) console.log("portWires.length == 0:"+n.type + ":" + n.name)

					for (var pwi=0; pwi<port.length; pwi++) // pwi = port wire index
					{
						var wire = port[pwi];
						if (!wire){ /*console.log("!wire(" + pwi + "):" + n.type + ":" + n.name);*/ continue;}

						var parts = wire.split(":");
						if (parts.length != 2){ /*console.log("parts.length != 2 (" + pwi + "):" + n.type + ":" + n.name);*/ continue;}

						var src = RED.nodes.node(n.id);
						var dst = RED.nodes.node(parts[0]);

						var src_name = make_name(src);
						var dst_name = make_name(dst);

						if (isClass(n)) // if source is class
						{
							console.log("src is class:" + n.name);
							var srcObj = getClassOutputPort(n, pi);
							if (srcObj)
								src_name += "." + make_name(srcObj);
						}
						//TODO: next we have to do if destination is class
						if (isClass(dst))
						{
							console.log("dst is class:" + dst.name + " from:" + n.name);
						}

						if (src.type == "TabInput" || dst.type == "TabOutput")
							cpp += "//      ";
						else
							cpp += "        "; 

						cpp += "AudioConnection        patchCord" + cordcount + "(";
						if (pi == 0 && parts[1] == 0 && src && src.outputs == 1 && dst && dst._def.inputs == 1)
						{
							cpp += src_name + ", " + dst_name;
						}
						else
						{
							cpp += src_name + ", " + pi + ", " + dst_name + ", " + parts[1];
						}
						if (src.type == "TabInput" || dst.type == "TabOutput")
							cpp += "); // placeholder\n";
						else 
							cpp += ");\n";
						cordcount++;
					}
				}
			}
			cpp += "    }\n";
			
			cpp += "}\n";
		}
			cpp += "// GUItool: end automatically generated code\n";
			//console.log(cpp);

			RED.view.state(RED.state.EXPORT);
			RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
				
				$("#node-input-export").val(cpp).focus(function() {
				var textarea = $(this);
				textarea.select();
				textarea.mouseup(function() {
					textarea.unbind("mouseup");
					return false;
				});
				}).focus();

				/*$("#node-input-export2").val("second text").focus(function() { // this can be used for custom mixer code in future
					var textarea = $(this);
					textarea.select();
					textarea.mouseup(function() {
						textarea.unbind("mouseup");
						return false;
					});
					}).focus();*/ 

			$( "#dialog" ).dialog("option","title","Export to Arduino").dialog( "open" );
			});
			//RED.view.dirty(false);
		/*} else {
			$( "#node-dialog-error-deploy" ).dialog({
				title: "Error exporting data to Arduino IDE",
				modal: true,
				autoOpen: false,
				width: 410,
				height: 245,
				buttons: [{
					text: "Ok",
					click: function() {
						$( this ).dialog( "close" );
					}
				}]
			}).dialog("open");
		}*/
	}
	
	$('#btn-deploy2').click(function() { save2(); });

	function showExportDialog(cppCode)
	{

	}
	 

	$( "#node-dialog-confirm-deploy" ).dialog({
			title: "Confirm deploy",
			modal: true,
			autoOpen: false,
			width: 530,
			height: 230,
			buttons: [
				{
					text: "Confirm deploy",
					click: function() {
						save(true);
						$( this ).dialog( "close" );
					}
				},
				{
					text: "Cancel",
					click: function() {
						$( this ).dialog( "close" );
					}
				}
			]
	});

	// from http://css-tricks.com/snippets/javascript/get-url-variables/
	function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if(pair[0] == variable){return pair[1];}
		}
		return(false);
	}

	function getClassNrOfInputs(nns, classUid)// Jannik add function
	{
		var count = 0;
		for (var i = 0; i  < nns.length; i++)
		{
			var n = nns[i];
			if (n.z == classUid)
			{
				if (n.type == "TabInput")
				{
					count++;
					//console.log("TabInput:" + n.name);
				}
			}
		}
		return count;
	}
	function getClassNrOfOutputs(nns, classUid)// Jannik add function
	{
		var count = 0;
		for (var i = 0; i  < nns.length; i++)
		{
			var n = nns[i];
			if (n.z == classUid)
			{
				if (n.type == "TabOutput")
				{
					count++;
					//console.log("TabOutput:" + n.name);
				}
			}
		}
		return count;
	}
	
	function refreshClassNodes()// Jannik add function
	{
	   var nns = RED.nodes.createCompleteNodeSet();
	   var wns = RED.nodes.getWorkspacesAsNodeSet(); // so that we can get class names
	   nns.sort(function(a,b){ return (a.x/250 + a.y/250) - (b.x/250 + b.y/250); });

	   for ( var wsi = 0; wsi < wns.length; wsi++)
	   {
		   var ws = wns[wsi];
		   //console.log("ws.label:" + ws.label); // debug
		   for ( var ni = 0; ni < nns.length; ni++)
		   {
			   var n = nns[ni];
			   //console.log("n.type:" + n.type); // debug
			   if (n.type == ws.label)
			   {
				   console.log("updating " + n.type);
					var node = RED.nodes.node(n.id); // debug
					node._def = RED.nodes.getType(n.type); // refresh type def
					//node._def.inputs = getClassNrOfInputs(nns, ws.id);
					node._def.outputs = getClassNrOfOutputs(nns, ws.id);
			   }
		   }
	   }
	}
	function addClassTabsToPalette()// Jannik add function
	{
		var wns = RED.nodes.getWorkspacesAsNodeSet();
		var nns = RED.nodes.createCompleteNodeSet();
		// sort by horizontal position, plus slight vertical position,
		// for well defined update order that follows signal flow
		nns.sort(function(a,b){ return (a.x/250 + a.y/250) - (b.x/250 + b.y/250); });

		for (var i=0; i < wns.length; i++)
		{
			var ws = wns[i];
			var inputCount = getClassNrOfInputs(nns, ws.id);
			var outputCount = getClassNrOfOutputs(nns, ws.id);
			//var color = "#E6E0F8"; // standard
			var color = "#ccffcc"; // new
			//var data = $.parseJSON("{\"defaults\":{\"name\":{\"value\":\"new\"}},\"shortName\":\"" + ws.label + "\",\"inputs\":" + inputCount + ",\"outputs\":" + outputCount + ",\"category\":\"tabs-function\",\"color\":\"" + color + "\",\"icon\":\"arrow-in.png\"}");
			var data = $.parseJSON("{\"defaults\":{\"name\":{\"value\":\"new\"},\"id\":{\"value\":\"new\"}},\"shortName\":\"" + ws.label + "\",\"inputs\":" + inputCount + ",\"outputs\":" + outputCount + ",\"category\":\"tabs-function\",\"color\":\"" + color + "\",\"icon\":\"arrow-in.png\"}");

			RED.nodes.registerType(ws.label, data);
		}
	}

	function loadNodes() {
			$(".palette-scroll").show();
			$("#palette-search").show();
			RED.storage.load();
			addClassTabsToPalette();
			refreshClassNodes();
			RED.view.redraw();
			
			setTimeout(function() {
				$("#btn-deploy").removeClass("disabled").addClass("btn-danger");
				$("#btn-deploy2").removeClass("disabled").addClass("btn-danger");
				$("#btn-import").removeClass("disabled").addClass("btn-success");
			}, 1500);
			$('#btn-deploy').click(function() { save(); });
			$('#btn-deploy2').click(function() { save2(); });
			// if the query string has ?info=className, populate info tab
			var info = getQueryVariable("info");
			if (info) {
				RED.sidebar.info.setHelpContent('', info);
			}
	}

	$('#btn-node-status').click(function() {toggleStatus();});

	var statusEnabled = false;
	function toggleStatus() {
		var btnStatus = $("#btn-node-status");
		statusEnabled = btnStatus.toggleClass("active").hasClass("active");
		RED.view.status(statusEnabled);
	}
	
	function showHelp() {

		var dialog = $('#node-help');

		//$("#node-help").draggable({
		//        handle: ".modal-header"
		//});

		dialog.on('show',function() {
			RED.keyboard.disable();
		});
		dialog.on('hidden',function() {
			RED.keyboard.enable();
		});

		dialog.modal();
	}

	$(function() {
		$(".palette-spinner").show();

		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);

		if (!server) {
			var data = $.parseJSON($("script[data-container-name|='NodeDefinitions']").html());
			var nodes = data["nodes"];
			$.each(nodes, function (key, val) {
				
				RED.nodes.registerType(val["type"], val["data"]);
			});
			RED.keyboard.add(/* ? */ 191, {shift: true}, function () {
				showHelp();
				d3.event.preventDefault();
			});
			loadNodes();
			
			

			$(".palette-spinner").hide();
		} else {
			$.ajaxSetup({beforeSend: function(xhr){
				if (xhr.overrideMimeType) {
					xhr.overrideMimeType("application/json");
				}
			}});
			$.getJSON( "resources/nodes_def.json", function( data ) {
				var nodes = data["nodes"];
				$.each(nodes, function(key, val) {
					RED.nodes.registerType(val["type"], val["data"]);
				});
				RED.keyboard.add(/* ? */ 191,{shift:true},function(){showHelp();d3.event.preventDefault();});
				loadNodes();
				$(".palette-spinner").hide();
			})
		}
		
	});

	return {
		addClassTabsToPalette:addClassTabsToPalette,
		refreshClassNodes:refreshClassNodes
	};
})();
