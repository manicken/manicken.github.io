# FPB: first working model

This is a first working model of FPB, the float patch bytecode. Patches are compiled in the tool, and the Teensy loads and runs them at runtime. The format is described in [specs/fpb-bytecode.md](../specs/fpb-bytecode.md).

| path | what |
|---|---|
| `red/fpb/fpb-core.js` | op table parser, fingerprint, CRC, error codes, and the JS semantics of every op |
| `red/fpb/fpb-fbc.js` | Faust FBC parser and reference interpreter (float32) |
| `red/fpb/fpb-compile-fbc.js` | FBC → FPB compiler |
| `red/fpb/fpb-format.js` | container encoder and decoder; the decoder runs the same checks as the firmware loader |
| `red/fpb/fpb-vm.js` | verifier VM: runs a container in JS exactly like the firmware |
| `fpb/teensy/FPB/` | Arduino library: `FPB_oplist.h` (the op table), `FPB.cpp` (push-parser loader, program), `FPB_ops.cpp`, `AudioEffectFPB` |
| `fpb/tools/fpbc.js` | command line compiler: `.fbc` → `.fpb` and a C header |
| `fpb/server/fpb-faust-server.js` | the Faust bridge: a local Faust export server for the Faust IDE, and a WebSocket backend for ASDT++ |
| `red/fpb/fpb-bridge.js` | the ASDT++ side of the bridge: the `AudioEffectFPB` node gets its patch, sends it over OSC, and exposes its parameters in the live tab |
| `fpb/tests/` | test runners, host C++ harnesses, Faust test patches, a fake `faust` for the server tests |

Of the `red/fpb` files, only `fpb-bridge.js` is loaded by `index.html`, because the bridge server does the compiling. All of them work in the browser (`RED.fpb.*`) and in Node (with `global.RED = {}`).

## The loop: Faust IDE → bridge → ASDT++ → Teensy

```
Faust IDE  ── Export (server http://127.0.0.1:8088/faust, teensy/fpb)┐
                                                                    ├─> fpb-faust-server: faust -lang interp -> FBC -> FPB
ASDT++ AudioEffectFPB node ── "Compile code" (its Faust code) ──────┘        │ WebSocket ws://127.0.0.1:8088/asdt
                                                                             v
                     ASDT++: the node stores the patch (saved in the project), ports = the patch's in/outs,
                             parameters = live methods (live tab, GUI sliders, "send all again")
                                                                             │ OSC (live update)
                                                                             v
                     Teensy: /dynamic/crOb "AudioEffectFPB" "name", then /begin, /feed b ..., /end, /setParam if
```

1. **Start the bridge:**
   ```
   cd fpb/server
   npm start
   ```
   `npm start` installs the packages first: `serialport` and `@julusian/midi`, which have prebuilt binaries for Windows, macOS and Linux. `node_modules` is in `.gitignore`. Arguments go after `--`, e.g. `npm start -- --port 9000`. Without the packages (plain `node fpb-faust-server.js`), everything works except serial and MIDI.

   **Serial and MIDI through the bridge.** When ASDT++ is connected to the bridge, the bridge carries the serial port and MIDI. There is nothing to select:
   - **Ports:** the bridge finds the Teensy (USB vendor 16C0) by itself. With Dual Serial, interface 2 (`SerialUSB1`) is the **OSC port** and interface 0 (`Serial`) is the **debug port**. With one serial port, it is the OSC port. `--osc-port COMx|off` and `--debug-port COMy|off` override this.
   - **OSC** goes through the bridge instead of Web Serial, so it works in any browser. The port reopens by itself when the Teensy restarts. Opening the debug port also lets the firmware's `while (!Serial)` continue without hterm.
   - **The debug port** is shown in a second log beside the output log, in the bottom panel. The split button toggles it. A line typed at the bottom of that log is sent to the port. The bridge keeps the last 20 000 characters, so a browser that connects later still sees the boot text and any `CrashReport`.
   - **MIDI:** the MIDI menu lists the bridge's outputs, and the bridge's inputs drive the UI objects as Web MIDI did.
   - **Status:** the label beside the Serial menu shows what goes through the bridge, e.g. `bridge: OSC COM14 · debug COM13 · MIDI 1/2`. Its tooltip lists the ports and any errors (e.g. a port held by another program; it is opened when it becomes free). When ASDT++ is not connected, clicking the label connects it.

   `--no-io` turns serial and MIDI off.

   The server finds `faust` itself. It tries these in order, each with `faust --version`:
   1. `--faust <path>`;
   2. `$FAUST`;
   3. the `PATH`;
   4. the usual install places on Windows, macOS and Linux:

   | platform | places |
   |---|---|
   | Windows | `Program Files\Faust`, `Faust-<version>` folders, `%LOCALAPPDATA%\Programs`, scoop, chocolatey, msys64 |
   | macOS | `/usr/local/bin`, Homebrew `/opt/homebrew/bin`, MacPorts `/opt/local/bin`, `/Applications/Faust-<version>` |
   | Linux | `/usr/local/bin`, `/usr/bin`, `~/.local/bin`, `/opt/faust`, snap, flatpak |

   The libraries come from `faust --libdir`, else from `<faust>/../share/faust`.

   `node fpb/server/fpb-faust-server.js --find-faust` shows what it finds and where it looked, then exits.
   One port (8088) serves everything:

   | address | what |
   |---|---|
   | `http://127.0.0.1:8088/` | ASDT++ itself (the files of this repo; `--www <dir>` for another copy, `--no-www` to turn it off) |
   | `http://127.0.0.1:8088/faust` | the Faust API; put this in the Faust IDE's export dialog; `/faust/` shows the status |
   | `ws://127.0.0.1:8088/asdt` | the WebSocket for ASDT++ |

   `--faustlib` defaults to `<faust>/../share/faust`. The server only listens on 127.0.0.1, it needs no npm packages, and it serves no dot files (`.git`). Web Serial works on `http://127.0.0.1`, because the browser treats it as a secure context.

   Every compile is kept in `fpb/patches/<name>/` (`--keep <dir>` for another place, `--no-keep` to turn it off). `<name>` is the export name in the Faust IDE, or the patch name in ASDT++. The folder holds:
   - the sources: the `.dsp` and the project's own `.lib` files;
   - the `.fbc`, `.fpb`, `.json` and `_fpb.h`;
   - `<name>.error.txt` when the compile failed.

   **Faust widgets in the live tab and in "+ Create GUI":**
   - sliders and nentry keep their range, with `[scale:log]` and `[unit:...]`;
   - `[style:menu{...}]`, `[style:radio{...}]` and checkbox become lists;
   - a `button` sends 1 when pressed and 0 when released;
   - `[tooltip:...]` becomes the help text.

   Labels drop anonymous groups (`0x00`), as Faust's own UIs do. When a label occurs twice, the group path is shown.
2. **ASDT++:**
   - **Opened from the bridge** (`http://127.0.0.1:8088/`): it finds the bridge by itself (`/faust/bridge.json`) and connects.
   - **Opened from anywhere else** (GitHub Pages, another local server): select an AudioEffectFPB object and press **Connect** in the live tab. That connects to `ws://127.0.0.1:8088/asdt` and is remembered. Another address can be set in Settings → Faust bridge → Server.
   - Add an **AudioEffectFPB** object from the effect category and connect it in the design. It follows the patch named in **Patch**, or its own name when Patch is empty.
3. **The Faust code,** in either of two ways:
   - **Faust IDE** (the online one, or a local build): Export → Server `http://127.0.0.1:8088/faust` → platform `teensy`, architecture `fpb` → Export.
     - The export name must match the object.
     - The toolbar **Export** button opens the result (`binary.zip`) in a new tab. With `fpb`, that is a page that closes itself, so there is no save dialog: the patch is already in ASDT++.
     - To download the `.fpb`, `.fbc`, `_fpb.h`, `.json` and `.dsp` files, use the architecture `fpb-zip`. It compiles and sends the same way.
     - The server decides what an export delivers; the Faust IDE only knows the target names from `/targets`. That is why this needs no change to the IDE.
     - The server also offers `source / cplusplus` (plain C++ from `faust -lang cpp`). That is the IDE's default target, and without it the export dialog fails to load.
   - **ASDT++ itself:** double-click the object to edit its Faust code, then press **Compile code** in the live tab.
4. **With the OSC live update on,** the patch is sent to the Teensy when it arrives and whenever the object is created (live update / Sync). After the Teensy accepts it (`/end` replies 0), the parameter values set in the live tab are sent again. An error from the Teensy shows its FPB error name, e.g. `E_NOMEM`.

### Teensy firmware (OSCAudio)

- `OSCAudioFPB.h` in the OSCAudio repo is the OSC wrapper. It has these methods:
  - `/begin`, `/feed b`, `/end`;
  - `/load b`, `/loadFile s` (a file on SD, e.g. saved with `/fs/save`);
  - `/clear`;
  - `/setParam if`, `/getParam i`;
  - `/numParams`, `/lastError`.
- `OSCAudioBase.h` includes the wrapper when `<AudioEffectFPB.h>` is available (`__has_include`). It then adds `AudioEffectFPB` to the `/dynamic/crOb` types (`OSC_AUDIO_CLASSES_EXTRA`).
- The sketch must `#include <AudioEffectFPB.h>`, as `examples/OSCAudioUseFS` does.
- With PlatformIO, OSCAudio's `depends=OSC,Audio` limits its include paths, so `platformio.ini` also needs `-I .../fpb/teensy/FPB/src` in `build_flags`.

## Compiling a Faust patch

```
faust -lang interp mypatch.dsp -o mypatch.fbc
node fpb/tools/fpbc.js mypatch.fbc --header mypatch_fpb.h
```

Before writing anything, `fpbc` runs the result in the verifier VM and compares it with the FBC reference.

Faust must compile in scalar mode, which is the default, with `-single`. Not supported yet:
- `soundfile`;
- bargraphs (outputs back to the tool);
- select branches that contain stores;
- vector mode (`-vec`).

## Running it on a Teensy

Copy (or symlink) `fpb/teensy/FPB` into the Arduino `libraries` folder, then open `examples/FPB_Faust`. The example chains a sawtooth through `fi.resonlp` and a feedback echo. The echo needs 512 KB, so it needs PSRAM.

```cpp
AudioEffectFPB fx;
int err = fx.load(mypatch_fpb, sizeof(mypatch_fpb));   // or begin() / feed() / end() for streaming
fx.setParam(MYPATCH_FPB_CUTOFF, 800);
```

## Tests

```
node fpb/tests/run-tests.js       # compiler, VM, firmware loader (host g++), Faust's own C++, broken containers
node fpb/tests/server-test.js     # the bridge: Faust IDE export protocol + WebSocket (fake faust, no install needed)
node fpb/tests/bridge-test.js     # ASDT++ side: real red/control + fpb-bridge against the server, OSC messages checked,
                                  # what is sent is loaded by the firmware loader (run run-tests.js first)
node fpb/tests/io-test.js         # serial / MIDI (io.js) with fake modules: port roles, data both ways, reconnect, busy port
```
`fpb/tests/fake-io.js` is a pretend Teensy (two serial ports, OSC replies, debug text, MIDI). Use it with `--fake-io fpb/tests/fake-io.js` to try ASDT++ without hardware. The test servers use `--no-io`, so they never take the real ports.

Each Faust patch in `fpb/tests/faust` runs through four paths:
- the FBC reference;
- the VM;
- the firmware code built for the PC with g++;
- the C++ that Faust generated itself.

The runner compares the outputs. It also checks 26 broken containers, for which the JS decoder and the C loader (fed 1, 7 and 4096 bytes at a time) must report the same error, section and record index.

Current results:

| patch | FBC per sample → FPB | per block | VM vs ref | firmware vs VM | ref vs Faust C++ |
|---|---|---|---|---|---|
| `fi.resonlp` | 47 → 8 | 42 → 15 | bit-exact | bit-exact | 5e-6 (FBC prints constants with 6 digits) |
| feedback echo | 34 → 9 | 14 → 6 | bit-exact | bit-exact | bit-exact |
| `os.osc` | 53 → 14 | 7 → 2 | bit-exact | bit-exact | bit-exact |
