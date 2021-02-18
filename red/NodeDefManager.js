


RED.NodeDefManager = (function() {

    var treeList;

    var defSettings = {
    };
    var _settings = {
    };
    var settings = {
    };
    var settingsCategory = { label:"Node Def Manager", expanded:true, bgColor:"#DDD" };

    var settingsEditor = {
        DownloadCurrentNodeDefs:    { label:"Download Current NodeDefs", type:"button", action: DownloadCurrentNodeDefs},
    };
    $('#btn-node-def-manager').click(function(){showForm();});
    

    function DownloadCurrentNodeDefs() {
        var defCatNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        var audioObjectCount = 0;
        var totalCount = 0;
        for (var i = 0; i < defCatNames.length; i++) {
            var defCatName = defCatNames[i];
            var defCat = RED.nodes.node_defs[defCatName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            totalCount += defNames.length;
            for (var i2 = 0; i2 < defNames.length; i2++)
            if (defNames[i2].startsWith("Audio"))
                audioObjectCount++;
        }
        RED.main.download("NodeDefs.json","Total count: " + totalCount + "\nTotal Audio objects: " + audioObjectCount + "\n"+  JSON.stringify(RED.nodes.node_defs, null, 4) );
    }

    function showForm()
    {
        var form = $('#dialog-form-node-definitions-manager');
        $(form).empty();

        var html = "";
        html += '<div id="leftPanel">'
        html += '<ul id="myUL2">';
        var defCatNames = Object.getOwnPropertyNames(RED.nodes.node_defs);
        for (var i = 0; i < defCatNames.length; i++) {
            var defCatName = defCatNames[i];
            html += '<li><span class="caret2"></span><span class="item2">'+defCatName+'</span>';
            html += '<ul class="nested2">';
            var defCat = RED.nodes.node_defs[defCatName];
            var defNames = Object.getOwnPropertyNames(defCat.types);
            for (var i2 = 0; i2 < defNames.length; i2++) {
                html += '<li><span class="item2">'+defNames[i2]+'</span></li>';
            }
            html += "</ul></li>";
        }
        html += '</ul>';
        html += '</div>';
        html += '<div id="rightPanel">'
        html += '<textarea type="text" id="outputPreview" name="outputPreview" style="width: 95%; height: 95%"></textarea>'
        html += '</div>';
        
        $(form).append(html);

        var toggler = document.getElementsByClassName("caret2");

        for (var i = 0; i < toggler.length; i++) {
        toggler[i].addEventListener("click", function() {
            this.parentElement.querySelector(".nested2").classList.toggle("active2");
            this.classList.toggle("caret2-down");
        });
        }

        $( "#node-dialog-node-definitions-manager" ).dialog("option","someoption","Hello World");
        $( "#node-dialog-node-definitions-manager" ).dialog("open");
    }

    function getFlowData() {
        var flowData = [{
                id: "project-tree",
                label: "Tabs",
                expanded: true,
                children: [],
            }
        ]
        return flowData;
    }

    $("#node-dialog-node-definitions-manager form" ).submit(function(e) { e.preventDefault();});
	$( "#node-dialog-node-definitions-manager" ).dialog({
		modal: true,
		autoOpen: false,
		width: 1024,
        height:768,
		title: "Node Definitions Manager",
		buttons: [
			{
				text: "Ok",
				click: function() {
					
					$( this ).dialog( "close" );
				}
			},
			{
				text: "Cancel",
				click: function() {
					$( this ).dialog( "close" );
				}
			}
		],
		open: function(e) {
            var someoption = $(this).dialog('option','someoption');
					console.log("Node Defintions Manager - " + someoption);
			RED.keyboard.disable();
		},
		close: function(e) {
			RED.keyboard.enable();
		}
	});
    

    return {
        defSettings:defSettings,
        settings:settings,
		settingsCategory:settingsCategory,
        settingsEditor:settingsEditor,
    };
})();