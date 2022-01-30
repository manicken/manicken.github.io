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
RED.notify = (function() {
	var currentNotifications = [];
	var c = 0;
	return function(msg,type,fixed,timeout,width) {
		if (currentNotifications.length > 4) {
			var ll = currentNotifications.length;
			for (var i = 0;ll > 4 && i<currentNotifications.length;i+=1) {
				var notifiction = currentNotifications[i];
				if (!notifiction.fixed) {
					window.clearTimeout(notifiction.timeoutid);
					notifiction.close();
					ll -= 1;
				}
			}
		}
		var n = document.createElement("div");
		n.id="red-notification-"+c;
		n.className = "alert";
		n.fixed = fixed;
		
		if (type) {
			n.className = "alert alert-"+type;
		}
        n.style.display = "none";
        if (width != undefined)
        {
            if (typeof width == "number")
                width = width + "px";
            n.style.width = width;
        }
		n.innerHTML = msg;
        if (type) {
            if (type == "warning" && RED.main.settings.LogAddNotificationWarning == true) {
                RED.bottombar.info.addContent('<div class="alert alert-'+type+' message">'+msg+"</div>");
            }
            else if (type == "error" && RED.main.settings.LogAddNotificationError == true) {
                RED.bottombar.info.addContent('<div class="alert alert-'+type+' message">'+msg+"</div>");
            }
            else if (type == "info" && RED.main.settings.LogAddNotificationInfo == true) {
                RED.bottombar.info.addContent('<div class="alert alert-'+type+' message">'+msg+"</div>");
            }
            else if (RED.main.settings.LogAddNotificationOther == true) {
                RED.bottombar.info.addContent('<div class="alert alert-'+type+' message">'+msg+"</div>");
            }
        }
		$("#notifications").append(n);
		//$("#notifications").css("left", "50%");
		$(n).slideDown(100);
		n.close = (function() {
			var nn = n;
			return function() {
				currentNotifications.splice(currentNotifications.indexOf(nn),1);
				$(nn).slideUp(100, function() {
						nn.parentNode.removeChild(nn);
				});
			};
		})();
		if (!fixed) {
            
			n.timeoutid = window.setTimeout(n.close,timeout||3000);
		}
        $(n).on("click", (function() {
            var nn = n;
            return function() {
                nn.close();
                window.clearTimeout(nn.timeoutid);
            };
        })());
		currentNotifications.push(n);
		c+=1;
		return n;
	}
})();

