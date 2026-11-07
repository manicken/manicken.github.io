/**
 * Live control: what the audio objects can do, without anything about how it's sent (OSC, MIDI, DALHAL ...).
 * The protocol adapters (see control.js) turns a call of a method into their own messages.
 *
 * A method:
 *   id          unique in the type (overloads get their own id, i.e. "gainAll")
 *   call        the C++ function name, the id when not given
 *   label       shown in the UI, the id when not given
 *   kind        "set" (the default) sent when a value is changed
 *               "action" a button, the method have no arguments
 *               "read" a button, the result is shown (returns gives its type)
 *   init        true: sent (without arguments) when the object is created on the Teensy, before the stored values
 *               (i.e. sgtl5000.enable(), see RED.control.core objectsCreated)
 *   perChannel  the first C++ argument is the channel, the UI shows one row per input of the object
 *   args        the arguments (after the channel):
 *                 type     "float" | "int" | "enum" | "bool"
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

    const types = {
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
            { id: "amplitudeRamp", call: "amplitude", label: "amplitude (ramp)", args: [
                { name: "level", type: "float", min: -1, max: 1, default: 0 },
                { ...milliseconds("time", 100, 5000), send: false }] },
            { id: "read", kind: "read", returns: "float" },
        ],
        AudioEffectEnvelope: [
            { id: "noteOn", kind: "action" },
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
