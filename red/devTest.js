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
        startupTabRightSidebar: "info",
        DebugCanvasMousePos: false,
    };
    // Object.assign({}, ) is used to ensure that the defSettings is not overwritten
    var _settings = {
        testPost: defSettings.testPost,
        testGet: defSettings.testGet,
        testWsSend: defSettings.testWsSend,
        getFuncHelp: defSettings.getFuncHelp,
        startupTabRightSidebar: defSettings.startupTabRightSidebar,
        DebugCanvasMousePos: defSettings.DebugCanvasMousePos
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

        get DebugCanvasMousePos() { return _settings.DebugCanvasMousePos; },
		set DebugCanvasMousePos(value) { _settings.DebugCanvasMousePos = value; RED.storage.update();},
    }

    var settingsCategory = { label:"Development Tests", expanded:false, bgColor:"#DDD" };
    var settingsEditor = {
        DebugCanvasMousePos: { label:"Debug Canvas Mouse Pos", type:"boolean"},
        startupTabRightSidebar: { label:"Startup Right Sidebar", type:"combobox", actionOnChange:true, options:["info", "settings", "project"] },

        exportCompleteFunctionList: { label:"Export complete function list", type:"button", action: exportCompleteFunctionList, urlCmd:"exportCompleteFunctionList"},
        hideSelection:      { label:"Hide selection", type:"button", buttonClass:"btn-primary btn-sm", action: hideSelection},
        refreshComports:      { label:"Refresh serial ports", type:"button", buttonClass:"btn-primary btn-sm", action: refreshComports},
		comports:            { label:"Serial Ports", type:"combobox", actionOnChange:true, valueId:""}, // valueId is se
        testSelectFileByApi:    { label:"test select file from API server", type:"button", action: testSelectFileByApi},

        
        testImportFiles:        { label:"test import file(s)", type:"button", isFileInput:true, buttonClass:"btn-primary btn-sm", action: testImportFiles},
        testExportArduinoPref:  { label:"test export arduino pref file", type:"button", action: testExportArduinoPref},
        testExportPlatformIOini:{ label:"test export PlatformIO.ini file", type:"button", action: testExportPlatformIOini},
        testExportMakeFile:     { label:"test export make file", type:"button", action: testExportMakeFile},
        testWebKitSound:        { label:"testWebKitSound", type:"button",  buttonClass:"btn-primary btn-sm", action: testWebKitSound},
        convertFileToOneLiner:  { label:"convert file to<br>one liner string<br>in new file", type:"button", isFileInput:true, buttonClass:"btn-primary btn-sm", action: convertFileToOneLineString},
		testPost:               { label:"test post", type:"string"},
		testGet:                { label:"test get", type:"string"},
        testWsSend:             { label:"test ws send", type:"string"},
        getFuncHelp:            { label:"get func help", type:"string"},
        printNewWsStruct:       { label:"print new ws struct", type:"button", buttonClass:"btn-primary btn-sm", action: createAndPrintNewWsStruct},
        consoleColorTest:       { label:"console color test", type:"button", buttonClass:"btn-primary btn-sm", action: function() {RED.devTest.console_logColor("Hello World"); RED.console_ok("Test of console_ok"); }},
        getHelpAtServer:        { label:"get help @ github server", type:"button",  buttonClass:"btn-primary btn-sm", action: testGetHelpFromServer},
        
        
    };
    function hideSelection() {
        for (var i=0; i < RED.view.moving_set.length;i++)
        {
            RED.view.moving_set[i].n.svgRect.attr("display","none");//.classed("hidden",true);
        }
        for (var i=0; i < RED.nodes.cwsLinks.length;i++)
        {
            if (RED.nodes.cwsLinks[i].selected == true)
                RED.nodes.cwsLinks[i].svgRoot.attr("display","none");//.classed("hidden",true);
        }
    }

    var isPlaying = false;
    var testWebKitSound_scope = undefined;

    function refreshComports() {
        console.log("Web Serial Port Test");
        

        port = navigator.serial.requestPort();
        // - Wait for the port to open.
        //port.open({ baudrate: 9600 });
        connect(port);
        writeToStream('\x03', 'echo(false);');
    }

    function connect() {
        // CODELAB: Add code setup the output stream here.
        const encoder = new TextEncoderStream();
        outputDone = encoder.readable.pipeTo(port.writable);
        outputStream = encoder.writable;
    }
    function writeToStream(lines) {
        // CODELAB: Write to output stream
        const writer = outputStream.getWriter();
        lines.forEach((line) => {
        console.log('[SEND]', line);
        writer.write(line + '\n');
        });
        writer.releaseLock();
    }
    
    function testWebKitSound() {
        //var c = document.getElementById('divSetting-devTest-testWebKitSound');
        if (testWebKitSound_scope == undefined) {
            testWebKitSound_scope = document.createElement("canvas");
            testWebKitSound_scope.id = "scope";
            var scd = document.createElement("div");
            scd.className = "settings-content";
            var cd = document.createElement("div");
            cd.className = "center";
            cd.appendChild(testWebKitSound_scope);
            scd.appendChild(cd);

            var scdb = document.createElement("div");
            scdb.className = "center";

            scdb.appendChild(document.getElementById('btn-devTest-testWebKitSound'));
            var dsdt_twks = document.getElementById('divSetting-devTest-testWebKitSound')
            dsdt_twks.appendChild(scdb);

            dsdt_twks.className = "settings-item";
            
            dsdt_twks.appendChild(scd);
            
        }
        ctx = testWebKitSound_scope.getContext("2d");
    
        testWebKitSound_scope.height = 200;
        testWebKitSound_scope.width = 400;
        
        // make 0-line permanent as background
        ctx.moveTo(0, 100.5);
        ctx.lineTo(testWebKitSound_scope.width, 100.5);
        ctx.stroke();
        testWebKitSound_scope.style.backgroundImage = "url(" + testWebKitSound_scope.toDataURL() + ")";
    
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        var ac = new window.AudioContext();
        var masterGain = ac.createGain();
        var analyser = ac.createAnalyser();

        masterGain.connect(analyser);
        analyser.connect(ac.destination);

        var numCoeffs = 128; // The more coefficients you use, the better the approximation
        var realCoeffs = new Float32Array(numCoeffs);
        var imagCoeffs = new Float32Array(numCoeffs);

        //realCoeffs[0] = 0.5;
        for (var i = 1; i < numCoeffs; i++) { // note i starts at 1
            imagCoeffs[i] = 1 / ((i) * Math.PI);
           // realCoeffs[i] = 0.5;
        }
        var wave = ac.createPeriodicWave(realCoeffs, imagCoeffs); // will be a simple sine wave

        var osc = ac.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.value = 220;
        //osc.connect(ac.destination);
        osc.connect(masterGain);
        osc.start(ac.currentTime);
        
        isPlaying = true;
        osc.stop(ac.currentTime + 1);
        drawWave(analyser, ctx);
        
    }
    //draw function for canvas
    function drawWave(analyser, ctx) {
    
        var buffer = new Float32Array(1024),
            w = ctx.canvas.width;
        
        ctx.strokeStyle = "#777";
        ctx.setTransform(1,0,0,-1,0,100.5); // flip y-axis and translate to center
        ctx.lineWidth = 2;
        
        (function loop() {
        analyser.getFloatTimeDomainData(buffer);
        
        ctx.clearRect(0, -100, w, ctx.canvas.height);
    
        ctx.beginPath();
        ctx.moveTo(0, buffer[0] * 90);
        for (var x = 2; x < w; x += 2) ctx.lineTo(x, buffer[x] * 90);
        ctx.stroke();
        
        if (isPlaying) requestAnimationFrame(loop)
        })();
    }
    function exportCompleteFunctionList() {
    
        var node_defs = RED.nodes.node_defs["officialNodes"].types;
        var node_def_names = Object.getOwnPropertyNames(node_defs);
        var defines = "";
        var functions = "";
        //console.warn(node_def_names.length);
        for (var i = 0; i < node_def_names.length; i++) {
            defines += "#define OSC_TYPE_" + node_def_names[i]  + " " + i + "\n";
            functions += RED.arduino.export.generate_OSC_function_decode(node_def_names[i]);
            
        }
        RED.view.dialogs.showExportDialog("All official functions", defines + "\n" + functions, "list");
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
            var ws = RED.nodes.createExportableWorkspace(RED.nodes.workspaces[wsi]);
            ws.nodes = new Array();
            for (var ni = 0; ni < RED.nodes.cwsNodes.length; ni++)
            {
                ws.nodes.push(RED.nodes.convertNode(RED.nodes.cwsNodes[ni]));
            }            
        }
        
        console.warn(RED["arduino"]["export"]);
        console.warn(RED["view"].settings);
        
		var project1 = {}
		project1.settings = RED.settings.getAsJSONobj();
		project1.workspaces = RED.nodes.workspaces;
        // SAVE test
		var project_jsonString = JSON.stringify(project1, null, 4);
		RED.view.dialogs.showExportDialog("New Project JSON Test", project_jsonString);

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