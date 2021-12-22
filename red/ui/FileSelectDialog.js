    
OSC.fileSelector = (function () {
    var form;
    var textArea;
    var leftPanel;
    var rightPanel;
    var currentSelectedItem;

    var isOpen = false;

    var initialized = false;

    var listFilesCmd = "";
    var listFilesRoot;

    function init(){
        RED.events.on("OSCBundle:Received", OSCBundle_Received);
        initialized = true;
    }

    $('#btn-testFileSelect').click(function() { show(); });

    var filter = "*";

    function show(options)
    {
        listFilesCmd = RED.OSC.settings.RootAddress + "/fs/list";

        if (options == undefined) options = {};
        if (options.rootDir == undefined) options.rootDir = "/";
        if (options.title == undefined) options.title = "File Select Dialog";
        if (options.filter == undefined) filter = "*";
        else filter = options.filter.toLowerCase();

        var buttons = [];

        if (options.okCallback != undefined) {
            if (options.okButtonText == undefined) options.okButtonText = "OK";
            var okButton = {
                text:options.okButtonText,
                click: function() { $( this ).dialog( "close" ); okCallback(currentSelectedItem); }
            };
            buttons.push(okButton);
        } 
        buttons.push({
            text: "Close",
            click: function() {	$( this ).dialog( "close" ); }
        });

        $("#file-select-dialog form" ).submit(function(e) { e.preventDefault();});
        $( "#file-select-dialog" ).dialog({
            modal: true, autoOpen: false,
            width: 800, height:600,
            title: options.title,
            buttons: buttons,
            open: dialogOpened,
            close: function(e) { RED.keyboard.enable();	isOpen = false; }
        });

        if (initialized == false)
            init();

        form = d3.select('#file-select-dialog');

        form.html(""); // TODO: make use of data driven update

        leftPanel = form.append('div').attr('id', "nodeDefMgr-LeftPanel");
        rightPanel = form.append('div').attr('id', 'nodeDefMgr-RightPanel');

        BuildTree(options.rootDir,false);
        

        $( "#file-select-dialog" ).dialog("open");
    }
    
    var demofileList = [{name:"file.json", type:"file"}, {name:"folder", type:"dir"},{name:"file.osc", type:"file"}]
        
    function BuildTree(rootDir, rootOpen)
    {
        leftPanel.html("");
        var rootroot = leftPanel.append('ul').attr('class', "nodeDefGroupTree");
        currentSelectedItem = {path:rootDir};
        var options = {type:"dir", path:"", name:rootDir, open:rootOpen};
        listFilesRoot = createNode(rootroot, options);

        if (rootOpen == true)
            OSC.SendMessage(listFilesCmd,'s',rootDir);
        //putFiles(rootDir, "", demofileList);
    }


    function dialogOpened(e) {
        RED.keyboard.disable();
        isOpen = true;
        
        
        OSC.SendMessage(listFilesCmd,'s',currentSelectedItem.path);
    }

    function OSCBundle_Received(oscBundle) {
        if(isOpen == false) return;
        //there is only one package in a bundle when doing filelist
        if (oscBundle.packets == undefined) return; // skip non bundles
        if (oscBundle.packets[0].address != "/reply") return; // skip non replys
        if (oscBundle.packets[0].args == undefined) return; // skip replys with no arguments
        
        if (oscBundle.packets[0].args[0].value == listFilesCmd) entryList_Received(oscBundle.packets[0].args);
        else console.log("command not supported yet",oscBundle.packets[0].args[0].value);
    }

    function entryList_Received(packetArgs) {
        var item = packetArgs[packetArgs.length -1];
        if (item.type != "i" || item.value != 0) return; // error

        var entryList = [];
        //var newEntry = {};
        // begin after dir arg
        // and do all except the last
        for (var i = 2; i < (packetArgs.length - 1); i++) {
            item = packetArgs[i];
            if (item.value == "dir") {
                i++; // get next which is the name
                if (i >= (packetArgs.length - 1)) return; // corrupted arguments
                item = packetArgs[i];
                entryList.push({name:item.value, type:"dir"});
            }
            else if (item.value == "file") {
                i++; // get next which is the size
                if (i >= (packetArgs.length - 1)) return; // corrupted arguments
                item = packetArgs[i];
                var fileSize = item.value;
                i++; // get next which is the name
                if (i >= (packetArgs.length - 1)) return; // corrupted arguments
                item = packetArgs[i];
                if (filter != "*" && item.value.toLowerCase().endsWith(filter) == false) continue; // skip item

                entryList.push({name:item.value, type:"file", size:fileSize}); 
            }
        }
        listFilesRoot.html("");
        putFiles(listFilesRoot, currentSelectedItem.path, entryList);
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
            if ( options.open == undefined) options.open = false;

            var nodeDefGroup = parent.append('li');
            if (options.open == true)
                var caret = nodeDefGroup.append('span').attr('class', 'caret2 caret2-down');
            else
                var caret = nodeDefGroup.append('span').attr('class', 'caret2');

            var item = nodeDefGroup.append('span')
            item.attr('class', 'nodeDefItem').attr('path', options.path).text(options.name).on("click", Folder_MouseClick);
            if (options.open == true)
                var itemsRoot = nodeDefGroup.append('ul').attr('class', 'nested2 active');
            else
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
        
        currentSelectedItem = {path:newPath, name: options.name};
        //currentSelectedItem.path = newPath
        
        listFilesRoot = itemsRoot;
        
        OSC.SendMessage(listFilesCmd,'s',newPath);
        // here we can add items to the folder
        //putFiles(itemsRoot, newPath, demofileList);
        //createNode(itemsRoot, {type:"dir", path:newPath, name:"subdir"});
    }

    function Folder_MouseClick() {
        DeselectOthers();
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var name = item.text();
        var path = item.attr("path");
        
        currentSelectedItem = {path:path, name:name, fullPath: function() { return this.path+"/"+this.name;}};
        OSC.AddLineToLog("Folder selected: " + JSON.stringify(currentSelectedItem));
    }

    function File_MouseClick() {
        DeselectOthers();
        //rightPanel.html("");
        
        var item = d3.select(this);
        item.classed('nodeDefItemSelected', true);
        var name = item.text();
        var path = item.attr("path");
       
        currentSelectedItem = {path:path, name:name, fullPath: function() { return this.path+"/"+this.name;}};
        OSC.AddLineToLog("File selected: " + JSON.stringify(currentSelectedItem));
    }

    function DeselectOthers()
    {
        form.selectAll('.nodeDefItem').classed('nodeDefItemSelected', false);
    }

    

    return {
        show:show
    };
})();