/**  Modified from original Node-Red source, for audio system visualization
 * vim: set ts=4:
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 
RED.palette = (function() {

    var defSettings = {
		categoryHeaderTextSize: 12,
		categoryHeaderHeight: 14,
        categoryHeaderBackgroundColor: "#f3f3f3",
        categoryHeaderShowAsRainBow: false,
        categoryHeaderShowAsRainBowAlt: false,
        categoryHeaderShowAsRainBowMinVal: 64,
		onlyShowOne: true,
        hideHeadersWhenSearch: true,
	};
    // Object.assign({}, ) is used to ensure that the defSettings is not overwritten
	var _settings = {
		categoryHeaderTextSize: defSettings.categoryHeaderTextSize,
		categoryHeaderHeight: defSettings.categoryHeaderHeight,
        categoryHeaderBackgroundColor: defSettings.categoryHeaderBackgroundColor,
        categoryHeaderShowAsRainBow: defSettings.categoryHeaderShowAsRainBow,
        categoryHeaderShowAsRainBowAlt: defSettings.categoryHeaderShowAsRainBowAlt,
        categoryHeaderShowAsRainBowMinVal: defSettings.categoryHeaderShowAsRainBowMinVal,
		onlyShowOne: defSettings.onlyShowOne,
        hideHeadersWhenSearch: defSettings.hideHeadersWhenSearch,
	};

	var settings = {
		
        get categoryHeaderTextSize() {return parseInt(_settings.categoryHeaderTextSize);},
        set categoryHeaderTextSize(size) { _settings.categoryHeaderTextSize = parseInt(size); setCategoryHeaderStyle(); RED.storage.update();},
		
        get categoryHeaderHeight() {return parseInt(_settings.categoryHeaderHeight);},
        set categoryHeaderHeight(size) { _settings.categoryHeaderHeight = parseInt(size); setCategoryHeaderStyle(); RED.storage.update();},
		
        get categoryHeaderBackgroundColor() {return _settings.categoryHeaderBackgroundColor;},
        set categoryHeaderBackgroundColor(colorCode) { _settings.categoryHeaderBackgroundColor = colorCode; setCategoryHeaderStyle(); RED.storage.update();},
		
        get onlyShowOne() { return _settings.onlyShowOne; },
        set onlyShowOne(state) { _settings.onlyShowOne = state; RED.storage.update();},

        get hideHeadersWhenSearch() { return _settings.hideHeadersWhenSearch; },
        set hideHeadersWhenSearch(state) { _settings.hideHeadersWhenSearch = state; filterChange(); RED.storage.update();},

        get categoryHeaderShowAsRainBow() { return _settings.categoryHeaderShowAsRainBow; },
        set categoryHeaderShowAsRainBow(state) { _settings.categoryHeaderShowAsRainBow = state; setCategoryHeaderStyle(); RED.storage.update();},
        
        get categoryHeaderShowAsRainBowAlt() { return _settings.categoryHeaderShowAsRainBowAlt; },
        set categoryHeaderShowAsRainBowAlt(state) { _settings.categoryHeaderShowAsRainBowAlt = state; setCategoryHeaderStyle(); RED.storage.update();},
        
        get categoryHeaderShowAsRainBowMinVal() {return parseInt(_settings.categoryHeaderShowAsRainBowMinVal);},
        set categoryHeaderShowAsRainBowMinVal(size) { _settings.categoryHeaderShowAsRainBowMinVal = parseInt(size); setCategoryHeaderStyle(); RED.storage.update();},
        
	};

	var settingsCategory = { label:"Palette", expanded:false, bgColor:"#DDD" };

	var settingsEditor = {
		categoryHeaderTextSize: {label:"Header Text Size", type:"number" },
		categoryHeaderHeight: {label:"Header Height", type:"number" },
		categoryHeaderBackgroundColor: {label:"Header BG color", type:"color" },
        onlyShowOne: {label:"Only show one category at a time.", type:"boolean" },
        hideHeadersWhenSearch: {label:"Hide category headers at search", type:"boolean" },
        categoryHeaderShowAsRainBow: {label:"Header BG color rainbow", type:"boolean", popupText:"Shows each category in one different color,<br><br>note. when this is checked the bgColor is used as the additive component" },
        categoryHeaderShowAsRainBowAlt: {label:"Header BG color rainbow Alternative", type:"boolean", popupText:"when checked the above bgColor defines the min values used,<br>and the following luminence defines the max values."},
        categoryHeaderShowAsRainBowMinVal: {label:"Header BG color rainbow min/max luminence", type:"number", popupText:"when alt mode is inactive the following is used:<br>Header BG color rainbow min luminence value calculated by the following formula<br>(adjLuminance is this value)<br><br>if (adjLuminance != undefined && color_R_A < parseInt(adjLuminance))<br>&nbsp;&nbsp;&nbsp;&nbsp;var color_R = color_R_A + parseInt(colorB.substring(1,3), 16);<br>else<br>&nbsp;&nbsp;&nbsp;&nbsp;var color_R = color_R_A; <br><br>when alt mode in active this defines the max color values." },
    };

	function setCategoryHeaderStyle() // this is to make above "setter" cleaner
	{
		var font_size = settings.categoryHeaderTextSize;
		var height = settings.categoryHeaderHeight;
        
        if (settings.categoryHeaderShowAsRainBow == true)
        {
            var colorMap = RED.view.generateColorMap();
            var colorMapDeltaIndex = parseInt(colorMap.length/($(".palette-header").length));
            var minVal = settings.categoryHeaderShowAsRainBowMinVal;
        }
        var bgColor = settings.categoryHeaderBackgroundColor;

        $(".palette-header").each( function(i,e) {
            $(e).css('font-size', font_size)
                .css('height', height)
            if (settings.categoryHeaderShowAsRainBow == true)
            {
                if (settings.categoryHeaderShowAsRainBowAlt == true)
                    $(e).css('background-color', RED.view.setMinColor(colorMap[colorMapDeltaIndex*i], bgColor, minVal));
                else
                    $(e).css('background-color', RED.view.addColors(colorMap[colorMapDeltaIndex*i], bgColor, minVal));
            }
            else
                $(e).css('background-color', bgColor);
            });
	}

	function createCategoryContainer(category, destContainer, expanded, isSubCat, hdrBgColor){ 
        if (hdrBgColor != undefined) hdrBgColor = 'background-color:' + hdrBgColor + ';';
        else hdrBgColor = "";
        //console.error(hdrBgColor);
		//console.warn("@createCategoryContainer category:" + category + ", destContainer:" + destContainer + ", isSubCat:" + isSubCat);
		var chevron = "";
		var displayStyle = "";
		if (!destContainer)	destContainer = "palette-container"; // failsafe
		var palette_category = "palette-category";
		
		var header = category;
		var palette_header_class = "palette-header";
		
		if (isSubCat)
		{
			displayStyle = "block";
			palette_category += "-sub-cat";
			header = header.substring(header.indexOf('-')+1);
			palette_header_class += "-sub-cat";
		}
		//else
		//{
			if (expanded == true)
			{
				chevron = '<i class="icon-chevron-down expanded"></i>';
				displayStyle = "block";
			}
			else
			{
				chevron = '<i class="icon-chevron-down"></i>';
				displayStyle = "none";
			}
		//}
		$("#" + destContainer).append('<div class="' + palette_category + '">'+
			'<div class="'+palette_header_class+'" id="header-'+category+'" style="'+hdrBgColor+'"><div class="'+palette_header_class+'-contents">'+chevron+'<span>'+header+'</span></div></div>'+
			'<div class="palette-content" id="palette-base-category-'+category+'" style="display: '+displayStyle+';">'+
			 // '<div id="palette-'+category+'-input" class="palette-sub-category"><div class="palette-sub-category-label">in</div></div>'+ // theese are never used
			 // '<div id="palette-'+category+'-output" class="palette-sub-category"><div class="palette-sub-category-label">out</div></div>'+ // theese are never used
			  //'<div id="palette-'+category+'-function"></div>'+
			 // '<div id="palette-'+category+'"></div>'+
			'</div>'+
			'</div>');
	}
	function doInit(categories)
	{
        var names = Object.getOwnPropertyNames(categories);
        

		for (var i = 0; i < names.length; i++)
		{
            var name = names[i];
			var cat = categories[name];
			createCategoryContainer(name, "palette-container", cat.expanded, false); 
			setCategoryClickFunction(name, "palette-container", "palette-header");
			if (cat.subcats != undefined)
				addSubCats("palette-base-category-" + name , name + "-", cat.subcats);
		}
		//setCategoryClickFunction('input');
		//setCategoryClickFunction('output');

	}
	function addSubCats(destContainer, catPreName, categories)
	{
        var names = Object.getOwnPropertyNames(categories);
		for (var i = 0; i < names.length; i++)
		{
            var name = names[i];
            var cat = categories[name];
			createCategoryContainer(catPreName + name,destContainer, false, true, cat.hdrBgColor);
			setCategoryClickFunction(catPreName + name, destContainer, "palette-header-sub-cat");
		}
	}

	function setCategoryClickFunction(category,destContainer, headerClass)
	{
		//console.warn("@setCategoryClickFunction category:" +category + ", destContainer:" + destContainer + ", headerClass:" + headerClass);
		$("#header-"+category).off('click').on('click', function(e) {
			
			//console.log("onlyShowOne:" + _settings.onlyShowOne);
			var catContentElement = $(this).next();
			var displayStyle = catContentElement.css('display');
			if (displayStyle == "block")
			{
				catContentElement.slideUp();
				$(this).children("i").removeClass("expanded"); // chevron
			}
			else
			{

				if (/*!isSubCat(catContentElement.attr('id')) && */(_settings.onlyShowOne == true)) // don't run when collapsing sub cat
				{
					setShownStateForAll(false,destContainer, headerClass);
				}
				catContentElement.slideDown();
				$(this).children("i").addClass("expanded"); // chevron
			}
		});
	}
	function setShownStateForAll(state,container,headerClass)
	{
		//console.warn("@setShownStateForAll container:" +container+ ", headerClass:"+headerClass);
		//var otherCat = $("#"+container);
		var otherCat = $("#"+container).find("." + headerClass);

		//console.error(otherCat);
		for (var i = 0; i < otherCat.length; i++)
		{
			
			//console.warn("setShownStateForAll:" + otherCat[i].id);
			if (state)
			{
				$(otherCat[i]).next().slideDown();
				$(otherCat[i]).children("i").addClass("expanded");
			}
			else
			{
				$(otherCat[i]).next().slideUp();
				$(otherCat[i]).children("i").removeClass("expanded");
			}
		}
	}
	function isSubCat(id)
	{
		if (id.startsWith("palette-base-category-input-")) { return true; }
		if (id.startsWith("palette-base-category-output-")) { return true; }
		//console.warn(id + " is not subcat");
		return false;
	}
	//doInit(core);
	
	function clearCategory(category)
	{
		$("#palette-base-category-"+ category ).empty();
	}

	/**
	 * add new node type to the palette
	 * @param {*} nt  node type
	 * @param {*} def node type def
	 * 	 */
	function addNodeType(nt,def, category, nodeDefGroupName) { // externally RED.palettte.add

		//if (exclusion.indexOf(def.category)!=-1) return;
		var defCategory = "";
		if (!category)
		{
			category = def.category;
			//console.warn("add to " + category);
			defCategory = def.category + "";
		}
		else
		{
			//console.error("add to " + category);
			defCategory = category;// + "-function";
		}
		//console.warn("add addNodeType:@" + category + ":" + def.shortName);
		if ($("#palette_node_"+category +"_"+nt).length)	return;		// avoid duplicates

			var d = document.createElement("div");
			
			d.id = "palette_node_"+category +"_"+nt;
			d.type = nt;

			//var label = /^(.*?)([ -]in|[ -]out)?$/.exec(nt)[1];
			var label = (def.shortName) ? def.shortName : nt;

			d.innerHTML = '<div class="palette_label">'+label+"</div>";
			d.className="palette_node";// cat_" + category;
			if (def.icon) {
				d.style.backgroundImage = "url(icons/"+def.icon+")";
				if (def.align == "right") {
					d.style.backgroundPosition = "95% 50%";
				} else if (def.inputs > 0) {
					d.style.backgroundPosition = "10% 50%";
				}
			}
			
			d.style.backgroundColor = def.color;
			if (def.textColor != undefined)
			d.style.color = def.textColor;
			
			if (def.outputs > 0) {
				var portOut = document.createElement("div");
				portOut.className = "palette_port palette_port_output";
				//def.palettePortOut = portOut; // not used anywhere
				d.appendChild(portOut);
			}

			var reqError = document.createElement("div");
			reqError.className = "palette_req_error hidden";

			d.appendChild(reqError);
			
			if (def.inputs > 0) {
				var portIn = document.createElement("div");
				portIn.className = "palette_port palette_port_input";
				//def.palettePortIn = portIn; // not used anywhere
				d.appendChild(portIn);
			}
			
			if ($("#palette-base-category-"+category).length === 0){
				createCategoryContainer(category, "palette-container");
			}
			
			/*if ($("#palette-"+defCategory).length === 0) {          
				$("#palette-base-category-"+category).append('<div id="palette-'+defCategory+'"></div>');            
			}*/

			$("#palette-base-category-"+defCategory).append(d);
			//$("#palette-"+defCategory).append(d);
			d.onmousedown = function(e) { e.preventDefault(); };

            if (def.help != undefined && def.help.trim().length != 0) setTooltipContent('', def.help, d, " @ " + nodeDefGroupName);
            else setTooltipContent('', nt, d, " @ " + nodeDefGroupName);
			
		    $(d).click(function() {
			  	console.warn("palette node click:" + d.type);
				RED.nodes.selectNode(d.type);
			  	//RED.sidebar.info.setHelpContent('', d.type);

                if (def.help != undefined && def.help.trim().length != 0) RED.sidebar.info.setHelpContent("<h3>" + d.type + "</h3>", def.help);
                else RED.sidebar.info.setHelpContent('', d.type);
		    });
		    $(d).draggable({
			   helper: 'clone',
			   appendTo: 'body',
			   revert: true,
			   revertDuration: 50,
			   start: function(e, ui)
			   {
				$(ui.helper).addClass("palette_node_drag");
			   }
		    });
		    
			//setCategoryClickFunction(category);
		
	}
	
	

	function setTooltipContent(prefix, key, elem, preInfo, postInfo) {
		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);

		var options = {
			title: elem.type,
			placement: "right",
			trigger: "hover",
			delay: { show: 750, hide: 50 },
			html: true,
			container:'body',
			content : ""
		};

		if (!server) {
           // console.warn($("script[data-help-name|='" + key + "']").html());
			data = $("script[data-help-name|='" + key + "']").html();
			var firstP = $("<div/>").append(data).children("div").first().html();
            var content = '<b>'+key+'</b>';
            if (preInfo != undefined) content += preInfo;
            if (firstP != undefined) content += '<br><br>' + firstP;
            else content += '<br><br>no help availabe'
            if (postInfo != undefined) content += '<br>' + postInfo;

			options.content = content;
			$(elem).popover(options);
		} else {
			$.get( "resources/help/" + key + ".html", function( data ) {
				var firstP = $("<div/>").append(data).children("div").first().html();
				options.content = firstP;
				$(elem).popover(options);
			});
		}
	}
	
	function removeNodeType(type) {
		$("#palette_node_"+type).remove();
	}
	
	function filterChange() {
		var val = $("#palette-search-input").val();
		if (val === "") {
			$("#palette-search-clear").hide();
            setShownStateForAll(false, "palette-container", "palette-header");
            setShownStateForAll(false, "palette-container", "palette-header-sub-cat");
            if (settings.hideHeadersWhenSearch == true)
                showAllHeaders();
		} else {
			$("#palette-search-clear").show();
            setShownStateForAll(true, "palette-container", "palette-header");
            setShownStateForAll(true, "palette-container", "palette-header-sub-cat");
            if (settings.hideHeadersWhenSearch == true)
                hideAllHeaders();
            else
                showAllHeaders();
		}
		
		var re = new RegExp(val, "i");
		$(".palette_node").each(function(i,el) {
			var label = $(el).find(".palette_label").html(); // fixed this so that it searches for the label 
			if (val === "" || re.test(label))
				$(this).show();
			else
				$(this).hide();
		});
	}

    function hideAllHeaders() {
        // hide headers
        var otherCat = $("#palette-container").find(".palette-header");
        otherCat.push($("#palette-container").find(".palette-header-sub-cat"));
		for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).addClass("hidden");
        }
        // hide borders
        otherCat = $("#palette-container").find(".palette-category");
        otherCat.push($("#palette-container").find(".palette-category-sub-cat"));
        otherCat.push($("#palette-container").find(".palette-content"));
        for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).addClass("palette-category-no-border");
        }
    }
    function showAllHeaders() {
        // show headers
        var otherCat = $("#palette-container").find(".palette-header");
        otherCat.push($("#palette-container").find(".palette-header-sub-cat"));
		for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).removeClass("hidden");
        }
        // show borders
        otherCat = $("#palette-container").find(".palette-category");
        otherCat.push($("#palette-container").find(".palette-category-sub-cat"));
        otherCat.push($("#palette-container").find(".palette-content"));
        for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).removeClass("palette-category-no-border");
        }
    }
	
	$("#palette-search-input").focus(function(e) {
		RED.keyboard.disable();
	});
	$("#palette-search-input").blur(function(e) {
		RED.keyboard.enable();
	});
    var filterFormVisible = false;
    $("#palette-search-icon").click(function(e) {
        console.warn("search icon clicked");
        if (filterFormVisible == true) {
            document.getElementById("palette-filters-form").style.display = "none";
            filterFormVisible = false;
        }
        else {
            $("#palette-filters").empty();
            var nodeDefNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
            for (var ndi = 0; ndi < nodeDefNames.length; ndi++) {
                var ndn = nodeDefNames[ndi];
                var nd = RED.nodes.node_defs[ndn];
                $("#palette-filters").append('<tr><td><input type="checkbox" checked="true" id="palette-filter-'+ndn+'"></input></td><td><div id="palette-filter-div-'+ndn+'"><label for="palette-filter-'+ndn+'">'+nd.label+'</label></div></td></tr>');
                RED.main.SetPopOver("palette-filter-div-"+ndn, nd.description, "right");
            }
            document.getElementById("palette-filters-form").style.display = "block";
            filterFormVisible = true;
        }
    });
	
	$("#palette-search-clear").on("click",function(e) {
		e.preventDefault();
		$("#palette-search-input").val("");
		filterChange();
		$("#palette-search-input").focus();
	});
	
	$("#palette-search-input").val("");
	$("#palette-search-input").on("keyup",function() {
		filterChange();
	});

	$("#palette-search-input").on("focus",function() {
		$("body").one("mousedown",function() {
			$("#palette-search-input").blur();
		});
	});
	
	return {
        defSettings:defSettings,
		settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
        
		doInit:doInit,
		add:addNodeType,
		clearCategory:clearCategory,
		remove:removeNodeType,
	};
})();
