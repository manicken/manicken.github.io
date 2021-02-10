/** Added in addition to original Node-Red source, for audio system visualization
 * this file is intended for testing new functionality that is in development
 * when the functions are completed they should be removed from this file 
 * and put at the right file.
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

RED.devTest = (function() {

    var defSettings = {
        testPost: "data",
        testGet: "cmd",
        testWsSend: "data",
        getFuncHelp: "AudioEffectFade",
        startupTabRightSidebar: "info"
    };
    // Object.assign({}, ) is used to ensure that the defSettings is not overwritten
    var _settings = {
        testPost: defSettings.testPost,
        testGet: defSettings.testGet,
        testWsSend: defSettings.testWsSend,
        getFuncHelp: defSettings.getFuncHelp,
        startupTabRightSidebar: defSettings.startupTabRightSidebar
    };

    var settings = {
        get testPost() { return _settings.testPost; },
		set testPost(value) { _settings.testPost = value; RED.arduino.httpPostAsync(value); RED.storage.update();},

        get testGet() { return _settings.testGet; },
		set testGet(value) { _settings.testGet = value; RED.arduino.httpGetAsync(value); RED.storage.update();},

        get testWsSend() { return _settings.testWsSend; },
        set testWsSend(value) { _settings.testWsSend = value; RED.BiDirDataWebSocketBridge.SendToWebSocket(value); RED.storage.update();},
        
        get getFuncHelp() { return _settings.getFuncHelp; },
		set getFuncHelp(value) { _settings.getFuncHelp = value; console.log(AceAutoComplete.getFromHelp(value)); },

        get startupTabRightSidebar() { return _settings.startupTabRightSidebar; },
		set startupTabRightSidebar(value) { _settings.startupTabRightSidebar = value; RED.storage.update();},
    }

    var settingsCategory = { label:"Development Tests", expanded:false, bgColor:"#DDD" };
    var settingsEditor = {
        startupTabRightSidebar: { label:"Startup Right Sidebar", type:"combobox", actionOnChange:true, options:["info", "settings", "project"] },
        testSelectFileByApi:    { label:"test select file from API server", type:"button", action: testSelectFileByApi},
        testGithubNodeAddonsParser: { label:"test github node addons .h file GUI tag parser", type:"string", action: testGithubNodeAddonsParser, defValue: "https://api.github.com/repos/chipaudette/OpenAudio_ArduinoLibrary/contents/"},
        testGithubNodeAddonsParser2: { label:"test github node addons .h file GUI tag parser2", type:"string", action: testGithubNodeAddonsParser, defValue: "https://api.github.com/repos/PaulStoffregen/Audio/contents/"},
        testImportFiles:        { label:"test import file(s)", type:"button", isFileInput:true, buttonClass:"btn-primary btn-sm", action: testImportFiles},
        testExportArduinoPref:  { label:"test export arduino pref file", type:"button", action: testExportArduinoPref},
        testExportPlatformIOini:{ label:"test export PlatformIO.ini file", type:"button", action: testExportPlatformIOini},
        testExportMakeFile:     { label:"test export make file", type:"button", action: testExportMakeFile},
        convertFileToOneLiner:  { label:"convert file to<br>one liner string<br>in new file", type:"button", isFileInput:true, buttonClass:"btn-primary btn-sm", action: convertFileToOneLineString},
		testPost:               { label:"test post", type:"string"},
		testGet:                { label:"test get", type:"string"},
        testWsSend:             { label:"test ws send", type:"string"},
        getFuncHelp:            { label:"get func help", type:"string"},
        printNewWsStruct:       { label:"print new ws struct", type:"button", buttonClass:"btn-primary btn-sm", action: createAndPrintNewWsStruct},
        consoleColorTest:       { label:"console color test", type:"button", buttonClass:"btn-primary btn-sm", action: function() {RED.devTest.console_logColor("Hello World"); RED.console_ok("Test of console_ok"); }},
        getHelpAtServer:        { label:"get help @ github server", type:"button",  buttonClass:"btn-primary btn-sm", action: testGetHelpFromServer},
        
        
    };
    var filesToDownload = [];
    var filesToDownload_index = 0;
    var GithubNodeAddonsUrl = "";
    var timeStart = 0;
    var timeEnd = 0;
    var testGithubNodeAddonsParser_window;
    var testGithubNodeAddonsParser_table;

    function testGithubNodeAddonsParser(url) {
        timeStart = performance.now();
        GithubNodeAddonsUrl = url;
        filesToDownload = [];
        testGithubNodeAddonsParser_window = window.open('', '', 'height=800,width=800');
        if (testGithubNodeAddonsParser_window == undefined) {RED.notify("could not open testGithubNodeAddonsParser_window<br>please try again", "warning", null, 4000); return;}
        
        var rawHtml = '<html>';
        rawHtml += '<head><style>';
        //rawHtml += 'tr {outline: thin solid;}';
        rawHtml += 'td {border: 1px solid #000; padding:10px;}';
        rawHtml += 'table {height:100%; width:100%}';
        rawHtml += '.tableDiv {position:absolute; top:30px; bottom:10px; overflow:auto;}';
        rawHtml += '#divDownloadTime {border: 2px solid #F00;}';
        rawHtml += '</style></head>';
        rawHtml += '<body><div id="divDownloadTime">downloading...</div>';
        rawHtml += '<div class="tableDiv"><table id="filesTable">';
        rawHtml += '</div></table></body></html>';
        testGithubNodeAddonsParser_window.document.write(rawHtml);
        testGithubNodeAddonsParser_window.document.close(); // necessary for IE >= 10
        testGithubNodeAddonsParser_window.focus();
        testGithubNodeAddonsParser_table = testGithubNodeAddonsParser_window.document.getElementById("filesTable");
        
        RED.main.httpDownloadAsync(url, function(responseText) {
            var files = JSON.parse(responseText);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.name.endsWith(".h") == false) continue; // skip non .h files
                filesToDownload.push(file);
            }
            filesToDownload_index = 0;
            downloadfilesTask();
        });
    }
    function downloadfilesTask()
    {
        if (filesToDownload_index < filesToDownload.length) {
            var file = filesToDownload[filesToDownload_index];
            console.log("downloading file:" + file.name);
            RED.main.httpDownloadAsync(file.download_url, function(contents) {
                var file = filesToDownload[filesToDownload_index];
                console.log("download completed file:" + file.name);
                
                file.contents = parseFile(contents);

                var nodeRow = testGithubNodeAddonsParser_window.document.createElement("TR");
                nodeRow.innerHTML = "<tr><td>" + file.name + "</td><td>" + file.contents + "</td></tr>";
                testGithubNodeAddonsParser_table.appendChild(nodeRow);

                filesToDownload_index++;
                downloadfilesTask();
            },
            function(error){
                var file = filesToDownload[filesToDownload_index];
                console.log("download fail file:" + file.name);
                
                file.contents = "[download failure]";

                var nodeRow = testGithubNodeAddonsParser_window.document.createElement("TR");
                nodeRow.innerHTML = "<tr><td>" + file.name + "</td><td>" + file.contents + "</td></tr>";
                testGithubNodeAddonsParser_table.appendChild(nodeRow);

                filesToDownload_index++;
                downloadfilesTask();
            });
        } else {
            testGithubNodeAddonsParser_allFilesDownloadedAndParsed();
        }            
    }

    function parseFile(contents) {
        var lines = contents.split('\n');
        var parse = "";
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var lineSplit = line.split(':');
            //console.log(lineSplit.length);
            if (line.startsWith("class") && (lineSplit.length > 1) && (lineSplit[1].includes("AudioStream")||lineSplit[1].includes("AudioOutput")||lineSplit[1].includes("AudioInput"))) { parse += lineSplit[0] + "<br>"; }
            else if (line.startsWith("class AudioConfig") || line.startsWith("class AudioControl")) { parse += lineSplit[0] + "<br>"; }
            else if (line.startsWith("class")) { parse+= '<br><span style="color:orange">class is not AudioStream, AudioConfig, AudioControl, AudioOutput or AudioInput<br>' + line + "</span><br><br>"; }
            else if (line.startsWith("//GUI:")) { parse += line.split('//')[1] + "<br>"; }
        }
        if (parse.trim().length == 0)
            return '<span style="color:orange">don\'t contain any class</span>';
        return parse;
    }

    function testGithubNodeAddonsParser_allFilesDownloadedAndParsed()
    {
        timeEnd = performance.now();
        var totalDownloadTime = Math.round(((timeEnd - timeStart) + Number.EPSILON) * 100) / 100
        var totalDownloadTimeStr = "download and parse all took: " + totalDownloadTime + " ms";
        testGithubNodeAddonsParser_window.document.getElementById("divDownloadTime").innerHTML = totalDownloadTimeStr;

    }
    function testSelectFileByApi_OK(responseText) {
        console.warn("testSelectFileByApi_OK",responseText);
    }

    function testSelectFileByApi_Error(responseText) {
        console.warn("testSelectFileByApi_Error",responseText);
    }

    function testSelectFileByApi() {
        RED.arduino.httpGetAsync("cmd=selectFile", testSelectFileByApi_OK, testSelectFileByApi_Error, 240000);
    }

    function testExportArduinoPref() {
        RED.main.download("preferences.txt", RED.arduino.board.export_arduinoIDE() ); 
    }

    function testExportPlatformIOini() {
        RED.main.download("platformio.ini", RED.arduino.board.export_platformIO() );
    }

    function testExportMakeFile() {
        RED.main.download("Makefile", RED.arduino.board.export_makeFile() );
    }

    function convertFileToOneLineString(e) {
        var file = e.target.files[0];
        if (!file) { return; }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            RED.main.download(file.name, JSON.stringify(contents) );
        };
        reader.readAsText(file);
    }

    function testImportFiles(e)
    {
        for (var fi = 0; fi < e.target.files.length; fi++) {
            var file = e.target.files[fi];
            console.warn("test Import File:", file);
            if (!file) { return; }
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
            };
            reader.readAsText(file);
        }
    }
    
    function console_logColor(data)
    {
        console.log('%c' + typeof data + " %c"+ data, 'background: #bada55; color: #555 ', 'background: #555; color: #bada55 ');
    }
    

    function createAndPrintNewWsStruct()
	{
		console.warn("new ws struct:");
        
        for (var wsi = 0; wsi < RED.nodes.workspaces.length; wsi++)
        {
            var ws = RED.nodes.workspaces[wsi];
            ws.nodes = new Array();
            for (var ni = 0; ni < RED.nodes.nodes.length; ni++)
            {
                var n = RED.nodes.nodes[ni];
                if (n.z == ws.id)
                {
                    ws.nodes.push(RED.nodes.convertNode(n));
                    //ws.nodes.push(n); // this is only to see structure of raw nodes
                }
            }            
        }
        
        console.warn(RED["arduino"]["export"]);
        console.warn(RED["view"].settings);
        
		var project1 = {}
		project1.settings = RED.settings.getAsJSONobj();
		project1.workspaces = RED.nodes.workspaces;
        // SAVE test
		var project_jsonString = JSON.stringify(project1, null, 4);
		RED.arduino.export.showExportDialog("New Project JSON Test", project_jsonString);

        // LOAD test
        var projectLoadTest = JSON.parse(project_jsonString);
        RED.settings.setFromJSONobj(projectLoadTest.settings);
    }
    

    function testGetHelpFromServer()
    {
        var url = "https://raw.githubusercontent.com/PaulStoffregen/Audio/master/gui/index.html";

        RED.main.httpDownloadAsync(url, function(responseText) {
            var mywindow = window.open('Audio System Design Tool for Teensy Audio Library', 'PRINT', 'height=400,width=600');
            var rawHtml = jsonFile.responseText;
            localStorage.setItem("audio_library_guitool_help",rawHtml);
            mywindow.document.write(rawHtml);
            mywindow.document.close(); // necessary for IE >= 10
            mywindow.focus();
        });
    }
    function checkImage(imageSrc, good, bad) {
        var img = new Image();
        img.onload = good; 
        img.onerror = bad;
        img.src = imageSrc;
    }
    
    /* this neat thing can trace changes of a variable
        node._w = 100;
    
        Object.defineProperty(node, 'w', {
            set: function(value) { console.trace(); this._w = value;  },
            get: function() { console.trace(); return this._w; }
            })
    
    }*/

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        
        createAndPrintNewWsStruct:createAndPrintNewWsStruct,
        testGetHelpFromServer:testGetHelpFromServer,
        console_logColor:console_logColor,
        
	};
})();