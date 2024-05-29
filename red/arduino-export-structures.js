
/** this file is only for developing the new export system
 * and it's structure(s) may change drastically
 */




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
     * 
     */
    Finalize(afterTypePaddingCount, afterNamePaddingCount) {
        return this.type.padEnd(afterTypePaddingCount+2, ' ') + (this.name + ";").padEnd(afterNamePaddingCount+1, ' ') + (this.comment.length != 0?(" // " + this.comment):""); 
    }
}

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
        if (this.isMain == false && ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
            newWsCpp.body += "\nclass " + this.className + " " + ws.extraClassDeclarations +"\n{\npublic:\n";
        }
        else
            newWsCpp.body += "\n";

        // first get the lenghts so that we can make the generated code pretty and structured
        var objectsTypeMaxLenght = 32;
        var objectsNameMaxLenght = 0;
        for (var i = 0; i < this.audioObjects.length; i++) {
            var ao = this.audioObjects[i]
            //console.log(ao);
            if (ao.type.length > objectsTypeMaxLenght) objectsTypeMaxLenght = ao.type.length;
            if (ao.name.length > objectsNameMaxLenght) objectsNameMaxLenght = ao.name.length; 
        }
        // add all audio object instances
        for (var i = 0; i < this.audioObjects.length; i++) {
            newWsCpp.body += this.audioObjects[i].Finalize(objectsTypeMaxLenght, objectsNameMaxLenght, false) + "\n";
        }
        // first get the lenghts so that we can make the generated code pretty and structured
        objectsTypeMaxLenght = 32;
        objectsNameMaxLenght = 0;
        for (var i = 0; i < this.audioControlObjects.length; i++) {
            var aco = this.audioControlObjects[i]
            //console.log(aco);
            if (aco.type.length > objectsTypeMaxLenght) objectsTypeMaxLenght = aco.type.length;
            if (aco.name.length > objectsNameMaxLenght) objectsNameMaxLenght = aco.name.length; 
        }
        // add all audio control object instances and non IO classes
        for (var i = 0; i < this.audioControlObjects.length; i++) {
            newWsCpp.body += this.audioControlObjects[i].Finalize(objectsTypeMaxLenght, objectsNameMaxLenght, false) + "\n";
        }

        if (this.variables.join("\n").trim().length > 0) {
            if (newWsCpp.isMain == false)
                newWsCpp.body += TEXT.incrementLines(this.variables.join("\n"), minorIncrement);
            else
                newWsCpp.body += this.variables.join("\n");
        }

        var mi_indent = TEXT.getNrOfSpaces(minorIncrement);
        var ma_indent = TEXT.getNrOfSpaces(majorIncrement);

        if (this.totalAudioConnectionCount != 0 && ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
            newWsCpp.body += mi_indent + RED.arduino.export2.getAudioConnectionTypeName() + " ";
            newWsCpp.body += TEXT.getNrOfSpaces(32 - RED.arduino.export2.getAudioConnectionTypeName().length);
            newWsCpp.body += "*patchCord[" + this.totalAudioConnectionCount + "]; // total patchCordCount:" + this.totalAudioConnectionCount + " including array typed ones.\n";
        }

        if (ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
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
        }
        
            newWsCpp.body += "\n\n";
            newWsCpp.body += this.nonArrayAudioConnections.join('\n');
            if (this.acArrayLength != 0) { // TODO fix to allow different size arrays
                if (ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
                    newWsCpp.body += ma_indent + "for (int i = 0; i < " + this.acArrayLength + "; i++) {\n";
                }
                newWsCpp.body += this.arrayAudioConnections.join('\n');
                if (ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
                    newWsCpp.body += ma_indent + "}\n";
                }
            }else {
                newWsCpp.body += this.arrayAudioConnections.join('\n');
            }
            if (ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
                newWsCpp.body += TEXT.incrementLines(this.constructorCode.join('\n'), majorIncrement);
                newWsCpp.body += mi_indent + "}\n";
            }
        
        if (ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
            
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
        }

        var classFunctions = this.functions.join('\n');
        if (classFunctions.trim().length > 0) {
            if (newWsCpp.isMain == false)
                newWsCpp.body += "\n" + TEXT.incrementLines(classFunctions, minorIncrement);
            else
                newWsCpp.body += "\n" + classFunctions;
        }
        if (ce.exportMode != CPP_EXPORT_MODE.SIMPLE_FLAT) {
            if (newWsCpp.isMain == false) {// don't include end of class marker when doing main.cpp 
                newWsCpp.body += "};\n"; // end of class
                newWsCpp.body += this.eofCode.join("\n"); // after end of class
            }
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

    /**
     * @type {CPP_EXPORT_MODE} 
     */
    exportMode = CPP_EXPORT_MODE.SIMPLE_FLAT;

    generateZip = false;

    constructor(generateZip, exportMode) {
        this.exportMode = exportMode;
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