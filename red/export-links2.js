
// note. RED.export.links.getDebug is in export-links-getDebug.js

RED.export.links2 = (function () {

    //this new structure should not create a new set of links
    // except when making links for arrays and buslinks
    // but then the new links should be stored inside the 'master'-link
    // also it should just add the necessary information to them
    // the origin should be replaced with a array containing only one or more links
    // that is then used at the export
    // also the source target sourcePort targetPort should be kept
    // at the original states
    var exampleLink = {
        source:{/*node*/}, sourcePort:0, target:{/*node*/}, targetPort:0, // original propeties

        export:[ // should be added by this module, and contains the 'real' wires
            {linkPath:"",
             source:{/*node*/}, sourcePort:0, sourcePath:[], sourceName:"", 
             target:{/*node*/}, targetPort:0, targetPath:[], targetName:""}
        ],
        
        /*info:{ // added by setLinkInfo @ RED.nodes
            isBus,
            valid,
            inValidText,
            tabOut,
            tabIn
        }*/
    }

    function generateAndAddExportInfo() {
        
    }


    return {

    };
})(); // RED.export.links2