    
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
    var demofileList = [{name:"file.json", type:"file"}, {name:"folder", type:"dir"},{name:"file.osc", type:"file"}]
        
    function BuildTree(path)
    {
        leftPanel.html("");
        var rootDir = leftPanel.append('ul').attr('class', "nodeDefGroupTree");

        putFiles(rootDir, "", demofileList);
    }

    function putFiles(itemsRoot, path, fileList) {
        for (var i = 0; i < fileList.length; i++) {
            fileList[i].path = path;
            createNode(itemsRoot, fileList[i])
        }
    }

    function createNode(parent, options) {
        if (options.type == "dir")
        {
            var nodeDefGroup = parent.append('li');
            var caret = nodeDefGroup.append('span').attr('class', 'caret2');

            var item = nodeDefGroup.append('span')
            item.attr('class', 'nodeDefItem').attr('path', options.path).text(options.name).on("click", Folder_MouseClick);
            var itemsRoot = nodeDefGroup.append('ul').attr('class', 'nested2');
            
            caret.on('click', function() {
                this.parentElement.querySelector(".nested2").classList.toggle("active2");
                this.classList.toggle("caret2-down");
                openDir(options,itemsRoot);
            });
            return itemsRoot;
        }
        else if (options.type == "file")
        {
            parent.append('li').append('span').attr('class', 'nodeDefItem').attr('path', options.path).text(options.name).on("click", File_MouseClick);
        }
    }
    function openDir(options,itemsRoot) {
        if (options.path == "/") // root dir
            var newPath = "/" + options.name;
        else
            var newPath = options.path + "/" + options.name
        OSC.AddLineToLog("dir open:" + newPath);

        // here we can add items to the folder
        putFiles(itemsRoot, newPath, demofileList);
        //createNode(itemsRoot, {type:"dir", path:newPath, name:"subdir"});
    }

    function Folder_MouseClick() {
        DeselectOthers();
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var name = item.text();
        var path = item.attr("path");
        
        currentSelectedItem = {path:path, name:name, fullPath: path+"/"+name};
        OSC.AddLineToLog("Folder selected: " + JSON.stringify(currentSelectedItem));
    }

    function File_MouseClick() {
        DeselectOthers();
        //rightPanel.html("");
        
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var name = item.text();
        var path = item.attr("path");
       
        currentSelectedItem = {path:path, name:name, fullPath: path+"/"+name };
        OSC.AddLineToLog("File selected: " + JSON.stringify(currentSelectedItem));
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