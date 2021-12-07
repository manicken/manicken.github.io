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
    function GetSimpleOSCdata(address, valueType, value)  {
        var data = osc.writePacket( {
            address:address,
            args:[
                {
                    type:valueType,
                    value:value
                }
            ]});
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