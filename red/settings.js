<<<<<<< HEAD
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

		catContainerId = createCategory(content.id, "development-tests", "Development Tests", true);
		createCheckBox(catContainerId, "setting-auto-switch-to-info-tab", "Auto switch to info-tab when selecting node(s).",RED.sidebar.info.settings, "autoSwitchTabToThis");
		
		createButton(catContainerId, "btn-dev-create-new-ws-structure", "print new ws struct", "btn-dark btn-sm", RED.devTest.createAndPrintNewWsStruct);
		createButton(catContainerId, "btn-dev-test", "console color test", "btn-primary btn-sm", function () {RED.devTest.console_logColor("Hello World"); RED.console_ok("Test of console_ok")});
		// test creating subcat
		catContainerId = createCategory(catContainerId, "development-tests-sub", "Test post/get (sub-cat of dev-test)", true);
		createTextInputWithApplyButton(catContainerId, "setting-test-post", "test post", RED.arduino.httpPostAsync, "data");
		createTextInputWithApplyButton(catContainerId, "setting-test-get", "test get", RED.arduino.httpGetAsync, "cmd");

		RED.sidebar.show("settings"); // development, allways show settings tab first

		RED.palette.settings.categoryHeaderTextSize = RED.palette.settings.categoryHeaderTextSize; // read/apply
	}

	function setFromJSONobj(projectSettings_jsonObj)
    {
        var psettings = projectSettings_jsonObj;
        for (let i = 0; i < psettings.length; i++)
        {
            var csettings = psettings[i];
            var json_object = Object.getOwnPropertyNames(csettings)[0]; // there is only one item
            console.log(json_object);
            console.log(csettings[json_object]);
            
            //RED[json_object].settings = csettings[json_object];// this don't run setters 
            var settingValueNames = Object.getOwnPropertyNames(csettings[json_object]);
            console.log("@testSettingLoad:");
            console.log(settingValueNames);
            for (var svi = 0; svi < settingValueNames.length; svi++)
            {
                var valueName = settingValueNames[svi];
                if (RED[json_object].settings[valueName]) // this skip any removed settings
                {
                    RED[json_object].settings[valueName] = csettings[json_object][valueName];
                    console.warn("typeof " + valueName + ":" + typeof csettings[json_object][valueName])
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

            RED.console_ok("@" + RED_Class_Name);
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
                if (RED_SubClass_Name == "settings")
                {
					catContainerId = createCategory(containerId, RED_Class_Name, RED_Class.settingsCategoryTitle, true);
					var settingNames = Object.getOwnPropertyNames(RED_Class.settings);
					for (let i = 0; i < settingNames.length; i++)
					{
						var settingName = settingNames[i];
						var typeOf = typeof RED_Class.settings[settingName];
						if (typeOf === "boolean")
						{
							createCheckBox(catContainerId, RED_Class_Name+"-"+settingName, RED_Class.settingsEditorLabels[settingName], RED_Class.settings, settingName);
						}
						else if (typeOf === "number" || typeOf === "string")
						{
							createTextInputWithApplyButton(catContainerId, RED_Class_Name+"-"+settingName, RED_Class.settingsEditorLabels[settingName], RED_Class.settings, settingName);
						}
						else
							console.error("generateSettingsFromClasses unknown type:" + typeOf);
					}
                    //settings.push({[RED_Class_Name]:RED_Class.settings});
                    //RED.console_ok("found settings@" + RED_Class_Name);
                }
                
            }
        }
	}

	function createCategory(containerId, id, headerLabel, expanded)
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
		var html = '<div class="palette-category">'+ // use style from palette-category
			'<div id="'+headerId+'" class="palette-header">'+chevron+'<span>'+headerLabel+'</span></div>'+
			'<div class="palette-content" id="'+catContainerId+'" style="display: '+displayStyle+';">'+
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
		return catContainerId;
	}

	/**
	 * creates and returns html code for a checkbox with label
	 * @param {string} id 
	 * @param {string} label 
	 */
	function createCheckBox(containerId, id, label, cb, param)
	{
		var html = '<label for="'+id+'" style="font-size: 16px; padding: 2px 0px 0px 4px;">';
		html +=	'<input style="margin-bottom: 4px; margin-left: 4px;" type="checkbox" id="'+id+'" checked="checked" />';
		html +=	'&nbsp;'+label+'</label>';

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
	}
	function createTextInputWithApplyButton(containerId, id, label, cb, param)
	{
		var html = '<div class="center"><label  for="'+id+'" style="font-size: 16px;">';
			html += '&nbsp;'+label+' <input type="text" id="'+id+'" name="'+id+'" style="width: 40px;">';
			html += ' <button class="btn btn-success btn-sm" type="button" id="btn-'+id+'">Apply</button></label></div>';

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
	}
	function createButton(containerId, id, label, buttonClass, cb)
	{
		var html = '<button class="btn '+buttonClass+'" type="button" id="btn-'+id+'">'+label+'</button></label>';
		//RED.console_ok("create complete Button @ " + containerId + " = " + label + " : " + id);
		$("#" + containerId).append(html);
		$('#btn-' + id).click(cb);

	}
	
	

    return {
		createTab:createTab,
		getAsJSONobj:getAsJSONobj,
		setFromJSONobj:setFromJSONobj
	};
})();
=======
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
	/*	app.UseCors(builder => builder
					.AllowAnyOrigin()
					.AllowAnyMethod()
					.AllowAnyHeader());*/

		var content = document.createElement("div");
		content.id = "tab-settings";
		content.style.paddingTop = "4px";
		content.style.paddingLeft = "4px";
		content.style.paddingRight = "4px";
		RED.sidebar.addTab("settings",content);
        var html = "<h3>Settings</h3>";
        html += createCheckBox("setting-auto-switch-to-info-tab", "Auto switch to info-tab when selecting node(s).");
		html += createCheckBox("setting-show-workspace-toolbar", "Show Workspace toolbar.");
		html += createCheckBox("setting-show-palette-onlyOne", "Palette Show Only one category at a time.");
		html += createCheckBox("setting-show-workspace-v-grid", "Show Workspace v-grid.");
		html += createCheckBox("setting-show-workspace-h-grid", "Show Workspace h-grid.");
		html += createCheckBox("setting-snap-to-grid", "Snap to grid.");
		//html += createTextInputWithApplyButton("setting-grid-xSize", "Grid Size X");
		//html += createTextInputWithApplyButton("setting-grid-ySize", "Grid Size Y");
		html += createTextInputWithApplyButton("setting-test-post", "test post");
		html += createTextInputWithApplyButton("setting-test-get", "test get");

		//html += '<p><br><br>this is a placeholder for future settings:<br>accessible with:<br>$("#tab-settings").html("text");</p>';

		$("#tab-settings").html(html);
        functionalizeCheckBox("setting-auto-switch-to-info-tab", RED.sidebar.info.autoSwitchTabToThis, RED.sidebar.info.setAutoSwitchTab);
		functionalizeCheckBox("setting-show-workspace-toolbar", RED.view.showWorkspaceToolbar, RED.view.setShowWorkspaceToolbarVisible);
		functionalizeCheckBox("setting-show-palette-onlyOne", RED.palette.onlyShowOne, RED.palette.SetOnlyShowOne);
		functionalizeCheckBox("setting-show-workspace-v-grid", RED.view.showGridV, RED.view.showHideGridV);
		functionalizeCheckBox("setting-show-workspace-h-grid", RED.view.showGridH, RED.view.showHideGridH);
		functionalizeCheckBox("setting-snap-to-grid", RED.view.snapToGrid, RED.view.setSnapToGrid);
		//functionalizeTextInputWithApplyButton("setting-grid-xSize", 500, function(value) { console.error("new grid-xsize:" + value);});
		//functionalizeTextInputWithApplyButton("setting-grid-ySize", 500, function(value) { console.error("new grid-ysize:" + value);});
		functionalizeTextInputWithApplyButton("setting-test-post", "Hello", RED.arduino.httpPostAsync);
		functionalizeTextInputWithApplyButton("setting-test-get", "cmd", RED.arduino.httpGetAsync);

		RED.sidebar.show("settings"); // development, allways show settings tab first
	}
	
	/**
	 * creates and returns html code for a checkbox with label
	 * @param {string} id 
	 * @param {string} label 
	 */
	function createCheckBox(id, label)
	{
		var html = '<label for="'+id+'" style="font-size: 16px; padding: 2px 0px 0px 4px;">';
		html +=	'<input style="margin-bottom: 4px; margin-left: 4px;" type="checkbox" id="'+id+'" checked="checked" />';
		html +=	'&nbsp;'+label+'</label>';
		return html;
	}
	function createTextInputWithApplyButton(id, label)
	{
		var html = '<label for="'+id+'" style="font-size: 16px;">';
			html += '&nbsp;'+label+' <input type="text" id="'+id+'" name="'+id+'" style="width: 40px;">';
			html += ' <button type="button" id="btn-'+id+'">Apply</button></label>';
		return html;
	}
	function functionalizeTextInputWithApplyButton(id, text, func)
	{
		$('#btn-' + id).click(function() { func($('#' + id).val());});
		$('#' + id).val(text);
	}
	/**
	 * this must be run after the html is applied to the document
	 * @param {string} id 
	 * @param {boolean} initalState 
	 * @param {function} func 
	 */
	function functionalizeCheckBox(id, initalState, func)
	{
		$('#' + id).click(function() { func($('#' + id).prop('checked'));});
		$('#' + id).prop('checked', initalState);
    }
    
    return {
		createTab:createTab,
	};
})();
>>>>>>> 1d892075d1258e7e077ee0eaf10ba81e3c2834a4
