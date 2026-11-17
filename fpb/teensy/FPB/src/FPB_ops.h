// FPB: float patch bytecode, op table and step types (platform independent)
#pragma once
#include <stdint.h>
#include <stddef.h>

#if defined(__IMXRT1062__)
  // On Teensy 4 .rodata is copied to DTCM, .progmem stays in flash
  #define FPB_FLASH __attribute__((section(".progmem")))
#else
  #define FPB_FLASH
#endif

struct FPB_Step;
typedef const FPB_Step* (*FPB_StepFn)(const FPB_Step*);

// One executable step: one operation of the patch, made by the loader from one instruction.
//
//   fn    the operation (fpb_add, fpb_madd ... in FPB_ops.cpp)
//   p[]   one pointer per operand, as many as the operation has (its "arity", from its signature):
//           'f' / 'i'  -> a float / int slot (FPB_Program::f[] / i[]): the value is read or written there
//           'a'        -> an FPB_ArrayRef (a delay line or a table)
//           'c'        -> no pointer: the number itself (a small constant, i.e. a channel)
//
// The steps of a section (blk or smp) are packed one after the other in one block of memory, so their
// size varies (an add is fn + 3 pointers, a madd fn + 4). No step stores where the next one is: each fn
// knows its own operand count and returns the address right after its last pointer, which is where the
// loader put the next step (see NEXT in FPB_ops.cpp). The last step of a section is fpb_end, which
// returns nullptr. So running a section is:
//
//     for (const FPB_Step* s = first; s != nullptr; s = s->fn(s)) {}
//
// The pointers point at fixed places that are set up when the patch is loaded, so a step needs no
// lookups or index arithmetic while it runs: p[2] is "the address in the step + 12", a constant offset.
struct FPB_Step {
    FPB_StepFn fn;
    void* p[];      // a "flexible array member": not a pointer, just a name for the memory right after fn
};
// The loader writes the steps itself (fn, then the operand pointers right after it), so p must start
// exactly where fn ends: no padding between them. True on 32-bit ARM and on 64-bit PCs; checked here.
static_assert(offsetof(FPB_Step, p) == sizeof(FPB_StepFn), "FPB_Step: padding between fn and p");

struct FPB_ArrayRef {
    void*    base;
    uint32_t len;
    uint32_t mask;      // len - 1 when len is a power of two, else 0
};

enum : uint8_t {
    FPB_PURE     = 0x01,
    FPB_STATEFUL = 0x02,
    FPB_ARRAY    = 0x04,
    FPB_RESERVED = 0x40,
    FPB_REMOVED  = 0x80,
};

#define FPB_NAME_LEN 12     // incl. terminating zero
#define FPB_SIG_LEN  8      // incl. terminating zero

// Fixed-size strings, so the whole table (names included) can live in flash.
struct FPB_OpDef {
    char       name[FPB_NAME_LEN];
    char       sig[FPB_SIG_LEN];
    uint8_t    flags;
    FPB_StepFn fn;
};

struct FPB_GroupDef {
    char    name[8];
    uint8_t first;
};

extern const FPB_OpDef    FPB_OPS[];
extern const uint16_t     FPB_OP_COUNT;
extern const FPB_GroupDef FPB_GROUPS[];
extern const uint8_t      FPB_GROUP_COUNT;

// FNV-1a over name, 0x00, sig; folded to 16 bits (must match red/fpb/fpb-core.js)
uint16_t fpb_fingerprint(const char* name, const char* sig);

// number of operands in a signature (the '=' does not count)
uint8_t fpb_sig_arity(const char* sig);

// end-of-section step function (returns nullptr)
const FPB_Step* fpb_end(const FPB_Step* s);
