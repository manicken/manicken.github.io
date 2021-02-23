


RED.NodeDefManager = (function() {

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

    var tooltips = {
        addMenu:"add new group or node type",
        importMenu:"imports into the current selected node definition group",
        removeButton:"remove current selected group or node definition",
        exportButton:"exports all node definitions as a json file",
        importRefresh:"updates the current addon from the url given"
    }
    var treeList;

    var defSettings = {
    };
    var _settings = {
    };
    var settings = {
    };
    var settingsCategory = { label:"Node Def Manager", expanded:true, bgColor:"#DDD" };

    var settingsEditor = {
        DownloadCurrentNodeDefs:    { label:"Download Current NodeDefs", type:"button", action: DownloadCurrentNodeDefs},
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
        textArea = rightPanel.append('textarea').attr('type', 'text').attr('id','outputPreview').attr('wrap', 'off').attr('style', 'width: 95%; height: 95%');


        var leftPanelButtons = form.append('div').attr('id', "nodeDefMgr-LeftPanel-buttons");
        var rightPanelButtons = form.append('div').attr('id', "nodeDefMgr-RightPanel-buttons");

        
        
        addMenu = CreateMenu(leftPanelButtons, "add", tooltips["addMenu"], [{label:'group', cb:addGroup}, {label:'node type', cb:addNodeType}]);
        importMenu = CreateMenu(leftPanelButtons, "import", tooltips["importMenu"], [{label:'from file', cb:importFromFile}, {label:'from url', cb:importFromUrl}, {label:'refresh', tooltip:tooltips["importRefresh"], cb:refreshFromUrl}]);
        removeButton = CreateButton(leftPanelButtons, "remove", tooltips["removeButton"], removeItem);
        CreateButton(leftPanelButtons, "export", tooltips["exportButton"], DownloadCurrentNodeDefs);
        applyButton = CreateButton(rightPanelButtons, "apply","apply the changes of the selected item", applyCurrent);
        
        BuildTree();        

        

        $( "#node-definitions-manager-dialog" ).dialog("open");

        SetEditableState(); // puts everything in a default state
    }

    function BuildTree()
    {
        leftPanel.html("");
        var nodeDefGroupTree = leftPanel.append('ul').attr('id', "nodeDefGroupTree");
        var defGroupNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var i = 0; i < defGroupNames.length; i++) {
            var defGroupName = defGroupNames[i];
            var nodeDefGroup = nodeDefGroupTree.append('li');
            nodeDefGroup.append('span').attr('class', 'caret2');
            nodeDefGroup.append('span').attr('class', 'nodeDefItem').text(defGroupName).on("click", NodeDefGroupMouse_Click);
            var nodeDefGroupItems = nodeDefGroup.append('ul').attr('class', 'nested2');
            var defCat = RED.nodes.node_defs[defGroupName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            for (var i2 = 0; i2 < defNames.length; i2++) {
                nodeDefGroupItems.append('li').append('span').attr('class', 'nodeDefItem').attr('nodeDefGroupName', defGroupName).text(defNames[i2]).on("click", NodeDefMouse_Click);
            }
        }
        var toggler = document.getElementsByClassName("caret2");
        for (var i = 0; i < toggler.length; i++) {
            toggler[i].addEventListener("click", function() {
                this.parentElement.querySelector(".nested2").classList.toggle("active2");
                this.classList.toggle("caret2-down");
            });
        }
    }

    function SetEditableState(nodeDefGroupName) {
        if (nodeDefGroupName != undefined && RED.nodes.node_defs[nodeDefGroupName].isAddon != undefined && RED.nodes.node_defs[nodeDefGroupName].isAddon == true)
        {
            //applyButton.style("visibility","visible");
            //removeButton.style("visibility","visible");
            //importMenu.group.style("visibility","visible");
            applyButton.classed("disabled",false);
            removeButton.classed("disabled",false);
            importMenu.dropDown.classed("disabled",false);
            addMenu.items[1].classed("disabled",false);
        }
        else
        {
            //applyButton.style("visibility","hidden");
            //removeButton.style("visibility","hidden");
            //importMenu.group.style("visibility","hidden");
            applyButton.classed("disabled",true);
            removeButton.classed("disabled",true);
            importMenu.dropDown.classed("disabled",true);
            
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
        textArea.text(JSON.stringify(editable,null,4));
        //textArea.text(JSON.stringify(RED.nodes.node_defs[nodeDefGroupName],null,4));
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
        textArea.text(JSON.stringify(RED.nodes.node_defs[nodeDefGroupName].types[nodeDefName],null,4));
        //rightPanel.append(textArea);
        SetEditableState(nodeDefGroupName);
        currentSelectedItem = {groupName:nodeDefGroupName, name:nodeDefName };
        console.log(currentSelectedItem);
    }

    function applyCurrent() {
        if ( d3.select(this).classed("disabled") == true) return;

        RED.notify("apply current clicked " + currentSelectedItem.groupName + " " + currentSelectedItem.name + " (not yet implemented)", "info", null, 2000);
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
        var newItemForm = d3.select('#node-def-manager-new-item-dialog');
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
        RED.notify("import from url clicked (not yet implemented)", "info", null, 2000);
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

    function EditDefGroup(nodeDefGroupName) {
        var nodeDefGroup = RED.nodes.node_defs[nodeDefGroupName];
        var propertyNames = Object.getOwnPropertyNames(nodeDefGroup);
        //console.warn(nodeDefGroup, propertyNames);
        for (var i = 0; i < propertyNames.length; i++) {
            var pname = propertyNames[i];
            if (pname == "types") continue; // skip this
            console.warn("EditDefGroup item: " + pname + " type " + typeof nodeDefGroup[pname] + " " + nodeDefGroup[pname]);
            var type = "";
            if (pname == "isAddon")
                CreateInputBoxWithLabel(rightPanel, pname, pname, nodeDefGroup[pname], "bool", groupPropertyTooltips[pname], undefined); // this creates a read only checkbox
            else
                CreateInputBoxWithLabel(rightPanel, pname, pname, nodeDefGroup[pname], (typeof nodeDefGroup[pname]), groupPropertyTooltips[pname], function(value, label) { console.warn(label, value); });
        }
        
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
    function EnableNewItemOk() {
        document.getElementById("btn-new-item-dialog-ok").disabled = false;
        $("#btn-new-item-dialog-ok").removeClass("unclickablebutton");
    }

    function SetNewNodeTypeFormContents(form) {
        form.html("");
        newNodeTypeJSON = JSON.stringify(newNodeTypeTemplate, null, 4);
        CreateInputBoxWithLabel(form, "Type", "type", "", "string", newNodeTypeClassNameTooltip, function(value) { VerifyNodeType(value); newItemUid = value; } );
        CreateInputBoxWithLabel(form, "JSON", "json", newNodeTypeJSON, "multiline", newNodeTypeJSONTooltip, function(value) { VerifyNodeTypeJSON(value); newNodeTypeJSON = value; } );
    }

    function VerifyNodeTypeJSON(jsonString) {
        try {
            var parsedJSON = JSON.parse(jsonString);
            newNodeTypeParsed = parsedJSON;
            $("#input-ndmgr-json").removeClass("input-error");
            return true;
        }
        catch (ex) {
            RED.notify(ex, "warn", null, 10000);
            $("#input-ndmgr-json").addClass("input-error");
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
		open: function(e) { RED.keyboard.disable(); },
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
                        if (newItemDialogOk_cb())
                            $( this ).dialog( "close" );
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
		open: function(e) { RED.keyboard.disable();	},
		close: function(e) { RED.keyboard.enable(); }
	});
    
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
    function CreateInputBoxWithLabel(container, label, propertyName, value, type, tooltip, cb) {
        var uid = "input-ndmgr-"+propertyName;// label.split(' ').join('-').split('.').join('-');
        var group = container.append('div').attr('class','form-row');
        var labelItem = group.append('label').attr('for', uid);
        labelItem.append('i').attr('class', 'fa fa-tag');
        labelItem.text(label + " ");
        //var group2 = container.append('div').attr('class','form-row-ndm');
        if (type == "bool")
            var input = group.append('input').attr('type','checkbox').attr('id', uid).attr('checked',value);
        else if (type == "multiline")
            var input = group.append('textarea').attr('type', 'text').attr('id', uid).attr('wrap', 'off').attr('rows', 14).attr('style', 'width: 95%; height: 95%').text(value);
        else
            var input = group.append('input').attr('type','text').attr('id', uid).attr('value',value);
        
        RED.main.SetPopOver(input[0], tooltip, "right");
        if (cb == undefined) {
            //input.attr("readonly", '');
            input.attr('disabled', '');
        } else {
            input.on('change', function() {cb($("#" + uid).val(),propertyName); } );
        }
        
        //<label for="node-input-name"><i class="fa fa-tag"></i> Name</label>
		//<input type="text" id="node-input-name" placeholder="Name"></input>
    }

    
    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
    };
})();