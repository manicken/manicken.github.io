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
    AudioInterrupts();
    delete old;
}

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

void AudioEffectFPB::update(void) {
    FPB_Program* p = program;
    if (!p) {
        for (int c = 0; c < FPB_MAX_INPUTS; c++) {
            audio_block_t* b = receiveReadOnly(c);
            if (b) release(b);
        }
        return;
    }
    const int nIn = p->numInputs(), nOut = p->numOutputs();

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

    p->process(in, out, AUDIO_BLOCK_SAMPLES);

    for (int c = 0; c < nOut; c++) {
        audio_block_t* b = allocate();
        if (!b) continue;
        for (int k = 0; k < AUDIO_BLOCK_SAMPLES; k++) {
            float v = outBuf[c][k] * 32767.0f;
            b->data[k] = (int16_t)(v > 32767.0f ? 32767 : v < -32768.0f ? -32768 : (int)v);
        }
        transmit(b, c);
        release(b);
    }
}
