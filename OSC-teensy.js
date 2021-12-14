
RED.OSC = (function() {

    var niy = "(not implemented yet)";
    var LayerOptionTexts = ["Web Serial API", "Web MIDI(sysex) API " + niy, "WebSocket " + niy, "HTML post" + niy];
    var LayerOptions = [0,1,2,3];

    var EncodingOptionTexts = ["no encoding", "SLIP"];
    var EncodingOptions = [0,1];

    var defSettings = {
        ShowOutputDebug: true,
        ShowOutputOscRxRaw: true,
        ShowOutputOscRxDecoded: true,
        UseDebugLinkName: false,
        RootAddress: "/teensy*",
        TransportLayer: 0, // "Web Serial API"
        Encoding: 1 // SLIP
    }
    var _settings = {
        ShowOutputDebug: defSettings.ShowOutputDebug,
        ShowOutputOscRxRaw: defSettings.ShowOutputOscRxRaw,
        ShowOutputOscRxDecoded: defSettings.ShowOutputOscRxDecoded,
        UseDebugLinkName: defSettings.UseDebugLinkName,
        RootAddress: defSettings.RootAddress,
        TransportLayer: defSettings.TransportLayer,
        Encoding:defSettings.Encoding
    }
    var settings = {

        get ShowOutputDebug() { return _settings.ShowOutputDebug; },
        set ShowOutputDebug(value) { _settings.ShowOutputDebug = value; RED.storage.update();},

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

    var settingsEditor = {
        ShowOutputDebug:        { label:"Show tx output debug", type:"boolean", popupText:"If transmit debug data should be shown in the bottom output log<br><br>the output can be cleared at 'top-right menu' -> 'clear output'"},
        ShowOutputOscRxRaw:     { label:"Show rx raw output debug", type:"boolean", popupText:"If receive raw debug data should be shown in the bottom output log<br><br>the output can be cleared at 'top-right menu' -> 'clear output'"},
        ShowOutputOscRxDecoded: { label:"Show rx decoded output debug", type:"boolean", popupText:"If receive decoded debug data should be shown in the bottom output log<br><br>the output can be cleared at 'top-right menu' -> 'clear output'"},
        UseDebugLinkName:       { label:"Use debug link names", type:"boolean", popupText:"when enabled all linknames uses underscores to separate the names<br> i.e. sourceName_sourcePort_targetName_targetPort <br><br> when disabled the underscores are not included"},
        RootAddress:            { label:"Root Address", type:"string", popupText: "this defines the root address"},
        Encoding:               { label:"Encoding", type:"combobox", optionTexts:EncodingOptionTexts, options:EncodingOptions, popupText: "The encoding of the data sent"},
        TransportLayer:         { label:"Transport Layer", type:"combobox", optionTexts:LayerOptionTexts, options:LayerOptions, popupText: "The Transport Layer to send OSC data over when<br> a Node/'Audio Object' is added/renamed/removed<br> or when<br> a Link/AudioConnection/Patchcable is added/removed"},
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

    navigator.serial.addEventListener("connect", (event) => {
        RED.notify("Serial port connected", "warning", null, 3000);
      });
      
      navigator.serial.addEventListener("disconnect", (event) => {
        RED.notify("Serial port disconnected", "warning", null, 3000);
      });

    var port;
    //const serialLEDController = new SerialLEDController();
    $('#btn-connectSerial').click(async function() { 
        port = await navigator.serial.requestPort();
        console.warn("connection"+Date.now());
        await port.open({baudRate:115200});
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
    var slipDecoder = new Slip.Decoder({onMessage: slipDecoded});

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
                    slipDecoder.decode(value);
                    // value is a Uint8Array.
                    //
                    
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

    function slipDecoded(data) {
        var rxDecoded = "";

        if (RED.OSC.settings.ShowOutputOscRxRaw == true) {
            rxDecoded += new TextDecoder("utf-8").decode(data).split('\n').join('<br>')
        }

        if (RED.OSC.settings.ShowOutputOscRxDecoded == true) {
            var oscRx = osc.readPacket(data, {metadata:true});

            rxDecoded += "<br>timeTag:" + JSON.stringify(oscRx.timeTag) + "<br>";
            rxDecoded += "packets: " + "<br>";
            for (var i = 0; i < oscRx.packets.length; i++) {
                rxDecoded += JSON.stringify(oscRx.packets[i]) + "<br>";
            }
        }
        
        if ((RED.OSC.settings.ShowOutputOscRxRaw == true) || (RED.OSC.settings.ShowOutputOscRxDecoded == true))
            AddLineToLog(rxDecoded);
                    
       // AddLineToLog();
    }
    

    async function SendRawToSerial(data) {
        if (port == undefined || port.writable == undefined) {
            if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("[not connected]", "#FF0000", "#FFF0F0");
            return;
        }

        //AddLineToLog(new TextDecoder("utf-8").decode(data));

        const writer = port.writable.getWriter();
        await writer.write(data);

        // Allow the serial port to be closed later.
        writer.releaseLock();
    }
    function SendData(data) {
        if (RED.OSC.settings.Encoding == 1) // SLIP
        {
            //AddLineToLog("using SLIP");
            data = Slip.encode(data);
        }
        if (RED.OSC.settings.TransportLayer == 0) // Web Serial API
            SendRawToSerial(data);
        else {
            AddLineToLog("(WARNING) Try to use Transport Layer NIY "+RED.OSC.LayerOptionTexts[RED.OSC.settings.TransportLayer] + "<brPlease select annother transport layer", "#FF0000", "#FFF0F0");
        }
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
        if (node._def.nonObject != undefined) return; // don't care about non audio objects

        var addr = RED.OSC.settings.RootAddress + "/dynamic/createObject*";
        SendData(CreateMessageData(addr,"ss", node.type, node.name));
        
        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("added node (" + node.type + ") " + node.name);
    }

    function NodeRenamed(node, oldName, newName) {
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
        var addr = RED.OSC.settings.RootAddress + "/dynamic/destroy*";
        
        var linkName = GetLinkName(link);
        SendData(CreateMessageData(addr,"s", linkName));

        if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("removed link [" + linkName  + "] " + GetLinkDebugName(link));
    }

    // not yet implemented functionality
    function WsAdded(ws) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) added Workspace " + ws.label);  }
    function WsRenamed(oldName,newName) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) renamed Workspace from " + oldName + " to " + newName);  }
    function WsRemoved(ws) { if (RED.OSC.settings.ShowOutputDebug == true) AddLineToLog("(not implemented yet) removed Workspace " + ws.label); }

    function RegisterEvents() {
        RED.events.on("nodes:add", NodeAdded);
        RED.events.on("nodes:renamed", NodeRenamed);
        RED.events.on("nodes:removed", NodeRemoved); // note usage of nodes:removed instead of the normal nodes:remove
        RED.events.on("flows:add", WsAdded);
        RED.events.on("flows:renamed", WsRenamed);//RED.bottombar.info.addContent("removed link");
        RED.events.on("flows:remove", WsRemoved);
        RED.events.on("links:add", LinkAdded);
        RED.events.on("links:remove", LinkRemoved);
    }

    function AddLineToLog(text, foreColor, bgColor) {
        var style = "";
        if (foreColor != undefined)
            style = "color:" + foreColor + ";";
        if (bgColor != undefined)
            style += "background-color:" + bgColor + ";";
        RED.bottombar.info.addLine("<span style=" + style + ">" + text + "</span>");
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
        AddLineToLog:AddLineToLog, // simplifies usage of RED.bottombar.info.addLine(text);
        RegisterEvents:RegisterEvents
	};
})();