RED.export.links2.getDebug = (function () {

    function printLinkDebug(l,options) {
        var dbg  = "";

        if (l.invalid != undefined) return l.invalid + "\n";

        if (options.simple == true) {
            return getSimpleLinkDebug(l);
        }
        dbg += getSimpleLinkDebug(l) + " " + getLink_InfoDebug(l) + "\n";

        if (l.export != undefined)
            dbg += getExportLinksDebug(l.export,options);
        
        return dbg + "\n";
    }

    function getSimpleLinkDebug(l) {
        return '("' + l.source.name + '", ' + l.sourcePort + ', "' + l.target.name + '", ' + l.targetPort + ')';
    }

    function getExtendedLinkDebug(l,afp) {
        var sourceInfo = '("' + l.sourcePath + (afp==true?"/":'","') + (l.sourceName||l.source.name) + '",' + l.sourcePort + ')';
        var targetInfo = '("' + l.targetPath + (afp==true?"/":'","') + (l.targetName||l.target.name) + '",' + l.targetPort + ')';
        return sourceInfo + ' -> ' + targetInfo + ' @ "' + l.linkPath + '"';
    }

    function getExportLinksDebug(els,options) { // els = export link:s
        var dbg = "";
        for (var eli=0;eli<els.length;eli++) {
            dbg += "    " + getExportLinkDebug(els[eli],options);
        }
        return dbg;
    }
    function getExportLinkDebug(l,options) {
        var dbg = "";
        var afp = (options.asFullPath != undefined && options.asFullPath == true);
        
        dbg += getExtendedLinkDebug(l,afp) + (l.tabOutPortIndex!=undefined?('", tabOutPortIndex:' + l.tabOutPortIndex):"") /*+ ", "+ getLink_InfoDebug(l)*/;
        
        if (l.groupFirstLink)
            dbg += "\n############ groupFirstLink: " + getExtendedLinkDebug(l.groupFirstLink,afp);
        return dbg + "\n";
    }

    function getLink_InfoDebug(l) {
        if (l.info == undefined)
            return "";

        if (l.info.tabIn != undefined) {
            var tabInInfo = ', tabIn:{ "' + l.info.tabIn.name + '"' + (l.info.tabIn.outputs>1?(", (" + l.info.tabIn.outputs + ")"):"") + " }";
        }
        if (l.info.tabOut != undefined) {
            var tabOutInfo = ', tabOut:{ "' + l.info.tabOut.name + '"' + (l.info.tabOut.inputs>1?(", (" + l.info.tabOut.inputs + ")"):"") + " }"
        }
        return "info:{ isBus:" + l.info.isBus + (tabInInfo?tabInInfo:"") + (tabOutInfo?tabOutInfo:"") + ", valid:" + l.info.valid + " }";
    }

    function printLinksDebug(links,options) {
        var txt = "";
        for (var i = 0; i < links.length; i++) {
            txt += printLinkDebug(links[i],options);
        }
        return txt;
    }

    return function (link_s,options) {
        if( options == undefined) options = {asFullPath:false, simple:false};
        if (Array.isArray(link_s)) return printLinksDebug(link_s,options);
        else return printLinkDebug(link_s,options);
    };
})();

