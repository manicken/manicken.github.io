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
RED.state = {
	DEFAULT: 0,
	MOVING: 1,
	JOINING: 2,
	MOVING_ACTIVE: 3,
	ADDING: 4,
	EDITING: 5,
	EXPORT: 6,
	IMPORT: 7,
	IMPORT_DRAGGING: 8,

	RESIZE_LEFT: 101,
	RESIZE_RIGHT: 102,
	RESIZE_TOP: 103,
	RESIZE_BOTTOM: 104,
	RESIZE_TOP_LEFT: 105,
	RESIZE_TOP_RIGHT:106,
	RESIZE_BOTTOM_LEFT:107,
	RESIZE_BOTTOM_RIGHT:108,

	UI_OBJECT_MOUSE_UP:120,
	UI_OBJECT_MOUSE_DOWN:121
}
