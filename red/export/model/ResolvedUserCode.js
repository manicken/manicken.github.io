/**
 * Everything the user put in code nodes in one workspace, as written (no generated code).
 *
 * What it is for:
 *   The code writers decide where each kind of code goes, i.e. Variables become class members in a
 *   class but globals in the main file, ConstValues become 'const static int NUM = 2;' in a class but
 *   '#define NUM 2' in a classic export.
 *   The code itself is never changed or parsed (that's why classes with code can't be flattened).
 *
 * Who makes it:     the resolver (export-resolve.js addNode), one per ResolvedWorkspace.
 * Who uses it:      the code writers (export-cpp.js), the exporter (exporter.js) for includes and code files,
 *                   the flattener and the Export Mode rules for the 'code uses a class instance' warnings.
 */
class ResolvedUserCode
{
    /** ClassComment node texts, written as a comment before the class
     * @type {String[]} */
    classComments = [];

    /** Variables node contents
     * @type {String[]} */
    variables = [];

    /** ConstValue nodes, also used for array sizes (osc[NUM])
     * @type {{name:String, type:String, value:String}[]} */
    constants = [];

    /** Function node contents (written for the class body in a class)
     * @type {String[]} */
    functions = [];

    /** ConstructorCode node contents, put at the end of the constructor
     * @type {String[]} */
    constructorCode = [];

    /** DestructorCode node contents, put at the end of the destructor
     * @type {String[]} */
    destructorCode = [];

    /** EndOfFileCode node contents, put after the class
     * @type {String[]} */
    endOfFileCode = [];

    /** IncludeDef node names (and AudioStreamObject include files), i.e. <Audio.h> or "myFile.h"
     * @type {String[]} */
    includes = [];

    /** obsolete PointerArray nodes
     * @type {{type:String, name:String, items:String}[]} */
    pointerArrays = [];

    /** CodeFile nodes, these become separate files (and are included, except .c/.cpp files)
     * @type {{name:String, contents:String}[]} */
    codeFiles = [];

    /** DontRemoveCodeFiles node contents: files that should be kept in the target project
     * @type {String[]} */
    keepFiles = [];
}
