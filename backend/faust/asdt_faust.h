// asdt_faust.h: what the Faust objects exported by ASDT++ need. ASDT++ copies it into src/asdt/faust/ with every
// export that has a Faust object (it is replaced on every export, like everything in src/asdt/).
//
// The C++ that Faust generates (faust -lang cpp) only needs three small base classes, Meta, UI and a DSP base class,
// and they are written here for ASDT++ (MIT license, see LICENSE of ASDT++). None of Faust's own architecture files
// are used. The generated DSP code itself is the user's (made from their .dsp file).
//
// For each Faust patch ASDT++ writes Faust_<name>.h / .cpp: an AudioStream object that runs the Faust code on the
// audio blocks, with a setter per Faust parameter (see backend/faust-native.js).
#pragma once
#include <Arduino.h>
#include <AudioStream.h>
#include <stdint.h>
#include <stdlib.h>
#include <new>

#ifndef FAUSTFLOAT
#define FAUSTFLOAT float
#endif

/** Faust calls declare() for the metadata of the patch (name, author, library versions); not used here */
struct Meta {
    virtual ~Meta() {}
    virtual void declare(const char* key, const char* value) = 0;
};

struct Soundfile;

/** Faust calls these from buildUserInterface(); not used here: the setters write the parameters directly */
struct UI {
    virtual ~UI() {}
    virtual void openTabBox(const char* label) {}
    virtual void openHorizontalBox(const char* label) {}
    virtual void openVerticalBox(const char* label) {}
    virtual void closeBox() {}
    virtual void addButton(const char* label, FAUSTFLOAT* zone) {}
    virtual void addCheckButton(const char* label, FAUSTFLOAT* zone) {}
    virtual void addVerticalSlider(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init, FAUSTFLOAT min, FAUSTFLOAT max, FAUSTFLOAT step) {}
    virtual void addHorizontalSlider(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init, FAUSTFLOAT min, FAUSTFLOAT max, FAUSTFLOAT step) {}
    virtual void addNumEntry(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT init, FAUSTFLOAT min, FAUSTFLOAT max, FAUSTFLOAT step) {}
    virtual void addHorizontalBargraph(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT min, FAUSTFLOAT max) {}
    virtual void addVerticalBargraph(const char* label, FAUSTFLOAT* zone, FAUSTFLOAT min, FAUSTFLOAT max) {}
    virtual void addSoundfile(const char* label, const char* filename, Soundfile** sf_zone) {}
    virtual void declare(FAUSTFLOAT* zone, const char* key, const char* val) {}
};

/** the base class of every generated DSP class (faust -scn FaustDsp) */
class FaustDsp {
public:
    virtual ~FaustDsp() {}
};

// Faust's big tables (os.osc has a sine table of 65536 floats = 256 KB) are static arrays. On a Teensy 4 a static
// array is in RAM1 (DTCM, fastest), which also holds the code's data and the stack (512 KB in all), so a table
// bigger than 16 KB is put in RAM2 (DMAMEM, the other 512 KB) instead. The tables are filled by classInit(), so it
// doesn't matter that DMAMEM isn't zeroed at startup.
#if defined(__IMXRT1062__)
#define ASDT_FAUST_BIG_TABLE DMAMEM
#else
#define ASDT_FAUST_BIG_TABLE
#endif

/**
 * Memory for a DSP object (all its delay lines and state are inside the object, so it can be big).
 * Teensy 4: RAM2 first (the malloc heap is in RAM2), PSRAM only when it doesn't fit: PSRAM is external, a read at a
 * new place costs a cache miss of a hundred cycles or more, so delay lines are much slower there.
 * extmem_malloc() uses PSRAM on a Teensy 4.1 that has it, and falls back to malloc() without it.
 * @returns nullptr when there is no memory for it anywhere
 */
static inline void* asdtFaustAlloc(size_t bytes) {
    void* p = malloc(bytes);
#if defined(__IMXRT1062__)
    if (p == nullptr) p = extmem_malloc(bytes);
#endif
    return p;
}

/** frees what asdtFaustAlloc gave (extmem_free looks at the address: PSRAM, else free()) */
static inline void asdtFaustFree(void* p) {
#if defined(__IMXRT1062__)
    extmem_free(p);
#else
    free(p);
#endif
}

/** int16 sample -> float -1 .. 1 */
static inline float asdtFaustFromInt16(int16_t s) { return s * (1.0f / 32768.0f); }

/** float -> int16 sample, clipped: a Faust output above 1.0 is clipped (instead of wrapping around to negative) */
static inline int16_t asdtFaustToInt16(float v) {
    v *= 32768.0f;
    if (v > 32767.0f) return 32767;
    if (!(v >= -32768.0f)) return (v != v) ? 0 : -32768;   // (v != v): NaN, i.e. a Faust division by zero
    return (int16_t)v;
}
