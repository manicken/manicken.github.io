// the main reason for this 'table' is to 
// order categories
var ioSubCats = { 
    "i2s1": { headerStyle: "background: #FAFAFA;" }, 
    "i2s2": { headerStyle: "background: #E3E3E3;" }, 
    "spdif": { headerStyle: "background: #FAFAFA;" }, 
    "adc": { headerStyle: "background: #E3E3E3;" }, 
    "other": { headerStyle: "background: #FAFAFA;" }
}

// TODO. add tooltip popup functionality for categories
// each category can have the following optional fields,
// with examples:
// headerStyle: "background-color:#AAA;"
// expanded: false
// label: "Hello World"
var NodeBaseManicksanCategories = {
    "used": {  },
    "tabs": {  },
    "special": {  },
    "ui": {  },
}

var NodeBaseCategories = {
    "input": { "subcats": { ...ioSubCats} },
    "output": { "subcats": { ...ioSubCats}},
    "mixer": {  },
    "play": {  },
    "record": {  },
    "synth": {  },
    "effect": {  },
    "filter": {  },
    //"convert": {  },
    "analyze": {  },
    "control": {  },
    //"config": {  },
    "unsorted": {  },
}
var NodeCategories = {
    ...NodeBaseManicksanCategories,
    ...NodeBaseCategories,
    /*"test": { 
        subcats:{ 
            sub1:{
                subcats:{
                    subA:{}, 
                    subB:{}
                }
            }, sub2:{

            }
        }
    },*/
    // TODO. fix so that theese are defined at node def for easier maintainability
    "FrankBoesing": { label:"Frank Boesing", subcats:{ ...NodeBaseCategories } },
    "MattKuebrich": { label:"Matt Kuebrich", subcats: { ...NodeBaseCategories } },
    "Newdigate": { label:"Nic Newdigate", subcats: { legacy: {...NodeBaseCategories}, /*new:{...NodeBaseCategories }*/ }},
    "chipaudette": { label:"Chip Audette (F32)", subcats: { ...NodeBaseCategories, convert:{} ,radio:{}, config:{} } },
}

var DEFAULTS_VALUE_TYPE = {
    int: "int",
    float: "float",
    hexdec: "hexdec",
    c_cpp_name: "c_cpp_name",
    c_cpp_name_no_array: "c_cpp_name_no_array"
}

//InputOutputCompatibilityMetadata is at end of this file

var dynInputMixers_Help = "note. Hover the Inputs fields for more information";
var dynInputMixers_Inputs_Help = "Tool Visual Inputs<br>note. this is disabled when using LinkDropOnNodeAppend<br>together with<br>DyninputAutoExpandOnLinkDrop<br>or<br>DyninputAutoReduceOnLinkRemove<br><br>Don't know if there is any point of having<br>either the mentioned settings or this Inputs field,<br>as the dynamic resize could be normal behaviour.";
var dynInputMixers_ExtraInputs_Help = "Extra Inputs is intended to replace the Visual Inputs in future exports,<br>Extra Inputs should then be used to create a mixer with extra inputs,<br>this would then make it possible to connect additional sources at runtime.<br>For the OSC live edit this would also then not requiring the mixer to be resized at runtime thus saving alot of required OSC messages.";
var dynInputMixers_RealInputs_Help = "this is to show the real input count of the mixer<br>i.e. the size of the mixer when exported";
// the following utilizes eval to determine the readonly state of the inputs field
// instead of hardcoding it into the editor.js module
var dynInputMixers_Inputs_ReadOnly = "RED.main.settings.LinkDropOnNodeAppend == true && (RED.main.settings.DynInputAutoExpandOnLinkDrop == true || RED.main.settings.DynInputAutoReduceOnLinkRemove == true)";

class NodeDefBase {
    defaults = {
        name: {},
        id: { noEdit: "" },
        comment: {},
        color: { editor: { type: "color" } },
    };
    shortName = "";
    editorhelp = "";
    category = "";
    color = "#F6F8BC";
    constructor() { }
}
class UiTypeBase_ extends NodeDefBase {
    constructor() {
        super();
        this.defaults.tag = { value: "" };
        this.defaults.w = { value: 100, minval: 5, type: DEFAULTS_VALUE_TYPE.int };
        this.defaults.h = { value: 30, minval: 5, type: DEFAULTS_VALUE_TYPE.int };
        this.defaults.textSize = { value: 14, minval: 5, type: DEFAULTS_VALUE_TYPE.int };
    }
}

function tester() {
    var utb = new UiTypeBase_();

}


var UiTypeBase = {
    defaults: {
        name: {},
        tag: { value: "" },
        id: { noEdit: "" },
        comment: {},
        color: { editor: { type: "color" } },
        w: { editor:{label:"Width"}, value: 100, minval: 5, type: DEFAULTS_VALUE_TYPE.int },
        h: { editor:{label:"Height"}, value: 30, minval: 5, type: DEFAULTS_VALUE_TYPE.int },
        textSize: { value: 14, minval: 5, type: DEFAULTS_VALUE_TYPE.int },
    },
    uiObject: true,
    nonObject: "",
    //editor:"autogen", don't autogen for ui objects as they have advanced editors
    shortName: "newType",
    editorhelp: "",
    category: "ui",
    color: "#F6F8BC",
    textColor: "#000000"
};

var AudioTypeBase = {
    defaults: {
        name: { type: DEFAULTS_VALUE_TYPE.c_cpp_name_no_array },
        id: { noEdit: "" },
        comment: {},
        color: { editor: { type: "color" } },
    },
    editor: "autogen",
    /** @type {String}  the shortName used in the palette panel*/
    shortName: "newType",
    editorhelp: "",
    /** @type {Number}  the input count*/
    inputs: 0,
    /** @type {Number}  the output count*/
    outputs: 0,
    /** @type {String}  the category to which this belongs, used mostly by the palette*/
    category: "",
    color: "#E6E0F8",
    /** @type {String}  the icon file used, found in icons folder*/
    icon: "arrow-in.png"
};
var arraySize_Help = "(not in use yet, as there is a lot of dependencies on the old style)<br>selects the array size,<br>a value of 0 or 1 mean no array<br>the max value is 255";

var AudioTypeArrayBase = {
    ...AudioTypeBase,
    defaults: {
        ...AudioTypeBase.defaults,
        name: { type: DEFAULTS_VALUE_TYPE.c_cpp_name },
        arraySize: {
            value: 1, maxval: 255, minval: 1, type: DEFAULTS_VALUE_TYPE.int,
            editor: {
                label: "Array Size",
                help: arraySize_Help
            }
        }
    }
};

class TestClassExtends_Base {
    constructor() {
        /** @type {String} name tjofräs */
        this.name = "";
        /** @type {String} id tjofräs */
        this.id = "";
    }
}
class TestClassExtends extends TestClassExtends_Base {
    constructor() {
        super();
        /** @type {String} comment tjofräs */
        this.comment = "";
    }
}
var TestClassExtendsObj = {
    ...new TestClassExtends(),
};

function getClassNodeDefinition(shortName, inputCount, outputCount, ws) {
    return {
        ...AudioTypeArrayBase,
        shortName: shortName,
        /** @type {REDWorkspace} */
        isClass: ws,
        inputs: inputCount, outputs: outputCount,
        category: "tabs", color: "#ccffcc", icon: "arrow-in.png"
    };
}

var useMakeConstructor = {
    value: false,
    editor: {
        label: "Make Constructor",
        type: "boolean",
        help: "Currently only used by h4yn0nnym0u5e OSC library<br><br>" +
                "when enabled it includes the settings followed by this checkbox",
        dividerTop: {size:2,style:"solid"},
        dividerBottom: {size:1,style:"dashed"},
        rowClass: "form-row-auto"
    }
};

var NodeDefinitions = {
    manickenNodes: {
        label: "Manicken Nodes",
        description: "The node types embedded into this tool by manicken (Jannik LF Svensson)",
        credits: "Jannik LF Svensson",
        homepage: "https://github.com/manicken",
        url: "",
        types: {
            /*
            predef_subcatsub_test1: {...AudioTypeBase, shortName: "test1", category: "test-sub1-subA"},
            predef_subcatsub_test2: {...AudioTypeBase, shortName: "test2", category: "test-sub1-subB"},
            auto_subcat_test: { ...AudioTypeBase, shortName: "auto_subcat_test", outputs: 2, category: "special-newSubCat" },
            */
            TabOutput: { defaults: { name: {}, id: { "noEdit": "" }, comment: {}, inputs: { value: 1, maxval: 255, minval: 1, type: "int" } }, editor: "autogen", shortName: "Out", nonObject: "", inputs: 1, outputs: 0, category: "special", color: "#cce6ff", icon: "arrow-in.png" },
            TabInput: { defaults: { name: {}, id: { "noEdit": "" }, comment: {}, outputs: { value: 1, maxval: 255, minval: 1, type: "int" } }, editor: "autogen", shortName: "In", nonObject: "", inputs: 0, outputs: 1, category: "special", color: "#cce6ff", icon: "arrow-in.png", align: "right" },

            BusJoin: { defaults: { name: {}, id: { "noEdit": "" }, comment: {}, inputs: { value: 1, maxval: 255, minval: 2, type: "int" } }, editor: "autogen", shortName: "BusJoin", nonObject: "", inputs: 1, outputs: 1, category: "special", color: "#cce6ff", icon: "arrow-in.png", help: "not implemented yet" },
            BusSplit: { defaults: { name: {}, id: { "noEdit": "" }, comment: {}, outputs: { value: 1, maxval: 255, minval: 2, type: "int" } }, editor: "autogen", shortName: "BusSplit", nonObject: "", inputs: 1, outputs: 1, category: "special", color: "#cce6ff", icon: "arrow-in.png", align: "right" },

            PointerArray: { defaults: { name: {}, id: {}, objectType: {}, arrayItems: {} }, shortName: "pArray", nonObject: "", dontShowInPalette: "", category: "special", color: "#aaffdd", icon: "range.png" },

            AudioMixer: { ...AudioTypeArrayBase, shortName: "mixer", dynInputs: "", editor: "autogen", inputs: 1, outputs: 1, category: "mixer",
                editorhelp: dynInputMixers_Help,
                defaults: {
                    ...AudioTypeArrayBase.defaults,
                    inputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Visual Inputs", rowClass: "form-row-mid", "readonly": dynInputMixers_Inputs_ReadOnly, help: dynInputMixers_Inputs_Help } },
                    ExtraInputs: { value: 0, maxval: 255, minval: 0, type: "int", editor: { label: "Extra Inputs", rowClass: "form-row-mid", help: dynInputMixers_ExtraInputs_Help } },
                    RealInputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Real Inputs", rowClass: "form-row-mid", "readonly": "true", help: dynInputMixers_RealInputs_Help } }
                }
            },

            "theMixer.h": { defaults: { name: {}, id: {}, comment: { value: "/* Audio Library for Teensy 3.X\r\n * Copyright (c) 2014, Paul Stoffregen, paul@pjrc.com\r\n *\r\n * Development of this audio library was funded by PJRC.COM, LLC by sales of\r\n * Teensy and Audio Adaptor boards.  Please support PJRC's efforts to develop\r\n * open source software by purchasing Teensy or other PJRC products.\r\n *\r\n * Permission is hereby granted, free of charge, to any person obtaining a copy\r\n * of this software and associated documentation files (the \"Software\"), to deal\r\n * in the Software without restriction, including without limitation the rights\r\n * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\r\n * copies of the Software, and to permit persons to whom the Software is\r\n * furnished to do so, subject to the following conditions:\r\n *\r\n * The above copyright notice, development funding notice, and this permission\r\n * notice shall be included in all copies or substantial portions of the Software.\r\n *\r\n * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\r\n * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\r\n * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\r\n * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\r\n * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\r\n * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\r\n  * THE SOFTWARE.\r\n */\r\n\r\n#ifndef themixer_h_\r\n#define themixer_h_\r\n\r\n#include <Arduino.h>\r\n#include <AudioStream.h>\r\n\r\n//#define AudioMixer4 AudioMixer<4>\r\n\r\n#if defined(__ARM_ARCH_7EM__)\r\n\r\n#define MULTI_UNITYGAIN 65536\r\n#define MULTI_UNITYGAIN_F 65536.0f\r\n#define MAX_GAIN 32767.0f\r\n#define MIN_GAIN -32767.0f\r\n#define MULT_DATA_TYPE int32_t\r\n\r\n#elif defined(KINETISL)\r\n\r\n#define MULTI_UNITYGAIN 256\r\n#define MULTI_UNITYGAIN_F 256.0f\r\n#define MAX_GAIN 127.0f\r\n#define MIN_GAIN -127.0f\r\n#define MULT_DATA_TYPE int16_t\r\n\r\n#endif\r\n\r\ntemplate <int NN> class AudioMixer : public AudioStream\r\n{\r\npublic:\r\n  AudioMixer(void) : AudioStream(NN, inputQueueArray) {\r\n    for (int i=0; i<NN; i++) multiplier[i] = MULTI_UNITYGAIN;\r\n  } \r\n  virtual void update();\r\n  \r\n  /**\r\n   * this sets the individual gains\r\n   * @param channel\r\n   * @param gain\r\n   */\r\n  void gain(unsigned int channel, float gain);\r\n  /**\r\n   * set all channels to specified gain\r\n   * @param gain\r\n   */\r\n  void gain(float gain);\r\n\r\nprivate:\r\n  MULT_DATA_TYPE multiplier[NN];\r\n  audio_block_t *inputQueueArray[NN];\r\n};\r\n\r\n// the following Forward declarations \r\n// must be defined when we use template \r\n// the compiler throws some warnings that should be errors otherwise\r\n\r\nstatic int32_t signed_multiply_32x16b(int32_t a, uint32_t b); \r\nstatic int32_t signed_multiply_32x16t(int32_t a, uint32_t b);\r\nstatic int32_t signed_saturate_rshift(int32_t val, int bits, int rshift);\r\nstatic uint32_t pack_16b_16b(int32_t a, int32_t b);\r\nstatic uint32_t signed_add_16_and_16(uint32_t a, uint32_t b);\r\n\r\n// because of the template use applyGain and applyGainThenAdd functions\r\n// must be in this file and NOT in cpp file\r\n#if defined(__ARM_ARCH_7EM__)\r\n\r\n  static void applyGain(int16_t *data, int32_t mult)\r\n  {\r\n    uint32_t *p = (uint32_t *)data;\r\n    const uint32_t *end = (uint32_t *)(data + AUDIO_BLOCK_SAMPLES);\r\n\r\n    do {\r\n      uint32_t tmp32 = *p; // read 2 samples from *data\r\n      int32_t val1 = signed_multiply_32x16b(mult, tmp32);\r\n      int32_t val2 = signed_multiply_32x16t(mult, tmp32);\r\n      val1 = signed_saturate_rshift(val1, 16, 0);\r\n      val2 = signed_saturate_rshift(val2, 16, 0);\r\n      *p++ = pack_16b_16b(val2, val1);\r\n    } while (p < end);\r\n  }\r\n\r\n  static void applyGainThenAdd(int16_t *data, const int16_t *in, int32_t mult)\r\n  {\r\n    uint32_t *dst = (uint32_t *)data;\r\n    const uint32_t *src = (uint32_t *)in;\r\n    const uint32_t *end = (uint32_t *)(data + AUDIO_BLOCK_SAMPLES);\r\n\r\n    if (mult == MULTI_UNITYGAIN) {\r\n      do {\r\n        uint32_t tmp32 = *dst;\r\n        *dst++ =  signed_add_16_and_16(tmp32, *src++);\r\n        tmp32 = *dst;\r\n        *dst++ =  signed_add_16_and_16(tmp32, *src++);\r\n      } while (dst < end);\r\n    } else {\r\n      do {\r\n        uint32_t tmp32 = *src++; // read 2 samples from *data\r\n        int32_t val1 =  signed_multiply_32x16b(mult, tmp32);\r\n        int32_t val2 =  signed_multiply_32x16t(mult, tmp32);\r\n        val1 =  signed_saturate_rshift(val1, 16, 0);\r\n        val2 =  signed_saturate_rshift(val2, 16, 0);\r\n        tmp32 =  pack_16b_16b(val2, val1);\r\n        uint32_t tmp32b = *dst;\r\n        *dst++ =  signed_add_16_and_16(tmp32, tmp32b);\r\n      } while (dst < end);\r\n    }\r\n  }\r\n\r\n#elif defined(KINETISL)\r\n\r\n  static void applyGain(int16_t *data, int32_t mult)\r\n  {\r\n    const int16_t *end = data + AUDIO_BLOCK_SAMPLES;\r\n\r\n    do {\r\n      int32_t val = *data * mult;\r\n      *data++ = signed_saturate_rshift(val, 16, 0);\r\n    } while (data < end);\r\n  }\r\n\r\n  static void applyGainThenAdd(int16_t *dst, const int16_t *src, int32_t mult)\r\n  {\r\n    const int16_t *end = dst + AUDIO_BLOCK_SAMPLES;\r\n\r\n    if (mult == MULTI_UNITYGAIN) {\r\n      do {\r\n        int32_t val = *dst + *src++;\r\n        *dst++ = signed_saturate_rshift(val, 16, 0);\r\n      } while (dst < end);\r\n    } else {\r\n      do {\r\n        int32_t val = *dst + ((*src++ * mult) >> 8); // overflow possible??\r\n        *dst++ = signed_saturate_rshift(val, 16, 0);\r\n      } while (dst < end);\r\n    }\r\n  }\r\n#endif\r\n\r\ntemplate <int NN> void AudioMixer<NN>::gain(unsigned int channel, float gain) {\r\n  if (channel >= NN) return;\r\n  if (gain > MAX_GAIN) gain = MAX_GAIN;\r\n  else if (gain < MIN_GAIN) gain = MIN_GAIN;\r\n  multiplier[channel] = gain * MULTI_UNITYGAIN_F; // TODO: proper roundoff?\r\n}\r\n\r\ntemplate <int NN> void AudioMixer<NN>::gain(float gain) {\r\n  for (int i = 0; i < NN; i++) {\r\n    if (gain > MAX_GAIN) gain = MAX_GAIN;\r\n    else if (gain < MIN_GAIN) gain = MIN_GAIN;\r\n    multiplier[i] = gain * MULTI_UNITYGAIN_F; // TODO: proper roundoff?\r\n  } \r\n}\r\n\r\ntemplate <int NN> void AudioMixer<NN>::update() {\r\n  audio_block_t *in, *out=NULL;\r\n  unsigned int channel;\r\n  for (channel=0; channel < NN; channel++) {\r\n    if (!out) {\r\n      out = receiveWritable(channel);\r\n      if (out) {\r\n        int32_t mult = multiplier[channel];\r\n        if (mult != MULTI_UNITYGAIN) applyGain(out->data, mult);\r\n      }\r\n    } else {\r\n      in = receiveReadOnly(channel);\r\n      if (in) {\r\n        applyGainThenAdd(out->data, in->data, multiplier[channel]);\r\n        release(in);\r\n      }\r\n    }\r\n  }\r\n  if (out) {\r\n    transmit(out);\r\n    release(out);\r\n  }\r\n}\r\n// this class and function forces include \r\n// of functions applyGainThenAdd and applyGain used by the template\r\nclass DummyClass\r\n{\r\n  public:\r\n    virtual void dummyFunction();\r\n};\r\nvoid DummyClass::dummyFunction() {\r\n  applyGainThenAdd(0, 0, 0);\r\n  applyGain(0,0);\r\n    \r\n}\r\n\r\n#endif" } }, shortName: "theMixer.h", nonObject: "", useAceEditor: "c_cpp", category: "mixer", color: "#ddffbb", icon: "function.png" },


            //"AudioCrossPointSwitch":{defaults:{name:{type:"c_cpp_name"},id:{},inputs:{value:"1",maxval:255,minval:1,type:"int"},outputs:{value:"1",maxval:255,minval:1,type:"int"},comment:{}},shortName:"crossSwitch",inputs:1,outputs:1,category:"mixer",color:"#E6E0F8",icon:"arrow-in.png"},
            ClassComment: { defaults: { name: {}, id: {} }, shortName: "ClassComment", nonObject: "", category: "special", color: "#ccffcc", icon: "comment.png" },
            comment: { defaults: { name: {}, id: {}, comment: {} }, shortName: "Comment", nonObject: "", category: "special", color: "#ddffbb", icon: "comment.png" },
            Function: { defaults: { name: {}, id: {}, comment: {} }, shortName: "code", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "function.png" },
            Variables: { defaults: { name: {}, id: {}, comment: {} }, shortName: "vars", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "hash.png" },
            AudioStreamObject: {
                shortName: "userObject", dynInputs: "", inputs: 0, outputs: 0, category: "special", color: "#ddffbb", icon: "debug.png",
                editorhelp: "note. this object is only intended to quickly include and use custom objects,<br>consider using ('Node Definitions Manager' @ 'top-right menu') instead,<br>that way it's much easier to reuse the object,<br>and you have more freedoom customization the object.<br><br>note. Objects created in node def. mgr. are saved in the 'project' json",
                defaults: {
                    name: { type: "c_cpp_name", editor: { help: "the name given to the instance" } },
                    id: {},
                    subType: { type: "c_cpp_name", editor: { help: "is the class name given in the code,<br>this is the type that will be used when exporting the design." } },
                    includeFile: { editor: { help: "the name of the .h file to be included to use the Sub Type" } },
                    inputs: { value: "1", maxval: 255, minval: 1, type: "int", editor: { help: "how many audio inputs the custom AudioStream object have." } },
                    outputs: { value: "1", maxval: 255, minval: 1, type: "int", editor: { help: "how many audio outputs the custom AudioStream object have." } },
                    comment: {}
                }
            },
            CodeFile: { defaults: { name: {}, id: {}, comment: {} }, shortName: "codeFile", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "function.png" },
            DontRemoveCodeFiles: { defaults: { name: {}, id: {}, comment: {} }, shortName: "dontRemoveFiles", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "function.png" },
            IncludeDef: { defaults: { name: {}, id: {}, comment: {} }, shortName: "includeDef", nonObject: "", category: "special", color: "#ddffbb", icon: "file.png" },
            ConstructorCode: { defaults: { name: {}, id: {}, comment: {} }, shortName: "constructor code", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "function.png" },
            DestructorCode: { defaults: { name: {}, id: {}, comment: {} }, shortName: "destructor code", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "function.png" },
            EndOfFileCode: { defaults: { name: {}, id: {}, comment: {} }, shortName: "eof code", nonObject: "", useAceEditor: "c_cpp", category: "special", color: "#ddffbb", icon: "function.png" },

            ConstValue: { defaults: { name: { type: "c_cpp_name_no_array" }, id: {}, value: { value: "0" }, valueType: { value: "int" } }, shortName: "constValue", nonObject: "", category: "special", color: "#eb9834", icon: "hash.png" },
            JunctionLR: { defaults: { name: {}, id: {}, comment: {} }, shortName: "JunctionLR", nonObject: "", inputs: 1, outputs: 1, category: "special", color: "#4D54FF", textColor: "#FFFFFF", icon: "arrow-in.png" },
            JunctionRL: { defaults: { name: {}, id: {}, comment: {} }, shortName: "JunctionRL", nonObject: "", inputs: 1, outputs: 1, category: "special", color: "#4D54FF", textColor: "#FFFFFF", icon: "arrow-out.png" },

            UI_Button: { ...UiTypeBase, shortName: "Button",
                useAceEditor: "javascript", useAceEditorCodeFieldName: "sendCommand", aceEditorOffsetHeight: 0,
                defaults: {
                    ...UiTypeBase.defaults,
                    midiCh: { value: "0" }, midiId: { value: "0" },
                    pressAction: {}, repeatPressAction: { value: false },
                    releaseAction: {}, repeatReleaseAction: { value: false },
                    local: { value: false },
                    sendCommand: {}
                }
            },

            UI_Slider: { ...UiTypeBase, shortName: "Slider", color: "#808080",
                useAceEditor: "javascript", useAceEditorCodeFieldName: "sendCommand", aceEditorOffsetHeight: 200,
                defaults: {
                    ...UiTypeBase.defaults,
                    midiCh: { value: "0" }, midiId: { value: "0" },
                    orientation: { value: "v" }, label: { value: "d.val" },
                    minval: { value: 0, type: "int" }, maxval: { value: 100, type: "int" }, val: { value: 50, type: "int" }, divVal: { value: 1, minval: 1, type: "int" },
                    fval: { value: 0 },
                    sendMode: { value: "r" },
                    autoReturn: { value: false }, returnValue: { value: "mid" },
                    barFGcolor: { value: "#F6F8BC" },
                    sendFormat: {},
                    sendCommand: { value: "" }
                }
            },

            UI_TextBox: { ...UiTypeBase, shortName: "TextBox", },

            UI_Label: { ...UiTypeBase, shortName: "Label",
                editor: "autogen",
                defaults: {
                    ...UiTypeBase.defaults,
                    text: {value:""}
                }
            },

            UI_Image: { ...UiTypeBase, shortName: "Image",
                editor: "autogen",
                defaults: {
                    ...UiTypeBase.defaults,
                    imageWidth: {editor:{label:"Image Width"}, value: 100, type:"int", minval: 10 },
                    imageHeight: {editor:{label:"Image Height"}, value: 100, type:"int", minval: 10 },
                    
                }
            },

            UI_ListBox: { ...UiTypeBase, shortName: "ListBox",
                useAceEditor: "javascript", useAceEditorCodeFieldName: "sendCommand", aceEditorOffsetHeight: 300,
                defaults: {
                    ...UiTypeBase.defaults,
                    midiCh: { value: "0" }, midiId: { value: "0" },
                    temTextSize: { value: 14 },
                    items: { value: "item1\nitem2\nitem3" }, selectedIndex: { value: 0 }, selectedIndexOffset: { value: 0 }, headerHeight: { value: 30 },
                    itemBGcolor: { value: "#F6F8BC" },
                    sendCommand: {}

                }
            },

            UI_Piano: { ...UiTypeBase, shortName: "Piano",
                useAceEditor: "javascript", useAceEditorCodeFieldName: "sendCommand", aceEditorOffsetHeight: 120,
                defaults: {
                    ...UiTypeBase.defaults,
                    midiCh: { value: "0", minval: "0", maxval: "15", type: "int" },
                    midiId: { value: "0", minval: "0", maxval: "127", type: "int" },
                    octave: { value: 4, minval: "0", maxval: "10", type: "int" },
                    sendCommand: {},
                    headerHeight: { value: 30, minval: 0, type: "int" },
                    whiteKeysColor: { value: "#FFFFFF" }, blackKeysColor: { value: "#A0A0A0" },
                    blackKeysWidthDiff: { value: 6, minval: 0, type: "int" },
                    x: { value: 150, minval: 0, type: "int" },
                    y: { value: 150, minval: 0, type: "int" },
                    blackKeyLabelsVisible: { value: true }, whiteKeyLabelsVisible: { value: true }

                }
            },
            UI_ScriptButton: { ...UiTypeBase, shortName: "scriptBtn", useAceEditor: "javascript", color: "#ddffbb",
                defaults: {
                    ...UiTypeBase.defaults,
                    nodes: { value: [] }
                }
            },
            group: { ...UiTypeBase, shortName: "group", color: "#ddffbb",
                defaults: {
                    ...UiTypeBase.defaults,
                    nodes: { value: [] },
                    border_color: { value: "#999" },
                    individualListBoxMode: { value: "false" },
                    exportAsClass: { value: "false" }
                }
            }
        }
    },
    /*FAUST:{
        isAddon:true,
        label: "faust",
        description: "FAUST objects",
        credits: "manicken",
        homepage: "",
        url: "",
        types: {
        }
    },*/
    h4yn0nnym0u5e: {
        label: "h4yn0nnym0u5e",
        description: "h4yn0nnym0u5e AudioMixerStereo",
        credits: "h4yn0nnym0u5e(stereo), PJRC (original), manicken(dynInput)",
        homepage: "https://github.com/h4yn0nnym0u5e",
        url: "https://github.com/h4yn0nnym0u5e/Audio/tree/features/dynamic-updates",
        types: {
            AudioMixerStereo: { ...AudioTypeArrayBase,
                shortName: "mixerStereo", dynInputs: "", inputs: 1, outputs: 2, category: "mixer",
                editorhelp: dynInputMixers_Help,
                defaults: {
                    ...AudioTypeArrayBase.defaults,
                    inputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Visual Inputs", rowClass: "form-row-mid", readonly: dynInputMixers_Inputs_ReadOnly, help: dynInputMixers_Inputs_Help } },
                    ExtraInputs: { value: 0, maxval: 255, minval: 0, type: "int", editor: { label: "Extra Inputs", rowClass: "form-row-mid", help: dynInputMixers_ExtraInputs_Help } },
                    RealInputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Real Inputs", rowClass: "form-row-mid", readonly: "true", help: dynInputMixers_RealInputs_Help } }
                }
            },
        }
    },
    FrankBoesing: {
        label: "Frank Boesing",
        description: "Frank Boesing waw player/recorder",
        credits: "Frank Boesing",
        homepage: "https://github.com/FrankBoesing",
        url: "https://github.com/FrankBoesing/Teensy-WavePlayer",
        category: "FrankBoesing",
        types: {
            AudioPlayWav: { ...AudioTypeArrayBase, shortName: "playWav", outputs: 8, category: "play" },
            AudioRecordWav: { ...AudioTypeArrayBase, shortName: "RecordWav", inputs: 4, category: "record" },
        }
    },
    MattKuebrich: {
        label: "Matt Kuebrich",
        description: "Matt Kuebrich - new audio objects",
        credits: "Matt Kuebrich",
        homepage: "https://github.com/MattKuebrich",
        url: "https://raw.githubusercontent.com/MattKuebrich/teensy-audio-objects/main", // this is the %root% used for each type
        category: "MattKuebrich",
        types: {
            AudioEffectBernoulliGate: { ...AudioTypeArrayBase, shortName: "bernoulligate", category:"effect", url:"%root%/bernoulligate", outputs:2, inputs:1, outDesc:{0:"Bernoulli Gate Ouput A",1:"Bernoulli Gate Ouput B"}, inpDesc:{0:"Signal Input"} },
            AudioSynthBytebeat: { ...AudioTypeArrayBase, shortName:"bytebeat", category:"synth", url:"%root%/bytebeat/bytebeat_simple", outputs:1, outDesc:{0:"Bytebeat Output"} },
            AudioSynthChaosMaps: { ...AudioTypeArrayBase, shortName:"chaos_maps", category:"synth", url:"%root%/chaosmaps", outputs:1, inputs:2 },
            AudioSynthChaosNoise: { ...AudioTypeArrayBase, shortName:"chaos_noise", category:"synth", url:"%root%/chaosnoise", outputs:1 },
            AudioEffectComparator: { ...AudioTypeArrayBase, shortName:"comparator", category:"effect", url:"%root%/comparator", outputs:1, inputs:2, outDesc:{0:"Compared Output"}, inpDesc:{0:"Signal Input A",1:"Signal Input B"} },
            AudioFilterDCBlock: { ...AudioTypeArrayBase, shortName:"dcblock", category:"filter", url:"%root%/dcblock", outputs:1, inputs:1, outDesc:{0:"Filtered Output"}, inDesc:{0:"Signal Input"} },
            AudioSynthDust: { ...AudioTypeArrayBase, shortName:"dust", category:"synth", url:"%root&/dust", outputs:1, inputs:1, outDesc:{0:"Dust Output"}, inDesc:{0:"Density Modulation"} },
            AudioSynthFMDrum: { ...AudioTypeArrayBase, shortName:"fm_drum", category:"synth", url:"%root&/fmdrum", outputs:1, inputs:1, outDesc:{0:"FM Drum Output"}, inDesc:{0:"Trigger Input"} },
            AudioEffectFunctionShaper: { ...AudioTypeArrayBase, shortName:"function_shaper", category:"effect", url:"%root&/functionshaper", outputs:1, inputs:1, outDesc:{0:"Shaped Output"}, inDesc:{0:"Signal Input"} },
            AudioEffectGateToTrigger: { ...AudioTypeArrayBase, shortName:"gate_to_trigger", category:"effect", url:"%root&/gatetotrigger", outputs:1, inputs:1, outDesc:{0:"Trigger Output"}, inDesc:{0:"Gate Input"} },
            AudioFilterLadderLite: { ...AudioTypeArrayBase, shortName:"ladderlite", category:"filter", url:"%root&/ladderlite", outputs:1, inputs:1, outDesc:{0:"Out signal"}, inDesc:{0:"In signal"} },
            AudioAnalyzeReadout: { ...AudioTypeArrayBase, shortName:"readout", category:"analyze", url:"%root&/readout", inputs:1, inDesc:{0:"Signal to readout"} },
            AudioEffectQuantizer: { ...AudioTypeArrayBase, shortName:"quantizer", category:"effect", url:"%root&/quantizer", outputs:1, inputs:1, outDesc:{0:"Quantized Output"}, inDesc:{0:"Signal Input"} },
            AudioEffectSampleAndHold: { ...AudioTypeArrayBase, shortName:"samplehold", category:"effect", url:"%root&/samplehold", outputs:1, inputs:2, outDesc:{0:"Sample and Hold Output"}, inDesc:{0:"Signal Input",1:"Trigger Input"} },
            AudioEffectShiftRegister: { ...AudioTypeArrayBase, shortName:"shiftregister", category:"effect", url:"%root&/shiftregister", outputs:9, inputs:2, outDesc:{0:"Bit 0 Output",1:"Bit 1 Output",2:"Bit 2 Output",3:"Bit 3 Output",4:"Bit 4 Output",5:"Bit 5 Output",6:"Bit 6 Output",7:"Bit 7 Output",8:"3-bit DAC (Rungler) Output"}, inDesc:{0:"Data Input",1:"Clock Input"} },
            AudioEffectSlewLimiter: { ...AudioTypeArrayBase, shortName:"slewlimiter", category:"effect", url:"%root&/slewlimiter", outputs:1, inputs:1, outDesc:{0:"Slewed Output"}, inDesc:{0:"Signal Input"} },
            AudioSynthStkInstrmnt: { ...AudioTypeArrayBase, shortName:"stkinstrmnt", category:"synth", url:"%root&/stkinstrmnteffect", outputs:1, inputs:1, outDesc:{0:"Output"}, inDesc:{0:"Trigger Input"} },

        }
    },
    Newdigate: {
        label: "Nic Newdigate",
        description: "Nic Newdigate - audio objects",
        credits: "Nic Newdigate",
        homepage: "https://github.com/newdigate",
        url: "",
        category: "Newdigate",
        types: {
            AudioInputSharedAD7606: { ...AudioTypeArrayBase, shortName:"ad7606", category:"legacy", url:"", outputs:8},
            AudioOutputSharedAD5754Dual: { ...AudioTypeArrayBase, shortName:"ad5754", category:"legacy", url:"", inputs:8},
            AudioPlaySdRawResmp: { ...AudioTypeArrayBase, shortName:"rraw_sd", category:"legacy", url:"", outputs:2},
            AudioPlaySdWavResmp: { ...AudioTypeArrayBase, shortName:"rwav_sd", category:"legacy", url:"", outputs:2},
            AudioInputOutputSPI: { ...AudioTypeArrayBase, shortName:"ad7606_ad5754", category:"", url:"", outputs:8, inputs:8},
            AudioPlayArrayResmp: { ...AudioTypeArrayBase, shortName:"playArrayPitch", category:"", url:"", outputs:2},
            AudioPlaySdResmp: { ...AudioTypeArrayBase, shortName:"playSdPitch", category:"", url:"", outputs:2},
            AudioEffectCompressor: { ...AudioTypeArrayBase, shortName:"compressor", category:"", url:"", outputs:1, inputs:1},
            AudioEffectDynamics: { ...AudioTypeArrayBase, shortName:"dynamics", category:"", url:"", outputs:1, inputs:1},
            AudioInputSoundIO: { ...AudioTypeArrayBase, shortName:"sio_in", category:"", url:"", outputs:2},
            AudioOutputSoundIO: { ...AudioTypeArrayBase, shortName:"sio_out", category:"", url:"", inputs:2},
        }
    },
    chipaudette: {
        label: "OpenAudio_F32_ArduinoLibrary",
        description: "chipaudette OpenAudio_F32_ArduinoLibrary node addons",
        credits: "Chip Audette",
        homepage: "https://github.com/chipaudette",
        url: "https://api.github.com/repos/chipaudette/OpenAudio_ArduinoLibrary/contents/",
        category: "chipaudette",
        types: {
            AudioAlignLR_F32: { ...AudioTypeArrayBase, shortName: "alignLR_f32", category: "analyze", sourceFile: "AudioAlignLR_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x3": "f32"}},
            AudioAnalyzePhase_F32: { ...AudioTypeArrayBase, shortName: "analyzePhase_f32", category: "analyze", sourceFile: "AudioAnalyzePhase_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioCalcEnvelope_F32: { ...AudioTypeArrayBase, shortName: "calc_envelope_f32", category: "analyze", sourceFile: "AudioCalcEnvelope_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioCalcGainWDRC_F32: { ...AudioTypeArrayBase, shortName: "calc_WDRCGain_f32", category: "analyze", sourceFile: "AudioCalcGainWDRC_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioConfigFIRFilterBank_F32: { ...AudioTypeBase, shortName: "config_FIRbank_f32", category: "config", sourceFile: "AudioConfigFIRFilterBank_F32.h"},
            AudioControlSGTL5000_Extended: { ...AudioTypeBase, shortName: "SGTL5000_Extended", category: "control", sourceFile: "AudioControlSGTL5000_Extended.h"},
            AudioControlSignalTesterInterface_F32: { ...AudioTypeBase, shortName: "signalTesterInterface_f32", category: "control", sourceFile: "AudioControlTester.h"},
            AudioControlSignalTester_F32: { ...AudioTypeBase, shortName: "sigTest_Abstract_f32", category: "control", sourceFile: "AudioControlTester.h"},
            AudioControlTestAmpSweep_F32: { ...AudioTypeBase, shortName: "ampSweepTester_f32", category: "control", sourceFile: "AudioControlTester.h"},
            AudioControlTestFreqSweep_F32: { ...AudioTypeBase, shortName: "freqSweepTester_f32", category: "control", sourceFile: "AudioControlTester.h"},
            AudioTestSignalGenerator_F32: { ...AudioTypeArrayBase, shortName: "testSignGen_f32", category: "synth", sourceFile: "AudioControlTester.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioTestSignalMeasurement_F32: { ...AudioTypeArrayBase, shortName: "testSigMeas_f32", category: "synth", sourceFile: "AudioControlTester.h", inputTypes: {"x2": "f32"}},
            AudioTestSignalMeasurementMulti_F32: { ...AudioTypeArrayBase, shortName: "testSigMeas_f32", category: "synth", sourceFile: "AudioControlTester.h", inputTypes: {"x10": "f32"}},
            AudioConvert_I16toF32: { ...AudioTypeArrayBase, shortName: "I16toF32", category: "convert", sourceFile: "AudioConvert_F32.h", inputTypes: {"0": "i16"}, outputTypes: {"x1": "f32"}},
            AudioConvert_F32toI16: { ...AudioTypeArrayBase, shortName: "F32toI16", category: "convert", sourceFile: "AudioConvert_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"0": "i16"}},
            AudioEffectCompWDRC_F32: { ...AudioTypeArrayBase, shortName: "compressWDRC_f32", category: "effect", sourceFile: "AudioEffectCompWDRC_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectCompressor2_F32: { ...AudioTypeArrayBase, shortName: "compressor2_f32", category: "effect", sourceFile: "AudioEffectCompressor2_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectCompressor_F32: { ...AudioTypeArrayBase, shortName: "compressor_f32", category: "effect", sourceFile: "AudioEffectCompressor_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectDelay_OA_F32: { ...AudioTypeArrayBase, shortName: "delay_f32", category: "effect", sourceFile: "AudioEffectDelay_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            /*AudioEffectEmpty_F32: { ...AudioTypeArrayBase, shortName: "empty", category: "effect", sourceFile: "AudioEffectEmpty_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},*/
            AudioEffectFreqShiftFD_OA_F32: { ...AudioTypeArrayBase, shortName: "freq_shift_f32", category: "effect", sourceFile: "AudioEffectFreqShiftFD_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectGain_F32: { ...AudioTypeArrayBase, shortName: "EffectGain_f32", category: "effect", sourceFile: "AudioEffectGain_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectNoiseGate_F32: { ...AudioTypeArrayBase, shortName: "NoiseGate_f32", category: "effect", sourceFile: "AudioEffectNoiseGate_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectWDRC2_F32: { ...AudioTypeArrayBase, shortName: "CompressWDRC2_f32", category: "effect", sourceFile: "AudioEffectWDRC2_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilter90Deg_F32: { ...AudioTypeArrayBase, shortName: "_90DegPhase_f32", category: "filter", sourceFile: "AudioFilter90Deg_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            AudioFilterBiquad_F32: { ...AudioTypeArrayBase, shortName: "IIR_f32", category: "filter", sourceFile: "AudioFilterBiquad_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterEqualizer_F32: { ...AudioTypeArrayBase, shortName: "equalizer_f32", category: "filter", sourceFile: "AudioFilterEqualizer_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterFIRGeneral_F32: { ...AudioTypeArrayBase, shortName: "firGeneral_f32", category: "filter", sourceFile: "AudioFilterFIRGeneral_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterFIR_F32: { ...AudioTypeArrayBase, shortName: "fir_f32", category: "filter", sourceFile: "AudioFilterFIR_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterIIR_F32: { ...AudioTypeArrayBase, shortName: "iir_f32", category: "filter", sourceFile: "AudioFilterIIR_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioLMSDenoiseNotch_F32: { ...AudioTypeArrayBase, shortName: "LMSDenoiseNotch_f32", category: "filter", sourceFile: "AudioLMSDenoiseNotch_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathAdd_F32: { ...AudioTypeArrayBase, shortName: "MathAdd_f32", category: "effect", sourceFile: "AudioMathAdd_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathConstant_F32: { ...AudioTypeArrayBase, shortName: "MathConstant_f32", category: "synth", sourceFile: "AudioMathConstant_F32.h", outputTypes: {"x1": "f32"}},
            AudioMathMultiply_F32: { ...AudioTypeArrayBase, shortName: "MathMultiply_f32", category: "effect", sourceFile: "AudioMathMultiply_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathOffset_F32: { ...AudioTypeArrayBase, shortName: "MathOffset_f32", category: "effect", sourceFile: "AudioMathOffset_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathScale_F32: { ...AudioTypeArrayBase, shortName: "MathScale_f32", category: "effect", sourceFile: "AudioMathScale_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMixer4_F32: { ...AudioTypeArrayBase, shortName: "mixer4_f32", category: "mixer", sourceFile: "AudioMixer_F32.h", inputTypes: {"x4": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMixer8_F32: { ...AudioTypeArrayBase, shortName: "mixer8_f32", category: "mixer", sourceFile: "AudioMixer_F32.h", inputTypes: {"x8": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMultiply_F32: { ...AudioTypeArrayBase, shortName: "multiply_f32", category: "effect", sourceFile: "AudioMultiply_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioSDPlayer_F32: { ...AudioTypeArrayBase, shortName: "SDPlayer_f32", category: "play", sourceFile: "AudioSDPlayer_F32.h", outputTypes: {"x2": "f32"}},
            AudioSpectralDenoise_F32: { ...AudioTypeArrayBase, shortName: "spectral_f32", category: "filter", sourceFile: "AudioSpectralDenoise_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioSwitch4_OA_F32: { ...AudioTypeArrayBase, shortName: "switch4_f32", category: "mixer", sourceFile: "AudioSwitch_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x4": "f32"}},
            AudioSwitch8_OA_F32: { ...AudioTypeArrayBase, shortName: "switch8_f32", category: "mixer", sourceFile: "AudioSwitch_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x8": "f32"}},
            RadioFMDetector_F32: { ...AudioTypeArrayBase, shortName: "FMDetector_f32", category: "radio", sourceFile: "RadioFMDetector_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            RadioFMDiscriminator_F32: { ...AudioTypeArrayBase, shortName: "FMDiscriminator_f32", category: "radio", sourceFile: "RadioFMDiscriminator_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            RadioIQMixer_F32: { ...AudioTypeArrayBase, shortName: "IQMixer_f32", category: "radio", sourceFile: "RadioIQMixer_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            UART_F32: { ...AudioTypeArrayBase, shortName: "uart_f32", category: "analyze", sourceFile: "UART_F32.h", inputTypes: {"x1": "f32"}},
            AudioInputUSB_F32: { ...AudioTypeBase, shortName: "usbAudioIn_f32", category: "input-other", sourceFile: "USB_Audio_F32.h", outputTypes: {"x2": "f32"}},
            AudioOutputUSB_F32: { ...AudioTypeBase, shortName: "usbAudioOut_f32", category: "output-other", sourceFile: "USB_Audio_F32.h", inputTypes: {"x2": "f32"}},
            analyze_CTCSS_F32: { ...AudioTypeArrayBase, shortName: "DetCTCSS_f32", category: "analyze", sourceFile: "analyze_CTCSS_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioAnalyzeFFT1024_F32: { ...AudioTypeArrayBase, shortName: "FFT1024_f32", category: "analyze", sourceFile: "analyze_fft1024_F32.h", inputTypes: {"x1": "f32"}},
            AudioAnalyzeFFT1024_IQ_F32: { ...AudioTypeArrayBase, shortName: "FFT1024IQ_f32", category: "analyze", sourceFile: "analyze_fft1024_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT2048_IQ_F32: { ...AudioTypeArrayBase, shortName: "FFT2048IQ_f32", category: "analyze", sourceFile: "analyze_fft2048_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT256_IQ_F32: { ...AudioTypeArrayBase, shortName: "FFT256IQ_f32", category: "analyze", sourceFile: "analyze_fft256_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT4096_IQ_F32: { ...AudioTypeArrayBase, shortName: "FFT4096IQ_f32", category: "analyze", sourceFile: "analyze_fft4096_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT4096_IQEM_F32: { ...AudioTypeArrayBase, shortName: "FFT4096IQem_f32", category: "analyze", sourceFile: "analyze_fft4096_iqem_F32.h", inputTypes: {"x2": "f32"}},
            AudioAnalyzePeak_F32: { ...AudioTypeArrayBase, shortName: "Peak_f32", category: "analyze", sourceFile: "analyze_peak_f32.h", inputTypes: {"x1": "f32"}},
            AudioAnalyzeRMS_F32: { ...AudioTypeArrayBase, shortName: "RMS_f32", category: "analyze", sourceFile: "analyze_rms_f32.h", inputTypes: {"x1": "f32"}},
            AudioAnalyzeToneDetect_F32: { ...AudioTypeArrayBase, shortName: "ToneDet_f32", category: "analyze", sourceFile: "analyze_tonedetect_F32.h", inputTypes: {"x1": "f32"}},
            AsyncAudioInputSPDIF3_F32: { ...AudioTypeBase, shortName: "spdif3_async_f32", category: "input-spdif", sourceFile: "async_input_spdif3_F32.h", outputTypes: {"x2": "f32"}},
            AudioInputI2S_F32: { ...AudioTypeBase, shortName: "i2s_f32", category: "input-i2s1", sourceFile: "input_i2s_f32.h", outputTypes: {"x2": "f32"}},
            AudioInputI2Sslave_F32: { ...AudioTypeBase, shortName: "i2s_slave_f32", category: "input-i2s1", sourceFile: "input_i2s_f32.h", outputTypes: {"x2": "f32"}},
            AudioInputSPDIF3_F32: { ...AudioTypeBase, shortName: "spdif3_f32", category: "input-spdif", sourceFile: "input_spdif3_f32.h", outputTypes: {"x2": "f32"}},
            AudioOutputI2S_F32: { ...AudioTypeBase, shortName: "i2s_f32", category: "output-i2s1", sourceFile: "output_i2s_f32.h", inputTypes: {"x2": "f32"}},
            AudioOutputI2Sslave_F32: { ...AudioTypeBase, shortName: "i2s_slave_f32", category: "output-i2s1", sourceFile: "output_i2s_f32.h", inputTypes: {"x2": "f32"}},
            AudioOutputSPDIF3_F32: { ...AudioTypeBase, shortName: "spdif3_f32", category: "output-spdif", sourceFile: "output_spdif3_f32.h", inputTypes: {"x2": "f32"}},
            AudioPlayQueue_F32: { ...AudioTypeArrayBase, shortName: "play_queue_f32", category: "play", sourceFile: "play_queue_f32.h", outputTypes: {"x1": "f32"}},
            RadioBFSKModulator_F32: { ...AudioTypeArrayBase, shortName: "BFSKmodulator_f32", category: "radio", sourceFile: "radioBFSKmodulator_F32.h", outputTypes: {"x1": "f32"}},
            radioCESSB_Z_transmit_F32: { ...AudioTypeArrayBase, shortName: "CESSBTransmit_f32", category: "radio", sourceFile: "radioCESSB_Z_transmit_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            radioCESSBtransmit_F32: { ...AudioTypeArrayBase, shortName: "CESSBTransmit_f32", category: "radio", sourceFile: "radioCESSBtransmit_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            radioCWModulator_F32: { ...AudioTypeArrayBase, shortName: "detCTCSS_f32", category: "radio", sourceFile: "radioCWModulator_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            RadioFT8Demodulator_F32: { ...AudioTypeArrayBase, shortName: "FFT2048IQ_f32", category: "radio", sourceFile: "radioFT8Demodulator_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            RadioFT8Modulator_F32: { ...AudioTypeArrayBase, shortName: "FT8modulator_f32", category: "radio", sourceFile: "radioFT8Modulator_F32.h", outputTypes: {"x1": "f32"}},
            radioModulatedGenerator_F32: { ...AudioTypeArrayBase, shortName: "modulator_f32", category: "radio", sourceFile: "radioModulatedGenerator_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            radioNoiseBlanker_F32: { ...AudioTypeArrayBase, shortName: "noiseBlanker_f32", category: "radio", sourceFile: "radioNoiseBlanker_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            radioVoiceClipper_F32: { ...AudioTypeArrayBase, shortName: "CESSBTransmit_f32", category: "radio", sourceFile: "radioVoiceClipper_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            AudioRecordQueue_F32: { ...AudioTypeArrayBase, shortName: "rec_queue_f32", category: "record", sourceFile: "record_queue_f32.h", inputTypes: {"x1": "f32"}},
            AudioSynthGaussian_F32: { ...AudioTypeArrayBase, shortName: "gaussianwhitenoise_f32", category: "synth", sourceFile: "synth_GaussianWhiteNoise_F32.h", outputTypes: {"x1": "f32"}},
            AudioSynthNoisePink_F32: { ...AudioTypeArrayBase, shortName: "pinknoise_f32", category: "synth", sourceFile: "synth_pinknoise_f32.h", outputTypes: {"x1": "f32"}},
            AudioSynthSineCosine_F32: { ...AudioTypeArrayBase, shortName: "SineCosine_f32", category: "synth", sourceFile: "synth_sin_cos_f32.h", outputTypes: {"x2": "f32"}},
            AudioSynthWaveformSine_F32: { ...AudioTypeArrayBase, shortName: "sine_f32", category: "synth", sourceFile: "synth_sine_f32.h", outputTypes: {"x1": "f32"}},
            AudioSynthWaveform_F32: { ...AudioTypeArrayBase, shortName: "waveform_f32", category: "synth", sourceFile: "synth_waveform_F32.h", outputTypes: {"x1": "f32"}},
            AudioSynthNoiseWhite_F32: { ...AudioTypeArrayBase, shortName: "whitenoise_f32", category: "synth", sourceFile: "synth_whitenoise_f32.h", outputTypes: {"x1": "f32"}}
        }
    },
    officialNodes: {
        label: "Official Nodes",
        description: "The official Audio node types embedded into this tool, that is used by the official Audio Library ",
        credits: "Paul Stoffregen",
        homepage: "https://www.pjrc.com/",
        url: "https://api.github.com/repos/PaulStoffregen/Audio/contents",
        types: {
            
            AudioInputI2S: { ...AudioTypeBase, shortName: "i2s", outputs: 2, category: "input-i2s1" },
            AudioInputI2SQuad: { ...AudioTypeBase, shortName: "i2s_quad", outputs: 4, category: "input-i2s1" },
            AudioInputI2SHex: { ...AudioTypeBase, shortName: "i2s_hex", outputs: 6, category: "input-i2s1" },
            AudioInputI2SOct: { ...AudioTypeBase, shortName: "i2s_oct", outputs: 8, category: "input-i2s1" },
            AudioInputI2Sslave: { ...AudioTypeBase, shortName: "i2sslave", outputs: 2, category: "input-i2s1", color: "#F7D8F0" },
            AudioInputI2S2: { ...AudioTypeBase, shortName: "i2s2", outputs: 2, category: "input-i2s2" },
            AudioInputSPDIF3: { ...AudioTypeBase, shortName: "spdif3", outputs: 2, category: "input-spdif", color: "#F7D8F0" },
            AsyncAudioInputSPDIF3: { ...AudioTypeBase, shortName: "spdif_async", outputs: 2, category: "input-spdif" },
            AudioInputAnalog: { ...AudioTypeBase, shortName: "adc", outputs: 1, category: "input-adc" },
            AudioInputAnalogStereo: { ...AudioTypeBase, shortName: "adc_st", outputs: 2, category: "input-adc" },
            AudioInputPDM: { ...AudioTypeBase, shortName: "pdm", outputs: 1, category: "input-i2s1" },
            AudioInputPDM2: { ...AudioTypeBase, shortName: "pdm2", outputs: 1, category: "input-i2s2" },
            AudioInputTDM: { ...AudioTypeBase, shortName: "tdm", outputs: 16, category: "input-i2s1", defaults: { ...AudioTypeBase.defaults, outputs: { value: "16" } } },
            AudioInputTDM2: { ...AudioTypeBase, shortName: "tdm2", outputs: 16, category: "input-i2s2", defaults: { ...AudioTypeArrayBase.defaults, outputs: { value: "16" } } },
            AudioInputUSB: { ...AudioTypeBase, shortName: "usb", outputs: 2, category: "input-other" },

            AudioOutputI2S: { ...AudioTypeBase, shortName: "i2s", inputs: 2, category: "output-i2s1" },
            AudioOutputI2SQuad: { ...AudioTypeBase, shortName: "i2s_quad", inputs: 4, category: "output-i2s1" },
            AudioOutputI2SHex: { ...AudioTypeBase, shortName: "i2s_hex", inputs: 6, category: "output-i2s1" },
            AudioOutputI2SOct: { ...AudioTypeBase, shortName: "i2s_oct", inputs: 8, category: "output-i2s1" },
            AudioOutputI2Sslave: { ...AudioTypeBase, shortName: "i2sslave", inputs: 2, category: "output-i2s1", color: "#F7D8F0" },
            AudioOutputI2S2: { ...AudioTypeBase, shortName: "i2s2", inputs: 2, category: "output-i2s2" },
            AudioOutputSPDIF: { ...AudioTypeBase, shortName: "spdif", inputs: 2, category: "output-i2s1" },
            AudioOutputSPDIF2: { ...AudioTypeBase, shortName: "spdif2", inputs: 2, category: "output-i2s2" },
            AudioOutputSPDIF3: { ...AudioTypeBase, shortName: "spdif3", inputs: 2, category: "output-spdif" },
            AudioOutputPT8211: { ...AudioTypeBase, shortName: "pt8211", inputs: 2, category: "output-i2s1" },
            AudioOutputPT8211_2: { ...AudioTypeBase, shortName: "pt8211_2", inputs: 2, category: "output-i2s2" },
            AudioOutputAnalog: { ...AudioTypeBase, shortName: "dac", inputs: 1, category: "output-adc" },
            AudioOutputAnalogStereo: { ...AudioTypeBase, shortName: "dac_st", inputs: 2, category: "output-adc" },
            AudioOutputPWM: { ...AudioTypeBase, shortName: "pwm", inputs: 1, category: "output-other" },
            AudioOutputMQS: { ...AudioTypeBase, shortName: "mqs", inputs: 2, category: "output-other" },
            AudioOutputTDM: { ...AudioTypeBase, shortName: "tdm", inputs: 16, category: "output-i2s1", defaults: { ...AudioTypeBase.defaults, inputs: { value: "16" } } },
            AudioOutputTDM2: { ...AudioTypeBase, shortName: "tdm2", inputs: 16, category: "output-i2s2", defaults: { ...AudioTypeBase.defaults, inputs: { value: "16" } } },
            AudioOutputADAT: { ...AudioTypeBase, shortName: "adat", inputs: 8, category: "output-other" },
            AudioOutputUSB: { ...AudioTypeBase, shortName: "usb", inputs: 2, category: "output-other" },

            AudioAmplifier: { ...AudioTypeArrayBase, shortName: "amp", inputs: 1, outputs: 1, category: "mixer" },
            AudioMixer4: { ...AudioTypeArrayBase, shortName: "mixer4", inputs: 4, outputs: 1, category: "mixer" },
            AudioPlayMemory: { ...AudioTypeArrayBase, shortName: "playMem", outputs: 1, category: "play" },
            AudioPlaySdWav: { ...AudioTypeArrayBase, shortName: "playSdWav", outputs: 2, category: "play" },
            AudioPlaySdRaw: { ...AudioTypeArrayBase, shortName: "playSdRaw", outputs: 1, category: "play" },
            AudioPlaySerialflashRaw: { ...AudioTypeArrayBase, shortName: "playFlashRaw", outputs: 1, category: "play" },
            AudioPlayQueue: { ...AudioTypeArrayBase, shortName: "queue", outputs: 1, category: "play" },

            AudioRecordQueue: { ...AudioTypeArrayBase, shortName: "queue", inputs: 1, category: "record" },

            AudioSynthWavetable: { ...AudioTypeArrayBase, shortName: "wavetable", outputs: 1, category: "synth" },
            AudioSynthSimpleDrum: { ...AudioTypeArrayBase, shortName: "drum", outputs: 1, category: "synth" },
            AudioSynthKarplusStrong: { ...AudioTypeArrayBase, shortName: "string", outputs: 1, category: "synth" },
            AudioSynthWaveformSine: { ...AudioTypeArrayBase, shortName: "sine", outputs: 1, category: "synth" },
            AudioSynthWaveformSineHires: { ...AudioTypeArrayBase, shortName: "sine_hires", outputs: 2, category: "synth" },
            AudioSynthWaveformSineModulated: { ...AudioTypeArrayBase, shortName: "sine_fm", inputs: 1, outputs: 1, category: "synth" },
            AudioSynthWaveform: { ...AudioTypeArrayBase, shortName: "waveform", outputs: 1, category: "synth" },
            AudioSynthWaveformModulated: { ...AudioTypeArrayBase, shortName: "waveformMod", inputs: 2, outputs: 1, category: "synth" },
            AudioSynthWaveformPWM: { ...AudioTypeArrayBase, shortName: "pwm", inputs: 1, outputs: 1, category: "synth" },
            AudioSynthToneSweep: { ...AudioTypeArrayBase, shortName: "tonesweep", outputs: 1, category: "synth" },
            AudioSynthWaveformDc: { ...AudioTypeArrayBase, shortName: "dc", outputs: 1, category: "synth" },
            AudioSynthNoiseWhite: { ...AudioTypeArrayBase, shortName: "noise", outputs: 1, category: "synth" },
            AudioSynthNoisePink: { ...AudioTypeArrayBase, shortName: "pink", outputs: 1, category: "synth" },

            AudioEffectFade: { ...AudioTypeArrayBase, shortName: "fade", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectChorus: { ...AudioTypeArrayBase, shortName: "chorus", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectFlange: { ...AudioTypeArrayBase, shortName: "flange", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectReverb: { ...AudioTypeArrayBase, shortName: "reverb", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectFreeverb: { ...AudioTypeArrayBase, shortName: "freeverb", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectFreeverbStereo: { ...AudioTypeArrayBase, shortName: "freeverbs", inputs: 1, outputs: 2, category: "effect" },
            AudioEffectEnvelope: { ...AudioTypeArrayBase, shortName: "envelope", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectMultiply: { ...AudioTypeArrayBase, shortName: "multiply", inputs: 2, outputs: 1, category: "effect" },
            AudioEffectRectifier: { ...AudioTypeArrayBase, shortName: "rectify", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectDelay: { ...AudioTypeArrayBase, shortName: "delay", inputs: 1, outputs: 8, category: "effect", defaults: { ...AudioTypeArrayBase.defaults, outputs: { value: "8" } } },
            AudioEffectDelayExternal: { ...AudioTypeArrayBase, shortName: "delayExt", inputs: 1, outputs: 8, category: "effect",
                defaults: {
                    ...AudioTypeArrayBase.defaults, outputs: { value: "8" },
                    useMakeConstructor,
                    memtype: {
                        type: "int",
                        value: "3",
                        editor: {
                            type:"combobox",
                            options:[ // just a little sidenote here: individual descriptions don't work at the moment but keep them here anyway as a reference to the names
                                {value:0,text:"23LC1024",description:""},
                                {value:1,text:"MEMORYBOARD",description:""},
                                {value:2,text:"CY15B104",description:""},
                                {value:3,text:"PSRAM64",description:""},
                                {value:4,text:"INTERNAL",description:""},
                                {value:5,text:"HEAP",description:""},
                                {value:6,text:"EXTMEM",description:""},
                            ],
                            label: "Mem Type",
                            help: "Currently only used by h4yn0nnym0u5e OSC library<br><br>" +
                                "0 = AUDIO_MEMORY_23LC1024    // 128k x 8 S-RAM<br>" +
                                "1 = AUDIO_MEMORY_MEMORYBOARD<br>" +
                                "2 = AUDIO_MEMORY_CY15B104	  // 512k x 8 F-RAM<br>" +
                                "<br>Following only at <b>h4yn0nnym0u5e</b> updated audio-lib:<br><br>" +
                                "3 = AUDIO_MEMORY_PSRAM64     // 64Mb / 8MB PSRAM (95s @ 44kHz / 16 bit)<br>" +
                                "4 = AUDIO_MEMORY_INTERNAL    // 8000 samples (181ms), for test only!<br>" +
                                "5 = AUDIO_MEMORY_HEAP<br>" +
                                "6 = AUDIO_MEMORY_EXTMEM<br>" +
                                ">6  AUDIO_MEMORY_UNDEFINED"
                        }
                    },
                    maxDelay: {
                        type: "float",
                        value: "2000.0",
                        editor: {
                            label: "Max Delay(ms)",
                            help: "Currently only used by h4yn0nnym0u5e OSC library<br><br>" +
                                "the max delay in milliseconds that is allowed for this instance"
                        }
                    }
                },
                makeConstructor: {
                    valueTypes: "if",
                    valueNames: "memtype, maxDelay"
                }
            },
            AudioEffectBitcrusher: { ...AudioTypeArrayBase, shortName: "bitcrusher", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectMidSide: { ...AudioTypeArrayBase, shortName: "midside", inputs: 2, outputs: 2, category: "effect" },
            AudioEffectWaveshaper: { ...AudioTypeArrayBase, shortName: "waveshape", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectGranular: { ...AudioTypeArrayBase, shortName: "granular", inputs: 1, outputs: 1, category: "effect" },
            AudioEffectDigitalCombine: { ...AudioTypeArrayBase, shortName: "combine", inputs: 2, outputs: 1, category: "effect" },
            AudioEffectWaveFolder: { ...AudioTypeArrayBase, shortName: "wavefolder", inputs: 2, outputs: 1, category: "effect" },

            AudioFilterBiquad: { ...AudioTypeArrayBase, shortName: "biquad", inputs: 1, outputs: 1, category: "filter" },
            AudioFilterFIR: { ...AudioTypeArrayBase, shortName: "fir", inputs: 1, outputs: 1, category: "filter" },
            AudioFilterStateVariable: { ...AudioTypeArrayBase, shortName: "filter", inputs: 2, outputs: 3, category: "filter" },
            AudioFilterLadder: { ...AudioTypeArrayBase, shortName: "ladder", inputs: 3, outputs: 1, category: "filter" },

            AudioAnalyzePeak: { ...AudioTypeArrayBase, shortName: "peak", inputs: 1, category: "analyze" },
            AudioAnalyzeRMS: { ...AudioTypeArrayBase, shortName: "rms", inputs: 1, category: "analyze" },
            AudioAnalyzeFFT256: { ...AudioTypeArrayBase, shortName: "fft256", inputs: 1, category: "analyze" },
            AudioAnalyzeFFT1024: { ...AudioTypeArrayBase, shortName: "fft1024", inputs: 1, category: "analyze" },
            AudioAnalyzeToneDetect: { ...AudioTypeArrayBase, shortName: "tone", inputs: 1, category: "analyze" },
            AudioAnalyzeNoteFrequency: { ...AudioTypeArrayBase, shortName: "notefreq", inputs: 1, category: "analyze" },
            AudioAnalyzePrint: { ...AudioTypeArrayBase, shortName: "print", inputs: 1, category: "analyze" },

            AudioControlSGTL5000: { ...AudioTypeBase, shortName: "sgtl5000", category: "control" },
            AudioControlAK4558: { ...AudioTypeBase, shortName: "ak4558", category: "control" },
            AudioControlCS4272: { ...AudioTypeBase, shortName: "cs4272", category: "control" },
            AudioControlWM8731: { ...AudioTypeBase, shortName: "wm8731", category: "control" },
            AudioControlWM8731master: { ...AudioTypeBase, shortName: "wm8731m", category: "control" },
            AudioControlCS42448: { ...AudioTypeBase, shortName: "cs42448", category: "control" }
        }
    }
}

InputOutputCompatibilityMetadata = {
    requirements: [
        { type: "AudioInputI2S", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputI2S", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputI2S", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputI2SQuad", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputI2SQuad", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputI2SQuad", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputI2SQuad", resource: "OUT1D Pin", shareable: false },
        { type: "AudioInputI2SHex", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputI2SHex", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputI2SHex", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputI2SHex", resource: "OUT1D Pin", shareable: false },
        { type: "AudioInputI2SHex", resource: "OUT1C Pin", shareable: false },
        { type: "AudioInputI2SOct", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputI2SOct", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputI2SOct", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputI2SOct", resource: "OUT1D Pin", shareable: false },
        { type: "AudioInputI2SOct", resource: "OUT1C Pin", shareable: false },
        { type: "AudioInputI2SOct", resource: "OUT1B Pin", shareable: false },
        { type: "AudioInputI2Sslave", resource: "I2S Device", shareable: true, setting: "I2S Slave" },
        { type: "AudioInputI2Sslave", resource: "Sample Rate", shareable: true, setting: "LRCLK1 Control" },
        { type: "AudioInputI2Sslave", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputI2S2", resource: "I2S2 Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputI2S2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputI2S2", resource: "IN2 Pin", shareable: false },
        { type: "AudioInputSPDIF3", resource: "SPDIF Device", shareable: true, setting: "SPDIF Protocol" },
        { type: "AudioInputSPDIF3", resource: "Sample Rate", shareable: true, setting: "SPDIF Control" },
        { type: "AudioInputSPDIF3", resource: "SPDIFIN Pin", shareable: false },
        { type: "AsyncAudioInputSPDIF3", resource: "SPDIF Device", shareable: true, setting: "SPDIF Protocol" },
        { type: "AsyncAudioInputSPDIF3", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AsyncAudioInputSPDIF3", resource: "SPDIFIN Pin", shareable: false },
        { type: "AudioInputAnalog", resource: "ADC1", shareable: false },
        { type: "AudioInputAnalog", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputAnalogStereo", resource: "ADC1", shareable: false },
        { type: "AudioInputAnalogStereo", resource: "ADC2", shareable: false },
        { type: "AudioInputAnalogStereo", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputPDM", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputPDM", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputPDM", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputPDM2", resource: "I2S2 Device", shareable: true, setting: "I2S Master" },
        { type: "AudioInputPDM2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputPDM2", resource: "IN2 Pin", shareable: false },
        { type: "AudioInputTDM", resource: "I2S Device", shareable: true, setting: "TDM Protocol" },
        { type: "AudioInputTDM", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputTDM", resource: "IN1 Pin", shareable: false },
        { type: "AudioInputTDM2", resource: "I2S2 Device", shareable: true, setting: "TDM Protocol" },
        { type: "AudioInputTDM2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioInputTDM2", resource: "IN2 Pin", shareable: false },
        { type: "AudioInputUSB", resource: "USB Rx Endpoint", shareable: false },
        { type: "AudioOutputI2S", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioOutputI2S", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputI2S", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputI2SQuad", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioOutputI2SQuad", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputI2SQuad", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputI2SQuad", resource: "OUT1B Pin", shareable: false },
        { type: "AudioOutputI2SHex", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioOutputI2SHex", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputI2SHex", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputI2SHex", resource: "OUT1B Pin", shareable: false },
        { type: "AudioOutputI2SHex", resource: "OUT1C Pin", shareable: false },
        { type: "AudioOutputI2SOct", resource: "I2S Device", shareable: true, setting: "I2S Master" },
        { type: "AudioOutputI2SOct", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputI2SOct", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputI2SOct", resource: "OUT1B Pin", shareable: false },
        { type: "AudioOutputI2SOct", resource: "OUT1C Pin", shareable: false },
        { type: "AudioOutputI2SOct", resource: "OUT1D Pin", shareable: false },
        { type: "AudioOutputI2Sslave", resource: "I2S Device", shareable: true, setting: "I2S Slave" },
        { type: "AudioOutputI2Sslave", resource: "Sample Rate", shareable: true, setting: "LRCLK1 Control" },
        { type: "AudioOutputI2Sslave", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputI2S2", resource: "I2S2 Device", shareable: true, setting: "I2S Master" },
        { type: "AudioOutputI2S2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputI2S2", resource: "OUT2 Pin", shareable: false },
        { type: "AudioOutputSPDIF", resource: "I2S Device", shareable: true, setting: "SPDIF Protocol" },
        { type: "AudioOutputSPDIF", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputSPDIF", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputSPDIF2", resource: "I2S2 Device", shareable: true, setting: "SPDIF Protocol" },
        { type: "AudioOutputSPDIF2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputSPDIF2", resource: "OUT2 Pin", shareable: false },
        { type: "AudioOutputSPDIF3", resource: "SPDIF Device", shareable: true, setting: "SPDIF Protocol" },
        { type: "AudioOutputSPDIF3", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputSPDIF3", resource: "SPDIFOUT Pin", shareable: false },
        { type: "AudioOutputPT8211", resource: "I2S Device", shareable: true, setting: "PT8211 Protocol" },
        { type: "AudioOutputPT8211", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputPT8211", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputPT8211_2", resource: "I2S2 Device", shareable: true, setting: "PT8211 Protocol" },
        { type: "AudioOutputPT8211_2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputPT8211_2", resource: "OUT2 Pin", shareable: false },
        { type: "AudioOutputAnalog", resource: "DAC1", shareable: false },
        { type: "AudioOutputAnalog", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputAnalogStereo", resource: "DAC1", shareable: false },
        { type: "AudioOutputAnalogStereo", resource: "DAC2", shareable: false },
        { type: "AudioOutputAnalogStereo", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputPWM", resource: "PWM", shareable: false },
        { type: "AudioOutputPWM", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputMQS", resource: "MSQ Device", shareable: false },
        { type: "AudioOutputMQS", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputTDM", resource: "I2S Device", shareable: true, setting: "TDM Protocol" },
        { type: "AudioOutputTDM", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputTDM", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputTDM2", resource: "I2S2 Device", shareable: true, setting: "TDM Protocol" },
        { type: "AudioOutputTDM2", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputTDM2", resource: "OUT2 Pin", shareable: false },
        { type: "AudioOutputADAT", resource: "I2S Device", shareable: true, setting: "ADAT Protocol" },
        { type: "AudioOutputADAT", resource: "Sample Rate", shareable: true, setting: "Teensy Control" },
        { type: "AudioOutputADAT", resource: "OUT1A Pin", shareable: false },
        { type: "AudioOutputUSB", resource: "USB Tx Endpoint", shareable: false }
    ]
}