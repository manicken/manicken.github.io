RED.editor.ace = (function() {

    var aceLangTools = ace.require("ace/ext/language_tools");
	var lang = ace.require("../lib/lang");
	var rootCompletions = [];
	var classCompletions = []; // TODO: replace static typed @ AceAutoCompleteKeywords.js to fetch data from built in help @ index.html
	var defaultCompleters = {};
	
	
	var completer = {
		getCompletions: function(editor, session, pos, prefix, callback) {
				callback(null, rootCompletions);
			},
		getDocTooltip: function(item) {
			var caption = "";
			if (item.type != undefined) caption = item.type;			
			else if (item.name == undefined) caption = item.caption;
			else caption = item.name;
			item.docHTML = [
				"<b>", caption, "</b>", "<hr></hr>",
				item.html
			].join("");
			item.toolTipFixedWidth = "500px";
		}
	}
	var classCompleter= {
		getCompletions: function(editor, session, pos, prefix, callback) {
			callback(null, classCompletions);
		},
		getDocTooltip: function(item) {
			var name = "";
			if (item.name == undefined) name = item.caption;
			else name = item.name;
			item.docHTML = [
				"<b>", name, "</b>", "<hr></hr>",
				item.meta
			].join("");
			item.toolTipFixedWidth = "300px";
		}
	}
	
	aceLangTools.addCompleter(completer);

	function init(node)
	{
		rootCompletions = RED.nodes.getWorkspaceNodesAsCompletions(node.z);
			
		classCompletions = AceAutoComplete.Extension;
		//classCompletions = ; // clear array, this also works: completionsSub.splice(0,completionsSub.length);
		//AceAutoCompleteKeywords.forEach(function(kw) { // AceAutoCompleteKeywords is in AceAutoCompleteKeywords.js
		//	classCompletions.push(kw);
		//}); // this is only development test it could search help for functions
		// of could have global function def list with typenames 
		// this global def could be used by the help tab to make sure
		// that there is only one text for each type

		currentCompletions = rootCompletions; // default

		var aceEditor = ace.edit("aceEditor");
		
		//aceEditor.completers = [completer];

		var aceTheme = "ace/theme/" + RED.editor.settings.aceEditorTheme
		console.log("setting ace editor theme to:" + aceTheme)
		aceEditor.setTheme(aceTheme, function() { console.log("ace theme changed");});
		//$(".ui-dialog").css('background-color', "#282a36"); 
		//$(".ui-dialog").css('color', "#f8f8f2"); 
		
		aceEditor.setOptions({
			enableBasicAutocompletion: true,
            enableSnippets: true,
            tabSize: RED.arduino.settings.CodeIndentations,
			enableLiveAutocompletion: true,
		});
		
		
		if (node._def.useAceEditor == "javascript")
		{
			aceEditor.session.setMode("ace/mode/javascript", function() { console.log("ace mode changed to javascript");});
			console.warn("ace editor in javascript mode");
		}
		else if (node._def.useAceEditor == "c_cpp")
		{
			aceEditor.session.setMode("ace/mode/c_cpp", function() { console.log("ace mode changed to c_cpp");});
			init_aceEditor_c_cpp_mode(aceEditor);
			console.warn("ace editor in c_cpp mode");
		}

		if (node.comment == undefined) node.comment = new String("");
		aceEditor.setValue(node.comment);
		aceEditor.session.selection.clearSelection();
	}

	function init_aceEditor_c_cpp_mode(aceEditor)
	{
		defaultCompleters = aceEditor.completers;
		console.warn("aceEditor.completers:");
				console.warn(aceEditor.completers);

		aceEditor.commands.addCommand({
			name: "dotCommand",
			bindKey: { win: ".", mac: "." },
			exec: function () {
				var pos = aceEditor.selection.getCursor();
				var session = aceEditor.session;
				console.log(pos);
				var curLine = (session.getDocument().getLine(pos.row)).trim();
				var curTokens = curLine.slice(0, pos.column).split(/\s+/);
				var curCmd = curTokens[0];
				if (!curCmd) return;
				var lastToken = curTokens[curTokens.length - 1];
		
				aceEditor.insert(".");            
				lastToken = RED.nodes.getArrayDeclarationWithoutSizeSyntax(lastToken);
				var split = lastToken.split(".");
				console.error(split);
				if (split.length > 1) lastToken = split[split.length-1];

				// here it need also need to check the type
				// to get correct function list
				var tokenType = "";
				for (var i = 0; i < rootCompletions.length; i++) { // AceAutoCompleteKeywords is in AceAutoCompleteKeywords.js
					var kw = rootCompletions[i];
					if (kw.name == lastToken)
					{
						tokenType = kw.type;
						break;
					}
					else
					{
						console.warn("kw.name:" + kw.name);
					}
				}
				if (tokenType == "")
				{
					for (var i = 0; i < classCompletions.length; i++) { // AceAutoCompleteKeywords is in AceAutoCompleteKeywords.js
						var kw = classCompletions[i];
						if (kw.name == lastToken)
						{
							tokenType = kw.type;
							break;
						}
						else
						{
							console.warn("kw.name:" + kw.name);
						}
					}
				}
				console.log("lastToken:" + lastToken + " @ " + tokenType);
				defaultCompleters = aceEditor.completers; // save default
				
				var byToken = [];
				var wsId = RED.nodes.isClass(tokenType);
				if (wsId)
				{
					//byToken = RED.nodes.getAllFunctionNodeFunctions(wsId);
					byToken = RED.nodes.getWorkspaceNodesAsCompletions(wsId);
					// TODO: also make it fetch AudioObjects
				}
				else
				{
					// here we get data from html
					byToken = AceAutoComplete.getFromHelp(tokenType);
				}

				if (byToken == undefined) return;

				if (byToken.length != 0) // AceAutoComplete.ClassFunctions[tokenType] != null)
				{
					classCompletions = byToken;//AceAutoComplete.ClassFunctions[tokenType];
				}
				else
				{
					classCompletions = AceAutoComplete.Extension;
				}

				aceEditor.completers = [classCompleter]; // only show class objects

				aceEditor.execCommand("startAutocomplete");
				return lastToken;
			}
		});
		aceEditor.commands.on("afterExec", function (e) {
			//console.log("afterExec:" + e.command.name + ":" + e.args + ":" + e.returnValue);
			if (e.command.name == "insertstring")
			{
				if (/^[\w.]$/.test(e.args)) {
					//RED.console_ok("hello");
					aceEditor.execCommand("startAutocomplete");
				}
				if (e.args.endsWith(";"))
				{
					//RED.console_ok("insertString ended");
					aceEditor.completers = defaultCompleters; // reset to default
				}
				else if (e.args == "\n")
				{
					//console.log("newline");
				}
			}
			else if (e.command.name == "backspace")
			{
				aceEditor.completers = defaultCompleters; // reset to default
			}
			else if (e.command.name == "Return")
			{
				aceEditor.completers = defaultCompleters; // reset to default
			}
			else if (e.command.name == "Esc")
			{
				aceEditor.completers = defaultCompleters; // reset to default
			}
			else if (e.command.name == "dotCommand")
			{
				// e.returnValue is the last token
				//console.log(e.returnValue);
				//console.trace("dotCommand trace");
			}
			//
		});
	}

    return {
        init:init
    }
})();
