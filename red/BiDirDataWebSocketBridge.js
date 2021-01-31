/** Added in addition to original Node-Red source, for audio system visualization
 * this file is intended to work as an interface between Node-Red flow and BiDirDataWebSocketServer
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

RED.BiDirDataWebSocketBridge = (function() {
    
    var defSettings = {
        MidiDeviceIn: 0,
        MidiDeviceOut: 0,
        bddwssPort: 3001, // BiDirWebSocketServer Port
    }
    // Object.assign({}, ) is used to ensure that the defSettings is not overwritten
    var _settings = {
        MidiDeviceIn: defSettings.MidiDeviceIn,
        MidiDeviceOut: defSettings.MidiDeviceOut,
        bddwssPort:  defSettings.bddwssPort, // BiDirWebSocketServer Port
    }

    var settings = {
        get bddwssPort() { return parseInt(_settings.bddwssPort); },
		set bddwssPort(value) { _settings.bddwssPort = parseInt(value); StartWebSocketBiDirData_Connection(); RED.storage.update();},

        get MidiDeviceIn() { return _settings.MidiDeviceIn; },
		set MidiDeviceIn(value) { _settings.MidiDeviceIn = parseInt(value); SendToWebSocket("midiSetDeviceIn(" + value + ")"); RED.storage.update();}, // storage update will only run after this program has started

		get MidiDeviceOut() { return _settings.MidiDeviceOut; },
		set MidiDeviceOut(value) { _settings.MidiDeviceOut = parseInt(value); SendToWebSocket("midiSetDeviceOut(" + value + ")"); RED.storage.update();},
    }

    var settingsCategory = { label:"BiDirData WebSocketBridge", expanded:false, bgColor:"#DDD", popupText: "Currently only used with a midi interface<br><br>(standard raw serial port is planned for a future release)"};

    var settingsEditor = {
        bddwssPort:              { label:"BiDirData Web Socket Server Port", type:"number"},
        midiSubCat: {label:"MIDI", expanded:true, bgColor:"#FFF", popupText:"This contains settings for the Web Socket based midi interface", items: {
			MidiDevicesRefresh:      { label:"Refresh midi devices", type:"button", buttonClass:"btn-primary btn-sm", action: function() {SendToWebSocket("midigetdevices"); }},
			MidiDeviceIn:            { label:"MidiDevice In", type:"combobox", actionOnChange:true, valueId:""}, // valueId is set by the settings generator
			MidiDeviceOut:           { label:"MidiDevice Out", type:"combobox", actionOnChange:true, valueId:""} 
		}},
    }

    
	var wsClientBiDirData;
    var wsClientBiDirDataConnected = false;
    
    function StartWebSocketBiDirData_Connection()
    {
		if (!('WebSocket' in window)){ console.error('Upgrade your browser. This Browser is NOT supported WebSocket (used by midi rx/tx)'); return;}

		if (wsClientBiDirData != null)
			wsClientBiDirData.close();
		wsClientBiDirData = new WebSocket("ws://127.0.0.1:" + settings.bddwssPort);
		wsClientBiDirData.onmessage = function (msg) {
			if (msg.data == 'reload') window.location.reload();
			else
			{
				if (msg.data.startsWith("midiSend"))
					decodeWSCBDD_midiSend(msg.data);
				else if (msg.data.startsWith("midiDevices"))
					decodeWSCBDD_midiDevices(msg.data.substring("midiDevices".length));
				else
					console.log("unknown WebSocketBiDirData message:" + msg.data);
				//console.log(msg.data);
				RED.bottombar.show('output'); // '<span style="color:#000">black<span style="color:#AAA">white</span></span>' + 
				var dataToAdd = msg.data.replace('style="color:#FFF"', 'style="color:#000"');//.replace("[CR][LF]", "<br>").replace("[CR]", "<br>").replace("[LF]", "<br>");
				//console.warn(dataToAdd);
				RED.bottombar.info.addContent(dataToAdd);
			}
		};
		wsClientBiDirData.onopen = function(ev) {
			wsClientBiDirDataConnected = true;
			SendToWebSocket("midigetdevices");
			RED.bottombar.info.setContent("");
		};
		
	}
	function decodeWSCBDD_midiSend(message) // WebSocketClientBiDirData
	{
		var beginIndex = message.indexOf("(");
		if (beginIndex == -1) { wsClientBiDirData.send("midi send missing first ("); return; }
		var endIndex = message.indexOf(")");
		if (endIndex == -1) { wsClientBiDirData.send("midi send missing last )"); return; }
		message = message.substring(beginIndex+1, endIndex);
		var params = message.split(",");
		if (params.length != 3)  { wsClientBiDirData.send("midi send don't contain 3 parameters"); return; }
		if (params[0].startsWith("0xB"))
		{
			var midiId = params[1].trim();
			var value = params[2].trim();
			if (midiId.startsWith("0x")) midiId = parseInt(midiId, 16);
			if (value.startsWith("0x")) value = parseInt(value, 16);
			setUiItemValue(midiId, value);
		}
		else
			console.log("midi message:" + message);
	}
	function setUiItemValue(midiId, value)
	{
		for (var i = 0; i < RED.nodes.nodes.length; i++)
		{
			var n = RED.nodes.nodes[i];
			if (n._def.uiObject == undefined) continue;

			if (n.midiId == undefined) continue;

			if (n.midiId == midiId)
			{
				if (n.type == "UI_Slider")
				{
					console.log("setting " + n.name  + " val to " + value);
					n.val = value;
					n.dirty = true;
				}
				else if (n.type == "UI_ListBox")
				{
					console.log("setting " + n.name  + " selectedIndex to " + value);
					n.selectedIndex = value;
					n.dirty = true;
				}
				else if (n.type == "UI_Piano")
				{
					// this can be used for feed back i.e. visual piano key downs
				}
			}
		}
		RED.view.redraw();
	}
	var midiDevicesIn = [];
	var midiDeviceInIndex = -1;
	var midiDevicesOut = [];
	var midiDeviceOutIndex = -1;
	function decodeWSCBDD_midiDevices(string)
	{			
		//console.log(string);
		var params = getSubStringOf(string, "(", ")");
		if (params == undefined) { wsClientBiDirData.send("err. missing some parantesis in:" + string); }
		//console.log(params);
		if (string.startsWith("In"))
		{
			midiDevicesIn = params.split("\t");
			//midiDeviceInIndex = parseInt(getSubStringOf(string, "[", "]"));
		}
		else if (string.startsWith("Out"))
		{
			midiDevicesOut = params.split("\t");
			//midiDeviceOutIndex = parseInt(getSubStringOf(string, "[", "]"));
			//console.warn("midi devices indexes:" + midiDeviceInIndex + " " + midiDeviceOutIndex);
			
			// when here we have both input and output devices
			/*setOptionList("node-input-midiInputdevice", midiDevicesIn);
			setOptionList("node-input-midiOutputdevice", midiDevicesOut);
			$("#node-input-midiInputdevice").val(midiDeviceInIndex);
			$("#node-input-midiOutputdevice").val(midiDeviceOutIndex);*/
			
			RED.settings.editor.setOptionList(settingsEditor.midiSubCat.items.MidiDeviceIn.valueId, midiDevicesIn);
			RED.settings.editor.setOptionList(settingsEditor.midiSubCat.items.MidiDeviceOut.valueId, midiDevicesOut);
			
			if (midiDeviceInIndex == -1)
			{
				console.warn("trying to use prev midi in device:" + settings.MidiDeviceIn);
				$("#" + settingsEditor.midiSubCat.items.MidiDeviceIn.valueId).val(settings.MidiDeviceIn);
				SendToWebSocket("midiSetDeviceIn(" + settings.MidiDeviceIn + ")");
			}
			else
				$("#" + settingsEditor.midiSubCat.items.MidiDeviceIn.valueId).val(midiDeviceInIndex);

			if (midiDeviceOutIndex == -1)
			{
				console.warn("trying to use prev midi out device:" + settings.MidiDeviceOut);
				$("#" + settingsEditor.midiSubCat.items.MidiDeviceOut.valueId).val(settings.MidiDeviceOut);
				SendToWebSocket("midiSetDeviceOut(" + settings.MidiDeviceOut + ")");
			}
			else
				$("#" + settingsEditor.midiSubCat.items.MidiDeviceOut.valueId).val(midiDeviceOutIndex);

			//console.log(midiDevicesIn);
			//console.log(midiDevicesOut);
		}
	}
	
	function getSubStringOf(string, startToken, endToken)
	{
		var beginIndex = string.indexOf(startToken);
		if (beginIndex == -1) return undefined;
		var endIndex = string.indexOf(endToken);
		if (endIndex == -1) return undefined;
		return string.substring(beginIndex+1, endIndex);
	}
    function SendToWebSocket(string)
    {
		if (wsClientBiDirData == undefined || wsClientBiDirDataConnected == false) return;
        wsClientBiDirData.send(string);
	}

    return {
        defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        
		StartWebSocketConnection:StartWebSocketBiDirData_Connection,
        SendToWebSocket:SendToWebSocket
	};
})();