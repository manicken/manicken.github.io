NodeCategories = {
    "used":{      "expanded":false},
    "tabs":{      "expanded":false},
    "special":{   "expanded":false},
    "ui":{        "expanded":false},
    "input":{     "expanded":false, "subcats":{"i2s1":{"hdrBgColor":"#FAFAFA", "hdrTxtColor":"#000"},"i2s2":{"hdrBgColor":"#E3E3E3", "hdrTxtColor":"#000"},"spdif":{"hdrBgColor":"#FAFAFA", "hdrTxtColor":"#000"},"adc":{"hdrBgColor":"#E3E3E3", "hdrTxtColor":"#000"},"other":{"hdrBgColor":"#FAFAFA", "hdrTxtColor":"#000"}}},
    "output":{    "expanded":false, "subcats":{"i2s1":{"hdrBgColor":"#FAFAFA", "hdrTxtColor":"#000"},"i2s2":{"hdrBgColor":"#E3E3E3", "hdrTxtColor":"#000"},"spdif":{"hdrBgColor":"#FAFAFA", "hdrTxtColor":"#000"},"adc":{"hdrBgColor":"#E3E3E3", "hdrTxtColor":"#000"},"other":{"hdrBgColor":"#FAFAFA", "hdrTxtColor":"#000"}}},
    "mixer":{     "expanded":false},
    "play":{      "expanded":false},
    "record":{    "expanded":false},
    "synth":{     "expanded":false},
    "effect":{    "expanded":false},
    "filter":{    "expanded":false},
    "convert":{   "expanded":false},
    "analyze":{   "expanded":false},
    "control":{   "expanded":false},
    "unsorted":{   "expanded":false},
    "config":{   "expanded":false}
}

//InputOutputCompatibilityMetadata is at end of this file

NodeDefinitions = {
    "manickenNodes": {
        "label":"Manicken Nodes",
        "description":"The node types embedded into this tool by manicken (Jannik LF Svensson)",
        "credits":"Jannik LF Svensson",
        "homepage":"https://github.com/manicken",
        "url":"",
        "types":{
            "TabOutput":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"Out","nonObject":"","inputs":1,"outputs":0,"category":"special","color":"#cce6ff","icon":"arrow-in.png"},
            "TabInput":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"In","nonObject":"","inputs":0,"outputs":1,"category":"special","color":"#cce6ff","icon":"arrow-in.png", "align":"right"},
            "PointerArray":{"defaults":{"name":{},"id":{},"objectType":{},"arrayItems":{}},"shortName":"pArray","nonObject":"","dontShowInPalette":"","category":"special","color":"#aaffdd","icon":"range.png"},
            "AudioMixer":{"defaults":{"name":{"type":"c_cpp_name"},"id":{},"inputs":{"value":"1"},"comment":{}},"shortName":"mixer","inputs":1,"outputs":1,"category":"mixer","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioCrossPointSwitch":{"defaults":{"name":{"type":"c_cpp_name"},"id":{},"inputs":{"value":"1"},"outputs":{"value":"1"},"comment":{}},"shortName":"crossSwitch","inputs":1,"outputs":1,"category":"mixer","color":"#E6E0F8","icon":"arrow-in.png"},
            "ClassComment":{"defaults":{"name":{},"id":{}},"shortName":"ClassComment","nonObject":"","category":"special","color":"#ccffcc","icon":"comment.png"},
            "Comment":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"Comment","nonObject":"","category":"special","color":"#ddffbb","icon":"comment.png"},
            "Function":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"code","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"function.png"},
            "Variables":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"vars","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"hash.png"},
            "AudioStreamObject":{"defaults":{"name":{"type":"c_cpp_name"},"id":{},"subType":{},"includeFile":{},"inputs":{"value":"1"},"outputs":{"value":"1"},"comment":{}},"shortName":"userObject","inputs":0,"outputs":0,"category":"special","color":"#ddffbb","icon":"debug.png"},
            "CodeFile":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"codeFile","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"function.png"},
            "DontRemoveCodeFiles":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"dontRemoveFiles","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"function.png"},
            "IncludeDef":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"includeDef","nonObject":"","category":"special","color":"#ddffbb","icon":"file.png"},
            "ConstructorCode":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"constructor code","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"function.png"},
            "DestructorCode":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"destructor code","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"function.png"},
            "EndOfFileCode":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"eof code","nonObject":"","useAceEditor":"c_cpp","category":"special","color":"#ddffbb","icon":"function.png"},

            "ConstValue":{"defaults":{"name":{},"id":{},"value":{"value":"0"},"valueType":{"value":"int"}},"shortName":"constValue","nonObject":"","category":"special","color":"#eb9834","icon":"hash.png"},
            "JunctionLR":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"JunctionLR","nonObject":"","inputs":1,"outputs":1,"category":"special","color":"#4D54FF","textColor":"#FFFFFF","icon":"arrow-in.png"},
            "JunctionRL":{"defaults":{"name":{},"id":{},"comment":{}},"shortName":"JunctionRL","nonObject":"","inputs":1,"outputs":1,"category":"special","color":"#4D54FF","textColor":"#FFFFFF","icon":"arrow-out.png"},

            "UI_Button":{
                "shortName":"Button","uiObject":true,"nonObject":true,"category":"ui","color":"#F6F8BC","textColor":"#000000","icon":"",
                "useAceEditor":"javascript","useAceEditorCodeFieldName":"sendCommand","aceEditorOffsetHeight":0,
                "defaults":{
                    "name":{},"id":{},"comment":{},"w":{"value":100},"h":{"value":30},"textSize":{"value":14},
                    "midiCh":{"value":"0"},"midiId":{"value":"0"},
                    "pressAction":{},"repeatPressAction":{"value":false},
                    "releaseAction":{},"repeatReleaseAction":{"value":false},
                    "local":{"value":false},
                    "sendCommand":{}                    
                }
            },

            "UI_Slider":{
                "shortName":"Slider","uiObject":true,"nonObject":true,"category":"ui","color":"#808080","textColor":"#000000","icon":"",
                "useAceEditor":"javascript","useAceEditorCodeFieldName":"sendCommand","aceEditorOffsetHeight":200,
                "defaults":{
                    "name":{},"id":{},"comment":{},"w":{"value":30},"h":{"value":300},"textSize":{"value":14},
                    "midiCh":{"value":"0"},"midiId":{"value":"0"},
                    "orientation":{"value":"v"},"label":{"value":"d.val"},
                    "minVal":{"value":0},"maxVal":{"value":100},"val":{"value":50},
                    "outputFloat":{"value":false},"minValF":{"value":-1.0},"maxValF":{"value":1.0},"floatVal":{"value":0.0},"decimalCount":{"value":-1},"steps":{"value":201},
                    "sendSpace":{"value":true},"repeat":{"value":false},"repeatPeriod":{"value":0},"sendMode":{"value":"r"},
                    "autoReturn":{"value":false},"returnValue":{"value":"mid"},
                    "barFGcolor":{"value":"#F6F8BC"},
                    "sendFormat":{},
                    "sendCommand":{"value":""}
                }
            },

            "UI_TextBox":{
                "shortName":"TextBox","uiObject":true,"nonObject":true,"category":"ui","color":"#F6F8BC","textColor":"#000000","icon":"", 
                "defaults":{"name":{},"id":{},"comment":{},"w":{"value":150},"h":{"value":150},"textSize":{"value":14}}
            },

            "UI_Label":{
                "shortName":"Label","uiObject":true,"nonObject":true,"category":"ui","color":"#F6F8BC","textColor":"#000000","icon":"", 
                "defaults":{"name":{},"id":{},"comment":{},"w":{"value":100},"h":{"value":30},"textSize":{"value":14}}
            },

            "UI_Image":{
                "shortName":"Image","uiObject":true,"nonObject":true,"category":"ui","color":"#F6F8BC","textColor":"#000000","icon":"",
                "defaults":{"name":{},"id":{},"comment":{},"w":{"value":150},"h":{"value":150},"textSize":{"value":14}}
            },

            "UI_ListBox":{
                "shortName":"ListBox","uiObject":true,"nonObject":true,"category":"ui","color":"#F6F8BC","textColor":"#000000","icon":"",
                "useAceEditor":"javascript","useAceEditorCodeFieldName":"sendCommand","aceEditorOffsetHeight":300,
                "defaults":{
                    "name":{},"id":{},"comment":{},"w":{"value":150},"h":{"value":150},"textSize":{"value":14},
                    "midiCh":{"value":"0"},"midiId":{"value":"0"},
                    "itemTextSize":{"value":14},
                    "items":{"value":"item1\nitem2\nitem3"},"selectedIndex":{"value":0},"selectedIndexOffset":{"value":0},"headerHeight":{"value":30},
                    "itemBGcolor":{"value":"#F6F8BC"},
                    "sendCommand":{}
                    
                }
            },

            "UI_Piano":{
                "shortName":"Piano","uiObject":true,"nonObject":true,"category":"ui","color":"#F6F8BC","textColor":"#000000","icon":"",
                "useAceEditor":"javascript","useAceEditorCodeFieldName":"sendCommand","aceEditorOffsetHeight":120,
                "defaults":{
                    "name":{},"id":{},"comment":{},
                    "w":{"value":210, "minval":"1", "type":"int"},
                    "h":{"value":130, "minval":"1", "type":"int"},
                    "textSize":{"value":14, "minval":"1", "type":"int"},
                    "midiCh":{"value":"0", "minval":"0", "maxval":"15", "type":"int"},
                    "midiId":{"value":"0", "minval":"0", "maxval":"127", "type":"int"},
                    "octave":{"value":4, "minval":"0", "maxval":"10", "type":"int"},
                    "sendCommand":{},
                    "headerHeight":{"value":30, "minval":"0", "type":"int"},
                    "whiteKeysColor":{"value":"#FFFFFF"},"blackKeysColor":{"value":"#A0A0A0"},
                    "blackKeysWidthDiff":{"value":6},
                    "x":{"value":150, "minval":"0", "type":"int"},
                    "y":{"value":150, "minval":"0", "type":"int"},
                    "blackKeyLabelsVisible":{"value":true},"whiteKeyLabelsVisible":{"value":true}
                    
                }
            },
            "UI_ScriptButton":{
                "shortName":"scriptBtn","uiObject":true,"nonObject":"","useAceEditor":"javascript","category":"ui","color":"#ddffbb","icon":"",
                "defaults":{
                    "name":{},"id":{},"comment":{},"w":{"value":100},"h":{"value":30},"textSize":{"value":14},
                    "nodes":{"value":[]}
                }
            },
            "group":{
                "shortName":"group","uiObject":true,"nonObject":"","category":"ui","color":"#ddffbb","icon":"",
                "defaults":{
                    "name":{},"id":{},"comment":{},"w":{"value":200},"h":{"value":200},"textSize":{"value":14},
                    "nodes":{"value":[]},"border_color":{"value":"#999"},"individualListBoxMode":{"value":"false"},"exportAsClass":{"value":"false"}
                }
            }
        }
    },
	"officialNodes": {
        "label":"Official Nodes",
        "description":"The official Audio node types embedded into this tool, that is used by the official Audio Library ",
        "credits":"Paul Stoffregen",
        "homepage":"https://www.pjrc.com/",
        "url":"https://api.github.com/repos/PaulStoffregen/Audio/contents",
        "types":{
            

            "AudioInputI2S":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s","inputs":0,"outputs":2,"category":"input-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputI2SQuad":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s_quad","inputs":0,"outputs":4,"category":"input-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputI2SHex":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s_hex","inputs":0,"outputs":6,"category":"input-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputI2SOct":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s_oct","inputs":0,"outputs":8,"category":"input-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputI2Sslave":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2sslave","inputs":0,"outputs":2,"category":"input-i2s1","color":"#F7D8F0","icon":"arrow-in.png"},
            "AudioInputI2S2":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s2","inputs":0,"outputs":2,"category":"input-i2s2","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputSPDIF3":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"spdif3","inputs":0,"outputs":2,"category":"input-spdif","color":"#F7D8F0","icon":"arrow-in.png"},
            "AsyncAudioInputSPDIF3":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"spdif_async","inputs":0,"outputs":2,"category":"input-spdif","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputAnalog":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"adc","inputs":0,"outputs":1,"category":"input-adc","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputAnalogStereo":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"adcs","inputs":0,"outputs":2,"category":"input-adc","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputPDM":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"pdm","inputs":0,"outputs":1,"category":"input-other","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputTDM":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"outputs":{"value":"16"}},"shortName":"tdm","inputs":0,"outputs":16,"category":"input-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputTDM2":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"outputs":{"value":"16"}},"shortName":"tdm2","inputs":0,"outputs":16,"category":"input-i2s2","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioInputUSB":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"usb","inputs":0,"outputs":2,"category":"input-other","color":"#E6E0F8","icon":"arrow-in.png"},

            "AudioOutputI2S":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s","inputs":2,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputI2SQuad":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s_quad","inputs":4,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputI2SHex":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s_hex","inputs":6,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputI2SOct":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s_oct","inputs":8,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputI2Sslave":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2sslave","inputs":2,"outputs":0,"category":"output-i2s1","color":"#F7D8F0","icon":"arrow-in.png"},
            "AudioOutputI2S2":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"i2s2","inputs":2,"outputs":0,"category":"output-i2s2","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputSPDIF":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"spdif","inputs":2,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputSPDIF2":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"spdif2","inputs":2,"outputs":0,"category":"output-i2s2","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputSPDIF3":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"spdif3","inputs":2,"outputs":0,"category":"output-spdif","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputPT8211":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"pt8211","inputs":2,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputPT8211_2":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"pt8211_2","inputs":2,"outputs":0,"category":"output-i2s2","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputAnalog":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"dac","inputs":1,"outputs":0,"category":"output-adc","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputAnalogStereo":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"dacs","inputs":2,"outputs":0,"category":"output-adc","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputPWM":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"pwm","inputs":1,"outputs":0,"category":"output-other","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputMQS":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"mqs","inputs":2,"outputs":0,"category":"output-other","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputTDM":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"inputs":{"value":"16"}},"shortName":"tdm","inputs":16,"outputs":0,"category":"output-i2s1","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputTDM2":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"inputs":{"value":"16"}},"shortName":"tdm2","inputs":16,"outputs":0,"category":"output-i2s2","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputADAT":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"adat","inputs":8,"outputs":0,"category":"output-other","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioOutputUSB":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"usb","inputs":2,"outputs":0,"category":"output-other","color":"#E6E0F8","icon":"arrow-in.png"},

            "AudioAmplifier":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"amp","inputs":1,"outputs":1,"category":"mixer","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioMixer4":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"inputs":{"value":"4"}},"shortName":"mixer4","inputs":4,"outputs":1,"category":"mixer","color":"#E6E0F8","icon":"arrow-in.png"},
            
            "AudioPlayMemory":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"playMem","inputs":0,"outputs":1,"category":"play","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioPlaySdWav":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"playSdWav","inputs":0,"outputs":2,"category":"play","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioPlaySdRaw":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"playSdRaw","inputs":0,"outputs":1,"category":"play","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioPlaySerialflashRaw":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"playFlashRaw","inputs":0,"outputs":1,"category":"play","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioPlayQueue":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"queue","inputs":0,"outputs":1,"category":"play","color":"#E6E0F8","icon":"arrow-in.png"},
            
            "AudioRecordQueue":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"queue","inputs":1,"outputs":0,"category":"record","color":"#E6E0F8","icon":"arrow-in.png"},
            
            "AudioSynthWavetable":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"wavetable","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthSimpleDrum":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"drum","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthKarplusStrong":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"string","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveformSine":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"sine","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveformSineHires":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"sine_hires","inputs":0,"outputs":2,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveformSineModulated":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"sine_fm","inputs":1,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveform":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"waveform","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveformModulated":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"waveformMod","inputs":2,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveformPWM":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"pwm","inputs":1,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthToneSweep":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"tonesweep","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthWaveformDc":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"dc","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthNoiseWhite":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"noise","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioSynthNoisePink":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"pink","inputs":0,"outputs":1,"category":"synth","color":"#E6E0F8","icon":"arrow-in.png"},
            
            "AudioEffectFade":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"fade","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectChorus":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"chorus","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectFlange":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"flange","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectReverb":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"reverb","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectFreeverb":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"freeverb","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectFreeverbStereo":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"freeverbs","inputs":1,"outputs":2,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectEnvelope":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"envelope","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectMultiply":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"multiply","inputs":2,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectRectifier":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"rectify","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectDelay":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"outputs":{"value":"8"}},"shortName":"delay","inputs":1,"outputs":8,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectDelayExternal":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{},"outputs":{"value":"8"}},"shortName":"delayExt","inputs":1,"outputs":8,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectBitcrusher":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"bitcrusher","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectMidSide":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"midside","inputs":2,"outputs":2,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectWaveshaper":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"waveshape","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectGranular":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"granular","inputs":1,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioEffectDigitalCombine":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"combine","inputs":2,"outputs":1,"category":"effect","color":"#E6E0F8","icon":"arrow-in.png"},
            
            "AudioFilterBiquad":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"biquad","inputs":1,"outputs":1,"category":"filter","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioFilterFIR":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"fir","inputs":1,"outputs":1,"category":"filter","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioFilterStateVariable":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"filter","inputs":2,"outputs":3,"category":"filter","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioFilterLadder":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"ladder","inputs":3,"outputs":1,"category":"filter","color":"#E6E0F8","icon":"arrow-in.png"},

            "AudioAnalyzePeak":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"peak","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioAnalyzeRMS":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"rms","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioAnalyzeFFT256":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"fft256","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioAnalyzeFFT1024":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"fft1024","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioAnalyzeToneDetect":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"tone","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioAnalyzeNoteFrequency":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"notefreq","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioAnalyzePrint":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"print","inputs":1,"outputs":0,"category":"analyze","color":"#E6E0F8","icon":"arrow-in.png"},
            
            "AudioControlSGTL5000":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"sgtl5000","inputs":0,"outputs":0,"category":"control","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioControlAK4558":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"ak4558","inputs":0,"outputs":0,"category":"control","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioControlCS4272":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"cs4272","inputs":0,"outputs":0,"category":"control","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioControlWM8731":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"wm8731","inputs":0,"outputs":0,"category":"control","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioControlWM8731master":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"wm8731m","inputs":0,"outputs":0,"category":"control","color":"#E6E0F8","icon":"arrow-in.png"},
            "AudioControlCS42448":{"defaults":{"name":{"type":"c_cpp_name"},"comment":{}},"shortName":"cs42448","inputs":0,"outputs":0,"category":"control","color":"#E6E0F8","icon":"arrow-in.png"}
	    }
    }
}

InputOutputCompatibilityMetadata = {"requirements":[
    {"type":"AudioInputI2S",         "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioInputI2S",         "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputI2S",         "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputI2SQuad",     "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioInputI2SQuad",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputI2SQuad",     "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputI2SQuad",     "resource":"OUT1D Pin",     "shareable":false},
    {"type":"AudioInputI2SHex",      "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioInputI2SHex",      "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputI2SHex",      "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputI2SHex",      "resource":"OUT1D Pin",     "shareable":false},
    {"type":"AudioInputI2SHex",      "resource":"OUT1C Pin",     "shareable":false},
    {"type":"AudioInputI2SOct",      "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioInputI2SOct",      "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputI2SOct",      "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputI2SOct",      "resource":"OUT1D Pin",     "shareable":false},
    {"type":"AudioInputI2SOct",      "resource":"OUT1C Pin",     "shareable":false},
    {"type":"AudioInputI2SOct",      "resource":"OUT1B Pin",     "shareable":false},
    {"type":"AudioInputI2Sslave",    "resource":"I2S Device",    "shareable":true,  "setting":"I2S Slave"},
    {"type":"AudioInputI2Sslave",    "resource":"Sample Rate",   "shareable":true,  "setting":"LRCLK1 Control"},
    {"type":"AudioInputI2Sslave",    "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputI2S2",        "resource":"I2S2 Device",   "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioInputI2S2",        "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputI2S2",        "resource":"IN2 Pin",       "shareable":false},
    {"type":"AudioInputSPDIF3",      "resource":"SPDIF Device",  "shareable":true,  "setting":"SPDIF Protocol"},
    {"type":"AudioInputSPDIF3",      "resource":"Sample Rate",   "shareable":true,  "setting":"SPDIF Control"},
    {"type":"AudioInputSPDIF3",      "resource":"SPDIFIN Pin",   "shareable":false},
    {"type":"AsyncAudioInputSPDIF3", "resource":"SPDIF Device",  "shareable":true,  "setting":"SPDIF Protocol"},
    {"type":"AsyncAudioInputSPDIF3", "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AsyncAudioInputSPDIF3", "resource":"SPDIFIN Pin",   "shareable":false},
    {"type":"AudioInputAnalog",      "resource":"ADC1",          "shareable":false},
    {"type":"AudioInputAnalog",      "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputAnalogStereo","resource":"ADC1",          "shareable":false},
    {"type":"AudioInputAnalogStereo","resource":"ADC2",          "shareable":false},
    {"type":"AudioInputAnalogStereo","resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputPDM",         "resource":"I2S Device",    "shareable":true,  "setting":"PDM Protocol"},
    {"type":"AudioInputPDM",         "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputPDM",         "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputTDM",         "resource":"I2S Device",    "shareable":true,  "setting":"TDM Protocol"},
    {"type":"AudioInputTDM",         "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputTDM",         "resource":"IN1 Pin",       "shareable":false},
    {"type":"AudioInputTDM2",        "resource":"I2S2 Device",   "shareable":true,  "setting":"TDM Protocol"},
    {"type":"AudioInputTDM2",        "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioInputTDM2",        "resource":"IN2 Pin",       "shareable":false},
    {"type":"AudioInputUSB",         "resource":"USB Rx Endpoint","shareable":false},
    {"type":"AudioOutputI2S",        "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioOutputI2S",        "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputI2S",        "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputI2SQuad",    "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioOutputI2SQuad",    "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputI2SQuad",    "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputI2SQuad",    "resource":"OUT1B Pin",     "shareable":false},
    {"type":"AudioOutputI2SHex",     "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioOutputI2SHex",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputI2SHex",     "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputI2SHex",     "resource":"OUT1B Pin",     "shareable":false},
    {"type":"AudioOutputI2SHex",     "resource":"OUT1C Pin",     "shareable":false},
    {"type":"AudioOutputI2SOct",     "resource":"I2S Device",    "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioOutputI2SOct",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputI2SOct",     "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputI2SOct",     "resource":"OUT1B Pin",     "shareable":false},
    {"type":"AudioOutputI2SOct",     "resource":"OUT1C Pin",     "shareable":false},
    {"type":"AudioOutputI2SOct",     "resource":"OUT1D Pin",     "shareable":false},
    {"type":"AudioOutputI2Sslave",   "resource":"I2S Device",    "shareable":true,  "setting":"I2S Slave"},
    {"type":"AudioOutputI2Sslave",   "resource":"Sample Rate",   "shareable":true,  "setting":"LRCLK1 Control"},
    {"type":"AudioOutputI2Sslave",   "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputI2S2",       "resource":"I2S2 Device",   "shareable":true,  "setting":"I2S Master"},
    {"type":"AudioOutputI2S2",       "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputI2S2",       "resource":"OUT2 Pin",      "shareable":false},
    {"type":"AudioOutputSPDIF",      "resource":"I2S Device",    "shareable":true,  "setting":"SPDIF Protocol"},
    {"type":"AudioOutputSPDIF",      "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputSPDIF",      "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputSPDIF2",     "resource":"I2S2 Device",   "shareable":true,  "setting":"SPDIF Protocol"},
    {"type":"AudioOutputSPDIF2",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputSPDIF2",     "resource":"OUT2 Pin",      "shareable":false},
    {"type":"AudioOutputSPDIF3",     "resource":"SPDIF Device",  "shareable":true,  "setting":"SPDIF Protocol"},
    {"type":"AudioOutputSPDIF3",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputSPDIF3",     "resource":"SPDIFOUT Pin",  "shareable":false},
    {"type":"AudioOutputPT8211",     "resource":"I2S Device",    "shareable":true,  "setting":"PT8211 Protocol"},
    {"type":"AudioOutputPT8211",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputPT8211",     "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputPT8211_2",   "resource":"I2S2 Device",   "shareable":true,  "setting":"PT8211 Protocol"},
    {"type":"AudioOutputPT8211_2",   "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputPT8211_2",   "resource":"OUT2 Pin",      "shareable":false},
    {"type":"AudioOutputAnalog",     "resource":"DAC1",          "shareable":false},
    {"type":"AudioOutputAnalog",     "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputAnalogStereo","resource":"DAC1",         "shareable":false},
    {"type":"AudioOutputAnalogStereo","resource":"DAC2",         "shareable":false},
    {"type":"AudioOutputAnalogStereo","resource":"Sample Rate",  "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputPWM",        "resource":"PWM",          "shareable":false},
    {"type":"AudioOutputPWM",        "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputMQS",        "resource":"MSQ Device",    "shareable":false},
    {"type":"AudioOutputMQS",        "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputTDM",        "resource":"I2S Device",    "shareable":true,  "setting":"TDM Protocol"},
    {"type":"AudioOutputTDM",        "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputTDM",        "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputTDM2",       "resource":"I2S2 Device",   "shareable":true,  "setting":"TDM Protocol"},
    {"type":"AudioOutputTDM2",       "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputTDM2",       "resource":"OUT2 Pin",      "shareable":false},
    {"type":"AudioOutputADAT",       "resource":"I2S Device",    "shareable":true,  "setting":"ADAT Protocol"},
    {"type":"AudioOutputADAT",       "resource":"Sample Rate",   "shareable":true,  "setting":"Teensy Control"},
    {"type":"AudioOutputADAT",       "resource":"OUT1A Pin",     "shareable":false},
    {"type":"AudioOutputUSB",        "resource":"USB Tx Endpoint","shareable":false}
]}