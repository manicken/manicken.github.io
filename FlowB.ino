#include <Audio.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <SerialFlash.h>


// GUItool: begin automatically generated code
// JSON string:
//[{"type":"tab","id":"b7692de.cf719d","label":"Main"},{"type":"tab","id":"f063b7c9.3ec2c8","label":"Voice"},{"type":"tab","id":"bfcf1914.f592c8","label":"VFO"},{"type":"tab","id":"146f0b11.7830b5","label":"LFO_A"},{"type":"tab","id":"4369d3c8.87448c","label":"LFO_B"},{"type":"tab","id":"7cf61098.c92b7","label":"Mixer16"},{"id":"InA","type":"TabInput","name":"InA","x":61.75001525878906,"y":151.25,"z":"f063b7c9.3ec2c8","wires":[["VFO1:0"]]},{"id":"InB","type":"TabInput","name":"InB","x":70.75001525878906,"y":183.24999809265137,"z":"f063b7c9.3ec2c8","wires":[["VFO2:0"]]},{"id":"VFOtuningA","type":"AudioSynthWaveformDc","name":"VFOtuningA","x":77,"y":385,"z":"b7692de.cf719d","wires":[["LFOmodMixA:2"]]},{"id":"VFOtuningB","type":"AudioSynthWaveformDc","name":"VFOtuningB","x":77,"y":424,"z":"b7692de.cf719d","wires":[["LFOmodMixB:2"]]},{"id":"InC","type":"TabInput","name":"InC","x":78.00001525878906,"y":350.99999809265137,"z":"f063b7c9.3ec2c8","wires":[["VFOfilter:1"]]},{"id":"In","type":"TabInput","name":"In","x":80,"y":95,"z":"bfcf1914.f592c8","wires":[["VFO_sine:0","square:0","triangle:0","saw:0"]]},{"id":"LFO_A1","type":"LFO_A","name":"LFO_A1","x":93,"y":306,"z":"b7692de.cf719d","wires":[["LFOmodMixA:0","LFOmodMixB:0"]]},{"id":"LFO_B1","type":"LFO_B","name":"LFO_B1","x":93,"y":346,"z":"b7692de.cf719d","wires":[["LFOmodMixA:1","LFOmodMixB:1"]]},{"id":"PBend","type":"AudioSynthWaveformDc","name":"PBend","x":97,"y":464,"z":"b7692de.cf719d","wires":[["LFOmodMixA:3","LFOmodMixB:3"]]},{"id":"LFO_B2","type":"LFO_B","name":"LFO_B2","x":100,"y":556,"z":"b7692de.cf719d","wires":[["LFOfilterMixC:1"]]},{"id":"LFO_A2","type":"LFO_A","name":"LFO_A2","x":101,"y":518,"z":"b7692de.cf719d","wires":[["LFOfilterMixC:0"]]},{"id":"Mixer16_TabInput1","type":"TabInput","name":"TabInput1","x":119,"y":87,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer1_4:0"]]},{"id":"Mixer16_TabInput2","type":"TabInput","name":"TabInput2","x":121,"y":120,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer1_4:1"]]},{"id":"Mixer16_TabInput3","type":"TabInput","name":"TabInput3","x":124,"y":153,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer1_4:2"]]},{"id":"Mixer16_TabInput4","type":"TabInput","name":"TabInput4","x":128,"y":186,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer1_4:3"]]},{"id":"Mixer16_TabInput5","type":"TabInput","name":"TabInput5","x":130,"y":219,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer5_8:0"]]},{"id":"Mixer16_TabInput6","type":"TabInput","name":"TabInput6","x":133,"y":252,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer5_8:1"]]},{"id":"Mixer16_TabInput7","type":"TabInput","name":"TabInput7","x":136,"y":285,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer5_8:2"]]},{"id":"Mixer16_TabInput8","type":"TabInput","name":"TabInput8","x":138,"y":318,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer5_8:3"]]},{"id":"Mixer16_TabInput9","type":"TabInput","name":"TabInput9","x":140,"y":351,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer9_12:0"]]},{"id":"Mixer16_TabInput10","type":"TabInput","name":"TabInput10","x":146,"y":384,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer9_12:1"]]},{"id":"pulseFilterDutyCycle","type":"AudioSynthWaveformDc","name":"pulseFilterDutyCycle","x":148,"y":155,"z":"146f0b11.7830b5","wires":[["pulseFilter:1"]]},{"id":"sampleholdMod","type":"AudioSynthWaveformModulated","name":"sampleholdMod","x":149,"y":105,"z":"4369d3c8.87448c","wires":[["modMix:1"]]},{"id":"Mixer16_TabInput11","type":"TabInput","name":"TabInput11","x":148,"y":417,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer9_12:2"]]},{"id":"Mixer16_TabInput12","type":"TabInput","name":"TabInput12","x":152,"y":450,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer9_12:3"]]},{"id":"Mixer16_TabInput13","type":"TabInput","name":"TabInput13","x":155,"y":483,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer13_16:0"]]},{"id":"Mixer16_TabInput14","type":"TabInput","name":"TabInput14","x":158,"y":516,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer13_16:1"]]},{"id":"Mixer16_TabInput15","type":"TabInput","name":"TabInput15","x":160,"y":549,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer13_16:2"]]},{"id":"Mixer16_TabInput16","type":"TabInput","name":"TabInput16","x":162,"y":582,"z":"7cf61098.c92b7","wires":[["Mixer16_mixer13_16:3"]]},{"id":"sawMod","type":"AudioSynthWaveformModulated","name":"sawMod","x":181,"y":55,"z":"4369d3c8.87448c","wires":[["modMix:0"]]},{"id":"VFO1","type":"VFO","name":"VFO1","x":197.3333740234375,"y":150.33334159851074,"z":"f063b7c9.3ec2c8","wires":[["Voice_waveMix:0"],["Voice_waveMix:1"]]},{"id":"VFO2","type":"VFO","name":"VFO2","x":198.3333740234375,"y":183.33334159851074,"z":"f063b7c9.3ec2c8","wires":[["Voice_waveMix:2"],["Voice_waveMix:3"]]},{"id":"Main_mixer4_1","type":"AudioMixer4","name":"mixer4_1","x":285,"y":649,"z":"b7692de.cf719d","wires":[[]]},{"id":"VFO_sine","type":"AudioSynthWaveformModulated","name":"sine","x":292,"y":56,"z":"bfcf1914.f592c8","wires":[["mix1:0"]]},{"id":"square","type":"AudioSynthWaveformModulated","name":"square","x":292,"y":91,"z":"bfcf1914.f592c8","wires":[["mix1:1"]]},{"id":"triangle","type":"AudioSynthWaveformModulated","name":"triangle","x":292,"y":126,"z":"bfcf1914.f592c8","wires":[["mix1:2"]]},{"id":"saw","type":"AudioSynthWaveformModulated","name":"saw","x":292,"y":161,"z":"bfcf1914.f592c8","wires":[["mix1:3"]]},{"id":"string","type":"AudioSynthKarplusStrong","name":"string","x":292,"y":196,"z":"bfcf1914.f592c8","wires":[["mix2:0"]]},{"id":"white","type":"AudioSynthNoiseWhite","name":"white","x":292,"y":231,"z":"bfcf1914.f592c8","wires":[["mix2:1"]]},{"id":"pink","type":"AudioSynthNoisePink","name":"pink","x":292,"y":266,"z":"bfcf1914.f592c8","wires":[["mix2:2"]]},{"id":"sweeper","type":"AudioSynthToneSweep","name":"sweeper","x":292,"y":301,"z":"bfcf1914.f592c8","wires":[["mix2:3"]]},{"id":"Mixer16_mixer5_8","type":"AudioMixer4","name":"mixer05_08","x":346,"y":268,"z":"7cf61098.c92b7","wires":[["Mixer16_mixerFinal:1"]]},{"id":"Mixer16_mixer1_4","type":"AudioMixer4","name":"mixer01_04","x":347,"y":136,"z":"7cf61098.c92b7","wires":[["Mixer16_mixerFinal:0"]]},{"id":"Mixer16_mixer13_16","type":"AudioMixer4","name":"mixer13_16","x":346,"y":534,"z":"7cf61098.c92b7","wires":[["Mixer16_mixerFinal:3"]]},{"id":"Mixer16_mixer9_12","type":"AudioMixer4","name":"mixer09_12","x":349,"y":400,"z":"7cf61098.c92b7","wires":[["Mixer16_mixerFinal:2"]]},{"id":"triangleFilter","type":"AudioSynthWaveformModulated","name":"triangleFilter","x":355.00001525878906,"y":187,"z":"146f0b11.7830b5","wires":[["filterMix:3"]]},{"id":"squareFilter","type":"AudioSynthWaveformModulated","name":"squareFilter","x":356,"y":111,"z":"146f0b11.7830b5","wires":[["filterMix:1"]]},{"id":"Voice_waveMix","type":"AudioMixer4","name":"waveMix","x":356.8333740234375,"y":168.08334350585938,"z":"f063b7c9.3ec2c8","wires":[["VFOenvelope:0","VFOenvelopeMix:0"]]},{"id":"modMix","type":"AudioMixer4","name":"modMix","x":362,"y":79,"z":"4369d3c8.87448c","wires":[["Out:0"]]},{"id":"sineFilter","type":"AudioSynthWaveformModulated","name":"sineFilter","x":364,"y":73,"z":"146f0b11.7830b5","wires":[["filterMix:0"]]},{"id":"pulseFilter","type":"AudioSynthWaveformModulated","name":"pulseFilter","x":364,"y":149,"z":"146f0b11.7830b5","wires":[["filterMix:2"]]},{"id":"LFOmodMixA","type":"AudioMixer4","name":"LFOmodMixA","x":372,"y":383,"z":"b7692de.cf719d","wires":[["Main_Voice01:0","Main_Voice02:0","Main_Voice03:0","Main_Voice04:0","Main_Voice05:0","Main_Voice06:0","Main_Voice07:0","Main_Voice08:0","Main_Voice09:0","Main_Voice10:0","Main_Voice11:0","Main_Voice12:0","Main_Voice13:0","Main_Voice14:0","Main_Voice15:0","Main_Voice16:0"]]},{"id":"LFOmodMixB","type":"AudioMixer4","name":"LFOmodMixB","x":372,"y":454,"z":"b7692de.cf719d","wires":[["Main_Voice01:1","Main_Voice02:1","Main_Voice03:1","Main_Voice04:1","Main_Voice05:1","Main_Voice06:1","Main_Voice07:1","Main_Voice08:1","Main_Voice09:1","Main_Voice10:1","Main_Voice11:1","Main_Voice12:1","Main_Voice13:1","Main_Voice14:1","Main_Voice15:1","Main_Voice16:1"]]},{"id":"LFOfilterMixC","type":"AudioMixer4","name":"LFOfilterMixC","x":372.5,"y":525.75,"z":"b7692de.cf719d","wires":[["Main_Voice01:2","Main_Voice02:2","Main_Voice03:2","Main_Voice04:2","Main_Voice05:2","Main_Voice06:2","Main_Voice07:2","Main_Voice08:2","Main_Voice09:2","Main_Voice10:2","Main_Voice11:2","Main_Voice12:2","Main_Voice13:2","Main_Voice14:2","Main_Voice15:2","Main_Voice16:2"]]},{"id":"sgtl5000","type":"AudioControlSGTL5000","name":"sgtl5000","x":377,"y":116,"z":"b7692de.cf719d","wires":[]},{"id":"VFOenvelope","type":"AudioEffectEnvelope","name":"VFOenvelope","x":416.8333740234375,"y":247.08334350585938,"z":"f063b7c9.3ec2c8","wires":[["VFOenvelopeMix:1"]]},{"id":"VFOfilter","type":"AudioFilterStateVariable","name":"VFOfilter","x":508.83338928222656,"y":349.08334159851074,"z":"f063b7c9.3ec2c8","wires":[["VFOfilterMix:1"],["VFOfilterMix:2"],["VFOfilterMix:3"]]},{"id":"mix1","type":"AudioMixer4","name":"mix1","x":542,"y":147,"z":"bfcf1914.f592c8","wires":[["Out2:0"]]},{"id":"mix2","type":"AudioMixer4","name":"mix2","x":542,"y":220,"z":"bfcf1914.f592c8","wires":[["Out3:0"]]},{"id":"filterMix","type":"AudioMixer4","name":"filterMix","x":555,"y":130,"z":"146f0b11.7830b5","wires":[["Out1:0"]]},{"id":"Mixer16_mixerFinal","type":"AudioMixer4","name":"mixerFinal","x":568,"y":328,"z":"7cf61098.c92b7","wires":[["Mixer16_TabOutput:0"]]},{"id":"Out","type":"TabOutput","name":"Out","x":583,"y":79,"z":"4369d3c8.87448c","wires":[]},{"id":"VFOenvelopeMix","type":"AudioMixer4","name":"VFOenvelopeMix","x":589.8333740234375,"y":164.08334350585938,"z":"f063b7c9.3ec2c8","wires":[["VFOfilter:0","VFOfilterMix:0"]]},{"id":"Out2","type":"TabOutput","name":"Out2","x":696,"y":147,"z":"bfcf1914.f592c8","wires":[]},{"id":"Out3","type":"TabOutput","name":"Out3","x":699,"y":220,"z":"bfcf1914.f592c8","wires":[]},{"id":"VFOfilterMix","type":"AudioMixer4","name":"VFOfilterMix","x":707.8333892822266,"y":345.08334159851074,"z":"f063b7c9.3ec2c8","wires":[["Out4:0"]]},{"id":"Out1","type":"TabOutput","name":"Out1","x":713,"y":131,"z":"146f0b11.7830b5","wires":[]},{"id":"Main_Array1","type":"Array","name":"Voice voices[16]","x":724,"y":33,"z":"b7692de.cf719d","wires":[]},{"id":"Main_Voice01","type":"Voice","name":"Voice01","x":724,"y":95,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:0"]]},{"id":"Main_Voice02","type":"Voice","name":"Voice02","x":724,"y":143,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:1"]]},{"id":"Main_Voice03","type":"Voice","name":"Voice03","x":724,"y":191,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:2"]]},{"id":"Main_Voice04","type":"Voice","name":"Voice04","x":724,"y":239,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:3"]]},{"id":"Main_Voice05","type":"Voice","name":"Voice05","x":724,"y":287,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:4"]]},{"id":"Main_Voice06","type":"Voice","name":"Voice06","x":724,"y":335,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:5"]]},{"id":"Main_Voice07","type":"Voice","name":"Voice07","x":724,"y":383,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:6"]]},{"id":"Main_Voice08","type":"Voice","name":"Voice08","x":724,"y":431,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:7"]]},{"id":"Main_Voice09","type":"Voice","name":"Voice09","x":724,"y":479,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:8"]]},{"id":"Main_Voice10","type":"Voice","name":"Voice10","x":724,"y":527,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:9"]]},{"id":"Main_Voice11","type":"Voice","name":"Voice11","x":724,"y":575,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:10"]]},{"id":"Main_Voice12","type":"Voice","name":"Voice12","x":724,"y":623,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:11"]]},{"id":"Main_Voice13","type":"Voice","name":"Voice13","x":724,"y":671,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:12"]]},{"id":"Main_Voice14","type":"Voice","name":"Voice14","x":724,"y":719,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:13"]]},{"id":"Main_Voice15","type":"Voice","name":"Voice15","x":724,"y":767,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:14"]]},{"id":"Main_Voice16","type":"Voice","name":"Voice16","x":724,"y":815,"z":"b7692de.cf719d","wires":[["Main_Mixer16_1:15"]]},{"id":"Mixer16_TabOutput","type":"TabOutput","name":"TabOutput","x":759,"y":329,"z":"7cf61098.c92b7","wires":[]},{"id":"Out4","type":"TabOutput","name":"Out4","x":878.8333892822266,"y":345.08334159851074,"z":"f063b7c9.3ec2c8","wires":[]},{"id":"Main_Mixer16_1","type":"Mixer16","name":"Mixer16_1","x":1012,"y":459,"z":"b7692de.cf719d","wires":[["Main_amp1:0"]]},{"id":"Main_amp1","type":"AudioAmplifier","name":"amp1","x":1151,"y":459,"z":"b7692de.cf719d","wires":[["i2s2:0","i2s2:1"]]},{"id":"i2s2","type":"AudioOutputI2S","name":"i2s2","x":1281,"y":459,"z":"b7692de.cf719d","wires":[]}]

class Main
{
  public:
    Voice                            voices[16];
    AudioSynthWaveformDc             VFOtuningA;
    AudioSynthWaveformDc             VFOtuningB;
    LFO_A                            LFO_A1;
    LFO_B                            LFO_B1;
    AudioSynthWaveformDc             PBend;
    LFO_B                            LFO_B2;
    LFO_A                            LFO_A2;
    AudioMixer4                      mixer4_1;
    AudioMixer4                      LFOmodMixA;
    AudioMixer4                      LFOmodMixB;
    AudioMixer4                      LFOfilterMixC;
    Voice                            Voice01;
    Voice                            Voice02;
    Voice                            Voice03;
    Voice                            Voice04;
    Voice                            Voice05;
    Voice                            Voice06;
    Voice                            Voice07;
    Voice                            Voice08;
    Voice                            Voice09;
    Voice                            Voice10;
    Voice                            Voice11;
    Voice                            Voice12;
    Voice                            Voice13;
    Voice                            Voice14;
    Voice                            Voice15;
    Voice                            Voice16;
    Mixer16                          Mixer16_1;
    AudioAmplifier                   amp1;
    AudioOutputI2S                   i2s2;
    AudioControlSGTL5000             sgtl5000;

    Main() // constructor (this is called when class-object is created)
    {
        AudioConnection        patchCord1(VFOtuningA, 0, LFOmodMixA, 2);
        AudioConnection        patchCord2(VFOtuningB, 0, LFOmodMixB, 2);
        AudioConnection        patchCord3(LFO_A1.filterMix, 0, LFOmodMixA, 0);
        AudioConnection        patchCord4(LFO_A1.filterMix, 0, LFOmodMixB, 0);
        AudioConnection        patchCord5(LFO_B1.modMix, 0, LFOmodMixA, 1);
        AudioConnection        patchCord6(LFO_B1.modMix, 0, LFOmodMixB, 1);
        AudioConnection        patchCord7(PBend, 0, LFOmodMixA, 3);
        AudioConnection        patchCord8(PBend, 0, LFOmodMixB, 3);
        AudioConnection        patchCord9(LFO_B2.modMix, 0, LFOfilterMixC, 1);
        AudioConnection        patchCord10(LFO_A2.filterMix, 0, LFOfilterMixC, 0);
        AudioConnection        patchCord11(LFOmodMixA, 0, Voice01.VFO1.sine, 0);
        AudioConnection        patchCord12(LFOmodMixA, 0, Voice01.VFO1.square, 0);
        AudioConnection        patchCord13(LFOmodMixA, 0, Voice01.VFO1.triangle, 0);
        AudioConnection        patchCord14(LFOmodMixA, 0, Voice01.VFO1.saw, 0);
        AudioConnection        patchCord15(LFOmodMixA, 0, Voice02.VFO1.sine, 0);
        AudioConnection        patchCord16(LFOmodMixA, 0, Voice02.VFO1.square, 0);
        AudioConnection        patchCord17(LFOmodMixA, 0, Voice02.VFO1.triangle, 0);
        AudioConnection        patchCord18(LFOmodMixA, 0, Voice02.VFO1.saw, 0);
        AudioConnection        patchCord19(LFOmodMixA, 0, Voice03.VFO1.sine, 0);
        AudioConnection        patchCord20(LFOmodMixA, 0, Voice03.VFO1.square, 0);
        AudioConnection        patchCord21(LFOmodMixA, 0, Voice03.VFO1.triangle, 0);
        AudioConnection        patchCord22(LFOmodMixA, 0, Voice03.VFO1.saw, 0);
        AudioConnection        patchCord23(LFOmodMixA, 0, Voice04.VFO1.sine, 0);
        AudioConnection        patchCord24(LFOmodMixA, 0, Voice04.VFO1.square, 0);
        AudioConnection        patchCord25(LFOmodMixA, 0, Voice04.VFO1.triangle, 0);
        AudioConnection        patchCord26(LFOmodMixA, 0, Voice04.VFO1.saw, 0);
        AudioConnection        patchCord27(LFOmodMixA, 0, Voice05.VFO1.sine, 0);
        AudioConnection        patchCord28(LFOmodMixA, 0, Voice05.VFO1.square, 0);
        AudioConnection        patchCord29(LFOmodMixA, 0, Voice05.VFO1.triangle, 0);
        AudioConnection        patchCord30(LFOmodMixA, 0, Voice05.VFO1.saw, 0);
        AudioConnection        patchCord31(LFOmodMixA, 0, Voice06.VFO1.sine, 0);
        AudioConnection        patchCord32(LFOmodMixA, 0, Voice06.VFO1.square, 0);
        AudioConnection        patchCord33(LFOmodMixA, 0, Voice06.VFO1.triangle, 0);
        AudioConnection        patchCord34(LFOmodMixA, 0, Voice06.VFO1.saw, 0);
        AudioConnection        patchCord35(LFOmodMixA, 0, Voice07.VFO1.sine, 0);
        AudioConnection        patchCord36(LFOmodMixA, 0, Voice07.VFO1.square, 0);
        AudioConnection        patchCord37(LFOmodMixA, 0, Voice07.VFO1.triangle, 0);
        AudioConnection        patchCord38(LFOmodMixA, 0, Voice07.VFO1.saw, 0);
        AudioConnection        patchCord39(LFOmodMixA, 0, Voice08.VFO1.sine, 0);
        AudioConnection        patchCord40(LFOmodMixA, 0, Voice08.VFO1.square, 0);
        AudioConnection        patchCord41(LFOmodMixA, 0, Voice08.VFO1.triangle, 0);
        AudioConnection        patchCord42(LFOmodMixA, 0, Voice08.VFO1.saw, 0);
        AudioConnection        patchCord43(LFOmodMixA, 0, Voice09.VFO1.sine, 0);
        AudioConnection        patchCord44(LFOmodMixA, 0, Voice09.VFO1.square, 0);
        AudioConnection        patchCord45(LFOmodMixA, 0, Voice09.VFO1.triangle, 0);
        AudioConnection        patchCord46(LFOmodMixA, 0, Voice09.VFO1.saw, 0);
        AudioConnection        patchCord47(LFOmodMixA, 0, Voice10.VFO1.sine, 0);
        AudioConnection        patchCord48(LFOmodMixA, 0, Voice10.VFO1.square, 0);
        AudioConnection        patchCord49(LFOmodMixA, 0, Voice10.VFO1.triangle, 0);
        AudioConnection        patchCord50(LFOmodMixA, 0, Voice10.VFO1.saw, 0);
        AudioConnection        patchCord51(LFOmodMixA, 0, Voice11.VFO1.sine, 0);
        AudioConnection        patchCord52(LFOmodMixA, 0, Voice11.VFO1.square, 0);
        AudioConnection        patchCord53(LFOmodMixA, 0, Voice11.VFO1.triangle, 0);
        AudioConnection        patchCord54(LFOmodMixA, 0, Voice11.VFO1.saw, 0);
        AudioConnection        patchCord55(LFOmodMixA, 0, Voice12.VFO1.sine, 0);
        AudioConnection        patchCord56(LFOmodMixA, 0, Voice12.VFO1.square, 0);
        AudioConnection        patchCord57(LFOmodMixA, 0, Voice12.VFO1.triangle, 0);
        AudioConnection        patchCord58(LFOmodMixA, 0, Voice12.VFO1.saw, 0);
        AudioConnection        patchCord59(LFOmodMixA, 0, Voice13.VFO1.sine, 0);
        AudioConnection        patchCord60(LFOmodMixA, 0, Voice13.VFO1.square, 0);
        AudioConnection        patchCord61(LFOmodMixA, 0, Voice13.VFO1.triangle, 0);
        AudioConnection        patchCord62(LFOmodMixA, 0, Voice13.VFO1.saw, 0);
        AudioConnection        patchCord63(LFOmodMixA, 0, Voice14.VFO1.sine, 0);
        AudioConnection        patchCord64(LFOmodMixA, 0, Voice14.VFO1.square, 0);
        AudioConnection        patchCord65(LFOmodMixA, 0, Voice14.VFO1.triangle, 0);
        AudioConnection        patchCord66(LFOmodMixA, 0, Voice14.VFO1.saw, 0);
        AudioConnection        patchCord67(LFOmodMixA, 0, Voice15.VFO1.sine, 0);
        AudioConnection        patchCord68(LFOmodMixA, 0, Voice15.VFO1.square, 0);
        AudioConnection        patchCord69(LFOmodMixA, 0, Voice15.VFO1.triangle, 0);
        AudioConnection        patchCord70(LFOmodMixA, 0, Voice15.VFO1.saw, 0);
        AudioConnection        patchCord71(LFOmodMixA, 0, Voice16.VFO1.sine, 0);
        AudioConnection        patchCord72(LFOmodMixA, 0, Voice16.VFO1.square, 0);
        AudioConnection        patchCord73(LFOmodMixA, 0, Voice16.VFO1.triangle, 0);
        AudioConnection        patchCord74(LFOmodMixA, 0, Voice16.VFO1.saw, 0);
        AudioConnection        patchCord75(LFOmodMixB, 0, Voice01.VFO2.sine, 0);
        AudioConnection        patchCord76(LFOmodMixB, 0, Voice01.VFO2.square, 0);
        AudioConnection        patchCord77(LFOmodMixB, 0, Voice01.VFO2.triangle, 0);
        AudioConnection        patchCord78(LFOmodMixB, 0, Voice01.VFO2.saw, 0);
        AudioConnection        patchCord79(LFOmodMixB, 0, Voice02.VFO2.sine, 0);
        AudioConnection        patchCord80(LFOmodMixB, 0, Voice02.VFO2.square, 0);
        AudioConnection        patchCord81(LFOmodMixB, 0, Voice02.VFO2.triangle, 0);
        AudioConnection        patchCord82(LFOmodMixB, 0, Voice02.VFO2.saw, 0);
        AudioConnection        patchCord83(LFOmodMixB, 0, Voice03.VFO2.sine, 0);
        AudioConnection        patchCord84(LFOmodMixB, 0, Voice03.VFO2.square, 0);
        AudioConnection        patchCord85(LFOmodMixB, 0, Voice03.VFO2.triangle, 0);
        AudioConnection        patchCord86(LFOmodMixB, 0, Voice03.VFO2.saw, 0);
        AudioConnection        patchCord87(LFOmodMixB, 0, Voice04.VFO2.sine, 0);
        AudioConnection        patchCord88(LFOmodMixB, 0, Voice04.VFO2.square, 0);
        AudioConnection        patchCord89(LFOmodMixB, 0, Voice04.VFO2.triangle, 0);
        AudioConnection        patchCord90(LFOmodMixB, 0, Voice04.VFO2.saw, 0);
        AudioConnection        patchCord91(LFOmodMixB, 0, Voice05.VFO2.sine, 0);
        AudioConnection        patchCord92(LFOmodMixB, 0, Voice05.VFO2.square, 0);
        AudioConnection        patchCord93(LFOmodMixB, 0, Voice05.VFO2.triangle, 0);
        AudioConnection        patchCord94(LFOmodMixB, 0, Voice05.VFO2.saw, 0);
        AudioConnection        patchCord95(LFOmodMixB, 0, Voice06.VFO2.sine, 0);
        AudioConnection        patchCord96(LFOmodMixB, 0, Voice06.VFO2.square, 0);
        AudioConnection        patchCord97(LFOmodMixB, 0, Voice06.VFO2.triangle, 0);
        AudioConnection        patchCord98(LFOmodMixB, 0, Voice06.VFO2.saw, 0);
        AudioConnection        patchCord99(LFOmodMixB, 0, Voice07.VFO2.sine, 0);
        AudioConnection        patchCord100(LFOmodMixB, 0, Voice07.VFO2.square, 0);
        AudioConnection        patchCord101(LFOmodMixB, 0, Voice07.VFO2.triangle, 0);
        AudioConnection        patchCord102(LFOmodMixB, 0, Voice07.VFO2.saw, 0);
        AudioConnection        patchCord103(LFOmodMixB, 0, Voice08.VFO2.sine, 0);
        AudioConnection        patchCord104(LFOmodMixB, 0, Voice08.VFO2.square, 0);
        AudioConnection        patchCord105(LFOmodMixB, 0, Voice08.VFO2.triangle, 0);
        AudioConnection        patchCord106(LFOmodMixB, 0, Voice08.VFO2.saw, 0);
        AudioConnection        patchCord107(LFOmodMixB, 0, Voice09.VFO2.sine, 0);
        AudioConnection        patchCord108(LFOmodMixB, 0, Voice09.VFO2.square, 0);
        AudioConnection        patchCord109(LFOmodMixB, 0, Voice09.VFO2.triangle, 0);
        AudioConnection        patchCord110(LFOmodMixB, 0, Voice09.VFO2.saw, 0);
        AudioConnection        patchCord111(LFOmodMixB, 0, Voice10.VFO2.sine, 0);
        AudioConnection        patchCord112(LFOmodMixB, 0, Voice10.VFO2.square, 0);
        AudioConnection        patchCord113(LFOmodMixB, 0, Voice10.VFO2.triangle, 0);
        AudioConnection        patchCord114(LFOmodMixB, 0, Voice10.VFO2.saw, 0);
        AudioConnection        patchCord115(LFOmodMixB, 0, Voice11.VFO2.sine, 0);
        AudioConnection        patchCord116(LFOmodMixB, 0, Voice11.VFO2.square, 0);
        AudioConnection        patchCord117(LFOmodMixB, 0, Voice11.VFO2.triangle, 0);
        AudioConnection        patchCord118(LFOmodMixB, 0, Voice11.VFO2.saw, 0);
        AudioConnection        patchCord119(LFOmodMixB, 0, Voice12.VFO2.sine, 0);
        AudioConnection        patchCord120(LFOmodMixB, 0, Voice12.VFO2.square, 0);
        AudioConnection        patchCord121(LFOmodMixB, 0, Voice12.VFO2.triangle, 0);
        AudioConnection        patchCord122(LFOmodMixB, 0, Voice12.VFO2.saw, 0);
        AudioConnection        patchCord123(LFOmodMixB, 0, Voice13.VFO2.sine, 0);
        AudioConnection        patchCord124(LFOmodMixB, 0, Voice13.VFO2.square, 0);
        AudioConnection        patchCord125(LFOmodMixB, 0, Voice13.VFO2.triangle, 0);
        AudioConnection        patchCord126(LFOmodMixB, 0, Voice13.VFO2.saw, 0);
        AudioConnection        patchCord127(LFOmodMixB, 0, Voice14.VFO2.sine, 0);
        AudioConnection        patchCord128(LFOmodMixB, 0, Voice14.VFO2.square, 0);
        AudioConnection        patchCord129(LFOmodMixB, 0, Voice14.VFO2.triangle, 0);
        AudioConnection        patchCord130(LFOmodMixB, 0, Voice14.VFO2.saw, 0);
        AudioConnection        patchCord131(LFOmodMixB, 0, Voice15.VFO2.sine, 0);
        AudioConnection        patchCord132(LFOmodMixB, 0, Voice15.VFO2.square, 0);
        AudioConnection        patchCord133(LFOmodMixB, 0, Voice15.VFO2.triangle, 0);
        AudioConnection        patchCord134(LFOmodMixB, 0, Voice15.VFO2.saw, 0);
        AudioConnection        patchCord135(LFOmodMixB, 0, Voice16.VFO2.sine, 0);
        AudioConnection        patchCord136(LFOmodMixB, 0, Voice16.VFO2.square, 0);
        AudioConnection        patchCord137(LFOmodMixB, 0, Voice16.VFO2.triangle, 0);
        AudioConnection        patchCord138(LFOmodMixB, 0, Voice16.VFO2.saw, 0);
        AudioConnection        patchCord139(LFOfilterMixC, 0, Voice01.VFOfilter, 1);
        AudioConnection        patchCord140(LFOfilterMixC, 0, Voice02.VFOfilter, 1);
        AudioConnection        patchCord141(LFOfilterMixC, 0, Voice03.VFOfilter, 1);
        AudioConnection        patchCord142(LFOfilterMixC, 0, Voice04.VFOfilter, 1);
        AudioConnection        patchCord143(LFOfilterMixC, 0, Voice05.VFOfilter, 1);
        AudioConnection        patchCord144(LFOfilterMixC, 0, Voice06.VFOfilter, 1);
        AudioConnection        patchCord145(LFOfilterMixC, 0, Voice07.VFOfilter, 1);
        AudioConnection        patchCord146(LFOfilterMixC, 0, Voice08.VFOfilter, 1);
        AudioConnection        patchCord147(LFOfilterMixC, 0, Voice09.VFOfilter, 1);
        AudioConnection        patchCord148(LFOfilterMixC, 0, Voice10.VFOfilter, 1);
        AudioConnection        patchCord149(LFOfilterMixC, 0, Voice11.VFOfilter, 1);
        AudioConnection        patchCord150(LFOfilterMixC, 0, Voice12.VFOfilter, 1);
        AudioConnection        patchCord151(LFOfilterMixC, 0, Voice13.VFOfilter, 1);
        AudioConnection        patchCord152(LFOfilterMixC, 0, Voice14.VFOfilter, 1);
        AudioConnection        patchCord153(LFOfilterMixC, 0, Voice15.VFOfilter, 1);
        AudioConnection        patchCord154(LFOfilterMixC, 0, Voice16.VFOfilter, 1);
        AudioConnection        patchCord155(Voice01.VFOfilterMix, 0, Mixer16_1.mixer01_04, 0);
        AudioConnection        patchCord156(Voice02.VFOfilterMix, 0, Mixer16_1.mixer01_04, 1);
        AudioConnection        patchCord157(Voice03.VFOfilterMix, 0, Mixer16_1.mixer01_04, 2);
        AudioConnection        patchCord158(Voice04.VFOfilterMix, 0, Mixer16_1.mixer01_04, 3);
        AudioConnection        patchCord159(Voice05.VFOfilterMix, 0, Mixer16_1.mixer05_08, 0);
        AudioConnection        patchCord160(Voice06.VFOfilterMix, 0, Mixer16_1.mixer05_08, 1);
        AudioConnection        patchCord161(Voice07.VFOfilterMix, 0, Mixer16_1.mixer05_08, 2);
        AudioConnection        patchCord162(Voice08.VFOfilterMix, 0, Mixer16_1.mixer05_08, 3);
        AudioConnection        patchCord163(Voice09.VFOfilterMix, 0, Mixer16_1.mixer09_12, 0);
        AudioConnection        patchCord164(Voice10.VFOfilterMix, 0, Mixer16_1.mixer09_12, 1);
        AudioConnection        patchCord165(Voice11.VFOfilterMix, 0, Mixer16_1.mixer09_12, 2);
        AudioConnection        patchCord166(Voice12.VFOfilterMix, 0, Mixer16_1.mixer09_12, 3);
        AudioConnection        patchCord167(Voice13.VFOfilterMix, 0, Mixer16_1.mixer13_16, 0);
        AudioConnection        patchCord168(Voice14.VFOfilterMix, 0, Mixer16_1.mixer13_16, 1);
        AudioConnection        patchCord169(Voice15.VFOfilterMix, 0, Mixer16_1.mixer13_16, 2);
        AudioConnection        patchCord170(Voice16.VFOfilterMix, 0, Mixer16_1.mixer13_16, 3);
        AudioConnection        patchCord171(Mixer16_1.mixerFinal, 0, amp1, 0);
        AudioConnection        patchCord172(amp1, 0, i2s2, 0);
        AudioConnection        patchCord173(amp1, 0, i2s2, 1);
    }
}

class Voice
{
  public:
    VFO                              VFO1;
    VFO                              VFO2;
    AudioMixer4                      waveMix;
    AudioEffectEnvelope              VFOenvelope;
    AudioFilterStateVariable         VFOfilter;
    AudioMixer4                      VFOenvelopeMix;
    AudioMixer4                      VFOfilterMix;

    Voice() // constructor (this is called when class-object is created)
    {
        AudioConnection        patchCord1(VFO1.mix1, 0, waveMix, 0);
        AudioConnection        patchCord2(VFO1.mix2, 0, waveMix, 1);
        AudioConnection        patchCord3(VFO2.mix1, 0, waveMix, 2);
        AudioConnection        patchCord4(VFO2.mix2, 0, waveMix, 3);
        AudioConnection        patchCord5(waveMix, 0, VFOenvelope, 0);
        AudioConnection        patchCord6(waveMix, 0, VFOenvelopeMix, 0);
        AudioConnection        patchCord7(VFOenvelope, 0, VFOenvelopeMix, 1);
        AudioConnection        patchCord8(VFOfilter, 0, VFOfilterMix, 1);
        AudioConnection        patchCord9(VFOfilter, 1, VFOfilterMix, 2);
        AudioConnection        patchCord10(VFOfilter, 2, VFOfilterMix, 3);
        AudioConnection        patchCord11(VFOenvelopeMix, 0, VFOfilter, 0);
        AudioConnection        patchCord12(VFOenvelopeMix, 0, VFOfilterMix, 0);
    }
}

class VFO
{
  public:
    AudioSynthWaveformModulated      sine;
    AudioSynthWaveformModulated      square;
    AudioSynthWaveformModulated      triangle;
    AudioSynthWaveformModulated      saw;
    AudioSynthKarplusStrong          string;
    AudioSynthNoiseWhite             white;
    AudioSynthNoisePink              pink;
    AudioSynthToneSweep              sweeper;
    AudioMixer4                      mix1;
    AudioMixer4                      mix2;

    VFO() // constructor (this is called when class-object is created)
    {
        AudioConnection        patchCord1(sine, 0, mix1, 0);
        AudioConnection        patchCord2(square, 0, mix1, 1);
        AudioConnection        patchCord3(triangle, 0, mix1, 2);
        AudioConnection        patchCord4(saw, 0, mix1, 3);
        AudioConnection        patchCord5(string, 0, mix2, 0);
        AudioConnection        patchCord6(white, 0, mix2, 1);
        AudioConnection        patchCord7(pink, 0, mix2, 2);
        AudioConnection        patchCord8(sweeper, 0, mix2, 3);
    }
}

class LFO_A
{
  public:
    AudioSynthWaveformDc             pulseFilterDutyCycle;
    AudioSynthWaveformModulated      triangleFilter;
    AudioSynthWaveformModulated      squareFilter;
    AudioSynthWaveformModulated      sineFilter;
    AudioSynthWaveformModulated      pulseFilter;
    AudioMixer4                      filterMix;

    LFO_A() // constructor (this is called when class-object is created)
    {
        AudioConnection        patchCord1(pulseFilterDutyCycle, 0, pulseFilter, 1);
        AudioConnection        patchCord2(triangleFilter, 0, filterMix, 3);
        AudioConnection        patchCord3(squareFilter, 0, filterMix, 1);
        AudioConnection        patchCord4(sineFilter, 0, filterMix, 0);
        AudioConnection        patchCord5(pulseFilter, 0, filterMix, 2);
    }
}

class LFO_B
{
  public:
    AudioSynthWaveformModulated      sampleholdMod;
    AudioSynthWaveformModulated      sawMod;
    AudioMixer4                      modMix;

    LFO_B() // constructor (this is called when class-object is created)
    {
        AudioConnection        patchCord1(sampleholdMod, 0, modMix, 1);
        AudioConnection        patchCord2(sawMod, 0, modMix, 0);
    }
}

class Mixer16
{
  public:
    AudioMixer4                      mixer05_08;
    AudioMixer4                      mixer01_04;
    AudioMixer4                      mixer13_16;
    AudioMixer4                      mixer09_12;
    AudioMixer4                      mixerFinal;

    Mixer16() // constructor (this is called when class-object is created)
    {
        AudioConnection        patchCord1(mixer05_08, 0, mixerFinal, 1);
        AudioConnection        patchCord2(mixer01_04, 0, mixerFinal, 0);
        AudioConnection        patchCord3(mixer13_16, 0, mixerFinal, 3);
        AudioConnection        patchCord4(mixer09_12, 0, mixerFinal, 2);
    }
}
// GUItool: end automatically generated code
