// FPB: float patch bytecode, loader and program (platform independent).
// Format: specs/fpb-bytecode.md. The tool side is red/fpb/.
#pragma once
#include "FPB_ops.h"

#define FPB_VERSION      1
#define FPB_HEADER_SIZE  40
#define FPB_MAX_ARITY    8

// error codes; the same names and values are used by red/fpb/fpb-format.js
enum FPB_Error : int8_t {
    FPB_OK = 0,
    FPB_E_MAGIC = -1,          // not an FPB container
    FPB_E_VERSION = -2,        // unknown version
    FPB_E_HEADER = -3,         // inconsistent header fields
    FPB_E_OPCOUNT = -4,        // compiled for a bigger op table than this firmware has
    FPB_E_OP_INDEX = -5,       // used op outside the table
    FPB_E_OP_RESERVED = -6,    // used op is a reserved slot
    FPB_E_OP_REMOVED = -7,     // used op has been removed from the firmware
    FPB_E_OP_ARITY = -8,       // used op: operand count differs from the firmware
    FPB_E_OP_FP = -9,          // used op: name/signature fingerprint differs
    FPB_E_ARRAY = -10,         // bad array record
    FPB_E_NOMEM = -11,         // allocation failed
    FPB_E_SLOT = -12,          // constant or param slot out of range
    FPB_E_INSTR_OP = -13,      // instruction uses an op that is not in the used-ops list
    FPB_E_INSTR_ARITY = -14,   // instruction operand count differs from the op
    FPB_E_OPERAND = -15,       // operand out of range for its kind
    FPB_E_WRITE_INPUT = -16,   // instruction writes an input slot
    FPB_E_CODE_SIZE = -17,     // codeBytes does not match the instructions
    FPB_E_DATA_SIZE = -18,     // dataBytes does not match the arrays
    FPB_E_CRC = -19,           // checksum mismatch
    FPB_E_TRAILING = -20,      // bytes after the end of the container
    FPB_E_INCOMPLETE = -21,    // the stream ended early
    FPB_E_STATE = -22,         // feed() after an error, or finish() twice
};

const char* fpb_error_name(int err);

enum FPB_Tier : uint8_t { FPB_TIER_FAST = 0, FPB_TIER_DMA = 1, FPB_TIER_EXT = 2, FPB_TIER_ANY = 3 };

// memory hooks; the default uses malloc/free
struct FPB_Alloc {
    void* (*alloc)(size_t bytes, uint8_t tier, void* user);
    void  (*release)(void* ptr, uint8_t tier, void* user);
    void* user;
};
extern const FPB_Alloc FPB_DEFAULT_ALLOC;

struct FPB_Header {
    uint8_t  version, flags;
    uint16_t headerSize, opCount;
    uint8_t  nIn, nOut;
    uint16_t fSlots, iSlots;
    uint8_t  nArr, nUsedOps;
    uint16_t nFConst, nIConst;
    uint8_t  nParam;
    uint16_t nBlkInstr, nSmpInstr;
    uint32_t codeBytes, dataBytes, crc;
};

// A loaded, runnable patch. Created by FPB_Loader::finish(), deleted with delete.
class FPB_Program {
public:
    ~FPB_Program();

    uint8_t  numInputs()  const { return nIn; }
    uint8_t  numOutputs() const { return nOut; }
    uint16_t numParams()  const { return nParam; }
    size_t   memoryUsed(uint8_t tier) const { return tier < 4 ? memSize[tier] : 0; }

    // set a parameter by index (position in the params section); takes effect at the next blk
    bool  setParam(uint16_t index, float value);
    float getParam(uint16_t index) const;

    // run one block: blk once, then smp for every sample.
    // in[c] / out[c] point to n floats; in may be nullptr when there are no inputs.
    void process(const float* const* in, float* const* out, int n);

private:
    friend class FPB_Loader;
    FPB_Program() {}
    uint8_t  nIn = 0, nOut = 0;
    uint16_t nParam = 0;
    float*   f = nullptr;
    int32_t* i = nullptr;
    uint16_t* paramSlot = nullptr;
    const FPB_Step* blk = nullptr;
    const FPB_Step* smp = nullptr;
    void*    block[5] = {};      // [0] = fast block (steps, slots, array refs), [1 + tier] = arrays of that tier
    uint8_t  blockTier[5] = {};
    size_t   memSize[4] = {};    // bytes per tier
    FPB_Alloc alloc = { nullptr, nullptr, nullptr };
};

// Push parser: feed the container in pieces of any size (file, serial, network, flash).
class FPB_Loader {
public:
    FPB_Loader() {}
    ~FPB_Loader() { reset(); }

    // start a new load. The op table defaults to the firmware's own table.
    void begin(const FPB_Alloc& alloc = FPB_DEFAULT_ALLOC,
               const FPB_OpDef* ops = FPB_OPS, uint16_t opCount = FPB_OP_COUNT);

    // returns FPB_OK or an error; after an error the load is dead (call begin() again)
    int feed(const uint8_t* data, size_t len);

    // call after the last byte. Returns the program (caller owns it) or nullptr (see error()).
    FPB_Program* finish();

    int      error() const { return err; }
    uint8_t  errorSection() const { return errSection; }   // the section the error was found in
    uint32_t errorIndex() const { return errIndex; }       // the record index within that section
    const FPB_Header& header() const { return hdr; }

    void reset();   // frees a partly loaded program

    enum Section : uint8_t { S_HEADER, S_HEADER_SKIP, S_USEDOPS, S_ARRAYS, S_FCONST, S_ICONST, S_PARAMS,
                             S_CODE, S_DATA, S_DONE, S_ERROR };

private:
    int  fail(int e);
    int  onHeader();
    int  onRecord();
    int  allocFast();
    int  allocArrays();
    int  nextSection();
    int  onCode();
    void beginCode();
    void emitEnd();
    void nextDataArray();

    FPB_Alloc        alloc = FPB_DEFAULT_ALLOC;
    const FPB_OpDef* ops = nullptr;
    uint16_t         opCount = 0;

    FPB_Header hdr = {};
    FPB_Program* prog = nullptr;
    Section  sec = S_ERROR;
    int      err = FPB_E_STATE;
    uint8_t  errSection = 0;
    uint32_t errIndex = 0;

    uint8_t  buf[FPB_HEADER_SIZE];   // header, or one record (at most 2 + 2 * FPB_MAX_ARITY bytes)
    uint8_t  need = 0, got = 0;
    uint32_t recIndex = 0, recCount = 0;
    uint32_t skipLeft = 0;
    uint32_t crc = 0;
    bool     crcOn = false;

    // used ops: bitmap + arity per opcode
    uint32_t usedMask[8] = {};
    uint8_t  usedArity[256] = {};

    // code
    uint8_t* stepCursor = nullptr;
    uint8_t* stepEnd = nullptr;
    uint32_t codeLeft = 0;
    uint32_t instrLeftBlk = 0, instrLeftSmp = 0;
    bool     inSmp = false;
    uint8_t  curOp = 0, curN = 0;
    bool     codeHdrDone = false;

    // arrays (stored in the fast block's ArrayRef table)
    FPB_ArrayRef* arrays = nullptr;
    uint8_t*      arrTier = nullptr;     // per array tier and init flag (bit 7 = init from data)
    uint32_t      dataExpected = 0;
    uint32_t      dataLeft = 0;
    uint16_t      dataArr = 0;
    uint32_t      dataOff = 0;
};
