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

	var settings = {
		useExportDialog: true,
		IOcheckAtExport: true,
		WriteJSONtoExportedFile: true,
		WebServerPort: 8080,
	};

	var settingsCategoryTitle = "Arduino Export/Import";

	var settingsEditorLabels = {
		useExportDialog: "Show export dialog",
		IOcheckAtExport: "IO check At Export",
		WriteJSONtoExportedFile: "Write JSON at exported file",
		WebServerPort: "Web Server Port"
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
	};
})();