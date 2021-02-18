


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
    function showForm()
    {
        form = d3.select('#dialog-form-node-definitions-manager');

        form.html(""); // TODO: make use of data driven update

        var leftPanel = form.append('div').attr('id', "nodeDefMgr-LeftPanel");
        var leftPanelButtons = form.append('div').attr('id', "nodeDefMgr-LeftPanel-buttons");
        var nodeDefCatTree = leftPanel.append('ul').attr('id', "nodeDefCatTree");
        
        var addMenuGroup = leftPanelButtons.append('div').attr('class','btn-group');
        var addMenu = addMenuGroup.append('a').attr('class', 'btn dropdown-toggle').attr('data-toggle','dropdown').text("add ");
        addMenu.append('span').attr('class','caret');
        addMenuGroup.append('ul').attr('class','dropdown-menu').append('li').append('a').attr('id', 'btnMenu_item40').text("first item");

        var removeMenuGroup = leftPanelButtons.append('div').attr('class','btn-group');
        var removeMenu = removeMenuGroup.append('a').attr('class', 'btn dropdown-toggle').attr('data-toggle','dropdown').text("remove ");
        removeMenu.append('span').attr('class','caret');
        removeMenuGroup.append('ul').attr('class','dropdown-menu').append('li').append('a').attr('id', 'btnMenu_item41').text("first item");

        
        var defCatNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var i = 0; i < defCatNames.length; i++) {
            var defCatName = defCatNames[i];
            var nodeDefCat = nodeDefCatTree.append('li');
            nodeDefCat.append('span').attr('class', 'caret2');
            nodeDefCat.append('span').attr('class', 'nodeDefItem').text(defCatName).on("mouseup", NodeDefCatMouseUp);
            var nodeDefCatItems = nodeDefCat.append('ul').attr('class', 'nested2');
            var defCat = RED.nodes.node_defs[defCatName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            for (var i2 = 0; i2 < defNames.length; i2++) {
                nodeDefCatItems.append('li').append('span').attr('class', 'nodeDefItem').attr('nodeDefCatName', defCatName).text(defNames[i2]).on("mouseup", NodeDefMouseUp);
            }
        }
        var rightPanel = form.append('div').attr('id', 'nodeDefMgr-RightPanel')
        textArea = rightPanel.append('textarea').attr('type', 'text').attr('id','outputPreview').attr('wrap', 'off').attr('style', 'width: 95%; height: 95%');

        var toggler = document.getElementsByClassName("caret2");

        for (var i = 0; i < toggler.length; i++) {
        toggler[i].addEventListener("click", function() {
            this.parentElement.querySelector(".nested2").classList.toggle("active2");
            this.classList.toggle("caret2-down");
        });
        }

        $( "#node-dialog-node-definitions-manager" ).dialog("open");
    }
    function DeselectNodeDefs()
    {
        form.selectAll('.nodeDefItem').classed('nodeDefItemSelected', false);
    }

    function NodeDefCatMouseUp() {
        DeselectNodeDefs();
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var nodeDefCatName = item.text();
        textArea.text(JSON.stringify(RED.nodes.node_defs[nodeDefCatName],null,4));
        console.log(nodeDefCatName);
    }

    function NodeDefMouseUp() {
        DeselectNodeDefs();
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var nodeDefName = item.text();
        var nodeDefCatName = item.attr("nodeDefCatName");
        textArea.text(JSON.stringify(RED.nodes.node_defs[nodeDefCatName].types[nodeDefName],null,4));
        console.log(nodeDefCatName,nodeDefName);
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
    

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
    };
})();