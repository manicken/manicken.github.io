

$('#btn-deploy-osc-group-links').click(testFinalLinksExport);

function testFinalLinksExport() {
    
    RED.export.project = RED.nodes.createCompleteNodeSet({newVer:true}); // true mean we get the new structure

    var foundMains = RED.export.findMainWs(RED.export.project);
    var mainWorkSpaceIndex;

    if (foundMains == undefined) {
        RED.main.verifyDialog("Warning", "Audio Main Entry Tab not set", "Please set the Audio Main Entry tab<br> double click the tab that you want as the main and check the 'Audio Main File' checkbox.<br><br>note. if you select many tabs as audio main only the first is used.", function() {});
        return;
    }

    if (foundMains.items.length > 1) { // multiple AudioMain found
        if (foundMains.mainSelected != -1)
            mainWorkSpaceIndex = foundMains.mainSelected;
        else
            mainWorkSpaceIndex = foundMains.items[0]; // get the first one
    }
    else
        mainWorkSpaceIndex = foundMains.items[0]; // get the only one
    var ws = RED.export.project.workspaces[mainWorkSpaceIndex];
    var links = [];
    RED.export.links.getClassConnections(ws, links, "");
    //RED.export.updateNames(links); // not needed anymore and should never be used either
    links = RED.export.links.expandArrays(links); // for the moment this fixes array defs that the getClassConnections don't currently solve
    RED.export.links.fixTargetPortsForDynInputObjects(links);
    var exportDialogText = RED.export.links.getDebug(links);

    RED.view.dialogs.showExportDialog("DevelopmentTest - Export of AudioConnections (links/patchcables)", exportDialogText, " Links: ", {okText:"OK", tips:"This is only a development test"},
    function () {RED.notify("<strong>Nothing sent (development test only)</strong>", "success", null, 2000);});
}