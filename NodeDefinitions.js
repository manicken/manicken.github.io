// the main reason for this 'table' is to 
// order categories
var ioSubCats = { 
    "i2s1": { headerStyle: "background: #FAFAFA;" }, 
    "i2s2": { headerStyle: "background: #E3E3E3;" }, 
    "spdif": { headerStyle: "background: #FAFAFA;" }, 
    "other": { headerStyle: "background: #E3E3E3;" }
}

const htmlContent = /*html*/`
  <div>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </div>
`;

// TODO. add tooltip popup functionality for categories
// each category can have the following optional fields,
// with examples:
// headerStyle: "background-color:#AAA;"
// expanded: false
// label: "Hello World"
var NodeBaseManicksanCategories = {
    "used": { description: "contains a list of all used audio objects" },
    "tabs": { description: "the different classes(tabs) created in this tool" },
    "special": { description:" special objects added by manicksan"  },
    "ui": { description: "UI objects that can be used to control your project using either serial port or midi api:s, most objects allow writing and executing javascript code directly"  },
}

var NodeBaseCategories = {
    "input": { "subcats": { ...ioSubCats, "adc": { headerStyle: "background: #FAFAFA;" }} },
    "output": { "subcats": { ...ioSubCats, "dac": { headerStyle: "background: #FAFAFA;" }}},
    "mixer": {  },
    "play": {  },
    "record": {  },
    "synth": {  },
    "effect": {  },
    "filter": {  },
    "analyze": {  },
    "control": {  },
    "unsorted": {  },
}
var NodeCategories = {
    ...NodeBaseManicksanCategories,
    ...NodeBaseCategories,
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
var dynInputMixers_Inputs_Help = /*html*/ `Tool Visual Inputs<br>note. this is disabled when using LinkDropOnNodeAppend<br>together with<br>DyninputAutoExpandOnLinkDrop<br>or<br>DyninputAutoReduceOnLinkRemove<br><br>Don't know if there is any point of having<br>either the mentioned settings or this Inputs field,<br>as the dynamic resize could be normal behaviour.`;
var dynInputMixers_ExtraInputs_Help = /*html*/ `Extra Inputs is intended to replace the Visual Inputs in future exports,<br>Extra Inputs should then be used to create a mixer with extra inputs,<br>this would then make it possible to connect additional sources at runtime.<br>For the OSC live edit this would also then not requiring the mixer to be resized at runtime thus saving alot of required OSC messages.`;
var dynInputMixers_RealInputs_Help = /*html*/ `this is to show the real input count of the mixer<br>i.e. the size of the mixer when exported`;

// used as a shortcut when defining Audio objects that have dynamic input capability 
function dynInputMixers_Inputs_ReadOnly() {
    return (RED.main.settings.LinkDropOnNodeAppend == true && (RED.main.settings.DynInputAutoExpandOnLinkDrop == true || RED.main.settings.DynInputAutoReduceOnLinkRemove == true));
};



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
var NonAudioObjectBase = {
    defaults: {
        name: {},
        id: { "noEdit": "" },
        comment: {}
    },
    nonObject: "",
};
var CodeObjectBase = {
    ...NonAudioObjectBase,
    defaults: {...NonAudioObjectBase.defaults},
    color: "#ddffbb",
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

var followingNotImplementedYet = {
    notImplYet: {
        type:"dontsave", 
        editor:{
            label:"following items not implemented yet", 
            type:"label", // label only
            dividerTop: {size:2,style:"solid"},
            dividerBottom: {size:1,style:"dashed"},
            rowClass:"form-row-auto"
        }
    }
}
var TabIoCommon_Defaults = {
    isBus: {value: false, editor:{type:"boolean"}},
    portNames: {value: "", editor:{type:"multiline"}}
}
var TabIO_PortCount_Default = {
    value: 1, maxval: 255, minval: 1, type: "int"
}

// each node def. group can contain a 'category' field
// that defines the sub category id to which the type categories are added, 
// the 'category' field is optional if 'categoryItems' is present,
// then the id is taken from the nodedefgroup type
// also a optional field 'categoryLabel' can be used 
// to change the label of the category in the palette
// the field 'categoryItems' define the order of the categories
// and if not present then the order is defined from the order of which the node types
// are added

var ManickenNodesBase = {
    credits: "Jannik LF Svensson (manicken)",
    homepage: "https://github.com/manicken",
    url: "",
};

var NodeDefinitions = {
    /*
    template:{ // node def. group uid
        description: "", // future usage for usage in category tooltip
        credits: "", // future usage for usage in category tooltip
        homepage: "", // future usage for usage in category tooltip
        url: "", // root url to where to find include files
        // optional to define which root category to place node types,
        // note. cannot be used together with categoryLabel and/or categoryItems
        categoryRoot: "",
        // optional to define the ui label, if not present the node def. group uid is used
        categoryLabel: "template cat",
        // optional to define the style of the category header
        categoryHeaderStyle: "background:#FFF",
        // defines the order of categories, here '...NodeBaseCategories' can be used to include standard categories,
        // additional categories can be added as shown 
        categoryItems: { ...NodeBaseCategories, additionalCategory1:{label:"additional category 1", headerStyle:"background:#FFF;"}, additionalCategory2:{}}, 

        types: {
            
            AudioProcessObject: { 
                ...AudioTypeArrayBase, // here ...AudioTypeArrayBase is used for objects that can be used in arrays
                shortName: "process", sourceFile: "audioProcessObject.h", 
                // inputTypes and/or outputTypes can be used to define the types used for the I/O:s
                // this is used in the GUI tool to make sure that only compatible I/O:s can be connected together
                // here x1 means that it's gonna have 2 inputs of i16-type
                inputTypes: {"x2": "i16"}, 
                outputTypes: {"x1": "i16"},
                // input types can also be written like this to define different input types
                //inputTypes: {0: "i16", 1: "i32"},
            },
            AudioInput_I2S: {
                ...AudioTypeBase, // here ...AudioTypeBase is used to define objects that cannot be used in arrays
                shortName: "i2s", category: "input-i2s1", sourceFile: "audioInput_I2S.h",
                outputs:2 // stereo input
            }, 
            AudioOutput_I2S: { ...AudioTypeBase, shortName: "i2s", category: "output-i2s1", sourceFile: "audioOutput_I2S.h", inputs:2},
        }
    },
    */
    manickenSpecialAudioNodes: {
        description: "The special audio node types embedded into this tool++ by manicken",
        ...ManickenNodesBase,
        types: {
            AudioMixer: { ...AudioTypeArrayBase, shortName: "mixer", dynInputs: {}, editor: "autogen", inputs: 1, outputs: 1, category: "mixer",
                editorhelp: dynInputMixers_Help,
                defaults: {
                    ...AudioTypeArrayBase.defaults,
                    inputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Visual Inputs", rowClass: "form-row-mid", readonly: dynInputMixers_Inputs_ReadOnly, help: dynInputMixers_Inputs_Help } },
                    ExtraInputs: { value: 0, maxval: 255, minval: 0, type: "int", editor: { label: "Extra Inputs", rowClass: "form-row-mid", help: dynInputMixers_ExtraInputs_Help } },
                    RealInputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Real Inputs", rowClass: "form-row-mid", readonly: true, help: dynInputMixers_RealInputs_Help } }
                }
            },
            "theMixer.h": { dontShowInPalette: "", shortName: "theMixer.h", nonObject: "", useAceEditor: "c_cpp", category: "mixer", color: "#ddffbb", icon: "function.png",defaults: { name: {}, id: {}, comment: { value: "/* Audio Library for Teensy 3.X\r\n * Copyright (c) 2014, Paul Stoffregen, paul@pjrc.com\r\n *\r\n * Development of this audio library was funded by PJRC.COM, LLC by sales of\r\n * Teensy and Audio Adaptor boards.  Please support PJRC's efforts to develop\r\n * open source software by purchasing Teensy or other PJRC products.\r\n *\r\n * Permission is hereby granted, free of charge, to any person obtaining a copy\r\n * of this software and associated documentation files (the \"Software\"), to deal\r\n * in the Software without restriction, including without limitation the rights\r\n * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\r\n * copies of the Software, and to permit persons to whom the Software is\r\n * furnished to do so, subject to the following conditions:\r\n *\r\n * The above copyright notice, development funding notice, and this permission\r\n * notice shall be included in all copies or substantial portions of the Software.\r\n *\r\n * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\r\n * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\r\n * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\r\n * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\r\n * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\r\n * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\r\n  * THE SOFTWARE.\r\n */\r\n\r\n#ifndef themixer_h_\r\n#define themixer_h_\r\n\r\n#include <Arduino.h>\r\n#include <AudioStream.h>\r\n\r\n//#define AudioMixer4 AudioMixer<4>\r\n\r\n#if defined(__ARM_ARCH_7EM__)\r\n\r\n#define MULTI_UNITYGAIN 65536\r\n#define MULTI_UNITYGAIN_F 65536.0f\r\n#define MAX_GAIN 32767.0f\r\n#define MIN_GAIN -32767.0f\r\n#define MULT_DATA_TYPE int32_t\r\n\r\n#elif defined(KINETISL)\r\n\r\n#define MULTI_UNITYGAIN 256\r\n#define MULTI_UNITYGAIN_F 256.0f\r\n#define MAX_GAIN 127.0f\r\n#define MIN_GAIN -127.0f\r\n#define MULT_DATA_TYPE int16_t\r\n\r\n#endif\r\n\r\ntemplate <int NN> class AudioMixer : public AudioStream\r\n{\r\npublic:\r\n  AudioMixer(void) : AudioStream(NN, inputQueueArray) {\r\n    for (int i=0; i<NN; i++) multiplier[i] = MULTI_UNITYGAIN;\r\n  } \r\n  virtual void update();\r\n  \r\n  /**\r\n   * this sets the individual gains\r\n   * @param channel\r\n   * @param gain\r\n   */\r\n  void gain(unsigned int channel, float gain);\r\n  /**\r\n   * set all channels to specified gain\r\n   * @param gain\r\n   */\r\n  void gain(float gain);\r\n\r\nprivate:\r\n  MULT_DATA_TYPE multiplier[NN];\r\n  audio_block_t *inputQueueArray[NN];\r\n};\r\n\r\n// the following Forward declarations \r\n// must be defined when we use template \r\n// the compiler throws some warnings that should be errors otherwise\r\n\r\nstatic int32_t signed_multiply_32x16b(int32_t a, uint32_t b); \r\nstatic int32_t signed_multiply_32x16t(int32_t a, uint32_t b);\r\nstatic int32_t signed_saturate_rshift(int32_t val, int bits, int rshift);\r\nstatic uint32_t pack_16b_16b(int32_t a, int32_t b);\r\nstatic uint32_t signed_add_16_and_16(uint32_t a, uint32_t b);\r\n\r\n// because of the template use applyGain and applyGainThenAdd functions\r\n// must be in this file and NOT in cpp file\r\n#if defined(__ARM_ARCH_7EM__)\r\n\r\n  static void applyGain(int16_t *data, int32_t mult)\r\n  {\r\n    uint32_t *p = (uint32_t *)data;\r\n    const uint32_t *end = (uint32_t *)(data + AUDIO_BLOCK_SAMPLES);\r\n\r\n    do {\r\n      uint32_t tmp32 = *p; // read 2 samples from *data\r\n      int32_t val1 = signed_multiply_32x16b(mult, tmp32);\r\n      int32_t val2 = signed_multiply_32x16t(mult, tmp32);\r\n      val1 = signed_saturate_rshift(val1, 16, 0);\r\n      val2 = signed_saturate_rshift(val2, 16, 0);\r\n      *p++ = pack_16b_16b(val2, val1);\r\n    } while (p < end);\r\n  }\r\n\r\n  static void applyGainThenAdd(int16_t *data, const int16_t *in, int32_t mult)\r\n  {\r\n    uint32_t *dst = (uint32_t *)data;\r\n    const uint32_t *src = (uint32_t *)in;\r\n    const uint32_t *end = (uint32_t *)(data + AUDIO_BLOCK_SAMPLES);\r\n\r\n    if (mult == MULTI_UNITYGAIN) {\r\n      do {\r\n        uint32_t tmp32 = *dst;\r\n        *dst++ =  signed_add_16_and_16(tmp32, *src++);\r\n        tmp32 = *dst;\r\n        *dst++ =  signed_add_16_and_16(tmp32, *src++);\r\n      } while (dst < end);\r\n    } else {\r\n      do {\r\n        uint32_t tmp32 = *src++; // read 2 samples from *data\r\n        int32_t val1 =  signed_multiply_32x16b(mult, tmp32);\r\n        int32_t val2 =  signed_multiply_32x16t(mult, tmp32);\r\n        val1 =  signed_saturate_rshift(val1, 16, 0);\r\n        val2 =  signed_saturate_rshift(val2, 16, 0);\r\n        tmp32 =  pack_16b_16b(val2, val1);\r\n        uint32_t tmp32b = *dst;\r\n        *dst++ =  signed_add_16_and_16(tmp32, tmp32b);\r\n      } while (dst < end);\r\n    }\r\n  }\r\n\r\n#elif defined(KINETISL)\r\n\r\n  static void applyGain(int16_t *data, int32_t mult)\r\n  {\r\n    const int16_t *end = data + AUDIO_BLOCK_SAMPLES;\r\n\r\n    do {\r\n      int32_t val = *data * mult;\r\n      *data++ = signed_saturate_rshift(val, 16, 0);\r\n    } while (data < end);\r\n  }\r\n\r\n  static void applyGainThenAdd(int16_t *dst, const int16_t *src, int32_t mult)\r\n  {\r\n    const int16_t *end = dst + AUDIO_BLOCK_SAMPLES;\r\n\r\n    if (mult == MULTI_UNITYGAIN) {\r\n      do {\r\n        int32_t val = *dst + *src++;\r\n        *dst++ = signed_saturate_rshift(val, 16, 0);\r\n      } while (dst < end);\r\n    } else {\r\n      do {\r\n        int32_t val = *dst + ((*src++ * mult) >> 8); // overflow possible??\r\n        *dst++ = signed_saturate_rshift(val, 16, 0);\r\n      } while (dst < end);\r\n    }\r\n  }\r\n#endif\r\n\r\ntemplate <int NN> void AudioMixer<NN>::gain(unsigned int channel, float gain) {\r\n  if (channel >= NN) return;\r\n  if (gain > MAX_GAIN) gain = MAX_GAIN;\r\n  else if (gain < MIN_GAIN) gain = MIN_GAIN;\r\n  multiplier[channel] = gain * MULTI_UNITYGAIN_F; // TODO: proper roundoff?\r\n}\r\n\r\ntemplate <int NN> void AudioMixer<NN>::gain(float gain) {\r\n  for (int i = 0; i < NN; i++) {\r\n    if (gain > MAX_GAIN) gain = MAX_GAIN;\r\n    else if (gain < MIN_GAIN) gain = MIN_GAIN;\r\n    multiplier[i] = gain * MULTI_UNITYGAIN_F; // TODO: proper roundoff?\r\n  } \r\n}\r\n\r\ntemplate <int NN> void AudioMixer<NN>::update() {\r\n  audio_block_t *in, *out=NULL;\r\n  unsigned int channel;\r\n  for (channel=0; channel < NN; channel++) {\r\n    if (!out) {\r\n      out = receiveWritable(channel);\r\n      if (out) {\r\n        int32_t mult = multiplier[channel];\r\n        if (mult != MULTI_UNITYGAIN) applyGain(out->data, mult);\r\n      }\r\n    } else {\r\n      in = receiveReadOnly(channel);\r\n      if (in) {\r\n        applyGainThenAdd(out->data, in->data, multiplier[channel]);\r\n        release(in);\r\n      }\r\n    }\r\n  }\r\n  if (out) {\r\n    transmit(out);\r\n    release(out);\r\n  }\r\n}\r\n// this class and function forces include \r\n// of functions applyGainThenAdd and applyGain used by the template\r\nclass DummyClass\r\n{\r\n  public:\r\n    virtual void dummyFunction();\r\n};\r\nvoid DummyClass::dummyFunction() {\r\n  applyGainThenAdd(0, 0, 0);\r\n  applyGain(0,0);\r\n    \r\n}\r\n\r\n#endif" } } },
            
            //"AudioCrossPointSwitch":{defaults:{name:{type:"c_cpp_name"},id:{},inputs:{value:"1",maxval:255,minval:1,type:"int"},outputs:{value:"1",maxval:255,minval:1,type:"int"},comment:{}},shortName:"crossSwitch",inputs:1,outputs:1,category:"mixer",color:"#E6E0F8",icon:"arrow-in.png"},
            
        }
    },
    manickenSpecialNodes: {
        description: "The node types embedded into this tool++ by manicken",
        ...ManickenNodesBase,
        categoryRoot:"special",
        types: {
            /*
            predef_subcatsub_test1: {...AudioTypeBase, shortName: "test1", category: "test-sub1-subA"},
            predef_subcatsub_test2: {...AudioTypeBase, shortName: "test2", category: "test-sub1-subB"},
            predef_subcat_testA: {...AudioTypeBase, shortName: "testA", category: "test-sub2"},
            predef_subcat_testB: {...AudioTypeBase, shortName: "testB", category: "test-sub2"},
            predef_subcat_testC: {...AudioTypeBase, shortName: "testB", category: "test-sub2-subC"}, // this category tree is automatically created
            special_subcat_test: { ...AudioTypeBase, shortName: "special_subcat_test", outputs: 2, category: "special-SubCat" }, // this category tree is automatically created
            auto_subcat_test1: { ...AudioTypeBase, shortName: "auto_subcat_test2", outputs: 2, category: "newSubCat" },
            auto_subcat_test2: { ...AudioTypeBase, shortName: "auto_subcat_test3", outputs: 2, category: "" }, // this don't define the category and this item will be placed into the unsorted category
            */
            TabOutput: { ...NonAudioObjectBase, defaults: { ...NonAudioObjectBase.defaults, color:{type:"color",editor:{type:"color"}},...followingNotImplementedYet, inputs: { ...TabIO_PortCount_Default }, ...TabIoCommon_Defaults }, editor: "autogen", shortName: "Out", inputs: 1, outputs: 0, color: "#cce6ff", icon: "arrow-in.png" },
            TabInput: { ...NonAudioObjectBase, defaults: { ...NonAudioObjectBase.defaults, color:{type:"color",editor:{type:"color"}},...followingNotImplementedYet, outputs: { ...TabIO_PortCount_Default }, ...TabIoCommon_Defaults }, editor: "autogen", shortName: "In", inputs: 0, outputs: 1, color: "#cce6ff", icon: "arrow-in.png", align: "right" },

            BusJoin: { ...NonAudioObjectBase, defaults: { ...NonAudioObjectBase.defaults, inputs: { value: 1, maxval: 255, minval: 2, type: "int" } }, editor: "autogen", shortName: "BusJoin", inputs: 1, outputs: 1, color: "#cce6ff", icon: "arrow-in.png", help: "not implemented yet" },
            BusSplit: { ...NonAudioObjectBase, defaults: { ...NonAudioObjectBase.defaults, outputs: { value: 1, maxval: 255, minval: 2, type: "int" } }, editor: "autogen", shortName: "BusSplit", inputs: 1, outputs: 1, color: "#cce6ff", icon: "arrow-in.png", align: "right" },
            
            AudioStreamObject: {
                shortName: "userStreamObject", dynInputs: {}, inputs: 0, outputs: 0, color: "#ddffbb", icon: "debug.png",
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
            PointerArray: { ...NonAudioObjectBase, defaults: { ...NonAudioObjectBase.defaults, objectType: {}, arrayItems: {} }, shortName: "pArray", dontShowInPalette: "", color: "#aaffdd", icon: "range.png" },

            ClassComment: { ...NonAudioObjectBase, shortName: "ClassComment", color: "#ccffcc", icon: "comment.png" },
            Comment: { ...CodeObjectBase, shortName: "Comment", icon: "comment.png" },
            Function: { ...CodeObjectBase, shortName: "code", useAceEditor: "c_cpp", icon: "function.png" },
            Variables: { ...CodeObjectBase, shortName: "vars", useAceEditor: "c_cpp", icon: "hash.png" },
            
            CodeFile: { ...CodeObjectBase, shortName: "codeFile", useAceEditor: "c_cpp", icon: "function.png" },
            DontRemoveCodeFiles: { ...CodeObjectBase, shortName: "dontRemoveFiles", useAceEditor: "c_cpp", icon: "function.png" },
            IncludeDef: { ...CodeObjectBase, shortName: "includeDef", icon: "file.png" },
            ConstructorCode: { ...CodeObjectBase, shortName: "constructor code", useAceEditor: "c_cpp", icon: "function.png" },
            DestructorCode: { ...CodeObjectBase, shortName: "destructor code", useAceEditor: "c_cpp", icon: "function.png" },
            EndOfFileCode: { ...CodeObjectBase, shortName: "eof code", useAceEditor: "c_cpp", icon: "function.png" },

            ConstValue: { ...NonAudioObjectBase, defaults: { ...NonAudioObjectBase.defaults, name: { type: "c_cpp_name_no_array" }, value: { value: "0" }, valueType: { value: "int" } }, shortName: "constValue", color: "#eb9834", icon: "hash.png" },
            JunctionLR: { ...NonAudioObjectBase, shortName: "JunctionLR", inputs: 1, outputs: 1, color: "#4D54FF", textColor: "#FFFFFF", icon: "arrow-in.png" },
            JunctionRL: { ...NonAudioObjectBase, shortName: "JunctionRL", inputs: 1, outputs: 1, color: "#4D54FF", textColor: "#FFFFFF", icon: "arrow-out.png" },

            
        }
    },
    manickenUiNodes: {
        description: "The UI node types embedded into this tool++ by manicken",
        ...ManickenNodesBase,
        types: {
            UI_Button: { ...UiTypeBase, shortName: "Button",
                useAceEditor: "javascript", useAceEditorCodeFieldName: "sendCommand", aceEditorOffsetHeight: 0,
                defaults: {
                    ...UiTypeBase.defaults,
                    //midiCh: { value: "0" }, midiId: { value: "0" },
                    //pressAction: {}, repeatPressAction: { value: false },
                    //releaseAction: {}, repeatReleaseAction: { value: false },
                    //local: { value: false },
                    sendMode: {},
                    sendCommand: {}
                }
            },

            UI_Slider: { ...UiTypeBase, shortName: "Slider", color: "#808080",
                useAceEditor: "javascript", useAceEditorCodeFieldName: "sendCommand", aceEditorOffsetHeight: 200,
                defaults: {
                    ...UiTypeBase.defaults,
                    //midiCh: { value: "0" }, midiId: { value: "0" },
                    orientation: { value: "v" }, label: { value: "d.val" },
                    minVal: { value: 0, type: "int" }, maxVal: { value: 100, type: "int" }, val: { value: 50, type: "int" }, divVal: { value: 1, minval: 1, type: "int" },
                    //fval: { value: 0 },
                    //sendMode: { value: "r" },
                    //autoReturn: { value: false }, returnValue: { value: "mid" },
                    barFGcolor: { value: "#F6F8BC" },
                    //sendFormat: {},
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
                    //midiCh: { value: "0" }, midiId: { value: "0" },
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
                    //midiCh: { value: "0", minval: "0", maxval: "15", type: "int" },
                    //midiId: { value: "0", minval: "0", maxval: "127", type: "int" },
                    octave: { value: 4, minval: "0", maxval: "10", type: "int" },
                    sendCommand: {},
                    headerHeight: { value: 30, minval: 0, type: "int" },
                    whiteKeysColor: { value: "#FFFFFF" }, blackKeysColor: { value: "#A0A0A0" },
                    pressedKeyColor: { value: "#ff7f0e" },
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
            group: { ...UiTypeBase, shortName: "group", color: "#ddffbb", inputs:20, outputs:20,
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
        description: "FAUST objects",
        credits: "manicken",
        homepage: "",
        url: "",
        types: {
        }
    },*/
    h4yn0nnym0u5e: {
        description: "",
        credits: "Jonathan Oakley",
        homepage: "https://github.com/h4yn0nnym0u5e",
        url: "https://github.com/h4yn0nnym0u5e/Audio/tree/features/dynamic-updates",
        categoryLabel: "h4yn0nnym0u5e",
        categoryItems: { ...NodeBaseCategories },
        types: {
            AudioMixerStereo: { ...AudioTypeArrayBase, category: "mixer",
                shortName: "mixerStereo", dynInputs: {}, inputs: 1, outputs: 2,
                editorhelp: dynInputMixers_Help,
                defaults: {
                    ...AudioTypeArrayBase.defaults,
                    inputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Visual Inputs", rowClass: "form-row-mid", readonly: dynInputMixers_Inputs_ReadOnly, help: dynInputMixers_Inputs_Help } },
                    ExtraInputs: { value: 0, maxval: 255, minval: 0, type: "int", editor: { label: "Extra Inputs", rowClass: "form-row-mid", help: dynInputMixers_ExtraInputs_Help } },
                    RealInputs: { value: 1, maxval: 255, minval: 1, type: "int", editor: { label: "Real Inputs", rowClass: "form-row-mid", readonly: true, help: dynInputMixers_RealInputs_Help } }
                }
            },
            AudioControlPCM3168: { ...AudioTypeBase, category: "control", shortName: "pcm3168" },
        }
    },
    FrankB: {
        description: "wav player/recorder",
        credits: "Frank Boesing",
        homepage: "https://github.com/FrankBoesing",
        url: "https://github.com/FrankBoesing/Teensy-WavePlayer",
        categoryLabel: "Frank B",
        categoryItems: { ...NodeBaseCategories },
        types: {
            AudioPlayWav:   { ...AudioTypeArrayBase, category: "play", shortName: "playWav", outputs: 8},
            AudioRecordWav: { ...AudioTypeArrayBase, category: "record", shortName: "RecordWav", inputs: 4},
        }
    },
    MattKuebrich: {
        description: "",
        credits: "Matt Kuebrich",
        homepage: "https://github.com/MattKuebrich",
        url: "https://raw.githubusercontent.com/MattKuebrich/teensy-audio-objects/main", // this is the %root% used for each type
        categoryLabel: "mattkuebrich",
        categoryItems: { ...NodeBaseCategories },
        types: {
            AudioSynthBytebeat:    { ...AudioTypeArrayBase, category:"synth", shortName:"bytebeat", url:"%root%/bytebeat/bytebeat_simple", outputs:1, outDesc:{0:"Bytebeat Output"} },
            AudioSynthChaosMaps:   { ...AudioTypeArrayBase, category:"synth", shortName:"chaos_maps", url:"%root%/chaosmaps", outputs:1, inputs:2 },
            AudioSynthChaosNoise:  { ...AudioTypeArrayBase, category:"synth", shortName:"chaos_noise", url:"%root%/chaosnoise", outputs:1 },
            AudioSynthDust:        { ...AudioTypeArrayBase, category:"synth", shortName:"dust", url:"%root&/dust", outputs:1, inputs:1, outDesc:{0:"Dust Output"}, inDesc:{0:"Density Modulation"} },
            AudioSynthFMDrum:      { ...AudioTypeArrayBase, category:"synth", shortName:"fm_drum", url:"%root&/fmdrum", outputs:1, inputs:1, outDesc:{0:"FM Drum Output"}, inDesc:{0:"Trigger Input"} },
            AudioSynthStkInstrmnt: { ...AudioTypeArrayBase, category:"synth", shortName:"stkinstrmnt", url:"%root&/stkinstrmnteffect", outputs:1, inputs:1, outDesc:{0:"Output"}, inDesc:{0:"Trigger Input"} },
            
            AudioEffectBernoulliGate:  { ...AudioTypeArrayBase, category:"effect", shortName: "bernoulligate", url:"%root%/bernoulligate", outputs:2, inputs:1, outDesc:{0:"Bernoulli Gate Ouput A",1:"Bernoulli Gate Ouput B"}, inpDesc:{0:"Signal Input"} },
            AudioEffectComparator:     { ...AudioTypeArrayBase, category:"effect", shortName:"comparator", url:"%root%/comparator", outputs:1, inputs:2, outDesc:{0:"Compared Output"}, inpDesc:{0:"Signal Input A",1:"Signal Input B"} },
            AudioEffectFunctionShaper: { ...AudioTypeArrayBase, category:"effect", shortName:"function_shaper", url:"%root&/functionshaper", outputs:1, inputs:1, outDesc:{0:"Shaped Output"}, inDesc:{0:"Signal Input"} },
            AudioEffectGateToTrigger:  { ...AudioTypeArrayBase, category:"effect", shortName:"gate_to_trigger", url:"%root&/gatetotrigger", outputs:1, inputs:1, outDesc:{0:"Trigger Output"}, inDesc:{0:"Gate Input"} },
            AudioEffectQuantizer:      { ...AudioTypeArrayBase, category:"effect", shortName:"quantizer", url:"%root&/quantizer", outputs:1, inputs:1, outDesc:{0:"Quantized Output"}, inDesc:{0:"Signal Input"} },
            AudioEffectSampleAndHold:  { ...AudioTypeArrayBase, category:"effect", shortName:"samplehold", url:"%root&/samplehold", outputs:1, inputs:2, outDesc:{0:"Sample and Hold Output"}, inDesc:{0:"Signal Input",1:"Trigger Input"} },
            AudioEffectShiftRegister:  { ...AudioTypeArrayBase, category:"effect", shortName:"shiftregister", url:"%root&/shiftregister", outputs:9, inputs:2, outDesc:{0:"Bit 0 Output",1:"Bit 1 Output",2:"Bit 2 Output",3:"Bit 3 Output",4:"Bit 4 Output",5:"Bit 5 Output",6:"Bit 6 Output",7:"Bit 7 Output",8:"3-bit DAC (Rungler) Output"}, inDesc:{0:"Data Input",1:"Clock Input"} },
            AudioEffectSlewLimiter:    { ...AudioTypeArrayBase, category:"effect", shortName:"slewlimiter", url:"%root&/slewlimiter", outputs:1, inputs:1, outDesc:{0:"Slewed Output"}, inDesc:{0:"Signal Input"} },
            AudioEffectStkEffect:      { ...AudioTypeArrayBase, category:"effect", shortName:"stkeffect", url:"%root%/stkinstrmnteffect", outputs:2, inputs:2, outDesc:{0:"Left/Mono Input",1:"Right Input"}, inDesc:{0:"Left Output",1:"Right Output"}},
            
            AudioFilterDCBlock:    { ...AudioTypeArrayBase, category:"filter", shortName:"dcblock", url:"%root%/dcblock", outputs:1, inputs:1, outDesc:{0:"Filtered Output"}, inDesc:{0:"Signal Input"} },
            AudioFilterLadderLite: { ...AudioTypeArrayBase, category:"filter", shortName:"ladderlite", url:"%root&/ladderlite", outputs:1, inputs:1, outDesc:{0:"Out signal"}, inDesc:{0:"In signal"} },
            
            AudioAnalyzeReadout: { ...AudioTypeArrayBase, category:"analyze", shortName:"readout", url:"%root&/readout", inputs:1, inDesc:{0:"Signal to readout"} },
            
        }
    },
    MarkzP: {
        description: "",
        credits: "Marc Paquette",
        homepage: "https://github.com/MarkzP",
        url: "https://github.com/MarkzP",
        categoryLabel: "MarkzP",
        categoryItems: { ...NodeBaseCategories },
        types: {
            AudioEffectDynamics:     { ...AudioTypeArrayBase, category:"effect", shortName:"dynamics", url:"%root%/AudioEffectDynamics", outputs:1, inputs:1},
            AudioEffectDynamics_F32: { ...AudioTypeArrayBase, category:"effect", shortName:"dynamics_f32", url:"%root%/AudioEffectDynamics_F32", outputs:1, inputs:1},
        }
    },
    Newdigate: {
        description: "",
        credits: "Nic Newdigate",
        homepage: "https://github.com/newdigate",
        url: "https://github.com/newdigate",
        categoryLabel: "newdigate",
        categoryItems: { legacy: {...NodeBaseCategories} },
        types: {
            AudioInputSharedAD7606:      { ...AudioTypeBase, category:"legacy-input", shortName:"ad7606", url:"%root%/teensy-audio-ad5754-ad7606", outputs:8},
            AudioOutputSharedAD5754Dual: { ...AudioTypeBase, category:"legacy-output", shortName:"ad5754", url:"%root%/teensy-audio-ad5754-ad7606", inputs:8},
            AudioInputAD7606:            { ...AudioTypeBase, category:"legacy-input", shortName:"ad7606", url:"%root%/teensy-audio-ad7606", outputs:8},
            AudioOutputAD5754Dual:       { ...AudioTypeBase, category:"legacy-output", shortName:"ad5754", url:"%root%/teensy-audio-ad5754", inputs:8},
            AudioPlaySdRawResmp:         { ...AudioTypeArrayBase, category:"legacy-play", shortName:"rraw_sd", url:"%root%/", outputs:2},
            AudioPlaySdWavResmp:         { ...AudioTypeArrayBase, category:"legacy-play", shortName:"rwav_sd", url:"%root%/", outputs:2},
            //AudioInputOutputSPI:       { ...AudioTypeArrayBase, shortName:"ad7606_ad5754", category:"", url:"%root%/teensy-audio-ad5754-ad7606", outputs:8, inputs:8},
            AudioPlayArrayResmp:         { ...AudioTypeArrayBase, category:"", shortName:"playArrayPitch", url:"%root%/", outputs:2},
            AudioPlaySdResmp:            { ...AudioTypeArrayBase, category:"", shortName:"playSdPitch", url:"%root%/", outputs:2},
            AudioEffectCompressor:       { ...AudioTypeArrayBase, category:"", shortName:"compressor", url:"%root%/teensy-audio-multipressor", outputs:1, inputs:1},
            AudioEffectDynamics2:        { ...AudioTypeArrayBase, category:"", shortName:"dynamics", url:"%root%/AudioEffectDynamics", outputs:1, inputs:1},
            AudioInputSoundIO:           { ...AudioTypeBase, category:"", shortName:"sio_in", url:"%root%/", outputs:2},
            AudioOutputSoundIO:          { ...AudioTypeBase, category:"", shortName:"sio_out", url:"%root%/", inputs:2},
        }
    },
    chipaudette: {
        description: "OpenAudio_F32_ArduinoLibrary that uses float (32bit)",
        credits: "Chip Audette",
        homepage: "https://github.com/chipaudette",
        url: "https://api.github.com/repos/chipaudette/OpenAudio_ArduinoLibrary/contents/",
        categoryLabel: "chipaudette",
        categoryItems: { ...NodeBaseCategories, convert:{} ,radio:{}, config:{} },
        types: {
            // Input category
            AudioInputUSB_F32:         { ...AudioTypeBase, category: "input-other", shortName: "usbAudioIn_f32", sourceFile: "USB_Audio_F32.h", outputTypes: {"x2": "f32"}},
            AsyncAudioInputSPDIF3_F32: { ...AudioTypeBase, category: "input-spdif", shortName: "spdif3_async_f32", sourceFile: "async_input_spdif3_F32.h", outputTypes: {"x2": "f32"}},
            AudioInputI2S_F32:         { ...AudioTypeBase, category: "input-i2s1", shortName: "i2s_f32", sourceFile: "input_i2s_f32.h", outputTypes: {"x2": "f32"}},
            AudioInputI2Sslave_F32:    { ...AudioTypeBase, category: "input-i2s1", shortName: "i2s_slave_f32", sourceFile: "input_i2s_f32.h", outputTypes: {"x2": "f32"}},
            AudioInputSPDIF3_F32:      { ...AudioTypeBase, category: "input-spdif", shortName: "spdif3_f32", sourceFile: "input_spdif3_f32.h", outputTypes: {"x2": "f32"}},

            // Output category
            AudioOutputUSB_F32:      { ...AudioTypeBase, category: "output-other", shortName: "usbAudioOut_f32", sourceFile: "USB_Audio_F32.h", inputTypes: {"x2": "f32"}},
            AudioOutputI2S_F32:      { ...AudioTypeBase, category: "output-i2s1", shortName: "i2s_f32", sourceFile: "output_i2s_f32.h", inputTypes: {"x2": "f32"}},
            AudioOutputI2Sslave_F32: { ...AudioTypeBase, category: "output-i2s1", shortName: "i2s_slave_f32", sourceFile: "output_i2s_f32.h", inputTypes: {"x2": "f32"}},
            AudioOutputSPDIF3_F32:   { ...AudioTypeBase, category: "output-spdif", shortName: "spdif3_f32", sourceFile: "output_spdif3_f32.h", inputTypes: {"x2": "f32"}},
            
            // Mixer category
            AudioMixer4_F32:     { ...AudioTypeArrayBase, category: "mixer", shortName: "mixer4_f32", sourceFile: "AudioMixer_F32.h", inputTypes: {"x4": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMixer8_F32:     { ...AudioTypeArrayBase, category: "mixer", shortName: "mixer8_f32", sourceFile: "AudioMixer_F32.h", inputTypes: {"x8": "f32"}, outputTypes: {"x1": "f32"}},
            AudioSwitch4_OA_F32: { ...AudioTypeArrayBase, category: "mixer", shortName: "switch4_f32", sourceFile: "AudioSwitch_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x4": "f32"}},
            AudioSwitch8_OA_F32: { ...AudioTypeArrayBase, category: "mixer", shortName: "switch8_f32", sourceFile: "AudioSwitch_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x8": "f32"}},
            
            // Play category
            AudioSDPlayer_F32:  { ...AudioTypeArrayBase, category: "play", shortName: "SDPlayer_f32", sourceFile: "AudioSDPlayer_F32.h", outputTypes: {"x2": "f32"}},
            AudioPlayQueue_F32: { ...AudioTypeArrayBase, category: "play", shortName: "play_queue_f32", sourceFile: "play_queue_f32.h", outputTypes: {"x1": "f32"}},

            // Record category
            AudioRecordQueue_F32: { ...AudioTypeArrayBase, category: "record", shortName: "rec_queue_f32", sourceFile: "record_queue_f32.h", inputTypes: {"x1": "f32"}},

            // Synth category
            AudioTestSignalGenerator_F32:        { ...AudioTypeArrayBase, category: "synth", shortName: "testSignGen_f32", sourceFile: "AudioControlTester.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioTestSignalMeasurement_F32:      { ...AudioTypeArrayBase, category: "synth", shortName: "testSigMeas_f32", sourceFile: "AudioControlTester.h", inputTypes: {"x2": "f32"}},
            AudioTestSignalMeasurementMulti_F32: { ...AudioTypeArrayBase, category: "synth", shortName: "testSigMeas_f32", sourceFile: "AudioControlTester.h", inputTypes: {"x10": "f32"}},
            AudioMathConstant_F32:               { ...AudioTypeArrayBase, category: "synth", shortName: "MathConstant_f32", sourceFile: "AudioMathConstant_F32.h", outputTypes: {"x1": "f32"}},
            AudioSynthGaussian_F32:              { ...AudioTypeArrayBase, category: "synth", shortName: "gaussianwhitenoise_f32", sourceFile: "synth_GaussianWhiteNoise_F32.h", outputTypes: {"x1": "f32"}},
            AudioSynthNoisePink_F32:             { ...AudioTypeArrayBase, category: "synth", shortName: "pinknoise_f32", sourceFile: "synth_pinknoise_f32.h", outputTypes: {"x1": "f32"}},
            AudioSynthSineCosine_F32:            { ...AudioTypeArrayBase, category: "synth", shortName: "SineCosine_f32", sourceFile: "synth_sin_cos_f32.h", outputTypes: {"x2": "f32"}},
            AudioSynthWaveformSine_F32:          { ...AudioTypeArrayBase, category: "synth", shortName: "sine_f32", sourceFile: "synth_sine_f32.h", outputTypes: {"x1": "f32"}},
            AudioSynthWaveform_F32:              { ...AudioTypeArrayBase, category: "synth", shortName: "waveform_f32", sourceFile: "synth_waveform_F32.h", outputTypes: {"x1": "f32"}},
            AudioSynthNoiseWhite_F32:            { ...AudioTypeArrayBase, category: "synth", shortName: "whitenoise_f32", sourceFile: "synth_whitenoise_f32.h", outputTypes: {"x1": "f32"}},

            // Effect category
            /*AudioEffectEmpty_F32:        { ...AudioTypeArrayBase, category: "effect", shortName: "empty", sourceFile: "AudioEffectEmpty_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},*/
            AudioEffectCompWDRC_F32:       { ...AudioTypeArrayBase, category: "effect", shortName: "compressWDRC_f32", sourceFile: "AudioEffectCompWDRC_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectCompressor2_F32:    { ...AudioTypeArrayBase, category: "effect", shortName: "compressor2_f32", sourceFile: "AudioEffectCompressor2_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectCompressor_F32:     { ...AudioTypeArrayBase, category: "effect", shortName: "compressor_f32", sourceFile: "AudioEffectCompressor_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectDelay_OA_F32:       { ...AudioTypeArrayBase, category: "effect", shortName: "delay_f32", sourceFile: "AudioEffectDelay_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectFreqShiftFD_OA_F32: { ...AudioTypeArrayBase, category: "effect", shortName: "freq_shift_f32", sourceFile: "AudioEffectFreqShiftFD_OA_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectGain_F32:           { ...AudioTypeArrayBase, category: "effect", shortName: "EffectGain_f32", sourceFile: "AudioEffectGain_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectNoiseGate_F32:      { ...AudioTypeArrayBase, category: "effect", shortName: "NoiseGate_f32", sourceFile: "AudioEffectNoiseGate_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioEffectWDRC2_F32:          { ...AudioTypeArrayBase, category: "effect", shortName: "CompressWDRC2_f32", sourceFile: "AudioEffectWDRC2_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathAdd_F32:              { ...AudioTypeArrayBase, category: "effect", shortName: "MathAdd_f32", sourceFile: "AudioMathAdd_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathMultiply_F32:         { ...AudioTypeArrayBase, category: "effect", shortName: "MathMultiply_f32", sourceFile: "AudioMathMultiply_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathOffset_F32:           { ...AudioTypeArrayBase, category: "effect", shortName: "MathOffset_f32", sourceFile: "AudioMathOffset_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMathScale_F32:            { ...AudioTypeArrayBase, category: "effect", shortName: "MathScale_f32", sourceFile: "AudioMathScale_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioMultiply_F32:             { ...AudioTypeArrayBase, category: "effect", shortName: "multiply_f32", sourceFile: "AudioMultiply_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            
            // Filter category
            AudioFilter90Deg_F32:      { ...AudioTypeArrayBase, category: "filter", shortName: "_90DegPhase_f32", sourceFile: "AudioFilter90Deg_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            AudioFilterBiquad_F32:     { ...AudioTypeArrayBase, category: "filter", shortName: "IIR_f32", sourceFile: "AudioFilterBiquad_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterEqualizer_F32:  { ...AudioTypeArrayBase, category: "filter", shortName: "equalizer_f32", sourceFile: "AudioFilterEqualizer_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterFIRGeneral_F32: { ...AudioTypeArrayBase, category: "filter", shortName: "firGeneral_f32", sourceFile: "AudioFilterFIRGeneral_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterFIR_F32:        { ...AudioTypeArrayBase, category: "filter", shortName: "fir_f32", sourceFile: "AudioFilterFIR_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioFilterIIR_F32:        { ...AudioTypeArrayBase, category: "filter", shortName: "iir_f32", sourceFile: "AudioFilterIIR_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioLMSDenoiseNotch_F32:  { ...AudioTypeArrayBase, category: "filter", shortName: "LMSDenoiseNotch_f32", sourceFile: "AudioLMSDenoiseNotch_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioSpectralDenoise_F32:  { ...AudioTypeArrayBase, category: "filter", shortName: "spectral_f32", sourceFile: "AudioSpectralDenoise_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},

            // Analyze category
            AudioAlignLR_F32:             { ...AudioTypeArrayBase, category: "analyze", shortName: "alignLR_f32", sourceFile: "AudioAlignLR_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x3": "f32"}},
            AudioAnalyzePhase_F32:        { ...AudioTypeArrayBase, category: "analyze", shortName: "analyzePhase_f32", sourceFile: "AudioAnalyzePhase_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x1": "f32"}},
            AudioCalcEnvelope_F32:        { ...AudioTypeArrayBase, category: "analyze", shortName: "calc_envelope_f32", sourceFile: "AudioCalcEnvelope_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioCalcGainWDRC_F32:        { ...AudioTypeArrayBase, category: "analyze", shortName: "calc_WDRCGain_f32", sourceFile: "AudioCalcGainWDRC_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            UART_F32:                     { ...AudioTypeArrayBase, category: "analyze", shortName: "uart_f32", sourceFile: "UART_F32.h", inputTypes: {"x1": "f32"}},
            analyze_CTCSS_F32:            { ...AudioTypeArrayBase, category: "analyze", shortName: "DetCTCSS_f32", sourceFile: "analyze_CTCSS_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            AudioAnalyzeFFT1024_F32:      { ...AudioTypeArrayBase, category: "analyze", shortName: "FFT1024_f32", sourceFile: "analyze_fft1024_F32.h", inputTypes: {"x1": "f32"}},
            AudioAnalyzeFFT1024_IQ_F32:   { ...AudioTypeArrayBase, category: "analyze", shortName: "FFT1024IQ_f32", sourceFile: "analyze_fft1024_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT2048_IQ_F32:   { ...AudioTypeArrayBase, category: "analyze", shortName: "FFT2048IQ_f32", sourceFile: "analyze_fft2048_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT256_IQ_F32:    { ...AudioTypeArrayBase, category: "analyze", shortName: "FFT256IQ_f32", sourceFile: "analyze_fft256_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT4096_IQ_F32:   { ...AudioTypeArrayBase, category: "analyze", shortName: "FFT4096IQ_f32", sourceFile: "analyze_fft4096_iq_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            AudioAnalyzeFFT4096_IQEM_F32: { ...AudioTypeArrayBase, category: "analyze", shortName: "FFT4096IQem_f32", sourceFile: "analyze_fft4096_iqem_F32.h", inputTypes: {"x2": "f32"}},
            AudioAnalyzePeak_F32:         { ...AudioTypeArrayBase, category: "analyze", shortName: "Peak_f32", sourceFile: "analyze_peak_f32.h", inputTypes: {"x1": "f32"}},
            AudioAnalyzeRMS_F32:          { ...AudioTypeArrayBase, category: "analyze", shortName: "RMS_f32", sourceFile: "analyze_rms_f32.h", inputTypes: {"x1": "f32"}},
            AudioAnalyzeToneDetect_F32:   { ...AudioTypeArrayBase, category: "analyze", shortName: "ToneDet_f32", sourceFile: "analyze_tonedetect_F32.h", inputTypes: {"x1": "f32"}},

            // Control category
            AudioControlSGTL5000_Extended:         { ...AudioTypeBase, category: "control", shortName: "SGTL5000_Extended", sourceFile: "AudioControlSGTL5000_Extended.h"},
            AudioControlSignalTesterInterface_F32: { ...AudioTypeBase, category: "control", shortName: "signalTesterInterface_f32", sourceFile: "AudioControlTester.h"},
            AudioControlSignalTester_F32:          { ...AudioTypeBase, category: "control", shortName: "sigTest_Abstract_f32", sourceFile: "AudioControlTester.h"},
            AudioControlTestAmpSweep_F32:          { ...AudioTypeBase, category: "control", shortName: "ampSweepTester_f32", sourceFile: "AudioControlTester.h"},
            AudioControlTestFreqSweep_F32:         { ...AudioTypeBase, category: "control", shortName: "freqSweepTester_f32", sourceFile: "AudioControlTester.h"},

            // Convert category
            AudioConvert_I16toF32: { ...AudioTypeArrayBase, category: "convert", shortName: "I16toF32", sourceFile: "AudioConvert_F32.h", inputTypes: {"0": "i16"}, outputTypes: {"x1": "f32"}},
            AudioConvert_F32toI16: { ...AudioTypeArrayBase, category: "convert", shortName: "F32toI16", sourceFile: "AudioConvert_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"0": "i16"}},
            
            // Radio category
            RadioFMDetector_F32:         { ...AudioTypeArrayBase, category: "radio", shortName: "FMDetector_f32", sourceFile: "RadioFMDetector_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            RadioFMDiscriminator_F32:    { ...AudioTypeArrayBase, category: "radio", shortName: "FMDiscriminator_f32", sourceFile: "RadioFMDiscriminator_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            RadioIQMixer_F32:            { ...AudioTypeArrayBase, category: "radio", shortName: "IQMixer_f32", sourceFile: "RadioIQMixer_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            RadioBFSKModulator_F32:      { ...AudioTypeArrayBase, category: "radio", shortName: "BFSKmodulator_f32", sourceFile: "radioBFSKmodulator_F32.h", outputTypes: {"x1": "f32"}},
            radioCESSB_Z_transmit_F32:   { ...AudioTypeArrayBase, category: "radio", shortName: "CESSBTransmit_f32", sourceFile: "radioCESSB_Z_transmit_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            radioCESSBtransmit_F32:      { ...AudioTypeArrayBase, category: "radio", shortName: "CESSBTransmit_f32", sourceFile: "radioCESSBtransmit_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            radioCWModulator_F32:        { ...AudioTypeArrayBase, category: "radio", shortName: "detCTCSS_f32", sourceFile: "radioCWModulator_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x1": "f32"}},
            RadioFT8Demodulator_F32:     { ...AudioTypeArrayBase, category: "radio", shortName: "FFT2048IQ_f32", sourceFile: "radioFT8Demodulator_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x4": "f32"}},
            RadioFT8Modulator_F32:       { ...AudioTypeArrayBase, category: "radio", shortName: "FT8modulator_f32", sourceFile: "radioFT8Modulator_F32.h", outputTypes: {"x1": "f32"}},
            radioModulatedGenerator_F32: { ...AudioTypeArrayBase, category: "radio", shortName: "modulator_f32", sourceFile: "radioModulatedGenerator_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            radioNoiseBlanker_F32:       { ...AudioTypeArrayBase, category: "radio", shortName: "noiseBlanker_f32", sourceFile: "radioNoiseBlanker_F32.h", inputTypes: {"x2": "f32"}, outputTypes: {"x2": "f32"}},
            radioVoiceClipper_F32:       { ...AudioTypeArrayBase, category: "radio", shortName: "CESSBTransmit_f32", sourceFile: "radioVoiceClipper_F32.h", inputTypes: {"x1": "f32"}, outputTypes: {"x2": "f32"}},
            
            // Config category
            AudioConfigFIRFilterBank_F32: { ...AudioTypeBase, category: "config", shortName: "config_FIRbank_f32", sourceFile: "AudioConfigFIRFilterBank_F32.h"},
        }
    },
    dangelo729: {
        description: "",
        credits: "Peter D'Angelo",
        homepage: "https://github.com/dangelo729",
        url: "https://github.com/dangelo729",
        categoryLabel: "dangelo729",
        categoryItems: { ...NodeBaseCategories },
        types: {
            AudioPlayScrub: { ...AudioTypeArrayBase, shortName:"scrub", category:"play", url:"%root%/teensy_audio_library_scrubber", outputs:1},
        }
    },
    officialNodes: {
        description: "The official Audio node types embedded into this tool, that is used by the official Audio Library ",
        credits: "Paul Stoffregen",
        homepage: "https://www.pjrc.com/",
        url: "https://api.github.com/repos/PaulStoffregen/Audio/contents",
        types: {
            // Input category
            // i2s1
            AudioInputI2S:           { ...AudioTypeBase, category: "input-i2s1", shortName: "i2s", outputs: 2},
            AudioInputI2SQuad:       { ...AudioTypeBase, category: "input-i2s1", shortName: "i2s_quad", outputs: 4},
            AudioInputI2SHex:        { ...AudioTypeBase, category: "input-i2s1", shortName: "i2s_hex", outputs: 6},
            AudioInputI2SOct:        { ...AudioTypeBase, category: "input-i2s1", shortName: "i2s_oct", outputs: 8},
            AudioInputI2Sslave:      { ...AudioTypeBase, category: "input-i2s1", shortName: "i2sslave", outputs: 2, color: "#F7D8F0" },
            AudioInputPDM:           { ...AudioTypeBase, category: "input-i2s1", shortName: "pdm", outputs: 1},
            AudioInputTDM:           { ...AudioTypeBase, category: "input-i2s1", shortName: "tdm", outputs: 16, defaults: { ...AudioTypeBase.defaults, outputs: { value: 16, type:"int", maxval:16, minval:1, editor: { label: "Outputs (visual)"} } } },
            // i2s2
            AudioInputI2S2:          { ...AudioTypeBase, category: "input-i2s2", shortName: "i2s2", outputs: 2},
            AudioInputPDM2:          { ...AudioTypeBase, category: "input-i2s2", shortName: "pdm2", outputs: 1},
            AudioInputTDM2:          { ...AudioTypeBase, category: "input-i2s2", shortName: "tdm2", outputs: 16, defaults: { ...AudioTypeArrayBase.defaults, outputs: { value: 16, type:"int", maxval:16, minval:1, editor: { label: "Outputs (visual)"} } } },
            // spdif
            AudioInputSPDIF3:        { ...AudioTypeBase, category: "input-spdif", shortName: "spdif3", outputs: 2, color: "#F7D8F0"},
            AsyncAudioInputSPDIF3:   { ...AudioTypeBase, category: "input-spdif", shortName: "spdif_async", outputs: 2},
            // adc
            AudioInputAnalog:        { ...AudioTypeBase, category: "input-adc", shortName: "adc", outputs: 1},
            AudioInputAnalogStereo:  { ...AudioTypeBase, category: "input-adc", shortName: "adc_st", outputs: 2},
            // other
            AudioInputUSB:           { ...AudioTypeBase, category: "input-other", shortName: "usb", outputs: 2},

            // Output category
            // i2s1
            AudioOutputI2S:          { ...AudioTypeBase, category: "output-i2s1", shortName: "i2s", inputs: 2},
            AudioOutputI2SQuad:      { ...AudioTypeBase, category: "output-i2s1", shortName: "i2s_quad", inputs: 4},
            AudioOutputI2SHex:       { ...AudioTypeBase, category: "output-i2s1", shortName: "i2s_hex", inputs: 6},
            AudioOutputI2SOct:       { ...AudioTypeBase, category: "output-i2s1", shortName: "i2s_oct", inputs: 8},
            AudioOutputI2Sslave:     { ...AudioTypeBase, category: "output-i2s1", shortName: "i2sslave", inputs: 2, color: "#F7D8F0" },
            AudioOutputSPDIF:        { ...AudioTypeBase, category: "output-i2s1", shortName: "spdif", inputs: 2},
            AudioOutputPT8211:       { ...AudioTypeBase, category: "output-i2s1", shortName: "pt8211", inputs: 2},
            AudioOutputTDM:          { ...AudioTypeBase, category: "output-i2s1", shortName: "tdm", inputs: 16, defaults: { ...AudioTypeBase.defaults, inputs: { value: 16, type:"int", maxval:16, minval:1, editor: { label: "Inputs (visual)"} } } },
            // i2s2
            AudioOutputI2S2:         { ...AudioTypeBase, category: "output-i2s2", shortName: "i2s2", inputs: 2},
            AudioOutputSPDIF2:       { ...AudioTypeBase, category: "output-i2s2", shortName: "spdif2", inputs: 2},
            AudioOutputPT8211_2:     { ...AudioTypeBase, category: "output-i2s2", shortName: "pt8211_2", inputs: 2},
            AudioOutputTDM2:         { ...AudioTypeBase, category: "output-i2s2", shortName: "tdm2", inputs: 16, defaults: { ...AudioTypeBase.defaults, inputs: { value: 16, type:"int", maxval:16, minval:1, editor: { label: "Inputs (visual)"} } } },
            // spdif
            AudioOutputSPDIF3:       { ...AudioTypeBase, category: "output-spdif", shortName: "spdif3", inputs: 2 },
            // dac
            AudioOutputAnalog:       { ...AudioTypeBase, category: "output-dac", shortName: "dac", inputs: 1 },
            AudioOutputAnalogStereo: { ...AudioTypeBase, category: "output-dac", shortName: "dac_st", inputs: 2 },
            // other
            AudioOutputPWM:          { ...AudioTypeBase, category: "output-other", shortName: "pwm", inputs: 1},
            AudioOutputMQS:          { ...AudioTypeBase, category: "output-other", shortName: "mqs", inputs: 2},
            AudioOutputADAT:         { ...AudioTypeBase, category: "output-other", shortName: "adat", inputs: 8},
            AudioOutputUSB:          { ...AudioTypeBase, category: "output-other", shortName: "usb", inputs: 2},

            // Mixer category
            AudioAmplifier: { ...AudioTypeArrayBase, category: "mixer", shortName: "amp", inputs: 1, outputs: 1},
            AudioMixer4:    { ...AudioTypeArrayBase, category: "mixer", shortName: "mixer4", inputs: 4, outputs: 1},

            // Play category
            AudioPlayMemory:         { ...AudioTypeArrayBase, category: "play", shortName: "playMem", outputs: 1},
            AudioPlaySdWav:          { ...AudioTypeArrayBase, category: "play", shortName: "playSdWav", outputs: 2},
            AudioPlaySdRaw:          { ...AudioTypeArrayBase, category: "play", shortName: "playSdRaw", outputs: 1},
            AudioPlaySerialflashRaw: { ...AudioTypeArrayBase, category: "play", shortName: "playFlashRaw", outputs: 1},
            AudioPlayQueue:          { ...AudioTypeArrayBase, category: "play", shortName: "queue", outputs: 1},

            // Record category
            AudioRecordQueue: { ...AudioTypeArrayBase, category: "record", shortName: "queue", inputs: 1},

            // Synth category
            AudioSynthWavetable:             { ...AudioTypeArrayBase, category: "synth", shortName: "wavetable", outputs: 1},
            AudioSynthSimpleDrum:            { ...AudioTypeArrayBase, category: "synth", shortName: "drum", outputs: 1},
            AudioSynthKarplusStrong:         { ...AudioTypeArrayBase, category: "synth", shortName: "string", outputs: 1},
            AudioSynthWaveformSine:          { ...AudioTypeArrayBase, category: "synth", shortName: "sine", outputs: 1},
            AudioSynthWaveformSineHires:     { ...AudioTypeArrayBase, category: "synth", shortName: "sine_hires", outputs: 2},
            AudioSynthWaveformSineModulated: { ...AudioTypeArrayBase, category: "synth", shortName: "sine_fm", inputs: 1, outputs: 1},
            AudioSynthWaveform:              { ...AudioTypeArrayBase, category: "synth", shortName: "waveform", outputs: 1},
            AudioSynthWaveformModulated:     { ...AudioTypeArrayBase, category: "synth", shortName: "waveformMod", inputs: 2, outputs: 1},
            AudioSynthWaveformPWM:           { ...AudioTypeArrayBase, category: "synth", shortName: "pwm", inputs: 1, outputs: 1},
            AudioSynthToneSweep:             { ...AudioTypeArrayBase, category: "synth", shortName: "tonesweep", outputs: 1},
            AudioSynthWaveformDc:            { ...AudioTypeArrayBase, category: "synth", shortName: "dc", outputs: 1},
            AudioSynthNoiseWhite:            { ...AudioTypeArrayBase, category: "synth", shortName: "noise", outputs: 1},
            AudioSynthNoisePink:             { ...AudioTypeArrayBase, category: "synth", shortName: "pink", outputs: 1},

            // Effect category
            AudioEffectFade:           { ...AudioTypeArrayBase, category: "effect", shortName: "fade", inputs: 1, outputs: 1},
            AudioEffectChorus:         { ...AudioTypeArrayBase, category: "effect", shortName: "chorus", inputs: 1, outputs: 1},
            AudioEffectFlange:         { ...AudioTypeArrayBase, category: "effect", shortName: "flange", inputs: 1, outputs: 1},
            AudioEffectReverb:         { ...AudioTypeArrayBase, category: "effect", shortName: "reverb", inputs: 1, outputs: 1},
            AudioEffectFreeverb:       { ...AudioTypeArrayBase, category: "effect", shortName: "freeverb", inputs: 1, outputs: 1},
            AudioEffectFreeverbStereo: { ...AudioTypeArrayBase, category: "effect", shortName: "freeverbs", inputs: 1, outputs: 2},
            AudioEffectEnvelope:       { ...AudioTypeArrayBase, category: "effect", shortName: "envelope", inputs: 1, outputs: 1},
            AudioEffectMultiply:       { ...AudioTypeArrayBase, category: "effect", shortName: "multiply", inputs: 2, outputs: 1},
            AudioEffectRectifier:      { ...AudioTypeArrayBase, category: "effect", shortName: "rectify", inputs: 1, outputs: 1},
            AudioEffectDelay:          { ...AudioTypeArrayBase, category: "effect", shortName: "delay", inputs: 1, outputs: 8, defaults: { ...AudioTypeArrayBase.defaults, outputs: { value: "8" } } },
            AudioEffectDelayExternal:  { ...AudioTypeArrayBase, category: "effect", shortName: "delayExt", inputs: 1, outputs: 8,
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
            AudioEffectBitcrusher:     { ...AudioTypeArrayBase, category: "effect", shortName: "bitcrusher", inputs: 1, outputs: 1},
            AudioEffectMidSide:        { ...AudioTypeArrayBase, category: "effect", shortName: "midside", inputs: 2, outputs: 2},
            AudioEffectWaveshaper:     { ...AudioTypeArrayBase, category: "effect", shortName: "waveshape", inputs: 1, outputs: 1},
            AudioEffectGranular:       { ...AudioTypeArrayBase, category: "effect", shortName: "granular", inputs: 1, outputs: 1},
            AudioEffectDigitalCombine: { ...AudioTypeArrayBase, category: "effect", shortName: "combine", inputs: 2, outputs: 1},
            AudioEffectWaveFolder:     { ...AudioTypeArrayBase, category: "effect", shortName: "wavefolder", inputs: 2, outputs: 1},

            // Filter category
            AudioFilterBiquad:        { ...AudioTypeArrayBase, category: "filter", shortName: "biquad", inputs: 1, outputs: 1},
            AudioFilterFIR:           { ...AudioTypeArrayBase, category: "filter", shortName: "fir", inputs: 1, outputs: 1},
            AudioFilterStateVariable: { ...AudioTypeArrayBase, category: "filter", shortName: "filter", inputs: 2, outputs: 3},
            AudioFilterLadder:        { ...AudioTypeArrayBase, category: "filter", shortName: "ladder", inputs: 3, outputs: 1},

            // Analyze category
            AudioAnalyzePeak:          { ...AudioTypeArrayBase, category: "analyze", shortName: "peak", inputs: 1},
            AudioAnalyzeRMS:           { ...AudioTypeArrayBase, category: "analyze", shortName: "rms", inputs: 1},
            AudioAnalyzeFFT256:        { ...AudioTypeArrayBase, category: "analyze", shortName: "fft256", inputs: 1},
            AudioAnalyzeFFT1024:       { ...AudioTypeArrayBase, category: "analyze", shortName: "fft1024", inputs: 1},
            AudioAnalyzeToneDetect:    { ...AudioTypeArrayBase, category: "analyze", shortName: "tone", inputs: 1},
            AudioAnalyzeNoteFrequency: { ...AudioTypeArrayBase, category: "analyze", shortName: "notefreq", inputs: 1},
            AudioAnalyzePrint:         { ...AudioTypeArrayBase, category: "analyze", shortName: "print", inputs: 1},

            // Control category
            AudioControlSGTL5000:     { ...AudioTypeBase, category: "control", shortName: "sgtl5000"},
            AudioControlAK4558:       { ...AudioTypeBase, category: "control", shortName: "ak4558"},
            AudioControlCS4272:       { ...AudioTypeBase, category: "control", shortName: "cs4272"},
            AudioControlWM8731:       { ...AudioTypeBase, category: "control", shortName: "wm8731"},
            AudioControlWM8731master: { ...AudioTypeBase, category: "control", shortName: "wm8731m"},
            AudioControlCS42448:      { ...AudioTypeBase, category: "control", shortName: "cs42448"}
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