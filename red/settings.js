/** Added in addition to original Node-Red source, for audio system visualization
 * this file is intended to work as an interface between Node-Red flow and Arduino
 * cppToJSON gets a seperate file to make it easier to find it.
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



RED.settings = (function() {

    function createTab()
	{
		var content = document.createElement("div");
		content.id = "tab-settings";
		content.style.paddingTop = "4px";
		content.style.paddingLeft = "4px";
		content.style.paddingRight = "4px";
		RED.sidebar.addTab("settings",content);
		var catContainerId = "";
		generateSettingsFromClasses(content.id);

		RED.sidebar.show("settings"); // development, allways show settings tab first

		RED.palette.settings.categoryHeaderTextSize = RED.palette.settings.categoryHeaderTextSize; // read/apply
	}
	function colorSelTest(value)
	{
		console.error("colorSelTest:"+value);
	}

	function setFromJSONobj(projectSettings_jsonObj)
    {
        var psettings = projectSettings_jsonObj;
        for (let i = 0; i < psettings.length; i++)
        {
            var csettings = psettings[i];
            var json_object = Object.getOwnPropertyNames(csettings)[0]; // there is only one item
            //console.log(json_object);
            //console.log(csettings[json_object]);
            
            //RED[json_object].settings = csettings[json_object];// this don't run setters 
            var settingValueNames = Object.getOwnPropertyNames(csettings[json_object]);
            //console.log("@testSettingLoad:");
            //console.log(settingValueNames);
            for (var svi = 0; svi < settingValueNames.length; svi++)
            {
                var valueName = settingValueNames[svi];
                if (RED[json_object].settings[valueName]) // this skip any removed settings
                {
                    RED[json_object].settings[valueName] = csettings[json_object][valueName];
                    //console.warn("typeof " + valueName + ":" + typeof csettings[json_object][valueName])
                }
            }
        }
	}
	function getAsJSONobj()
	{
		// get all settings that is defined
        var settings = [];
        var RED_Classes = Object.getOwnPropertyNames(RED);
        for (let rci = 0; rci < RED_Classes.length; rci++)
        {
            var RED_Class_Name = RED_Classes[rci];
            var RED_Class = RED[RED_Class_Name];
            var RED_Class_SubClasses = Object.getOwnPropertyNames(RED_Class);

            //RED.console_ok("@" + RED_Class_Name);
            //console.log(Object.getOwnPropertyNames(RED_Class));

            for (let i = 0; i < RED_Class_SubClasses.length; i++)
            {
                let RED_SubClass_Name = RED_Class_SubClasses[i];
                if (RED_SubClass_Name == "settings")
                {
                    settings.push({[RED_Class_Name]:RED_Class.settings});
                    //RED.console_ok("found settings@" + RED_Class_Name);
                }
                
            }
		}
		return settings;
	}

	function generateSettingsFromClasses(containerId)
	{
		var RED_Classes = Object.getOwnPropertyNames(RED);
		var catContainerId = "";
        for (let rci = 0; rci < RED_Classes.length; rci++)
        {
            var RED_Class_Name = RED_Classes[rci];
            var RED_Class = RED[RED_Class_Name];
            var RED_Class_SubClasses = Object.getOwnPropertyNames(RED_Class);

            //RED.console_ok("@" + RED_Class_Name);
            //console.log(Object.getOwnPropertyNames(RED_Class));

            for (let sci = 0; sci < RED_Class_SubClasses.length; sci++)
            {
                let RED_SubClass_Name = RED_Class_SubClasses[sci];
				if (RED_SubClass_Name != "settingsEditor")
					continue;
                
				CreateSettingsEditorCat(RED_Class, RED_Class_Name, containerId, RED_Class.settingsEditor, RED_Class.settingsCategory.Title, RED_Class.settingsCategory.Expanded, RED_Class.settingsCategory.popupText);
            }
        }
	}

	function CreateSettingsEditorCat(RED_Class, RED_Class_Name, containerId, settings, catTitle, catExpanded, popupText)
	{
		var catContainerId = createCategory(containerId, RED_Class_Name, catTitle, catExpanded, popupText);
		var settingNames = Object.getOwnPropertyNames(settings);
		for (let i = 0; i < settingNames.length; i++)
		{
			var settingName = settingNames[i];
			var setting = settings[settingName];

			if (setting.items != undefined)
			{
				CreateSettingsEditorCat(RED_Class, RED_Class_Name + "-" + settingName, catContainerId, setting.items, setting.label, setting.expanded, setting.popupText);
				continue;
			}

			if (RED_Class.settings[settingName] == undefined)
			{
				// this is a special case, when there are not any setting for this settingsEditor item
				// that means it can have a button only for special commands
				if (setting.type === "button" && setting.action != undefined)
				{
					if ((typeof setting.action) === "function")
					{
						if (setting.buttonClass != undefined)
							createButton(catContainerId, RED_Class_Name+"-"+settingName, setting.label, setting.buttonClass, setting.action, setting.popupText);
						else
							createButton(catContainerId, RED_Class_Name+"-"+settingName, setting.label, "btn-primary btn-sm", setting.action, setting.popupText);
					}
					else
						console.error("generateSettingsFromClasses, " + settingName + " have no action callback function");
				}
				else
					console.error("generateSettingsFromClasses, skipping:" + settingName + " because it don't have a setting");
				continue;
			}
			var typeOf = setting.type;

			if (typeOf === "boolean")
			{
				createCheckBox(catContainerId, RED_Class_Name+"-"+settingName, setting.label, RED_Class.settings, settingName, setting.popupText);
				setting.valueId = RED_Class_Name+"-"+settingName; // this allows for changing the value programmability
			}
			else if (typeOf === "number")
			{
				createTextInputWithApplyButton(catContainerId, RED_Class_Name+"-"+settingName, setting.label, RED_Class.settings, settingName, "40px", setting.popupText);
				setting.valueId = RED_Class_Name+"-"+settingName; // this allows for changing the value programmability
			}
			else if (typeOf === "multiline")
			{
				createMultiLineTextInputWithApplyButton(catContainerId, RED_Class_Name+"-"+settingName, setting.label, RED_Class.settings, settingName, "100%", setting.popupText);
			}
			else if (typeOf === "color")
			{
				createColorSel(catContainerId, RED_Class_Name+"-"+settingName, setting.label, RED_Class.settings, settingName, setting.popupText);
			}
			else if (typeOf === "string")
			{
				createTextInputWithApplyButton(catContainerId, RED_Class_Name+"-"+settingName, setting.label, RED_Class.settings, settingName, "100%", setting.popupText);
				setting.valueId = RED_Class_Name+"-"+settingName; // this allows for changing the value programmability
			}
			else if (typeOf === "combobox")
			{
				createComboBoxWithApplyButton(catContainerId, RED_Class_Name+"-"+settingName, setting.label, RED_Class.settings, settingName, "100%", setting.popupText, setting.options);
				setting.valueId = RED_Class_Name+"-"+settingName; // this allows for changing the value programmability
			}
			else
			{
				console.error("******************\ngenerateSettingsFromClasses unknown type of:" + settingName + " " + typeOf + "******************\n");
			}
		}
	}

	function createCategory(containerId, id, headerLabel, expanded, popupText)
	{
		if (expanded)
		{
			var chevron = '<i class="icon-chevron-down expanded"></i>';
			var displayStyle = "block";
		}
		else
		{
			var chevron = '<i class="icon-chevron-down"></i>';
			var displayStyle = "none";
		}
		var headerId = "set-header-" + id;
		var catContainerId = "set-content-"  + id;
		var html = '<div class="settings-category">'+ 
			'<div id="'+headerId+'" class="settings-header">'+chevron+'<span>'+headerLabel+'</span></div>'+
			'<div class="settings-content" id="'+catContainerId+'" style="display: '+displayStyle+';">'+
			'</div>\n'+
			'</div>\n'
		//RED.console_ok("create complete Button @ " + containerId + " = " + label + " : " + id);
		$("#"+containerId).append(html);
		$("#" + headerId).off('click').on('click', function(e) {
			
			var displayStyle = $(this).next().css('display');
			if (displayStyle == "block")
			{
				$(this).next().slideUp();
				$(this).children("i").removeClass("expanded"); // chevron
			}
			else
			{
				$(this).next().slideDown();
				$(this).children("i").addClass("expanded"); // chevron
			}
		});
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#" + headerId, popupText, "left");
		}
		return catContainerId;
	}

	/**
	 * creates and returns html code for a checkbox with label
	 * @param {string} id 
	 * @param {string} label 
	 */
	function createCheckBox(containerId, id, label, cb, param, popupText)
	{
		var html = "";
		html += '<div class="settings-item" id="divSetting-'+id+'">';

		html += '<div class="center">';
		html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'</label>';
		html +=	'</div>';

		html += '<div class="center">';
		html +=	'<input style="margin-bottom: 0px; margin-top: 0px;" type="checkbox" id="'+id+'" checked="checked" />';
		html +=	'</div>';

		html +=	'</div>';

		//RED.console_ok("create complete checkbox @ " + containerId + " = " + label + " : " + id);
		$("#" + containerId).append(html);
		if (typeof cb === "function")
		{
			$('#' + id).click(function() { cb($('#' + id).prop('checked')); });
			$('#' + id).prop('checked', param);
		}
		else if(typeof cb == "object")
		{
			$('#' + id).click(function() { cb[param] = $('#' + id).prop('checked'); });
			$('#' + id).prop('checked', cb[param]);
		}
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
		}
	}
	function createTextInputWithApplyButton(containerId, id, label, cb, param,textInputWidth, popupText)
	{
		
		var html = "";
		html += '<div class="settings-item" id="divSetting-'+id+'">';

		html += '<div class="center">';
		html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
		html += '</div>';

		html += '<div class="center">';
		html += '<input class="settings-item-textInput" type="text" id="'+id+'" name="'+id+'" style="width: '+textInputWidth+';"/>';
		if (textInputWidth.endsWith("%"))
		{
			html += '</div>';
			
			html += '<div class="settings-item-multiline-btn">';
		}
		html += '<button class="btn btn-success btn-sm settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
		html += '</div>';

		html += '</div>';

		//RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id + popupText);
		$("#" + containerId).append(html);
		if (typeof cb === "function")
		{
			$('#btn-' + id).click(function() { cb($('#' + id).val());});
			$('#' + id).val(param);
		}
		else if(typeof cb == "object")
		{
			$('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
			$('#' + id).val(cb[param]);
		}
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
		}
	}
	function createMultiLineTextInputWithApplyButton(containerId, id, label, cb, param,textInputWidth, popupText)
	{
		if (textInputWidth == undefined) textInputWidth = 40;
		var html = "";
		html += '<div class="settings-item" id="divSetting-'+id+'">';

		html += '<div class="center">';
		html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
		html += '</div>';

		html += '<div class="center">';
		html += '<textarea class="settings-item-multilinetextInput" type="text" id="'+id+'" name="'+id+'" rows="8" cols="50" style="width: '+textInputWidth+'px;"/>';
		html += '</div>';

		html += '<div class="settings-item-multiline-btn">';
		html += '<button class="btn btn-success btn-sm settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
		html += '</div>';

		html += '</div>';

		//RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id);
		$("#" + containerId).append(html);
		if (typeof cb === "function")
		{
			$('#btn-' + id).click(function() { cb($('#' + id).val());});
			$('#' + id).val(param);
		}
		else if(typeof cb == "object")
		{
			$('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
			$('#' + id).val(cb[param]);
		}
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
		}
	}
	function createComboBoxWithApplyButton(containerId, id, label, cb, param,textInputWidth, popupText, options)
	{
		if (textInputWidth == undefined) textInputWidth = 40;
		var html = ""
		html += '<div class="settings-item" id="divSetting-'+id+'">';

		html += '<div class="center" id="divSetting-'+id+'">';
		html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
		html += '</div>';
		
		html += '<div class="center">';
		html += '<select class="settings-item-combobox" type="text" id="'+id+'" name="'+id+'" style="width: '+textInputWidth+';">';
		if (options != undefined && Array.isArray(options))
		{
			for (var oi = 0; oi < options.length; oi++)
			{
				html += '<option value="' + options[oi] + '">' + options[oi] + '</option>'
			}
		}
		html += '</select>';
		html += '</div>';

		html += '<div class="settings-item-multiline-btn">';
		html += '<button class="btn btn-success settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
		html += '</div>';

		html += '</div>';
		

		//RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id);
		$("#" + containerId).append(html);
		if (typeof cb === "function")
		{
			$('#btn-' + id).click(function() { cb($('#' + id).val());});
			$('#' + id).val(param);
		}
		else if(typeof cb == "object")
		{
			$('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
			$('#' + id).val(cb[param]);
		}
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
		}
	}
	function createColorSel(containerId, id, label, cb, param, popupText)
	{
		var html = "";
		html += '<div class="settings-item" id="divSetting-'+id+'">';

		html += '<div class="center">';
		html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
		html += '</div>';

		html += '<div class="center">';
		html += '<input id="'+id+'" data-jscolor=""/>';
		html += '<button class="btn btn-success btn-sm settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
		html += '</div>';

		html += '</div>';

		//RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id);
		$("#" + containerId).append(html);
		if (typeof cb === "function")
		{
			$('#btn-' + id).click(function() { cb($('#' + id).val());});
			$('#' + id).val(param);
		}
		else if(typeof cb == "object")
		{
			$('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
			$('#' + id).val(cb[param]);
		}
		//<div class="form-row">
		//<label for="node-input-color"><i class="fa fa-tag"></i> Color</label>
		//<input id="node-input-color" data-jscolor="">
		//</div>
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
		}
	}
	function createButton(containerId, id, label, buttonClass, cb, popupText)
	{
		var html = "";
		html += '<div class="settings-item center" id="divSetting-'+id+'">';
		html += '<button class="btn '+buttonClass+'" type="button" id="btn-'+id+'">'+label+'</button>';
		html += '</div>';
		//RED.console_ok("create complete Button @ " + containerId + " = " + label + " : " + id);
		$("#" + containerId).append(html);
		$('#btn-' + id).click(cb);
		if (popupText != undefined)
		{
			RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
		}
	}

    return {
		createTab:createTab,
		getAsJSONobj:getAsJSONobj,
		setFromJSONobj:setFromJSONobj
	};
})();


	/* this following is now replaced by setting definer in devText.js
		catContainerId = createCategory(content.id, "development-tests", "Development Tests", false);
		createCheckBox(catContainerId, "setting-auto-switch-to-info-tab", "Auto switch to info-tab when selecting node(s).",RED.sidebar.info.settings, "autoSwitchTabToThis");
		
		createButton(catContainerId, "btn-dev-create-new-ws-structure", "print new ws struct", "btn-dark btn-sm", RED.devTest.createAndPrintNewWsStruct);
		createButton(catContainerId, "btn-dev-test", "console color test", "btn-primary btn-sm", function () {RED.devTest.console_logColor("Hello World"); RED.console_ok("Test of console_ok")});
		createButton(catContainerId, "btn-dev-test-get-help-server", "get help @server", "btn-dark btn-sm", RED.devTest.testGetHelpFromServer);
		createTextInputWithApplyButton(catContainerId, "btn-dev-test-get-func-help", "get func help", AceAutoComplete.getFromHelp, "AudioEffectFade", 150);
		// test creating subcat
		catContainerId = createCategory(catContainerId, "development-tests-sub", "Test post/get (sub-cat of dev-test)", true);
		createTextInputWithApplyButton(catContainerId, "setting-test-post", "test post", RED.arduino.httpPostAsync, "data", 150);
		createTextInputWithApplyButton(catContainerId, "setting-test-get", "test get", RED.arduino.httpGetAsync, "cmd", 150);
		createTextInputWithApplyButton(catContainerId, "setting-test-ws-send", "test ws send", RED.devTest.SendToWebSocket, "cmd", 150);
		//createColorSel(catContainerId, "setting-color-sel-test", "color:", colorSelTest, "#000000"); // dev test
		*/