

RED.NodeHelpManager = (function() {
    var defSettings = {
    };
    var _settings = {
    };
    var settings = {
    };
    var settingsCategory = { label:"Node Help Manager", expanded:false, bgColor:"#DDD" };

    var settingsEditor = {
        downloadNodeAddonsHelp: { label:"downloadNodeAddonsHelp", type:"string", action: downloadNodeAddonsHelp, defValue: "https://raw.githubusercontent.com/manicken/justSomeFiles/main/index.html"},

        downloadNodeAddonsHelpCorsErr: { label:"downloadNodeAddonsHelpCorsErr", type:"string", action: downloadNodeAddonsHelpCorsErr, defValue: "http://www.janbob.com/electron/OpenAudio_Design_Tool/index.html"},
    }

    function downloadNodeAddonsHelp(url) {
        RED.main.httpDownloadAsync(url, 
            function(data) {
                RED.IndexedDBfiles.fileWrite("otherFiles", "help_OpenAudioF32.html", data, function (dir, name) {console.log("file write ok");});
                window.location.reload();
            }, 
            function(err) {
                RED.notify("could not download help addon" + err, "info", null, 3000);
            }
        );
    }

    function downloadNodeAddonsHelpCorsErr(url) {
        RED.main.httpDownloadAsync(url, 
            function(data) {
                RED.notify("could download help addon" + err, "info", null, 3000);
            }, 
            function(err) {
                RED.notify("could not download help addon" + err, "info", null, 3000);
            }
        );
    }

    var addonHelp = [];

    // every help request is going througt here
    function getHelp(nodeType) {
        var primaryHelp = $("script[data-help-name|='" + nodeType + "']").html();
        if (primaryHelp == undefined) {
            for (var i = 0; i < addonHelp.length; i++) {
                var parsedHtml = addonHelp[i];
                var addonHelpHtml = parsedHtml.querySelector("script[data-help-name|='" + nodeType + "']");
                if (addonHelpHtml != undefined) {
                    console.log("found addon help:" + nodeType);
                    return addonHelpHtml.text;
                }
            }
        }
        //console.log(primaryHelp);
        return primaryHelp;
    }

    function loadAllFromIndexedDB(cbDone) {
        addonHelp = [];
        RED.IndexedDBfiles.getFiles("otherFiles", function (files) {
            for (var i = 0; i < files.length; i++) {
                if (!files[i].name.startsWith('help_')) continue;
                console.warn("loading help file " + files[i].name);
                let parser = new DOMParser();
                let parsedHtml = parser.parseFromString(files[i].data, 'text/html');
                addonHelp.push(parsedHtml);
            }
            cbDone();
        }, 
        function (err) {
            RED.notify("no files found in others", "info", null, 2000);
            cbDone();
        });

        // returns HTMLScriptElement
        var first = $("script[data-help-name]")[0];
        //var name = first.substring(first.indexOf("data-help-name=\""));
        console.warn(first.getAttribute("data-help-name"));
        console.warn(first.innerText);
    }

    function parseRawHtml(html) {
        let parser = new DOMParser();
        let parsedHtml = parser.parseFromString(html, 'text/html');
        let liElements = parsedHtml.querySelector("script[data-container-name|='NodeDefinitions']");
        console.log(liElements);
    }


    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,

        init: loadAllFromIndexedDB,
        getHelp:getHelp
    };

})();