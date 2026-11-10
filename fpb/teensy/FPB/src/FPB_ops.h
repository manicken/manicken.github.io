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

// One executable step: the function, followed by one pointer per operand (count = arity of the op).
// Steps are packed one after the other; each fn returns the next step (nullptr = end of section).
struct FPB_Step {
    FPB_StepFn fn;
    void* p[];
};

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
