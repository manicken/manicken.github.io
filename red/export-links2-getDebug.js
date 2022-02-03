RED.export.links2.getDebug = (function () {

    function printLinkDebug(l,options) {
        var txt  = "";
        if (options.initialSpaces != undefined) {
            for (var i = 0; i < options.initialSpaces; i++) txt += " ";
        }
        if (l.invalid != undefined) return l.invalid + "\n";

        if (options.simple == true) {
            return "(" + link.source.name + ", " + link.sourcePort + ", " + link.target.name + ", " + link.targetPort + ")";
        }
        
        var afp = (options.asFullPath != undefined && options.asFullPath == true);

        var sourceInfo = '("' + l.sourcePath + (afp==true?"/":'","') + (l.sourceName||l.source.name) + '",' + l.sourcePort + ')';
        var targetInfo = '("' + l.targetPath + (afp==true?"/":'","') + (l.targetName||l.target.name) + '",' + l.targetPort + ')';

        if (l.info != undefined) {
            if (l.info.tabIn != undefined) {
                var tabInInfo = ", tabIn:(" + l.info.tabIn.node.name + " [" + l.info.tabIn.node.outputs + "])";
            }
            if (l.info.tabOut != undefined) {
                var tabOutInfo = ", tabOut:(" + l.info.tabOut.node.name + " [" + l.info.tabOut.node.inputs + "])"
            }
            var linkInfo = "isBus:" + l.info.isBus + ", valid:" + l.info.valid + (tabInInfo?tabInInfo:"") + (tabOutInfo?tabOutInfo:"");
        }
        

        txt += sourceInfo + ' -> ' + targetInfo + ' @ "' + l.linkPath + '"  tabOutPortIndex:' + l.tabOutPortIndex + (linkInfo?" "+linkInfo:"");
        if (l.groupFirstLink)
            txt += "\n############ groupFirstLink: " + printLinkDebug(l.groupFirstLink,options);
        /*if (l.nextLink != undefined) {
            initialSpaces += 2;
            txt += "\n" + printLinkDebug(l.nextLink, undefined, initialSpaces);
        }*/
        if (l.origin && options.origin == true) {
        //for (var i = 0; i < (l.linkPath.length + 3); i++) txt += " ";

            txt += '  origin (' + l.origin.source.name + "," + l.origin.sourcePort + ') -> ('+ l.origin.target.name + "," + l.origin.targetPort + ")";
            
        }
        return txt + "\n";
    }

    function printLinksDebug(links,options) {
        var txt = "";
        for (var i = 0; i < links.length; i++) {
            txt += printLinkDebug(links[i],options);
        }
        return txt;
    }

    return function (link_s,options) {
        if( options == undefined) options = {asFullPath:false, initialSpaces:0, simple:false, origin:false};
        if (Array.isArray(link_s)) return printLinksDebug(link_s,options);
        else return printLinkDebug(link_s,options);
    };
})();

