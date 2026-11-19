// Test design for the export (see red/export/README.md, Tests).
// Included by index.html, it adds itself to the global TestDesigns list, listed in the menu (top right) under Test designs.
(globalThis.TestDesigns = globalThis.TestDesigns || []).push({
    name: "BusPortTests",
    description: "group ports with lanes (bus ports): a class group GStereo with 2 lanes in and out, an array pairs[2] of it, and a plain group where the ports split/join",
    design: {
        "version": 1,
        "settings": {
            "main": {},
            "arduino": {
                "ExportMode": "classes",
                "ProjectName": "BusPortTests",
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
                "id": "ws_BusPortMain",
                "label": "BusPortMain",
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
                        "x": 20,
                        "y": 60,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_join:0",
                                "bp_joinB:1"
                            ]
                        ],
                        "id": "bp_osc1",
                        "type": "AudioSynthWaveform",
                        "name": "osc1"
                    },
                    {
                        "comment": "",
                        "x": 20,
                        "y": 160,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_join:1",
                                "bp_joinB:0"
                            ]
                        ],
                        "id": "bp_osc2",
                        "type": "AudioSynthWaveform",
                        "name": "osc2"
                    },
                    {
                        "comment": "",
                        "x": 120,
                        "y": 95,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_st_in:0",
                                "bp_pl_in:0",
                                "bp_join2x2:0"
                            ]
                        ],
                        "id": "bp_join",
                        "type": "JunctionLR",
                        "name": "",
                        "inputs": 2,
                        "outputs": 1,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 180,
                        "y": 40,
                        "z": "ws_BusPortMain",
                        "wires": [],
                        "id": "bp_stereo",
                        "type": "group",
                        "name": "stereo",
                        "className": "GStereo",
                        "nodes": [
                            "bp_st_in",
                            "bp_st_out",
                            "bp_st_ampL",
                            "bp_st_ampR"
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
                        "w": 220,
                        "h": 120
                    },
                    {
                        "comment": "",
                        "x": 175,
                        "y": 87,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_st_ampL:0"
                            ],
                            [
                                "bp_st_ampR:0"
                            ]
                        ],
                        "id": "bp_st_in",
                        "type": "JunctionLR",
                        "name": "In1",
                        "ClassIOtype": 1,
                        "parentGroup": "bp_stereo",
                        "locked": true,
                        "size": 10,
                        "inputs": 1,
                        "outputs": 2
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 60,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_st_out:0"
                            ]
                        ],
                        "id": "bp_st_ampL",
                        "type": "AudioAmplifier",
                        "name": "ampL",
                        "parentGroup": "bp_stereo"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 120,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_st_out:1"
                            ]
                        ],
                        "id": "bp_st_ampR",
                        "type": "AudioAmplifier",
                        "name": "ampR",
                        "parentGroup": "bp_stereo"
                    },
                    {
                        "comment": "",
                        "x": 395,
                        "y": 87,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_i2s:0"
                            ]
                        ],
                        "id": "bp_st_out",
                        "type": "JunctionLR",
                        "name": "Out1",
                        "ClassIOtype": 0,
                        "parentGroup": "bp_stereo",
                        "locked": true,
                        "size": 10,
                        "inputs": 2,
                        "outputs": 1
                    },
                    {
                        "comment": "",
                        "x": 620,
                        "y": 90,
                        "z": "ws_BusPortMain",
                        "wires": [],
                        "id": "bp_i2s",
                        "type": "AudioOutputI2S",
                        "name": "i2s"
                    },
                    {
                        "comment": "",
                        "x": 80,
                        "y": 260,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_join2x2:1"
                            ]
                        ],
                        "id": "bp_joinB",
                        "type": "JunctionLR",
                        "name": "",
                        "inputs": 2,
                        "outputs": 1,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 130,
                        "y": 240,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_pairs:0"
                            ]
                        ],
                        "id": "bp_join2x2",
                        "type": "JunctionLR",
                        "name": "",
                        "inputs": 2,
                        "outputs": 1,
                        "size": 10
                    },
                    {
                        "comment": "",
                        "x": 200,
                        "y": 240,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_mix:0"
                            ]
                        ],
                        "id": "bp_pairs",
                        "type": "GStereo",
                        "name": "pairs",
                        "arraySize": 2
                    },
                    {
                        "comment": "",
                        "x": 180,
                        "y": 320,
                        "z": "ws_BusPortMain",
                        "wires": [],
                        "id": "bp_plain",
                        "type": "group",
                        "name": "plain",
                        "nodes": [
                            "bp_pl_in",
                            "bp_pl_out",
                            "bp_pl_a",
                            "bp_pl_b"
                        ],
                        "inputs": 1,
                        "outputs": 1,
                        "ioNodeSize": 10,
                        "ioNodeSpacing": 15,
                        "individualListBoxMode": false,
                        "border_color": "#999",
                        "color": "#ffffff",
                        "tag": "",
                        "textSize": 14,
                        "w": 220,
                        "h": 120
                    },
                    {
                        "comment": "",
                        "x": 175,
                        "y": 367,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_pl_a:0"
                            ],
                            [
                                "bp_pl_b:0"
                            ]
                        ],
                        "id": "bp_pl_in",
                        "type": "JunctionLR",
                        "name": "In1",
                        "ClassIOtype": 1,
                        "parentGroup": "bp_plain",
                        "locked": true,
                        "size": 10,
                        "inputs": 1,
                        "outputs": 2
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 340,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_pl_out:0"
                            ]
                        ],
                        "id": "bp_pl_a",
                        "type": "AudioAmplifier",
                        "name": "pA",
                        "parentGroup": "bp_plain"
                    },
                    {
                        "comment": "",
                        "x": 250,
                        "y": 400,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_pl_out:1"
                            ]
                        ],
                        "id": "bp_pl_b",
                        "type": "AudioAmplifier",
                        "name": "pB",
                        "parentGroup": "bp_plain"
                    },
                    {
                        "comment": "",
                        "x": 395,
                        "y": 367,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_mix:1"
                            ]
                        ],
                        "id": "bp_pl_out",
                        "type": "JunctionLR",
                        "name": "Out1",
                        "ClassIOtype": 0,
                        "parentGroup": "bp_plain",
                        "locked": true,
                        "size": 10,
                        "inputs": 2,
                        "outputs": 1
                    },
                    {
                        "comment": "",
                        "x": 480,
                        "y": 260,
                        "z": "ws_BusPortMain",
                        "wires": [
                            [
                                "bp_rms:0"
                            ]
                        ],
                        "id": "bp_mix",
                        "type": "AudioMixer",
                        "name": "outMix",
                        "inputs": 2
                    },
                    {
                        "comment": "",
                        "x": 620,
                        "y": 260,
                        "z": "ws_BusPortMain",
                        "wires": [],
                        "id": "bp_rms",
                        "type": "AudioAnalyzeRMS",
                        "name": "rms"
                    }
                ]
            }
        ]
    }
});
