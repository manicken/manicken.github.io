


class AudioConnectionExport
{
    minorIncrement = 0;
    majorIncrement = 0;
    staticType = false;
    workspaceId = "";
    dstRootIsArray = false;
    srcRootIsArray = false;
    arrayLength = 0;
    src = {};
    srcName = "";
    srcPort = 0;
    srcIsClass = 0;
    dst = {};
    dstName = "";
    dstPort = 0;
    dstIsClass = 0;
    count = 1;
    totalCount = 0;
    cppCode = "";
    base()
    {
        if (this.staticType==true) return RED.arduino.export.getAudioConnectionTypeName() + "        patchCord"+this.count + "(";
        else {
            if (this.dstRootIsArray || this.srcRootIsArray)
                return TEXT.getNrOfSpaces(this.majorIncrement+this.minorIncrement) + "patchCord[pci++] = new "+RED.arduino.export.getAudioConnectionTypeName()+"(";
            else
                return TEXT.getNrOfSpaces(this.majorIncrement) + "patchCord[pci++] = new "+RED.arduino.export.getAudioConnectionTypeName()+"(";
        }
    }
    ifAnyIsArray()
    {
        return (this.dstRootIsArray || this.srcRootIsArray);
    }
    makeOSCname(n)
    {
        var result = this.srcName + '_' + this.srcPort + '_' + this.dstName + '_' + this.dstPort;
        result.replace("[","${").replace("]","}").replace(".","_")
        return result;
    }
    makeOSCnameQC(n)
    {
        if (RED.arduino.settings.ExportMode < 3)
            return "";
        else
            return '"' + this.makeOSCname(n) + '", ';
    }
    appendToCppCode()
    {
        //if ((this.srcPort == 0) && (this.dstPort == 0))
        //	this.cppCode	+= "\n" + this.base + this.count + "(" + this.srcName + ", " + this.dstName + ");"; // this could be used but it's generating code that looks more blurry

        if (this.dstRootIsArray && this.srcRootIsArray && this.staticType == true) {
            for (var i = 0; i < this.arrayLength; i++) {
                this.cppCode += this.base() + this.makeOSCnameQC(i) + this.srcName.replace('[i]', '[' + i + ']') + ", " + this.srcPort + ", " + this.dstName.replace('[i]', '[' + i + ']') + ", " + this.dstPort + ");";
                if (this.srcIsClass || this.dstIsClass) this.cppCode += warningClassUse;
                this.cppCode += "\n";
                this.count++;
            }
        }
        else if (this.dstRootIsArray) {
            if (this.staticType==false) {
                this.cppCode += this.base() + this.makeOSCnameQC(-1) + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", " + this.dstPort + ");";
                this.cppCode += "\n";
            }
            else {
                for (var i = 0; i < this.arrayLength; i++) {
                    this.cppCode += this.base() + this.makeOSCnameQC(i) + this.srcName + ", " + this.srcPort + ", " + this.dstName.replace('[i]', '[' + i + ']') + ", " + this.dstPort + ");";
                    if (this.srcIsClass || this.dstIsClass) this.cppCode += warningClassUse;
                    this.cppCode += "\n";
                    this.count++;
                }
                
            }
            this.totalCount += this.arrayLength;
        }
        else if (this.srcRootIsArray) {
            if (this.staticType==false) {
                this.cppCode += this.base() + this.makeOSCnameQC(-1) + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", i"+(this.dstPort>0?("+"+this.dstPort):"")+");";
                this.cppCode += "\n";
            }
            else {
                for (var i = 0; i < this.arrayLength; i++) {
                    this.cppCode += this.base() + this.makeOSCnameQC(i) + this.srcName.replace('[i]', '[' + i + ']') + ", " + this.srcPort + ", " + this.dstName + ", "+i+");";
                    if (this.srcIsClass || this.dstIsClass) this.cppCode += warningClassUse;
                    this.cppCode += "\n";
                    this.count++;
                }
            }
            this.totalCount += this.arrayLength;
        }
        else {
            this.cppCode += this.base() + this.makeOSCnameQC(-1) + this.srcName + ", " + this.srcPort + ", " + this.dstName + ", " + this.dstPort + ");";
            if (this.staticType == true && (this.srcIsClass || this.dstIsClass)) this.cppCode += warningClassUse;
            this.cppCode += "\n";
            this.count++;
            this.totalCount++;
        }
    }
    checkIfDstIsArray()
    {
        var isArray = RED.export.isNameDeclarationArray(this.dstName, this.workspaceId);
        if (isArray == undefined) {
            this.dstRootIsArray = false;
            return false;
        }
        this.arrayLength = isArray.arrayLength;
        this.dstName = isArray.newName;
        this.dstRootIsArray = true;
        return true;
    }
    checkIfSrcIsArray()
    {

        var isArray = RED.export.isNameDeclarationArray(this.srcName, this.workspaceId);
        if (isArray == undefined) {
            this.srcRootIsArray = false;
            return false;
        }
        this.arrayLength = isArray.arrayLength;
        this.srcName = isArray.newName;
        this.srcRootIsArray = true;
        return true;
    }
   
}