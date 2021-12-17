/** Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013, 2014 IBM Corp.
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
RED.editor = (function() {

    var defSettings = {
        aceEditorTheme: "theme-chrome",
    }
    // Object.assign({}, ) is used to ensure that the defSettings is not overwritten
	var _settings = {
        aceEditorTheme: defSettings.aceEditorTheme,
	}
	var settings = {
		get aceEditorTheme() { return _settings.aceEditorTheme; },
		set aceEditorTheme(value) { _settings.aceEditorTheme = value;  RED.storage.update();},
	}
	var settingsCategory = { label:"Code Editor", expanded:false, bgColor:"#DDD"};

	var settingsEditor = {
		aceEditorTheme:         { label:"Ace Theme", type:"combobox", actionOnChange:true, valIsText:true, options:aceThemeList},// aceThemeList is from ace-theme-list.js
	}

	var editing_node = null;

	/**
	 * Validate a node 
	 * @param node - the node being validated
	 * @returns {boolean} whether the node is valid. Sets node.dirty if needed
	 */
	function validateNode(node) {
		var oldValue = node.valid;
		node.valid = validateNodeProperties(node, node._def.defaults, node);
		/*if (node._def._creds) {
			node.valid = node.valid && validateNodeProperties(node, node._def.credentials, node._def._creds);
		}*/
		if (oldValue != node.valid) {
			node.dirty = true;
		}
	}
	
	/**
	 * Validate a node's properties for the given set of property definitions
	 * @param node - the node being validated
	 * @param definition - the node property definitions (either def.defaults or def.creds)
	 * @param properties - the node property values to validate
	 * @returns {boolean} whether the node's properties are valid
	 */
	function validateNodeProperties(node, definition, properties) {
		var isValid = true;
		for (var prop in definition) {
			if (!validateNodeProperty(node, definition, prop, properties[prop])) {
				isValid = false;
			}
		}
		return isValid;
	}

	/**
	 * Validate a individual node property
	 * @param node - the node being validated
	 * @param definition - the node property definitions (either def.defaults or def.creds)
	 * @param property - the property name being validated
	 * @param value - the property value being validated
	 * @returns {boolean} whether the node proprty is valid
	 */
	function validateNodeProperty(node,definition,property,value) {
		var valid = true;
		if ("required" in definition[property] && definition[property].required) {
			valid = value !== "";
		}

		if (valid && definition[property].type) { // RED.nodes.getType(definition[property].type) && !("validate" in definition[property])) {
			if (definition[property].type == "int") {
                var val = parseInt(value);
                if (isNaN(val)) valid = false;
                else {
                    if (definition[property].minval) {
                        var minVal = parseInt(definition[property].minval);
                        if (isNaN(minVal)) valid = false;
                        if (value < minVal) valid = false;
                    }
                    if (definition[property].maxval) {
                        var maxVal = parseInt(definition[property].maxval);
                        if (isNaN(maxVal)) valid = false;
                        if (value > maxVal) valid = false;
                    }
                }
            }
            else if (definition[property].type == "float" && isNaN(parseFloat(value))) valid = false;
            else if (definition[property].type == "hexdec" && isNaN(parseInt(value, 16))) valid = false;
            else if (definition[property].type == "c_cpp_name" && isVarName(value,node) == false) valid = false;
		}
		return valid;
	}
    function isVarName(str,node) {
        if (typeof str !== 'string') {
            RED.notify("is not a string: " + str, "warning", null, 4000);
            return false;
        }
    
        if (str.includes(' ') == true) {
            RED.notify("cannot contain any spaces: >>>" + str + "<<<", "warning", null, 4000);
            return false;
        }

        var splitStarting = str.split('[');
        var splitEnding = str.split(']');
        
        if (splitStarting.length > 2 || splitEnding.length > 2) {
            RED.notify("array def. can only have one dimension ", "warning", null, 4000);
            return false;
        }

        if (splitStarting.length != splitEnding.length) {
            RED.notify("missing any of [ ] in array def.", "warning", null, 4000);
            return false;
        }
        str = splitStarting[0];

        try {
            new Function(str, 'var ' + str);
        } catch (_) {
            RED.notify("not a valid c/cpp name: " + str, "warning", null, 4000);
            return false;
        }
        if (RED.nodes.checkName(str, node.z, node)) {
            RED.notify("this name is allready used: " + str, "warning", null, 4000);
            return false;
        }
        return true;
    }

	/**
	 * Called when the node's properties have changed.
	 * Marks the node as dirty and needing a size check.
	 * Removes any links to non-existant outputs.
	 * @param node - the node that has been updated
	 * @returns {array} the links that were removed due to this update
	 */
	function updateNodeProperties(node) {
		node.resize = true;
		node.dirty = true;
		var removedLinks = [];
		if (node.type == "group") return removedLinks;
		if (node.outputs < node.ports.length) {
			while (node.outputs < node.ports.length) {
				node.ports.pop();
			}
			RED.nodes.eachLink(function(l) {
					if (l.source === node && l.sourcePort >= node.outputs) {
						removedLinks.push(l);
					}
			});
			for (var l=0;l<removedLinks.length;l++) {
				RED.nodes.removeLink(removedLinks[l]);
			}
		} else if (node.outputs > node.ports.length) {
			while (node.outputs > node.ports.length) {
				node.ports.push(node.ports.length);
			}
		}
		return removedLinks;
	}

	function editNode_dialog_OK_pressed()
	{
		var changes = {};
		var changed = false;
		var wasDirty = RED.view.dirty();
		var d;

		if (editing_node._def.defaults) {
			for (d in editing_node._def.defaults) {
				if (editing_node._def.defaults.hasOwnProperty(d)) {
					var input = $("#node-input-"+d);
					//console.warn(input);
					var newValue;
					if (input.attr('type') === "checkbox") {
						newValue = input.prop('checked');
					} else {
						//console.warn("input.attr('type'):" +input.attr('type') + " " + d);
						newValue = input.val();
					}
					if (newValue == null) continue;
					if (editing_node[d] == newValue)  continue;

					if (editing_node.type == "UI_ListBox")
					{
						if (d == "items")
						{
							var newItemCount = newValue.split("\n").length;
							var oldItemCount = editing_node.items.split("\n").length;

							if (newItemCount != oldItemCount) editing_node.itemCountChanged = true;
							else if (newValue.localeCompare(editing_node.items) != 0) editing_node.anyItemChanged = true;
						}
						else if (d == "itemTextSize")
						{
							if (newValue.localeCompare(editing_node.itemTextSize) != 0) editing_node.anyItemChanged = true;
						}

                    }
                    if (d == "color")
                        editing_node.bgColor = newValue;
					changes[d] = editing_node[d];
					if (typeof editing_node[d] == "number")
						newValue = parseFloat(newValue);
                    editing_node[d] = newValue;
                    //console.warn(d, "changed ses");
					changed = true;
				}
			}
		}

		var removedLinks = updateNodeProperties(editing_node);
		if (changed != undefined && changed == true) {
			var wasChanged = editing_node.changed;
            editing_node.changed = true;
            RED.events.emit("nodes:change",editing_node);
            if (changes.name != undefined)
                RED.events.emit("nodes:renamed",editing_node,changes.name,editing_node.name);
			RED.view.dirty(true);
			RED.history.push({t:'edit',node:editing_node,changes:changes,links:removedLinks,dirty:wasDirty,changed:wasChanged});
		}
		editing_node.dirty = true;
		editing_node.resize = true;
		validateNode(editing_node);
		if (editing_node._def.useAceEditor != undefined)
		{ 
			var editor = ace.edit("aceEditor");
            if (editing_node._def.useAceEditorCodeFieldName != undefined)
                editing_node[editing_node._def.useAceEditorCodeFieldName] = editor.getValue();
            else // default
			    editing_node.comment = editor.getValue();

                
		}

		editing_node.bgColor = $("#node-input-color").val();
		if (editing_node.type == "UI_ListBox")
			editing_node.itemBGcolor = $("#node-input-itemBGcolor").val();
		else if (editing_node.type == "UI_Piano")
		{
			editing_node.whiteKeysColor = $("#node-input-whiteKeysColor").val();
			editing_node.blackKeysColor = $("#node-input-blackKeysColor").val();
		}
		RED.view.redraw();
		console.log("edit node saved!");
		RED.storage.update();
	}
	function edit_dialog_apply()
	{
		if (editing_node) {
			editNode_dialog_OK_pressed(); // found above
		} else if (RED.view.state() == RED.state.EXPORT) {
			console.error("RED.view.state() == RED.state.EXPORT");
			if (/library/.test($( "#dialog" ).dialog("option","title"))) {
				//TODO: move this to RED.library
				var flowName = $("#node-input-filename").val();
				if (!/^\s*$/.test(flowName)) {
					$.post('library/flows/'+flowName,$("#node-input-filename").attr('nodes'),function() {
							RED.library.loadFlowLibrary();
							RED.notify("Saved nodes","success");
					});
				}
			}
		} else if (RED.view.state() == RED.state.IMPORT) {
			console.error("RED.view.state() == RED.state.IMPORT");
            var text = $("#node-input-import").val();
            if (text.startsWith("http")) {
                RED.notify("downloading JSON " + text, "info", null, 3000);
                RED.main.httpDownloadAsync(text, 
                    function(data) {
                        RED.view.importNodes(data);
                    }
                    , 
                    function(err) {
                        RED.notify("could not download json" + err, "info", null, 3000);
                    }
                );
            }
                
            else
			    RED.view.importNodes(text);
		}
		else
		{
			console.error("editor no mode");
		}
	}
	function init_edit_dialog()
	{
		$( "#dialog" ).dialog({
				modal: true,
				autoOpen: false,
				closeOnEscape: false,
				width: 500,
                position: {at:"top"},
				buttons: [
					{
						id: "btnEditorRunScript",
						text: "Run script",
						click: function() {
							var editor = ace.edit("aceEditor");
							RED.view.evalHere(editor.getValue(), editing_node);
						}
					},
					{
						id: "btnEditorApply",
                        class:"btn",
						text: "Apply",
						click: function() {
							edit_dialog_apply();
						}
					},
					{
                        id: "btnEditorOk",
                        class:"btn",
						text: "Ok",
						click: function() {
							edit_dialog_apply();
							$( this ).dialog( "close" );
						}
					},
					{
						text: "Cancel",
						click: function() {
							$( this ).dialog( "close" );
						}
					}
				],
				resize: function(e,ui) {
					if (editing_node != undefined) {

						$(this).dialog('option',"sizeCache-"+editing_node.type,ui.size);
						//RED.console_ok("editor height:" + ui.size.height);
						//RED.console_ok("editor this height:"+$(this).height())
						var aceEditorExist = document.getElementById("aceEditor");
                        if (aceEditorExist != null)
						{
							//console.log("editor window height:"+$(this).height());
                            /*if (editing_node._def.aceEditorOffsetHeight != undefined)
                                $("#aceEditor").height($(this).height() - editing_node._def.aceEditorOffsetHeight);
                            else
							    $("#aceEditor").height($(this).height() - 120);*/

                            if (editing_node._def.aceEditorOffsetHeight != undefined)
                                $("#aceEditor").css("height", $(this).height() - editing_node._def.aceEditorOffsetHeight);
                            else
                                $("#aceEditor").css("height", $(this).height() - 100);
							var aceEditor = ace.edit("aceEditor");
							aceEditor.resize(true);
							$(this).scrollTop(aceEditor.scrollHeight);
						}
					}
				},
				open: function(e) {
					RED.keyboard.disable();
					if (editing_node != undefined) {
						
						var size = $(this).dialog('option','sizeCache-'+editing_node.type);
						if (size != undefined) {
							$(this).dialog('option','width',size.width);
							$(this).dialog('option','height',size.height);
						}
                        
						var aceEditor = $("#aceEditor");
						if (aceEditor != undefined)
						{
                            if (editing_node._def.aceEditorOffsetHeight != undefined)
                                aceEditor.css("height", $(this).height() - editing_node._def.aceEditorOffsetHeight);
                            else
							    aceEditor.css("height", $(this).height() - 100);
							$(this).scrollTop(aceEditor.scrollHeight);
							
						}
						$("#node-input-color").val(editing_node.bgColor);
						if (editing_node.type == "UI_ListBox")
							$("#node-input-itemBGcolor").val(editing_node.itemBGcolor);
						else if (editing_node.type == "UI_Piano")
						{
							$("#node-input-whiteKeysColor").val(editing_node.whiteKeysColor);
							$("#node-input-blackKeysColor").val(editing_node.blackKeysColor);
						}
						jscolor.install();
					}

				},
				close: function(e) {
					RED.keyboard.enable();

					if (RED.view.state() != RED.state.IMPORT_DRAGGING) {
						RED.view.state(RED.state.DEFAULT);
					}
					$( this ).dialog('option','height','auto');
					$( this ).dialog('option','width','500');
					if (editing_node) {
						RED.sidebar.info.refresh(editing_node);
						RED.view.resetMouseVars();
						console.log("edit node done!");
					}
					//RED.sidebar.config.refresh();
					editing_node = null;
				}
		});
	}

	/**
	 * Populate the editor dialog input field for this property
	 * @param node - the node being edited
	 * @param property - the name of the field
	 * @param prefix - the prefix to use in the input element ids (node-input|node-config-input)
	 */
	function preparePropertyEditor(node,property,prefix) {
		//console.error("preparePropertyEditor:" + node.type + ":" + prefix+"-"+property);
		var input = $("#"+prefix+"-"+property);
		if (input.attr('type') === "checkbox") {
			input.prop('checked',node[property]);
		} else {
			var val = node[property];
			if (val == null) {
				val = "";
			}
			input.val(val);
		}
	}

	/**
	 * Add an on-change handler to revalidate a node field
	 * @param node - the node being edited
	 * @param definition - the definition of the node
	 * @param property - the name of the field
	 * @param prefix - the prefix to use in the input element ids (node-input|node-config-input)
	 */
	function attachPropertyChangeHandler(node,property,prefix) {
		$("#"+prefix+"-"+property).change(function() {
			if (!validateNodeProperty(node, node._def.defaults , property,this.value)) {
				$(this).addClass("input-error");
                document.getElementById("btnEditorApply").disabled = true;
                document.getElementById("btnEditorOk").disabled = true;
                $("#btnEditorApply").addClass("unclickablebutton");
                $("#btnEditorOk").addClass("unclickablebutton");
			} else {
				$(this).removeClass("input-error");
                document.getElementById("btnEditorApply").disabled = false;
                document.getElementById("btnEditorOk").disabled = false;
                $("#btnEditorApply").removeClass("unclickablebutton");
                $("#btnEditorOk").removeClass("unclickablebutton");
			}
		});
	}

	/**
	 * Prepare all of the editor dialog fields
	 * @param node - the node being edited
	 * @param definition - the node definition
	 * @param prefix - the prefix to use in the input element ids (node-input|node-config-input)
	 */
	function prepareEditDialog(node,prefix) {
		if (node._def.useAceEditor != undefined) { 
			RED.editor.ace.init(node);
		}
		
		for (var d in node._def.defaults) {
			if (node._def.defaults.hasOwnProperty(d)) {
				preparePropertyEditor(node,d,prefix);
				attachPropertyChangeHandler(node,d,prefix);
			}
            else
            {
                console.warn("have no own property:" + d);
            }
		}
	}

	function showEditDialog(node) {
		editing_node = node;
		
		init_edit_dialog();

		if (node.type != "UI_ScriptButton")
			$("#btnEditorRunScript").hide();
		if (node.type == "group")
		{
			jscolor.presets.default = {
				format:'rgba', closeButton:true, shadow:true
			};
		}
		else
		{
			jscolor.presets.default = {
				format:'hex', closeButton:true, shadow:true
			};
		}
		RED.view.state(RED.state.EDITING);

		editing_node = node;
		

        if (node._def.editor != undefined && node._def.editor === "autogen") {
            // autogenerate editor-form from node._def.defaults
            // this makes it easier when having arbitrary inputs/outputs or other special cases
            // usually only used for node def. addons (as no space consuming html is needed)
            var data = "";
            for (var d in node._def.defaults) {
                if (!node._def.defaults.hasOwnProperty(d)) continue;

                var propEditor = node._def.defaults[d].editor;
                if (propEditor == undefined) continue; // edit disabled
                data += GetEditorLine_Input(propEditor, d);
            }
            var form = $("#dialog-form");
			$(form).html(data);
            prepareEditDialog(node, "node-input");
            $( "#dialog" ).dialog("option","title","Edit "+node.type+" node").dialog( "open" );
        }
        else // use advanced raw-html custom editors
        {
            var editorType = "";
            // first check if have own editor
            var ifHaveOwnEditor = $("script[data-template-name|='" + node.type + "']");
            if (ifHaveOwnEditor.length != 0) 
            {	editorType = node.type; /*console.log("use type editor:" + editorType);*/}
            else // use global editor
            {	editorType = "NodesGlobalEdit"; /*console.log("use global editor");*/}
            
            RED.view.getForm("dialog-form", editorType, function (d, f) {
                prepareEditDialog(node, "node-input");
                $( "#dialog" ).dialog("option","title","Edit "+node.type+" node").dialog( "open" );
            });
        }
	}
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }

    function GetEditorLine_Input(editor, propName) {
        var type=(editor.type!=undefined)?editor.type:"text";
        var rowClass=(editor.rowClass!=undefined)?editor.rowClass:"form-row";
        var label=(editor.label!=undefined)?editor.label:capitalizeFirstLetter(propName);

        var html = '<div class="'+rowClass+'">\n';
        html += '<label for="node-input-'+propName+'"><i class="fa fa-tag"></i> '+label+'</label>\n';
        if (type == 'text')
            html += '<input type="text" id="node-input-'+propName+'" placeholder="'+label+'" autocomplete="off">\n';
        else if (type == 'color')
            html += '<a class="node-input-color-group-bg"><input id="node-input-'+propName+'" data-jscolor=""></a>\n';

        
        html += '</div>\n'
        return html;
    }

	return {
        defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        
		init_edit_dialog:init_edit_dialog,
		edit: showEditDialog,
		//editConfig: showEditConfigNodeDialog,
		validateNode: validateNode,
		updateNodeProperties: updateNodeProperties, // TODO: only exposed for edit-undo
		editing_node:editing_node
	}
})();
