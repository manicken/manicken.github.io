

RED.arduino.board = (function () {

    function readFromIndexedDB() {
        RED.IndexedDBfiles.fileRead("otherFiles", RED.arduino.settings.Board.Platform + ".boards.txt", function (name, contents) {
            parse(contents);
            platformSelected();
            boardSelected(); // this rebuilds the options
        });
    }
    function writeToIndexedDB(name, contents) {
        RED.IndexedDBfiles.fileWrite("otherFiles", name, contents, function (dir, name) {
            console.warn("writeToIndexedDB " + name + " [OK]");
            readFromIndexedDB();
           
        });
    }

    var treeData = {};
    function parse(fileData) {
        treeData = {};
        const t0 = performance.now();
        var lines = fileData.split('\n');

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length == 0) continue; // empty line
            if (line[0] == '#') continue; // comment line
            var lio = line.indexOf('=');
            if (lio == -1) continue; // line don't contain any value
            var key = line.substring(0, lio);
            var value = line.substring(lio + 1);

            var keySplit = key.split('.');

            var obj = treeData;
            for (var ksi = 0; ksi < keySplit.length; ksi++) {
                var keySplitKey = keySplit[ksi];
                if (obj[keySplitKey] == undefined)
                    obj[keySplitKey] = {};

                if (ksi == keySplit.length - 1)
                    obj[keySplitKey].value = value;
                obj = obj[keySplitKey];
            }
        }
        
        const t1 = performance.now();
        console.warn("parse took " + (t1-t0) + " milliseconds");

        //RED.main.download(RED.arduino.settings.Board.Platform+".boards.singleline.json", JSON.stringify(fileData)); // only used to update the embedded board files
        //RED.main.download("tree.teensy.boards.json", JSON.stringify(treeData, null, 4));
        //console.warn(treeData);
    }

    function platformSelected() {
        var brdCmbBoxId = RED.arduino.settingsEditor.export.items.board.items["Board.Board"].valueId;

        var boardNames = [];
        var boardLabels = [];
        var rootNames = Object.getOwnPropertyNames(treeData);

        for (var i = 0; i < rootNames.length; i++) {
            var rootName = rootNames[i];
            var obj = treeData[rootName];
            if (obj.name == undefined) continue;
            boardNames.push(rootName);
            boardLabels.push(obj.name.value);
        }

        RED.settings.editor.setOptionList(brdCmbBoxId, boardNames, null, boardLabels);
    }

    

    function boardSelected() {
        // the following can be uncommented to download and see the structure easier when debugging or adding functionality
        //RED.main.download("tree."+RED.arduino.settings.Board.Platform+".boards.json", JSON.stringify(treeData, null, 4));

        var boardId = RED.arduino.settings.Board.Board;
        var brdOptionsId = RED.arduino.settingsEditor.export.items.board.items.options.valueId;
        $("#"+ brdOptionsId).empty();
        
        var board = treeData[boardId];
        if (board == undefined) {/*RED.notify("error could not select board " + boardId, "warning", null, 3000);*/ return; }
        if (board.menu == undefined) {/*RED.notify("board have no options " + boardId, "warning", null, 3000);*/ return; }
        
        options = RED.arduino.settings.Board.Options;

        var menuIds = Object.getOwnPropertyNames(board.menu);
        for (var mi = 0; mi < menuIds.length; mi++) {
            var menuId = menuIds[mi];
            var menuLabel = treeData.menu[menuId].value;
            var menuOptions = Object.getOwnPropertyNames(board.menu[menuId]);
            var menuOptionLabels = [];
            for (var moi = 0; moi < menuOptions.length; moi++) {
                menuOptionLabels.push(board.menu[menuId][menuOptions[moi]].value);
            }
            //console.warn(menuOptions, menuOptionLabels);
            if (options[menuId] == undefined)
                options[menuId] = menuOptions[0];

            RED.settings.editor.createComboBoxWithApplyButton(brdOptionsId, "cmb-arduino-export-board-options-" + menuId, menuLabel, function(value, id) {
                var mid = id.replace("cmb-arduino-export-board-options-", "");
                //console.warn(mid + " new value: " + value);
                options[mid] = value;
                RED.storage.update();
            }, options[menuId], "100%", {options:menuOptions, optionTexts:menuOptionLabels, actionOnChange:true});

            //RED.settings.editor.setOptionList("arduino.export.board.options." + menuId, menuOptions, null, menuOptionLabels);
        }
       
        //RED.arduino.settings.Board.Options = options;
    }
    function export_platformIO() {
        var platform = RED.arduino.settings.Board.Platform;
        var boardId = RED.arduino.settings.Board.Board;
        var pioini = "";
        pioini += "[env:teensy]\n";
        pioini += "platform = " + platform + "\n";
        pioini += "framework = arduino\n";
        pioini += "board = " + boardId + "\n";
        pioini += "build_flags = ";

        if (platform == "teensy") {
            var options = RED.arduino.settings.Board.Options;
            
            pioini += " -D " + treeData[boardId].menu.usb[options.usb].build.usbtype.value;
            
            if (options.opt == "o2std")
                pioini += " -D TEENSY_OPT_FASTER";
            else if (options.opt == "o1std")
                pioini += " -D TEENSY_OPT_FAST";
            else if (options.opt == "o3std")
                pioini += " -D TEENSY_OPT_FASTEST";
            else if (options.opt == "ogstd")
                pioini += " -D TEENSY_OPT_DEBUG";
            else if (options.opt == "osstd")
                pioini += " -D TEENSY_OPT_SMALLEST_CODE";
            //pioini += " -D " + treeData[boardId].menu.opt[options.opt].build.flags.optimize.value;
        
            

            //prefs += "custom_" + on + "=" + boardId + "_" + options[on] + "\n";
        }

        pioini += "\n";
        //
        return pioini;
    }
    function export_arduinoIDE() {
        var prefs = "";
        var boardId = RED.arduino.settings.Board.Board;
        prefs += "board=" + boardId + "\n";
        var platform = RED.arduino.settings.Board.Platform;

        if (platform == "teensy") {
            prefs += "target_package=teensy\n";
            prefs += "target_platform=avr\n";
        }
        else if (platform == "arduino") {
            prefs += "target_package=arduino\n";
            prefs += "target_platform=avr\n";
        }
        else if (platform.startsWith("esp")) {
            prefs += "target_package="+platform+"\n";
            prefs += "target_platform="+platform+"\n";
        }
        else if (platform == "stm32f1") {
            prefs += "target_package=stm32duino\n";
            prefs += "target_platform=STM32F1\n";
        }
        else if (platform == "stm32f4") {
            prefs += "target_package=stm32duino\n";
            prefs += "target_platform=STM32F4\n";
        }
        var options = RED.arduino.settings.Board.Options;
        var ons = Object.getOwnPropertyNames(options); // option name s
        for (var i = 0; i < ons.length; i++) {
            var on = ons[i]; // option name
            prefs += "custom_" + on + "=" + boardId + "_" + options[on] + "\n";
        }
        //
        return prefs;
    }
    function export_makeFile() {
        var makeFile = "";

        return makeFile;
    }

    return {
        
        readFromIndexedDB:readFromIndexedDB,
        writeToIndexedDB:writeToIndexedDB,
        boardSelected:boardSelected,
        export_platformIO:export_platformIO,
        export_arduinoIDE:export_arduinoIDE,
        export_makeFile:export_makeFile,
	};
})();




/*var boardNames = Object.getOwnPropertyNames(boards);
        for (var bi = 0; bi < boardNames.length; bi++) {
            var brdName = boardNames[bi];
            var brd = boards[brdName];
            var brdMenuName = brdName + ".menu.";

            for (var i = 0; i < keyValues.length; i++) {
                var kv = keyValues[i];

                if (kv.key.startsWith(brdMenuName) == false) continue;

                var menuItem = kv.key.substring(kv.key.indexOf("menu.") + 5);
                var menuId = menuItem.substring(0, menuItem.indexOf('.'));
                menuItem = menuItem.substring(menuItem.indexOf('.') + 1);

                if (brd.menus == undefined)
                    brd.menus = {};
                if (brd.menus[menuId] == undefined)
                    brd.menus[menuId] = {label: menus[menuId], options: {}};

                var lio = menuItem.indexOf('.');
                if (lio != -1) {
                    var menuOptions = menuItem.substring(lio+1);
                    menuItem = menuItem.substring(0, lio);
                    if (brd.menus[menuId].options[menuItem] == undefined)
                        brd.menus[menuId].options[menuItem] = {};
                    //if (brd.menus[menuId].options[menuItem].params == undefined)
                    //    brd.menus[menuId].options[menuItem].params = {};
                    brd.menus[menuId].options[menuItem][menuOptions] = kv.value;

                }
                else
                {
                    if (brd.menus[menuId].options[menuItem] == undefined)
                        brd.menus[menuId].options[menuItem] = {};
                    brd.menus[menuId].options[menuItem].label = kv.value;
                }
            }
        }*/