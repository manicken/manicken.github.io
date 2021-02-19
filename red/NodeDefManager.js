


RED.NodeDefManager = (function() {

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
        form = d3.select('#dialog-form-node-definitions-manager');

        form.html(""); // TODO: make use of data driven update

        leftPanel = form.append('div').attr('id', "nodeDefMgr-LeftPanel");
        rightPanel = form.append('div').attr('id', 'nodeDefMgr-RightPanel');
        textArea = rightPanel.append('textarea').attr('type', 'text').attr('id','outputPreview').attr('wrap', 'off').attr('style', 'width: 95%; height: 95%');


        var leftPanelButtons = form.append('div').attr('id', "nodeDefMgr-LeftPanel-buttons");
        var rightPanelButtons = form.append('div').attr('id', "nodeDefMgr-RightPanel-buttons");

        var nodeDefGroupTree = leftPanel.append('ul').attr('id', "nodeDefGroupTree");
        
        addMenu = CreateMenu(leftPanelButtons, "add", [{label:'group', cb:addGroup}, {label:'node type', cb:addNodeType}]);
        importMenu = CreateMenu(leftPanelButtons, "import", [{label:'from file', cb:importFromFile}, {label:'from url', cb:importFromUrl}]);
        removeButton = CreateButton(leftPanelButtons, "remove", removeItem);
        applyButton = CreateButton(rightPanelButtons, "apply", applyCurrent);

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

        $( "#node-dialog-node-definitions-manager" ).dialog("open");
    }

    function SetEditableState(nodeDefGroupName) {
        if (RED.nodes.node_defs[nodeDefGroupName].isAddon != undefined && RED.nodes.node_defs[nodeDefGroupName].isAddon == true)
        {
            applyButton.style("visibility","visible");
            removeButton.style("visibility","visible");
            importMenu.group.style("visibility","visible");
            addMenu.items[1].classed("hidden",false);
        }
        else
        {
            applyButton.style("visibility","hidden");
            removeButton.style("visibility","hidden");
            importMenu.group.style("visibility","hidden");
            addMenu.items[1].classed("hidden",true);
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
        console.log(nodeDefGroupName);
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
        console.log(nodeDefGroupName,nodeDefName);
    }

    function applyCurrent() {
        RED.notify("apply current clicked " + currentSelectedItem.groupName + " " + currentSelectedItem.name , "info", null, 2000);
    }
    function addGroup() {
        RED.notify("add group clicked", "info", null, 2000);
    }
    function addNodeType() {
        RED.notify("add node type clicked", "info", null, 2000);
    }
    function importFromFile() {
        RED.notify("import from file clicked", "info", null, 2000);
    }
    function importFromUrl() {
        RED.notify("import from url clicked", "info", null, 2000);
    }
    function removeItem() {
        RED.notify("remove item clicked", "info", null, 2000);
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
                CreateInputBoxWithLabel(rightPanel, pname, nodeDefGroup[pname], "bool", undefined); // this creates a read only checkbox
            else
                CreateInputBoxWithLabel(rightPanel, pname, nodeDefGroup[pname], (typeof nodeDefGroup[pname]) , function(label, value) { console.warn(label, value); });
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

    function getFlowData() {
        var flowData = [{
                id: "project-tree",
                label: "Tabs",
                expanded: true,
                children: [],
            }
        ]
        return flowData;
    }

    $("#node-dialog-node-definitions-manager form" ).submit(function(e) { e.preventDefault();});
	$( "#node-dialog-node-definitions-manager" ).dialog({
		modal: true,
		autoOpen: false,
		width: 800,
        height:600,
		title: "Node Definitions Manager",
		buttons: [
			{
				text: "Close",
				click: function() {
					$( this ).dialog( "close" );
				}
			}
		],
		open: function(e) {
			RED.keyboard.disable();
		},
		close: function(e) {
			RED.keyboard.enable();
		}
	});
    
    function CreateMenu(container, label, items) {
        var menuGroup = container.append('div').attr('class','btn-group');
        menuGroup.append('a').attr('class', 'btn dropdown-toggle').attr('data-toggle','dropdown').text(label + " ").append('span').attr('class','caret');
        var menu = menuGroup.append('ul').attr('class','dropdown-menu');
        var menuItems = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var menuItemLine = menu.append('li');
            menuItemLine.append('a').text(item.label).on('click', item.cb);
            menuItems.push(menuItemLine);
        }
        return {menu:menu, group:menuGroup, items:menuItems};
    }
    function CreateButton(container, label, cb) {
        return container.append('div').attr('class','btn-group').append('a').attr('class', 'btn').text(label + " ").on('click', cb);
    }
    function CreateInputBoxWithLabel(container, label, value, type, cb) {
        var uid = "input-ndmgr-"+label.split(' ').join('-').split('.').join('-');
        var group = container.append('div').attr('class','form-row');
        var labelItem = group.append('label').attr('for', uid);
        labelItem.append('i').attr('class', 'fa fa-tag');
        labelItem.text(label + " ");
        if (type == "bool")
            var input = group.append('input').attr('type','checkbox').attr('id', uid).attr('checked',value);
        else
            var input = group.append('input').attr('type','text').attr('id', uid).attr('value',value);
        
        if (cb == undefined) {
            //input.attr("readonly", '');
            input.attr('disabled', '');
        } else {
            input.on('change', function() {cb(label, $("#" + uid).val()); } );
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