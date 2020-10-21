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
	var isConnected = false;

	var settings = {
		useExportDialog: true,
		IOcheckAtExport: true,
		WebServerPort: 8080,
	};

	var settingsCategoryTitle = "Arduino Export/Import";

	var settingsEditorLabels = {
		useExportDialog: "Show export dialog",
		IOcheckAtExport: "IO check At Export",
		WebServerPort: "Web Server Port"
	};

	function startConnectedChecker()
	{
		window.setInterval(function () {
	        httpGetAsync("ping");
	    }, 2000);
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
	function httpGetAsync(param)
	{
		var xmlHttp = new XMLHttpRequest();
		const url = 'http://localhost:' + settings.WebServerPort;
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState != 4) return; // wait for timeout or response

			if (param == "getJSON")
			{
				if (xmlHttp.status == 200) {
					console.warn("JSON response");
					RED.storage.loadContents(xmlHttp.responseText);
				}
				else
					console.warn("getJSON did not response = " + xmlHttp.status);
			}
			else if (param.startsWith("addFile") || param.startsWith("renameFile") || param.startsWith("removeFile"))
			{
				console.warn("push json");
				RED.arduino.export.pushJSON();
			}
			else if (param == "ping")
			{
				isConnected = (xmlHttp.status == 200);
				//console.warn("isConnected="+ isConnected);
			}
			else
				console.warn("response@" + param + ":" + xmlHttp.responseText);
		};
		xmlHttp.open("GET", url+"\\?cmd=" + param, true); // true for asynchronous 
		xmlHttp.timeout = 2000;
		xmlHttp.send(null);
    }
    $('#btn-verify-compile').click(function() { httpGetAsync("compile"); });
	$('#btn-compile-upload').click(function() { httpGetAsync("upload"); });
	$('#btn-get-design-json').click(function() { httpGetAsync("getJSON"); });
    
    return {
		isConnected: function() { return isConnected;},
		settings:settings,
		settingsCategoryTitle:settingsCategoryTitle,
		settingsEditorLabels:settingsEditorLabels,
		startConnectedChecker:startConnectedChecker,
		httpPostAsync:httpPostAsync,
		httpGetAsync:httpGetAsync,
	};
})();