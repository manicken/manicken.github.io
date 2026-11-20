# ASDT++ local backend (draft 0.3)

**Status:** draft 0.3. Built and tested:
- the move to `backend/`;
- the settings;
- the path checks;
- the project API (sections 4 to 7);
- the ASDT++ side (section 8);
- the native Faust objects (section 9).

Not built yet: build and flash (section 10). Tests: `node tests/backend-test.js` (`--build` also builds a Teensy 4.1 project with PlatformIO). The backend grew out of the FPB Faust bridge, which compiles Faust, serves ASDT++, and does serial and MIDI for it.

The backend is a standalone Node program that runs on the user's own computer. It gives ASDT++ what a web page cannot do on its own:
- keep the projects on disk, so they survive a cleared browser cache and open in any browser;
- write the export straight into a Teensy project, with backups;
- compile Faust;
- later, build and flash.

```
ASDT++ (browser) ──HTTP /api, WebSocket /asdt──► backend (127.0.0.1) ──► <projects>/<project>/   a whole project
Faust IDE ──HTTP /faust──────────────────────────►  ├──► faust (compile)
                                                    └──► Teensy (serial, MIDI)
```

## 1. Rules

1. **Standalone.** The backend never depends on an IDE, its plugin API or its version. It only uses Node and command line tools (`faust`, later `pio` and `arduino-cli`). A project it writes builds in PlatformIO, Arduino IDE 1.x and 2.x, and arduino-cli without any plugin.
2. **The browser never chooses where the backend may write.** The projects folder is set when the backend starts (section 3). The browser can only name a project inside it.
3. **ASDT owns its folders, and nothing else.** In an existing project the backend writes only in `src/asdt/` and `.asdt/` (section 4). Any other file is never written, renamed or removed, not even the main sketch. The one exception: a *new* project gets starter files once, when its folder is created (section 7).
4. **The export folder is replaced, not merged.** An export makes `src/asdt/` hold exactly the exported files. A file that is no longer exported is removed, so a deleted Faust node can't leave an old `.cpp` behind that still gets compiled. A file edited by hand in `src/asdt/` is overwritten. This is documented behaviour, not an accident.
5. **Nothing is lost without a backup.** Before `src/asdt/` changes, its current contents are zipped into `.asdt/backup/` (section 6).
6. **The API has no delete.** The only way a file is removed is rule 4, inside `src/asdt/`, after a backup.
7. **No commands from the browser.** The backend runs only programs it knows (`faust`, later `pio`, `arduino-cli`), with arguments it builds itself. It never runs a script from a project, a zip or a request, and has no install scripts.

## 2. Program and folders

- One Node program, Node 18 or newer, no npm packages except the optional `serialport` and `@julusian/midi` (as today).
- One port for everything (default 8088), as today:

| Path | What |
|---|---|
| `/` | ASDT++ itself (static files). With the tool served from here, page and backend have the same origin: no CORS, no Local Network Access prompt, no https/http mix. |
| `/asdt` | WebSocket: patches, serial, MIDI, and events (export done, later build output) |
| `/faust/...` | the faustservice API for the Faust IDE (unchanged) |
| `/api/...` | the project API, section 7 (new) |

Folders in the ASDT++ repo:

```
manicken.github.io/
  backend/                    the server (it was fpb/server/), split into modules:
    server.js                   main: options, HTTP, WebSocket, the Faust / FPB compile service, the /api routes
    settings.js                 settings.json + the command line
    paths.js                    path checks (section 5)
    projects.js                 projects, design, export, backup (sections 4, 6, 7)
    faust-native.js             Faust -> native Teensy objects (section 9)
    faust/asdt_faust.h          the base classes the generated Faust C++ needs (copied into every export with Faust)
    io.js                       serial and MIDI
    settings.example.json       copy to settings.json to change something
    package.json
    node_modules/               (in .gitignore)
    settings.json               (in .gitignore)
  backend_sandbox/            (in .gitignore) everything the backend writes by default
    projects/                   the projects folder, one folder per project (can be moved, section 3)
    fpb_temp/                   Faust uploads and compiles in progress (it was <os temp>/fpb-faust-server)
    fpb_patches/                every Faust compile kept, a folder per patch (it was fpb/patches, in git)
  red/zip.js                  zip, shared by the browser and the backend
  red/backend-project.js      the ASDT++ side (section 8)
```

`backend_sandbox/` and its subfolders are made at startup when they are missing.

## 3. Settings and the projects folder

Settings come from `backend/settings.json` (or `--settings <file>`), then from the command line, which wins. A setting is never changed from the browser.

```json
{
  "port": 8088,
  "host": "127.0.0.1",
  "projects": "E:/git/asdt-projects",
  "projectSearchDepth": 3,
  "backups": 10,
  "allowOrigin": [],
  "allowAdmin": false
}
```

- `projects`: the projects folder. Default `backend_sandbox/projects`. It can be any folder (`--projects <path>`). The usual choice is a folder kept for ASDT++ based projects, for example a subfolder on the disk with all git clones.
- `projectSearchDepth`: how many folder levels below the projects folder are searched for projects (default 3, `--project-search-depth <n>`). With depth 3, `E:/git/asdt-projects/teensy/synths/poly1` is found. Outside the sandbox the backend prints a warning at startup: the user is responsible for what ASDT++ exports into that folder tree. It still writes only in the owned folders (rule 3).
- The projects folder is resolved to its real path at startup (`realpath`, so a junction or symlink to another disk works), checked to be a folder, and printed:

```
projects: E:\git   (outside the sandbox: ASDT++ can write src/asdt/ and .asdt/ in any project in it)
```

**Not as administrator.** Like WebScope, the backend refuses to run as root/administrator unless `allowAdmin` is set. Elevated, a path check can be raced with a symlink to a file only the administrator may write.

## 4. A project

A **project** is a folder in the projects folder, named by its path relative to it: `poly1`, or `__TEENSY/poly1` when it is in a subfolder. It holds a whole project, ready to build. It is recognised by:

| Kind | Marker |
|---|---|
| `platformio` | `platformio.ini` |
| `arduino` | `<folder>/<folder>.ino` |
| `asdt` | only `.asdt/` (an ASDT++ design with no build files yet) |

```
poly1/
  platformio.ini, src/main.cpp     or  poly1.ino        the user's, never touched after creation
  src/
    asdt/                     owned: the export, replaced on every export
      design.json               the design as it was exported (the GUI_TOOL.json of the old exports)
      Main.h, *.h, *.cpp        the exported design
      faust/<name>.h/.cpp       native Faust objects (when built)
  .asdt/                      owned: ASDT++ state, never compiled
    design.json                 the current design, saved as you work (as in the browser's local storage)
    backup/2026-11-20_14-32-05-123.zip
    staging/                    used during an export
    project.json                the last export: time, file list, hashes
```

**Two design files:**
- `.asdt/design.json` is the **current design**, what ASDT++ has right now. ASDT++ saves it like it saves to local storage today, but on disk. That way a cleared browser cache loses nothing, and the project opens the same in another browser. Saving it makes no backup. To keep the disk writes down, ASDT++ waits until there have been no changes for about 2 s before it saves.
- `src/asdt/design.json` is the **design as exported**, written together with the code it was exported to. It is part of every export, so each backup zip also holds the design that belongs to that code. Opening an old backup gives you both.

Why `src/asdt/`: Arduino (IDE 1.x, 2.x, arduino-cli) compiles subfolders of a sketch only under `src/`, recursively. PlatformIO compiles everything under `src/`. So the same folder builds in both with no settings. The user's code includes it with `#include "src/asdt/Main.h"` (Arduino) or `#include "asdt/Main.h"` (PlatformIO).

Why `.asdt/` at the project root: the current design, the backups and staging must not be inside `src/`, so they are never compiled and don't fill the source tree. Arduino compiles only `src/` besides the sketch, and PlatformIO compiles only `src/` (and `lib/`). The backend never edits `.gitignore`, which belongs to the user.

## 5. Path checks

Every path from a request is checked by one function, `resolveInProject(project, rel)`. It is based on WebScope's `resolveVirtualPath`, with the additions marked *new*.

1. The base is the real path of the projects folder (resolved at startup, *new*).
2. `project` and `rel` are relative paths with `/` as separator. Refused:
   - empty segments, `.`, `..`;
   - absolute paths and drive letters;
   - `:` (also Windows alternate data streams, *new*);
   - `\`, control characters, a segment that ends in a dot or a space;
   - Windows device names (`CON`, `NUL`, `COM1`, ... with any extension, *new*).
3. The joined path is resolved and must stay inside the projects folder (`path.relative` does not start with `..` and is not absolute).
4. The real path (`realpath`) of the deepest existing folder on the way must also be inside, and so must the real path of the target if it exists. A symlink or junction that points out of the projects folder is refused.
5. For a write: the path must also be inside `src/asdt/` or `.asdt/` of that project. A new project's starter files (section 7) are the only exception.
6. Folders are made one level at a time, and step 4 is repeated for each new level (*new*: WebScope checks only the parent).
7. Exported file names must have one of the extensions `.h .hpp .c .cpp .json .txt .md` (*new*). The backend writes no scripts or executables, and no `.ino` except a new project's starter sketch.

A failed check is `403` and is logged with the path. Everything is checked again on every request, nothing is cached.

## 6. Export, backup, restore

An export is one transaction for one project:

1. Lock the project. One export at a time per project, and others wait.
2. Check all names (section 5), the total size (default limit 32 MB) and the file count.
3. Write the new files to `.asdt/staging/`.
4. Compare with the current `src/asdt/` (same names and same contents means nothing changed): when nothing changed, stop here and answer `unchanged`. No backup is made, so exporting the same design ten times doesn't push the useful backups out.
5. Zip the current `src/asdt/` to `.asdt/backup/<YYYY-MM-DD_HH-MM-SS-mmm>.zip` (`red/zip.js`, deflate). Sorted by name is sorted by time. A second backup in the same millisecond gets `_02`, which sorts after the first, because `.` < `_`. If `src/asdt/` doesn't exist yet, there is nothing to back up.
6. Swap: rename `src/asdt/` to `.asdt/old/`, rename `.asdt/staging/` to `src/asdt/`, remove `.asdt/old/`. All of it is on one disk, so each rename is atomic: a file in `src/asdt/` is never half written. Between the two renames there is a short moment with no `src/asdt/`, so a build that starts exactly then fails and must be run again.
   - On Windows a rename fails when a file in the folder is open (an IDE or a running compiler). In that case the files are replaced one by one in `src/asdt/`: write the new ones, then remove the ones that are no longer exported. The backup from step 5 is already made.
7. Keep the newest `backups` (default 10) zips in `.asdt/backup/` and remove the older ones.
8. Write `.asdt/project.json` (time, file list, hashes, ASDT++ version) and answer with what was written, removed and backed up.

A crash between 5 and 6 leaves `.asdt/staging/` or `.asdt/old/`. The next export removes them first. The backup is already safe.

**Restore** takes a backup zip and exports its contents with the same steps. The state before the restore is backed up as well, so a restore can be undone. The design in the backup (`design.json`) can also be opened in ASDT++ without restoring the code.

## 7. API

All requests and answers are JSON, under `/api`. A request with a body must have `Content-Type: application/json`. That forces a CORS preflight, so a plain HTML form on another site can't post to it.

**Who may call `/api`.** The same Origin and Host checks as the bridge has today, but with a smaller set of origins: only ASDT++ (pages served by the backend itself, `https://manicken.github.io`, and `--allow-origin`). The Faust IDE origins may use `/faust` but not `/api`, because the Faust IDE has no reason to read or write projects.

| Request | Answer |
|---|---|
| `GET /api/info` | `{ version, sandbox: true/false, owned: ["src/asdt", ".asdt"], backups }`. The real path of the projects folder is not sent to the page. |
| `GET /api/projects` | all projects in the projects folder: `[{ path: "teensy/poly1", kind: "platformio" \| "arduino" \| "asdt", hasDesign, lastExport }]`. Searches `projectSearchDepth` levels deep (section 3). Does not look inside a project once it is found, and skips `.git`, `node_modules`, `.pio`, `.asdt`. Symlinks and junctions inside are not followed. |
| `POST /api/projects` `{ path, template: "platformio" \| "arduino" \| "none" }` | makes a new project folder with `.asdt/` and starter files: `platformio.ini` (Teensy 4.1) and `src/main.cpp`, or `<name>.ino`, each including `asdt/Main.h`. Refused (`E_EXISTS`) if the folder already exists, so it can never overwrite anything. |
| `GET /api/project?path=` | `{ kind, design, exported, backups }`. `design` is `.asdt/design.json`, the one ASDT++ opens. `exported` is the time of the last export. |
| `PUT /api/design` `{ path, design }` | saves the current design to `.asdt/design.json`. No backup. |
| `POST /api/export` `{ path, files: [{ name, contents, encoding? }] }` | `{ result: "written" \| "unchanged", written: [...], removed: [...], backup }`. The names are relative to `src/asdt/`, and `design.json` is one of them. `encoding: "base64"` is for binary files, and text is the default. |
| `GET /api/backups?path=` | `[{ name, time, size, files }]` |
| `GET /api/backup?path=&backup=` | the design in a backup (`design.json` inside the zip), to open it in ASDT++ |
| `POST /api/restore` `{ path, backup }` | as `/api/export` |
| `POST /api/faust/native` `{ items: [{ className, code? , patch? }] }` | `{ results: [{ className, patch, inputs, outputs, params, files }] }`, section 9. `code`: the Faust code. `patch`: the name of a Faust IDE export kept in `fpb_patches/`, whose sources and libraries are used. An error is `422` with Faust's message. |

Errors are `{ error: "text", code: "E_PATH" \| "E_NOT_FOUND" \| "E_EXISTS" \| "E_TOO_BIG" \| "E_BUSY" \| ... }` with HTTP status 400, 403, 404, 409 or 413.

After a save or an export the backend also sends `{ type: "design" \| "export", path, ... }` on the WebSocket, so that other open ASDT++ tabs know (and can warn that the design they show is older).

## 8. ASDT++ side

`red/backend-project.js`, with the settings category **Project (backend)**. The Export menu has **Export to project (backend)** and **Choose project (backend)...**.

- A backend is used only when `/api/info` answers. Without it, everything stays as before: local storage, the zip export in the browser, and copy and paste. The backend's address is the one the Faust bridge connects to: the page's own server when the backend serves ASDT++, else the bridge's Server setting, else `http://127.0.0.1:8088`.
- **Choose:** a dialog lists the projects (`/api/projects`). A project with a saved design can only be opened (**Open its design**, which replaces the design in the browser), never just chosen: choosing it would let the next change save over its `.asdt/design.json`, which has no backup. A project without a design has **Save this design in it**. **Make and use** makes a new project with a PlatformIO or Arduino template. The chosen project is the setting `Project`, which is saved with the design.
- **The design** is saved to the project as well as to local storage. `RED.storage.update()` calls `designChanged`, and the `PUT /api/design` follows 2 s after the last change. A failed save is told once.
- **Export to project** exports in the selected Export Mode. Only the C++ modes can be used, not the OSC message modes. The exporter (`RED.exporter.main.exportForProject`) only returns the files; it doesn't show, post or zip them. Before they are sent to `/api/export`:
  - placeholders for existing files are left out;
  - `GUI_TOOL.json` becomes `design.json`;
  - the main file (`.ino` or `main.cpp`) becomes a `.h`;
  - `asdt.h` is added. It includes the top file(s), and is the one file the user's main file includes.
- The old `httpPostAsync` format (`files`, `keywords`, `removeOtherFiles`, `isMain`) and the old Arduino IDE API server are not used for this.
- The notice in the docs and in the project dialog: **"Files in `src/asdt/` are managed by ASDT++. They are replaced on every export, and changes made by hand are overwritten (the last 10 versions are kept in `.asdt/backup/`)."**

## 9. Native Faust objects

An AudioEffectFPB object runs Faust code as FPB bytecode, so it can be changed at runtime: that is for prototyping. In **Export to project** it becomes a real, compiled Teensy audio object instead. This is the setting **Faust as native objects**, on by default. In the OSC C++ modes the objects stay FPB, because there OSCAudio makes the objects.

**Per Faust patch** (`backend/faust-native.js`), with `className = Faust_<patch>` (the node's *Patch*, else its name):

```
faust -lang cpp -cn Faust_<patch>_dsp -scn FaustDsp -json <patch>.dsp
  -> src/asdt/faust/asdt_faust.h        Meta, UI and FaustDsp: the three small base classes the generated C++ needs,
                                        written for ASDT++ (MIT). None of Faust's architecture files are used.
     src/asdt/faust/Faust_<patch>.h     class Faust_<patch> : public AudioStream, a setter per parameter
     src/asdt/faust/Faust_<patch>.cpp   the generated code + the AudioStream part
```

- **Inputs and outputs** come from Faust. In the export the object's type is `Faust_<patch>`, and the file that uses it includes `faust/Faust_<patch>.h`. Objects with the same Patch share the class. If they have different code, that is an error.
- **Setters** are named by the Faust label, and by the path only when two labels clash. That is Faust's own `shortname`: `cutoff(float)`, or `v_gain(float)` and `w_gain(float)`. A name taken by C++ or AudioStream gets a `_` (`update_`). There is also `setParam(index, value)` and, for bargraphs, getters. A setter writes the parameter field directly: the field name is `varname` in Faust's JSON, and the class is made a `friend` of the generated class.
- **Memory:**
  - The whole DSP state, delay lines included, is one object. It is allocated with `malloc` (RAM2 on a Teensy 4) and, when that fails, with `extmem_malloc` (PSRAM), then made with placement new.
  - Static tables bigger than 16 KB, such as the 256 KB sine table of `os.osc`, get `DMAMEM` (RAM2) instead of the RAM1 default.
  - `classInit` (the tables) runs once per class.
- **Conversion:** int16 → float × 1/32768, and float → int16 clipped (NaN → 0), so an output above 1.0 is clipped instead of wrapping around.
- **Tested:** two patches (one with 1 in and 1 out, one with 0 in, 2 out and `os.osc`) and a design exported from the browser in the mode `classes`. Both build for a Teensy 4.1 with PlatformIO, with no warnings.

Not supported: soundfiles, and Faust code that includes architecture files (an error).

## 10. Later

- **Build and flash** with `pio run -t upload` or `arduino-cli compile/upload` in the project. The output is streamed on the WebSocket, and the serial port is handed over from `io.js` while it uploads.
- A setting on the AudioEffectFPB node to force its memory to PSRAM.

## 11. Moved from fpb/server (done)

- `fpb/server/` is now `backend/` (`fpb-faust-server.js` became `server.js`). `npm start` and the Faust IDE URL (`http://127.0.0.1:8088/faust`) are the same.
- The temp folder (`<os temp>/fpb-faust-server`) is now `backend_sandbox/fpb_temp/`. The kept compiles (`fpb/patches/`) are now `backend_sandbox/fpb_patches/`, and are no longer in git.
- `.gitignore` has `backend_sandbox/` and `backend/settings.json`.
- The static files: `backend/`, `backend_sandbox/` and `node_modules/` are never served, so the projects and the settings can't be read over HTTP.
