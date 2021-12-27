
RED.OSC = (function() {

    var niy = "(not implemented yet)";
    var LayerOptionTexts = ["Web Serial API", "Web MIDI(sysex) API " + niy, "WebSocket " + niy, "HTML post" + niy];
    var LayerOptions = [0,1,2,3];

    var EncodingOptionTexts = ["no encoding", "SLIP"];
    var EncodingOptions = [0,1];

    var defSettings = {
        LiveUpdate: true,
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
        LiveUpdate: defSettings.LiveUpdate,
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
        ClearOutputLog: { label:"Clear output log", type:"button", action: ClearOutputLog},
        LiveUpdate:     {label:"Live Update", type:"boolean", popupText:"Toggles the OSC live update functionality<br> i.e. when objects/links are added/removed/renamed"},
        OnlyShowLastDebug:        { label:"Only show last", type:"boolean", popupText:"If enabled then only the last message will be shown<br>this should speed up the GUI alot"},
        transmitDebug:  {label:"Transmit Debug Output", expanded:false, bgColor:"#DDD",
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
        UseDebugLinkName:       { label:"Use debug link names", type:"boolean", popupText:"when enabled all linknames uses underscores to separate the names<br> i.e. sourceName_sourcePort_targetName_targetPort <br><br> when disabled the underscores are not included"},
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
})();

OSC = (function() {

    navigator.serial.addEventListener("connect", async (event) => {
        RED.notify("Serial port automatically reconnected ,<br> but you still have to manually connect it anyway", "info", null, 5000);
        
      });
      
      navigator.serial.addEventListener("disconnect", (event) => {
        RED.notify("Serial port disconnected", "warning", null, 3000);
      });

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
    function SendBundle(bundle) {
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(JSON.stringify(bundle));
        SendData(CreateBundleData(bundle));
    }
    function SendPacket(packet) {
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(JSON.stringify(packet));
        SendData(osc.writePacket(packet));
    }
    function SendMessage(address, valueTypes, ...values) {
        SendPacket(CreatePacket(address, valueTypes, ...values));
    }
    function SendAsSlipToSerial(data) {
        SendRawToSerial(Slip.encode(data));
    }
    async function SendTextToSerial(text) {
        if (port == undefined || port.writable == undefined) {
            if (RED.OSC.settings.ShowOutputDebug == true)
                AddLineToLog("[not connected]", "#FF0000", "#FFF0F0");
            return;
        }
        var data = new TextEncoder("utf-8").encode(text);

        const writer = port.writable.getWriter();

        await writer.write(data);

        // Allow the serial port to be closed later.
        writer.releaseLock();
    }
    function CreateMessageData(address, valueTypes, ...values)  {
        return osc.writePacket(CreatePacket(address, valueTypes, ...values));
    }

    function CreateBundleData(bundle) {
        return osc.writeBundle(bundle)
    }

    function CreatePacket(address, valueTypes, ...values) {
        var minLength = valueTypes.length;
        if (minLength > values.length) {
            minLength = values.length;
            AddLineToLog("(ERROR) @ OSC.CreatePacket() valueTypes length mismatch count of values<br>nbsp;nbsp;some parameters are trimmed", "#FF0000", "#FFF0F0");
        }

        //console.error(valueTypes,valueTypes.length);
        var packet = {address:address, args: []};
        for (var i = 0; i < minLength; i++) {
            packet.args.push({type:valueTypes[i], value:values[i]})
        }
        return packet;
    }

    function CreateBundle(timeDelaySeconds) {
        if (timeDelaySeconds == undefined) timeDelaySeconds = 0;
        return {timeTag: osc.timeTag(timeDelaySeconds),packets:[]};
    }

    function NodeAdded(node) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var addr = RED.OSC.settings.RootAddress + "/dynamic/createObject*";
        if (node.type != "AudioMixer")
            SendData(CreateMessageData(addr,"ss", node.type, node.name));
        else
            SendData(CreateMessageData(addr,"ssi", node.type, node.name,node.inputs));

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("added node (" + node.type + ") " + node.name);
    }

    function NodeRenamed(node, oldName, newName) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var addr = RED.OSC.settings.RootAddress + "/dynamic/ren*";
        var bundle = CreateBundle();

        var links = RED.nodes.links.filter(function(d) { return (d.source === node) || (d.target === node);});
		for (var i=0;i<links.length;i++) {
            var link = links[i];
            
            var newLinkName = GetLinkName(link);
            var oldLinkName = newLinkName.split(newName).join(oldName);
            bundle.packets.push(CreatePacket(addr, "ss", oldLinkName, newLinkName));
            //console.warn();
            if (RED.OSC.settings.ShowOutputDebug == true)
                AddLineToLog("renamed link: " + oldLinkName + " to " + newLinkName);
        }
        bundle.packets.push(CreatePacket(addr, "ss", oldName, newName));
        //console.warn("links:", links);
        SendData(CreateBundleData(bundle));//(addr,"ss", oldName, newName));

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("renamed node from " + oldName + " to " + newName);
    }

    function NodeRemoved(node, links) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var addr = RED.OSC.settings.RootAddress + "/dynamic/destroy*";
        var bundle = CreateBundle();
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (RED.OSC.settings.ShowOutputDebug == true)
                AddLineToLog("removed link " + GetLinkDebugName(link));
            var linkName = GetLinkName(link);
            bundle.packets.push(CreatePacket(addr, "s", linkName));
        }
        bundle.packets.push(CreatePacket(addr, "s", node.name));
        SendData(CreateBundleData(bundle));

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("removed node " + node.name);
    }

    function LinkAdded(link) {
        if (RED.OSC.settings.LiveUpdate == false) return;

        var linkName = GetLinkName(link);
        //link.name = linkName;
        var addLinkAddr = RED.OSC.settings.RootAddress + "/dynamic/createConn*";
        var connectLinkAddr = RED.OSC.settings.RootAddress + "/audio/" + linkName + "/connect*";
        var bundle = OSC.CreateBundle();
        bundle.packets.push(CreatePacket(addLinkAddr, "s", linkName));
        bundle.packets.push(CreatePacket(connectLinkAddr, "sisi", link.source.name, link.sourcePort, link.target.name, link.targetPort));
        SendData(CreateBundleData(bundle));
        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("added link [" + linkName  + "] " + GetLinkDebugName(link));
    }
    var debugLinkName = true;
    function GetLinkName(link) {
        //if (link.name != undefined)
        //    return link.name;
        //else
        if (RED.OSC.settings.UseDebugLinkName == false)
            return link.source.name + link.sourcePort + link.target.name + link.targetPort;
        else
            return link.source.name + "_" + link.sourcePort +"_"+ link.target.name +"_"+ link.targetPort;
    }

    function GetLinkDebugName(link) {
        return "(" + link.source.name + ", " + link.sourcePort + ", " + link.target.name + ", " + link.targetPort + ")";
    }

    function LinkRemoved(link) {
        if (RED.OSC.settings.LiveUpdate == false) return;
        
        var addr = RED.OSC.settings.RootAddress + "/dynamic/destroy*";
        
        var linkName = GetLinkName(link);
        SendData(CreateMessageData(addr,"s", linkName));

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("removed link [" + linkName  + "] " + GetLinkDebugName(link));
    }

    function NodeInputsChanged(node, oldCount, newCount) {
        AddLineToLog(node.name + " node inputs changed from " + oldCount + " to " + newCount);


    }

    // not yet implemented functionality
    function WsAdded(ws) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) added Workspace " + ws.label);  }
    function WsRenamed(oldName,newName) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) renamed Workspace from " + oldName + " to " + newName);  }
    function WsRemoved(ws) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) removed Workspace " + ws.label); }

    function RegisterEvents() {
        RED.events.on("nodes:add", NodeAdded);
        RED.events.on("nodes:renamed", NodeRenamed);
        RED.events.on("nodes:inputs", NodeInputsChanged); // happens when the input count is changed
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

    return {
        SendData:SendData, // uses the encoding and transport layer settings
        SendRawToSerial:SendRawToSerial,
        SendAsSlipToSerial:SendAsSlipToSerial,
        SendTextToSerial:SendTextToSerial,
        GetSimpleOSCdata:CreateMessageData, // keep this for backwards compability
        CreateMessageData:CreateMessageData, // newer name
        GetLinkName:GetLinkName,
        CreatePacket:CreatePacket,
        CreateBundle:CreateBundle,
        CreateBundleData:CreateBundleData, // simplifies from osc.writeBundle(bundle)
        SendBundle:SendBundle,
        SendMessage:SendMessage,
        SendPacket:SendPacket,
        AddLineToLog:AddLineToLog, // simplifies usage of RED.bottombar.info.addLine(text);
        SetLog:SetLog,
        RegisterEvents:RegisterEvents
	};
})();