RED.color = (function() {

    function subtractColor(colorA, colorB)
	{
		var color_R = parseInt(colorA.substring(1,3), 16) - parseInt(colorB.substring(1,3), 16);
		var color_G = parseInt(colorA.substring(3,5), 16) - parseInt(colorB.substring(3,5), 16);
		var color_B = parseInt(colorA.substring(5), 16) - parseInt(colorB.substring(5), 16);
		if (color_R < 0) color_R = 0;
		if (color_G < 0) color_G = 0;
		if (color_B < 0) color_B = 0;
		return "#" + getTwoHex(color_R) + getTwoHex(color_G) + getTwoHex(color_B);
    }
    function addColors(colorA, colorB, adjLuminance)
	{
        var color_R_A = parseInt(colorA.substring(1,3), 16);
        var color_G_A = parseInt(colorA.substring(3,5), 16);
        var color_B_A = parseInt(colorA.substring(5), 16);
        
        if (adjLuminance != undefined && color_R_A < parseInt(adjLuminance))
            var color_R = color_R_A + parseInt(colorB.substring(1,3), 16);
        else
            var color_R = color_R_A;
        
        if (adjLuminance != undefined && color_G_A < parseInt(adjLuminance))
            var color_G = color_G_A + parseInt(colorB.substring(3,5), 16);
        else
            var color_G = color_G_A;

        if (adjLuminance != undefined && color_B_A < parseInt(adjLuminance))
            var color_B = color_B_A + parseInt(colorB.substring(5), 16);
        else
            var color_B = color_B_A;
		if (color_R > 255) color_R = 255;
		if (color_G > 255) color_G = 255;
		if (color_B > 255) color_B = 255;
		return "#" + getTwoHex(color_R) + getTwoHex(color_G) + getTwoHex(color_B);
    }
    function setMinColor(colorA, colorB, adjLuminance)
	{
        var color_R_A = parseInt(colorA.substring(1,3), 16);
        var color_G_A = parseInt(colorA.substring(3,5), 16);
        var color_B_A = parseInt(colorA.substring(5), 16);
        var color_R_B = parseInt(colorB.substring(1,3), 16);
        var color_G_B = parseInt(colorB.substring(3,5), 16);
        var color_B_B = parseInt(colorB.substring(5), 16);
        
        if (color_R_A < color_R_B) color_R_A = color_R_B;
        if (color_G_A < color_G_B) color_G_A = color_G_B;
        if (color_B_A < color_B_B) color_B_A = color_B_B;

        if (color_R_A > adjLuminance) color_R_A = adjLuminance;
        if (color_G_A > adjLuminance) color_G_A = adjLuminance;
        if (color_B_A > adjLuminance) color_B_A = adjLuminance;

        
		return "#" + getTwoHex(color_R_A) + getTwoHex(color_G_A) + getTwoHex(color_B_A);
    }
    var colorMap = undefined
	function generateColorMap()
	{
        if (colorMap != undefined) return colorMap; // use prev. generated colormap
		// FF0000 -> FFFF00 upcount   G
		// FEFF00 -> 00FF00 downcount R
		// 00FF01 -> 00FFFF upcount   B
		// 00FEFF -> 0000FF downcount G
		// 0000FF -> FF00FF upcount   R
		// FF00FF -> FF0000 downcount B
        
		colorMap = [];
		var cR = 255;
		var cG = 0;
		var cB = 0;

		// upcount   G
		while(cG != 255) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cG++; }
		// downcount R
		while(cR != 0) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cR--; }
		// upcount   B
		while(cB != 255) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cB++; }
		// downcount G
		while(cG != 0) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cG--; }
		// upcount   R
		while(cR != 255) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cR++; }
		// downcount B
		while(cB != 0) { colorMap.push("#" + getTwoHex(cR) + getTwoHex(cG) + getTwoHex(cB)); cB--; }
		return colorMap;
	}
	function getTwoHex(value)
	{
		if (value < 0x10)
			return "0" + value.toString(16);
		else
			return value.toString(16);
	}
    
    return {
        generateColorMap,
        addColors,
        subtractColor,
        setMinColor
    };
})();