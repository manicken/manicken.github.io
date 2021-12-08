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
RED.bottombar.info = (function() {
	
    var mText = "";
    var content = document.createElement("div");
    var message_listener = [];

	content.id = "tab-output";
	content.style.paddingTop = "0px";
	content.style.paddingLeft = "0px";
	content.style.paddingRight = "0px";

	RED.bottombar.addTab("output", content,false);
	//var hmtl = '<textarea readonly class="input-block-level" style="font-family: monospace; font-size: 12px; background:rgb(255, 255, 255); padding-left: 0.5em; cursor: text;" rows="50" id="messages">'+ mText+'</textarea>';
	var hmtl = '<div id="messages" class="input-block-level"'+ mText+'</textarea>';
	$("#tab-output").html(hmtl);
	//setContent("Welcome\n");

	function refresh() {
	    $("#messages").html(mText);
	    //$("#messages").css("height", $("#bottombar").height());

		var elem = document.getElementById('messages');
		  elem.scrollIntoView(false);
		  $('#messages').scrollTop($('#messages')[0].scrollHeight);
    }

	function setContent(txt) {
	    mText = txt;
	    refresh();
        RED.bottombar.show('output');
//	    $("#messages").html(txt);//'<div class="info-messages">' + txt + '</div>');
	}

	function addContent(txt) {
	    mText += txt;
	    refresh();
        RED.bottombar.show('output');
//        $("#messages").html($("#messages").html() + txt);//'<div class="info-messages">' + txt + '</div>');
	}
    function addLine(txt) {
        addContent(txt + "<br>");
    }

    $('#btn-clear-output').click(function () { setContent("") });

	function message_listener_error(jqXHR, textStatus, errorThrown)
    {
        console.log("ajax error : "+textStatus+" / "+errorThrown);
    }

	function addMessageListener(session_id)
	{
	    message_listener[session_id] = window.setInterval(function () {
	        RED.client.local_ajax_get_helper("get-cmd-out.php", function (res) {
	            if (res["len"]>0)
	                addContent(atob(res["text"]));
	        },100,'json',true,message_listener_error);
	    }, 200);
	}

	function removeMessageListener(session_id)
	{
	    if (message_listener[session_id])
	        window.clearInterval(message_listener[session_id]);
	}

	return {
		refresh:refresh,
		clear: function() {
		    $("#tab-output").html("");
		},
		setContent: setContent,
		addContent: addContent,
        addLine:addLine,
		addMessageListener: addMessageListener,
		removeMessageListener: removeMessageListener
    }
})();
