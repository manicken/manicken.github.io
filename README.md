Main Screen With my project:
![MainScreenDemo](/MainScreenDemo.png)

I have included my complete Poly Synth Project into the html
it's available at the rightmost menu -> Examples -> Manicken Poly Synth
that can be exported as a zip/or using the plugin (more about that down)


As you can see a lot has happened:

* Settings tab at the right sidebar
where some user customizations can be done
like project name + default include header
settings are sorted in different categories,
and subcategories.
The settings are saved with the project.

* Workspace toolbar:
common functions cut copy paste
workspace move left/right (to organize the tabs)
GUI Edit/Run (only used for the UI objects)

the toolbar can be hidden in the settings

* Drop down Import and Export Menus
![ImportMenu](/ImportMenu.png)

* when exporting/saving the nodes are sorted by the visible major grid columns
1 4 7
2 5 8
3 6 9

note. the UI items are never sorted

* Simple export is used for "classic" exports.
At the moment it only supports exporting of the current "tab"
and is only meant to be used when doing small and simple projects
it currently have no support for arrays and subclasses
however it exports:
IncludeDef, Variables, CodeFile, Function, AudioStreamObject and DontRemoveCodeFiles node-types.

* save/load the whole design to/from a JSON file

* create a design in parts that is then exported as different classes
(was already in my prev. version)

* export the whole class based design to a zip file
for those that don't want to use the extensions and/or
just want to make a "shippable" version
this zip also contains the JSON in human readable format.

* menu "buttons" that is not that obvious have popup descriptions.

* create code directly in the "Tool" using ACE editor
with local multilevel autocomplete,
that means it uses the current design objects to create the autocomplete list.
It also utilizes the embedded documentation to create the function lists,
with descriptions both for the objects and object functions.
Autocomplete currently don't have support for variables.

example how the autocomplete looks:
![Autocomplete_MultiLevel](/Autocomplete_MultiLevel.png)

Code is edited in CodeFile and Function node types.

* Arduino IDE plugin/extension
https://github.com/manicken/arduinoAPIwebserver

* VSCODE extension
https://github.com/manicken/vscode_api_webserver

* in short the IDE extensions is used to create a direct link between the "Tool"
and the IDE:s (so that no copy/paste is needed).
The extensions send all exported classes as separate files, to make nice and tidy code files.
The extensions also make it possible to send verify/upload commands so that you can make all
development in the "Tool".
i.e. Just click export (simple/class) then click upload, and the changes are direcly applied
without even touching either Arduino IDE or VSCODE.

The extensions also capture the output of the compile output and send them to the "Tool"
visible in the "Tool" bottom output-log

Note. Arduino IDE compile verbose mode generates alot of information,
so in short: the output in the "Tool" still outputs data long after the actual compile has been finished
in the Arduino IDE.

In VSCODE the compile don't generate so much information and that is not having any "delay"
but in VSCODE the terminal capture is not working by default, and VSCODE needs to be started with
the parameter --enable-proposed-api JannikSvensson.api-webserver
(yes proposed-api is available in the standard version, even if microsoft say it's not)
the information of doing so is available at the VSCODE extension github page.

Only the Arduino IDE extension is supporting the "midi to websocket bridge"
that is used by "UI item node" midiSend commands.
This is because midi is not native in Node.js, and the node-midi (https://www.npmjs.com/package/midi)
had some version compatibility problems in VSCODE.

But I have made the Arduino IDE plugin .jar executable,
that only contains the "midi to websocket bridge".

The MIDI device selection is done in the "Tool" at the settings tab - BiDirData WebSocketBridge - MIDI

* UI nodes (directly resizeable)
is meant to be used together with the BiDirData WebSocketBridge
to control a midi device from the "Tool"
this is to make it easier to have everything in one "project".

to send data to a connected midi device the sendmidi(0x90, 60, 0x3F) command is used (note. that the parameters can be mixed types)

All UI nodes have user-selectable colors.

UI node types currently supported:

* group (is in the UI category)
can contain groups of nodes, all types are supported
can even place group into group, fully drag/drop (not like "Node-Red" group)
completely made from scratch.
the objects placed inside a group uses "global" position and not local (as expected),
this is because I did not want to screw up the positions and also make it easier to code.
the group act like a lasso-selection (but it uses a node-list to determite which nodes that is "inside")

the group can have label that is placed inside it at the top center
(in a future version it should be user placeable like in the "node-red"-group)

I plan to use the group like a exportable class/(seperate object) so that it can be used like a array.
so the checkbox "Export as class" have no function yet.

example of grouped listboxes:
![GroupedListBoxes](/GroupedListBoxes.png)

* UI_Button
have seperate pressed and release send data fields (the text in the field is the raw data sent)

* UI_Slider (vertical or horizontal orientation)
(send on move or release)
have a bottom placed label that can show the current value
(the text to show is parsed using javascript eval(), that means complex formulas can be used)
have a "Send Format" field that is also parsed by the eval, example:
"midisend(0xB0,"+d.midiId+"," + d.val + ");"

![H Slider](/H_Slider.png)
![V Slider](/V_Slider.png)

* UI_Label
is a borderless node with a selectable background color

* UI_ListBox
contains a list of items and behaves like radio buttons.
when placed in a group and the group have the checkbox "Individual ListBox Mode" unchecked they all
behaves like a big listbox item (can be used when long list of items need to be splitted into many columns)
sendCommand example:
"midiSend("+(0xB0+d.midiCh)+","+d.midiId+","+d.sel ectedIndex+")"

![ListBox](/ListBox.png)

* UI_Piano (one octave)
this is the most advanced (by design) node yet
it's a single octave Piano-part (multiple can be stacked together to form a full size 128key keyboard)

sendCommand example:
"midiSend("+(d.keyDown+d.midiCh)+","+(d.octave*12+ d.keyIndex) +",127)"

![Piano](/Piano.png)

* UI_ScriptButton
this is the most fun node type,
it's used editable JavaScript that is executed when the button is pressed (in GUI run mode)
this can be used to automate alot of things,
I have used to automatically place the full-size keyboard above, with all sendCommands prefilled.
Also I have used it to place the sliders used to control the envelope.
And to make a beatiful rainbow equalizer slider-array.

It uses the View.js as the eval base, so that every function available in View.js can be used directly.

It can also be used for a custom export for custom structures.

* the import and export has been drop down menus with a lot of choices

* the palette have all categories closed by default (so its easier to find items)
+ automatic close of other than current selected
+ input and output have sub categories sorted by "device"(don't know what to call it)
+ used category which contains all AudioObject-types used (to make it easier to make copies of used objects)
+ 3 new categories:
1. tabs (contains class IO nodes + all class nodes)

* print function at right menu/(ctrl+p) that only uses the workspace-area as the print source

* save button (ctrl+s) to ensure that the design is saved
save notification that shows when the design is saved

* Junction Nodes (used to split many signals and to make the design easier to follow)
have two variants one that goes in normal direction L-R
and one that goes in the reverse direction

example of R-L junction usage:<br>
![ReverseJunction](/ReverseJunction.png)

I tried my best to make the embedded documentation as clear as possible,
but contributions is appreciated.
Or if there is something that needs more explanation, please let me know.


List of future plans (in priority order):

* tidy up the node label/text redraw code
(to make it more efficient because the getTextSize is taking alot of time)
so buffering of the textDimensions is needed for all labels/texts

* Make a very simple sequencer with the help of piano as guide and group with lines for the sequence part
the notes/actions should be done with the UI_Button (because it have both pressed(enter) and released(leave) actions)

* make group export as class
I have included two proposed designs into the html
it's available at the rightmost menu -> Examples -> GroupBasedDesign (this contains two tabs with each design)

* "exploded" export where a design can be defined in tabs but then exported as "classic"-export

* multitab code editor