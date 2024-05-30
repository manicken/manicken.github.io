
/** this file is only for developing the new export system
 * and it's structure(s) may change drastically
 */

class ExportObjectPaddingSizes
{
    /** @type {number} */
    type = 0;
    /** @type {number} */
    name = 0;

    constructor(typeMinPadding, nameMinPadding)
    {
        this.type = typeMinPadding;
        this.name = nameMinPadding;
    }
}

class ExportObject
{
    /** @type {String} */
    type = "";
    /** @type {String} */
    name = "";
    /** @type {String} */
    comment = "";

    /**
     * @param {String} type
     * @param {String} name
     * @param {String} comment
     */
    constructor (type, name, comment)
    {
        this.type = type;
        this.name = name;
        this.comment = (comment != undefined)?(comment.trim()):"";
    }
    /**
     * @param {ExportObjectPaddingSizes} padding
     */
    Finalize(padding) {
        return this.type.padEnd(padding.type+2, ' ') + (this.name + ";").padEnd(padding.name+1, ' ') + (this.comment.length != 0?(" // " + this.comment):""); 
    }
}

class ExportAudioConnection
{
    /** @type {REDLinkInfo} */
    info = {};
    /** @type {number} */
    tabOutPortIndex = 0;
    /** @type {REDLink} */
    groupFirstLink = {};

    /** @type {REDNode} */
    source = {};
    /** @type {number} */
    sourcePort = 0;
    /** @type {String[]} */
    sourcePath = [];
    /** @type {boolean} */
    sourceIsArray = false;
    /** @type {String} */
    sourceName = "";

    /** @type {REDNode} */
    target = {};
    /** @type {number} */
    targetPort = 0;
    /** @type {String[]} */
    targetPath = [];
    /** @type {boolean} */
    targetIsArray = false;
    /** @type {String} */
    targetName = "";

    /** this makes a copy of the current link 
     * @param {REDLink} link
    */
    constructor(link) {
        this.info = link.info;
        this.tabOutPortIndex = undefined;
        this.groupFirstLink = link.groupFirstLink;
            
        this.sourceIsArray = link.sourceIsArray;
        this.sourcePath = (link.sourcePath!=undefined)?link.sourcePath:[]; // initialized the first time this function is used when copied from a original link
        this.source = link.source;
        this.sourcePort = parseInt(link.sourcePort);
        this.sourceName = link.sourceName;
        
        this.targetIsArray = link.targetIsArray;
        this.targetPath = (link.targetPath!=undefined)?link.targetPath:[]; // initialized the first time this function is used when copied from a original link
        this.target = link.target;
        this.targetPort = parseInt(link.targetPort);
        this.targetName = link.targetName;
    }

    GetCppCode(classExport)
    {
        // in development, 
        // don't care about classExport yet
        var srcPath = ((this.sourcePath.length!=0)?(this.sourcePath.join('.')+"."):"") + this.source.name;
        var tgtPath = ((this.targetPath.length!=0)?(this.targetPath.join('.')+"."):"") + this.target.name;

        var ret = `(${srcPath}, ${this.sourcePort}, ${tgtPath}, ${this.targetPort});`;
        return ret;
    }
}

/** using this class allows different size arrays to be defined in one class */
class ExportArrayAudioConnections
{
    /** @type {ExportAudioConnection[]} */
    items = [];
    /** @type {number} */
    arraySize = 0;

    /**
     * 
     * @param {*} classExport 
     * @param {*} ma_indent 
     */
    GetCppCode(classExport, ma_indent)
    {
        var cpp = "";
        if (classExport) {
            cpp += ma_indent + "for (int i = 0; i < " + this.arraySize + "; i++) {\n";
        }
        for (var i = 0; i < this.items.length; i++) {
            cpp += (classExport?ma_indent:"") +  this.items[i].GetCppCode(classExport)
        }
        cpp += this.arrayAudioConnections.join('\n');
        if (classExport) {
            cpp += ma_indent + "}\n";
        }
        return cpp;
    }
}

class WsExport
{
    /** @type {REDWorkspace} */
    ws = {};
    /** @type {String} */
    fileName = "";
    /** @type {String} */
    get className() { return this.ws.label} // the actual name of the workspace/class
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
    /** contain all non array AudioConnections
     * @type {ExportAudioConnection[]}
    */
    nonArrayAudioConnections = [];

    /** contain all array AudioConnections 
     * @type {ExportArrayAudioConnections[]}
     */
    arrayAudioConnections = [];

    totalAudioConnectionCount = 0;

    /** 
     * used by (h4yn0nnym0u5e) depend order
     * @type {String[]} */
    depends = []; 

    isMain = false;

    /** @param {REDWorkspace} ws  */
    constructor(ws)
    {
        this.ws = ws;
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
     * @param {number} typeMinSize 
     * @param {number} nameMinSize 
     * @param {ExportObject[]} items
     */
    getExportObjectPaddingSizes(typeMinSize, nameMinSize, items){
        for (var i = 0; i < items.length; i++) {
            var item = items[i]
            //console.log(aco);
            if (item.type.length > typeMinSize) typeMinSize = item.type.length;
            if (item.name.length > nameMinSize) nameMinSize = item.name.length; 
        }
        return new ExportObjectPaddingSizes(typeMinSize, nameMinSize);
    }
    
    /**
     * used to generate a 'wsfile' object
     * from all collected data
     * @param {boolean} classExport
     * @param {boolean} OSCExport
     */
    generateWsFile(classExport, OSCExport)
    {
        console.log(this);
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
        if (this.isMain == false && classExport) {
            newWsCpp.body += "\nclass " + this.className + " " + this.ws.extraClassDeclarations +"\n{\npublic:\n";
        }
        else
            newWsCpp.body += "\n";

        // first get the padding so that we can make the generated code pretty and structured
        var padding = this.getExportObjectPaddingSizes(32, 0, this.audioObjects);
        // add all audio object instances
        for (var i = 0; i < this.audioObjects.length; i++) {
            newWsCpp.body += this.audioObjects[i].Finalize(padding) + "\n";
        }

        // get the padding so that we can make the generated code pretty and structured
        padding = this.getExportObjectPaddingSizes(32, 0, this.audioControlObjects);
        // add all audio control object instances and non IO classes
        for (var i = 0; i < this.audioControlObjects.length; i++) {
            newWsCpp.body += this.audioControlObjects[i].Finalize(padding) + "\n";
        }

        if (this.variables.join("\n").trim().length > 0) {
            if (newWsCpp.isMain == false && classExport)
                newWsCpp.body += TEXT.incrementLines(this.variables.join("\n"), minorIncrement);
            else
                newWsCpp.body += this.variables.join("\n");
        }

        var mi_indent = TEXT.getNrOfSpaces(minorIncrement);
        var ma_indent = TEXT.getNrOfSpaces(majorIncrement);

        if (this.totalAudioConnectionCount != 0 && classExport) {
            newWsCpp.body += mi_indent + RED.arduino.export2.getAudioConnectionTypeName() + " ";
            newWsCpp.body += TEXT.getNrOfSpaces(32 - RED.arduino.export2.getAudioConnectionTypeName().length);
            newWsCpp.body += "*patchCord[" + this.totalAudioConnectionCount + "]; // total patchCordCount:" + this.totalAudioConnectionCount + " including array typed ones.\n";
        }

        if (classExport) {
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
            if (OSCExport)
                newWsCpp.body += mi_indent + "OSCAudioGroup& grp = *this;\n"
            
            newWsCpp.body += "\n";
        }
        
        newWsCpp.body += "\n\n";

        for (var i = 0; i < this.nonArrayAudioConnections.length; i++) {
            //console.log(this.nonArrayAudioConnections[i]);
            if (this.nonArrayAudioConnections[i].invalid == undefined)
                newWsCpp.body += (classExport?ma_indent:"") + this.nonArrayAudioConnections[i].GetCppCode(classExport) + "\n";
            else
                newWsCpp.body += (classExport?ma_indent:"") + this.nonArrayAudioConnections[i].invalid; // contains info as a comment
        }

        for (var i = 0; i < this.arrayAudioConnections.length; i++) {
            newWsCpp.body += this.arrayAudioConnections[i].GetCppCode(classExport, ma_indent);
        }

        if (classExport) {
            newWsCpp.body += TEXT.incrementLines(this.constructorCode.join('\n'), majorIncrement);
            newWsCpp.body += mi_indent + "}\n";
        }
        
        if (classExport) {
            
            // generate destructor code if enabled
            if (this.ws.generateCppDestructor == true) {
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
        }

        var classFunctions = this.functions.join('\n');
        if (classFunctions.trim().length > 0) {
            if (newWsCpp.isMain == false && classExport)
                newWsCpp.body += "\n" + TEXT.incrementLines(classFunctions, minorIncrement);
            else
                newWsCpp.body += "\n" + classFunctions;
        }
        if (classExport) {
            if (newWsCpp.isMain == false) {// don't include end of class marker when doing main.cpp 
                newWsCpp.body += "};\n"; // end of class
                newWsCpp.body += this.eofCode.join("\n"); // after end of class
            }
        }

        //newWsCpp.header = RED.arduino.export2.getCppHeader(ce.jsonString, this.workspaceIncludes.join("\n") + "\n ", ce.generateZip);
        
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
     * but can also be used for files that need to be before globalCppFiles
     * @type {ExportFile[]} */
    allFiles = [];

    /** @type {Keyword[]} */
    keywords = [];

    /** @type {Number[]} */
    mixervariants = undefined;

    /** @type {Number[]} */
    mixerStereoVariants = undefined;

    /** @readonly */
    jsonString = RED.storage.getData();

    /**
     * @type {CPP_EXPORT_MODE} 
     */
    exportMode = CPP_EXPORT_MODE.SIMPLE_FLAT;

    generateZip = false;

    constructor(generateZip, exportMode) {
        this.exportMode = exportMode;
        this.generateZip = generateZip;

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