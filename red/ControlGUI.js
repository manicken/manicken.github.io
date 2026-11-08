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


    function sendUiSliderValue(d)
	{
		if (d.lastSentValue != undefined)
		{
			if (d.lastSentValue === d.val) return;
		}
		d.lastSentValue = d.val;

        if (RED.control.gui.isBound(d)) { RED.control.gui.slider(d); return; } // bound to an audio object (red/control)
        eval(d.sendCommand);
	}
    function sendUiButton(pressed, d)
    {
        d.pressed = pressed;
        if (RED.control.gui.isBound(d)) { RED.control.gui.button(d, pressed); return; }
        eval(d.sendCommand);
    }
    function sendUiListBox(d)
    {
        if (RED.control.gui.isBound(d)) { RED.control.gui.listBox(d); return; }
        eval(d.sendCommand);
    }

    function sendUiPiano(d)
    {
        d.keyDown = d.pressed ? 0x90 : 0x80; // the MIDI status (note on/off on channel 1), used by older piano scripts
        eval(d.sendCommand);
    }

    return {
        
        sendUiButton:sendUiButton,
		sendUiSliderValue:sendUiSliderValue,
        sendUiListBox:sendUiListBox,
        sendUiPiano:sendUiPiano,

	};
})();