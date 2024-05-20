/** Modified from original Node-Red source, for audio system visualization
 * //NOTE: code generation save function have moved to arduino-export.js
 *
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
/**
 * node RED namespace
 */
var RED = (function() { // this is used so that RED can be used as root "namespace"
	return {
        faustLinkExtId:"",
        version:12,
        vernotes:{
            "1":"* Dynamic Input Objects now uses a node def. called dynInputs<br><br>"+
                "* OSC live update now works while connecting to dyn. input objects<br><br>"+
                "* Add new setting to Global-'Debug Output' LogAddNotificationOther<br><br>"+
                "* Add new setting to Global-'Debug Output' LogAddNotificationInfo<br><br>"+
                "* Add new setting to Global-'Debug Output' LogAddNotificationWarning<br><br>"+
                "* Add new setting to Global-'Debug Output' LogAddNotificationError<br>"+
                "&nbsp;&nbsp;these are used to log notifications in the bottom log panel, for easier debug<br><br>"+
                "* OSC.AddToLog now prints lines in groups for easier distinguishing them.",
            "2":"* OSC live update don't update the dynmixer size automatically<br><br>"+
                "* no support of bus wires in live update<br><br>"+
                "* OSC send can now send boolean types T F without any mathing value<br>"+
                "&nbsp;&nbsp;example OSC.SendMessage(addr,'iiTFiiFTii',0,1,2,3,4,5,6);",
            "3":"* Move setting 'Show Node Tooltip Popup' to Global-Nodes/Links (default is on)<br><br>"+
                "* Move setting 'Auto append dropped links' to Global-Nodes/Links (default is on)<br><br>"+
                "* Add setting 'Dyn. Input Objects Auto Expand' to Global-Nodes/Links (default is on)<br><br>"+
                "* Add setting 'Dyn. Input Objects Auto Reduce' to Global-Nodes/Links (default is off)<br>"+
                "note. hover over the settings for more information<br><br>"+
                "<strong> The following was added before but are announced now </strong><br>"+
                "* Add setting 'Add New Auto Edit' to Workspaces<br><br>"+
                "* Add setting 'Add New Location' to Workspaces<br>"+
                "&nbsp;&nbsp;makes it easier to add tabs in extreme multitab projects",
            "4":"* Add setting 'compress Zip file' to 'Teensy/C++'-Export (default is enabled)<br>"+
                "&nbsp;&nbsp;this don't save much time but could maybe do for very big projects<br><br>"+
                "* Fix so that when exporting to zip file:<br>"+
                "&nbsp;&nbsp;the files don't include the design-JSON string<br>"+
                "&nbsp;&nbsp;as the design-JSON is put into a seperate file,<br>"+
                "&nbsp;&nbsp;this saves alot of export time.<br><br>"+
                "* holding Ctrl key while scrolling/'clicking scroll buttons'<br>"+
                "&nbsp;&nbsp;the workspace tabs moves to either end<br><br>"+
                "* Confirm Delete workspace/tab/class dialog shows all instances affected.<br><br>"+
                "* Input/Output/Control-objects or ConstValues cannot be defined as arrays<br><br>"+
                "* Array size def. can only be set to:<br>"+
                "&nbsp;&nbsp;a integer number > 1 or<br>"+
                "&nbsp;&nbsp;to a existing 'const value'-name that has the value set to a 'valid integer > 1'<br><br>"+
                "* When removing a ConstValue that is in use by array defined objects<br>"+
                "&nbsp;&nbsp;i.e. name[CONSTNAME],<br>"+
                "&nbsp;&nbsp;the 'const value name' of those will be replaced by the 'const value'<br><br>"+
                "<strong> The following was added before but are announced now </strong><br>"+
                "* Holding Ctrl while 'double click' on a Class/Tab object will open that Tab<br><br>",
            "5":"* change internal 'working' structure so that each workspace have their own set of nodes and links<br>"+
                "&nbsp;&nbsp;before all nodes and links where in two big arrays<br>"+
                "&nbsp;&nbsp;this new 'working' structure makes it much easier to white export code<br><br>"+
                "* node id:s are now generated from current utc date/time + a 16bit random number<br><br>"+
                "* now array defined names gets new name when copies are made: i.e. array1[2] when copied become array2[2]<br><br>"+
                "* toolbar add delete button (drop down confirm)<br><br>"+
                "* add link notation: array sources can only be connected to: dynInput objects such as AudioMixer and AudioMixerStereo, unless the target is a array<br><br>"+
                "* add link notation: the array source size don't match the target array size<br><br>"+
                "* notation of a forgotten function: when holding ctrl while selecting groups the whole group gets selected<br><br>"+
                "* splitted settings sub category Nodes/Links @ Global to two categories: Nodes and Links<br><br>"+
                "* Move setting 'Auto append dropped links'from Global-Nodes/Links to Global-Links<br><br>"+
                "* Move setting 'Dyn. Input Objects Auto Expand' from Global-Nodes/Links to Global-Links<br><br>"+
                "* Move setting 'Dyn. Input Objects Auto Reduce' from Global-Nodes/Links to Global-Links<br><br>"+
                "* Move setting 'Show Node Tooltip Popup' from Global-Nodes/Links to Global-Nodes<br><br>"+
                "* Move setting 'Add to group autosize' from Workspaces to Global-Groups<br><br>"+
                "* add setting LassoSelectNodeMode @ Global-Node that selects the behaivour of the select lasso<br><br>"+
                "* greatly improved performance, specially for huge 'one tab'-designs (test design: was 1800 nodes & 2000 links)<br>"+
                "&nbsp;&nbsp;@ selecting nodes, @ selecting all nodes (ctrl+a), @ moving nodes around, @ copy paste nodes<br><br>"+
                "* bus wires are now blue without any dots<br><br>"+
                "* selected wires use outline when selected, instead of 'inside line', that makes 'invalid wires' keep their color even when selected<br><br>"+
                "* fixed annoying thing that don't allow normal keys outside the design view, that mean arrow keys can now be used while edit fields in the settings tab<br>"+
                "&nbsp;&nbsp;that also fixes a bug that don't allow ctrl+a in the export or import dialogs, or any other dialogs.<br><br>",
            "6":"* fix annoying bug that selects all text while moving nodes<br><br>"+
                "* holding shift inverts the gui run/edit function temporary, so while in 'gui run' holding the shift while double click a object open the edit dialog, and while in 'gui edit' holding shift make it possible to interact with the gui object.<br><br>"+
                "* array source wires are now yellow<br><br>"+
                "* exported zip files containing a sketch folder can now be imported<br><br>"+
                "* add setting @ Global-Debug'global'-'Redirect Debug', to redirect debug output from bottom 'log' to the browser development tools console,<br>"+
                "&nbsp;&nbsp;this makes the gui much more responsive while sending a lot of messages.<br>"+
                "&nbsp;&nbsp;note. the decoded OSC replies != OK are unaffected<br><br>"+
                "* add setting to show/hide decoded OSC replies<br><br>"+
                "* bottom log now have clear button @ bottom left corner when open<br><br>"+
                "* object/node edit fields can now have popup text help, the text is defined in the node def. check AudioMixer or AudioMixerStereo for examples.<br><br>"+
                "* better(not perfect) when wires going backwards do less crossing the nodes<br><br>",
            "7":"* @ autogen Node Editor: boolean checkbox<br>"+
                "* @ autogen Node Editor: combobox selector<br>"+
                "* @ autogen Node Editor: item custom top/bottom border lines<br>",
            "8":"* @ Node Definition Manager: fix bug when creating multiple new groups<br>"+
                "&nbsp;&nbsp;(additional groups would reference to the first group)<br>"+
                "* fix select all bug<br>"+
                "&nbsp;&nbsp;(by using ctrl-a one could add to the selection multiple times which then pasted multiple items as well)<br>"+
                "* changed Welcome message<br>",
            "9":"* added setting 'Export Instanced Tabs Only' @ Teensy/C++ - Export, that will allow non instanced classes/tabs to be exported as well.<br>",
            "10":"* fix a undefined bug @ function getNodeByName(name,nodes,wsId) where it would not check for undefined after trying to retreive workspace by id<br>",
            "11":"* isCodeFile now includes .ino as well, which would include the 'main c++' as well when exporting class as non-zip",
            "12":"* added functionality so that node def. categories order can be defined in the NodeDefinitions list (@NodeDefinitions.js)<br>"+
                 "* undefined categories are created automatically using the following structure: root-sub1-sub2 and so on<br>"+
                 "* added several unofficial audio object types using the above new structures<br>"+
                 "* now show popup to show info about the unofficial audio objects<br>"+
                 "* categories can now have a description field to describe what that specific category is for"
        },
		console_ok:function console_ok(text) { console.trace(); console.log('%c' + text, 'background: #ccffcc; color: #000'); }
	};
})();

/**
 * node RED main - here the main entry function exist
 */
RED.main = (function() {
	var defSettings = {
        AutoDownloadJSON: false,
        LogAddNotificationOther:false,
        LogAddNotificationInfo:false,
        LogAddNotificationWarning:true,
        LogAddNotificationError:true,
        LinkDropOnNodeAppend:true,
        DynInputAutoExpandOnLinkDrop:true,
        DynInputAutoReduceOnLinkRemove:false,
        DynInputAudoRearrangeLinks:false,
        ShowNodeToolTip:true,
        LassoSelectNodeMode:0,
        addToGroupAutosize: false,
        //AllowLowerCaseWorkspaceName: false,
    };
    var _settings = {
        AutoDownloadJSON:defSettings.AutoDownloadJSON,
        LogAddNotificationOther:defSettings.LogAddNotificationOther,
        LogAddNotificationInfo:defSettings.LogAddNotificationInfo,
        LogAddNotificationWarning:defSettings.LogAddNotificationWarning,
        LogAddNotificationError:defSettings.LogAddNotificationError,
        LinkDropOnNodeAppend:defSettings.LinkDropOnNodeAppend,
        DynInputAutoExpandOnLinkDrop:defSettings.DynInputAutoExpandOnLinkDrop,
        DynInputAutoReduceOnLinkRemove:defSettings.DynInputAutoReduceOnLinkRemove,
        DynInputAudoRearrangeLinks:defSettings.DynInputAudoRearrangeLinks,
        ShowNodeToolTip:defSettings.ShowNodeToolTip,
        LassoSelectNodeMode:defSettings.LassoSelectNodeMode,
        addToGroupAutosize: defSettings.addToGroupAutosize,
        //AllowLowerCaseWorkspaceName:defSettings.AllowLowerCaseWorkspaceName,
    };
    var settings = {
        get AutoDownloadJSON() { return _settings.AutoDownloadJSON; },
        set AutoDownloadJSON(state) { _settings.AutoDownloadJSON = state; RED.storage.update();},

        get LogAddNotificationOther() { return _settings.LogAddNotificationOther; },
        set LogAddNotificationOther(state) { _settings.LogAddNotificationOther = state; RED.storage.update();},

        get LogAddNotificationInfo() { return _settings.LogAddNotificationInfo; },
        set LogAddNotificationInfo(state) { _settings.LogAddNotificationInfo = state; RED.storage.update();},

        get LogAddNotificationWarning() { return _settings.LogAddNotificationWarning; },
        set LogAddNotificationWarning(state) { _settings.LogAddNotificationWarning = state; RED.storage.update();},

        get LogAddNotificationError() { return _settings.LogAddNotificationError; },
        set LogAddNotificationError(state) { _settings.LogAddNotificationError = state; RED.storage.update();},

        get LinkDropOnNodeAppend() { return _settings.LinkDropOnNodeAppend; },
        set LinkDropOnNodeAppend(state) { _settings.LinkDropOnNodeAppend = state; RED.storage.update();},

        get DynInputAutoExpandOnLinkDrop() { return _settings.DynInputAutoExpandOnLinkDrop; },
        set DynInputAutoExpandOnLinkDrop(state) { _settings.DynInputAutoExpandOnLinkDrop = state; RED.storage.update();},

        get DynInputAutoReduceOnLinkRemove() { return _settings.DynInputAutoReduceOnLinkRemove; },
        set DynInputAutoReduceOnLinkRemove(state) { _settings.DynInputAutoReduceOnLinkRemove = state; RED.storage.update();},

        get DynInputAudoRearrangeLinks() { return _settings.DynInputAudoRearrangeLinks; },
        set DynInputAudoRearrangeLinks(state) { _settings.DynInputAudoRearrangeLinks = state; RED.storage.update();},

        get ShowNodeToolTip() { return _settings.ShowNodeToolTip; },
        set ShowNodeToolTip(state) { _settings.ShowNodeToolTip = state; RED.storage.update();},

        get LassoSelectNodeMode() { return _settings.LassoSelectNodeMode; },
        set LassoSelectNodeMode(mode) { _settings.LassoSelectNodeMode = mode; RED.storage.update();},

        get addToGroupAutosize() { return _settings.addToGroupAutosize; },
        set addToGroupAutosize(state) { _settings.addToGroupAutosize = state; RED.storage.update(); },

        //get AllowLowerCaseWorkspaceName() { return _settings.AllowLowerCaseWorkspaceName; },
        //set AllowLowerCaseWorkspaceName(state) { _settings.AllowLowerCaseWorkspaceName = state; RED.storage.update();},
    };
    var settingsCategory = { label:"Global", expanded:false, popupText: "Global main setttings that don't belong to a specific category", bgColor:"#DDD" };

    var settingsEditor = {
        ClearOutputLog:       {label:"Clear output log", type:"button", action: ClearOutputLog},
        AutoDownloadJSON:     {label:"Auto Download JSON", type:"boolean", popupText:"When enabled this automatically downloads the current design as JSON after the page has loaded,<br>this can be used as a failsafe for important projects.<br><br>future improvement/additional functionality could involve a autosave based on a interval as well."},
        groups:               {label:"Groups", expanded:false, bgColor:"#DDD",
            items: {
                addToGroupAutosize:  { label:"Add to group autosize", type:"boolean", valueId:"", popupText: "make the group autosize to fit while hovering with new items" },
            }
        },
        nodes:                {label:"Nodes", expanded:false, bgColor:"#DDD",
            items: {
                ShowNodeToolTip:  {label:"Show Node Tooltip Popup.", type:"boolean", popupText: "When a node is hovered a popup is shown.<br>It shows the node-type + the comment (if this is a code type the comment is the code-text and will be shown in the popup)."},
                LassoSelectNodeMode:  { label:"Lasso Select Node Mode", type:"combobox", actionOnChange:true, options:[0,1], optionTexts:["Partial", "Complete"], popupText: "Selects how the node select lasso behaves<br><br>partial: the node:s don't need to be completely inside the lasso to be selected.<br><br>complete: the node:s need to be completely inside the lasso to be selected." },
            }
        },
        links:                {label:"Links", expanded:false, bgColor:"#DDD",
            items: {
                LinkDropOnNodeAppend:  {label:"Auto append dropped links", type:"boolean", popupText: "Auto append dropped links to any free input-slot<br>This makes it possible to just drop new 'input'-links to anywhere on a node to make them automatically add to any free input."},
                DynInputAutoExpandOnLinkDrop:   {label:"Dyn. Input Objects Auto Expand", type:"boolean", popupText:"Auto expand dynamic input objects when new links are dropped.<br><br>note. If 'Auto append dropped links' is disabled this will not work."},
                DynInputAutoReduceOnLinkRemove: {label:"Dyn. Input Objects Auto Reduce", type:"boolean", popupText:"Auto reduce dynamic input objects to the last used input.<br>i.e. it's the reverse of 'Auto Expand'"},
                DynInputAudoRearrangeLinks:     {label:"Dyn. Input Objects Auto Rearrange Input Links", type:"boolean", popupText:"(not implemented yet) Auto Rearrange 'dynamic input objects' links to empty slots"},
            }
        },
        transmitDebug:        {label:"Debug Output", expanded:false, bgColor:"#DDD",
            items: {
                LogAddNotificationInfo:     {label:"LogAddNotificationInfo", type:"boolean", popupText:"LogAddNotificationInfo"},
                LogAddNotificationWarning:     {label:"LogAddNotificationWarning", type:"boolean", popupText:"LogAddNotificationWarning"},
                LogAddNotificationError:     {label:"LogAddNotificationError", type:"boolean", popupText:"LogAddNotificationError"},
                LogAddNotificationOther:     {label:"LogAddNotificationOther", type:"boolean", popupText:"LogAddNotificationOther"},
            }
        },
        
        //AllowLowerCaseWorkspaceName:     {label:"Allow LowerCase WorkspaceName", type:"boolean", popupText:"When enabled this allows the workspace name to begin with lowercase letters.<br>This should be avoided in C++ exports as class names should allways begin with a uppercase to distinct them from the instance name."},
    };
    function ClearOutputLog() {
        RED.bottombar.info.setContent("");
    }
	//NOTE: code generation save function have moved to arduino-export.js
	
	
	var requirements;
	$('#btn-help').click(function(){showHelp();});

	function hideDropTarget() {
		$("#dropTarget").hide();
		RED.keyboard.remove(/* ESCAPE */ 27);
	}

	$('#chart').on("dragenter",function(event) {
		if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
			$("#dropTarget").css({display:'table'});
			RED.keyboard.add( 27,hideDropTarget); // ESCAPE
		}
	});

	$('#dropTarget').on("dragover",function(event) {
		if ($.inArray("text/plain",event.originalEvent.dataTransfer.types) != -1) {
			event.preventDefault();
		}
	})
	.on("dragleave",function(event) {
		hideDropTarget();
	})
	.on("drop",function(event) {
		var data = event.originalEvent.dataTransfer.getData("text/plain");
		
		hideDropTarget();
		if (data.startsWith("file")) return;
		console.log("flow dropped:" + data);
		RED.view.importNodes(data);
		event.preventDefault();
	});

	function download(filename, text) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);
	  
		element.style.display = 'none';
		document.body.appendChild(element);
	  
		element.click();
	  
		document.body.removeChild(element);
    }

    document.getElementById('btn-file-import').addEventListener('change', readSingleFile, false);
	function readSingleFile(e) {
        console.log("readSingleFile");
		var file = e.target.files[0];
		if (!file) {
		  return;
        }
        if (file.type == "application/json" || file.type == "text/plain")
            readJSONfile(file);
        else if (file.type == "application/x-zip-compressed")
            readZIPfile(file);
        else
            RED.notify("<strong>Warning</strong>: File type not supported:" + file.type + " @ " + file.name,"warning");
       
    }
    function readJSONfile(file)
    {
        var reader = new FileReader();
		reader.onload = function(e) {
		  var contents = e.target.result;
		  RED.storage.loadContents(contents);
		};
        reader.readAsText(file);
    }
    function readZIPfile(file)
    {
        var reader = new FileReader();
		reader.onload = function(e) {
            var rawContents = e.target.result;
            var zip = new JSZip();
            zip.loadAsync(rawContents).then(function(contents) {
                //console.log(contents.files);
                Object.keys(contents.files).forEach(function(filename) {

                    if (filename.toLowerCase().endsWith("gui_tool.json")) {
                        zip.file(filename).async('string').then(function(content) {
                            //console.warn(content);
                            RED.storage.loadContents(content);
                        });
                    }
                });
            });
            
		};
        reader.readAsArrayBuffer(file);
    }

    //document.getElementById('file-input-test').addEventListener('change', tryReadFileAtPath, false);

	function tryReadFileAtPath(e)
    {
        
        var file = e.target.files[0];
        if (!file) {
            return;
          }
          file.webkitRelativePath = "C:\\";
          file.name = "eula.1028.txt";
        console.warn(file);
        
          var reader = new FileReader();
          reader.onload = function(e) {
            var contents = e.target.result;
            console.warn(contents);
          };
          reader.readAsText(file);
    }
	
	
	$('#btn-saveTofile').click(function() { saveAsFile(); });
	function saveAsFile()
	{
		showSelectNameDialog(RED.arduino.settings.ProjectName + ".json", saveToFile);
	}
	
	function getConfirmLoadDemoText(filename)
	{
		return "<p> You are going to replace<br> <b>current flow</b>" +
			   " with <b>" + filename + "</b>.</p><br>" +
			   "<p>Are you sure you want to load?</p><br>" +
			   "<p>Note. your current design will be automatically downloaded as <b>" + RED.arduino.settings.ProjectName + ".json</b></p><br>"+
			   "If you want a different filename,<br>then use the<b> export menu - SaveToFile</b> instead.";
    }
    
    function addMenuItem(menuId, id, className, item, action) {
        var html = "";
        var uid = menuId+'-btn-'+id;
        if (item.dividerBefore != undefined && item.dividerBefore == true)
            html += '<li class="divider"></li>';
        //if (item.url != undefined) var url = item.url;
        //else var url = "";
        html += '<li><a id="'+uid+'" tabindex="-1" href="#"><i class="'+className+'"></i> '+item.label+'</a></li>';
        if (item.dividerAfter != undefined && item.dividerAfter == true)
            html += '<li class="divider"></li>';
        $("#" + menuId).append(html);
        $("#"+ uid).click(function() { action(id, item.label, item.url); });

        SetPopOver("#" + uid, item.description, "left");
    }

	function addDemoFlowsToMenu()
	{
        var menuName = "menu-demo-flows";
        var data = JSON.parse($("script[data-container-name|='ExamplesList']").html());
        var names = Object.getOwnPropertyNames(data);
        //console.log(names);
        $("#"+menuName).empty();
        for(var mi = 0; mi < names.length; mi++)
        {
            var name = names[mi];
            var item = data[name];
            addMenuItem(menuName, name, "fa fa-file", item, function(id,lbl,url) {
                verifyDialog("Confirm Load", "!!!WARNING!!!", getConfirmLoadDemoText(id), function(okPressed) { 
                    if (okPressed == false) return;
                    if (url != undefined) {
                        RED.notify("downloading JSON " + url, "info", null, 3000);
                        RED.main.httpDownloadAsync(url, 
                            function(data) {
                                saveToFile(RED.arduino.settings.ProjectName + ".json");
                                RED.storage.loadContents(data);
                            }
                            , 
                            function(err) {
                                RED.notify("could not download json" + err, "info", null, 3000);
                            }
                        ,20000);
                        return;
                    }
                    var contents = $("script[data-container-name|='"+id+"']").html();
                    var parsedContents = JSON.parse(contents);
                    // failsafe checks before loading data
                    if (parsedContents == undefined || contents == undefined) {
                        RED.notify("Error could not read example " + id, "danger", null, 10000);
                        return;
                    }
            
                    console.warn("load " + id);
                    //console.log("newFlowData:" + contents);
                    saveToFile(RED.arduino.settings.ProjectName + ".json");
                    RED.storage.loadContents(contents);
                    
                });
			});
        }

    }
    function updateProjectsMenu()
    {
        RED.IndexedDBfiles.listFiles("projects", function(items) {
            if (items == undefined) { RED.notify("error<br>no project files found<br>", "warning", null, 3000); return; }
            
            var menuName = "menu-projects";
            $("#" + menuName).empty();
            for(var mi = 0; mi < items.length; mi++)
            {
                var item = {label:items[mi], description:"Load " + items[mi]};
                addMenuItem(menuName, item.label.replace('.', '-'), "fa fa-file", item, function(id, label) {
                    console.warn("project clicked:" + label)
                    RED.IndexedDBfiles.fileRead("projects", label, function(name, contents) {
                        if (contents == undefined) { RED.notify("error<br>file not found:<br>" + name, "warning", null, 3000); return; }
            
                        var parsedContents = JSON.parse(contents);
                        // failsafe checks before loading data
                        if (parsedContents == undefined || contents == undefined || contents.trim().length == 0) {
                            RED.notify("Error could not read project " + id, "danger", null, 10000);
                            return;
                        }
                        console.error("load " + label);
                        //console.log("newFlowData:" + contents);
                        RED.nodes.sortNodes();
                        var nns = RED.nodes.createCompleteNodeSet({newVer:true});
                        RED.IndexedDBfiles.fileWrite("projects", RED.arduino.settings.ProjectName + ".json",JSON.stringify(nns), function(dirName,fileName) {
                            saveToFile(RED.arduino.settings.ProjectName + ".json");
                            RED.storage.loadContents(contents);
                        });
                    });
                });
            }
        });
    }
	
	// function save(force)
	//NOTE: code generation save function have moved to arduino-export.js
	
	function verifyDialog(dialogTitle, textTitle, text, cb, okBtnTxt, cancelBtnTxt) {
        if (okBtnTxt == undefined) okBtnTxt = "Ok";
        if (cancelBtnTxt == undefined) cancelBtnTxt = "Cancel";
		$( "#node-dialog-verify" ).dialog({
			modal: true,
			autoOpen: false,
			width: 500,
			title: dialogTitle,
			buttons: [
				{ text: okBtnTxt, click: function() { cb(true); $( this ).dialog( "close" );	} },
				{ text: cancelBtnTxt, click: function() { cb(false); $( this ).dialog( "close" ); }	}
			],
			open: function(e) { RED.keyboard.disable();	},
			close: function(e) { RED.keyboard.enable();	}

		});
		$( "#node-dialog-verify-textTitle" ).text(textTitle);
		$( "#node-dialog-verify-text" ).html(text);
		$( "#node-dialog-verify" ).dialog('open');
	}

	$( "#node-dialog-confirm-deploy" ).dialog({
			title: "Confirm deploy",
			modal: true,
			autoOpen: false,
			width: 530,
			height: 230,
			buttons: [
				{
					text: "Confirm deploy",
					click: function() {
						save(true);
						$( this ).dialog( "close" );
					}
				},
				{
					text: "Cancel",
					click: function() {
						$( this ).dialog( "close" );
					}
				}
			]
	});

	
	function saveToFile(name,useLocalStorage)
	{
		try
		{
            if (useLocalStorage != undefined && useLocalStorage == true) {
                var jsonString = RED.storage.getData();
            }
            else {
                var nns = RED.nodes.createCompleteNodeSet({newVer:true});
                var jsonString  = JSON.stringify(nns, null, 4);
            }
            
			download(name, jsonString);
		}catch (err)
		{

		}
	}
	function showSelectNameDialog(defaultFileName, cbOnOk, title)
	{
        if (title == undefined) title = "Confirm deploy";
		$( "#select-name-dialog" ).dialog({
			title: title,
			modal: true,
			autoOpen: true,
			width: 530,
			height: 230,
			buttons: [
				{
					text: "Ok",
					click: function() {
						//console.warn($( "#select-name-dialog-name" ).val());
						cbOnOk($( "#select-name-dialog-name" ).val())
						$( this ).dialog( "close" );
					}
				},
				{
					text: "Cancel",
					click: function() {
						$( this ).dialog( "close" );
					}
				}
			]
		});
		//if ($( "#select-name-dialog-name" ).val().trim().length == 0)
			$( "#select-name-dialog-name" ).val(defaultFileName);
		$( "#select-name-dialog" ).dialog('open');
	}
	//var midiOutputs = null;
	var midiInputs = null;
	let midiOutput = null;
	

	/*$('#btn-getMidiDevices').click(function() { getMidiDevices(); });
	function getMidiDevices()
	{
		
		RED.bottombar.show('output');
		navigator.requestMIDIAccess()
		.then(function(midiAccess) {
			const outputs = midiAccess.outputs.values();
			console.log(outputs);
			
			for (const output of outputs) {
				RED.bottombar.info.addContent(output);
				midiOutput = output;
			}
			//midiOutput = midiOutputs[0];
			midiOutput.send([0x90, 0x3c, 0x80]);
		});
		
		navigator.requestMIDIAccess()
		.then(function(midiAccess) {
			midiInputs = Array.from(midiAccess.inputs.values());
			console.log(midiInputs);
			RED.bottombar.info.addContent(midiInputs[0]);
		});
	}*/
	//$('#btn-midiSendNoOn').click(function() { midiOutput.send([0x90, 0x3c, 0x80]); });
	//$('#btn-midiSendNoOff').click(function() { midiOutput.send([0x80, 0x3c, 0x80]); });

	// from http://css-tricks.com/snippets/javascript/get-url-variables/
	function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if(pair[0] == variable){return pair[1];}
		}
		return(false);
	}

	function loadNodes() {
		
		/*setTimeout(function() {
			$("#menu-import").removeClass("disabled").addClass("btn-success");
			$("#menu-export").removeClass("disabled").addClass("btn-danger");
			$("#menu-ide").removeClass("disabled").addClass("btn-warning");
		}, 1000);*/

        $(".palette-scroll").show();
        $("#palette-search").show();
        
        RED.storage.load();

        // actually this needs to be done after loading project
        // as this setting belongs to the project
        if (settings.AutoDownloadJSON == true) {
            // true means to load direct from local storage
            // there was a glitch while saving from loaded structure at this time
            saveToFile(RED.arduino.settings.ProjectName + ".json", true);
        }

        RED.nodes.addClassTabsToPalette();
        RED.nodes.refreshClassNodes();
        RED.nodes.addUsedNodeTypesToPalette();
        RED.view.redraw();
	}

/*	$('#btn-node-status').click(function() {toggleStatus();});
	var statusEnabled = false;
	function toggleStatus() {
		var btnStatus = $("#btn-node-status");
		statusEnabled = btnStatus.toggleClass("active").hasClass("active");
		RED.view.status(statusEnabled);
	}
*/	
	function showHelp() {
		var dialog = $('#node-help');
		//$("#node-help").draggable({
		//        handle: ".modal-header"
		//});

		dialog.on('show',function() {
			RED.keyboard.disable();
		});
		dialog.on('hidden',function() {
			RED.keyboard.enable();
		});

		dialog.modal();
	}
	function update(picker, selector) {
		document.querySelector(selector).style.background = picker.toBackground()
	}
	function showHelp()
	{
		var mywindow = window.open('help.html', 'PRINT', 'height=400,width=600');
	}

	$('#btn-print').click(function() { PrintElem(); });
	function PrintElem()
	{
		var elemName = "chart"
		
		var mywindow = window.open('Audio System Design Tool for Teensy Audio Library', 'PRINT', 'height=400,width=600');

		mywindow.document.write('<html><head>');
		mywindow.document.write('<link rel="stylesheet" href="style.css" type="text/css" />'); 
		mywindow.document.write('</head><body >');
		//mywindow.document.write('<div id="chart">')
		mywindow.document.write(document.getElementById(elemName).outerHTML);
		mywindow.document.write('</body></html>');

		mywindow.document.close(); // necessary for IE >= 10
		mywindow.focus(); // necessary for IE >= 10*/
		mywindow.document.getElementById(elemName).style.top = "0px";
		mywindow.document.getElementById('grid-h-mi').style.display = "none";
		mywindow.document.getElementById('grid-h-ma').style.display = "none";
		mywindow.document.getElementById('grid-v-mi').style.display = "none";
		mywindow.document.getElementById('grid-v-ma').style.display = "none";
		mywindow.document.body.onload = function(){
			mywindow.print();
		};
		//mywindow.print();
		//mywindow.close();

		return true;
	}
	function SetPopOver(elementId, htmlText, location)
	{
		//console.error("setting popover for:" + elementId + "  " + htmlText);
		if (location == undefined) location = "bottom";
        $(elementId).unbind("mouseover mouseout");

        $(elementId).on("mouseover",function() {
			RED.view.showPopOver(elementId, true, htmlText, location); // true means html mode
		});
		$(elementId).on("mouseout", function() {
			$(elementId).popover("destroy");
		});
    }
    $('#btn-reloadWindow').click(function() { window.location.reload(); });

	//$('#btn-guiEditMode').click(function() { RED.view.settings.guiEditMode = true; });
	//$('#btn-guiRunMode').click(function() { RED.view.settings.guiEditMode = false; });
	$('#btn-guiRunEditMode').click(function() { RED.view.settings.guiEditMode = !$('#btn-guiRunEditMode').prop('checked'); });
    $('#btn-oscLiveUpdateMode').click(function() { RED.OSC.settings.LiveUpdate = $('#btn-oscLiveUpdateMode').prop('checked'); });
    $('#option-export-mode').change(function() { RED.arduino.settings.ExportMode = $('#option-export-mode').val(); });

    $('#btn-save').click(function() { RED.storage.update(); updateProjectsMenu(); });
    
    

	//***********************************************/
	//***********************************************/
	//*************MAIN ENTRY POINT******************/
	//***********************************************/
	//***********************************************/
	$(function()  // jQuery short-hand for $(document).ready(function() { ... });
	{	
        //console.warn("main $(function() {...}) exec"); // to see load order
		RED.NodeHelpManager.init(function() { // this makes sure that the addon help is loaded before anything else
            init();
        });
        
		
	});

    function init()
    {
        //RED.arduino.httpGetAsync("getJSON"); // load project from arduino if available
        RED.arduino.startConnectedChecker();
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then(function(persistent) {
                /*if (persistent)
                    RED.notify("Storage will not be cleared except by explicit user action<br>or automatic/manually cache clear<br>on firefox this automatic clear<br>can be put into a exception list for permanent data storage.<br>note the data will still be removed by manually cache clear.", "info", null, 10000);
                else
                    RED.notify("Storage may be cleared by the UA under storage pressure.", "info", null, 4000);*/
            });
        }
        else {
            //RED.notify("This browser don't support persistent storage!!!", "warning", null, 4000);
        }

        addDemoFlowsToMenu();
        RED.view.init();

        RED.export.init();
        RED.arduino.export.init();
        RED.arduino.export2.init();
        RED.arduino.export.osc.init();

        //SetButtonPopOver("#btn-
        SetPopOver("#menu-ide", "Arduino IDE/VSCODE IDE<br>Compie/Verify/Upload", "right");
        SetPopOver("#btn-save", "Save to localstorage<br>(shortcut CTRL+S)");
        SetPopOver("#btn-moveWorkSpaceLeft", "Move the current<br>workspace tab<br>one step to the left");
        SetPopOver("#btn-moveWorkSpaceRight", "Move the current<br>workspace tab<br>one step to the right");
        //SetButtonPopOver("#lbl-guiEditMode", "Sets the UI nodes<br>to edit mode");
        //SetButtonPopOver("#lbl-guiRunMode", "Sets the UI nodes<br>to Run mode");
        SetPopOver("#lbl-guiRunEditMode", "Toggles the UI nodes<br> between <b>Edit</b> and <b>Run</b> mode<br>When it's <b>unchecked</b> that means it's <b>edit</b> mode.<br><br>Keyboard shortcut is Ctrl+e");
        SetPopOver("#lbl-oscLiveUpdateMode", "Toggles the OSC live update functionality<br> i.e. when objects/links are added/removed/renamed");

        SetPopOver("#btn-saveTofile", "Uses the browser download function<br> to download the design as a JSON. <br>&nbsp;<br> It asks for the filename<br> the default filename is <br>the project name set in settings tab","left");
        
        SetPopOver("#btn-get-design-json", "Loads the design JSON from the IDE<br><br>Only functional when using the IDE Webserver extension.","left");
        SetPopOver("#btn-zoom-zero", "Shows the current zoom scale<br>when pressed the zoom is reset to 1.0", "top");

        SetPopOver("#lbl-file-import", "Uses the browser upload function<br>to upload a design to the Tool<br>the valid file types are:<br><br>1. JSON<br><br>2. exported ZIP file containing <br>&nbsp;&nbsp;&nbsp;&nbsp;JSON file named<br>&nbsp;&nbsp;&nbsp;&nbsp;GUI_TOOL.json","left");
        SetPopOver("#lbl-export-mode","This is just a 'maybe' future option,<br>think it could be used to check the design<br> and show errors if for example <br>a design can not be exported for the current mode<br>it can both highlight links and nodes that are not supported for the selected mode.<br><br>Can also be used together with one button to 'rule them all', <br>i.e. you select the mode and there is only one export button.");

        jscolor.presets.default = {
            closeButton:true
        };
        jscolor.trigger('input change');
        //jscolor.installByClassName("jscolor");

        $(".palette-spinner").show();

       // var metaData = $.parseJSON($("script[data-container-name|='InputOutputCompatibilityMetadata']").html());
        // RED.main.requirements is needed because $(function() executes at global scope, 
        // if we just set requirements without RED.main. it's gonna be located in global scope
        // and in that case later we cannot use RED.main.requirements because that is unassigned.
        RED.main.requirements = InputOutputCompatibilityMetadata["requirements"]; // RED.main. is used to clarify the location of requirements

        //var nodeCategories = $.parseJSON($("script[data-container-name|='NodeCategories']").html());
        RED.palette.doInit(NodeCategories); // NodeCategories is in NodeDefinitions.js

        // register built in node types
        //RED.nodes.Init_BuiltIn_NodeDefinitions(); // replaced with following that internally calls Init_BuiltIn_NodeDefinitions
        RED.nodes.init();
        if (OSC.Init())
            OSC.export.InitButtonPopups();
        else
            OSC.export.InitButtonPopups(true);
        
        RED.keyboard.add(/* ? */ 191, {shift: true}, function () {
            showHelp();
            d3.event.preventDefault();
        });
        RED.arduino.StartWebSocketConnection();
        RED.BiDirDataWebSocketBridge.StartWebSocketConnection();
        RED.projectStructure.createTab();
        loadNodes(); // this also loads the settings so it need to be before RED.settings.createTab();
        RED.storage.dontSave = true;
        RED.settings.createTab();
        RED.storage.dontSave = false;
        OSC.RegisterEvents();
        OSC.LiveUpdate.RegisterEvents();

        //RED.OCPview.init()

        // if the query string has ?info=className, populate info tab
        var info = getQueryVariable("info");
        if (info) {
            if (info.trim() != "")
                RED.sidebar.info.setHelpContent('', info);
            else
                RED.sidebar.info.clear(); // shows the welcome text
        }
        else
            RED.sidebar.info.clear(); // shows the welcome text

        var queryCmd = getQueryVariable("cmd");
        if (queryCmd && (queryCmd.trim() != "")) {
            queryCmd = queryCmd.trim();
            for (var i = 0; i < RED.settings.urlcmds.length; i++) {
                if (RED.settings.urlcmds[i].name == queryCmd) {
                    RED.settings.urlcmds[i].cb();
                    break;
                }
            }
                
        }
            

        $(".palette-spinner").hide();

        RED.events.emit("projects:load",{name:RED.arduino.settings.ProjectName});

        RED.sidebar.show(RED.devTest.settings.startupTabRightSidebar);

        RED.IndexedDBfiles.init( function() { 
            RED.arduino.board.readFromIndexedDB();
            updateProjectsMenu();
        });
        
        //console.error("parseInt on bool: " + parseInt("true") + " " + parseInt(true) + " " + parseInt("false") + " " + parseInt(false));
        //

        var version = localStorage.getItem("audio_library_guitool_version");
        if (version != RED.version) {
            
            showLatestUpdates("<strong>This is a new version (" + RED.version + "), or your browser cache has been cleared!</strong>");
        }
    }
    $('#btn-latest-updates').click(function() { showUpdateHistory(); });
    function showLatestUpdates(header){
        var notes = RED.vernotes[RED.version];
        if (notes == undefined) notes = "";
        else notes = "<br><br>" + notes;
        if (header == undefined) header = "";
        header += "<br><br><strong>Major Updates Fixes</strong>";
        RED.notify(header+notes+"<br><br> click this to close (it will only be shown once) the complete update history can be shown at @ 'topright menu' - 'Latest Updates')",
            "success", true, null, "50%", "20%", function() {
                localStorage.setItem("audio_library_guitool_version", RED.version); // this makes it much easier when doing dev. tests
            });
    } 

    function showUpdateHistory() {
        var header = "################################\n"+
                     "######## Update history ########\n"+
                     "################################\n";
        var notes = "";
        var names = Object.getOwnPropertyNames(RED.vernotes);
        for (var i = 0; i < names.length; i++) {
            notes += "\n######## version: " + names[i] + " ########\n" + RED.vernotes[names[i]] + "\n";
        }
        var textToShow = header+notes;

        RED.view.dialogs.showExportDialog("OSC Export to Dynamic Audio Lib", textToShow.split("<br>").join("\n").split("&nbsp;").join(" ").split("<strong>").join("#### ").split("</strong>").join(" ####"), " Version history ", {okText:"send", tips:""});
        //var mywindow = window.open('Audio System Design Tool for Teensy Audio Library - Update History', 'UpdateHistory', 'height=400,width=600');
/* remove this non working 'cross domain'-bullshit problem
		mywindow.document.write('<html><head>');
		mywindow.document.write('<link rel="stylesheet" href="style.css" type="text/css" />'); 
		mywindow.document.write('</head><body >');
		//mywindow.document.write('<div id="chart">')
		mywindow.document.write(textToShow);
		mywindow.document.write('</body></html>');

		mywindow.document.close(); // necessary for IE >= 10
		mywindow.focus(); // necessary for IE >= 10*/
        
    }

    function httpDownloadAsync(url, cbOnOk, cbOnError, timeout)
    {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState != 4) return; // wait for timeout or response
            if (xmlHttp.status == 200)
            {
                if (cbOnOk != undefined)
                    cbOnOk(xmlHttp.responseText);
                else
                    console.warn(cbOnOk + "response @ " + queryString + ":\n" + xmlHttp.responseText);
            }
            else if (cbOnError != undefined)
                cbOnError(xmlHttp.status + xmlHttp.responseText);
            else
                console.warn(queryString + " did not response = " + xmlHttp.status);
        };
        xmlHttp.open("GET", url, true); // true for asynchronous 
        if (timeout != undefined)
            xmlHttp.timeout = timeout;
        else
            xmlHttp.timeout = 2000;
        xmlHttp.send(null);
    }

    var filesToDownload = [];
    var filesToDownload_index = 0;
    var filesToDownload_cbProcess;
    var filesToDownload_cbDone;
    function updateNodeTypeAddons()
    {
        filesToDownload = [];
        var fileUrls = settings.NodeTypeAddons.split('\n');
        for (var i = 0; i < fileUrls.length; i++) {
            var fileUrl = fileUrls[i];
            if (fileUrl.startsWith("https://github.com")) {
                fileUrl = fileUrl.replace("https://github.com", "https://raw.githubusercontent.com");
                fileUrl = fileUrl.replace("/blob/", "/");
            }
            filesToDownload.push({url:fileUrl});
        }
        filesToDownload_index = 0;
        httpDownloadFilesTask();
    }
    var downloading = false;
    function httpDownloadAsyncFiles(files, cbProcess, cbDone) {
        filesToDownload = files;
        filesToDownload_cbProcess = cbProcess;
        filesToDownload_cbDone = cbDone;
        filesToDownload_index = 0;
        downloading = true;
        httpDownloadFilesTask();
    }

    function httpDownloadFilesTask()
    {
        if (downloading == false) return;
        if (filesToDownload_index < filesToDownload.length) {
            var file = filesToDownload[filesToDownload_index];
            console.log("downloading file: " + file.url);
            httpDownloadAsync(file.url, function(contents) {
                var file = filesToDownload[filesToDownload_index];
                console.log("download completed file: " + file.url);
                file.contents = contents;
                if (filesToDownload_cbProcess != undefined) filesToDownload_cbProcess(file, filesToDownload_index, filesToDownload.length);
                filesToDownload_index++;
                httpDownloadFilesTask();
            },
            function(error){
                var file = filesToDownload[filesToDownload_index];
                if (filesToDownload_cbProcess != undefined) filesToDownload_cbProcess(file, filesToDownload_index, filesToDownload.length);
                console.log("could not download: " + file.url);
                filesToDownload_index++;
                httpDownloadFilesTask();
            });
        }
        else { // download all finished
            console.log("download completed fileCount: " + filesToDownload.length);
            if (filesToDownload_cbDone != undefined) filesToDownload_cbDone(filesToDownload);
            
            /*for (var i = 0; i < filesToDownload.length; i++) {
                var file = filesToDownload[i];
                if (file.contents == undefined) continue;
                RED.IndexedDBfiles.fileWrite("otherFiles", "NodeAddons_" + file.url, file.contents);
                let parser = new DOMParser();
                let parsedHtml = parser.parseFromString(file.contents, 'text/html');
                let liElements = parsedHtml.querySelector("script[data-container-name|='NodeDefinitions']");
                console.log(liElements);
                //var metaData = $.parseJSON($(liElements).html());
            }*/
        }  
    }  
	return {
        defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,

		requirements:requirements,
		print:PrintElem,
		download:download,
		showSelectNameDialog:showSelectNameDialog,
        SetPopOver:SetPopOver,
        verifyDialog:verifyDialog,
        updateProjectsMenu:updateProjectsMenu,
        httpDownloadAsync:httpDownloadAsync,
        httpDownloadAsyncFiles:httpDownloadAsyncFiles,
        abortDownloadAsyncFiles: function() { downloading = false;

        }
	};
})();
