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
    var configNodeTypes;


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
            if (node) {
                if (node.type === 'group' || node._def.category !== "config") {
                    RED.view.select({ nodes: [node] })
                } else {
                    RED.view.select({ nodes: [] })
                }
            }
        })
        treeList.on('treelistconfirm', function(e, item) {
            var node = RED.nodes.node(item.id);
            if (node) {
                if (node._def.category === "config") {
                    RED.editor.editConfig("", node.type, node.id);
                } else {
                    RED.editor.edit(node);
                }
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


        RED.events.on("projects:load", onProjectLoad)

        RED.events.on("flows:add", onFlowAdd)
        RED.events.on("flows:remove", onObjectRemove)
        RED.events.on("flows:change", onFlowChange)
        RED.events.on("flows:reorder", onFlowsReorder)

        RED.events.on("nodes:add",onNodeAdd);
        RED.events.on("nodes:remove",onObjectRemove);
        RED.events.on("nodes:change",onNodeChange);

        RED.events.on("groups:add",onNodeAdd);
        RED.events.on("groups:remove",onObjectRemove);
        RED.events.on("groups:change",onNodeChange);

        RED.events.on("workspace:clear", onWorkspaceClear)
    }

    function getFlowData() {
        var flowData = [{
                label: "Flows",
                expanded: true,
                children: []
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
        subflowList = flowData[1];
        globalConfigNodes = flowData[2];
        configNodeTypes = { __global__: globalConfigNodes };

        return flowData;
    }

    function onProjectLoad(activeProject) {
        objects = {};
        var newFlowData = getFlowData();
        projectInfoLabel.empty();
        getProjectLabel(activeProject).appendTo(projectInfoLabel);
        projectInfo.show();
        treeList.treeList('data',newFlowData);
    }
    function onNodeAdd(n) {
        objects[n.id] = {
            id: n.id,
            element: getNodeLabel(n),
            gutter: getGutter(n)
        }
        if (n.type === "group") {
            objects[n.id].children = [];
            objects[n.id].deferBuild = true;
            if (missingParents[n.id]) {
                objects[n.id].children = missingParents[n.id];
                delete missingParents[n.id]
            }
        }
        var parent = n.g||n.z||"__global__";

        if (n._def.category !== "config" || n.type === 'group') {
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
            createFlowConfigNode(parent,n.type);
            configNodeTypes[parent].types[n.type].treeList.addChild(objects[n.id]);
        }
        objects[n.id].element.toggleClass("red-ui-info-outline-item-disabled", !!n.d)
        updateSearch();
    }
    function onWorkspaceClear() {
        treeList.treeList('data',getFlowData());
    }
    function onFlowAdd(ws) {
        console.warn("******************************onFlowAdd");
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
        objects[ws.id].element.toggleClass("red-ui-info-outline-item-disabled", !!ws.disabled)
        objects[ws.id].treeList.container.toggleClass("red-ui-info-outline-item-disabled", !!ws.disabled)
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
        existingObject.element.toggleClass("red-ui-info-outline-item-disabled", !!n.disabled)
        existingObject.treeList.container.toggleClass("red-ui-info-outline-item-disabled", !!n.disabled)
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

    function onNodeChange(n) {
        var existingObject = objects[n.id];
        var parent = n.g||n.z||"__global__";

        var nodeLabelText = getNodeLabelText(n);
        if (nodeLabelText) {
            existingObject.element.find(".red-ui-info-outline-item-label").text(nodeLabelText);
        } else {
            existingObject.element.find(".red-ui-info-outline-item-label").html("&nbsp;");
        }
        var existingParent = existingObject.parent.id;
        if (!existingParent) {
            existingParent = existingObject.parent.parent.flow
        }
        if (parent !== existingParent) {
            var parentItem = existingObject.parent;
            existingObject.treeList.remove(true);
            if (parentItem.children.length === 0) {
                if (parentItem.config) {
                    // this is a config
                    parentItem.treeList.remove();
                    // console.log("Removing",n.type,"from",parentItem.parent.id||parentItem.parent.parent.id)

                    delete configNodeTypes[parentItem.parent.id||parentItem.parent.parent.id].types[n.type];


                    if (parentItem.parent.children.length === 0) {
                        if (parentItem.parent.id === "__global__") {
                            parentItem.parent.treeList.addChild(getEmptyItem(parentItem.parent.id));
                        } else {
                            delete configNodeTypes[parentItem.parent.parent.id];
                            parentItem.parent.treeList.remove();
                            if (parentItem.parent.parent.children.length === 0) {
                                parentItem.parent.parent.treeList.addChild(getEmptyItem(parentItem.parent.parent.id));
                            }

                        }
                    }
                } else {
                    parentItem.treeList.addChild(getEmptyItem(parentItem.id));
                }
            }
            if (n._def.category === 'config' && n.type !== 'group') {
                // This must be a config node that has been rescoped
                createFlowConfigNode(parent,n.type);
                configNodeTypes[parent].types[n.type].treeList.addChild(objects[n.id]);
            } else {
                // This is a node that has moved groups
                if (empties[parent]) {
                    empties[parent].treeList.remove();
                    delete empties[parent];
                }
                objects[parent].treeList.addChild(existingObject)
            }

            // if (parent === "__global__") {
            //     // Global always exists here
            //     if (!configNodeTypes[parent][n.type]) {
            //         configNodeTypes[parent][n.type] = {
            //             config: true,
            //             label: n.type,
            //             children: []
            //         }
            //         globalConfigNodes.treeList.addChild(configNodeTypes[parent][n.type])
            //     }
            //     configNodeTypes[parent][n.type].treeList.addChild(existingObject);
            // } else {
            //     if (empties[parent]) {
            //         empties[parent].treeList.remove();
            //         delete empties[parent];
            //     }
            //     objects[parent].treeList.addChild(existingObject)
            // }
        }
        existingObject.element.toggleClass("red-ui-info-outline-item-disabled", !!n.d)

        if (n._def.category === "config" && n.type !== 'group') {
            existingObject.element.find(".red-ui-info-outline-item-control-users").text(n.users.length);
        }

        updateSearch();
    }
    function onObjectRemove(n) {
        var existingObject = objects[n.id];
        existingObject.treeList.remove();
        delete objects[n.id]

        // If this is a group being removed, it may have an empty item
        if (empties[n.id]) {
            delete empties[n.id];
        }
        var parent = existingObject.parent;
        if (parent.children.length === 0) {
            if (parent.config) {
                // this is a config
                parent.treeList.remove();
                delete configNodeTypes[parent.parent.id||n.z].types[n.type];
                if (parent.parent.children.length === 0) {
                    if (parent.parent.id === "__global__") {
                        parent.parent.treeList.addChild(getEmptyItem(parent.parent.id));
                    } else {
                        delete configNodeTypes[n.z];
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
    function addControls(n,div) {
        var controls = $('<div>',{class:"red-ui-info-outline-item-controls red-ui-info-outline-item-hover-controls"}).appendTo(div);

        if (n._def != undefined && n._def.category === "config" && n.type !== "group") {
            var userCountBadge = $('<button type="button" class="red-ui-info-outline-item-control-users red-ui-button red-ui-button-small"><i class="fa fa-toggle-right"></i></button>').text(n.users.length).appendTo(controls).on("click",function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                RED.search.show("uses:"+n.id);
            })
            RED.popover.tooltip(userCountBadge,function() { return RED._('editor.nodesUse',{count:n.users.length})});
        }

        if (n._def != undefined && n._def.button) {
            var triggerButton = $('<button type="button" class="red-ui-info-outline-item-control-action red-ui-button red-ui-button-small"><i class="fa fa-toggle-right"></i></button>').appendTo(controls).on("click",function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                RED.view.clickNodeButton(n);
            })
            RED.popover.tooltip(triggerButton,RED._("sidebar.info.triggerAction"));
        }
        // $('<button type="button" class="red-ui-info-outline-item-control-reveal red-ui-button red-ui-button-small"><i class="fa fa-eye"></i></button>').appendTo(controls).on("click",function(evt) {
        //     evt.preventDefault();
        //     evt.stopPropagation();
        //     RED.view.reveal(n.id);
        // })
        if (n.type !== 'group' && n.type !== 'subflow') {
            var toggleButton = $('<button type="button" class="red-ui-info-outline-item-control-disable red-ui-button red-ui-button-small"><i class="fa fa-circle-thin"></i><i class="fa fa-ban"></i></button>').appendTo(controls).on("click",function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                if (n.type === 'tab') {
                    if (n.disabled) {
                        RED.workspaces.enable(n.id)
                    } else {
                        RED.workspaces.disable(n.id)
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
                return "common.label."+(((n.type==='tab' && n.disabled) || (n.type!=='tab' && n.d))?"enable":"disable");
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
        RED.popover.tooltip(revealButton,"sidebar.info.find");
        return span;
    }

    var empties = {};
    function getEmptyItem(id) {
        var item = {
            empty: true,
            element: $('<div class="red-ui-info-outline-item red-ui-info-outline-item-empty">').text("sidebar.info.empty"),
        }
        empties[id] = item;
        return item;
    }

    return {
        createTab: createTab,

    };
})();