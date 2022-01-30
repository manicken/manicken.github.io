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
        
        //AllowLowerCaseWorkspaceName: false,
    };
    var _settings = {
        AutoDownloadJSON:defSettings.AutoDownloadJSON,
        LogAddNotificationOther:defSettings.LogAddNotificationOther,
        LogAddNotificationInfo:defSettings.LogAddNotificationInfo,
        LogAddNotificationWarning:defSettings.LogAddNotificationWarning,
        LogAddNotificationError:defSettings.LogAddNotificationError,
        
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


        //get AllowLowerCaseWorkspaceName() { return _settings.AllowLowerCaseWorkspaceName; },
        //set AllowLowerCaseWorkspaceName(state) { _settings.AllowLowerCaseWorkspaceName = state; RED.storage.update();},
    };
    var settingsCategory = { label:"Global", expanded:false, popupText: "Global main setttings that don't belong to a specific category", bgColor:"#DDD" };

    var settingsEditor = {
        AutoDownloadJSON:     {label:"Auto Download JSON", type:"boolean", popupText:"When enabled this automatically downloads the current design as JSON after the page has loaded,<br>this can be used as a failsafe for important projects.<br><br>future improvement/additional functionality could involve a autosave based on a interval as well."},
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
	//NOTE: code generation save function have moved to arduino-export.js
	
	//var classColor = "#E6E0F8"; // standard
	var classColor = "#ccffcc"; // new
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
                Object.keys(contents.files).forEach(function(filename) {

                    if (filename.toLowerCase() == "gui_tool.json") {
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
        html += '<li><a id="'+uid+'" tabindex="-1" href="#"><i class="'+className+'"></i> '+item.label+'</a></li>';
        if (item.dividerAfter != undefined && item.dividerAfter == true)
            html += '<li class="divider"></li>';
        $("#" + menuId).append(html);
        $("#"+ uid).click(function() { action(id, item.label); });

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
            addMenuItem(menuName, name, "fa fa-file", item, function(id) {
                verifyDialog("Confirm Load", "!!!WARNING!!!", getConfirmLoadDemoText(id), function(okPressed) { 
                    if (okPressed == false) return;
                    
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

	
	function saveToFile(name)
	{
		try
		{
            var nns = RED.nodes.createCompleteNodeSet({newVer:true});
            var jsonString  = JSON.stringify(nns, null, 4);
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
		
		setTimeout(function() {
			$("#menu-import").removeClass("disabled").addClass("btn-success");
			$("#menu-export").removeClass("disabled").addClass("btn-danger");
			$("#menu-ide").removeClass("disabled").addClass("btn-warning");
		}, 1000);

        $(".palette-scroll").show();
        $("#palette-search").show();
        
        RED.storage.load();
        if (settings.AutoDownloadJSON == true) {
            saveToFile(RED.arduino.settings.ProjectName + ".json");
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
	function SetPopOver(buttonId, htmlText, location)
	{
		//console.error("setting popover for:" + buttonId + "  " + htmlText);
		if (location == undefined) location = "bottom";
        $(buttonId).unbind("mouseover mouseout");

        $(buttonId).on("mouseover",function() {
			RED.view.showPopOver(buttonId, true, htmlText, location); // true means html mode
		});
		$(buttonId).on("mouseout", function() {
			$(buttonId).popover("destroy");
		});
    }
    $('#btn-reloadWindow').click(function() { window.location.reload(); });

	//$('#btn-guiEditMode').click(function() { RED.view.settings.guiEditMode = true; });
	//$('#btn-guiRunMode').click(function() { RED.view.settings.guiEditMode = false; });
	$('#btn-guiRunEditMode').click(function() { RED.view.settings.guiEditMode = !$('#btn-guiRunEditMode').prop('checked'); });
    $('#btn-oscLiveUpdateMode').click(function() { RED.OSC.settings.LiveUpdate = $('#btn-oscLiveUpdateMode').prop('checked'); });

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

        //SetButtonPopOver("#btn-
        SetPopOver("#menu-ide", "Arduino IDE/VSCODE IDE<br>Compie/Verify/Upload", "right");
        SetPopOver("#btn-save", "Save to localstorage<br>(shortcut CTRL+S)");
        SetPopOver("#btn-moveWorkSpaceLeft", "Move the current<br>workspace tab<br>one step to the left");
        SetPopOver("#btn-moveWorkSpaceRight", "Move the current<br>workspace tab<br>one step to the right");
        //SetButtonPopOver("#lbl-guiEditMode", "Sets the UI nodes<br>to edit mode");
        //SetButtonPopOver("#lbl-guiRunMode", "Sets the UI nodes<br>to Run mode");
        SetPopOver("#lbl-guiRunEditMode", "Toggles the UI nodes<br> between <b>Edit</b> and <b>Run</b> mode<br>When it's <b>unchecked</b> that means it's <b>edit</b> mode.<br><br>Keyboard shortcut is Ctrl+e");
        SetPopOver("#lbl-oscLiveUpdateMode", "Toggles the OSC live update functionality<br> i.e. when objects/links are added/removed/renamed");


        SetPopOver("#btn-deploy", "Exports the current tab only,<br><br>note. this is only intended for<br>exporting simple/classic designs,<br><br>and have currently no support<br>for Arrays and Tabs(classes)","left");
        SetPopOver("#btn-deploy2", "Exports all tabs that have the setting<br>(export workspace set)<br><br>When using the IDE Webserver extension <br>the export dialog is not shown<br>and the export is seperated by<br>the individual files and sent to the IDE,<br><br> to force that dialog to show<br> use the setting<br>(Arduino-Export-'Force Show export dialog')","left");
        SetPopOver("#btn-deploy2zip", "Exports All class-tabs,<br>CodeFile-nodes and<br>the design JSON<br>to seperate files and <br>then puts them all in a zipfile,<br>then asks for filename<br> then that zip file is<br>downloaded using the browser<br>download function.","left");
        SetPopOver("#btn-saveTofile", "Uses the browser download function<br> to download the design as a JSON. <br>&nbsp;<br> It asks for the filename<br> the default filename is <br>the project name set in settings tab","left");
        SetPopOver("#btn-deploy2singleLineJson", "Exports the design to a single line non formatted JSON,<br>that is usable when a design is shared,<br> for example on a forum.<br><br> tip. if shared the last ] could be on a new line <br>to make it easier to copy the whole line","left");
        SetPopOver("#btn-pushJSON", "Push the JSON to the IDE<br><br>Only functional when using the IDE Webserver extension.","left");

        SetPopOver("#btn-get-design-json", "Loads the design JSON from the IDE<br><br>Only functional when using the IDE Webserver extension.","left");
        SetPopOver("#btn-zoom-zero", "Shows the current zoom scale<br>when pressed the zoom is reset to 1.0", "top");

        SetPopOver("#lbl-file-import", "Uses the browser upload function<br>to upload a design to the Tool<br>the valid file types are:<br><br>1. JSON<br><br>2. exported ZIP file containing <br>&nbsp;&nbsp;&nbsp;&nbsp;JSON file named<br>&nbsp;&nbsp;&nbsp;&nbsp;GUI_TOOL.json","left");
        SetPopOver("#lbl-export-mode","This is just a 'maybe' future option,<br>think it could be used to check the design<br> and show errors if for example <br>a design can not be exported for the current mode<br>it can both highlight links and nodes that are not supported for the selected mode.<br><br>Can also be used together with one button to 'rule them all', <br>i.e. you select the mode and there is only one export button.");

        jscolor.presets.default = {
            closeButton:true
        };
        jscolor.trigger('input change');
        jscolor.installByClassName("jscolor");

        $(".palette-spinner").show();

       // var metaData = $.parseJSON($("script[data-container-name|='InputOutputCompatibilityMetadata']").html());
        // RED.main.requirements is needed because $(function() executes at global scope, 
        // if we just set requirements without RED.main. it's gonna be located in global scope
        // and in that case later we cannot use RED.main.requirements because that is unassigned.
        RED.main.requirements = InputOutputCompatibilityMetadata["requirements"]; // RED.main. is used to clarify the location of requirements

        //var nodeCategories = $.parseJSON($("script[data-container-name|='NodeCategories']").html());
        RED.palette.doInit(NodeCategories);//["categories"]);

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

        RED.OCPview.init()

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
		
		classColor:classColor,
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
