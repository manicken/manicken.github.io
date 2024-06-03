var Mixers = {}; // define root namespace
Mixers.Export = (function () {
    /**
     * @param {String} mixerType can be either "MonoCode" or "StereoCode"
     * @param {Number[]} mixervariants 
     * @param {Boolean} soShortAsPossible 
     * @returns {ExportFile[]}
     */
    function GetFiles(mixerType, mixervariants,soShortAsPossible)
    {
        var files = [];
        var mfiles = GetCode(mixerType, mixervariants,soShortAsPossible);
        var baseFileName = "mixers";
        if (mixerType == "Stereo") baseFileName += "Stereo";
        var file = new ExportFile(baseFileName + ".h", mfiles.h);
        file.header = mfiles.copyrightNote;
        files.push(file);
        file = new ExportFile(baseFileName + ".cpp", mfiles.cpp);
        file.header = mfiles.copyrightNote;
        files.push(file);
        return files;
    }
    function makeCodeAsShortAsPossible(code) {
        
        var ret = "";
        var codeLines = code.split("\n");
        for (var li = 0;li<codeLines.length;li++)
        {
            var line = codeLines[li].trim();
            //line = line.replace(/\/\/(.*)/, '/*$1*/'); // replace // comments with /* */ comments
            line = line.replace(/\/\/.*/, ''); // remove all // comments

            //console.log(line);
            if (line[0] == "#") // preprocessor lines must be on seperate lines
                ret += "\n" + line + "\n";
            else
                ret += line;
        }
        return ret;
    }
    /**
     * @param {String} mixerType can be either "MonoCode" or "StereoCode"
     * @param {Number[]} variants 
     * @param {Boolean} soShortAsPossible 
     * @returns 
     */
    function GetCode(mixerType, variants,soShortAsPossible) {
        var mixersCpp = "";
        var mixersHpp = "";
        mixerType += "Code";

        console.warn("mixer variants",variants);
        console.warn("mixer type:" + mixerType);
        
        for (var vi = 0; vi < variants.length; vi++)
        {
            if (variants[vi] <= 0) continue; // cannot have a mixer with zero or less inputs
            if (variants[vi] == 4) continue; // mixer with 4 inputs allready exists in the lib
            if (variants[vi] > 255) variants[vi] = 255; // a AudioObject cannot have more than 255 inputs
            var mixerCpp = Mixers[mixerType].mixers_cpp_template.split('NNN').join(variants[vi].toString());
            var mixerHpp = Mixers[mixerType].mixers_h_template.split('NNN').join(variants[vi].toString());

            mixersCpp += mixerCpp + "\n";
            mixersHpp += mixerHpp + "\n";
        }
        var finalCpp = Mixers[mixerType].mixers_cpp_base.replace("<templatecode>", mixersCpp);
        var finalHpp = Mixers[mixerType].mixers_h_base.replace("<templatecode>", mixersHpp);
        var finalCopyNote = Mixers[mixerType].copyrightNote;
        if (soShortAsPossible != undefined && soShortAsPossible == true){
            finalCpp = makeCodeAsShortAsPossible(finalCpp);
            finalHpp = makeCodeAsShortAsPossible(finalHpp);
            finalCopyNote = makeCodeAsShortAsPossible(finalCopyNote);
        }
        
        return {copyrightNote:finalCopyNote,
                cpp:finalCpp + "\n",
                h:finalHpp + "\n"};
    }
    return {
        GetCode,
        GetFiles
    };
})();