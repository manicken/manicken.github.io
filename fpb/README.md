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
| `fpb/tests/` | test runner, host C++ harnesses, Faust test patches |

The `red/fpb` files aren't loaded by `index.html` yet. They work in the browser (`RED.fpb.*`) and in Node (with `global.RED = {}`).

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
node fpb/tests/run-tests.js
```

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
