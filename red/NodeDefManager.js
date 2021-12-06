


RED.NodeDefManager = (function() {

    var tooltips = {
        addMenu:"add new group or node type",
        importMenu:"imports into the current selected node definition group",
        removeButton:"remove current selected group or node definition",
        exportButton:"exports all node definitions as a json file",
        importFromFile: "(not yet implemented)",
        importFromUrl: "",
        importRefresh:"updates the current addon from the url given (not yet implemented)",
        applyButton:"apply the changes of the selected item",
        importFromUrl_url: "the url to the library, <br>can either be .json .html or github path",
        importMode:""
    }

    var groupPropertyDefaults = {
        uid: "",
        label:"",
        description:"",
        credits:"",
        homepage:"",
        url:"https://api.github.com/repos/[user]/[repository]/contents/[subpath if any]"
    }
    var groupPropertyTooltips = {
        uid:"(mandatory)<br>this is the unique id used<br>it should not contain any spaces<br>or html specific characters<br>and it should not be any of the names<br>allready existing",
        label:"(mandatory)<br>the label shown in<br>the palette filter<br>drop down menu",
        description:"(optional)<br>a popup description<br>that is shown when hover over<br>item in palette filter<br>drop down menu<br><br>note. html tags can be used such as<br> &lt;br&gt; &lt;b&gt;&lt;/b&gt; and so on<br> to make the description easier to read.",
        credits:"(optional)<br>the author(s) that has contributed to this library",
        homepage:"(optional)<br>the main homepage of the main author",
        url:"(optional)<br>the url to the github repository (not yet used)<br> but should be used when updating the current node def. list<br>and in the future for automatic download of the used library files.<br><br>the form should be as follows:<br>" + groupPropertyDefaults.url
    }
    var newNodeTypeClassNameTooltip = "(mandatory) The type(classname) of the new item.<br><br>note. cannot include spaces or special characters when a template-type class is used the &gt; and &lt; should not be included in the name. <br><br>A template should be defined by using the property templateType=&gt;I,O&lt;"
    var newNodeTypeJSONTooltip = "(mandatory) The JSON structure for the node type."
    var newItemDialogOk_cb;

    var newItemUid = "";
    var newGroup = {
        isAddon: true,
        label:"",
        description:"",
        credits:"",
        homepage:"",
        url:"",
        types:newTypes()
    }
    var newNodeTypeTemplate = {
        defaults:{"name":{"type":"c_cpp_name"},comment:{}},
        shortName:"peak",
        inputs:1,
        outputs:0,
        inputTypes:{"0":"i16"},
        outputTypes:{},
        category:"unsorted",
        help:"",
        color:"#E6E0F8",
        icon:"arrow-in.png"
    }
    var newNodeTypeParsed = {};
    var newNodeTypeJSON = "";

    function newTypes()
    {
        return {};
    }

    
    var treeList;

    var defSettings = {
        aceEditorTheme: "theme-chrome",
    };
    var _settings = {
        aceEditorTheme: defSettings.aceEditorTheme,
    };
    var settings = {
        get aceEditorTheme() { return _settings.aceEditorTheme; },
		set aceEditorTheme(value) { _settings.aceEditorTheme = value;  RED.storage.update();},
    };
    var settingsCategory = { label:"Node Def Manager", expanded:true, bgColor:"#DDD" };

    var settingsEditor = {
        DownloadCurrentNodeDefs:    { label:"Download Current NodeDefs", type:"button", action: DownloadCurrentNodeDefs},
        aceEditorTheme:         { label:"Ace Theme (JSON editor)", type:"combobox", actionOnChange:true, valIsText:true, options:aceThemeList}, // aceThemeList is from ace-theme-list.js
    };
    $('#btn-node-def-manager').click(function(){showForm();});
    

    function DownloadCurrentNodeDefs() {
        var defCatNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        var audioObjectCount = 0;
        var totalCount = 0;
        for (var i = 0; i < defCatNames.length; i++) {
            var defCatName = defCatNames[i];
            var defCat = RED.nodes.node_defs[defCatName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            totalCount += defNames.length;
            for (var i2 = 0; i2 < defNames.length; i2++)
            if (defNames[i2].startsWith("Audio"))
                audioObjectCount++;
        }
        RED.main.download("NodeDefs.json","Total count: " + totalCount + "\nTotal Audio objects: " + audioObjectCount + "\n"+  JSON.stringify(RED.nodes.node_defs, null, 4) );
    }

    

    var form;
    var textArea;
    var leftPanel;
    var rightPanel;
    var currentSelectedItem;
    var removeButton;
    var applyButton;
    var importMenu;
    var addMenu;
    function showForm()
    {
        
        form = d3.select('#node-definitions-manager-dialog');

        form.html(""); // TODO: make use of data driven update

        leftPanel = form.append('div').attr('id', "nodeDefMgr-LeftPanel");
        rightPanel = form.append('div').attr('id', 'nodeDefMgr-RightPanel');
        //textArea = rightPanel.append('textarea').attr('type', 'text').attr('id','nodeDefEditor').attr('wrap', 'off').attr('style', 'width: 95%; height: 95%');

        textArea = rightPanel.append('pre').attr('id', 'aceEditor2').attr('style', "height: 400px;");
        
        var aceEditor = ace.edit("aceEditor2");
		var aceTheme = "ace/theme/" + settings.aceEditorTheme
        aceEditor.setTheme(aceTheme, function() { console.log("ace theme changed");});
        
        aceEditor.setOptions({
			enableBasicAutocompletion: true,
            enableSnippets: true,
            tabSize: RED.arduino.settings.CodeIndentations,
			enableLiveAutocompletion: true,
		});
        aceEditor.session.setMode("ace/mode/json", function() { console.log("ace mode changed to json");});
        setTextAreaText("");
        
        var leftPanelButtons = form.append('div').attr('id', "nodeDefMgr-LeftPanel-buttons");
        var rightPanelButtons = form.append('div').attr('id', "nodeDefMgr-RightPanel-buttons");

        
        
        addMenu = CreateMenu(leftPanelButtons, "add", tooltips.addMenu, [{label:'group', cb:addGroup}, {label:'node type', cb:addNodeType}]);
        importMenu = CreateMenu(leftPanelButtons, "import", tooltips.importMenu, [{label:'from url', tooltip:tooltips.importFromUrl, cb:importFromUrl},{label:'from file', tooltip:tooltips.importFromFile, cb:importFromFile}, {label:'refresh', tooltip:tooltips.importRefresh, cb:refreshFromUrl}]);
        removeButton = CreateButton(leftPanelButtons, "remove", tooltips.removeButton, removeItem);
        CreateButton(leftPanelButtons, "export", tooltips["exportButton"], DownloadCurrentNodeDefs);
        applyButton = CreateButton(rightPanelButtons, "apply",tooltips.applyButton, applyCurrent);
        
        BuildTree();        

        

        $( "#node-definitions-manager-dialog" ).dialog("open");

        SetEditableState(); // puts everything in a default state
    }

    function setTextAreaText(text) {
        ace.edit("aceEditor2").setValue(text);
		ace.edit("aceEditor2").session.selection.clearSelection();

        //$("#" + textArea.attr('id')).val(text);
    }
    function getTextAreaText() {
        return ace.edit("aceEditor2").getValue();
        //return $("#" + textArea.attr('id')).val();
    }

    function BuildTree()
    {
        leftPanel.html("");
        var nodeDefGroupTree = leftPanel.append('ul').attr('class', "nodeDefGroupTree");
        var defGroupNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var i = 0; i < defGroupNames.length; i++) {
            var defGroupName = defGroupNames[i];
            var nodeDefGroup = nodeDefGroupTree.append('li');
            var caret = nodeDefGroup.append('span').attr('class', 'caret2');

            nodeDefGroup.append('span').attr('class', 'nodeDefItem').text(defGroupName).on("click", NodeDefGroupMouse_Click);
            var nodeDefGroupItems = nodeDefGroup.append('ul').attr('class', 'nested2');
            
            caret.on('click', function() {
                this.parentElement.querySelector(".nested2").classList.toggle("active2");
                this.classList.toggle("caret2-down");
            });
            
            var defCat = RED.nodes.node_defs[defGroupName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            for (var i2 = 0; i2 < defNames.length; i2++) {
                nodeDefGroupItems.append('li').append('span').attr('class', 'nodeDefItem').attr('nodeDefGroupName', defGroupName).text(defNames[i2]).on("click", NodeDefMouse_Click);
            }
        }
    }

    function SetEditableState(nodeDefGroupName) {
        if (nodeDefGroupName != undefined && RED.nodes.node_defs[nodeDefGroupName].isAddon != undefined && RED.nodes.node_defs[nodeDefGroupName].isAddon == true)
        {
            applyButton.classed("disabled",false);
            removeButton.classed("disabled",false);
            addMenu.items[1].classed("disabled",false);
        }
        else
        {
            applyButton.classed("disabled",true);
            removeButton.classed("disabled",true);
            addMenu.items[1].classed("disabled",true);
        }
    }

    function NodeDefGroupMouse_Click() {
        DeselectNodeDefs();
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var nodeDefGroupName = item.text();
        //rightPanel.html("");
        //EditDefGroup(nodeDefGroupName);
        var editable = GetEditableDefGroup(nodeDefGroupName);
        
        setTextAreaText(JSON.stringify(editable,null,4));
        
        SetEditableState(nodeDefGroupName);
        currentSelectedItem = {groupName:nodeDefGroupName};
        console.log(currentSelectedItem);
    }

    function NodeDefMouse_Click() {
        DeselectNodeDefs();
        //rightPanel.html("");
        
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var nodeDefName = item.text();
        var nodeDefGroupName = item.attr("nodeDefGroupName");
        setTextAreaText(JSON.stringify(RED.nodes.node_defs[nodeDefGroupName].types[nodeDefName],null,4));
        
        SetEditableState(nodeDefGroupName);
        currentSelectedItem = {groupName:nodeDefGroupName, name:nodeDefName };
        console.log(currentSelectedItem);
    }

    function applyCurrent() {
        if ( d3.select(this).classed("disabled") == true) return;
        if (verifyCurrentEdit() == false) return;
        var text = getTextAreaText();
        var obj = JSON.parse(text);
        if (currentSelectedItem.name != undefined) { // Node Type Selected
            RED.nodes.registerType(currentSelectedItem.name, obj, currentSelectedItem.groupName);
            RED.notify("apply current " + currentSelectedItem.name + " @ " + currentSelectedItem.groupName + " OK", "info", null, 2000);
        } else { // node def. group selected

            var pnames = Object.getOwnPropertyNames(obj);
            var node_def_group = RED.nodes.node_defs[currentSelectedItem.groupName];
            for (var i = 0; i < pnames.length; i++) {
                var pname = pnames[i];
                node_def_group[pname] = obj[pname];
            }
            RED.notify("apply current " + currentSelectedItem.groupName + " OK", "info", null, 2000);
        }
        RED.storage.update();
    }
    function verifyCurrentEdit() {
        var id = textArea.attr('id');
        var text = getTextAreaText();
        try {
            JSON.parse(text);
            $("#"+id).removeClass("input-error");
            return true;
        } catch (ex) {
            RED.notify(ex, "warn", null, 4000);
            $("#"+id).addClass("input-error");
            return false;
        }
        //console.log(id, text);
    }
    function verifyNewNodeDefJson() {
        var id = "aceEditor3";
        var text = ace.edit("aceEditor3").getValue();
        try {
            JSON.parse(text);
            $("#"+id).removeClass("input-error");
            return true;
        } catch (ex) {
            RED.notify(ex, "warn", null, 4000);
            $("#"+id).addClass("input-error");
            return false;
        }
        //console.log(id, text);
    }

    function addGroup() {
        newItemUid = "";
        var newItemForm = d3.select('#node-def-manager-new-item-dialog');
        SetNewGroupFormContents(newItemForm);
        $( "#node-def-manager-new-item-dialog" ).dialog("option", "title", "Add New Group");
        $( "#node-def-manager-new-item-dialog" ).dialog("open");
        //RED.notify("add group clicked (not yet implemented)", "info", null, 2000);
        newItemDialogOk_cb = function() {
            if (VerifyGroupUid(newItemUid)) {
                RED.notify("new group added " + newItemUid, "info", null, 2000);
                RED.nodes.node_defs[newItemUid] = newGroup;
                RED.storage.update();
                BuildTree();
                return true; // this makes the form close
            }
            return false;
        };
    }
    function addNodeType() {
        newItemUid = "";
        if ( d3.select(this).classed("disabled") == true) return;
        var newItemForm = d3.select('#node-def-manager-new-item-dialog');
        SetNewNodeTypeFormContents(newItemForm);
        $( "#node-def-manager-new-item-dialog" ).dialog("option", "title", "Add New Node Type");
        $( "#node-def-manager-new-item-dialog" ).dialog("open");
        //RED.notify("add node type clicked (not yet implemented)", "info", null, 2000);

        newItemDialogOk_cb = function() {
            if (VerifyNodeType(newItemUid) && VerifyNodeTypeJSON(newNodeTypeJSON)) {
                var groupName = currentSelectedItem.groupName;
                RED.notify("new node type added " + newItemUid + " @ " + groupName, "info", null, 2000);

                RED.nodes.registerType(newItemUid, newNodeTypeParsed, groupName);
                //RED.nodes.node_defs[groupName].types[newItemUid] = newNodeTypeParsed;
                RED.storage.update();
                BuildTree();
                return true; // this makes the form close
            }
            return false;
        };
    }
    function importFromFile() {
        RED.notify("import from file clicked (not yet implemented)", "info", null, 2000);
    }
    function importFromUrl() {
        var importFromUrlForm = d3.select('#node-def-manager-new-item-dialog');
        SetImportUrlFormContents(importFromUrlForm);
        $( "#node-def-manager-new-item-dialog" ).dialog("option", "title", "Import node types from URL");
        $( "#node-def-manager-new-item-dialog" ).dialog("option", "width", "600");
        $( "#node-def-manager-new-item-dialog" ).dialog("open");
        RED.notify("import from url clicked", "info", null, 2000);
    }
    function refreshFromUrl() {
        RED.notify("refresh from current url clicked (not yet implemented)", "info", null, 2000);
    }
    function removeItem() {
        if ( d3.select(this).classed("disabled") == true) return;
        var objStr = "";
        if (currentSelectedItem.name != undefined) {
            objStr = "Node Type " + currentSelectedItem.name + " @ " + currentSelectedItem.groupName;
        }
        else {
            objStr = "Group " + currentSelectedItem.groupName;
        }
        RED.main.verifyDialog("verify delete", "Are you sure to remove?", objStr, function(okPressed) {
            if (okPressed == true)
            {
                if (currentSelectedItem.name != undefined) {
                    delete RED.nodes.node_defs[currentSelectedItem.groupName].types[currentSelectedItem.name];
                }
                else {
                    delete RED.nodes.node_defs[currentSelectedItem.groupName];
                }
                RED.storage.update();
                BuildTree();
            }
        }, "Yes", "No");
        //RED.notify("remove item clicked (not yet implemented)", "info", null, 2000);
    }

    function DeselectNodeDefs()
    {
        form.selectAll('.nodeDefItem').classed('nodeDefItemSelected', false);
    }
    var downloadUrl = "";
    var importUrlParamsDiv;
    var downloadMode = "";
    var importReplaceExisting = true;
    var downloadButton;
    function SetImportUrlFormContents(form) {
        downloadUrl = "";
        downloadMode = "";
        importReplaceExisting = true;
        form.html("");
        DisableNewItemOk();
        
        CreateInputBoxWithLabel(form, "URL", "url", "", "string", tooltips.importFromUrl_url, function(value) {
            
            if (value.endsWith('.json') == true) {
                $("#node-def-mgr-import-url-info").text("is json file url (not implemented)");
                $("#node-def-mgr-import-download-url").text(value);
                downloadUrl = value;
                downloadMode = "json";
                Set_d3_Button_Enabled(downloadButton, false);
            } else if (value.endsWith('.html') == true) {
                if (value.startsWith("https://github.com"))
                    {
                        var githubUrl = GetAsGithubRawUrl(value);
                        value = githubUrl.url;
                        $("#input-ndmgr-uid").val(githubUrl.uid);
                    }
                $("#node-def-mgr-import-url-info").text("is html file url");
                $("#node-def-mgr-import-download-url").text(value);
                downloadUrl = value;
                downloadMode = "html";
                Set_d3_Button_Enabled(downloadButton, true);
                
            } else if (value.startsWith("https://github.com") == true) {
                var apiUrl = GetAsGithubApiUrl(value);
                downloadUrl = apiUrl.url;
                $("#node-def-mgr-import-url-info").text("is github url");
                $("#node-def-mgr-import-download-url").text(apiUrl.url);
                $("#input-ndmgr-uid").val(apiUrl.uid);
                downloadMode = "githubapi";
                Set_d3_Button_Enabled(downloadButton, true);
            } else if (value.startsWith("https://api.github.com") == true) {
                $("#node-def-mgr-import-url-info").text("is github api url");
                $("#node-def-mgr-import-download-url").text(value);
                $("#input-ndmgr-uid").val(GetUidFromGithubApiUrl(value));
                downloadUrl = value;
                downloadMode = "githubapi";
                Set_d3_Button_Enabled(downloadButton, true);
            }
            else {
                $("#node-def-mgr-import-url-info").text("unknown format");
                Set_d3_Button_Enabled(downloadButton, false);
            }
            //console.warn(value);
        }, 'on');
        CreateLabel(form, "node-def-mgr-import-url-info", "100px");
        

        
        
        CreateLabel(form, "node-def-mgr-import-download-url");
        downloadButton = CreateButton(form, "Download", "Downloads the contents given by url", function() {
            if (downloadMode == "json") {

            } else if (downloadMode == "html") {

                RED.main.httpDownloadAsync(downloadUrl, 
                    function(data) {
                        
                        RED.NodeDefGenerator.parseHtml(data, $("#input-ndmgr-uid").val(), downloadUrl);
                        var nodeAddonGroups = RED.NodeDefGenerator.nodeAddonGroups();
                        if (nodeAddonGroups == undefined) {
                            $("#node-def-mgr-import-download-result").text("new node Addons (old structure) count:" + RED.NodeDefGenerator.nodeAddonsCount());
                            show_import_UIDstuff();
                            
                        }
                        else {
                            $("#node-def-mgr-import-download-result").text("new node Addons (new structure) count:" + RED.NodeDefGenerator.nodeAddonsCount());
                            //hide_import_UIDstuff();
                            
                        }
                        newItemDialogOk_cb = function() {
                            // here the html need to be saved to the indexexDB as well
                            // to make the help part usable
                            RED.IndexedDBfiles.fileWrite("otherFiles", "help_" + downloadUrl, data, function (dir, name) {console.log("file write ok");});
                            
                            var nodeAddonGroups = RED.NodeDefGenerator.nodeAddonGroups();
                            if (nodeAddonGroups == undefined) {
                                nodeAddonGroups = {};
                                var uid = $("#input-ndmgr-uid").val();
                                nodeAddonGroups[uid] = RED.NodeDefGenerator.nodeAddons();
                                //RED.nodes.registerTypes(RED.NodeDefGenerator.nodeAddons(), $("#input-ndmgr-uid").val(), !importReplaceExisting); // old style
                            }
                            RED.nodes.registerGroups(nodeAddonGroups);
                            
                            RED.storage.update();
                            BuildTree();
                            return true;
                        };
                        EnableNewItemOk();

                    }, 
                    function(err) {
                        RED.notify("could not download help addon" + err, "info", null, 3000);
                    }
                );

            } else if (downloadMode == "githubapi") {
                RED.NodeDefGenerator.GithubNodeAddonsParser(downloadUrl, function() {

                    $("#node-def-mgr-import-download-result").text("new node Addons count:" + Object.getOwnPropertyNames(RED.NodeDefGenerator.nodeAddons().types).length);
                    
                    newItemDialogOk_cb = function() {
                        
                        RED.nodes.registerTypes(RED.NodeDefGenerator.nodeAddons(), newItemUid, !importReplaceExisting);
                        RED.storage.update();
                        BuildTree();
                        RED.main.download(newItemUid + "_NodeAddons.json", JSON.stringify(RED.NodeDefGenerator.nodeAddons(), null, 4));
                        return true;
                    };
                    EnableNewItemOk();
                    return true;
                }, function() { RED.main.abortDownloadAsyncFiles();});
            }
        });
        Set_d3_Button_Enabled(downloadButton, false);
        CreateLabel(form, "node-def-mgr-import-download-result");

        importUrlParamsDiv = form.append('div');
        var modeItems = [{label:"Create New Group", value:"new"}, {label:"Import into existing group", value:"import"}];
        CreateComboboxWithLabel(form, "node-def-mgr-import-url-mode", "Mode",modeItems, tooltips.importMode, function(value) { 
            if (value == "new") {
                init_ImportFromUrlNewGroup();
            }
            else if (value == "import") {
                init_ImportFromUrlExistingGroup();
            }
        });
        init_ImportFromUrlNewGroup(); // default
        hide_import_UIDstuff();
    }
    function hide_import_UIDstuff()
    {
        $("#node-def-mgr-import-url-mode-row").addClass("hidden");
        $("#node-def-mgr-import-url-mode-existing-row").addClass("hidden");
        $("#input-ndmgr-uid-row").addClass("hidden");
    }
    function show_import_UIDstuff()
    {
        $("#node-def-mgr-import-url-mode-row").removeClass("hidden");
        $("#node-def-mgr-import-url-mode-existing-row").removeClass("hidden");
        $("#input-ndmgr-uid-row").removeClass("hidden");
    }

    function init_ImportFromUrlNewGroup() {
        importUrlParamsDiv.html("");
        CreateInputBoxWithLabel(importUrlParamsDiv, "UID", "uid", GetUidFromGithubApiUrl(downloadUrl), "string", groupPropertyTooltips.uid, function(value) {
            VerifyGroupUid(value);
            newItemUid = value;
        });
        newItemUid = GetUidFromGithubApiUrl(downloadUrl);
        importReplaceExisting = true;
    }
    function init_ImportFromUrlExistingGroup() {
        importUrlParamsDiv.html("");
        var groupNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        var groupItems = [];
        for (var gi = 0; gi < groupNames.length; gi++) {
            var defGrp = RED.nodes.node_defs[groupNames[gi]];
            if (defGrp.isAddon == undefined || defGrp.isAddon == "false") continue;
            groupItems.push(groupNames[gi]);
        }
        if (groupItems.length != 0) {
            newItemUid = groupItems[0];
        }
        else {
            newItemUid = undefined;
            DisableNewItemOk();
        }
        CreateComboboxWithLabel(importUrlParamsDiv, "node-def-mgr-import-url-mode-existing", "Node Def. Group" , groupItems, "", function(value) {
            newItemUid = value;
        });
        CreateInputBoxWithLabel(importUrlParamsDiv, "Replace", 'replace', false, 'bool', "If any existing objects with the same type should be replaced", function (value) {
            console.warn(value);
            importReplaceExisting = value;
        });
    }
    function GetAsGithubApiUrl(url) {
        var split = url.split("/");
        var uidDir = JoinFrom(split, 7, "_");
        if (uidDir.length != 0) uidDir = "_" + uidDir;
        return {
            url:"https://api.github.com/repos/" + split[3] + "/" + split[4] + "/contents/" + JoinFrom(split, 7, "/"), 
            uid:split[3] + "_" + split[4] + uidDir
        };
    }
    function GetAsGithubRawUrl(url) {
        var split = url.split("/");
        var uidDir = JoinFrom(split, 6, "_").replace('.','_');
        if (uidDir.length != 0) uidDir = "_" + uidDir;
        return {
            url:"https://raw.githubusercontent.com/" + split[3] + "/" + split[4] + "/" + JoinFrom(split, 6, "/"), 
            uid:split[3] + "_" + split[4] + uidDir,
            fileName:split[split.length-1]
        };
    }
    function GetUidFromGithubApiUrl(url) {
        var split = url.split("/");
        var uidDir = JoinFrom(split, 7, "_");
        if (uidDir.length != 0) uidDir = "_" + uidDir;
        return split[4] + "_" + split[5] + uidDir;
    }

    function JoinFrom(array, startIndex, seperator) {
        var str = "";
        for (var i = startIndex; i < array.length; i++) {
            str += array[i];
            if (i < (array.length - 1)) str += seperator;
        }
        return str;
    }

    function GetEditableDefGroup(nodeDefGroupName) {
        var nodeDefGroup = RED.nodes.node_defs[nodeDefGroupName];
        var propertyNames = Object.getOwnPropertyNames(nodeDefGroup);
        //console.warn(nodeDefGroup, propertyNames);
        var editable = {};
        for (var i = 0; i < propertyNames.length; i++) {
            var pname = propertyNames[i];
            if (pname == "types" || pname == "isAddon") continue; // skip this

            editable[pname] = nodeDefGroup[pname];
        }
        return editable;
    }

    function SetNewGroupFormContents(form) {
        form.html("");
        CreateInputBoxWithLabel(form, "UID", "uid", groupPropertyDefaults.uid, "string", groupPropertyTooltips.uid, function(value) { VerifyGroupUid(value); newItemUid = value; })
        var names = Object.getOwnPropertyNames(newGroup);
        for (var i = 0; i < names.length; i++) {
            var n = names[i];
            if (n == "isAddon" || n == "types") continue;
            newGroup[n] = groupPropertyDefaults[n];
            CreateInputBoxWithLabel(form, n, n, groupPropertyDefaults[n], "string", groupPropertyTooltips[n], function(value, propertyName) { newGroup[propertyName] = value; });
        }
    }
    function VerifyGroupUid(uid) {
        var valid = true;
        if (uid.length == 0) {
            RED.notify("Group UID cannot be empty", "warning", null, 4000);
            valid = false;
        }
        if (uid.includes(' ') == true) {
            RED.notify("Group UID cannot include spaces", "warning", null, 4000);
            valid = false;
        }
        var names = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var i = 0; i < names.length; i++) {
            if (names[i] == uid) {
                RED.notify("Group UID " + uid + " is allready used", "warning", null, 4000);
                valid = false;
            }
        }
        if (valid == true) {
            EnableNewItemOk();
            $("#input-ndmgr-uid").removeClass("input-error");
            return true;
        }
        else {
            DisableNewItemOk();
            $("#input-ndmgr-uid").addClass("input-error");
            return false;
        }
    }
    function DisableNewItemOk() {
        document.getElementById("btn-new-item-dialog-ok").disabled = true;
        $("#btn-new-item-dialog-ok").addClass("unclickablebutton");
    }
    function EnableNewItemOk(d3Object) {
        document.getElementById("btn-new-item-dialog-ok").disabled = false;
        $("#btn-new-item-dialog-ok").removeClass("unclickablebutton");
    }

    function Set_d3_Button_Enabled(btn, state) {
        if (state == true)
            btn.attr("disabled", undefined);
        else
            btn.attr("disabled", 'true');
        btn.classed("unclickablebutton", !state);
    }
    

    function SetNewNodeTypeFormContents(form) {
        form.html("");
        newNodeTypeJSON = JSON.stringify(newNodeTypeTemplate, null, 4);
        CreateInputBoxWithLabel(form, "Type", "type", "", "string", newNodeTypeClassNameTooltip, function(value) { VerifyNodeType(value); newItemUid = value; } );
        CreateAceEditor(form, "newTypeAceEditor", newNodeTypeJSON, settings.aceEditorTheme, "json", function(value, id) {
            console.warn(value);
            VerifyNodeTypeJSON(value,id);
            newNodeTypeJSON = value;
        });
    }

    function VerifyNodeTypeJSON(jsonString,id) {
        try {
            var parsedJSON = JSON.parse(jsonString);
            newNodeTypeParsed = parsedJSON;
            $("#" + id).removeClass("input-error");
            EnableNewItemOk();
            return true;
        }
        catch (ex) {
            RED.notify(ex, "warn", null, 10000);
            $("#"+id).addClass("input-error");
            DisableNewItemOk();
            return false;
        }
    }

    function VerifyNodeType(type) {
        var valid = true;
        if (type.length == 0) {
            RED.notify("Node type cannot be empty", "warning", null, 4000);
            valid = false;
        }
        if (type.includes(' ') == true) {
            RED.notify("Node type cannot include spaces", "warning", null, 4000);
            valid = false;
        }
        var groupNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var gi = 0; gi < groupNames.length && valid == true; gi++) {
            var groupName = groupNames[gi];
            var typeNames = Object.getOwnPropertyNames(RED.nodes.node_defs[groupName].types);
            for (var ti = 0; ti < typeNames.length; ti++) {
                if (typeNames[ti] == type) {
                    RED.notify("Node Type "+type + " is allready defined @ " + groupName, "warning", null, 4000);
                    valid = false;
                    break;
                }
            }
        }
        if (valid == true) {
            EnableNewItemOk();
            $("#input-ndmgr-type").removeClass("input-error");
            return true;
        }
        else {
            DisableNewItemOk();
            $("#input-ndmgr-type").addClass("input-error");
            return false;
        }
    }

    $("#node-definitions-manager-dialog form" ).submit(function(e) { e.preventDefault();});
	$( "#node-definitions-manager-dialog" ).dialog({
		modal: true, autoOpen: false,
		width: 800, height:600,
		title: "Node Definitions Manager",
		buttons: [
			{
				text: "Close",
				click: function() {	$( this ).dialog( "close" ); }
			}
		],
        resize: function(e,ui) {
            resizeAceJsonEditor("aceEditor2", this, 40);
        },
		open: function(e) { RED.keyboard.disable(); resizeAceJsonEditor("aceEditor2", this, 40);},
		close: function(e) { RED.keyboard.enable();	}
	});
    $("#node-def-manager-new-item-dialog form" ).submit(function(e) { e.preventDefault();});
	$( "#node-def-manager-new-item-dialog" ).dialog({
		modal: true, autoOpen: false,// if modal set to true then its parent is gonna be disabled
		width: 500, height:520,
		title: "New item",
		buttons: [
            {
                id: "btn-new-item-dialog-ok",
				text: "Ok",
				click: function() {
                    if (newItemDialogOk_cb != undefined) {
                        if (newItemDialogOk_cb()) {
                            newItemDialogOk_cb = undefined;
                            $( this ).dialog( "close" );
                        }
                            
                    }
                    else
                        $( this ).dialog( "close" );
                }
			},
			{
				text: "Cancel",
				click: function() {	$( this ).dialog( "close" ); }
			}
		],
        resize: function(e,ui) {
            resizeAceJsonEditor("newTypeAceEditor", this, 50);
        },
		open: function(e) { RED.keyboard.disable();	 resizeAceJsonEditor("newTypeAceEditor", this, 50);},
		close: function(e) { RED.keyboard.enable(); }
	});

    function resizeAceJsonEditor(aceEditId, thisRef, heightAdj)
    {
        var aceEditorExist = document.getElementById(aceEditId);
        if (aceEditorExist != null)
        {
            $("#"+aceEditId).height($(thisRef).height() - heightAdj );
            var aceEditor = ace.edit(aceEditId);
            aceEditor.resize(true);
            $(thisRef).scrollTop(aceEditor.scrollHeight);
        }
    }
    
    function CreateMenu(container, label, tooltip, items) {
        var menuGroup = container.append('div').attr('class','btn-group');
        
        
        var dropDown = menuGroup.append('a').attr('class', 'btn dropdown-toggle').attr('data-toggle','dropdown').text(label + " ");
        dropDown.append('span').attr('class','caret');

        RED.main.SetPopOver(dropDown[0], tooltip, "top");

        var menu = menuGroup.append('ul').attr('class','dropdown-menu');
        var menuItems = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var menuItemLine = menu.append('li');
            
            var menuItem = menuItemLine.append('a').text(item.label);
            menuItemLine.on('click', item.cb);

            if (item.tooltip != undefined)
                RED.main.SetPopOver(menuItemLine[0], item.tooltip, "right");
            menuItems.push(menuItemLine);
        }
        return {menu:menu, dropDown:dropDown, group:menuGroup, items:menuItems};
    }
    function CreateButton(container, label, tooltip, cb) {
        var btn = container.append('div').attr('class','btn-group').append('a').attr('class', 'btn').text(label + " ").on('click', cb);
        RED.main.SetPopOver(btn[0], tooltip, "top");
        return btn;
    }
    function CreateLabel(container, id, leftPos) {
        var lbl = container.append('div').attr('class','form-row').append('a').attr("id", id).html("&nbsp;");
        if (leftPos != undefined) lbl.attr('style', "position:relative; left:" + leftPos +";");
        return lbl;
    }
    
    function CreateComboboxWithLabel(container, id, label, items, tooltip, cb) {
        var group = container.append('div').attr('class','form-row').attr('id', id + '-row');
        var labelItem = group.append('label').attr('for', id);
        labelItem.append('i').attr('class', 'fa fa-tag');
        labelItem.text(label + " ");
        var select = group.append('select').attr('id', id);

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (typeof item == "object")
                select.append('option').attr('value', item.value).text(item.label);
            else
                select.append('option').attr('value', item).text(item);
        }

        RED.main.SetPopOver(select[0], tooltip, "right");
        if (cb == undefined) {
            //input.attr("readonly", '');
            select.attr('disabled', '');
        } else {
            select.on('change', function() {cb($("#" + id).val()); } );
        }
    }
    function CreateInputBoxWithLabel(container, label, propertyName, value, type, tooltip, cb, autocomplete) {
        var uid = "input-ndmgr-"+propertyName;// label.split(' ').join('-').split('.').join('-');
        var group = container.append('div').attr('class','form-row').attr('id', uid + '-row');
        var labelItem = group.append('label').attr('for', uid);
        labelItem.append('i').attr('class', 'fa fa-tag');
        labelItem.text(label + " ");
        //var group2 = container.append('div').attr('class','form-row-ndm');
        if (type == "bool")
            var input = group.append('input').attr('type','checkbox').attr('id', uid).attr('checked',value == true?'checked':undefined);
        else if (type == "multiline") {
            var input = group.append('textarea').attr('type', 'text').attr('id', uid).attr('wrap', 'off').attr('rows', 14).attr('style', 'width: 95%; height: 95%').text(value);
        }
        else
            var input = group.append('input').attr('type','text').attr('id', uid).attr('value',value).attr('autocomplete', (autocomplete != undefined)?autocomplete:'off');
        
        RED.main.SetPopOver(input[0], tooltip, "right");
        if (cb == undefined) {
            //input.attr("readonly", '');
            input.attr('disabled', '');
        } else {
            if (type == "bool")
                input.on('change', function() {cb($("#" + uid).prop('checked'),propertyName); } );
            else
                input.on('change', function() {cb($("#" + uid).val(),propertyName); } );
        }
        
        //<label for="node-input-name"><i class="fa fa-tag"></i> Name</label>
		//<input type="text" id="node-input-name" placeholder="Name"></input>
    }

    function CreateAceEditor(container,id,initialValue,theme,mode,onchange_cb) {
        var input = container.append('pre').attr('id', id).attr('style', "height: 100%; margin-bottom: 0px");
        var aceEditor = ace.edit(id);
        aceEditor.setTheme("ace/theme/" + theme, function() { console.log(id + " theme changed");});
        
        aceEditor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            tabSize: RED.arduino.settings.CodeIndentations,
            enableLiveAutocompletion: true,
        });
        aceEditor.session.setMode("ace/mode/" + mode, function() { console.log(id + " mode changed to " + mode);});
        SetAceEditorValue(id, initialValue);

        aceEditor.session.on('change', function() {
            onchange_cb(GetAceEditorValue(id), id);
          });

        //input.on('change', function() { onchange_cb(GetAceEditorValue(id), id); } );
    }
    function SetAceEditorValue(id, value) {
        ace.edit(id).setValue(value);
        ace.edit(id).session.selection.clearSelection();
    }
    function GetAceEditorValue(id) {
        return ace.edit(id).getValue();
    }

    
    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
    };
})();