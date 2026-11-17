# FPB: how it works

FPB (float patch bytecode) runs audio patches that are compiled in the Audio System Design Tool++ and loaded into a Teensy **while the firmware runs**. So far the patches come from Faust. This page explains what the Teensy gets, how it is loaded, and how it runs. The format itself is specified in [specs/fpb-bytecode.md](../../../specs/fpb-bytecode.md).

In short:
- the tool does all the hard work before anything is sent;
- the Teensy checks every byte, allocates exactly the memory it needs, once;
- it then runs the patch as a packed sequence of tiny pre-linked steps, with no interpreting, no lookups and no allocation while audio runs.

All numbers below are real, from the `fi.resonlp` example (a resonant lowpass filter, `fpb/tests/faust/lp.dsp`).

## 1. What the tool does (before anything is sent)

```
lp.dsp ──faust -lang interp──► lp.fbc ──compiler (JS)──► lp.fpb (288 bytes) ──OSC /feed──► Teensy
```

Faust's interpreter bytecode (FBC) is a stack machine with 47 instructions per sample for this filter. The compiler in the tool (`red/fpb/fpb-compile-fbc.js`) turns it into a few register-style instructions. Five things happen:

1. **Initialisation runs in advance.** The tool runs Faust's own init code (tables, constants that depend on the sample rate, the parameter defaults) and keeps only the results. `π / SR` arrives on the Teensy as the number `0.0000712104`; no init code is sent.
2. **The stack disappears.** The stack code is turned into plain expressions, then into instructions of the form *destination ← operands*.
3. **Every value gets a fixed place, a "slot":** inputs, outputs, parameters, filter state, constants and temporaries. Each slot is numbered once.
4. **Code is split by rate.**
   - **`blk`** runs once per audio block. It turns the parameters into coefficients (`tan`, `pow`, divisions).
   - **`smp`** runs for every sample. It holds the actual filter.
5. **Common patterns are merged** into one instruction:
   - `a·b+c` becomes `madd`;
   - a delay-line read `arr[(i−d) & mask]` becomes `dlyrd`;
   - two copies become `mov2`.

The result for the filter, 7 instructions per sample instead of 47:

```
smp  mul   tmp0      ← fRec0[2] · fSlow4
     madd  tmp1      ← fRec0[1] · fSlow1 + tmp0
     msub  fRec0[0]  ← in0 − fSlow5 · tmp1
     madd  tmp0      ← fRec0[1] · 2 + fRec0[0]
     add   tmp1      ← fRec0[2] + tmp0
     mul   out0      ← fSlow5 · tmp1
     mov2  fRec0[2] ← fRec0[1],  fRec0[1] ← fRec0[0]
```

Before sending, the tool runs the result in a JS copy of the Teensy executor and compares it with Faust's own interpreter. It must be **bit-exact**, or nothing is sent.

## 2. The container (what is sent)

Little-endian and byte-packed, so it can be read one byte at a time:

| part | bytes | what |
|---|---|---|
| header | 40 | the size of everything: slots, instructions, code bytes, arrays, CRC |
| used ops | 4 each | each operation the code uses: its number, operand count and a 16-bit fingerprint of its name and signature |
| arrays | 8 each | length and memory tier of each delay line or table |
| constants | 6 each | slot number + initial value |
| parameters | 6 each | slot number + default value |
| code | 2 + 2 per operand | `op, n, operand, operand …`, where an operand is just a slot number |
| data | | initial contents of arrays (e.g. a sine table) |

The container holds **no pointers and no names**, only numbers. It can therefore be stored (e.g. on SD) and loaded again after the firmware has been rebuilt.

## 3. Loading on the Teensy (`FPB_Loader`, FPB.cpp)

The container arrives in pieces, e.g. 4 KB OSC blobs. The loader is a *push parser*: `feed(bytes, len)` takes any amount, checks it, and puts it straight where it belongs. It never keeps the container itself.

1. **Header.** Everything's size is known from the first 40 bytes, so the loader allocates **one block of exactly the right size** right away: the *fast block*.
2. **Used ops.** Every op is checked against **this firmware's own op table**: it must exist, its operand count must match, and its fingerprint must match. A container made for a different table is refused with an error code, never misread.
3. **Arrays.** One zeroed block per memory tier (RAM, DMA RAM or PSRAM), holding all the arrays of that tier.
4. **Constants and parameters** are written straight into their slots.
5. **Code.** Each instruction becomes a **step**, written straight after the previous one in the fast block:
   ```
   madd 17 11 5 16   →   [ fpb_madd | &f[17] | &f[11] | &f[5] | &f[16] ]
   ```
   The op number becomes the address of the C function, from the op table in flash. Each slot number becomes the address of that slot. Every operand is range-checked first.
6. **CRC** over everything after the header. If it matches, the program is ready. It replaces the running one between two audio blocks: a pointer swap with the audio interrupt off for a few instructions. The old program is freed outside the interrupt.

Allocations per program: one small `FPB_Program` object, the fast block, and one block per array tier that has arrays (at most 5 in total). **Nothing is allocated while audio runs.**

## 4. The memory: one block, everything pre-linked

The fast block of the filter is 464 bytes:

```
offset  size   contents
   0    240    blk steps (15 steps + the end step)
 240    132    smp steps ( 7 steps + the end step)
 376     76    f[0..18]  float slots: in0 out0 cutoff q fSlow0..5 fRec0[2..0] constants tmp0..2
 456      4    paramSlot[]  parameter 0 → f[2], parameter 1 → f[3]
```

```
              the fast block (one malloc)
 ┌───────────────────────────────────────────────────────────────┐
 │ [fpb_mul|●|●|●][fpb_madd|●|●|●|●] … [fpb_end] │ f[0] f[1] … f[18] │
 └────────────────│─│─│──────────────────────────┴──▲───▲──────────┘
                  └─┴─┴──────────────────────────────┴───┘
                  the pointers in a step point at slots in the same block

 a patch with delay lines adds:  ArrayRef { base, len, mask } ──► an array block (e.g. in PSRAM)
```

The steps are not separate objects linked to each other, and the data is not in separate blocks linked in. The code and the data it works on sit next to each other in one block, and every pointer was filled in once, when the patch was loaded. Only big arrays live elsewhere, reached through an `ArrayRef` (base address, length, and mask for wrapping a delay index).

## 5. A step (`FPB_Step`, FPB_ops.h)

```cpp
struct FPB_Step {
    FPB_StepFn fn;   // the operation
    void* p[];       // the operands: NOT a pointer to an array, the operands themselves follow fn
};
```

- `p[]` is a *flexible array member*. It takes no space of its own; it is a name for the memory right after `fn`.
- A step is therefore 4 bytes + 4 per operand: `mul` is 16, `madd` is 20, the end step is 4.
- There is no padding, and a `static_assert` checks that.

## 6. Running (`FPB_Program::process`, FPB.cpp)

```cpp
s = blk;  while (s) s = s->fn(s);          // once per block: the coefficients
for (k = 0; k < 128; k++) {                 // every sample
    f[0] = in[0][k];                         // input → its slot
    s = smp;  while (s) s = s->fn(s);        // the 7 steps
    out[0][k] = f[1];                        // its slot → output
}
```

Each operation does its work and returns where the **next step** is:

```cpp
OPFN(madd) { F(0) = F(1) * F(2) + F(3); NEXT(4); }
// is:  *p[0] = *p[1] * *p[2] + *p[3];   return &p[4];   ← the address right after its own operands
```

**This is not a linked list.** No step stores a pointer to the next one. The loader packed the steps one after the other, so each function knows the next step starts right after its own operands. `NEXT(4)` is a constant compiled into `fpb_madd`. The end step's function returns `nullptr`, which ends the loop. The technique is known as *threaded code*: the loop is the same as walking a list, but the "link" is computed, not stored. It also means an op could return any other step (a jump), which is how branches could be added later.

What `fpb_madd` becomes on the Teensy (Cortex-M7):

```asm
ldrd  r1, r2, [r0, #12]   ; load p[2], p[3]   (fixed offsets, two pointers in one instruction)
ldrd  r3, r4, [r0, #4]    ; load p[0], p[1]
vldr  …                   ; load the three values
adds  r0, #20             ; NEXT(4): the next step
vmul / vadd               ; the arithmetic
vstr  s15, [r3]           ; store the result
bx    lr
```

There is no instruction decoding, no switch, no stack and no index arithmetic, just loads at fixed offsets, the arithmetic and one add.

**Why one sample at a time.** Almost every patch feeds back: a filter uses its previous output, and an oscillator its previous phase. So sample *k* needs the whole program done for sample *k−1*. Faust's own C++ has the same loop.

**Parameters.** `setParam(index, value)` writes one float into the parameter's slot; a 32-bit store is atomic. The next `blk` turns it into coefficients, which is also how Faust does it.

**The CPU guard.** `AudioEffectFPB::update` times every block with the cycle counter. A patch that takes more than 70 % of a block for 4 blocks in a row is stopped (it outputs silence), so it can never starve `loop()`. The Teensy stays reachable over USB/OSC, and `/cpu`, `/cpuMax` and `/isOverloaded` tell you what happened.

## 7. Why this is about as lean as it gets

- **Memory.** A step is only its function and its operands, packed with no gaps, links or headers. The whole filter, code and data, is 464 bytes.
- **Cache.** The code is read straight through, next to its data. The 278 steps of djembe + freeverb fit easily in the M7's 32 KB data cache.
- **Speed.** Per step: one indirect call, a few loads at fixed offsets, the arithmetic. Everything else was done in the tool or by the loader.
- **Safety.** Every byte is checked while loading: op table, ranges, sizes, CRC. A bad container is refused with an error code and can't write outside its memory.

The remaining cost is the indirect call per step, so the gains left are from doing **fewer steps**: merged operations like `madd`, `dlyrd` and `mov2`, and removed copies. For example, djembe + freeverb goes from 1620 FBC instructions per sample to 278 steps.

| patch | FBC per sample | FPB steps per sample |
|---|---|---|
| `fi.resonlp` | 47 | 7 |
| feedback echo | 34 | 5 |
| `pm.djembe → dm.freeverb_demo` | 1620 | 278 |

## 8. Files

| file | what |
|---|---|
| `src/FPB_oplist.h` | the op table: one line per op, the opcode is its position (also read by the tool) |
| `src/FPB_ops.cpp` | the operations (`OPFN(...)`) and the table in flash |
| `src/FPB.cpp` | `FPB_Loader` (the push parser) and `FPB_Program` (memory, `process`) |
| `src/AudioEffectFPB.*` | the AudioStream object: int16 ↔ float, the CPU guard, `load` / `begin` / `feed` / `end`, `setParam` |
| `examples/FPB_Faust` | two Faust patches loaded from flash |

**Adding an operation.**
1. Write it with `OPFN` in `FPB_ops.cpp`.
2. Put it on a reserved line in `FPB_oplist.h` (never move an existing one).
3. Add the same semantics to `red/fpb/fpb-core.js`, so the tool can verify patches that use it.

Old containers keep working, and a container that uses the new op is refused by older firmware, by `opCount` and the fingerprint.
