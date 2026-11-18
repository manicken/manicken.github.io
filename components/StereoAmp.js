// Component. Included by index.html, it adds itself to the global ComponentDesigns list, listed in the menu (top right)
// under Components. Selecting it adds its tabs to the open design (red/design-merge.js), a class name that is taken is renamed.
// The lanes of a TabInput/TabOutput are its ports (one signal each), so StereoAmpChain joins them into a bus for
// StereoAmp, and splits the bus out of it again.
(globalThis.ComponentDesigns = globalThis.ComponentDesigns || []).push({
    name: "StereoAmp",
    label: "Stereo amp",
    description: "StereoAmp: a stereo amplifier with a 2 lane (bus) input and output,<br>and StereoAmpChain: two StereoAmp in a row",
    design: {
        "version": 1,
        "workspaces": [
            {"type":"tab","id":"cmp_sa_ws","label":"StereoAmp","inputs":0,"outputs":0,"export":true,"isMain":false,"mainNameType":"tabName","mainNameExt":".ino","isAudioMain":false,"generateCppDestructor":false,"extraClassDeclarations":"","settings":{"useCenterBasedPositions":false},"nodes":[
                {"comment":"","x":100,"y":85,"z":"cmp_sa_ws","wires":[["cmp_sa_ampL:0"],["cmp_sa_ampR:0"]],"id":"cmp_sa_in","type":"TabInput","name":"In","outputs":2},
                {"comment":"","x":250,"y":60,"z":"cmp_sa_ws","wires":[["cmp_sa_out:0"]],"id":"cmp_sa_ampL","type":"AudioAmplifier","name":"ampL"},                {"comment":"","x":250,"y":110,"z":"cmp_sa_ws","wires":[["cmp_sa_out:1"]],"id":"cmp_sa_ampR","type":"AudioAmplifier","name":"ampR"},
                {"comment":"","x":400,"y":85,"z":"cmp_sa_ws","wires":[],"id":"cmp_sa_out","type":"TabOutput","name":"Out","inputs":2}
            ]},
            {"type":"tab","id":"cmp_sc_ws","label":"StereoAmpChain","inputs":0,"outputs":0,"export":true,"isMain":false,"mainNameType":"tabName","mainNameExt":".ino","isAudioMain":false,"generateCppDestructor":false,"extraClassDeclarations":"","settings":{"useCenterBasedPositions":false},"nodes":[
                {"comment":"","x":100,"y":85,"z":"cmp_sc_ws","wires":[["cmp_sc_join:0"],["cmp_sc_join:1"]],"id":"cmp_sc_in","type":"TabInput","name":"In","outputs":2},
                {"comment":"","x":170,"y":85,"z":"cmp_sc_ws","wires":[["cmp_sc_a:0"]],"id":"cmp_sc_join","type":"JunctionLR","name":"","inputs":2,"outputs":1,"size":10},
                {"comment":"","x":230,"y":85,"z":"cmp_sc_ws","wires":[["cmp_sc_b:0"]],"id":"cmp_sc_a","type":"StereoAmp","name":"first"},
                {"comment":"","x":360,"y":85,"z":"cmp_sc_ws","wires":[["cmp_sc_split:0"]],"id":"cmp_sc_b","type":"StereoAmp","name":"second"},
                {"comment":"","x":440,"y":85,"z":"cmp_sc_ws","wires":[["cmp_sc_out:0"],["cmp_sc_out:1"]],"id":"cmp_sc_split","type":"JunctionLR","name":"","inputs":1,"outputs":2,"size":10},
                {"comment":"","x":500,"y":85,"z":"cmp_sc_ws","wires":[],"id":"cmp_sc_out","type":"TabOutput","name":"Out","inputs":2}
            ]}
        ]
    }
});
