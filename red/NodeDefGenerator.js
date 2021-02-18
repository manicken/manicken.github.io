


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

    function testGithubNodeAddonsParser(url) {
        timeStart = performance.now();
        GithubNodeAddonsUrl = url;
        filesToDownload = [];
        var urlSplit = url.split("/");
        nodeAddons = {
            label:urlSplit[5],
            description:urlSplit[4] + " " + urlSplit[5] +" node addons",
            url:url,
            isAddon:true,
            types:{}
        };
        testGithubNodeAddonsParser_window = window.open('', '', 'height=800,width=1024');
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
            var filesToDownload = [];
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.name.endsWith(".h") == false) continue; // skip non .h files
                file.url = file.download_url; // because RED.main.httpDownloadAsyncFiles uses url to download
                filesToDownload.push(file);
            }
            RED.main.httpDownloadAsyncFiles(filesToDownload, 
                function(file) { // one file completed
                    if (file.contents != undefined) {
                        file = parseFile(file);
                        var nodeRow = testGithubNodeAddonsParser_window.document.createElement("TR");
                        console.log(file.classes);
                        nodeRow.innerHTML = ["<tr><td>", file.name, "</td><td>", JSON.stringify(file.classes, null, 4).split("\n").join("<br>").split(" ").join("&nbsp;"), "<br><br>unsorted GUI items:<br>", file.unsortedGUIitems, "</td></tr>"].join(" ");
                        testGithubNodeAddonsParser_table.appendChild(nodeRow);
                    }
                    else {
                        var nodeRow = testGithubNodeAddonsParser_window.document.createElement("TR");
                        nodeRow.innerHTML = "<tr><td>" + file.name + "</td><td>[download failure]</td></tr>";
                        testGithubNodeAddonsParser_table.appendChild(nodeRow);
                    }
                },
                function(files) { // all files completed
                    testGithubNodeAddonsParser_allFilesDownloadedAndParsed();
                }
            );
        });
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
                    if (lineSplit[1].includes("AudioStream")) category = "unsorted";
                    else if (lineSplit[1].includes("AudioOutput")) category = "output";
                    else if (lineSplit[1].includes("AudioInput")) category = "input";
                }
                else if (line.startsWith("class AudioConfig") || line.startsWith("class AudioControl"))
                {
                    className = lineSplit[0].replace("class ", "").replace("{", "").replace(";", "").trim();
                    if (line.startsWith("class AudioConfig")) category = "config";
                    else if (line.startsWith("class AudioControl")) category = "control";
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
                        shortName: className,inputs:0, outputs:0 ,category:category,color: "#E6E0F8" ,icon:"arrow-in.png"
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
                        currClass.guiDefs[split3[0].trim()] = split3[1].trim();
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
        testGithubNodeAddonsParser_window.document.getElementById("divDownloadTime").innerHTML = totalDownloadTimeStr;
        RED.nodes.registerTypes(nodeAddons, nodeAddons.label.split(" ").join("_"));
        RED.main.download("NodeAddons.json", JSON.stringify(nodeAddons, null, 4));
    }

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
    };
})();