

RED.IndexedDBfiles = (function() {
    var defSettings = {
        testFileName: "testFile.txt",
        testFileDataIn: "helloWorld",
        testFileDataOut: "",
        testFileNames: "",
        testDir: "projects",
    };
    var _settings = {
        testFileName: defSettings.testFileName,
        testFileDataIn: defSettings.testFileDataIn,
        testDir: defSettings.testDir,
    };
    var settings = {
        get testDir() { return _settings.testDir; },
        set testDir(value) { _settings.testDir = value; testListFiles(); RED.storage.update();},

        get testFileName() { return _settings.testFileName; },
        set testFileName(value) { _settings.testFileName = value; RED.storage.update();},

        get testFileNames() { return settings.testFileName;},
        set testFileNames(value) { settings.testFileName = value; $("#" + settingsEditor.testFileName.valueId).val(value); },
        
        get testFileDataIn() { return _settings.testFileDataIn; },
        set testFileDataIn(value) { _settings.testFileDataIn = value; RED.storage.update();},
        
        get testFileDataOut() { return defSettings.testFileDataOut; },
		set testFileDataOut(value) { },
    };
    var settingsCategory = { label:"IndexedDB files", expanded:false, bgColor:"#DDD" };
    var settingsEditor = {
        testDir:          { label:"test dir", type:"combobox", actionOnChange:true, options:["projects", "codeFiles", "images", "otherFiles"], valIsText:true},
        testFileNames:          { label:"test file names", type:"combobox", actionOnChange:true},
        testFileName:          { label:"test file name", type:"string"},
        //testListFiles:        { label:"list files", type:"button", action:testListFiles},
        testFileDataIn:          { label:"test file data input", type:"multiline", rows:4},
        testFileDataOut:          { label:"test file data output", type:"multiline", rows:4, readOnly:true},
        testFileWrite:        { label:"test file write", type:"button", action:testFileWrite},
        testFileRead:        { label:"test file read", type:"button", action:testFileRead},
        
    };
    var db;
    var objectStoreName = "files";
    
    function testFileWrite()
    {
        fileWrite(settings.testDir, settings.testFileName, settings.testFileDataIn);
    }

    function testFileRead()
    {
        fileRead(settings.testDir, settings.testFileName, function(name, data) {
            if (data == undefined) { RED.notify("error<br>file not found:<br>" + name, "warning", null, 3000); return; }

            $("#" + settingsEditor.testFileDataOut.valueId).val(data);
        }, function(err) { RED.notify(err, "danger", null, 3000);});
    }

    function testListFiles()
    {
        listFiles(settings.testDir, function(data) {
            if (data == undefined) { RED.notify("error<br>file not found:<br>", "warning", null, 3000); return; }

            console.warn("testListFiles:", data);

            RED.settings.editor.setOptionList(settingsEditor.testFileNames.valueId, data, true);
            //$("#" + settingsEditor.testFileDataOut.valueId).val(data.join("\n"));
        }, function(err) { RED.notify(err, "danger", null, 3000);});
    }

    function init(cbOk)
    {
        // In the following line, you should include the prefixes of implementations you want to test.
        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        // DON'T use "var indexedDB = ..." if you're not in a function.
        // Moreover, you may need references to some window.IDB* objects:
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
        // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
        if (!window.indexedDB) {
            console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
            return;
        }
        console.log(window.indexedDB);
        // initial initiation
        var request = window.indexedDB.open("AudioSystemDesignTool", 1);
        request.onerror = function(event) { console.warn("indexDB request onerror: ", event.target.error); }; // this also happen when upgrade is needed
        request.onupgradeneeded = function(event) { // This event is only implemented in recent browsers
            let db = event.target.result;
            var objectStore = db.createObjectStore("projects", { keyPath: "name" });
            objectStore.createIndex("name", "name", { unique: true });
            objectStore.createIndex("data", "data", { unique: false });
            objectStore = db.createObjectStore("codeFiles", { keyPath: "name" });
            objectStore.createIndex("name", "name", { unique: true });
            objectStore.createIndex("data", "data", { unique: false });
            objectStore = db.createObjectStore("images", { keyPath: "name" });
            objectStore.createIndex("name", "name", { unique: true });
            objectStore.createIndex("data", "data", { unique: false });
            db.close();
        };
        // upgrade to version 2 if needed
        request = window.indexedDB.open("AudioSystemDesignTool", 2);
        request.onerror = function(event) { console.warn("indexDB request onerror: ", event.target.error); };// this also happen when upgrade is needed
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            var objectStore = db.createObjectStore("otherFiles", { keyPath: "name" });
            objectStore.createIndex("name", "name", { unique: true });
            objectStore.createIndex("data", "data", { unique: false });
            db.close();
        };
        // updgrade to version 3 if needed
        request = window.indexedDB.open("AudioSystemDesignTool", 3);
        request.onerror = function(event) { console.warn("indexDB request onerror: ", event.target.error); };// this also happen when upgrade is needed
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            var upgradeTransaction = event.target.transaction;
            
            addCreateIndex(upgradeTransaction, "projects", "DateTime");
            addCreateIndex(upgradeTransaction, "codeFiles", "DateTime");
            addCreateIndex(upgradeTransaction, "images", "DateTime");
            addCreateIndex(upgradeTransaction, "otherFiles", "DateTime");
            console.warn("upgrade to version 3 completed");
            
        };

        request.onsuccess = function(event) {
            db = event.target.result; 
            console.warn("indexDB request onsuccess: ", db );
            db.onerror = function(event) {
                // Generic error handler for all errors targeted at this database's
                // requests!
                console.error("Database Error: " + event.target.errorCode);
            };
            if (cbOk != undefined)
                cbOk();
            else {
                db.close();
                RED.notify("cbOk was not defined in IndexedDBfiles init", "danger", null, 3000);
            }
        };
    }

    function addCreateIndex(transaction, dir, name) {
        var objectStore = transaction.objectStore(dir);
        objectStore.createIndex(name, name, { unique: false });
    }

    function getFileDateTime(currentdate) {
        var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
        return datetime;
    }

    function fileWrite(dir, name, data, cb) {
        init(function() {
            var html = "";

            //console.log("data" + data + ">>>" + String.fromCharCode(data.charCodeAt(3)+0x30) + "<<<");
            // Create a new object ready to insert into the IDB
            var newItem = [ { name: name, data: data, DateTime: getFileDateTime(new Date())} ];
        
            // open a read/write db transaction, ready for adding the data
            var transaction = db.transaction(dir, "readwrite");
        
            // report on the success of the transaction completing, when everything is done
            transaction.oncomplete = function(event) {
                db.close();
                html += '<li>Transaction completed.</li>';
                //RED.notify(html, "success", null, 3000);
                if (cb != undefined)
                    cb(dir, name);
            };
        
            transaction.onerror = function(event) {
                db.close();
                html += '<li>Transaction not opened due to error. Duplicate items not allowed.</li>';
                RED.notify(html, "danger", null, 3000);
                
            };
        
            // create an object store on the transaction
            var objectStore = transaction.objectStore(dir);
        
            // Make a request to add our newItem object to the object store
            var objectStoreRequest = objectStore.put(newItem[0]);
        
            objectStoreRequest.onsuccess = function(event) {
                // report the success of our request
                html += '<li>Request successful.</li>';
            };
        });
    }

    function fileRead(dir, name, cbOk, cbError) {
        init(function() {
            try { var tx = db.transaction(dir, "readwrite"); }
            catch(ex) { cbError("fileReadError: " + dir + "\\" + name + "<br>" + ex); db.close(); return; }
            var store = tx.objectStore(dir);
            var get = store.get(name);
            get.onsuccess = function () {
                db.close();
                if (get.result == undefined){ if (cbError != undefined) cbError("file read error:" +  dir + "\\" + name); }
                else cbOk(name, get.result.data);
            };
            get.onerror = function () {
                db.close();
                if (cbError != undefined) cbError("getAllKeys error" + get.result.error);
            };
        });
    }
    
    function fileDelete(dir, name) {

    }

    function listFiles(dir, cbOk, cbError) {
        init(function() {
            //console.log("listFiles:",dir);
            var tx;
            try { tx = db.transaction(dir, "readwrite"); }
            catch(ex) { if (cbError != undefined) cbError("directory not found:" + dir +"<br>"+ ex); db.close(); return; }
            var store = tx.objectStore(dir);
            var get = store.getAllKeys();
            get.onsuccess = function () { 
                db.close();
                if (get.result == undefined){ if (cbError != undefined) cbError("no files found in " + dir);}
                else cbOk(get.result);
            };
            get.onerror = function () {
                db.close();
                if (cbError != undefined) cbError("getAllKeys error" + get.result.error);
            };
        });
    }

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        
        init:init,
        fileWrite:fileWrite,
        fileRead:fileRead,
        fileDelete:fileDelete,
        listFiles:listFiles
        
	};
})();