
RED.export = (function () {

    function showExportDialog(title, text, textareaLabel,overrides,okPressedCb) {
        if (overrides == undefined) var overrides = {};
        if (overrides.okText == undefined) overrides.okText = "Ok";

        var box = document.querySelector('.ui-droppable'); // to get window size
        function float2int(value) {
            return value | 0;
        }
        RED.view.state(RED.state.EXPORT);
        var t2 = performance.now();
        RED.view.getForm('dialog-form', 'export-clipboard-dialog', function (d, f) {
            if (textareaLabel != undefined)
                $("#export-clipboard-dialog-textarea-label").text(textareaLabel);
                if (overrides.tips != undefined)
                    $("#export-clipboard-dialog-tips").text(overrides.tips);
            $("#node-input-export").val(text).focus(function () {
                var textarea = $(this);

                //textarea.select();
                //console.error(textarea.height());
                var textareaNewHeight = float2int((box.clientHeight - 220) / 20) * 20;// 20 is the calculated text line height @ 12px textsize, 220 is the offset
                textarea.height(textareaNewHeight);

                textarea.mouseup(function () {
                    textarea.unbind("mouseup");
                    return false;
                });
            }).focus();



            //console.warn(".ui-droppable.box.clientHeight:"+ box.clientHeight);
            //$( "#dialog" ).dialog("option","title","Export to Arduino").dialog( "open" );
            $("#dialog").dialog({
                title: title,
                width: box.clientWidth * 0.60, // setting the size of dialog takes ~170mS
                height: box.clientHeight,
                buttons: [
                    {
                        text: overrides.okText,
                        click: function () {
                            RED.console_ok("Export dialog OK pressed!");
                            $(this).dialog("close");
                            if (okPressedCb != undefined)
                                okPressedCb();
                        }
                    },
                    {
                        text: "Cancel",
                        click: function () {
                            RED.console_ok("Export dialog Cancel pressed!");
                            $(this).dialog("close");
                        }
                    }
                ],
            }).dialog("open");

        });
        //RED.view.dirty(false);
        const t3 = performance.now();
        console.log('arduino-export-save-show-dialog took: ' + (t3 - t2) + ' milliseconds.');
    }
    

    return {
        showExportDialog:showExportDialog,
            //haveIO:haveIO,
            //getTypeName:getTypeName
    };
})();