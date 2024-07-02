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
	const ROOT_CONTAINER_ID = "palette-container"; // note. first defined in index.html
	const CATEGORY_BASE = "palette-category";
	const CATEGORY_HEADER = "palette-header";
	const CATEGORY_CONTENT_BASE_CLASS = "palette-content";

    var defSettings = {
		categoryHeaderTextSize: 14,
		categoryHeaderHeight: 16,
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
        set categoryHeaderTextSize(size) { _settings.categoryHeaderTextSize = parseInt(size); if (_settings.categoryHeaderTextSize != defSettings.categoryHeaderTextSize) setCategoryHeaderStyle(); RED.storage.update();},
		
        get categoryHeaderHeight() {return parseInt(_settings.categoryHeaderHeight);},
        set categoryHeaderHeight(size) { _settings.categoryHeaderHeight = parseInt(size); if (_settings.categoryHeaderHeight != defSettings.categoryHeaderHeight) setCategoryHeaderStyle(); RED.storage.update();},
		
        get categoryHeaderBackgroundColor() {return _settings.categoryHeaderBackgroundColor;},
        set categoryHeaderBackgroundColor(colorCode) { _settings.categoryHeaderBackgroundColor = colorCode; if (_settings.categoryHeaderBackgroundColor != defSettings.categoryHeaderBackgroundColor) setCategoryHeaderStyle(); RED.storage.update();},
		
        get onlyShowOne() { return _settings.onlyShowOne; },
        set onlyShowOne(state) { _settings.onlyShowOne = state; RED.storage.update();},

        get hideHeadersWhenSearch() { return _settings.hideHeadersWhenSearch; },
        set hideHeadersWhenSearch(state) { _settings.hideHeadersWhenSearch = state; filterChange(); RED.storage.update();},

        get categoryHeaderShowAsRainBow() { return _settings.categoryHeaderShowAsRainBow; },
        set categoryHeaderShowAsRainBow(state) { _settings.categoryHeaderShowAsRainBow = state; if (_settings.categoryHeaderShowAsRainBow != defSettings.categoryHeaderShowAsRainBow) setCategoryHeaderStyle(); RED.storage.update();},
        
        get categoryHeaderShowAsRainBowAlt() { return _settings.categoryHeaderShowAsRainBowAlt; },
        set categoryHeaderShowAsRainBowAlt(state) { _settings.categoryHeaderShowAsRainBowAlt = state; if (_settings.categoryHeaderShowAsRainBowAlt != defSettings.categoryHeaderShowAsRainBowAlt) setCategoryHeaderStyle(); RED.storage.update();},
        
        get categoryHeaderShowAsRainBowMinVal() {return parseInt(_settings.categoryHeaderShowAsRainBowMinVal);},
        set categoryHeaderShowAsRainBowMinVal(size) { _settings.categoryHeaderShowAsRainBowMinVal = parseInt(size); if (_settings.categoryHeaderShowAsRainBowMinVal != defSettings.categoryHeaderShowAsRainBowMinVal) setCategoryHeaderStyle(); RED.storage.update();},
        
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
            var colorMap = RED.color.generateColorMap();
            var colorMapDeltaIndex = parseInt(colorMap.length/($("." + CATEGORY_HEADER).length));
            var minVal = settings.categoryHeaderShowAsRainBowMinVal;
        }
        var bgColor = settings.categoryHeaderBackgroundColor;
		
        $("." + CATEGORY_HEADER).each( function(i,e) {
			if ($(e).hasClass("sub-cat")) return; // skip sub categories

            $(e).css('font-size', font_size)
                .css('height', height)
            if (settings.categoryHeaderShowAsRainBow == true)
            {
                if (settings.categoryHeaderShowAsRainBowAlt == true)
                    $(e).css('background-color', RED.color.setMinColor(colorMap[colorMapDeltaIndex*i], bgColor, minVal));
                else
                    $(e).css('background-color', RED.color.addColors(colorMap[colorMapDeltaIndex*i], bgColor, minVal));
            }
            else
                $(e).css('background-color', bgColor);
            });
	}

	
	function doInit(categories)
	{
		addCategories(categories);
	}
	// TODO rename destContainer to categoryPath or something better
	function addCategories(categories, categoryPath="")
	{
		//console.log("addCategories into:" + categoryPath);
		var names = Object.getOwnPropertyNames(categories);
		for (var i = 0; i < names.length; i++)
		{
            var name = names[i];
            var cat = categories[name];
			var expanded = (cat.expanded!=undefined)?cat.expanded:false;
			//expanded = true;
			createCategoryContainer(name, categoryPath, expanded, cat.headerStyle, cat.label, cat.description);
			if (cat.subcats != undefined)
				addCategories(cat.subcats, ((categoryPath.length!=0)?(categoryPath+"-"):"") + name);
		}
	}
	function createCategoryContainer(categoryUid, categoryPath, expanded, headerStyle, headerText, headerPopupText){
		if (categoryPath == undefined) categoryPath = "";
		categoryPath = categoryPath.trim();

		//console.log("%c creating new category: " + category + " in " + ((categoryPath.length!=0)?categoryPath:"ROOT ("+ROOT_CONTAINER_ID+")"), "font-weight: bold; font-size:14px; background: #ECFFDC; padding:5px; padding-right:30%; padding-left:10px;");
		
		var palette_category_class = CATEGORY_BASE;
		var palette_header_class = CATEGORY_HEADER;
		 
		if (headerText == undefined)
			headerText = categoryUid;
		
		if (categoryPath.length != 0)
		{
			palette_category_class += " sub-cat";
			palette_header_class += " sub-cat";
		}

		headerStyle = (headerStyle!=undefined?(`style="${headerStyle}"`):"");

		var subPath = ((categoryPath.length!=0)?(categoryPath+"-"):"") + categoryUid;
		var headerId = CATEGORY_HEADER+"-"+subPath;
		var categoryElementId = CATEGORY_BASE+"-"+subPath;
		var containerId = "";
		if (categoryPath.length == 0) containerId = ROOT_CONTAINER_ID;
		else containerId = ROOT_CONTAINER_ID+"-"+categoryPath;
		var hiddenByDefault = "hidden no-border";
		if (hiddenByDefault == undefined) var hiddenByDefault = "";
		$("#" + containerId).append(
			`<div class="${palette_category_class} ${hiddenByDefault}" id="${categoryElementId}">`+
			 `<div class="${palette_header_class} " id="${headerId}" ${headerStyle}>`+
			 `<div class="${palette_header_class} contents" ${headerStyle}><i class="icon-chevron-down${(expanded?" expanded":"")}"></i><span>${headerText}</span></div>`+
			 '</div>'+
			 `<div class="${CATEGORY_CONTENT_BASE_CLASS}" id="${containerId}-${categoryUid}" style="display: ${(expanded?"block":"none")};"></div>`+
			'</div>'
		);
		if (headerPopupText != undefined)
			RED.main.SetPopOver("#"+headerId, headerPopupText, "right");
		setCategoryClickFunction(categoryUid, categoryPath);
	}
	function setCategoryClickFunction(categoryUid,categoryPath)
	{
		var headerClass = "";
		if (categoryPath == undefined) categoryPath = "";
		categoryPath = categoryPath.trim();
		if (categoryPath.length != 0) headerClass = CATEGORY_HEADER + ".sub-cat";
		else headerClass = CATEGORY_HEADER;
		//console.warn("@setCategoryClick Function, category:" +category + ", categoryPath:" + categoryPath + ", headerClass:" + headerClass);
		var id = CATEGORY_HEADER+((categoryPath.length!=0)?("-"+categoryPath):"")+"-"+categoryUid;
		//console.warn("id:" + id);
		$("#"+id).off('click').on('click', function(e) {
			
			//console.log("onlyShowOne:" + _settings.onlyShowOne);
			
			var catContentElement = $(this).next();
			var displayStyle = catContentElement.css('display');
			if (displayStyle == "block")
			{
				//console.log("slide up", this);
				catContentElement.slideUp();
				$(this).children("."+CATEGORY_HEADER+".contents").children("i").removeClass("expanded"); // chevron
				//$(this).removeClass("expanded");
			}
			else
			{
				//console.log("slide down", this);
				if (_settings.onlyShowOne == true) // TODO maybe: don't run when collapsing sub cat
				{
					setShownStateForAll(false,ROOT_CONTAINER_ID+"-"+categoryPath, headerClass);
				}
				catContentElement.slideDown();
				$(this).children("."+CATEGORY_HEADER+".contents").children("i").addClass("expanded"); // chevron
				//$(this).addClass("expanded");
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
				$(otherCat[i]).children("."+CATEGORY_HEADER+".contents").children("i").addClass("expanded");
			}
			else
			{
				$(otherCat[i]).next().slideUp();
				$(otherCat[i]).children("."+CATEGORY_HEADER+".contents").children("i").removeClass("expanded");
			}
		}
	}

	function categoryNotExists(category)
	{
		return $(`#${ROOT_CONTAINER_ID}-${category}`).length === 0
	}
	
	function clearCategory(category)
	{
		$(`#${ROOT_CONTAINER_ID}-${category}`).empty();
	}

	/**
	 * add new node type to the palette
	 * @param {*} nt  node type
	 * @param {*} def node type def
	 * 	 */
	function activateWholeCategoryTree(category)
	{
		var treeItems = category.split("-");
		//for (var i = treeItems.length; i > 0; i--) {
		for (var i = 1; i <= treeItems.length; i++) {
			var treePath = treeItems.slice(0, i).join("-");
			//console.log("activating:" + CATEGORY_BASE + "-" + treePath);
			$("#" + CATEGORY_BASE + "-" + treePath).removeClass("hidden");
			$("#" + CATEGORY_BASE + "-" + treePath).removeClass("no-border");
			//$("#" + ROOT_CONTAINER_ID + "-" + treePath).removeClass("hidden");
			//$("#" + ROOT_CONTAINER_ID + "-" + treePath).removeClass("no-border");
		}
	}
	function addNodeType(nt,def, category, nodeDefGroupName, isInSubCat, allInOneCat) { // externally RED.palettte.add
		if (category == undefined)
		{
			//console.log("addNodeType == undefined @ " + nt);
			if (def.category != undefined && def.category.trim().length != 0)
				category = (isInSubCat?(nodeDefGroupName + "-"):"") + def.category;
			else
				category = (isInSubCat?nodeDefGroupName:"unsorted");
		}
		else if (allInOneCat == undefined)
		{
			//console.log("addNodeType != undefined @ " + nt);
			if (def.category != undefined && def.category.trim().length != 0)
				category = ((category.trim().length != 0)?(category + "-"):"") + (isInSubCat?(nodeDefGroupName + "-"):"") + def.category;
		}
			

		//console.warn("add addNodeType:"+nt+" @ " + category + ", shortName:" + def.shortName);
		if ($("#palette-node-"+category +"-"+nt.replace('/','')).length)
			return;		// avoid duplicates

		//console.warn("add addNodeType:"+nt+" @ " + category + ", shortName:" + def.shortName);

		var d = document.createElement("div");
		
		d.id = "palette-node-"+category +"-"+nt;
		d.type = nt;
		d._def = def;

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
		
		if (def.outputs > 1) {
			var portOut = document.createElement("div");
			portOut.className = "palette_port1 palette_port_output";
			d.appendChild(portOut);
			portOut = document.createElement("div");
			portOut.className = "palette_port2 palette_port_output";
			d.appendChild(portOut);
		}
		else if (def.outputs > 0) {
			var portOut = document.createElement("div");
			portOut.className = "palette_port palette_port_output";
			d.appendChild(portOut);
		}

		var reqError = document.createElement("div");
		reqError.className = "palette_req_error hidden";

		d.appendChild(reqError);
		
		if (def.inputs > 1) {
			var portIn = document.createElement("div");
			portIn.className = "palette_port1 palette_port_input";
			d.appendChild(portIn);
			portIn = document.createElement("div");
			portIn.className = "palette_port2 palette_port_input";
			d.appendChild(portIn);
		}
		else if (def.inputs > 0) {
			var portIn = document.createElement("div");
			portIn.className = "palette_port palette_port_input";
			d.appendChild(portIn);
		}

		if (categoryNotExists(category) && category.length != 0){
			console.log("categoryNotExists:" + category);
			var treeItems = category.split("-");
			for (var i = 1; i <= treeItems.length; i++) {
				var treePath = treeItems.slice(0, i).join("-");
				
				if (categoryNotExists(treePath))
				{
					treePath = treeItems.slice(0, i-1).join("-");
					var subCategory = treeItems[i-1];
					
					console.warn("create missing palette category:" + subCategory + " in " + (treePath.length!=0?treePath:"ROOT (" + ROOT_CONTAINER_ID + ")"));
					createCategoryContainer(subCategory, treePath);
					
				}
			}
			//createCategoryContainer(category, "");
		}
		activateWholeCategoryTree(category);
		var categoryContainerId = ROOT_CONTAINER_ID + (category.length!=0?("-"+category):"")

		//console.log("add node type in:"+categoryContainerId);
		$("#"+categoryContainerId).append(d);

		d.onmousedown = function(e) { e.preventDefault(); };

		if (def.help != undefined && def.help.trim().length != 0) setTooltipContent(nt, d, " @ " + nodeDefGroupName, def.help);
		else setTooltipContent(nt, d, " @ " + nodeDefGroupName);
		
		$(d).click(function() {
			console.warn("palette node click:" + d.type);
			RED.nodes.selectNode(d.type);
			//RED.sidebar.info.setHelpContent('', d.type);

			if (def.help != undefined && def.help.trim().length != 0) RED.sidebar.info.setHelpContent("<h3>" + d.type + "</h3>",d.type, def.help);
			else RED.sidebar.info.setHelpContent('', d.type);
		});
		var offsetX = null;
		var offsetY = null;
		$(d).draggable({
			helper: 'clone',
			appendTo: 'body',
			revert: true,
			revertDuration: 50,
			start: function(e, ui)
			{
				ui.helper.addClass("palette_node_drag");
				
				if (d.type.startsWith("Junction")) {
					ui.helper.css({
						width: d._def.width,
					});
					ui.helper.find(".palette_label").remove();
				}

				offsetX=null;
    			offsetY=null;
			},
			drag : function( e, ui ) { // Fires after start event, and continuously during drag
				if(offsetX===null){
					offsetX = e.clientX-ui.offset.left;
					offsetY = e.clientY-ui.offset.top;
				  }
				  ui.position.left += offsetX - Math.floor( ui.helper.outerWidth()/ 2 );
				  ui.position.top += offsetY - Math.floor( ui.helper.outerHeight()/ 2 );
			},
			
		});
		
	}
	
	function setTooltipContent(key, elem, preInfo, defaultText) {
		// server test switched off - test purposes only
		var patt = new RegExp(/^[http|https]/);
		var server = false && patt.test(location.protocol);

        if (defaultText == undefined) defaultText = "no help available";

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
			data = RED.NodeHelpManager.getHelp(key); // $("script[data-help-name|='" + key + "']").html();
			var firstP = $("<div/>").append(data).children("div").first().html();
            var content = '<b>'+key+'</b>';
            if (preInfo != undefined) content += preInfo;
            if (firstP != undefined) content += '<br><br>' + firstP;
            else content += '<br><br>' + defaultText;
            //if (postInfo != undefined) content += '<br>' + postInfo;

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
            setShownStateForAll(false, ROOT_CONTAINER_ID, CATEGORY_HEADER);
            setShownStateForAll(false, ROOT_CONTAINER_ID, CATEGORY_HEADER + ".sub-cat");
            if (settings.hideHeadersWhenSearch == true)
                showAllHeaders();
		} else {
			$("#palette-search-clear").show();
            setShownStateForAll(true, ROOT_CONTAINER_ID, CATEGORY_HEADER);
            setShownStateForAll(true, ROOT_CONTAINER_ID, CATEGORY_HEADER + ".sub-cat");
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
        var otherCat = $("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_HEADER);
        otherCat.push($("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_HEADER + ".sub-cat"));
		for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).addClass("hidden");
        }
        // hide borders
        otherCat = $("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_BASE);
        otherCat.push($("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_BASE + ".sub-cat"));
        otherCat.push($("#" + ROOT_CONTAINER_ID).find(".palette-content"));
        for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).addClass("no-border");
        }
    }
    function showAllHeaders() {
        // show headers
        var otherCat = $("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_HEADER);
        otherCat.push($("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_HEADER + ".sub-cat"));
		for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).removeClass("hidden");
        }
        // show borders
        otherCat = $("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_BASE);
        otherCat.push($("#" + ROOT_CONTAINER_ID).find("." + CATEGORY_BASE + ".sub-cat"));
        otherCat.push($("#" + ROOT_CONTAINER_ID).find(".palette-content"));
        for (var i = 0; i < otherCat.length; i++)
		{
            $(otherCat[i]).removeClass("no-border");
        }
    }
	
	$("#palette-search-input").focus(function(e) {
		RED.keyboard.disable();
	});
	$("#palette-search-input").blur(function(e) {
		RED.keyboard.enable();
	});
    var filterFormVisible = false;
    /*$("#palette-search-icon").click(function(e) {
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
                $("#palette-filters").append('<tr id="palette-filter-tr-'+ndn+'"><td><input type="checkbox" checked="true" id="palette-filter-'+ndn+'"></input></td><td><div id="palette-filter-div-'+ndn+'"><label for="palette-filter-'+ndn+'">'+nd.label+'</label></div></td></tr>');
                RED.main.SetPopOver("#palette-filter-tr-"+ndn, nd.description + "<br><br>" + nd.homepage + "<br><br>" + nd.url, "right");
            }
            document.getElementById("palette-filters-form").style.display = "block";
            filterFormVisible = true;
        }
    });*/

	/**
     * 
     * @param {REDNode} d 
     * @returns 
     */
	function redraw_paletteNodesReqError(d)
	{
		var cat = d._def.category;
		if (cat == undefined) return;
		if (!cat.startsWith("input") && !cat.startsWith("output")) return;
		//console.error(cat);
		//cat = cat.substring(0, cat.lastIndexOf("-"));
		//console.warn("catname @ redraw_paletteNodesReqError:" + cat);
		var e1 = document.getElementById("palette-node-"+cat + "-"+d.type);

		//console.error("palette_node_"+cat + "_"+d.type);
		var e2 = e1.getElementsByClassName("palette_req_error")[0]; // palette_req_error is using a style, where the position of the icon is defined
		e2.addEventListener("click", 
							function(){RED.notify('Conflicts:<ul><li>'+d.conflicts.join('</li><li>')+'</li></ul>',null,false, 5000);},
							{once: true});
		if (d.requirementError)
			e2.classList.remove("hidden");
		else
			e2.classList.add("hidden");
	}
	
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
		createCategoryContainer,
		addCategories,
		clearCategory:clearCategory,
		remove:removeNodeType,

		redraw_paletteNodesReqError,
	};
})();
