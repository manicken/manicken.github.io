// FPB_Faust: runs two Faust patches compiled to FPB, loaded at runtime from flash.
//
//   sawtooth -> lp (fi.resonlp) -> echo (feedback delay) -> headphones (SGTL5000)
//
// The patches were compiled with:
//   faust -lang interp lp.dsp -o lp.fbc
//   node fpb/tools/fpbc.js lp.fbc --header lp_fpb.h
// (the same for echo). The echo needs 512 KB for its delay line: PSRAM on a Teensy 4.1.
// Without PSRAM the echo load fails with E_NOMEM and the echo object stays silent; set
// USE_ECHO to 0 to hear only the filter.
//
// Serial commands (115200):
//   c <hz>      lowpass cutoff         q <q>       lowpass resonance
//   d <ms>      echo delay             f <0..0.95> echo feedback
//   w <hz>      sawtooth frequency     ?           status
#include <Audio.h>
#include <AudioEffectFPB.h>
#include "lp_fpb.h"
#include "echo_fpb.h"

#define USE_ECHO 1

extern "C" uint8_t external_psram_size;     // set by the Teensy 4.1 startup code (MB)

AudioSynthWaveform     saw;
AudioEffectFPB         lp;
AudioEffectFPB         echo;
AudioOutputI2S         out;
AudioControlSGTL5000   sgtl;

AudioConnection c1(saw, 0, lp, 0);
#if USE_ECHO
AudioConnection c2(lp, 0, echo, 0);
AudioConnection c3(echo, 0, out, 0);
AudioConnection c4(echo, 0, out, 1);
#else
AudioConnection c3(lp, 0, out, 0);
AudioConnection c4(lp, 0, out, 1);
#endif

static void report(const char* name, AudioEffectFPB& fx, int err) {
    if (err == FPB_OK)
        Serial.printf("%s: loaded, %u params, memory fast %u dma %u ext %u any %u\n", name, fx.numParams(),
                      (unsigned)fx.memoryUsed(0), (unsigned)fx.memoryUsed(1), (unsigned)fx.memoryUsed(2), (unsigned)fx.memoryUsed(3));
    else
        Serial.printf("%s: load failed: %s (section %u, record %u)\n", name, fpb_error_name(err),
                      fx.lastErrorSection(), (unsigned)fx.lastErrorIndex());
}

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 3000) {}
    AudioMemory(24);
    sgtl.enable();
    sgtl.volume(0.4);
    saw.begin(0.3, 110, WAVEFORM_SAWTOOTH);

    Serial.printf("FPB op table: %u entries, PSRAM %u MB\n", FPB_OP_COUNT, external_psram_size);
    report("lp", lp, lp.load(lp_fpb, sizeof(lp_fpb)));
#if USE_ECHO
    report("echo", echo, echo.load(echo_fpb, sizeof(echo_fpb)));
#endif
}

static char line[48];
static uint8_t len = 0;

void loop() {
    while (Serial.available()) {
        char ch = Serial.read();
        if (ch != '\n' && ch != '\r') { if (len < sizeof(line) - 1) line[len++] = ch; continue; }
        line[len] = 0;
        if (!len) continue;
        len = 0;
        float v = atof(line + 1);
        switch (line[0]) {
            case 'c': lp.setParam(LP_FPB_CUTOFF, v); break;
            case 'q': lp.setParam(LP_FPB_Q, v); break;
            case 'd': echo.setParam(ECHO_FPB_DELAY, v); break;
            case 'f': echo.setParam(ECHO_FPB_FEEDBACK, v); break;
            case 'w': saw.frequency(v); break;
        }
        Serial.printf("cutoff %.1f  q %.3f  delay %.1f  feedback %.2f  cpu %.2f%% (max %.2f%%)  mem %u\n",
                      lp.getParam(LP_FPB_CUTOFF), lp.getParam(LP_FPB_Q), echo.getParam(ECHO_FPB_DELAY),
                      echo.getParam(ECHO_FPB_FEEDBACK), AudioProcessorUsage(), AudioProcessorUsageMax(), AudioMemoryUsageMax());
    }
}
