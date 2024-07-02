/**
 * A Node-RED Node object, (cannot use Node because that is a reserved name for DOM Node:s)
 * note. this only acts as a base structure and some nodes types can contain properties
 * that is not documented here, see NodeDefinitions.js specially the default properties
 * for more information
 */
class REDNode
{
    _def = {};
    
    type = "";
    /** the node UID, should never be changed, except when a new node is created */
    id = "";
    /** the name of the node, also used for the node label */
    name = "";
    /** this is used mostly to create a comment for objects, but is also used to store scripts/c++ code @ such node types */
    comment = "";

    /** only used by UI objects */
    tag = ""; // 
    x = 0;
    y = 0;
    /** defines which workspace it belongs to */
    z = ""; // 
    /** node width */
    w = 0;
    /** node height */
    h = 0;

    /** in some cases this would be used for the text color */
    color = "";
    /** the node background color */
    bgColor = "";

    outputs = 0;
    inputs = 0;

    /** Child nodes of the current node, only used by 'groupbox' and 'scriptbutton'
     * @type {REDNode[]} 
     */
    nodes = [];
    /** the parent group to which this node belongs to, set to undefined when a node is at root
     * @type {REDNode}
     */
    parentGroup = undefined;

    /** used in RED.view */
    changed = false;
    /** used in RED.view */
    dirty = false;
    /** used in RED.view */
    valid = true;
    /** used in RED.view */
    selected = false;
    /** used in RED.view */
    resize  = false;
    /** used in RED.view, contains a list of the actual svgRect:s used to visualize the input ports */
    inputlist = [];
    /** used in RED.view, this is actually the output port list, only contains numbers */
    ports = [];
    /** used in RED.view, contains a list of the actual svgRect:s used to visualize the output ports */
    _ports = [];
    /** used in RED.view, the root svg rect used to visualize this node object, this is used to improve the performance when updating a node */
    svgRect = {};
    /** used in RED.view, to buffer the label text dimensions, may be obsolete because of the new text dimensions cache system*/
    textDimensions = {};
    /** used in RED.view */
    textSize = 14;
    /** used in RED.view, by the move function (old x) */
    ox = 0;
    /** used in RED.view, by the move function (old y) */
    oy = 0;

    /**
     * 
     * @param {*} nn new node (type JSON node)
     * @param {*} def node definition
     */
    constructor(nn, def) {
        this.id = nn.id;
        this.name = nn.name;
        this.nodes = nn.nodes;
        this.inputs = nn.inputs;
        this.outputs = nn.outputs;
        this.bgColor = nn.bgColor;
        this.color = nn.color||nn.bgColor;
        this.x = nn.x;
        this.y = nn.y;
        this.z = nn.z;
        this.type = nn.type;
        this._def = def;
        this.wires = nn.wires; // wires is only a temporary property used at node import, it will be deleted after node is imported
        /*,wireNames:n.wireNames*/
        this.changed = false;

        if (def.uiObject != undefined) {
            this.w = nn.w;
            //console.log(nn.type + " " + nn.h);
            this.h = nn.h;
        }
    }
};

/**
 * Defines a workspace/class/tab object
 */
class REDWorkspace 
{
    /** defines the type of this object, will never be changed, only used by old export structure */
    type = "tab";

    id = "";
    label = "";
    /** @type {REDNode[]} */
    nodes = [];
    /** @type {REDLink[]} */
    links = [];
    export = true;
    isMain = false;
    mainNameType = "";
    mainNameExt = "";
    isAudioMain = false;
    generateCppDestructor = false;
    extraClassDeclarations = "";
    settings = {};
    /** @type {REDNode[]} */
    tabOutputs = [];
    /** @type {REDNode[]} */
    tabInputs = [];

    constructor(id, label, _export, isMain, mainNameType, mainNameExt, isAudioMain, settings, generateCppDestructor, extraClassDeclarations)
    {
        
        this.id = id;
        this.label = label;
        this.export = (_export != undefined)?_export:true;
        this.isMain = (isMain != undefined)?isMain:false;
        this.mainNameType = (mainNameType != undefined)?mainNameType:"tabName";
        this.mainNameExt = (mainNameExt != undefined)?mainNameExt:".ino";
        this.isAudioMain = (isAudioMain != undefined)?isAudioMain:false;
        this.generateCppDestructor = (generateCppDestructor != undefined)?generateCppDestructor:false;
        this.extraClassDeclarations = (extraClassDeclarations != undefined)?extraClassDeclarations:"";
        if (settings == undefined){ this.settings = RED.settings.getChangedSettings(RED.view); console.warn("Converting old global workspace settings to new individual:" + label + " " + id); }
        else this.settings = settings;
    }
};

class REDLink
{
    /** @type {REDNode} */
    source = {};
    sourcePort = 0;
    /** @type {REDNode} */
    target = {};
    targetPort = 0;

    // the following are mostly used by RED.view visuals
    selected = false;
    /** @type {REDLinkInfo} */
    info = new REDLinkInfo();
    /** @type {REDLinkSvgPaths} */
    svgPath = undefined;
    svgRoot = undefined;
    x1 = 0;
    x2 = 0;
    y1 = 0;
    y2 = 0;

    constructor(source, sourcePort, target, targetPort)
    {
        this.source = source;
        this.sourcePort = parseInt(sourcePort);
        this.target = target;
        this.targetPort = parseInt(targetPort);
    }
    /** used for debug */
    ToString()
    {
        return `sourceName:${this.source.name}, sourcePort:${this.sourcePort}, targetName:${this.target.name}, targetPort:${this.targetPort}`;
    }
};

class REDLinkSvgPaths
{
    background = undefined;
    outline = undefined;
    line = undefined;
    constructor() {}
}

class REDLinkInfo
{
    /** @type {Boolean} */
    isBus = false;
    /** @type {Boolean} */
    valid = true;
    /** @type {String} */
    invalidText = undefined;
    /** @type {REDNode} */
    tabOut = undefined;
    /** @type {REDNode} */
    tabIn = undefined;

    constructor() {}
    /*constructor(isBus,valid,invalidText,tabOut,tabIn) {
        this.isBus = isBus; this.valid = valid; this.invalidText = invalidText; this.tabOut = tabOut; this.tabIn = tabIn;
    }
    setAll(isBus,valid,invalidText,tabOut,tabIn) {
        this.isBus = isBus; this.valid = valid; this.invalidText = invalidText; this.tabOut = tabOut; this.tabIn = tabIn;
    }*/
}