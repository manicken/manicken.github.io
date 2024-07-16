
/** this file is only for developing the new export system
 * and it's structure(s) may change drastically
 */


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
// used to print the names above
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
} 

class ExportOptions
{
    /** @type {boolean} */
    generateZip = false;
    /** @type {boolean} */
    classExport = false;
    /** @type {boolean}  this is when the export dialog is used to export the code which mean both simple plain export and single class export */
    compositeExport = false;
    /** @type {boolean} */
    oscExport = false;
    /** @type {number} */
    classExportIdents = 4;
    /** @type {boolean} set to true if using the new dynamic audio connections that can be later connected, and not using pointer array for the audio connections */
    dynamicConnections = true;
    /** @type {number} */
    instanceDeclarationsMinPadding = 32;

    /** @type {boolean} obsolete, soon to be removed from here */
    UseAudioMixerTemplate = RED.arduino.settings.UseAudioMixerTemplate;

    /** 
     * @param {ExportOptions} o
    */
    constructor(o)
    {
        if (o == undefined) return;
        this.generateZip = o.generateZip!=undefined?o.generateZip:false;
        this.classExport = o.classExport!=undefined?o.classExport:false;
        this.compositeExport = o.compositeExport!=undefined?o.compositeExport:false;
        this.oscExport = o.oscExport!=undefined?o.oscExport:false;
        this.classExportIdents = o.classExportIdents!=undefined?o.classExportIdents:4;
        this.dynamicConnections = o.dynamicConnections!=undefined?o.dynamicConnections:true;

    }
}

class ExportObjectPaddingSizes
{
    /** @type {number} */
    type = 0;
    /** @type {number} */
    name = 0;

    /** 
     * @param {number} typeMinSize 
     * @param {number} nameMinSize 
     * @param {ExportObject[]} items
     */
    constructor(typeMinSize, nameMinSize, items){
        for (var i = 0; i < items.length; i++) {
            var item = items[i]
            //console.log(aco);
            if (item.type.length > typeMinSize) typeMinSize = item.type.length;
            if (item.name.length > nameMinSize) nameMinSize = item.name.length; 
        }
        this.type = typeMinSize;
        this.name = nameMinSize;
    }
}
// TODO: maybe rename this to something more logical
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
    /** @type {REDLink} */
    link = {};
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
        this.link = link;
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
    /**
     * checks if any item in path is a array
     * @param {string[]} path can be either sourcePath or targetPath
     * @returns 
     */
    IsAnyInPathArray(path)
    {
        for (var i=0;i<path.length;i++)
        {
            if (RED.export.isNameDeclarationArray(path[i], this.source.z, false)!=undefined)
                return true;
        }
        return false;
    }
    
    MakeOSCName()
    {
        var result = this.source.name + '_' + this.sourcePort + '_' + this.target.name + '_' + this.targetPort;
		result.replace("[","${").replace("]","}").replace(".","_");
        return result;
    }

    /** @param {ExportOptions} options */
    GetCppCode(options, index)
    {
        // TODO take care of array thingy situations
        // in development, 

        var srcPath = ((this.sourcePath.length!=0)?(this.sourcePath.join('.')+"."):"") + this.source.name;
        var tgtPath = ((this.targetPath.length!=0)?(this.targetPath.join('.')+"."):"") + this.target.name;

        var ret = `${srcPath}, ${this.sourcePort}, ${tgtPath}, ${this.targetPort}`;
        if (options.oscExport == true)
            ret = '"' + this.MakeOSCName() + '", ' + ret;
        if (options.classExport == true)
        {
            if (options.dynamicConnections == true)
                ret = "patchCord[pci++].connect(" + ret + ");";
            else {
                var typeName = RED.arduino.export2.getAudioConnectionTypeName(options);
                ret = `patchCord[pci++] = new ${typeName}(${ret});`;
            }
        }
        else
        {
            var typeName = RED.arduino.export2.getAudioConnectionTypeName(options);
            ret = typeName.padEnd(32,' ') + "  patchCord" + (index+1) + "(" + ret + ");";
        }
        return ret;
    }

    /** @param {ExportOptions} options */
    GetCppCodeWhenArray(options)
    {
        // TODO maybe allow multilevel arrays
        var cpp = [];
        
        if (options.classExport==true) {
            cpp.push("for (int i = 0; i < " + this.arraySize + "; i++) {");
        }
        var mi_indent = TEXT.getNrOfSpaces(options.classExportIdents);
        for (var i = 0; i < this.items.length; i++) {
            cpp.push(mi_indent + this.items[i].GetCppCode(options));
        }
        if (options.classExport==true) {
            cpp.push("}");
        }
        return cpp;
    }
}

class WorkspaceExport
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


    /** contain all AudioStream Objects and class instances that have IO
     * @type {ExportObject[]} */
    audioObjects = [];
    /** contain all Audio Control Objects
     * @type {ExportObject[]} */
    audioControlObjects = [];
    /** contains other objects that do not belong to either audioObjects or audioControlObjects
     * @type {ExportObject[]} */
    otherObjects = [];

    /** contain all AudioConnections that should be created inside this class
     * @type {ExportAudioConnection[]}
    */
    AudioConnections = [];

    get totalAudioConnectionCount() { 
        var c = this.AudioConnections.length;
        // TODO take care of array def. situations
        return c;
    }

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
        //delete this.header;
        //delete this.footer;
        //delete this.body;
        //delete this.depends;
        //delete this.isExported;
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

    /** this is used when exporting using the export-dialog
     * @type {String} */
    compositeContents = "";

    /** @type {ExportOptions} */
    options = undefined;

    constructor(options) {
        this.options = options;

        if (options.UseAudioMixerTemplate == false) {
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
