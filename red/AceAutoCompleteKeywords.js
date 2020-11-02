var AceAutoComplete  = (function() {
    var Extension=[
        { "name":"begin", 				        "value":"begin();", 						  "meta": "begin" },
        { "caption":"begin", 				    "snippet":"void begin()\n{\n    ${1}\n}\n", 			  "meta": "snippet" , "type":"snippet"},
        { "name":"WAVEFORM_SINE",               "value":"WAVEFORM_SINE", "meta":"sinus waveform"},
        { "name":"WAVEFORM_SAWTOOTH",           "value":"WAVEFORM_SAWTOOTH", "meta":"saw waveform"},
        { "name":"WAVEFORM_SAWTOOTH_REVERSE",   "value":"WAVEFORM_SAWTOOTH_REVERSE", "meta":"reversed saw waveform"},
        { "name":"WAVEFORM_SQUARE",             "value":"WAVEFORM_SQUARE", "meta":"square waveform"},
        { "name":"WAVEFORM_TRIANGLE",           "value":"WAVEFORM_TRIANGLE", "meta":"triangle waveform"},
        { "name":"WAVEFORM_TRIANGLE_VARIABLE",  "value":"WAVEFORM_TRIANGLE_VARIABLE", "meta":"variable triangle waveform"},
        { "name":"WAVEFORM_ARBITRARY",          "value":"WAVEFORM_ARBITRARY", "meta":"arbitrary waveform"},
        { "name":"WAVEFORM_PULSE",              "value":"WAVEFORM_PULSE", "meta":"pulse waveform"},
        { "name":"WAVEFORM_SAMPLE_HOLD",        "value":"WAVEFORM_SAMPLE_HOLD", "meta":"sample hold waveform"},
        ];

    function getFromHelp(nodeType)
    {
        var data = $("script[data-help-name|='" + nodeType + "']").html();
        var div = document.createElement('div');
        div.innerHTML = data.trim();
        var funcElements = div.getElementsByClassName("func");
        //var keywordElements = div.getElementsByClassName("keyword");
        var descElements = div.getElementsByClassName("desc");
        var functions = [];
        for (var i = 0; i < funcElements.length; i++) {
            functions.push({name:funcElements[i].textContent, value:funcElements[i].textContent, meta:descElements[i].textContent});
            //console.log(funcElements[i].textContent);// + " " + keywordElements[i].textContent);
            //console.log(descElements[i].textContent);
        }
        return functions;
    }

    return {
        //ClassFunctions:ClassFunctions,
        Extension:Extension,
        getFromHelp:getFromHelp
    }
})();









