/** Added in addition to original Node-Red source, for audio system visualization
 * this file is intended for the Control GUI objects
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

 RED.ControlGUI = (function() {
    /*var sendTargetTexts = ["Web Socket", "Web Serial API", "Web MIDI API"];
    var sendTargets = [0,1,2];

    var defSettings = {
        defaultSendTarget: 0,
    }
    var _settings = {
        defaultSendTarget: defSettings.defaultSendTarget,
    }
    var settings = {
        get defaultSendTarget() { return _settings.defaultSendTarget; },
		set defaultSendTarget(value) { _settings.defaultSendTarget = value;  RED.storage.update();},
    }
    var settingsCategory = { label:"Control GUI", expanded:false, bgColor:"#DDD", popupText: "Used as a Control interface for the project, the data can either be sent using:<br>Web Socket <-> midi bridge server<br>Web Serial API (under implementation)<br>Web MIDI API (future feature)"};

    var settingsEditor = {
        defaultSendTarget:         { label:"Default Send Target", type:"combobox", actionOnChange:true, options:sendTargets, optionTexts:sendTargetTexts},
    }*/

    function sendUiSliderValue(d)
	{
		if (d.lastSentValue != undefined)
		{
			if (d.lastSentValue === d.val) return;
		}
		d.lastSentValue = d.val;

        eval(d.sendCommand);
/*
		if (d.sendFormat != undefined && d.sendFormat.trim() != "")
		{
			var formatted = eval(d.sendFormat);
			RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
		}
		//else if (d.sendSpace == true) // TODO. and only for RoboRemo export
		//	RED.BiDirDataWebSocketBridge.SendToWebSocket(d.name + " " + d.val); // n.name is the labelID
		else
			RED.BiDirDataWebSocketBridge.SendToWebSocket(d.name + d.val); // n.name is the labelID
            */
	}
    function sendUiButton(pressed, d)
    {
        //if (pressed == true && d.pressAction != "") RED.BiDirDataWebSocketBridge.SendToWebSocket(d.pressAction);
        //else if (d.releaseAction != "") RED.BiDirDataWebSocketBridge.SendToWebSocket(d.releaseAction);
        d.pressed = pressed;
        eval(d.sendCommand);
    }
    function sendUiListBox(d)
    {
        eval(d.sendCommand);
        //var formatted = eval(d.sendCommand);
        //RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
    }

    function sendUiPiano(pressed, d) 
    {
        if (pressed == true) d.keyDown = 0x90;
        else d.keyDown = 0x80;
        eval(d.sendCommand);
        //var formatted = eval(d.sendCommand);
        //if (pressed == true) console.warn("ui_PianoMouseDown " + formatted  + " "+ d.keyIndex);
        //else console.warn("ui_PianoMouseUp " + formatted  + " "+ d.keyIndex);
        //RED.BiDirDataWebSocketBridge.SendToWebSocket(formatted);
    }

    return {
        /*defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,

        sendTargetTexts:sendTargetTexts,
        sendTargets:sendTargets,*/
        
        sendUiButton:sendUiButton,
		sendUiSliderValue:sendUiSliderValue,
        sendUiListBox:sendUiListBox,
        sendUiPiano:sendUiPiano,
	};
})();