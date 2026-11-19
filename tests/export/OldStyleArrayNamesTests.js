// Test design for the export (see red/export/README.md, Tests).
// Included by index.html, it adds itself to the global TestDesigns list, listed in the menu (top right) under Test designs.
(globalThis.TestDesigns = globalThis.TestDesigns || []).push({
    name: "OldStyleArrayNamesTests",
    description: "FlatTests + GroupTests in the old style: the array size is in the name (osc[NUM], voices[2], a group voices[2]),<br>" +
                 "when it's loaded it's converted to the 'Array Size' setting, and must export the same as FlatTests and GroupTests",
    design: {
        "version": 1,
        "settings": {
            "main": {},
            "arduino": {
                "ExportMode": "classes",
                "ProjectName": "OldStyleArrayNamesTests",
                "IOcheckAtExport": false,
                "Board": {
                    "Platform": "",
                    "Board": "",
                    "Options": ""
                }
            },
            "workspaces": {}
        },
        "workspaces": [
            {
                "type": "tab",
                "id": "ws_FlatMain",
                "label": "FlatMain",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": true,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_FlatMain",
                        "wires": [
                            [
                                "fm_i2s:0"
                            ]
                        ],
                        "id": "fm_poly",
                        "type": "Poly",
                        "name": "poly"
                    },
                    {
                        "comment": "",
                        "x": 100,
                        "y": 110,
                        "z": "ws_FlatMain",
                        "wires": [
                            [
                                "fm_i2s:1"
                            ]
                        ],
                        "id": "fm_amp",
                        "type": "AudioAmplifier",
                        "name": "amp"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_FlatMain",
                        "wires": [],
                        "id": "fm_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_FlatCodeMain",
                "label": "FlatCodeMain",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_FlatCodeMain",
                        "wires": [
                            [
                                "fc_i2s:0"
                            ]
                        ],
                        "id": "fc_cv",
                        "type": "CodeVoice",
                        "name": "cv"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_FlatCodeMain",
                        "wires": [],
                        "id": "fc_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_FlatCollision",
                "label": "FlatCollision",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_FlatCollision",
                        "wires": [
                            [
                                "fx_i2s:0"
                            ]
                        ],
                        "id": "fx_poly",
                        "type": "Poly",
                        "name": "poly"
                    },
                    {
                        "comment": "",
                        "x": 100,
                        "y": 110,
                        "z": "ws_FlatCollision",
                        "wires": [
                            [
                                "fx_i2s:1"
                            ]
                        ],
                        "id": "fx_lfo",
                        "type": "AudioAmplifier",
                        "name": "poly_lfo"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_FlatCollision",
                        "wires": [],
                        "id": "fx_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_FlatCodeUse",
                "label": "FlatCodeUse",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_FlatCodeUse",
                        "wires": [
                            [
                                "fu_i2s:0"
                            ]
                        ],
                        "id": "fu_poly",
                        "type": "Poly",
                        "name": "poly"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_FlatCodeUse",
                        "wires": [],
                        "id": "fu_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    },
                    {
                        "comment": "",
                        "x": 100,
                        "y": 110,
                        "z": "ws_FlatCodeUse",
                        "wires": [
                            [
                                "fu_i2s:1"
                            ]
                        ],
                        "id": "fu_amp",
                        "type": "AudioAmplifier",
                        "name": "amp"
                    },
                    {
                        "comment": "void setGain() { poly.mix.gain(0, 0.5); }",
                        "x": 100,
                        "y": 160,
                        "z": "ws_FlatCodeUse",
                        "wires": [],
                        "id": "fu_func",
                        "type": "Function",
                        "name": "setGain"
                    },
                    {
                        "comment": "void setAmp() { amp.gain(0.5); }",
                        "x": 100,
                        "y": 210,
                        "z": "ws_FlatCodeUse",
                        "wires": [],
                        "id": "fu_func2",
                        "type": "Function",
                        "name": "setAmp"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_FlatHelperCode",
                "label": "FlatHelperCode",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 210,
                        "z": "ws_FlatHelperCode",
                        "wires": [],
                        "id": "fh_num",
                        "type": "ConstValue",
                        "name": "COUNT",
                        "value": "2",
                        "valueType": "int"
                    },
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_FlatHelperCode",
                        "wires": [
                            [
                                "fh_mix:0"
                            ]
                        ],
                        "id": "fh_poly",
                        "type": "Poly",
                        "name": "poly"
                    },
                    {
                        "comment": "",
                        "x": 100,
                        "y": 110,
                        "z": "ws_FlatHelperCode",
                        "wires": [
                            [
                                "fh_mix:1"
                            ]
                        ],
                        "id": "fh_dc",
                        "type": "AudioSynthWaveformDc",
                        "name": "dc[COUNT]"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_FlatHelperCode",
                        "wires": [
                            [
                                "fh_i2s:0"
                            ]
                        ],
                        "id": "fh_mix",
                        "type": "AudioMixer",
                        "name": "outMix"
                    },
                    {
                        "comment": "",
                        "x": 400,
                        "y": 60,
                        "z": "ws_FlatHelperCode",
                        "wires": [],
                        "id": "fh_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    },
                    {
                        "comment": "void setGain() {\n    design.outMix.gain(0, 0.5);\n    design.poly_mix.gain(0, 0.5);\n    for (int i = 0; i < COUNT; i++) design.dc[i].amplitude(0.1);\n}",
                        "x": 100,
                        "y": 260,
                        "z": "ws_FlatHelperCode",
                        "wires": [],
                        "id": "fh_func",
                        "type": "Function",
                        "name": "setGain"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_Voice",
                "label": "Voice",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 210,
                        "z": "ws_Voice",
                        "wires": [],
                        "id": "v_num",
                        "type": "ConstValue",
                        "name": "NUM",
                        "value": "2",
                        "valueType": "int"
                    },
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_Voice",
                        "wires": [
                            [
                                "v_osc:0"
                            ]
                        ],
                        "id": "v_mod",
                        "type": "TabInput",
                        "name": "Mod",
                        "outputs": 1
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_Voice",
                        "wires": [
                            [
                                "v_mixer:0"
                            ]
                        ],
                        "id": "v_osc",
                        "type": "AudioSynthWaveformModulated",
                        "name": "osc[NUM]"
                    },
                    {
                        "comment": "",
                        "x": 400,
                        "y": 60,
                        "z": "ws_Voice",
                        "wires": [
                            [
                                "v_env:0"
                            ]
                        ],
                        "id": "v_mixer",
                        "type": "AudioMixer",
                        "name": "mixer"
                    },
                    {
                        "comment": "",
                        "x": 550,
                        "y": 60,
                        "z": "ws_Voice",
                        "wires": [
                            [
                                "v_out:0"
                            ]
                        ],
                        "id": "v_env",
                        "type": "AudioEffectEnvelope",
                        "name": "env"
                    },
                    {
                        "comment": "",
                        "x": 700,
                        "y": 60,
                        "z": "ws_Voice",
                        "wires": [],
                        "id": "v_out",
                        "type": "TabOutput",
                        "name": "Out",
                        "inputs": 1
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_Poly",
                "label": "Poly",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_Poly",
                        "wires": [
                            [
                                "p_voices:0"
                            ]
                        ],
                        "id": "p_lfo",
                        "type": "AudioSynthWaveform",
                        "name": "lfo"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_Poly",
                        "wires": [
                            [
                                "p_mix:0"
                            ]
                        ],
                        "id": "p_voices",
                        "type": "Voice",
                        "name": "voices[2]"
                    },
                    {
                        "comment": "",
                        "x": 400,
                        "y": 60,
                        "z": "ws_Poly",
                        "wires": [
                            [
                                "p_out:0"
                            ]
                        ],
                        "id": "p_mix",
                        "type": "AudioMixer",
                        "name": "mix"
                    },
                    {
                        "comment": "",
                        "x": 550,
                        "y": 60,
                        "z": "ws_Poly",
                        "wires": [],
                        "id": "p_out",
                        "type": "TabOutput",
                        "name": "Out",
                        "inputs": 1
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_CodeVoice",
                "label": "CodeVoice",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 100,
                        "y": 60,
                        "z": "ws_CodeVoice",
                        "wires": [
                            [
                                "cv_out:0"
                            ]
                        ],
                        "id": "cv_osc",
                        "type": "AudioSynthWaveform",
                        "name": "osc"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_CodeVoice",
                        "wires": [],
                        "id": "cv_out",
                        "type": "TabOutput",
                        "name": "Out",
                        "inputs": 1
                    },
                    {
                        "comment": "void noteOn() { osc.amplitude(1.0); }",
                        "x": 100,
                        "y": 160,
                        "z": "ws_CodeVoice",
                        "wires": [],
                        "id": "cv_func",
                        "type": "Function",
                        "name": "noteOn"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_GroupMain",
                "label": "GroupMain",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": true,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 40,
                        "y": 80,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_v_in:0"
                            ]
                        ],
                        "id": "gm_lfo",
                        "type": "AudioSynthWaveform",
                        "name": "lfo"
                    },
                    {
                        "comment": "",
                        "x": 150,
                        "y": 40,
                        "z": "ws_GroupMain",
                        "wires": [],
                        "id": "gm_voice",
                        "type": "group",
                        "name": "voices[2]",
                        "className": "GVoice",
                        "exportAsClass": true,
                        "nodes": [
                            "gm_v_in",
                            "gm_v_out",
                            "gm_v_osc",
                            "gm_v_env",
                            "gm_filt"
                        ],
                        "inputs": 1,
                        "outputs": 1,
                        "ioNodeSize": 10,
                        "ioNodeSpacing": 15,
                        "individualListBoxMode": false,
                        "border_color": "#999",
                        "color": "#ddffbb",
                        "tag": "",
                        "textSize": 14,
                        "w": 520,
                        "h": 140
                    },
                    {
                        "comment": "",
                        "x": 145,
                        "y": 105,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_v_osc:0"
                            ]
                        ],
                        "id": "gm_v_in",
                        "type": "JunctionLR",
                        "name": "In1",
                        "ClassIOtype": 1,
                        "parentGroup": "gm_voice",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 665,
                        "y": 105,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_mixer:0"
                            ]
                        ],
                        "id": "gm_v_out",
                        "type": "JunctionLR",
                        "name": "Out1",
                        "ClassIOtype": 0,
                        "parentGroup": "gm_voice",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 180,
                        "y": 90,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_v_env:0"
                            ]
                        ],
                        "id": "gm_v_osc",
                        "type": "AudioSynthWaveformModulated",
                        "name": "osc",
                        "parentGroup": "gm_voice"
                    },
                    {
                        "comment": "",
                        "x": 330,
                        "y": 90,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_f_in:0"
                            ]
                        ],
                        "id": "gm_v_env",
                        "type": "AudioEffectEnvelope",
                        "name": "env",
                        "parentGroup": "gm_voice"
                    },
                    {
                        "comment": "",
                        "x": 460,
                        "y": 70,
                        "z": "ws_GroupMain",
                        "wires": [],
                        "id": "gm_filt",
                        "type": "group",
                        "name": "filt",
                        "className": "GFilter",
                        "exportAsClass": true,
                        "nodes": [
                            "gm_f_in",
                            "gm_f_out",
                            "gm_f_amp"
                        ],
                        "inputs": 1,
                        "outputs": 1,
                        "ioNodeSize": 10,
                        "ioNodeSpacing": 15,
                        "individualListBoxMode": false,
                        "border_color": "#999",
                        "color": "#ddffbb",
                        "tag": "",
                        "textSize": 14,
                        "w": 170,
                        "h": 80,
                        "parentGroup": "gm_voice"
                    },
                    {
                        "comment": "",
                        "x": 455,
                        "y": 105,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_f_amp:0"
                            ]
                        ],
                        "id": "gm_f_in",
                        "type": "JunctionLR",
                        "name": "In1",
                        "ClassIOtype": 1,
                        "parentGroup": "gm_filt",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 625,
                        "y": 105,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_v_out:0"
                            ]
                        ],
                        "id": "gm_f_out",
                        "type": "JunctionLR",
                        "name": "Out1",
                        "ClassIOtype": 0,
                        "parentGroup": "gm_filt",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 500,
                        "y": 90,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_f_out:0"
                            ]
                        ],
                        "id": "gm_f_amp",
                        "type": "AudioAmplifier",
                        "name": "amp",
                        "parentGroup": "gm_filt"
                    },
                    {
                        "comment": "",
                        "x": 150,
                        "y": 220,
                        "z": "ws_GroupMain",
                        "wires": [],
                        "id": "gm_visual",
                        "type": "group",
                        "name": "just a frame",
                        "className": "ClassTypeName",
                        "exportAsClass": false,
                        "nodes": [
                            "gm_dc"
                        ],
                        "inputs": 0,
                        "outputs": 0,
                        "ioNodeSize": 10,
                        "ioNodeSpacing": 15,
                        "individualListBoxMode": false,
                        "border_color": "#999",
                        "color": "#ddffbb",
                        "tag": "",
                        "textSize": 14,
                        "w": 200,
                        "h": 80
                    },
                    {
                        "comment": "",
                        "x": 180,
                        "y": 250,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_mixer:1"
                            ]
                        ],
                        "id": "gm_dc",
                        "type": "AudioSynthWaveformDc",
                        "name": "dc",
                        "parentGroup": "gm_visual"
                    },
                    {
                        "comment": "",
                        "x": 40,
                        "y": 340,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_f2_in:0"
                            ]
                        ],
                        "id": "gm_dc2",
                        "type": "AudioSynthWaveformDc",
                        "name": "dc2"
                    },
                    {
                        "comment": "",
                        "x": 150,
                        "y": 320,
                        "z": "ws_GroupMain",
                        "wires": [],
                        "id": "gm_filt2",
                        "type": "group",
                        "name": "filt2",
                        "className": "GFilter",
                        "exportAsClass": true,
                        "nodes": [
                            "gm_f2_in",
                            "gm_f2_out",
                            "gm_f2_amp"
                        ],
                        "inputs": 1,
                        "outputs": 1,
                        "ioNodeSize": 10,
                        "ioNodeSpacing": 15,
                        "individualListBoxMode": false,
                        "border_color": "#999",
                        "color": "#ddffbb",
                        "tag": "",
                        "textSize": 14,
                        "w": 170,
                        "h": 80
                    },
                    {
                        "comment": "",
                        "x": 145,
                        "y": 355,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_f2_amp:0"
                            ]
                        ],
                        "id": "gm_f2_in",
                        "type": "JunctionLR",
                        "name": "In1",
                        "ClassIOtype": 1,
                        "parentGroup": "gm_filt2",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 315,
                        "y": 355,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_i2s:1"
                            ]
                        ],
                        "id": "gm_f2_out",
                        "type": "JunctionLR",
                        "name": "Out1",
                        "ClassIOtype": 0,
                        "parentGroup": "gm_filt2",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 190,
                        "y": 340,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_f2_out:0"
                            ]
                        ],
                        "id": "gm_f2_amp",
                        "type": "AudioAmplifier",
                        "name": "amp",
                        "parentGroup": "gm_filt2"
                    },
                    {
                        "comment": "",
                        "x": 720,
                        "y": 100,
                        "z": "ws_GroupMain",
                        "wires": [
                            [
                                "gm_i2s:0"
                            ]
                        ],
                        "id": "gm_mixer",
                        "type": "AudioMixer",
                        "name": "mixer"
                    },
                    {
                        "comment": "",
                        "x": 860,
                        "y": 100,
                        "z": "ws_GroupMain",
                        "wires": [],
                        "id": "gm_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    }
                ]
            },
            {
                "type": "tab",
                "id": "ws_GroupCode",
                "label": "GroupCode",
                "inputs": 0,
                "outputs": 0,
                "export": true,
                "isMain": false,
                "mainNameType": "tabName",
                "mainNameExt": ".ino",
                "isAudioMain": false,
                "generateCppDestructor": false,
                "extraClassDeclarations": "",
                "settings": {
                    "useCenterBasedPositions": false
                },
                "nodes": [
                    {
                        "comment": "",
                        "x": 40,
                        "y": 40,
                        "z": "ws_GroupCode",
                        "wires": [],
                        "id": "gc_group",
                        "type": "group",
                        "name": "coded",
                        "className": "GCode",
                        "exportAsClass": true,
                        "nodes": [
                            "gc_out",
                            "gc_osc",
                            "gc_func"
                        ],
                        "inputs": 0,
                        "outputs": 1,
                        "ioNodeSize": 10,
                        "ioNodeSpacing": 15,
                        "individualListBoxMode": false,
                        "border_color": "#999",
                        "color": "#ddffbb",
                        "tag": "",
                        "textSize": 14,
                        "w": 260,
                        "h": 120
                    },
                    {
                        "comment": "",
                        "x": 295,
                        "y": 95,
                        "z": "ws_GroupCode",
                        "wires": [
                            [
                                "gc_i2s:0"
                            ]
                        ],
                        "id": "gc_out",
                        "type": "JunctionLR",
                        "name": "Out1",
                        "ClassIOtype": 0,
                        "parentGroup": "gc_group",
                        "locked": true,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 80,
                        "y": 80,
                        "z": "ws_GroupCode",
                        "wires": [
                            [
                                "gc_out:0"
                            ]
                        ],
                        "id": "gc_osc",
                        "type": "AudioSynthWaveform",
                        "name": "osc",
                        "parentGroup": "gc_group"
                    },
                    {
                        "comment": "void start() { osc.begin(WAVEFORM_SINE); }",
                        "x": 80,
                        "y": 120,
                        "z": "ws_GroupCode",
                        "wires": [],
                        "id": "gc_func",
                        "type": "Function",
                        "name": "start",
                        "parentGroup": "gc_group"
                    },
                    {
                        "comment": "",
                        "x": 360,
                        "y": 80,
                        "z": "ws_GroupCode",
                        "wires": [],
                        "id": "gc_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    }
                ]
            }
        ]
    }
});
