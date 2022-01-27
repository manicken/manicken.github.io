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
    var urlcmds = [];

    var globalMenuItems = [{label:"Reset Settings",iconClass:"fa fa-refresh", func:resetCatSettings}];

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

		//RED.sidebar.show("settings"); // development, allways show settings tab first

		RED.palette.settings.categoryHeaderTextSize = RED.palette.settings.categoryHeaderTextSize; // read/apply

		//RED.sidebar.show("info");
	}
	function colorSelTest(value)
	{
		console.error("colorSelTest:"+value);
	}

	function setFromJSONobj(projectSettings_jsonObj) {
        if (Array.isArray(projectSettings_jsonObj) == true) {
            console.warn("reading old version of settings");
            setFromJSONobj_oldVersion(projectSettings_jsonObj);
        }
        else {
            setFromJSONobj_newVersion(projectSettings_jsonObj);
        }
    }
    function setFromJSONobj_oldVersion(projectSettings_jsonObj) {
        var psettings = projectSettings_jsonObj;
        for (let i = 0; i < psettings.length; i++)
        {
            var ClassSettings = psettings[i];
            var RED_Class_Name = Object.getOwnPropertyNames(ClassSettings)[0]; // there is only one item
            var RED_Class = RED[RED_Class_Name];
            var ClassSetting = ClassSettings[RED_Class_Name];
            if (RED_Class == undefined) continue; // skip whole removed Class
            restoreSettings(RED_Class.settings, RED_Class.defSettings, ClassSetting, RED_Class_Name)
        }
    }
    function setFromJSONobj_newVersion(ClassSettings) {
        var RED_Class_Names = Object.getOwnPropertyNames(ClassSettings);
        for (let i = 0; i < RED_Class_Names.length; i++)
        {
            var RED_Class_Name = RED_Class_Names[i];
            var RED_Class = RED[RED_Class_Name];
            var ClassSetting = ClassSettings[RED_Class_Name];
            if (RED_Class == undefined) continue; // skip whole removed Class

            restoreSettings(RED_Class.settings, RED_Class.defSettings, ClassSetting, RED_Class_Name)
        }
    }

    function restoreSettings(RED_Class_settings, RED_Class_defSettings, ClassSetting, RED_Class_Name)
    {
        if (RED_Class_settings == undefined) return; // skip whole removed Class

        RED.storage.dontSave = true; // prevent save while setting settings
        RED.view.preventRedraw = true;
        //console.log(typeof RED_Class);
        //console.log(RED_Class_Name, ClassSetting);
        var settingValueNames = Object.getOwnPropertyNames(ClassSetting);
        //console.log("@testSettingLoad:");
        //console.log(settingValueNames);
        for (var svi = 0; svi < settingValueNames.length; svi++)
        {
            var valueName = settingValueNames[svi];

            // console.warn(valueName);
            /*if (RED_Class_settings.hasOwnProperty(valueName) == false) {

             }*/
            if (/*RED_Class_settings.hasOwnProperty(valueName) && */RED_Class_settings[valueName] == undefined) {// this skip any removed settings
                console.error("setting removed typeof " + valueName + ":" + typeof ClassSetting[valueName] + ":" + typeof RED_Class_settings);
                continue;
            }
            
            if (typeof RED_Class_settings[valueName] === "object") {
                //console.warn(valueName, " is object");
                //var settingValueSubNames = Object.getOwnPropertyNames(RED_Class.settings[valueName]);
                restoreSettings(RED_Class_settings[valueName], RED_Class_defSettings, ClassSetting[valueName], valueName);

                RED.storage.dontSave = true; // continue prevent save while setting settings
                RED.view.preventRedraw = true;
                continue;
            }
            // this makes sure that any settings bugs are eliminated
            // to make it easier to recover from null value settings
            if (ClassSetting[valueName] == null) {
                ClassSetting[valueName] = RED_Class_defSettings[valueName];
                RED.notify(["setting @ ", RED_Class_Name, valueName, "was null, used default value:", RED_Class_defSettings[valueName]].join(" "), "warning", null, 4000);
            }
            RED_Class_settings[valueName] = ClassSetting[valueName];
            //console.warn("typeof " + valueName + ":" + typeof csetting[valueName])
        }
        RED.storage.dontSave = false; // prevent save while setting settings
        RED.view.preventRedraw = false;
    }
	function getAsJSONobj()
	{
		// get all settings that is defined
        var settings = {};
        var RED_Classes = Object.getOwnPropertyNames(RED);
        for (let rci = 0; rci < RED_Classes.length; rci++)
        {
            var RED_Class_Name = RED_Classes[rci];
            var RED_Class = RED[RED_Class_Name];

            if (RED_Class.settings == undefined) continue;

            // don't save is currently only used by the RED.view "class"
            if (RED_Class.settingsCategory != undefined && (RED_Class.settingsCategory.dontSave != undefined && RED_Class.settingsCategory.dontSave == true))
                continue;
                        
            // save in new format
            settings[RED_Class_Name] = getChangedSettings(RED_Class);
		}
		return settings;
    }
    
    function getChangedSettings(RED_Class)
    {
        var cs = {}; // changed settings
        var settingNames = Object.getOwnPropertyNames(RED_Class.settings);
        for (var i = 0; i < settingNames.length; i++)
        {
            //if (RED_Class.settings[name] == undefined || RED_Class.defSettings[name] == undefined)
            //    continue; // skip removed settings

            var name = settingNames[i];
            //console.warn("getChangedSettings: " + name + " " + typeof RED_Class.settings[name]);
            if (typeof RED_Class.settings[name] !== "object") { 
                var str1 = RED_Class.settings[name].toString();
                var str2 = RED_Class.defSettings[name].toString();
            } else { // this is used when a setting have subsettings
                var str1 = JSON.stringify(RED_Class.settings[name]);
                var str2 = JSON.stringify(RED_Class.defSettings[name]);
            }
            if (str1.localeCompare(str2) != 0)
                cs[name] = RED_Class.settings[name];
        }
        return cs;
    }
    $('#btn-reset-settings').click(function () {
        RED.main.verifyDialog("Confirm Settings Restore", "!!warning!!", "this will restore <b>ALL</b> settings to the default values.<br><br> Are you sure?", function(okPressed) { 
            if (okPressed)
            {
                resetAllSettings();
            }
        }, "Yes", "No");
    });
    function resetAllSettings()
	{
        var RED_Classes = Object.getOwnPropertyNames(RED);
        for (let rci = 0; rci < RED_Classes.length; rci++)
        {
            var RED_Class_Name = RED_Classes[rci];
            var RED_Class = RED[RED_Class_Name];

            if (RED_Class.settings == undefined) continue;
            resetClassSettings(RED_Class);
		}
    }
    function resetClassSettings(RED_Class)
    {
        if (RED_Class.settings == undefined) return; // have no settings

        RED.storage.dontSave = true; // prevent save while setting settings
        RED.view.preventRedraw = true;
        var settingNames = Object.getOwnPropertyNames(RED_Class.settings);
        
        for (var i = 0; i < settingNames.length; i++)
        {
            var name = settingNames[i];
            RED_Class.settings[name] = RED_Class.defSettings[name];
        }
        RED.storage.dontSave = false;
        RED.view.preventRedraw = false;
    }

    function resetCatSettings(e, RED_Class)
    {
        var headerLabel = $(e.currentTarget).parent().parent().parent().parent().find(".settings-header").text();
        RED.main.verifyDialog("Confirm Settings Restore", "!warning!", "this will restore the <b>"+ headerLabel + "</b> settings to the default values.<br><br> Are you sure?", function(okPressed) { 
            if (okPressed)
            {
                resetClassSettings(RED_Class);
                UpdateSettingsEditorCat(RED_Class, RED_Class.settingsEditor);
                if (RED_Class == RED.view) {
                    console.error("reset settings for RED.view");
                    RED.nodes.getCurrentWorkspace().settings = {};
                    RED.view.redraw();
                }
                //generateSettingsFromClasses("tab-settings"); // don't work
                RED.storage.update();
                console.error($(this) ,"headerMenuBtnResetId menu clicked");
            }
        }, "Yes", "No");
        
    }

    function UpdateSettingsEditorCat(RED_Class, settings)
	{
		var settingNames = Object.getOwnPropertyNames(settings);
		for (let i = 0; i < settingNames.length; i++)
		{
			var settingName = settingNames[i];
			var setting = settings[settingName];

			if (setting.items != undefined)
			{
				UpdateSettingsEditorCat(RED_Class, setting.items);
				continue;
			}
			var typeOf = setting.type;
            //console.warn("UpdateSettingsEditorCat @ " + setting.label + " " + RED_Class.settings[settingName] + " >>>" + setting.valueId + "<<<");
			if (typeOf === "boolean") {
				$("#" + setting.valueId).prop('checked', RED_Class.settings[settingName]);
            } else if (typeOf !== "button") { // buttons only don't have settings
                $("#" + setting.valueId).val(RED_Class.settings[settingName]);
            }
        }
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
                
				CreateSettingsEditorCat(RED_Class, RED_Class_Name, containerId, RED_Class.settingsEditor, RED_Class.settingsCategory, true);
            }
        }
	}

	function CreateSettingsEditorCat(RED_Class, RED_Class_Name, containerId, settings, settingCatParams, isRoot)
	{
		var catContainerId = RED.settings.editor.createCategory(RED_Class, containerId, RED_Class_Name, settingCatParams, isRoot);
		var settingNames = Object.getOwnPropertyNames(settings);
		for (let i = 0; i < settingNames.length; i++)
		{
			var settingName = settingNames[i];
			var setting = settings[settingName];

			if (setting.items != undefined)
			{
				CreateSettingsEditorCat(RED_Class, RED_Class_Name + "-" + settingName, catContainerId, setting.items, setting, false);
				continue;
            }
            
            if (settingName.includes('.') == true)
            {
                var nameSplit = settingName.split('.');
                var settingNamesSplit = Object.getOwnPropertyNames(RED_Class.settings[nameSplit[0]]);
                //console.warn(nameSplit[1],settingNamesSplit);

                createSetting(catContainerId, RED_Class_Name, RED_Class.settings[nameSplit[0]], nameSplit[1], setting);
            }
            else
            {
                createSetting(catContainerId, RED_Class_Name, RED_Class.settings, settingName, setting);
            }
		}
    }
    
    function createSetting(catContainerId, RED_Class_Name, RED_Class_settings, settingName, setting)
    {
        if (RED_Class_settings[settingName] == undefined)
        {
            // this is a special case, when there are not any setting for this settingsEditor item
            // that means it can have a button only for special commands
            if (setting.type === "button" && setting.action != undefined)
            {
                if ((typeof setting.action) === "function")
                {
                    if (setting.buttonClass != undefined)
                        RED.settings.editor.createButton(catContainerId, RED_Class_Name+"-"+settingName.replace('.', '_'), setting.label, setting.buttonClass, setting.action, setting.popupText, setting.isFileInput);
                    else
                        RED.settings.editor.createButton(catContainerId, RED_Class_Name+"-"+settingName.replace('.', '_'), setting.label, "btn-primary btn-sm", setting.action, setting.popupText, setting.isFileInput);
                    if (setting.urlCmd != undefined) {
                        urlcmds.push({name:setting.urlCmd, cb:setting.action});
                    }
                }
                else
                    console.warn("generateSettingsFromClasses, " + settingName + " have no action callback function");

                return;
            }
            else if (setting.action == undefined) {
                console.warn("generateSettingsFromClasses, skipping:" + settingName + " because it don't have a setting and don't have action defined");
                return;
            }
        }
        var typeOf = setting.type;
        var uid = RED_Class_Name+"-"+settingName.replace('.', '_');
        setting.valueId = uid;// this allows for changing the value programmability
        
        if (setting.action != undefined) {
            var cb  =setting.action;
            var param = setting.defValue;
        } else {
            var cb = RED_Class_settings;
            var param = settingName;
        }
        
        if (typeOf === "boolean")
            RED.settings.editor.createCheckBox(catContainerId, uid, setting.label, cb, param, setting.popupText);
        else if (typeOf === "number")
            RED.settings.editor.createTextInputWithApplyButton(catContainerId, uid, setting.label, cb, param, "40px", setting.popupText, setting.readOnly);
        else if (typeOf === "multiline")
            RED.settings.editor.createMultiLineTextInputWithApplyButton(catContainerId, uid, setting.label, cb, param, "100%", setting);
        else if (typeOf === "color")
            RED.settings.editor.createColorSel(catContainerId, uid, setting.label, cb, param, setting.popupText);
        else if (typeOf === "string")
            RED.settings.editor.createTextInputWithApplyButton(catContainerId, uid, setting.label, cb, param, "100%", setting.popupText, setting.readOnly);
        else if (typeOf === "combobox")
            RED.settings.editor.createComboBoxWithApplyButton(catContainerId, uid, setting.label, cb, param, "100%", setting);
        else
            console.error("******************\ngenerateSettingsFromClasses unknown type of:" + settingName + " " + typeOf + "******************\n");
    }

    return {
		createTab:createTab,
		getAsJSONobj:getAsJSONobj,
        setFromJSONobj:setFromJSONobj,
        getChangedSettings:getChangedSettings,
        resetClassSettings:resetClassSettings,
        resetCatSettings:resetCatSettings,
        restoreSettings:restoreSettings,
        resetAllSettings:resetAllSettings,
        UpdateSettingsEditorCat:UpdateSettingsEditorCat,
        urlcmds:urlcmds
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