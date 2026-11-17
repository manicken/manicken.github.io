#include "AudioEffectFPB.h"

AudioEffectFPB::~AudioEffectFPB() {
    clear();
}

int AudioEffectFPB::load(const uint8_t* data, size_t len) {
    begin();
    int e = feed(data, len);
    if (e) return e;
    return end();
}

void AudioEffectFPB::begin() {
    loader.begin();
}

int AudioEffectFPB::feed(const uint8_t* data, size_t len) {
    return loader.feed(data, len);
}

int AudioEffectFPB::end() {
    FPB_Program* p = loader.finish();
    if (!p) return loader.error();
    if (p->numInputs() > FPB_MAX_INPUTS || p->numOutputs() > FPB_MAX_OUTPUTS) {
        delete p;
        return FPB_E_HEADER;
    }
    swapIn(p);
    return FPB_OK;
}

void AudioEffectFPB::clear() {
    swapIn(nullptr);
}

// the audio interrupt only reads `program`; swap it with the interrupts off and free the old one here
void AudioEffectFPB::swapIn(FPB_Program* p) {
    AudioNoInterrupts();
    FPB_Program* old = program;
    program = p;
    overloaded = false;          // a new patch gets a new chance
    overCount = 0;
    cyclesLast = cyclesMax = 0;
    AudioInterrupts();
    delete old;
}

float AudioEffectFPB::cyclesToPercent(uint32_t c) const {
    // one block lasts AUDIO_BLOCK_SAMPLES / AUDIO_SAMPLE_RATE_EXACT seconds = that many CPU cycles * F_CPU_ACTUAL
    const float blockCycles = (float)F_CPU_ACTUAL * (float)AUDIO_BLOCK_SAMPLES / AUDIO_SAMPLE_RATE_EXACT;
    return 100.0f * (float)c / blockCycles;
}

float AudioEffectFPB::cpuUsage() const    { return cyclesToPercent(cyclesLast); }
float AudioEffectFPB::cpuUsageMax() const { return cyclesToPercent(cyclesMax); }

bool AudioEffectFPB::setParam(uint16_t index, float value) {
    FPB_Program* p = program;
    return p ? p->setParam(index, value) : false;
}

float AudioEffectFPB::getParam(uint16_t index) const {
    FPB_Program* p = program;
    return p ? p->getParam(index) : 0.0f;
}

uint16_t AudioEffectFPB::numParams() const {
    FPB_Program* p = program;
    return p ? p->numParams() : 0;
}

size_t AudioEffectFPB::memoryUsed(uint8_t tier) const {
    FPB_Program* p = program;
    return p ? p->memoryUsed(tier) : 0;
}

// Called by the audio library's interrupt for every block (128 samples, about every 2.9 ms):
//   1. the input blocks (int16) become floats in -1 .. 1 (inBuf), a missing input block is silence
//   2. the patch runs on them (FPB_Program::process), and the time it takes is measured (the CPU guard)
//   3. the outputs (floats) become int16 blocks again, clipped to the int16 range, and are transmitted
// Without a patch, or when the CPU guard stopped it, the inputs are only released and nothing is sent
// (the objects after it get silence).
void AudioEffectFPB::update(void) {
    FPB_Program* p = program;          // read once: swapIn() may replace it between two blocks
    if (!p || overloaded) {
        for (int c = 0; c < FPB_MAX_INPUTS; c++) {
            audio_block_t* b = receiveReadOnly(c);
            if (b) release(b);
        }
        return;
    }
    const int nIn = p->numInputs(), nOut = p->numOutputs();

    // 1. inputs: every connected input is received (and released), only the patch's own are converted
    const float* in[FPB_MAX_INPUTS];
    float* out[FPB_MAX_OUTPUTS];
    for (int c = 0; c < FPB_MAX_INPUTS; c++) {
        audio_block_t* b = receiveReadOnly(c);
        if (c < nIn) {
            if (b) for (int k = 0; k < AUDIO_BLOCK_SAMPLES; k++) inBuf[c][k] = b->data[k] * (1.0f / 32768.0f);
            else   memset(inBuf[c], 0, sizeof(inBuf[c]));
            in[c] = inBuf[c];
        }
        if (b) release(b);
    }
    for (int c = 0; c < nOut; c++) out[c] = outBuf[c];

    // 2. run the patch, timed with the CPU cycle counter. A patch over the limit (percent of one block)
    //    for FPB_OVERLOAD_BLOCKS blocks in a row is stopped, so it can't starve loop() (USB, OSC)
    const uint32_t t0 = ARM_DWT_CYCCNT;
    p->process(in, out, AUDIO_BLOCK_SAMPLES);
    const uint32_t cycles = ARM_DWT_CYCCNT - t0;
    cyclesLast = cycles;
    if (cycles > cyclesMax) cyclesMax = cycles;
    if (cpuLimitPercent > 0.0f && cyclesToPercent(cycles) > cpuLimitPercent) {
        if (++overCount >= FPB_OVERLOAD_BLOCKS) overloaded = true;   // stopped from the next block on
    } else overCount = 0;

    // 3. outputs: float -> int16 (scaled by 32767, clipped), one new block per output
    for (int c = 0; c < nOut; c++) {
        audio_block_t* b = allocate();
        if (!b) continue;                // out of audio memory: this output is silent this block
        for (int k = 0; k < AUDIO_BLOCK_SAMPLES; k++) {
            float v = outBuf[c][k] * 32767.0f;
            b->data[k] = (int16_t)(v > 32767.0f ? 32767 : v < -32768.0f ? -32768 : (int)v);
        }
        transmit(b, c);
        release(b);
    }
}
