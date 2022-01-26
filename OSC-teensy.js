
RED.OSC = (function() {

    var niy = "(not implemented yet)";
    var LayerOptionTexts = ["Web Serial API", "Web MIDI(sysex) API " + niy, "WebSocket " + niy, "HTML post" + niy];
    var LayerOptions = [0,1,2,3];

    var EncodingOptionTexts = ["no encoding", "SLIP"];
    var EncodingOptions = [0,1];

    var defSettings = {
        HashLinkNames: false,
        HashLinkNamesHeader: "CON",
        LiveUpdate: true,
        DirectExport: false,
        WildcardArrayObjects: true,
        OnlyShowLastDebug: false,
        ShowOutputDebug: true,
        ShowOutputOscTxRaw: true,
        ShowOutputOscTxDecoded: true,
        ShowOutputOscRxRaw: true,
        ShowOutputOscRxDecoded: true,
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
        ShowOutputOscTxRaw: defSettings.ShowOutputOscTxRaw,
        ShowOutputOscTxDecoded: defSettings.ShowOutputOscTxDecoded,
        ShowOutputOscRxRaw: defSettings.ShowOutputOscRxRaw,
        ShowOutputOscRxDecoded: defSettings.ShowOutputOscRxDecoded,
        UseDebugLinkName: defSettings.UseDebugLinkName,
        RootAddress: defSettings.RootAddress,
        TransportLayer: defSettings.TransportLayer,
        Encoding:defSettings.Encoding
    }
    var settings = {

        get LiveUpdate() { return _settings.LiveUpdate; },
        set LiveUpdate(state) { 
            _settings.LiveUpdate = state; 
            
            $('#' + settingsEditor.LiveUpdate.valueId).prop('checked', state);
            $('#btn-oscLiveUpdateMode').prop('checked', state);
            RED.storage.update();
			/*if (state == true)
			{
                RED.notify("Is OSC Live update mode", "warning", null, 500);
                $('#btn-oscLiveUpdateMode').prop('checked', false);
			}
			else
			{
                RED.notify("Is not OSC Live update mode", "warning", null, 500);
                $('#btn-oscLiveUpdateMode').prop('checked', true);
            }*/
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

        get ShowOutputOscTxDecoded() { return _settings.ShowOutputOscTxDecoded; },
        set ShowOutputOscTxDecoded(value) { _settings.ShowOutputOscTxDecoded = value; RED.storage.update();},

        get ShowOutputOscTxRaw() { return _settings.ShowOutputOscTxRaw; },
        set ShowOutputOscTxRaw(value) { _settings.ShowOutputOscTxRaw = value; RED.storage.update();},

        get ShowOutputOscRxRaw() { return _settings.ShowOutputOscRxRaw; },
        set ShowOutputOscRxRaw(value) { _settings.ShowOutputOscRxRaw = value; RED.storage.update();},

        get ShowOutputOscRxDecoded() { return _settings.ShowOutputOscRxDecoded; },
        set ShowOutputOscRxDecoded(value) { _settings.ShowOutputOscRxDecoded = value; RED.storage.update();},

        get UseDebugLinkName() { return _settings.UseDebugLinkName; },
        set UseDebugLinkName(value) { _settings.UseDebugLinkName = value; RED.storage.update();},

        get RootAddress() { return _settings.RootAddress; },
        set RootAddress(value) { _settings.RootAddress = value; RED.storage.update();},

        get TransportLayer() { return _settings.TransportLayer; },
        set TransportLayer(value) { _settings.TransportLayer = value; RED.storage.update();},

        get Encoding() { return _settings.Encoding; },
        set Encoding(value) { _settings.Encoding = value; RED.storage.update();}
    }
    var settingsCategory = { label:"OSC", expanded:false, popupText: "Open Sound Control settings", bgColor:"#DDD" };

    var clearLogNote = "<br><br>the output can be cleared with 'clear output log' button";
    var dataShownNote = "debug data should be shown in the bottom output log";

    var settingsEditor = {
        ClearOutputLog:       {label:"Clear output log", type:"button", action: ClearOutputLog},
        LiveUpdate:           {label:"Live Update", type:"boolean", popupText:"Toggles the OSC live update functionality<br> i.e. when objects/links are added/removed/renamed"},
        DirectExport:         {label:"Direct Export", type:"boolean", popupText:"If checked and when doing OSC-'export' (Simple), the export dialog will not show."},
        WildcardArrayObjects: {label:"Wildcard Array Export", type:"boolean", popupText:"If checked and when doing OSC-'export' (Group), the object creating inside arrays will use wildcard.<br>Not when this is enabled the generated message will be much shorter for big arrays.<br> Disabling wildcard can be used for debugging."},
        OnlyShowLastDebug:    {label:"Only show last", type:"boolean", popupText:"If enabled then only the last message will be shown<br>this should speed up the GUI alot"},
        UseDebugLinkName:     {label:"Use debug link names", type:"boolean", popupText:"when enabled all linknames uses underscores to separate the names<br> i.e. sourceName_sourcePort_targetName_targetPort <br><br> when disabled the underscores are not included"},
        HashLinkNames:        {label:"Hash link names", type:"boolean", popupText:"Enable experimental hashed short link names"},
        HashLinkNamesHeader:  {label:"Hash link names header", type:"string", popupText:"Hashed short link names - 'header' i.e. what the connection names should begin with"},
        transmitDebug:        {label:"Transmit Debug Output", expanded:false, bgColor:"#DDD",
            items: {
                ShowOutputDebug:        { label:"Show basic info", type:"boolean", popupText:"If transmit " + dataShownNote + clearLogNote},
                ShowOutputOscTxDecoded: { label:"Show JSON", type:"boolean", popupText:"If transmit JSON message " + dataShownNote + clearLogNote},
                ShowOutputOscTxRaw:     { label:"Show raw data", type:"boolean", popupText:"If transmit raw " + dataShownNote + clearLogNote},
            }
        },
        receiveDebug:   {label:"Receive Debug Output", expanded:false, bgColor:"#DDD",
            items: {
                
                ShowOutputOscRxDecoded: { label:"Show JSON", type:"boolean", popupText:"If receive JSON message " + dataShownNote + clearLogNote},
                ShowOutputOscRxRaw:     { label:"Show raw data", type:"boolean", popupText:"If receive raw " + dataShownNote + clearLogNote},
            }
        },
        
        RootAddress:            { label:"Root Address", type:"string", popupText: "this defines the root address"},
        Encoding:               { label:"Encoding", type:"combobox", optionTexts:EncodingOptionTexts, options:EncodingOptions, popupText: "The encoding of the data sent"},
        TransportLayer:         { label:"Transport Layer", type:"combobox", optionTexts:LayerOptionTexts, options:LayerOptions, popupText: "The Transport Layer to send OSC data over when<br> a Node/'Audio Object' is added/renamed/removed<br> or when<br> a Link/AudioConnection/Patchcable is added/removed"},
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

var OSC = (function() {

    function GetClearAllAddr() { return RED.OSC.settings.RootAddress + "/dynamic/clearAl*"; }
    function GetCreateObjectAddr() { return RED.OSC.settings.RootAddress + "/dynamic/crOb"; }
    function GetRenameObjectAddr() { return RED.OSC.settings.RootAddress + "/dynamic/ren*"; }
    function GetDestroyObjectAddr() { return RED.OSC.settings.RootAddress + "/dynamic/d*"; }
    function GetCreateConnectionAddr() { return RED.OSC.settings.RootAddress + "/dynamic/crCo"; }
    function GetCreateGroupAddr() { return RED.OSC.settings.RootAddress + "/dynamic/crGrp"; }
    function GetConnectAddr(connectionName) {
        if (connectionName.startsWith("/"))
            return RED.OSC.settings.RootAddress + "/audio" + connectionName + "/co";
        else
            return RED.OSC.settings.RootAddress + "/audio/" + connectionName + "/co";
    }

    var available = navigator

    function Init() {

        if (navigator.serial == undefined) {
            console.warn("Web Serial API not availabe on this browser!")
            available = false;

            var a = "Currently not available at the current browser<br>as this functionality currently is implemented using the Web Serial API<br>in the future WebSockets will be supported that will then enable this functionality.<br><br>"
        
            $("#btn-osc-clearAll").addClass("disabled");
            $("#btn-connectSerial").addClass("disabled");
            $("#btn-disConnectSerial").addClass("disabled");
            $("#btn-deploy-osc").addClass("disabled");
            $("#btn-save-osc-sd").addClass("disabled");
            $("#btn-load-osc-sd").addClass("disabled");
            $("#btn-save-json-sd").addClass("disabled");
            $("#btn-load-json-sd").addClass("disabled");
            $("#btn-osc-clearAll").addClass("disabled");
            RED.main.SetPopOver("#btn-connectSerial", a);
            RED.main.SetPopOver("#btn-disConnectSerial", a);

            return false;
        }
        navigator.serial.addEventListener("connect", async (event) => {
            RED.notify("Serial port automatically reconnected ,<br> but you still have to manually connect it anyway", "info", null, 5000);
        });
          
        navigator.serial.addEventListener("disconnect", (event) => {
            RED.notify("Serial port disconnected", "warning", null, 3000);
        });

        return true;
    }
    
      $('#btn-osc-clearAll').click(function() { SendMessage(GetClearAllAddr()); });
    var port;
    //const serialLEDController = new SerialLEDController();
    $('#btn-connectSerial').click(async function() { 
        port = await navigator.serial.requestPort();
        console.warn("connection"+Date.now());
        await port.open({baudRate:115200, bufferSize:1024});
        console.warn("done"+Date.now());

        readUntilClosed();
        RED.notify("serial port opened", "info", null, 3000);
    });
    $('#btn-disConnectSerial').click(async function() { 
        // User clicked a button to close the serial port.
        keepReading = false;
        // Force reader.read() to resolve immediately and subsequently
        // call reader.releaseLock() in the loop example above.
        reader.cancel();
        //await closedPromise;
        RED.notify("serial port closed", "info", null, 3000);
    });
    var keepReading = true;
    var reader;
    var slipDecoder = new Slip.Decoder({onMessage: slipDecoded, onError:slipError});

    function slipError(err) {
        console.error("slip error: " + err);
    }
    function getDataArrayAsAsciiAndHex(data) {
        var result = "";
        for (var i = 0; i < data.length; i++) {
            if (data[i] < 0x20 || data[i] > 0x7E) {
                if (data[i] >= 0x10)
                    result += "[" + data[i].toString(16)+ "]";
                //else if (data[i] == 0x00)
                //    result += "&Oslash;";
                else
                    result += "[0" + data[i].toString(16)+ "]";
            }
            else
                result += String.fromCharCode(data[i]);
        }
        return result;
    }
    var startTime = undefined;
    var endTime = undefined;
    var allBytes = [];
    function checkForLineEnd(values) {
        for (var i=0;i<values.length;i++) {
            if (values[i] == 0x0A) return true;
            else
                allBytes.push(values[i]);
        }
        return false;
    }
    async function readUntilClosed() {
        while (port.readable && keepReading) {
            reader = port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                    // reader.cancel() has been called.
                    break;
                    }
                    // just for performance testing
                    /*if (checkForLineEnd(value) == true) {
                        if (startTime == undefined) startTime = performance.now();
                        else {
                            endTime = performance.now();
                            var elapsedTime = endTime - startTime;
                            //console.log(getDataArrayAsAsciiAndHex(allBytes));
                            console.log("rx time " + elapsedTime + " @ " + ((1000/elapsedTime)*(allBytes.length)) + " bytes/s" );
                            allBytes.length = 0;
                            startTime = performance.now();
                        }

                    }*/

                    //console.error("decoding:",getDataArrayAsAsciiAndHex(value));
                    slipDecoder.decode(value);
                    // value is a Uint8Array.
                    //
                   // console.warn("done decoding");
                }
            } catch (error) {
                RED.notify("Serial port read error " + error, "warning", null, 5000);
                throw error;
            } finally {
                // Allow the serial port to be closed later.
                reader.releaseLock();
            }
        }

        await port.close();
    }
    //const closedPromise = readUntilClosed();

    // ********************************************************************
    // ********************** MIDI ****************************************
    // ********************************************************************
    var midi = null;  // global MIDIAccess object
    function onMIDISuccess( midiAccess ) {
    console.log( "MIDI ready!" );
    midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
    listInputsAndOutputs();
    }

    function onMIDIFailure(msg) {
    console.log( "Failed to get MIDI access - " + msg );
    }

    
    //$('#btn-listMidi').click(function() { navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure ); });

    function listInputsAndOutputs( ) {
        midiAccess = midi;
        for (var entry of midiAccess.inputs) {
          var input = entry[1];
          AddLineToLog( "Input port [type:'" + input.type + "'] id:'" + input.id +
            "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
            "' version:'" + input.version + "'" );
        }
      
        for (var entry of midiAccess.outputs) {
          var output = entry[1];
          AddLineToLog( "Output port [type:'" + output.type + "'] id:'" + output.id +
            "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
            "' version:'" + output.version + "'" );
        }
      }
    //***********************************************************************
    //***********************************************************************

    function slipDecoded(data) {
        //console.log("slipDecoded:" + data.byteOffset + " " + data.byteLength + " " + data.length);
        var rxDecoded = "";

        if (RED.OSC.settings.ShowOutputOscRxRaw == true) {
            rxDecoded += getDataArrayAsAsciiAndHex(data).split('\n').join('<br>').split('<').join('&lt;').split('>').join('&gt;').split('\0').join('&Oslash;');
        }
        try {
            var oscRx = osc.readPacket(data, {metadata:true});
            
            
            if (RED.OSC.settings.ShowOutputOscRxDecoded == true) {
                rxDecoded += "<br>timeTag:" + JSON.stringify(oscRx.timeTag) + "<br>";
                rxDecoded += "packets: " + "<br>";
                for (var i = 0; i < oscRx.packets.length; i++) {
                    rxDecoded += JSON.stringify(oscRx.packets[i]);
                    if (i < oscRx.packets.length - 1)
                        rxDecoded += "<br>";
                }
            }
            if ((RED.OSC.settings.ShowOutputOscRxRaw == true) || (RED.OSC.settings.ShowOutputOscRxDecoded == true))
                AddLineToLog(rxDecoded);

            RED.events.emit("OSCBundle:Received", oscRx);
        }
        catch (err) { // print what we have so far
            AddLineToLog(rxDecoded+"<br>"+err);
        }
    }
    
    var txFIFO = [];
    var dataIndex = 0;

    async function SendRawToSerial(data) {
        if (available == false){ 
            AddLineToLog("[Web Serial API not availabe]", "#FF0000", "#FFF0F0");
            return;
        }

        if (port == undefined || port.writable == undefined) {
            if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("[not connected]", "#FF0000", "#FFF0F0");
            return;
        }

        if (port.writable.locked == true) {
            console.error("enqueue data " + dataIndex);
            txFIFO.push({data:data, index:dataIndex++});
            return;
        }
        const writer = port.writable.getWriter();

        await writer.write(data).then(
            function (value) { writer.releaseLock(); SendNextInBuffer();},
            function (error) { console.warn("serial write error "+ error); writer.releaseLock(); SendNextInBuffer();}
        );
    }

    function SendNextInBuffer() {
        if (txFIFO.length != 0) {
            var item = txFIFO.shift();
            console.error("dequeue data " + item.index);
            SendRawToSerial(item.data);
        }
    }
    function SendData(data) {
        
        if (RED.OSC.settings.Encoding == 1) // SLIP
        {
            //AddLineToLog("using SLIP");
            data = Slip.encode(data);
        }
        if (RED.OSC.settings.ShowOutputOscTxRaw == true)
            AddLineToLog("raw send:<br>" + getDataArrayAsAsciiAndHex(data).split('<').join('&lt;').split('>').join('&gt;').split('\0').join('&Oslash;'));

        if (RED.OSC.settings.TransportLayer == 0) // Web Serial API
            SendRawToSerial(data);
        else {
            AddLineToLog("(WARNING) Try to use Transport Layer NIY "+RED.OSC.LayerOptionTexts[RED.OSC.settings.TransportLayer] + "<brPlease select annother transport layer", "#FF0000", "#FFF0F0");
        }
    }
    function SendBundle(b) {
        delete b.add;
        delete b.addPackets;
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(JSON.stringify(b));
        SendData(CreateBundleData(b));
    }
    function SendPacket(p) {
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(JSON.stringify(p));
        SendData(osc.writePacket(p));
    }
    function SendMessage(address, valueTypes, ...values) {
        SendPacket(CreatePacket(address, valueTypes, ...values));
    }
    function SendTextToSerial(text) {
        SendRawToSerial(new TextEncoder("utf-8").encode(text));
    }
    function CreateMessageData(address, valueTypes, ...values)  {
        return osc.writePacket(CreatePacket(address, valueTypes, ...values));
    }

    function CreateBundleData(b) {
        delete b.add;
        delete b.addPackets;
        return osc.writeBundle(b)
    }

    function CreatePacket(address, valueTypes, ...values) {
        var packet = {address:address, args: []};
        if (valueTypes == undefined) return packet; // just return a "empty" packet

        var minLength = valueTypes.length;
        if (minLength > values.length) {
            minLength = values.length;
            AddLineToLog("(ERROR) @ OSC.CreatePacket() "+address+" valueTypes \"" +valueTypes+"\" length mismatch count of "+values.join("|")+"<br>nbsp;nbsp;some parameters are trimmed", "#FF0000", "#FFF0F0");
        }

        //console.error(valueTypes,valueTypes.length);
        
        for (var i = 0; i < minLength; i++) {
            packet.args.push({type:valueTypes[i], value:values[i]})
        }
        return packet;
    }

    function CreateBundle(timeDelaySeconds) {
        if (timeDelaySeconds == undefined) timeDelaySeconds = 0;
        return {
            timeTag: osc.timeTag(timeDelaySeconds),
            packets:[],
            add:function(firstArg, valueTypes, ...values) {
                if (typeof firstArg == "object")
                    this.packets.push(firstArg);
                else
                    this.packets.push(CreatePacket(firstArg, valueTypes, ...values)); // super shortcut so we can now do bundle.add("/addr", "s", "string")
            },
            addPackets:function(packets) {
                for (var i=0;i<packets.length;i++) {
                    this.packets.push(packets[i]);
                }
            }
        }; 
    }

    function NodeAdded(node) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        if (node._def.defaults.inputs == undefined) // if inputs is defined in defaults that mean it's user editable
            SendMessage(GetCreateObjectAddr(),"ss", node.type, node.name);
        else
            SendMessage(GetCreateObjectAddr(),"ssi", node.type, node.name,node.inputs);

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("added node (" + node.type + ") " + node.name);
    }

    function NodeRenamed(node, oldName, newName) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var bundle = CreateBundle();

        var links = RED.nodes.links.filter(function(d) { return (d.source === node) || (d.target === node);});
		for (var i=0;i<links.length;i++) {
            var link = links[i];
            
            var newLinkName = RED.export.GetLinkName(link);
            var oldLinkName = newLinkName.split(newName).join(oldName);
            bundle.add(GetRenameObjectAddr(), "ss", oldLinkName, newLinkName);
            
            if (RED.OSC.settings.ShowOutputDebug == true)
                AddLineToLog("renamed link: " + oldLinkName + " to " + newLinkName);
        }
        bundle.add(GetRenameObjectAddr(), "ss", oldName, newName);
        
        SendBundle(bundle);

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("renamed node from " + oldName + " to " + newName);
    }

    function NodeRemoved(node, links) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var bundle = CreateBundle();
        AddLinksRemovedToBundle(bundle, links);
        bundle.add(GetDestroyObjectAddr(), "s", node.name);
        SendBundle(bundle);

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("removed node " + node.name);
    }

    function AddLinksRemovedToBundle(bundle, links) {
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (RED.OSC.settings.ShowOutputDebug == true)
                AddLineToLog("removed link " + RED.export.GetLinkDebugName(link));
            var linkName = RED.export.GetLinkName(link);
            bundle.add(GetDestroyObjectAddr(), "s", linkName);
        }
    }

    function LinkAdded(link) {
        if (RED.OSC.settings.LiveUpdate == false) return;
        var linkName = RED.export.GetLinkName(link);
        var bundle = OSC.CreateBundle();
        bundle.add(GetCreateConnectionAddr(), "s", linkName);
        bundle.add(GetConnectAddr(linkName), "sisi", link.source.name, link.sourcePort, link.target.name, link.targetPort);
        SendBundle(bundle);
        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("added link [" + linkName  + "] " + RED.export.GetLinkDebugName(link));
    }
    
    function LinkRemoved(link) {
        if (RED.OSC.settings.LiveUpdate == false) return;
        var linkName = RED.export.GetLinkName(link);
        SendMessage(GetDestroyObjectAddr(),"s", linkName);

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("removed link [" + linkName  + "] " + RED.export.GetLinkDebugName(link));
    }

    function NodeInputsUpdated(node, oldCount, newCount, removedLinks) {
        AddLineToLog(node.name + " node inputs changed from " + oldCount + " to " + newCount);
        console.warn("NodeInputsUpdated");
        var linksToUpdate = RED.nodes.links.filter(function(l) { return (l.source === node) || (l.target === node); });

        var bundle = CreateBundle();
        if (removedLinks != undefined) AddLinksRemovedToBundle(bundle, removedLinks); // destroy additional links
        AddLinksRemovedToBundle(bundle, linksToUpdate); // destroy other links temporary
        bundle.add(GetDestroyObjectAddr(), "s", node.name); // destroy node temporary to change number of inputs
        bundle.add(GetCreateObjectAddr(),"ssi", node.type, node.name, newCount); // create new node with new number of inputs
        AddLinksToCreateToBundle(bundle, linksToUpdate); // recreate other links again
        SendBundle(bundle);
    }

    function AddLinksToCreateToBundle(bundle, links) {
        for (var i = 0; i < links.length; i++) {
            var l = links[i];
            var linkName = RED.export.GetLinkName(l);
            bundle.add(GetCreateConnectionAddr(), "s", linkName);
            bundle.add(GetConnectAddr(linkName), "sisi", l.source.name, l.sourcePort, l.target.name, l.targetPort);
        }
    }

    // not yet implemented functionality
    function WsAdded(ws) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) added Workspace " + ws.label);  }
    function WsRenamed(oldName,newName) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) renamed Workspace from " + oldName + " to " + newName);  }
    function WsRemoved(ws) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) removed Workspace " + ws.label); }

    function RegisterEvents() {
        RED.events.on("nodes:add", NodeAdded);
        RED.events.on("nodes:renamed", NodeRenamed);
        RED.events.on("nodes:inputsUpdated", NodeInputsUpdated); // happens when the input count is changed is usually fired from nodes.js (NodeInputsChanged)
        RED.events.on("nodes:removed", NodeRemoved); // note usage of nodes:removed instead of the normal nodes:remove
        RED.events.on("flows:add", WsAdded);
        RED.events.on("flows:renamed", WsRenamed);//RED.bottombar.info.addContent("removed link");
        RED.events.on("flows:remove", WsRemoved);
        RED.events.on("links:add", LinkAdded);
        RED.events.on("links:remove", LinkRemoved);
        RED.events.on("OSCBundle:Received", OSCBundleReceived);
    }
    var OSC_REPLY_CODES = ["OK","NOT_FOUND","BLANK_NAME","DUPLICATE_NAME","NO_DYNAMIC","NO_MEMORY","PARAM_ERROR","TYPE_ERROR"];
    function OSCBundleReceived(oscBundle)
    {
        if (oscBundle.packets == undefined) return; // skip non bundles
        if (oscBundle.packets[0].address != "/reply") {
            RED.bottombar.info.addLine("WARNING: receive don't contain a reply cmd");
            return;
        }
        if (oscBundle.packets[0].args == undefined || oscBundle.packets[0].args.length == 0) {
            RED.bottombar.info.addLine("ERROR: reply don't contain any arguments");
            return;
        }
        var args = oscBundle.packets[0].args; // simplify usage
        if (args[args.length-1].type != "i") {
            RED.bottombar.info.addLine("ERROR: reply last argument is not a fault code type");
            return;
        }
        var faultCode = args[args.length-1].value;
        if (faultCode < 0) {
            RED.bottombar.info.addLine("ERROR: reply last argument fault code value cannot be less than zero");
            return;
        }
        else if (faultCode < OSC_REPLY_CODES.length) {
            RED.bottombar.info.addLine(OSC_REPLY_CODES[faultCode]);
            return;
        }
        else
        {
            RED.bottombar.info.addLine("WARNING: unknown fault code: " + faultCode);
            return;
        }
    }

    function GetPacketCompactForm(packet) {
        var addr = packet.address;
        var argsVF = ""; // VF = Value Format
        var argsV = "";

        for (let i = 0; i < packet.args.length; i++) {
            argsVF += packet.args[i].type;
            if (packet.args[i].type == "s") argsV += '"'; // encapsulate strings in double quotes
            argsV += packet.args[i].value;
            if (packet.args[i].type == "s") argsV += '"'; // encapsulate strings in double quotes
            if (i < packet.args.length - 1)
                argsV += ", "; 
        }
        if (argsVF != "")
            return '("' + addr + '"' + ', "' + argsVF + '", ' + argsV + ')';
        else // no arguments
            return '("' + addr + '")'
    }

    function AddLineToLog(text, foreColor, bgColor) {
        var style = "";
        if (foreColor != undefined)
            style = "color:" + foreColor + ";";
        if (bgColor != undefined)
            style += "background-color:" + bgColor + ";";
        if (RED.OSC.settings.OnlyShowLastDebug == false)
            RED.bottombar.info.addLine("<span style=" + style + ">" + text + "</span>");
        else
            RED.bottombar.info.setContent("<span style=" + style + ">" + text + "</span>");
    }

    function SetLog(text, foreColor, bgColor) {
        var style = "";
        if (foreColor != undefined)
            style = "color:" + foreColor + ";";
        if (bgColor != undefined)
            style += "background-color:" + bgColor + ";";
        RED.bottombar.info.setContent("<span style=" + style + ">" + text + "</span>");
    }

    var Get = {
        get ClearAllAddr() {return GetClearAllAddr();}
    }

    return {
        Get,
        get TryThis() {return "hello World";},
        
        GetClearAllAddr,
        GetCreateGroupAddr,
        GetCreateObjectAddr,
        GetRenameObjectAddr,
        GetDestroyObjectAddr,
        GetCreateConnectionAddr,
        GetConnectAddr,
        
        RootAddress: RED.OSC.settings.RootAddress,
        NoteFreqs: [8.176, 8.662, 9.177, 9.723, 10.301, 10.913, 11.562, 12.25, 12.978, 13.75, 14.568, 15.434, 16.352, 17.324, 18.354, 19.445, 20.602, 21.827, 23.125, 24.5, 25.957, 27.5, 29.135, 30.868, 32.703, 34.648, 36.708, 38.891, 41.203, 43.654, 46.249, 48.999, 51.913, 55, 58.27, 61.735, 65.406, 69.296, 73.416, 77.782, 82.407, 87.307, 92.499, 97.999, 103.826, 110, 116.541, 123.471, 130.813, 138.591, 146.832, 155.563, 164.814, 174.614, 184.997, 195.998, 207.652, 220, 233.082, 246.942, 261.626, 277.183, 293.665, 311.127, 329.628, 349.228, 369.994, 391.995, 415.305, 440, 466.164, 493.883, 523.251, 554.365, 587.33, 622.254, 659.255, 698.456, 739.989, 783.991, 830.609, 880, 932.328, 987.767, 1046.502, 1108.731, 1174.659, 1244.508, 1318.51, 1396.913, 1479.978, 1567.982, 1661.219, 1760, 1864.655, 1975.533, 2093.005, 2217.461, 2349.318, 2489.016, 2637.02, 2793.826, 2959.955, 3135.963, 3322.438, 3520, 3729.31, 3951.066, 4186.009, 4434.922, 4698.636, 4978.032, 5274.041, 5587.652, 5919.911, 6271.927, 6644.875, 7040, 7458.62, 7902.133, 8372.018, 8869.844, 9397.273, 9956.063, 10548.08, 11175.3, 11839.82, 12543.85],
        GetPacketCompactForm, // for debuggin messages
        SendData, // uses the encoding and transport layer settings
        SendRawToSerial,

        SendAsSlipToSerial:function (data) { SendRawToSerial(Slip.encode(data));}, // obsolete should be removed

        SendTextToSerial,
        GetSimpleOSCdata:CreateMessageData, // keep this for backwards compability
        CreateMessageData, // newer name
        CreatePacket,
        CreateBundle,
        CreateBundleData, // simplifies from osc.writeBundle(bundle)
        SendBundle,
        SendMessage,
        SendPacket,
        AddLineToLog, // simplifies usage of RED.bottombar.info.addLine(text);
        SetLog,
        RegisterEvents,
        getDataArrayAsAsciiAndHex,

        Init
	};
})(); // OSC namespace