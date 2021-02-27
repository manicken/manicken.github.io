


RED.NodeDefGenerator = (function() {

    var defSettings = {
    };
    var _settings = {
    };
    var settings = {
    };
    var settingsCategory = { label:"Node Def Generator", expanded:false, bgColor:"#DDD" };

    var settingsEditor = {
        testGithubNodeAddonsParser: { label:"test github node addons .h file GUI tag parser", type:"string", action: testGithubNodeAddonsParser, defValue: "https://api.github.com/repos/chipaudette/OpenAudio_ArduinoLibrary/contents/"},
        testGithubNodeAddonsParser2: { label:"test github node addons .h file GUI tag parser2", type:"string", action: testGithubNodeAddonsParser, defValue: "https://api.github.com/repos/PaulStoffregen/Audio/contents/"},
        testGithubNodeAddonsParser3: { label:"test github node addons .h file GUI tag parser3", type:"string", action: testGithubNodeAddonsParser, defValue: "https://api.github.com/repos/Tympan/Tympan_Library/contents/src"},
    };
    
    var GithubNodeAddonsUrl = "";
    var timeStart = 0;
    var timeEnd = 0;
    var testGithubNodeAddonsParser_window;
    var testGithubNodeAddonsParser_table;
    var nodeAddons;

    var form;
    var table;
    var dialogOk_cb;
    var dialogCancel_cb;

    var dialogOk_cb_default = function() {
        RED.nodes.registerTypes(nodeAddons, nodeAddons.label.split(" ").join("_"));
        RED.main.download("NodeAddons.json", JSON.stringify(nodeAddons, null, 4));
        return true;
    }

    function testGithubNodeAddonsParser(url) {
        GithubNodeAddonsParser(url, dialogOk_cb_default);
    }

    function GithubNodeAddonsParser(url, okPressed_cb, cancelPressed_cb) {
        dialogOk_cb = okPressed_cb;
        dialogCancel_cb = cancelPressed_cb;
        DisableDialogOk();
        timeStart = performance.now();
        GithubNodeAddonsUrl = url;
        filesToDownload = [];
        var urlSplit = url.split("/");
        nodeAddons = {
            count: function() {
                return Object.getOwnPropertyNames(this.types).length;
            },
            label:urlSplit[5],
            description:urlSplit[4] + " " + urlSplit[5] + " node addons",
            url:url,
            isAddon:true,
            types:{}
        };
        form = d3.select('#node-def-generator-dialog');
        $( "#node-def-generator-dialog" ).dialog("option", "title", "Import - downloader");
        $( "#node-def-generator-dialog" ).dialog("open");
        form.html("");

        form.append('div').attr('id', 'divDownloadTime').text("downloading...");
        table = form.append('div').attr('class', 'tableDiv').append('table').attr('id', 'filesTable');

        RED.main.httpDownloadAsync(url, function(responseText) {
            var files = JSON.parse(responseText);
            var filesToDownload = [];
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.name.endsWith(".h") == false) continue; // skip non .h files
                file.url = file.download_url; // because RED.main.httpDownloadAsyncFiles uses url to download
                filesToDownload.push(file);
            }
            RED.main.httpDownloadAsyncFiles(filesToDownload, 
                function(file, currFileIndex, totalFileCount) { // one file completed

                    document.getElementById("divDownloadTime").innerHTML = "downloading file " + currFileIndex + " of " + totalFileCount;

                    var row = table.append('tr');
                    row.append('td').text(file.name);

                    if (file.contents != undefined) {
                        file = parseFile(file);
                        var tdContents = row.append('td');

                        for (var ci = 0; ci < file.classes.length; ci++) {
                            var nodeDefGroupTree = tdContents.append('ul').attr('class', "nodeDefGroupTree");//.html( convertToHtml(str));
                            var nodeDefGroup = nodeDefGroupTree.append('li');
                            var caret = nodeDefGroup.append('span').attr('class', 'caret2');

                            if (file.classes[ci].description != undefined)
                                nodeDefGroup.append('span').attr('class', 'isNotNodeDefItem').text(file.classes[ci].name);
                            else
                                nodeDefGroup.append('span').attr('class', 'nodeDefItem').text(file.classes[ci].name);
                            
                            var nodeDefGroupItems = nodeDefGroup.append('ul').attr('class', 'nested2');
                            
                            caret.on('click', function() {
                                this.parentElement.querySelector(".nested2").classList.toggle("active2");
                                this.classList.toggle("caret2-down");
                            });

                            var str = JSON.stringify(file.classes[ci], null, 4);
                            nodeDefGroupItems.html(convertToHtml(str));
                        }
                        
                        if (file.unsortedGUIitems.length != 0)
                            tdContents.append('div').attr('class', 'unsortedGuiItems').text("<br>unsorted GUI items:" + file.unsortedGUIitems);
                    }
                    else {
                        row.append('td').text("[download failure]");
                    }
                },
                function(files) { // all files completed
                    
                    testGithubNodeAddonsParser_allFilesDownloadedAndParsed();
                }
            );
        });
    }

    function convertToHtml(text) {
        return text.split("\n").join("<br>").split(" ").join("&nbsp;")
    }
    
    function parseFile(file) {

        var lines = file.contents.split('\n');
        file.classes = [];
        file.unsortedGUIitems = [];
        var currClass = undefined;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var lineSplit = line.split(':');
            
            //console.log(lineSplit.length);
            if (line.startsWith("class ")) {
                var className = "";
                var description = "";
                var category = "";
                var isAudioClass = true;
                if ((lineSplit.length > 1) && (lineSplit[1].includes("AudioStream") || lineSplit[1].includes("AudioOutput") || lineSplit[1].includes("AudioInput")))
                {
                    className = lineSplit[0].replace("class ", "").replace("{", "").replace(";", "").trim();
                    if (className.startsWith("AudioOutput")) category = "output";
                    else if (className.startsWith("AudioInput")) category = "input";
                    else if (className.startsWith("AudioEffect")) category = "effect";
                    else if (className.startsWith("AudioFilter")) category = "filter";
                    else if (className.startsWith("AudioConvert")) category = "convert";
                    else if (className.startsWith("AudioMixer")) category = "mixer";
                    else if (className.startsWith("AudioAnalyze")) category = "analyze";
                    else if (className.startsWith("AudioSwitch")) category = "mixer";
                    else if (className.startsWith("AudioSynth")) category = "synth";
                    else if (className.startsWith("AudioPlay")) category = "play";
                    else if (className.startsWith("AudioRecord")) category = "record";
                    else if (className.startsWith("AudioTest")) category = "synth";
                    else if (className.startsWith("AudioCalc")) category = "analyze";
                    else if (className.startsWith("AudioMultiply")) category = "effect";
                    else category = "unsorted";
                }
                else if (line.startsWith("class AudioConfig") || line.startsWith("class AudioControl"))
                {
                    className = lineSplit[0].replace("class ", "").replace("{", "").replace(";", "").trim();
                    if (className.startsWith("AudioConfig")) category = "config";
                    else if (className.startsWith("AudioControl")) category = "control";
                } 
                else
                {
                    isAudioClass = false;
                    description = '<span style="color:orange">class is not AudioStream,AudioConfig,AudioControl,AudioOutput or AudioInput</span>';
                    className = line.replace("class ", "").replace("{", "").split("//")[0].trim();
                }
                currClass = {
                    name:className,
                };
                if (isAudioClass == true) {
                    currClass.guiDefs={
                        defaults:{
                            name:{type:"c_cpp_name"},
                            id:{}
                        },
                        shortName: className,
                        inputs:0, outputs:0,
                        //inputTypes:{"n":"f32"},
                        //outputTypes:{"n":"f32"},
                        category:category,
                        color: "#E6E0F8" ,icon:"arrow-in.png"
                    };
                    nodeAddons.types[className] = currClass.guiDefs;
                }
                else
                {
                    currClass.description = description;
                }
                file.classes.push(currClass);
            }
            else if (line.startsWith("//GUI:")) {
                if (currClass != undefined) {
                    line = line.split('//')[1].replace("GUI:", "").trim();
                    var split2 = line.split(",");
                    for (var glsi = 0; glsi < split2.length; glsi++) {
                        var split3 = split2[glsi].trim().split(":");
                        if (split3.length != 2) continue;
                        var propertyName = split3[0].trim();
                        var propertyValue = split3[1].trim();
                        if (propertyName == "inputs") {
                            currClass.guiDefs.inputTypes = {};
                            currClass.guiDefs.inputTypes["x"+propertyValue] = "f32";
                        }
                        else if (propertyName == "outputs") {
                            currClass.guiDefs.outputTypes = {};
                            currClass.guiDefs.outputTypes["x"+propertyValue] = "f32";
                        }
                            

                        currClass.guiDefs[propertyName] = propertyValue;
                    }
                }
                else
                {
                    file.unsortedGUIitems.push(line.split('//')[1]);
                }
            }
        }
        return file;
    }

    function testGithubNodeAddonsParser_allFilesDownloadedAndParsed()
    {
        timeEnd = performance.now();
        var totalDownloadTime = Math.round(((timeEnd - timeStart) + Number.EPSILON) * 100) / 100
        var totalDownloadTimeStr = "download and parse all took: " + totalDownloadTime + " ms";
        document.getElementById("divDownloadTime").innerHTML = totalDownloadTimeStr;
        EnableDialogOk();
    }

    function DisableDialogOk() {
        document.getElementById("btn-def-generator-dialog-ok").disabled = true;
        $("#btn-def-generator-dialog-ok").addClass("unclickablebutton");
    }
    function EnableDialogOk() {
        document.getElementById("btn-def-generator-dialog-ok").disabled = false;
        $("#btn-def-generator-dialog-ok").removeClass("unclickablebutton");
    }

    $("#node-def-generator-dialog form" ).submit(function(e) { e.preventDefault();});
	$( "#node-def-generator-dialog" ).dialog({
		modal: true, autoOpen: false,// if modal set to true then its parent is gonna be disabled
		width: 1070, height:800,
		title: "node def generator",
		buttons: [
            {
                id: "btn-def-generator-dialog-ok",
				text: "Ok",
				click: function() {
                    if (dialogOk_cb != undefined) {
                        if (dialogOk_cb())
                            $( this ).dialog( "close" );
                    }
                    else
                        $( this ).dialog( "close" );
                }
			},
			{
				text: "Cancel",
				click: function() {	if (dialogCancel_cb != undefined) dialogCancel_cb(); $( this ).dialog( "close" ); }
			}
		],
		open: function(e) { RED.keyboard.disable();	},
		close: function(e) { RED.keyboard.enable(); }
	});

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        GithubNodeAddonsParser:GithubNodeAddonsParser,
        nodeAddons: function() { return nodeAddons;}
    };
})();