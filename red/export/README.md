# Export system

Turns the design into C++ (the **Export (new)** button). The selected **Export Mode**
(`RED.arduino.EXPORT_MODE`, saved by name, compared case-insensitive) decides what is exported
and which wires the editor shows as invalid:

| mode | exports | not allowed (error) |
|---|---|---|
| `classic` | the current tab as one file with global objects, original-style design | class instances |
| `flatclassic` | the current tab as one file, the class instances are converted into flat objects: `voices[2].env` → `voices_2_env`, an array inside a class stays an array (`voices_2_osc[3]`) | classes with code (Function, Variables, Constructor/Destructor/EndOfFile code, PointerArray) or extra class declarations; flat names that collide |
| `flathelper` | flattened like `flatclassic`, but all objects and connections are put into **one** helper class (`<Tab>Design`) that makes the connections in its constructor, with one instance `design`; the code of the tab stays global and uses `design.amp`; mixer code and code files are in their own files (COMPOSITE shows all in one text) | same as `flatclassic` |
| `classes` | all exported tabs as classes, each in its own file; **Export to zip** is only available in this mode | - |
| `osc` | Open Sound Control, not yet moved to this system (the OSC menu is used) | |

In `classic`, `flatclassic` and `flathelper` the current tab is the top of the design, so it can't
be a class itself (have TabInput/TabOutput). In `flatclassic` and `flathelper`, code in the current
tab that uses a class instance (`poly.mix.gain()`) is a warning, as it must be changed to use the flat
names, and in `flathelper` also code that uses an object directly (`amp.gain()` instead of `design.amp.gain()`).
These are only text searches, so they are warnings and not errors.

Projects saved with the old numbered modes are converted when loaded (0 → classic, 1 and 2 → classes, 3 → osc).

**.h and .cpp files** (setting *Separate class .h and .cpp files*, on by default): in `classes` every
class is written as `X.h` (the class, with the constructor/destructor only declared) and `X.cpp`
(`X::X() {...}` with the connections); in `flathelper` the helper class is written as `<Tab>Design.h`
(the class and `extern <Tab>Design design;`) and `<Tab>Design.cpp` (the constructor and the instance
`design`), and the tab file only contains the code of the tab. Then the headers can be included from
any number of .cpp files without 'multiple definition' errors, as all generated definitions of
non-inline things are in the .cpp files. The code from Function nodes inside a class stays in the class
body in the .h file (it's written for the class body, and that makes it implicitly inline, so it's safe).
note. a CodeFile node with a .h name must itself be safe to include from many files.
With the setting off everything is in the .h files (header only), as before.

The design JSON is written into **one** file only: the main file (.ino), else the 'audio main'
tab, else the top-level class (and once at the top of the COMPOSITE view). A zip contains
`GUI_TOOL.json` instead. The setting *Write JSON at exported file* turns it off.

The work is split into three steps, and each step only talks to the next one:

```
RED.nodes (editor)  ──resolve──▶  ResolvedDesign  ──cpp──▶  code text  ──exporter──▶  files
   read only                     plain data                            dialog / IDE / zip
```

| file | what it does | depends on |
|---|---|---|
| `export-graph.js` | Read-only questions about the editor structure: junctions, class ports, arrays, wire lookups | `RED.nodes`, `RED.export.isNameDeclarationArray` |
| `model/` | The data classes, one file each, every file describes what the class is for, who makes it and who uses it (see below) | nothing |
| `export-resolve.js` | Builds the model from the editor design. All the "what is connected to what" logic and all the wire checks are here | graph, model |
| `export-flatten.js` | Converts a class-based tab into flat objects (`flatclassic`), and makes the flat names | resolve, model |
| `export-modes.js` | The rules of each Export Mode, used both by the editor (invalid wires/nodes) and the export (error report) | resolve, graph |
| `export-codewriter.js` | `CodeWriter`, collects lines and handles indentation | nothing |
| `export-cpp.js` | Writes C++ from the model (classic file, class, main file, flat names) | model, CodeWriter |
| `exporter.js` | Menu entry points, error report, puts code into `ExportFile`s and delivers them | all of the above |
| `ExportFile.js` | One exported file (header + body + footer), also used by the mixer code and *Push JSON to the IDE* | nothing |

### The model (`model/`)

The resolved design is plain data plus references to the editor objects it was made from,
no names are stored (they are read from the nodes when the code is written) and there is no
generated code in it, so the same model can be used by any kind of export.

```
ResolvedDesign                  all exported workspaces
 └─ ResolvedWorkspace           one tab: what one class/file is made from
     ├─ ResolvedObject          a node that becomes a C++ object (audioObjects / controlObjects)
     │   └─ classPath: ResolvedPathStep[]      (only when flattened)
     ├─ ResolvedConnection      one AudioConnection, plus the editor wires it was made from
     │   └─ source / target: ResolvedEndpoint  (path: ResolvedPathStep[] + port)
     ├─ ResolvedUserCode        the code from the code nodes, as written
     └─ ResolvedProblem         an error (stops the export) or a warning (exported as a comment)
```

## Rules

- **Nothing here changes the editor structures** (`REDNode`, `REDLink`, `REDWorkspace`).
  Lookups are kept in the model (e.g. `ResolvedWorkspace.connectionsOf(link)`).
- **The model stores references, never names.** Names are read from the nodes when
  the code is written, so renaming can never break the model.
- **No C++ in the model, no graph logic in the code writers.** A new kind of export
  (OSC, live update) should only need a new writer, using the same model.
- **Nothing is silently dropped.** Errors stop the export and show a report,
  warnings are written as comments in the generated code.

## How connections are found

Every audio input has exactly one source. So for every real audio object input, the
wire is followed **backwards** until a real audio object output is found. On the way,
these only forward the signal:

| node | the signal continues from |
|---|---|
| junction (1 input, 1 output) | the junction input |
| class output | inside the class, what is connected to the TabOutput (lane by lane) |
| class input | outside the class, what is connected to the class node input (pass through) |
| junction with more inputs (joins) | input 0, then input 1, ... (each can itself be a bus or an array) |
| junction with more outputs (splits) | output *k* is part *k* of the wire on its input (see wire shapes below) |

A junction either joins or splits, not both (the editor locks the other count to 1, the export reports it as an error),
and the IO junctions of a class group don't show the counts. Older designs used BusJoin and BusSplit for this, they are converted into junctions when loaded
(`convertOldBusNode` in `red/nodes.js`), and they are no longer in the palette.

A wire can carry more than one signal (a bus):

| case | result |
|---|---|
| array → non array | one signal per element |
| into a class input with N lanes (`TabInput` with N outputs) | lane *k* gets signal *k*, the wire must carry exactly N signals |
| into a mixer (dyn inputs) | every signal gets its own input, after the signals of the wires on the inputs above |
| into a normal object | the signals go to the inputs after each other, starting at the wire's input |
| into an array | spread over the elements, or to every element, see wire shapes below |

**Wire shapes:** the signals of a wire are always in the same order, the *shape* tells how they are
structured, the outer level first (`getWireShape` in `export-resolve.js`, shown when hovering a wire,
and the wire color is the outer level: orange array, blue bus):

| source | shape |
|---|---|
| `osc[4]` | array[4] |
| a class output with 2 lanes | bus[2] |
| `voices[4]` of a class with a 2 lane output | array[4] of bus[2] (8 signals: voices[0] lane 0, voices[0] lane 1, voices[1] lane 0 ...) |
| a junction joining 4 single signals | bus[4] |
| a junction joining 2 stereo buses | bus[2] of bus[2] (inputs with different shapes give one flat bus) |

The shape decides how a wire can be split, the possible counts are the products of the outer levels,
`array[4] of bus[2]` can be split into **4** parts (a bus[2] each) or **8** single signals (like a mixer numbers them):

| target | rule |
|---|---|
| junction with M outputs | M must be one of the counts, output *k* gets part *k* (any other count is an error that tells the possible counts) |
| array of N | when N is one of the counts the wire is spread, element *i* gets part *i*: an outer array level always (element to element), a bus level only if a part is what one element takes (a normal object 1 signal, a class input its lanes); otherwise the whole wire goes to every element (i.e. one signal to an array) |

**Class groups:** a group with a class name is a class defined inline, exactly like a class tab:
its `className` is the class (type) and its name is the instance (`voices` or `voices[8]`, an array of
instances like any other array). Its IO junctions (`ClassIOtype` 1 = input, 0 = output) are the class
ports, the wires outside of the group are connected directly to them. Everything inside the group belongs
to the class (also visual groups and other class groups inside it), so all the rules above work the same way
(`getScopeNodes`/`getScopeLinks` in `export-graph.js` gives the nodes/wires of a tab or a class group).
In `classes` every class name is written once (`<className>.h/.cpp`), so all groups with the same class
name must have the same content (an error otherwise), and the flat modes flatten them like class tabs.
A group without a class name is only visual, its IO junctions are just junctions. The class name must be a C++ name
that is not taken by a tab or an object type (`getClassGroupNameProblems`, the editor marks the group). Older designs
with the *export as class* checkbox are converted when loaded (`convertOldGroupClassName` in `red/nodes.js`).

**Group instances:** the first group with a class name is the *source* of that class (it's also an instance itself),
it gets a type in the palette (`red/group-classes.js`), a node of that type is another instance of the class:
`node._def.classGroup` is the source, its ports are the IO junctions of the source top to bottom
(`getGroupPorts`, also `GroupScope.tabInputs/tabOutputs`), so the resolver handles it like a class tab node.
Only the source is saved with the contents. An instance can be *expanded* (its edit dialog), then it looks like the
source with read-only copies of its contents, drawn by the real drawing code, and its ports are where the IO junctions
of the source are (`red/ui/view-groupinstance.js`, only drawn, it's still one node, so the export is the same).
A source shows "class X · N instances" and an expanded instance "instance of X" in the bottom right corner.
Class tab nodes can be expanded the same way (they show the tab contents, the ports are where the TabInput/TabOutput are).
With *Expanded: audio objects only* only the nodes with audio inputs/outputs (and the groups around them) are shown. An instance whose source is gone (removed, or another class name)
is an error (`getGroupInstanceProblem`). The editor keeps the classes valid: a source with instances can't be
deleted, another group with the same class name but other contents is an error (`getClassNameConflict`), and
older designs with copies of a class group are converted into instances when loaded (`convertCopiesToInstances`,
not when the copy have loose wires).

**Loose wires:** a wire can also go straight from an object inside a class group to an object outside of it
(or the other way), without IO junctions. It belongs to the innermost class group that contains both ends
(`getLinkOwner`), so the outside makes the connection into the instance (`voices[i].VFOfilterMix`, the class
members are public). It works as if there was an IO junction at every group border it passes
(`getWireCrossing` in `export-resolve.js`): out of `voices[8]` it's a bus with one signal per voice (or element
to element into an array of 8), into `voices[8]` it goes to every voice (or element to element, or a bus split).

**Who owns a connection:** the innermost workspace that contains both its ends.
A connection inside a class is the same for every instance, so it's made in the class.
Everything that crosses a class border is made in the workspace that uses the class,
with the full path (`voice[2].env`). A pass through (TabInput wired to a TabOutput) has no
object inside the class, so it's always made outside; if nothing outside uses the class,
there is nothing to connect.

## Errors and warnings

Every wire is checked (`validateWires` in `export-resolve.js`).

**Errors** stop the export, an error report is shown instead:
array sizes that don't match, a wire with a different number of signals than the class
input has lanes, a junction split that doesn't match the wire shape, more signals than an object has inputs, two
wires (or two overlapping buses) into one input, a class port that doesn't exist, an
AudioStreamObject without a Sub Type, classes that contain themselves.

The Export Modes add their own errors, see the table at the top (`export-modes.js`).

**Warnings** are exported as comments: wires to/from unsupported nodes (LinkIn/LinkOut),
class outputs or joining junction inputs that are not connected.

**In the editor**, the selected *Export Mode* decides what is valid. In the C++ modes
`RED.nodes.setLinkInfo` uses `RED.exporter.modes.getLinkErrors`, so the wires with errors are
drawn as invalid (red dashed) with the same text as the error report (hover the wire), and the
nodes that break the mode rules (i.e. a class instance in `classic`) get a red dashed border and
explain why when hovered (`RED.exporter.modes.getNodeProblems`, used in `RED.view.redraw_node`).
In the OSC mode the old checks are still used, until the OSC export is moved to this system.
As a wire can be valid or not because of things far away from it (the outputs of a splitting junction, the
lanes of a class input, a class in another tab), all wires are checked again after every change of the
design (`scheduleExportCheck` in `RED.nodes`, a few ms even for big designs).

## Tests

`tests/export/` has designs made for testing the export (open them with Import):

- `BusAndThruTests.json` - one example of each bus/pass-through case, must export
  (and compile) with these 23 connections in `BusAndThruTests` and none in the classes:
  ```
  osc1 -> fx.ampL:0, osc2 -> fx.ampR:0               BusJoin into a 2 lane class input
  fx.ampL -> i2s:0, fx.ampR -> i2s:1
  oscs[0] -> fx2.ampL:0, oscs[1] -> fx2.ampR:0       array into a 2 lane class input
  fx2.ampL -> mixer:4, fx2.ampR -> mixer:5
  osc1 -> mixer:0                                    pass through (Thru)
  osc2 -> mixer:1                                    pass through a junction and a nested class (ThruChain)
  osc1 -> mixer:2, osc2 -> mixer:3                   Packer (BusJoin to bus output) -> Unpacker (bus input to two outputs)
  osc1 -> amp1:0, osc2 -> amp2:0                     Packer -> BusSplit
  amp1 -> mixer:6, amp2 -> mixer:7, mixer -> i2s2:0
  osc1 -> amps[0]:0, osc2 -> amps[1]:0               a bus (BusJoin) into an array: one signal per element
  amps[0] -> mixer:8, amps[1] -> mixer:9
  osc1 -> mixer:10, osc2 -> mixer:11                 the same bus into an array of a pass through class (thrus[2])
  ```
- `ShapeTests.json` - wire shapes: `voices[4]` of `StereoOsc` (array[4] of bus[2]) split into 4 and 8,
  spread over `amps8[8]` (one signal each) and `fx4[4]` (a stereo bus each), two stereo parts joined and split again,
  and `bad3` (a split into 3, the only error).
- `FlatTests.json` - the flat modes. `FlatMain` uses `Poly` (lfo, `voices[2]` of `Voice`, mix), and
  `Voice` has `osc[NUM]` (sized by a class constant), a mixer and an env:
  `flatclassic` must give one file with 14 connections (`poly_lfo -> poly_voices_0_osc[0]`, ...,
  `poly_mix -> i2s:0`), `flathelper` the same 14 connections in the constructor of `FlatMainDesign`
  (plus `mixers.h/.cpp`), and `classic` an error.
  `FlatCodeMain` uses a class with code: error in `flatclassic` and `flathelper`.
  `FlatCollision` has an object named `poly_lfo`: error in `flatclassic` and `flathelper`.
  `FlatCodeUse` has code that uses `poly.mix` and `amp` directly: warnings (it doesn't compile until the code is changed).
  `FlatHelperCode` has code that uses `design.outMix`, `design.poly_mix` and `design.dc[i]` (a tab array sized by a
  tab constant): must compile in `flathelper`.
- `GroupTests.json` - class groups: `GroupMain` has `voices[2]` (class `GVoice`, osc -> env -> a nested
  class group `filt` (class `GFilter`)), a visual only group with a `dc`, and a second `GFilter` group `filt2`.
  In `classes` it must give `GVoice.h/.cpp` and `GFilter.h` (once), with `lfo -> voices[0].osc`,
  `voices[0].filt.amp -> mixer:0`, `voices[1].filt.amp -> mixer:1`, `dc -> mixer:2` in `GroupMain`;
  in `flatclassic` the same connections with flat names (`voices_0_filt_amp`); in `classic` an error.
  `GroupCode` has a class group with code: fine in `classes`, an error in the flat modes.
- `GroupErrorTests.json` - two groups with the same class name but different content (error in `classes`),
  and `osc[3]` into a group array `a[2]` (array sizes don't match).
- `ErrorTests.json` - one of each error, the export must stop with a report of 7 errors
  (both wires into `amp:0` are reported, and a 3 signal bus into the array `c[2]`) and 1 warning,
  and in a C++ Export Mode exactly those 7 wires are shown as invalid in the editor.

## Debugging

In the browser console:

```js
const rws = RED.exporter.resolve.resolveWorkspace(RED.nodes.currentWorkspace);
// or RED.exporter.flatten.flattenWorkspace(RED.nodes.currentWorkspace) for the flat version
rws.connections.map(c => c.toString());  // e.g. "voice[2].env:0 -> mixer:2"
rws.errors; rws.warnings;
rws.connectionsOf(someLink);              // forward lookup: wire -> connections
someConnection.links;                     // reverse lookup: connection -> wires
```
