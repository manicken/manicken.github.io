    
OSC.fileSelector = (function () {
    var form;
    var textArea;
    var leftPanel;
    var rightPanel;
    var currentSelectedItem;

    $('#btn-testFileSelect').click(function() { showForm(); });

    function showForm()
    {
        
        form = d3.select('#file-select-dialog');

        form.html(""); // TODO: make use of data driven update

        leftPanel = form.append('div').attr('id', "nodeDefMgr-LeftPanel");
        rightPanel = form.append('div').attr('id', 'nodeDefMgr-RightPanel');

        BuildTree();

        $( "#file-select-dialog" ).dialog("open");
    }

    function BuildTree()
    {
        leftPanel.html("");
        var nodeDefGroupTree = leftPanel.append('ul').attr('class', "nodeDefGroupTree");
        var defGroupNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var i = 0; i < defGroupNames.length; i++) {
            var defGroupName = defGroupNames[i];
            var nodeDefGroupItems = createNode(nodeDefGroupTree, {type:"dir", path:"/", text:defGroupName});
            
            var defCat = RED.nodes.node_defs[defGroupName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            for (var i2 = 0; i2 < defNames.length; i2++) {
                createNode(nodeDefGroupItems, {type:"file", path:"/" + defGroupName, text:defNames[i2]});
            }
        }
    }

    function createNode(parent, options) {
        if (options.type == "dir")
        {
            var nodeDefGroup = parent.append('li');
            var caret = nodeDefGroup.append('span').attr('class', 'caret2');

            var item = nodeDefGroup.append('span')
            item.attr('class', 'nodeDefItem').attr('path', options.path).text(options.text).on("click", Folder_MouseClick);
            var nodeDefGroupItems = nodeDefGroup.append('ul').attr('class', 'nested2');
            
            caret.on('click', function() {
                this.parentElement.querySelector(".nested2").classList.toggle("active2");
                this.classList.toggle("caret2-down");
                openDir(options.path);
            });
            return nodeDefGroupItems;
        }
        else if (options.type == "file")
        {
            parent.append('li').append('span').attr('class', 'nodeDefItem').attr('path', options.path).text(options.text).on("click", File_MouseClick);
        }
    }
    function openDir(path) {
        console.warn("dir open:", path);
    }

    function Folder_MouseClick() {
        DeselectOthers();
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var name = item.text();
        var path = item.attr("path");
        
        currentSelectedItem = {path:path, name:name};
        console.log("Folder selected: ", currentSelectedItem);
    }

    function File_MouseClick() {
        DeselectOthers();
        //rightPanel.html("");
        
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var name = item.text();
        var path = item.attr("path");
       
        currentSelectedItem = {path:path, name:name };
        console.log("File selected: ", currentSelectedItem);
    }

    function DeselectOthers()
    {
        form.selectAll('.nodeDefItem').classed('nodeDefItemSelected', false);
    }

    $("#file-select-dialog form" ).submit(function(e) { e.preventDefault();});
	$( "#file-select-dialog" ).dialog({
		modal: true, autoOpen: false,
		width: 800, height:600,
		title: "File Select Dialog",
		buttons: [
			{
				text: "Close",
				click: function() {	$( this ).dialog( "close" ); }
			}
		],
		open: function(e) { RED.keyboard.disable(); },
		close: function(e) { RED.keyboard.enable();	}
	});

    return {
        showForm:showForm,
        BuildTree:BuildTree
    };
})();