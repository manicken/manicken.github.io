/**
 * Generates C++ code from a ResolvedWorkspace (see the model/ folder).
 *
 * This file only decides how the code looks, all decisions about
 * what is connected to what are already made in export-resolve.js.
 *
 * Four layouts:
 *   writeClassicFile     - the current workspace as global objects (Export Modes 'classic' and 'flatclassic')
 *   writeHelperClass     - the current (flattened) workspace as one helper class with one instance (Export Mode 'flathelper')
 *   writeClass           - a workspace as a C++ class, and writeClassSource for its .cpp file (Export Mode 'classes')
 *   writeMainFile        - the main workspace (.ino/.cpp) as global objects (Export Mode 'classes')
 */
RED.exporter.cpp = (function () {
    'use strict';

    const graph = RED.exporter.graph;

    /** the name of the one instance of the helper class (Export Mode 'flathelper') */
    const HELPER_INSTANCE_NAME = "design";

    /**
     * @typedef {Object} CppOptions
     * @property {Number} indent number of spaces per indentation level
     * @property {Boolean} useMixerTemplate true: AudioMixer<8>, false: AudioMixer8
     * @property {Boolean} dynamicConnections true: AudioConnection patchCord[N] + connect(), false: AudioConnection *patchCord[N] + new
     * @property {Number} minTypeWidth the type names are padded to at least this width
     * @property {Boolean} endOfClassComment adds a "// end of class X" comment
     * @property {Boolean} flattenClasses true: a path through class instances is written as a flat name, voices[2].env -> voices_2_env
     *                                   (used with RED.exporter.flatten, Export Modes 'flatclassic' and 'flathelper')
     * @property {Boolean} splitClassFiles true: a class is written as a .h file (declarations) and a .cpp file (constructor/destructor
     *                                    definitions, global instances), false: everything in the .h file
     */
    /** @returns {CppOptions} */
    function getDefaultOptions() {
        return {
            indent: 4,
            useMixerTemplate: false,
            dynamicConnections: true,
            minTypeWidth: 32,
            endOfClassComment: true,
            flattenClasses: false,
            splitClassFiles: true,
        };
    }

    // ******************************************************************
    // names
    // ******************************************************************

    /**
     * @param {ResolvedObject} obj
     * @param {CppOptions} options
     * @returns {String} for example AudioSynthWaveform, AudioMixer8 or AudioMixer<8>
     */
    function getTypeName(obj, options) {
        if (obj.typeName == undefined || obj.typeName.length == 0)
            return "/* type not set */"; // AudioStreamObject without subType
        if (obj.dynInputCount == undefined)
            return obj.typeName;
        if (options.useMixerTemplate)
            return obj.typeName + "<" + obj.dynInputCount + ">";
        return obj.typeName + obj.dynInputCount;
    }

    /**
     * the name as the user wrote it, keeps a constant in the array size, i.e. osc[NUM],
     * a name without an array part gets the 'Array Size' setting (see graph.getArrayInfo), i.e. osc + 4 gives osc[4],
     * for a flattened object (inside class instances) the flat name, i.e. voices_2_osc[3]
     * @param {ResolvedObject} obj
     */
    function getDeclarationName(obj) {
        const arrayPart = (obj.arrayLength != 0) ? ("[" + obj.arrayLength + "]") : "";
        if (obj.classPath.length != 0) // the constant used for the size is inside the class, so the size is used
            return RED.exporter.flatten.getFlatName(obj.classPath, obj.node) + arrayPart;
        const name = obj.node.name ? obj.node.name : obj.node.id;
        return name.includes("[") ? name : (name + arrayPart);
    }

    /**
     * @param {ResolvedEndpoint} endpoint
     * @param {CppOptions} options
     * @returns {String} for example voice[2].env, or voice_2_env when flattening classes
     */
    function getEndpointText(endpoint, options) {
        const leaf = endpoint.path[endpoint.path.length - 1];
        const leafIndex = (leaf.index != undefined) ? ("[" + leaf.index + "]") : "";
        if (options.flattenClasses)
            return RED.exporter.flatten.getFlatName(endpoint.path.slice(0, -1), leaf.node) + leafIndex;
        return endpoint.path.map(function (step) {
            return graph.getBaseName(step.node) + ((step.index != undefined) ? ("[" + step.index + "]") : "");
        }).join(".");
    }

    /** @param {ResolvedConnection} c @param {CppOptions} options */
    function getConnectionArgs(c, options) {
        return getEndpointText(c.source, options) + ", " + c.source.port + ", " + getEndpointText(c.target, options) + ", " + c.target.port;
    }


    // ******************************************************************
    // parts
    // ******************************************************************

    /**
     * @param {CodeWriter} w
     * @param {String} title
     * @param {ResolvedObject[]} objects
     * @param {CppOptions} options
     */
    function writeDeclarations(w, title, objects, options) {
        if (objects.length == 0) return;
        const typeWidth = Math.max(options.minTypeWidth, ...objects.map(function (o) { return getTypeName(o, options).length; })) + 1;
        w.line("// " + title);
        for (const obj of objects) {
            let line = getTypeName(obj, options).padEnd(typeWidth, " ") + getDeclarationName(obj) + ";";
            const comment = (obj.node.comment != undefined) ? obj.node.comment.trim().replace(/\s*\n\s*/g, " ") : "";
            if (comment.length != 0) line += " // " + comment;
            w.line(line);
        }
        w.blank();
    }

    /**
     * @param {CodeWriter} w
     * @param {ResolvedProblem[]} problems the warnings (the export is stopped when there are errors)
     */
    function writeProblems(w, problems) {
        if (problems.length == 0) return;
        w.line("// export warnings (see the export documentation):");
        for (const p of problems) {
            w.line("//   " + p.text + ((p.link != undefined) ? ("  (wire " + graph.describeLink(p.link) + ")") : ""));
        }
        w.blank();
    }

    /**
     * @param {CodeWriter} w
     * @param {ResolvedUserCode} code
     * @param {Boolean} useDefines true: #define NAME VALUE, false: const static TYPE NAME = VALUE;
     */
    function writeConstants(w, code, useDefines) {
        for (const c of code.constants) {
            if (useDefines) w.line("#define " + c.name + " " + c.value);
            else w.line("const static " + c.type + " " + c.name + " = " + c.value + ";");
        }
        if (code.constants.length != 0) w.blank();
    }

    /** @param {CodeWriter} w @param {String[]} texts */
    function writeUserCode(w, texts) {
        for (const t of texts) {
            if (t == undefined || t.trim().length == 0) continue;
            w.text(t);
            w.blank();
        }
    }

    /**
     * Global AudioConnection objects, i.e. AudioConnection patchCord1(a, 0, b, 0);
     * @param {CodeWriter} w
     * @param {ResolvedConnection[]} connections
     * @param {CppOptions} options
     */
    function writeGlobalConnections(w, connections, options) {
        if (connections.length == 0) return;
        const typeWidth = Math.max(options.minTypeWidth, "AudioConnection".length) + 1;
        w.line("// Audio connections");
        for (let i = 0; i < connections.length; i++) {
            w.line("AudioConnection".padEnd(typeWidth, " ") + "patchCord" + (i + 1) + "(" + getConnectionArgs(connections[i], options) + ");");
        }
        w.blank();
    }

    // ******************************************************************
    // complete layouts
    // ******************************************************************

    /**
     * The workspace as global objects, used by the Export Mode 'classic'
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String}
     */
    function writeClassicFile(rws, options) {
        const w = new CodeWriter(options.indent);
        writeConstants(w, rws.userCode, true);
        writeDeclarations(w, "Audio objects", rws.audioObjects, options);
        writeGlobalConnections(w, rws.connections, options);
        writeProblems(w, rws.warnings);
        writeDeclarations(w, "Control objects", rws.controlObjects, options);
        writeUserCode(w, rws.userCode.variables);
        writeUserCode(w, rws.userCode.functions);
        return w.toString();
    }

    /**
     * The (flattened) workspace as one helper class that contains all objects and makes the connections
     * in its constructor, with one instance (HELPER_INSTANCE_NAME), used by the Export Mode 'flathelper'.
     * The code of the workspace stays outside of the class, so it uses the objects through the instance (design.amp).
     *
     * With options.splitClassFiles the helper class is written as three texts:
     *   header - the class with the constructor declared and 'extern <Class> design;'  -> <Tab>Design.h
     *   source - the constructor and the instance 'design'                              -> <Tab>Design.cpp
     *   code   - the code of the workspace                                              -> the tab file
     * otherwise everything is in 'header' and the others are empty.
     * @param {ResolvedWorkspace} rws a flattened workspace (RED.exporter.flatten)
     * @param {CppOptions} options
     * @returns {{header:String, source:String, code:String}}
     */
    function writeHelperClass(rws, options) {
        const code = rws.userCode;
        const className = getHelperClassName(rws);
        const typeWidth = Math.max(options.minTypeWidth, "AudioConnection".length) + 1;
        const split = options.splitClassFiles;
        const instanceComment = " // all audio objects and connections of the design";

        const h = new CodeWriter(options.indent);
        writeConstants(h, code, true); // before the class, as they can be used for array sizes
        writeClassComment(h, code);
        h.line("class " + className);
        h.line("{");
        h.line("public:");
        h.indent();
        writeDeclarations(h, "Audio objects", rws.audioObjects, options);
        writeDeclarations(h, "Control objects", rws.controlObjects, options);
        if (rws.connections.length != 0)
            h.line("AudioConnection".padEnd(typeWidth, " ") + (options.dynamicConnections ? "" : "*") + "patchCord[" + rws.connections.length + "];");
        h.blank();
        writeConstructor(h, rws, options, className, split ? "declaration" : "inline", true);
        h.endBlock("};");
        if (split) h.line("extern " + className + " " + HELPER_INSTANCE_NAME + ";" + instanceComment + " (see " + className + ".cpp)");
        else h.line(className.padEnd(typeWidth, " ") + HELPER_INSTANCE_NAME + ";" + instanceComment);

        const s = new CodeWriter(options.indent);
        if (split) {
            writeConstructor(s, rws, options, className, "definition", true);
            s.line(className.padEnd(typeWidth, " ") + HELPER_INSTANCE_NAME + ";" + instanceComment);
        }

        const c = split ? new CodeWriter(options.indent) : h;
        c.blank();
        writeUserCode(c, code.variables);
        writeUserCode(c, code.functions);

        return { header: h.toString(), source: s.toString(), code: split ? c.toString() : "" };
    }

    /** @param {ResolvedWorkspace} rws @returns {String} the name of the helper class (Export Mode 'flathelper') */
    function getHelperClassName(rws) {
        return rws.name + "Design";
    }

    /**
     * The main workspace (.ino/.cpp), used by the Export Mode 'classes'
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String}
     */
    function writeMainFile(rws, options) {
        const w = new CodeWriter(options.indent);
        writeClassComment(w, rws.userCode);
        writeConstants(w, rws.userCode, false);
        writeUserCode(w, rws.userCode.variables);
        writeDeclarations(w, "Audio objects", rws.audioObjects, options);
        writeGlobalConnections(w, rws.connections, options);
        writeProblems(w, rws.warnings);
        writeDeclarations(w, "Control objects", rws.controlObjects, options);
        writeUserCode(w, rws.userCode.functions);
        return w.toString();
    }

    /**
     * The workspace as a class, used by the Export Mode 'classes'.
     * With options.splitClassFiles the constructor and destructor are only declared in the class,
     * and defined in the source (the .cpp file), see writeClassSource.
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String} the class (the .h file)
     */
    function writeClass(rws, options) {
        const part = options.splitClassFiles ? "declaration" : "inline";
        const w = new CodeWriter(options.indent);
        const ws = rws.ws;
        const code = rws.userCode;
        const patchCordCount = rws.connections.length;

        writeClassComment(w, code);
        w.line(("class " + rws.name + " " + (ws.extraClassDeclarations || "")).trim());
        w.line("{");
        w.line("public:");
        w.indent();

        writeConstants(w, code, false);
        writeUserCode(w, code.variables);
        writeDeclarations(w, "Audio objects", rws.audioObjects, options);
        writeDeclarations(w, "Control objects", rws.controlObjects, options);
        if (patchCordCount != 0) {
            const typeWidth = Math.max(options.minTypeWidth, "AudioConnection".length) + 1;
            w.line("AudioConnection".padEnd(typeWidth, " ") + (options.dynamicConnections ? "" : "*") + "patchCord[" + patchCordCount + "];");
        }
        for (const pa of code.pointerArrays) {
            w.line(pa.type.padEnd(options.minTypeWidth + 1, " ") + "*" + pa.name + "; // pointer array");
        }
        w.blank();

        writeConstructor(w, rws, options, rws.name, part, false);
        writeDestructor(w, rws, options, part);
        writeUserCode(w, code.functions); // the user code is written for the class body, so it stays there (it's implicitly inline)

        w.endBlock("};" + (options.endOfClassComment ? (" // end of class " + rws.name) : ""));
        writeUserCode(w, code.endOfFileCode);
        return w.toString();
    }

    /**
     * The definitions of the constructor and destructor of a class (the .cpp file),
     * only used with options.splitClassFiles.
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @returns {String} empty when the class have no constructor or destructor
     */
    function writeClassSource(rws, options) {
        const w = new CodeWriter(options.indent);
        writeConstructor(w, rws, options, rws.name, "definition", false);
        writeDestructor(w, rws, options, "definition");
        return w.toString();
    }

    /** @param {CodeWriter} w @param {ResolvedUserCode} code */
    function writeClassComment(w, code) {
        if (code.classComments.length == 0) return;
        w.line("/**");
        for (const c of code.classComments) w.line(" * " + c);
        w.line(" */");
    }

    /**
     * @param {CodeWriter} w
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @param {String} className
     * @param {"inline"|"declaration"|"definition"} part
     *     inline      - the whole constructor inside the class (header only)
     *     declaration - only 'Class();' inside the class (the .h file)
     *     definition  - 'Class::Class() {...}' outside of the class (the .cpp file)
     * @param {Boolean} always true: write the constructor even if it's empty (the helper class always have one)
     */
    function writeConstructor(w, rws, options, className, part, always) {
        const code = rws.userCode;
        const hasCode = code.constructorCode.some(function (c) { return c != undefined && c.trim().length != 0; });
        if (always == false && rws.connections.length == 0 && code.pointerArrays.length == 0 && rws.warnings.length == 0 && hasCode == false) return;

        if (part == "declaration") {
            w.line(className + "(); // constructor (this is called when the class-object is created), see " + className + ".cpp");
            w.blank();
            return;
        }
        w.line(((part == "definition") ? (className + "::") : "") + className + "() { // constructor (this is called when the class-object is created)");
        w.indent();
        for (const pa of code.pointerArrays) {
            w.line(pa.name + " = new " + pa.type + "[" + pa.items.split(",").length + "]" + pa.items + "; // pointer array");
        }
        if (rws.connections.length != 0) {
            w.line("int pci = 0; // used only for adding new patchcords");
            for (const c of rws.connections) {
                if (options.dynamicConnections) w.line("patchCord[pci++].connect(" + getConnectionArgs(c, options) + ");");
                else w.line("patchCord[pci++] = new AudioConnection(" + getConnectionArgs(c, options) + ");");
            }
        }
        w.blank();
        writeProblems(w, rws.warnings);
        writeUserCode(w, code.constructorCode);
        w.endBlock("}");
        w.blank();
    }

    /**
     * @param {CodeWriter} w
     * @param {ResolvedWorkspace} rws
     * @param {CppOptions} options
     * @param {"inline"|"declaration"|"definition"} part see writeConstructor
     */
    function writeDestructor(w, rws, options, part) {
        if (rws.ws.generateCppDestructor != true) return;
        if (part == "declaration") {
            w.line("~" + rws.name + "(); // destructor (this is called when the class-object is deleted), see " + rws.name + ".cpp");
            w.blank();
            return;
        }
        w.line(((part == "definition") ? (rws.name + "::") : "") + "~" + rws.name + "() { // destructor (this is called when the class-object is deleted)");
        w.indent();
        // with dynamicConnections the patchCords are members and are disconnected by their own destructor
        if (options.dynamicConnections == false && rws.connections.length != 0) {
            w.line("for (int i = 0; i < " + rws.connections.length + "; i++) {");
            w.indent();
            w.line("patchCord[i]->disconnect();");
            w.line("delete patchCord[i];");
            w.dedent();
            w.line("}");
        }
        writeUserCode(w, rws.userCode.destructorCode);
        w.endBlock("}");
        w.blank();
    }

    return {
        getDefaultOptions,
        getTypeName,
        getEndpointText,
        HELPER_INSTANCE_NAME,
        getHelperClassName,
        writeClassicFile,
        writeHelperClass,
        writeMainFile,
        writeClass,
        writeClassSource,
        // the parts, also used by the OSC writer (export-osc-cpp.js)
        writeConstants,
        writeUserCode,
        writeProblems,
        writeClassComment,
    };
})();
