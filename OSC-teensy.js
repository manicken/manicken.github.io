

var OSC = (function() {
    var OSC_REPLY_CODES = ["OK","NOT_FOUND","BLANK_NAME","DUPLICATE_NAME","NO_DYNAMIC","NO_MEMORY", // 0-5
                           "AMBIGUOUS_PATH","NOT_ROUTED","INVALID_METHOD","NOT_CONNECTED", 	 // 6-9
                           "IN_USE"];

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

    var available = navigator;

    /**
     * 
     * @param {String[]} params cmd+parameters
     * @param {number[]} data optional raw data
     * @param {REDNode} foundUiObject
     */
    function SerialCmdDecoded(params, data, foundUiObject)
    {
        if (foundUiObject.type == "UI_Image")
        {
            RED.view.ui.drawImageData(foundUiObject, data);
        }
        else if (foundUiObject.type == "UI_TextBox")
        {
            //RED.nodes.namedNode(params[0]).svgRect.select("textarea").text(params[1]);
            foundUiObject.svgRect.select("textarea").text(params[1]);
        }
        else if (foundUiObject.type == "UI_Label")
        {
            //RED.nodes.node(params[0]).svgRect.select("text").text(params[1]);
            foundUiObject.svgRect.select("text").text(params[1]);
        }
        /*
        if (params[0] == "imgM") {
            RED.view.ui.drawImageData("imgM", data, 224, 168);
        }
        else if (params[0] == "imgGP") {
            RED.view.ui.drawImageData("imgGP", data, 320, 10);
            //console.log(params);
            //console.log(data); // just output it here for the moment
        }
        else if (params[0] == "txtMinT") {
            console.log(params);
            RED.nodes.namedNode("txtMinT").svgRect.select("textarea").text(params[1]);
            //RED.nodes.node("20220419T211653_865Z_e1c8").svgRect.select("text").text(params[1]);
        }
        else if (params[0] == "txtMidT") {
            RED.nodes.namedNode("txtMidT").svgRect.select("textarea").text(params[1]);
            //RED.nodes.node("20220419T211653_866Z_3726").svgRect.select("text").text(params[1]);
        }
        else if (params[0] == "txtMaxT") {
            RED.nodes.namedNode("txtMaxT").svgRect.select("textarea").text(params[1]);
            //RED.nodes.node("20220419T211653_866Z_fa17").svgRect.select("text").text(params[1]);
        }
        else
        {
            //console.log(params);
        }*/
    }
    var lastFrame = 0;
    
    function UI_object_not_found(params)
    {
        if (params[0] == "frame") // hardcode this for now
        {
            var currentFrame = parseInt(params[1]);

            if (lastFrame != (currentFrame - 1))
                RED.bottombar.info.addContent("imgM frame drop " + currentFrame + "<br>");
            lastFrame = currentFrame;
        }
    }

    function Init() {
    
        if (navigator.serial == undefined) {
            console.warn("Web Serial API not availabe on this browser!")
            available = false;

            var a = "Currently not available at the current browser<br>as this functionality currently is implemented using the Web Serial API<br>in the future WebSockets will be supported that will then enable this functionality.<br><br>"
        
            $("#btn-osc-clearAll").addClass("disabled");
            $("#btn-connectSerial").addClass("disabled");
            $("#btn-disConnectSerial").addClass("disabled");
            $("#btn-export-osc").addClass("disabled");
            $("#btn-save-osc-sd").addClass("disabled");
            $("#btn-load-osc-sd").addClass("disabled");
            $("#btn-save-json-sd").addClass("disabled");
            $("#btn-load-json-sd").addClass("disabled");
            $("#btn-osc-clearAll").addClass("disabled");
            RED.main.SetPopOver("#btn-connectSerial", a);
            RED.main.SetPopOver("#btn-disConnectSerial", a);

            return false;
        }
        SerialCmdDecoder.init({CB_decoded:SerialCmdDecoded, rawDataCmds:["imgM","imgGP"], cmdTerminator:'\n', cmdParamDeliminator:' ', CB_UI_object_not_found:UI_object_not_found});

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
        console.warn("connection "+new Date().toISOString());
        await port.open({baudRate:115200, bufferSize:1024});
        console.warn("done "+new Date().toISOString());

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
                    if (RED.OSC.settings.Encoding == 1)
                        slipDecoder.decode(value);
                    else if (RED.OSC.settings.Encoding == 0)
                        SerialCmdDecoder.decode(value);
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
    var rxilsd = 0; // rx interleaved style def.
    function getCurrentRxLogStyle() {
        if (rxilsd == 0) {
            rxilsd = 1;
            return "background-color:"+RED.color.subtractColor(RED.OSC.settings.ShowOutputOscRxColor, "#101010")+";";
        }else{
            rxilsd = 0;
            return "background-color:"+RED.OSC.settings.ShowOutputOscRxColor+";";
        }
    }
    var txilsd = 0; // tx interleaved style def.
    function getCurrentTxLogStyle() {
        if (txilsd == 0) {
            txilsd = 1;
            return "background-color:"+RED.color.subtractColor(RED.OSC.settings.ShowOutputOscTxColor, "#101010")+";";
        }else{
            txilsd = 0;
            return "background-color:"+RED.OSC.settings.ShowOutputOscTxColor+";";
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
                /*rxDecoded += "<br>timeTag:" + JSON.stringify(oscRx.timeTag) + "<br>";
                rxDecoded += "packets: " + "<br>";
                for (var i = 0; i < oscRx.packets.length; i++) {
                    rxDecoded += JSON.stringify(oscRx.packets[i]);
                    if (i < oscRx.packets.length - 1)
                        rxDecoded += "<br>";
                }*/
                rxDecoded = GetBundleCompactForm(oscRx,RED.OSC.settings.RedirectDebugToConsole == false);
            }
            if ((RED.OSC.settings.ShowOutputOscRxRaw == true) || (RED.OSC.settings.ShowOutputOscRxDecoded == true)) {
                AddLineToLog(rxDecoded, undefined, getCurrentRxLogStyle());
            }

            RED.events.emit("OSCBundle:Received", oscRx);
        }
        catch (err) { // print what we have so far
            AddLineToLog(rxDecoded+"<br>"+err,"error");
        }
    }
    
    var txFIFO = [];
    var dataIndex = 0;

    async function SendRawToSerial(data) {
        if (available == false){ 
            AddLineToLog("[Web Serial API not availabe]", "warning");
            return false;
        }

        if (port == undefined || port.writable == undefined) {
            if (RED.OSC.settings.ShowOutputDebug == true)
            AddLineToLog("(not connected)", "warning");
            return false;
        }

        if (port.writable.locked == true) {
            console.error("enqueue data " + dataIndex);
            txFIFO.push({data:data, index:dataIndex++});
            return false;
        }
        const writer = port.writable.getWriter();

        await writer.write(data).then(
            function (value) { writer.releaseLock(); SendNextInBuffer();},
            function (error) { console.warn("serial write error "+ error); writer.releaseLock(); SendNextInBuffer();}
        );
        return true;
    }

    function SendNextInBuffer() {
        if (txFIFO.length != 0) {
            var item = txFIFO.shift();
            console.error("dequeue data " + item.index);
            var dataSent = SendRawToSerial(item.data);
            if (RED.OSC.settings.ShowOutputOscTxRaw == true && dataSent)
                AddLineToLog("raw send:<br>" + getDataArrayAsAsciiAndHex(item.data).split('<').join('&lt;').split('>').join('&gt;').split('\0').join('&Oslash;'), undefined, getCurrentTxLogStyle());
        }
    }

    function SendData(data) {
        if (RED.OSC.settings.Encoding == 1) // SLIP
        {
            //AddLineToLog("using SLIP");
            data = Slip.encode(data);
        }
        
        var dataSent = false;
        if (RED.OSC.settings.TransportLayer == 0) // Web Serial API
            dataSent = SendRawToSerial(data);
        else {
            AddLineToLog("(WARNING) Try to use Transport Layer NIY "+RED.OSC.LayerOptionTexts[RED.OSC.settings.TransportLayer] + "<brPlease select annother transport layer", "warning");
        }

        if (RED.OSC.settings.ShowOutputOscTxRaw == true && dataSent)
            AddLineToLog("raw send:<br>" + getDataArrayAsAsciiAndHex(data).split('<').join('&lt;').split('>').join('&gt;').split('\0').join('&Oslash;'), undefined, getCurrentTxLogStyle());
    }
    function SendBundle(b) {
        delete b.add;
        delete b.addPackets;
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(GetBundleCompactForm(b,RED.OSC.settings.RedirectDebugToConsole == false), undefined, getCurrentTxLogStyle());
        SendData(CreateBundleData(b, true));
    }
    var oscOptions = {metadata:true};
    function SendPacket(p) {
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(GetPacketCompactForm(p,RED.OSC.settings.RedirectDebugToConsole == false), undefined, getCurrentTxLogStyle());
        SendData(osc.writePacket(p,oscOptions));
    }
    function SendMessage(address, valueTypes, ...values) {
        SendPacket(CreatePacket(address, valueTypes, ...values));
    }
    function SendTextToSerial(text) {
        SendRawToSerial(new TextEncoder("utf-8").encode(text));
    }
    function CreateMessageData(address, valueTypes, ...values)  {
        var p = CreatePacket(address, valueTypes, ...values);
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true)
            AddLineToLog(GetPacketCompactForm(p,RED.OSC.settings.RedirectDebugToConsole == false), undefined, getCurrentTxLogStyle());
        return osc.writePacket(p);
    }

    function CreateBundleData(b,dontShowDebug) {
        delete b.add;
        delete b.addPackets;
        if (RED.OSC.settings.ShowOutputOscTxDecoded == true && dontShowDebug == undefined)
            AddLineToLog(GetBundleCompactForm(b,RED.OSC.settings.RedirectDebugToConsole == false), undefined, getCurrentTxLogStyle());
        return osc.writeBundle(b,oscOptions)
    }

    function CreatePacket(address, vts, ...vs) { // valueTypes, values
        var packet = {address:address, args: []};
        if (vts == undefined || vts == "") return packet; // just return a "empty" packet
       
        var vti = 0; // value type index
        var vi = 0; // value index
        while (1) { // this is dangerous so special care must be taken
            if (vts[vti] == "T" || vts[vti] == "F") {
                packet.args.push({type:vts[vti++]});
            }
            else {
                packet.args.push({type:vts[vti++], value:vs[vi++]});
            }

            if (vti == vts.length) break;
            if (vs.length != 0 && vi == vs.length) break;
        }
        var skippedItems = "";
        if (vti < vts.length) skippedItems = "skipped following types (because of types and values mismatch):<br>[";
        else if (vi < vs.length) skippedItems = "skipped following values: (because of types and values mismatch):<br>[";

        while (vti < vts.length) {
            skippedItems += vts[vti];
            if (vti < (vts.length - 1)) skippedItems += ", ";
            vti++;
        }

        while (vi < vs.length) {
            skippedItems += vs[vi];
            if (vi < (vs.length - 1)) skippedItems += ", ";
            vi++;
        }
        if (skippedItems != "")
            AddLineToLog("(WARNING) @ OSC.CreatePacket() "+skippedItems + "]", "warning");
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
        if (faultCode < OSC_REPLY_CODES.length) {
            var oscReplyType = OSC_REPLY_CODES[faultCode];
            if (oscReplyType == "OK") {
                if (RED.OSC.settings.RedirectDebugToConsole == true) {
                    console.log("OK");
                }
                else {
                    RED.bottombar.info.addLine("OK");
                }
                return;
            }
            if (RED.OSC.settings.DebugOscRxDecodedReplies)
                RED.bottombar.info.addLine(OSC_REPLY_CODES[faultCode]);
            return;
        }
        else
        {
            RED.bottombar.info.addLine("WARNING: unknown fault code: " + faultCode);
            return;
        }
    }

    function GetBundleCompactForm(bundle,htmlFormat) {
        var str = "";
        str = "timeTag:" + JSON.stringify(bundle.timeTag) + "\n";
        str += "packets:\n";
        for (var i = 0; i < bundle.packets.length; i++) {
            str += OSC.GetPacketCompactForm(bundle.packets[i]) + "\n";
        }
        if (htmlFormat != undefined && htmlFormat == true) {
            return str.split('<').join('&lt;').split('>').join('&gt;').split('\0').join('&Oslash;').split('\n').join('<br>');
        }
        return str;
    }

    function GetPacketCompactForm(packet) {
        var addr = packet.address;
        var argsVF = ""; // VF = Value Format
        var argsV = "";

        //return JSON.stringify(packet);

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
    var lastLogType = "info1";
    var llt = 0;
    var bgColor1 = "#f5f6fd";

    var rootStyle ='display: inline-block;'+
                'padding: 5px;'+
                /*'margin-bottom: 20px;'+*/
                'border: 1px solid #fbeed5;'+
                '-webkit-border-radius: 4px;'+
                '-moz-border-radius: 4px;'+
                'border-radius: 4px;'+
                'text-decoration: none;';

    function AddLineToLog(text, type, style) {
        if (type != undefined && style == undefined)
        {
            if (RED.OSC.settings.RedirectDebugToConsole == true) {
                console.log('%c'+text.split('<br>').join("\n"), rootStyle );
                return;
            }
            
            text = '<div class="alert alert-'+type+' message">'+text+"</div>";
        }
        else if (style != undefined) {
            if (RED.OSC.settings.RedirectDebugToConsole == true) {
                //console.warn(text);
                if (text.endsWith('<br>')) text = text.substring(0, text.length - 4);

                console.log('%c'+text.split('<br>').join("\n").split(":").join("_"), rootStyle + style);
                return;
            }
            text = '<div class="alert alert-info1 message" style="'+style+'">'+text+"</div>";
        }
        else {
            if (lastLogType == "info1") {
                lastLogType = "info2";
            }
            else {
                lastLogType = "info1";
            }
            text = '<div class="alert alert-'+lastLogType+' message">'+text+"</div>";
        }
        

        if (RED.OSC.settings.OnlyShowLastDebug == false)
            RED.bottombar.info.addContent(text);
        else
            RED.bottombar.info.setContent(text);
    }

    function SetLog(text, type) {
        if (type != undefined)
            text = '<div class="alert alert-'+type+' message">'+text+"</div>";

        RED.bottombar.info.setContent(text);
    }

    function RegisterEvents() {
        RED.events.on("OSCBundle:Received", OSCBundleReceived);
    }

    return {

        GetClearAllAddr,
        GetCreateGroupAddr,
        GetCreateObjectAddr,
        GetRenameObjectAddr,
        GetDestroyObjectAddr,
        GetCreateConnectionAddr,
        GetConnectAddr,
        // shorts
        get ClearAllAddr() {return GetClearAllAddr();},
        get CreateGroupAddr() {return GetCreateGroupAddr();},
        get CreateObjectAddr() {return GetCreateObjectAddr();},
        get RenameObjectAddr() {return GetRenameObjectAddr();},
        get DestroyObjectAddr() {return GetDestroyObjectAddr();},
        get CreateConnectionAddr() {return GetCreateConnectionAddr();},
        
        RootAddress: RED.OSC.settings.RootAddress,
        NoteFreqs: [8.176, 8.662, 9.177, 9.723, 10.301, 10.913, 11.562, 12.25, 12.978, 13.75, 14.568, 15.434, 16.352, 17.324, 18.354, 19.445, 20.602, 21.827, 23.125, 24.5, 25.957, 27.5, 29.135, 30.868, 32.703, 34.648, 36.708, 38.891, 41.203, 43.654, 46.249, 48.999, 51.913, 55, 58.27, 61.735, 65.406, 69.296, 73.416, 77.782, 82.407, 87.307, 92.499, 97.999, 103.826, 110, 116.541, 123.471, 130.813, 138.591, 146.832, 155.563, 164.814, 174.614, 184.997, 195.998, 207.652, 220, 233.082, 246.942, 261.626, 277.183, 293.665, 311.127, 329.628, 349.228, 369.994, 391.995, 415.305, 440, 466.164, 493.883, 523.251, 554.365, 587.33, 622.254, 659.255, 698.456, 739.989, 783.991, 830.609, 880, 932.328, 987.767, 1046.502, 1108.731, 1174.659, 1244.508, 1318.51, 1396.913, 1479.978, 1567.982, 1661.219, 1760, 1864.655, 1975.533, 2093.005, 2217.461, 2349.318, 2489.016, 2637.02, 2793.826, 2959.955, 3135.963, 3322.438, 3520, 3729.31, 3951.066, 4186.009, 4434.922, 4698.636, 4978.032, 5274.041, 5587.652, 5919.911, 6271.927, 6644.875, 7040, 7458.62, 7902.133, 8372.018, 8869.844, 9397.273, 9956.063, 10548.08, 11175.3, 11839.82, 12543.85],
        GetBundleCompactForm, // for debuggin bundles
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
        
        getDataArrayAsAsciiAndHex,
        RegisterEvents,
        Init
	};
})(); // OSC namespace