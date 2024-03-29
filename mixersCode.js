Mixers = (function () {
    var copyrightNote = "/* This is a modified variant of the mixer code\n * to make it possible to autogenerate mixers with any size\n * by using the Design Tool++ by Manicksan (Jannik Svensson)\n * \n * Original copyright note:\n * Audio Library for Teensy 3.X\n * Copyright (c) 2014, Paul Stoffregen, paul@pjrc.com\n *\n * Development of this audio library was funded by PJRC.COM, LLC by sales of\n * Teensy and Audio Adaptor boards.  Please support PJRC's efforts to develop\n * open source software by purchasing Teensy or other PJRC products.\n *\n * Permission is hereby granted, free of charge, to any person obtaining a copy\n * of this software and associated documentation files (the \"Software\"), to deal\n * in the Software without restriction, including without limitation the rights\n * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n * copies of the Software, and to permit persons to whom the Software is\n * furnished to do so, subject to the following conditions:\n *\n * The above copyright notice, development funding notice, and this permission\n * notice shall be included in all copies or substantial portions of the Software.\n *\n * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n * THE SOFTWARE.\n */\n\n";
    var mixers_cpp_base = "#include <Arduino.h>\n#include \"mixers.h\"\n#include \"utility/dspinst.h\"\n\n#if defined(__ARM_ARCH_7EM__)\n#define MULTI_UNITYGAIN 65536\n\nstatic void applyGain(int16_t *data, int32_t mult)\n{\n\tuint32_t *p = (uint32_t *)data;\n\tconst uint32_t *end = (uint32_t *)(data + AUDIO_BLOCK_SAMPLES);\n\n\tdo {\n\t\tuint32_t tmp32 = *p; // read 2 samples from *data\n\t\tint32_t val1 = signed_multiply_32x16b(mult, tmp32);\n\t\tint32_t val2 = signed_multiply_32x16t(mult, tmp32);\n\t\tval1 = signed_saturate_rshift(val1, 16, 0);\n\t\tval2 = signed_saturate_rshift(val2, 16, 0);\n\t\t*p++ = pack_16b_16b(val2, val1);\n\t} while (p < end);\n}\n\nstatic void applyGainThenAdd(int16_t *data, const int16_t *in, int32_t mult)\n{\n\tuint32_t *dst = (uint32_t *)data;\n\tconst uint32_t *src = (uint32_t *)in;\n\tconst uint32_t *end = (uint32_t *)(data + AUDIO_BLOCK_SAMPLES);\n\n\tif (mult == MULTI_UNITYGAIN) {\n\t\tdo {\n\t\t\tuint32_t tmp32 = *dst;\n\t\t\t*dst++ = signed_add_16_and_16(tmp32, *src++);\n\t\t\ttmp32 = *dst;\n\t\t\t*dst++ = signed_add_16_and_16(tmp32, *src++);\n\t\t} while (dst < end);\n\t} else {\n\t\tdo {\n\t\t\tuint32_t tmp32 = *src++; // read 2 samples from *data\n\t\t\tint32_t val1 = signed_multiply_32x16b(mult, tmp32);\n\t\t\tint32_t val2 = signed_multiply_32x16t(mult, tmp32);\n\t\t\tval1 = signed_saturate_rshift(val1, 16, 0);\n\t\t\tval2 = signed_saturate_rshift(val2, 16, 0);\n\t\t\ttmp32 = pack_16b_16b(val2, val1);\n\t\t\tuint32_t tmp32b = *dst;\n\t\t\t*dst++ = signed_add_16_and_16(tmp32, tmp32b);\n\t\t} while (dst < end);\n\t}\n}\n\n#elif defined(KINETISL)\n#define MULTI_UNITYGAIN 256\n\nstatic void applyGain(int16_t *data, int32_t mult)\n{\n\tconst int16_t *end = data + AUDIO_BLOCK_SAMPLES;\n\n\tdo {\n\t\tint32_t val = *data * mult;\n\t\t*data++ = signed_saturate_rshift(val, 16, 0);\n\t} while (data < end);\n}\n\nstatic void applyGainThenAdd(int16_t *dst, const int16_t *src, int32_t mult)\n{\n\tconst int16_t *end = dst + AUDIO_BLOCK_SAMPLES;\n\n\tif (mult == MULTI_UNITYGAIN) {\n\t\tdo {\n\t\t\tint32_t val = *dst + *src++;\n\t\t\t*dst++ = signed_saturate_rshift(val, 16, 0);\n\t\t} while (dst < end);\n\t} else {\n\t\tdo {\n\t\t\tint32_t val = *dst + ((*src++ * mult) >> 8); // overflow possible??\n\t\t\t*dst++ = signed_saturate_rshift(val, 16, 0);\n\t\t} while (dst < end);\n\t}\n}\n\n#endif\n\n<templatecode>";
    var mixers_cpp_template = "void AudioMixerNNN::update(void)\n{\n\taudio_block_t *in, *out=NULL;\n\tunsigned int channel;\n\n\tfor (channel=0; channel < NNN; channel++) {\n\t\tif (!out) {\n\t\t\tout = receiveWritable(channel);\n\t\t\tif (out) {\n\t\t\t\tint32_t mult = multiplier[channel];\n\t\t\t\tif (mult != MULTI_UNITYGAIN) applyGain(out->data, mult);\n\t\t\t}\n\t\t} else {\n\t\t\tin = receiveReadOnly(channel);\n\t\t\tif (in) {\n\t\t\t\tapplyGainThenAdd(out->data, in->data, multiplier[channel]);\n\t\t\t\trelease(in);\n\t\t\t}\n\t\t}\n\t}\n\tif (out) {\n\t\ttransmit(out);\n\t\trelease(out);\n\t}\n}";
    var mixers_h_base = "#ifndef mixers_h_\n#define mixers_h_\n\n#include \"Arduino.h\"\n#include \"AudioStream.h\"\n\n#if defined(__ARM_ARCH_7EM__)\n#define MIXERS_MAX_MULT_I 65536\n#define MIXERS_MAX_MULT_F 65536.0f\n#define MIXERS_MIN_GAIN -32767.0f\n#define MIXERS_MAX_GAIN 32767.0f\n#define MIXERS_MULT_TYPE int32_t\n#elif defined(KINETISL)\n#define MIXERS_MAX_MULT_I 256\n#define MIXERS_MAX_MULT_F 256.0f\n#define MIXERS_MIN_GAIN -127.0f\n#define MIXERS_MAX_GAIN 127.0f\n#define MIXERS_MULT_TYPE int16_t\n#endif\n\n<templatecode>\n\n#endif";
    var mixers_h_template = "class AudioMixerNNN : public AudioStream\n{\npublic:\n\tAudioMixerNNN(void) : AudioStream(NNN, inputQueueArray) {\n\t\tfor (int i=0; i<NNN; i++) multiplier[i] = MIXERS_MAX_MULT_I;\n\t}\n\tvirtual void update(void);\n\tvoid gain(unsigned int channel, float gain) {\n\t\tif (channel >= NNN) return;\n\t\tif (gain > MIXERS_MAX_GAIN) gain = MIXERS_MAX_GAIN;\n\t\telse if (gain < MIXERS_MIN_GAIN) gain = MIXERS_MIN_GAIN;\n\t\tmultiplier[channel] = gain * MIXERS_MAX_MULT_F; // TODO: proper roundoff?\n\t}\n\tvoid gain(float gain) {\n\t    if (gain > MIXERS_MAX_GAIN) gain = MIXERS_MAX_GAIN;\n\t\telse if (gain < MIXERS_MIN_GAIN) gain = MIXERS_MIN_GAIN;\n\t\tfor (int i=0; i<NNN; i++) multiplier[i] = gain * MIXERS_MAX_MULT_F;\n\t}\nprivate:\n\tMIXERS_MULT_TYPE multiplier[NNN];\n\taudio_block_t *inputQueueArray[NNN];\n};";

    var copyrightNote_stereo = "/* no stereo mixer code generated*/";
    var mixers_cpp_base_stereo =  "/* no stereo mixer code generated*/";
    var mixers_cpp_template_stereo =  "/* no stereo mixer code generated*/";
    var mixers_h_base_stereo =  "/* no stereo mixer code generated*/";
    var mixers_h_template_stereo =  "/* no stereo mixer code generated*/";

    function GetFiles(mixervariants)
    {
        var files = [];
        var mfiles = GetCode(mixervariants);
        var file = new ExportFile("mixers.h", mfiles.h);
        file.header = mfiles.copyrightNote;
        files.push(file);
        file = new ExportFile("mixers.cpp", mfiles.cpp);
        file.header = mfiles.copyrightNote;
        files.push(file);
        return files;
    }

    function GetCode(variants) {
        var mixersCpp = "";
        var mixersH = "";

        console.warn("mixer variants",variants);
        
        for (var vi = 0; vi < variants.length; vi++)
        {
            if (variants[vi] <= 0) continue; // cannot have a mixer with zero or less inputs
            if (variants[vi] == 4) continue; // mixer with 4 inputs allready exists in the lib
            if (variants[vi] > 255) variants[vi] = 255; // a AudioObject cannot have more than 255 inputs

            mixersCpp += mixers_cpp_template.split('NNN').join(variants[vi].toString()) + "\n";
            mixersH += mixers_h_template.split('NNN').join(variants[vi].toString()) + "\n";
        }
        return {copyrightNote:copyrightNote,
                cpp:mixers_cpp_base.replace("<templatecode>", mixersCpp),
                h:mixers_h_base.replace("<templatecode>", mixersH)};
    }

    function GetCodeStereo(variants) {
        var mixersCpp = "";
        var mixersH = "";

        console.warn("mixer stereo variants",variants);
        
        for (var vi = 0; vi < variants.length; vi++)
        {
            if (variants[vi] <= 0) continue; // cannot have a mixer with zero or less inputs
            if (variants[vi] == 4) continue; // mixer with 4 inputs allready exists in the lib
            if (variants[vi] > 255) variants[vi] = 255; // a AudioObject cannot have more than 255 inputs

            mixersCpp += mixers_cpp_template_stereo.split('NNN').join(variants[vi].toString()) + "\n";
            mixersH += mixers_h_template_stereo.split('NNN').join(variants[vi].toString()) + "\n";
        }
        return {copyrightNote:copyrightNote_stereo,
                cpp:mixers_cpp_base_stereo.replace("<templatecode>", mixersCpp),
                h:mixers_h_base_stereo.replace("<templatecode>", mixersH)};
    }
    return {
        GetCode,
        GetFiles,
        GetCodeStereo
    };
})();