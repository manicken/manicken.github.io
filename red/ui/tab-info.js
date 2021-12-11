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
RED.sidebar.info = (function() {
	
	var content = document.createElement("div");
	content.id = "tab-info";
	content.style.paddingTop = "4px";
	content.style.paddingLeft = "4px";
	content.style.paddingRight = "4px";
	RED.sidebar.addTab("info",content);

	//console.warn("tab-info loading.."); // to see loading order
	
	
	
	function jsonFilter(key,value) {
		if (key === "") {
			return value;
		}
		var t = typeof value;
		if ($.isArray(value)) {
			return "[array:"+value.length+"]";
		} else if (t === "object") {
			return "[object]"
		} else if (t === "string") {
			if (value.length > 30) {
				return value.substring(0,30)+" ...";
			}
		}
		return value;
	}
	function clearSelection()
	{
		if (window.getSelection) {window.getSelection().removeAllRanges();}
		else if (document.selection) {document.selection.empty();}
	}

	function getMultipleOfString(str, mult)
	{
		var retStr = ""
		for (var i = 0; i < mult; i++)
		{
			retStr += str;
		}
		return retStr
	}
	

	function getGroupTree(node, incr, level)
	{
		var isRoot = (level == 0);
		var currIncr = getMultipleOfString(incr, level);
		level++;

		if (isRoot == false)
			var val = currIncr + "[<br/>";
		else
			var val = "[<br/>";
		for (var i=0;i<node.nodes.length;i++) {
			//if (isRoot == false)
			//	val+=newIncr;
			//if (node.nodes[i].parentGroup != undefined)
			//	val += currIncr + incr /*+ i + ":&nbsp;"*/ + node.nodes[i].parentGroup.name + ":" + node.nodes[i].name + "<br/>";
			//else
				val += currIncr + incr /*+ i + ":&nbsp;"*/ + node.nodes[i].name + "<br/>";

			if (node.nodes[i].nodes != undefined && (d3.event != undefined && d3.event.shiftKey == false)) // shiftkey don't allow sub groups (good when there exists recursive group loops)
				val += getGroupTree(node.nodes[i], incr, level);
		}
		
		if (isRoot == false)
			val += currIncr + "]<br>";
		else
			val += "]<br>";
		return val;
	}

	function getSimpleArray(node,n)
	{
		var val = "[<br/>";
		for (var i=0;i<Math.min(node[n].length,10);i++) {
			if (n== "nodes")
			val += "&nbsp;"+i+": "+node[n][i].name+"<br/>";
			else
			{
			var vv = JSON.stringify(node[n][i],jsonFilter," ").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
			val += "&nbsp;"+i+": "+vv+"<br/>";
			}
		}
		if (node[n].length > 10) {
			val += "&nbsp;... "+node[n].length+" items<br/>";
		}
		val += "]";
		return val;
	}
	
	function refresh(node) {
		//console.warn("tab-info refresh");
		
		var table = '<table class="node-info"><tbody>';
		clearSelection();// partly fix a select node bug, that selects all text, it happens when you try select and move a node to quickly
		table += "<tr><td>&nbsp;<b>Type</b></td><td>&nbsp;<b>"+node.type+"</b></td></tr>";
		table += "<tr><td>&nbsp;Name</td><td>&nbsp;"+node.name+"</td></tr>";
		table += "<tr><td>&nbsp;ID</td><td>&nbsp;"+node.id+"</td></tr>";
		if (node.parentGroup != undefined)
			table += "<tr><td>&nbsp;ParentGroup Name</td><td>&nbsp;"+node.parentGroup.name+"</td></tr>";
		table += "<tr><td>&nbsp;posX</td><td>&nbsp;"+node.x+"</td></tr>"; // development info only
		table += "<tr><td>&nbsp;posY</td><td>&nbsp;"+node.y+"</td></tr>"; // development info only
		table += '<tr class="blank"><td colspan="2">&nbsp;Properties</td></tr>';
		for (var n in node._def.defaults) {
			if (n == "id" || n == "name") continue;
			if (node._def.defaults.hasOwnProperty(n)) {
				var val = node[n]||"";
				var type = typeof val;
				if (type === "string") {
					if (val.length > 30) { 
						val = val.substring(0,30)+" ...";
					}
					val = val.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
				} else if (type === "number") {
					val = val.toString();
				} else if ($.isArray(val)) {
					if (n == "nodes")
						val = getGroupTree(node,"&nbsp;&nbsp;", 0);
					else
						val = getSimpleArray(node,n);
					
				} else {
					val = JSON.stringify(val,jsonFilter," ");
					val = val.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
				}
				
				table += "<tr><td>&nbsp;"+n+"</td><td>"+val+"</td></tr>";
			}
		}
		table += "</tbody></table><br/>";
        if (node._def.help != undefined && node._def.help.trim().length != 0) this.setHelpContent(table, node._def.help);
        else this.setHelpContent(table, node.type);
	}

	function setHelpContent(prefix, key) {
		if (RED.sidebar.settings.autoSwitchTabToInfoTab)
			RED.sidebar.show("info");
		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);
		var finalHtml = "";

		prefix = prefix == "" ? "<h3>" + key + "</h3>" : prefix;
		if (!server) {
			data = RED.NodeHelpManager.getHelp(key); //$("script[data-help-name|='" + key + "']").html();
			if (data)
				finalHtml = '<div class="node-help">' + data + '</div>';
			else
			{
				if (RED.nodes.isClass(key))
					finalHtml = '<div class="node-help">' + getClassHelpContent(key) + '</div>';
				else
					finalHtml = '<div class="node-help">no help available</div>';
			}
		} else {
			$.get( "resources/help/" + key + ".html", function( data ) {
				finalHtml = '<h2>' + key + '</h2><div class="node-help">' + data + '</div>';
			}).fail(function () {
				finalHtml = "";
			});
		}
		var editor = ""; // to test new functinality
		//editor = $("script[data-template-name|='" + key + "']").html();
		//if (editor == undefined)
		//	editor = $("script[data-template-name|='NodesGlobalEdit']").html();

		$("#tab-info").html(prefix + editor + finalHtml);
	}
	function getClassHelpContent(className)
	{
		var wsId = RED.nodes.getWorkspaceIdFromClassName(className);
		var htmlCode = "<h3>Summary</h3>";
		htmlCode += "<p>" + RED.nodes.getClassComments(wsId) + "</p>";
		htmlCode += "<h3>Audio Connections</h3>";
		htmlCode += "<table class=doc align=center cellpadding=3>";
		htmlCode += "<tr class=top><th>Port</th><th>Purpose</th></tr>"
		
		var classIOs = RED.nodes.getClassIOportsSorted(wsId);
		
		for (var i = 0; i < classIOs.inputs.length; i++)
		{
			htmlCode += "<tr class=odd><td align=center>In" + i + "</td><td>" + classIOs.inputs[i].name + "</td></tr>";
		}
		for (var i = 0; i < classIOs.outputs.length; i++)
		{
			htmlCode += "<tr class=odd><td align=center>Out" + i + "</td><td>" + classIOs.outputs[i].name + "</td></tr>";
		}
		return htmlCode;
	}

	function showSelection(items)
	{
		RED.sidebar.show("info");
		var firstType = items[0].n.type;
		var sameType = true;
		for (var i = 1; i < items.length; i++)
		{
			if (items[i].n.type != firstType)
			{
				sameType = false;
				break;
			}
		}
		var htmlCode = "<h3>Selection</h3>";
		htmlCode += "<a class='btn btn-small' id='btn-export-selection' href='#'><i class='fa fa-copy'></i> Export</a>";
		if (sameType)
			htmlCode += "<a class='btn btn-small' id='btn-generate-array' href='#'><i class='fa fa-copy'></i> Generate array node</a>";
		htmlCode += "<table class=doc align=center cellpadding=3>";
		htmlCode += "<tr class=top><th>Type</th><th>Name</th><th>Id</th></tr>"
		for (var i = 0; i < items.length; i++)
		{
			htmlCode += "<tr class=odd><td align=center>" + items[i].n.type + "</td><td>" + items[i].n.name + "</td><td>" + items[i].n.id + "</td></tr>"
		}
		htmlCode += "</table>";
		$("#tab-info").html(htmlCode);
		$('#btn-export-selection').click(function() { RED.view.showExportNodesDialog();	});
		if (sameType)
			$('#btn-generate-array').click(function() { RED.nodes.generateArrayNode(items);	});
	}
	
	return {
		refresh:refresh,
		showSelection: showSelection,
		clear: function() {
            //if (RED.sidebar.settings.autoSwitchTabToInfoTab == true)
			//    RED.sidebar.show("info");
			var standardHelpText = $("script[data-help-name|='WelcomeStandardText']").html();
			$("#tab-info").html(standardHelpText);
		},
		setHelpContent: setHelpContent
	}
})();
