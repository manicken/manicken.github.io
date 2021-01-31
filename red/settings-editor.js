

RED.settings.editor = (function() {

    function createCategory(RED_Class, containerId, id, settingCatParams, isRoot)
    {
        var headerLabel = settingCatParams.label;
        var expanded = settingCatParams.expanded;
        var popupText = settingCatParams.popupText;
        var bgColor = settingCatParams.bgColor;
        var headerBgColor = settingCatParams.headerBgColor;
        var headerTextColor = settingCatParams.headerTextColor;
        var menuItems = settingCatParams.menuItems;
        if (expanded)
        {
            var chevron = '<i class="icon-chevron-down expanded"></i>';
            var displayStyle = "block;";
        }
        else
        {
            var chevron = '<i class="icon-chevron-down"></i>';
            var displayStyle = "none;";
        }
        if (bgColor != undefined) bgColor = " background-color:"+bgColor + ";";
        else bgColor = "";
        if (headerBgColor != undefined) headerBgColor = " background-color:"+headerBgColor + ";";
        else headerBgColor = "";
        if (headerTextColor != undefined) headerTextColor = " color:"+headerTextColor + ";";
        else headerTextColor = "";
        var headerId = "set-header-" + id;
        var catContainerId = "set-content-"  + id;
        var headerMenuBtnResetId = "set-menu-btnReset-" + id;
        var html = "";
        html += '<div class="settings-category" style="'+ bgColor +'">';
        if (isRoot != undefined && isRoot == true) {
            html += '<div class="btn-group pull-left settings-menu">';
            html += '<a class="btn dropdown-toggle settings-menu" data-toggle="dropdown" href="#"><i class="icon-align-justify"></i></a>';
            html += '<ul class="dropdown-menu">';
            html += '<li><a id="'+headerMenuBtnResetId+'" ><i class="fa fa-refresh"></i> Reset Settings</a></li>';
            if (menuItems != undefined && Array.isArray(menuItems)) {
                for (var mii = 0; mii < menuItems.length; mii++) {
                    var mi = menuItems[mii];
                    html += '<li><a id="set-mnu-item-'+id+'" ><i class="'+mi.iconClass+'"></i> '+mi.label+'</a></li>';
                }
            }
            html += '</ul>';
            html += '</div>';
        }
        html += '<div id="'+headerId+'" class="settings-header" style="'+ headerBgColor + headerTextColor +'">';
        
        html += '<span>'+headerLabel+'</span>';
        html += chevron;
        html += '</div>';
        html += '<div class="settings-content" id="'+catContainerId+'" style="display: '+displayStyle+bgColor+'">';
        html += '</div>\n';
        html += '</div>\n';
        //RED.console_ok("create complete Button @ " + containerId + " = " + label + " : " + id);
        $("#"+containerId).append(html);
        settingCatParams.valueId = catContainerId;
        
        if (isRoot != undefined && isRoot == true) {
            $("#" + headerMenuBtnResetId).on('click', function(e) { resetCatSettings(e, RED_Class); });

            if (menuItems != undefined && Array.isArray(menuItems)) {
                for (var mii = 0; mii < menuItems.length; mii++) {
                    var mi = menuItems[mii];
                    $('#set-mnu-item-'  + id).on('click', mi.action);
                    if (mi.popupText != undefined)
                        RED.main.SetButtonPopOver('#set-mnu-item-'  + id, mi.popupText, "left");
                }
            }
        }
        $("#" + headerId).off('click').on('click', function(e) {
            
            var displayStyle = $(this).next().css('display');
            if (displayStyle == "block")
            {
                $(this).next().slideUp();
                $(this).children("i").removeClass("expanded"); // chevron
            }
            else
            {
                $(this).next().slideDown();
                $(this).children("i").addClass("expanded"); // chevron
            }
        });
        if (popupText != undefined)
        {
            RED.main.SetButtonPopOver("#" + headerId, popupText, "left");
        }
        return catContainerId;
    }


    /**
     * creates and returns html code for a checkbox with label
     * @param {string} id 
     * @param {string} label 
     */
    function createCheckBox(containerId, id, label, cb, param, popupText)
    {
        var html = "";
        html += '<div class="settings-item" id="divSetting-'+id+'">';

        html += '<div class="center">';
        html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'</label>';
        html +=	'</div>';

        html += '<div class="center">';
        html +=	'<input style="margin-bottom: 0px; margin-top: 0px;" type="checkbox" id="'+id+'" checked="checked" />';
        html +=	'</div>';

        html +=	'</div>';

        //RED.console_ok("create complete checkbox @ " + containerId + " = " + label + " : " + id);
        $("#" + containerId).append(html);
        if (typeof cb === "function")
        {
            $('#' + id).click(function() { cb($('#' + id).prop('checked')); });
            $('#' + id).prop('checked', param);
        }
        else if(typeof cb == "object")
        {
            $('#' + id).click(function() { cb[param] = $('#' + id).prop('checked'); });
            $('#' + id).prop('checked', cb[param]);
        }
        if (popupText != undefined)
        {
            RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
        }
    }
    function createTextInputWithApplyButton(containerId, id, label, cb, param,textInputWidth, popupText, readOnly)
    {
        if (readOnly == undefined) readOnly = false;
        
        var html = "";
        html += '<div class="settings-item" id="divSetting-'+id+'">';

        html += '<div class="center">';
        html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
        html += '</div>';

        html += '<div class="center">';
        html += '<input class="settings-item-textInput" type="text" id="'+id+'" name="'+id+'" style="width: '+textInputWidth+';"/>';
        if (textInputWidth.endsWith("%"))
        {
            html += '</div>';
            
            html += '<div class="settings-item-multiline-btn">';
        }
        if (readOnly == false)
        {
            html += '<button class="btn btn-success btn-sm settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
        }
        html += '</div>';

        html += '</div>';

        //RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id + popupText);
        $("#" + containerId).append(html);
        if (readOnly == false)
        {
            if (typeof cb === "function")
            {
                $('#btn-' + id).click(function() { cb($('#' + id).val());});
                $('#' + id).val(param);
            }
            else if(typeof cb == "object")
            {
                $('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
                $('#' + id).val(cb[param]);
            }
        }
        if (popupText != undefined)
        {
            RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
        }
    }
    function createMultiLineTextInputWithApplyButton(containerId, id, label, cb, param,textInputWidth, options)
    {
        var textRows = options.rows;
        var popupText = options.popupText;
        var readOnly = options.readOnly;
        if (textInputWidth == undefined) textInputWidth = 40;
        if (textRows == undefined) textRows = 8;
        if (readOnly == undefined) readOnly = false;
        var html = "";
        html += '<div class="settings-item" id="divSetting-'+id+'">';

        html += '<div class="center">';
        html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
        html += '</div>';

        html += '<div class="center">';
        html += '<textarea class="settings-item-multilinetextInput" type="text" id="'+id+'" name="'+id+'" rows="'+textRows+'" cols="50" style="width: '+textInputWidth+'px;"/>';
        html += '</div>';

        if (readOnly == false)
        {
            html += '<div class="settings-item-multiline-btn">';
            html += '<button class="btn btn-success btn-sm settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
            html += '</div>';
        }

        html += '</div>';

        //RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id);
        $("#" + containerId).append(html);
        if (readOnly == false)
        {
            if (typeof cb === "function")
            {
                $('#btn-' + id).click(function() { cb($('#' + id).val());});
                $('#' + id).val(param);
            }
            else if(typeof cb == "object")
            {
                $('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
                $('#' + id).val(cb[param]);
            }
        }
        if (popupText != undefined)
        {
            RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
        }
    }
    function createComboBoxWithApplyButton(containerId, id, label, cb, param, textInputWidth, options)
    {
        if (textInputWidth == undefined) textInputWidth = 40;
        var html = ""
        html += '<div class="settings-item" id="divSetting-'+id+'">';

        html += '<div class="center" id="divSetting-'+id+'">';
        html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
        html += '</div>';
        
        html += '<div class="center">';
        html += '<select class="settings-item-combobox" type="text" id="'+id+'" name="'+id+'" style="width: '+textInputWidth+';">';
        /*if (options != undefined && Array.isArray(options))
        {
            for (var oi = 0; oi < options.length; oi++)
            {
                html += '<option value="' + options[oi] + '">' + options[oi] + '</option>'
            }
        }*/
        html += '</select>';
        html += '</div>';
        if (options.actionOnChange == undefined || options.actionOnChange == false) {
            html += '<div class="settings-item-multiline-btn">';
            html += '<button class="btn btn-success settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
            html += '</div>';
        }
        html += '</div>';
        $("#" + containerId).append(html);

        try {
        if (options.options != undefined)
            setOptionList(id, options.options, options.valIsText, options.optionTexts);
        } catch (ex) {console.error(ex);}

        if (typeof cb === "function")
        {
            //console.warn(label , " is function  hardcoded");
            if (options.actionOnChange == undefined || options.actionOnChange == false)
                $('#btn-' + id).click(function() { cb($('#' + id).val(), id);});
            else
                $('#' + id).change(function() { cb($('#' + id).val(), id);});

            $('#' + id).val(param);
        }
        else if(typeof cb == "object")
        {
            //console.warn(label , " is object hardcoded");
            if (options.actionOnChange == undefined || options.actionOnChange == false)
                $('#btn-' + id).click(function() {console.warn(id,cb, param, cb[param]); cb[param] = $('#' + id).val(); });
            else
                $('#' + id).change(function() {console.warn(id,cb, param, cb[param]); cb[param] = $('#' + id).val(); });
            $('#' + id).val(cb[param]);
        }
        else
            console.warn(label , " is ", typeof cb);

        if (options.popupText != undefined)
        {
            RED.main.SetButtonPopOver("#divSetting-" + id, options.popupText, "left");
        }
    }
    function setOptionList(selectId, options, valIsText, optionTexts)
    {
        //console.warn(options, optionTexts);
        var select = $("#"+ selectId);
        select.empty();
        if (valIsText == undefined) valIsText = false;
        var haveOptionTexts = (optionTexts != undefined) && (Array.isArray(optionTexts));

        //console.log("setOptionList",selectId,options);
        for (var i = 0; i < options.length; i++)
        {
            if (haveOptionTexts == true)
                select.append( $("<option>").val(options[i]).html(optionTexts[i]));
            else if (valIsText == false)
                select.append( $("<option>").val(i).html(options[i]));
            else
                select.append( $("<option>").val(options[i]).html(options[i]));
        }
    }
    function createColorSel(containerId, id, label, cb, param, popupText)
    {
        var html = "";
        html += '<div class="settings-item" id="divSetting-'+id+'">';

        html += '<div class="center">';
        html += '<label class="settings-item-label" for="'+id+'">&nbsp;'+label+'&nbsp;</label>';
        html += '</div>';

        html += '<div class="center">';
        html += '<input id="'+id+'" data-jscolor=""/>';
        html += '<button class="btn btn-success btn-sm settings-item-applyBtn" type="button" id="btn-'+id+'">Apply</button>';
        html += '</div>';

        html += '</div>';

        //RED.console_ok("create complete TextInputWithApplyButton @ " + containerId + " = " + label + " : " + id);
        $("#" + containerId).append(html);
        if (typeof cb === "function")
        {
            $('#btn-' + id).click(function() { cb($('#' + id).val());});
            $('#' + id).val(param);
        }
        else if(typeof cb == "object")
        {
            $('#btn-' + id).click(function() { cb[param] = $('#' + id).val(); });
            $('#' + id).val(cb[param]);
        }
        //<div class="form-row">
        //<label for="node-input-color"><i class="fa fa-tag"></i> Color</label>
        //<input id="node-input-color" data-jscolor="">
        //</div>
        if (popupText != undefined)
        {
            RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
        }
    }
    function createButton(containerId, id, label, buttonClass, cb, popupText, isFileInput)
    {
        var html = "";
        html += '<div class="settings-item center" id="divSetting-'+id+'">';
        if (isFileInput == undefined)
            html += '<button class="btn '+buttonClass+'" type="button" id="btn-'+id+'">'+label+'</button>';
        else if (isFileInput == true) {
            html += '<div>';
            html += '<input id="btn-'+id+'" class="btn action-import" type="file" multiple style="display:none;"/>'
            html += '<label for="btn-'+id+'" style="width:87%;" " class="btn action-import" ><i class="fa fa-folder-open"></i>'+label+'</label>'
            html += '</div>';
        }
        html += '</div>';

        //RED.console_ok("create complete Button @ " + containerId + " = " + label + " : " + id);
        $("#" + containerId).append(html);

        if (isFileInput == undefined)
            $('#btn-' + id).click(cb);
        else if (isFileInput == true)
            $('#btn-' + id).change(cb); // note file input uses the change event

        if (popupText != undefined)
        {
            RED.main.SetButtonPopOver("#divSetting-" + id, popupText, "left");
        }
    }
    return {
        createCategory:createCategory,
        createCheckBox:createCheckBox,
        createTextInputWithApplyButton:createTextInputWithApplyButton,
        createMultiLineTextInputWithApplyButton:createMultiLineTextInputWithApplyButton,
        createComboBoxWithApplyButton:createComboBoxWithApplyButton,
        createColorSel:createColorSel,
        createButton:createButton,
        setOptionList:setOptionList
    };
})();