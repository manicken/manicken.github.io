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
        if (file.type == "application/json")
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

        SetButtonPopOver("#" + uid, item.description, "left");
    }

	function addDemoFlowsToMenu()
	{
        var menuName = "menu-demo-flows";
        var data = JSON.parse($("script[data-container-name|='ExamplesList']").html());
        var names = Object.getOwnPropertyNames(data);
        console.log(names);
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
                        var nns = RED.nodes.createCompleteNodeSet();
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
            var nns = RED.nodes.createCompleteNodeSet();
            var jsonString  = JSON.stringify(nns, null, 4);
			download(name, jsonString);
		}catch (err)
		{

		}
	}
	function showSelectNameDialog(defaultFileName, cbOnOk)
	{
		$( "#select-name-dialog" ).dialog({
			title: "Confirm deploy",
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
	function SetButtonPopOver(buttonId, htmlText, location)
	{
		//console.error("setting popover for:" + buttonId + "  " + htmlText);
		if (location == undefined) location = "bottom";
		$(buttonId).mouseover(function() {
			RED.view.showPopOver(buttonId, true, htmlText, location); // true means html mode
		});
		$(buttonId).mouseout(function() {
			$(this).popover("destroy");
		});
    }
    $('#btn-reloadWindow').click(function() { window.location.reload(); });

	//$('#btn-guiEditMode').click(function() { RED.view.settings.guiEditMode = true; });
	//$('#btn-guiRunMode').click(function() { RED.view.settings.guiEditMode = false; });
	$('#btn-guiRunEditMode').click(function() { RED.view.settings.guiEditMode = !$('#btn-guiRunEditMode').prop('checked'); });

    $('#btn-save').click(function() { RED.storage.update(); updateProjectsMenu(); });
    
    

	//***********************************************/
	//***********************************************/
	//*************MAIN ENTRY POINT******************/
	//***********************************************/
	//***********************************************/
	$(function()  // jQuery short-hand for $(document).ready(function() { ... });
	{	
        console.warn("main $(function() {...}) exec"); // to see load order
		//RED.arduino.httpGetAsync("getJSON"); // load project from arduino if available
		RED.arduino.startConnectedChecker();
		

		addDemoFlowsToMenu();
		RED.view.init();

		//SetButtonPopOver("#btn-
		SetButtonPopOver("#menu-ide", "Arduino IDE/VSCODE IDE<br>Compie/Verify/Upload", "right");
		SetButtonPopOver("#btn-save", "Save to localstorage<br>(shortcut CTRL+S)");
		SetButtonPopOver("#btn-moveWorkSpaceLeft", "Move the current<br>workspace tab<br>one step to the left");
		SetButtonPopOver("#btn-moveWorkSpaceRight", "Move the current<br>workspace tab<br>one step to the right");
		//SetButtonPopOver("#lbl-guiEditMode", "Sets the UI nodes<br>to edit mode");
		//SetButtonPopOver("#lbl-guiRunMode", "Sets the UI nodes<br>to Run mode");
        SetButtonPopOver("#lbl-guiRunEditMode", "Toggles the UI nodes<br> between Edit and Run mode<br>When it's checked that means it's edit mode.");
        
        SetButtonPopOver("#btn-deploy", "Exports the current tab only,<br><br>note. this is only intended for<br>exporting simple/classic designs,<br><br>and have currently no support<br>for Arrays and Tabs(classes)","left");
		SetButtonPopOver("#btn-deploy2", "Exports all tabs that have the setting<br>(export workspace set)<br><br>When using the IDE Webserver extension <br>the export dialog is not shown<br>and the export is seperated by<br>the individual files and sent to the IDE,<br><br> to force that dialog to show<br> use the setting<br>(Arduino-Export-'Force Show export dialog')","left");
		SetButtonPopOver("#btn-deploy2zip", "Exports All class-tabs,<br>CodeFile-nodes and<br>the design JSON<br>to seperate files and <br>then puts them all in a zipfile,<br>then asks for filename<br> then that zip file is<br>downloaded using the browser<br>download function.","left");
		SetButtonPopOver("#btn-saveTofile", "Uses the browser download function<br> to download the design as a JSON. <br>&nbsp;<br> It asks for the filename<br> the default filename is <br>the project name set in settings tab","left");
        SetButtonPopOver("#btn-deploy2singleLineJson", "Exports the design to a single line non formatted JSON,<br>that is usable when a design is shared,<br> for example on a forum.<br><br> tip. if shared the last ] could be on a new line <br>to make it easier to copy the whole line","left");
        SetButtonPopOver("#btn-pushJSON", "Push the JSON to the IDE<br><br>Only functional when using the IDE Webserver extension.","left");

        SetButtonPopOver("#btn-get-design-json", "Loads the design JSON from the IDE<br><br>Only functional when using the IDE Webserver extension.","left");
		SetButtonPopOver("#btn-zoom-zero", "Shows the current zoom scale<br>when pressed the zoom is reset to 1.0", "top");
        
        SetButtonPopOver("#lbl-file-import", "Uses the browser upload function<br>to upload a design to the Tool<br>the valid file types are:<br><br>1. JSON<br><br>2. exported ZIP file containing <br>&nbsp;&nbsp;&nbsp;&nbsp;JSON file named<br>&nbsp;&nbsp;&nbsp;&nbsp;GUI_TOOL.json","left");

		jscolor.presets.default = {
			closeButton:true
		};
		jscolor.trigger('input change');
		jscolor.installByClassName("jscolor");
		
		
		$(".palette-spinner").show();
		
		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);

		if (!server) {
            // running init makes sure that the database is upgraded before acessing it
            
            
            
			var metaData = $.parseJSON($("script[data-container-name|='InputOutputCompatibilityMetadata']").html());
			// RED.main.requirements is needed because $(function() executes at global scope, 
			// if we just set requirements without RED.main. it's gonna be located in global scope
			// and in that case later we cannot use RED.main.requirements because that is unassigned.
			RED.main.requirements = metaData["requirements"]; // RED.main. is used to clarify the location of requirements
			
			var nodeCategories = $.parseJSON($("script[data-container-name|='NodeCategories']").html());
			RED.palette.doInit(nodeCategories);//["categories"]);


			var nodeDefinitions = $.parseJSON($("script[data-container-name|='NodeDefinitions']").html());
			$.each(nodeDefinitions["nodes"], function (key, val) {
				RED.nodes.registerType(val["type"], val["data"]);
			});
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
            
            $(".palette-spinner").hide();
            
            RED.events.emit("projects:load",{name:RED.arduino.settings.ProjectName});

            RED.sidebar.show(RED.devTest.settings.startupTabRightSidebar);

            RED.IndexedDBfiles.init( function() { 
                RED.arduino.board.readFromIndexedDB();
                updateProjectsMenu();
            });
            //console.error("parseInt on bool: " + parseInt("true") + " " + parseInt(true) + " " + parseInt("false") + " " + parseInt(false));
			//
		} else {
			$.ajaxSetup({beforeSend: function(xhr){
				if (xhr.overrideMimeType) {
					xhr.overrideMimeType("application/json");
				}
			}});
			$.getJSON( "resources/nodes_def.json", function( data ) {
				var nodes = data["nodes"];
				$.each(nodes, function(key, val) {
					RED.nodes.registerType(val["type"], val["data"]);
				});
				RED.keyboard.add(/* ? */ 191,{shift:true},function(){showHelp();d3.event.preventDefault();});
				loadNodes();
				$(".palette-spinner").hide();
			})
		}
	});

	return {
		
		classColor:classColor,
		requirements:requirements,
		print:PrintElem,
		download:download,
		showSelectNameDialog:showSelectNameDialog,
        SetButtonPopOver:SetButtonPopOver,
        verifyDialog:verifyDialog,
        updateProjectsMenu:updateProjectsMenu
	};
})();
