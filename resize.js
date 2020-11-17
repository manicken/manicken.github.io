(function (window) {
    'use strict';

    function defineLibrary() {
        var ResizeJs = {};
        var rsCollection = [];

        class Handle{
            constructor(parent, position, parentMinWidth, parentMinHeight){
                this.parent = parent;
                this.elem = document.createElement('div');
                this.elem.setAttribute('draggable', 'true');
                this.elem.className = "handles " + position+"-handle";
                parent.appendChild(this.elem);

                this.moving = false;
                this.offsetX = 0;
                this.offsetY = 0;
                this.parentHeight = this.parent.clientHeight;
                this.parentWidth = this.parent.clientWidth;

                this.parentMinWidth = parentMinWidth;
                this.parentMinHeight = parentMinHeight;

                this.elem.addEventListener("dragstart", ev => this.dragstart(ev), false);
                this.elem.addEventListener("drag", ev => this.drag(ev), false);
                this.elem.addEventListener("dragend", ev => this.dragend(ev), false);
                this.elem.addEventListener("drop", ev => this.drop(ev), false);

            }

            n(ev){
                this.parent.style.top = ev.clientY +'px';
                this.parent.style.height = this.parentHeight - (ev.clientY - this.offsetY) +'px';
            }

            s(ev){
                this.parent.style.height = ev.clientY - this.parent.offsetTop +'px';
            }

            e(ev){
                this.parent.style.width = ev.clientX - this.parent.offsetLeft +'px';
            }

            w(ev){
                this.parent.style.width = this.offsetX - ev.clientX + this.parentWidth +'px';
                this.parent.style.left = ev.clientX +'px';
            }

            setDirection(ev){                
                switch (ev.target.className){
                    case 'handles nw-handle':
                        this.n(ev);
                        this.w(ev);
                        break;

                    case 'handles n-handle':
                        this.n(ev);
                        break;

                    case 'handles ne-handle':
                        this.n(ev);
                        this.e(ev);
                        break;

                    case 'handles e-handle':
                        this.e(ev);
                        break;

                    case 'handles se-handle':
                        this.s(ev);
                        this.e(ev);
                        break;

                    case 'handles s-handle':
                        this.s(ev);
                        break;

                    case 'handles sw-handle':
                        this.s(ev);
                        this.w(ev);
                        break;

                    case 'handles w-handle':
                        this.w(ev);
                        break;
                }
            }


            checkSize(){
                if(this.parent.clientHeight >= this.parentMinHeight && this.parent.clientWidth <= this.parentMinWidth){
                    return 'w';
                }
                else if(this.parent.clientHeight <= this.parentMinHeight && this.parent.clientWidth >= this.parentMinWidth){
                    return 'h';
                }
                else if(this.parent.clientHeight <= this.parentMinHeight && this.parent.clientWidth <= this.parentMinWidth){
                    return 'both';
                }
            }

            dragstart(ev){
                ev.stopPropagation();
                this.elem.style.opacity = 0;
                this.moving = true;
                this.parentHeight = this.parent.clientHeight;
                this.parentWidth = this.parent.clientWidth;
                this.offsetX = this.parent.offsetLeft;
                this.offsetY = this.parent.offsetTop;
            }

            drag(ev){
                ev.stopPropagation();
                if(this.moving)
                {                    
                    this.setDirection(ev);
                }
            }

            dragend(ev){
                // This replace the handle at the right position
                this.elem.style = '';
                this.elem.style.opacity = 1;
                this.elem.style.display = 'block';
                this.moving = false;
                this.setDirection(ev);
                
                switch (this.checkSize()){
                    case 'w':
                        this.parent.style.width = this.parentMinWidth + 'px';
                        break;

                    case 'h':
                        this.parent.style.height = this.parentMinHeight + 'px';
                        break;

                    case 'both':
                        this.parent.style.width = this.parentMinWidth + 'px';
                        this.parent.style.height = this.parentMinHeight + 'px';
                        break;
                }
            }

            drop(ev){
                ev.stopPropagation();
            }
        }

        class Resizable{

            /**
             * Constructor of draggable element
             * @param {DOM Element}   elem     The element that you can drag and drop
             * @param {DOM Element} dropable The element on which you can drop the element, default is the body
             */
            constructor(elem, dropable, minWidth, minHeight){
                this.elem = elem;
                this.elem.className += " resizable";
                this.elem.setAttribute('draggable', 'true');
                this.elem.style.position = 'absolute';
                this.dropable = dropable;
                this.minWidth = minWidth;
                this.minHeight = minHeight;

                this.selected = false;
                this.moving = false;
                this.offsetX = 0;
                this.offsetY = 0;
                this.x = 0;
                this.y = 0;

                this.dropable.addEventListener("dragover", this.allowDrop, false);
                this.elem.addEventListener("dragover", this.allowDrop, false);

                this.elem.addEventListener("mousedown", ev => this.select(ev), false);
                this.elem.addEventListener("dragstart", ev => this.dragstart(ev), false);
                this.elem.addEventListener("drag", ev => this.drag(ev), false);
                //                this.elem.addEventListener("dragend", ev => this.dragend(ev), false);
                this.elem.addEventListener("drop", ev => this.drop(ev), false);

                this.handles = ['n', 'ne', 'nw', 'w', 'e', 's', 'sw', 'se'];

                for(var i=0, length=this.handles.length; i<length; i++){
                    var handle = new Handle(this.elem, this.handles[i], this.minWidth, this.minHeight);   
                }
            }


            allowDrop(ev) {
                ev.preventDefault();
            }

            /**
             * Select a Resizable object
             */
            select(ev){

                // First we need to deselect other selected items
                for(var item of rsCollection){
                    item.deselect();
                }

                this.selected = true;

                this.elem.style.border = "solid 1px dodgerblue";
                this.elem.style.zIndex = 1;

                var handles = this.elem.getElementsByClassName('handles');
                for(var each of handles){
                    each.style.display = 'block';
                }
            }

            /**
             * Unselect a Resizable object
             */
            deselect(){
                this.selected = false;

                this.elem.style.border = "none";
                this.elem.style.zIndex = 0;

                var handles = this.elem.getElementsByClassName('handles');
                for(var each of handles){
                    each.style.display = 'none';
                }
            }

            dragstart(ev){
                ev.stopPropagation();
                this.select(ev);
                this.moving = true;
                this.offsetX = ev.clientX - ev.target.offsetLeft;
                this.offsetY = ev.clientY - ev.target.offsetTop;
            }

            drag(ev){
                ev.stopPropagation();
                if(this.moving)
                {
                    ev.target.style.left = ev.clientX - this.offsetX + 'px';
                    ev.target.style.top = ev.clientY - this.offsetY + 'px';
                }
            }

            /**
             * set the moving property to false
             * @param {event} ev dragend event
             */
            dragend(ev){                
                ev.stopPropagation();
                this.moving = false;
                ev.target.style.left = ev.clientX - this.offsetX + 'px';
                ev.target.style.top = ev.clientY - this.offsetY + 'px';
            }

            drop(ev){
                ev.stopPropagation();
                this.moving = false;
                ev.target.style.left = ev.clientX - this.offsetX + 'px';
                ev.target.style.top = ev.clientY - this.offsetY + 'px';
            }
        }




        /**
         * Get a dom element and transform it into a Resizable Object
         * @param   {String} selector The id of an dom element
         * @returns {Resizable} array of instances of Resizable
         */
        ResizeJs.apply = function (selector, dropable = document.body, minWidth = 0, minHeight = 0) {
            var els = document.querySelectorAll(selector);
            for (var item of els) {
                rsCollection.push( new Resizable(item, dropable, minWidth, minHeight) );
            }

            return rsCollection;
        }


        window.addEventListener("load", function(){
            document.addEventListener('click', function(ev){

                var reg = new RegExp('resizable|handles')
                if(!reg.test(ev.target.className)){
                    for(var item of rsCollection){
                        item.deselect();
                    }
                }

            }, false)
        });
        return ResizeJs;
    }



    //define globally if it doesn't already exist
    if (typeof (ResizeJs) === 'undefined') {
        window.ResizeJs = defineLibrary();
    } else {
        console.log("Library already defined.");
    }

})(window);