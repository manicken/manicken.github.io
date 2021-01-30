

RED.arduino.boardsParser = (function () {

    function readFromIndexedDB() {
        RED.IndexedDBfiles.fileRead("otherFiles", "teensy.boards.txt", function (name, contents) {
            parse(contents);
            generateMenu();
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
            if (lio == -1) continue; // invalid line
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

        //RED.main.download("tree.teensy.boards.json", JSON.stringify(treeData, null, 4));
        //console.warn(treeData);
    }

    function generateMenu() {
        var brdCmbBoxId = RED.arduino.settingsEditor.export.items.board.items["Board.Board"].valueId;
        var brdOptionsId = RED.arduino.settingsEditor.export.items.board.items.options.valueId;
        

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

    return {
        
        readFromIndexedDB:readFromIndexedDB,
        writeToIndexedDB:writeToIndexedDB,
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