RED.projectStructure = (function() {

    var treeList;
    var searchInput;
    var activeSearch;
    var projectInfo;
    var projectInfoLabel;
    var flowList;
    var subflowList;
    var globalConfigNodes;

    var objects = {};
    var missingParents = {};
    //var configNodeTypes;


    function createTab() {
        
        var container = $("<div>", { class: "red-ui-info-outline" }).css({ 'height': '100%' });
        var toolbar = $("<div>", {class:"red-ui-sidebar-header red-ui-info-toolbar"}).appendTo(container);
        projectInfo = $('<div class="red-ui-treeList-label red-ui-info-outline-project"><span class="red-ui-treeList-icon"><i class="fa fa-archive"></i></span></div>').hide().appendTo(container)
        projectInfoLabel = $('<span>').appendTo(projectInfo);

        treeList = $("<div>").css({ width: "100%", height: '100%' }).appendTo(container).treeList({
            data: getFlowData()
        })
        treeList.on('treelistselect', function(e, item) {
            var node = RED.nodes.node(item.id);// || RED.nodes.group(item.id);
            if (node == undefined)  return;

        })
        treeList.on('treelistconfirm', function(e, item) {
            var node = RED.nodes.node(item.id);
            if (node) {
                RED.editor.edit(node);
            }
        })

        var content = document.createElement("div");
        content.className = "red-ui-sidebar-info";
        content.id = "tab-project";
        var stackContainer = $("<div>",{class:"red-ui-sidebar-info-stack"}).appendTo(content);

        var outlinerPanel = $("<div>").css({
            "overflow": "hidden",
            "height": "100%"
        }).appendTo(stackContainer);

        treeList.appendTo(outlinerPanel);

        RED.sidebar.addTab("project", content);


        RED.events.on("projects:load", onProjectLoad);

        RED.events.on("flows:add", onFlowAdd); // implemented
        RED.events.on("flows:remove", onObjectRemove); // implemented
        RED.events.on("flows:change", onFlowChange); // implemented
        RED.events.on("flows:reorder", onFlowsReorder); // implemented

        RED.events.on("nodes:add",onNodeAdd); // implemented
        RED.events.on("nodes:remove",onObjectRemove); // implemented
        RED.events.on("nodes:change",onNodeChange); // implemented

        RED.events.on("groups:add",onNodeAdd);
        RED.events.on("groups:remove",onObjectRemove);
        RED.events.on("groups:change",onNodeChange);

        RED.events.on("workspace:clear", onWorkspaceClear)
    }

    function getFlowData() {
        var flowData = [{
                id: "project-tree",
                label: "Tabs",
                expanded: true,
                children: [],
            },
           /* {
                id: "__subflow__",
                label: "Subflows",
                children: [
                    getEmptyItem("__subflow__")
                ]
            },
            {
                id: "__global__",
                flow: "__global__",
                label: "Global Configuration Nodes",
                types: {},
                children: [
                    getEmptyItem("__global__")
                ]
            }*/
        ]

        flowList = flowData[0];
        //subflowList = flowData[1];
        //globalConfigNodes = flowData[2];
        //configNodeTypes = { __global__: globalConfigNodes };

        return flowData;
    }

    function onProjectLoad(activeProject) {
        //objects = {};
        //var newFlowData = getFlowData();
        //projectInfoLabel.empty();
        getProjectLabel(activeProject).appendTo(projectInfoLabel);
        projectInfo.show();
        //treeList.treeList('data',newFlowData);
    }
    function getProjectLabel(p) {
        var div = $('<div>',{class:"red-ui-info-outline-item red-ui-info-outline-item-flow"});
        div.css("width", "calc(100% - 40px)");
        var contentDiv = $('<div>',{class:"red-ui-search-result-description red-ui-info-outline-item-label"}).appendTo(div);
        contentDiv.text(p.name);
        var controls = $('<div>',{class:"red-ui-info-outline-item-controls"}).appendTo(div);
        var editProjectButton = $('<button class="red-ui-button red-ui-button-small" style="position:absolute;right:5px;top: 3px;"><i class="fa fa-ellipsis-h"></i></button>')
            .appendTo(controls)
            .on("click", function(evt) {
                evt.preventDefault();
                RED.projects.editProject();
            });
        RED.popover.tooltip(editProjectButton,'sidebar.project.showProjectSettings');
        return div;
    }
    
    function onWorkspaceClear() {
        treeList.treeList('data',getFlowData());
    }
    function onFlowAdd(ws) {
        //console.warn("******************************onFlowAdd");
        objects[ws.id] = {
            id: ws.id,
            element: getFlowLabel(ws),
            children:[],
            deferBuild: true,
            icon: "red-ui-icons red-ui-icons-flow",
            gutter: getGutter(ws)
        }
        if (missingParents[ws.id]) {
            objects[ws.id].children = missingParents[ws.id];
            delete missingParents[ws.id]
        } else {
            objects[ws.id].children.push(getEmptyItem(ws.id));
        }
        flowList.treeList.addChild(objects[ws.id])
        objects[ws.id].element.toggleClass("red-ui-info-outline-item-disabled", !ws.export)
        objects[ws.id].treeList.container.toggleClass("red-ui-info-outline-item-disabled", !ws.export)
        //updateSearch();

    }
    function onFlowChange(n) {
        var existingObject = objects[n.id];

        var label = n.label || n.id;
        var newlineIndex = label.indexOf("\\n");
        if (newlineIndex > -1) {
            label = label.substring(0,newlineIndex)+"...";
        }
        existingObject.element.find(".red-ui-info-outline-item-label").text(label);
        existingObject.element.toggleClass("red-ui-info-outline-item-disabled", !n.export)
        existingObject.treeList.container.toggleClass("red-ui-info-outline-item-disabled", !n.export)
        //updateSearch();
    }
    function onFlowsReorder(order) {
        var indexMap = {};
        order.forEach(function(id,index) {
            indexMap[id] = index;
        })

        flowList.treeList.sortChildren(function(A,B) {
            if (A.id === "__global__") { return -1 }
            if (B.id === "__global__") { return 1 }
            return indexMap[A.id] - indexMap[B.id]
        })
    }
    function onNodeAdd(n) {
        objects[n.id] = {
            id: n.id,
            element: getNodeLabel(n),
            gutter: getGutter(n)
        }
        if (n.type === "group" || n.type === "UI_ScriptButton") {
            //console.error("onNodeAdd was group:" + n.name);
            objects[n.id].children = [];
            objects[n.id].deferBuild = true;
            if (missingParents[n.id]) {
                objects[n.id].children = missingParents[n.id];
                delete missingParents[n.id]
            }
        }
        var parent = n.parentGroup||n.z||"__global__";
        //console.warn("onNodeAdd parent:", parent, "child:" + n.name);

        if (n.type === 'group' || n.type === "UI_ScriptButton") {
            if (objects[parent]) {
                if (empties[parent]) {
                    empties[parent].treeList.remove();
                    delete empties[parent];
                }
                if (objects[parent].treeList) {
                    objects[parent].treeList.addChild(objects[n.id]);
                } else {
                    objects[parent].children.push(objects[n.id])
                }
            } else {
                missingParents[parent] = missingParents[parent]||[];
                missingParents[parent].push(objects[n.id])
            }
        } else {
            //createFlowConfigNode(parent,n.type);
            //configNodeTypes[parent].types[n.type].treeList.addChild(objects[n.id]);
        }
        objects[n.id].element.toggleClass("red-ui-info-outline-item-disabled", !!n.disabled)
        //updateSearch();
    }
    function onNodeChange(n) {
        //console.warn("hello");

        var existingObject = objects[n.id];
        var parent = n.parentGroup||n.z||"__global__";
        console.warn("onNodeChange n.parentGroup: " , n.parentGroup , " " + n.name);

        var nodeLabelText = getNodeLabelText(n);
        if (nodeLabelText != undefined) {
            existingObject.element.find(".red-ui-info-outline-item-label").text(nodeLabelText);
            var nodeDiv = existingObject.element.find(".red-ui-search-result-node");
            nodeDiv.css('backgroundColor',n.bgColor);
            var borderColor = RED.utils.getDarkerColor(n.bgColor);
            if (borderColor !== n.bgColor) {
                nodeDiv.css('border-color',borderColor)
            }
        } else {
            
            existingObject.element.find(".red-ui-info-outline-item-label").html("&nbsp;");
        }
        if (existingParent != undefined && existingParent.parent != undefined)
            var existingParent = existingObject.parent.id;
        else{
            
            console.error("TODO. fix existingParent == undefined and existingParent.parent == undefined");
            return; // too many errors following this
        }

        if (!existingParent) {
            existingParent = existingObject.parent.parent.flow
            console.error(existingParent);
        }
        console.error("parent",parent);
        console.error("existingParent",existingParent);
        if (parent !== existingParent) {
            var parentItem = existingObject.parent;
            if (existingObject.treeList != undefined)
                existingObject.treeList.remove(true);
            if (parentItem.children.length === 0) {
                if (parentItem.config) {
                    // this is a config
                    parentItem.treeList.remove();
                    // console.log("Removing",n.type,"from",parentItem.parent.id||parentItem.parent.parent.id)

                    //delete configNodeTypes[parentItem.parent.id||parentItem.parent.parent.id].types[n.type];


                    if (parentItem.parent.children.length === 0) {
                        if (parentItem.parent.id === "__global__") {
                            parentItem.parent.treeList.addChild(getEmptyItem(parentItem.parent.id));
                        } else {
                            //delete configNodeTypes[parentItem.parent.parent.id];
                            parentItem.parent.treeList.remove();
                            if (parentItem.parent.parent.children.length === 0) {
                                parentItem.parent.parent.treeList.addChild(getEmptyItem(parentItem.parent.parent.id));
                            }

                        }
                    }
                } else {
                    if (parentItem.treeList != undefined)
                        parentItem.treeList.addChild(getEmptyItem(parentItem.id));
                    else
                        parentItem.children.addChild(getEmptyItem(parentItem.id));
                }
            }
            if (n.type === 'group' || n.type === "UI_ScriptButton") {
                // This is a node that has moved groups
                if (empties[parent]) {
                    empties[parent].treeList.remove();
                    delete empties[parent];
                }
                console.warn("parent: ", parent)
                if (objects[parent] != undefined)
                objects[parent].treeList.addChild(existingObject)
            }
        }
        existingObject.element.toggleClass("red-ui-info-outline-item-disabled", !!n.d)
        
        //updateSearch();
    }
    function onObjectRemove(n) {
        var existingObject = objects[n.id];
        if (existingObject.treeList != undefined)
            existingObject.treeList.remove();
        delete objects[n.id]

        //console.warn("onObjectRemove " + n.name);
        // If this is a group being removed, it may have an empty item
        if (empties[n.id]) {
            delete empties[n.id];
        }
        var parent = existingObject.parent;
        if (parent.children.length === 0) {
            if (parent.config) {
                // this is a config
                parent.treeList.remove();
                //delete configNodeTypes[parent.parent.id||n.z].types[n.type];
                if (parent.parent.children.length === 0) {
                    if (parent.parent.id === "__global__") {
                        parent.parent.treeList.addChild(getEmptyItem(parent.parent.id));
                    } else {
                        //delete configNodeTypes[n.z];
                        parent.parent.treeList.remove();
                        if (parent.parent.parent.children.length === 0) {
                            parent.parent.parent.treeList.addChild(getEmptyItem(parent.parent.parent.id));
                        }
                    }
                }
            } else {
                parent.treeList.addChild(getEmptyItem(parent.id));
            }
        }
    }
    function getFlowLabel(n) {
        var div = $('<div>',{class:"red-ui-info-outline-item red-ui-info-outline-item-flow"});
        var contentDiv = $('<div>',{class:"red-ui-search-result-description red-ui-info-outline-item-label"}).appendTo(div);
        var label = (typeof n === "string")? n : n.label;
        var newlineIndex = label.indexOf("\\n");
        if (newlineIndex > -1) {
            label = label.substring(0,newlineIndex)+"...";
        }
        contentDiv.text(label);
        addControls(n, div);
        return div;
    }
    function getNodeLabelText(n) {
        var label = n.name || n.type+": "+n.id;
        label = label.toString();
        if (n._def.label) {
            try {
                label = (typeof n._def.label === "function" ? n._def.label.call(n) : n._def.label)||"";
            } catch(err) {
                console.log("Definition error: "+n.type+".label",err);
            }
        }
        
        var newlineIndex = label.indexOf("\\n");
        if (newlineIndex > -1) {
            label = label.substring(0,newlineIndex)+"...";
        }
        return label;
    }
    function getNodeLabel(n) {
        var div = $('<div>',{class:"red-ui-info-outline-item"});
        RED.utils.createNodeIcon(n).appendTo(div);
        var contentDiv = $('<div>',{class:"red-ui-search-result-description"}).appendTo(div);
        var labelText = getNodeLabelText(n);
        var label = $('<div>',{class:"red-ui-search-result-node-label red-ui-info-outline-item-label"}).appendTo(contentDiv);
        if (labelText) {
            label.text(labelText)
        } else {
            label.html("&nbsp;")
        }

        addControls(n, div);

        return div;
    }
    function addControls(n,div) {
        var controls = $('<div>',{class:"red-ui-info-outline-item-controls red-ui-info-outline-item-hover-controls"}).appendTo(div);
        
        /*
        if (n._def != undefined && n._def.button) {
            var triggerButton = $('<button type="button" class="red-ui-info-outline-item-control-action red-ui-button red-ui-button-small"><i class="fa fa-toggle-right"></i></button>').appendTo(controls).on("click",function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                RED.view.clickNodeButton(n);
            })
            RED.popover.tooltip(triggerButton,RED._("sidebar.info.triggerAction"));
        }*/
        // $('<button type="button" class="red-ui-info-outline-item-control-reveal red-ui-button red-ui-button-small"><i class="fa fa-eye"></i></button>').appendTo(controls).on("click",function(evt) {
        //     evt.preventDefault();
        //     evt.stopPropagation();
        //     RED.view.reveal(n.id);
        // })
        if (n.type !== 'group' && n.type != "UI_ScriptButton" && n.type !== 'subflow') {
            var toggleButton = $('<button type="button" class="red-ui-info-outline-item-control-disable red-ui-button red-ui-button-small"><i class="fa fa-circle-thin"></i><i class="fa fa-ban"></i></button>').appendTo(controls).on("click",function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                if (n.type === 'tab') {
                    if (n.export == true) {
                        n.export = false;
                        RED.workspaces.disable(n.id)
                    } else {
                        n.export = true;
                        RED.workspaces.enable(n.id)
                    }
                } else {
                    // TODO: this ought to be a utility function in RED.nodes
                    var historyEvent = {
                        t: "edit",
                        node: n,
                        changed: n.changed,
                        changes: {
                            d: n.d
                        },
                        dirty:RED.nodes.dirty()
                    }
                    if (n.d) {
                        delete n.d;
                    } else {
                        n.d = true;
                    }
                    n.dirty = true;
                    n.changed = true;
                    RED.events.emit("nodes:change",n);
                    RED.nodes.dirty(true)
                    RED.view.redraw();
                }
            });
            RED.popover.tooltip(toggleButton,function() {
                return "common.label."+(((n.type==='tab' && n.export==true) || (n.type!=='tab' && n.d))?"enable":"disable");
            });
        } else {
            $('<div class="red-ui-info-outline-item-control-spacer">').appendTo(controls)
        }
        controls.find("button").on("dblclick", function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
        })
    }
    function getGutter(n) {
        var span = $("<span>",{class:"red-ui-info-outline-gutter"});
        var revealButton = $('<button type="button" class="red-ui-info-outline-item-control-reveal red-ui-button red-ui-button-small"><i class="fa fa-search"></i></button>').appendTo(span).on("click",function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            RED.view.reveal(n.id);
        })
        RED.popover.tooltip(revealButton,"find");
        return span;
    }

    var empties = {};
    function getEmptyItem(id) {
        var item = {
            empty: true,
            element: $('<div class="red-ui-info-outline-item red-ui-info-outline-item-empty">').text("empty"),
        }
        empties[id] = item;
        return item;
    }

    return {
        createTab: createTab,

    };
})();