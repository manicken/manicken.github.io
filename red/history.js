/** Modified from original Node-Red source, for audio system visualization
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
RED.history = (function() {
	var undo_history = [];
    var redo_history = [];
	function exec(ev) {
        var i;
        if (ev == undefined) return;

        if (ev.t == 'add') {
            if (ev.nodes != undefined)
            {
                for (i=0;i<ev.nodes.length;i++) {
                    RED.nodes.remove(ev.nodes[i]);
                }
            }
            if (ev.links != undefined)
            {
                for (i=0;i<ev.links.length;i++) {
                    RED.nodes.removeLink(ev.links[i]);
                }
            }
            if (ev.workspaces != undefined)
            {
                for (i=0;i<ev.workspaces.length;i++) {
                    RED.nodes.removeWorkspace(ev.workspaces[i].id);
                    RED.view.removeWorkspace(ev.workspaces[i]);
                }
            }
        } else if (ev.t == "delete") {
            if (ev.workspace != undefined)
            {
                //for (i=0;i<ev.workspaces.length;i++) {
                    RED.nodes.addWorkspace(ev.workspace, ev.workspaceIndex);
                    RED.view.addWorkspace(ev.workspace, ev.workspaceIndex);
                //}
            }
            if (ev.nodes != undefined && ev.workspace == undefined) // not needed for new structure, as this will then make duplicates
            {
                for (i=0;i<ev.nodes.length;i++) {
                    RED.nodes.add(ev.nodes[i]);
                }
            }
            if (ev.links != undefined && ev.workspace == undefined) // not needed for new structure, as this will then make duplicates
            {
                for (i=0;i<ev.links.length;i++) {
                    RED.nodes.addLink(ev.links[i]);
                }
            }
            
        } else if (ev.t == "move") {
            for (i=0;i<ev.nodes.length;i++) {
                var n = ev.nodes[i];
                n.n.x = n.ox;
                n.n.y = n.oy;
                n.n.dirty = true;
            }
        } else if (ev.t == "edit") {
            console.warn(ev);
            for (i in ev.changes) {
                if (ev.changes.hasOwnProperty(i)) {
                    if (i == "name")
                        RED.events.emit("nodes:renamed",ev.node,ev.node.name);
                    ev.node[i] = ev.changes[i];
                    
                }
            }
            RED.editor.updateNodeProperties(ev.node);
            for (i=0;i<ev.links.length;i++) {
                RED.nodes.addLink(ev.links[i]);
            }
            RED.editor.validateNode(ev.node);
            ev.node.dirty = true;
            ev.node.changed = ev.changed;
        }
        if ((ev.t == "add" || ev.t == "delete") && ev.changedNodes != undefined) { // when using dyninput objects
            for (ni=0;ni<ev.changedNodes.length;ni++) {
                var node = ev.changedNodes[ni].node;
                var changes = ev.changedNodes[ni].changes;
                var changed = ev.changedNodes[ni].changed;
                for (i in changes) {
                    if (changes.hasOwnProperty(i)) {
                        node[i] = changes[i];
                        if (i == "name") // this would never happend
                            RED.events.emit("nodes:renamed",node,changes.name);
                    }
                }
                if (node._def.dynInputs != undefined) {
                    RED.events.emit("nodes:inputs", node, ev.changedNodes[ni].newChange.inputs, ev.changedNodes[ni].changes.inputs);
                }
                RED.editor.updateNodeProperties(node);
                RED.editor.validateNode(node);
                node.dirty = true;
                node.changed = changed;
            }
        }
        RED.view.dirty(ev.dirty);
        RED.view.redraw();
    }

	return {
		//TODO: this function is a placeholder until there is a 'save' event that can be listened to
		markAllDirty: function() {
			for (var i=0;i<undo_history.length;i++) {
				undo_history[i].dirty = true;
			}
		},
		depth: function() {
			return undo_history.length;
		},
		push: function(ev) {
			undo_history.push(ev);
			//console.trace();
		},
        redo: function() {
			/*var ev = redo_history.pop();
            if (ev == undefined) return;
            console.error(ev);
            exec(ev);
            /*if (ev.t == "add") ev.t = "delete";
            else if (ev.t == "delete") ev.t = "add";
            undo_history.push(ev);*/
            //console.error(ev);
		},
		pop: function() {
			var ev = undo_history.pop();
            if (ev == undefined) return;
            console.error(ev);
            exec(ev);
            RED.storage.update();
            /* disable redo it for now
            if (ev.t == "add") ev.t = "delete";
            else if (ev.t == "delete") ev.t = "add";
            redo_history.push(ev);
            */
		}
	}

})();


RED.validators = {
	number: function(){return function(v) { return v!=='' && !isNaN(v);}},
	regex: function(re){return function(v) { return re.test(v);}}
};
