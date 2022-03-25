
/**
 * @typedef {Object} ExportObject 
 * @property {String} type
 * @property {String} name
 * @property {String} comment
*/

class WsExport
{
    
    /** @type {String} */
    fileName = "";
    /** @type {String} */
    className = ""; // the actual name of the workspace/class
    /** @type {String[]} */
    classComments = []; //  user specified class comment node(s) contents
    /** @type {String[]} */
    constructorCode = []; // user specified constructor node(s) contents
    /** @type {String[]} */
    destructorCode = []; // user specified destructor node(s) contents
    /** @type {String[]} */
    eofCode = []; // user specified eof node(s) contents
    /** @type {String[]} */
    functions = []; // user function node(s) contents
    /** @type {String[]} */
    variables = []; // user variable node(s) contents
    /** @type {String[]} */
    workspaceIncludes = []; // the design workspace includes, i.e. the dependencies  
    /** @type {String[]} */
    userIncludes = []; // user specified includes


    /** contain all AudioStream Objects
     * @type {ExportObject[]} */
    audioObjects = [];
    /** contain all Audio Control Objects
     * @type {ExportObject[]} */
    audioControlObjects = [];
    /** contain all AudioConnection code that don't belongs to the array code 
     * @type {String[]}
    */
    nonArrayAudioConnections = [];
    /** contain all AudioConnection code that belongs to the array code 
     * @type {String[]}
     */
    arrayAudioConnections = []; // TODO fix so that different size arrays are allowed

    totalAudioConnectionCount = 0;
    acArrayLength = 0; // should be replaced by above arrayNodes = {}; that allows different size arrays

    /** 
     * used by (h4yn0nnym0u5e) depend order
     * @type {String[]} */
    depends = []; 

    isMain = false;

    constructor(ws)
    {
        this.className = ws.label;
        if (ws.isMain == true)
        {
            this.isMain = true;

            var fileName = "";
            if (ws.mainNameType == "main")
                fileName = "main";
            else if (ws.mainNameType == "projectName")
                fileName = RED.arduino.settings.ProjectName;
            else // this includes if (ws.mainNameType == "tabName")
                fileName = ws.label;
            this.fileName = fileName + ws.mainNameExt;
        }
        else if (ws.label == "main.cpp") {
            this.isMain = true;
            this.fileName = ws.label;
        }
        else {
            this.fileName = ws.label + ".h";
        }
    }
    
    /**
     * used to generate a 'wsfile' object
     * from all collected data
     * @param {CompleteExport} ce
     */
    generateWsFile(ce)
    {
        var minorIncrement = RED.arduino.settings.CodeIndentations;
        var majorIncrement = minorIncrement * 2;
        
        var newWsCpp = new ExportFile(this.fileName, "");
        newWsCpp.className = this.className;
        newWsCpp.depends = this.depends; // h4yn0nnym0u5e class depending sorter
        

        // ######### MASTER TODO ###########
        // seperate following into different functions for easier code

        if (this.classComments.length > 0) {
            newWsCpp.body += "\n/**\n" + this.classComments + " */"; // newline not needed because it allready in beginning of class definer (check down)
        }
        if (this.isMain == false) {
            newWsCpp.body += "\nclass " + this.className + " " + ws.extraClassDeclarations +"\n{\npublic:\n";
        }
        if (this.variables.join("\n").trim().length > 0) {
            if (newWsCpp.isMain == false)
                newWsCpp.body += TEXT.incrementLines(this.variables.join("\n"), minorIncrement);
            else
                newWsCpp.body += this.variables.join("\n");
        }

        
        var mi_indent = TEXT.getNrOfSpaces(minorIncrement);
        var ma_indent = TEXT.getNrOfSpaces(majorIncrement);

        

        if (this.totalAudioConnectionCount != 0) {
            newWsCpp.body += mi_indent + RED.arduino.export2.getAudioConnectionTypeName() + " ";
            newWsCpp.body += TEXT.getNrOfSpaces(32 - RED.arduino.export2.getAudioConnectionTypeName().length);
            newWsCpp.body += "*patchCord[" + this.totalAudioConnectionCount + "]; // total patchCordCount:" + this.totalAudioConnectionCount + " including array typed ones.\n";
        }
        
        // this is only used by the obsolete PointerArray object
        /*for (var ani = 0; ani < this.arrayNodes.length; ani++) {
            var arrayNode = this.arrayNodes[ani];
            newWsCpp.body += mi_indent + arrayNode.type + " ";
            newWsCpp.body += TEXT.getNrOfSpaces(32 - arrayNode.type.length);
            newWsCpp.body += "*" + arrayNode.name + ";\n";
        }*/

        // generate constructor code
        newWsCpp.body += "\n// constructor (this is called when class-object is created)\n";
        if (RED.arduino.settings.ExportMode < 3)
            newWsCpp.body += mi_indent + this.className + "() { \n";
        else {
            newWsCpp.body += mi_indent + this.className + "(const char* _name,OSCAudioGroup* parent) : \n";
            newWsCpp.body += mi_indent + "  OSCAudioGroup(_name,parent), // construct our base class instance\n";
        }

        if (this.totalAudioConnectionCount != 0)
            newWsCpp.body += mi_indent + "int pci = 0; // used only for adding new patchcords\n"
        if (RED.arduino.settings.ExportMode == 3)
            newWsCpp.body += mi_indent + "OSCAudioGroup& grp = *this;\n"
        
        newWsCpp.body += "\n";

        // this is only used by the obsolete PointerArray object
        /*
        for (var ani = 0; ani < this.arrayNodes.length; ani++) {
            var arrayNode = this.arrayNodes[ani];
            newWsCpp.body += mi_indent + arrayNode.name + " = new " + arrayNode.type + "[" + arrayNode.objectCount + "]";
            if (arrayNode.autoGenerate)
                newWsCpp.body += "{" + arrayNode.cppCode.substring(0, arrayNode.cppCode.length - 1) + "}"
            else
                newWsCpp.body += arrayNode.cppCode;

            newWsCpp.body += "; // pointer array\n";
        }*/
        newWsCpp.body += "\n";
        newWsCpp.body += this.nonArrayAudioConnections.join('\n');
        if (this.acArrayLength != 0) { // TODO fix to allow different size arrays
            newWsCpp.body += ma_indent + "for (int i = 0; i < " + this.acArrayLength + "; i++) {\n";
            newWsCpp.body += this.arrayAudioConnections.join('\n');
            newWsCpp.body += ma_indent + "}\n";
        }else {
            newWsCpp.body += this.arrayAudioConnections.join('\n');
        }
        newWsCpp.body += TEXT.incrementLines(this.constructorCode.join('\n'), majorIncrement);
        newWsCpp.body += mi_indent + "}\n";

        
        // generate destructor code if enabled
        if (ws.generateCppDestructor == true) {
            newWsCpp.body += "\n" + mi_indent + "~" + this.className + "() { // destructor (this is called when the class-object is deleted)\n";
            if (this.totalAudioConnectionCount != 0) {
                newWsCpp.body += ma_indent + "for (int i = 0; i < " + this.totalAudioConnectionCount + "; i++) {\n";
                newWsCpp.body += ma_indent + mi_indent + "patchCord[i]->disconnect();\n"
                newWsCpp.body += ma_indent + mi_indent + "delete patchCord[i];\n"
                newWsCpp.body += ma_indent + "}\n";
            }
            newWsCpp.body += TEXT.incrementLines(this.destructorCode.join("\n"), majorIncrement);
            newWsCpp.body += mi_indent + "}\n";
        }

        var classFunctions = this.functions.join('\n');
        if (classFunctions.trim().length > 0) {
            if (newWsCpp.isMain == false)
                newWsCpp.body += "\n" + TEXT.incrementLines(classFunctions, minorIncrement);
            else
                newWsCpp.body += "\n" + classFunctions;
        }

        if (newWsCpp.isMain == false) {// don't include end of class marker when doing main.cpp 
            newWsCpp.body += "};\n"; // end of class
            newWsCpp.body += this.eofCode.join("\n"); // after end of class
        }


        newWsCpp.header = RED.arduino.export2.getCppHeader(ce.jsonString, this.workspaceIncludes.join("\n") + "\n ", ce.generateZip);
        newWsCpp.footer = RED.arduino.export2.getCppFooter();
        
        return newWsCpp;
    }
}

class ExportFile
{
    /** filename + extension
     * @type {String}
     */
    name = "";

    /** file body without header and footer, will be deleted in FinalizeFiles after export dialog is shown 
     * @type {String}
     */
    body = "";

    /** contains the whole file contents, after using FinalizeFiles*/
    contents = "";

    /** used to seperate header from contents when using export dialog, will be deleted in FinalizeFiles after export dialog is shown 
     * @type {String}
    */
    header = ""; 

    /** used to seperate footer from contents when using export dialog, will be deleted in FinalizeFiles after export dialog is shown 
     * @type {String}
    */
    footer = "";

    /** used by Http Post Bridge, 
     * this is normally set to true, 
     * but can be set to false if some target files need to preserved, 
     * otherwise all excess files will be removed*/
    overwrite_file = true;

    isMain = false;

    /**
     * used by h4yn0nnym0u5e depend sorting 
     * @type {String} */
    className = "";
    /**
     * used by h4yn0nnym0u5e depend sorting 
     * @type {String[]} */
    depends = [];
    /**
     * used by h4yn0nnym0u5e depend sorting 
     * @type {Boolean} */
    isExported = false;

    constructor(name, contents) {
        this.name = name;
        this.body = contents;
    }

    /** makes this file ready for either Zip or Http Post export */
    finalize() {
        this.contents = this.header + this.body + this.footer;
        delete this.header;
        delete this.footer;
        delete this.body;
        delete this.depends;
        delete this.isExported;
    }
}

/**
 * @typedef {Object} Keyword 
 * @property {String} token
 * @property {String} type
*/

class CompleteExport
{
    /** contain files that need to be before all wsCppFiles
     * @type {ExportFile[]} */
    globalCppFiles = [];
    /** contains all generated workspace/class files
     * @type {ExportFile[]} */
    wsCppFiles = [];
    /** this would contain the end result,
     * but are used for files that need to be before globalCppFiles
     * @type {ExportFile[]} */
    allFiles = [];

    /** @type {Keyword[]} */
    keywords = [];

    /** @type {Number[]} */
    mixervariants = undefined;

    /** @type {Number[]} */
    mixerStereoVariants = undefined;

    ac = new AudioConnectionExport();

    /** @readonly */
    jsonString = RED.storage.getData();

    generateZip = false;

    constructor(generateZip) {
        this.generateZip = generateZip;
        this.ac.minorIncrement = RED.arduino.settings.CodeIndentations;
        this.ac.majorIncrement = this.ac.minorIncrement * 2;

        if (RED.arduino.settings.UseAudioMixerTemplate != true) {
            this.mixervariants = [];
            this.mixerStereoVariants = [];
        }
    }

    /** makes this export ready for either Zip or Http Post export */
    finalize() {
        this.allFiles.push(...this.globalCppFiles);
        this.allFiles.push(...this.wsCppFiles);

        for (var i = 0; i < this.allFiles.length; i++)
            this.allFiles[i].finalize();
    }

    getPostObject() {
        return { files:this.allFiles, keywords:this.keywords, removeOtherFiles:true };
    }

    /** @returns {String} */
    getPostJSON() {
        return JSON.stringify(this.getPostObject(), null, 4)
    }
}

class AudioConnectionExport
{
    minorIncrement = 0;
    majorIncrement = 0;
    staticType = false;
    workspaceId = "";
    dstRootIsArray = false;
    srcRootIsArray = false;
    arrayLength = 0;
    src = {};
    srcName = "";
    srcPort = 0;
    srcIsClass = 0;
    dst = {};
    dstName = "";
    dstPort = 0;
    dstIsClass = 0;
    count = 1;
    totalCount = 0;
    cppCode = "";
    base()
    {
        if (this.staticType==true) return RED.arduino.export.getAudioConnectionTypeName() + "        patchCord"+this.count + "(";
        else {
            if (this.dstRootIsArray || this.srcRootIsArray)
                return TEXT.getNrOfSpaces(this.majorIncrement+this.minorIncrement) + "patchCord[pci++] = new "+RED.arduino.export.getAudioConnectionTypeName()+"(";
            else
                return TEXT.getNrOfSpaces(this.majorIncrement) + "patchCord[pci++] = new "+RED.arduino.export.getAudioConnectionTypeName()+"(";
        }
    }
    ifAnyIsArray()
    {
        return (this.dstRootIsArray || this.srcRootIsArray);
    }
    makeOSCname(n)
    {
        var result = this.srcName + '_' + this.srcPort + '_' + this.dstName + '_' + this.dstPort;
        result.replace("[","${").replace("]","}").replace(".","_")
        return result;
    }
    makeOSCnameQC(n)
    {
        if (RED.arduino.settings.ExportMode < 3)
            return "";
        else
            return '"' + this.makeOSCname(n) + '", ';
    }
    appendToCppCode()
    {
        //if ((this.srcPort == 0) && (this.dstPort == 0))
        //	this.cppCode	+= "\n" + this.base + this.count + "(" + this.srcName + ", " + this.dstName + ");"; // this could be used but it's generating code that looks more blurry

        if (this.dstRootIsArray && this.srcRootIsArray && this.staticType == true) {
            for (var i = 0; i < this.arrayLength; i++) {
                this.cppCode += this.base() + this.makeOSCnameQC(i) + this.srcName.replace('[i]', '[' + i + ']') + ", " + this.srcPort + ", " + this.dstName.replace('[i]', '[' + i + ']') + ", " + this.dstPort + ");";
                if (this.srcIsClass || this.dstIsClass) this.cppCode += warningClassUse;
                this.cppCode += "\n";
                this.count++;
            }
        }
        else if (this.dstRootIsArray) {
            if (this.staticType==false) {
                this.cppCode += this.base() + this.makeOSCnameQC(-1) + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", " + this.dstPort + ");";
                this.cppCode += "\n";
            }
            else {
                for (var i = 0; i < this.arrayLength; i++) {
                    this.cppCode += this.base() + this.makeOSCnameQC(i) + this.srcName + ", " + this.srcPort + ", " + this.dstName.replace('[i]', '[' + i + ']') + ", " + this.dstPort + ");";
                    if (this.srcIsClass || this.dstIsClass) this.cppCode += warningClassUse;
                    this.cppCode += "\n";
                    this.count++;
                }
                
            }
            this.totalCount += this.arrayLength;
        }
        else if (this.srcRootIsArray) {
            if (this.staticType==false) {
                this.cppCode += this.base() + this.makeOSCnameQC(-1) + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", i"+(this.dstPort>0?("+"+this.dstPort):"")+");";
                this.cppCode += "\n";
            }
            else {
                for (var i = 0; i < this.arrayLength; i++) {
                    this.cppCode += this.base() + this.makeOSCnameQC(i) + this.srcName.replace('[i]', '[' + i + ']') + ", " + this.srcPort + ", " + this.dstName + ", "+i+");";
                    if (this.srcIsClass || this.dstIsClass) this.cppCode += warningClassUse;
                    this.cppCode += "\n";
                    this.count++;
                }
            }
            this.totalCount += this.arrayLength;
        }
        else {
            this.cppCode += this.base() + this.makeOSCnameQC(-1) + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", " + this.dstPort + ");";
            if (this.staticType == true && (this.srcIsClass || this.dstIsClass)) this.cppCode += warningClassUse;
            this.cppCode += "\n";
            this.count++;
            this.totalCount++;
        }
    }
    checkIfDstIsArray()
    {
        var isArray = RED.export.isNameDeclarationArray(this.dstName, this.workspaceId);
        if (isArray == undefined) {
            this.dstRootIsArray = false;
            return false;
        }
        this.arrayLength = isArray.arrayLength;
        this.dstName = isArray.newName;
        this.dstRootIsArray = true;
        return true;
    }
    checkIfSrcIsArray()
    {

        var isArray = RED.export.isNameDeclarationArray(this.srcName, this.workspaceId);
        if (isArray == undefined) {
            this.srcRootIsArray = false;
            return false;
        }
        this.arrayLength = isArray.arrayLength;
        this.srcName = isArray.newName;
        this.srcRootIsArray = true;
        return true;
    }
   
}
const warningClassUse = " // warning this is referring to a class, which is not direct supported in simple export";
/**
     * @readonly
     * @enum {number}
     */
 var CPP_EXPORT_MODE = {
    /** SIMPLE flat export*/
    SIMPLE_FLAT:0,
    /** CLASS complete export */
    CLASS_COMPLETE:1,
    /** CLASS complete export to zip */
    CLASS_COMPLETE_ZIP:2,
    /** CLASS single export, used for development testing/debugging */
    CLASS_SINGLE:-1,
}


RED.arduino.export2 = (function () {
    'use strict';
    var nns = {}; // workaround for now, used by appendAudioConnection_s
    var tabNodes = []; // workaround for now, used by appendAudioConnection_s
    
    function init() // called from main.js @ init()
    {
        RED.main.SetPopOver("#menu-export2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-simple2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-class2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-class-dev2", "(under development)", "right");
        RED.main.SetPopOver("#btn-export-class-zip2", "(under development)", "right");
    }
    $('#btn-export-simple2').click(function () { Export(CPP_EXPORT_MODE.SIMPLE_FLAT); });
    $('#btn-export-class2').click(function () { Export(CPP_EXPORT_MODE.CLASS_COMPLETE); });
    $('#btn-export-class-dev2').click(function () { Export(CPP_EXPORT_MODE.CLASS_SINGLE); });
    $('#btn-export-class-zip2').click(function () { Export(CPP_EXPORT_MODE.CLASS_COMPLETE_ZIP); });
    

    
    /**
     * This is the main entry point for all exports
     * @param {CPP_EXPORT_MODE} export_mode 
     */
    function Export(export_mode) {
        const t0 = performance.now();

        if (export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE_ZIP) var generateZip = true;
        else var generateZip = false;
        
        RED.storage.update(); // sort is made inside update

        
        nns = RED.nodes.createCompleteNodeSet({newVer:false}); // workaround for now, used by appendAudioConnection_s
        tabNodes = RED.nodes.getClassIOportsSorted(undefined, nns); // workaround for now, used by appendAudioConnection_s

        var coex = new CompleteExport(generateZip);

        if (export_mode == CPP_EXPORT_MODE.SIMPLE_FLAT) {
            coex.ac.staticType = true; // allways true for SIMPLE FLAT
            export_workspace(coex, RED.nodes.currentWorkspace); 
        }
        else if (export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE || export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE_ZIP) {
            coex.allFiles.push(new ExportFile("GUI_TOOL.json", JSON.stringify(JSON.parse(coex.jsonString), null, 4))); // JSON beautifier
            //coex.allFiles.push(new ExportFile("preferences.txt", RED.arduino.board.export_arduinoIDE())); // skip for now as it don't properly work for the moment
            //coex.allFiles.push(new ExportFile("platformio.ini", RED.arduino.board.export_platformIO())); // skip for now as it don't properly work for the moment
            export_classBased(coex);
        }
        else if (export_mode == CPP_EXPORT_MODE.CLASS_SINGLE) {
            coex.ac.staticType = false; // allways false for CLASS SINGLE development export
            export_workspace(coex, RED.nodes.currentWorkspace);
        }
        else { // failsafe
            RED.notify("Error export mode not selected", "warning", null, 3000);
            return;
        }

        if (coex.mixervariants != undefined && coex.mixervariants.length > 0) {
            coex.globalCppFiles.push(...Mixers.GetFiles(coex.mixervariants));
        }
        console.error("@export as class RED.arduino.serverIsActive=" + RED.arduino.serverIsActive());

        // only show dialog when server is not active and not generating zip
        // or when export modes: SIMPLE_FLAT or CLASS_SINGLE
        var useExportDialog = ((RED.arduino.settings.useExportDialog == true) ||
                               (generateZip == false) || 
                               (export_mode == CPP_EXPORT_MODE.CLASS_SINGLE) || 
                               (export_mode == CPP_EXPORT_MODE.SIMPLE_FLAT));
        
        if (useExportDialog == true) 
            ShowExportDialog(coex);

        const t1 = performance.now();
        console.log('arduino-export-save2 took: ' + (t1 - t0) + ' milliseconds.');

        if (generateZip == false && export_mode == CPP_EXPORT_MODE.CLASS_COMPLETE)
            SendToHttpBridge(coex); // allways try to POST but not when exporting to zip
        else if (generateZip == true)
            GenerateZip(coex);
    }

    /**
     * 
     * @param {CompleteExport} coex 
     */
     function export_classBased(coex)
     {
         for (var wsi = 0; wsi < RED.nodes.workspaces.length; wsi++)
         {
             var ws = RED.nodes.workspaces[wsi];
             if (ws.export == false)
                 continue; // this skip export
             if (RED.nodes.getNodeInstancesOfType(ws.label).length == 0 && ws.isMain == false && ws.isAudioMain == false)
                 continue; // don't export classes/tabs not in use
             coex.ac.staticType = ws.isMain || (ws.label.toLowerCase() == "main.cpp");
             export_workspace(coex, ws);
         }
     }

    /**
     * 
     * @param {CompleteExport} coex
     * @param {REDWorkspace} ws
     */
    function export_workspace(coex, ws) {
        var wse = new WsExport(ws);
        coex.keywords.push({token:ws.label, type:"KEYWORD2"});
        
        coex.ac.workspaceId = ws.id;
        coex.ac.count = 1;
        coex.ac.totalCount = 0;
        
        for (var i = 0; i < ws.nodes.length; i++) {
            var n = ws.nodes[i];

            if (checkAndAddNonAudioObject(n, wse, coex.globalCppFiles)) {
                continue;
            }
            else if (n.type == "AudioMixer" && coex.mixervariants != undefined && RED.arduino.settings.ExportMode < 3) {
                var inputCount = RED.export.links.getDynInputDynSize(n);
                if (inputCount != 4) { // 4 input variant is allready in the audio lib

                    if (!coex.mixervariants.includes(inputCount)) {
                        coex.mixervariants.push(inputCount);
                    } 

                    var includeName = '#include "mixers.h"';
                    if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
                }
            }
            else if (n.type == "AudioMixerStereo" && coex.mixerStereoVariants != undefined && RED.arduino.settings.ExportMode < 3) {
                // for future implementation
            }
            else if (n._def.nonObject != undefined) {
                console.warn("!!!!WARNING!!!! (unhandled nonObject)\n" + n.type); // in case we forgot something
                continue; // skip
            }

            // Audio Control/class node without any IO
            if ((n.outputs <= 0) && (n.inputs <= 0) && (n._def.inputs <= 0) && (n._def.outputs <= 0)) { 
                var name = getName(n);
                var typeName = getTypeName(n);
                var comment = (n.comment!=undefined && n.comment.trim().length != 0)?n.comment:"";
                wse.audioControlObjects.push({name, typeName, comment});
                
                if (n._def.isClass != undefined) // (h4yn0nnym0u5e) keep track of class dependencies so we can export in valid order
						wse.depends.push(n.type);
                
                continue; // as they don't have any wires connected just skip to next node
            }
            else // Audio Processing Node and Class node that have IO
            { 
                var name = getName(n);
                var typeName = getTypeName(n);
                var comment = (n.comment!=undefined && n.comment.trim().length != 0)?n.comment:"";
                wse.audioObjects.push({name, typeName, comment});
            }
            // add audio object wires/connections
            var src = n;//RED.nodes.node(n.id, n.z);

            RED.nodes.nodeEachLink(n, function (srcPortIndex, dst, dstPortIndex)
            {
                if (src.type == "TabInput" || dst.type == "TabOutput") return; // now with JSON string at top, place-holders not needed anymore

                if (dst.type.startsWith("Junction"))
                {
                    var dstNodes = { nodes: [] };
                    getJunctionFinalDestinations(dst, dstNodes);
                    for (var dni = 0; dni < dstNodes.nodes.length; dni++) {
                        if (src === dstNodes.nodes[dni].node) continue; // failsafe, can't make connections back to itself
                        appendAudioConnection_s(wse, coex.ac, src, dstNodes.nodes[dni].node, srcPortIndex, dstNodes.nodes[dni].dstPortIndex);
                    }
                }
                else {
                    appendAudioConnection_s(wse, coex.ac, src, dst, srcPortIndex, dstPortIndex);
                }
            });
        }
        wse.acArrayLength = coex.ac.arrayLength; // workaround for now TODO remove usage
        wse.totalAudioConnectionCount = coex.ac.totalCount;
        coex.wsCppFiles.push(wse.generateWsFile(coex));
    }
    /**
     * 
     * @param {REDNode} n 
     * @param {WsExport} wse 
     * @param {CompleteExport} completeExport 
     * @returns 
     */
    function checkAndAddNonAudioObject(n,wse,completeExport) {
        if (n.type == "ClassComment") {
            wse.classComments.push(" * " + n.name);
        }
        else if (n.type == "Function") {
            wse.functions.push(n.comment); // we use comment field for function-data
        }
        else if (n.type == "Variables") {
            wse.variables.push(n.comment); // we use comment field for vars-data
        }
        else if (n.type == "PointerArray") {// this is special thingy that was before real-node, now it's obsolete, it only generates more code
            wse.arrayNodes.push({ type: n.objectType, name: n.name, cppCode: n.arrayItems, objectCount: n.arrayItems.split(",").length });
        }
        else if (n._def.isClass != undefined) {//RED.nodes.isClass(n.type)) {
            var includeName = '#include "' + n.type + '.h"';
            if (!wse.workspaceIncludes.includes(includeName)) wse.workspaceIncludes.push(includeName);
        }
        else if (n.type == "IncludeDef") {
            var includeName = '#include ' + n.name;
            if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
        }
        else if (n.type == "ConstValue") {
            wse.variables.push("const static " + n.valueType + " " + n.name + " = " + n.value + ";");
        }
        else if (n.type == "ConstructorCode") {
            wse.constructorCode.push(n.comment);
        }
        else if (n.type == "DestructorCode") {
            wse.destructorCode.push(n.comment);
        }
        else if (n.type == "EndOfFileCode") {
            wse.eofCode.push(n.comment);
        }
        else if (n.type == "CodeFile") // very special case
        {
            if (n.comment.length != 0) {
                var wsFile = new ExportFile(n.name, n.comment);
                wsFile.header = "\n// ****** Start Of Included File:" + n.name + " ****** \n";
                wsFile.footer = "\n// ****** End Of Included file:" + n.name + " ******\n";
                completeExport.globalCppFiles.push(wsFile);
            }

            var includeName = '#include "' + n.name + '"';
            if (includeName.toLowerCase().endsWith(".c") || includeName.toLowerCase().endsWith(".cpp")) return true; // return true because type taken care of

            if (!wse.userIncludes.includes(includeName)) wse.userIncludes.push(includeName);
        }
        else if (n.type == "DontRemoveCodeFiles") {
            var files = n.comment.split("\n");
            for (var fi = 0; fi < files.length; fi++) {
                var wsFile = new ExportFile(files[fi].trim(), "");
                wsFile.overwrite_file = false;
                completeExport.allFiles.push(wsFile); // push special files to the beginning 
            }
        }
        else if (n.type.startsWith("Junction")) {
            // don't do anything with junctions as they are only virtual objects
        }
        else if (n.type == "TabInput" || n.type == "TabOutput") {
            // don't do anything with Tab IO as they are only virtual objects
        }
        else if (n.type == "BusJoin" || n.type == "BusSplit") {
            // don't do anything with BusJoin/BusSplit as they are only virtual objects
        }
        else
            return false;
        return true;
    }

    /**
     * // TODO create class for NewAudioConnection
     * @param {WsExport} wse 
     * @param {AudioConnectionExport} ac 
     * @param {REDNode} src 
     * @param {REDNode} dst 
     * @param {*} pi 
     * @param {*} dstPortIndex 
     */
    function appendAudioConnection_s(wse, ac, src, dst, pi, dstPortIndex) {
        
        ac.cppCode = "";
        ac.srcName = RED.nodes.make_name(src);
        ac.dstName = RED.nodes.make_name(dst);
        ac.srcPort = pi;
        ac.dstPort = dstPortIndex; // default

        ac.checkIfSrcIsArray(); // we ignore the return value, there is no really use for it
        if (src._def.isClass != undefined) { // if source is class
            //console.log("root src is class:" + ac.srcName);
            RED.nodes.classOutputPortToCpp(nns, tabNodes.outputs, ac, n);
        }

        ac.checkIfDstIsArray(); // we ignore the return value, there is no really use for it
        if (dst._def.isClass != undefined) {
            //console.log("dst is class:" + dst.name + " from:" + n.name);
            RED.nodes.classInputPortToCpp(tabNodes.inputs, ac.dstName, ac, dst);
        }
        else
        {
            if (dst._def.dynInputs != undefined) {
                //console.error(dstPortIndex);
                ac.dstPort = RED.export.links.getDynInputDynSizePortStartIndex(dst, src, pi);
                //console.error(ac.dstPort);
            }
            ac.appendToCppCode(); // this don't return anything, the result is in ac.cppCode
        }
        if (ac.ifAnyIsArray())
            wse.arrayAudioConnections.push(...ac.cppCode.split('\n')); // TODO fix so that different size arrays are allowed
        else
            wse.nonArrayAudioConnections.push(...ac.cppCode.split('\n'));  // TODO fix so that cppCode can be returned as array, have split as workaround for now
    }

    /**
     * This is only for the moment to get special type AudioMixer<n>, AudioMixerNNN or AudioStreamObject
     * @param {Node} node node(internal)
     */
     function getTypeName(node)
     {
        if (node.type == "AudioStreamObject") // special case
            var cpp = node.subType?node.subType:"// warning AudioStreamObject subType not set";
        else
            var cpp = node.type;

        if (node._def.dynInputs != undefined && RED.arduino.settings.ExportMode < 3)
        {
            var dynInputSize = RED.export.links.getDynInputDynSize(node).toString();

            if (RED.arduino.settings.UseAudioMixerTemplate == true)
                dynInputSize = '<' + dynInputSize + '>'; // include the template def.

            cpp += dynInputSize;
        }

        if (RED.arduino.settings.ExportMode == 3)
            cpp = cpp.replace("Audio", "OSCAudio");

        cpp += " "; // add at least one space
        for (var j = cpp.length; j < 32; j++) cpp += " ";
        return cpp;
    }

    function getName(node) {
        if (RED.arduino.settings.ExportMode == 3) { // mode 3 == OSC
            if (node.isArray != undefined)
                var name = node.isArray.name;

            if (node._def.dynInputs != undefined)
                name += '{"' +name+ '", ' + RED.export.links.getDynInputDynSize(node) + "}";
            else
                name += '{"' +name+ '"}';
            return name;
        }
        else
        {
            if (node.isArray != undefined)
                return node.isArray.name;
            return node.name;
        }
    }

    function getAudioConnectionTypeName() {
        if (RED.arduino.settings.ExportMode < 3)
            return "AudioConnection";
        else
            return "OSCAudioConnection";
    }

    /** @param {CompleteExport} ce */
    function GenerateZip(ce)
    {
        ce.finalize(); // makes this export ready for Zip export
        const t1 = performance.now();
        var zip = new JSZip();
        let useSubfolder = RED.arduino.settings.ZipExportUseSubFolder;
        let subFolder = /*(mainFileName != "") ? mainFileName : */RED.arduino.settings.ProjectName;
        for (var i = 0; i < ce.allFiles.length; i++) {
            var file = ce.allFiles[i];

            if (file.overwrite_file == false) continue; // don't include in zip as it's only a placeholder for existing files
            
            if (useSubfolder == false)
                zip.file(file.name, file.contents);
            else
                zip.file(subFolder + "\\" + file.name, file.contents);
        }
        var compression = (RED.arduino.settings.ZipExportCompress==true)?"DEFLATE":"STORE";
        zip.generateAsync({ type: "blob", compression}).then(function (blob) {
            const t2 = performance.now();
            console.log('arduino-export-toZip took: ' + (t2 - t1) + ' milliseconds.');
            RED.main.showSelectNameDialog(RED.arduino.settings.ProjectName + ".zip", function (fileName) { saveAs(blob, fileName); }); // saveAs is from FileSaver.js
        });
    }

    /** @param {CompleteExport} ce */
    function SendToHttpBridge(ce)
    {
        ce.finalize(); // makes this export ready for Http Post export
        RED.arduino.httpPostAsync(ce.getPostJSON());
    }

    /** @param {CompleteExport} ce */
    function ShowExportDialog(ce)
    {
        var cpp = convertCompleteExportToString(ce);
        RED.view.dialogs.showExportDialog("Class Export to Arduino", cpp, " Source Code:");
    }

    /** @param {CompleteExport} ce */
    function convertCompleteExportToString(ce) {
        // time to generate the final result
        var cpp = "";
        cpp = getCppHeader(ce.jsonString, undefined, false); // false mean zip mode, which in this case appends the design JSON to the export 
        // first add global files
        for (var i = 0; i < ce.globalCppFiles.length; i++)
        {
            if (ce.globalCppFiles[i].name == "mixers.cpp")
            { // special case
                cpp += ce.globalCppFiles[i].body.replace('#include "mixers.h"', '') + "\n"; // don't use that here as it generates compiler error
            }
            else if (ce.globalCppFiles[i].name == "mixers.h") 
            { // special case
                cpp += ce.globalCppFiles[i].header + "\n" + ce.globalCppFiles[i].body + "\n"; // to include the copyright note
            }
            else
            {
                cpp += ce.globalCppFiles[i].body;
            }
        }
        // second add cpp files in dependency order
        // credits to h4yn0nnym0u5e for the dependency order sorting
        var exportComplete = false;
        var exported = [];
        while (!exportComplete)
        {
            exportComplete = true;
            
            for (var i = 0; i < ce.wsCppFiles.length; i++) {

                if (!ce.wsCppFiles[i].isExported) {
                    // check that anything we depend on has already been output
                    var skip = false;
                    for (depend of ce.wsCppFiles[i].depends) {
                        if (!exported.includes(depend))
                        {
                            exportComplete = false;
                            skip = true;
                            break;
                        }
                    }
                    if (skip)
                        continue;

                    cpp += ce.wsCppFiles[i].body;
                    ce.wsCppFiles[i].isExported = true;
                }
                
                if (ce.wsCppFiles[i].className)
                    exported.push(ce.wsCppFiles[i].className);
            }
        }
        cpp += getCppFooter();
        
        return cpp.split('\n\n').join('\n').split('\t').join("    "); // removes some double newlines for now
    }

    function getCppHeader(jsonString, includes, generateZip) {
        if (includes == undefined)
            includes = "";
        var returnStr = RED.arduino.settings.StandardIncludeHeader
            + includes + "\n"
            + "// " + RED.arduino.settings.ProjectName + ": begin automatically generated code\n";
        // don't include JSON in files when exporting as zip, 
        // the zip contains the json as separate file.
        // this makes the zip generating much faster
        if (RED.arduino.settings.WriteJSONtoExportedFile == true && generateZip == false)
            returnStr += "// the following JSON string contains the whole project, \n// it's included in all generated files.\n"
                + "// JSON string:" + jsonString + "\n\n";
        return returnStr;
    }
    function getCppFooter() {
        return "// " + RED.arduino.settings.ProjectName + ": end automatically generated code\n";
    }

    return {
        init,
        Export,
        getCppFooter,
        getCppHeader,
        getAudioConnectionTypeName
    };
})();

if (TEXT == undefined)
    var TEXT = {};
/**
* this take a multiline text, 
* break it up into linearray, 
* then if increment is a string then that is added before every line, if increment is a number then it specifies the number of spaces added before every line
* @param {*} text 
* @param {*} increment if this is a string then that is added before every line, if it's a number then it specifies the number of spaces added before every line
*/
TEXT.incrementLines = function(text, increment) {
    var lines = text.split("\n");
    var newText = "";
    if (typeof increment == "number")
        increment = TEXT.getNrOfSpaces(increment);
    for (var i = 0; i < lines.length; i++) {
        newText += increment + lines[i] + "\n";
    }
    return newText;
};

TEXT.getNrOfSpaces = function(count) {
    var str = "";
    for (var i = 0; i < count; i++)
        str += " ";
    return str;
}