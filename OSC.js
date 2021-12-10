RED.OSC = (function() {

    var defSettings = {

        WsAddedScript: 'RED.bottombar.info.addLine("added Workspace " + ws.label);',
        WsRenamedScript: 'RED.bottombar.info.addLine("renamed Workspace from " + oldName + " to " + newName);',
        WsRemovedScript: 'RED.bottombar.info.addLine("removed Workspace " + ws.label);',
        NodeAddedScript: 'RED.bottombar.info.addLine("added node " + node.name);\n' + 
                         'var addr = "/teensy1/dynamic/createObject*"\n' +
                         'var data = OSC.GetSimpleOSCdata(addr,"ss", node.type, node.name);\n' + 
                         'OSC.SendAsSlipToSerial(data);',
        NodeChangedScript: 'RED.bottombar.info.addLine("renamed node from " + changes.name + " to " + node.name);\n'+
                           'var addr = "/teensy1/dynamic/ren*"\n'+
                           'var data = OSC.GetSimpleOSCdata(addr,"ss", changes.name, node.name);\n'+
                           'OSC.SendAsSlipToSerial(data);,',
        NodeRemovedScript: 'RED.bottombar.info.addLine("removed node " + node.name);\n'+
                            'var addr = "/teensy1/dynamic/destroy*"\n'+
                            'var data = OSC.GetSimpleOSCdata(addr,"s", node.name);\n'+
                            'OSC.SendAsSlipToSerial(data);',
        LinkAddedScript: 'RED.bottombar.info.addLine("added link (" + link.source.name + ", " + link.sourcePort + ", " + link.target.name + ", " + link.targetPort + ")" );\n'+
                            'RED.bottombar.info.addLine("added link (" + link.source.name + ", " + link.sourcePort + ", " + link.target.name + ", " + link.targetPort + ")" );\n'+
                            'var data = osc.writeBundle({timeTag: osc.timeTag(0),packets: [\n'+
                            '    {address: "/teensy1/dynamic/createConn*",args: [{type: "s", value: link.source.name+link.sourcePort+link.target.name+link.targetPort}]},\n'+
                            '    {address: "/teensy1/audio/wafo2mixer1/connect*", args: [{type: "s", value: link.source.name}, {type: "i", value: link.sourcePort}, {type: "s", value: link.target.name}, {type: "i", value: link.targetPort}]}\n'+
                            '	]});\n'+
                            'OSC.SendAsSlipToSerial(data);',
        LinkRemovedScript: 'RED.bottombar.info.addLine("removed link (" + link.source.name + ", " + link.sourcePort + ", " + link.target.name + ", " + link.targetPort + ")");\n' + 
                            'var addr = "/teensy1/dynamic/destroy*"\n'+
                            'var data = OSC.GetSimpleOSCdata(addr,"s", link.source.name+link.sourcePort+link.target.name+link.targetPort);\n'+
                            'OSC.SendAsSlipToSerial(data);'
    }
    var _settings = {
        WsAddedScript: defSettings.WsAddedScript,
        WsRenamedScript: defSettings.WsRenamedScript,
        WsRemovedScript: defSettings.WsRemovedScript,
        NodeAddedScript: defSettings.NodeAddedScript,
        NodeChangedScript: defSettings.NodeChangedScript,
        NodeRemovedScript: defSettings.NodeRemovedScript,
        LinkAddedScript: defSettings.LinkAddedScript,
        LinkRemovedScript: defSettings.LinkRemovedScript,
    }
    var settings = {
        get WsAddedScript() { return _settings.WsAddedScript; },
        set WsAddedScript(value) { _settings.WsAddedScript = value; RED.storage.update();},
        get WsRenamedScript() { return _settings.WsRenamedScript; },
        set WsRenamedScript(value) { _settings.WsRenamedScript = value; RED.storage.update();},
        get WsRemovedScript() { return _settings.WsRemovedScript; },
        set WsRemovedScript(value) { _settings.WsRemovedScript = value; RED.storage.update();},
        get NodeAddedScript() { return _settings.NodeAddedScript; },
        set NodeAddedScript(value) { _settings.NodeAddedScript = value; RED.storage.update();},
        get NodeChangedScript() { return _settings.NodeChangedScript; },
        set NodeChangedScript(value) { _settings.NodeChangedScript = value; RED.storage.update();},
        get NodeRemovedScript() { return _settings.NodeRemovedScript; },
        set NodeRemovedScript(value) { _settings.NodeRemovedScript = value; RED.storage.update();},
        get LinkAddedScript() { return _settings.LinkAddedScript; },
        set LinkAddedScript(value) { _settings.LinkAddedScript = value; RED.storage.update();},
        get LinkRemovedScript() { return _settings.LinkRemovedScript; },
        set LinkRemovedScript(value) { _settings.LinkRemovedScript = value; RED.storage.update();},
    }
    var settingsCategory = { label:"OSC", expanded:false, popupText: "Open Sound Control settings", bgColor:"#DDD" };

    var settingsEditor = {
        WsAddedScript:   { label:"Class Added Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Workspace/Flow/Class is added"},
        WsRenamedScript:   { label:"Class Renamed Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Workspace/Flow/Class is renamed"},
        WsRemovedScript:   { label:"Class Removed Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Workspace/Flow/Class is removed"},
        NodeAddedScript:   { label:"Audio Object Added Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Node/'Audio Object' is added"},
        NodeChangedScript:   { label:"Audio Object Changed Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Node/'Audio Object' is changed/renamed"},
        NodeRemovedScript:   { label:"Audio Object Removed Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Node/'Audio Object' is removed"},
        LinkAddedScript:   { label:"AudioConnection Added Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Link/AudioConnection/Patchcable is added"},
        LinkRemovedScript:   { label:"AudioConnection Removed Event", type:"multiline", useAceEditor:true,aceEditorMode:"c_cpp", popupText: "the user script that is executed when a Link/AudioConnection/Patchcable is removed"},
    }

    function RegisterEvents() {
        RED.events.on("nodes:add", NodeAdded);
        RED.events.on("nodes:change", NodeChanged);
        RED.events.on("nodes:remove", NodeRemoved);
        RED.events.on("flows:add", WsAdded);
        RED.events.on("flows:renamed", WsRenamed);//RED.bottombar.info.addContent("removed link");
        RED.events.on("flows:remove", WsRemoved);
        RED.events.on("links:add", LinkAdded);
        RED.events.on("links:remove", LinkRemoved);
    }

    function WsAdded(ws) { eval(_settings.WsAddedScript); }
    function WsRenamed(oldName,newName) { eval(_settings.WsRenamedScript); }
    function WsRemoved(ws) { eval(_settings.WsRemovedScript); }
    function NodeAdded(node) { eval(_settings.NodeAddedScript); }
    function NodeChanged(node,changes) { if (changes.name == undefined) return; eval(_settings.NodeChangedScript); }
    function NodeRemoved(node) { eval(_settings.NodeRemovedScript); }
    function LinkAdded(link) { eval(_settings.LinkAddedScript); }
    function LinkRemoved(link) { eval(_settings.LinkRemovedScript); }

    return {
        defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,

        RegisterEvents:RegisterEvents,
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
                    // value is a Uint8Array.
                    console.log(value);
                }
            } catch (error) {
                RED.notify("Serial port read error " + error, "warning", null, 5000);
            } finally {
                // Allow the serial port to be closed later.
                reader.releaseLock();
            }
        }

        await port.close();
    }
    //const closedPromise = readUntilClosed();

    async function SendRawToSerial(data) {
        const writer = port.writable.getWriter();
        await writer.write(data);

        // Allow the serial port to be closed later.
        writer.releaseLock();
    }
    function SendAsSlipToSerial(data) {
        SendRawToSerial(Slip.encode(data));
    }
    async function SendTextToSerial(text) {
        var data = new TextEncoder("utf-8").encode(text);

        const writer = port.writable.getWriter();

        await writer.write(data);

        // Allow the serial port to be closed later.
        writer.releaseLock();
    }
    function GetSimpleOSCdata(address, valueTypes, ...values)  {
        var oscPacket =  {
            address:address,
            args:[]
        };
        for (var i = 0; i < values.length; i++) {
            oscPacket.args.push({type:valueTypes[i], value:values[i]})
        }
        /*{
            type:valueType,
            value:value
        }*/
        console.warn(oscPacket);

        var data = osc.writePacket(oscPacket);
        //console.log(data);
        return data;//SendRawToSerial(data);
    }

    

    return {
        SendRawToSerial:SendRawToSerial,
        SendAsSlipToSerial:SendAsSlipToSerial,
        SendTextToSerial:SendTextToSerial,
        GetSimpleOSCdata:GetSimpleOSCdata,
	};
})();