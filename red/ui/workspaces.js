

RED.workspaces = (function() {

    var defSettings = {
        workspaceMinimumTabSize: 50,
        addToGroupAutosize: false
    }

    var _settings = {
        workspaceMinimumTabSize: defSettings.workspaceMinimumTabSize,
        addToGroupAutosize: defSettings.addToGroupAutosize
    }

    var settings = {
        get workspaceMinimumTabSize() { return parseInt(_settings.workspaceMinimumTabSize); },
        set workspaceMinimumTabSize(value) { _settings.workspaceMinimumTabSize = parseInt(value); //console.warn("set workspaceMinimumTabSize" + value);
                                            RED.view.workspace_tabs.setMinimumTabWidth(_settings.workspaceMinimumTabSize);
                                            RED.storage.update(); },

        get addToGroupAutosize() { return parseInt( _settings.addToGroupAutosize); },
        set addToGroupAutosize(value) { _settings.addToGroupAutosize = parseInt(value); RED.storage.update(); },
    }
    var settingsCategory = { label:"Workspaces", expanded:false, bgColor:"#DDD" };

	var settingsEditor = {
        workspaceMinimumTabSize:  { label:"Min Workspace Tab Size", type:"number", valueId:"", popupText: "set the minimum workspace tab size" },
        addToGroupAutosize:  { label:"Add to group autosize", type:"boolean", valueId:"", popupText: "make the group autosize to fit while hovering with new items" },
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