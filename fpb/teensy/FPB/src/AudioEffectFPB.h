// AudioEffectFPB: a Teensy Audio object that runs an FPB patch loaded at runtime.
#pragma once
#include <Arduino.h>
#include <Audio.h>          // AudioStream, AudioNoInterrupts()
#include "FPB.h"

#ifndef FPB_MAX_INPUTS
#define FPB_MAX_INPUTS  4
#endif
#ifndef FPB_MAX_OUTPUTS
#define FPB_MAX_OUTPUTS 4
#endif

class AudioEffectFPB : public AudioStream {
public:
    AudioEffectFPB() : AudioStream(FPB_MAX_INPUTS, inputQueueArray) {}
    ~AudioEffectFPB();

    // Load a whole container (from flash, RAM or a file read into RAM).
    // On success the new patch replaces the old one at the next block. Returns FPB_OK or an FPB_Error.
    int load(const uint8_t* data, size_t len);

    // Streaming load (serial, network, file in pieces). end() swaps the patch in when it is valid.
    void begin();
    int  feed(const uint8_t* data, size_t len);
    int  end();

    // remove the patch (output silence)
    void clear();

    bool  setParam(uint16_t index, float value);
    float getParam(uint16_t index) const;
    uint16_t numParams() const;
    bool  isLoaded() const { return program != nullptr; }

    // last load error, and where it was found (section and record index, see FPB_Loader)
    int      lastError() const { return loader.error(); }
    uint8_t  lastErrorSection() const { return loader.errorSection(); }
    uint32_t lastErrorIndex() const { return loader.errorIndex(); }
    size_t   memoryUsed(uint8_t tier) const;

    virtual void update(void);

private:
    void swapIn(FPB_Program* p);

    audio_block_t* inputQueueArray[FPB_MAX_INPUTS];
    FPB_Program* volatile program = nullptr;
    FPB_Loader loader;
    float inBuf[FPB_MAX_INPUTS][AUDIO_BLOCK_SAMPLES];
    float outBuf[FPB_MAX_OUTPUTS][AUDIO_BLOCK_SAMPLES];
};
