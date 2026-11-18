// Example design. Included by index.html, it adds itself to the global ExampleDesigns list,
// listed in the menu (top right) under Examples, in the order the files are included.
(globalThis.ExampleDesigns = globalThis.ExampleDesigns || []).push({
    name: "SimpleNonAudioExample",
    label: "Non-Audio Example",
    description: "this is just a simple example, to show that non audio projects can also be created using this tool",
    dividerAfter: true,
    design: {
        "version": 1,
        "settings": {"arduino":{"IOcheckAtExport":false,"ProjectName":"SimpleNonAudioExample","StandardIncludeHeader":"#include <Arduino.h>\n","Board":{"Platform":"","Board":"","Options":""}},"BiDirDataWebSocketBridge":{},"workspaces":{},"sidebar":{},"palette":{},"editor":{},"devTest":{},"IndexedDBfiles":{"testFileNames":"testFile.txt"},"NodeDefGenerator":{},"NodeDefManager":{},"NodeHelpManager":{},"OSC":{}},
        "workspaces": [
            {"type":"tab","id":"8dccf7a3.129388","label":"MyMathClass","inputs":0,"outputs":0,"export":true,"isMain":false,"mainNameType":"tabName","mainNameExt":".ino","generateCppDestructor":false,"extraClassDeclarations":"","settings":{},"nodes":[
                {"id":"ClassA_code1","type":"Function","name":"begin function","comment":"void begin()\n{\n    // do some initiations here\n}\n","x":165,"y":85,"z":"8dccf7a3.129388","bgColor":"#DDFFBB","wires":[]},
                {"id":"ClassA_code2","type":"Function","name":"sum function","comment":"\nint sum(int a, int b) {\n    return a + b;\n}","x":160,"y":130,"z":"8dccf7a3.129388","bgColor":"#DDFFBB","wires":[]},
                {"id":"ClassA_code3","type":"Function","name":"subtract function","comment":"\nint subtract(int a, int b) {\n    return a - b;\n}","x":175,"y":175,"z":"8dccf7a3.129388","bgColor":"#DDFFBB","wires":[]}
            ]},
            {"type":"tab","id":"Main","label":"main.cpp","inputs":0,"outputs":0,"export":true,"isMain":false,"mainNameType":"tabName","mainNameExt":".ino","generateCppDestructor":false,"extraClassDeclarations":"","settings":{},"nodes":[
                {"id":"Main_MyMathClass_1","type":"MyMathClass","name":"myMath","x":150,"y":80,"z":"Main","bgColor":"#CCFFCC","wires":[]},
                {"id":"main.cpp_code1","type":"Function","name":"main code","comment":"\nvoid setup() {\n    myMath.begin();\n}\n\nvoid update() {\n    myMath.sum(1,2);\n}","x":155,"y":130,"z":"Main","bgColor":"#DDFFBB","wires":[]}
            ]}
        ],
        "nodeAddons": {}
    }
});
