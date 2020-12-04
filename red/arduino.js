/** Added in addition to original Node-Red source, for audio system visualization
 * this file is intended to work as an interface between Node-Red flow and Arduino
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
RED.arduino = (function() {
	var serverIsActive = false;

	var _settings = {
		useExportDialog: false,
		IOcheckAtExport: true,
		WriteJSONtoExportedFile: true,
		WebServerPort: 8080,
		WebSocketServerPort: 3000,
		ProjectName: "TeensyAudioDesign",
		StandardIncludeHeader: "#include <Arduino.h>\n"
							  +	"#include <Audio.h>\n"
							  + "#include <Wire.h>\n"
							  + "#include <SPI.h>\n"
							  + "#include <SD.h>\n"
						      + "#include <SerialFlash.h>\n"
	}
	var settings = {
		get useExportDialog() { return _settings.useExportDialog; },
		set useExportDialog(state) { _settings.useExportDialog = state; },

		get IOcheckAtExport() { return _settings.IOcheckAtExport; },
		set IOcheckAtExport(state) { _settings.IOcheckAtExport = state; },

		get WriteJSONtoExportedFile() { return _settings.WriteJSONtoExportedFile; },
		set WriteJSONtoExportedFile(state) { _settings.WriteJSONtoExportedFile = state; },

		get WebServerPort() { return parseInt(_settings.WebServerPort); },
		set WebServerPort(state) { _settings.WebServerPort = parseInt(state); },

		get WebSocketServerPort() { return parseInt(_settings.WebSocketServerPort); },
		set WebSocketServerPort(state) { _settings.WebSocketServerPort = parseInt(state); StartWebSocketConnection(); },

		get ProjectName() { return _settings.ProjectName; },
		set ProjectName(value) { _settings.ProjectName = value; },

		get StandardIncludeHeader() { return _settings.StandardIncludeHeader; },
		set StandardIncludeHeader(value) { _settings.StandardIncludeHeader = value; }
	};

	var settingsCategoryTitle = "Arduino Export/Import";

	var settingsEditorLabels = {
		useExportDialog: "Force Show export dialog",
		IOcheckAtExport: "IO check At Export",
		WriteJSONtoExportedFile: "Write JSON at exported file",
		WebServerPort: "Web Server Port",
		WebSocketServerPort: "Web Socket Server Port",
		ProjectName: "Project Name",
		StandardIncludeHeader: "Global Includes"
	};

	function startConnectedChecker()
	{
		checkIfServerIsActive(); // run once first
		window.setInterval(function () {
			checkIfServerIsActive();
	    }, 10000);
	}
	function checkIfServerIsActive()
	{
		httpGetAsync("cmd=ping", 
			function(rt) {
				serverIsActive = true;
				//console.log("serverIsActive" + rt);
			},
			function(st) {
				serverIsActive = false;
				//console.log("serverIsNotActive" + st);
			});
	}

    function httpPostAsync(data)
	{
		const t0 = performance.now();
		var xhr = new XMLHttpRequest();
		//console.warn("httpPostAsync:" + data);
		const url = 'http://localhost:' + settings.WebServerPort;
		xhr.open("POST", url, true);
		xhr.onloadend = function () {
			console.warn("response:" + xhr.responseText);
			const t1 = performance.now();
			console.log('httpPostAsync took: ' + (t1-t0) +' milliseconds.');
		  };
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.timeout = 2000;
		xhr.send(data); 
	}
	function httpGetAsync(queryString, cbOnOk, cbOnError)
	{
		var xmlHttp = new XMLHttpRequest();
		const url = 'http://localhost:' + settings.WebServerPort;
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState != 4) return; // wait for timeout or response
			if (xmlHttp.status == 200)
			{
				if (cbOnOk != undefined)
					cbOnOk(xmlHttp.responseText);
				else
					console.warn(cbOnOk + "response @ " + queryString + ":\n" + xmlHttp.responseText);
			}
			else if (cbOnError != undefined)
				cbOnError(xmlHttp.status);
			else
				console.warn(queryString + " did not response = " + xmlHttp.status);
		};
		xmlHttp.open("GET", url + "?" + queryString, true); // true for asynchronous 
		xmlHttp.timeout = 2000;
		xmlHttp.send(null);
	}
	var wsSocket;
    function StartWebSocketConnection()
    {
		if ('WebSocket' in window)
		{
			var protocol = 'ws://';
			var address = protocol + "127.0.0.1:" + settings.WebSocketServerPort;
			RED.bottombar.info.addContent("StartWebSocket@" + address + "<br>");
			if (wsSocket != null)
				wsSocket.close();
			wsSocket = new WebSocket(address);
			wsSocket.onmessage = function (msg) {
				if (msg.data == 'reload') window.location.reload();
				else
				{
					//console.log(msg.data);
					RED.bottombar.show('output'); // '<span style="color:#000">black<span style="color:#AAA">white</span></span>' + 
					var dataToAdd = msg.data.replace('style="color:#FFF"', 'style="color:#000"');//.replace("[CR][LF]", "<br>").replace("[CR]", "<br>").replace("[LF]", "<br>");
					//console.warn(dataToAdd);
					RED.bottombar.info.addContent(dataToAdd);
				}
			};
        }
        else {
            console.error('Upgrade your browser. This Browser is NOT supported WebSocket for receiving terminal text');
        }
    }
    function SendToWebSocket(string)
    {
        if (wsSocket == undefined) return;
        wsSocket.send(string);
    }
    $('#btn-verify-compile').click(function() {RED.bottombar.info.setContent(""); httpGetAsync("cmd=compile"); });
	$('#btn-compile-upload').click(function() {RED.bottombar.info.setContent(""); httpGetAsync("cmd=upload"); });
	//$('#btn-get-design-json').click(function() { httpGetAsync("cmd=getFile&fileName=GUI_TOOL.json", GetGUI_TOOL_JSON_response,NOtresponse); });
	$('#btn-get-design-json').click(function() { httpGetAsync("cmd=getFile&fileName=GUI_TOOL.json", GetGUI_TOOL_JSON_response,NOtresponse); });
	function GetGUI_TOOL_JSON_response(responseText) { RED.storage.loadContents(responseText); }
	function NOtresponse(text) {console.log("GetGUI_TOOL_JSON_ not response"); }
    
    return {
		serverIsActive: function() { return serverIsActive;},
		settings:settings,
		settingsCategoryTitle:settingsCategoryTitle,
		settingsEditorLabels:settingsEditorLabels,
		startConnectedChecker:startConnectedChecker,
		httpPostAsync:httpPostAsync,
		httpGetAsync:httpGetAsync,
		StartWebSocketConnection:StartWebSocketConnection,
        SendToWebSocket:SendToWebSocket
	};
})();