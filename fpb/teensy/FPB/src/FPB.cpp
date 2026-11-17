// FPB loader and program. See FPB.h and specs/fpb-bytecode.md.
#include "FPB.h"
#include <string.h>
#include <stdlib.h>

#if defined(__IMXRT1062__)
#include <Arduino.h>     // extmem_malloc / extmem_free
#endif

#if defined(__BYTE_ORDER__) && (__BYTE_ORDER__ != __ORDER_LITTLE_ENDIAN__)
#error "FPB: the data section is copied raw, a little-endian target is needed"
#endif
static_assert(sizeof(FPB_StepFn) == sizeof(void*), "FPB: steps assume function and data pointers have the same size");

// ---------------------------------------------------------------- errors

const char* fpb_error_name(int e) {
    switch (e) {
        case FPB_OK:            return "OK";
        case FPB_E_MAGIC:       return "E_MAGIC";
        case FPB_E_VERSION:     return "E_VERSION";
        case FPB_E_HEADER:      return "E_HEADER";
        case FPB_E_OPCOUNT:     return "E_OPCOUNT";
        case FPB_E_OP_INDEX:    return "E_OP_INDEX";
        case FPB_E_OP_RESERVED: return "E_OP_RESERVED";
        case FPB_E_OP_REMOVED:  return "E_OP_REMOVED";
        case FPB_E_OP_ARITY:    return "E_OP_ARITY";
        case FPB_E_OP_FP:       return "E_OP_FP";
        case FPB_E_ARRAY:       return "E_ARRAY";
        case FPB_E_NOMEM:       return "E_NOMEM";
        case FPB_E_SLOT:        return "E_SLOT";
        case FPB_E_INSTR_OP:    return "E_INSTR_OP";
        case FPB_E_INSTR_ARITY: return "E_INSTR_ARITY";
        case FPB_E_OPERAND:     return "E_OPERAND";
        case FPB_E_WRITE_INPUT: return "E_WRITE_INPUT";
        case FPB_E_CODE_SIZE:   return "E_CODE_SIZE";
        case FPB_E_DATA_SIZE:   return "E_DATA_SIZE";
        case FPB_E_CRC:         return "E_CRC";
        case FPB_E_TRAILING:    return "E_TRAILING";
        case FPB_E_INCOMPLETE:  return "E_INCOMPLETE";
        case FPB_E_STATE:       return "E_STATE";
    }
    return "E_UNKNOWN";
}

// ---------------------------------------------------------------- memory

static void* default_alloc(size_t bytes, uint8_t tier, void*) {
#if defined(__IMXRT1062__)
    // On Teensy 4 the malloc heap is in RAM2 (OCRAM). DTCM has no heap, so "fast" is RAM2 for now.
    if (tier == FPB_TIER_EXT || tier == FPB_TIER_ANY) return extmem_malloc(bytes);   // falls back to malloc
    return malloc(bytes);
#else
    (void)tier;
    return malloc(bytes);
#endif
}

static void default_release(void* p, uint8_t, void*) {
#if defined(__IMXRT1062__)
    extmem_free(p);      // handles PSRAM and normal heap pointers
#else
    free(p);
#endif
}

const FPB_Alloc FPB_DEFAULT_ALLOC = { default_alloc, default_release, nullptr };

// ---------------------------------------------------------------- crc32 (IEEE, as zlib)

static const uint32_t crc_nibble[16] = {
    0x00000000, 0x1DB71064, 0x3B6E20C8, 0x26D930AC, 0x76DC4190, 0x6B6B51F4, 0x4DB26158, 0x5005713C,
    0xEDB88320, 0xF00F9344, 0xD6D6A3E8, 0xCB61B38C, 0x9B64C2B0, 0x86D3D2D4, 0xA00AE278, 0xBDBDF21C };

static uint32_t crc_update(uint32_t crc, const uint8_t* d, size_t n) {
    crc = ~crc;
    while (n--) {
        crc ^= *d++;
        crc = (crc >> 4) ^ crc_nibble[crc & 15];
        crc = (crc >> 4) ^ crc_nibble[crc & 15];
    }
    return ~crc;
}

// ---------------------------------------------------------------- little-endian readers

static inline uint16_t rd16(const uint8_t* b) { return (uint16_t)(b[0] | (b[1] << 8)); }
static inline uint32_t rd32(const uint8_t* b) { return (uint32_t)b[0] | ((uint32_t)b[1] << 8) | ((uint32_t)b[2] << 16) | ((uint32_t)b[3] << 24); }
static inline float    rdf32(const uint8_t* b) { uint32_t u = rd32(b); float f; memcpy(&f, &u, 4); return f; }

static inline size_t align8(size_t n) { return (n + 7) & ~(size_t)7; }

// ---------------------------------------------------------------- program
//
// A loaded patch (made by FPB_Loader). Its memory, all allocated once when it was loaded:
//
//   the fast block (block[0]), one allocation, in this order:
//     blk steps   the code run once per audio block (the coefficients from the parameters)
//     smp steps   the code run for every sample
//     ArrayRef[]  base / length / mask of each array
//     f[]         the float slots: inputs, outputs, parameters, state, constants, temporaries
//     i[]         the int slots
//     paramSlot[] parameter index -> its slot in f[]
//   block[1 + tier]  the arrays (delay lines, tables) of each memory tier (RAM, DMA RAM, PSRAM)
//
// The pointers in the steps point into f[], i[] and ArrayRef[], so nothing is looked up while it runs.
// The slots are numbered by the compiler: f[0 .. nIn-1] are the inputs, f[nIn .. nIn+nOut-1] the outputs.

FPB_Program::~FPB_Program() {
    for (int k = 0; k < 5; k++)
        if (block[k] && alloc.release) alloc.release(block[k], blockTier[k], alloc.user);
}

bool FPB_Program::setParam(uint16_t index, float value) {
    if (index >= nParam) return false;
    f[paramSlot[index]] = value;     // a 32-bit store is atomic; used at the next blk
    return true;
}

float FPB_Program::getParam(uint16_t index) const {
    return (index < nParam) ? f[paramSlot[index]] : 0.0f;
}

// Runs one audio block of n samples (AudioEffectFPB::update calls it with n = 128).
//   in[c]  the samples of input c  (n floats), not used when the patch has no inputs
//   out[c] where output c is written (n floats)
//
// Why one sample at a time: a patch almost always feeds back one sample (a filter uses its own previous
// output, an oscillator its previous phase), so sample k needs the whole program done for sample k-1.
// Faust's own C++ has the same loop.
void FPB_Program::process(const float* const* in, float* const* out, int n) {
    // 1. The blk section, once per block: it turns the parameters into coefficients
    //    (i.e. tan(pi * cutoff / SR)), so a parameter set with setParam() takes effect here.
    const FPB_Step* s = blk;
    while (s != nullptr)
        s = s->fn(s);          // run the step; it returns the next one, fpb_end returns nullptr

    float* outSlots = f + nIn; // the output slots come right after the input slots

    // 2. The smp section, once per sample
    for (int k = 0; k < n; k++) {
        for (int c = 0; c < nIn; c++)
            f[c] = in[c][k];             // sample k of each input -> its input slot

        s = smp;
        while (s != nullptr)
            s = s->fn(s);                // the whole program for this sample

        for (int c = 0; c < nOut; c++)
            out[c][k] = outSlots[c];     // each output slot -> sample k of that output
    }
}

// ---------------------------------------------------------------- loader
//
// FPB_Loader reads a container (specs/fpb-bytecode.md) given in pieces of any size, i.e. as it arrives
// over OSC (/feed blobs), from a file or from flash, and builds an FPB_Program from it:
//
//   begin()              start
//   feed(bytes, len)     any number of times; every byte is checked as it comes
//   finish()             after the last byte: the program, or nullptr (error() tells why)
//
// It never keeps the container. The sections are read in order:
//
//   header      sizes of everything -> allocFast() allocates the fast block right away
//   used ops    the operations the code uses, each checked against this firmware's op table
//   arrays      length / tier of each array -> allocArrays() when the last one is read
//   fconst      initial values of float slots (the constants)   -> written into f[]
//   iconst      initial values of int slots                     -> written into i[]
//   params      parameter slot + default value                  -> written into f[], paramSlot[]
//   code        the instructions, each turned into a step at once (onCode)
//   data        initial contents of arrays (i.e. a sine table), copied straight into the array memory
//
// The CRC of everything after the header is checked at the end, before the program is handed out.
// Small records (header, used ops ...) are collected in buf until they are complete (need / got).

void FPB_Loader::reset() {
    delete prog;
    prog = nullptr;
    sec = S_ERROR;
    err = FPB_E_STATE;
}

void FPB_Loader::begin(const FPB_Alloc& a, const FPB_OpDef* table, uint16_t count) {
    reset();
    alloc = a;
    ops = table;
    opCount = count;
    hdr = FPB_Header();
    sec = S_HEADER;
    err = FPB_OK;
    errSection = 0;
    errIndex = 0;
    need = FPB_HEADER_SIZE;
    got = 0;
    recIndex = recCount = 0;
    skipLeft = 0;
    crc = 0;
    memset(usedMask, 0, sizeof(usedMask));
    memset(usedArity, 0, sizeof(usedArity));
    stepCursor = stepEnd = nullptr;
    codeLeft = 0;
    instrLeftBlk = instrLeftSmp = 0;
    inSmp = false;
    codeHdrDone = false;
    arrays = nullptr;
    arrTier = nullptr;
    dataExpected = dataLeft = 0;
    dataArr = 0;
    dataOff = 0;
}

int FPB_Loader::fail(int e) {
    if (sec != S_ERROR) { errSection = sec; errIndex = recIndex; }
    err = e;
    sec = S_ERROR;
    delete prog;
    prog = nullptr;
    return e;
}

// Takes the next len bytes of the container. sec is the section being read; each pass of the loop
// consumes some of the bytes, and when a record is complete it is handled (onHeader / onRecord), which
// may move on to the next section (nextSection).
int FPB_Loader::feed(const uint8_t* d, size_t len) {
    if (sec == S_ERROR) return err ? err : FPB_E_STATE;
    while (len) {
        if (sec == S_DONE) return fail(FPB_E_TRAILING);
        if (sec == S_HEADER_SKIP) {             // a longer header from a newer version: skip the rest
            size_t t = len < skipLeft ? len : skipLeft;
            d += t; len -= t; skipLeft -= t;
            if (!skipLeft) { int e = nextSection(); if (e) return e; }
            continue;
        }
        if (sec == S_DATA) {                    // array contents: copied straight into the array, no buffer
            FPB_ArrayRef& a = arrays[dataArr];
            size_t bytes = (size_t)a.len * 4;
            size_t t = bytes - dataOff;
            if (t > len) t = len;
            memcpy((uint8_t*)a.base + dataOff, d, t);
            crc = crc_update(crc, d, t);
            d += t; len -= t; dataOff += t; dataLeft -= t;
            if (dataOff == bytes) { dataArr++; dataOff = 0; nextDataArray(); }
            if (!dataLeft) { int e = nextSection(); if (e) return e; }
            continue;
        }
        // a record: collect bytes in buf until it has `need` of them, then handle it
        size_t t = need - got;
        if (t > len) t = len;
        memcpy(buf + got, d, t);
        if (sec != S_HEADER) crc = crc_update(crc, d, t);
        got += t; d += t; len -= t;
        if (got == need) {
            int e = (sec == S_HEADER) ? onHeader() : onRecord();
            if (e) return e;
        }
    }
    return FPB_OK;
}

FPB_Program* FPB_Loader::finish() {
    if (sec == S_ERROR) return nullptr;
    if (sec != S_DONE) { fail(FPB_E_INCOMPLETE); return nullptr; }
    FPB_Program* p = prog;
    prog = nullptr;
    sec = S_ERROR;
    err = FPB_OK;     // a later feed() returns E_STATE
    return p;
}

// The 40-byte header: reads the sizes (little-endian), checks that they make sense and that this firmware
// has the ops the code was compiled for (opCount), then allocates the fast block.
int FPB_Loader::onHeader() {
    const uint8_t* b = buf;
    if (b[0] != 'F' || b[1] != 'P' || b[2] != 'B' || b[3] != 0) return fail(FPB_E_MAGIC);
    hdr.version    = b[4];
    hdr.flags      = b[5];
    hdr.headerSize = rd16(b + 6);
    hdr.opCount    = rd16(b + 8);
    hdr.nIn        = b[10];
    hdr.nOut       = b[11];
    hdr.fSlots     = rd16(b + 12);
    hdr.iSlots     = rd16(b + 14);
    hdr.nArr       = b[16];
    hdr.nUsedOps   = b[17];
    hdr.nFConst    = rd16(b + 18);
    hdr.nIConst    = rd16(b + 20);
    hdr.nParam     = b[22];
    hdr.nBlkInstr  = rd16(b + 24);
    hdr.nSmpInstr  = rd16(b + 26);
    hdr.codeBytes  = rd32(b + 28);
    hdr.dataBytes  = rd32(b + 32);
    hdr.crc        = rd32(b + 36);

    if (hdr.version != FPB_VERSION) return fail(FPB_E_VERSION);
    if (hdr.headerSize < FPB_HEADER_SIZE) return fail(FPB_E_HEADER);
    if ((uint32_t)hdr.nIn + hdr.nOut > hdr.fSlots) return fail(FPB_E_HEADER);
    if (((hdr.flags & 1) != 0) != (hdr.dataBytes != 0)) return fail(FPB_E_HEADER);
    if (hdr.opCount > opCount) return fail(FPB_E_OPCOUNT);
    uint32_t nInstr = (uint32_t)hdr.nBlkInstr + hdr.nSmpInstr;
    if (hdr.codeBytes < 2 * nInstr || ((hdr.codeBytes - 2 * nInstr) & 1)) return fail(FPB_E_CODE_SIZE);

    int e = allocFast();
    if (e) return e;

    if (hdr.headerSize > FPB_HEADER_SIZE) {
        sec = S_HEADER_SKIP;
        skipLeft = hdr.headerSize - FPB_HEADER_SIZE;
        return FPB_OK;
    }
    return nextSection();
}

// Allocates the fast block: [steps][array refs][f slots][i slots][param slots][array tiers], each part
// starting on an 8-byte boundary. Everything is known from the header, so it is one allocation of the
// exact size:
//   an instruction in the container is 2 bytes (op, operand count) + 2 bytes per operand, so
//   operands = (codeBytes - 2 * instructions) / 2;
//   a step is one function pointer + one pointer per operand, plus one fpb_end step for blk and one for smp.
int FPB_Loader::allocFast() {
    uint32_t nInstr = (uint32_t)hdr.nBlkInstr + hdr.nSmpInstr;
    uint32_t nOperands = (hdr.codeBytes - 2 * nInstr) / 2;
    size_t stepBytes = (size_t)(nInstr + 2) * sizeof(FPB_StepFn) + (size_t)nOperands * sizeof(void*);
    size_t oSteps = 0;
    size_t oArr   = align8(oSteps + stepBytes);
    size_t oF     = align8(oArr + (size_t)hdr.nArr * sizeof(FPB_ArrayRef));
    size_t oI     = align8(oF + (size_t)hdr.fSlots * 4);
    size_t oP     = align8(oI + (size_t)hdr.iSlots * 4);
    size_t oT     = align8(oP + (size_t)hdr.nParam * 2);
    size_t total  = align8(oT + hdr.nArr);

    prog = new FPB_Program();
    if (!prog) return fail(FPB_E_NOMEM);
    prog->alloc = alloc;
    uint8_t* m = (uint8_t*)alloc.alloc(total, FPB_TIER_FAST, alloc.user);
    if (!m) return fail(FPB_E_NOMEM);
    memset(m, 0, total);
    prog->block[0] = m;
    prog->blockTier[0] = FPB_TIER_FAST;
    prog->memSize[FPB_TIER_FAST] += total;
    prog->nIn = hdr.nIn;
    prog->nOut = hdr.nOut;
    prog->nParam = hdr.nParam;
    prog->f = (float*)(m + oF);
    prog->i = (int32_t*)(m + oI);
    prog->paramSlot = (uint16_t*)(m + oP);
    stepCursor = m + oSteps;
    stepEnd = m + oSteps + stepBytes;
    arrays = (FPB_ArrayRef*)(m + oArr);
    arrTier = m + oT;
    return FPB_OK;
}

// After the last array record: one zeroed block per memory tier, holding all the arrays of that tier one
// after the other, and each ArrayRef gets its base address. Called once even when there are no arrays.
int FPB_Loader::allocArrays() {
    if (dataExpected != hdr.dataBytes) return fail(FPB_E_DATA_SIZE);
    uint64_t sum[4] = { 0, 0, 0, 0 };
    for (uint16_t k = 0; k < hdr.nArr; k++) sum[arrTier[k] & 3] += (uint64_t)arrays[k].len * 4;
    for (uint8_t t = 0; t < 4; t++) {
        if (!sum[t]) continue;
        if (sum[t] > (uint64_t)SIZE_MAX / 2) return fail(FPB_E_NOMEM);
        uint8_t* m = (uint8_t*)alloc.alloc((size_t)sum[t], t, alloc.user);
        if (!m) return fail(FPB_E_NOMEM);
        memset(m, 0, (size_t)sum[t]);
        prog->block[1 + t] = m;
        prog->blockTier[1 + t] = t;
        prog->memSize[t] += (size_t)sum[t];
        for (uint16_t k = 0; k < hdr.nArr; k++)
            if ((arrTier[k] & 3) == t) { arrays[k].base = m; m += (size_t)arrays[k].len * 4; }
    }
    return FPB_OK;
}

static uint8_t recordSize(uint8_t sec) {
    switch (sec) {
        case FPB_Loader::S_USEDOPS: return 4;
        case FPB_Loader::S_ARRAYS:  return 8;
        case FPB_Loader::S_FCONST:
        case FPB_Loader::S_ICONST:
        case FPB_Loader::S_PARAMS:  return 6;
        case FPB_Loader::S_CODE:    return 2;
    }
    return 1;
}

// Moves to the next section of the container (and on past empty ones), setting how many records it has
// (recCount) and the size of one record (need). Some steps happen on the way: the arrays are allocated
// after the arrays section, the code starts (beginCode), and the CRC is checked at the very end.
int FPB_Loader::nextSection() {
    for (;;) {
        switch (sec) {
            case S_HEADER:
            case S_HEADER_SKIP: sec = S_USEDOPS; recCount = hdr.nUsedOps; break;
            case S_USEDOPS:     sec = S_ARRAYS;  recCount = hdr.nArr; break;
            case S_ARRAYS: {
                int e = allocArrays();
                if (e) return e;
                sec = S_FCONST; recCount = hdr.nFConst; break;
            }
            case S_FCONST:      sec = S_ICONST;  recCount = hdr.nIConst; break;
            case S_ICONST:      sec = S_PARAMS;  recCount = hdr.nParam; break;
            case S_PARAMS:
                sec = S_CODE;
                beginCode();
                recCount = (uint32_t)hdr.nBlkInstr + hdr.nSmpInstr;
                if (!recCount && codeLeft) { recIndex = 0; return fail(FPB_E_CODE_SIZE); }
                break;
            case S_CODE:
                sec = S_DATA;
                dataLeft = hdr.dataBytes;
                recCount = dataLeft ? 1 : 0;
                dataArr = 0; dataOff = 0;
                nextDataArray();
                break;
            case S_DATA:
                sec = S_DONE;
                recIndex = 0;
                if (crc != hdr.crc) return fail(FPB_E_CRC);
                return FPB_OK;
            default:
                return fail(FPB_E_STATE);
        }
        recIndex = 0;
        if (recCount) { need = recordSize(sec); got = 0; return FPB_OK; }
    }
}

void FPB_Loader::nextDataArray() {
    while (dataArr < hdr.nArr && !(arrTier[dataArr] & 0x80)) dataArr++;
}

// The code section starts: the steps are written from the start of the fast block (stepCursor), the blk
// section first. A section without instructions is just its fpb_end step.
void FPB_Loader::beginCode() {
    codeLeft = hdr.codeBytes;
    instrLeftBlk = hdr.nBlkInstr;
    instrLeftSmp = hdr.nSmpInstr;
    codeHdrDone = false;
    inSmp = false;
    prog->blk = (const FPB_Step*)stepCursor;
    if (!instrLeftBlk) { emitEnd(); inSmp = true; prog->smp = (const FPB_Step*)stepCursor; }
    if (!instrLeftBlk && !instrLeftSmp) emitEnd();
}

// Writes the fpb_end step that ends a section (a function pointer only, no operands).
void FPB_Loader::emitEnd() {
    FPB_StepFn fn = fpb_end;
    memcpy(stepCursor, &fn, sizeof(fn));
    stepCursor += sizeof(fn);
}

// One complete record of the current section is in buf: check it and put it where it belongs.
int FPB_Loader::onRecord() {
    const uint8_t* b = buf;
    switch (sec) {
        case S_USEDOPS: {
            // op index, operand count, fingerprint (name + signature): must match this firmware's op table,
            // so a container made for another table (a reordered or changed op) is refused, never misread
            uint8_t op = b[0], arity = b[1];
            uint16_t fp = rd16(b + 2);
            if (op >= hdr.opCount) return fail(FPB_E_OP_INDEX);
            const FPB_OpDef& def = ops[op];
            if (def.flags & FPB_RESERVED) return fail(FPB_E_OP_RESERVED);
            if (def.flags & FPB_REMOVED) return fail(FPB_E_OP_REMOVED);
            if (arity > FPB_MAX_ARITY || arity != fpb_sig_arity(def.sig)) return fail(FPB_E_OP_ARITY);
            if (fp != fpb_fingerprint(def.name, def.sig)) return fail(FPB_E_OP_FP);
            usedMask[op >> 5] |= 1u << (op & 31);
            usedArity[op] = arity;
            break;
        }
        case S_ARRAYS: {
            uint8_t tier = b[0], type = b[1], init = b[2];
            uint32_t len = rd32(b + 4);
            if (tier > 3 || type > 1 || init > 1 || b[3] != 0) return fail(FPB_E_ARRAY);
            if (len == 0 || len > (1u << 26)) return fail(FPB_E_ARRAY);
            FPB_ArrayRef& a = arrays[recIndex];
            a.base = nullptr;
            a.len = len;
            a.mask = ((len & (len - 1)) == 0) ? len - 1 : 0;
            arrTier[recIndex] = (uint8_t)(tier | (type << 6) | (init << 7));
            if (init) dataExpected += len * 4;      // len <= 2^26, at most 255 arrays: may wrap, checked below
            if (init && dataExpected < len * 4) return fail(FPB_E_DATA_SIZE);
            break;
        }
        case S_FCONST: {
            uint16_t slot = rd16(b);
            if (slot >= hdr.fSlots || slot < hdr.nIn) return fail(FPB_E_SLOT);
            prog->f[slot] = rdf32(b + 2);
            break;
        }
        case S_ICONST: {
            uint16_t slot = rd16(b);
            if (slot >= hdr.iSlots) return fail(FPB_E_SLOT);
            prog->i[slot] = (int32_t)rd32(b + 2);
            break;
        }
        case S_PARAMS: {
            uint16_t slot = rd16(b);
            if (slot >= hdr.fSlots || slot < (uint32_t)hdr.nIn + hdr.nOut) return fail(FPB_E_SLOT);
            prog->f[slot] = rdf32(b + 2);
            prog->paramSlot[recIndex] = slot;
            break;
        }
        case S_CODE: {
            int e = onCode();
            if (e) return e;
            if (!codeHdrDone) return FPB_OK;     // this was only the done part of an instruction; go on
            codeHdrDone = false;
            break;
        }
        default:
            return fail(FPB_E_STATE);
    }
    recIndex++;
    got = 0;
    if (recIndex == recCount) return nextSection();
    need = recordSize(sec);
    return FPB_OK;
}

// One instruction of the code section -> one step.
// An instruction is read in two parts: first its 2-byte head (op, operand count), then, now that the
// size is known, its operands (2 bytes each). Returns with codeHdrDone = false and need raised when the
// operands are still to come, or with codeHdrDone = true when the whole instruction has become a step.
//
// The step: the op's function pointer from the op table, then each operand turned from a slot number into
// a pointer, following the op's signature ("f=fff": the first operand is a written float slot, the other
// three read float slots). So "madd 17 11 5 16" becomes [fpb_madd, &f[17], &f[11], &f[5], &f[16]].
int FPB_Loader::onCode() {
    if (need == 2) {
        // instruction head: op, n
        curOp = buf[0];
        curN = buf[1];
        if (!(usedMask[curOp >> 5] & (1u << (curOp & 31)))) return fail(FPB_E_INSTR_OP);
        if (curN != usedArity[curOp]) return fail(FPB_E_INSTR_ARITY);
        if (codeLeft < 2u + 2u * curN) return fail(FPB_E_CODE_SIZE);
        if (curN) { need = (uint8_t)(2 + 2 * curN); codeHdrDone = false; return FPB_OK; }
    }
    // whole instruction is in buf
    size_t stepSize = sizeof(FPB_StepFn) + (size_t)curN * sizeof(void*);
    if (stepCursor + stepSize > stepEnd) return fail(FPB_E_CODE_SIZE);
    const FPB_OpDef& def = ops[curOp];
    void* ptrs[FPB_MAX_ARITY];
    bool written = true;
    uint8_t k = 0;
    for (const char* c = def.sig; *c; c++) {
        if (*c == '=') { written = false; continue; }
        uint16_t v = rd16(buf + 2 + 2 * k);
        switch (*c) {
            case 'f':
                if (v >= hdr.fSlots) return fail(FPB_E_OPERAND);
                if (written && v < hdr.nIn) return fail(FPB_E_WRITE_INPUT);
                ptrs[k] = &prog->f[v];
                break;
            case 'i':
                if (v >= hdr.iSlots) return fail(FPB_E_OPERAND);
                ptrs[k] = &prog->i[v];
                break;
            case 'a':
                if (v >= hdr.nArr) return fail(FPB_E_OPERAND);
                ptrs[k] = &arrays[v];
                break;
            case 'c':
                ptrs[k] = (void*)(uintptr_t)v;
                break;
            default:
                return fail(FPB_E_OP_ARITY);
        }
        k++;
    }
    // write the step and move on to where the next one goes (that is where NEXT(curN) in the op will point)
    FPB_StepFn fn = def.fn;
    memcpy(stepCursor, &fn, sizeof(fn));
    memcpy(stepCursor + sizeof(fn), ptrs, (size_t)curN * sizeof(void*));
    stepCursor += stepSize;
    codeLeft -= 2u + 2u * curN;

    // the end of blk: its fpb_end step, and smp starts right after it; the end of smp: its fpb_end step
    if (!inSmp) {
        if (--instrLeftBlk == 0) {
            emitEnd();
            inSmp = true;
            prog->smp = (const FPB_Step*)stepCursor;
            if (!instrLeftSmp) emitEnd();
        }
    } else {
        if (--instrLeftSmp == 0) emitEnd();
    }
    if (!instrLeftBlk && !instrLeftSmp && codeLeft) return fail(FPB_E_CODE_SIZE);
    codeHdrDone = true;
    return FPB_OK;
}
