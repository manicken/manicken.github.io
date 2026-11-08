/**
 * Live control: what the audio objects can do, without anything about how it's sent (OSC, MIDI, DALHAL ...).
 * The protocol adapters (see control.js) turns a call of a method into their own messages.
 *
 * A method:
 *   id          unique in the type (overloads get their own id, i.e. "gainAll")
 *   call        the C++ function name, the id when not given
 *   label       shown in the UI, the id when not given
 *   kind        "set" (the default) sent when a value is changed
 *               "action" a button (its arguments, if any, are set first and sent with it, i.e. karplus.noteOn(freq, velocity))
 *               "read" a button, the result is shown (returns gives its type), arguments as for action
 *   release     action only: the method (id) a created GUI button sends when it's released (envelope noteOn -> noteOff)
 *   channels    perChannel only: the number of channels when it's not the inputs of the object (delay taps)
 *   channelName perChannel only: shown instead of "in" (i.e. "tap")
 *   init        true: sent (without arguments) when the object is created on the Teensy, before the stored values
 *               (i.e. sgtl5000.enable(), see RED.control.core objectsCreated)
 *   perChannel  the first C++ argument is the channel, the UI shows one row per input of the object
 *   args        the arguments (after the channel):
 *                 type     "float" | "int" | "enum" | "bool" | "string"
 *                 min max  the range of the slider (a value typed in the number box is not limited)
 *                 scale    "lin" (default) | "log" (min > 0) | "curve" (value = min + (max-min) * t^curve, used for times)
 *                 default  the value shown before anything is sent
 *                 options  ["NAME", ...] for enum, the value is the index (or {label, value})
 *                 send     false: changing it don't send (i.e. the ramp time of dc.amplitude)
 *
 * Pilot, only the types needed for simple tests are here.
 */
RED.control = RED.control || {};
RED.control.methods = (function () {
    'use strict';

    const WAVEFORM_TYPES = ["SINE", "SAWTOOTH", "SQUARE", "TRIANGLE", "ARBITRARY", "PULSE", "SAWTOOTH_REVERSE", "SAMPLE_HOLD",
        "TRIANGLE_VARIABLE", "BANDLIMIT_SAWTOOTH", "BANDLIMIT_SAWTOOTH_REVERSE", "BANDLIMIT_SQUARE", "BANDLIMIT_PULSE"];

    function level(def) { return { name: "level", type: "float", min: 0, max: 1, default: def }; }
    function frequency(def) { return { name: "frequency", type: "float", min: 1, max: 20000, scale: "log", unit: "Hz", default: def }; }
    function milliseconds(name, def, max) { return { name, type: "float", min: 0, max, scale: "curve", curve: 3, unit: "ms", default: def }; }
    function gain() { return { name: "gain", type: "float", min: 0, max: 2, default: 1 }; }

    const waveformCommon = [
        { id: "begin", label: "waveform", args: [{ name: "type", type: "enum", options: WAVEFORM_TYPES, default: 0 }] },
        { id: "amplitude", args: [level(0)] },
        { id: "frequency", args: [frequency(440)] },
        { id: "offset", args: [{ name: "offset", type: "float", min: -1, max: 1, default: 0 }] },
    ];

    const sineCommon = [
        { id: "amplitude", args: [level(0)] },
        { id: "frequency", args: [frequency(440)] },
        { id: "phase", args: [{ name: "angle", type: "float", min: 0, max: 360, unit: "°", default: 0 }] },
    ];
    function biquad(id, label, third) {
        const args = [{ name: "stage", type: "int", min: 0, max: 3, default: 0 }, frequency(1000)];
        args.push(third || { name: "q", type: "float", min: 0.1, max: 10, scale: "log", default: 0.707 });
        return { id, label, args };
    }
    function shelf(id, label) {
        return { id, label, args: [{ name: "stage", type: "int", min: 0, max: 3, default: 0 }, frequency(1000),
            { name: "gain", type: "float", min: -24, max: 24, unit: "dB", default: 0 },
            { name: "slope", type: "float", min: 0.1, max: 1, default: 1 }] };
    }
    function reads(...ids) { return ids.map(function (id) { return { id, kind: "read", returns: (id == "available" || id.startsWith("is")) ? "bool" : "float" }; }); }

    const types = {
        // ---- synths ----
        AudioSynthWaveformSineModulated: [
            { id: "amplitude", args: [level(0)] },
            { id: "frequency", args: [frequency(440)] },
            { id: "phase", args: [{ name: "angle", type: "float", min: 0, max: 360, unit: "°", default: 0 }] },
        ],
        AudioSynthWaveformSineHires: sineCommon,
        AudioSynthWaveformPWM: [
            { id: "amplitude", args: [level(0)] },
            { id: "frequency", args: [frequency(440)] },
        ],
        AudioSynthNoiseWhite: [{ id: "amplitude", args: [level(0)] }],
        AudioSynthNoisePink: [{ id: "amplitude", args: [level(0)] }],
        AudioSynthSimpleDrum: [
            { id: "noteOn", kind: "action" },
            { id: "frequency", args: [frequency(60)] },
            { id: "length", args: [{ name: "time", type: "int", min: 10, max: 2000, unit: "ms", default: 300 }] },
            { id: "secondMix", label: "second mix", args: [level(0)] },
            { id: "pitchMod", label: "pitch mod", args: [{ name: "depth", type: "float", min: 0, max: 1, default: 0.5 }] },
        ],
        AudioSynthKarplusStrong: [
            { id: "noteOn", kind: "action", release: "noteOff", args: [frequency(220), { name: "velocity", type: "float", min: 0, max: 1, default: 0.8 }] },
            { id: "noteOff", kind: "action", args: [{ name: "velocity", type: "float", min: 0, max: 1, default: 0 }] },
        ],
        AudioSynthToneSweep: [
            { id: "play", kind: "action", args: [level(0.5),
                { name: "from", type: "int", min: 10, max: 20000, scale: "log", unit: "Hz", default: 100 },
                { name: "to", type: "int", min: 10, max: 20000, scale: "log", unit: "Hz", default: 5000 },
                { name: "time", type: "float", min: 0.1, max: 20, unit: "s", default: 2 }] },
            ...reads("isPlaying"),
        ],
        AudioPlaySdWav: [
            { id: "play", kind: "action", args: [{ name: "file", type: "string", default: "SDTEST1.WAV" }] },
            { id: "stop", kind: "action" },
            { id: "togglePlayPause", label: "play/pause", kind: "action" },
            { id: "isPlaying", kind: "read", returns: "bool" },
            { id: "positionMillis", label: "position (ms)", kind: "read", returns: "int" },
            { id: "lengthMillis", label: "length (ms)", kind: "read", returns: "int" },
        ],
        // ---- effects ----
        AudioAmplifier: [{ id: "gain", args: [{ name: "gain", type: "float", min: 0, max: 4, default: 1 }] }],
        AudioEffectFade: [
            { id: "fadeIn", label: "fade in", kind: "action", args: [{ name: "time", type: "int", min: 1, max: 10000, scale: "log", unit: "ms", default: 500 }] },
            { id: "fadeOut", label: "fade out", kind: "action", args: [{ name: "time", type: "int", min: 1, max: 10000, scale: "log", unit: "ms", default: 500 }] },
        ],
        AudioEffectDelay: [
            { id: "delay", perChannel: true, channels: 8, channelName: "tap", args: [milliseconds("time", 0, 1400)] },
            { id: "disable", kind: "action", args: [{ name: "tap", type: "int", min: 0, max: 7, default: 0 }] },
        ],
        AudioEffectBitcrusher: [
            { id: "bits", args: [{ name: "bits", type: "int", min: 1, max: 16, default: 16 }] },
            { id: "sampleRate", label: "sample rate", args: [{ name: "rate", type: "float", min: 100, max: 44100, scale: "log", unit: "Hz", default: 44100 }] },
        ],
        AudioEffectFreeverb: [
            { id: "roomsize", label: "room size", args: [level(0.5)] },
            { id: "damping", args: [level(0.5)] },
        ],
        AudioEffectFreeverbStereo: [
            { id: "roomsize", label: "room size", args: [level(0.5)] },
            { id: "damping", args: [level(0.5)] },
        ],
        AudioEffectReverb: [{ id: "reverbTime", label: "reverb time", args: [{ name: "time", type: "float", min: 0, max: 10, unit: "s", default: 5 }] }],
        AudioEffectMidSide: [{ id: "encode", kind: "action" }, { id: "decode", kind: "action" }],
        AudioEffectDigitalCombine: [{ id: "setCombineMode", label: "mode", args: [{ name: "mode", type: "enum", options: ["OR", "XOR", "AND", "MODULO"], default: 0 }] }],
        // ---- filters ----
        AudioFilterBiquad: [
            biquad("setLowpass", "lowpass"),
            biquad("setHighpass", "highpass"),
            biquad("setBandpass", "bandpass", { name: "q", type: "float", min: 0.1, max: 10, scale: "log", default: 1 }),
            biquad("setNotch", "notch", { name: "q", type: "float", min: 0.1, max: 10, scale: "log", default: 1 }),
            shelf("setLowShelf", "low shelf"),
            shelf("setHighShelf", "high shelf"),
        ],
        AudioFilterLadder: [
            { id: "frequency", args: [frequency(1000)] },
            { id: "resonance", args: [{ name: "res", type: "float", min: 0, max: 1.8, default: 0 }] },
            { id: "octaveControl", label: "octave control", args: [{ name: "octaves", type: "float", min: 0, max: 7, default: 1 }] },
            { id: "inputDrive", label: "input drive", args: [{ name: "drive", type: "float", min: 0, max: 4, default: 1 }] },
            { id: "passbandGain", label: "passband gain", args: [{ name: "gain", type: "float", min: 0, max: 0.5, default: 0.5 }] },
            { id: "interpolationMethod", label: "interpolation", args: [{ name: "method", type: "enum", options: ["LINEAR", "FIR_POLY"], default: 1 }] },
        ],
        // ---- analyze ----
        AudioAnalyzePeak: reads("available", "read", "readPeakToPeak"),
        AudioAnalyzeRMS: reads("available", "read"),
        AudioAnalyzeToneDetect: [
            { id: "frequency", args: [frequency(1000), { name: "cycles", type: "int", min: 1, max: 100, default: 10 }] },
            { id: "threshold", args: [level(0.5)] },
            ...reads("available", "read"),
        ],
        AudioAnalyzeNoteFrequency: [
            { id: "begin", kind: "action", args: [{ name: "threshold", type: "float", min: 0, max: 1, default: 0.15 }] },
            { id: "threshold", args: [{ name: "threshold", type: "float", min: 0, max: 1, default: 0.15 }] },
            ...reads("available", "read", "probability"),
        ],
        AudioAnalyzeFFT256: [
            { id: "averageTogether", label: "average", args: [{ name: "n", type: "int", min: 1, max: 255, default: 1 }] },
            { id: "available", kind: "read", returns: "bool" },
            { id: "read", label: "read bin", kind: "read", returns: "float", args: [{ name: "bin", type: "int", min: 0, max: 127, default: 0 }] },
        ],
        AudioAnalyzeFFT1024: [
            { id: "averageTogether", label: "average", args: [{ name: "n", type: "int", min: 1, max: 255, default: 1 }] },
            { id: "available", kind: "read", returns: "bool" },
            { id: "read", label: "read bin", kind: "read", returns: "float", args: [{ name: "bin", type: "int", min: 0, max: 511, default: 0 }] },
        ],
        // ---- the pilot types ----
        AudioSynthWaveform: [
            ...waveformCommon,
            { id: "phase", args: [{ name: "angle", type: "float", min: 0, max: 360, unit: "°", default: 0 }] },
            { id: "pulseWidth", args: [{ name: "width", type: "float", min: 0, max: 1, default: 0.5 }] },
        ],
        AudioSynthWaveformModulated: [
            ...waveformCommon,
            { id: "frequencyModulation", label: "FM depth", args: [{ name: "octaves", type: "float", min: 0.1, max: 12, unit: "oct", default: 1 }] },
            { id: "phaseModulation", label: "PM depth", args: [{ name: "degrees", type: "float", min: 30, max: 9000, scale: "log", unit: "°", default: 180 }] },
        ],
        AudioSynthWaveformSine: [
            { id: "amplitude", args: [level(0)] },
            { id: "frequency", args: [frequency(440)] },
            { id: "phase", args: [{ name: "angle", type: "float", min: 0, max: 360, unit: "°", default: 0 }] },
        ],
        AudioSynthWaveformDc: [
            { id: "amplitude", args: [{ name: "level", type: "float", min: -1, max: 1, default: 0 }] },
            // amplitude(level, milliseconds) is not reachable in OSCAudio: the route "/a*" "f" is before "/a*" "ff", and
            // validParams() don't reject extra arguments, so amplitude(level) is called (the ramp is lost). Add it again when it's fixed:
            // { id: "amplitudeRamp", call: "amplitude", label: "amplitude (ramp)", args: [
            //     { name: "level", type: "float", min: -1, max: 1, default: 0 },
            //     { ...milliseconds("time", 100, 5000), send: false }] },
            { id: "read", kind: "read", returns: "float" },
        ],
        AudioEffectEnvelope: [
            { id: "noteOn", kind: "action", release: "noteOff" },
            { id: "noteOff", kind: "action" },
            { id: "delay", args: [milliseconds("time", 0, 2000)] },
            { id: "attack", args: [milliseconds("time", 10.5, 11880)] },
            { id: "hold", args: [milliseconds("time", 2.5, 11880)] },
            { id: "decay", args: [milliseconds("time", 35, 11880)] },
            { id: "sustain", args: [level(0.5)] },
            { id: "release", args: [milliseconds("time", 300, 11880)] },
            { id: "releaseNoteOn", args: [milliseconds("time", 5, 200)] },
            { id: "isActive", kind: "read", returns: "bool" },
            { id: "isSustain", kind: "read", returns: "bool" },
        ],
        AudioFilterStateVariable: [
            { id: "frequency", args: [frequency(1000)] },
            { id: "resonance", args: [{ name: "q", type: "float", min: 0.7, max: 5, default: 0.707 }] },
            { id: "octaveControl", args: [{ name: "octaves", type: "float", min: 0, max: 7, default: 1 }] },
        ],
        AudioMixer4: [
            { id: "gain", perChannel: true, args: [gain()] },
        ],
        AudioMixer: [ // DynMixer
            { id: "gain", perChannel: true, args: [gain()] },
            { id: "gainAll", call: "gain", label: "gain (all)", args: [gain()] },
            { id: "setSoftKnee", label: "soft knee", args: [{ name: "start", type: "float", min: 0, max: 0.97, default: 0.97 }] },
            { id: "getChannels", kind: "read", returns: "int" },
        ],
        AudioControlSGTL5000: [ // init: "enable" is sent when the OSC live update / Sync creates it (the constructor don't enable it)
            { id: "enable", kind: "read", returns: "bool", init: true }, // shows if the codec answered
            { id: "volume", label: "headphone volume", args: [{ name: "level", type: "float", min: 0, max: 1, default: 0.5 }] },
            { id: "headphoneSelect", label: "headphone source", args: [{ name: "source", type: "enum", options: ["DAC", "LINEIN"], default: 0 }] },
            { id: "muteHeadphone", label: "mute headphone", kind: "action" },
            { id: "unmuteHeadphone", label: "unmute headphone", kind: "action" },
            { id: "lineOutLevel", label: "line out level", args: [{ name: "level", type: "int", min: 13, max: 31, default: 29 }] },
            { id: "muteLineout", label: "mute line out", kind: "action" },
            { id: "unmuteLineout", label: "unmute line out", kind: "action" },
            { id: "inputSelect", label: "input", args: [{ name: "input", type: "enum", options: ["LINEIN", "MIC"], default: 0 }] },
            { id: "lineInLevel", label: "line in level", args: [{ name: "level", type: "int", min: 0, max: 15, default: 5 }] },
            { id: "micGain", label: "mic gain", args: [{ name: "dB", type: "int", min: 0, max: 63, unit: "dB", default: 0 }] },
            { id: "dacVolume", label: "DAC volume", args: [{ name: "level", type: "float", min: 0, max: 1, default: 1 }] },
            { id: "audioPostProcessorEnable", label: "DAP post processor on", kind: "action" },
            { id: "audioProcessorDisable", label: "DAP off", kind: "action" },
            { id: "eqSelect", label: "EQ mode", args: [{ name: "mode", type: "enum", options: ["FLAT_FREQUENCY", "PARAMETRIC_EQUALIZER", "TONE_CONTROLS", "GRAPHIC_EQUALIZER"], default: 0 }] },
            { id: "eqBands", label: "tone (bass, treble)", args: [
                { name: "bass", type: "float", min: -1, max: 1, default: 0 },
                { name: "treble", type: "float", min: -1, max: 1, default: 0 }] },
        ],
        AudioMixerStereo: [ // DynMixer
            { id: "gain", perChannel: true, args: [gain()] },
            { id: "pan", perChannel: true, args: [{ name: "pan", type: "float", min: -1, max: 1, default: 0 }] },
            { id: "gainAll", call: "gain", label: "gain (all)", args: [gain()] },
            { id: "setPanLaw", label: "pan law", args: [{ name: "law", type: "float", min: 0, max: 1, default: 1 }] },
            { id: "setSoftKnee", label: "soft knee", args: [{ name: "start", type: "float", min: 0, max: 0.97, default: 0.97 }] },
            { id: "getChannels", kind: "read", returns: "int" },
        ],
    };

    /** @param {String} typeName @returns {Object[]|undefined} the methods of the type */
    function get(typeName) {
        return types[typeName];
    }

    /** @param {String} typeName @param {String} id @returns {Object|undefined} */
    function getMethod(typeName, id) {
        const methods = types[typeName];
        return (methods == undefined) ? undefined : methods.find(function (m) { return m.id == id; });
    }

    /** @param {Object} arg @returns {*} the default value */
    function getDefault(arg) {
        if (arg.default != undefined) return arg.default;
        if (arg.type == "bool") return false;
        return (arg.min != undefined) ? arg.min : 0;
    }

    /** @param {Object} arg @param {Number} t 0..1 the slider position @returns {Number} the value */
    function fromSlider(arg, t) {
        const min = arg.min, max = arg.max;
        if (arg.scale == "log") return min * Math.pow(max / min, t);
        if (arg.scale == "curve") return min + (max - min) * Math.pow(t, arg.curve || 2);
        return min + (max - min) * t;
    }

    /** @param {Object} arg @param {Number} value @returns {Number} 0..1 the slider position */
    function toSlider(arg, value) {
        const min = arg.min, max = arg.max;
        let t;
        if (arg.scale == "log") t = (value <= 0) ? 0 : Math.log(value / min) / Math.log(max / min);
        else if (arg.scale == "curve") t = Math.pow(Math.max(0, (value - min) / (max - min)), 1 / (arg.curve || 2));
        else t = (value - min) / (max - min);
        return Math.min(1, Math.max(0, t));
    }

    return {
        WAVEFORM_TYPES,
        types,
        get,
        getMethod,
        getDefault,
        fromSlider,
        toSlider,
    };
})();
