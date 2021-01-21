

RED.workspaces = (function() {

    var defSettings = {
        workspaceMinimumTabSize: 50,
    }

    var _settings = {
        workspaceMinimumTabSize: defSettings.workspaceMinimumTabSize,
    }

    var settings = {
        get workspaceMinimumTabSize() { return parseInt(_settings.workspaceMinimumTabSize); },
        set workspaceMinimumTabSize(value) { _settings.workspaceMinimumTabSize = parseInt(value); //console.warn("set workspaceMinimumTabSize" + value);
                                            RED.view.workspace_tabs.setMinimumTabWidth(_settings.workspaceMinimumTabSize);
                                            RED.storage.update(); },
    }
    var settingsCategory = { label:"Workspaces", expanded:false, bgColor:"#DDD" };

	var settingsEditor = {
        workspaceMinimumTabSize:  {label:"Min Workspace Tab Size", type:"number", valueId:"", popupText: "set the minimum workspace tab size"},
    }

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
	};
})();