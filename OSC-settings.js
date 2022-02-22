
// this is only intended for the OSC settings
// as my settings system needs settings to be in the RED 'namespace'

RED.OSC = (function() {

    var niy = "(not implemented yet)";
    var LayerOptionTexts = ["Web Serial API", "Web MIDI(sysex) API " + niy, "WebSocket " + niy, "HTML post" + niy];
    var LayerOptions = [0,1,2,3];

    var EncodingOptionTexts = ["no encoding", "SLIP"];
    var EncodingOptions = [0,1];

    var renamedSettings = { // this for a future implementation
        ShowOutputDebug: "DebugMessages",
        ShowOutputOscTxRaw: "DebugTxRaw",
        ShowOutputOscTxDecoded: "DebugTxDecoded",
        ShowOutputOscTxColor: "DebugTxColor",
        ShowOutputOscRxRaw: "DebugRxRaw",
        ShowOutputOscRxDecoded: "DebugRxDecoded",
        ShowOutputOscRxColor: "DebugRxColor",
    };
    var defSettings = {
        HashLinkNames: false,
        HashLinkNamesHeader: "CON",
        LiveUpdate: false, // disabled by default, as it slows down the Tool alot
        DirectExport: false,
        WildcardArrayObjects: true,
        OnlyShowLastDebug: false,
        ShowOutputDebug: true,
        RedirectDebugToConsole: true,
        ShowOutputOscTxRaw: true,
        ShowOutputOscTxDecoded: true,
        ShowOutputOscTxColor: "#C7F2FF",
        ShowOutputOscRxRaw: true,
        ShowOutputOscRxDecoded: true,
        DebugOscRxDecodedReplies: true,
        ShowOutputOscRxColor: "#FFD4F5",
        UseDebugLinkName: false,
        RootAddress: "/teensy*",
        TransportLayer: 0, // "Web Serial API"
        Encoding: 1 // SLIP
    }
    var _settings = {
        HashLinkNames: defSettings.HashLinkNames,
        HashLinkNamesHeader:defSettings.HashLinkNamesHeader,
        LiveUpdate: defSettings.LiveUpdate,
        DirectExport: defSettings.DirectExport,
        WildcardArrayObjects: defSettings.WildcardArrayObjects,
        OnlyShowLastDebug: defSettings.OnlyShowLastDebug,
        ShowOutputDebug: defSettings.ShowOutputDebug,

        RedirectDebugToConsole: defSettings.RedirectDebugToConsole,
        ShowOutputOscTxRaw: defSettings.ShowOutputOscTxRaw,
        ShowOutputOscTxDecoded: defSettings.ShowOutputOscTxDecoded,
        ShowOutputOscTxColor: defSettings.ShowOutputOscTxColor,

        ShowOutputOscRxRaw: defSettings.ShowOutputOscRxRaw,
        ShowOutputOscRxDecoded: defSettings.ShowOutputOscRxDecoded,
        DebugOscRxDecodedReplies: defSettings.DebugOscRxDecodedReplies,
        ShowOutputOscRxColor: defSettings.ShowOutputOscRxColor,

        UseDebugLinkName: defSettings.UseDebugLinkName,
        RootAddress: defSettings.RootAddress,
        TransportLayer: defSettings.TransportLayer,
        Encoding:defSettings.Encoding
    }
    var settings = {

        get LiveUpdate() { return _settings.LiveUpdate; },
        set LiveUpdate(state) { 
            _settings.LiveUpdate = state; 
            
            //$('#' + settingsEditor.LiveUpdate.valueId).prop('checked', state);
            $('#btn-oscLiveUpdateMode').prop('checked', state);
            RED.storage.update();
        },

        get HashLinkNames() { return _settings.HashLinkNames; },
        set HashLinkNames(value) { _settings.HashLinkNames = value; RED.storage.update();},

        get HashLinkNamesHeader() { return _settings.HashLinkNamesHeader; },
        set HashLinkNamesHeader(value) { _settings.HashLinkNamesHeader = value; RED.storage.update();},

        get DirectExport() { return _settings.DirectExport; },
        set DirectExport(value) { _settings.DirectExport = value; RED.storage.update();},

        get WildcardArrayObjects() { return _settings.WildcardArrayObjects; },
        set WildcardArrayObjects(value) { _settings.WildcardArrayObjects = value; RED.storage.update();},

        get OnlyShowLastDebug() { return _settings.OnlyShowLastDebug; },
        set OnlyShowLastDebug(value) { _settings.OnlyShowLastDebug = value; RED.storage.update();},

        get ShowOutputDebug() { return _settings.ShowOutputDebug; },
        set ShowOutputDebug(value) { _settings.ShowOutputDebug = value; RED.storage.update();},

        get RedirectDebugToConsole() { return _settings.RedirectDebugToConsole; },
        set RedirectDebugToConsole(value) { _settings.RedirectDebugToConsole = value; RED.storage.update();},

        // transmitt stuff
        get ShowOutputOscTxDecoded() { return _settings.ShowOutputOscTxDecoded; },
        set ShowOutputOscTxDecoded(value) { _settings.ShowOutputOscTxDecoded = value; RED.storage.update();},

        get ShowOutputOscTxRaw() { return _settings.ShowOutputOscTxRaw; },
        set ShowOutputOscTxRaw(value) { _settings.ShowOutputOscTxRaw = value; RED.storage.update();},

        get ShowOutputOscTxColor() { return _settings.ShowOutputOscTxColor; },
        set ShowOutputOscTxColor(value) { _settings.ShowOutputOscTxColor = value; RED.storage.update();},

        // receive stuff
        get ShowOutputOscRxRaw() { return _settings.ShowOutputOscRxRaw; },
        set ShowOutputOscRxRaw(value) { _settings.ShowOutputOscRxRaw = value; RED.storage.update();},

        get ShowOutputOscRxDecoded() { return _settings.ShowOutputOscRxDecoded; },
        set ShowOutputOscRxDecoded(value) { _settings.ShowOutputOscRxDecoded = value; RED.storage.update();},

        get ShowOutputOscRxColor() { return _settings.ShowOutputOscRxColor; },
        set ShowOutputOscRxColor(value) { _settings.ShowOutputOscRxColor = value; RED.storage.update();},

        get DebugOscRxDecodedReplies() { return _settings.DebugOscRxDecodedReplies; },
        set DebugOscRxDecodedReplies(value) { _settings.DebugOscRxDecodedReplies = value; RED.storage.update();},

        get UseDebugLinkName() { return _settings.UseDebugLinkName; },
        set UseDebugLinkName(value) { _settings.UseDebugLinkName = value; RED.storage.update();},

        get RootAddress() { return _settings.RootAddress; },
        set RootAddress(value) { _settings.RootAddress = value; RED.storage.update();},

        get TransportLayer() { return _settings.TransportLayer; },
        set TransportLayer(value) { _settings.TransportLayer = value; RED.storage.update();},

        get Encoding() { return _settings.Encoding; },
        set Encoding(value) { _settings.Encoding = value; RED.storage.update();}
    }
    var settingsCategory = { label:"Open Sound Control", expanded:false, popupText: "Open Sound Control settings", bgColor:"#DDD" };

    var clearLogNote = "<br><br>the output can be cleared with 'clear output log' button";
    var dataShownNote = "debug data should be shown in the bottom output log";

    var settingsEditor = {
        target:                {label:"Target options", expanded:false, bgColor:"#EEE",
            items: {
                RootAddress:            { label:"Root Address", type:"string", popupText: "this defines the root address"},
                Encoding:               { label:"Encoding", type:"combobox", optionTexts:EncodingOptionTexts, options:EncodingOptions, popupText: "The encoding of the data sent"},
                TransportLayer:         { label:"Transport Layer", type:"combobox", optionTexts:LayerOptionTexts, options:LayerOptions, popupText: "The Transport Layer to send OSC data over when<br> a Node/'Audio Object' is added/renamed/removed<br> or when<br> a Link/AudioConnection/Patchcable is added/removed"},
            }
        },
        links:                {label:"Link options", expanded:false, bgColor:"#EEE",
            items: {
                UseDebugLinkName:     {label:"Use debug link names", type:"boolean", popupText:"when enabled all linknames uses underscores to separate the names<br> i.e. sourceName_sourcePort_targetName_targetPort <br><br> when disabled the underscores are not included"},
                HashLinkNames:        {label:"Hash link names", type:"boolean", popupText:"Enable experimental hashed short link names"},
                HashLinkNamesHeader:  {label:"Hash link names header", type:"string", popupText:"Hashed short link names - 'header' i.e. what the connection names should begin with<br>note. if set to a empty string the default 'L' will be used as the header, as a OSC address cannot begin with a number?"},
            }
        },
        //ClearOutputLog:       {label:"Clear output log", type:"button", action: ClearOutputLog},
        DirectExport:         {label:"Direct Export", type:"boolean", popupText:"If checked and when doing OSC-'export', the export dialog will not show."},
        debugGlobal:                {label:"Debug 'global'", expanded:false, bgColor:"#EEE",
            items: {
                WildcardArrayObjects: {label:"Wildcard Array Export", type:"boolean", popupText:"If checked and when doing OSC-'export' (Group), the object creating inside arrays will use wildcard.<br>Not when this is enabled the generated message will be much shorter for big arrays.<br> Disabling wildcard can be used for debugging."},
                OnlyShowLastDebug:    {label:"Only show last", type:"boolean", popupText:"If enabled then only the last message will be shown<br>this should speed up the GUI alot"},
                ShowOutputDebug:      {label:"Show event info", type:"boolean", popupText:"If basic debug info " + dataShownNote + clearLogNote},
                RedirectDebugToConsole:      {label:"Redirect Debug", type:"boolean", popupText:"Redirect Debug to browser developer console"},
            }
        },
        transmitDebug:        {label:"Transmit Debug Output", expanded:true, bgColor:"#EEE",
            items: {
                ShowOutputOscTxColor:   { label:"Transmit base color", type:"color", popupText:""},
                ShowOutputOscTxDecoded: { label:"Show JSON", type:"boolean", popupText:"If transmit JSON message " + dataShownNote + clearLogNote},
                ShowOutputOscTxRaw:     { label:"Show raw data", type:"boolean", popupText:"If transmit raw " + dataShownNote + clearLogNote},
            }
        },
        receiveDebug:   {label:"Receive Debug Output", expanded:true, bgColor:"#EEE",
            items: {
                ShowOutputOscRxColor:   { label:"Receive base color", type:"color", popupText:""},
                ShowOutputOscRxDecoded: { label:"Show JSON", type:"boolean", popupText:"If receive JSON message " + dataShownNote + clearLogNote},
                DebugOscRxDecodedReplies: { label:"Show Decoded Replies", type:"boolean", popupText:""},
                ShowOutputOscRxRaw:     { label:"Show raw data", type:"boolean", popupText:"If receive raw " + dataShownNote + clearLogNote},
            }
        },
        //LiveUpdate:           {label:"Live Update", type:"boolean", popupText:"Toggles the OSC live update functionality<br> i.e. when objects/links are added/removed/renamed"},
        
        
    }
    function ClearOutputLog() {
        RED.bottombar.info.setContent("");
    }

    return {
        defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        LayerOptionTexts:LayerOptionTexts,
	};
})(); // RED.OSC namespace