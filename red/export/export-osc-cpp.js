/**
 * Generates C++ code for h4yn0nnym0u5e's OSCAudio library from a ResolvedWorkspace (Export Modes 'osc_simple_cpp'
 * and 'osc_class_cpp'), see export-osc.js for the OSC tree (names, groups, connection names).
 *
 * The same layouts as export-cpp.js, but every object gets its OSC name and its OSC group:
 *   writeFlatFile    - the (flattened) current workspace as global objects (osc_simple_cpp)
 *   writeClass       - a workspace as a class that is an OSC group (class X : public OSCAudioGroup), and
 *                      writeClassSource for its .cpp file (osc_class_cpp)
 *   writeMainFile    - the main workspace (.ino/.cpp) as global objects (osc_class_cpp)
 *
 * Global objects (at the root of the OSC tree):
 *   OSCAudioSynthWaveform  osc{"osc"};
 *   OSCAudioGroup          oscs_group{"oscs"};                             // the OSC group of an array
 *   OSCAudioSynthWaveform  oscs[2]{{"i0", oscs_group}, {"i1", oscs_group}};
 *   Voice                  voices[2]{{"i0", &voices_group}, {"i1", &voices_group}};
 *   OSCAudioConnection     patchCord1{"osc_0_mixer_0", osc, 0, mixer, 0};
 * Inside a class everything is created with new, as an OSC group deletes its members when it's deleted:
 *   OSCAudioSynthWaveform& osc;      initialized with  osc(*new OSCAudioSynthWaveform{"osc", *this})
 *   OSCAudioSynthWaveform* oscs[2];  created in the constructor in the OSC group "oscs" (elements "i0", "i1")
 *   OSCAudioConnection*    patchCord[N];  patchCord[pci++] = new OSCAudioConnection{"osc_0_mixer_0", *this, osc, 0, mixer, 0};
 * A class have two constructors: X(const char* _name, OSCAudioGroup* parent) and the root one X(const char* _name),
 * the code that uses the class creates the top instance (i.e. SynthMain synth{"synth"};).
 *
 * note. AudioMixer/AudioMixerStereo (any number of inputs) and the constructor values of AudioEffectDelayExternal
 * only exists in the Dynamic Audio Objects library.
 */
RED.exporter.oscCpp = (function () {
    'use strict';

    const graph = RED.exporter.graph;
    const osc = RED.exporter.osc;
    const cpp = RED.exporter.cpp;

    // ******************************************************************
    // names
    // ******************************************************************

    /**
     * @param {ResolvedObject} obj
     * @param {Boolean} flat true for a flattened workspace (the flat name, i.e. voices_0_env)
     * @returns {String} the C++ name without the array part, it's also the OSC name
     */
    function getName(obj, flat) {
        if (flat && obj.classPath.length != 0) return RED.exporter.flatten.getFlatName(obj.classPath, obj.node);
        return graph.getBaseName(obj.node);
    }

    /** @param {ResolvedObject} obj @returns {Boolean} true for objects that are part of the OSC tree (OSC objects and class instances) */
    function isOscObject(obj) {
        return obj.isClass || osc.hasOscVersion(obj.typeName);
    }

    /**
     * The constructor arguments of an OSC object (not a class instance)
     * @param {ResolvedObject} obj
     * @param {String} nameArg the OSC name as C++, i.e. "\"osc\"" or "elementName"
     * @param {String|undefined} groupArg the OSC group as C++ (a reference for objects, a pointer for class instances), undefined at the root
     * @returns {String} i.e. "\"osc\"" or "\"i0\", oscs_group, 4"
     */
    function getConstructorArgs(obj, nameArg, groupArg) {
        const args = [nameArg];
        if (groupArg != undefined) args.push(groupArg);
        if (obj.isClass == false) {
            if (obj.dynInputCount != undefined) args.push(String(obj.dynInputCount)); // AudioMixer, AudioMixerStereo
            args.push(...osc.getConstructorValues(obj).values.map(String));
        }
        return args.join(", ");
    }

    /**
     * @param {ResolvedEndpoint} endpoint
     * @param {Boolean} atGlobalScope true: the first step is a global object (arrays are object arrays),
     *                                false: the first step is a class member (arrays are pointer arrays, objects are references)
     * @param {Boolean} flat true for a flattened workspace
     * @returns {String} the object as an OSCAudioBase reference, i.e. osc, oscs[2], voices[1].env, *voices[1].oscs[2], filts[0]->amp
     */
    function getEndpointExpression(endpoint, atGlobalScope, flat) {
        const path = endpoint.path;
        const leaf = path[path.length - 1];
        if (flat) return RED.exporter.flatten.getFlatName(path.slice(0, -1), leaf.node) + ((leaf.index != undefined) ? ("[" + leaf.index + "]") : "");
        let expression = "";
        for (let i = 0; i < path.length; i++) {
            const step = path[i];
            const isPointer = (step.index != undefined) && (atGlobalScope == false || i != 0); // inside a class an array is pointers
            const part = graph.getBaseName(step.node) + ((step.index != undefined) ? ("[" + step.index + "]") : "");
            if (i < path.length - 1) expression += part + (isPointer ? "->" : ".");
            else expression = (isPointer ? "*" : "") + expression + part;
        }
        return expression;
    }

    // ******************************************************************
    // global objects (the root of the OSC tree)
    // ******************************************************************

    /**
     * @param {CodeWriter} w
     * @param {String} title
     * @param {ResolvedObject[]} objects
     * @param {Boolean} flat
     * @param {CppOptions} options
     */
    function writeGlobalObjects(w, title, objects, flat, options) {
        if (objects.length == 0) return;
        const typeWidth = Math.max(options.minTypeWidth, "OSCAudioGroup".length, ...objects.map(function (o) { return osc.getOscTypeName(o).length; })) + 1;
        w.line("// " + title);
        for (const obj of objects) {
            const type = osc.getOscTypeName(obj).padEnd(typeWidth, " ");
            const name = getName(obj, flat);
            if (isOscObject(obj) == false) { // a control object without an OSC version
                w.line(type + name + ((obj.arrayLength != 0) ? ("[" + obj.arrayLength + "]") : "") + "; // not an OSC object");
                continue;
            }
            if (obj.arrayLength == 0) {
                w.line(type + name + "{" + getConstructorArgs(obj, '"' + name + '"', undefined) + "};");
                continue;
            }
            const groupName = name + "_group";
            w.line("OSCAudioGroup".padEnd(typeWidth, " ") + groupName + '{"' + name + '"}; // the OSC group of the array ' + name);
            const elements = [];
            for (let i = 0; i < obj.arrayLength; i++) {
                elements.push("{" + getConstructorArgs(obj, '"' + osc.getElementName(i) + '"', obj.isClass ? ("&" + groupName) : groupName) + "}");
            }
            w.line(type + name + "[" + obj.arrayLength + "]{" + elements.join(", ") + "};");
        }
        w.blank();
    }

    /**
     * @param {CodeWriter} w
     * @param {ResolvedConnection[]} connections
     * @param {Boolean} flat
     * @param {CppOptions} options
     */
    function writeGlobalConnections(w, connections, flat, options) {
        if (connections.length == 0) return;
        const typeWidth = Math.max(options.minTypeWidth, "OSCAudioConnection".length) + 1;
        w.line("// Audio connections");
        for (let i = 0; i < connections.length; i++) {
            const c = connections[i];
            w.line("OSCAudioConnection".padEnd(typeWidth, " ") + "patchCord" + (i + 1) + '{"' + osc.getConnectionName(c, flat) + '", ' +
                getEndpointExpression(c.source, true, flat) + ", " + c.source.port + ", " + getEndpointExpression(c.target, true, flat) + ", " + c.target.port + "};");
        }
        w.blank();
    }

    /**
     * The (flattened) workspace as global objects (Export Mode 'osc_simple_cpp')
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String}
     */
    function writeFlatFile(rws, options) {
        const w = new CodeWriter(options.indent);
        cpp.writeConstants(w, rws.userCode, true);
        writeGlobalObjects(w, "Audio objects", rws.audioObjects, true, options);
        writeGlobalConnections(w, rws.connections, true, options);
        cpp.writeProblems(w, rws.warnings);
        writeGlobalObjects(w, "Control objects", rws.controlObjects, true, options);
        cpp.writeUserCode(w, rws.userCode.variables);
        cpp.writeUserCode(w, rws.userCode.functions);
        return w.toString();
    }

    /**
     * The main workspace (.ino/.cpp) as global objects (Export Mode 'osc_class_cpp')
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String}
     */
    function writeMainFile(rws, options) {
        const w = new CodeWriter(options.indent);
        cpp.writeClassComment(w, rws.userCode);
        cpp.writeConstants(w, rws.userCode, false);
        cpp.writeUserCode(w, rws.userCode.variables);
        writeGlobalObjects(w, "Audio objects", rws.audioObjects, false, options);
        writeGlobalConnections(w, rws.connections, false, options);
        cpp.writeProblems(w, rws.warnings);
        writeGlobalObjects(w, "Control objects", rws.controlObjects, false, options);
        cpp.writeUserCode(w, rws.userCode.functions);
        return w.toString();
    }

    // ******************************************************************
    // classes (OSC groups)
    // ******************************************************************

    /**
     * The workspace as a class that is an OSC group (Export Mode 'osc_class_cpp').
     * With options.splitClassFiles the constructor and destructor are only declared in the class,
     * and defined in the source (the .cpp file), see writeClassSource.
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String} the class (the .h file)
     */
    function writeClass(rws, options) {
        const part = options.splitClassFiles ? "declaration" : "inline";
        const w = new CodeWriter(options.indent);
        const code = rws.userCode;

        cpp.writeClassComment(w, code);
        w.line(("class " + rws.name + " : public OSCAudioGroup " + (rws.ws.extraClassDeclarations || "")).trim());
        w.line("{");
        w.line("public:");
        w.indent();

        cpp.writeConstants(w, code, false);
        cpp.writeUserCode(w, code.variables);
        writeMembers(w, "Audio objects", rws.audioObjects, options);
        writeMembers(w, "Control objects", rws.controlObjects, options);
        if (rws.connections.length != 0) {
            const typeWidth = Math.max(options.minTypeWidth, "OSCAudioConnection".length) + 1;
            w.line("OSCAudioConnection*".padEnd(typeWidth, " ") + "patchCord[" + rws.connections.length + "];");
        }
        for (const pa of code.pointerArrays) {
            w.line(pa.type.padEnd(options.minTypeWidth + 1, " ") + "*" + pa.name + "; // pointer array");
        }
        w.blank();

        writeConstructor(w, rws, options, part);
        w.line(rws.name + "(const char* _name) : " + rws.name + "(_name, NULL) {} // constructor at the root of the OSC tree");
        w.blank();
        writeDestructor(w, rws, part);
        cpp.writeUserCode(w, code.functions);

        w.endBlock("};" + (options.endOfClassComment ? (" // end of class " + rws.name) : ""));
        cpp.writeUserCode(w, code.endOfFileCode);
        return w.toString();
    }

    /**
     * The definitions of the constructor and destructor of a class (the .cpp file), only used with options.splitClassFiles.
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String}
     */
    function writeClassSource(rws, options) {
        const w = new CodeWriter(options.indent);
        writeConstructor(w, rws, options, "definition");
        writeDestructor(w, rws, "definition");
        return w.toString();
    }

    /**
     * The class members: references for objects and class instances, pointers for arrays (all are created with new)
     * @param {CodeWriter} w
     * @param {String} title
     * @param {ResolvedObject[]} objects
     * @param {CppOptions} options
     */
    function writeMembers(w, title, objects, options) {
        if (objects.length == 0) return;
        const typeWidth = Math.max(options.minTypeWidth, ...objects.map(function (o) { return osc.getOscTypeName(o).length + 1; })) + 1;
        w.line("// " + title);
        for (const obj of objects) {
            const name = getName(obj, false);
            const type = osc.getOscTypeName(obj);
            let line;
            if (isOscObject(obj) == false) line = type.padEnd(typeWidth, " ") + name + ((obj.arrayLength != 0) ? ("[" + obj.arrayLength + "]") : "") + "; // not an OSC object";
            else if (obj.arrayLength != 0) line = (type + "*").padEnd(typeWidth, " ") + name + "[" + obj.arrayLength + "]; // the elements are in the OSC group " + name;
            else line = (type + "&").padEnd(typeWidth, " ") + name + ";";
            const comment = (obj.node.comment != undefined) ? obj.node.comment.trim().replace(/\s*\n\s*/g, " ") : "";
            if (comment.length != 0) line += " // " + comment;
            w.line(line);
        }
        w.blank();
    }

    /**
     * @param {CodeWriter} w
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @param {"inline"|"declaration"|"definition"} part see export-cpp.js writeConstructor
     */
    function writeConstructor(w, rws, options, part) {
        const className = rws.name;
        const signature = className + "(const char* _name, OSCAudioGroup* parent)";
        if (part == "declaration") {
            w.line(signature + "; // constructor (this is called when the class-object is created), see " + className + ".cpp");
            return;
        }
        const objects = [...rws.audioObjects, ...rws.controlObjects].filter(isOscObject);
        const initializers = ["OSCAudioGroup(_name, parent)"];
        for (const obj of objects) {
            if (obj.arrayLength != 0) continue;
            const name = getName(obj, false);
            const groupArg = obj.isClass ? "this" : "*this";
            initializers.push(name + "(*new " + osc.getOscTypeName(obj) + "{" + getConstructorArgs(obj, '"' + name + '"', groupArg) + "})");
        }
        w.line(((part == "definition") ? (className + "::") : "") + signature + " : // constructor (this is called when the class-object is created)");
        w.indent();
        w.indent();
        for (let i = 0; i < initializers.length; i++) w.line(initializers[i] + ((i < initializers.length - 1) ? "," : ""));
        w.dedent();
        w.dedent();
        w.line("{");
        w.indent();

        const arrays = objects.filter(function (obj) { return obj.arrayLength != 0; });
        if (arrays.length != 0) {
            w.line("char elementName[12]; // the OSC names of the array elements: i0, i1 ...");
            w.line("OSCAudioGroup* arrayGroup; // the OSC group of an array");
            for (const obj of arrays) {
                const name = getName(obj, false);
                const groupArg = obj.isClass ? "arrayGroup" : "*arrayGroup";
                w.line("arrayGroup = new OSCAudioGroup{\"" + name + "\", this};");
                w.line("for (int i = 0; i < " + obj.arrayLength + "; i++) {");
                w.indent();
                w.line('sprintf(elementName, "' + osc.getElementName("%d") + '", i);');
                w.line(name + "[i] = new " + osc.getOscTypeName(obj) + "{" + getConstructorArgs(obj, "elementName", groupArg) + "};");
                w.endBlock("}");
            }
            w.blank();
        }
        for (const pa of rws.userCode.pointerArrays) {
            w.line(pa.name + " = new " + pa.type + "[" + pa.items.split(",").length + "]" + pa.items + "; // pointer array");
        }
        if (rws.connections.length != 0) {
            w.line("int pci = 0; // used only for adding new patchcords");
            for (const c of rws.connections) {
                w.line("patchCord[pci++] = new OSCAudioConnection{\"" + osc.getConnectionName(c, false) + "\", *this, " +
                    getEndpointExpression(c.source, false, false) + ", " + c.source.port + ", " + getEndpointExpression(c.target, false, false) + ", " + c.target.port + "};");
            }
        }
        w.blank();
        cpp.writeProblems(w, rws.warnings);
        cpp.writeUserCode(w, rws.userCode.constructorCode);
        w.endBlock("}");
        w.blank();
    }

    /**
     * Only the user destructor code, the members (and the connections to them) are deleted by the OSC group.
     * @param {CodeWriter} w
     * @param {ResolvedWorkspace} rws
     * @param {"inline"|"declaration"|"definition"} part
     */
    function writeDestructor(w, rws, part) {
        if (rws.ws.generateCppDestructor != true) return;
        if (part == "declaration") {
            w.line("~" + rws.name + "(); // destructor (the members are deleted by the OSC group), see " + rws.name + ".cpp");
            w.blank();
            return;
        }
        w.line(((part == "definition") ? (rws.name + "::") : "") + "~" + rws.name + "() { // destructor (the members are deleted by the OSC group)");
        w.indent();
        cpp.writeUserCode(w, rws.userCode.destructorCode);
        w.endBlock("}");
        w.blank();
    }

    return {
        writeFlatFile,
        writeMainFile,
        writeClass,
        writeClassSource,
        getEndpointExpression,
    };
})();
