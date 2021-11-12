Main Screen With my project:<br>
![MainScreenDemo](/helpImgs/MainScreenDemo.png)

I have included my complete Poly Synth Project into the html<br>
it's available at the rightmost menu -> Examples -> Manicken Poly Synth<br>
that can be exported as a zip/or using the plugin (more about that down)<br>

* Settings tab at the right sidebar<br>
where some user customizations can be done<br>
like project name + default include header<br>
settings are sorted in different categories,<br>
and subcategories.<br>
The settings are saved with the project.<br>

* Workspace toolbar:<br>
common functions cut copy paste<br>
workspace move left/right (to organize the tabs)<br>
GUI Edit/Run (only used for the UI objects)<br>

the toolbar can be hidden in the settings<br>

* Drop down Import and Export Menus<br>
![ImportMenu](/helpImgs/ImportMenu.png)

* when exporting/saving the nodes are sorted by the visible major grid columns<br>
1 4 7<br>
2 5 8<br>
3 6 9<br>

note. the UI items are never sorted<br>

* Simple export is used for "classic" exports.<br>
At the moment it only supports exporting of the current "tab"<br>
and is only meant to be used when doing small and simple projects<br>
it currently have no support for arrays and subclasses<br>
however it exports:<br>
IncludeDef, Variables, CodeFile, Function, AudioStreamObject and DontRemoveCodeFiles node-types.<br>

* save/load the whole design to/from a JSON file<br>

* create a design in parts that is then exported as different classes<br>
(was already in my prev. version)<br>

* export the whole class based design to a zip file<br>
for those that don't want to use the extensions and/or<br>
just want to make a "shippable" version<br>
this zip also contains the JSON in human readable format.<br>

* menu "buttons" that is not that obvious have popup descriptions.<br>

* create code directly in the "Tool" using ACE editor<br>
with local multilevel autocomplete,<br>
that means it uses the current design objects to create the autocomplete list.<br>
It also utilizes the embedded documentation to create the function lists,<br>
with descriptions both for the objects and object functions.<br>
Autocomplete currently don't have support for variables.<br>

example how the autocomplete looks:<br>
![Autocomplete_MultiLevel](/helpImgs/Autocomplete_MultiLevel.png)

Code is edited in CodeFile and Function node types.<br>

* Arduino IDE plugin/extension<br>
https://github.com/manicken/arduinoAPIwebserver<br>

* VSCODE extension<br>
https://github.com/manicken/vscode_api_webserver<br>

* in short the IDE extensions is used to create a direct link between the "Tool"<br>
and the IDE:s (so that no copy/paste is needed).<br>
The extensions send all exported classes as separate files, to make nice and tidy code files.<br>
The extensions also make it possible to send verify/upload commands so that you can make all<br>
development in the "Tool".<br>
i.e. Just click export (simple/class) then click upload, and the changes are direcly applied<br>
without even touching either Arduino IDE or VSCODE.<br>

The extensions also capture the output of the compile output and send them to the "Tool"<br>
visible in the "Tool" bottom output-log<br>

Note. Arduino IDE compile verbose mode generates alot of information,<br>
so in short: the output in the "Tool" still outputs data long after the actual compile has been finished<br>
in the Arduino IDE.<br>

In VSCODE the compile don't generate so much information and that is not having any "delay"<br>
but in VSCODE the terminal capture is not working by default, and VSCODE needs to be started with<br>
the parameter --enable-proposed-api JannikSvensson.api-webserver<br>
(yes proposed-api is available in the standard version, even if microsoft say it's not)<br>
the information of doing so is available at the VSCODE extension github page.<br>

Only the Arduino IDE extension is supporting the "midi to websocket bridge"<br>
that is used by "UI item node" midiSend commands.<br>
This is because midi is not native in Node.js, and the node-midi (https://www.npmjs.com/package/midi)<br>
had some version compatibility problems in VSCODE.<br>

But I have made the Arduino IDE plugin .jar executable,<br>
that only contains the "midi to websocket bridge".<br>

The MIDI device selection is done in the "Tool" at the settings tab - BiDirData WebSocketBridge - MIDI<br>

* UI nodes (directly resizeable)<br>
is meant to be used together with the BiDirData WebSocketBridge<br>
to control a midi device from the "Tool"<br>
this is to make it easier to have everything in one "project".<br>
<br>
to send data to a connected midi device the sendmidi(0x90, 60, 0x3F) command is used (note. that the parameters can be mixed types)<br>

All UI nodes have user-selectable colors.<br>

UI node types currently supported:<br>

* group (is in the UI category)<br>
can contain groups of nodes, all types are supported<br>
can even place group into group, fully drag/drop (not like "Node-Red" group)<br>
completely made from scratch.<br>
the objects placed inside a group uses "global" position and not local (as expected),<br>
this is because I did not want to screw up the positions and also make it easier to code.<br>
the group act like a lasso-selection (but it uses a node-list to determite which nodes that is "inside")<br>

the group can have label that is placed inside it at the top center<br>
(in a future version it should be user placeable like in the "node-red"-group)<br>

I plan to use the group like a exportable class/(seperate object) so that it can be used like a array.<br>
so the checkbox "Export as class" have no function yet.<br>

example of grouped listboxes:<br>
![GroupedListBoxes](/helpImgs/GroupedListBoxes.png)

* UI_Button<br>
have seperate pressed and release send data fields (the text in the field is the raw data sent)<br>

* UI_Slider (vertical or horizontal orientation)<br>
(send on move or release)<br>
have a bottom placed label that can show the current value<br>
(the text to show is parsed using javascript eval(), that means complex formulas can be used)<br>
have a "Send Format" field that is also parsed by the eval, example:<br>
"midisend(0xB0,"+d.midiId+"," + d.val + ");"<br>

![H Slider](/helpImgs/H_Slider.png)
![V Slider](/helpImgs/V_Slider.png)

* UI_Label<br>
is a borderless node with a selectable background color<br>

* UI_ListBox
contains a list of items and behaves like radio buttons.<br>
when placed in a group and the group have the checkbox "Individual ListBox Mode" unchecked they all<br>
behaves like a big listbox item (can be used when long list of items need to be splitted into many columns)<br>
sendCommand example:<br>
"midiSend("+(0xB0+d.midiCh)+","+d.midiId+","+d.sel ectedIndex+")"<br>

![ListBox](/helpImgs/ListBox.png)

* UI_Piano (one octave)<br>
this is the most advanced (by design) node yet<br>
it's a single octave Piano-part (multiple can be stacked together to form a full size 128key keyboard)<br>

sendCommand example:<br>
"midiSend("+(d.keyDown+d.midiCh)+","+(d.octave*12+ d.keyIndex) +",127)"<br>

![Piano](/helpImgs/Piano.png)

* UI_ScriptButton<br>
this is the most fun node type,<br>
it's used editable JavaScript that is executed when the button is pressed (in GUI run mode)<br>
this can be used to automate alot of things,<br>
I have used to automatically place the full-size keyboard above, with all sendCommands prefilled.<br>
Also I have used it to place the sliders used to control the envelope.<br>
And to make a beatiful rainbow equalizer slider-array.<br>

It uses the View.js as the eval base, so that every function available in View.js can be used directly.<br>

It can also be used for a custom export for custom structures.<br>

* the import and export has been drop down menus with a lot of choices<br>

* the palette have all categories closed by default (so its easier to find items)<br>
+ automatic close of other than current selected<br>
+ input and output have sub categories sorted by "device"(don't know what to call it)<br>
+ used category which contains all AudioObject-types used (to make it easier to make copies of used objects)<br>
+ 3 new categories:<br>
1. tabs (contains class IO nodes + all class nodes)<br>

* print function at right menu/(ctrl+p) that only uses the workspace-area as the print source<br>

* save button (ctrl+s) to ensure that the design is saved<br>
save notification that shows when the design is saved<br>

* Junction Nodes (used to split many signals and to make the design easier to follow)<br>
have two variants one that goes in normal direction L-R<br>
and one that goes in the reverse direction<br>

example of R-L junction usage:<br>
![ReverseJunction](/helpImgs/ReverseJunction.png)

I tried my best to make the embedded documentation as clear as possible,<br>
but contributions is appreciated.<br>
Or if there is something that needs more explanation, please let me know.<br>


List of future plans (in priority order):<br>

* tidy up the node label/text redraw code<br>
(to make it more efficient because the getTextSize is taking alot of time)<br>
so buffering of the textDimensions is needed for all labels/texts<br>

* Make a very simple sequencer with the help of piano as guide and group with lines for the sequence part<br>
the notes/actions should be done with the UI_Button (because it have both pressed(enter) and released(leave) actions)<br>

* make group export as class<br>
I have included two proposed designs into the html<br>
it's available at the rightmost menu -> Examples -> GroupBasedDesign (this contains two tabs with each design)<br>

* "exploded" export where a design can be defined in tabs but then exported as "classic"-export<br>

* multitab code editor<br>
