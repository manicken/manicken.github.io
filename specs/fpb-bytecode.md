# FPB: float patch bytecode (draft 0.1)

**Status:** draft 0.1 with a first working model. The FBC front end, the encoder, the verifier VM and the firmware loader and executor are in place. See `fpb/README.md`. "FPB" is a working name.

FPB is a compact binary format for audio objects that run on a Teensy and are created at runtime. The Design Tool++ (the "tool") compiles a patch to FPB. The firmware checks the FPB and loads it into a chain of `{fn, ptrs}` steps that run with no interpretation.

The patch can come from three places:
- a Faust FBC file;
- a small text language;
- a dataflow diagram drawn in the tool.

The firmware never sees text, JSON or UI data.

```
FBC (Faust)   ─┐
text language ─┼─► graph IR (JS objects in the tool) ─► optimiser ─► FPB ─► loader ─► steps
diagram       ─┘                                            └─► C++ export (fixed firmware)
```

## 1. Rules

1. **The firmware owns the op table.** An opcode is the position of the op in a fixed array, and the tool reads the table from the firmware.
2. **An index that has once held a real op never changes its meaning.** A reserved slot may be filled later. An op that is no longer wanted becomes a `REMOVED` stub and keeps its index.
3. **FPB never contains pointers,** only indices. The loader looks up the function pointers every time it loads, so stored FPB keeps working after the firmware is rebuilt, as long as the checks in section 6 pass.
4. **FPB is a cache.** The source of a patch is the graph, the text or the `.dsp` file in the project. When the firmware rejects a stored FPB, the tool compiles it again.
5. **One pass, no heap churn.** The loader reads the header, makes all allocations, and then streams the rest straight into place.

## 2. Op table (firmware)

```cpp
struct FPB_OpDef {
    char       name[12];   // "madd", for the tool only
    char       sig[8];     // operand signature, see 2.1
    uint8_t    flags;      // see 2.2
    FPB_StepFn fn;
};

const FPB_OpDef FPB_OPS[] FPB_FLASH = { FPB_OP_LIST };   // index = opcode, at most 255 entries
```

On Teensy 4, `const` data and string literals are copied to RAM1 (DTCM) unless they are marked `PROGMEM`. For that reason the names and signatures are fixed-size arrays inside the entry, not pointers to string literals, and the whole table stays in flash.

The list itself is in `FPB_oplist.h`, written as one `FPB_OP(index, name, sig, flags)`, `FPB_RES(index)` or `FPB_DEL(index, name, sig)` per entry. The firmware builds its table from that file. The tool reads the same file with `RED.fpb.core.parseOpList` when it compiles offline.

### 2.1 Signature

`sig` is written as `<written operands>=<read operands>`. Each character is one operand of one of these kinds:

| char | kind | on the wire | resolved to |
|---|---|---|---|
| `f` | float slot | u16 slot index | `float*` |
| `i` | int slot | u16 slot index | `int32_t*` |
| `a` | array | u16 array id | `const ArrayRef*` |
| `c` | immediate | u16 value | the value itself, cast to `void*` |

Examples:

| op | sig | meaning |
|---|---|---|
| `add` | `f=ff` | d = a + b |
| `madd` | `f=fff` | d = a * b + c |
| `rdf` | `f=ai` | d = arr[i] |
| `wrf` | `=aif` | arr[i] = v |

The **arity** of an op is the number of characters in its signature, not counting `=`.

### 2.2 Flags

| bit | name | meaning |
|---|---|---|
| 0 | `PURE` | no side effects; the optimiser may move the op to `blk`, merge it or duplicate it |
| 1 | `STATEFUL` | reads or writes state that is kept between samples |
| 2 | `ARRAY` | has array operands |
| 6 | `RESERVED` | placeholder; the loader rejects it |
| 7 | `REMOVED` | an op that has been taken out; the loader rejects it with its own error |

### 2.3 Groups and reserved slots

Ops are grouped in fixed index ranges. Unused slots in a group are filled with `RESERVED`, so that a group can grow without breaking up the table. A `static_assert` checks where each group starts.

```cpp
#define OP_RESERVED { "", "", op_reserved, F_RESERVED }
```

Index 0 is always `RESERVED`, so memory that is all zeros is never a valid program.

The table also has a small list of groups, `{ name, firstIndex }`, which gives the tool its palette categories.

The first groups are listed in appendix A.

### 2.4 Fingerprint

Every op has a 16-bit fingerprint. The JS side and the C++ side must compute it in exactly the same way:

```
h  = FNV-1a 32-bit over the bytes of name, then 0x00, then the bytes of sig
fp = (h >> 16) ^ (h & 0xFFFF)
```

## 3. Op table query (the tool asks the firmware)

The query is independent of the transport. It is `/fpb/ops` over OSC, and a BlockStreamer command in DALHAL. The reply is streamed one row at a time, so it needs no buffer:

```
header : fwName, fpbVersion, opCount
groups : (name, firstIndex) ...
ops    : (index, name, sig, flags, fp) ...    reserved rows may be left out
```

The tool caches the table under a key made from `opCount` and a hash of all the fingerprints.

## 4. Container layout

All values are little-endian and byte-packed, with no alignment. The loader reads the container byte by byte.

### 4.1 Header (40 bytes)

| off | size | field | notes |
|---|---|---|---|
| 0 | 4 | magic | `'F','P','B',0` |
| 4 | 1 | version | 1 |
| 5 | 1 | flags | bit 0: a data section follows |
| 6 | 2 | headerSize | 40; a newer version may grow it, and the loader skips the extra bytes |
| 8 | 2 | opCount | size of the op table the compiler used |
| 10 | 1 | nIn | audio inputs |
| 11 | 1 | nOut | audio outputs |
| 12 | 2 | fSlots | float slots, inputs and outputs included (see 5.2) |
| 14 | 2 | iSlots | int slots |
| 16 | 1 | nArr | arrays |
| 17 | 1 | nUsedOps | entries in the used-ops section |
| 18 | 2 | nFConst | float constants |
| 20 | 2 | nIConst | int constants |
| 22 | 1 | nParam | parameters |
| 23 | 1 | — | reserved, 0 |
| 24 | 2 | nBlkInstr | instructions in `blk` |
| 26 | 2 | nSmpInstr | instructions in `smp` |
| 28 | 4 | codeBytes | bytes in `blk` plus `smp` |
| 32 | 4 | dataBytes | bytes in the data section |
| 36 | 4 | crc32 | IEEE CRC-32 (as in zlib) over every byte after the header |

### 4.2 Sections, in order

| section | record | bytes |
|---|---|---|
| used ops | `op u8, arity u8, fp u16` | 4 × nUsedOps |
| arrays | `tier u8, type u8, init u8, 0 u8, len u32` | 8 × nArr |
| float constants | `slot u16, value f32` | 6 × nFConst |
| int constants | `slot u16, value i32` | 6 × nIConst |
| params | `slot u16, default f32` | 6 × nParam |
| code `blk` | instructions | |
| code `smp` | instructions | codeBytes in total |
| data | initial array contents | dataBytes |

Array fields:
- **tier:** 0 = fast (DTCM), 1 = DMA (OCRAM), 2 = ext (PSRAM), 3 = any (the loader picks).
- **type:** 0 = f32, 1 = i32.
- **init:** 0 = zeros, 1 = taken from the data section.
- **len:** must be a power of two when the array is used with `dly*` ops, because the mask is `len - 1`.

The **param index** is the position of the param in the params section, so the host sets a parameter by index.

**Data:** arrays with `init = 1` follow one after the other, in array order. Each holds `len` values of its type.

### 4.3 Instruction

```
op u8 | n u8 | operand u16 × n
```

The section lengths come from the header, so the stream has no end op.

## 5. Runtime

### 5.1 Steps

```cpp
struct Step { StepFn fn; void* p[]; };          // p has `arity` entries

static const Step* op_madd(const Step* s) {
    *(float*)s->p[0] = *(float*)s->p[1] * *(float*)s->p[2] + *(float*)s->p[3];
    return (const Step*)&s->p[4];               // each fn knows its own size
}
```

The loader adds an `end` step (`fn` returns `nullptr`) after `blk` and after `smp`. To run a section:

```cpp
for (const Step* s = first; s; s = s->fn(s)) {}
```

An `a` operand points to an `ArrayRef { void* base; uint32_t len; uint32_t mask; }` held in the fast arena.

### 5.2 Inputs and outputs are slots

There are no `in` or `out` ops. Float slots `0 .. nIn-1` are the inputs, and slots `nIn .. nIn+nOut-1` are the outputs. For each block:

```
convert the int16 input blocks to float buffers
run blk
for i in 0 .. 127:
    slot[ch] = in[ch][i]               for every input
    run smp
    out[ch][i] = slot[nIn + ch]        for every output
convert the float buffers to int16 output blocks
```

### 5.3 Memory

Each memory tier gets one allocation, made after the header and the arrays section have been read:

```
fast: [float slots][int slots][ArrayRef × nArr][blk steps][smp steps][fast arrays]
dma : [tier-1 arrays]
ext : [tier-2 arrays]            only available with PSRAM (extmem_malloc)
```

Step memory can be computed in advance: for each instruction, `4 + 4 × arity` bytes, plus two `end` steps.

**Teensy 4:** the malloc heap is in RAM2 (OCRAM), and DTCM has no heap. Until a static DTCM pool exists, the fast tier is therefore RAM2 as well. Tiers `ext` and `any` use `extmem_malloc`, which falls back to RAM2 when there is no PSRAM.

### 5.5 Floating point

All ops round every result to float32, the way C does without contraction. `madd` therefore rounds the product and the sum separately. `FPB_ops.cpp` turns off GCC's `fp-contract`, so the Cortex-M7 doesn't fuse them into `vfma`. That keeps the firmware bit-exact with the verifier VM in the tool. A fused op can be added later as a separate opcode.

### 5.4 Parameters and swapping

- **Parameters:** the host writes the float slot of a param directly; a 32-bit store is atomic. The new value is used in the next `blk`.
- **Swapping:** a new FPB is loaded into a new instance in full. The old instance is replaced inside `update()`, at a block boundary, and then freed. State is not carried over in version 1.

## 6. Checks when loading

The loader runs the checks in this order. The first one that fails stops the load and reports an error code together with the section and the record index.

1. The magic and the version are known, and `headerSize ≥ 40`.
2. `opCount ≤` the size of the firmware's table.
3. For each used op:
   - its index is less than `opCount`;
   - it is not `RESERVED` (code `E_OP_RESERVED`) and not `REMOVED` (code `E_OP_REMOVED`);
   - its arity matches the firmware's signature;
   - its `fp` matches.
4. Each array: the tier is available, `len > 0`, and `len` is a power of two when needed.
5. Memory per tier fits. This check happens before any allocation.
6. Each constant and param slot is in range.
7. Each instruction:
   - `op` is in the used-ops set;
   - `n` equals the op's arity;
   - each operand is in range for its kind: `f < fSlots`, `i < iSlots`, `a < nArr`;
   - it does not write to an input slot.
8. The CRC matches. This is checked at the end of the stream, before the instance becomes active.

## 7. Storing and booting

- The firmware can save an FPB that it accepted, for example to LittleFS or SD, under a name the tool gives it.
- At boot, each stored FPB goes through the checks in section 6.
  - If it passes, the object starts.
  - If it fails, the object is created silent. Its status ("needs recompile", plus the error code) is reported when the tool connects, and the tool compiles the FPB again from the project source.
- Re-creating the rest of the design at boot (which objects exist, and how they are connected) is a separate topic. One option is to store the live update OSC messages as a boot script.

## 8. Open questions

- Should fused super-instructions be chosen by the tool from a fixed list (group 128–) or be described per firmware?
- Carrying state over when an instance is swapped, for instances with the same layout.
- Sample rates other than the fixed `AUDIO_SAMPLE_RATE_EXACT`. Today the constants are folded in the tool.
- Branches with sub-blocks (Faust `kSelectReal` with side effects). Version 1 only has a `select` op that evaluates both sides.
- Is `int16` storage for long delays useful (half the memory)?

## Appendix A: op table, version 1

`fpb/teensy/FPB/src/FPB_oplist.h` is the authoritative list. It has 160 entries, and every unlisted index is reserved.

These ops cover every FBC instruction that can appear in a scalar-mode `control_block` or sample loop. Static init and constants are computed by the tool and need no ops.

| range | group | ops |
|---|---|---|
| 0 | — | reserved (invalid) |
| 1–20 | core | `mov f=f`, `add sub mul div f=ff`, `neg f=f`, `madd f=fff` (a·b + c), `msub f=fff` (c − a·b), `min max f=ff` (as `std::min/max`), `abs f=f`, `select f=iff`, `lt le gt ge eq ne i=ff`, `copysign f=ff`, `mov2 ff=ff` (d1 = s1, then d2 = s2) |
| 32–54 | math | `floor ceil round rint sqrt sin cos tan asin acos atan f=f`, `atan2 f=ff`, `exp log log10 f=f`, `pow fmod f=ff`, `sinh cosh tanh asinh acosh atanh f=f` |
| 64–87 | int | `imov i=i`, `iadd isub imul idiv irem iand ior ixor ishl ishr iushr imin imax i=ii`, `iabs i=i`, `iselect i=iii`, `ilt ile igt ige ieq ine i=ii`, `ftoi i=f`, `itof f=i` |
| 96–102 | arrays | `rdf f=ai`, `wrf =aif`, `rdi i=ai`, `wri =aii`, `dlyrd f=aii` (arr[(a − b) & mask]), `rdfm f=ai` (arr[i & mask]), `wrfm =aif` (arr[i & mask] = v); mask = len − 1 for a power-of-two length, else 0 |
| 128–159 | fused | reserved for super-instructions |

**Int ops never have undefined behaviour:**
- arithmetic wraps;
- dividing by 0 gives 0, and so does `irem` by −1;
- shift counts are masked with `& 31`;
- `ftoi` saturates, and NaN becomes 0.

**Array ops check the index:** a read out of range gives 0, and a write out of range is dropped.

The compiler uses the newer ops (`mov2`, `dlyrd`, `rdfm`, `wrfm`) only when the op table it compiles for has them. A firmware from before they were added keeps working.

**The compiler's optimisations (FBC front end):**
- **Delay-line accesses** (`arr[(IOTA - d) & mask]`) become one op instead of three.
- **One-sample copies** (`fRec[1] = fRec[0]`) are removed when the next sample can read the source slot directly.
- **The remaining movs** are paired into `mov2`.

With djembe + freeverb this takes the per-sample code from 404 to 278 steps.

Still to come, in the free slots:
- `tblrdl` (a table read with linear interpolation);
- super-instructions in 128–.

## Appendix B: notes on the FBC front end

- **Operand order:** in FBC the value pushed last is the LEFT operand. `kRealValue 2, kLoadReal x, kPowf` means `pow(x, 2)`.
- **Blocks:**
  - `control_block` becomes `blk`.
  - `dsp_block` becomes `smp`, with the loop counter, `count` and `kCondBranch` removed.
  - `static_init_block`, `constants_block` and `reset_ui` are run in the tool.
  - `clear_block` becomes zero-initialised memory.
- **State and arrays:**
  - A constant-index array access (`fRec0[1]`) becomes a plain float slot. The shift at the end of the loop becomes `mov`.
  - `arr[(IOTA - d) & mask]` becomes `dlyrd`, and `IOTA = IOTA + 1` becomes `iinc`.
- **Inputs and outputs:** `kLoadInput` and `kStoreOutput` become the input and output slots (5.2).
- **Size:** `fi.resonlp` has 47 FBC instructions per sample and comes to about 10 FPB instructions.
- **UI:** `user_interface_block` and `-json` stay in the tool. Only `(slot, default)` is sent.
