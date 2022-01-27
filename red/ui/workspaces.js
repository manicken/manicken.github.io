

RED.workspaces = (function() {

    var defSettings = {
        workspaceMinimumTabSize: 50,
        showWorkspaceToolbar: true,
        addToGroupAutosize: false,
        addNewAutoEdit:true,
        addNewLocation:2, // 0 = beginning, 1 = before current, 2 = after current, 3 = end
        defaultNewName:"Class_",
    }

    var _settings = {
        workspaceMinimumTabSize: defSettings.workspaceMinimumTabSize,
        showWorkspaceToolbar: defSettings.showWorkspaceToolbar,
        addToGroupAutosize: defSettings.addToGroupAutosize,
        addNewAutoEdit: defSettings.addNewAutoEdit,
        addNewLocation: defSettings.addNewLocation,
        defaultNewName: defSettings.defaultNewName,
    }

    var settings = {
        get workspaceMinimumTabSize() { return parseInt(_settings.workspaceMinimumTabSize); },
        set workspaceMinimumTabSize(value) { _settings.workspaceMinimumTabSize = parseInt(value); //console.warn("set workspaceMinimumTabSize" + value);
                                            RED.view.workspace_tabs.setMinimumTabWidth(_settings.workspaceMinimumTabSize);
                                            RED.storage.update(); },

        get showWorkspaceToolbar() { return _settings.showWorkspaceToolbar; },
        set showWorkspaceToolbar(state) { _settings.showWorkspaceToolbar = state; updateWorkspaceToolbarVisible(); RED.storage.update();},

        get addToGroupAutosize() { return _settings.addToGroupAutosize; },
        set addToGroupAutosize(state) { _settings.addToGroupAutosize = state; RED.storage.update(); },

        get addNewAutoEdit() { return _settings.addNewAutoEdit; },
        set addNewAutoEdit(state) { _settings.addNewAutoEdit = state; RED.storage.update(); },

        get addNewLocation() { return parseInt(_settings.addNewLocation); },
        set addNewLocation(state) { _settings.addNewLocation = parseInt(state); RED.storage.update(); },

        get defaultNewName() { return _settings.defaultNewName; },
        set defaultNewName(state) { _settings.defaultNewName = state; RED.storage.update(); },

    }
    var settingsCategory = { label:"Workspaces", expanded:false, bgColor:"#DDD" };

	var settingsEditor = {
        addNewAutoEdit:  { label:"Add New Auto Edit", type:"boolean", valueId:"", popupText: "Automatically shows the workspace/tab edit dialog when adding new tabs." },
        addNewLocation:  { label:"Add New Location", type:"combobox", actionOnChange:true, options:[0,1,2,3], optionTexts:["Beginning", "Before Current", "After Current", "End"], popupText: "Selects where the new tabs should be placed" },
        defaultNewName:  {label:"Default New Name", type:"string", popupText: "The default name that is used for new tabs."},
        workspaceMinimumTabSize:  { label:"Min Workspace Tab Size", type:"number", valueId:"", popupText: "set the minimum workspace tab size" },
        showWorkspaceToolbar:  {label:"Show toolbar.", type:"boolean"},
        addToGroupAutosize:  { label:"Add to group autosize", type:"boolean", valueId:"", popupText: "make the group autosize to fit while hovering with new items" },
    }

    function updateWorkspaceToolbarVisible()
	{
		if ( settings.showWorkspaceToolbar == true)
		{
			$("#workspace-toolbar").show();
			$("#chart").css("top", 70);
		}
		else
		{
			$("#workspace-toolbar").hide();
			$("#chart").css("top", 35);
		}
	}

    function enable(wsId)
    {
        var link = $("#workspace-tabs a[href='#"+wsId+"']");
        link.attr("style", "color:#000000;");
        var workspace = RED.nodes.getWorkspace(wsId);
        RED.events.emit("flows:change",workspace);
    }

    function disable(wsId)
    {
        var link = $("#workspace-tabs a[href='#"+wsId+"']");
        link.attr("style", "color:#b3b3b3;");
        var workspace = RED.nodes.getWorkspace(wsId);
        RED.events.emit("flows:change",workspace);
    }

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,

        enable:enable,
        disable:disable,
	};
})();