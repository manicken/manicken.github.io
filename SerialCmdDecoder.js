var SerialCmdDecoder = (function() {

    var RX_MODE = {
        CMD:0,
        RAW:1
    };
    var rawDataCmds = [];

    /** @type {number[]} uint8 number */
    var rxRawBuffer = [];
    /** @type {number[]} uint8 number */
    var rxCmdBuffer = "";
    var lastRxCmd = "";
    var lastRxCmdParams = [];
    var mode = RX_MODE.CMD;
    var cmdTerminator = '\n';
    var cmdParamDeliminator = ' ';
    var rawTotalLength = 0;
    var rawCurrentCount = 0;

    var CB_decoded = undefined;

    /**
     * 
     * @param {Uint8Array} data 
     */
    function decode(data)
    {
        //console.log(OSC.getDataArrayAsAsciiAndHex(data));
        //return;
        for (var i=0;i<data.length;i++)
        {
            var byte = data[i];
            if (mode == RX_MODE.CMD) {
                //if (byte != cmdTerminator)
                    rxCmdBuffer += String.fromCharCode(byte);
                    if (rxCmdBuffer.endsWith(cmdTerminator) == false) continue;
                //else
                //{
                    if (rxCmdBuffer == cmdTerminator) continue; // empty cmd
                    
                    lastRxCmdParams = rxCmdBuffer.split(cmdParamDeliminator);
                    rxCmdBuffer = "";
                    lastRxCmd = lastRxCmdParams[0];
                    //console.log(lastRxCmdParams);
                    if (rawDataCmds.includes(lastRxCmd)) {
                        rawTotalLength = parseInt(lastRxCmdParams[1]);
                        //console.log("rawTotalLength:"+rawTotalLength);
                        rawCurrentCount = 0;
                        if (rawTotalLength > 0) {
                            mode = RX_MODE.RAW;
                            //console.log("raw rx enabled");
                            rxRawBuffer = [];
                            
                        }
                    }
                    else {
                        //console.log(lastRxCmdParams);
                        if (CB_decoded != undefined)
                            CB_decoded(lastRxCmdParams);
                    }
                //}
            }
            else if (mode == RX_MODE.RAW)
            {
                rxRawBuffer.push(byte);
                rawCurrentCount++;
                if (rawCurrentCount == rawTotalLength) {
                    mode = RX_MODE.CMD;
                    //console.log("raw rx disabled");
                    if (CB_decoded != undefined)
                        CB_decoded(lastRxCmdParams,rxRawBuffer);
                }
            }
        }
    }

    function init(params)
    {
        CB_decoded = params.CB_decoded;
        rawDataCmds = params.rawDataCmds;
        cmdTerminator = params.cmdTerminator;
        cmdParamDeliminator = params.cmdParamDeliminator;

    }

    return {
        init,
        decode
    };

})(); // SerialReceiver namespace