/**
 * Copyright JS Foundation and other contributors, http://js.foundation
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



RED.tabs = (function() {

    var defaultTabIcon = "fa fa-lemon-o";
    var dragActive = false;
    var dblClickTime;
    var dblClickArmed = false;

    function createTabs(options) {
        var tabs = {};
        var pinnedTabsCount = 0;
        var currentTabWidth;
        var currentActiveTabWidth = 0;
        var collapsibleMenu;

        var ul = options.element || $("#"+options.id);
        var wrapper = ul.wrap( "<div>" ).parent();
        var scrollContainer = ul.wrap( "<div>" ).parent();
        wrapper.addClass("red-ui-tabs");
        if (options.vertical) {
            wrapper.addClass("red-ui-tabs-vertical");
        }
        if (options.addButton) {
            wrapper.addClass("red-ui-tabs-add");
            var addButton = $('<div class="red-ui-tab-button red-ui-tabs-add"><a href="#"><i class="fa fa-plus"></i></a></div>').appendTo(wrapper);
            addButton.find('a').on("click", function(evt) {
                evt.preventDefault();
                if (typeof options.addButton === 'function') {
                    options.addButton();
                } else if (typeof options.addButton === 'string') {
                    RED.actions.invoke(options.addButton);
                }
            })
            if (typeof options.addButton === 'string') {
                var l = options.addButton;
                if (options.addButtonCaption) {
                    l = options.addButtonCaption
                }
                RED.popover.tooltip(addButton,l,options.addButton);
            }
            ul.on("dblclick", function(evt) {
                var existingTabs = ul.children();
                var clickX = evt.clientX;
                var targetIndex = 0;
                existingTabs.each(function(index) {
                    var pos = $(this).offset();
                    if (pos.left > clickX) {
                        return false;
                    }
                    targetIndex = index+1;
                })
                if (typeof options.addButton === 'function') {
                    options.addButton({index:targetIndex});
                } else if (typeof options.addButton === 'string') {
                    RED.actions.invoke(options.addButton,{index:targetIndex});
                }
            });
        }
        if (options.searchButton) {
            wrapper.addClass("red-ui-tabs-search");
            var searchButton = $('<div class="red-ui-tab-button red-ui-tabs-search"><a href="#"><i class="fa fa-list-ul"></i></a></div>').appendTo(wrapper);
            searchButton.find('a').on("click", function(evt) {
                evt.preventDefault();
                if (typeof options.searchButton === 'function') {
                    options.searchButton()
                } else if (typeof options.searchButton === 'string') {
                    RED.actions.invoke(options.searchButton);
                }
            })
            if (typeof options.searchButton === 'string') {
                var l = options.searchButton;
                if (options.searchButtonCaption) {
                    l = options.searchButtonCaption
                }
                RED.popover.tooltip(searchButton,l,options.searchButton);
            }

        }
        var scrollLeft;
        var scrollRight;

        if (options.scrollable) {
            var scrollSize = 150;
            if (options.minimumActiveTabWidth != undefined) scrollSize = options.minimumActiveTabWidth;
            wrapper.addClass("red-ui-tabs-scrollable");
            scrollContainer.addClass("red-ui-tabs-scroll-container");
            scrollContainer.on("scroll",updateScroll);
            scrollLeft = $('<div class="red-ui-tab-button red-ui-tab-scroll red-ui-tab-scroll-left"><a href="#" style="display:none;"><i class="fa fa-caret-left"></i></a></div>').appendTo(wrapper).find("a");
            scrollLeft.on('mousedown',function(evt) { scrollEventHandler(evt,'-=' + scrollSize) }).on('click',function(evt){ evt.preventDefault();});
            scrollRight = $('<div class="red-ui-tab-button red-ui-tab-scroll red-ui-tab-scroll-right"><a href="#" style="display:none;"><i class="fa fa-caret-right"></i></a></div>').appendTo(wrapper).find("a");
            scrollRight.on('mousedown',function(evt) { scrollEventHandler(evt,'+=' + scrollSize) }).on('click',function(evt){ evt.preventDefault();});

            $(".red-ui-tabs-scroll-container").on('DOMMouseScroll mousewheel', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                //console.warn("workspace tabs mouse scroll");
                var dx = -(evt.originalEvent.detail) || evt.originalEvent.wheelDelta;
                
                //if (dx > 0) scrollContainer.scrollLeft(scrollContainer.scrollLeft() - 75);
                //else if (dx < 0) scrollContainer.scrollLeft(scrollContainer.scrollLeft() + 75);
                if (dx < 0) scrollEventHandler(evt,'+=' + scrollSize, true, 100);
                else if (dx > 0) scrollEventHandler(evt,'-=' + scrollSize, true, 100);
            });
        }
        

        if (options.collapsible) {
            // var dropDown = $('<div>',{class:"red-ui-tabs-select"}).appendTo(wrapper);
            // ul.hide();
            wrapper.addClass("red-ui-tabs-collapsible");

            var collapsedButtonsRow = $('<div class="red-ui-tab-link-buttons"></div>').appendTo(wrapper);

            if (options.menu !== false) {
                var selectButton = $('<a href="#"><i class="fa fa-caret-down"></i></a>').appendTo(collapsedButtonsRow);
                selectButton.addClass("red-ui-tab-link-button-menu")
                selectButton.on("click", function(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    if (!collapsibleMenu) {
                        var pinnedOptions = [];
                        var options = [];
                        ul.children().each(function(i,el) {
                            var id = $(el).data('tabId');
                            var opt = {
                                id:"red-ui-tabs-menu-option-"+id,
                                icon: tabs[id].iconClass || defaultTabIcon,
                                label: tabs[id].name,
                                onselect: function() {
                                    activateTab(id);
                                }
                            };
                            if (tabs[id].pinned) {
                                pinnedOptions.push(opt);
                            } else {
                                options.push(opt);
                            }
                        });
                        options = pinnedOptions.concat(options);
                        collapsibleMenu = RED.menu.init({options: options});
                        collapsibleMenu.css({
                            position: "absolute"
                        })
                        collapsibleMenu.appendTo("body");
                    }
                    var elementPos = selectButton.offset();
                    collapsibleMenu.css({
                        top: (elementPos.top+selectButton.height()-2)+"px",
                        left: (elementPos.left - collapsibleMenu.width() + selectButton.width())+"px"
                    })
                    if (collapsibleMenu.is(":visible")) {
                        $(document).off("click.red-ui-tabmenu");
                    } else {
                        $(".red-ui-menu.red-ui-menu-dropdown").hide();
                        $(document).on("click.red-ui-tabmenu", function(evt) {
                            $(document).off("click.red-ui-tabmenu");
                            collapsibleMenu.hide();
                        });
                    }
                    collapsibleMenu.toggle();
                })
            }

        }
        
        function scrollEventHandler(evt,dir,mouseWheelScroll,speed) {
            evt.preventDefault();
            if ($(this).hasClass('disabled')) {
                return;
            }
            if (speed == undefined) speed = 100;
            //console.warn(dir);
            if (dir.startsWith('+') && evt.ctrlKey) dir = "+=1000000";
            else if (dir.startsWith('-') && evt.ctrlKey) dir = "-=1000000";
            var currentScrollLeft = scrollContainer.scrollLeft();
            scrollContainer.animate( { scrollLeft: dir }, speed);
            var interval = setInterval(function() {
                var newScrollLeft = scrollContainer.scrollLeft()
                if (newScrollLeft === currentScrollLeft) {
                    clearInterval(interval);
                    return;
                }
                currentScrollLeft = newScrollLeft;
                scrollContainer.animate( { scrollLeft: dir }, speed);
            },speed);
            if (mouseWheelScroll == undefined)
                $(this).one('mouseup',function() {
                    clearInterval(interval);
                })
            else
                clearInterval(interval);
        }


        ul.children().first().addClass("active");
        ul.children().addClass("red-ui-tab");

        function getSelection() {
            var selection = ul.find("li.red-ui-tab.selected");
            var selectedTabs = [];
            selection.each(function() {
                selectedTabs.push(tabs[$(this).find('a').attr('href').slice(1)])
            })
            return selectedTabs;
        }

        function selectionChanged() {
            options.onselect(getSelection());
        }

        function onTabClick(evt) {
            if (dragActive) {
                return
            }
            if (dblClickTime && Date.now()-dblClickTime < 400) {
                dblClickTime = 0;
                dblClickArmed = true;
                return onTabDblClick.call(this,evt);
            }
            dblClickTime = Date.now();

            var currentTab = ul.find("li.red-ui-tab.active");
            var thisTab = $(this).parent();
            var fireSelectionChanged = false;
            if (options.onselect) {
                if (evt.metaKey || evt.ctrlKey) {
                    if (thisTab.hasClass("selected")) {
                        thisTab.removeClass("selected");
                        if (thisTab[0] !== currentTab[0]) {
                            // Deselect background tab
                            // - don't switch to it
                            selectionChanged();
                            return;
                        } else {
                            // Deselect current tab
                            // - if nothing remains selected, do nothing
                            // - otherwise switch to first selected tab
                            var selection = ul.find("li.red-ui-tab.selected");
                            if (selection.length === 0) {
                                selectionChanged();
                                return;
                            }
                            thisTab = selection.first();
                        }
                    } else {
                        if (!currentTab.hasClass("selected")) {
                            var currentTabObj = tabs[currentTab.find('a').attr('href').slice(1)];
                            // Auto select current tab
                            currentTab.addClass("selected");
                        }
                        thisTab.addClass("selected");
                    }
                    fireSelectionChanged = true;
                } else if (evt.shiftKey) {
                    if (currentTab[0] !== thisTab[0]) {
                        var firstTab,lastTab;
                        if (currentTab.index() < thisTab.index()) {
                            firstTab = currentTab;
                            lastTab = thisTab;
                        } else {
                            firstTab = thisTab;
                            lastTab = currentTab;
                        }
                        ul.find("li.red-ui-tab").removeClass("selected");
                        firstTab.addClass("selected");
                        lastTab.addClass("selected");
                        firstTab.nextUntil(lastTab).addClass("selected");
                    }
                    fireSelectionChanged = true;
                } else {
                    var selection = ul.find("li.red-ui-tab.selected");
                    if (selection.length > 0) {
                        selection.removeClass("selected");
                        fireSelectionChanged = true;
                    }
                }
            }

            var thisTabA = thisTab.find("a");
            if (options.onclick) {
                options.onclick(tabs[thisTabA.attr('href').slice(1)]);
            }
            activateTab(thisTabA);
            if (fireSelectionChanged) {
                selectionChanged();
            }
        }

        function updateScroll() {
            if (ul.children().length !== 0) {
                var sl = scrollContainer.scrollLeft();
                var scWidth = scrollContainer.width();
                var ulWidth = ul.width();
                if (sl === 0) {
                    scrollLeft.hide();
                } else {
                    scrollLeft.show();
                }
                if (sl === ulWidth-scWidth) {
                    scrollRight.hide();
                } else {
                    scrollRight.show();
                }
            }
        }
        function onTabDblClick(evt) {
            evt.preventDefault();
            if (evt.metaKey || evt.shiftKey) {
                return;
            }
            if (options.ondblclick) {
                options.ondblclick(tabs[$(this).attr('href').slice(1)]);
            }
            return false;
        }

        function activateTab(link) {
            if (typeof link === "string") {
                link = ul.find("a[href='#"+link+"']");
            }
            if (link.length === 0) {
                return;
            }
            if (!link.parent().hasClass("active")) {
                ul.children().removeClass("active");
                ul.children().css({"transition": "width 100ms"});
                link.parent().addClass("active");
                var parentId = link.parent().attr('id');
                wrapper.find(".red-ui-tab-link-button").removeClass("active selected");
                $("#"+parentId+"-link-button").addClass("active selected");
                if (options.scrollable) {
                    var pos = link.parent().position().left;
                    if (pos-21 < 0) {
                        scrollContainer.animate( { scrollLeft: '+='+(pos-50) }, 300);
                    } else if (pos + 120 > scrollContainer.width()) {
                        scrollContainer.animate( { scrollLeft: '+='+(pos + 140-scrollContainer.width()) }, 300);
                    }
                }
                if (options.onchange) {
                    options.onchange(tabs[link.attr('href').slice(1)]);
                }
                updateTabWidths();
                setTimeout(function() {
                    ul.children().css({"transition": ""});
                },100);
            }
        }
        function activatePreviousTab() {
            var previous = ul.find("li.active").prev();
            if (previous.length > 0) {
                activateTab(previous.find("a"));
            }
        }
        function activateNextTab() {
            var next = ul.find("li.active").next();
            if (next.length > 0) {
                activateTab(next.find("a"));
            }
        }

        function updateTabWidths() {
            if (options.vertical) {
                return;
            }
            var tabs = ul.find("li.red-ui-tab");
            var width = wrapper.width();
            var tabCount = tabs.length;
            var tabWidth;

            if (options.collapsible) {
                tabWidth = width - collapsedButtonsRow.width()-10;
                if (tabWidth < 198) {
                    var delta = 198 - tabWidth;
                    var b = collapsedButtonsRow.find("a:last").prev();
                    while (b.is(":not(:visible)")) {
                        b = b.prev();
                    }
                    if (!b.hasClass("red-ui-tab-link-button-pinned")) {
                        b.hide();
                    }
                    tabWidth = width - collapsedButtonsRow.width()-10;
                } else {
                    var space = width - 198 - collapsedButtonsRow.width();
                    if (space > 40) {
                        collapsedButtonsRow.find("a:not(:visible):first").show();
                        tabWidth = width - collapsedButtonsRow.width()-10;
                    }
                }
                tabs.css({width:tabWidth});

            } else {
                //var tabWidth = (width-12-(tabCount*6))/tabCount;
                //currentTabWidth = (100*tabWidth/width)+"%";
                //currentActiveTabWidth = currentTabWidth+"%";
                if (options.scrollable == true) {
                    /*tabWidth = Math.max(tabWidth,200);
                    currentTabWidth = tabWidth+"px";
                    currentActiveTabWidth = 0;
                    var listWidth = Math.max(wrapper.width(),12+(tabWidth+6)*tabCount);
                    ul.width(listWidth);
                    updateScroll();*/
                    var labLabels = ul.find("a.red-ui-tab-label");
                    var totalWidth = 0;
                    currentActiveTabWidth = 1000;
                    for (var i = 0; i < labLabels.length; i++)
                    {
                        //console.warn($(labLabels[i]).attr("title"));//.find(".red-ui-tab-label"));//.attr("title"));
                        var textWidth = RED.view.textsize.calculate($(labLabels[i]).attr("title")).w+24;
                        //if ($(tabs[i]).hasClass("active")) $(labLabels[i]).css('padding-left', '10px');
                        //else $(labLabels[i]).css('padding-left', '12px');
                        totalWidth += textWidth;
                        if (options.hasOwnProperty("minimumTabWidth"))
                        {
                            if (textWidth < options.minimumTabWidth)
                                textWidth = options.minimumTabWidth;
                        }
                        $(tabs[i]).css({width: textWidth});
                    }
                    ul.width(totalWidth);
                    updateScroll();

                } else if (options.hasOwnProperty("minimumActiveTabWidth")) {
                    if (tabWidth < options.minimumActiveTabWidth) {
                        tabCount -= 1;
                        tabWidth = (width-12-options.minimumActiveTabWidth-(tabCount*6))/tabCount;
                        currentTabWidth = (100*tabWidth/width)+"%";
                        currentActiveTabWidth = options.minimumActiveTabWidth+"px";
                    } else {
                        currentActiveTabWidth = 0;
                    }
                    tabs.css({width:options.minimumActiveTabWidth});
                }
                // if (options.collapsible) {
                //     console.log(currentTabWidth);
                // }
               // console.warn(tabs);
               
                //tabs.css({width:currentTabWidth});
                /*if (tabWidth < 50) {
                    // ul.find(".red-ui-tab-close").hide();
                    ul.find(".red-ui-tab-icon").hide();
                    ul.find(".red-ui-tab-label").css({paddingLeft:Math.min(12,Math.max(0,tabWidth-38))+"px"})
                } else {
                    // ul.find(".red-ui-tab-close").show();
                    ul.find(".red-ui-tab-icon").show();
                    ul.find(".red-ui-tab-label").css({paddingLeft:""})
                }*/
                if (currentActiveTabWidth !== 0) {
                    //ul.find("li.red-ui-tab.active").css({"width": currentActiveTabWidth + 6});//options.minimumActiveTabWidth});
                    // ul.find("li.red-ui-tab.active .red-ui-tab-close").show();
                    ul.find("li.red-ui-tab.active .red-ui-tab-icon").show();
                    //ul.find("li.red-ui-tab.active .red-ui-tab-label").css({paddingLeft:"6px"})
                }
            }

        }

        ul.find("li.red-ui-tab a")
            .on("mouseup",onTabClick)
            .on("click", function(evt) {evt.preventDefault(); })
            .on("dblclick", function(evt) {evt.stopPropagation(); evt.preventDefault(); })

        setTimeout(function() {
            updateTabWidths();
        },0);


        function removeTab(id) {
            if (options.onselect) {
                var selection = ul.find("li.red-ui-tab.selected");
                if (selection.length > 0) {
                    selection.removeClass("selected");
                    selectionChanged();
                }
            }
            var li = ul.find("a[href='#"+id+"']").parent();
            if (li.hasClass("active")) {
                var tab = li.prev();
                if (tab.length === 0) {
                    tab = li.next();
                }
                activateTab(tab.find("a"));
            }
            li.remove();
            if (tabs[id].pinned) {
                pinnedTabsCount--;
            }
            if (options.onremove) {
                options.onremove(tabs[id]);
            }
            delete tabs[id];
            updateTabWidths();
            if (collapsibleMenu) {
                collapsibleMenu.remove();
                collapsibleMenu = null;
            }
        }

        return {
            setMinimumTabWidth: function (width) { options.minimumTabWidth = width; updateTabWidths(); },
            addTab: function(tab,targetIndex) {
                if (options.onselect) {
                    var selection = ul.find("li.red-ui-tab.selected");
                    if (selection.length > 0) {
                        selection.removeClass("selected");
                        selectionChanged();
                    }
                }
                tabs[tab.id] = tab;
                var li = $("<li/>",{class:"red-ui-tab"});
                if (ul.children().length === 0) {
                    targetIndex = undefined;
                }
                if (targetIndex === 0) {
                    li.prependTo(ul);
                } else if (targetIndex > 0) {
                    li.insertAfter(ul.find("li:nth-child("+(targetIndex)+")"));
                } else {
                    li.appendTo(ul);
                }
                li.attr('id',"red-ui-tab-"+(tab.id.replace(".","-")));
                li.data("tabId",tab.id);

                if (options.maximumTabWidth) {
                    li.css("maxWidth",options.maximumTabWidth+"px");
                }
                var link = $("<a/>",{href:"#"+tab.id, class:"red-ui-tab-label"}).appendTo(li);
                if (tab.icon) {
                    $('<img src="'+tab.icon+'" class="red-ui-tab-icon"/>').appendTo(link);
                } else if (tab.iconClass) {
                    $('<i>',{class:"red-ui-tab-icon "+tab.iconClass}).appendTo(link);
                }
                //else
                //    $('<i>',{class:"fa fa-cogs"}).appendTo(link);

                var span = $('<span/>',{class:"red-ui-text-bidi-aware"}).text(tab.label).appendTo(link);
                span.attr('dir', RED.text.bidi.resolveBaseTextDir(tab.label));
                if (options.collapsible) {
                    li.addClass("red-ui-tab-pinned");
                    var pinnedLink = $('<a href="#'+tab.id+'" class="red-ui-tab-link-button"></a>');
                    if (tab.pinned) {
                        if (pinnedTabsCount === 0) {
                            pinnedLink.prependTo(collapsedButtonsRow)
                        } else {
                            pinnedLink.insertAfter(collapsedButtonsRow.find("a.red-ui-tab-link-button-pinned:last"));
                        }
                    } else {
                        if (options.menu !== false) {
                            pinnedLink.insertBefore(collapsedButtonsRow.find("a:last"));
                        } else {
                            pinnedLink.appendTo(collapsedButtonsRow);
                        }
                    }

                    pinnedLink.attr('id',li.attr('id')+"-link-button");
                    if (tab.iconClass) {
                        $('<i>',{class:tab.iconClass}).appendTo(pinnedLink);
                    } else {
                        $('<i>',{class:defaultTabIcon}).appendTo(pinnedLink);
                    }
                    pinnedLink.on("click", function(evt) {
                        evt.preventDefault();
                        activateTab(tab.id);
                    });
                    if (tab.pinned) {
                        pinnedLink.addClass("red-ui-tab-link-button-pinned");
                        pinnedTabsCount++;
                    }
                    RED.popover.tooltip($(pinnedLink), tab.name, tab.action);

                }
                link.on("mouseup",onTabClick);
                link.on("click", function(evt) { evt.preventDefault(); })
                link.on("dblclick", function(evt) { evt.stopPropagation(); evt.preventDefault(); })


                if (tab.closeable) {
                    li.addClass("red-ui-tabs-closeable")
                    var closeLink = $("<a/>",{href:"#",class:"red-ui-tab-close"}).appendTo(li);
                    closeLink.append('<i class="fa fa-times" />');
                    closeLink.on("click",function(event) {
                        event.preventDefault();
                        removeTab(tab.id);
                    });
                }

                var badges = $('<span class="red-ui-tabs-badges"></span>').appendTo(li);
                if (options.onselect) {
                    $('<i class="red-ui-tabs-badge-changed fa fa-circle"></i>').appendTo(badges);
                    $('<i class="red-ui-tabs-badge-selected fa fa-check-circle"></i>').appendTo(badges);
                }
                if (options.onadd) {
                    options.onadd(tab);
                }
                link.attr("title",tab.label);
                if (ul.find("li.red-ui-tab").length == 1) {
                    activateTab(link);
                }
                if (options.onreorder) {
                    var originalTabOrder;
                    var tabDragIndex;
                    var tabElements = [];
                    var startDragIndex;

                    li.draggable({
                        axis:"x",
                        distance: 20,
                        start: function(event,ui) {
                            if (dblClickArmed) { dblClickArmed = false; return false }
                            dragActive = true;
                            originalTabOrder = [];
                            tabElements = [];
                            ul.children().each(function(i) {
                                tabElements[i] = {
                                    el:$(this),
                                    text: $(this).text(),
                                    left: $(this).position().left,
                                    width: $(this).width()
                                };
                                if ($(this).is(li)) {
                                    tabDragIndex = i;
                                    startDragIndex = i;
                                }
                                originalTabOrder.push($(this).data("tabId"));
                            });
                            ul.children().each(function(i) {
                                if (i!==tabDragIndex) {
                                    $(this).css({
                                        position: 'absolute',
                                        left: tabElements[i].left+"px",
                                        width: tabElements[i].width+2,
                                        transition: "left 0.3s"
                                    });
                                }

                            })
                            if (!li.hasClass('active')) {
                                li.css({'zIndex':1});
                            }
                        },
                        drag: function(event,ui) {
                            ui.position.left += tabElements[tabDragIndex].left+scrollContainer.scrollLeft();
                            var tabCenter = ui.position.left + tabElements[tabDragIndex].width/2 - scrollContainer.scrollLeft();
                            for (var i=0;i<tabElements.length;i++) {
                                if (i === tabDragIndex) {
                                    continue;
                                }
                                if (tabCenter > tabElements[i].left && tabCenter < tabElements[i].left+tabElements[i].width) {
                                    if (i < tabDragIndex) {
                                        tabElements[i].left += tabElements[tabDragIndex].width+8;
                                        tabElements[tabDragIndex].el.detach().insertBefore(tabElements[i].el);
                                    } else {
                                        tabElements[i].left -= tabElements[tabDragIndex].width+8;
                                        tabElements[tabDragIndex].el.detach().insertAfter(tabElements[i].el);
                                    }
                                    tabElements[i].el.css({left:tabElements[i].left+"px"});

                                    tabElements.splice(i, 0, tabElements.splice(tabDragIndex, 1)[0]);

                                    tabDragIndex = i;
                                    break;
                                }
                            }
                        },
                        stop: function(event,ui) {
                            dragActive = false;
                            ul.children().css({position:"relative",left:"",transition:""});
                            if (!li.hasClass('active')) {
                                li.css({zIndex:""});
                            }
                            updateTabWidths();
                            if (startDragIndex !== tabDragIndex) {
                                options.onreorder(startDragIndex, tabDragIndex, $.makeArray(ul.children().map(function() { return $(this).data('tabId');})));// originalTabOrder, );
                            }
                            activateTab(tabElements[tabDragIndex].el.data('tabId'));
                        }
                    })
                }
                setTimeout(function() {
                    updateTabWidths();
                },10);
                if (collapsibleMenu) {
                    collapsibleMenu.remove();
                    collapsibleMenu = null;
                }
            },
            removeTab: removeTab,
            activateTab: activateTab,
            nextTab: activateNextTab,
            previousTab: activatePreviousTab,
            resize: updateTabWidths,
            count: function() {
                return ul.find("li.red-ui-tab").length;
            },
            contains: function(id) {
                return ul.find("a[href='#"+id+"']").length > 0;
            },
            renameTab: function(id,label) {
                tabs[id].label = label;
                var tab = ul.find("a[href='#"+id+"']");
                tab.attr("title",label);
                tab.find("span.red-ui-text-bidi-aware").text(label).attr('dir', RED.text.bidi.resolveBaseTextDir(label));
                updateTabWidths();
            },
            selection: getSelection,
            order: function(order) {
                var existingTabOrder = $.makeArray(ul.children().map(function() { return $(this).data('tabId');}));
                if (existingTabOrder.length !== order.length) {
                    return
                }
                var i;
                var match = true;
                for (i=0;i<order.length;i++) {
                    if (order[i] !== existingTabOrder[i]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    return;
                }
                var existingTabMap = {};
                var existingTabs = ul.children().detach().each(function() {
                    existingTabMap[$(this).data("tabId")] = $(this);
                });
                for (i=0;i<order.length;i++) {
                    existingTabMap[order[i]].appendTo(ul);
                }
            }

        }
    }

    return {
        create: createTabs
    }
})();
