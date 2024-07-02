
RED.view.textsize = (function() {
    var textSizeCache = {};
    var tsc_numbers = "0123456789";
    var tsc_specialChars = "!\"#¤%&/()=?½§@£$€{[]}\\+,;.:-_¨^~'*<>| ";
    var tsc_lowerCase = "abcdefghijklmnopqrstuvwxyz";
    var tsc_upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var tsc_all = tsc_numbers+tsc_lowerCase+tsc_upperCase+tsc_specialChars;

    function init() {
        const t0 = performance.now();
        
        textSizeCache = {};
        for (var ts=10; ts < 24;ts++) { // generate standard sizes
            textSizeCache[ts] = generateCharSizesCache(ts);
        }
        const t1 = performance.now();
        console.log("generateTextSizeCache took:" + (t1-t0) + " ms");
        console.log(textSizeCache);
    }
    function generateCharSizesCache(size) {
        var sizes = {};
            
        for (var chi=0;chi<tsc_all.length;chi++) {
            var char = tsc_all[chi];
            if (char != " ")
                sizes[char] = _calculate(char,size);
            else
                sizes[char] = _calculate("]",size); // calculate space after similar sized char ]
        }
        return sizes;
    }
    function calculate(str,size) {
        //if (textSizeCache.length == 0) generateTextSizeCache();
        var width = 0;
        if (size == undefined)
            size = 14;
        var tsc = textSizeCache[size];
        if (tsc == undefined) {
            //console.warn("size not found:" + size);
            console.warn("generating charCache for size: " + size);
            tsc = generateCharSizesCache(size);
            textSizeCache[size] = tsc;
        }
        var height = 0;
        for (var i=0;i<str.length;i++) {
            var ccs = tsc[str[i]]; // ccs = current char size
            width += ccs.w;
            if (height < ccs.h) height = ccs.h;
        }
        return {w:width, h:height};
    }

	var calculateTextSizeElement = undefined;
    var calculateTextSizeCache = {};
	function _calculate(str,textSize) {
        //const t0 = performance.now();
		var name = str + "_" + textSize;

        /*if (calculateTextSizeCache[name] != undefined) {
            //const t1 = performance.now();
		    //console.error("@calculateTextSize time @ " + name + " : " + (t1-t0));
            return calculateTextSizeCache[name];
        }*/

		//if (str == undefined)
		//	return {w:0, h:0};
		//console.error("@calculateTextSize str type:" + typeof str);
		if (calculateTextSizeElement == undefined)
		{
			//console.error("@calculateTextSize created new");
			var sp = document.createElement("span");
			sp.className = "node_label";
			sp.style.position = "absolute";
			sp.style.top = "-300px";
            sp.style.left = "-300px";
			document.body.appendChild(sp);
			calculateTextSizeElement = sp;
		}
		
		var sp = calculateTextSizeElement;
		textSize = new String(textSize);
		if (textSize.endsWith("px") == false) textSize += "px";
		//console.error(textSize);
		sp.style.fontSize = textSize;
		
		/*var sp = document.createElement("span");
		sp.className = "node_label";
		sp.style.position = "absolute";
		sp.style.top = "-1000px";*/
		sp.innerHTML = (str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
		
		var w = sp.offsetWidth;
		var h = sp.offsetHeight;
		//document.body.removeChild(sp);
		var rect = sp.getBoundingClientRect();
        //var w = rect.width;
        //var h = rect.height;
        //var sizes = {w:parseFloat(w), h:parseFloat(h)};
        var sizes = {w, h};
        calculateTextSizeCache[name] = sizes; // cache it for performance boost

        //const t1 = performance.now();
		//console.error("@calculateTextSize time @ " + name + " : " + (t1-t0));

		return sizes;
	}
    return {
        init,
        calculate,
    };
})();