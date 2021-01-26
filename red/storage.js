/* public domain
 * vim: set ts=4:
 */

RED.storage = (function() {

	var dontSave = false;

	function update(dontSaveSettings) {
		if (dontSave == true) return; // this prevents saves while applying settings
		 
		//RED.nodes.addClassTabsToPalette(); //Jannik
		//RED.nodes.refreshClassNodes(); //Jannik
		
		// TOOD: use setTimeout to limit the rate of changes?
		// (Jannik say that is not needed because it's better to save often, not to loose any changes)
		// it's only needed when we move objects with keyboard, 
		// but then the save timeOut should be at keyboard move function not here.
		// TODO: save when using keyboard to move nodes.
		
		if (localStorage)
		{
			var nns = RED.nodes.createCompleteNodeSet(dontSaveSettings);
			RED.notify("<strong>Saved..</strong>", "success", null, 2000, 30);
            localStorage.setItem("audio_library_guitool",JSON.stringify(nns));
            RED.IndexedDBfiles.fileWrite("projects", RED.arduino.settings.ProjectName + ".json", JSON.stringify(nns));
            console.trace("localStorage write");
            
            
		}
	}
	function allStorage() {

		var archive = [],
			keys = Object.keys(localStorage),
			i = 0, key;
	
		for (; key = keys[i]; i++) {
			archive.push( key + '=' + localStorage.getItem(key));
		}
	
		return archive;
	}
	function load() {

		const t0 = performance.now();
		if (localStorage) {
			//console.warn(allStorage());
			var json_string = localStorage.getItem("audio_library_guitool");
			console.log("localStorage read: " );//+ json_string);

			if (json_string != undefined && (json_string.trim().length != 0))
			{
				var jsonObj = JSON.parse(json_string);
				
				if (jsonObj.settings != undefined) // this is for the future version of structure, not yet implemented
				{
                    RED.settings.setFromJSONobj(jsonObj.settings);
                }
                else
                    console.error("jsonObj.settings is undefined,  this is for the future version of structure, not yet implemented");

				if (jsonObj.workspaces != undefined) // new version have this defined, not yet implemented
				{
					RED.nodes.importWorkspaces(jsonObj.workspaces);
				}
				else
				{
					RED.nodes.import(jsonObj, false, true);
				}
				
			}
			else
			{
				RED.nodes.createNewDefaultWorkspace();
			}
		}
		const t1 = performance.now();
		console.log('storage-load took: ' + (t1-t0) +' milliseconds.');
	}
	function loadContents(json_string) {
		console.log("loadContents:" +json_string);
		localStorage.setItem("audio_library_guitool", json_string);
		window.location.reload();
		
				
	}
	function clear() {
		// TOOD: use setTimeout to limit the rate of changes?
		if (localStorage)
		{
			localStorage.removeItem("audio_library_guitool");
			//console.log("localStorage write");
		}
	}
	return {
		get dontSave() { return dontSave; },
		set dontSave(state) { dontSave = state; },
		update: update,
		load: load,
		loadContents:loadContents, 
		clear: clear
	}
})();
