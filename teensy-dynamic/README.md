# Teensy Dynamic Audio: an unofficial Boards Manager package

PJRC's official Teensyduino platform with these swapped in:

- h4yn0nnym0u5e's (Jonathan Oakley's) **Dynamic Audio** forks of the core and the Audio library,
  which create, connect and delete audio objects while the firmware runs;
- **OSCAudio**, the OSC layer that ASDT++'s live mode talks to;
- the **OSC** library version OSCAudio needs (the one in Teensyduino 1.62 is too old for it).

It is **not from PJRC**. It installs beside the official Teensy package under its own name
(`teensy-dynamic`), so your normal Teensyduino is never changed. Its boards are marked
"(Dynamic Audio)". Switch back by choosing a normal Teensy board.

## Install (Arduino IDE 2.x)

1. File → Preferences → *Additional boards manager URLs*: add both
   ```
   https://www.pjrc.com/teensy/package_teensy_index.json
   https://manicken.github.io/teensy-dynamic/package_teensy_dynamic_index.json
   ```
   The first is PJRC's: the package uses PJRC's own compiler and tools from it.
2. Boards Manager → *Teensy Dynamic Audio (unofficial)* → Install.
3. Choose *Teensy 4.1 (Dynamic Audio)* (or 4.0 / MicroMod). For OSCAudio, set
   Tools → USB Type to *Serial + MIDI + Audio*.

arduino-cli: `arduino-cli core install teensy-dynamic:avr` with both URLs in `board_manager.additional_urls`.

## How it is built

[`build.js`](build.js) (Node 22, no packages):

1. Downloads the official platform for the Teensyduino version in [`config.json`](config.json),
   checked against the SHA-256 and the size in PJRC's index.
2. Downloads each source in `config.json`, pinned to the commit its branch points to now.
3. Swaps them in:
   - `cores`: only the folders the official core has;
   - a library: the whole folder.

   It also renames the platform and the boards.
4. Writes the archive and the package index with the new version added, plus release notes
   that list the exact commits. The archive also has a `DYNAMIC_AUDIO.txt` that lists them.

Versions are `<Teensyduino>-dyn.<n>`, for example `1.62.0-dyn.1`. Older versions stay in the
index, so a user can go back to one in the Boards Manager.

[`test.js`](test.js) installs the built package with arduino-cli from its index, as a user would.
It uses its own folders and a local web server for the archive. Then it compiles
[`test/DynamicOscTest`](test/DynamicOscTest/DynamicOscTest.ino) for a Teensy 4.1 and checks that
the core and the swapped libraries came from the package.

Locally:

```
node teensy-dynamic/build.js
node teensy-dynamic/test.js --arduino-cli "<path to arduino-cli>" --work C:/tmp/tdt
```

On Windows, keep `--work` short: gcc fails on paths longer than 260 characters. Arduino IDE 2
has an arduino-cli in `resources/app/lib/backend/resources/`.

## Publishing

The GitHub Action [`.github/workflows/teensy-dynamic.yml`](../.github/workflows/teensy-dynamic.yml)
is run by hand: Actions → *Teensy Dynamic Audio package* → Run workflow. It builds and tests the
package. If the test passes, it makes a GitHub release with the archive and commits the updated
`package_teensy_dynamic_index.json`, which GitHub Pages then serves.

With *publish* unchecked, it only builds and tests and keeps the files as a workflow artifact.

To publish from another repository (for example Jonathan's), copy `teensy-dynamic/` and the
workflow file there and turn on GitHub Pages. The URLs follow the repository it runs in.

## Not tested

- Only the Teensy 4.1 is compile-tested. The Teensy 3.x boards are in the package, but the
  dynamic fork for them is a separate branch.
- Nothing has been run on hardware from this package yet.
