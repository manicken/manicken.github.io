//
//  Teensy MIDI (16-note / 2-voice) Polyphonic Synthesizer - version 4.3 dated 20200522-1235
//
//    - written by Mark J Culross (KD5RXT)
//
//    - can read MIDI data & controls/commands from any of three sources:
//         1) traditional (serial) MIDI thru the MIDI DIN plugs/cables
//         1) USB MIDI (play MIDI files from PC thru this MIDI device)
//         3) connect a MIDI device (keyboard) the the USB Host of this device
//
//    - plays the indicated note(s) in two voices, with the specified audio characteristics
//
//    - appears as MIDI device "Teensy16PolySynth"
//
//  See documentation on MIDI callbacks here:
//     https://github.com/FortySevenEffects/arduino_midi_library/wiki/Using-Callbacks
//
//
//  Arduino IDE Configuration:
//     Tools/Board:           "Teensy 4.0"
//     Tools/USB Type:        "Serial + MIDI"
//     Tools/CPU Speed:       "600MHz"
//     Tools/Optimize:        "Fastest"
//     Tools/Keyboard Layout: "US English"
//     Tools/Port:            "COMx Serial (Teensy 4.0)"
//

#define TITLE    ("Teensy MIDI (16-note / 2-voice) Polyphonic Synthesizer")
#define DEVICE   ("   - appears as MIDI device : \"Teensy16PolySynth\"")
#define VERDAT   ("   - firmware version       : 4.3 dated 20200522-1235")
#define AUTHOR   ("   - designed & written by  : Mark J Culross (KD5RXT)")

#define MAJOR_REV 4
#define MINOR_REV 3

//#define CHECK_CYCLE_TIME                // uncomment to show how quickly the pots/puhbuttons are sampled
//#define DEBUG_MEMORY_USAGE              // uncomment to show audio buffer usage
//#define DEBUG_NOTE_MSGS                 // uncomment to show all MIDI noteOn/noteOff message activities
//#define DEBUG_CC_MSGS                   // uncomment to show all MIDI CC message activities
//#define DEBUG_POTS                      // uncomment to show specifics of pot sampling
//#define DEBUG_PBUTTONS                  // uncomment to show specifics of pushbutton sampling
//#define DEBUG_EEPROM_WRITE              // uncomment to show specifics of EEPROM writes
//#define DEBUG_EEPROM_READ               // uncomment to show specifics of EEPROM writes
//#define DEBUG_MAKE_NOTE_AVAILABLE       // uncomment to show specifics of when notes are deallocated & made available
#define DEBUG_MAXIMUM_NOTES             // uncomment to show a scrolling graph of note allocation/deallocation
#define DEBUG_DROPPED_NOTES             // uncomment to show when notes are ignored (exceeded 16-poly notes)
#define DISABLE_POT_READ                // uncomment to not read any pots (for running Teensy + Audio Shield w/o the actual TeensyMIDIPolySynth hardware)
#define DISABLE_PB_READ                 // uncomment to not read any pushbuttons (for running Teensy + Audio Shield w/o the actual TeensyMIDIPolySynth hardware)
#define DISABLE_EEPROM_READ             // uncomment to not read settings from EEPROM (for running Teensy + Audio Shield w/o the actual TeensyMIDIPolySynth hardware)
#define DISABLE_EEPROM_WRITE            // uncomment to not write settings to EEPROM (for running Teensy + Audio Shield w/o the actual TeensyMIDIPolySynth hardware)
#define SKIP_LED_TEST                   // uncomment to not test the LEDs (for running Teensy + Audio Shield w/o the actual TeensyMIDIPolySynth hardware)

// the absolute maximum polyphony (16-note - this should NEVER change)
#define MAX_POLY 16

// the polyphony at runtime (set to a lower value for testing limits/dropped notes/etc. - NEVER set higher than MAX_POLY)
#define LIMIT_POLY 16

#include <USBHost_t36.h>

#include <MIDI.h>
#include "pitches.h"

#include <EEPROM.h>

#include <Audio.h>

// GUItool: begin automatically generated code
AudioSynthWaveformModulated LFOsineMod;     //xy=148,20
AudioSynthWaveformModulated LFOsquareMod;   //xy=148,55
AudioSynthWaveformModulated LFOpulseMod;    //xy=148,90
AudioSynthWaveformDc     LFOpulseModDutyCycle; //xy=148,125
AudioSynthWaveformModulated LFOtriangleMod; //xy=148,160
AudioSynthWaveformModulated LFOsawMod;      //xy=148,195
AudioSynthWaveformModulated LFOsampleholdMod; //xy=148,230
AudioSynthWaveformModulated LFOsineFilter;  //xy=148,320
AudioSynthWaveformModulated LFOsquareFilter; //xy=148,355
AudioSynthWaveformModulated LFOpulseFilter; //xy=148,390
AudioSynthWaveformDc     LFOpulseFilterDutyCycle; //xy=148,425
AudioSynthWaveformModulated LFOtriangleFilter; //xy=148,460
AudioSynthWaveformModulated LFOsawFilter;   //xy=148,495
AudioSynthWaveformModulated LFOsampleholdFilter; //xy=148,530
AudioSynthWaveformDc     VFOtuningA;     //xy=436,260
AudioSynthWaveformDc     VFOtuningB;     //xy=436,300
AudioMixer4              LFOmodMix1_1;   //xy=438,106
AudioMixer4              LFOmodMix1_2;   //xy=438,179
AudioMixer4              LFOfilterMix1_1; //xy=438,406
AudioMixer4              LFOfilterMix1_2; //xy=438,479
AudioSynthWaveformDc     PBend;          //xy=445,340
AudioMixer4              LFOmodMixA;     //xy=758,105
AudioMixer4              LFOmodMixB;     //xy=758,179
AudioMixer4              LFOfilterMix1_3; //xy=758,425
AudioSynthWaveformModulated VFOsine01A;     //xy=1163,20
AudioSynthWaveformModulated VFOsquare01A;   //xy=1163,55
AudioSynthWaveformModulated VFOtriangle01A; //xy=1163,90
AudioSynthWaveformModulated VFOsaw01A;      //xy=1163,125
AudioSynthKarplusStrong  VFOstring01A;   //xy=1163,160
AudioSynthNoiseWhite     VFOwhite01A;    //xy=1163,195
AudioSynthNoisePink      VFOpink01A;     //xy=1163,230
AudioSynthToneSweep      VFOsweep01A;    //xy=1163,265
AudioSynthWaveformModulated VFOsine02A;     //xy=1163,320
AudioSynthWaveformModulated VFOsquare02A;   //xy=1163,355
AudioSynthWaveformModulated VFOtriangle02A; //xy=1163,390
AudioSynthWaveformModulated VFOsaw02A;      //xy=1163,425
AudioSynthKarplusStrong  VFOstring02A;   //xy=1163,460
AudioSynthNoiseWhite     VFOwhite02A;    //xy=1163,495
AudioSynthNoisePink      VFOpink02A;     //xy=1163,530
AudioSynthToneSweep      VFOsweep02A;    //xy=1163,565
AudioSynthWaveformModulated VFOsine03A;     //xy=1163,620
AudioSynthWaveformModulated VFOsquare03A;   //xy=1163,655
AudioSynthWaveformModulated VFOtriangle03A; //xy=1163,690
AudioSynthWaveformModulated VFOsaw03A;      //xy=1163,725
AudioSynthKarplusStrong  VFOstring03A;   //xy=1163,760
AudioSynthNoiseWhite     VFOwhite03A;    //xy=1163,795
AudioSynthNoisePink      VFOpink03A;     //xy=1163,830
AudioSynthToneSweep      VFOsweep03A;    //xy=1163,865
AudioSynthWaveformModulated VFOsine04A;     //xy=1163,920
AudioSynthWaveformModulated VFOsquare04A;   //xy=1163,955
AudioSynthWaveformModulated VFOtriangle04A; //xy=1163,990
AudioSynthWaveformModulated VFOsaw04A;      //xy=1163,1025
AudioSynthKarplusStrong  VFOstring04A;   //xy=1163,1060
AudioSynthNoiseWhite     VFOwhite04A;    //xy=1163,1095
AudioSynthNoisePink      VFOpink04A;     //xy=1163,1130
AudioSynthToneSweep      VFOsweep04A;    //xy=1163,1165
AudioSynthWaveformModulated VFOsine05A;     //xy=1163,1220
AudioSynthWaveformModulated VFOsquare05A;   //xy=1163,1255
AudioSynthWaveformModulated VFOtriangle05A; //xy=1163,1290
AudioSynthWaveformModulated VFOsaw05A;      //xy=1163,1325
AudioSynthKarplusStrong  VFOstring05A;   //xy=1163,1360
AudioSynthNoiseWhite     VFOwhite05A;    //xy=1163,1395
AudioSynthNoisePink      VFOpink05A;     //xy=1163,1430
AudioSynthToneSweep      VFOsweep05A;    //xy=1163,1465
AudioSynthWaveformModulated VFOsine06A;     //xy=1163,1520
AudioSynthWaveformModulated VFOsquare06A;   //xy=1163,1555
AudioSynthWaveformModulated VFOtriangle06A; //xy=1163,1590
AudioSynthWaveformModulated VFOsaw06A;      //xy=1163,1625
AudioSynthKarplusStrong  VFOstring06A;   //xy=1163,1660
AudioSynthNoiseWhite     VFOwhite06A;    //xy=1163,1695
AudioSynthNoisePink      VFOpink06A;     //xy=1163,1730
AudioSynthToneSweep      VFOsweep06A;    //xy=1163,1765
AudioSynthWaveformModulated VFOsine07A;     //xy=1163,1820
AudioSynthWaveformModulated VFOsquare07A;   //xy=1163,1855
AudioSynthWaveformModulated VFOtriangle07A; //xy=1163,1890
AudioSynthWaveformModulated VFOsaw07A;      //xy=1163,1925
AudioSynthKarplusStrong  VFOstring07A;   //xy=1163,1960
AudioSynthNoiseWhite     VFOwhite07A;    //xy=1163,1995
AudioSynthNoisePink      VFOpink07A;     //xy=1163,2030
AudioSynthToneSweep      VFOsweep07A;    //xy=1163,2065
AudioSynthWaveformModulated VFOsine08A;     //xy=1163,2120
AudioSynthWaveformModulated VFOsquare08A;   //xy=1163,2155
AudioSynthWaveformModulated VFOtriangle08A; //xy=1163,2190
AudioSynthWaveformModulated VFOsaw08A;      //xy=1163,2225
AudioSynthKarplusStrong  VFOstring08A;   //xy=1163,2260
AudioSynthNoiseWhite     VFOwhite08A;    //xy=1163,2295
AudioSynthNoisePink      VFOpink08A;     //xy=1163,2330
AudioSynthToneSweep      VFOsweep08A;    //xy=1163,2365
AudioSynthWaveformModulated VFOsine09A;     //xy=1163,2420
AudioSynthWaveformModulated VFOsquare09A;   //xy=1163,2455
AudioSynthWaveformModulated VFOtriangle09A; //xy=1163,2490
AudioSynthWaveformModulated VFOsaw09A;      //xy=1163,2525
AudioSynthKarplusStrong  VFOstring09A;   //xy=1163,2560
AudioSynthNoiseWhite     VFOwhite09A;    //xy=1163,2595
AudioSynthNoisePink      VFOpink09A;     //xy=1163,2630
AudioSynthToneSweep      VFOsweep09A;    //xy=1163,2665
AudioSynthWaveformModulated VFOsine10A;     //xy=1163,2720
AudioSynthWaveformModulated VFOsquare10A;   //xy=1163,2755
AudioSynthWaveformModulated VFOtriangle10A; //xy=1163,2790
AudioSynthWaveformModulated VFOsaw10A;      //xy=1163,2825
AudioSynthKarplusStrong  VFOstring10A;   //xy=1163,2860
AudioSynthNoiseWhite     VFOwhite10A;    //xy=1163,2895
AudioSynthNoisePink      VFOpink10A;     //xy=1163,2930
AudioSynthToneSweep      VFOsweep10A;    //xy=1163,2965
AudioSynthWaveformModulated VFOsine11A;     //xy=1163,3020
AudioSynthWaveformModulated VFOsquare11A;   //xy=1163,3055
AudioSynthWaveformModulated VFOtriangle11A; //xy=1163,3090
AudioSynthWaveformModulated VFOsaw11A;      //xy=1163,3125
AudioSynthKarplusStrong  VFOstring11A;   //xy=1163,3160
AudioSynthNoiseWhite     VFOwhite11A;    //xy=1163,3195
AudioSynthNoisePink      VFOpink11A;     //xy=1163,3230
AudioSynthToneSweep      VFOsweep11A;    //xy=1163,3265
AudioSynthWaveformModulated VFOsine12A;     //xy=1163,3320
AudioSynthWaveformModulated VFOsquare12A;   //xy=1163,3355
AudioSynthWaveformModulated VFOtriangle12A; //xy=1163,3390
AudioSynthWaveformModulated VFOsaw12A;      //xy=1163,3425
AudioSynthKarplusStrong  VFOstring12A;   //xy=1163,3460
AudioSynthNoiseWhite     VFOwhite12A;    //xy=1163,3495
AudioSynthNoisePink      VFOpink12A;     //xy=1163,3530
AudioSynthToneSweep      VFOsweep12A;    //xy=1163,3565
AudioSynthWaveformModulated VFOsine13A;     //xy=1163,3620
AudioSynthWaveformModulated VFOsquare13A;   //xy=1163,3655
AudioSynthWaveformModulated VFOtriangle13A; //xy=1163,3690
AudioSynthWaveformModulated VFOsaw13A;      //xy=1163,3725
AudioSynthKarplusStrong  VFOstring13A;   //xy=1163,3760
AudioSynthNoiseWhite     VFOwhite13A;    //xy=1163,3795
AudioSynthNoisePink      VFOpink13A;     //xy=1163,3830
AudioSynthToneSweep      VFOsweep13A;    //xy=1163,3865
AudioSynthWaveformModulated VFOsine14A;     //xy=1163,3920
AudioSynthWaveformModulated VFOsquare14A;   //xy=1163,3955
AudioSynthWaveformModulated VFOtriangle14A; //xy=1163,3990
AudioSynthWaveformModulated VFOsaw14A;      //xy=1163,4025
AudioSynthKarplusStrong  VFOstring14A;   //xy=1163,4060
AudioSynthNoiseWhite     VFOwhite14A;    //xy=1163,4095
AudioSynthNoisePink      VFOpink14A;     //xy=1163,4130
AudioSynthToneSweep      VFOsweep14A;    //xy=1163,4165
AudioSynthWaveformModulated VFOsine15A;     //xy=1163,4220
AudioSynthWaveformModulated VFOsquare15A;   //xy=1163,4255
AudioSynthWaveformModulated VFOtriangle15A; //xy=1163,4290
AudioSynthWaveformModulated VFOsaw15A;      //xy=1163,4325
AudioSynthKarplusStrong  VFOstring15A;   //xy=1163,4360
AudioSynthNoiseWhite     VFOwhite15A;    //xy=1163,4395
AudioSynthNoisePink      VFOpink15A;     //xy=1163,4430
AudioSynthToneSweep      VFOsweep15A;    //xy=1163,4465
AudioSynthWaveformModulated VFOsine16A;     //xy=1163,4520
AudioSynthWaveformModulated VFOsquare16A;   //xy=1163,4555
AudioSynthWaveformModulated VFOtriangle16A; //xy=1163,4590
AudioSynthWaveformModulated VFOsaw16A;      //xy=1163,4625
AudioSynthKarplusStrong  VFOstring16A;   //xy=1163,4660
AudioSynthNoiseWhite     VFOwhite16A;    //xy=1163,4695
AudioSynthNoisePink      VFOpink16A;     //xy=1163,4730
AudioSynthToneSweep      VFOsweep16A;    //xy=1163,4765
AudioMixer4              waveMix01_1A;   //xy=1413,106
AudioMixer4              waveMix01_2A;   //xy=1413,179
AudioMixer4              waveMix02_1A;   //xy=1413,406
AudioMixer4              waveMix02_2A;   //xy=1413,479
AudioMixer4              waveMix03_1A;   //xy=1413,706
AudioMixer4              waveMix03_2A;   //xy=1413,779
AudioMixer4              waveMix04_1A;   //xy=1413,1006
AudioMixer4              waveMix04_2A;   //xy=1413,1079
AudioMixer4              waveMix05_1A;   //xy=1413,1306
AudioMixer4              waveMix05_2A;   //xy=1413,1379
AudioMixer4              waveMix06_1A;   //xy=1413,1606
AudioMixer4              waveMix06_2A;   //xy=1413,1679
AudioMixer4              waveMix07_1A;   //xy=1413,1906
AudioMixer4              waveMix07_2A;   //xy=1413,1979
AudioMixer4              waveMix08_1A;   //xy=1413,2206
AudioMixer4              waveMix08_2A;   //xy=1413,2279
AudioMixer4              waveMix09_1A;   //xy=1413,2506
AudioMixer4              waveMix09_2A;   //xy=1413,2579
AudioMixer4              waveMix10_1A;   //xy=1413,2806
AudioMixer4              waveMix10_2A;   //xy=1413,2879
AudioMixer4              waveMix11_1A;   //xy=1413,3106
AudioMixer4              waveMix11_2A;   //xy=1413,3179
AudioMixer4              waveMix12_1A;   //xy=1413,3406
AudioMixer4              waveMix12_2A;   //xy=1413,3479
AudioMixer4              waveMix13_1A;   //xy=1413,3706
AudioMixer4              waveMix13_2A;   //xy=1413,3779
AudioMixer4              waveMix14_1A;   //xy=1413,4006
AudioMixer4              waveMix14_2A;   //xy=1413,4079
AudioMixer4              waveMix15_1A;   //xy=1413,4306
AudioMixer4              waveMix15_2A;   //xy=1413,4379
AudioMixer4              waveMix16_1A;   //xy=1413,4606
AudioMixer4              waveMix16_2A;   //xy=1413,4679
AudioSynthWaveformModulated VFOsine01B;     //xy=1663,140
AudioSynthWaveformModulated VFOsquare01B;   //xy=1663,175
AudioSynthWaveformModulated VFOtriangle01B; //xy=1663,210
AudioSynthWaveformModulated VFOsaw01B;      //xy=1663,245
AudioSynthKarplusStrong  VFOstring01B;   //xy=1663,280
AudioSynthNoiseWhite     VFOwhite01B;    //xy=1663,315
AudioSynthNoisePink      VFOpink01B;     //xy=1663,350
AudioSynthToneSweep      VFOsweep01B;    //xy=1663,385
AudioSynthWaveformModulated VFOsine02B;     //xy=1663,440
AudioSynthWaveformModulated VFOsquare02B;   //xy=1663,475
AudioSynthWaveformModulated VFOtriangle02B; //xy=1663,510
AudioSynthWaveformModulated VFOsaw02B;      //xy=1663,545
AudioSynthKarplusStrong  VFOstring02B;   //xy=1663,580
AudioSynthNoiseWhite     VFOwhite02B;    //xy=1663,615
AudioSynthNoisePink      VFOpink02B;     //xy=1663,650
AudioSynthToneSweep      VFOsweep02B;    //xy=1663,685
AudioSynthWaveformModulated VFOsine03B;     //xy=1663,740
AudioSynthWaveformModulated VFOsquare03B;   //xy=1663,775
AudioSynthWaveformModulated VFOtriangle03B; //xy=1663,810
AudioSynthWaveformModulated VFOsaw03B;      //xy=1663,845
AudioSynthKarplusStrong  VFOstring03B;   //xy=1663,880
AudioSynthNoiseWhite     VFOwhite03B;    //xy=1663,915
AudioSynthNoisePink      VFOpink03B;     //xy=1663,950
AudioSynthToneSweep      VFOsweep03B;    //xy=1663,985
AudioSynthWaveformModulated VFOsine04B;     //xy=1663,1040
AudioSynthWaveformModulated VFOsquare04B;   //xy=1663,1075
AudioSynthWaveformModulated VFOtriangle04B; //xy=1663,1110
AudioSynthWaveformModulated VFOsaw04B;      //xy=1663,1145
AudioSynthKarplusStrong  VFOstring04B;   //xy=1663,1180
AudioSynthNoiseWhite     VFOwhite04B;    //xy=1663,1215
AudioSynthNoisePink      VFOpink04B;     //xy=1663,1250
AudioSynthToneSweep      VFOsweep04B;    //xy=1663,1285
AudioSynthWaveformModulated VFOsine05B;     //xy=1663,1340
AudioSynthWaveformModulated VFOsquare05B;   //xy=1663,1375
AudioSynthWaveformModulated VFOtriangle05B; //xy=1663,1410
AudioSynthWaveformModulated VFOsaw05B;      //xy=1663,1445
AudioSynthKarplusStrong  VFOstring05B;   //xy=1663,1480
AudioSynthNoiseWhite     VFOwhite05B;    //xy=1663,1515
AudioSynthNoisePink      VFOpink05B;     //xy=1663,1550
AudioSynthToneSweep      VFOsweep05B;    //xy=1663,1585
AudioSynthWaveformModulated VFOsine06B;     //xy=1663,1640
AudioSynthWaveformModulated VFOsquare06B;   //xy=1663,1675
AudioSynthWaveformModulated VFOtriangle06B; //xy=1663,1710
AudioSynthWaveformModulated VFOsaw06B;      //xy=1663,1745
AudioSynthKarplusStrong  VFOstring06B;   //xy=1663,1780
AudioSynthNoiseWhite     VFOwhite06B;    //xy=1663,1815
AudioSynthNoisePink      VFOpink06B;     //xy=1663,1850
AudioSynthToneSweep      VFOsweep06B;    //xy=1663,1885
AudioSynthWaveformModulated VFOsine07B;     //xy=1663,1940
AudioSynthWaveformModulated VFOsquare07B;   //xy=1663,1975
AudioSynthWaveformModulated VFOtriangle07B; //xy=1663,2010
AudioSynthWaveformModulated VFOsaw07B;      //xy=1663,2045
AudioSynthKarplusStrong  VFOstring07B;   //xy=1663,2080
AudioSynthNoiseWhite     VFOwhite07B;    //xy=1663,2115
AudioSynthNoisePink      VFOpink07B;     //xy=1663,2150
AudioSynthToneSweep      VFOsweep07B;    //xy=1663,2185
AudioSynthWaveformModulated VFOsine08B;     //xy=1663,2240
AudioSynthWaveformModulated VFOsquare08B;   //xy=1663,2275
AudioSynthWaveformModulated VFOtriangle08B; //xy=1663,2310
AudioSynthWaveformModulated VFOsaw08B;      //xy=1663,2345
AudioSynthKarplusStrong  VFOstring08B;   //xy=1663,2380
AudioSynthNoiseWhite     VFOwhite08B;    //xy=1663,2415
AudioSynthNoisePink      VFOpink08B;     //xy=1663,2450
AudioSynthToneSweep      VFOsweep08B;    //xy=1663,2485
AudioSynthWaveformModulated VFOsine09B;     //xy=1663,2540
AudioSynthWaveformModulated VFOsquare09B;   //xy=1663,2575
AudioSynthWaveformModulated VFOtriangle09B; //xy=1663,2610
AudioSynthWaveformModulated VFOsaw09B;      //xy=1663,2645
AudioSynthKarplusStrong  VFOstring09B;   //xy=1663,2680
AudioSynthNoiseWhite     VFOwhite09B;    //xy=1663,2715
AudioSynthNoisePink      VFOpink09B;     //xy=1663,2750
AudioSynthToneSweep      VFOsweep09B;    //xy=1663,2785
AudioSynthWaveformModulated VFOsine10B;     //xy=1663,2840
AudioSynthWaveformModulated VFOsquare10B;   //xy=1663,2875
AudioSynthWaveformModulated VFOtriangle10B; //xy=1663,2910
AudioSynthWaveformModulated VFOsaw10B;      //xy=1663,2945
AudioSynthKarplusStrong  VFOstring10B;   //xy=1663,2980
AudioSynthNoiseWhite     VFOwhite10B;    //xy=1663,3015
AudioSynthNoisePink      VFOpink10B;     //xy=1663,3050
AudioSynthToneSweep      VFOsweep10B;    //xy=1663,3085
AudioSynthWaveformModulated VFOsine11B;     //xy=1663,3140
AudioSynthWaveformModulated VFOsquare11B;   //xy=1663,3175
AudioSynthWaveformModulated VFOtriangle11B; //xy=1663,3210
AudioSynthWaveformModulated VFOsaw11B;      //xy=1663,3245
AudioSynthKarplusStrong  VFOstring11B;   //xy=1663,3280
AudioSynthNoiseWhite     VFOwhite11B;    //xy=1663,3315
AudioSynthNoisePink      VFOpink11B;     //xy=1663,3350
AudioSynthToneSweep      VFOsweep11B;    //xy=1663,3385
AudioSynthWaveformModulated VFOsine12B;     //xy=1663,3440
AudioSynthWaveformModulated VFOsquare12B;   //xy=1663,3475
AudioSynthWaveformModulated VFOtriangle12B; //xy=1663,3510
AudioSynthWaveformModulated VFOsaw12B;      //xy=1663,3545
AudioSynthKarplusStrong  VFOstring12B;   //xy=1663,3580
AudioSynthNoiseWhite     VFOwhite12B;    //xy=1663,3615
AudioSynthNoisePink      VFOpink12B;     //xy=1663,3650
AudioSynthToneSweep      VFOsweep12B;    //xy=1663,3685
AudioSynthWaveformModulated VFOsine13B;     //xy=1663,3740
AudioSynthWaveformModulated VFOsquare13B;   //xy=1663,3775
AudioSynthWaveformModulated VFOtriangle13B; //xy=1663,3810
AudioSynthWaveformModulated VFOsaw13B;      //xy=1663,3845
AudioSynthKarplusStrong  VFOstring13B;   //xy=1663,3880
AudioSynthNoiseWhite     VFOwhite13B;    //xy=1663,3915
AudioSynthNoisePink      VFOpink13B;     //xy=1663,3950
AudioSynthToneSweep      VFOsweep13B;    //xy=1663,3985
AudioSynthWaveformModulated VFOsine14B;     //xy=1663,4040
AudioSynthWaveformModulated VFOsquare14B;   //xy=1663,4075
AudioSynthWaveformModulated VFOtriangle14B; //xy=1663,4110
AudioSynthWaveformModulated VFOsaw14B;      //xy=1663,4145
AudioSynthKarplusStrong  VFOstring14B;   //xy=1663,4180
AudioSynthNoiseWhite     VFOwhite14B;    //xy=1663,4215
AudioSynthNoisePink      VFOpink14B;     //xy=1663,4250
AudioSynthToneSweep      VFOsweep14B;    //xy=1663,4285
AudioSynthWaveformModulated VFOsine15B;     //xy=1663,4340
AudioSynthWaveformModulated VFOsquare15B;   //xy=1663,4375
AudioSynthWaveformModulated VFOtriangle15B; //xy=1663,4410
AudioSynthWaveformModulated VFOsaw15B;      //xy=1663,4445
AudioSynthKarplusStrong  VFOstring15B;   //xy=1663,4480
AudioSynthNoiseWhite     VFOwhite15B;    //xy=1663,4515
AudioSynthNoisePink      VFOpink15B;     //xy=1663,4550
AudioSynthToneSweep      VFOsweep15B;    //xy=1663,4585
AudioSynthWaveformModulated VFOsine16B;     //xy=1663,4640
AudioSynthWaveformModulated VFOsquare16B;   //xy=1663,4675
AudioSynthWaveformModulated VFOtriangle16B; //xy=1663,4710
AudioSynthWaveformModulated VFOsaw16B;      //xy=1663,4745
AudioSynthKarplusStrong  VFOstring16B;   //xy=1663,4780
AudioSynthNoiseWhite     VFOwhite16B;    //xy=1663,4815
AudioSynthNoisePink      VFOpink16B;     //xy=1663,4850
AudioSynthToneSweep      VFOsweep16B;    //xy=1663,4885
AudioMixer4              waveMix01_1B;   //xy=1913,226
AudioMixer4              waveMix01_2B;   //xy=1913,299
AudioMixer4              waveMix02_1B;   //xy=1913,526
AudioMixer4              waveMix02_2B;   //xy=1913,599
AudioMixer4              waveMix03_1B;   //xy=1913,826
AudioMixer4              waveMix03_2B;   //xy=1913,899
AudioMixer4              waveMix04_1B;   //xy=1913,1126
AudioMixer4              waveMix04_2B;   //xy=1913,1199
AudioMixer4              waveMix05_1B;   //xy=1913,1426
AudioMixer4              waveMix05_2B;   //xy=1913,1499
AudioMixer4              waveMix06_1B;   //xy=1913,1726
AudioMixer4              waveMix06_2B;   //xy=1913,1799
AudioMixer4              waveMix07_1B;   //xy=1913,2026
AudioMixer4              waveMix07_2B;   //xy=1913,2099
AudioMixer4              waveMix08_1B;   //xy=1913,2326
AudioMixer4              waveMix08_2B;   //xy=1913,2399
AudioMixer4              waveMix09_1B;   //xy=1913,2626
AudioMixer4              waveMix09_2B;   //xy=1913,2699
AudioMixer4              waveMix10_1B;   //xy=1913,2926
AudioMixer4              waveMix10_2B;   //xy=1913,2999
AudioMixer4              waveMix11_1B;   //xy=1913,3226
AudioMixer4              waveMix11_2B;   //xy=1913,3299
AudioMixer4              waveMix12_1B;   //xy=1913,3526
AudioMixer4              waveMix12_2B;   //xy=1913,3599
AudioMixer4              waveMix13_1B;   //xy=1913,3826
AudioMixer4              waveMix13_2B;   //xy=1913,3899
AudioMixer4              waveMix14_1B;   //xy=1913,4126
AudioMixer4              waveMix14_2B;   //xy=1913,4199
AudioMixer4              waveMix15_1B;   //xy=1913,4426
AudioMixer4              waveMix15_2B;   //xy=1913,4499
AudioMixer4              waveMix16_1B;   //xy=1913,4726
AudioMixer4              waveMix16_2B;   //xy=1913,4799
AudioMixer4              waveMix01_3A;   //xy=2173,125
AudioMixer4              waveMix02_3A;   //xy=2173,425
AudioMixer4              waveMix03_3A;   //xy=2173,725
AudioMixer4              waveMix04_3A;   //xy=2173,1025
AudioMixer4              waveMix05_3A;   //xy=2173,1325
AudioMixer4              waveMix06_3A;   //xy=2173,1625
AudioMixer4              waveMix07_3A;   //xy=2173,1925
AudioMixer4              waveMix08_3A;   //xy=2173,2225
AudioMixer4              waveMix09_3A;   //xy=2173,2525
AudioMixer4              waveMix10_3A;   //xy=2173,2825
AudioMixer4              waveMix11_3A;   //xy=2173,3125
AudioMixer4              waveMix12_3A;   //xy=2173,3425
AudioMixer4              waveMix13_3A;   //xy=2173,3725
AudioMixer4              waveMix14_3A;   //xy=2173,4025
AudioMixer4              waveMix15_3A;   //xy=2173,4325
AudioMixer4              waveMix16_3A;   //xy=2173,4625
AudioEffectEnvelope      VFOenvelope01;  //xy=2323,251
AudioEffectEnvelope      VFOenvelope02;  //xy=2323,551
AudioEffectEnvelope      VFOenvelope03;  //xy=2323,851
AudioEffectEnvelope      VFOenvelope04;  //xy=2323,1151
AudioEffectEnvelope      VFOenvelope05;  //xy=2323,1451
AudioEffectEnvelope      VFOenvelope06;  //xy=2323,1751
AudioEffectEnvelope      VFOenvelope07;  //xy=2323,2051
AudioEffectEnvelope      VFOenvelope08;  //xy=2323,2351
AudioEffectEnvelope      VFOenvelope09;  //xy=2323,2651
AudioEffectEnvelope      VFOenvelope10;  //xy=2323,2951
AudioEffectEnvelope      VFOenvelope11;  //xy=2323,3251
AudioEffectEnvelope      VFOenvelope12;  //xy=2323,3551
AudioEffectEnvelope      VFOenvelope13;  //xy=2323,3851
AudioEffectEnvelope      VFOenvelope14;  //xy=2323,4151
AudioEffectEnvelope      VFOenvelope15;  //xy=2323,4451
AudioEffectEnvelope      VFOenvelope16;  //xy=2323,4751
AudioMixer4              VFOenvelopeMix01; //xy=2508,145
AudioMixer4              VFOenvelopeMix02; //xy=2508,445
AudioMixer4              VFOenvelopeMix03; //xy=2508,745
AudioMixer4              VFOenvelopeMix04; //xy=2508,1045
AudioMixer4              VFOenvelopeMix05; //xy=2508,1345
AudioMixer4              VFOenvelopeMix06; //xy=2508,1645
AudioMixer4              VFOenvelopeMix07; //xy=2508,1945
AudioMixer4              VFOenvelopeMix08; //xy=2508,2245
AudioMixer4              VFOenvelopeMix09; //xy=2508,2545
AudioMixer4              VFOenvelopeMix10; //xy=2508,2845
AudioMixer4              VFOenvelopeMix11; //xy=2508,3145
AudioMixer4              VFOenvelopeMix12; //xy=2508,3445
AudioMixer4              VFOenvelopeMix13; //xy=2508,3745
AudioMixer4              VFOenvelopeMix14; //xy=2508,4045
AudioMixer4              VFOenvelopeMix15; //xy=2508,4345
AudioMixer4              VFOenvelopeMix16; //xy=2508,4645
AudioFilterStateVariable VFOfilter01;    //xy=2663,245
AudioFilterStateVariable VFOfilter02;    //xy=2663,545
AudioFilterStateVariable VFOfilter03;    //xy=2663,845
AudioFilterStateVariable VFOfilter04;    //xy=2663,1145
AudioFilterStateVariable VFOfilter05;    //xy=2663,1445
AudioFilterStateVariable VFOfilter06;    //xy=2663,1745
AudioFilterStateVariable VFOfilter07;    //xy=2663,2045
AudioFilterStateVariable VFOfilter08;    //xy=2663,2345
AudioFilterStateVariable VFOfilter09;    //xy=2663,2645
AudioFilterStateVariable VFOfilter10;    //xy=2663,2945
AudioFilterStateVariable VFOfilter11;    //xy=2663,3245
AudioFilterStateVariable VFOfilter12;    //xy=2663,3545
AudioFilterStateVariable VFOfilter13;    //xy=2663,3845
AudioFilterStateVariable VFOfilter14;    //xy=2663,4145
AudioFilterStateVariable VFOfilter15;    //xy=2663,4445
AudioFilterStateVariable VFOfilter16;    //xy=2663,4745
AudioMixer4              VFOfilterMix01; //xy=2863,240
AudioMixer4              VFOfilterMix02; //xy=2863,540
AudioMixer4              VFOfilterMix03; //xy=2863,840
AudioMixer4              VFOfilterMix04; //xy=2863,1140
AudioMixer4              VFOfilterMix05; //xy=2863,1440
AudioMixer4              VFOfilterMix06; //xy=2863,1740
AudioMixer4              VFOfilterMix07; //xy=2863,2040
AudioMixer4              VFOfilterMix08; //xy=2863,2340
AudioMixer4              VFOfilterMix09; //xy=2863,2640
AudioMixer4              VFOfilterMix10; //xy=2863,2940
AudioMixer4              VFOfilterMix11; //xy=2863,3240
AudioMixer4              VFOfilterMix12; //xy=2863,3540
AudioMixer4              VFOfilterMix13; //xy=2863,3840
AudioMixer4              VFOfilterMix14; //xy=2863,4140
AudioMixer4              VFOfilterMix15; //xy=2863,4440
AudioMixer4              VFOfilterMix16; //xy=2863,4740
AudioMixer4              mixStage2_1A;   //xy=3214,690
AudioMixer4              mixStage2_2A;   //xy=3214,1890
AudioMixer4              mixStage2_3A;   //xy=3214,3090
AudioMixer4              mixStage2_4A;   //xy=3214,4290
AudioMixer4              finalMix1A;     //xy=3489,2490
//AudioAmplifier           USBamp;         //xy=3683,2532
AudioOutputI2S           i2s1;           //xy=3869,2450
//AudioOutputUSB           usb1;           //xy=3869,2530
AudioConnection          patchCord1(LFOsineMod, 0, LFOmodMix1_1, 0);
AudioConnection          patchCord2(LFOsquareMod, 0, LFOmodMix1_1, 1);
AudioConnection          patchCord3(LFOpulseMod, 0, LFOmodMix1_1, 2);
AudioConnection          patchCord4(LFOpulseModDutyCycle, 0, LFOpulseMod, 1);
AudioConnection          patchCord5(LFOtriangleMod, 0, LFOmodMix1_1, 3);
AudioConnection          patchCord6(LFOsawMod, 0, LFOmodMix1_2, 0);
AudioConnection          patchCord7(LFOsampleholdMod, 0, LFOmodMix1_2, 1);
AudioConnection          patchCord8(LFOsineFilter, 0, LFOfilterMix1_1, 0);
AudioConnection          patchCord9(LFOsquareFilter, 0, LFOfilterMix1_1, 1);
AudioConnection          patchCord10(LFOpulseFilter, 0, LFOfilterMix1_1, 2);
AudioConnection          patchCord11(LFOpulseFilterDutyCycle, 0, LFOpulseFilter, 1);
AudioConnection          patchCord12(LFOtriangleFilter, 0, LFOfilterMix1_1, 3);
AudioConnection          patchCord13(LFOsawFilter, 0, LFOfilterMix1_2, 0);
AudioConnection          patchCord14(LFOsampleholdFilter, 0, LFOfilterMix1_2, 1);
AudioConnection          patchCord15(VFOtuningA, 0, LFOmodMixA, 2);
AudioConnection          patchCord16(VFOtuningB, 0, LFOmodMixB, 2);
AudioConnection          patchCord17(LFOmodMix1_1, 0, LFOmodMixA, 0);
AudioConnection          patchCord18(LFOmodMix1_1, 0, LFOmodMixB, 0);
AudioConnection          patchCord19(LFOmodMix1_2, 0, LFOmodMixA, 1);
AudioConnection          patchCord20(LFOmodMix1_2, 0, LFOmodMixB, 1);
AudioConnection          patchCord21(LFOfilterMix1_1, 0, LFOfilterMix1_3, 0);
AudioConnection          patchCord22(LFOfilterMix1_2, 0, LFOfilterMix1_3, 1);
AudioConnection          patchCord23(PBend, 0, LFOmodMixA, 3);
AudioConnection          patchCord24(PBend, 0, LFOmodMixB, 3);
AudioConnection          patchCord25(LFOmodMixA, 0, VFOsine01A, 0);
AudioConnection          patchCord26(LFOmodMixA, 0, VFOsquare01A, 0);
AudioConnection          patchCord27(LFOmodMixA, 0, VFOtriangle01A, 0);
AudioConnection          patchCord28(LFOmodMixA, 0, VFOsaw01A, 0);
AudioConnection          patchCord29(LFOmodMixA, 0, VFOsine02A, 0);
AudioConnection          patchCord30(LFOmodMixA, 0, VFOsquare02A, 0);
AudioConnection          patchCord31(LFOmodMixA, 0, VFOtriangle02A, 0);
AudioConnection          patchCord32(LFOmodMixA, 0, VFOsaw02A, 0);
AudioConnection          patchCord33(LFOmodMixA, 0, VFOsine03A, 0);
AudioConnection          patchCord34(LFOmodMixA, 0, VFOsquare03A, 0);
AudioConnection          patchCord35(LFOmodMixA, 0, VFOtriangle03A, 0);
AudioConnection          patchCord36(LFOmodMixA, 0, VFOsaw03A, 0);
AudioConnection          patchCord37(LFOmodMixA, 0, VFOsine04A, 0);
AudioConnection          patchCord38(LFOmodMixA, 0, VFOsquare04A, 0);
AudioConnection          patchCord39(LFOmodMixA, 0, VFOtriangle04A, 0);
AudioConnection          patchCord40(LFOmodMixA, 0, VFOsaw04A, 0);
AudioConnection          patchCord41(LFOmodMixA, 0, VFOsine05A, 0);
AudioConnection          patchCord42(LFOmodMixA, 0, VFOsquare05A, 0);
AudioConnection          patchCord43(LFOmodMixA, 0, VFOtriangle05A, 0);
AudioConnection          patchCord44(LFOmodMixA, 0, VFOsaw05A, 0);
AudioConnection          patchCord45(LFOmodMixA, 0, VFOsine06A, 0);
AudioConnection          patchCord46(LFOmodMixA, 0, VFOsquare06A, 0);
AudioConnection          patchCord47(LFOmodMixA, 0, VFOtriangle06A, 0);
AudioConnection          patchCord48(LFOmodMixA, 0, VFOsaw06A, 0);
AudioConnection          patchCord49(LFOmodMixA, 0, VFOsine07A, 0);
AudioConnection          patchCord50(LFOmodMixA, 0, VFOsquare07A, 0);
AudioConnection          patchCord51(LFOmodMixA, 0, VFOtriangle07A, 0);
AudioConnection          patchCord52(LFOmodMixA, 0, VFOsaw07A, 0);
AudioConnection          patchCord53(LFOmodMixA, 0, VFOsine08A, 0);
AudioConnection          patchCord54(LFOmodMixA, 0, VFOsquare08A, 0);
AudioConnection          patchCord55(LFOmodMixA, 0, VFOtriangle08A, 0);
AudioConnection          patchCord56(LFOmodMixA, 0, VFOsaw08A, 0);
AudioConnection          patchCord57(LFOmodMixA, 0, VFOsine09A, 0);
AudioConnection          patchCord58(LFOmodMixA, 0, VFOsquare09A, 0);
AudioConnection          patchCord59(LFOmodMixA, 0, VFOtriangle09A, 0);
AudioConnection          patchCord60(LFOmodMixA, 0, VFOsaw09A, 0);
AudioConnection          patchCord61(LFOmodMixA, 0, VFOsine10A, 0);
AudioConnection          patchCord62(LFOmodMixA, 0, VFOsquare10A, 0);
AudioConnection          patchCord63(LFOmodMixA, 0, VFOtriangle10A, 0);
AudioConnection          patchCord64(LFOmodMixA, 0, VFOsaw10A, 0);
AudioConnection          patchCord65(LFOmodMixA, 0, VFOsine11A, 0);
AudioConnection          patchCord66(LFOmodMixA, 0, VFOsquare11A, 0);
AudioConnection          patchCord67(LFOmodMixA, 0, VFOtriangle11A, 0);
AudioConnection          patchCord68(LFOmodMixA, 0, VFOsaw11A, 0);
AudioConnection          patchCord69(LFOmodMixA, 0, VFOsine12A, 0);
AudioConnection          patchCord70(LFOmodMixA, 0, VFOsquare12A, 0);
AudioConnection          patchCord71(LFOmodMixA, 0, VFOtriangle12A, 0);
AudioConnection          patchCord72(LFOmodMixA, 0, VFOsaw12A, 0);
AudioConnection          patchCord73(LFOmodMixA, 0, VFOsine13A, 0);
AudioConnection          patchCord74(LFOmodMixA, 0, VFOsquare13A, 0);
AudioConnection          patchCord75(LFOmodMixA, 0, VFOtriangle13A, 0);
AudioConnection          patchCord76(LFOmodMixA, 0, VFOsaw13A, 0);
AudioConnection          patchCord77(LFOmodMixA, 0, VFOsine14A, 0);
AudioConnection          patchCord78(LFOmodMixA, 0, VFOsquare14A, 0);
AudioConnection          patchCord79(LFOmodMixA, 0, VFOtriangle14A, 0);
AudioConnection          patchCord80(LFOmodMixA, 0, VFOsaw14A, 0);
AudioConnection          patchCord81(LFOmodMixA, 0, VFOsine15A, 0);
AudioConnection          patchCord82(LFOmodMixA, 0, VFOsquare15A, 0);
AudioConnection          patchCord83(LFOmodMixA, 0, VFOtriangle15A, 0);
AudioConnection          patchCord84(LFOmodMixA, 0, VFOsaw15A, 0);
AudioConnection          patchCord85(LFOmodMixA, 0, VFOsine16A, 0);
AudioConnection          patchCord86(LFOmodMixA, 0, VFOsquare16A, 0);
AudioConnection          patchCord87(LFOmodMixA, 0, VFOtriangle16A, 0);
AudioConnection          patchCord88(LFOmodMixA, 0, VFOsaw16A, 0);
AudioConnection          patchCord89(LFOmodMixB, 0, VFOsine01B, 0);
AudioConnection          patchCord90(LFOmodMixB, 0, VFOsquare01B, 0);
AudioConnection          patchCord91(LFOmodMixB, 0, VFOtriangle01B, 0);
AudioConnection          patchCord92(LFOmodMixB, 0, VFOsaw01B, 0);
AudioConnection          patchCord93(LFOmodMixB, 0, VFOsine02B, 0);
AudioConnection          patchCord94(LFOmodMixB, 0, VFOsquare02B, 0);
AudioConnection          patchCord95(LFOmodMixB, 0, VFOtriangle02B, 0);
AudioConnection          patchCord96(LFOmodMixB, 0, VFOsaw02B, 0);
AudioConnection          patchCord97(LFOmodMixB, 0, VFOsine03B, 0);
AudioConnection          patchCord98(LFOmodMixB, 0, VFOsquare03B, 0);
AudioConnection          patchCord99(LFOmodMixB, 0, VFOtriangle03B, 0);
AudioConnection          patchCord100(LFOmodMixB, 0, VFOsaw03B, 0);
AudioConnection          patchCord101(LFOmodMixB, 0, VFOsine04B, 0);
AudioConnection          patchCord102(LFOmodMixB, 0, VFOsquare04B, 0);
AudioConnection          patchCord103(LFOmodMixB, 0, VFOtriangle04B, 0);
AudioConnection          patchCord104(LFOmodMixB, 0, VFOsaw04B, 0);
AudioConnection          patchCord105(LFOmodMixB, 0, VFOsine05B, 0);
AudioConnection          patchCord106(LFOmodMixB, 0, VFOsquare05B, 0);
AudioConnection          patchCord107(LFOmodMixB, 0, VFOtriangle05B, 0);
AudioConnection          patchCord108(LFOmodMixB, 0, VFOsaw05B, 0);
AudioConnection          patchCord109(LFOmodMixB, 0, VFOsine06B, 0);
AudioConnection          patchCord110(LFOmodMixB, 0, VFOsquare06B, 0);
AudioConnection          patchCord111(LFOmodMixB, 0, VFOtriangle06B, 0);
AudioConnection          patchCord112(LFOmodMixB, 0, VFOsaw06B, 0);
AudioConnection          patchCord113(LFOmodMixB, 0, VFOsine07B, 0);
AudioConnection          patchCord114(LFOmodMixB, 0, VFOsquare07B, 0);
AudioConnection          patchCord115(LFOmodMixB, 0, VFOtriangle07B, 0);
AudioConnection          patchCord116(LFOmodMixB, 0, VFOsaw07B, 0);
AudioConnection          patchCord117(LFOmodMixB, 0, VFOsine08B, 0);
AudioConnection          patchCord118(LFOmodMixB, 0, VFOsquare08B, 0);
AudioConnection          patchCord119(LFOmodMixB, 0, VFOtriangle08B, 0);
AudioConnection          patchCord120(LFOmodMixB, 0, VFOsaw08B, 0);
AudioConnection          patchCord121(LFOmodMixB, 0, VFOsine09B, 0);
AudioConnection          patchCord122(LFOmodMixB, 0, VFOsquare09B, 0);
AudioConnection          patchCord123(LFOmodMixB, 0, VFOtriangle09B, 0);
AudioConnection          patchCord124(LFOmodMixB, 0, VFOsaw09B, 0);
AudioConnection          patchCord125(LFOmodMixB, 0, VFOsine10B, 0);
AudioConnection          patchCord126(LFOmodMixB, 0, VFOsquare10B, 0);
AudioConnection          patchCord127(LFOmodMixB, 0, VFOtriangle10B, 0);
AudioConnection          patchCord128(LFOmodMixB, 0, VFOsaw10B, 0);
AudioConnection          patchCord129(LFOmodMixB, 0, VFOsine11B, 0);
AudioConnection          patchCord130(LFOmodMixB, 0, VFOsquare11B, 0);
AudioConnection          patchCord131(LFOmodMixB, 0, VFOtriangle11B, 0);
AudioConnection          patchCord132(LFOmodMixB, 0, VFOsaw11B, 0);
AudioConnection          patchCord133(LFOmodMixB, 0, VFOsine12B, 0);
AudioConnection          patchCord134(LFOmodMixB, 0, VFOsquare12B, 0);
AudioConnection          patchCord135(LFOmodMixB, 0, VFOtriangle12B, 0);
AudioConnection          patchCord136(LFOmodMixB, 0, VFOsaw12B, 0);
AudioConnection          patchCord137(LFOmodMixB, 0, VFOsine13B, 0);
AudioConnection          patchCord138(LFOmodMixB, 0, VFOsquare13B, 0);
AudioConnection          patchCord139(LFOmodMixB, 0, VFOtriangle13B, 0);
AudioConnection          patchCord140(LFOmodMixB, 0, VFOsaw13B, 0);
AudioConnection          patchCord141(LFOmodMixB, 0, VFOsine14B, 0);
AudioConnection          patchCord142(LFOmodMixB, 0, VFOsquare14B, 0);
AudioConnection          patchCord143(LFOmodMixB, 0, VFOtriangle14B, 0);
AudioConnection          patchCord144(LFOmodMixB, 0, VFOsaw14B, 0);
AudioConnection          patchCord145(LFOmodMixB, 0, VFOsine15B, 0);
AudioConnection          patchCord146(LFOmodMixB, 0, VFOsquare15B, 0);
AudioConnection          patchCord147(LFOmodMixB, 0, VFOtriangle15B, 0);
AudioConnection          patchCord148(LFOmodMixB, 0, VFOsaw15B, 0);
AudioConnection          patchCord149(LFOmodMixB, 0, VFOsine16B, 0);
AudioConnection          patchCord150(LFOmodMixB, 0, VFOsquare16B, 0);
AudioConnection          patchCord151(LFOmodMixB, 0, VFOtriangle16B, 0);
AudioConnection          patchCord152(LFOmodMixB, 0, VFOsaw16B, 0);
AudioConnection          patchCord153(LFOfilterMix1_3, 0, VFOfilter01, 1);
AudioConnection          patchCord154(LFOfilterMix1_3, 0, VFOfilter02, 1);
AudioConnection          patchCord155(LFOfilterMix1_3, 0, VFOfilter03, 1);
AudioConnection          patchCord156(LFOfilterMix1_3, 0, VFOfilter04, 1);
AudioConnection          patchCord157(LFOfilterMix1_3, 0, VFOfilter05, 1);
AudioConnection          patchCord158(LFOfilterMix1_3, 0, VFOfilter06, 1);
AudioConnection          patchCord159(LFOfilterMix1_3, 0, VFOfilter07, 1);
AudioConnection          patchCord160(LFOfilterMix1_3, 0, VFOfilter08, 1);
AudioConnection          patchCord161(LFOfilterMix1_3, 0, VFOfilter09, 1);
AudioConnection          patchCord162(LFOfilterMix1_3, 0, VFOfilter10, 1);
AudioConnection          patchCord163(LFOfilterMix1_3, 0, VFOfilter11, 1);
AudioConnection          patchCord164(LFOfilterMix1_3, 0, VFOfilter12, 1);
AudioConnection          patchCord165(LFOfilterMix1_3, 0, VFOfilter13, 1);
AudioConnection          patchCord166(LFOfilterMix1_3, 0, VFOfilter14, 1);
AudioConnection          patchCord167(LFOfilterMix1_3, 0, VFOfilter15, 1);
AudioConnection          patchCord168(LFOfilterMix1_3, 0, VFOfilter16, 1);
AudioConnection          patchCord169(VFOsine01A, 0, waveMix01_1A, 0);
AudioConnection          patchCord170(VFOsquare01A, 0, waveMix01_1A, 1);
AudioConnection          patchCord171(VFOtriangle01A, 0, waveMix01_1A, 2);
AudioConnection          patchCord172(VFOsaw01A, 0, waveMix01_1A, 3);
AudioConnection          patchCord173(VFOstring01A, 0, waveMix01_2A, 0);
AudioConnection          patchCord174(VFOwhite01A, 0, waveMix01_2A, 1);
AudioConnection          patchCord175(VFOpink01A, 0, waveMix01_2A, 2);
AudioConnection          patchCord176(VFOsweep01A, 0, waveMix01_2A, 3);
AudioConnection          patchCord177(VFOsine02A, 0, waveMix02_1A, 0);
AudioConnection          patchCord178(VFOsquare02A, 0, waveMix02_1A, 1);
AudioConnection          patchCord179(VFOtriangle02A, 0, waveMix02_1A, 2);
AudioConnection          patchCord180(VFOsaw02A, 0, waveMix02_1A, 3);
AudioConnection          patchCord181(VFOstring02A, 0, waveMix02_2A, 0);
AudioConnection          patchCord182(VFOwhite02A, 0, waveMix02_2A, 1);
AudioConnection          patchCord183(VFOpink02A, 0, waveMix02_2A, 2);
AudioConnection          patchCord184(VFOsweep02A, 0, waveMix02_2A, 3);
AudioConnection          patchCord185(VFOsine03A, 0, waveMix03_1A, 0);
AudioConnection          patchCord186(VFOsquare03A, 0, waveMix03_1A, 1);
AudioConnection          patchCord187(VFOtriangle03A, 0, waveMix03_1A, 2);
AudioConnection          patchCord188(VFOsaw03A, 0, waveMix03_1A, 3);
AudioConnection          patchCord189(VFOstring03A, 0, waveMix03_2A, 0);
AudioConnection          patchCord190(VFOwhite03A, 0, waveMix03_2A, 1);
AudioConnection          patchCord191(VFOpink03A, 0, waveMix03_2A, 2);
AudioConnection          patchCord192(VFOsweep03A, 0, waveMix03_2A, 3);
AudioConnection          patchCord193(VFOsine04A, 0, waveMix04_1A, 0);
AudioConnection          patchCord194(VFOsquare04A, 0, waveMix04_1A, 1);
AudioConnection          patchCord195(VFOtriangle04A, 0, waveMix04_1A, 2);
AudioConnection          patchCord196(VFOsaw04A, 0, waveMix04_1A, 3);
AudioConnection          patchCord197(VFOstring04A, 0, waveMix04_2A, 0);
AudioConnection          patchCord198(VFOwhite04A, 0, waveMix04_2A, 1);
AudioConnection          patchCord199(VFOpink04A, 0, waveMix04_2A, 2);
AudioConnection          patchCord200(VFOsweep04A, 0, waveMix04_2A, 3);
AudioConnection          patchCord201(VFOsine05A, 0, waveMix05_1A, 0);
AudioConnection          patchCord202(VFOsquare05A, 0, waveMix05_1A, 1);
AudioConnection          patchCord203(VFOtriangle05A, 0, waveMix05_1A, 2);
AudioConnection          patchCord204(VFOsaw05A, 0, waveMix05_1A, 3);
AudioConnection          patchCord205(VFOstring05A, 0, waveMix05_2A, 0);
AudioConnection          patchCord206(VFOwhite05A, 0, waveMix05_2A, 1);
AudioConnection          patchCord207(VFOpink05A, 0, waveMix05_2A, 2);
AudioConnection          patchCord208(VFOsweep05A, 0, waveMix05_2A, 3);
AudioConnection          patchCord209(VFOsine06A, 0, waveMix06_1A, 0);
AudioConnection          patchCord210(VFOsquare06A, 0, waveMix06_1A, 1);
AudioConnection          patchCord211(VFOtriangle06A, 0, waveMix06_1A, 2);
AudioConnection          patchCord212(VFOsaw06A, 0, waveMix06_1A, 3);
AudioConnection          patchCord213(VFOstring06A, 0, waveMix06_2A, 0);
AudioConnection          patchCord214(VFOwhite06A, 0, waveMix06_2A, 1);
AudioConnection          patchCord215(VFOpink06A, 0, waveMix06_2A, 2);
AudioConnection          patchCord216(VFOsweep06A, 0, waveMix06_2A, 3);
AudioConnection          patchCord217(VFOsine07A, 0, waveMix07_1A, 0);
AudioConnection          patchCord218(VFOsquare07A, 0, waveMix07_1A, 1);
AudioConnection          patchCord219(VFOtriangle07A, 0, waveMix07_1A, 2);
AudioConnection          patchCord220(VFOsaw07A, 0, waveMix07_1A, 3);
AudioConnection          patchCord221(VFOstring07A, 0, waveMix07_2A, 0);
AudioConnection          patchCord222(VFOwhite07A, 0, waveMix07_2A, 1);
AudioConnection          patchCord223(VFOpink07A, 0, waveMix07_2A, 2);
AudioConnection          patchCord224(VFOsweep07A, 0, waveMix07_2A, 3);
AudioConnection          patchCord225(VFOsine08A, 0, waveMix08_1A, 0);
AudioConnection          patchCord226(VFOsquare08A, 0, waveMix08_1A, 1);
AudioConnection          patchCord227(VFOtriangle08A, 0, waveMix08_1A, 2);
AudioConnection          patchCord228(VFOsaw08A, 0, waveMix08_1A, 3);
AudioConnection          patchCord229(VFOstring08A, 0, waveMix08_2A, 0);
AudioConnection          patchCord230(VFOwhite08A, 0, waveMix08_2A, 1);
AudioConnection          patchCord231(VFOpink08A, 0, waveMix08_2A, 2);
AudioConnection          patchCord232(VFOsweep08A, 0, waveMix08_2A, 3);
AudioConnection          patchCord233(VFOsine09A, 0, waveMix09_1A, 0);
AudioConnection          patchCord234(VFOsquare09A, 0, waveMix09_1A, 1);
AudioConnection          patchCord235(VFOtriangle09A, 0, waveMix09_1A, 2);
AudioConnection          patchCord236(VFOsaw09A, 0, waveMix09_1A, 3);
AudioConnection          patchCord237(VFOstring09A, 0, waveMix09_2A, 0);
AudioConnection          patchCord238(VFOwhite09A, 0, waveMix09_2A, 1);
AudioConnection          patchCord239(VFOpink09A, 0, waveMix09_2A, 2);
AudioConnection          patchCord240(VFOsweep09A, 0, waveMix09_2A, 3);
AudioConnection          patchCord241(VFOsine10A, 0, waveMix10_1A, 0);
AudioConnection          patchCord242(VFOsquare10A, 0, waveMix10_1A, 1);
AudioConnection          patchCord243(VFOtriangle10A, 0, waveMix10_1A, 2);
AudioConnection          patchCord244(VFOsaw10A, 0, waveMix10_1A, 3);
AudioConnection          patchCord245(VFOstring10A, 0, waveMix10_2A, 0);
AudioConnection          patchCord246(VFOwhite10A, 0, waveMix10_2A, 1);
AudioConnection          patchCord247(VFOpink10A, 0, waveMix10_2A, 2);
AudioConnection          patchCord248(VFOsweep10A, 0, waveMix10_2A, 3);
AudioConnection          patchCord249(VFOsine11A, 0, waveMix11_1A, 0);
AudioConnection          patchCord250(VFOsquare11A, 0, waveMix11_1A, 1);
AudioConnection          patchCord251(VFOtriangle11A, 0, waveMix11_1A, 2);
AudioConnection          patchCord252(VFOsaw11A, 0, waveMix11_1A, 3);
AudioConnection          patchCord253(VFOstring11A, 0, waveMix11_2A, 0);
AudioConnection          patchCord254(VFOwhite11A, 0, waveMix11_2A, 1);
AudioConnection          patchCord255(VFOpink11A, 0, waveMix11_2A, 2);
AudioConnection          patchCord256(VFOsweep11A, 0, waveMix11_2A, 3);
AudioConnection          patchCord257(VFOsine12A, 0, waveMix12_1A, 0);
AudioConnection          patchCord258(VFOsquare12A, 0, waveMix12_1A, 1);
AudioConnection          patchCord259(VFOtriangle12A, 0, waveMix12_1A, 2);
AudioConnection          patchCord260(VFOsaw12A, 0, waveMix12_1A, 3);
AudioConnection          patchCord261(VFOstring12A, 0, waveMix12_2A, 0);
AudioConnection          patchCord262(VFOwhite12A, 0, waveMix12_2A, 1);
AudioConnection          patchCord263(VFOpink12A, 0, waveMix12_2A, 2);
AudioConnection          patchCord264(VFOsweep12A, 0, waveMix12_2A, 3);
AudioConnection          patchCord265(VFOsine13A, 0, waveMix13_1A, 0);
AudioConnection          patchCord266(VFOsquare13A, 0, waveMix13_1A, 1);
AudioConnection          patchCord267(VFOtriangle13A, 0, waveMix13_1A, 2);
AudioConnection          patchCord268(VFOsaw13A, 0, waveMix13_1A, 3);
AudioConnection          patchCord269(VFOstring13A, 0, waveMix13_2A, 0);
AudioConnection          patchCord270(VFOwhite13A, 0, waveMix13_2A, 1);
AudioConnection          patchCord271(VFOpink13A, 0, waveMix13_2A, 2);
AudioConnection          patchCord272(VFOsweep13A, 0, waveMix13_2A, 3);
AudioConnection          patchCord273(VFOsine14A, 0, waveMix14_1A, 0);
AudioConnection          patchCord274(VFOsquare14A, 0, waveMix14_1A, 1);
AudioConnection          patchCord275(VFOtriangle14A, 0, waveMix14_1A, 2);
AudioConnection          patchCord276(VFOsaw14A, 0, waveMix14_1A, 3);
AudioConnection          patchCord277(VFOstring14A, 0, waveMix14_2A, 0);
AudioConnection          patchCord278(VFOwhite14A, 0, waveMix14_2A, 1);
AudioConnection          patchCord279(VFOpink14A, 0, waveMix14_2A, 2);
AudioConnection          patchCord280(VFOsweep14A, 0, waveMix14_2A, 3);
AudioConnection          patchCord281(VFOsine15A, 0, waveMix15_1A, 0);
AudioConnection          patchCord282(VFOsquare15A, 0, waveMix15_1A, 1);
AudioConnection          patchCord283(VFOtriangle15A, 0, waveMix15_1A, 2);
AudioConnection          patchCord284(VFOsaw15A, 0, waveMix15_1A, 3);
AudioConnection          patchCord285(VFOstring15A, 0, waveMix15_2A, 0);
AudioConnection          patchCord286(VFOwhite15A, 0, waveMix15_2A, 1);
AudioConnection          patchCord287(VFOpink15A, 0, waveMix15_2A, 2);
AudioConnection          patchCord288(VFOsweep15A, 0, waveMix15_2A, 3);
AudioConnection          patchCord289(VFOsine16A, 0, waveMix16_1A, 0);
AudioConnection          patchCord290(VFOsquare16A, 0, waveMix16_1A, 1);
AudioConnection          patchCord291(VFOtriangle16A, 0, waveMix16_1A, 2);
AudioConnection          patchCord292(VFOsaw16A, 0, waveMix16_1A, 3);
AudioConnection          patchCord293(VFOstring16A, 0, waveMix16_2A, 0);
AudioConnection          patchCord294(VFOwhite16A, 0, waveMix16_2A, 1);
AudioConnection          patchCord295(VFOpink16A, 0, waveMix16_2A, 2);
AudioConnection          patchCord296(VFOsweep16A, 0, waveMix16_2A, 3);
AudioConnection          patchCord297(waveMix01_1A, 0, waveMix01_3A, 0);
AudioConnection          patchCord298(waveMix01_2A, 0, waveMix01_3A, 1);
AudioConnection          patchCord299(waveMix02_1A, 0, waveMix02_3A, 0);
AudioConnection          patchCord300(waveMix02_2A, 0, waveMix02_3A, 1);
AudioConnection          patchCord301(waveMix03_1A, 0, waveMix03_3A, 0);
AudioConnection          patchCord302(waveMix03_2A, 0, waveMix03_3A, 1);
AudioConnection          patchCord303(waveMix04_1A, 0, waveMix04_3A, 0);
AudioConnection          patchCord304(waveMix04_2A, 0, waveMix04_3A, 1);
AudioConnection          patchCord305(waveMix05_1A, 0, waveMix05_3A, 0);
AudioConnection          patchCord306(waveMix05_2A, 0, waveMix05_3A, 1);
AudioConnection          patchCord307(waveMix06_1A, 0, waveMix06_3A, 0);
AudioConnection          patchCord308(waveMix06_2A, 0, waveMix06_3A, 1);
AudioConnection          patchCord309(waveMix07_1A, 0, waveMix07_3A, 0);
AudioConnection          patchCord310(waveMix07_2A, 0, waveMix07_3A, 1);
AudioConnection          patchCord311(waveMix08_1A, 0, waveMix08_3A, 0);
AudioConnection          patchCord312(waveMix08_2A, 0, waveMix08_3A, 1);
AudioConnection          patchCord313(waveMix09_1A, 0, waveMix09_3A, 0);
AudioConnection          patchCord314(waveMix09_2A, 0, waveMix09_3A, 1);
AudioConnection          patchCord315(waveMix10_1A, 0, waveMix10_3A, 0);
AudioConnection          patchCord316(waveMix10_2A, 0, waveMix10_3A, 1);
AudioConnection          patchCord317(waveMix11_1A, 0, waveMix11_3A, 0);
AudioConnection          patchCord318(waveMix11_2A, 0, waveMix11_3A, 1);
AudioConnection          patchCord319(waveMix12_1A, 0, waveMix12_3A, 0);
AudioConnection          patchCord320(waveMix12_2A, 0, waveMix12_3A, 1);
AudioConnection          patchCord321(waveMix13_1A, 0, waveMix13_3A, 0);
AudioConnection          patchCord322(waveMix13_2A, 0, waveMix13_3A, 1);
AudioConnection          patchCord323(waveMix14_1A, 0, waveMix14_3A, 0);
AudioConnection          patchCord324(waveMix14_2A, 0, waveMix14_3A, 1);
AudioConnection          patchCord325(waveMix15_1A, 0, waveMix15_3A, 0);
AudioConnection          patchCord326(waveMix15_2A, 0, waveMix15_3A, 1);
AudioConnection          patchCord327(waveMix16_1A, 0, waveMix16_3A, 0);
AudioConnection          patchCord328(waveMix16_2A, 0, waveMix16_3A, 1);
AudioConnection          patchCord329(VFOsine01B, 0, waveMix01_1B, 0);
AudioConnection          patchCord330(VFOsquare01B, 0, waveMix01_1B, 1);
AudioConnection          patchCord331(VFOtriangle01B, 0, waveMix01_1B, 2);
AudioConnection          patchCord332(VFOsaw01B, 0, waveMix01_1B, 3);
AudioConnection          patchCord333(VFOstring01B, 0, waveMix01_2B, 0);
AudioConnection          patchCord334(VFOwhite01B, 0, waveMix01_2B, 1);
AudioConnection          patchCord335(VFOpink01B, 0, waveMix01_2B, 2);
AudioConnection          patchCord336(VFOsweep01B, 0, waveMix01_2B, 3);
AudioConnection          patchCord337(VFOsine02B, 0, waveMix02_1B, 0);
AudioConnection          patchCord338(VFOsquare02B, 0, waveMix02_1B, 1);
AudioConnection          patchCord339(VFOtriangle02B, 0, waveMix02_1B, 2);
AudioConnection          patchCord340(VFOsaw02B, 0, waveMix02_1B, 3);
AudioConnection          patchCord341(VFOstring02B, 0, waveMix02_2B, 0);
AudioConnection          patchCord342(VFOwhite02B, 0, waveMix02_2B, 1);
AudioConnection          patchCord343(VFOpink02B, 0, waveMix02_2B, 2);
AudioConnection          patchCord344(VFOsweep02B, 0, waveMix02_2B, 3);
AudioConnection          patchCord345(VFOsine03B, 0, waveMix03_1B, 0);
AudioConnection          patchCord346(VFOsquare03B, 0, waveMix03_1B, 1);
AudioConnection          patchCord347(VFOtriangle03B, 0, waveMix03_1B, 2);
AudioConnection          patchCord348(VFOsaw03B, 0, waveMix03_1B, 3);
AudioConnection          patchCord349(VFOstring03B, 0, waveMix03_2B, 0);
AudioConnection          patchCord350(VFOwhite03B, 0, waveMix03_2B, 1);
AudioConnection          patchCord351(VFOpink03B, 0, waveMix03_2B, 2);
AudioConnection          patchCord352(VFOsweep03B, 0, waveMix03_2B, 3);
AudioConnection          patchCord353(VFOsine04B, 0, waveMix04_1B, 0);
AudioConnection          patchCord354(VFOsquare04B, 0, waveMix04_1B, 1);
AudioConnection          patchCord355(VFOtriangle04B, 0, waveMix04_1B, 2);
AudioConnection          patchCord356(VFOsaw04B, 0, waveMix04_1B, 3);
AudioConnection          patchCord357(VFOstring04B, 0, waveMix04_2B, 0);
AudioConnection          patchCord358(VFOwhite04B, 0, waveMix04_2B, 1);
AudioConnection          patchCord359(VFOpink04B, 0, waveMix04_2B, 2);
AudioConnection          patchCord360(VFOsweep04B, 0, waveMix04_2B, 3);
AudioConnection          patchCord361(VFOsine05B, 0, waveMix05_1B, 0);
AudioConnection          patchCord362(VFOsquare05B, 0, waveMix05_1B, 1);
AudioConnection          patchCord363(VFOtriangle05B, 0, waveMix05_1B, 2);
AudioConnection          patchCord364(VFOsaw05B, 0, waveMix05_1B, 3);
AudioConnection          patchCord365(VFOstring05B, 0, waveMix05_2B, 0);
AudioConnection          patchCord366(VFOwhite05B, 0, waveMix05_2B, 1);
AudioConnection          patchCord367(VFOpink05B, 0, waveMix05_2B, 2);
AudioConnection          patchCord368(VFOsweep05B, 0, waveMix05_2B, 3);
AudioConnection          patchCord369(VFOsine06B, 0, waveMix06_1B, 0);
AudioConnection          patchCord370(VFOsquare06B, 0, waveMix06_1B, 1);
AudioConnection          patchCord371(VFOtriangle06B, 0, waveMix06_1B, 2);
AudioConnection          patchCord372(VFOsaw06B, 0, waveMix06_1B, 3);
AudioConnection          patchCord373(VFOstring06B, 0, waveMix06_2B, 0);
AudioConnection          patchCord374(VFOwhite06B, 0, waveMix06_2B, 1);
AudioConnection          patchCord375(VFOpink06B, 0, waveMix06_2B, 2);
AudioConnection          patchCord376(VFOsweep06B, 0, waveMix06_2B, 3);
AudioConnection          patchCord377(VFOsine07B, 0, waveMix07_1B, 0);
AudioConnection          patchCord378(VFOsquare07B, 0, waveMix07_1B, 1);
AudioConnection          patchCord379(VFOtriangle07B, 0, waveMix07_1B, 2);
AudioConnection          patchCord380(VFOsaw07B, 0, waveMix07_1B, 3);
AudioConnection          patchCord381(VFOstring07B, 0, waveMix07_2B, 0);
AudioConnection          patchCord382(VFOwhite07B, 0, waveMix07_2B, 1);
AudioConnection          patchCord383(VFOpink07B, 0, waveMix07_2B, 2);
AudioConnection          patchCord384(VFOsweep07B, 0, waveMix07_2B, 3);
AudioConnection          patchCord385(VFOsine08B, 0, waveMix08_1B, 0);
AudioConnection          patchCord386(VFOsquare08B, 0, waveMix08_1B, 1);
AudioConnection          patchCord387(VFOtriangle08B, 0, waveMix08_1B, 2);
AudioConnection          patchCord388(VFOsaw08B, 0, waveMix08_1B, 3);
AudioConnection          patchCord389(VFOstring08B, 0, waveMix08_2B, 0);
AudioConnection          patchCord390(VFOwhite08B, 0, waveMix08_2B, 1);
AudioConnection          patchCord391(VFOpink08B, 0, waveMix08_2B, 2);
AudioConnection          patchCord392(VFOsweep08B, 0, waveMix08_2B, 3);
AudioConnection          patchCord393(VFOsine09B, 0, waveMix09_1B, 0);
AudioConnection          patchCord394(VFOsquare09B, 0, waveMix09_1B, 1);
AudioConnection          patchCord395(VFOtriangle09B, 0, waveMix09_1B, 2);
AudioConnection          patchCord396(VFOsaw09B, 0, waveMix09_1B, 3);
AudioConnection          patchCord397(VFOstring09B, 0, waveMix09_2B, 0);
AudioConnection          patchCord398(VFOwhite09B, 0, waveMix09_2B, 1);
AudioConnection          patchCord399(VFOpink09B, 0, waveMix09_2B, 2);
AudioConnection          patchCord400(VFOsweep09B, 0, waveMix09_2B, 3);
AudioConnection          patchCord401(VFOsine10B, 0, waveMix10_1B, 0);
AudioConnection          patchCord402(VFOsquare10B, 0, waveMix10_1B, 1);
AudioConnection          patchCord403(VFOtriangle10B, 0, waveMix10_1B, 2);
AudioConnection          patchCord404(VFOsaw10B, 0, waveMix10_1B, 3);
AudioConnection          patchCord405(VFOstring10B, 0, waveMix10_2B, 0);
AudioConnection          patchCord406(VFOwhite10B, 0, waveMix10_2B, 1);
AudioConnection          patchCord407(VFOpink10B, 0, waveMix10_2B, 2);
AudioConnection          patchCord408(VFOsweep10B, 0, waveMix10_2B, 3);
AudioConnection          patchCord409(VFOsine11B, 0, waveMix11_1B, 0);
AudioConnection          patchCord410(VFOsquare11B, 0, waveMix11_1B, 1);
AudioConnection          patchCord411(VFOtriangle11B, 0, waveMix11_1B, 2);
AudioConnection          patchCord412(VFOsaw11B, 0, waveMix11_1B, 3);
AudioConnection          patchCord413(VFOstring11B, 0, waveMix11_2B, 0);
AudioConnection          patchCord414(VFOwhite11B, 0, waveMix11_2B, 1);
AudioConnection          patchCord415(VFOpink11B, 0, waveMix11_2B, 2);
AudioConnection          patchCord416(VFOsweep11B, 0, waveMix11_2B, 3);
AudioConnection          patchCord417(VFOsine12B, 0, waveMix12_1B, 0);
AudioConnection          patchCord418(VFOsquare12B, 0, waveMix12_1B, 1);
AudioConnection          patchCord419(VFOtriangle12B, 0, waveMix12_1B, 2);
AudioConnection          patchCord420(VFOsaw12B, 0, waveMix12_1B, 3);
AudioConnection          patchCord421(VFOstring12B, 0, waveMix12_2B, 0);
AudioConnection          patchCord422(VFOwhite12B, 0, waveMix12_2B, 1);
AudioConnection          patchCord423(VFOpink12B, 0, waveMix12_2B, 2);
AudioConnection          patchCord424(VFOsweep12B, 0, waveMix12_2B, 3);
AudioConnection          patchCord425(VFOsine13B, 0, waveMix13_1B, 0);
AudioConnection          patchCord426(VFOsquare13B, 0, waveMix13_1B, 1);
AudioConnection          patchCord427(VFOtriangle13B, 0, waveMix13_1B, 2);
AudioConnection          patchCord428(VFOsaw13B, 0, waveMix13_1B, 3);
AudioConnection          patchCord429(VFOstring13B, 0, waveMix13_2B, 0);
AudioConnection          patchCord430(VFOwhite13B, 0, waveMix13_2B, 1);
AudioConnection          patchCord431(VFOpink13B, 0, waveMix13_2B, 2);
AudioConnection          patchCord432(VFOsweep13B, 0, waveMix13_2B, 3);
AudioConnection          patchCord433(VFOsine14B, 0, waveMix14_1B, 0);
AudioConnection          patchCord434(VFOsquare14B, 0, waveMix14_1B, 1);
AudioConnection          patchCord435(VFOtriangle14B, 0, waveMix14_1B, 2);
AudioConnection          patchCord436(VFOsaw14B, 0, waveMix14_1B, 3);
AudioConnection          patchCord437(VFOstring14B, 0, waveMix14_2B, 0);
AudioConnection          patchCord438(VFOwhite14B, 0, waveMix14_2B, 1);
AudioConnection          patchCord439(VFOpink14B, 0, waveMix14_2B, 2);
AudioConnection          patchCord440(VFOsweep14B, 0, waveMix14_2B, 3);
AudioConnection          patchCord441(VFOsine15B, 0, waveMix15_1B, 0);
AudioConnection          patchCord442(VFOsquare15B, 0, waveMix15_1B, 1);
AudioConnection          patchCord443(VFOtriangle15B, 0, waveMix15_1B, 2);
AudioConnection          patchCord444(VFOsaw15B, 0, waveMix15_1B, 3);
AudioConnection          patchCord445(VFOstring15B, 0, waveMix15_2B, 0);
AudioConnection          patchCord446(VFOwhite15B, 0, waveMix15_2B, 1);
AudioConnection          patchCord447(VFOpink15B, 0, waveMix15_2B, 2);
AudioConnection          patchCord448(VFOsweep15B, 0, waveMix15_2B, 3);
AudioConnection          patchCord449(VFOsine16B, 0, waveMix16_1B, 0);
AudioConnection          patchCord450(VFOsquare16B, 0, waveMix16_1B, 1);
AudioConnection          patchCord451(VFOtriangle16B, 0, waveMix16_1B, 2);
AudioConnection          patchCord452(VFOsaw16B, 0, waveMix16_1B, 3);
AudioConnection          patchCord453(VFOstring16B, 0, waveMix16_2B, 0);
AudioConnection          patchCord454(VFOwhite16B, 0, waveMix16_2B, 1);
AudioConnection          patchCord455(VFOpink16B, 0, waveMix16_2B, 2);
AudioConnection          patchCord456(VFOsweep16B, 0, waveMix16_2B, 3);
AudioConnection          patchCord457(waveMix01_1B, 0, waveMix01_3A, 2);
AudioConnection          patchCord458(waveMix01_2B, 0, waveMix01_3A, 3);
AudioConnection          patchCord459(waveMix02_1B, 0, waveMix02_3A, 2);
AudioConnection          patchCord460(waveMix02_2B, 0, waveMix02_3A, 3);
AudioConnection          patchCord461(waveMix03_1B, 0, waveMix03_3A, 2);
AudioConnection          patchCord462(waveMix03_2B, 0, waveMix03_3A, 3);
AudioConnection          patchCord463(waveMix04_1B, 0, waveMix04_3A, 2);
AudioConnection          patchCord464(waveMix04_2B, 0, waveMix04_3A, 3);
AudioConnection          patchCord465(waveMix05_1B, 0, waveMix05_3A, 2);
AudioConnection          patchCord466(waveMix05_2B, 0, waveMix05_3A, 3);
AudioConnection          patchCord467(waveMix06_1B, 0, waveMix06_3A, 2);
AudioConnection          patchCord468(waveMix06_2B, 0, waveMix06_3A, 3);
AudioConnection          patchCord469(waveMix07_1B, 0, waveMix07_3A, 2);
AudioConnection          patchCord470(waveMix07_2B, 0, waveMix07_3A, 3);
AudioConnection          patchCord471(waveMix08_1B, 0, waveMix08_3A, 2);
AudioConnection          patchCord472(waveMix08_2B, 0, waveMix08_3A, 3);
AudioConnection          patchCord473(waveMix09_1B, 0, waveMix09_3A, 2);
AudioConnection          patchCord474(waveMix09_2B, 0, waveMix09_3A, 3);
AudioConnection          patchCord475(waveMix10_1B, 0, waveMix10_3A, 2);
AudioConnection          patchCord476(waveMix10_2B, 0, waveMix10_3A, 3);
AudioConnection          patchCord477(waveMix11_1B, 0, waveMix11_3A, 2);
AudioConnection          patchCord478(waveMix11_2B, 0, waveMix11_3A, 3);
AudioConnection          patchCord479(waveMix12_1B, 0, waveMix12_3A, 2);
AudioConnection          patchCord480(waveMix12_2B, 0, waveMix12_3A, 3);
AudioConnection          patchCord481(waveMix13_1B, 0, waveMix13_3A, 2);
AudioConnection          patchCord482(waveMix13_2B, 0, waveMix13_3A, 3);
AudioConnection          patchCord483(waveMix14_1B, 0, waveMix14_3A, 2);
AudioConnection          patchCord484(waveMix14_2B, 0, waveMix14_3A, 3);
AudioConnection          patchCord485(waveMix15_1B, 0, waveMix15_3A, 2);
AudioConnection          patchCord486(waveMix15_2B, 0, waveMix15_3A, 3);
AudioConnection          patchCord487(waveMix16_1B, 0, waveMix16_3A, 2);
AudioConnection          patchCord488(waveMix16_2B, 0, waveMix16_3A, 3);
AudioConnection          patchCord489(waveMix01_3A, VFOenvelope01);
AudioConnection          patchCord490(waveMix01_3A, 0, VFOenvelopeMix01, 0);
AudioConnection          patchCord491(waveMix02_3A, VFOenvelope02);
AudioConnection          patchCord492(waveMix02_3A, 0, VFOenvelopeMix02, 0);
AudioConnection          patchCord493(waveMix03_3A, VFOenvelope03);
AudioConnection          patchCord494(waveMix03_3A, 0, VFOenvelopeMix03, 0);
AudioConnection          patchCord495(waveMix04_3A, VFOenvelope04);
AudioConnection          patchCord496(waveMix04_3A, 0, VFOenvelopeMix04, 0);
AudioConnection          patchCord497(waveMix05_3A, VFOenvelope05);
AudioConnection          patchCord498(waveMix05_3A, 0, VFOenvelopeMix05, 0);
AudioConnection          patchCord499(waveMix06_3A, VFOenvelope06);
AudioConnection          patchCord500(waveMix06_3A, 0, VFOenvelopeMix06, 0);
AudioConnection          patchCord501(waveMix07_3A, VFOenvelope07);
AudioConnection          patchCord502(waveMix07_3A, 0, VFOenvelopeMix07, 0);
AudioConnection          patchCord503(waveMix08_3A, VFOenvelope08);
AudioConnection          patchCord504(waveMix08_3A, 0, VFOenvelopeMix08, 0);
AudioConnection          patchCord505(waveMix09_3A, VFOenvelope09);
AudioConnection          patchCord506(waveMix09_3A, 0, VFOenvelopeMix09, 0);
AudioConnection          patchCord507(waveMix10_3A, VFOenvelope10);
AudioConnection          patchCord508(waveMix10_3A, 0, VFOenvelopeMix10, 0);
AudioConnection          patchCord509(waveMix11_3A, 0, VFOenvelopeMix11, 0);
AudioConnection          patchCord510(waveMix11_3A, VFOenvelope11);
AudioConnection          patchCord511(waveMix12_3A, VFOenvelope12);
AudioConnection          patchCord512(waveMix12_3A, 0, VFOenvelopeMix12, 0);
AudioConnection          patchCord513(waveMix13_3A, 0, VFOenvelopeMix13, 0);
AudioConnection          patchCord514(waveMix13_3A, VFOenvelope13);
AudioConnection          patchCord515(waveMix14_3A, 0, VFOenvelopeMix14, 0);
AudioConnection          patchCord516(waveMix14_3A, VFOenvelope14);
AudioConnection          patchCord517(waveMix15_3A, VFOenvelope15);
AudioConnection          patchCord518(waveMix15_3A, 0, VFOenvelopeMix15, 0);
AudioConnection          patchCord519(waveMix16_3A, VFOenvelope16);
AudioConnection          patchCord520(waveMix16_3A, 0, VFOenvelopeMix16, 0);
AudioConnection          patchCord521(VFOenvelope01, 0, VFOenvelopeMix01, 1);
AudioConnection          patchCord522(VFOenvelope02, 0, VFOenvelopeMix02, 1);
AudioConnection          patchCord523(VFOenvelope03, 0, VFOenvelopeMix03, 1);
AudioConnection          patchCord524(VFOenvelope04, 0, VFOenvelopeMix04, 1);
AudioConnection          patchCord525(VFOenvelope05, 0, VFOenvelopeMix05, 1);
AudioConnection          patchCord526(VFOenvelope06, 0, VFOenvelopeMix06, 1);
AudioConnection          patchCord527(VFOenvelope07, 0, VFOenvelopeMix07, 1);
AudioConnection          patchCord528(VFOenvelope08, 0, VFOenvelopeMix08, 1);
AudioConnection          patchCord529(VFOenvelope09, 0, VFOenvelopeMix09, 1);
AudioConnection          patchCord530(VFOenvelope10, 0, VFOenvelopeMix10, 1);
AudioConnection          patchCord531(VFOenvelope11, 0, VFOenvelopeMix11, 1);
AudioConnection          patchCord532(VFOenvelope12, 0, VFOenvelopeMix12, 1);
AudioConnection          patchCord533(VFOenvelope13, 0, VFOenvelopeMix13, 1);
AudioConnection          patchCord534(VFOenvelope14, 0, VFOenvelopeMix14, 1);
AudioConnection          patchCord535(VFOenvelope15, 0, VFOenvelopeMix15, 1);
AudioConnection          patchCord536(VFOenvelope16, 0, VFOenvelopeMix16, 1);
AudioConnection          patchCord537(VFOenvelopeMix01, 0, VFOfilter01, 0);
AudioConnection          patchCord538(VFOenvelopeMix01, 0, VFOfilterMix01, 0);
AudioConnection          patchCord539(VFOenvelopeMix02, 0, VFOfilterMix02, 0);
AudioConnection          patchCord540(VFOenvelopeMix02, 0, VFOfilter02, 0);
AudioConnection          patchCord541(VFOenvelopeMix03, 0, VFOfilter03, 0);
AudioConnection          patchCord542(VFOenvelopeMix03, 0, VFOfilterMix03, 0);
AudioConnection          patchCord543(VFOenvelopeMix04, 0, VFOfilter04, 0);
AudioConnection          patchCord544(VFOenvelopeMix04, 0, VFOfilterMix04, 0);
AudioConnection          patchCord545(VFOenvelopeMix05, 0, VFOfilterMix05, 0);
AudioConnection          patchCord546(VFOenvelopeMix05, 0, VFOfilter05, 0);
AudioConnection          patchCord547(VFOenvelopeMix06, 0, VFOfilter06, 0);
AudioConnection          patchCord548(VFOenvelopeMix06, 0, VFOfilterMix06, 0);
AudioConnection          patchCord549(VFOenvelopeMix07, 0, VFOfilterMix07, 0);
AudioConnection          patchCord550(VFOenvelopeMix07, 0, VFOfilter07, 0);
AudioConnection          patchCord551(VFOenvelopeMix08, 0, VFOfilter08, 0);
AudioConnection          patchCord552(VFOenvelopeMix08, 0, VFOfilterMix08, 0);
AudioConnection          patchCord553(VFOenvelopeMix09, 0, VFOfilterMix09, 0);
AudioConnection          patchCord554(VFOenvelopeMix09, 0, VFOfilter09, 0);
AudioConnection          patchCord555(VFOenvelopeMix10, 0, VFOfilter10, 0);
AudioConnection          patchCord556(VFOenvelopeMix10, 0, VFOfilterMix10, 0);
AudioConnection          patchCord557(VFOenvelopeMix11, 0, VFOfilter11, 0);
AudioConnection          patchCord558(VFOenvelopeMix11, 0, VFOfilterMix11, 0);
AudioConnection          patchCord559(VFOenvelopeMix12, 0, VFOfilter12, 0);
AudioConnection          patchCord560(VFOenvelopeMix12, 0, VFOfilterMix12, 0);
AudioConnection          patchCord561(VFOenvelopeMix13, 0, VFOfilter13, 0);
AudioConnection          patchCord562(VFOenvelopeMix13, 0, VFOfilterMix13, 0);
AudioConnection          patchCord563(VFOenvelopeMix14, 0, VFOfilter14, 0);
AudioConnection          patchCord564(VFOenvelopeMix14, 0, VFOfilterMix14, 0);
AudioConnection          patchCord565(VFOenvelopeMix15, 0, VFOfilter15, 0);
AudioConnection          patchCord566(VFOenvelopeMix15, 0, VFOfilterMix15, 0);
AudioConnection          patchCord567(VFOenvelopeMix16, 0, VFOfilter16, 0);
AudioConnection          patchCord568(VFOenvelopeMix16, 0, VFOfilterMix16, 0);
AudioConnection          patchCord569(VFOfilter01, 0, VFOfilterMix01, 1);
AudioConnection          patchCord570(VFOfilter01, 1, VFOfilterMix01, 2);
AudioConnection          patchCord571(VFOfilter01, 2, VFOfilterMix01, 3);
AudioConnection          patchCord572(VFOfilter02, 0, VFOfilterMix02, 1);
AudioConnection          patchCord573(VFOfilter02, 1, VFOfilterMix02, 2);
AudioConnection          patchCord574(VFOfilter02, 2, VFOfilterMix02, 3);
AudioConnection          patchCord575(VFOfilter03, 0, VFOfilterMix03, 1);
AudioConnection          patchCord576(VFOfilter03, 1, VFOfilterMix03, 2);
AudioConnection          patchCord577(VFOfilter04, 0, VFOfilterMix04, 1);
AudioConnection          patchCord578(VFOfilter04, 1, VFOfilterMix04, 2);
AudioConnection          patchCord579(VFOfilter04, 2, VFOfilterMix04, 3);
AudioConnection          patchCord580(VFOfilter05, 0, VFOfilterMix05, 1);
AudioConnection          patchCord581(VFOfilter05, 1, VFOfilterMix05, 2);
AudioConnection          patchCord582(VFOfilter05, 2, VFOfilterMix05, 3);
AudioConnection          patchCord583(VFOfilter06, 0, VFOfilterMix06, 1);
AudioConnection          patchCord584(VFOfilter06, 1, VFOfilterMix06, 2);
AudioConnection          patchCord585(VFOfilter06, 2, VFOfilterMix06, 3);
AudioConnection          patchCord586(VFOfilter07, 0, VFOfilterMix07, 1);
AudioConnection          patchCord587(VFOfilter07, 1, VFOfilterMix07, 2);
AudioConnection          patchCord588(VFOfilter07, 2, VFOfilterMix07, 3);
AudioConnection          patchCord589(VFOfilter08, 0, VFOfilterMix08, 1);
AudioConnection          patchCord590(VFOfilter08, 1, VFOfilterMix08, 2);
AudioConnection          patchCord591(VFOfilter08, 2, VFOfilterMix08, 3);
AudioConnection          patchCord592(VFOfilter09, 0, VFOfilterMix09, 1);
AudioConnection          patchCord593(VFOfilter09, 1, VFOfilterMix09, 2);
AudioConnection          patchCord594(VFOfilter09, 2, VFOfilterMix09, 3);
AudioConnection          patchCord595(VFOfilter10, 0, VFOfilterMix10, 1);
AudioConnection          patchCord596(VFOfilter10, 1, VFOfilterMix10, 2);
AudioConnection          patchCord597(VFOfilter10, 2, VFOfilterMix10, 3);
AudioConnection          patchCord598(VFOfilter11, 0, VFOfilterMix11, 1);
AudioConnection          patchCord599(VFOfilter11, 1, VFOfilterMix11, 2);
AudioConnection          patchCord600(VFOfilter11, 2, VFOfilterMix11, 3);
AudioConnection          patchCord601(VFOfilter12, 0, VFOfilterMix12, 1);
AudioConnection          patchCord602(VFOfilter12, 1, VFOfilterMix12, 2);
AudioConnection          patchCord603(VFOfilter12, 2, VFOfilterMix12, 3);
AudioConnection          patchCord604(VFOfilter13, 0, VFOfilterMix13, 1);
AudioConnection          patchCord605(VFOfilter13, 1, VFOfilterMix13, 2);
AudioConnection          patchCord606(VFOfilter13, 2, VFOfilterMix13, 3);
AudioConnection          patchCord607(VFOfilter14, 0, VFOfilterMix14, 1);
AudioConnection          patchCord608(VFOfilter14, 1, VFOfilterMix14, 2);
AudioConnection          patchCord609(VFOfilter14, 2, VFOfilterMix14, 3);
AudioConnection          patchCord610(VFOfilter15, 0, VFOfilterMix15, 1);
AudioConnection          patchCord611(VFOfilter15, 1, VFOfilterMix15, 2);
AudioConnection          patchCord612(VFOfilter15, 2, VFOfilterMix15, 3);
AudioConnection          patchCord613(VFOfilter16, 0, VFOfilterMix16, 1);
AudioConnection          patchCord614(VFOfilter16, 1, VFOfilterMix16, 2);
AudioConnection          patchCord615(VFOfilter16, 2, VFOfilterMix16, 3);
AudioConnection          patchCord616(VFOfilterMix01, 0, mixStage2_1A, 0);
AudioConnection          patchCord617(VFOfilterMix02, 0, mixStage2_1A, 1);
AudioConnection          patchCord618(VFOfilterMix03, 0, mixStage2_1A, 2);
AudioConnection          patchCord619(VFOfilterMix04, 0, mixStage2_1A, 3);
AudioConnection          patchCord620(VFOfilterMix05, 0, mixStage2_2A, 0);
AudioConnection          patchCord621(VFOfilterMix06, 0, mixStage2_2A, 1);
AudioConnection          patchCord622(VFOfilterMix07, 0, mixStage2_2A, 2);
AudioConnection          patchCord623(VFOfilterMix08, 0, mixStage2_2A, 3);
AudioConnection          patchCord624(VFOfilterMix09, 0, mixStage2_3A, 0);
AudioConnection          patchCord625(VFOfilterMix10, 0, mixStage2_3A, 1);
AudioConnection          patchCord626(VFOfilterMix11, 0, mixStage2_3A, 2);
AudioConnection          patchCord627(VFOfilterMix12, 0, mixStage2_3A, 3);
AudioConnection          patchCord628(VFOfilterMix13, 0, mixStage2_4A, 0);
AudioConnection          patchCord629(VFOfilterMix14, 0, mixStage2_4A, 1);
AudioConnection          patchCord630(VFOfilterMix15, 0, mixStage2_4A, 2);
AudioConnection          patchCord631(VFOfilterMix16, 0, mixStage2_4A, 3);
AudioConnection          patchCord632(mixStage2_1A, 0, finalMix1A, 0);
AudioConnection          patchCord633(mixStage2_2A, 0, finalMix1A, 1);
AudioConnection          patchCord634(mixStage2_3A, 0, finalMix1A, 2);
AudioConnection          patchCord635(mixStage2_4A, 0, finalMix1A, 3);
AudioConnection          patchCord636(finalMix1A, 0, i2s1, 0);
AudioConnection          patchCord637(finalMix1A, 0, i2s1, 1);
//AudioConnection          patchCord638(finalMix1A, USBamp);
//AudioConnection          patchCord639(USBamp, 0, usb1, 1);
//AudioConnection          patchCord640(USBamp, 0, usb1, 0);
AudioControlSGTL5000     sgtl5000_1;     //xy=2654,20
// GUItool: end automatically generated code


// how long to let the MUX settle before reading/writing
#define MUX_SETTLING_TIME_MICROSECONDS 15

// how long to dwell to allow an LED to persist
#define LED_PERSIST_TIME_MICROSECONDS 10

// how long to let shift register signals settle when clocking data bits in
#define SHIFTREG_DELAY_MICROSECONDS 5

// keep track of how often to write the pot values to the serial monitor
#define STATUS_INTERVAL_MILLIS 250
unsigned long status_time = millis();

// keep track of how long to light the MIDI activity LED
#define ACTIVITY_LED_DURATION_MILLIS 5
unsigned long led_time;

// how long to maintain a note assignment for string
#define STRING_DURATION_MILLIS 125

// current setting of the pitch bend wheel
int pitch_bend = 0;

// multiplier for pitch bend (driven by control #7)
float pitch_multiplier = 0.4;

// keeps track of whether the pedal is pressed (driven by control #64)
boolean pedal_pressed = false;

// primary variables for each pot - NOTE: initial values can be set in setup, but will be overridden by actual pot values read in loop
int master_volume_pot;
int AB_balance_pot;
int vfo_tuning_pot;
int vfo_detuning_pot;
int midi_channel_pot;
int lfo_mod_frequency_pot;
int lfo_mod_dc_offset_pot;
int lfo_mod_sine_pot;
int lfo_mod_square_pot;
int lfo_mod_pulse_pot;
int lfo_mod_pulse_duty_pot;
int lfo_mod_triangle_pot;
int lfo_mod_saw_pot;
int lfo_mod_samphold_pot;
int vfoA_octave_pot;
int vfoA_sine_pot;
int vfoA_square_pot;
int vfoA_triangle_pot;
int vfoA_saw_pot;
int vfoA_string_pot;
int vfoA_white_pot;
int vfoA_pink_pot;
int vfoA_sweep_pot;
int vfoB_octave_pot;
int vfoB_sine_pot;
int vfoB_square_pot;
int vfoB_triangle_pot;
int vfoB_saw_pot;
int vfoB_string_pot;
int vfoB_white_pot;
int vfoB_pink_pot;
int vfoB_glide_pot;
int vfo_attack_pot;
int vfo_hold_pot;
int vfo_decay_pot;
int vfo_sustain_pot;
int vfo_release_pot;
int lfo_filt_frequency_pot;
int lfo_filt_dc_offset_pot;
int lfo_filt_sine_pot;
int lfo_filt_square_pot;
int lfo_filt_pulse_pot;
int lfo_filt_pulse_duty_pot;
int lfo_filt_triangle_pot;
int lfo_filt_saw_pot;
int lfo_filt_samphold_pot;
int vfo_corner_pot;
int vfo_resonance_pot;
int led_intensity_pot;

// change variables for each pot
int previous_master_volume_pot       = -1;
int previous_AB_balance_pot          = -1;
int previous_vfo_tuning_pot          = -1;
int previous_vfo_detuning_pot        = -1;
int previous_midi_channel_pot        = -1;
int previous_lfo_mod_frequency_pot   = -1;
int previous_lfo_mod_dc_offset_pot   = -1;
int previous_lfo_mod_sine_pot        = -1;
int previous_lfo_mod_square_pot      = -1;
int previous_lfo_mod_pulse_pot       = -1;
int previous_lfo_mod_pulse_duty_pot  = -1;
int previous_lfo_mod_triangle_pot    = -1;
int previous_lfo_mod_saw_pot         = -1;
int previous_lfo_mod_samphold_pot    = -1;
int previous_vfoA_octave_pot         = -1;
int previous_vfoA_sine_pot           = -1;
int previous_vfoA_square_pot         = -1;
int previous_vfoA_triangle_pot       = -1;
int previous_vfoA_saw_pot            = -1;
int previous_vfoA_string_pot         = -1;
int previous_vfoA_white_pot          = -1;
int previous_vfoA_pink_pot           = -1;
int previous_vfoA_sweep_pot          = -1;
int previous_vfoB_octave_pot         = -1;
int previous_vfoB_sine_pot           = -1;
int previous_vfoB_square_pot         = -1;
int previous_vfoB_triangle_pot       = -1;
int previous_vfoB_saw_pot            = -1;
int previous_vfoB_string_pot         = -1;
int previous_vfoB_white_pot          = -1;
int previous_vfoB_pink_pot           = -1;
int previous_vfoB_glide_pot          = -1;
int previous_vfo_attack_pot          = -1;
int previous_vfo_hold_pot            = -1;
int previous_vfo_decay_pot           = -1;
int previous_vfo_sustain_pot         = -1;
int previous_vfo_release_pot         = -1;
int previous_lfo_filt_frequency_pot  = -1;
int previous_lfo_filt_dc_offset_pot  = -1;
int previous_lfo_filt_sine_pot       = -1;
int previous_lfo_filt_square_pot     = -1;
int previous_lfo_filt_pulse_pot      = -1;
int previous_lfo_filt_pulse_duty_pot = -1;
int previous_lfo_filt_triangle_pot   = -1;
int previous_lfo_filt_saw_pot        = -1;
int previous_lfo_filt_samphold_pot   = -1;
int previous_vfo_corner_pot          = -1;
int previous_vfo_resonance_pot       = -1;
int previous_led_intensity_pot       = -1;

int midi_control_activity_state = false;

// variables for each LED - NOTE: initial values can be set in setup, but will be overridden by values read from EEPROM
bool midi_note_activity_state;
bool lfo_mod_active_state;
bool lfo_mod_single_state;
bool lfo_mod_sine_state;
bool lfo_mod_square_state;
bool lfo_mod_pulse_state;
bool lfo_mod_pulse_duty_state;
bool lfo_mod_triangle_state;
bool lfo_mod_saw_state;
bool lfo_mod_samphold_state;
bool vfoA_single_state;
bool vfoA_sine_state;
bool vfoA_square_state;
bool vfoA_triangle_state;
bool vfoA_saw_state;
bool vfoA_string_state;
bool vfoA_white_state;
bool vfoA_pink_state;
bool vfoA_sweep_state;
bool vfoB_single_state;
bool vfoB_sine_state;
bool vfoB_square_state;
bool vfoB_triangle_state;
bool vfoB_saw_state;
bool vfoB_string_state;
bool vfoB_white_state;
bool vfoB_pink_state;
bool vfoB_glide_state;
bool env_active_state;
bool lfo_filt_active_state;
bool lfo_filt_single_state;
bool lfo_filt_sine_state;
bool lfo_filt_square_state;
bool lfo_filt_pulse_state;
bool lfo_filt_pulse_duty_state;
bool lfo_filt_triangle_state;
bool lfo_filt_saw_state;
bool lfo_filt_samphold_state;
bool filt_none_state;
bool filt_lowpass_state;
bool filt_bandpass_state;
bool filt_highpass_state;


#define DEBOUNCE_COUNT_MAX 5

// debounce variables for each PB
int debounce_midi_panic_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_active_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_single_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_sine_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_square_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_pulse_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_pulse_duty_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_triangle_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_saw_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_mod_samphold_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_single_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_sine_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_square_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_triangle_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_saw_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_string_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_white_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_pink_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoA_sweep_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_single_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_sine_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_square_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_triangle_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_saw_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_string_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_white_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_pink_pb = DEBOUNCE_COUNT_MAX;
int debounce_vfoB_glide_pb = DEBOUNCE_COUNT_MAX;
int debounce_env_active_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_active_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_single_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_sine_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_square_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_pulse_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_pulse_duty_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_triangle_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_saw_pb = DEBOUNCE_COUNT_MAX;
int debounce_lfo_filt_samphold_pb = DEBOUNCE_COUNT_MAX;
int debounce_filt_none_pb = DEBOUNCE_COUNT_MAX;
int debounce_filt_lowpass_pb = DEBOUNCE_COUNT_MAX;
int debounce_filt_bandpass_pb = DEBOUNCE_COUNT_MAX;
int debounce_filt_highpass_pb = DEBOUNCE_COUNT_MAX;

// octave shift for each VFO
float octaveA_divisor = 1.0;
float octaveB_divisor = 1.0;

// the LED instensity (controlled by PWM signal to shift register output enable pin (active low)
int led_intensity = 0;
int previous_led_intensity = -1;

// the MIDI channel that we will listen to (0 = OMNI)
int midi_channel = 0;
int previous_midi_channel = -1;

typedef enum
{
   MUX_READ_POT = 0, MUX_READ_PB, MUX_OP_MAX
} MUX_OP_TYPE;

// keep track of the maximum number of simultaneous notes active at any given time
int maximum_notes = 0;

// values from the "note on" messages
struct POLY_SPEC
{
   int channel;                    // MIDI channel
   int base_pitch;                 // pitch (before any octave shift)
   bool note_state;                // whether the note has been turned on or turned off
   unsigned long note_off_millis;  // the time when the note off began (to allow envelope to complete before deallocating this note)
};

// array to keep track of notes playing
POLY_SPEC poly_notes[MAX_POLY];

USBHost tmpsUSB;
USBHub hub1(tmpsUSB);
USBHub hub2(tmpsUSB);
MIDIDevice usbhostMIDI(tmpsUSB);

MIDI_CREATE_DEFAULT_INSTANCE();

// pot enumeration index
typedef enum
{
   MUX_IN_MASTER_VOLUME_POT = 0, MUX_IN_AB_BALANCE_POT, MUX_IN_VFO_TUNING_POT, MUX_IN_VFO_DETUNING_POT, MUX_IN_MIDI_CHANNEL_POT,

   MUX_IN_LFO_MOD_FREQ_POT, MUX_IN_LFO_MOD_DC_OFFSET_POT,
   MUX_IN_LFO_MOD_SINE_POT, MUX_IN_LFO_MOD_SQUARE_POT, MUX_IN_LFO_MOD_PULSE_POT, MUX_IN_LFO_MOD_PULSE_DUTY_POT, MUX_IN_LFO_MOD_TRIANGLE_POT, MUX_IN_LFO_MOD_SAW_POT, MUX_IN_LFO_MOD_SAMPHOLD_POT,

   MUX_IN_VFOA_OCTAVE_POT,
   MUX_IN_VFOA_SINE_POT, MUX_IN_VFOA_SQUARE_POT, MUX_IN_VFOA_TRIANGLE_POT, MUX_IN_VFOA_SAW_POT, MUX_IN_VFOA_STRING_POT, MUX_IN_VFOA_WHITE_POT, MUX_IN_VFOA_PINK_POT, MUX_IN_VFOA_SWEEP_POT,

   MUX_IN_VFOB_OCTAVE_POT,
   MUX_IN_VFOB_SINE_POT, MUX_IN_VFOB_SQUARE_POT, MUX_IN_VFOB_TRIANGLE_POT, MUX_IN_VFOB_SAW_POT, MUX_IN_VFOB_STRING_POT, MUX_IN_VFOB_WHITE_POT, MUX_IN_VFOB_PINK_POT, MUX_IN_VFOB_GLIDE_POT,

   MUX_IN_ENV_ATTACK_POT, MUX_IN_ENV_HOLD_POT, MUX_IN_ENV_DECAY_POT, MUX_IN_ENV_SUSTAIN_POT, MUX_IN_ENV_RELEASE_POT,
   
   MUX_IN_LFO_FILT_FREQ_POT, MUX_IN_LFO_FILT_DC_OFFSET_POT,
   MUX_IN_LFO_FILT_SINE_POT, MUX_IN_LFO_FILT_SQUARE_POT, MUX_IN_LFO_FILT_PULSE_POT, MUX_IN_LFO_FILT_PULSE_DUTY_POT, MUX_IN_LFO_FILT_TRIANGLE_POT, MUX_IN_LFO_FILT_SAW_POT, MUX_IN_LFO_FILT_SAMPHOLD_POT,

   MUX_IN_FILT_CORNER_POT, MUX_IN_FILT_RESONANCE_POT,

   MUX_IN_LED_INTENSITY_POT,

   MUX_IN_POT_MAX
} MUX_INPUT_POT_INDEX;

// PB enumeration index
typedef enum
{
   MUX_IN_MIDI_PANIC_PB = 0,

   MUX_IN_LFO_MOD_ACTIVE_PB, MUX_IN_LFO_MOD_SINGLE_PB,
   MUX_IN_LFO_MOD_SINE_PB, MUX_IN_LFO_MOD_SQUARE_PB, MUX_IN_LFO_MOD_PULSE_PB, MUX_IN_LFO_MOD_PULSE_DUTY_PB, MUX_IN_LFO_MOD_TRIANGLE_PB, MUX_IN_LFO_MOD_SAW_PB, MUX_IN_LFO_MOD_SAMPHOLD_PB,

   MUX_IN_VFOA_SINGLE_PB,
   MUX_IN_VFOA_SINE_PB, MUX_IN_VFOA_SQUARE_PB, MUX_IN_VFOA_TRIANGLE_PB, MUX_IN_VFOA_SAW_PB, MUX_IN_VFOA_STRING_PB, MUX_IN_VFOA_WHITE_PB, MUX_IN_VFOA_PINK_PB, MUX_IN_VFOA_SWEEP_PB,

   MUX_IN_VFOB_SINGLE_PB,
   MUX_IN_VFOB_SINE_PB, MUX_IN_VFOB_SQUARE_PB, MUX_IN_VFOB_TRIANGLE_PB, MUX_IN_VFOB_SAW_PB, MUX_IN_VFOB_STRING_PB, MUX_IN_VFOB_WHITE_PB, MUX_IN_VFOB_PINK_PB, MUX_IN_VFOB_GLIDE_PB,

   MUX_IN_ENVELOPE_ACTIVE_PB,

   MUX_IN_LFO_FILT_ACTIVE_PB, MUX_IN_LFO_FILT_SINGLE_PB,
   MUX_IN_LFO_FILT_SINE_PB, MUX_IN_LFO_FILT_SQUARE_PB, MUX_IN_LFO_FILT_PULSE_PB, MUX_IN_LFO_FILT_PULSE_DUTY_PB, MUX_IN_LFO_FILT_TRIANGLE_PB, MUX_IN_LFO_FILT_SAW_PB, MUX_IN_LFO_FILT_SAMPHOLD_PB,

   MUX_IN_FILTER_NONE_PB, MUX_IN_FILTER_LOWPASS_PB, MUX_IN_FILTER_BANDPASS_PB, MUX_IN_FILTER_HIGHPASS_PB,

   MUX_IN_PB_MAX
} MUX_INPUT_PB_INDEX;


// glide calculations & management
unsigned long glide_start_millis = 0;
unsigned long glide_duration_millis = 0;
float glide_start_base_freq = 0;
float glide_target_base_freq = 0;
float glide_current_base_freq = 0;


// index variables
int mux_input_pot_index = MUX_IN_MASTER_VOLUME_POT;
int mux_input_pb_index = MUX_IN_MIDI_PANIC_PB;
int mux_op_type = MUX_READ_POT;

// pin definitions (any not listed here are already in use by other teensy functionality such as audio board, etc.)
#define PRIMARY_MUX_DECODE_BIT3_PIN          2  // teensy 02
#define PRIMARY_MUX_DECODE_BIT2_PIN          3  // teensy 03
#define PRIMARY_MUX_DECODE_BIT1_PIN          4  // teensy 04
#define PRIMARY_MUX_DECODE_BIT0_PIN          5  // teensy 05

#define MUX_LOW_ENABLE_PIN                   6  // teensy 06

#define SECONDARY_MUX_DECODE_BIT3_PIN        9  // teensy 09
#define SECONDARY_MUX_DECODE_BIT2_PIN       10  // teensy 10
#define SECONDARY_MUX_DECODE_BIT1_PIN       11  // teensy 11
#define SECONDARY_MUX_DECODE_BIT0_PIN       12  // teensy 12

#define LED_PIN                             13  // teensy 13
#define SHIFTREG_CLOCK_PIN             LED_PIN  // teensy 13

#define PRIMARY_MUX_INPUT_OUTPUT_PIN        A0  // teensy 14
#define AUDIO_VOLUME_PIN                    A1  // teensy 15
#define SHIFTREG_DATA_PIN     AUDIO_VOLUME_PIN  // teensy 15

#define MIDI_NOTE_ACTIVITY_LED_PIN          A2  // teensy 16
#define MIDI_CONTROL_ACTIVITY_LED_PIN       A3  // teensy 17

#define SHIFTREG_LOW_OUTPUT_ENABLE_PIN      22  // teensy 22

// manage accumulating LED state changes to reduce EEPROM writes
#define SAVE_DELAY_MILLIS 5000
unsigned long save_delay_millis = 0;
bool save_needed = false;

// LED display variables
bool led_display_left[7];
bool led_display_right[7];

// LED display digit definitions (7-segments, DP is driven by dedicated pin)
// (non-typical segment labels)
// this assumes the LED display is a "common cathode" device
//
//         a a a
//      b         c
//      b         c
//      b         c
//         d d d
//      e         f
//      e         f
//      e         f
//         g g g
//

const bool DIGIT_0[] =
{        true,
  true,         true,
        false,
  true,         true,
         true
};                         

const bool DIGIT_1[] =
{       false,
 false,         true,
        false,
 false,         true,
        false
};                         

const bool DIGIT_2[] =
{        true,
 false,         true,
         true,
  true,        false,
         true
};                         

const bool DIGIT_3[] =
{        true,
 false,         true,
         true,
 false,         true,
         true
};                         

const bool DIGIT_4[] =
{       false,
  true,         true,
         true,
 false,         true,
        false
};                         

const bool DIGIT_5[] =
{        true,
  true,        false,
         true,
 false,         true,
         true
};                         

const bool DIGIT_6[] =
{        true,
  true,        false,
         true,
  true,         true,
         true
};                         

const bool DIGIT_7[] =
{        true,
 false,         true,
        false,
 false,         true,
        false
};                         

const bool DIGIT_8[] =
{        true,
  true,         true,
         true,
  true,         true,
         true
};                         

const bool DIGIT_9[] =
{        true,
  true,         true,
         true,
 false,         true,
         true
};                         

const bool DIGIT_A[] =
{        true,
  true,         true,
         true,
  true,         true,
        false
};                         

const bool DIGIT_LL[] =
{       false,
  true,         true,
        false,
  true,         true,
        false
};                         

const bool DIGIT_BLANK[] =
{       false,
 false,        false,
        false,
 false,        false,
        false
};                         

bool *shiftreg_output_led_ref[] =
{
   &led_display_left[0],
   &led_display_left[1],
   &led_display_left[2],
   &led_display_left[3],
   &led_display_left[4],
   &led_display_left[5],
   &led_display_left[6],
   &led_display_right[0],
   &led_display_right[1],
   &led_display_right[2],
   &led_display_right[3],
   &led_display_right[4],
   &led_display_right[5],
   &led_display_right[6],
   &lfo_mod_active_state,
   &lfo_mod_single_state,
   &lfo_mod_sine_state,
   &lfo_mod_square_state,
   &lfo_mod_pulse_state,
   &lfo_mod_pulse_duty_state,
   &lfo_mod_triangle_state,
   &lfo_mod_saw_state,
   &lfo_mod_samphold_state,
   &vfoA_single_state,
   &vfoA_sine_state,
   &vfoA_square_state,
   &vfoA_triangle_state,
   &vfoA_saw_state,
   &vfoA_string_state,
   &vfoA_white_state,
   &vfoA_pink_state,
   &vfoA_sweep_state,
   &vfoB_single_state,
   &vfoB_sine_state,
   &vfoB_square_state,
   &vfoB_triangle_state,
   &vfoB_saw_state,
   &vfoB_string_state,
   &vfoB_white_state,
   &vfoB_pink_state,
   &vfoB_glide_state,
   &env_active_state,
   &lfo_filt_active_state,
   &lfo_filt_single_state,
   &lfo_filt_sine_state,
   &lfo_filt_square_state,
   &lfo_filt_pulse_state,
   &lfo_filt_pulse_duty_state,
   &lfo_filt_triangle_state,
   &lfo_filt_saw_state,
   &lfo_filt_samphold_state,
   &filt_none_state,
   &filt_lowpass_state,
   &filt_bandpass_state,
   &filt_highpass_state,
};

#define NUM_LEDS 55


// function headers
void cycle_debug(void);
void defaults(void);
void display_status(void);
void dump_settings(void);
void handleActiveSensing(void);
void handleAfterTouchChannel(byte channel, byte pressure);
void handleAfterTouchPoly(byte channel, byte note, byte pressure);
void handleClock(void);
void handleContinue(void);
void handleControlChange(byte channel, byte number, byte value);
void handleNoteOff(byte channel, byte pitch, byte velocity);
void handleNoteOn(byte channel, byte pitch, byte velocity);
void handlePitchBend(byte channel, int bend);
void handleProgramChange(byte channel, byte number);
void handleSongPosition(unsigned beats);
void handleSongSelect(byte songnumber);
void handleStart(void);
void handleStop(void);
void handleSystemExclusive(byte * array, unsigned size);
void handleSystemReset(void);
void handleTimeCodeQuarterFrame(byte data);
void handleTuneRequest(void);
void kill_all_notes(void);
void loop();
void MIDI_handleActiveSensing(void);
void MIDI_handleAfterTouchChannel(byte channel, byte pressure);
void MIDI_handleAfterTouchPoly(byte channel, byte note, byte pressure);
void MIDI_handleClock(void);
void MIDI_handleContinue(void);
void MIDI_handleControlChange(byte channel, byte number, byte value);
void MIDI_handleNoteOff(byte channel, byte pitch, byte velocity);
void MIDI_handleNoteOn(byte channel, byte pitch, byte velocity);
void MIDI_handlePitchBend(byte channel, int bend);
void MIDI_handleProgramChange(byte channel, byte number);
void MIDI_handleSongPosition(unsigned beats);
void MIDI_handleSongSelect(byte songnumber);
void MIDI_handleStart(void);
void MIDI_handleStop(void);
void MIDI_handleSystemExclusive(byte * array, unsigned size);
void MIDI_handleSystemReset(void);
void MIDI_handleTimeCodeQuarterFrame(byte data);
void MIDI_handleTuneRequest(void);
void read_settings(void);
void run_shiftreg_led_test(void);
void save_settings(void);
void set_lfo_filt_gain(void);
void set_lfo_mod_gain(void);
void set_vfo_filter_gain(void);
void set_vfo_wave_gain(void);
void setup();
void show_index(int index);
void USB_handleActiveSensing(void);
void USB_handleAfterTouchChannel(byte channel, byte pressure);
void USB_handleAfterTouchPoly(byte channel, byte note, byte pressure);
void USB_handleClock(void);
void USB_handleContinue(void);
void USB_handleControlChange(byte channel, byte number, byte value);
void USB_handleNoteOff(byte channel, byte pitch, byte velocity);
void USB_handleNoteOn(byte channel, byte pitch, byte velocity);
void USB_handlePitchBend(byte channel, int bend);
void USB_handleProgramChange(byte channel, byte number);
void USB_handleSongPosition(unsigned beats);
void USB_handleSongSelect(byte songnumber);
void USB_handleStart(void);
void USB_handleStop(void);
void USB_handleSystemExclusive(byte * array, unsigned size);
void USB_handleSystemReset(void);
void USB_handleTimeCodeQuarterFrame(byte data);
void USB_handleTuneRequest(void);
void usbhostMIDI_handleActiveSensing(void);
void usbhostMIDI_handleAfterTouchChannel(byte channel, byte pressure);
void usbhostMIDI_handleAfterTouchPoly(byte channel, byte note, byte pressure);
void usbhostMIDI_handleClock(void);
void usbhostMIDI_handleContinue(void);
void usbhostMIDI_handleControlChange(byte channel, byte number, byte value);
void usbhostMIDI_handleNoteOff(byte channel, byte pitch, byte velocity);
void usbhostMIDI_handleNoteOn(byte channel, byte pitch, byte velocity);
void usbhostMIDI_handlePitchBend(byte channel, int bend);
void usbhostMIDI_handleProgramChange(byte channel, byte number);
void usbhostMIDI_handleSongPosition(unsigned beats);
void usbhostMIDI_handleSongSelect(byte songnumber);
void usbhostMIDI_handleStart(void);
void usbhostMIDI_handleStop(void);
void usbhostMIDI_handleSystemExclusive(byte * array, unsigned size);
void usbhostMIDI_handleSystemReset(void);
void usbhostMIDI_handleTimeCodeQuarterFrame(byte data);
void usbhostMIDI_handleTuneRequest(void);
void write_leds_thru_shiftreg(void);




// display the time between loop cycles
void cycle_debug(void)
{
   unsigned long cycle_time;
   static unsigned long previous_cycle_time;
   static unsigned long previous_millis;

   float audio_usage;
   static float previous_audio_usage;

   float audio_usage_max;
   static float previous_audio_usage_max;

   cycle_time = millis() - previous_millis;

   audio_usage = AudioProcessorUsage();
   audio_usage_max = AudioProcessorUsageMax();

   if ((audio_usage != previous_audio_usage) || (audio_usage_max != previous_audio_usage_max) || (cycle_time != previous_cycle_time))
   {
      previous_cycle_time = cycle_time;

      Serial.print("...cycle debug = ");
      Serial.print(cycle_time);
      Serial.println(" milliseconds...");

      previous_audio_usage = audio_usage;
      previous_audio_usage_max = audio_usage_max;

      Serial.print("Current audio usage = ");
      Serial.println(audio_usage);

      Serial.print("Max audio usage = ");
      Serial.println(audio_usage_max);
   }

   previous_millis = millis();
}  // cycle_debug()


// set everything to default values - NOTE: if EEPROM read is enabled, then these values can/will be overridden by the values read from EEPROM
void defaults(void)
{
   lfo_mod_active_state = false;
   lfo_mod_single_state = false;
   lfo_mod_sine_state = false;
   lfo_mod_square_state = false;
   lfo_mod_pulse_state = false;
   lfo_mod_pulse_duty_state = false;
   lfo_mod_triangle_state = false;
   lfo_mod_saw_state = false;
   lfo_mod_samphold_state = false;

   vfoA_single_state = false;
   vfoA_sine_state = false;
   vfoA_square_state = true;
   vfoA_triangle_state = false;
   vfoA_saw_state = true;
   vfoA_string_state = false;
   vfoA_white_state = true;
   vfoA_pink_state = false;
   vfoA_sweep_state = false;

   vfoB_single_state = false;
   vfoB_sine_state = false;
   vfoB_square_state = true;
   vfoB_triangle_state = false;
   vfoB_saw_state = true;
   vfoB_string_state = false;
   vfoB_white_state = true;
   vfoB_pink_state = false;
   vfoB_glide_state = false;

   env_active_state = true;

   lfo_filt_active_state = false;
   lfo_filt_single_state = false;
   lfo_filt_sine_state = false;
   lfo_filt_square_state = false;
   lfo_filt_pulse_state = false;
   lfo_filt_pulse_duty_state = false;
   lfo_filt_triangle_state = false;
   lfo_filt_saw_state = false;
   lfo_filt_samphold_state = false;

   filt_none_state = true;
   filt_lowpass_state = false;
   filt_bandpass_state = false;
   filt_highpass_state = false;

   master_volume_pot = 864;
   AB_balance_pot = 540;
   vfo_tuning_pot = 510;
   vfo_detuning_pot = 501;
   midi_channel_pot = 0;

   lfo_mod_frequency_pot = 0;
   lfo_mod_dc_offset_pot = 511;
   lfo_mod_sine_pot = 0;
   lfo_mod_square_pot = 0;
   lfo_mod_pulse_pot = 0;
   lfo_mod_pulse_duty_pot = 0;
   lfo_mod_triangle_pot = 0;
   lfo_mod_saw_pot = 0;
   lfo_mod_samphold_pot = 0;

   vfoA_octave_pot = 385;
   vfoA_sine_pot = 0;
   vfoA_square_pot = 1022;
   vfoA_triangle_pot = 0;
   vfoA_saw_pot = 1022;
   vfoA_string_pot = 0;
   vfoA_white_pot = 674;
   vfoA_pink_pot = 0;
   vfoA_sweep_pot = 0;

   vfoB_octave_pot = 552;
   vfoB_sine_pot = 0;
   vfoB_square_pot = 1022;
   vfoB_triangle_pot = 0;
   vfoB_saw_pot = 1022;
   vfoB_string_pot = 0;
   vfoB_white_pot = 704;
   vfoB_pink_pot = 0;
   vfoB_glide_pot = 0;

   vfo_attack_pot = 60;
   vfo_hold_pot = 0;
   vfo_decay_pot = 480;
   vfo_sustain_pot = 1022;
   vfo_release_pot = 540;

   lfo_filt_frequency_pot = 0;
   lfo_filt_dc_offset_pot = 0;
   lfo_filt_sine_pot = 0;
   lfo_filt_square_pot = 0;
   lfo_filt_pulse_pot = 0;
   lfo_filt_pulse_duty_pot = 0;
   lfo_filt_triangle_pot = 0;
   lfo_filt_saw_pot = 0;
   lfo_filt_samphold_pot = 0;

   vfo_corner_pot = 0;
   vfo_resonance_pot = 0;
}  // defaults()


// display the current status
void display_status(void)
{
#ifdef DEBUG_MEMORY_USAGE
   static int max_blocks_used = AudioMemoryUsageMax();
   static int previous_max_blocks_used;
   static int blocks_used = AudioMemoryUsage();
   static int previous_blocks_used;

   if ((blocks_used != previous_blocks_used) || (max_blocks_used != previous_max_blocks_used))
   {
      previous_blocks_used = blocks_used;
      previous_max_blocks_used = max_blocks_used;

      Serial.println("");
      Serial.print("   Maximum memory blocks used = ");
      Serial.print(max_blocks_used);
      Serial.print("      Current memory blocks used = ");
      Serial.println(blocks_used);
   }
#endif
}  // display_status()


// detail all of the current settings
void dump_settings(void)
{
   Serial.println("");
   Serial.println(TITLE);
   Serial.println(VERDAT);
   Serial.println("");
   Serial.println("Dump of current settings:");

   Serial.print("Master Volume Pot         : ");
   Serial.println(master_volume_pot);

   Serial.print("AB Balance Pot            : ");
   Serial.println(AB_balance_pot);

   Serial.print("VFO tuning Pot            : ");
   Serial.println(vfo_tuning_pot);

   Serial.print("VFO Detuning Pot          : ");
   Serial.println(vfo_detuning_pot);

   Serial.print("MIDI Channel              : ");
   if (midi_channel == 0)
   {
      Serial.println("All");
   } else {
      Serial.println(midi_channel);
   }

   Serial.println("");

   if (lfo_mod_active_state == false)
   {
      Serial.println("LFOmod Active             : DISABLED");
      Serial.println("LFOmod Single             : DISABLED");

      Serial.println("LFOmod Frequency Pot      : N/A");
      Serial.println("LFOmod DC Offset Pot      : N/A");
      Serial.println("LFOmod Sine Pot           : N/A");
      Serial.println("LFOmod Square Pot         : N/A");
      Serial.println("LFOmod Pulse Pot          : N/A");
      Serial.println("LFOmod Pulse Duty Pot     : N/A");
      Serial.println("LFOmod Triangle Pot       : N/A");
      Serial.println("LFOmod Sawtooth Pot       : N/A");
      Serial.println("LFOmod Sample/Hold Pot    : N/A");
   } else {
      Serial.println("LFOmod Active             : ENABLED");

      if (lfo_mod_single_state == false)
      {
         Serial.println("LFOmod Single             : DISABLED");
      } else {
         Serial.println("LFOmod Single             : ENABLED");
      }

      Serial.print("LFOmod Frequency Pot      : ");
      Serial.println(lfo_mod_frequency_pot);

      Serial.print("LFOmod DC Offset Pot      : ");
      Serial.println(lfo_mod_dc_offset_pot);

      if (lfo_mod_sine_state == false)
      {
         Serial.println("LFOmod Sine Pot           : DISABLED");
      } else {
         Serial.print("LFOmod Sine Pot           : ");
         Serial.println(lfo_mod_sine_pot);
      }

      if (lfo_mod_square_state == false)
      {
         Serial.println("LFOmod Square Pot         : DISABLED");
      } else {
         Serial.print("LFOmod Square Pot         : ");
         Serial.println(lfo_mod_square_pot);
      }

      if (lfo_mod_pulse_state == false)
      {
         Serial.println("LFOmod Pulse Pot          : DISABLED");
      } else {
         Serial.print("LFOmod Pulse Pot          : ");
         Serial.println(lfo_mod_pulse_pot);
      }

      if (lfo_mod_pulse_duty_state == false)
      {
         Serial.println("LFOmod Pulse Duty Pot     : DISABLED");
      } else {
         Serial.print("LFOmod Pulse Duty Pot     : ");
         Serial.println(lfo_mod_pulse_duty_pot);
      }

      if (lfo_mod_triangle_state == false)
      {
         Serial.println("LFOmod Triangle Pot       : DISABLED");
      } else {
         Serial.print("LFOmod Triangle Pot       : ");
         Serial.println(lfo_mod_triangle_pot);
      }

      if (lfo_mod_saw_state == false)
      {
         Serial.println("LFOmod Sawtooth Pot       : DISABLED");
      } else {
         Serial.print("LFOmod Sawtooth Pot       : ");
         Serial.println(lfo_mod_saw_pot);
      }

      if (lfo_mod_samphold_state == false)
      {
         Serial.println("LFOmod Sample/Hold Pot    : DISABLED");
      } else {
         Serial.print("LFOmod Sample/Hold Pot    : ");
         Serial.println(lfo_mod_samphold_pot);
      }
   }

   Serial.println("");

   if (vfoA_single_state == false)
   {
      Serial.println("VFO A Single              : DISABLED");
   } else {
      Serial.println("VFO A Single              : ENABLED");
   }

   Serial.print("VFO A Octave Pot          : ");
   Serial.println(vfoA_octave_pot);

   if (vfoA_sine_state == false)
   {
      Serial.println("VFO A Sine Pot            : DISABLED");
   } else {
      Serial.print("VFO A Sine Pot            : ");
      Serial.println(vfoA_sine_pot);
   }

   if (vfoA_square_state == false)
   {
      Serial.println("VFO A Square Pot          : DISABLED");
   } else {
      Serial.print("VFO A Square Pot          : ");
      Serial.println(vfoA_square_pot);
   }

   if (vfoA_triangle_state == false)
   {
      Serial.println("VFO A Triangle Pot        : DISABLED");
   } else {
      Serial.print("VFO Triangle Pot          : ");
      Serial.println(vfoA_triangle_pot);
   }

   if (vfoA_saw_state == false)
   {
      Serial.println("VFO A Sawtooth Pot        : DISABLED");
   } else {
      Serial.print("VFO A Sawtooth Pot        : ");
      Serial.println(vfoA_saw_pot);
   }

   if (vfoA_string_state == false)
   {
      Serial.println("VFO A Sring Pot           : DISABLED");
   } else {
      Serial.print("VFO A Sring Pot           : ");
      Serial.println(vfoA_string_pot);
   }

   if (vfoA_white_state == false)
   {
      Serial.println("VFO A White Noise Pot     : DISABLED");
   } else {
      Serial.print("VFO A White Noise Pot     : ");
      Serial.println(vfoA_white_pot);
   }

   if (vfoA_pink_state == false)
   {
      Serial.println("VFO A Pink Noise Pot      : DISABLED");
   } else {
      Serial.print("VFO A Pink Noise Pot      : ");
      Serial.println(vfoA_pink_pot);
   }

   if (vfoA_sweep_state == false)
   {
      Serial.println("VFO A Tone Sweep Pot      : DISABLED");
   } else {
      Serial.print("VFO A Tone Sweep Pot      : ");
      Serial.println(vfoA_sweep_pot);
   }

   Serial.println("");

   if (vfoB_single_state == false)
   {
      Serial.println("VFO B Single              : DISABLED");
   } else {
      Serial.println("VFO B Single              : ENABLED");
   }

   Serial.print("VFO B Octave Pot          : ");
   Serial.println(vfoB_octave_pot);

   if (vfoB_sine_state == false)
   {
      Serial.println("VFO B Sine Pot            : DISABLED");
   } else {
      Serial.print("VFO B Sine Pot            : ");
      Serial.println(vfoB_sine_pot);
   }

   if (vfoB_square_state == false)
   {
      Serial.println("VFO B Square Pot          : DISABLED");
   } else {
      Serial.print("VFO B Square Pot          : ");
      Serial.println(vfoB_square_pot);
   }

   if (vfoB_triangle_state == false)
   {
      Serial.println("VFO B Triangle Pot        : DISABLED");
   } else {
      Serial.print("VFO B Triangle Pot        : ");
      Serial.println(vfoB_triangle_pot);
   }

   if (vfoB_saw_state == false)
   {
      Serial.println("VFO B Sawtooth Pot        : DISABLED");
   } else {
      Serial.print("VFO B Sawtooth Pot        : ");
      Serial.println(vfoB_saw_pot);
   }

   if (vfoB_string_state == false)
   {
      Serial.println("VFO B String Pot          : DISABLED");
   } else {
      Serial.print("VFO B String Pot          : ");
      Serial.println(vfoB_string_pot);
   }

   if (vfoB_white_state == false)
   {
      Serial.println("VFO B White Noise Pot     : DISABLED");
   } else {
      Serial.print("VFO B White Noise Pot     : ");
      Serial.println(vfoB_white_pot);
   }

   if (vfoB_pink_state == false)
   {
      Serial.println("VFO B Pink Noise Pot      : DISABLED");
   } else {
      Serial.print("VFO B Pink Noise Pot      : ");
      Serial.println(vfoB_pink_pot);
   }

   if (vfoB_glide_state == false)
   {
      Serial.println("VFO B Glide Pot           : DISABLED");
   } else {
      Serial.print("VFO B Glide Pot           : ");
      Serial.println(vfoB_glide_pot);
   }

   Serial.println("");

   if (env_active_state == false)
   {
      Serial.println("Envelope Active           : DISABLED");

      Serial.println("Envelope Attack Pot       : DISABLED");
      Serial.println("Envelope Hold Pot         : DISABLED");
      Serial.println("Envelope Decay Pot        : DISABLED");
      Serial.println("Envelope Sustain Pot      : DISABLED");
      Serial.println("Envelope Release Pot      : DISABLED");
   } else {
      Serial.println("Envelope Active           : ENABLED");

      Serial.print("Envelope Attack Pot       : ");
      Serial.println(vfo_attack_pot);

      Serial.print("Envelope Hold Pot         : ");
      Serial.println(vfo_hold_pot);

      Serial.print("Envelope Decay Pot        : ");
      Serial.println(vfo_decay_pot);

      Serial.print("Envelope Sustain Pot      : ");
      Serial.println(vfo_sustain_pot);

      Serial.print("Envelope Release Pot      : ");
      Serial.println(vfo_release_pot);
   }

   Serial.println("");

   if (lfo_filt_active_state == false)
   {
      Serial.println("LFOfilter Active          : DISABLED");
      Serial.println("LFOfilter Single          : DISABLED");
      
      Serial.println("LFOfilter Frequency Pot   : N/A");
      Serial.println("LFOfilter DC Offset Pot   : N/A");
      Serial.println("LFOfilter Sine Pot        : N/A");
      Serial.println("LFOfilter Square Pot      : N/A");
      Serial.println("LFOfilter Pulse Pot       : N/A");
      Serial.println("LFOfilter Pulse Duty Pot  : N/A");
      Serial.println("LFOfilter Triangle Pot    : N/A");
      Serial.println("LFOfilter Sawtooth Pot    : N/A");
      Serial.println("LFOfilter Sample/Hold Pot : N/A");
   } else {
      Serial.println("LFOfilter Active          : ENABLED");

      if (lfo_filt_single_state == false)
      {
         Serial.println("LFOfilter Single          : DISABLED");
      } else {
         Serial.println("LFOfilter Single          : ENABLED");
      }

      Serial.print("LFOfilter Frequency Pot   : ");
      Serial.println(lfo_filt_frequency_pot);

      Serial.print("LFOfilter DC Offset Pot   : ");
      Serial.println(lfo_filt_dc_offset_pot);

      if (lfo_mod_sine_state == false)
      {
         Serial.println("LFOfilter Sine Pot        : DISABLED");
      } else {
         Serial.print("LFOfilter Sine Pot        : ");
         Serial.println(lfo_filt_sine_pot);
      }

      if (lfo_mod_square_state == false)
      {
         Serial.println("LFOfilter Square Pot      : DISABLED");
      } else {
         Serial.print("LFOfilter Square Pot      : ");
         Serial.println(lfo_filt_square_pot);
      }

      if (lfo_mod_pulse_state == false)
      {
         Serial.println("LFOfilter Pulse Pot       : DISABLED");
      } else {
         Serial.print("LFOfilter Pulse Pot       : ");
         Serial.println(lfo_filt_pulse_pot);
      }

      if (lfo_mod_pulse_duty_state == false)
      {
         Serial.println("LFOfilter Pulse Duty Pot  : DISABLED");
      } else {
         Serial.print("LFOfilter Pulse Duty Pot  : ");
         Serial.println(lfo_filt_pulse_duty_pot);
      }

      if (lfo_mod_triangle_state == false)
      {
         Serial.println("LFOfilter Triangle Pot    : DISABLED");
      } else {
         Serial.print("LFOfilter Triangle Pot    : ");
         Serial.println(lfo_filt_triangle_pot);
      }

      if (lfo_mod_saw_state == false)
      {
         Serial.println("LFOfilter Sawtooth Pot    : DISABLED");
      } else {
         Serial.print("LFOfilter Sawtooth Pot    : ");
         Serial.println(lfo_filt_saw_pot);
      }

      if (lfo_mod_samphold_state == false)
      {
         Serial.println("LFOfilter Sample/Hold Pot : DISABLED");
      } else {
         Serial.print("LFOfilter Sample/Hold Pot : ");
         Serial.println(lfo_filt_samphold_pot);
      }
   }

   Serial.println("");

   if (filt_none_state == true)
   {
      Serial.println("Filter None Active        : ENABLED");
      Serial.println("Filter Low Pass Active    : DISABLED");
      Serial.println("Filter Band Pass Active   : DISABLED");
      Serial.println("Filter High Pass Active   : DISABLED");

      Serial.println("Filter Corner Freq Pot    : DISABLED");
      Serial.println("Filter Resonance Pot      : DISABLED");
   } else {
      Serial.println("Filter None Active        : DISABLED");

      if (filt_lowpass_state == false)
      {
         Serial.println("Filter Low Pass Active    : DISABLED");
      } else {
         Serial.println("Filter Low Pass Active    : ENABLED");
      }

      if (filt_bandpass_state == false)
      {
         Serial.println("Filter Band Pass Active   : DISABLED");
      } else {
         Serial.println("Filter Band Pass Active   : ENABLED");
      }

      if (filt_highpass_state == false)
      {
         Serial.println("Filter High Pass Active   : DISABLED");
      } else {
         Serial.println("Filter High Pass Active   : ENABLED");
      }

      Serial.print("Filter Corner Freq Pot    : ");
      Serial.println(vfo_corner_pot);

      Serial.print("Filter Resonance Pot      : ");
      Serial.println(vfo_resonance_pot);
   }

   Serial.println("");
}  // dump_settings()


// MIDI message callback - active sensing
void handleActiveSensing(void)
{
   midi_control_activity_state = true;
}  // handleActiveSensing()


// MIDI message callback - after touch channel
void handleAfterTouchChannel(byte channel, byte pressure)
{
   midi_control_activity_state = true;
}  // handleAfterTouchChannel()


// MIDI message callback - after touch poly
void handleAfterTouchPoly(byte channel, byte note, byte pressure)
{
   midi_control_activity_state = true;
}  // handleAfterTouchPoly()


// MIDI message callback - clock
void handleClock(void)
{
   midi_control_activity_state = true;
}  // handleClock()


// MIDI message callback - continue
void handleContinue(void)
{
   midi_control_activity_state = true;
}  // handleContinue()


// MIDI message callback - control change
void handleControlChange(byte channel, byte number, byte value)
{
   AudioNoInterrupts();

   midi_control_activity_state = true;

   // MOD wheel
   if (number == 1)
   {
      pitch_multiplier = ((value) / 35.56) + 0.4;

#ifdef DEBUG_CC_MSGS
      Serial.print("pbend multiplier = ");
      Serial.println(pitch_multiplier);
#endif

      VFOtuningA.amplitude((((float)(vfo_tuning_pot - 511) / 1024.0) + (float)(vfo_detuning_pot - 511) / 1024.0) / pitch_multiplier * 0.5);
      VFOtuningB.amplitude((((float)(vfo_tuning_pot - 511) / 1024.0) - (float)(vfo_detuning_pot - 511) / 1024.0) / pitch_multiplier * 0.5);

      VFOsine16A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare16A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle16A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw16A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine16B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare16B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle16B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw16B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine15A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare15A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle15A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw15A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine15B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare15B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle15B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw15B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine14A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare14A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle14A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw14A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine14B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare14B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle14B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw14B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine13A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare13A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle13A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw13A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine13B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare13B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle13B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw13B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine12A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare12A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle12A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw12A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine12B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare12B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle12B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw12B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine11A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare11A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle11A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw11A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine11B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare11B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle11B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw11B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine10A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare10A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle10A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw10A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine10B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare10B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle10B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw10B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine09A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare09A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle09A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw09A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine09B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare09B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle09B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw09B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine08A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare08A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle08A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw08A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine08B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare08B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle08B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw08B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine07A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare07A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle07A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw07A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine07B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare07B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle07B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw07B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine06A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare06A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle06A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw06A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine06B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare06B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle06B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw06B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine05A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare05A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle05A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw05A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine05B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare05B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle05B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw05B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine04A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare04A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle04A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw04A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine04B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare04B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle04B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw04B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine03A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare03A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle03A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw03A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine03B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare03B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle03B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw03B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine02A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare02A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle02A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw02A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine02B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare02B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle02B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw02B.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine01A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare01A.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle01A.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw01A.frequencyModulation(pitch_multiplier * 2.0);

      VFOsine01B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsquare01B.frequencyModulation(pitch_multiplier * 2.0);
      VFOtriangle01B.frequencyModulation(pitch_multiplier * 2.0);
      VFOsaw01B.frequencyModulation(pitch_multiplier * 2.0);
   }

   // standard sustain pedal = CC 64 (also allowing pot 23 on my keyboard to act as a sustain pedal)
   if ((number == 64) || (number == 23))
   {
      if (value == 0)
      {
         if (env_active_state == false)
         {
            if (poly_notes[15].note_state == false)
            {
               VFOsine16A.amplitude(0);
               VFOsquare16A.amplitude(0);
               VFOtriangle16A.amplitude(0);
               VFOsaw16A.amplitude(0);
               VFOstring16A.noteOff(0);
               VFOwhite16A.amplitude(0);
               VFOpink16A.amplitude(0);
               VFOsweep16A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine16B.amplitude(0);
               VFOsquare16B.amplitude(0);
               VFOtriangle16B.amplitude(0);
               VFOsaw16B.amplitude(0);
               VFOstring16B.noteOff(0);
               VFOwhite16B.amplitude(0);
               VFOpink16B.amplitude(0);
               VFOsweep16B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 15");
#endif
               // make this note entry available for (re)use
               poly_notes[15].channel = 0;
               poly_notes[15].base_pitch = 0;
            }

            if (poly_notes[14].note_state == false)
            {
               VFOsine15A.amplitude(0);
               VFOsquare15A.amplitude(0);
               VFOtriangle15A.amplitude(0);
               VFOsaw15A.amplitude(0);
               VFOstring15A.noteOff(0);
               VFOwhite15A.amplitude(0);
               VFOpink15A.amplitude(0);
               VFOsweep15A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine15B.amplitude(0);
               VFOsquare15B.amplitude(0);
               VFOtriangle15B.amplitude(0);
               VFOsaw15B.amplitude(0);
               VFOstring15B.noteOff(0);
               VFOwhite15B.amplitude(0);
               VFOpink15B.amplitude(0);
               VFOsweep15B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 14");
#endif
               // make this note entry available for (re)use
               poly_notes[14].channel = 0;
               poly_notes[14].base_pitch = 0;
            }

            if (poly_notes[13].note_state == false)
            {
               VFOsine14A.amplitude(0);
               VFOsquare14A.amplitude(0);
               VFOtriangle14A.amplitude(0);
               VFOsaw14A.amplitude(0);
               VFOstring14A.noteOff(0);
               VFOwhite14A.amplitude(0);
               VFOpink14A.amplitude(0);
               VFOsweep14A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine14B.amplitude(0);
               VFOsquare14B.amplitude(0);
               VFOtriangle14B.amplitude(0);
               VFOsaw14B.amplitude(0);
               VFOstring14B.noteOff(0);
               VFOwhite14B.amplitude(0);
               VFOpink14B.amplitude(0);
               VFOsweep14B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 13");
#endif
               // make this note entry available for (re)use
               poly_notes[13].channel = 0;
               poly_notes[13].base_pitch = 0;
            }

            if (poly_notes[12].note_state == false)
            {
               VFOsine13A.amplitude(0);
               VFOsquare13A.amplitude(0);
               VFOtriangle13A.amplitude(0);
               VFOsaw13A.amplitude(0);
               VFOstring13A.noteOff(0);
               VFOwhite13A.amplitude(0);
               VFOpink13A.amplitude(0);
               VFOsweep13A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine13B.amplitude(0);
               VFOsquare13B.amplitude(0);
               VFOtriangle13B.amplitude(0);
               VFOsaw13B.amplitude(0);
               VFOstring13B.noteOff(0);
               VFOwhite13B.amplitude(0);
               VFOpink13B.amplitude(0);
               VFOsweep13B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 12");
#endif
               // make this note entry available for (re)use
               poly_notes[12].channel = 0;
               poly_notes[12].base_pitch = 0;
            }

            if (poly_notes[11].note_state == false)
            {
               VFOsine12A.amplitude(0);
               VFOsquare12A.amplitude(0);
               VFOtriangle12A.amplitude(0);
               VFOsaw12A.amplitude(0);
               VFOstring12A.noteOff(0);
               VFOwhite12A.amplitude(0);
               VFOpink12A.amplitude(0);
               VFOsweep12A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine12B.amplitude(0);
               VFOsquare12B.amplitude(0);
               VFOtriangle12B.amplitude(0);
               VFOsaw12B.amplitude(0);
               VFOstring12B.noteOff(0);
               VFOwhite12B.amplitude(0);
               VFOpink12B.amplitude(0);
               VFOsweep12B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 11");
#endif
               // make this note entry available for (re)use
               poly_notes[11].channel = 0;
               poly_notes[11].base_pitch = 0;
            }

            if (poly_notes[10].note_state == false)
            {
               VFOsine11A.amplitude(0);
               VFOsquare11A.amplitude(0);
               VFOtriangle11A.amplitude(0);
               VFOsaw11A.amplitude(0);
               VFOstring11A.noteOff(0);
               VFOwhite11A.amplitude(0);
               VFOpink11A.amplitude(0);
               VFOsweep11A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine11B.amplitude(0);
               VFOsquare11B.amplitude(0);
               VFOtriangle11B.amplitude(0);
               VFOsaw11B.amplitude(0);
               VFOstring11B.noteOff(0);
               VFOwhite11B.amplitude(0);
               VFOpink11B.amplitude(0);
               VFOsweep11B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 10");
#endif
               // make this note entry available for (re)use
               poly_notes[10].channel = 0;
               poly_notes[10].base_pitch = 0;
            }

            if (poly_notes[9].note_state == false)
            {
               VFOsine10A.amplitude(0);
               VFOsquare10A.amplitude(0);
               VFOtriangle10A.amplitude(0);
               VFOsaw10A.amplitude(0);
               VFOstring10A.noteOff(0);
               VFOwhite10A.amplitude(0);
               VFOpink10A.amplitude(0);
               VFOsweep10A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine10B.amplitude(0);
               VFOsquare10B.amplitude(0);
               VFOtriangle10B.amplitude(0);
               VFOsaw10B.amplitude(0);
               VFOstring10B.noteOff(0);
               VFOwhite10B.amplitude(0);
               VFOpink10B.amplitude(0);
               VFOsweep10B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 9");
#endif
               // make this note entry available for (re)use
               poly_notes[9].channel = 0;
               poly_notes[9].base_pitch = 0;
            }

            if (poly_notes[8].note_state == false)
            {
               VFOsine09A.amplitude(0);
               VFOsquare09A.amplitude(0);
               VFOtriangle09A.amplitude(0);
               VFOsaw09A.amplitude(0);
               VFOstring09A.noteOff(0);
               VFOwhite09A.amplitude(0);
               VFOpink09A.amplitude(0);
               VFOsweep09A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine09B.amplitude(0);
               VFOsquare09B.amplitude(0);
               VFOtriangle09B.amplitude(0);
               VFOsaw09B.amplitude(0);
               VFOstring09B.noteOff(0);
               VFOwhite09B.amplitude(0);
               VFOpink09B.amplitude(0);
               VFOsweep09B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 8");
#endif
               // make this note entry available for (re)use
               poly_notes[8].channel = 0;
               poly_notes[8].base_pitch = 0;
            }

            if (poly_notes[7].note_state == false)
            {
               VFOsine08A.amplitude(0);
               VFOsquare08A.amplitude(0);
               VFOtriangle08A.amplitude(0);
               VFOsaw08A.amplitude(0);
               VFOstring08A.noteOff(0);
               VFOwhite08A.amplitude(0);
               VFOpink08A.amplitude(0);
               VFOsweep08A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine08B.amplitude(0);
               VFOsquare08B.amplitude(0);
               VFOtriangle08B.amplitude(0);
               VFOsaw08B.amplitude(0);
               VFOstring08B.noteOff(0);
               VFOwhite08B.amplitude(0);
               VFOpink08B.amplitude(0);
               VFOsweep08B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 7");
#endif
               // make this note entry available for (re)use
               poly_notes[7].channel = 0;
               poly_notes[7].base_pitch = 0;
            }

            if (poly_notes[6].note_state == false)
            {
               VFOsine07A.amplitude(0);
               VFOsquare07A.amplitude(0);
               VFOtriangle07A.amplitude(0);
               VFOsaw07A.amplitude(0);
               VFOstring07A.noteOff(0);
               VFOwhite07A.amplitude(0);
               VFOpink07A.amplitude(0);
               VFOsweep07A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine07B.amplitude(0);
               VFOsquare07B.amplitude(0);
               VFOtriangle07B.amplitude(0);
               VFOsaw07B.amplitude(0);
               VFOstring07B.noteOff(0);
               VFOwhite07B.amplitude(0);
               VFOpink07B.amplitude(0);
               VFOsweep07B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 6");
#endif
               // make this note entry available for (re)use
               poly_notes[6].channel = 0;
               poly_notes[6].base_pitch = 0;
            }

            if (poly_notes[5].note_state == false)
            {
               VFOsine06A.amplitude(0);
               VFOsquare06A.amplitude(0);
               VFOtriangle06A.amplitude(0);
               VFOsaw06A.amplitude(0);
               VFOstring06A.noteOff(0);
               VFOwhite06A.amplitude(0);
               VFOpink06A.amplitude(0);
               VFOsweep06A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine06B.amplitude(0);
               VFOsquare06B.amplitude(0);
               VFOtriangle06B.amplitude(0);
               VFOsaw06B.amplitude(0);
               VFOstring06B.noteOff(0);
               VFOwhite06B.amplitude(0);
               VFOpink06B.amplitude(0);
               VFOsweep06B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 5");
#endif
               // make this note entry available for (re)use
               poly_notes[5].channel = 0;
               poly_notes[5].base_pitch = 0;
            }

            if (poly_notes[4].note_state == false)
            {
               VFOsine05A.amplitude(0);
               VFOsquare05A.amplitude(0);
               VFOtriangle05A.amplitude(0);
               VFOsaw05A.amplitude(0);
               VFOstring05A.noteOff(0);
               VFOwhite05A.amplitude(0);
               VFOpink05A.amplitude(0);
               VFOsweep05A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine05B.amplitude(0);
               VFOsquare05B.amplitude(0);
               VFOtriangle05B.amplitude(0);
               VFOsaw05B.amplitude(0);
               VFOstring05B.noteOff(0);
               VFOwhite05B.amplitude(0);
               VFOpink05B.amplitude(0);
               VFOsweep05B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 4");
#endif
               // make this note entry available for (re)use
               poly_notes[4].channel = 0;
               poly_notes[4].base_pitch = 0;
            }

            if (poly_notes[3].note_state == false)
            {
               VFOsine04A.amplitude(0);
               VFOsquare04A.amplitude(0);
               VFOtriangle04A.amplitude(0);
               VFOsaw04A.amplitude(0);
               VFOstring04A.noteOff(0);
               VFOwhite04A.amplitude(0);
               VFOpink04A.amplitude(0);
               VFOsweep04A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine04B.amplitude(0);
               VFOsquare04B.amplitude(0);
               VFOtriangle04B.amplitude(0);
               VFOsaw04B.amplitude(0);
               VFOstring04B.noteOff(0);
               VFOwhite04B.amplitude(0);
               VFOpink04B.amplitude(0);
               VFOsweep04B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 3");
#endif
               // make this note entry available for (re)use
               poly_notes[3].channel = 0;
               poly_notes[3].base_pitch = 0;
            }

            if (poly_notes[2].note_state == false)
            {
               VFOsine03A.amplitude(0);
               VFOsquare03A.amplitude(0);
               VFOtriangle03A.amplitude(0);
               VFOsaw03A.amplitude(0);
               VFOstring03A.noteOff(0);
               VFOwhite03A.amplitude(0);
               VFOpink03A.amplitude(0);
               VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);

               VFOsine03B.amplitude(0);
               VFOsquare03B.amplitude(0);
               VFOtriangle03B.amplitude(0);
               VFOsaw03B.amplitude(0);
               VFOstring03B.noteOff(0);
               VFOwhite03B.amplitude(0);
               VFOpink03B.amplitude(0);
               VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 2");
#endif
               // make this note entry available for (re)use
               poly_notes[2].channel = 0;
               poly_notes[2].base_pitch = 0;
            }

            if (poly_notes[1].note_state == false)
            {
               VFOsine02A.amplitude(0);
               VFOsquare02A.amplitude(0);
               VFOtriangle02A.amplitude(0);
               VFOsaw02A.amplitude(0);
               VFOstring02A.noteOff(0);
               VFOwhite02A.amplitude(0);
               VFOpink02A.amplitude(0);
               VFOsweep02A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine02B.amplitude(0);
               VFOsquare02B.amplitude(0);
               VFOtriangle02B.amplitude(0);
               VFOsaw02B.amplitude(0);
               VFOstring02B.noteOff(0);
               VFOwhite02B.amplitude(0);
               VFOpink02B.amplitude(0);
               VFOsweep02B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 1");
#endif
               // make this note entry available for (re)use
               poly_notes[1].channel = 0;
               poly_notes[1].base_pitch = 0;
            }

            if (poly_notes[0].note_state == false)
            {
               VFOsine01A.amplitude(0);
               VFOsquare01A.amplitude(0);
               VFOtriangle01A.amplitude(0);
               VFOsaw01A.amplitude(0);
               VFOstring01A.noteOff(0);
               VFOwhite01A.amplitude(0);
               VFOpink01A.amplitude(0);
               VFOsweep01A.play(0.0, 10.0, 10.0, 1.0);

               VFOsine01B.amplitude(0);
               VFOsquare01B.amplitude(0);
               VFOtriangle01B.amplitude(0);
               VFOsaw01B.amplitude(0);
               VFOstring01B.noteOff(0);
               VFOwhite01B.amplitude(0);
               VFOpink01B.amplitude(0);
               VFOsweep01B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off is making available note index = 0");
#endif
               // make this note entry available for (re)use
               poly_notes[0].channel = 0;
               poly_notes[0].base_pitch = 0;
            }
         } else {
            if (poly_notes[15].note_state == false)
            {
               VFOenvelope16.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 15");
#endif
               // make this note entry available for (re)use
               poly_notes[15].channel = 0;
               poly_notes[15].base_pitch = 0;
            }

            if (poly_notes[14].note_state == false)
            {
               VFOenvelope15.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 14");
#endif
               // make this note entry available for (re)use
               poly_notes[14].channel = 0;
               poly_notes[14].base_pitch = 0;
            }

            if (poly_notes[13].note_state == false)
            {
               VFOenvelope14.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 13");
#endif
               // make this note entry available for (re)use
               poly_notes[13].channel = 0;
               poly_notes[13].base_pitch = 0;
            }

            if (poly_notes[12].note_state == false)
            {
               VFOenvelope13.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 12");
#endif
               // make this note entry available for (re)use
               poly_notes[12].channel = 0;
               poly_notes[12].base_pitch = 0;
            }

            if (poly_notes[11].note_state == false)
            {
               VFOenvelope12.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 11");
#endif
               // make this note entry available for (re)use
               poly_notes[11].channel = 0;
               poly_notes[11].base_pitch = 0;
            }

            if (poly_notes[10].note_state == false)
            {
               VFOenvelope11.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 10");
#endif
               // make this note entry available for (re)use
               poly_notes[10].channel = 0;
               poly_notes[10].base_pitch = 0;
            }

            if (poly_notes[9].note_state == false)
            {
               VFOenvelope10.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 9");
#endif
               // make this note entry available for (re)use
               poly_notes[9].channel = 0;
               poly_notes[9].base_pitch = 0;
            }

            if (poly_notes[8].note_state == false)
            {
               VFOenvelope09.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 8");
#endif
               // make this note entry available for (re)use
               poly_notes[8].channel = 0;
               poly_notes[8].base_pitch = 0;
            }

            if (poly_notes[7].note_state == false)
            {
               VFOenvelope08.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 7");
#endif
               // make this note entry available for (re)use
               poly_notes[7].channel = 0;
               poly_notes[7].base_pitch = 0;
            }

            if (poly_notes[6].note_state == false)
            {
               VFOenvelope07.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 6");
#endif
               // make this note entry available for (re)use
               poly_notes[6].channel = 0;
               poly_notes[6].base_pitch = 0;
            }

            if (poly_notes[5].note_state == false)
            {
               VFOenvelope06.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 5");
#endif
               // make this note entry available for (re)use
               poly_notes[5].channel = 0;
               poly_notes[5].base_pitch = 0;
            }

            if (poly_notes[4].note_state == false)
            {
               VFOenvelope05.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 4");
#endif
               // make this note entry available for (re)use
               poly_notes[4].channel = 0;
               poly_notes[4].base_pitch = 0;
            }

            if (poly_notes[3].note_state == false)
            {
               VFOenvelope04.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 3");
#endif
               // make this note entry available for (re)use
               poly_notes[3].channel = 0;
               poly_notes[3].base_pitch = 0;
            }

            if (poly_notes[2].note_state == false)
            {
               VFOenvelope03.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 2");
#endif
               // make this note entry available for (re)use
               poly_notes[2].channel = 0;
               poly_notes[2].base_pitch = 0;
            }

            if (poly_notes[1].note_state == false)
            {
               VFOenvelope02.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 1");
#endif
               // make this note entry available for (re)use
               poly_notes[1].channel = 0;
               poly_notes[1].base_pitch = 0;
            }

            if (poly_notes[0].note_state == false)
            {
               VFOenvelope01.noteOff();

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
               Serial.println("pedal off w/ envelope on is making available note index = 0");
#endif
               // make this note entry available for (re)use
               poly_notes[0].channel = 0;
               poly_notes[0].base_pitch = 0;
            }
         }

         pedal_pressed = false;

#ifdef DEBUG_CC_MSGS
         Serial.println("pedal = RELEASED");
#endif
      } else {

         pedal_pressed = true;

#ifdef DEBUG_CC_MSGS
         Serial.println("pedal = PRESSED");
#endif
      }
   }

   AudioInterrupts();
}  // handleControlChange()


// MIDI message callback - note off
void handleNoteOff(byte channel, byte pitch, byte velocity)
{
   AudioNoInterrupts();

   int note_index = -1;

   midi_note_activity_state = true;

   // see if the note to be turned off is in our array of notes that we are playing
   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if ((poly_notes[i].channel == channel) && (poly_notes[i].base_pitch == pitch))
      {
         note_index = i;
         break;
      }
   }

   // if we found a matching note . . .
   if (note_index != -1)
   {
      poly_notes[note_index].note_state = false;
      poly_notes[note_index].note_off_millis = millis();

      if (env_active_state == false)
      {
         if (pedal_pressed == false)
         {
            switch(note_index)
            {
               case 0:
               {
                  VFOsine01A.amplitude(0);
                  VFOsquare01A.amplitude(0);
                  VFOtriangle01A.amplitude(0);
                  VFOsaw01A.amplitude(0);
                  VFOstring01A.noteOff(0.0);
                  VFOwhite01A.amplitude(0);
                  VFOpink01A.amplitude(0);
                  VFOsweep01A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine01B.amplitude(0);
                  VFOsquare01B.amplitude(0);
                  VFOtriangle01B.amplitude(0);
                  VFOsaw01B.amplitude(0);
                  VFOstring01B.noteOff(0.0);
                  VFOwhite01B.amplitude(0);
                  VFOpink01B.amplitude(0);
                  VFOsweep01B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 1:
               {
                  VFOsine02A.amplitude(0);
                  VFOsquare02A.amplitude(0);
                  VFOtriangle02A.amplitude(0);
                  VFOsaw02A.amplitude(0);
                  VFOstring02A.noteOff(0.0);
                  VFOwhite02A.amplitude(0);
                  VFOpink02A.amplitude(0);
                  VFOsweep02A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine02B.amplitude(0);
                  VFOsquare02B.amplitude(0);
                  VFOtriangle02B.amplitude(0);
                  VFOsaw02B.amplitude(0);
                  VFOstring02B.noteOff(0.0);
                  VFOwhite02B.amplitude(0);
                  VFOpink02B.amplitude(0);
                  VFOsweep02B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 2:
               {
                  VFOsine03A.amplitude(0);
                  VFOsquare03A.amplitude(0);
                  VFOtriangle03A.amplitude(0);
                  VFOsaw03A.amplitude(0);
                  VFOstring03A.noteOff(0.0);
                  VFOwhite03A.amplitude(0);
                  VFOpink03A.amplitude(0);
                  VFOsweep03A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine03B.amplitude(0);
                  VFOsquare03B.amplitude(0);
                  VFOtriangle03B.amplitude(0);
                  VFOsaw03B.amplitude(0);
                  VFOstring03B.noteOff(0.0);
                  VFOwhite03B.amplitude(0);
                  VFOpink03B.amplitude(0);
                  VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 3:
               {
                  VFOsine04A.amplitude(0);
                  VFOsquare04A.amplitude(0);
                  VFOtriangle04A.amplitude(0);
                  VFOsaw04A.amplitude(0);
                  VFOstring04A.noteOff(0.0);
                  VFOwhite04A.amplitude(0);
                  VFOpink04A.amplitude(0);
                  VFOsweep04A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine04B.amplitude(0);
                  VFOsquare04B.amplitude(0);
                  VFOtriangle04B.amplitude(0);
                  VFOsaw04B.amplitude(0);
                  VFOstring04B.noteOff(0.0);
                  VFOwhite04B.amplitude(0);
                  VFOpink04B.amplitude(0);
                  VFOsweep04B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 4:
               {
                  VFOsine05A.amplitude(0);
                  VFOsquare05A.amplitude(0);
                  VFOtriangle05A.amplitude(0);
                  VFOsaw05A.amplitude(0);
                  VFOstring05A.noteOff(0.0);
                  VFOwhite05A.amplitude(0);
                  VFOpink05A.amplitude(0);
                  VFOsweep05A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine05B.amplitude(0);
                  VFOsquare05B.amplitude(0);
                  VFOtriangle05B.amplitude(0);
                  VFOsaw05B.amplitude(0);
                  VFOstring05B.noteOff(0.0);
                  VFOwhite05B.amplitude(0);
                  VFOpink05B.amplitude(0);
                  VFOsweep05B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 5:
               {
                  VFOsine06A.amplitude(0);
                  VFOsquare06A.amplitude(0);
                  VFOtriangle06A.amplitude(0);
                  VFOsaw06A.amplitude(0);
                  VFOstring06A.noteOff(0.0);
                  VFOwhite06A.amplitude(0);
                  VFOpink06A.amplitude(0);
                  VFOsweep06A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine06B.amplitude(0);
                  VFOsquare06B.amplitude(0);
                  VFOtriangle06B.amplitude(0);
                  VFOsaw06B.amplitude(0);
                  VFOstring06B.noteOff(0.0);
                  VFOwhite06B.amplitude(0);
                  VFOpink06B.amplitude(0);
                  VFOsweep06B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 6:
               {
                  VFOsine07A.amplitude(0);
                  VFOsquare07A.amplitude(0);
                  VFOtriangle07A.amplitude(0);
                  VFOsaw07A.amplitude(0);
                  VFOstring07A.noteOff(0.0);
                  VFOwhite07A.amplitude(0);
                  VFOpink07A.amplitude(0);
                  VFOsweep07A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine07B.amplitude(0);
                  VFOsquare07B.amplitude(0);
                  VFOtriangle07B.amplitude(0);
                  VFOsaw07B.amplitude(0);
                  VFOstring07B.noteOff(0.0);
                  VFOwhite07B.amplitude(0);
                  VFOpink07B.amplitude(0);
                  VFOsweep07B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 7:
               {
                  VFOsine08A.amplitude(0);
                  VFOsquare08A.amplitude(0);
                  VFOtriangle08A.amplitude(0);
                  VFOsaw08A.amplitude(0);
                  VFOstring08A.noteOff(0.0);
                  VFOwhite08A.amplitude(0);
                  VFOpink08A.amplitude(0);
                  VFOsweep08A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine08B.amplitude(0);
                  VFOsquare08B.amplitude(0);
                  VFOtriangle08B.amplitude(0);
                  VFOsaw08B.amplitude(0);
                  VFOstring08B.noteOff(0.0);
                  VFOwhite08B.amplitude(0);
                  VFOpink08B.amplitude(0);
                  VFOsweep08B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 8:
               {
                  VFOsine09A.amplitude(0);
                  VFOsquare09A.amplitude(0);
                  VFOtriangle09A.amplitude(0);
                  VFOsaw09A.amplitude(0);
                  VFOstring09A.noteOff(0.0);
                  VFOwhite09A.amplitude(0);
                  VFOpink09A.amplitude(0);
                  VFOsweep09A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine09B.amplitude(0);
                  VFOsquare09B.amplitude(0);
                  VFOtriangle09B.amplitude(0);
                  VFOsaw09B.amplitude(0);
                  VFOstring09B.noteOff(0.0);
                  VFOwhite09B.amplitude(0);
                  VFOpink09B.amplitude(0);
                  VFOsweep09B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 9:
               {
                  VFOsine10A.amplitude(0);
                  VFOsquare10A.amplitude(0);
                  VFOtriangle10A.amplitude(0);
                  VFOsaw10A.amplitude(0);
                  VFOstring10A.noteOff(0.0);
                  VFOwhite10A.amplitude(0);
                  VFOpink10A.amplitude(0);
                  VFOsweep10A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine10B.amplitude(0);
                  VFOsquare10B.amplitude(0);
                  VFOtriangle10B.amplitude(0);
                  VFOsaw10B.amplitude(0);
                  VFOstring10B.noteOff(0.0);
                  VFOwhite10B.amplitude(0);
                  VFOpink10B.amplitude(0);
                  VFOsweep10B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 10:
               {
                  VFOsine11A.amplitude(0);
                  VFOsquare11A.amplitude(0);
                  VFOtriangle11A.amplitude(0);
                  VFOsaw11A.amplitude(0);
                  VFOstring11A.noteOff(0.0);
                  VFOwhite11A.amplitude(0);
                  VFOpink11A.amplitude(0);
                  VFOsweep11A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine11B.amplitude(0);
                  VFOsquare11B.amplitude(0);
                  VFOtriangle11B.amplitude(0);
                  VFOsaw11B.amplitude(0);
                  VFOstring11B.noteOff(0.0);
                  VFOwhite11B.amplitude(0);
                  VFOpink11B.amplitude(0);
                  VFOsweep11B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 11:
               {
                  VFOsine12A.amplitude(0);
                  VFOsquare12A.amplitude(0);
                  VFOtriangle12A.amplitude(0);
                  VFOsaw12A.amplitude(0);
                  VFOstring12A.noteOff(0.0);
                  VFOwhite12A.amplitude(0);
                  VFOpink12A.amplitude(0);
                  VFOsweep12A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine12B.amplitude(0);
                  VFOsquare12B.amplitude(0);
                  VFOtriangle12B.amplitude(0);
                  VFOsaw12B.amplitude(0);
                  VFOstring12B.noteOff(0.0);
                  VFOwhite12B.amplitude(0);
                  VFOpink12B.amplitude(0);
                  VFOsweep12B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 12:
               {
                  VFOsine13A.amplitude(0);
                  VFOsquare13A.amplitude(0);
                  VFOtriangle13A.amplitude(0);
                  VFOsaw13A.amplitude(0);
                  VFOstring13A.noteOff(0.0);
                  VFOwhite13A.amplitude(0);
                  VFOpink13A.amplitude(0);
                  VFOsweep13A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine13B.amplitude(0);
                  VFOsquare13B.amplitude(0);
                  VFOtriangle13B.amplitude(0);
                  VFOsaw13B.amplitude(0);
                  VFOstring13B.noteOff(0.0);
                  VFOwhite13B.amplitude(0);
                  VFOpink13B.amplitude(0);
                  VFOsweep13B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 13:
               {
                  VFOsine14A.amplitude(0);
                  VFOsquare14A.amplitude(0);
                  VFOtriangle14A.amplitude(0);
                  VFOsaw14A.amplitude(0);
                  VFOstring14A.noteOff(0.0);
                  VFOwhite14A.amplitude(0);
                  VFOpink14A.amplitude(0);
                  VFOsweep14A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine14B.amplitude(0);
                  VFOsquare14B.amplitude(0);
                  VFOtriangle14B.amplitude(0);
                  VFOsaw14B.amplitude(0);
                  VFOstring14B.noteOff(0.0);
                  VFOwhite14B.amplitude(0);
                  VFOpink14B.amplitude(0);
                  VFOsweep14B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 14:
               {
                  VFOsine15A.amplitude(0);
                  VFOsquare15A.amplitude(0);
                  VFOtriangle15A.amplitude(0);
                  VFOsaw15A.amplitude(0);
                  VFOstring15A.noteOff(0.0);
                  VFOwhite15A.amplitude(0);
                  VFOpink15A.amplitude(0);
                  VFOsweep15A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine15B.amplitude(0);
                  VFOsquare15B.amplitude(0);
                  VFOtriangle15B.amplitude(0);
                  VFOsaw15B.amplitude(0);
                  VFOstring15B.noteOff(0.0);
                  VFOwhite15B.amplitude(0);
                  VFOpink15B.amplitude(0);
                  VFOsweep15B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 15:
               {
                  VFOsine16A.amplitude(0);
                  VFOsquare16A.amplitude(0);
                  VFOtriangle16A.amplitude(0);
                  VFOsaw16A.amplitude(0);
                  VFOstring16A.noteOff(0.0);
                  VFOwhite16A.amplitude(0);
                  VFOpink16A.amplitude(0);
                  VFOsweep16A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine16B.amplitude(0);
                  VFOsquare16B.amplitude(0);
                  VFOtriangle16B.amplitude(0);
                  VFOsaw16B.amplitude(0);
                  VFOstring16B.noteOff(0.0);
                  VFOwhite16B.amplitude(0);
                  VFOpink16B.amplitude(0);
                  VFOsweep16B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;
            }

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
            Serial.print("note off is making available note index = ");
            Serial.println(note_index);
#endif
            // make this note entry available for (re)use
            poly_notes[note_index].channel = 0;
            poly_notes[note_index].base_pitch = 0;
         }
      } else {
         switch(note_index)
         {
            case 0:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope01.noteOff();
               }
            }
            break;

            case 1:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope02.noteOff();
               }
            }
            break;

            case 2:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope03.noteOff();
               }
            }
            break;

            case 3:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope04.noteOff();
               }
            }
            break;

            case 4:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope05.noteOff();
               }
            }
            break;

            case 5:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope06.noteOff();
               }
            }
            break;

            case 6:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope07.noteOff();
               }
            }
            break;

            case 7:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope08.noteOff();
               }
            }
            break;

            case 8:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope09.noteOff();
               }
            }
            break;

            case 9:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope10.noteOff();
               }
            }
            break;

            case 10:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope11.noteOff();
               }
            }
            break;

            case 11:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope12.noteOff();
               }
            }
            break;

            case 12:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope13.noteOff();
               }
            }
            break;

            case 13:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope14.noteOff();
               }
            }
            break;

            case 14:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope15.noteOff();
               }
            }
            break;

            case 15:
            {
               if (pedal_pressed == false)
               {
                  VFOenvelope16.noteOff();
               }
            }
            break;
         }

         if (pedal_pressed == false)
         {
#ifdef DEBUG_MAKE_NOTE_AVAILABLE
            Serial.print("note off w/ envelope on is making available note index = ");
            Serial.println(note_index);
#endif
            // make this note entry available for (re)use
            poly_notes[note_index].channel = 0;
            poly_notes[note_index].base_pitch = 0;
         }
      }
   }

   AudioInterrupts();

#ifdef DEBUG_MAXIMUM_NOTES
   int current_notes = 0;

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if ((poly_notes[i].channel != 0) && (poly_notes[i].base_pitch != 0))
      {
         current_notes++;
      }
   }

   if (current_notes > maximum_notes)
   {
      maximum_notes = current_notes;
   }

   Serial.print("ACTIVE NOTES : [");

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if (current_notes > i)
      {
         Serial.print("=");
      } else {
         Serial.print("-");
      }
   }

   Serial.print("]   MAXIMUM : [");

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if (maximum_notes > i)
      {
         Serial.print("=");
      } else {
         Serial.print("-");
      }
   }

   Serial.println("]");
#endif
}  // handleNoteOff()


// MIDI message callback - note on
void handleNoteOn(byte channel, byte pitch, byte velocity)
{
   AudioNoInterrupts();

   int note_index = -1;

   midi_note_activity_state = true;

   // see if either we are in OMNI mode (channel == 0), or the channel matches our MIDI channel
   if ((midi_channel == 0) || (channel == midi_channel))
   {
      // if we're in glide mode, then only the first entry in the poly_note[] array is used for everything
      if (vfoB_glide_state == true)
      {
         note_index = 0;

         if ((poly_notes[0].channel != 0) && (poly_notes[0].base_pitch != 0))
         {
            if (glide_current_base_freq != fNotePitches[poly_notes[0].base_pitch])
            {
               glide_start_base_freq = glide_current_base_freq;
            } else {
               glide_start_base_freq = fNotePitches[poly_notes[0].base_pitch];
            }
         } else {
            if (pedal_pressed == false)
            {
               glide_start_base_freq = 0;
            }
         }

         glide_target_base_freq = fNotePitches[pitch];
         glide_current_base_freq = glide_start_base_freq;
         glide_start_millis = millis();
      } else {
         glide_start_base_freq = 0;
         glide_target_base_freq = 0;
         glide_current_base_freq = 0;

         // otherwise, process the n-poly notes(s)
         for (int i = 0; i < LIMIT_POLY; i++)
         {
            if (((poly_notes[i].channel == 0) && (poly_notes[i].base_pitch == 0)) || ((poly_notes[i].channel == channel) && (poly_notes[i].base_pitch == pitch)))
            {
               note_index = i;
               break;
            }
         }
      }

      // see if we found a note match
      if (note_index != -1)
      {
         switch(note_index)
         {
            case 0:
            {
               VFOenvelope01.noteOff();

               // if glide is active, then only VFO #1 ia used
               if (vfoB_glide_state == true)
               {
                  VFOsine01A.frequency(glide_start_base_freq / octaveA_divisor);
                  VFOsquare01A.frequency(glide_start_base_freq / octaveA_divisor);
                  VFOtriangle01A.frequency(glide_start_base_freq / octaveA_divisor);
                  VFOsaw01A.frequency(glide_start_base_freq / octaveA_divisor);

                  // range check the note before even bothering to try & play it !!
                  if (((glide_start_base_freq / octaveA_divisor) >= 80.0) && ((glide_start_base_freq / octaveA_divisor) <= 20000.0))
                  {
                     VFOstring01A.noteOn(glide_start_base_freq / octaveA_divisor, (float)velocity / 256.0);
                  }
               } else {
                  VFOsine01A.frequency(fNotePitches[pitch] / octaveA_divisor);
                  VFOsquare01A.frequency(fNotePitches[pitch] / octaveA_divisor);
                  VFOtriangle01A.frequency(fNotePitches[pitch] / octaveA_divisor);
                  VFOsaw01A.frequency(fNotePitches[pitch] / octaveA_divisor);

                  // range check the note before even bothering to try & play it !!
                  if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
                  {
                     VFOstring01A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
                  }
               }

               VFOsine01A.amplitude((float)(velocity) / 256.0);
               VFOsquare01A.amplitude((float)(velocity) / 256.0);
               VFOtriangle01A.amplitude((float)(velocity) / 256.0);
               VFOsaw01A.amplitude((float)(velocity) / 256.0);
               VFOwhite01A.amplitude((float)(velocity) / 256.0);
               VFOpink01A.amplitude((float)(velocity) / 256.0);


               if (vfoB_glide_state == true)
               {
                  VFOsine01B.frequency(glide_start_base_freq / octaveB_divisor);
                  VFOsquare01B.frequency(glide_start_base_freq / octaveB_divisor);
                  VFOtriangle01B.frequency(glide_start_base_freq / octaveB_divisor);
                  VFOsaw01B.frequency(glide_start_base_freq / octaveB_divisor);

                  // range check the note before even bothering to try & play it !!
                  if (((glide_start_base_freq / octaveB_divisor) >= 80.0) && ((glide_start_base_freq / octaveB_divisor) <= 20000.0))
                  {
                     VFOstring01B.noteOn(glide_start_base_freq / octaveB_divisor, (float)velocity / 256.0);
                  }
               } else {
                  VFOsine01B.frequency(fNotePitches[pitch] / octaveB_divisor);
                  VFOsquare01B.frequency(fNotePitches[pitch] / octaveB_divisor);
                  VFOtriangle01B.frequency(fNotePitches[pitch] / octaveB_divisor);
                  VFOsaw01B.frequency(fNotePitches[pitch] / octaveB_divisor);

                  // range check the note before even bothering to try & play it !!
                  if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
                  {
                     VFOstring01B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
                  }
               }

               VFOsine01B.amplitude((float)(velocity) / 256.0);
               VFOsquare01B.amplitude((float)(velocity) / 256.0);
               VFOtriangle01B.amplitude((float)(velocity) / 256.0);
               VFOsaw01B.amplitude((float)(velocity) / 256.0);
               VFOwhite01B.amplitude((float)(velocity) / 256.0);
               VFOpink01B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep01A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep01B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep01A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep01B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope01.noteOn();
            }
            break;

            case 1:
            {
               VFOenvelope02.noteOff();


               VFOsine02A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare02A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle02A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw02A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring02A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine02A.amplitude((float)(velocity) / 256.0);
               VFOsquare02A.amplitude((float)(velocity) / 256.0);
               VFOtriangle02A.amplitude((float)(velocity) / 256.0);
               VFOsaw02A.amplitude((float)(velocity) / 256.0);
               VFOwhite02A.amplitude((float)(velocity) / 256.0);
               VFOpink02A.amplitude((float)(velocity) / 256.0);


               VFOsine02B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare02B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle02B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw02B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring02B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine02B.amplitude((float)(velocity) / 256.0);
               VFOsquare02B.amplitude((float)(velocity) / 256.0);
               VFOtriangle02B.amplitude((float)(velocity) / 256.0);
               VFOsaw02B.amplitude((float)(velocity) / 256.0);
               VFOwhite02B.amplitude((float)(velocity) / 256.0);
               VFOpink02B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep02A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep02B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep02A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep02B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope02.noteOn();
            }
            break;

            case 2:
            {
               VFOenvelope03.noteOff();


               VFOsine03A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare03A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle03A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw03A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring03A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine03A.amplitude((float)(velocity) / 256.0);
               VFOsquare03A.amplitude((float)(velocity) / 256.0);
               VFOtriangle03A.amplitude((float)(velocity) / 256.0);
               VFOsaw03A.amplitude((float)(velocity) / 256.0);
               VFOwhite03A.amplitude((float)(velocity) / 256.0);
               VFOpink03A.amplitude((float)(velocity) / 256.0);


               VFOsine03B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare03B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle03B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw03B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring03B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine03B.amplitude((float)(velocity) / 256.0);
               VFOsquare03B.amplitude((float)(velocity) / 256.0);
               VFOtriangle03B.amplitude((float)(velocity) / 256.0);
               VFOsaw03B.amplitude((float)(velocity) / 256.0);
               VFOwhite03B.amplitude((float)(velocity) / 256.0);
               VFOpink03B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep03A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep03B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep03A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep03B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope03.noteOn();
            }
            break;

            case 3:
            {
               VFOenvelope04.noteOff();


               VFOsine04A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare04A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle04A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw04A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring04A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine04A.amplitude((float)(velocity) / 256.0);
               VFOsquare04A.amplitude((float)(velocity) / 256.0);
               VFOtriangle04A.amplitude((float)(velocity) / 256.0);
               VFOsaw04A.amplitude((float)(velocity) / 256.0);
               VFOwhite04A.amplitude((float)(velocity) / 256.0);
               VFOpink04A.amplitude((float)(velocity) / 256.0);


               VFOsine04B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare04B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle04B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw04B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring04B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine04B.amplitude((float)(velocity) / 256.0);
               VFOsquare04B.amplitude((float)(velocity) / 256.0);
               VFOtriangle04B.amplitude((float)(velocity) / 256.0);
               VFOsaw04B.amplitude((float)(velocity) / 256.0);
               VFOwhite04B.amplitude((float)(velocity) / 256.0);
               VFOpink04B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep04A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep04B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep04A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep04B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope04.noteOn();
            }
            break;

            case 4:
            {
               VFOenvelope05.noteOff();


               VFOsine05A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare05A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle05A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw05A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring05A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine05A.amplitude((float)(velocity) / 256.0);
               VFOsquare05A.amplitude((float)(velocity) / 256.0);
               VFOtriangle05A.amplitude((float)(velocity) / 256.0);
               VFOsaw05A.amplitude((float)(velocity) / 256.0);
               VFOwhite05A.amplitude((float)(velocity) / 256.0);
               VFOpink05A.amplitude((float)(velocity) / 256.0);


               VFOsine05B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare05B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle05B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw05B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring05B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine05B.amplitude((float)(velocity) / 256.0);
               VFOsquare05B.amplitude((float)(velocity) / 256.0);
               VFOtriangle05B.amplitude((float)(velocity) / 256.0);
               VFOsaw05B.amplitude((float)(velocity) / 256.0);
               VFOwhite05B.amplitude((float)(velocity) / 256.0);
               VFOpink05B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep05A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep05B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep05A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep05B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope05.noteOn();
            }
            break;

            case 5:
            {
               VFOenvelope06.noteOff();


               VFOsine06A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare06A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle06A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw06A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring06A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine06A.amplitude((float)(velocity) / 256.0);
               VFOsquare06A.amplitude((float)(velocity) / 256.0);
               VFOtriangle06A.amplitude((float)(velocity) / 256.0);
               VFOsaw06A.amplitude((float)(velocity) / 256.0);
               VFOwhite06A.amplitude((float)(velocity) / 256.0);
               VFOpink06A.amplitude((float)(velocity) / 256.0);


               VFOsine06B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare06B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle06B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw06B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring06B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine06B.amplitude((float)(velocity) / 256.0);
               VFOsquare06B.amplitude((float)(velocity) / 256.0);
               VFOtriangle06B.amplitude((float)(velocity) / 256.0);
               VFOsaw06B.amplitude((float)(velocity) / 256.0);
               VFOwhite06B.amplitude((float)(velocity) / 256.0);
               VFOpink06B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep06A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep06B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep06A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep06B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope06.noteOn();
            }
            break;

            case 6:
            {
               VFOenvelope07.noteOff();


               VFOsine07A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare07A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle07A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw07A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring07A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine07A.amplitude((float)(velocity) / 256.0);
               VFOsquare07A.amplitude((float)(velocity) / 256.0);
               VFOtriangle07A.amplitude((float)(velocity) / 256.0);
               VFOsaw07A.amplitude((float)(velocity) / 256.0);
               VFOwhite07A.amplitude((float)(velocity) / 256.0);
               VFOpink07A.amplitude((float)(velocity) / 256.0);


               VFOsine07B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare07B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle07B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw07B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring07B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine07B.amplitude((float)(velocity) / 256.0);
               VFOsquare07B.amplitude((float)(velocity) / 256.0);
               VFOtriangle07B.amplitude((float)(velocity) / 256.0);
               VFOsaw07B.amplitude((float)(velocity) / 256.0);
               VFOwhite07B.amplitude((float)(velocity) / 256.0);
               VFOpink07B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep07A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep07B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep07A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep07B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope07.noteOn();
            }
            break;

            case 7:
            {
               VFOenvelope08.noteOff();


               VFOsine08A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare08A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle08A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw08A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring08A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine08A.amplitude((float)(velocity) / 256.0);
               VFOsquare08A.amplitude((float)(velocity) / 256.0);
               VFOtriangle08A.amplitude((float)(velocity) / 256.0);
               VFOsaw08A.amplitude((float)(velocity) / 256.0);
               VFOwhite08A.amplitude((float)(velocity) / 256.0);
               VFOpink08A.amplitude((float)(velocity) / 256.0);


               VFOsine08B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare08B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle08B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw08B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring08B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine08B.amplitude((float)(velocity) / 256.0);
               VFOsquare08B.amplitude((float)(velocity) / 256.0);
               VFOtriangle08B.amplitude((float)(velocity) / 256.0);
               VFOsaw08B.amplitude((float)(velocity) / 256.0);
               VFOwhite08B.amplitude((float)(velocity) / 256.0);
               VFOpink08B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep08A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep08B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep08A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep08B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope08.noteOn();
            }
            break;

            case 8:
            {
               VFOenvelope09.noteOff();


               VFOsine09A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare09A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle09A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw09A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring09A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine09A.amplitude((float)(velocity) / 256.0);
               VFOsquare09A.amplitude((float)(velocity) / 256.0);
               VFOtriangle09A.amplitude((float)(velocity) / 256.0);
               VFOsaw09A.amplitude((float)(velocity) / 256.0);
               VFOwhite09A.amplitude((float)(velocity) / 256.0);
               VFOpink09A.amplitude((float)(velocity) / 256.0);


               VFOsine09B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare09B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle09B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw09B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring09B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine09B.amplitude((float)(velocity) / 256.0);
               VFOsquare09B.amplitude((float)(velocity) / 256.0);
               VFOtriangle09B.amplitude((float)(velocity) / 256.0);
               VFOsaw09B.amplitude((float)(velocity) / 256.0);
               VFOwhite09B.amplitude((float)(velocity) / 256.0);
               VFOpink09B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep09A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep09B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep09A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep09B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope09.noteOn();
            }
            break;

            case 9:
            {
               VFOenvelope10.noteOff();


               VFOsine10A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare10A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle10A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw10A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring10A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine10A.amplitude((float)(velocity) / 256.0);
               VFOsquare10A.amplitude((float)(velocity) / 256.0);
               VFOtriangle10A.amplitude((float)(velocity) / 256.0);
               VFOsaw10A.amplitude((float)(velocity) / 256.0);
               VFOwhite10A.amplitude((float)(velocity) / 256.0);
               VFOpink10A.amplitude((float)(velocity) / 256.0);


               VFOsine10B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare10B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle10B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw10B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring10B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine10B.amplitude((float)(velocity) / 256.0);
               VFOsquare10B.amplitude((float)(velocity) / 256.0);
               VFOtriangle10B.amplitude((float)(velocity) / 256.0);
               VFOsaw10B.amplitude((float)(velocity) / 256.0);
               VFOwhite10B.amplitude((float)(velocity) / 256.0);
               VFOpink10B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep10A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep10B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep10A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep10B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope10.noteOn();
            }
            break;

            case 10:
            {
               VFOenvelope11.noteOff();


               VFOsine11A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare11A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle11A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw11A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring11A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine11A.amplitude((float)(velocity) / 256.0);
               VFOsquare11A.amplitude((float)(velocity) / 256.0);
               VFOtriangle11A.amplitude((float)(velocity) / 256.0);
               VFOsaw11A.amplitude((float)(velocity) / 256.0);
               VFOwhite11A.amplitude((float)(velocity) / 256.0);
               VFOpink11A.amplitude((float)(velocity) / 256.0);


               VFOsine11B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare11B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle11B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw11B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring11B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine11B.amplitude((float)(velocity) / 256.0);
               VFOsquare11B.amplitude((float)(velocity) / 256.0);
               VFOtriangle11B.amplitude((float)(velocity) / 256.0);
               VFOsaw11B.amplitude((float)(velocity) / 256.0);
               VFOwhite11B.amplitude((float)(velocity) / 256.0);
               VFOpink11B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep11A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep11B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep11A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep11B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope11.noteOn();
            }
            break;

            case 11:
            {
               VFOenvelope12.noteOff();


               VFOsine12A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare12A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle12A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw12A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring12A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine12A.amplitude((float)(velocity) / 256.0);
               VFOsquare12A.amplitude((float)(velocity) / 256.0);
               VFOtriangle12A.amplitude((float)(velocity) / 256.0);
               VFOsaw12A.amplitude((float)(velocity) / 256.0);
               VFOwhite12A.amplitude((float)(velocity) / 256.0);
               VFOpink12A.amplitude((float)(velocity) / 256.0);


               VFOsine12B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare12B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle12B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw12B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring12B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine12B.amplitude((float)(velocity) / 256.0);
               VFOsquare12B.amplitude((float)(velocity) / 256.0);
               VFOtriangle12B.amplitude((float)(velocity) / 256.0);
               VFOsaw12B.amplitude((float)(velocity) / 256.0);
               VFOwhite12B.amplitude((float)(velocity) / 256.0);
               VFOpink12B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep12A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep12B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep12A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                     VFOsweep12B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(512 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope12.noteOn();
            }
            break;

            case 12:
            {
               VFOenvelope13.noteOff();


               VFOsine13A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare13A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle13A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw13A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring13A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine13A.amplitude((float)(velocity) / 256.0);
               VFOsquare13A.amplitude((float)(velocity) / 256.0);
               VFOtriangle13A.amplitude((float)(velocity) / 256.0);
               VFOsaw13A.amplitude((float)(velocity) / 256.0);
               VFOwhite13A.amplitude((float)(velocity) / 256.0);
               VFOpink13A.amplitude((float)(velocity) / 256.0);


               VFOsine13B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare13B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle13B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw13B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring13B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine13B.amplitude((float)(velocity) / 256.0);
               VFOsquare13B.amplitude((float)(velocity) / 256.0);
               VFOtriangle13B.amplitude((float)(velocity) / 256.0);
               VFOsaw13B.amplitude((float)(velocity) / 256.0);
               VFOwhite13B.amplitude((float)(velocity) / 256.0);
               VFOpink13B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep13A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep13B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep13A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(513 - vfoA_sweep_pot), 0.9));
                     VFOsweep13B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(513 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope13.noteOn();
            }
            break;

            case 13:
            {
               VFOenvelope14.noteOff();


               VFOsine14A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare14A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle14A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw14A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring14A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine14A.amplitude((float)(velocity) / 256.0);
               VFOsquare14A.amplitude((float)(velocity) / 256.0);
               VFOtriangle14A.amplitude((float)(velocity) / 256.0);
               VFOsaw14A.amplitude((float)(velocity) / 256.0);
               VFOwhite14A.amplitude((float)(velocity) / 256.0);
               VFOpink14A.amplitude((float)(velocity) / 256.0);


               VFOsine14B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare14B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle14B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw14B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring14B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine14B.amplitude((float)(velocity) / 256.0);
               VFOsquare14B.amplitude((float)(velocity) / 256.0);
               VFOtriangle14B.amplitude((float)(velocity) / 256.0);
               VFOsaw14B.amplitude((float)(velocity) / 256.0);
               VFOwhite14B.amplitude((float)(velocity) / 256.0);
               VFOpink14B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep14A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep14B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep14A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(514 - vfoA_sweep_pot), 0.9));
                     VFOsweep14B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(514 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope14.noteOn();
            }
            break;

            case 14:
            {
               VFOenvelope15.noteOff();


               VFOsine15A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare15A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle15A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw15A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring15A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine15A.amplitude((float)(velocity) / 256.0);
               VFOsquare15A.amplitude((float)(velocity) / 256.0);
               VFOtriangle15A.amplitude((float)(velocity) / 256.0);
               VFOsaw15A.amplitude((float)(velocity) / 256.0);
               VFOwhite15A.amplitude((float)(velocity) / 256.0);
               VFOpink15A.amplitude((float)(velocity) / 256.0);


               VFOsine15B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare15B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle15B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw15B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring15B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine15B.amplitude((float)(velocity) / 256.0);
               VFOsquare15B.amplitude((float)(velocity) / 256.0);
               VFOtriangle15B.amplitude((float)(velocity) / 256.0);
               VFOsaw15B.amplitude((float)(velocity) / 256.0);
               VFOwhite15B.amplitude((float)(velocity) / 256.0);
               VFOpink15B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep15A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep15B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep15A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(515 - vfoA_sweep_pot), 0.9));
                     VFOsweep15B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(515 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope15.noteOn();
            }
            break;

            case 15:
            {
               VFOenvelope16.noteOff();


               VFOsine16A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsquare16A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOtriangle16A.frequency(fNotePitches[pitch] / octaveA_divisor);
               VFOsaw16A.frequency(fNotePitches[pitch] / octaveA_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveA_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveA_divisor) <= 20000.0))
               {
                  VFOstring16A.noteOn(fNotePitches[pitch] / octaveA_divisor, (float)velocity / 256.0);
               }

               VFOsine16A.amplitude((float)(velocity) / 256.0);
               VFOsquare16A.amplitude((float)(velocity) / 256.0);
               VFOtriangle16A.amplitude((float)(velocity) / 256.0);
               VFOsaw16A.amplitude((float)(velocity) / 256.0);
               VFOwhite16A.amplitude((float)(velocity) / 256.0);
               VFOpink16A.amplitude((float)(velocity) / 256.0);


               VFOsine16B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsquare16B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOtriangle16B.frequency(fNotePitches[pitch] / octaveB_divisor);
               VFOsaw16B.frequency(fNotePitches[pitch] / octaveB_divisor);

               // range check the note before even bothering to try & play it !!
               if (((fNotePitches[pitch] / octaveB_divisor) >= 80.0) && ((fNotePitches[pitch] / octaveB_divisor) <= 20000.0))
               {
                  VFOstring16B.noteOn(fNotePitches[pitch] / octaveB_divisor, (float)velocity / 256.0);
               }

               VFOsine16B.amplitude((float)(velocity) / 256.0);
               VFOsquare16B.amplitude((float)(velocity) / 256.0);
               VFOtriangle16B.amplitude((float)(velocity) / 256.0);
               VFOsaw16B.amplitude((float)(velocity) / 256.0);
               VFOwhite16B.amplitude((float)(velocity) / 256.0);
               VFOpink16B.amplitude((float)(velocity) / 256.0);

               if (vfoA_sweep_state == true)
               {
                  if (vfoA_sweep_pot > 511)
                  {
                     VFOsweep16A.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                     VFOsweep16B.play(0.5, 20.0, 10000.0, 30.0 / pow((float)(vfoA_sweep_pot - 511), 0.9));
                  } else {
                     VFOsweep16A.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(516 - vfoA_sweep_pot), 0.9));
                     VFOsweep16B.play(0.5, 10000.0, 20.0, 30.0 / pow((float)(516 - vfoA_sweep_pot), 0.9));
                  }
               }


               VFOenvelope16.noteOn();
            }
            break;
         }

         // store the parameters of this new note
         poly_notes[note_index].channel = channel;
         poly_notes[note_index].base_pitch = pitch;
         poly_notes[note_index].note_state = true;
      } else {
#ifdef DEBUG_DROPPED_NOTES
      Serial.print("DROPPED NOTE:         ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);


      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.print(pitch);

      Serial.print("  velocity=");
      if (velocity < 100)
      {
         Serial.print(" ");
      }
      if (velocity < 10)
      {
         Serial.print(" ");
      }
      Serial.println(velocity);
#endif
      }
   }

   AudioInterrupts();

#ifdef DEBUG_MAXIMUM_NOTES
   int current_notes = 0;

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if ((poly_notes[i].channel != 0) && (poly_notes[i].base_pitch != 0))
      {
         current_notes++;
      }
   }

   if (current_notes > maximum_notes)
   {
      maximum_notes = current_notes;
   }

   Serial.print("ACTIVE NOTES : [");

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if (current_notes > i)
      {
         Serial.print("=");
      } else {
         Serial.print("-");
      }
   }

   Serial.print("]   MAXIMUM : [");

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      if (maximum_notes > i)
      {
         Serial.print("=");
      } else {
         Serial.print("-");
      }
   }

   Serial.println("]");
#endif
}  // handleNoteOn()


// MIDI message callback - pitch bend
void handlePitchBend(byte channel, int bend)
{
   AudioNoInterrupts();

   midi_control_activity_state = true;

   pitch_bend = bend;

   PBend.amplitude((float)(pitch_bend) / 8192.0);

   AudioInterrupts();
}  // handlePitchBend()


// MIDI message callback - program change
void handleProgramChange(byte channel, byte number)
{
   midi_control_activity_state = true;
}  // handleProgramChange()


// MIDI message callback - song position
void handleSongPosition(unsigned beats)
{
   midi_control_activity_state = true;
}  // handleSongPosition()


// MIDI message callback - song select
void handleSongSelect(byte songnumber)
{
   midi_control_activity_state = true;
}  // handleSongSelect()


// MIDI message callback - start
void handleStart(void)
{
   midi_control_activity_state = true;
}  // handleStart()


// MIDI message callback - stop
void handleStop(void)
{
   midi_control_activity_state = true;
}  // handleStop()


// MIDI message callback - system exclusive
void handleSystemExclusive(byte * array, unsigned size)
{
   midi_control_activity_state = true;
}  // handleSystemExclusive()


// MIDI message callback - system reset
void handleSystemReset(void)
{
   AudioNoInterrupts();

   Serial.println("handleSystemReset is calling kill_all_notes()");

   kill_all_notes();

   AudioInterrupts();
}  // handleSystemReset()


// MIDI message callback - timecode quarter frame
void handleTimeCodeQuarterFrame(byte data)
{
   midi_control_activity_state = true;
}  // handleTimeCodeQuarterFrame()


// MIDI message callback - tune request
void handleTuneRequest(void)
{
   midi_control_activity_state = true;
}  // handleTuneRequest()


// kill all notes - commanded by MIDI CC msg, by timeout, or by PANIC button press
void kill_all_notes(void)
{
   for (int i = 0; i < LIMIT_POLY; i++)
   {
#ifdef DEBUG_MAKE_NOTE_AVAILABLE
      Serial.print("kill all notes is making available note index = ");
      Serial.println(i);
#endif
      // make this note entry available for (re)use
      poly_notes[i].channel = 0;
      poly_notes[i].base_pitch = 0;
      poly_notes[i].note_state = false;
   }

   if (env_active_state == true)
   {
      VFOenvelope16.noteOff();
      VFOenvelope15.noteOff();
      VFOenvelope14.noteOff();
      VFOenvelope13.noteOff();
      VFOenvelope12.noteOff();
      VFOenvelope11.noteOff();
      VFOenvelope10.noteOff();
      VFOenvelope09.noteOff();
      VFOenvelope08.noteOff();
      VFOenvelope07.noteOff();
      VFOenvelope06.noteOff();
      VFOenvelope05.noteOff();
      VFOenvelope04.noteOff();
      VFOenvelope03.noteOff();
      VFOenvelope02.noteOff();
      VFOenvelope01.noteOff();
   } else {
      VFOsine16A.amplitude(0);
      VFOsquare16A.amplitude(0);
      VFOtriangle16A.amplitude(0);
      VFOsaw16A.amplitude(0);
      VFOstring16A.noteOff(0.0);
      VFOwhite16A.amplitude(0);
      VFOpink16A.amplitude(0);
      VFOsweep16A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine16B.amplitude(0);
      VFOsquare16B.amplitude(0);
      VFOtriangle16B.amplitude(0);
      VFOsaw16B.amplitude(0);
      VFOstring16B.noteOff(0.0);
      VFOwhite16B.amplitude(0);
      VFOpink16B.amplitude(0);
      VFOsweep16B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine15A.amplitude(0);
      VFOsquare15A.amplitude(0);
      VFOtriangle15A.amplitude(0);
      VFOsaw15A.amplitude(0);
      VFOstring15A.noteOff(0.0);
      VFOwhite15A.amplitude(0);
      VFOpink15A.amplitude(0);
      VFOsweep15A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine15B.amplitude(0);
      VFOsquare15B.amplitude(0);
      VFOtriangle15B.amplitude(0);
      VFOsaw15B.amplitude(0);
      VFOstring15B.noteOff(0.0);
      VFOwhite15B.amplitude(0);
      VFOpink15B.amplitude(0);
      VFOsweep15B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine14A.amplitude(0);
      VFOsquare14A.amplitude(0);
      VFOtriangle14A.amplitude(0);
      VFOsaw14A.amplitude(0);
      VFOstring14A.noteOff(0.0);
      VFOwhite14A.amplitude(0);
      VFOpink14A.amplitude(0);
      VFOsweep14A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine14B.amplitude(0);
      VFOsquare14B.amplitude(0);
      VFOtriangle14B.amplitude(0);
      VFOsaw14B.amplitude(0);
      VFOstring14B.noteOff(0.0);
      VFOwhite14B.amplitude(0);
      VFOpink14B.amplitude(0);
      VFOsweep14B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine13A.amplitude(0);
      VFOsquare13A.amplitude(0);
      VFOtriangle13A.amplitude(0);
      VFOsaw13A.amplitude(0);
      VFOstring13A.noteOff(0.0);
      VFOwhite13A.amplitude(0);
      VFOpink13A.amplitude(0);
      VFOsweep13A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine13B.amplitude(0);
      VFOsquare13B.amplitude(0);
      VFOtriangle13B.amplitude(0);
      VFOsaw13B.amplitude(0);
      VFOstring13B.noteOff(0.0);
      VFOwhite13B.amplitude(0);
      VFOpink13B.amplitude(0);
      VFOsweep13B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine12A.amplitude(0);
      VFOsquare12A.amplitude(0);
      VFOtriangle12A.amplitude(0);
      VFOsaw12A.amplitude(0);
      VFOstring12A.noteOff(0.0);
      VFOwhite12A.amplitude(0);
      VFOpink12A.amplitude(0);
      VFOsweep12A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine12B.amplitude(0);
      VFOsquare12B.amplitude(0);
      VFOtriangle12B.amplitude(0);
      VFOsaw12B.amplitude(0);
      VFOstring12B.noteOff(0.0);
      VFOwhite12B.amplitude(0);
      VFOpink12B.amplitude(0);
      VFOsweep12B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine11A.amplitude(0);
      VFOsquare11A.amplitude(0);
      VFOtriangle11A.amplitude(0);
      VFOsaw11A.amplitude(0);
      VFOstring11A.noteOff(0.0);
      VFOwhite11A.amplitude(0);
      VFOpink11A.amplitude(0);
      VFOsweep11A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine11B.amplitude(0);
      VFOsquare11B.amplitude(0);
      VFOtriangle11B.amplitude(0);
      VFOsaw11B.amplitude(0);
      VFOstring11B.noteOff(0.0);
      VFOwhite11B.amplitude(0);
      VFOpink11B.amplitude(0);
      VFOsweep11B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine10A.amplitude(0);
      VFOsquare10A.amplitude(0);
      VFOtriangle10A.amplitude(0);
      VFOsaw10A.amplitude(0);
      VFOstring10A.noteOff(0.0);
      VFOwhite10A.amplitude(0);
      VFOpink10A.amplitude(0);
      VFOsweep10A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine10B.amplitude(0);
      VFOsquare10B.amplitude(0);
      VFOtriangle10B.amplitude(0);
      VFOsaw10B.amplitude(0);
      VFOstring10B.noteOff(0.0);
      VFOwhite10B.amplitude(0);
      VFOpink10B.amplitude(0);
      VFOsweep10B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine09A.amplitude(0);
      VFOsquare09A.amplitude(0);
      VFOtriangle09A.amplitude(0);
      VFOsaw09A.amplitude(0);
      VFOstring09A.noteOff(0.0);
      VFOwhite09A.amplitude(0);
      VFOpink09A.amplitude(0);
      VFOsweep09A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine09B.amplitude(0);
      VFOsquare09B.amplitude(0);
      VFOtriangle09B.amplitude(0);
      VFOsaw09B.amplitude(0);
      VFOstring09B.noteOff(0.0);
      VFOwhite09B.amplitude(0);
      VFOpink09B.amplitude(0);
      VFOsweep09B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine08A.amplitude(0);
      VFOsquare08A.amplitude(0);
      VFOtriangle08A.amplitude(0);
      VFOsaw08A.amplitude(0);
      VFOstring08A.noteOff(0.0);
      VFOwhite08A.amplitude(0);
      VFOpink08A.amplitude(0);
      VFOsweep08A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine08B.amplitude(0);
      VFOsquare08B.amplitude(0);
      VFOtriangle08B.amplitude(0);
      VFOsaw08B.amplitude(0);
      VFOstring08B.noteOff(0.0);
      VFOwhite08B.amplitude(0);
      VFOpink08B.amplitude(0);
      VFOsweep08B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine07A.amplitude(0);
      VFOsquare07A.amplitude(0);
      VFOtriangle07A.amplitude(0);
      VFOsaw07A.amplitude(0);
      VFOstring07A.noteOff(0.0);
      VFOwhite07A.amplitude(0);
      VFOpink07A.amplitude(0);
      VFOsweep07A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine07B.amplitude(0);
      VFOsquare07B.amplitude(0);
      VFOtriangle07B.amplitude(0);
      VFOsaw07B.amplitude(0);
      VFOstring07B.noteOff(0.0);
      VFOwhite07B.amplitude(0);
      VFOpink07B.amplitude(0);
      VFOsweep07B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine06A.amplitude(0);
      VFOsquare06A.amplitude(0);
      VFOtriangle06A.amplitude(0);
      VFOsaw06A.amplitude(0);
      VFOstring06A.noteOff(0.0);
      VFOwhite06A.amplitude(0);
      VFOpink06A.amplitude(0);
      VFOsweep06A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine06B.amplitude(0);
      VFOsquare06B.amplitude(0);
      VFOtriangle06B.amplitude(0);
      VFOsaw06B.amplitude(0);
      VFOstring06B.noteOff(0.0);
      VFOwhite06B.amplitude(0);
      VFOpink06B.amplitude(0);
      VFOsweep06B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine05A.amplitude(0);
      VFOsquare05A.amplitude(0);
      VFOtriangle05A.amplitude(0);
      VFOsaw05A.amplitude(0);
      VFOstring05A.noteOff(0.0);
      VFOwhite05A.amplitude(0);
      VFOpink05A.amplitude(0);
      VFOsweep05A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine05B.amplitude(0);
      VFOsquare05B.amplitude(0);
      VFOtriangle05B.amplitude(0);
      VFOsaw05B.amplitude(0);
      VFOstring05B.noteOff(0.0);
      VFOwhite05B.amplitude(0);
      VFOpink05B.amplitude(0);
      VFOsweep05B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine04A.amplitude(0);
      VFOsquare04A.amplitude(0);
      VFOtriangle04A.amplitude(0);
      VFOsaw04A.amplitude(0);
      VFOstring04A.noteOff(0.0);
      VFOwhite04A.amplitude(0);
      VFOpink04A.amplitude(0);
      VFOsweep04A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine04B.amplitude(0);
      VFOsquare04B.amplitude(0);
      VFOtriangle04B.amplitude(0);
      VFOsaw04B.amplitude(0);
      VFOstring04B.noteOff(0.0);
      VFOwhite04B.amplitude(0);
      VFOpink04B.amplitude(0);
      VFOsweep04B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine03A.amplitude(0);
      VFOsquare03A.amplitude(0);
      VFOtriangle03A.amplitude(0);
      VFOsaw03A.amplitude(0);
      VFOstring03A.noteOff(0.0);
      VFOwhite03A.amplitude(0);
      VFOpink03A.amplitude(0);
      VFOsweep03A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine03B.amplitude(0);
      VFOsquare03B.amplitude(0);
      VFOtriangle03B.amplitude(0);
      VFOsaw03B.amplitude(0);
      VFOstring03B.noteOff(0.0);
      VFOwhite03B.amplitude(0);
      VFOpink03B.amplitude(0);
      VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine02A.amplitude(0);
      VFOsquare02A.amplitude(0);
      VFOtriangle02A.amplitude(0);
      VFOsaw02A.amplitude(0);
      VFOstring02A.noteOff(0.0);
      VFOwhite02A.amplitude(0);
      VFOpink02A.amplitude(0);
      VFOsweep02A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine02B.amplitude(0);
      VFOsquare02B.amplitude(0);
      VFOtriangle02B.amplitude(0);
      VFOsaw02B.amplitude(0);
      VFOstring02B.noteOff(0.0);
      VFOwhite02B.amplitude(0);
      VFOpink02B.amplitude(0);
      VFOsweep02B.play(0.0, 10.0, 10.0, 1.0);

      VFOsine01A.amplitude(0);
      VFOsquare01A.amplitude(0);
      VFOtriangle01A.amplitude(0);
      VFOsaw01A.amplitude(0);
      VFOstring01A.noteOff(0.0);
      VFOwhite01A.amplitude(0);
      VFOpink01A.amplitude(0);
      VFOsweep01A.play(0.0, 10.0, 10.0, 1.0);

      VFOsine01B.amplitude(0);
      VFOsquare01B.amplitude(0);
      VFOtriangle01B.amplitude(0);
      VFOsaw01B.amplitude(0);
      VFOstring01B.noteOff(0.0);
      VFOwhite01B.amplitude(0);
      VFOpink01B.amplitude(0);
      VFOsweep01B.play(0.0, 10.0, 10.0, 1.0);
   }

   // reset the statistics reports
   maximum_notes = 0;
   AudioProcessorUsageMaxReset();
}  // kill_all_notes()


// main loop
void loop()
{
   MIDI.read();
   usbMIDI.read();
   tmpsUSB.Task();
   usbhostMIDI.read();

   switch(mux_op_type)
   {
      case MUX_READ_POT:
      {
         // setup the input pin with no internal pull-up for reading pots
         pinMode(PRIMARY_MUX_INPUT_OUTPUT_PIN, INPUT);

         switch(mux_input_pot_index)
         {
            case MUX_IN_MASTER_VOLUME_POT:  // C00:C00 - master volume pot
            {
#ifdef CHECK_CYCLE_TIME
               cycle_debug();
#endif

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               master_volume_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_master_volume_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (master_volume_pot != previous_master_volume_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Master Volume Pot         :");
                  Serial.println(master_volume_pot);
#endif
                  previous_master_volume_pot = master_volume_pot;

                  sgtl5000_1.volume((float)master_volume_pot / 1023.0);
               }
            }
            break;

            case MUX_IN_AB_BALANCE_POT:  // C00:C01 - AB balance pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               AB_balance_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_AB_balance_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (AB_balance_pot != previous_AB_balance_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("AB Balance Pot            :");
                  Serial.println(AB_balance_pot);
#endif
                  previous_AB_balance_pot = AB_balance_pot;

                  waveMix16_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix16_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix16_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix16_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix15_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix15_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix15_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix15_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix14_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix14_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix14_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix14_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix13_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix13_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix13_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix13_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix12_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix12_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix12_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix12_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix11_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix11_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix11_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix11_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix10_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix10_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix10_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix10_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix09_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix09_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix09_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix09_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix08_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix08_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix08_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix08_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix07_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix07_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix07_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix07_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix06_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix06_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix06_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix06_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix05_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix05_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix05_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix05_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix04_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix04_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix04_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix04_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix03_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix03_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix03_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix03_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix02_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix02_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix02_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix02_3A.gain(3, (float)AB_balance_pot / 2047.0);

                  waveMix01_3A.gain(0, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix01_3A.gain(1, (1023.0 - (float)AB_balance_pot) / 2047.0);
                  waveMix01_3A.gain(2, (float)AB_balance_pot / 2047.0);
                  waveMix01_3A.gain(3, (float)AB_balance_pot / 2047.0);
               }
            }
            break;

            case MUX_IN_VFO_TUNING_POT:  // C00:C02 - VFO tuning pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_tuning_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_tuning_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               // if either of the strings are enabled, then disable the tuning pot (since the strings cannot currently be tuned - no modulation input)
               //    & force the defaulted/disabled tuning to get set
               if ((vfoA_string_state == true) || (vfoB_string_state == true))
               {
                  vfo_tuning_pot = 512;
                  previous_vfo_tuning_pot = -1;
               }

               if (vfo_tuning_pot != previous_vfo_tuning_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO Tuning Pot            :");
                  Serial.println(vfo_tuning_pot);
#endif
                  previous_vfo_tuning_pot = vfo_tuning_pot;

                  VFOtuningA.amplitude((((float)(vfo_tuning_pot - 511) / 1024.0) + (float)(vfo_detuning_pot - 511) / 1024.0) / pitch_multiplier * 0.5);
                  VFOtuningB.amplitude((((float)(vfo_tuning_pot - 511) / 1024.0) - (float)(vfo_detuning_pot - 511) / 1024.0) / pitch_multiplier * 0.5);
               }
            }
            break;

            case MUX_IN_VFO_DETUNING_POT:  // C00:C03 - VFO detuning pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_detuning_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_detuning_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               // create a "dead band" at the center of the pot, so that, by default,
               //    both oscillators are in tune, without having te center the pot precisely
               if (vfo_detuning_pot <= 491)
               {
                  vfo_detuning_pot += 22;
               } else {
                  if (vfo_detuning_pot >= 540)
                  {
                     vfo_detuning_pot -= 29;
                  } else {
                     vfo_detuning_pot = 511;
                  }
               }

               if (vfo_detuning_pot != previous_vfo_detuning_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO Detuning Pot          :");
                  Serial.println(vfo_detuning_pot);
#endif
                  previous_vfo_detuning_pot = vfo_detuning_pot;

                  VFOtuningA.amplitude((((float)(vfo_tuning_pot - 511) / 1024.0) + (float)(vfo_detuning_pot - 511) / 1024.0) / pitch_multiplier * 0.5);
                  VFOtuningB.amplitude((((float)(vfo_tuning_pot - 511) / 1024.0) - (float)(vfo_detuning_pot - 511) / 1024.0) / pitch_multiplier * 0.5);
               }
            }
            break;

            case MUX_IN_MIDI_CHANNEL_POT:  // C00:C04 - MIDI channel pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               midi_channel_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_midi_channel_pot) / 2;
#endif
               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (midi_channel_pot != previous_midi_channel_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("MIDI Channel Pot          :");
                  Serial.println(midi_channel_pot);
#endif
                  previous_midi_channel_pot = midi_channel_pot;

                  midi_channel = (int)((midi_channel_pot * 16) / 1000);
                  if (midi_channel > 16)
                  {
                     midi_channel = 16;
                  }

                  if (midi_channel == 0)
                  {
                     for (int i = 0; i < 7; i++)
                     {
                        led_display_left[i] = DIGIT_A[i];
                        led_display_right[i] = DIGIT_LL[i];
                     }
                  } else {
                     if (midi_channel >= 10)
                     {
                        for (int i = 0; i < 7; i++)
                        {
                           led_display_left[i] = DIGIT_1[i];

                           switch (midi_channel - 10)
                           {
                              case 0:
                              {
                                 led_display_right[i] = DIGIT_0[i];
                              }
                              break;

                              case 1:
                              {
                                 led_display_right[i] = DIGIT_1[i];
                              }
                              break;

                              case 2:
                              {
                                 led_display_right[i] = DIGIT_2[i];
                              }
                              break;

                              case 3:
                              {
                                 led_display_right[i] = DIGIT_3[i];
                              }
                              break;

                              case 4:
                              {
                                 led_display_right[i] = DIGIT_4[i];
                              }
                              break;

                              case 5:
                              {
                                 led_display_right[i] = DIGIT_5[i];
                              }
                              break;

                              case 6:
                              {
                                 led_display_right[i] = DIGIT_6[i];
                              }
                              break;

                              case 7:
                              {
                                 led_display_right[i] = DIGIT_7[i];
                              }
                              break;

                              case 8:
                              {
                                 led_display_right[i] = DIGIT_8[i];
                              }
                              break;

                              case 9:
                              {
                                 led_display_right[i] = DIGIT_9[i];
                              }
                              break;
                           }
                        }
                     } else {
                        for (int i = 0; i < 7; i++)
                        {
                           led_display_left[i] = DIGIT_0[i];

                           switch (midi_channel)
                           {
                              case 0:
                              {
                                 led_display_right[i] = DIGIT_0[i];
                              }
                              break;

                              case 1:
                              {
                                 led_display_right[i] = DIGIT_1[i];
                              }
                              break;

                              case 2:
                              {
                                 led_display_right[i] = DIGIT_2[i];
                              }
                              break;

                              case 3:
                              {
                                 led_display_right[i] = DIGIT_3[i];
                              }
                              break;

                              case 4:
                              {
                                 led_display_right[i] = DIGIT_4[i];
                              }
                              break;

                              case 5:
                              {
                                 led_display_right[i] = DIGIT_5[i];
                              }
                              break;

                              case 6:
                              {
                                 led_display_right[i] = DIGIT_6[i];
                              }
                              break;

                              case 7:
                              {
                                 led_display_right[i] = DIGIT_7[i];
                              }
                              break;

                              case 8:
                              {
                                 led_display_right[i] = DIGIT_8[i];
                              }
                              break;

                              case 9:
                              {
                                 led_display_right[i] = DIGIT_9[i];
                              }
                              break;
                           }
                        }
                     }
                  }

                  if (midi_channel != previous_midi_channel)
                  {
                     // update the LEDs to immediately show any changes
                     write_leds_thru_shiftreg();

                     previous_midi_channel = midi_channel;
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_FREQ_POT:  // C00:C05 - LFO modulation frequency pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_frequency_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_frequency_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_frequency_pot != previous_lfo_mod_frequency_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Freq Pot          :");
                  Serial.println(lfo_mod_frequency_pot);
#endif
                  previous_lfo_mod_frequency_pot = lfo_mod_frequency_pot;

                  LFOsineMod.frequency(((float)lfo_mod_frequency_pot * 50.0) / 1023.0);
                  LFOsquareMod.frequency(((float)lfo_mod_frequency_pot * 50.0) / 1023.0);
                  LFOpulseMod.frequency(((float)lfo_mod_frequency_pot * 50.0) / 1023.0);
                  LFOtriangleMod.frequency(((float)lfo_mod_frequency_pot * 50.0) / 1023.0);
                  LFOsawMod.frequency(((float)lfo_mod_frequency_pot * 50.0) / 1023.0);
                  LFOsampleholdMod.frequency(((float)lfo_mod_frequency_pot * 50.0) / 1023.0);
               }
            }
            break;

            case MUX_IN_LFO_MOD_DC_OFFSET_POT:  // C00:C06 - LFO modulation DC offset pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_dc_offset_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_dc_offset_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_dc_offset_pot != previous_lfo_mod_dc_offset_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod DC Offset Pot     :");
                  Serial.println(lfo_mod_dc_offset_pot);
#endif
                  previous_lfo_mod_dc_offset_pot = lfo_mod_dc_offset_pot;

                  LFOsineMod.offset((float)(lfo_mod_dc_offset_pot - 511) / 512.0);
                  LFOsquareMod.offset((float)(lfo_mod_dc_offset_pot - 511) / 512.0);
                  LFOpulseMod.offset((float)(lfo_mod_dc_offset_pot - 511) / 512.0);
                  LFOtriangleMod.offset((float)(lfo_mod_dc_offset_pot - 511) / 512.0);
                  LFOsawMod.offset((float)(lfo_mod_dc_offset_pot - 511) / 512.0);
                  LFOsampleholdMod.offset((float)(lfo_mod_dc_offset_pot - 511) / 512.0);
               }
            }
            break;

            case MUX_IN_LFO_MOD_SINE_POT:  // C00:C07 - LFO modulation sine pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_sine_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_sine_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_sine_pot != previous_lfo_mod_sine_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Sine Pot          :");
                  Serial.println(lfo_mod_sine_pot);
#endif
                  previous_lfo_mod_sine_pot = lfo_mod_sine_pot;

                  if ((lfo_mod_active_state == true) && (lfo_mod_sine_state == true))
                  {
                     LFOmodMix1_1.gain(0, ((float)(lfo_mod_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state + (int)lfo_mod_samphold_state)));
                  } else {
                     LFOmodMix1_1.gain(0, (0.0));
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_SQUARE_POT:  // C00:C08 - LFO modulation square pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_square_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_square_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_square_pot != previous_lfo_mod_square_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Square Pot        :");
                  Serial.println(lfo_mod_square_pot);
#endif
                  previous_lfo_mod_square_pot = lfo_mod_square_pot;

                  if ((lfo_mod_active_state == true) && (lfo_mod_square_state == true))
                  {
                     LFOmodMix1_1.gain(1, ((float)(lfo_mod_square_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state + (int)lfo_mod_samphold_state)));
                  } else {
                     LFOmodMix1_1.gain(1, (0.0));
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_PULSE_POT:  // C00:C09 - LFO modulation pulse pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_pulse_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_pulse_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_pulse_pot != previous_lfo_mod_pulse_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Pulse Pot         :");
                  Serial.println(lfo_mod_pulse_pot);
#endif
                  previous_lfo_mod_pulse_pot = lfo_mod_pulse_pot;

                  if ((lfo_mod_active_state == true) && (lfo_mod_pulse_state == true))
                  {
                     LFOmodMix1_1.gain(2, ((float)(lfo_mod_pulse_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
                  } else {
                     LFOmodMix1_1.gain(2, (0.0));
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_PULSE_DUTY_POT:  // C00:C10 - LFO modulation pulse duty cycle pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_pulse_duty_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_pulse_duty_pot) / 2;
#endif
               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_pulse_duty_pot != previous_lfo_mod_pulse_duty_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Pulse Duty Pot    :");
                  Serial.println(lfo_mod_pulse_duty_pot);
#endif
                  previous_lfo_mod_pulse_duty_pot = lfo_mod_pulse_duty_pot;

                  if (lfo_mod_pulse_duty_state == true)
                  {
                     // scale to -0.9 to +0.9 range
                     LFOpulseModDutyCycle.amplitude((float)(lfo_mod_pulse_duty_pot - 511) / 569.0);
                  } else {
                     LFOpulseModDutyCycle.amplitude(-0.9);
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_TRIANGLE_POT:  // C00:C11 - LFO modulation triangle pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_triangle_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_triangle_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_triangle_pot != previous_lfo_mod_triangle_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Triangle Pot      :");
                  Serial.println(lfo_mod_triangle_pot);
#endif
                  previous_lfo_mod_triangle_pot = lfo_mod_triangle_pot;

                  if ((lfo_mod_active_state == true) && (lfo_mod_triangle_state == true))
                  {
                     LFOmodMix1_1.gain(3, ((float)(lfo_mod_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
                  } else {
                     LFOmodMix1_1.gain(3, (0.0));
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_SAW_POT:  // C00:C12 - LFO modulation sawtooth pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_saw_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_saw_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_saw_pot != previous_lfo_mod_saw_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod Saw Pot           :");
                  Serial.println(lfo_mod_saw_pot);
#endif
                  previous_lfo_mod_saw_pot = lfo_mod_saw_pot;

                  if ((lfo_mod_active_state == true) && (lfo_mod_saw_state == true))
                  {
                     LFOmodMix1_2.gain(0, ((float)(lfo_mod_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
                  } else {
                     LFOmodMix1_2.gain(0, (0.0));
                  }
               }
            }
            break;

            case MUX_IN_LFO_MOD_SAMPHOLD_POT:  // C00:C13 - LFO modulation sample/hold pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_mod_samphold_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_mod_samphold_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_mod_samphold_pot != previous_lfo_mod_samphold_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Mod SampHold Pot      :");
                  Serial.println(lfo_mod_samphold_pot);
#endif
                  previous_lfo_mod_samphold_pot = lfo_mod_samphold_pot;

                  if ((lfo_mod_active_state == true) && (lfo_mod_samphold_state == true))
                  {
                     LFOmodMix1_2.gain(1, ((float)(lfo_mod_samphold_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
                  } else {
                     LFOmodMix1_2.gain(1, (0.0));
                  }
               }
            }
            break;

            case MUX_IN_VFOA_OCTAVE_POT:  // C00:C14 - VFO A octave pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_octave_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_octave_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_octave_pot != previous_vfoA_octave_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Octave Pot          :");
                  Serial.println(vfoA_octave_pot);
#endif
                  previous_vfoA_octave_pot = vfoA_octave_pot;

                  if (vfoA_octave_pot < 145)
                  {
                     octaveA_divisor = 8.0;
                  } else {
                     if (vfoA_octave_pot < 290)
                     {
                        octaveA_divisor = 4.0;
                     } else {
                        if (vfoA_octave_pot < 435)
                        {
                           octaveA_divisor = 2.0;
                        } else {
                           if (vfoA_octave_pot < 590)
                           {
                              octaveA_divisor = 1.0;
                           } else {
                              if (vfoA_octave_pot < 735)
                              {
                                 octaveA_divisor = 1.0 / 2.0;
                              } else {
                                 if (vfoA_octave_pot < 880)
                                 {
                                    octaveA_divisor = 1.0 / 4.0;
                                 } else {
                                    octaveA_divisor = 1.0 / 8.0;
                                 }
                              }
                           }
                        }
                     }
                  }
               }
            }
            break;

            case MUX_IN_VFOA_SINE_POT:  // C00:C15 - VFO A sine pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_sine_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_sine_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_sine_pot != previous_vfoA_sine_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Sine Pot            :");
                  Serial.println(vfoA_sine_pot);
#endif
                  previous_vfoA_sine_pot = vfoA_sine_pot;

                  if (vfoA_sine_state == true)
                  {
                     waveMix16_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1A.gain(0, 0);
                     waveMix15_1A.gain(0, 0);
                     waveMix14_1A.gain(0, 0);
                     waveMix13_1A.gain(0, 0);
                     waveMix12_1A.gain(0, 0);
                     waveMix11_1A.gain(0, 0);
                     waveMix10_1A.gain(0, 0);
                     waveMix09_1A.gain(0, 0);
                     waveMix08_1A.gain(0, 0);
                     waveMix07_1A.gain(0, 0);
                     waveMix06_1A.gain(0, 0);
                     waveMix05_1A.gain(0, 0);
                     waveMix04_1A.gain(0, 0);
                     waveMix03_1A.gain(0, 0);
                     waveMix02_1A.gain(0, 0);
                     waveMix01_1A.gain(0, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_SQUARE_POT:  // C01:C00 - VFO A square pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_square_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_square_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_square_pot != previous_vfoA_square_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Square Pot          :");
                  Serial.println(vfoA_square_pot);
#endif
                  previous_vfoA_square_pot = vfoA_square_pot;

                  if (vfoA_square_state == true)
                  {
                     waveMix16_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1A.gain(1, 0);
                     waveMix15_1A.gain(1, 0);
                     waveMix14_1A.gain(1, 0);
                     waveMix13_1A.gain(1, 0);
                     waveMix12_1A.gain(1, 0);
                     waveMix11_1A.gain(1, 0);
                     waveMix10_1A.gain(1, 0);
                     waveMix09_1A.gain(1, 0);
                     waveMix08_1A.gain(1, 0);
                     waveMix07_1A.gain(1, 0);
                     waveMix06_1A.gain(1, 0);
                     waveMix05_1A.gain(1, 0);
                     waveMix04_1A.gain(1, 0);
                     waveMix03_1A.gain(1, 0);
                     waveMix02_1A.gain(1, 0);
                     waveMix01_1A.gain(1, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_TRIANGLE_POT:  // C01:C01 - VFO A triangle pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_triangle_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_triangle_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_triangle_pot != previous_vfoA_triangle_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Triangle Pot        :");
                  Serial.println(vfoA_triangle_pot);
#endif
                  previous_vfoA_triangle_pot = vfoA_triangle_pot;

                  if (vfoA_triangle_state == true)
                  {
                     waveMix16_1A.gain(1, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1A.gain(2, 0);
                     waveMix15_1A.gain(2, 0);
                     waveMix14_1A.gain(2, 0);
                     waveMix13_1A.gain(2, 0);
                     waveMix12_1A.gain(2, 0);
                     waveMix11_1A.gain(2, 0);
                     waveMix10_1A.gain(2, 0);
                     waveMix09_1A.gain(2, 0);
                     waveMix08_1A.gain(2, 0);
                     waveMix07_1A.gain(2, 0);
                     waveMix06_1A.gain(2, 0);
                     waveMix05_1A.gain(2, 0);
                     waveMix04_1A.gain(2, 0);
                     waveMix03_1A.gain(2, 0);
                     waveMix02_1A.gain(2, 0);
                     waveMix01_1A.gain(2, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_SAW_POT:  // C01:C02 - VFO A sawtooth pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_saw_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_saw_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_saw_pot != previous_vfoA_saw_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Saw Pot             :");
                  Serial.println(vfoA_saw_pot);
#endif
                  previous_vfoA_saw_pot = vfoA_saw_pot;

                  if (vfoA_saw_state == true)
                  {
                     waveMix16_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1A.gain(3, 0);
                     waveMix15_1A.gain(3, 0);
                     waveMix14_1A.gain(3, 0);
                     waveMix13_1A.gain(3, 0);
                     waveMix12_1A.gain(3, 0);
                     waveMix11_1A.gain(3, 0);
                     waveMix10_1A.gain(3, 0);
                     waveMix09_1A.gain(3, 0);
                     waveMix08_1A.gain(3, 0);
                     waveMix07_1A.gain(3, 0);
                     waveMix06_1A.gain(3, 0);
                     waveMix05_1A.gain(3, 0);
                     waveMix04_1A.gain(3, 0);
                     waveMix03_1A.gain(3, 0);
                     waveMix02_1A.gain(3, 0);
                     waveMix01_1A.gain(3, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_STRING_POT:  // C01:C03 - VFO A string pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_string_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_string_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_string_pot != previous_vfoA_string_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A String Pot          :");
                  Serial.println(vfoA_string_pot);
#endif
                  previous_vfoA_string_pot = vfoA_string_pot;

                  if (vfoA_string_state == true)
                  {
                     waveMix16_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2A.gain(0, 0);
                     waveMix15_2A.gain(0, 0);
                     waveMix14_2A.gain(0, 0);
                     waveMix13_2A.gain(0, 0);
                     waveMix12_2A.gain(0, 0);
                     waveMix11_2A.gain(0, 0);
                     waveMix10_2A.gain(0, 0);
                     waveMix09_2A.gain(0, 0);
                     waveMix08_2A.gain(0, 0);
                     waveMix07_2A.gain(0, 0);
                     waveMix06_2A.gain(0, 0);
                     waveMix05_2A.gain(0, 0);
                     waveMix04_2A.gain(0, 0);
                     waveMix03_2A.gain(0, 0);
                     waveMix02_2A.gain(0, 0);
                     waveMix01_2A.gain(0, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_WHITE_POT:  // C01:C04 - VFO A white noise pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_white_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_white_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_white_pot != previous_vfoA_white_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A White Noise Pot     :");
                  Serial.println(vfoA_white_pot);
#endif
                  previous_vfoA_white_pot = vfoA_white_pot;

                  if (vfoA_white_state == true)
                  {
                     waveMix16_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2A.gain(1, 0);
                     waveMix15_2A.gain(1, 0);
                     waveMix14_2A.gain(1, 0);
                     waveMix13_2A.gain(1, 0);
                     waveMix12_2A.gain(1, 0);
                     waveMix11_2A.gain(1, 0);
                     waveMix10_2A.gain(1, 0);
                     waveMix09_2A.gain(1, 0);
                     waveMix08_2A.gain(1, 0);
                     waveMix07_2A.gain(1, 0);
                     waveMix06_2A.gain(1, 0);
                     waveMix05_2A.gain(1, 0);
                     waveMix04_2A.gain(1, 0);
                     waveMix03_2A.gain(1, 0);
                     waveMix02_2A.gain(1, 0);
                     waveMix01_2A.gain(1, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_PINK_POT:  // C01:C05 - VFO A pink noise pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_pink_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_pink_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_pink_pot != previous_vfoA_pink_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Pink Noise Pot      :");
                  Serial.println(vfoA_pink_pot);
#endif
                  previous_vfoA_pink_pot = vfoA_pink_pot;

                  if (vfoA_pink_state == true)
                  {
                     waveMix16_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2A.gain(2, 0);
                     waveMix15_2A.gain(2, 0);
                     waveMix14_2A.gain(2, 0);
                     waveMix13_2A.gain(2, 0);
                     waveMix12_2A.gain(2, 0);
                     waveMix11_2A.gain(2, 0);
                     waveMix10_2A.gain(2, 0);
                     waveMix09_2A.gain(2, 0);
                     waveMix08_2A.gain(2, 0);
                     waveMix07_2A.gain(2, 0);
                     waveMix06_2A.gain(2, 0);
                     waveMix05_2A.gain(2, 0);
                     waveMix04_2A.gain(2, 0);
                     waveMix03_2A.gain(2, 0);
                     waveMix02_2A.gain(2, 0);
                     waveMix01_2A.gain(2, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOA_SWEEP_POT:  // C01:C06 - VFO A sweep pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoA_sweep_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoA_sweep_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoA_sweep_pot != previous_vfoA_sweep_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO A Sweep Pot           :");
                  Serial.println(vfoA_sweep_pot);
#endif
                  previous_vfoA_sweep_pot = vfoA_sweep_pot;

                  if (vfoA_sweep_state == true)
                  {
                     waveMix16_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix16_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2A.gain(3, 0);
                     waveMix16_2B.gain(3, 0);
                     waveMix15_2A.gain(3, 0);
                     waveMix15_2B.gain(3, 0);
                     waveMix14_2A.gain(3, 0);
                     waveMix14_2B.gain(3, 0);
                     waveMix13_2A.gain(3, 0);
                     waveMix13_2B.gain(3, 0);
                     waveMix12_2A.gain(3, 0);
                     waveMix12_2B.gain(3, 0);
                     waveMix11_2A.gain(3, 0);
                     waveMix11_2B.gain(3, 0);
                     waveMix10_2A.gain(3, 0);
                     waveMix10_2B.gain(3, 0);
                     waveMix09_2A.gain(3, 0);
                     waveMix09_2B.gain(3, 0);
                     waveMix08_2A.gain(3, 0);
                     waveMix08_2B.gain(3, 0);
                     waveMix07_2A.gain(3, 0);
                     waveMix07_2B.gain(3, 0);
                     waveMix06_2A.gain(3, 0);
                     waveMix06_2B.gain(3, 0);
                     waveMix05_2A.gain(3, 0);
                     waveMix05_2B.gain(3, 0);
                     waveMix04_2A.gain(3, 0);
                     waveMix04_2B.gain(3, 0);
                     waveMix03_2A.gain(3, 0);
                     waveMix03_2B.gain(3, 0);
                     waveMix02_2A.gain(3, 0);
                     waveMix02_2B.gain(3, 0);
                     waveMix01_2A.gain(3, 0);
                     waveMix01_2B.gain(3, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_OCTAVE_POT:  // C01:C07 - VFO B octave pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_octave_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_octave_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_octave_pot != previous_vfoB_octave_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Octave Pot          :");
                  Serial.println(vfoB_octave_pot);
#endif
                  previous_vfoB_octave_pot = vfoB_octave_pot;

                  if (vfoB_octave_pot < 145)
                  {
                     octaveB_divisor = 8.0;
                  } else {
                     if (vfoB_octave_pot < 290)
                     {
                        octaveB_divisor = 4.0;
                     } else {
                        if (vfoB_octave_pot < 435)
                        {
                           octaveB_divisor = 2.0;
                        } else {
                           if (vfoB_octave_pot < 590)
                           {
                              octaveB_divisor = 1.0;
                           } else {
                              if (vfoB_octave_pot < 735)
                              {
                                 octaveB_divisor = 1.0 / 2.0;
                              } else {
                                 if (vfoB_octave_pot < 880)
                                 {
                                    octaveB_divisor = 1.0 / 4.0;
                                 } else {
                                    octaveB_divisor = 1.0 / 8.0;
                                 }
                              }
                           }
                        }
                     }
                  }
               }
            }
            break;

            case MUX_IN_VFOB_SINE_POT:  // C01:C08 - VFO B sine pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_sine_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_sine_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_sine_pot != previous_vfoB_sine_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Sine Pot            :");
                  Serial.println(vfoB_sine_pot);
#endif
                  previous_vfoB_sine_pot = vfoB_sine_pot;

                  if (vfoB_sine_state == true)
                  {
                     waveMix16_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1B.gain(0, 0);
                     waveMix15_1B.gain(0, 0);
                     waveMix14_1B.gain(0, 0);
                     waveMix13_1B.gain(0, 0);
                     waveMix12_1B.gain(0, 0);
                     waveMix11_1B.gain(0, 0);
                     waveMix10_1B.gain(0, 0);
                     waveMix09_1B.gain(0, 0);
                     waveMix08_1B.gain(0, 0);
                     waveMix07_1B.gain(0, 0);
                     waveMix06_1B.gain(0, 0);
                     waveMix05_1B.gain(0, 0);
                     waveMix04_1B.gain(0, 0);
                     waveMix03_1B.gain(0, 0);
                     waveMix02_1B.gain(0, 0);
                     waveMix01_1B.gain(0, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_SQUARE_POT:  // C01:C09 - VFO B square pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_square_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_square_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_square_pot != previous_vfoB_square_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Square Pot          :");
                  Serial.println(vfoB_square_pot);
#endif
                  previous_vfoB_square_pot = vfoB_square_pot;

                  if (vfoB_square_state == true)
                  {
                     waveMix16_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1B.gain(1, 0);
                     waveMix15_1B.gain(1, 0);
                     waveMix14_1B.gain(1, 0);
                     waveMix13_1B.gain(1, 0);
                     waveMix12_1B.gain(1, 0);
                     waveMix11_1B.gain(1, 0);
                     waveMix10_1B.gain(1, 0);
                     waveMix09_1B.gain(1, 0);
                     waveMix08_1B.gain(1, 0);
                     waveMix07_1B.gain(1, 0);
                     waveMix06_1B.gain(1, 0);
                     waveMix05_1B.gain(1, 0);
                     waveMix04_1B.gain(1, 0);
                     waveMix03_1B.gain(1, 0);
                     waveMix02_1B.gain(1, 0);
                     waveMix01_1B.gain(1, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_TRIANGLE_POT:  // C01:C10 - VFO B triangle pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_triangle_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_triangle_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_triangle_pot != previous_vfoB_triangle_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Triangle Pot        :");
                  Serial.println(vfoB_triangle_pot);
#endif
                  previous_vfoB_triangle_pot = vfoB_triangle_pot;

                  if (vfoB_triangle_state == true)
                  {
                     waveMix16_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1B.gain(2, 0);
                     waveMix15_1B.gain(2, 0);
                     waveMix14_1B.gain(2, 0);
                     waveMix13_1B.gain(2, 0);
                     waveMix12_1B.gain(2, 0);
                     waveMix11_1B.gain(2, 0);
                     waveMix10_1B.gain(2, 0);
                     waveMix09_1B.gain(2, 0);
                     waveMix08_1B.gain(2, 0);
                     waveMix07_1B.gain(2, 0);
                     waveMix06_1B.gain(2, 0);
                     waveMix05_1B.gain(2, 0);
                     waveMix04_1B.gain(2, 0);
                     waveMix03_1B.gain(2, 0);
                     waveMix02_1B.gain(2, 0);
                     waveMix01_1B.gain(2, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_SAW_POT:  // C01:C11 - VFO B sawtooth pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_saw_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_saw_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_saw_pot != previous_vfoB_saw_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Saw Pot             :");
                  Serial.println(vfoB_saw_pot);
#endif
                  previous_vfoB_saw_pot = vfoB_saw_pot;

                  if (vfoB_saw_state == true)
                  {
                     waveMix16_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_1B.gain(3, 0);
                     waveMix15_1B.gain(3, 0);
                     waveMix14_1B.gain(3, 0);
                     waveMix13_1B.gain(3, 0);
                     waveMix12_1B.gain(3, 0);
                     waveMix11_1B.gain(3, 0);
                     waveMix10_1B.gain(3, 0);
                     waveMix09_1B.gain(3, 0);
                     waveMix08_1B.gain(3, 0);
                     waveMix07_1B.gain(3, 0);
                     waveMix06_1B.gain(3, 0);
                     waveMix05_1B.gain(3, 0);
                     waveMix04_1B.gain(3, 0);
                     waveMix03_1B.gain(3, 0);
                     waveMix02_1B.gain(3, 0);
                     waveMix01_1B.gain(3, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_STRING_POT:  // C01:C12 - VFO B string pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_string_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_string_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_string_pot != previous_vfoB_string_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B String Pot          :");
                  Serial.println(vfoB_string_pot);
#endif
                  previous_vfoB_string_pot = vfoB_string_pot;

                  if (vfoB_string_state == true)
                  {
                     waveMix16_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2B.gain(0, 0);
                     waveMix15_2B.gain(0, 0);
                     waveMix14_2B.gain(0, 0);
                     waveMix13_2B.gain(0, 0);
                     waveMix12_2B.gain(0, 0);
                     waveMix11_2B.gain(0, 0);
                     waveMix10_2B.gain(0, 0);
                     waveMix09_2B.gain(0, 0);
                     waveMix08_2B.gain(0, 0);
                     waveMix07_2B.gain(0, 0);
                     waveMix06_2B.gain(0, 0);
                     waveMix05_2B.gain(0, 0);
                     waveMix04_2B.gain(0, 0);
                     waveMix03_2B.gain(0, 0);
                     waveMix02_2B.gain(0, 0);
                     waveMix01_2B.gain(0, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_WHITE_POT:  // C01:C13 - VFO B white noise pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_white_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_white_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_white_pot != previous_vfoB_white_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B White Noise Pot     :");
                  Serial.println(vfoB_white_pot);
#endif
                  previous_vfoB_white_pot = vfoB_white_pot;

                  if (vfoB_white_state == true)
                  {
                     waveMix16_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2B.gain(1, 0);
                     waveMix15_2B.gain(1, 0);
                     waveMix14_2B.gain(1, 0);
                     waveMix13_2B.gain(1, 0);
                     waveMix12_2B.gain(1, 0);
                     waveMix11_2B.gain(1, 0);
                     waveMix10_2B.gain(1, 0);
                     waveMix09_2B.gain(1, 0);
                     waveMix08_2B.gain(1, 0);
                     waveMix07_2B.gain(1, 0);
                     waveMix06_2B.gain(1, 0);
                     waveMix05_2B.gain(1, 0);
                     waveMix04_2B.gain(1, 0);
                     waveMix03_2B.gain(1, 0);
                     waveMix02_2B.gain(1, 0);
                     waveMix01_2B.gain(1, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_PINK_POT:  // C01:C14 - VFO B pink noise pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_pink_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_pink_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_pink_pot != previous_vfoB_pink_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Pink Noise Pot      :");
                  Serial.println(vfoB_pink_pot);
#endif
                  previous_vfoB_pink_pot = vfoB_pink_pot;

                  if (vfoB_pink_state == true)
                  {
                     waveMix16_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix15_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix14_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix13_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix12_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix11_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix10_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix09_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix08_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix07_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix06_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix05_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix04_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix03_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix02_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                     waveMix01_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoA_sweep_state)));
                  } else {
                     waveMix16_2B.gain(2, 0);
                     waveMix15_2B.gain(2, 0);
                     waveMix14_2B.gain(2, 0);
                     waveMix13_2B.gain(2, 0);
                     waveMix12_2B.gain(2, 0);
                     waveMix11_2B.gain(2, 0);
                     waveMix10_2B.gain(2, 0);
                     waveMix09_2B.gain(2, 0);
                     waveMix08_2B.gain(2, 0);
                     waveMix07_2B.gain(2, 0);
                     waveMix06_2B.gain(2, 0);
                     waveMix05_2B.gain(2, 0);
                     waveMix04_2B.gain(2, 0);
                     waveMix03_2B.gain(2, 0);
                     waveMix02_2B.gain(2, 0);
                     waveMix01_2B.gain(2, 0);
                  }
               }
            }
            break;

            case MUX_IN_VFOB_GLIDE_POT:  // C01:C15 - VFO B glide pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfoB_glide_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfoB_glide_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfoB_glide_pot != previous_vfoB_glide_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("VFO B Glide Pot           :");
                  Serial.println(vfoB_glide_pot);
#endif
                  previous_vfoB_glide_pot = vfoB_glide_pot;

                  glide_duration_millis = map(1023 - vfoB_glide_pot, 0, 1023, 50, 2500);
               }
            }
            break;

            case MUX_IN_ENV_ATTACK_POT:  // C02:C00 - envelope attack pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_attack_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_attack_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_attack_pot != previous_vfo_attack_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Envelope Attack Pot       :");
                  Serial.println(vfo_attack_pot);
#endif
                  previous_vfo_attack_pot = vfo_attack_pot;

                  VFOenvelope16.attack(vfo_attack_pot);
                  VFOenvelope15.attack(vfo_attack_pot);
                  VFOenvelope14.attack(vfo_attack_pot);
                  VFOenvelope13.attack(vfo_attack_pot);
                  VFOenvelope12.attack(vfo_attack_pot);
                  VFOenvelope11.attack(vfo_attack_pot);
                  VFOenvelope10.attack(vfo_attack_pot);
                  VFOenvelope09.attack(vfo_attack_pot);
                  VFOenvelope08.attack(vfo_attack_pot);
                  VFOenvelope07.attack(vfo_attack_pot);
                  VFOenvelope06.attack(vfo_attack_pot);
                  VFOenvelope05.attack(vfo_attack_pot);
                  VFOenvelope04.attack(vfo_attack_pot);
                  VFOenvelope03.attack(vfo_attack_pot);
                  VFOenvelope02.attack(vfo_attack_pot);
                  VFOenvelope01.attack(vfo_attack_pot);
               }
            }
            break;

            case MUX_IN_ENV_HOLD_POT:  // C02:C01 - envelope hold pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_hold_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_hold_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_hold_pot != previous_vfo_hold_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Envelope Hold Pot         :");
                  Serial.println(vfo_hold_pot);
#endif
                  previous_vfo_hold_pot = vfo_hold_pot;

                  VFOenvelope16.hold(vfo_hold_pot);
                  VFOenvelope15.hold(vfo_hold_pot);
                  VFOenvelope14.hold(vfo_hold_pot);
                  VFOenvelope13.hold(vfo_hold_pot);
                  VFOenvelope12.hold(vfo_hold_pot);
                  VFOenvelope11.hold(vfo_hold_pot);
                  VFOenvelope10.hold(vfo_hold_pot);
                  VFOenvelope09.hold(vfo_hold_pot);
                  VFOenvelope08.hold(vfo_hold_pot);
                  VFOenvelope07.hold(vfo_hold_pot);
                  VFOenvelope06.hold(vfo_hold_pot);
                  VFOenvelope05.hold(vfo_hold_pot);
                  VFOenvelope04.hold(vfo_hold_pot);
                  VFOenvelope03.hold(vfo_hold_pot);
                  VFOenvelope02.hold(vfo_hold_pot);
                  VFOenvelope01.hold(vfo_hold_pot);
               }
            }
            break;

            case MUX_IN_ENV_DECAY_POT:  // C02:C02 - envelope decay pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_decay_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_decay_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_decay_pot != previous_vfo_decay_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Envelope Decay Pot        :");
                  Serial.println(vfo_decay_pot);
#endif
                  previous_vfo_decay_pot = vfo_decay_pot;

                  VFOenvelope16.decay((float)vfo_decay_pot * 3);
                  VFOenvelope15.decay((float)vfo_decay_pot * 3);
                  VFOenvelope14.decay((float)vfo_decay_pot * 3);
                  VFOenvelope13.decay((float)vfo_decay_pot * 3);
                  VFOenvelope12.decay((float)vfo_decay_pot * 3);
                  VFOenvelope11.decay((float)vfo_decay_pot * 3);
                  VFOenvelope10.decay((float)vfo_decay_pot * 3);
                  VFOenvelope09.decay((float)vfo_decay_pot * 3);
                  VFOenvelope08.decay((float)vfo_decay_pot * 3);
                  VFOenvelope07.decay((float)vfo_decay_pot * 3);
                  VFOenvelope06.decay((float)vfo_decay_pot * 3);
                  VFOenvelope05.decay((float)vfo_decay_pot * 3);
                  VFOenvelope04.decay((float)vfo_decay_pot * 3);
                  VFOenvelope03.decay((float)vfo_decay_pot * 3);
                  VFOenvelope02.decay((float)vfo_decay_pot * 3);
                  VFOenvelope01.decay((float)vfo_decay_pot * 3);
               }
            }
            break;

            case MUX_IN_ENV_SUSTAIN_POT:  // C02:C03 - envelope sustain pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_sustain_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_sustain_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_sustain_pot != previous_vfo_sustain_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Envelope Sustain Pot      :");
                  Serial.println(vfo_sustain_pot);
#endif
                  previous_vfo_sustain_pot = vfo_sustain_pot;

                  VFOenvelope16.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope15.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope14.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope13.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope12.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope11.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope10.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope09.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope08.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope07.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope06.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope05.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope04.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope03.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope02.sustain((float)vfo_sustain_pot / 1023.0);
                  VFOenvelope01.sustain((float)vfo_sustain_pot / 1023.0);
               }
            }
            break;

            case MUX_IN_ENV_RELEASE_POT:  // C02:C04 - envelope release pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_release_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_release_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_release_pot != previous_vfo_release_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Envelope Release Pot      :");
                  Serial.println(vfo_release_pot);
#endif
                  previous_vfo_release_pot = vfo_release_pot;

                  VFOenvelope16.release((float)vfo_release_pot);
                  VFOenvelope15.release((float)vfo_release_pot);
                  VFOenvelope14.release((float)vfo_release_pot);
                  VFOenvelope13.release((float)vfo_release_pot);
                  VFOenvelope12.release((float)vfo_release_pot);
                  VFOenvelope11.release((float)vfo_release_pot);
                  VFOenvelope10.release((float)vfo_release_pot);
                  VFOenvelope09.release((float)vfo_release_pot);
                  VFOenvelope08.release((float)vfo_release_pot);
                  VFOenvelope07.release((float)vfo_release_pot);
                  VFOenvelope06.release((float)vfo_release_pot);
                  VFOenvelope05.release((float)vfo_release_pot);
                  VFOenvelope04.release((float)vfo_release_pot);
                  VFOenvelope03.release((float)vfo_release_pot);
                  VFOenvelope02.release((float)vfo_release_pot);
                  VFOenvelope01.release((float)vfo_release_pot);
               }
            }
            break;

            case MUX_IN_LFO_FILT_FREQ_POT:  // C02:C05 - LFO filter frequency pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_frequency_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_frequency_pot) / 2;
#endif
               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_frequency_pot != previous_lfo_filt_frequency_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Freq Pot       :");
                  Serial.println(lfo_filt_frequency_pot);
#endif
                  previous_lfo_filt_frequency_pot = lfo_filt_frequency_pot;

                  LFOsineFilter.frequency(((float)lfo_filt_frequency_pot * 30.0) / 1023.0);
                  LFOsquareFilter.frequency(((float)lfo_filt_frequency_pot * 30.0) / 1023.0);
                  LFOpulseFilter.frequency(((float)lfo_filt_frequency_pot * 30.0) / 1023.0);
                  LFOtriangleFilter.frequency(((float)lfo_filt_frequency_pot * 30.0) / 1023.0);
                  LFOsawFilter.frequency(((float)lfo_filt_frequency_pot * 30.0) / 1023.0);
                  LFOsampleholdFilter.frequency(((float)lfo_filt_frequency_pot * 30.0) / 1023.0);
               }
            }
            break;

            case MUX_IN_LFO_FILT_DC_OFFSET_POT:  // C02:C06 - LFO filter DC offset pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_dc_offset_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_dc_offset_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_dc_offset_pot != previous_lfo_filt_dc_offset_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter DC Offset Pot  :");
                  Serial.println(lfo_filt_dc_offset_pot);
#endif
                  previous_lfo_filt_dc_offset_pot = lfo_filt_dc_offset_pot;

                  LFOsineFilter.offset((float)(lfo_filt_dc_offset_pot - 511) / 512.0);
                  LFOsquareFilter.offset((float)(lfo_filt_dc_offset_pot - 511) / 512.0);
                  LFOpulseFilter.offset((float)(lfo_filt_dc_offset_pot - 511) / 512.0);
                  LFOtriangleFilter.offset((float)(lfo_filt_dc_offset_pot - 511) / 512.0);
                  LFOsawFilter.offset((float)(lfo_filt_dc_offset_pot - 511) / 512.0);
                  LFOsampleholdFilter.offset((float)(lfo_filt_dc_offset_pot - 511) / 512.0);
               }
            }
            break;

            case MUX_IN_LFO_FILT_SINE_POT:  // C02:C07 - LFO filter sine pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_sine_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_sine_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_sine_pot != previous_lfo_filt_sine_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Sine Pot       :");
                  Serial.println(lfo_filt_sine_pot);
#endif
                  previous_lfo_filt_sine_pot = lfo_filt_sine_pot;

                  if ((lfo_filt_active_state == true) && (lfo_filt_sine_state == true))
                  {
                     LFOfilterMix1_1.gain(0, ((float)(lfo_filt_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                  } else {
                     LFOfilterMix1_1.gain(0, 0.0);
                  }
               }
            }
            break;

            case MUX_IN_LFO_FILT_SQUARE_POT:  // C02:C08 - LFO filter square pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_square_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_square_pot) / 2;
#endif
               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_square_pot != previous_lfo_filt_square_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Square Pot     :");
                  Serial.println(lfo_filt_square_pot);
#endif
                  previous_lfo_filt_square_pot = lfo_filt_square_pot;

                  if ((lfo_filt_active_state == true) && (lfo_filt_square_state == true))
                  {
                     LFOfilterMix1_1.gain(1, ((float)(lfo_filt_square_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                  } else {
                     LFOfilterMix1_1.gain(1, 0.0);
                  }
               }
            }
            break;

            case MUX_IN_LFO_FILT_PULSE_POT:  // C02:C09 - LFO filter pulse pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_pulse_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_pulse_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_pulse_pot != previous_lfo_filt_pulse_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Pulse Pot      :");
                  Serial.println(lfo_filt_pulse_pot);
#endif
                  previous_lfo_filt_pulse_pot = lfo_filt_pulse_pot;

                  if ((lfo_filt_active_state == true) && (lfo_filt_pulse_state == true))
                  {
                     LFOfilterMix1_1.gain(2, ((float)(lfo_filt_pulse_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                  } else {
                     LFOfilterMix1_1.gain(2, 0.0);
                  }
               }
            }
            break;

            case MUX_IN_LFO_FILT_PULSE_DUTY_POT:  // C02:C10 - LFO filter pulse duty cycle pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_pulse_duty_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_pulse_duty_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_pulse_duty_pot != previous_lfo_filt_pulse_duty_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Pulse Duty Pot :");
                  Serial.println(lfo_filt_pulse_duty_pot);
#endif
                  previous_lfo_filt_pulse_duty_pot = lfo_filt_pulse_duty_pot;

                  if (lfo_filt_pulse_duty_state == true)
                  {
                     // scale to -0.9 to +0.9 range
                     LFOpulseFilterDutyCycle.amplitude((float)(lfo_filt_pulse_duty_pot - 511) / 569.0);
                  } else {
                     LFOpulseFilterDutyCycle.amplitude(-0.9);
                  }
               }
            }
            break;

            case MUX_IN_LFO_FILT_TRIANGLE_POT:  // C02:C11 - LFO filter triangle pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_triangle_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_triangle_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_triangle_pot != previous_lfo_filt_triangle_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Triangle Pot   :");
                  Serial.println(lfo_filt_triangle_pot);
#endif
                  previous_lfo_filt_triangle_pot = lfo_filt_triangle_pot;

                  if ((lfo_filt_active_state == true) && (lfo_filt_triangle_state == true))
                  {
                     LFOfilterMix1_1.gain(3, ((float)(lfo_filt_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                  } else {
                     LFOfilterMix1_1.gain(3, 0.0);
                  }
               }
            }
            break;

            case MUX_IN_LFO_FILT_SAW_POT:  // C02:C12 - LFO filter sawtooth pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_saw_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_saw_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_saw_pot != previous_lfo_filt_saw_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter Saw Pot        :");
                  Serial.println(lfo_filt_saw_pot);
#endif
                  previous_lfo_filt_saw_pot = lfo_filt_saw_pot;

                  if ((lfo_filt_active_state == true) && (lfo_filt_saw_state == true))
                  {
                     LFOfilterMix1_2.gain(0, ((float)(lfo_filt_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                  } else {
                     LFOfilterMix1_2.gain(0, 0.0);
                  }
               }
            }
            break;

            case MUX_IN_LFO_FILT_SAMPHOLD_POT:  // C02:C13 - LFO filter sample/hold pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               lfo_filt_samphold_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_lfo_filt_samphold_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (lfo_filt_samphold_pot != previous_lfo_filt_samphold_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LFO Filter SampHold Pot   :");
                  Serial.println(lfo_filt_samphold_pot);
#endif
                  previous_lfo_filt_samphold_pot = lfo_filt_samphold_pot;

                  if ((lfo_filt_active_state == true) && (lfo_filt_samphold_state == true))
                  {
                     LFOfilterMix1_2.gain(1, ((float)(lfo_filt_samphold_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                  } else {
                     LFOfilterMix1_2.gain(1, 0.0);
                  }
               }
            }
            break;

            case MUX_IN_FILT_CORNER_POT:  // C02:C14 - filter corner frequency pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_corner_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_corner_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_corner_pot != previous_vfo_corner_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Filter Corner Freq Pot    :");
                  Serial.println(vfo_corner_pot);
#endif
                  previous_vfo_corner_pot = vfo_corner_pot;

                  VFOfilter16.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter15.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter14.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter13.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter12.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter11.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter10.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter09.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter08.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter07.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter06.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter05.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter04.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter03.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter02.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
                  VFOfilter01.frequency(((float)vfo_corner_pot * 15000.0) / 1023.0);
               }
            }
            break;

            case MUX_IN_FILT_RESONANCE_POT:  // C02:C15 - filter resonance pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits for this pot
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               vfo_resonance_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_vfo_resonance_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (vfo_resonance_pot != previous_vfo_resonance_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("Filter Resonance Pot      :");
                  Serial.println(vfo_resonance_pot);
#endif
                  previous_vfo_resonance_pot = vfo_resonance_pot;

                  VFOfilter16.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter15.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter14.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter13.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter12.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter11.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter10.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter09.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter08.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter07.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter06.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter05.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter04.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter03.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter02.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
                  VFOfilter01.resonance(((float)vfo_resonance_pot) / 340.0 + 1.7);
               }
            }
            break;

            case MUX_IN_LED_INTENSITY_POT:  // C14:xxx (directly from master MUX) - LED intensity pot
            {
               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // the secondary MUX is not used - this pot is read directly from the master MUX

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

#ifndef DISABLE_POT_READ
               // now read the pot thru the MUX
               led_intensity_pot = (analogRead(PRIMARY_MUX_INPUT_OUTPUT_PIN) + previous_led_intensity_pot) / 2;
#endif

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

               if (led_intensity_pot != previous_led_intensity_pot)
               {
#ifdef DEBUG_POTS
                  Serial.print("LED Intensity Pot         :");
                  Serial.println(led_intensity_pot);
#endif
                  previous_led_intensity_pot = led_intensity_pot;

                  led_intensity = (int)(led_intensity_pot / 16); // 0..63

                  if (previous_led_intensity != led_intensity)
                  {
                     analogWrite(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, (255 - led_intensity));

                     previous_led_intensity = led_intensity;
                  }
               }
            }
            break;
         }

         if (++mux_input_pot_index >= MUX_IN_POT_MAX)
         {
            mux_input_pot_index = MUX_IN_MASTER_VOLUME_POT;
         }
      }
      break;

      case MUX_READ_PB:
      {
         // PB debounce algorithm:
         //    setup a counter variable, initialize to MAX
         //
         //    sample the PB each pass thru the loop:
         //
         //       if PB signal == HIGH then
         //          counter varaible = MAX
         //       else
         //          if counter variable > 0 then
         //             decrement counter variable
         //
         //             if counter == 0 then
         //                *** execute desired function when PB is pressed
         //             end if
         //          end if
         //       end if

         // setup the input pin with an internal pull-up for reading PBs
         pinMode(PRIMARY_MUX_INPUT_OUTPUT_PIN, INPUT_PULLUP);

         switch(mux_input_pb_index)
         {
            case MUX_IN_MIDI_PANIC_PB:  // C03:C00 - MIDI panic PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_midi_panic_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_midi_panic_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_midi_panic_pb == 0)
                     {
#ifdef DEBUG_PBUTTONS
                        Serial.print("MIDI Panic PB pressed");
#endif
                        Serial.println("MIDI Panic PB is calling kill_all_notes()");

                        kill_all_notes();

                        AudioProcessorUsageMaxReset();

                        dump_settings();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_ACTIVE_PB:  // C03:C01 - LFO moodulation active PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_active_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_active_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_active_pb == 0)
                     {
                        lfo_mod_active_state = !lfo_mod_active_state;
                        save_needed = true;

                        // if the LFOmod active setting changed to "off", then disable all LFOmod waveforms thru their respective mixer channels
                        if (lfo_mod_active_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod ENABLED");
#endif
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_SINGLE_PB:  // C03:C02 - LFO modulation single PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_single_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_single_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_single_pb == 0)
                     {
                        lfo_mod_single_state = !lfo_mod_single_state;
                        save_needed = true;

                        // if the LFOmod single setting changed to "on"
                        if (lfo_mod_single_state == true)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Single ENABLED");
#endif
                           int enabled_waveform_count = 0;
         
                           if (lfo_mod_sine_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_mod_square_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_mod_pulse_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_mod_triangle_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_mod_saw_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_mod_samphold_state == true)
                           {
                              enabled_waveform_count++;
                           }

                           // if more than one LFOmod waveform is enabled, then disable all of them except sine thru their respective mixer channels (since it's indeterminate which specific waveform is wanted)
                           if (enabled_waveform_count > 1)
                           {
                              lfo_mod_sine_state = true;
                              lfo_mod_square_state = false;
                              lfo_mod_pulse_state = false;
                              lfo_mod_triangle_state = false;
                              lfo_mod_saw_state = false;
                              lfo_mod_samphold_state = false;
                           }
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Single DISABLED");
#endif
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_SINE_PB:  // C03:C03 - LFO moodulation sine PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_sine_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_sine_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_sine_pb == 0)
                     {
                        lfo_mod_sine_state = !lfo_mod_sine_state;
                        save_needed = true;

                        if (lfo_mod_sine_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Sine DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Sine ENABLED");
#endif

                           if (lfo_mod_single_state == true)
                           {
                              lfo_mod_square_state = false;
                              lfo_mod_pulse_state = false;
                              lfo_mod_triangle_state = false;
                              lfo_mod_saw_state = false;
                              lfo_mod_samphold_state = false;
                           }
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_SQUARE_PB:  // C03:C04 - LFO modulation square PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_square_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_square_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_square_pb == 0)
                     {
                        lfo_mod_square_state = !lfo_mod_square_state;
                        save_needed = true;

                        if (lfo_mod_square_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Square DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Square ENABLED");
#endif

                           if (lfo_mod_single_state == true)
                           {
                              lfo_mod_sine_state = false;
                              lfo_mod_pulse_state = false;
                              lfo_mod_triangle_state = false;
                              lfo_mod_saw_state = false;
                              lfo_mod_samphold_state = false;
                           }
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_PULSE_PB:  // C03:C05 - LFO modulation pulse PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_pulse_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_pulse_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_pulse_pb == 0)
                     {
                        lfo_mod_pulse_state = !lfo_mod_pulse_state;
                        save_needed = true;

                        if (lfo_mod_pulse_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Pulse DISABLED");
#endif

                           lfo_mod_pulse_duty_state = false;
                           LFOpulseModDutyCycle.amplitude(-0.9);
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Pulse Duty Cycle DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Pulse ENABLED");
#endif

                           if (lfo_mod_single_state == true)
                           {
                              lfo_mod_sine_state = false;
                              lfo_mod_square_state = false;
                              lfo_mod_triangle_state = false;
                              lfo_mod_saw_state = false;
                              lfo_mod_samphold_state = false;
                           }
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_PULSE_DUTY_PB:  // C03:C06 - LFO modulation pulse duty cycle PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_pulse_duty_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_pulse_duty_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_pulse_duty_pb == 0)
                     {
                        // only allow mod pulse duty cycle to be turned on if mod pulse is on
                        if (lfo_mod_pulse_state == true)
                        {
                           lfo_mod_pulse_duty_state = !lfo_mod_pulse_duty_state;
                           save_needed = true;

                           if (lfo_mod_pulse_duty_state == false)
                           {
#ifdef DEBUG_PBUTTONS
                              Serial.println("LFO Mod Pulse Duty Cycle DISABLED");
#endif

                              LFOpulseModDutyCycle.amplitude(-0.9);
                           } else {
#ifdef DEBUG_PBUTTONS
                              Serial.println("LFO Mod Pulse Duty Cycle ENABLED");
#endif

                              // scale to -0.9 to +0.9 range
                              LFOpulseModDutyCycle.amplitude((float)(lfo_mod_pulse_duty_pot - 511) / 569.0);
                           }
                        }
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_TRIANGLE_PB:  // C03:C07 - LFO modulation triangle PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_triangle_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_triangle_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_triangle_pb == 0)
                     {
                        lfo_mod_triangle_state = !lfo_mod_triangle_state;
                        save_needed = true;

                        if (lfo_mod_triangle_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Triangle DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Triangle ENABLED");
#endif

                           if (lfo_mod_single_state == true)
                           {
                              lfo_mod_sine_state = false;
                              lfo_mod_square_state = false;
                              lfo_mod_pulse_state = false;
                              lfo_mod_saw_state = false;
                              lfo_mod_samphold_state = false;
                           }
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_SAW_PB:  // C03:C08 - LFO modulation sawtooth PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_saw_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_saw_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_saw_pb == 0)
                     {
                        lfo_mod_saw_state = !lfo_mod_saw_state;
                        save_needed = true;

                        if (lfo_mod_saw_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Saw DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Saw ENABLED");
#endif

                           if (lfo_mod_single_state == true)
                           {
                              lfo_mod_sine_state = false;
                              lfo_mod_square_state = false;
                              lfo_mod_pulse_state = false;
                              lfo_mod_triangle_state = false;
                              lfo_mod_samphold_state = false;
                           }
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_MOD_SAMPHOLD_PB:  // C03:C09 - LFO modulation sample/hold PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_mod_samphold_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_mod_samphold_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_mod_samphold_pb == 0)
                     {
                        lfo_mod_samphold_state = !lfo_mod_samphold_state;
                        save_needed = true;

                        if (lfo_mod_samphold_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod SampHold DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod SampHold ENABLED");
#endif

                           if (lfo_mod_single_state == true)
                           {
                              lfo_mod_sine_state = false;
                              lfo_mod_square_state = false;
                              lfo_mod_pulse_state = false;
                              lfo_mod_triangle_state = false;
                              lfo_mod_saw_state = false;
                           }
                        }

                        set_lfo_mod_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_SINGLE_PB:  // C03:C10 - VFO A single PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_single_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_single_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_single_pb == 0)
                     {
                        vfoA_single_state = !vfoA_single_state;
                        save_needed = true;

                        // if the vfoA single setting changed to "on"
                        if (vfoA_single_state == true)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Single ENABLED");
#endif
                           int enabled_waveform_count = 0;

                           if (vfoA_sine_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_square_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_triangle_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_saw_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_string_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_white_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_pink_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_sweep_state == true)
                           {
                              enabled_waveform_count++;
                           }

                           // if more than one vfoA waveform is enabled, then disable all of them excpet sine thru their respective mixer channels (since it's indeterminate which specific waveform is wanted)
                           if (enabled_waveform_count > 1)
                           {
                              vfoA_sine_state = true;
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Single DISABLED");
#endif
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_SINE_PB:  // C03:C11 - VFO A sine PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_sine_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_sine_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_sine_pb == 0)
                     {
                        vfoA_sine_state = !vfoA_sine_state;
                        save_needed = true;

                        if (vfoA_sine_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Sine DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Sine ENABLED");
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_SQUARE_PB:  // C03:C12 - VFO A square PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_square_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_square_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_square_pb == 0)
                     {
                        vfoA_square_state = !vfoA_square_state;
                        save_needed = true;

                        if (vfoA_square_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Square DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Square ENABLED");
#endif
                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_TRIANGLE_PB:  // C03:C13 - VFO A triangle PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_triangle_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_triangle_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_triangle_pb == 0)
                     {
                        vfoA_triangle_state = !vfoA_triangle_state;
                        save_needed = true;

                        if (vfoA_triangle_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Triangle DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Triangle ENABLED");
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_square_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_SAW_PB:  // C03:C14 - VFO A sawtooth PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_saw_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_saw_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_saw_pb == 0)
                     {
                        vfoA_saw_state = !vfoA_saw_state;
                        save_needed = true;

                        if (vfoA_saw_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Saw DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Saw ENABLED");
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_STRING_PB:  // C03:C13 - VFO A string PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_string_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_string_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_string_pb == 0)
                     {
                        vfoA_string_state = !vfoA_string_state;
                        save_needed = true;

                        if (vfoA_string_state == false)
                        {
                           // if both of the strings are disabled, then force the tuning pot to be re-read
                           previous_vfo_tuning_pot = -1;

#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A String DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A String ENABLED");
#endif

                           // if either of the strings are enabled, then disable the tuning pot (since the strings cannot currently be tuned - no modulation input)
                           //    & force the defaulted/disabled tuning to get set
                           previous_vfo_tuning_pot = -1;

#ifdef DEBUG_POTS
                           Serial.print("VFO Tuning Pot          :");
                           Serial.println(vfo_tuning_pot);
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_WHITE_PB:  // C04:C00 - VFO A white noise PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_white_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_white_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_white_pb == 0)
                     {
                        vfoA_white_state = !vfoA_white_state;
                        save_needed = true;

                        if (vfoA_white_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A White Noise DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A White Noise ENABLED");
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_PINK_PB:  // C04:C01 - VFO A pink noise PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_pink_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_pink_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_pink_pb == 0)
                     {
                        vfoA_pink_state = !vfoA_pink_state;
                        save_needed = true;

                        if (vfoA_pink_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Pink Noise DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Pink Noise ENABLED");
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOA_SWEEP_PB:  // C04:C02 - VFO A sweep PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoA_sweep_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoA_sweep_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoA_sweep_pb == 0)
                     {
                        vfoA_sweep_state = !vfoA_sweep_state;
                        save_needed = true;

                        if (vfoA_sweep_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Sweep DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO A Sweep ENABLED");
#endif

                           if (vfoA_single_state == true)
                           {
                              vfoA_sine_state = false;
                              vfoA_square_state = false;
                              vfoA_triangle_state = false;
                              vfoA_saw_state = false;
                              vfoA_string_state = false;
                              vfoA_white_state = false;
                              vfoA_pink_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_SINGLE_PB:  // C04:C03 - VFO B single PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_single_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_single_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_single_pb == 0)
                     {
                        vfoB_single_state = !vfoB_single_state;
                        save_needed = true;

                        // if the vfoB single setting changed to "on"
                        if (vfoB_single_state == true)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Single ENABLED");
#endif
                           int enabled_waveform_count = 0;

                           if (vfoB_sine_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoB_square_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoB_triangle_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoB_saw_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoB_string_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoB_white_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoB_pink_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (vfoA_sweep_state == true)
                           {
                              enabled_waveform_count++;
                           }

                           // if more than one vfoB waveform is enabled, then disable all of them except sine thru their respective mixer channels (since it's indeterminate which specific waveform is wanted)
                           if (enabled_waveform_count > 1)
                           {
                              vfoB_sine_state = true;
                              vfoB_square_state = false;
                              vfoB_triangle_state = false;
                              vfoB_saw_state = false;
                              vfoB_string_state = false;
                              vfoB_white_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Single DISABLED");
#endif
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_SINE_PB:  // C04:C04 - VFO B sine PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_sine_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_sine_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_sine_pb == 0)
                     {
                        vfoB_sine_state = !vfoB_sine_state;
                        save_needed = true;

                        if (vfoB_sine_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Sine DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Sine ENABLED");
#endif

                           if (vfoB_single_state == true)
                           {
                              vfoB_square_state = false;
                              vfoB_triangle_state = false;
                              vfoB_saw_state = false;
                              vfoB_string_state = false;
                              vfoB_white_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_SQUARE_PB:  // C04:C05 - VFO B square PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_square_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_square_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_square_pb == 0)
                     {
                        vfoB_square_state = !vfoB_square_state;
                        save_needed = true;

                        if (vfoB_square_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Square DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Square ENABLED");
#endif

                           if (vfoB_single_state == true)
                           {
                              vfoB_sine_state = false;
                              vfoB_triangle_state = false;
                              vfoB_saw_state = false;
                              vfoB_string_state = false;
                              vfoB_white_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_TRIANGLE_PB:  // C04:C06 - VFO B triangle PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_triangle_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_triangle_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_triangle_pb == 0)
                     {
                        vfoB_triangle_state = !vfoB_triangle_state;
                        save_needed = true;

                        if (vfoB_triangle_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Triangle DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Triangle ENABLED");
#endif

                           if (vfoB_single_state == true)
                           {
                              vfoB_sine_state = false;
                              vfoB_square_state = false;
                              vfoB_saw_state = false;
                              vfoB_string_state = false;
                              vfoB_white_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_SAW_PB:  // C04:C07 - VFO B sawtooth PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_saw_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_saw_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_saw_pb == 0)
                     {
                        vfoB_saw_state = !vfoB_saw_state;
                        save_needed = true;

                        if (vfoB_saw_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Saw DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Saw ENABLED");
#endif

                           if (vfoB_single_state == true)
                           {
                              vfoB_sine_state = false;
                              vfoB_square_state = false;
                              vfoB_triangle_state = false;
                              vfoB_string_state = false;
                              vfoB_white_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_STRING_PB:  // C04:C08 - VFO B string PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_string_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_string_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_string_pb == 0)
                     {
                        vfoB_string_state = !vfoB_string_state;
                        save_needed = true;

                        if (vfoB_string_state == false)
                        {
                           // if both of the strings are disabled, then force the tuning pot to be re-read
                           previous_vfo_tuning_pot = -1;

#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B String DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B String ENABLED");
#endif

                           // if either of the strings are enabled, then disable the tuning pot (since the strings cannot currently be tuned - no modulation input)
                           //    & force the defaulted/disabled tuning to get set
                           previous_vfo_tuning_pot = -1;

                           if (vfoB_single_state == true)
                           {
                              vfoB_sine_state = false;
                              vfoB_square_state = false;
                              vfoB_triangle_state = false;
                              vfoB_saw_state = false;
                              vfoB_white_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_WHITE_PB:  // C04:C09 - VFO B white noise PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_white_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_white_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_white_pb == 0)
                     {
                        vfoB_white_state = !vfoB_white_state;
                        save_needed = true;

                        if (vfoB_white_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B White Noise DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B White Noise ENABLED");
#endif

                           if (vfoB_single_state == true)
                           {
                              vfoB_sine_state = false;
                              vfoB_square_state = false;
                              vfoB_triangle_state = false;
                              vfoB_saw_state = false;
                              vfoB_string_state = false;
                              vfoB_pink_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_PINK_PB:  // C04:C10 - VFO B pink noise PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_pink_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_pink_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_pink_pb == 0)
                     {
                        vfoB_pink_state = !vfoB_pink_state;
                        save_needed = true;

                        if (vfoB_pink_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Pink Noise DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Pink Noise ENABLED");
#endif

                           if (vfoB_single_state == true)
                           {
                              vfoB_sine_state = false;
                              vfoB_square_state = false;
                              vfoB_triangle_state = false;
                              vfoB_saw_state = false;
                              vfoB_string_state = false;
                              vfoB_white_state = false;
                              vfoA_sweep_state = false;
                           }
                        }

                        set_vfo_wave_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_VFOB_GLIDE_PB:  // C04:C11 - VFO B glide PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_vfoB_glide_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_vfoB_glide_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_vfoB_glide_pb == 0)
                     {
                        vfoB_glide_state = !vfoB_glide_state;
                        save_needed = true;

                        if (vfoB_glide_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Glide DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("VFO B Glide ENABLED");
#endif
                        }
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_ENVELOPE_ACTIVE_PB:  // C04:C12 - VFO B envelope active PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_env_active_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_env_active_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_env_active_pb == 0)
                     {
                        env_active_state = !env_active_state;
                        save_needed = true;

                        if (env_active_state == true)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Envelope ENABLED");
#endif

                           VFOenvelopeMix16.gain(0, 0.0);
                           VFOenvelopeMix16.gain(1, 1.0);
                           VFOenvelopeMix16.gain(2, 0.0);
                           VFOenvelopeMix16.gain(3, 0.0);

                           VFOenvelopeMix15.gain(0, 0.0);
                           VFOenvelopeMix15.gain(1, 1.0);
                           VFOenvelopeMix15.gain(2, 0.0);
                           VFOenvelopeMix15.gain(3, 0.0);

                           VFOenvelopeMix14.gain(0, 0.0);
                           VFOenvelopeMix14.gain(1, 1.0);
                           VFOenvelopeMix14.gain(2, 0.0);
                           VFOenvelopeMix14.gain(3, 0.0);

                           VFOenvelopeMix13.gain(0, 0.0);
                           VFOenvelopeMix13.gain(1, 1.0);
                           VFOenvelopeMix13.gain(2, 0.0);
                           VFOenvelopeMix13.gain(3, 0.0);

                           VFOenvelopeMix12.gain(0, 0.0);
                           VFOenvelopeMix12.gain(1, 1.0);
                           VFOenvelopeMix12.gain(2, 0.0);
                           VFOenvelopeMix12.gain(3, 0.0);

                           VFOenvelopeMix11.gain(0, 0.0);
                           VFOenvelopeMix11.gain(1, 1.0);
                           VFOenvelopeMix11.gain(2, 0.0);
                           VFOenvelopeMix11.gain(3, 0.0);

                           VFOenvelopeMix10.gain(0, 0.0);
                           VFOenvelopeMix10.gain(1, 1.0);
                           VFOenvelopeMix10.gain(2, 0.0);
                           VFOenvelopeMix10.gain(3, 0.0);

                           VFOenvelopeMix09.gain(0, 0.0);
                           VFOenvelopeMix09.gain(1, 1.0);
                           VFOenvelopeMix09.gain(2, 0.0);
                           VFOenvelopeMix09.gain(3, 0.0);

                           VFOenvelopeMix08.gain(0, 0.0);
                           VFOenvelopeMix08.gain(1, 1.0);
                           VFOenvelopeMix08.gain(2, 0.0);
                           VFOenvelopeMix08.gain(3, 0.0);

                           VFOenvelopeMix07.gain(0, 0.0);
                           VFOenvelopeMix07.gain(1, 1.0);
                           VFOenvelopeMix07.gain(2, 0.0);
                           VFOenvelopeMix07.gain(3, 0.0);

                           VFOenvelopeMix06.gain(0, 0.0);
                           VFOenvelopeMix06.gain(1, 1.0);
                           VFOenvelopeMix06.gain(2, 0.0);
                           VFOenvelopeMix06.gain(3, 0.0);

                           VFOenvelopeMix05.gain(0, 0.0);
                           VFOenvelopeMix05.gain(1, 1.0);
                           VFOenvelopeMix05.gain(2, 0.0);
                           VFOenvelopeMix05.gain(3, 0.0);

                           VFOenvelopeMix04.gain(0, 0.0);
                           VFOenvelopeMix04.gain(1, 1.0);
                           VFOenvelopeMix04.gain(2, 0.0);
                           VFOenvelopeMix04.gain(3, 0.0);

                           VFOenvelopeMix03.gain(0, 0.0);
                           VFOenvelopeMix03.gain(1, 1.0);
                           VFOenvelopeMix03.gain(2, 0.0);
                           VFOenvelopeMix03.gain(3, 0.0);

                           VFOenvelopeMix02.gain(0, 0.0);
                           VFOenvelopeMix02.gain(1, 1.0);
                           VFOenvelopeMix02.gain(2, 0.0);
                           VFOenvelopeMix02.gain(3, 0.0);

                           VFOenvelopeMix01.gain(0, 0.0);
                           VFOenvelopeMix01.gain(1, 1.0);
                           VFOenvelopeMix01.gain(2, 0.0);
                           VFOenvelopeMix01.gain(3, 0.0);
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Envelope DISABLED");
#endif

                           VFOenvelopeMix16.gain(0, 1.0);
                           VFOenvelopeMix16.gain(1, 0.0);
                           VFOenvelopeMix16.gain(2, 0.0);
                           VFOenvelopeMix16.gain(3, 0.0);

                           VFOenvelopeMix15.gain(0, 1.0);
                           VFOenvelopeMix15.gain(1, 0.0);
                           VFOenvelopeMix15.gain(2, 0.0);
                           VFOenvelopeMix15.gain(3, 0.0);

                           VFOenvelopeMix14.gain(0, 1.0);
                           VFOenvelopeMix14.gain(1, 0.0);
                           VFOenvelopeMix14.gain(2, 0.0);
                           VFOenvelopeMix14.gain(3, 0.0);

                           VFOenvelopeMix13.gain(0, 1.0);
                           VFOenvelopeMix13.gain(1, 0.0);
                           VFOenvelopeMix13.gain(2, 0.0);
                           VFOenvelopeMix13.gain(3, 0.0);

                           VFOenvelopeMix12.gain(0, 1.0);
                           VFOenvelopeMix12.gain(1, 0.0);
                           VFOenvelopeMix12.gain(2, 0.0);
                           VFOenvelopeMix12.gain(3, 0.0);

                           VFOenvelopeMix11.gain(0, 1.0);
                           VFOenvelopeMix11.gain(1, 0.0);
                           VFOenvelopeMix11.gain(2, 0.0);
                           VFOenvelopeMix11.gain(3, 0.0);

                           VFOenvelopeMix10.gain(0, 1.0);
                           VFOenvelopeMix10.gain(1, 0.0);
                           VFOenvelopeMix10.gain(2, 0.0);
                           VFOenvelopeMix10.gain(3, 0.0);

                           VFOenvelopeMix09.gain(0, 1.0);
                           VFOenvelopeMix09.gain(1, 0.0);
                           VFOenvelopeMix09.gain(2, 0.0);
                           VFOenvelopeMix09.gain(3, 0.0);

                           VFOenvelopeMix08.gain(0, 1.0);
                           VFOenvelopeMix08.gain(1, 0.0);
                           VFOenvelopeMix08.gain(2, 0.0);
                           VFOenvelopeMix08.gain(3, 0.0);

                           VFOenvelopeMix07.gain(0, 1.0);
                           VFOenvelopeMix07.gain(1, 0.0);
                           VFOenvelopeMix07.gain(2, 0.0);
                           VFOenvelopeMix07.gain(3, 0.0);

                           VFOenvelopeMix06.gain(0, 1.0);
                           VFOenvelopeMix06.gain(1, 0.0);
                           VFOenvelopeMix06.gain(2, 0.0);
                           VFOenvelopeMix06.gain(3, 0.0);

                           VFOenvelopeMix05.gain(0, 1.0);
                           VFOenvelopeMix05.gain(1, 0.0);
                           VFOenvelopeMix05.gain(2, 0.0);
                           VFOenvelopeMix05.gain(3, 0.0);

                           VFOenvelopeMix04.gain(0, 1.0);
                           VFOenvelopeMix04.gain(1, 0.0);
                           VFOenvelopeMix04.gain(2, 0.0);
                           VFOenvelopeMix04.gain(3, 0.0);

                           VFOenvelopeMix03.gain(0, 1.0);
                           VFOenvelopeMix03.gain(1, 0.0);
                           VFOenvelopeMix03.gain(2, 0.0);
                           VFOenvelopeMix03.gain(3, 0.0);

                           VFOenvelopeMix02.gain(0, 1.0);
                           VFOenvelopeMix02.gain(1, 0.0);
                           VFOenvelopeMix02.gain(2, 0.0);
                           VFOenvelopeMix02.gain(3, 0.0);

                           VFOenvelopeMix01.gain(0, 1.0);
                           VFOenvelopeMix01.gain(1, 0.0);
                           VFOenvelopeMix01.gain(2, 0.0);
                           VFOenvelopeMix01.gain(3, 0.0);

                           if (poly_notes[15].note_state == false)
                           {
                              VFOsine16A.amplitude(0);
                              VFOsquare16A.amplitude(0);
                              VFOtriangle16A.amplitude(0);
                              VFOsaw16A.amplitude(0);
                              VFOstring16A.noteOff(0);
                              VFOwhite16A.amplitude(0);
                              VFOpink16A.amplitude(0);
                              VFOsweep16A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine16B.amplitude(0);
                              VFOsquare16B.amplitude(0);
                              VFOtriangle16B.amplitude(0);
                              VFOsaw16B.amplitude(0);
                              VFOstring16B.noteOff(0);
                              VFOwhite16B.amplitude(0);
                              VFOpink16B.amplitude(0);
                              VFOsweep16B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 15");
#endif
                              // make this note entry available for (re)use
                              poly_notes[15].channel = 0;
                              poly_notes[15].base_pitch = 0;
                           }

                           if (poly_notes[14].note_state == false)
                           {
                              VFOsine15A.amplitude(0);
                              VFOsquare15A.amplitude(0);
                              VFOtriangle15A.amplitude(0);
                              VFOsaw15A.amplitude(0);
                              VFOstring15A.noteOff(0);
                              VFOwhite15A.amplitude(0);
                              VFOpink15A.amplitude(0);
                              VFOsweep15A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine15B.amplitude(0);
                              VFOsquare15B.amplitude(0);
                              VFOtriangle15B.amplitude(0);
                              VFOsaw15B.amplitude(0);
                              VFOstring15B.noteOff(0);
                              VFOwhite15B.amplitude(0);
                              VFOpink15B.amplitude(0);
                              VFOsweep15B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 14");
#endif
                              // make this note entry available for (re)use
                              poly_notes[14].channel = 0;
                              poly_notes[14].base_pitch = 0;
                           }

                           if (poly_notes[13].note_state == false)
                           {
                              VFOsine14A.amplitude(0);
                              VFOsquare14A.amplitude(0);
                              VFOtriangle14A.amplitude(0);
                              VFOsaw14A.amplitude(0);
                              VFOstring14A.noteOff(0);
                              VFOwhite14A.amplitude(0);
                              VFOpink14A.amplitude(0);
                              VFOsweep14A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine14B.amplitude(0);
                              VFOsquare14B.amplitude(0);
                              VFOtriangle14B.amplitude(0);
                              VFOsaw14B.amplitude(0);
                              VFOstring14B.noteOff(0);
                              VFOwhite14B.amplitude(0);
                              VFOpink14B.amplitude(0);
                              VFOsweep14B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 13");
#endif
                              // make this note entry available for (re)use
                              poly_notes[13].channel = 0;
                              poly_notes[13].base_pitch = 0;
                           }

                           if (poly_notes[12].note_state == false)
                           {
                              VFOsine13A.amplitude(0);
                              VFOsquare13A.amplitude(0);
                              VFOtriangle13A.amplitude(0);
                              VFOsaw13A.amplitude(0);
                              VFOstring13A.noteOff(0);
                              VFOwhite13A.amplitude(0);
                              VFOpink13A.amplitude(0);
                              VFOsweep13A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine13B.amplitude(0);
                              VFOsquare13B.amplitude(0);
                              VFOtriangle13B.amplitude(0);
                              VFOsaw13B.amplitude(0);
                              VFOstring13B.noteOff(0);
                              VFOwhite13B.amplitude(0);
                              VFOpink13B.amplitude(0);
                              VFOsweep13B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 12");
#endif
                              // make this note entry available for (re)use
                              poly_notes[12].channel = 0;
                              poly_notes[12].base_pitch = 0;
                           }

                           if (poly_notes[11].note_state == false)
                           {
                              VFOsine12A.amplitude(0);
                              VFOsquare12A.amplitude(0);
                              VFOtriangle12A.amplitude(0);
                              VFOsaw12A.amplitude(0);
                              VFOstring12A.noteOff(0);
                              VFOwhite12A.amplitude(0);
                              VFOpink12A.amplitude(0);
                              VFOsweep12A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine12B.amplitude(0);
                              VFOsquare12B.amplitude(0);
                              VFOtriangle12B.amplitude(0);
                              VFOsaw12B.amplitude(0);
                              VFOstring12B.noteOff(0);
                              VFOwhite12B.amplitude(0);
                              VFOpink12B.amplitude(0);
                              VFOsweep12B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 11");
#endif
                              // make this note entry available for (re)use
                              poly_notes[11].channel = 0;
                              poly_notes[11].base_pitch = 0;
                           }

                           if (poly_notes[10].note_state == false)
                           {
                              VFOsine11A.amplitude(0);
                              VFOsquare11A.amplitude(0);
                              VFOtriangle11A.amplitude(0);
                              VFOsaw11A.amplitude(0);
                              VFOstring11A.noteOff(0);
                              VFOwhite11A.amplitude(0);
                              VFOpink11A.amplitude(0);
                              VFOsweep11A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine11B.amplitude(0);
                              VFOsquare11B.amplitude(0);
                              VFOtriangle11B.amplitude(0);
                              VFOsaw11B.amplitude(0);
                              VFOstring11B.noteOff(0);
                              VFOwhite11B.amplitude(0);
                              VFOpink11B.amplitude(0);
                              VFOsweep11B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 10");
#endif
                              // make this note entry available for (re)use
                              poly_notes[10].channel = 0;
                              poly_notes[10].base_pitch = 0;
                           }

                           if (poly_notes[9].note_state == false)
                           {
                              VFOsine10A.amplitude(0);
                              VFOsquare10A.amplitude(0);
                              VFOtriangle10A.amplitude(0);
                              VFOsaw10A.amplitude(0);
                              VFOstring10A.noteOff(0);
                              VFOwhite10A.amplitude(0);
                              VFOpink10A.amplitude(0);
                              VFOsweep10A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine10B.amplitude(0);
                              VFOsquare10B.amplitude(0);
                              VFOtriangle10B.amplitude(0);
                              VFOsaw10B.amplitude(0);
                              VFOstring10B.noteOff(0);
                              VFOwhite10B.amplitude(0);
                              VFOpink10B.amplitude(0);
                              VFOsweep10B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 9");
#endif
                              // make this note entry available for (re)use
                              poly_notes[9].channel = 0;
                              poly_notes[9].base_pitch = 0;
                           }

                           if (poly_notes[8].note_state == false)
                           {
                              VFOsine09A.amplitude(0);
                              VFOsquare09A.amplitude(0);
                              VFOtriangle09A.amplitude(0);
                              VFOsaw09A.amplitude(0);
                              VFOstring09A.noteOff(0);
                              VFOwhite09A.amplitude(0);
                              VFOpink09A.amplitude(0);
                              VFOsweep09A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine09B.amplitude(0);
                              VFOsquare09B.amplitude(0);
                              VFOtriangle09B.amplitude(0);
                              VFOsaw09B.amplitude(0);
                              VFOstring09B.noteOff(0);
                              VFOwhite09B.amplitude(0);
                              VFOpink09B.amplitude(0);
                              VFOsweep09B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 8");
#endif
                              // make this note entry available for (re)use
                              poly_notes[8].channel = 0;
                              poly_notes[8].base_pitch = 0;
                           }

                           if (poly_notes[7].note_state == false)
                           {
                              VFOsine08A.amplitude(0);
                              VFOsquare08A.amplitude(0);
                              VFOtriangle08A.amplitude(0);
                              VFOsaw08A.amplitude(0);
                              VFOstring08A.noteOff(0);
                              VFOwhite08A.amplitude(0);
                              VFOpink08A.amplitude(0);
                              VFOsweep08A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine08B.amplitude(0);
                              VFOsquare08B.amplitude(0);
                              VFOtriangle08B.amplitude(0);
                              VFOsaw08B.amplitude(0);
                              VFOstring08B.noteOff(0);
                              VFOwhite08B.amplitude(0);
                              VFOpink08B.amplitude(0);
                              VFOsweep08B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 7");
#endif
                              // make this note entry available for (re)use
                              poly_notes[7].channel = 0;
                              poly_notes[7].base_pitch = 0;
                           }

                           if (poly_notes[6].note_state == false)
                           {
                              VFOsine07A.amplitude(0);
                              VFOsquare07A.amplitude(0);
                              VFOtriangle07A.amplitude(0);
                              VFOsaw07A.amplitude(0);
                              VFOstring07A.noteOff(0);
                              VFOwhite07A.amplitude(0);
                              VFOpink07A.amplitude(0);
                              VFOsweep07A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine07B.amplitude(0);
                              VFOsquare07B.amplitude(0);
                              VFOtriangle07B.amplitude(0);
                              VFOsaw07B.amplitude(0);
                              VFOstring07B.noteOff(0);
                              VFOwhite07B.amplitude(0);
                              VFOpink07B.amplitude(0);
                              VFOsweep07B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 6");
#endif
                              // make this note entry available for (re)use
                              poly_notes[6].channel = 0;
                              poly_notes[6].base_pitch = 0;
                           }

                           if (poly_notes[5].note_state == false)
                           {
                              VFOsine06A.amplitude(0);
                              VFOsquare06A.amplitude(0);
                              VFOtriangle06A.amplitude(0);
                              VFOsaw06A.amplitude(0);
                              VFOstring06A.noteOff(0);
                              VFOwhite06A.amplitude(0);
                              VFOpink06A.amplitude(0);
                              VFOsweep06A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine06B.amplitude(0);
                              VFOsquare06B.amplitude(0);
                              VFOtriangle06B.amplitude(0);
                              VFOsaw06B.amplitude(0);
                              VFOstring06B.noteOff(0);
                              VFOwhite06B.amplitude(0);
                              VFOpink06B.amplitude(0);
                              VFOsweep06B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 5");
#endif
                              // make this note entry available for (re)use
                              poly_notes[5].channel = 0;
                              poly_notes[5].base_pitch = 0;
                           }

                           if (poly_notes[4].note_state == false)
                           {
                              VFOsine05A.amplitude(0);
                              VFOsquare05A.amplitude(0);
                              VFOtriangle05A.amplitude(0);
                              VFOsaw05A.amplitude(0);
                              VFOstring05A.noteOff(0);
                              VFOwhite05A.amplitude(0);
                              VFOpink05A.amplitude(0);
                              VFOsweep05A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine05B.amplitude(0);
                              VFOsquare05B.amplitude(0);
                              VFOtriangle05B.amplitude(0);
                              VFOsaw05B.amplitude(0);
                              VFOstring05B.noteOff(0);
                              VFOwhite05B.amplitude(0);
                              VFOpink05B.amplitude(0);
                              VFOsweep05B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 4");
#endif
                              // make this note entry available for (re)use
                              poly_notes[4].channel = 0;
                              poly_notes[4].base_pitch = 0;
                           }

                           if (poly_notes[3].note_state == false)
                           {
                              VFOsine04A.amplitude(0);
                              VFOsquare04A.amplitude(0);
                              VFOtriangle04A.amplitude(0);
                              VFOsaw04A.amplitude(0);
                              VFOstring04A.noteOff(0);
                              VFOwhite04A.amplitude(0);
                              VFOpink04A.amplitude(0);
                              VFOsweep04A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine04B.amplitude(0);
                              VFOsquare04B.amplitude(0);
                              VFOtriangle04B.amplitude(0);
                              VFOsaw04B.amplitude(0);
                              VFOstring04B.noteOff(0);
                              VFOwhite04B.amplitude(0);
                              VFOpink04B.amplitude(0);
                              VFOsweep04B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 3");
#endif
                              // make this note entry available for (re)use
                              poly_notes[3].channel = 0;
                              poly_notes[3].base_pitch = 0;
                           }

                           if (poly_notes[2].note_state == false)
                           {
                              VFOsine03A.amplitude(0);
                              VFOsquare03A.amplitude(0);
                              VFOtriangle03A.amplitude(0);
                              VFOsaw03A.amplitude(0);
                              VFOstring03A.noteOff(0);
                              VFOwhite03A.amplitude(0);
                              VFOpink03A.amplitude(0);
                              VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine03B.amplitude(0);
                              VFOsquare03B.amplitude(0);
                              VFOtriangle03B.amplitude(0);
                              VFOsaw03B.amplitude(0);
                              VFOstring03B.noteOff(0);
                              VFOwhite03B.amplitude(0);
                              VFOpink03B.amplitude(0);
                              VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 2");
#endif
                              // make this note entry available for (re)use
                              poly_notes[2].channel = 0;
                              poly_notes[2].base_pitch = 0;
                           }

                           if (poly_notes[1].note_state == false)
                           {
                              VFOsine02A.amplitude(0);
                              VFOsquare02A.amplitude(0);
                              VFOtriangle02A.amplitude(0);
                              VFOsaw02A.amplitude(0);
                              VFOstring02A.noteOff(0);
                              VFOwhite02A.amplitude(0);
                              VFOpink02A.amplitude(0);
                              VFOsweep02A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine02B.amplitude(0);
                              VFOsquare02B.amplitude(0);
                              VFOtriangle02B.amplitude(0);
                              VFOsaw02B.amplitude(0);
                              VFOstring02B.noteOff(0);
                              VFOwhite02B.amplitude(0);
                              VFOpink02B.amplitude(0);
                              VFOsweep02B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 1");
#endif
                              // make this note entry available for (re)use
                              poly_notes[1].channel = 0;
                              poly_notes[1].base_pitch = 0;
                           }

                           if (poly_notes[0].note_state == false)
                           {
                              VFOsine01A.amplitude(0);
                              VFOsquare01A.amplitude(0);
                              VFOtriangle01A.amplitude(0);
                              VFOsaw01A.amplitude(0);
                              VFOstring01A.noteOff(0);
                              VFOwhite01A.amplitude(0);
                              VFOpink01A.amplitude(0);
                              VFOsweep01A.play(0.0, 10.0, 10.0, 1.0);

                              VFOsine01B.amplitude(0);
                              VFOsquare01B.amplitude(0);
                              VFOtriangle01B.amplitude(0);
                              VFOsaw01B.amplitude(0);
                              VFOstring01B.noteOff(0);
                              VFOwhite01B.amplitude(0);
                              VFOpink01B.amplitude(0);
                              VFOsweep01B.play(0.0, 10.0, 10.0, 1.0);

#ifdef DEBUG_MAKE_NOTE_AVAILABLE
                              Serial.println("env turning off is making available note index = 0");
#endif
                              // make this note entry available for (re)use
                              poly_notes[0].channel = 0;
                              poly_notes[0].base_pitch = 0;
                           }
                        }
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_ACTIVE_PB:  // C04:C13 - LFO filter active PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_active_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_active_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_active_pb == 0)
                     {
                        lfo_filt_active_state = !lfo_filt_active_state;
                        save_needed = true;

                        // if the LFOfilt active setting changed to "off", then disable all LFOfilt waveforms thru their respective mixer channels
                        if (lfo_filt_active_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter DISABLED");
#endif
                           LFOfilterMix1_1.gain(0, 0.0);
                           LFOfilterMix1_1.gain(1, 0.0);
                           LFOfilterMix1_1.gain(2, 0.0);
                           LFOfilterMix1_1.gain(3, 0.0);
                           LFOfilterMix1_2.gain(0, 0.0);
                           LFOfilterMix1_2.gain(1, 0.0);
                           LFOfilterMix1_2.gain(2, 0.0);
                           LFOfilterMix1_2.gain(3, 0.0);
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter ENABLED");
#endif
                           if (lfo_filt_sine_state == true)
                           {
                              LFOfilterMix1_1.gain(0, ((float)(lfo_filt_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                           }
                           if (lfo_filt_square_state == true)
                           {
                              LFOfilterMix1_1.gain(1, ((float)(lfo_filt_square_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                           }
                           if (lfo_filt_pulse_state == true)
                           {
                              LFOfilterMix1_1.gain(2, ((float)(lfo_filt_pulse_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                           }
                           if (lfo_filt_triangle_state == true)
                           {
                              LFOfilterMix1_1.gain(3, ((float)(lfo_filt_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                           }
                           if (lfo_filt_saw_state == true)
                           {
                              LFOfilterMix1_2.gain(0, ((float)(lfo_filt_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                           }
                           if (lfo_filt_samphold_state == true)
                           {
                              LFOfilterMix1_2.gain(1, ((float)(lfo_filt_samphold_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
                           }
                           LFOfilterMix1_2.gain(2, 0.0);
                           LFOfilterMix1_2.gain(3, 0.0);
                        }
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_SINGLE_PB:  // C04:C14 - LFO filter single PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_single_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_single_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_single_pb == 0)
                     {
                        lfo_filt_single_state = !lfo_filt_single_state;
                        save_needed = true;

                        // if the LFOfilt single setting changed to "on"
                        if (lfo_filt_single_state == true)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Single ENABLED");
#endif
                           int enabled_waveform_count = 0;

                           if (lfo_filt_sine_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_filt_square_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_filt_pulse_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_filt_triangle_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_filt_saw_state == true)
                           {
                              enabled_waveform_count++;
                           }
                           if (lfo_filt_samphold_state == true)
                           {
                              enabled_waveform_count++;
                           }

                           // if more than one LFOfilt waveform is enabled, then disable all of them except sine thru their respective mixer channels (since it's indeterminate which specific waveform is wanted)
                           if (enabled_waveform_count > 1)
                           {
                              lfo_filt_sine_state = true;
                              lfo_filt_square_state = false;
                              lfo_filt_pulse_state = false;
                              lfo_filt_triangle_state = false;
                              lfo_filt_saw_state = false;
                              lfo_filt_samphold_state = false;
                           }
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Single DISABLED");
#endif
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_SINE_PB:  // C04:C15 - LFO filter sine PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, LOW);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_sine_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_sine_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_sine_pb == 0)
                     {
                        lfo_filt_sine_state = !lfo_filt_sine_state;
                        save_needed = true;

                        if (lfo_filt_sine_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Sine DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Sine ENABLED");
#endif

                           if (lfo_filt_single_state == true)
                           {
                              lfo_filt_square_state = false;
                              lfo_filt_pulse_state = false;
                              lfo_filt_triangle_state = false;
                              lfo_filt_saw_state = false;
                              lfo_filt_samphold_state = false;
                           }
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_SQUARE_PB:  // C05:C00 - LFO filter square PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_square_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_square_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_square_pb == 0)
                     {
                        lfo_filt_square_state = !lfo_filt_square_state;
                        save_needed = true;

                        if (lfo_filt_square_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Square DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Square ENABLED");
#endif

                           if (lfo_filt_single_state == true)
                           {
                              lfo_filt_sine_state = false;
                              lfo_filt_pulse_state = false;
                              lfo_filt_triangle_state = false;
                              lfo_filt_saw_state = false;
                              lfo_filt_samphold_state = false;
                           }
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_PULSE_PB:  // C05:C01 - LFO filter pulse PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_pulse_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_pulse_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_pulse_pb == 0)
                     {
                        lfo_filt_pulse_state = !lfo_filt_pulse_state;
                        save_needed = true;

                        if (lfo_filt_pulse_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Pulse DISABLED");
#endif

                           lfo_filt_pulse_duty_state = false;
                           LFOpulseFilterDutyCycle.amplitude(-0.9);
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Mod Pulse Duty Cycle DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Pulse ENABLED");
#endif

                           if (lfo_filt_single_state == true)
                           {
                              lfo_filt_sine_state = false;
                              lfo_filt_square_state = false;
                              lfo_filt_triangle_state = false;
                              lfo_filt_saw_state = false;
                              lfo_filt_samphold_state = false;
                           }
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_PULSE_DUTY_PB:  // C05:C02 - LFO filter pulse duty cycle PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_pulse_duty_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_pulse_duty_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_pulse_duty_pb == 0)
                     {
                        // only allow filter pulse duty cycle to be turned on if filter pulse is on
                        if (lfo_filt_pulse_state == true)
                        {
                           lfo_filt_pulse_duty_state = !lfo_filt_pulse_duty_state;
                           save_needed = true;

                           if (lfo_filt_pulse_duty_state == false)
                           {
#ifdef DEBUG_PBUTTONS
                              Serial.println("LFO Filter Pulse Duty Cycle DISABLED");
#endif

                              LFOpulseFilterDutyCycle.amplitude(-0.9);
                           } else {
#ifdef DEBUG_PBUTTONS
                              Serial.println("LFO Filter Pulse Duty Cycle ENABLED");
#endif

                              // scale to -0.9 to +0.9 range
                              LFOpulseFilterDutyCycle.amplitude((float)(lfo_filt_pulse_duty_pot - 511) / 569.0);
                           }
                        }
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_TRIANGLE_PB:  // C05:C03 - LFO filter triangle PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_triangle_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_triangle_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_triangle_pb == 0)
                     {
                        lfo_filt_triangle_state = !lfo_filt_triangle_state;
                        save_needed = true;

                        if (lfo_filt_triangle_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Triangle DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Triangle ENABLED");
#endif

                           if (lfo_filt_single_state == true)
                           {
                              lfo_filt_sine_state = false;
                              lfo_filt_square_state = false;
                              lfo_filt_pulse_state = false;
                              lfo_filt_saw_state = false;
                              lfo_filt_samphold_state = false;
                           }
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_SAW_PB:  // C05:C04 - LFO filter sawtooth PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_saw_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_saw_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_saw_pb == 0)
                     {
                        lfo_filt_saw_state = !lfo_filt_saw_state;
                        save_needed = true;

                        if (lfo_filt_saw_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Saw DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter Saw ENABLED");
#endif

                           if (lfo_filt_single_state == true)
                           {
                              lfo_filt_sine_state = false;
                              lfo_filt_square_state = false;
                              lfo_filt_pulse_state = false;
                              lfo_filt_triangle_state = false;
                              lfo_filt_samphold_state = false;
                           }
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_LFO_FILT_SAMPHOLD_PB:  // C05:C05 - LFO filter sample/hold PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_lfo_filt_samphold_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_lfo_filt_samphold_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_lfo_filt_samphold_pb == 0)
                     {
                        lfo_filt_samphold_state = !lfo_filt_samphold_state;
                        save_needed = true;

                        if (lfo_filt_samphold_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter SampHold DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("LFO Filter SampHold ENABLED");
#endif

                           if (lfo_filt_single_state == true)
                           {
                              lfo_filt_sine_state = false;
                              lfo_filt_square_state = false;
                              lfo_filt_pulse_state = false;
                              lfo_filt_triangle_state = false;
                              lfo_filt_saw_state = false;
                           }
                        }

                        set_lfo_filt_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_FILTER_NONE_PB:  // C05:C06 - filter NONE PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_filt_none_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_filt_none_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_filt_none_pb == 0)
                     {
                        filt_none_state = !filt_none_state;
                        save_needed = true;

                        // if all others are off, then don't allow this one to turn off
                        if ((filt_lowpass_state == false) && (filt_bandpass_state == false) && (filt_highpass_state == false))
                        {
                           filt_none_state = true;
                        }

                        if (filt_none_state == true)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter None ENABLED");
#endif

                           if (filt_lowpass_state == true)
                           {
#ifdef DEBUG_PBUTTONS
                              Serial.println("Filter LowPass DISABLED");
#endif

                              filt_lowpass_state = false;
                           }

                           if (filt_bandpass_state == true)
                           {
#ifdef DEBUG_PBUTTONS
                              Serial.println("Filter BandPass DISABLED");
#endif

                              filt_bandpass_state = false;
                           }

                           if (filt_highpass_state == true)
                           {
#ifdef DEBUG_PBUTTONS
                              Serial.println("Filter HighPass DISABLED");
#endif

                              filt_highpass_state = false;
                           }
                        }

                        set_vfo_filter_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_FILTER_LOWPASS_PB:  // C05:C07 - filter LOWPASS PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_filt_lowpass_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_filt_lowpass_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_filt_lowpass_pb == 0)
                     {
                        filt_lowpass_state = !filt_lowpass_state;
                        save_needed = true;

                        // if all active filters are off, then turn on filter none
                        if ((filt_lowpass_state == false) && (filt_bandpass_state == false) && (filt_highpass_state == false))
                        {
                           filt_none_state = true;

#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter None ENABLED");
#endif
                        }

                        if (filt_lowpass_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter LowPass DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter LowPass ENABLED");
                           Serial.println("Filter None DISABLED");
#endif
                           filt_none_state = false;
                        }

                        set_vfo_filter_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_FILTER_BANDPASS_PB:  // C05:C08 - filter BANDPASS PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, LOW);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_filt_bandpass_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_filt_bandpass_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_filt_bandpass_pb == 0)
                     {
                        filt_bandpass_state = !filt_bandpass_state;
                        save_needed = true;

                        // if all active filters are off, then turn on filter none
                        if ((filt_lowpass_state == false) && (filt_bandpass_state == false) && (filt_highpass_state == false))
                        {
                           filt_none_state = true;

#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter None ENABLED");
#endif
                        }

                        if (filt_bandpass_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter BandPass DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter BandPass ENABLED");
                           Serial.println("Filter None DISABLED");
#endif
                           filt_none_state = false;
                        }

                        set_vfo_filter_gain();
                     }
                  }
               }
#endif
            }
            break;

            case MUX_IN_FILTER_HIGHPASS_PB:  // C05:C09 - filter HIGHPASS PB
            {
               // set the primary MUX decoder bits first
               digitalWrite(PRIMARY_MUX_DECODE_BIT3_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT2_PIN, HIGH);
               digitalWrite(PRIMARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(PRIMARY_MUX_DECODE_BIT0_PIN, HIGH);

               // set the secondary MUX decoder bits
               digitalWrite(SECONDARY_MUX_DECODE_BIT3_PIN, HIGH);
               digitalWrite(SECONDARY_MUX_DECODE_BIT2_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT1_PIN, LOW);
               digitalWrite(SECONDARY_MUX_DECODE_BIT0_PIN, HIGH);

               // enable the MUXs
               digitalWrite(MUX_LOW_ENABLE_PIN, LOW);

               // allow time for signals to settle
               delayMicroseconds(MUX_SETTLING_TIME_MICROSECONDS);

               // now read the pb
               int pb_value = digitalRead(PRIMARY_MUX_INPUT_OUTPUT_PIN);

               // leave the MUXs disabled
               digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

#ifndef DISABLE_PB_READ
               // see if this PB is currently RELEASED
               if (pb_value == HIGH)
               {
                  debounce_filt_highpass_pb = DEBOUNCE_COUNT_MAX;
               } else {
                  // if this PB is currently pressed, see if the PB debounce counter is still being decremented
                  if (debounce_filt_highpass_pb > 0)
                  {
                     // see if we've found a debounced PB PRESSED
                     if (--debounce_filt_highpass_pb == 0)
                     {
                        filt_highpass_state = !filt_highpass_state;
                        save_needed = true;

                        // if all active filters are off, then turn on filter none
                        if ((filt_lowpass_state == false) && (filt_bandpass_state == false) && (filt_highpass_state == false))
                        {
                           filt_none_state = true;

#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter None ENABLED");
#endif
                        }

                        if (filt_highpass_state == false)
                        {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter HighPass DISABLED");
#endif
                        } else {
#ifdef DEBUG_PBUTTONS
                           Serial.println("Filter HighPass ENABLED");
                           Serial.println("Filter None DISABLED");
#endif
                           filt_none_state = false;
                        }

                        set_vfo_filter_gain();
                     }
                  }
               }
#endif
            }
            break;
         }

         if (++mux_input_pb_index >= MUX_IN_PB_MAX)
         {
            mux_input_pb_index = MUX_IN_MIDI_PANIC_PB;

            AudioNoInterrupts();

            // see if a save has been requested
            if (save_needed == true)
            {
               save_needed = false;

               // initialize the save accumulator delay timer
               save_delay_millis = millis();

               // update the LEDs to immediately show any changes
               write_leds_thru_shiftreg();
            } else {
               // if a delay is in progress & the dealy timer period is exceeded
               if ((save_delay_millis > 0) && ((millis() - save_delay_millis) > SAVE_DELAY_MILLIS))
               {
                  // reset the save accumularoe delay timer
                  save_delay_millis = 0;

                  // actually save everything to EEPROM
                  save_settings();
               }
            }

            AudioInterrupts();
         }
      }
      break;
   }

   if (++mux_op_type >= MUX_OP_MAX)
   {
      mux_op_type = MUX_READ_POT;
   }

   for (int note_index = 0; note_index < LIMIT_POLY; note_index++)
   {
      if ((env_active_state == true) && (poly_notes[note_index].note_state == false) && (poly_notes[note_index].channel != 0) && (poly_notes[note_index].base_pitch != 0)) 
      {
         if ((vfo_sustain_pot == 0) && ((millis() - poly_notes[note_index].note_off_millis) > (unsigned long)((vfo_decay_pot * 3) + vfo_release_pot)))
         {
#ifdef DEBUG_MAKE_NOTE_AVAILABLE
            Serial.print("loop w/ env active, sustain=0, & decay+release has expired is making available note index = ");
            Serial.println(note_index);
#endif
            // make this note entry available for (re)use
            poly_notes[note_index].channel = 0;
            poly_notes[note_index].base_pitch = 0;

            switch(note_index)
            {
               case 0:
               {
                  VFOsine01A.amplitude(0);
                  VFOsquare01A.amplitude(0);
                  VFOstring01A.noteOff(0.0);
                  VFOtriangle01A.amplitude(0);
                  VFOsaw01A.amplitude(0);
                  VFOwhite01A.amplitude(0);
                  VFOpink01A.amplitude(0);
                  VFOsweep01A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine01B.amplitude(0);
                  VFOsquare01B.amplitude(0);
                  VFOstring01B.noteOff(0.0);
                  VFOtriangle01B.amplitude(0);
                  VFOsaw01B.amplitude(0);
                  VFOwhite01B.amplitude(0);
                  VFOpink01B.amplitude(0);
                  VFOsweep01B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 1:
               {
                  VFOsine02A.amplitude(0);
                  VFOsquare02A.amplitude(0);
                  VFOstring02A.noteOff(0.0);
                  VFOtriangle02A.amplitude(0);
                  VFOsaw02A.amplitude(0);
                  VFOwhite02A.amplitude(0);
                  VFOpink02A.amplitude(0);
                  VFOsweep02A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine02B.amplitude(0);
                  VFOsquare02B.amplitude(0);
                  VFOstring02B.noteOff(0.0);
                  VFOtriangle02B.amplitude(0);
                  VFOsaw02B.amplitude(0);
                  VFOwhite02B.amplitude(0);
                  VFOpink02B.amplitude(0);
                  VFOsweep02B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 2:
               {
                  VFOsine03A.amplitude(0);
                  VFOsquare03A.amplitude(0);
                  VFOstring03A.noteOff(0.0);
                  VFOtriangle03A.amplitude(0);
                  VFOsaw03A.amplitude(0);
                  VFOwhite03A.amplitude(0);
                  VFOpink03A.amplitude(0);
                  VFOsweep03A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine03B.amplitude(0);
                  VFOsquare03B.amplitude(0);
                  VFOstring03B.noteOff(0.0);
                  VFOtriangle03B.amplitude(0);
                  VFOsaw03B.amplitude(0);
                  VFOwhite03B.amplitude(0);
                  VFOpink03B.amplitude(0);
                  VFOsweep03B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 3:
               {
                  VFOsine04A.amplitude(0);
                  VFOsquare04A.amplitude(0);
                  VFOstring04A.noteOff(0.0);
                  VFOtriangle04A.amplitude(0);
                  VFOsaw04A.amplitude(0);
                  VFOwhite04A.amplitude(0);
                  VFOpink04A.amplitude(0);
                  VFOsweep04A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine04B.amplitude(0);
                  VFOsquare04B.amplitude(0);
                  VFOstring04B.noteOff(0.0);
                  VFOtriangle04B.amplitude(0);
                  VFOsaw04B.amplitude(0);
                  VFOwhite04B.amplitude(0);
                  VFOpink04B.amplitude(0);
                  VFOsweep04B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 4:
               {
                  VFOsine05A.amplitude(0);
                  VFOsquare05A.amplitude(0);
                  VFOstring05A.noteOff(0.0);
                  VFOtriangle05A.amplitude(0);
                  VFOsaw05A.amplitude(0);
                  VFOwhite05A.amplitude(0);
                  VFOpink05A.amplitude(0);
                  VFOsweep05A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine05B.amplitude(0);
                  VFOsquare05B.amplitude(0);
                  VFOstring05B.noteOff(0.0);
                  VFOtriangle05B.amplitude(0);
                  VFOsaw05B.amplitude(0);
                  VFOwhite05B.amplitude(0);
                  VFOpink05B.amplitude(0);
                  VFOsweep05B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 5:
               {
                  VFOsine06A.amplitude(0);
                  VFOsquare06A.amplitude(0);
                  VFOstring06A.noteOff(0.0);
                  VFOtriangle06A.amplitude(0);
                  VFOsaw06A.amplitude(0);
                  VFOwhite06A.amplitude(0);
                  VFOpink06A.amplitude(0);
                  VFOsweep06A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine06B.amplitude(0);
                  VFOsquare06B.amplitude(0);
                  VFOstring06B.noteOff(0.0);
                  VFOtriangle06B.amplitude(0);
                  VFOsaw06B.amplitude(0);
                  VFOwhite06B.amplitude(0);
                  VFOpink06B.amplitude(0);
                  VFOsweep06B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 6:
               {
                  VFOsine07A.amplitude(0);
                  VFOsquare07A.amplitude(0);
                  VFOstring07A.noteOff(0.0);
                  VFOtriangle07A.amplitude(0);
                  VFOsaw07A.amplitude(0);
                  VFOwhite07A.amplitude(0);
                  VFOpink07A.amplitude(0);
                  VFOsweep07A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine07B.amplitude(0);
                  VFOsquare07B.amplitude(0);
                  VFOstring07B.noteOff(0.0);
                  VFOtriangle07B.amplitude(0);
                  VFOsaw07B.amplitude(0);
                  VFOwhite07B.amplitude(0);
                  VFOpink07B.amplitude(0);
                  VFOsweep07B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 7:
               {
                  VFOsine08A.amplitude(0);
                  VFOsquare08A.amplitude(0);
                  VFOstring08A.noteOff(0.0);
                  VFOtriangle08A.amplitude(0);
                  VFOsaw08A.amplitude(0);
                  VFOwhite08A.amplitude(0);
                  VFOpink08A.amplitude(0);
                  VFOsweep08A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine08B.amplitude(0);
                  VFOsquare08B.amplitude(0);
                  VFOstring08B.noteOff(0.0);
                  VFOtriangle08B.amplitude(0);
                  VFOsaw08B.amplitude(0);
                  VFOwhite08B.amplitude(0);
                  VFOpink08B.amplitude(0);
                  VFOsweep08B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 8:
               {
                  VFOsine09A.amplitude(0);
                  VFOsquare09A.amplitude(0);
                  VFOstring09A.noteOff(0.0);
                  VFOtriangle09A.amplitude(0);
                  VFOsaw09A.amplitude(0);
                  VFOwhite09A.amplitude(0);
                  VFOpink09A.amplitude(0);
                  VFOsweep09A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine09B.amplitude(0);
                  VFOsquare09B.amplitude(0);
                  VFOstring09B.noteOff(0.0);
                  VFOtriangle09B.amplitude(0);
                  VFOsaw09B.amplitude(0);
                  VFOwhite09B.amplitude(0);
                  VFOpink09B.amplitude(0);
                  VFOsweep09B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 9:
               {
                  VFOsine10A.amplitude(0);
                  VFOsquare10A.amplitude(0);
                  VFOstring10A.noteOff(0.0);
                  VFOtriangle10A.amplitude(0);
                  VFOsaw10A.amplitude(0);
                  VFOwhite10A.amplitude(0);
                  VFOpink10A.amplitude(0);
                  VFOsweep10A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine10B.amplitude(0);
                  VFOsquare10B.amplitude(0);
                  VFOstring10B.noteOff(0.0);
                  VFOtriangle10B.amplitude(0);
                  VFOsaw10B.amplitude(0);
                  VFOwhite10B.amplitude(0);
                  VFOpink10B.amplitude(0);
                  VFOsweep10B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 10:
               {
                  VFOsine11A.amplitude(0);
                  VFOsquare11A.amplitude(0);
                  VFOstring11A.noteOff(0.0);
                  VFOtriangle11A.amplitude(0);
                  VFOsaw11A.amplitude(0);
                  VFOwhite11A.amplitude(0);
                  VFOpink11A.amplitude(0);
                  VFOsweep11A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine11B.amplitude(0);
                  VFOsquare11B.amplitude(0);
                  VFOstring11B.noteOff(0.0);
                  VFOtriangle11B.amplitude(0);
                  VFOsaw11B.amplitude(0);
                  VFOwhite11B.amplitude(0);
                  VFOpink11B.amplitude(0);
                  VFOsweep11B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 11:
               {
                  VFOsine12A.amplitude(0);
                  VFOsquare12A.amplitude(0);
                  VFOstring12A.noteOff(0.0);
                  VFOtriangle12A.amplitude(0);
                  VFOsaw12A.amplitude(0);
                  VFOwhite12A.amplitude(0);
                  VFOpink12A.amplitude(0);
                  VFOsweep12A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine12B.amplitude(0);
                  VFOsquare12B.amplitude(0);
                  VFOstring12B.noteOff(0.0);
                  VFOtriangle12B.amplitude(0);
                  VFOsaw12B.amplitude(0);
                  VFOwhite12B.amplitude(0);
                  VFOpink12B.amplitude(0);
                  VFOsweep12B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 12:
               {
                  VFOsine13A.amplitude(0);
                  VFOsquare13A.amplitude(0);
                  VFOstring13A.noteOff(0.0);
                  VFOtriangle13A.amplitude(0);
                  VFOsaw13A.amplitude(0);
                  VFOwhite13A.amplitude(0);
                  VFOpink13A.amplitude(0);
                  VFOsweep13A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine13B.amplitude(0);
                  VFOsquare13B.amplitude(0);
                  VFOstring13B.noteOff(0.0);
                  VFOtriangle13B.amplitude(0);
                  VFOsaw13B.amplitude(0);
                  VFOwhite13B.amplitude(0);
                  VFOpink13B.amplitude(0);
                  VFOsweep13B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 13:
               {
                  VFOsine14A.amplitude(0);
                  VFOsquare14A.amplitude(0);
                  VFOstring14A.noteOff(0.0);
                  VFOtriangle14A.amplitude(0);
                  VFOsaw14A.amplitude(0);
                  VFOwhite14A.amplitude(0);
                  VFOpink14A.amplitude(0);
                  VFOsweep14A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine14B.amplitude(0);
                  VFOsquare14B.amplitude(0);
                  VFOstring14B.noteOff(0.0);
                  VFOtriangle14B.amplitude(0);
                  VFOsaw14B.amplitude(0);
                  VFOwhite14B.amplitude(0);
                  VFOpink14B.amplitude(0);
                  VFOsweep14B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 14:
               {
                  VFOsine15A.amplitude(0);
                  VFOsquare15A.amplitude(0);
                  VFOstring15A.noteOff(0.0);
                  VFOtriangle15A.amplitude(0);
                  VFOsaw15A.amplitude(0);
                  VFOwhite15A.amplitude(0);
                  VFOpink15A.amplitude(0);
                  VFOsweep15A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine15B.amplitude(0);
                  VFOsquare15B.amplitude(0);
                  VFOstring15B.noteOff(0.0);
                  VFOtriangle15B.amplitude(0);
                  VFOsaw15B.amplitude(0);
                  VFOwhite15B.amplitude(0);
                  VFOpink15B.amplitude(0);
                  VFOsweep15B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;

               case 15:
               {
                  VFOsine16A.amplitude(0);
                  VFOsquare16A.amplitude(0);
                  VFOstring16A.noteOff(0.0);
                  VFOtriangle16A.amplitude(0);
                  VFOsaw16A.amplitude(0);
                  VFOwhite16A.amplitude(0);
                  VFOpink16A.amplitude(0);
                  VFOsweep16A.play(0.0, 10.0, 10.0, 1.0);

                  VFOsine16B.amplitude(0);
                  VFOsquare16B.amplitude(0);
                  VFOstring16B.noteOff(0.0);
                  VFOtriangle16B.amplitude(0);
                  VFOsaw16B.amplitude(0);
                  VFOwhite16B.amplitude(0);
                  VFOpink16B.amplitude(0);
                  VFOsweep16B.play(0.0, 10.0, 10.0, 1.0);
               }
               break;
            }
         }
      } else {
         if ((poly_notes[note_index].note_state == false) && (poly_notes[note_index].channel != 0) && (poly_notes[note_index].base_pitch != 0) && (millis() - poly_notes[note_index].note_off_millis) > STRING_DURATION_MILLIS)
         {
#ifdef DEBUG_MAKE_NOTE_AVAILABLE
            Serial.print("loop w/ env inactive is making available note index = ");
            Serial.println(note_index);
#endif
            // make this note entry available for (re)use
            poly_notes[note_index].channel = 0;
            poly_notes[note_index].base_pitch = 0;
         }
      }
   }

   // process glide mode
   if (vfoB_glide_state == true)
   {
      // if we have a note in progress
      if (((poly_notes[0].channel != 0) && (poly_notes[0].base_pitch != 0)) || (pedal_pressed == true))
      {
         // if there's any glide to be processed
         if (glide_current_base_freq != glide_target_base_freq)
         {
            // if we've already exceeded the glide duration
            if (millis() > (glide_start_millis + glide_duration_millis))
            {
               glide_current_base_freq = glide_target_base_freq;
               glide_start_base_freq = glide_target_base_freq;
            } else {
               // if we are not changing notes
               if (glide_start_base_freq == 0)
               {
                  glide_start_base_freq = glide_target_base_freq;
               }

               glide_current_base_freq = glide_start_base_freq + ((glide_target_base_freq - glide_start_base_freq) * (((float)millis() - (float)glide_start_millis) / (float)glide_duration_millis));
            }

            // when glide is active, only VFO #1 is used
            VFOsine01A.frequency(glide_current_base_freq / octaveA_divisor);
            VFOsquare01A.frequency(glide_current_base_freq / octaveA_divisor);
            VFOtriangle01A.frequency(glide_current_base_freq / octaveA_divisor);
            VFOsaw01A.frequency(glide_current_base_freq / octaveA_divisor);

            VFOsine01B.frequency(glide_current_base_freq / octaveB_divisor);
            VFOsquare01B.frequency(glide_current_base_freq / octaveB_divisor);
            VFOtriangle01B.frequency(glide_current_base_freq / octaveB_divisor);
            VFOsaw01B.frequency(glide_current_base_freq / octaveB_divisor);
         } else {
            if (pedal_pressed == true)
            {
               glide_start_base_freq = glide_current_base_freq;
            }
         }
      }
   }

   if ((millis() - status_time) > STATUS_INTERVAL_MILLIS)
   {
      status_time = millis();

      display_status();
   }

   if ((midi_note_activity_state == true) || (midi_control_activity_state == true))
   {
      if (midi_note_activity_state == true)
      {
         digitalWrite(MIDI_NOTE_ACTIVITY_LED_PIN, HIGH);
      }

      if (midi_control_activity_state == true)
      {
         digitalWrite(MIDI_CONTROL_ACTIVITY_LED_PIN, HIGH);
      }

      led_time = millis();
      midi_note_activity_state = false;
      midi_control_activity_state = false;

      while ((midi_note_activity_state == false) && (midi_control_activity_state == false) && ((millis() - led_time) < ACTIVITY_LED_DURATION_MILLIS)) {};

      digitalWrite(MIDI_NOTE_ACTIVITY_LED_PIN, LOW);
      digitalWrite(MIDI_CONTROL_ACTIVITY_LED_PIN, LOW);
   }
}  // loop()


// MIDI message callback - active sensing via MIDI
void MIDI_handleActiveSensing(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Active Sensing - via MIDI");
#endif

   handleActiveSensing();
}  // MIDI_handleActiveSensing()


// MIDI message callback - after touch channel via MIDI
void MIDI_handleAfterTouchChannel(byte channel, byte pressure)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** After Touch Chan - VIA MIDI : ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  pressure=");
   if (pressure < 100)
   {
      Serial.print(" ");
   }
   if (pressure< 10)
   {
      Serial.print(" ");
   }
   Serial.println(pressure);
#endif

   handleAfterTouchChannel(channel, pressure);
}  // MIDI_handleAfterTouchChannel()


// MIDI message callback - after touch poly via MIDI
void MIDI_handleAfterTouchPoly(byte channel, byte note, byte pressure)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** After Touch Poly - via MIDI : ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  note =");
   if (note < 100)
   {
      Serial.print(" ");
   }
   if (note < 10)
   {
      Serial.print(" ");
   }
   Serial.print(note);

   Serial.print("  pressure=");
   if (pressure < 100)
   {
      Serial.print(" ");
   }
   if (pressure< 10)
   {
      Serial.print(" ");
   }
   Serial.println(pressure);
#endif

   handleAfterTouchPoly(channel, note, pressure);
}  // MIDI_handleAfterTouchPoly()


// MIDI message callback - clock via MIDI
void MIDI_handleClock(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Clock - via MIDI");
#endif

   handleClock();
}  // MIDI_handleClock()


// MIDI message callback - continue via MIDI
void MIDI_handleContinue(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Continue - via MIDI");
#endif

   handleContinue();
}  // MIDI_handleContinue()


// MIDI message callback - control change via MIDI
void MIDI_handleControlChange(byte channel, byte number, byte value)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Control Change - via MIDI :   ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  num  =");
   if (number < 100)
   {
      Serial.print(" ");
   }
   if (number < 10)
   {
      Serial.print(" ");
   }
   Serial.print(number);

   Serial.print("  value   =");
   if (value < 100)
   {
      Serial.print(" ");
   }
   if (value< 10)
   {
      Serial.print(" ");
   }
   Serial.println(value);
#endif

   handleControlChange(channel, number, value);
}  // MIDI_handleControlChange()


// MIDI message callback - note off via MIDI
void MIDI_handleNoteOff(byte channel, byte pitch, byte velocity)
{
#ifdef DEBUG_NOTE_MSGS
   Serial.print("Note Off - via MIDI :             ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);
   Serial.print("  pitch=");
   if (pitch < 100)
   {
      Serial.print(" ");
   }
   if (pitch < 10)
   {
      Serial.print(" ");
   }
   Serial.println(pitch);
#endif

   handleNoteOff(channel, pitch, velocity);
}  // MIDI_handleNoteOff()


// MIDI message callback - note on via MIDI
void MIDI_handleNoteOn(byte channel, byte pitch, byte velocity)
{
#ifdef DEBUG_NOTE_MSGS
   if (velocity == 0)
   {
      Serial.print("Note Off - via MIDI:             ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);

      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.println(pitch);
   } else {
      Serial.print("Note On:              ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);


      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.print(pitch);

      Serial.print("  velocity=");
      if (velocity < 100)
      {
         Serial.print(" ");
      }
      if (velocity < 10)
      {
         Serial.print(" ");
      }
      Serial.println(velocity);
      
      Serial.print(channel);
      Serial.print("  VFO A = ");
      Serial.print(fNotePitches[pitch] / octaveA_divisor);
      Serial.print("Hz   ");
      Serial.print("  VFO B = ");
      Serial.print(fNotePitches[pitch] / octaveB_divisor);
      Serial.println("Hz   ");
   }
#endif

   handleNoteOn(channel, pitch, velocity);
}  // MIDI_handleNoteOn


// MIDI message callback - pitch bend via MIDI
void MIDI_handlePitchBend(byte channel, int bend)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Pitch Bend - via MIDI :       ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  bend =");
   if (bend < 100)
   {
      Serial.print(" ");
   }
   if (bend < 10)
   {
      Serial.print(" ");
   }
   Serial.println(bend);
#endif

   handlePitchBend(channel, bend);
}  // MIDI_handlePitchBend()


// MIDI message callback - program change via MIDI
void MIDI_handleProgramChange(byte channel, byte number)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Program Change - via MIDI :   ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  num  =");
   if (number < 100)
   {
      Serial.print(" ");
   }
   if (number < 10)
   {
      Serial.print(" ");
   }
   Serial.println(number);
#endif

   handleProgramChange(channel, number);
}  // MIDI_handleProgramChange()


// MIDI message callback - song position via MIDI
void MIDI_handleSongPosition(unsigned beats)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Song Position - via MIDI :    beats=");
   if (beats < 100)
   {
      Serial.print(" ");
   }
   if (beats < 10)
   {
      Serial.print(" ");
   }
   Serial.println(beats);
#endif

   handleSongPosition(beats);
}  // MIDI_handleSongPosition()


// MIDI message callback - song select via MIDI
void MIDI_handleSongSelect(byte songnumber)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Song Select - via MIDI :      song=");
   if (songnumber < 100)
   {
      Serial.print(" ");
   }
   if (songnumber < 10)
   {
      Serial.print(" ");
   }
   Serial.println(songnumber);
#endif

   handleSongSelect(songnumber);
}  // MIDI_handleSongSelect()


// MIDI message callback - start via MIDI
void MIDI_handleStart(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Start - via MIDI");
#endif

   handleStart();
}  // MIDI_handleStart()


// MIDI message callback - stop via MIDI
void MIDI_handleStop(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Stop - via MIDI");
#endif

   handleStop();
}  // MIDI_handleStop()


// MIDI message callback - system exclusive via MIDI
void MIDI_handleSystemExclusive(byte * array, unsigned size)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** SYSEX - via MIDI :            size=");
   if (size < 100)
   {
      Serial.print(" ");
   }
   if (size < 10)
   {
      Serial.print(" ");
   }
   Serial.println(size);
#endif

   handleSystemExclusive(&(*array), size);
}  // MIDI_handleSystemExclusive()


// MIDI message callback - system reset via MIDI
void MIDI_handleSystemReset(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** System Reset - via MIDI");
#endif

   handleSystemReset();
}  // MIDI_handleSystemReset()


// MIDI message callback - timecode quarter frame via MIDI
void MIDI_handleTimeCodeQuarterFrame(byte data)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** TimeCodeQFrame - VIA MIDI :  data=");
   if (data < 100)
   {
      Serial.print(" ");
   }
   if (data < 10)
   {
      Serial.print(" ");
   }
   Serial.println(data);
#endif

   handleTimeCodeQuarterFrame(data);
}  // MIDI_handleTimeCodeQuarterFrame()


// MIDI message callback - tune request via MIDI
void MIDI_handleTuneRequest(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Tune Request - via MIDI");
#endif

   handleTuneRequest();
}  // MIDI_handleTuneRequest()


// read the current settings from EEPROM
void read_settings(void)
{
#ifndef DISABLE_EEPROM_READ
   byte eeprom_value, xor_value, inv_xor_value, header[5];
   byte xor_result = 0x4D;  // start with a non-zero value
   int index;

#ifdef DEBUG_EEPROM_READ
   Serial.println("");
   Serial.println("Attempting to read settings from EEPROM");
#endif

   for (int led_index = 0; led_index < ((NUM_LEDS - 14) + 5); led_index++)
   {
      EEPROM.get(led_index, eeprom_value);
      xor_result = xor_result ^ eeprom_value;

      if (led_index < 5)
      {
         header[led_index] = eeprom_value;
      }
   }

   // read the checksum & inverse checksum
   EEPROM.get((NUM_LEDS - 14) + 5, xor_value);
   EEPROM.get((NUM_LEDS - 14) + 6, inv_xor_value);

   // if the checksums match & the header values match, then we seem to have valid settings in EEPROM, so read all of the settings
   if ((xor_value == xor_result) &&
       (inv_xor_value == (byte)~xor_result) &&
       (header[0] == 'T') &&
       (header[1] == '1') &&
       (header[2] == '6') &&
       (header[3] == 'P') &&
       (header[4] == 'S'))
   {
#ifdef DEBUG_EEPROM_READ
      Serial.println("Valid settings found in EEPROM");
      Serial.println("");

      index = 0;

      Serial.print("(READ ");
      show_index(index);
      Serial.print (")                                 = ");
      Serial.println((char)header[index++]);

      Serial.print("(READ ");
      show_index(index);
      Serial.print (")                                 = ");
      Serial.println((char)header[index++]);

      Serial.print("(READ ");
      show_index(index);
      Serial.print (")                                 = ");
      Serial.println((char)header[index++]);

      Serial.print("(READ ");
      show_index(index);
      Serial.print (")                                 = ");
      Serial.println((char)header[index++]);

      Serial.print("(READ ");
      show_index(index);
      Serial.print (")                                 = ");
      Serial.println((char)header[index++]);
#else
      index = 5;
#endif

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_active_state            = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_active_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_active_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_single_state            = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_single_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_single_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_sine_state              = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_sine_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_sine_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_square_state            = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_square_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_square_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_pulse_state             = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_pulse_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_pulse_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_triangle_state          = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_triangle_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_triangle_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_saw_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_saw_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_saw_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_pulse_duty_state        = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_pulse_duty_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_pulse_duty_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_mod_samphold_state          = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_mod_samphold_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_mod_samphold_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_single_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_single_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_single_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_sine_state                 = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_sine_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_sine_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_square_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_square_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_square_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_triangle_state             = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_triangle_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_triangle_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_saw_state                  = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_saw_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_saw_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_string_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_string_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_string_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_white_state                = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_white_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_white_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_pink_state                 = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_pink_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_pink_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoA_sweep_state                = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoA_sweep_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoA_sweep_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_single_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_single_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_single_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_sine_state                 = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_sine_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_sine_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_square_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_square_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_square_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_triangle_state             = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_triangle_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_triangle_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_saw_state                  = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_saw_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_saw_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_string_state               = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_string_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_string_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_white_state                = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_white_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_white_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_pink_state                 = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_pink_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_pink_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") vfoB_glide_state                = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         vfoB_glide_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         vfoB_glide_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") env_active_state                = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         env_active_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         env_active_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_active_state           = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_active_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_active_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_single_state           = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_single_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_single_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_sine_state             = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_sine_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_sine_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_square_state           = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_square_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_square_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_pulse_state            = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_pulse_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_pulse_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_triangle_state         = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_triangle_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_triangle_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_saw_state              = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_saw_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_saw_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_pulse_duty_state       = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_pulse_duty_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_pulse_duty_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") lfo_filt_samphold_state         = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         lfo_filt_samphold_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         lfo_filt_samphold_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") filt_none_state                 = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         filt_none_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         filt_none_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") filt_lowpass_state              = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         filt_lowpass_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         filt_lowpass_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") filt_bandpass_state             = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         filt_bandpass_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         filt_bandpass_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index);
      Serial.print (") filt_highpass_state             = ");
#endif
      EEPROM.get(index, eeprom_value);
      if (eeprom_value == (index + 1))
      {
         filt_highpass_state = true;
#ifdef DEBUG_EEPROM_READ
         Serial.println("TRUE");
#endif
      } else {
         filt_highpass_state = false;
#ifdef DEBUG_EEPROM_READ
         Serial.println("FALSE");
#endif
      }
      index++;

#ifdef DEBUG_EEPROM_READ
      Serial.print("(READ ");
      show_index(index++);
      Serial.print (") checksum                        = ");
      Serial.println(xor_value);

      Serial.print("(READ ");
      show_index(index++);
      Serial.print (") inverse checksum                = ");
      Serial.println(inv_xor_value);
#endif
   } else {
#ifdef DEBUG_EEPROM_READ
      Serial.println("Invalid settings found in EEPROM");
      Serial.println("");

      Serial.print("(READ ");
      show_index((NUM_LEDS - 14) + 5);
      Serial.print  (") xor_value          = ");
      Serial.println(xor_value);
      Serial.print("(CALC) xor_result            = ");
      Serial.println(xor_result);
      Serial.print("(READ ");
      show_index((NUM_LEDS - 14) + 6);
      Serial.print  (") inv_xor_value      = ");
      Serial.println(inv_xor_value);
      Serial.print("(CALC) inv_xor_result        = ");
      Serial.println((byte)~xor_result);
#endif

      save_settings();
   }
#else
      save_settings();
#endif
}  // read_settings()


// test all of the LEDs thru the shift register at startup
void run_shiftreg_led_test(void)
{
#ifndef SKIP_LED_TEST
   bool blink = true;

   // blink the LED display & decimal points
   for (int i = 0; i <= 10; i++)
   {
      for (int i = 0; i < NUM_LEDS; i++)
      {
         *shiftreg_output_led_ref[i] = blink;
      }

      write_leds_thru_shiftreg();

      digitalWrite(MIDI_NOTE_ACTIVITY_LED_PIN, blink);
      digitalWrite(MIDI_CONTROL_ACTIVITY_LED_PIN, blink);

      delay(250);

      blink = !blink;
   }

   delay(2000);

   // turn off all LEDs
   for (int i = 0; i < NUM_LEDS; i++)
   {
      *shiftreg_output_led_ref[i] = false;
   }

   write_leds_thru_shiftreg();

   digitalWrite(MIDI_CONTROL_ACTIVITY_LED_PIN, LOW);
   digitalWrite(MIDI_NOTE_ACTIVITY_LED_PIN, LOW);

   delay(1000);

   // setup to display the firmware revision identifier
   for (int i = 0; i < 7; i++)
   {
      switch (MAJOR_REV)
      {
         case 0:
         {
            led_display_left[i] = DIGIT_0[i];
         }
         break;

         case 1:
         {
            led_display_left[i] = DIGIT_1[i];
         }
         break;

         case 2:
         {
            led_display_left[i] = DIGIT_2[i];
         }
         break;

         case 3:
         {
            led_display_left[i] = DIGIT_3[i];
         }
         break;

         case 4:
         {
            led_display_left[i] = DIGIT_4[i];
         }
         break;

         case 5:
         {
            led_display_left[i] = DIGIT_5[i];
         }
         break;

         case 6:
         {
            led_display_left[i] = DIGIT_6[i];
         }
         break;

         case 7:
         {
            led_display_left[i] = DIGIT_7[i];
         }
         break;

         case 8:
         {
            led_display_left[i] = DIGIT_8[i];
         }
         break;

         case 9:
         {
            led_display_left[i] = DIGIT_9[i];
         }
         break;
      }

      switch (MINOR_REV)
      {
         case 0:
         {
            led_display_right[i] = DIGIT_0[i];
         }
         break;

         case 1:
         {
            led_display_right[i] = DIGIT_1[i];
         }
         break;

         case 2:
         {
            led_display_right[i] = DIGIT_2[i];
         }
         break;

         case 3:
         {
            led_display_right[i] = DIGIT_3[i];
         }
         break;

         case 4:
         {
            led_display_right[i] = DIGIT_4[i];
         }
         break;

         case 5:
         {
            led_display_right[i] = DIGIT_5[i];
         }
         break;

         case 6:
         {
            led_display_right[i] = DIGIT_6[i];
         }
         break;

         case 7:
         {
            led_display_right[i] = DIGIT_7[i];
         }
         break;

         case 8:
         {
            led_display_right[i] = DIGIT_8[i];
         }
         break;

         case 9:
         {
            led_display_right[i] = DIGIT_9[i];
         }
         break;
      }
   }

   // turn on the revision level identifier decimal point
   digitalWrite(MIDI_CONTROL_ACTIVITY_LED_PIN, HIGH);

   // now display the firmware revision identifier
   write_leds_thru_shiftreg();

   delay(1000);

   // leave the state of all LEDs off
   for (int i = 0; i < NUM_LEDS; i++)
   {
      *shiftreg_output_led_ref[i] = false;
   }

   // make sure that all LEDs are off
   write_leds_thru_shiftreg();

   digitalWrite(MIDI_CONTROL_ACTIVITY_LED_PIN, LOW);
   digitalWrite(MIDI_NOTE_ACTIVITY_LED_PIN, LOW);
#endif
}  // run_shiftreg_led_test()


// save the current settings to EEPROM
void save_settings(void)
{
#ifndef DISABLE_EEPROM_WRITE
   byte xor_result = 0x4D;  // start with a non-zero value
   int index = 0;

#ifdef DEBUG_EEPROM_WRITE
   Serial.println("");
   Serial.println("Saving settings to EEPROM");
   Serial.println("");
#endif

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.println(")                                = T");
#endif
   EEPROM.put(index++, 'T');
   xor_result = xor_result ^ (byte)'T';

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.println(")                                = 1");
#endif
   EEPROM.put(index++, '1');
   xor_result = xor_result ^ (byte)'1';

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.println(")                                = 6");
#endif
   EEPROM.put(index++, '6');
   xor_result = xor_result ^ (byte)'6';

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.println(")                                = P");
#endif
   EEPROM.put(index++, 'P');
   xor_result = xor_result ^ (byte)'P';

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.println(")                                = S");
#endif
   EEPROM.put(index++, 'S');
   xor_result = xor_result ^ (byte)'S';

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_active_state           = ");
#endif
   if (lfo_mod_active_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
         Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
         Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_single_state           = ");
#endif
   if (lfo_mod_single_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_sine_state             = ");
#endif
   if (lfo_mod_sine_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_square_state           = ");
#endif
   if (lfo_mod_square_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_pulse_state            = ");
#endif
   if (lfo_mod_pulse_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_triangle_state         = ");
#endif
   if (lfo_mod_triangle_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_saw_state              = ");
#endif
   if (lfo_mod_saw_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_pulse_duty_state       = ");
#endif
   if (lfo_mod_pulse_duty_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_mod_samphold_state         = ");
#endif
   if (lfo_mod_samphold_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_single_state              = ");
#endif
   if (vfoA_single_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_sine_state                = ");
#endif
   if (vfoA_sine_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_square_state              = ");
#endif
   if (vfoA_square_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_triangle_state            = ");
#endif
   if (vfoA_triangle_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_saw_state                 = ");
#endif
   if (vfoA_saw_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_string_state              = ");
#endif
   if (vfoA_string_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_white_state               = ");
#endif
   if (vfoA_white_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_pink_state                = ");
#endif
   if (vfoA_pink_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoA_sweep_state               = ");
#endif
   if (vfoA_sweep_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_single_state              = ");
#endif
   if (vfoB_single_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_sine_state                = ");
#endif
   if (vfoB_sine_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_square_state              = ");
#endif
   if (vfoB_square_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_triangle_state            = ");
#endif
   if (vfoB_triangle_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_saw_state                 = ");
#endif
   if (vfoB_saw_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_string_state              = ");
#endif
   if (vfoB_string_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_white_state               = ");
#endif
   if (vfoB_white_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_pink_state                = ");
#endif
   if (vfoB_pink_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") vfoB_glide_state               = ");
#endif
   if (vfoB_glide_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") env_active_state               = ");
#endif
   if (env_active_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_active_state          = ");
#endif
   if (lfo_filt_active_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_single_state          = ");
#endif
   if (lfo_filt_single_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_sine_state            = ");
#endif
   if (lfo_filt_sine_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_square_state          = ");
#endif
   if (lfo_filt_square_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_pulse_state           = ");
#endif
   if (lfo_filt_pulse_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_triangle_state        = ");
#endif
   if (lfo_filt_triangle_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_saw_state             = ");
#endif
   if (lfo_filt_saw_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_pulse_duty_state      = ");
#endif
   if (lfo_filt_pulse_duty_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") lfo_filt_samphold_state        = ");
#endif
   if (lfo_filt_samphold_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") filt_none_state                = ");
#endif
   if (filt_none_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") filt_lowpass_state             = ");
#endif
   if (filt_lowpass_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") filt_bandpass_state            = ");
#endif
   if (filt_bandpass_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") filt_highpass_state            = ");
#endif
   if (filt_highpass_state == true)
   {
      EEPROM.put(index, (byte)(index + 1));
      xor_result = xor_result ^ (byte)(index + 1);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("TRUE");
#endif
   } else {
      EEPROM.put(index, (byte)(255 - index));
      xor_result = xor_result ^ (byte)(255 - index);
#ifdef DEBUG_EEPROM_WRITE
      Serial.println("FALSE");
#endif
   }
   index++;

#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") calculated XOR result          = ");
   Serial.println(xor_result);
#endif
   EEPROM.put(index++, (byte)xor_result);
   xor_result = ~xor_result;
#ifdef DEBUG_EEPROM_WRITE
   Serial.print("(WRITE ");
   show_index(index);
   Serial.print  (") calculated inverse XOR result  = ");
   Serial.println(xor_result);
#endif
   EEPROM.put(index++, (byte)xor_result);

#endif
}  // save_settings()


// set the gain level on all filter waveform generators
void set_lfo_filt_gain(void)
{
   if ((lfo_filt_active_state == true) && (lfo_filt_sine_state == true))
   {
      LFOfilterMix1_1.gain(0, ((float)(lfo_filt_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
   } else {
      LFOfilterMix1_1.gain(0, 0.0);
   }

   if ((lfo_filt_active_state == true) && (lfo_filt_square_state == true))
   {
      LFOfilterMix1_1.gain(1, ((float)(lfo_filt_square_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
   } else {
      LFOfilterMix1_1.gain(1, 0.0);
   }

   if ((lfo_filt_active_state == true) && (lfo_filt_pulse_state == true))
   {
      LFOfilterMix1_1.gain(2, ((float)(lfo_filt_pulse_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
   } else {
      LFOfilterMix1_1.gain(2, 0.0);
   }

   if ((lfo_filt_active_state == true) && (lfo_filt_triangle_state == true))
   {
      LFOfilterMix1_1.gain(3, ((float)(lfo_filt_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
   } else {
      LFOfilterMix1_1.gain(3, 0.0);
   }

   if ((lfo_filt_active_state == true) && (lfo_filt_saw_state == true))
   {
      LFOfilterMix1_2.gain(0, ((float)(lfo_filt_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
   } else {
      LFOfilterMix1_2.gain(0, 0.0);
   }

   if ((lfo_filt_active_state == true) && (lfo_filt_samphold_state == true))
   {
      LFOfilterMix1_2.gain(1, ((float)(lfo_filt_samphold_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state)));
   } else {
      LFOfilterMix1_2.gain(1, 0.0);
   }

   LFOfilterMix1_2.gain(2, 0.0);
   LFOfilterMix1_2.gain(3, 0.0);
}  // set_lfo_filt_gain()


// set the gain level on all modulation waveform generators
void set_lfo_mod_gain(void)
{
   if ((lfo_mod_active_state == true) && (lfo_mod_sine_state == true))
   {
      LFOmodMix1_1.gain(0, ((float)(lfo_mod_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
   } else {
      LFOmodMix1_1.gain(0, 0.0);
   }

   if ((lfo_mod_active_state == true) && (lfo_mod_square_state == true))
   {
      LFOmodMix1_1.gain(1, ((float)(lfo_mod_square_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
   } else {
      LFOmodMix1_1.gain(1, 0.0);
   }

   if ((lfo_mod_active_state == true) && (lfo_mod_pulse_state == true))
   {
      LFOmodMix1_1.gain(2, ((float)(lfo_mod_pulse_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
   } else {
      LFOmodMix1_1.gain(2, 0.0);
   }

   if ((lfo_mod_active_state == true) && (lfo_mod_triangle_state == true))
   {
      LFOmodMix1_1.gain(3, ((float)(lfo_mod_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
   } else {
      LFOmodMix1_1.gain(3, 0.0);
   }

   if ((lfo_mod_active_state == true) && (lfo_mod_saw_state == true))
   {
      LFOmodMix1_2.gain(0, ((float)(lfo_mod_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
   } else {
      LFOmodMix1_2.gain(0, 0.0);
   }

   if ((lfo_mod_active_state == true) && (lfo_mod_samphold_state == true))
   {
      LFOmodMix1_2.gain(1, ((float)(lfo_mod_samphold_pot - 511) / 1023.0) * (1.0 / (float)((int)lfo_mod_sine_state + (int)lfo_mod_square_state + (int)lfo_mod_pulse_state + (int)lfo_mod_triangle_state + (int)lfo_mod_saw_state  + (int)lfo_mod_samphold_state)));
   } else {
      LFOmodMix1_2.gain(1, 0.0);
   }

   LFOmodMix1_2.gain(2, 0.0);
   LFOmodMix1_2.gain(3, 0.0);
}  // set_lfo_mod_gain()


void set_vfo_filter_gain(void)
{
   if (filt_none_state)
   {
      VFOfilterMix16.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix15.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix14.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix13.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix12.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix11.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix10.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix09.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix08.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix07.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix06.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix05.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix04.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix03.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix02.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix01.gain(0, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
   } else {
      VFOfilterMix16.gain(0, 0.0);
      VFOfilterMix15.gain(0, 0.0);
      VFOfilterMix14.gain(0, 0.0);
      VFOfilterMix13.gain(0, 0.0);
      VFOfilterMix12.gain(0, 0.0);
      VFOfilterMix11.gain(0, 0.0);
      VFOfilterMix10.gain(0, 0.0);
      VFOfilterMix09.gain(0, 0.0);
      VFOfilterMix08.gain(0, 0.0);
      VFOfilterMix07.gain(0, 0.0);
      VFOfilterMix06.gain(0, 0.0);
      VFOfilterMix05.gain(0, 0.0);
      VFOfilterMix04.gain(0, 0.0);
      VFOfilterMix03.gain(0, 0.0);
      VFOfilterMix02.gain(0, 0.0);
      VFOfilterMix01.gain(0, 0.0);
   }

   if (filt_lowpass_state)
   {
      VFOfilterMix16.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix15.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix14.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix13.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix12.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix11.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix10.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix09.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix08.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix07.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix06.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix05.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix04.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix03.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix02.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix01.gain(1, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
   } else {
      VFOfilterMix16.gain(1, 0.0);
      VFOfilterMix15.gain(1, 0.0);
      VFOfilterMix14.gain(1, 0.0);
      VFOfilterMix13.gain(1, 0.0);
      VFOfilterMix12.gain(1, 0.0);
      VFOfilterMix11.gain(1, 0.0);
      VFOfilterMix10.gain(1, 0.0);
      VFOfilterMix09.gain(1, 0.0);
      VFOfilterMix08.gain(1, 0.0);
      VFOfilterMix07.gain(1, 0.0);
      VFOfilterMix06.gain(1, 0.0);
      VFOfilterMix05.gain(1, 0.0);
      VFOfilterMix04.gain(1, 0.0);
      VFOfilterMix03.gain(1, 0.0);
      VFOfilterMix02.gain(1, 0.0);
      VFOfilterMix01.gain(1, 0.0);
   }

   if (filt_bandpass_state)
   {
      VFOfilterMix16.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix15.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix14.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix13.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix12.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix11.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix10.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix09.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix08.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix07.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix06.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix05.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix04.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix03.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix02.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix01.gain(2, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
   } else {
      VFOfilterMix16.gain(2, 0.0);
      VFOfilterMix15.gain(2, 0.0);
      VFOfilterMix14.gain(2, 0.0);
      VFOfilterMix13.gain(2, 0.0);
      VFOfilterMix12.gain(2, 0.0);
      VFOfilterMix11.gain(2, 0.0);
      VFOfilterMix10.gain(2, 0.0);
      VFOfilterMix09.gain(2, 0.0);
      VFOfilterMix08.gain(2, 0.0);
      VFOfilterMix07.gain(2, 0.0);
      VFOfilterMix06.gain(2, 0.0);
      VFOfilterMix05.gain(2, 0.0);
      VFOfilterMix04.gain(2, 0.0);
      VFOfilterMix03.gain(2, 0.0);
      VFOfilterMix02.gain(2, 0.0);
      VFOfilterMix01.gain(2, 0.0);
   }

   if (filt_highpass_state)
   {
      VFOfilterMix16.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix15.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix14.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix13.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix12.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix11.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix10.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix09.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix08.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix07.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix06.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix05.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix04.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix03.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix02.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
      VFOfilterMix01.gain(3, 0.5 / ((int)filt_none_state + (int)filt_lowpass_state + (int)filt_bandpass_state + (int)filt_highpass_state));
   } else {
      VFOfilterMix16.gain(3, 0.0);
      VFOfilterMix15.gain(3, 0.0);
      VFOfilterMix14.gain(3, 0.0);
      VFOfilterMix13.gain(3, 0.0);
      VFOfilterMix12.gain(3, 0.0);
      VFOfilterMix11.gain(3, 0.0);
      VFOfilterMix10.gain(3, 0.0);
      VFOfilterMix09.gain(3, 0.0);
      VFOfilterMix08.gain(3, 0.0);
      VFOfilterMix07.gain(3, 0.0);
      VFOfilterMix06.gain(3, 0.0);
      VFOfilterMix05.gain(3, 0.0);
      VFOfilterMix04.gain(3, 0.0);
      VFOfilterMix03.gain(3, 0.0);
      VFOfilterMix02.gain(3, 0.0);
      VFOfilterMix01.gain(3, 0.0);
   }
}  // set_vfo_filter_gain()


// set the gain level on all waveform generators
void set_vfo_wave_gain(void)
{
   if (vfoA_sine_state == true)
   {
      waveMix16_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_1A.gain(0, ((float)(vfoA_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_1A.gain(0, 0.0);
      waveMix15_1A.gain(0, 0.0);
      waveMix14_1A.gain(0, 0.0);
      waveMix13_1A.gain(0, 0.0);
      waveMix12_1A.gain(0, 0.0);
      waveMix11_1A.gain(0, 0.0);
      waveMix10_1A.gain(0, 0.0);
      waveMix09_1A.gain(0, 0.0);
      waveMix08_1A.gain(0, 0.0);
      waveMix07_1A.gain(0, 0.0);
      waveMix06_1A.gain(0, 0.0);
      waveMix05_1A.gain(0, 0.0);
      waveMix04_1A.gain(0, 0.0);
      waveMix03_1A.gain(0, 0.0);
      waveMix02_1A.gain(0, 0.0);
      waveMix01_1A.gain(0, 0.0);
   }

   if (vfoA_square_state == true)
   {
      waveMix16_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_1A.gain(1, ((float)(vfoA_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_1A.gain(1, 0.0);
      waveMix15_1A.gain(1, 0.0);
      waveMix14_1A.gain(1, 0.0);
      waveMix13_1A.gain(1, 0.0);
      waveMix12_1A.gain(1, 0.0);
      waveMix11_1A.gain(1, 0.0);
      waveMix10_1A.gain(1, 0.0);
      waveMix09_1A.gain(1, 0.0);
      waveMix08_1A.gain(1, 0.0);
      waveMix07_1A.gain(1, 0.0);
      waveMix06_1A.gain(1, 0.0);
      waveMix05_1A.gain(1, 0.0);
      waveMix04_1A.gain(1, 0.0);
      waveMix03_1A.gain(1, 0.0);
      waveMix02_1A.gain(1, 0.0);
      waveMix01_1A.gain(1, 0.0);
   }

   if (vfoA_triangle_state == true)
   {
      waveMix16_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_1A.gain(2, ((float)(vfoA_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_1A.gain(2, 0.0);
      waveMix15_1A.gain(2, 0.0);
      waveMix14_1A.gain(2, 0.0);
      waveMix13_1A.gain(2, 0.0);
      waveMix12_1A.gain(2, 0.0);
      waveMix11_1A.gain(2, 0.0);
      waveMix10_1A.gain(2, 0.0);
      waveMix09_1A.gain(2, 0.0);
      waveMix08_1A.gain(2, 0.0);
      waveMix07_1A.gain(2, 0.0);
      waveMix06_1A.gain(2, 0.0);
      waveMix05_1A.gain(2, 0.0);
      waveMix04_1A.gain(2, 0.0);
      waveMix03_1A.gain(2, 0.0);
      waveMix02_1A.gain(2, 0.0);
      waveMix01_1A.gain(2, 0.0);
   }

   if (vfoA_saw_state == true)
   {
      waveMix16_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_1A.gain(3, ((float)(vfoA_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_1A.gain(3, 0.0);
      waveMix15_1A.gain(3, 0.0);
      waveMix14_1A.gain(3, 0.0);
      waveMix13_1A.gain(3, 0.0);
      waveMix12_1A.gain(3, 0.0);
      waveMix11_1A.gain(3, 0.0);
      waveMix10_1A.gain(3, 0.0);
      waveMix09_1A.gain(3, 0.0);
      waveMix08_1A.gain(3, 0.0);
      waveMix07_1A.gain(3, 0.0);
      waveMix06_1A.gain(3, 0.0);
      waveMix05_1A.gain(3, 0.0);
      waveMix04_1A.gain(3, 0.0);
      waveMix03_1A.gain(3, 0.0);
      waveMix02_1A.gain(3, 0.0);
      waveMix01_1A.gain(3, 0.0);
   }

   if (vfoA_string_state == true)
   {
      waveMix16_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_2A.gain(0, ((float)(vfoA_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_2A.gain(0, 0.0);
      waveMix15_2A.gain(0, 0.0);
      waveMix14_2A.gain(0, 0.0);
      waveMix13_2A.gain(0, 0.0);
      waveMix12_2A.gain(0, 0.0);
      waveMix11_2A.gain(0, 0.0);
      waveMix10_2A.gain(0, 0.0);
      waveMix09_2A.gain(0, 0.0);
      waveMix08_2A.gain(0, 0.0);
      waveMix07_2A.gain(0, 0.0);
      waveMix06_2A.gain(0, 0.0);
      waveMix05_2A.gain(0, 0.0);
      waveMix04_2A.gain(0, 0.0);
      waveMix03_2A.gain(0, 0.0);
      waveMix02_2A.gain(0, 0.0);
      waveMix01_2A.gain(0, 0.0);
   }

   if (vfoA_white_state == true)
   {
      waveMix16_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_2A.gain(1, ((float)(vfoA_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_2A.gain(1, 0.0);
      waveMix15_2A.gain(1, 0.0);
      waveMix14_2A.gain(1, 0.0);
      waveMix13_2A.gain(1, 0.0);
      waveMix12_2A.gain(1, 0.0);
      waveMix11_2A.gain(1, 0.0);
      waveMix10_2A.gain(1, 0.0);
      waveMix09_2A.gain(1, 0.0);
      waveMix08_2A.gain(1, 0.0);
      waveMix07_2A.gain(1, 0.0);
      waveMix06_2A.gain(1, 0.0);
      waveMix05_2A.gain(1, 0.0);
      waveMix04_2A.gain(1, 0.0);
      waveMix03_2A.gain(1, 0.0);
      waveMix02_2A.gain(1, 0.0);
      waveMix01_2A.gain(1, 0.0);
   }

   if (vfoA_pink_state == true)
   {
      waveMix16_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_2A.gain(2, ((float)(vfoA_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_2A.gain(2, 0.0);
      waveMix15_2A.gain(2, 0.0);
      waveMix14_2A.gain(2, 0.0);
      waveMix13_2A.gain(2, 0.0);
      waveMix12_2A.gain(2, 0.0);
      waveMix11_2A.gain(2, 0.0);
      waveMix10_2A.gain(2, 0.0);
      waveMix09_2A.gain(2, 0.0);
      waveMix08_2A.gain(2, 0.0);
      waveMix07_2A.gain(2, 0.0);
      waveMix06_2A.gain(2, 0.0);
      waveMix05_2A.gain(2, 0.0);
      waveMix04_2A.gain(2, 0.0);
      waveMix03_2A.gain(2, 0.0);
      waveMix02_2A.gain(2, 0.0);
      waveMix01_2A.gain(2, 0.0);
   }

   if (vfoA_sweep_state == true)
   {
      waveMix16_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix15_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix14_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix13_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix12_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix11_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix10_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix09_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix08_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix07_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix06_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix05_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix04_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix03_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix02_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
      waveMix01_2A.gain(3, (0.5 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state)));
   } else {
      waveMix16_2A.gain(3, 0.0);
      waveMix15_2A.gain(3, 0.0);
      waveMix14_2A.gain(3, 0.0);
      waveMix13_2A.gain(3, 0.0);
      waveMix12_2A.gain(3, 0.0);
      waveMix11_2A.gain(3, 0.0);
      waveMix10_2A.gain(3, 0.0);
      waveMix09_2A.gain(3, 0.0);
      waveMix08_2A.gain(3, 0.0);
      waveMix07_2A.gain(3, 0.0);
      waveMix06_2A.gain(3, 0.0);
      waveMix05_2A.gain(3, 0.0);
      waveMix04_2A.gain(3, 0.0);
      waveMix03_2A.gain(3, 0.0);
      waveMix02_2A.gain(3, 0.0);
      waveMix01_2A.gain(3, 0.0);
   }

   if (vfoB_sine_state == true)
   {
      waveMix16_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_1B.gain(0, ((float)(vfoB_sine_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_1B.gain(0, 0.0);
      waveMix15_1B.gain(0, 0.0);
      waveMix14_1B.gain(0, 0.0);
      waveMix13_1B.gain(0, 0.0);
      waveMix12_1B.gain(0, 0.0);
      waveMix11_1B.gain(0, 0.0);
      waveMix10_1B.gain(0, 0.0);
      waveMix09_1B.gain(0, 0.0);
      waveMix08_1B.gain(0, 0.0);
      waveMix07_1B.gain(0, 0.0);
      waveMix06_1B.gain(0, 0.0);
      waveMix05_1B.gain(0, 0.0);
      waveMix04_1B.gain(0, 0.0);
      waveMix03_1B.gain(0, 0.0);
      waveMix02_1B.gain(0, 0.0);
      waveMix01_1B.gain(0, 0.0);
   }

   if (vfoB_square_state == true)
   {
      waveMix16_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_1B.gain(1, ((float)(vfoB_square_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_1B.gain(1, 0.0);
      waveMix15_1B.gain(1, 0.0);
      waveMix14_1B.gain(1, 0.0);
      waveMix13_1B.gain(1, 0.0);
      waveMix12_1B.gain(1, 0.0);
      waveMix11_1B.gain(1, 0.0);
      waveMix10_1B.gain(1, 0.0);
      waveMix09_1B.gain(1, 0.0);
      waveMix08_1B.gain(1, 0.0);
      waveMix07_1B.gain(1, 0.0);
      waveMix06_1B.gain(1, 0.0);
      waveMix05_1B.gain(1, 0.0);
      waveMix04_1B.gain(1, 0.0);
      waveMix03_1B.gain(1, 0.0);
      waveMix02_1B.gain(1, 0.0);
      waveMix01_1B.gain(1, 0.0);
   }

   if (vfoB_triangle_state == true)
   {
      waveMix16_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_1B.gain(2, ((float)(vfoB_triangle_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_1B.gain(2, 0.0);
      waveMix15_1B.gain(2, 0.0);
      waveMix14_1B.gain(2, 0.0);
      waveMix13_1B.gain(2, 0.0);
      waveMix12_1B.gain(2, 0.0);
      waveMix11_1B.gain(2, 0.0);
      waveMix10_1B.gain(2, 0.0);
      waveMix09_1B.gain(2, 0.0);
      waveMix08_1B.gain(2, 0.0);
      waveMix07_1B.gain(2, 0.0);
      waveMix06_1B.gain(2, 0.0);
      waveMix05_1B.gain(2, 0.0);
      waveMix04_1B.gain(2, 0.0);
      waveMix03_1B.gain(2, 0.0);
      waveMix02_1B.gain(2, 0.0);
      waveMix01_1B.gain(2, 0.0);
   }

   if (vfoB_saw_state == true)
   {
      waveMix16_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_1B.gain(3, ((float)(vfoB_saw_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_1B.gain(3, 0.0);
      waveMix15_1B.gain(3, 0.0);
      waveMix14_1B.gain(3, 0.0);
      waveMix13_1B.gain(3, 0.0);
      waveMix12_1B.gain(3, 0.0);
      waveMix11_1B.gain(3, 0.0);
      waveMix10_1B.gain(3, 0.0);
      waveMix09_1B.gain(3, 0.0);
      waveMix08_1B.gain(3, 0.0);
      waveMix07_1B.gain(3, 0.0);
      waveMix06_1B.gain(3, 0.0);
      waveMix05_1B.gain(3, 0.0);
      waveMix04_1B.gain(3, 0.0);
      waveMix03_1B.gain(3, 0.0);
      waveMix02_1B.gain(3, 0.0);
      waveMix01_1B.gain(3, 0.0);
   }

   if (vfoB_string_state == true)
   {
      waveMix16_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_2B.gain(0, ((float)(vfoB_string_pot - 511)/ 1023.0) * (4.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_2B.gain(0, 0.0);
      waveMix15_2B.gain(0, 0.0);
      waveMix14_2B.gain(0, 0.0);
      waveMix13_2B.gain(0, 0.0);
      waveMix12_2B.gain(0, 0.0);
      waveMix11_2B.gain(0, 0.0);
      waveMix10_2B.gain(0, 0.0);
      waveMix09_2B.gain(0, 0.0);
      waveMix08_2B.gain(0, 0.0);
      waveMix07_2B.gain(0, 0.0);
      waveMix06_2B.gain(0, 0.0);
      waveMix05_2B.gain(0, 0.0);
      waveMix04_2B.gain(0, 0.0);
      waveMix03_2B.gain(0, 0.0);
      waveMix02_2B.gain(0, 0.0);
      waveMix01_2B.gain(0, 0.0);
   }

   if (vfoB_white_state == true)
   {
      waveMix16_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_2B.gain(1, ((float)(vfoB_white_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_2B.gain(1, 0.0);
      waveMix15_2B.gain(1, 0.0);
      waveMix14_2B.gain(1, 0.0);
      waveMix13_2B.gain(1, 0.0);
      waveMix12_2B.gain(1, 0.0);
      waveMix11_2B.gain(1, 0.0);
      waveMix10_2B.gain(1, 0.0);
      waveMix09_2B.gain(1, 0.0);
      waveMix08_2B.gain(1, 0.0);
      waveMix07_2B.gain(1, 0.0);
      waveMix06_2B.gain(1, 0.0);
      waveMix05_2B.gain(1, 0.0);
      waveMix04_2B.gain(1, 0.0);
      waveMix03_2B.gain(1, 0.0);
      waveMix02_2B.gain(1, 0.0);
      waveMix01_2B.gain(1, 0.0);
   }

   if (vfoB_pink_state == true)
   {
      waveMix16_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_2B.gain(2, ((float)(vfoB_pink_pot - 511) / 1023.0) * (1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_2B.gain(2, 0.0);
      waveMix15_2B.gain(2, 0.0);
      waveMix14_2B.gain(2, 0.0);
      waveMix13_2B.gain(2, 0.0);
      waveMix12_2B.gain(2, 0.0);
      waveMix11_2B.gain(2, 0.0);
      waveMix10_2B.gain(2, 0.0);
      waveMix09_2B.gain(2, 0.0);
      waveMix08_2B.gain(2, 0.0);
      waveMix07_2B.gain(2, 0.0);
      waveMix06_2B.gain(2, 0.0);
      waveMix05_2B.gain(2, 0.0);
      waveMix04_2B.gain(2, 0.0);
      waveMix03_2B.gain(2, 0.0);
      waveMix02_2B.gain(2, 0.0);
      waveMix01_2B.gain(2, 0.0);
   }

   if (vfoB_glide_state == true)
   {
      waveMix16_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix15_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix14_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix13_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix12_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix11_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix10_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix09_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix08_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix07_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix06_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix05_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix04_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix03_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix02_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
      waveMix01_2B.gain(3, (0.5 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state)));
   } else {
      waveMix16_2B.gain(3, 0.0);
      waveMix15_2B.gain(3, 0.0);
      waveMix14_2B.gain(3, 0.0);
      waveMix13_2B.gain(3, 0.0);
      waveMix12_2B.gain(3, 0.0);
      waveMix11_2B.gain(3, 0.0);
      waveMix10_2B.gain(3, 0.0);
      waveMix09_2B.gain(3, 0.0);
      waveMix08_2B.gain(3, 0.0);
      waveMix07_2B.gain(3, 0.0);
      waveMix06_2B.gain(3, 0.0);
      waveMix05_2B.gain(3, 0.0);
      waveMix04_2B.gain(3, 0.0);
      waveMix03_2B.gain(3, 0.0);
      waveMix02_2B.gain(3, 0.0);
      waveMix01_2B.gain(3, 0.0);
   }
}  // set_vfo_wave_gain()


// one-time setup
void setup()
{
   Serial.begin(57600);

   pinMode(MIDI_NOTE_ACTIVITY_LED_PIN, OUTPUT);
   pinMode(MIDI_CONTROL_ACTIVITY_LED_PIN, OUTPUT);

   usbMIDI.setHandleNoteOn(USB_handleNoteOn);
   usbMIDI.setHandleNoteOff(USB_handleNoteOff);
   usbMIDI.setHandleAfterTouchPoly(USB_handleAfterTouchPoly);
   usbMIDI.setHandleControlChange(USB_handleControlChange);
   usbMIDI.setHandleProgramChange(USB_handleProgramChange);
   usbMIDI.setHandleAfterTouchChannel(USB_handleAfterTouchChannel);
   usbMIDI.setHandlePitchChange(USB_handlePitchBend);
   usbMIDI.setHandleSystemExclusive(USB_handleSystemExclusive);
   usbMIDI.setHandleTimeCodeQuarterFrame(USB_handleTimeCodeQuarterFrame);
   usbMIDI.setHandleSongPosition(USB_handleSongPosition);
   usbMIDI.setHandleSongSelect(USB_handleSongSelect);
   usbMIDI.setHandleTuneRequest(USB_handleTuneRequest);
   usbMIDI.setHandleClock(USB_handleClock);
   usbMIDI.setHandleStart(USB_handleStart);
   usbMIDI.setHandleContinue(USB_handleContinue);
   usbMIDI.setHandleStop(USB_handleStop);
   usbMIDI.setHandleActiveSensing(USB_handleActiveSensing);
   usbMIDI.setHandleSystemReset(USB_handleSystemReset);

   MIDI.setHandleNoteOn(MIDI_handleNoteOn);  // Put only the name of the function
   MIDI.setHandleNoteOff(MIDI_handleNoteOff);
   MIDI.setHandleAfterTouchPoly(MIDI_handleAfterTouchPoly);
   MIDI.setHandleControlChange(MIDI_handleControlChange);
   MIDI.setHandleProgramChange(MIDI_handleProgramChange);
   MIDI.setHandleAfterTouchChannel(MIDI_handleAfterTouchChannel);
   MIDI.setHandlePitchBend(MIDI_handlePitchBend);
   MIDI.setHandleSystemExclusive(MIDI_handleSystemExclusive);
   MIDI.setHandleTimeCodeQuarterFrame(MIDI_handleTimeCodeQuarterFrame);
   MIDI.setHandleSongPosition(MIDI_handleSongPosition);
   MIDI.setHandleSongSelect(MIDI_handleSongSelect);
   MIDI.setHandleTuneRequest(MIDI_handleTuneRequest);
   MIDI.setHandleClock(MIDI_handleClock);
   MIDI.setHandleStart(MIDI_handleStart);
   MIDI.setHandleContinue(MIDI_handleContinue);
   MIDI.setHandleStop(MIDI_handleStop);
   MIDI.setHandleActiveSensing(MIDI_handleActiveSensing);
   MIDI.setHandleSystemReset(MIDI_handleSystemReset);

   usbhostMIDI.setHandleNoteOn(USB_handleNoteOn);
   usbhostMIDI.setHandleNoteOff(USB_handleNoteOff);
   usbhostMIDI.setHandleAfterTouchPoly(USB_handleAfterTouchPoly);
   usbhostMIDI.setHandleControlChange(USB_handleControlChange);
   usbhostMIDI.setHandleProgramChange(USB_handleProgramChange);
   usbhostMIDI.setHandleAfterTouchChannel(USB_handleAfterTouchChannel);
   usbhostMIDI.setHandlePitchChange(USB_handlePitchBend);
   usbhostMIDI.setHandleSystemExclusive(USB_handleSystemExclusive);
   usbhostMIDI.setHandleTimeCodeQuarterFrame(USB_handleTimeCodeQuarterFrame);
   usbhostMIDI.setHandleSongPosition(USB_handleSongPosition);
   usbhostMIDI.setHandleSongSelect(USB_handleSongSelect);
   usbhostMIDI.setHandleTuneRequest(USB_handleTuneRequest);
   usbhostMIDI.setHandleClock(USB_handleClock);
   usbhostMIDI.setHandleStart(USB_handleStart);
   usbhostMIDI.setHandleContinue(USB_handleContinue);
   usbhostMIDI.setHandleStop(USB_handleStop);
   usbhostMIDI.setHandleActiveSensing(USB_handleActiveSensing);
   usbhostMIDI.setHandleSystemReset(USB_handleSystemReset);

   pinMode(PRIMARY_MUX_DECODE_BIT3_PIN, OUTPUT);
   pinMode(PRIMARY_MUX_DECODE_BIT2_PIN, OUTPUT);
   pinMode(PRIMARY_MUX_DECODE_BIT1_PIN, OUTPUT);
   pinMode(PRIMARY_MUX_DECODE_BIT0_PIN, OUTPUT);

   pinMode(SECONDARY_MUX_DECODE_BIT3_PIN, OUTPUT);
   pinMode(SECONDARY_MUX_DECODE_BIT2_PIN, OUTPUT);
   pinMode(SECONDARY_MUX_DECODE_BIT1_PIN, OUTPUT);
   pinMode(SECONDARY_MUX_DECODE_BIT0_PIN, OUTPUT);

   pinMode(AUDIO_VOLUME_PIN, INPUT);

   pinMode(SHIFTREG_DATA_PIN, OUTPUT);
   pinMode(SHIFTREG_CLOCK_PIN, OUTPUT);
   pinMode(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, OUTPUT);

   // leave the shift register clock & data inactive
   digitalWrite(SHIFTREG_DATA_PIN, LOW);
   digitalWrite(SHIFTREG_CLOCK_PIN, LOW);

   // set the LED output enable initially to full brightness
   analogWrite(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, 0);

   pinMode(MUX_LOW_ENABLE_PIN, OUTPUT);

   // leave the MUXs disabled
   digitalWrite(MUX_LOW_ENABLE_PIN, HIGH);

   led_intensity_pot = 1023;
   led_intensity = 63;

   analogWrite(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, (255 - led_intensity));

   run_shiftreg_led_test();

   Serial.println(TITLE);
   Serial.println(DEVICE);
   Serial.println(VERDAT);
   Serial.println(AUTHOR);
   Serial.println("");
   Serial.println("");

   midi_note_activity_state = false;
   midi_control_activity_state = false;

   defaults();

   led_intensity_pot = 1023;
   led_intensity = 63;

   analogWrite(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, (255 - led_intensity));

   for (int i = 0; i < 7; i++)
   {
      led_display_left[i] = DIGIT_A[i];
      led_display_right[i] = DIGIT_LL[i];
   }

   // try to read the settings from EEPROM
   read_settings();

   AudioNoInterrupts();

   AudioMemory(120);

//   USBamp.gain(4.0);

   sgtl5000_1.enable();


   if (vfoA_sine_state)
   {
      VFOsine16A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine15A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine14A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine13A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine12A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine11A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine10A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine09A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine08A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine07A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine06A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine05A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine04A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine03A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine02A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsine01A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
   } else {
      VFOsine16A.amplitude(0.0);
      VFOsine15A.amplitude(0.0);
      VFOsine14A.amplitude(0.0);
      VFOsine13A.amplitude(0.0);
      VFOsine12A.amplitude(0.0);
      VFOsine11A.amplitude(0.0);
      VFOsine10A.amplitude(0.0);
      VFOsine09A.amplitude(0.0);
      VFOsine08A.amplitude(0.0);
      VFOsine07A.amplitude(0.0);
      VFOsine06A.amplitude(0.0);
      VFOsine05A.amplitude(0.0);
      VFOsine04A.amplitude(0.0);
      VFOsine03A.amplitude(0.0);
      VFOsine02A.amplitude(0.0);
      VFOsine01A.amplitude(0.0);
   }


   if (vfoA_square_state)
   {
      VFOsquare16A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare15A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare14A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare13A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare12A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare11A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare10A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare09A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare08A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare07A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare06A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare05A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare04A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare03A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare02A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsquare01A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
   } else {
      VFOsquare16A.amplitude(0.0);
      VFOsquare15A.amplitude(0.0);
      VFOsquare14A.amplitude(0.0);
      VFOsquare13A.amplitude(0.0);
      VFOsquare12A.amplitude(0.0);
      VFOsquare11A.amplitude(0.0);
      VFOsquare10A.amplitude(0.0);
      VFOsquare08A.amplitude(0.0);
      VFOsquare07A.amplitude(0.0);
      VFOsquare06A.amplitude(0.0);
      VFOsquare05A.amplitude(0.0);
      VFOsquare04A.amplitude(0.0);
      VFOsquare03A.amplitude(0.0);
      VFOsquare02A.amplitude(0.0);
      VFOsquare01A.amplitude(0.0);
   }


   if (vfoA_triangle_state)
   {
      VFOtriangle16A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle15A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle14A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle13A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle12A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle11A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle10A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle09A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle08A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle07A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle06A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle05A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle04A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle03A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle02A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOtriangle01A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
   } else {
      VFOtriangle16A.amplitude(0.0);
      VFOtriangle15A.amplitude(0.0);
      VFOtriangle14A.amplitude(0.0);
      VFOtriangle13A.amplitude(0.0);
      VFOtriangle12A.amplitude(0.0);
      VFOtriangle11A.amplitude(0.0);
      VFOtriangle10A.amplitude(0.0);
      VFOtriangle09A.amplitude(0.0);
      VFOtriangle08A.amplitude(0.0);
      VFOtriangle07A.amplitude(0.0);
      VFOtriangle06A.amplitude(0.0);
      VFOtriangle05A.amplitude(0.0);
      VFOtriangle03A.amplitude(0.0);
      VFOtriangle02A.amplitude(0.0);
      VFOtriangle01A.amplitude(0.0);
   }


   if (vfoA_saw_state)
   {
      VFOsaw16A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw15A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw14A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw13A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw12A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw11A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw10A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw09A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw08A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw07A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw06A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw05A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw04A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw03A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw02A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOsaw01A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
   } else {
      VFOsaw16A.amplitude(0.0);
      VFOsaw15A.amplitude(0.0);
      VFOsaw14A.amplitude(0.0);
      VFOsaw13A.amplitude(0.0);
      VFOsaw12A.amplitude(0.0);
      VFOsaw11A.amplitude(0.0);
      VFOsaw10A.amplitude(0.0);
      VFOsaw09A.amplitude(0.0);
      VFOsaw08A.amplitude(0.0);
      VFOsaw07A.amplitude(0.0);
      VFOsaw06A.amplitude(0.0);
      VFOsaw05A.amplitude(0.0);
      VFOsaw04A.amplitude(0.0);
      VFOsaw03A.amplitude(0.0);
      VFOsaw02A.amplitude(0.0);
      VFOsaw01A.amplitude(0.0);
   }


   if (vfoA_white_state)
   {
      VFOwhite16A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite15A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite14A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite13A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite12A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite11A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite10A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite09A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite08A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite07A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite06A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite05A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite04A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite03A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite02A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOwhite01A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
   } else {
      VFOwhite16A.amplitude(0.0);
      VFOwhite15A.amplitude(0.0);
      VFOwhite14A.amplitude(0.0);
      VFOwhite13A.amplitude(0.0);
      VFOwhite12A.amplitude(0.0);
      VFOwhite11A.amplitude(0.0);
      VFOwhite10A.amplitude(0.0);
      VFOwhite09A.amplitude(0.0);
      VFOwhite08A.amplitude(0.0);
      VFOwhite07A.amplitude(0.0);
      VFOwhite06A.amplitude(0.0);
      VFOwhite05A.amplitude(0.0);
      VFOwhite04A.amplitude(0.0);
      VFOwhite03A.amplitude(0.0);
      VFOwhite02A.amplitude(0.0);
      VFOwhite01A.amplitude(0.0);
   }


   if (vfoA_pink_state)
   {
      VFOpink16A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink15A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink14A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink13A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink12A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink11A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink10A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink09A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink08A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink07A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink06A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink05A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink04A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink03A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink02A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
      VFOpink01A.amplitude(1.0 / (float)((int)vfoA_sine_state + (int)vfoA_square_state + (int)vfoA_triangle_state + (int)vfoA_saw_state + (int)vfoA_string_state + (int)vfoA_white_state + (int)vfoA_pink_state + (int)vfoA_sweep_state));
   } else {
      VFOpink16A.amplitude(0.0);
      VFOpink15A.amplitude(0.0);
      VFOpink14A.amplitude(0.0);
      VFOpink13A.amplitude(0.0);
      VFOpink12A.amplitude(0.0);
      VFOpink11A.amplitude(0.0);
      VFOpink10A.amplitude(0.0);
      VFOpink09A.amplitude(0.0);
      VFOpink08A.amplitude(0.0);
      VFOpink07A.amplitude(0.0);
      VFOpink06A.amplitude(0.0);
      VFOpink05A.amplitude(0.0);
      VFOpink04A.amplitude(0.0);
      VFOpink03A.amplitude(0.0);
      VFOpink02A.amplitude(0.0);
      VFOpink01A.amplitude(0.0);
   }


   if (vfoB_sine_state)
   {
      VFOsine16B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine15B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine14B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine13B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine12B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine11B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine10B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine09B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine08B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine07B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine06B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine05B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine04B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine03B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine02B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsine01B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
   } else {
      VFOsine16B.amplitude(0.0);
      VFOsine15B.amplitude(0.0);
      VFOsine14B.amplitude(0.0);
      VFOsine13B.amplitude(0.0);
      VFOsine12B.amplitude(0.0);
      VFOsine11B.amplitude(0.0);
      VFOsine10B.amplitude(0.0);
      VFOsine09B.amplitude(0.0);
      VFOsine08B.amplitude(0.0);
      VFOsine07B.amplitude(0.0);
      VFOsine06B.amplitude(0.0);
      VFOsine05B.amplitude(0.0);
      VFOsine04B.amplitude(0.0);
      VFOsine03B.amplitude(0.0);
      VFOsine02B.amplitude(0.0);
      VFOsine01B.amplitude(0.0);
   }


   if (vfoB_square_state)
   {
      VFOsquare16B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare15B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare14B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare13B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare12B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare11B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare10B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare09B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare08B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare07B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare06B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare05B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare04B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare03B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare02B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsquare01B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
   } else {
      VFOsquare16B.amplitude(0.0);
      VFOsquare15B.amplitude(0.0);
      VFOsquare14B.amplitude(0.0);
      VFOsquare13B.amplitude(0.0);
      VFOsquare12B.amplitude(0.0);
      VFOsquare11B.amplitude(0.0);
      VFOsquare10B.amplitude(0.0);
      VFOsquare09B.amplitude(0.0);
      VFOsquare08B.amplitude(0.0);
      VFOsquare07B.amplitude(0.0);
      VFOsquare06B.amplitude(0.0);
      VFOsquare05B.amplitude(0.0);
      VFOsquare04B.amplitude(0.0);
      VFOsquare03B.amplitude(0.0);
      VFOsquare02B.amplitude(0.0);
      VFOsquare01B.amplitude(0.0);
   }


   if (vfoB_triangle_state)
   {
      VFOtriangle16B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle15B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle14B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle13B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle12B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle11B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle10B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle09B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle08B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle07B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle06B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle05B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle04B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle03B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle02B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOtriangle01B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
   } else {
      VFOtriangle16B.amplitude(0.0);
      VFOtriangle15B.amplitude(0.0);
      VFOtriangle14B.amplitude(0.0);
      VFOtriangle13B.amplitude(0.0);
      VFOtriangle12B.amplitude(0.0);
      VFOtriangle11B.amplitude(0.0);
      VFOtriangle10B.amplitude(0.0);
      VFOtriangle09B.amplitude(0.0);
      VFOtriangle08B.amplitude(0.0);
      VFOtriangle07B.amplitude(0.0);
      VFOtriangle06B.amplitude(0.0);
      VFOtriangle05B.amplitude(0.0);
      VFOtriangle04B.amplitude(0.0);
      VFOtriangle03B.amplitude(0.0);
      VFOtriangle02B.amplitude(0.0);
      VFOtriangle01B.amplitude(0.0);
   }


   if (vfoB_saw_state)
   {
      VFOsaw16B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw15B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw14B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw13B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw12B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw11B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw10B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw09B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw08B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw07B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw06B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw05B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw04B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw03B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw02B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOsaw01B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
   } else {
      VFOsaw16B.amplitude(0.0);
      VFOsaw15B.amplitude(0.0);
      VFOsaw14B.amplitude(0.0);
      VFOsaw13B.amplitude(0.0);
      VFOsaw12B.amplitude(0.0);
      VFOsaw11B.amplitude(0.0);
      VFOsaw10B.amplitude(0.0);
      VFOsaw09B.amplitude(0.0);
      VFOsaw08B.amplitude(0.0);
      VFOsaw07B.amplitude(0.0);
      VFOsaw06B.amplitude(0.0);
      VFOsaw05B.amplitude(0.0);
      VFOsaw04B.amplitude(0.0);
      VFOsaw03B.amplitude(0.0);
      VFOsaw02B.amplitude(0.0);
      VFOsaw01B.amplitude(0.0);
   }


   if (vfoB_white_state)
   {
      VFOwhite16B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite15B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite14B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite13B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite12B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite11B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite10B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite09B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite08B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite07B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite06B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite05B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite04B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite03B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite02B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOwhite01B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
   } else {
      VFOwhite16B.amplitude(0.0);
      VFOwhite15B.amplitude(0.0);
      VFOwhite14B.amplitude(0.0);
      VFOwhite13B.amplitude(0.0);
      VFOwhite12B.amplitude(0.0);
      VFOwhite11B.amplitude(0.0);
      VFOwhite10B.amplitude(0.0);
      VFOwhite09B.amplitude(0.0);
      VFOwhite08B.amplitude(0.0);
      VFOwhite07B.amplitude(0.0);
      VFOwhite06B.amplitude(0.0);
      VFOwhite05B.amplitude(0.0);
      VFOwhite04B.amplitude(0.0);
      VFOwhite03B.amplitude(0.0);
      VFOwhite02B.amplitude(0.0);
      VFOwhite01B.amplitude(0.0);
   }


   if (vfoB_pink_state)
   {
      VFOpink16B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink15B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink14B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink13B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink12B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink11B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink10B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink09B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink08B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink07B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink06B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink05B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink04B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink03B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink02B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
      VFOpink01B.amplitude(1.0 / (float)((int)vfoB_sine_state + (int)vfoB_square_state + (int)vfoB_triangle_state + (int)vfoB_saw_state + (int)vfoB_string_state + (int)vfoB_white_state + (int)vfoB_pink_state + (int)vfoB_glide_state));
   } else {
      VFOpink16B.amplitude(0.0);
      VFOpink15B.amplitude(0.0);
      VFOpink14B.amplitude(0.0);
      VFOpink13B.amplitude(0.0);
      VFOpink12B.amplitude(0.0);
      VFOpink11B.amplitude(0.0);
      VFOpink10B.amplitude(0.0);
      VFOpink09B.amplitude(0.0);
      VFOpink08B.amplitude(0.0);
      VFOpink07B.amplitude(0.0);
      VFOpink06B.amplitude(0.0);
      VFOpink05B.amplitude(0.0);
      VFOpink04B.amplitude(0.0);
      VFOpink03B.amplitude(0.0);
      VFOpink02B.amplitude(0.0);
      VFOpink01B.amplitude(0.0);
   }


   VFOsine16A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare16A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle16A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw16A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine16B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare16B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle16B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw16B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine15A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare15A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle15A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw15A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine15B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare15B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle15B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw15B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine14A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare14A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle14A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw14A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine14B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare14B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle14B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw14B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine13A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare13A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle13A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw13A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine13B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare13B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle13B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw13B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine12A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare12A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle12A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw12A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine12B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare12B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle12B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw12B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine11A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare11A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle11A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw11A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine11B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare11B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle11B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw11B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine10A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare10A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle10A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw10A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine10B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare10B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle10B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw10B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine09A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare09A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle09A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw09A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine09B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare09B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle09B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw09B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine08A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare08A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle08A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw08A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine08B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare08B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle08B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw08B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine07A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare07A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle07A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw07A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine07B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare07B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle07B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw07B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine06A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare06A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle06A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw06A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine06B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare06B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle06B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw06B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine05A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare05A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle05A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw05A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine05B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare05B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle05B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw05B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine04A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare04A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle04A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw04A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine04B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare04B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle04B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw04B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine03A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare03A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle03A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw03A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine03B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare03B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle03B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw03B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine02A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare02A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle02A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw02A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine02B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare02B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle02B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw02B.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine01A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare01A.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle01A.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw01A.frequencyModulation(pitch_multiplier * 2.0);

   VFOsine01B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsquare01B.frequencyModulation(pitch_multiplier * 2.0);
   VFOtriangle01B.frequencyModulation(pitch_multiplier * 2.0);
   VFOsaw01B.frequencyModulation(pitch_multiplier * 2.0);


   VFOsine16A.begin(WAVEFORM_SINE);
   VFOsquare16A.begin(WAVEFORM_SQUARE);
   VFOtriangle16A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw16A.begin(WAVEFORM_SAWTOOTH);

   VFOsine16B.begin(WAVEFORM_SINE);
   VFOsquare16B.begin(WAVEFORM_SQUARE);
   VFOtriangle16B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw16B.begin(WAVEFORM_SAWTOOTH);

   VFOsine15A.begin(WAVEFORM_SINE);
   VFOsquare15A.begin(WAVEFORM_SQUARE);
   VFOtriangle15A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw15A.begin(WAVEFORM_SAWTOOTH);

   VFOsine15B.begin(WAVEFORM_SINE);
   VFOsquare15B.begin(WAVEFORM_SQUARE);
   VFOtriangle15B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw15B.begin(WAVEFORM_SAWTOOTH);

   VFOsine14A.begin(WAVEFORM_SINE);
   VFOsquare14A.begin(WAVEFORM_SQUARE);
   VFOtriangle14A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw14A.begin(WAVEFORM_SAWTOOTH);

   VFOsine14B.begin(WAVEFORM_SINE);
   VFOsquare14B.begin(WAVEFORM_SQUARE);
   VFOtriangle14B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw14B.begin(WAVEFORM_SAWTOOTH);

   VFOsine13A.begin(WAVEFORM_SINE);
   VFOsquare13A.begin(WAVEFORM_SQUARE);
   VFOtriangle13A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw13A.begin(WAVEFORM_SAWTOOTH);

   VFOsine13B.begin(WAVEFORM_SINE);
   VFOsquare13B.begin(WAVEFORM_SQUARE);
   VFOtriangle13B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw13B.begin(WAVEFORM_SAWTOOTH);

   VFOsine12A.begin(WAVEFORM_SINE);
   VFOsquare12A.begin(WAVEFORM_SQUARE);
   VFOtriangle12A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw12A.begin(WAVEFORM_SAWTOOTH);

   VFOsine12B.begin(WAVEFORM_SINE);
   VFOsquare12B.begin(WAVEFORM_SQUARE);
   VFOtriangle12B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw12B.begin(WAVEFORM_SAWTOOTH);

   VFOsine11A.begin(WAVEFORM_SINE);
   VFOsquare11A.begin(WAVEFORM_SQUARE);
   VFOtriangle11A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw11A.begin(WAVEFORM_SAWTOOTH);

   VFOsine11B.begin(WAVEFORM_SINE);
   VFOsquare11B.begin(WAVEFORM_SQUARE);
   VFOtriangle11B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw11B.begin(WAVEFORM_SAWTOOTH);

   VFOsine10A.begin(WAVEFORM_SINE);
   VFOsquare10A.begin(WAVEFORM_SQUARE);
   VFOtriangle10A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw10A.begin(WAVEFORM_SAWTOOTH);

   VFOsine10B.begin(WAVEFORM_SINE);
   VFOsquare10B.begin(WAVEFORM_SQUARE);
   VFOtriangle10B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw10B.begin(WAVEFORM_SAWTOOTH);

   VFOsine09A.begin(WAVEFORM_SINE);
   VFOsquare09A.begin(WAVEFORM_SQUARE);
   VFOtriangle09A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw09A.begin(WAVEFORM_SAWTOOTH);

   VFOsine09B.begin(WAVEFORM_SINE);
   VFOsquare09B.begin(WAVEFORM_SQUARE);
   VFOtriangle09B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw09B.begin(WAVEFORM_SAWTOOTH);

   VFOsine08A.begin(WAVEFORM_SINE);
   VFOsquare08A.begin(WAVEFORM_SQUARE);
   VFOtriangle08A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw08A.begin(WAVEFORM_SAWTOOTH);

   VFOsine08B.begin(WAVEFORM_SINE);
   VFOsquare08B.begin(WAVEFORM_SQUARE);
   VFOtriangle08B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw08B.begin(WAVEFORM_SAWTOOTH);

   VFOsine07A.begin(WAVEFORM_SINE);
   VFOsquare07A.begin(WAVEFORM_SQUARE);
   VFOtriangle07A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw07A.begin(WAVEFORM_SAWTOOTH);

   VFOsine07B.begin(WAVEFORM_SINE);
   VFOsquare07B.begin(WAVEFORM_SQUARE);
   VFOtriangle07B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw07B.begin(WAVEFORM_SAWTOOTH);

   VFOsine06A.begin(WAVEFORM_SINE);
   VFOsquare06A.begin(WAVEFORM_SQUARE);
   VFOtriangle06A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw06A.begin(WAVEFORM_SAWTOOTH);

   VFOsine06B.begin(WAVEFORM_SINE);
   VFOsquare06B.begin(WAVEFORM_SQUARE);
   VFOtriangle06B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw06B.begin(WAVEFORM_SAWTOOTH);

   VFOsine05A.begin(WAVEFORM_SINE);
   VFOsquare05A.begin(WAVEFORM_SQUARE);
   VFOtriangle05A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw05A.begin(WAVEFORM_SAWTOOTH);

   VFOsine05B.begin(WAVEFORM_SINE);
   VFOsquare05B.begin(WAVEFORM_SQUARE);
   VFOtriangle05B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw05B.begin(WAVEFORM_SAWTOOTH);

   VFOsine04A.begin(WAVEFORM_SINE);
   VFOsquare04A.begin(WAVEFORM_SQUARE);
   VFOtriangle04A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw04A.begin(WAVEFORM_SAWTOOTH);

   VFOsine04B.begin(WAVEFORM_SINE);
   VFOsquare04B.begin(WAVEFORM_SQUARE);
   VFOtriangle04B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw04B.begin(WAVEFORM_SAWTOOTH);

   VFOsine03A.begin(WAVEFORM_SINE);
   VFOsquare03A.begin(WAVEFORM_SQUARE);
   VFOtriangle03A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw03A.begin(WAVEFORM_SAWTOOTH);

   VFOsine03B.begin(WAVEFORM_SINE);
   VFOsquare03B.begin(WAVEFORM_SQUARE);
   VFOtriangle03B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw03B.begin(WAVEFORM_SAWTOOTH);

   VFOsine02A.begin(WAVEFORM_SINE);
   VFOsquare02A.begin(WAVEFORM_SQUARE);
   VFOtriangle02A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw02A.begin(WAVEFORM_SAWTOOTH);

   VFOsine02B.begin(WAVEFORM_SINE);
   VFOsquare02B.begin(WAVEFORM_SQUARE);
   VFOtriangle02B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw02B.begin(WAVEFORM_SAWTOOTH);

   VFOsine01A.begin(WAVEFORM_SINE);
   VFOsquare01A.begin(WAVEFORM_SQUARE);
   VFOtriangle01A.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw01A.begin(WAVEFORM_SAWTOOTH);

   VFOsine01B.begin(WAVEFORM_SINE);
   VFOsquare01B.begin(WAVEFORM_SQUARE);
   VFOtriangle01B.begin(WAVEFORM_TRIANGLE_VARIABLE);
   VFOsaw01B.begin(WAVEFORM_SAWTOOTH);

   set_vfo_wave_gain();

   set_vfo_filter_gain();

   if (env_active_state)
   {
      VFOenvelopeMix16.gain(0, 0.0);
      VFOenvelopeMix16.gain(1, 1.0);
      VFOenvelopeMix15.gain(0, 0.0);
      VFOenvelopeMix15.gain(1, 1.0);
      VFOenvelopeMix14.gain(0, 0.0);
      VFOenvelopeMix14.gain(1, 1.0);
      VFOenvelopeMix13.gain(0, 0.0);
      VFOenvelopeMix13.gain(1, 1.0);
      VFOenvelopeMix12.gain(0, 0.0);
      VFOenvelopeMix12.gain(1, 1.0);
      VFOenvelopeMix11.gain(0, 0.0);
      VFOenvelopeMix11.gain(1, 1.0);
      VFOenvelopeMix10.gain(0, 0.0);
      VFOenvelopeMix10.gain(1, 1.0);
      VFOenvelopeMix09.gain(0, 0.0);
      VFOenvelopeMix09.gain(1, 1.0);
      VFOenvelopeMix08.gain(0, 0.0);
      VFOenvelopeMix08.gain(1, 1.0);
      VFOenvelopeMix07.gain(0, 0.0);
      VFOenvelopeMix07.gain(1, 1.0);
      VFOenvelopeMix06.gain(0, 0.0);
      VFOenvelopeMix06.gain(1, 1.0);
      VFOenvelopeMix05.gain(0, 0.0);
      VFOenvelopeMix05.gain(1, 1.0);
      VFOenvelopeMix04.gain(0, 0.0);
      VFOenvelopeMix04.gain(1, 1.0);
      VFOenvelopeMix03.gain(0, 0.0);
      VFOenvelopeMix03.gain(1, 1.0);
      VFOenvelopeMix02.gain(0, 0.0);
      VFOenvelopeMix02.gain(1, 1.0);
      VFOenvelopeMix01.gain(0, 0.0);
      VFOenvelopeMix01.gain(1, 1.0);
   } else {
      VFOenvelopeMix16.gain(0, 1.0);
      VFOenvelopeMix16.gain(1, 0.0);
      VFOenvelopeMix15.gain(0, 1.0);
      VFOenvelopeMix15.gain(1, 0.0);
      VFOenvelopeMix14.gain(0, 1.0);
      VFOenvelopeMix14.gain(1, 0.0);
      VFOenvelopeMix13.gain(0, 1.0);
      VFOenvelopeMix13.gain(1, 0.0);
      VFOenvelopeMix12.gain(0, 1.0);
      VFOenvelopeMix12.gain(1, 0.0);
      VFOenvelopeMix11.gain(0, 1.0);
      VFOenvelopeMix11.gain(1, 0.0);
      VFOenvelopeMix10.gain(0, 1.0);
      VFOenvelopeMix10.gain(1, 0.0);
      VFOenvelopeMix09.gain(0, 1.0);
      VFOenvelopeMix09.gain(1, 0.0);
      VFOenvelopeMix08.gain(0, 1.0);
      VFOenvelopeMix08.gain(1, 0.0);
      VFOenvelopeMix07.gain(0, 1.0);
      VFOenvelopeMix07.gain(1, 0.0);
      VFOenvelopeMix06.gain(0, 1.0);
      VFOenvelopeMix06.gain(1, 0.0);
      VFOenvelopeMix05.gain(0, 1.0);
      VFOenvelopeMix05.gain(1, 0.0);
      VFOenvelopeMix04.gain(0, 1.0);
      VFOenvelopeMix04.gain(1, 0.0);
      VFOenvelopeMix03.gain(0, 1.0);
      VFOenvelopeMix03.gain(1, 0.0);
      VFOenvelopeMix02.gain(0, 1.0);
      VFOenvelopeMix02.gain(1, 0.0);
      VFOenvelopeMix01.gain(0, 1.0);
      VFOenvelopeMix01.gain(1, 0.0);
   }

   VFOenvelopeMix16.gain(2, 0.0);
   VFOenvelopeMix16.gain(3, 0.0);
   VFOenvelopeMix15.gain(2, 0.0);
   VFOenvelopeMix15.gain(3, 0.0);
   VFOenvelopeMix14.gain(2, 0.0);
   VFOenvelopeMix14.gain(3, 0.0);
   VFOenvelopeMix13.gain(2, 0.0);
   VFOenvelopeMix13.gain(3, 0.0);
   VFOenvelopeMix12.gain(2, 0.0);
   VFOenvelopeMix12.gain(3, 0.0);
   VFOenvelopeMix11.gain(2, 0.0);
   VFOenvelopeMix11.gain(3, 0.0);
   VFOenvelopeMix10.gain(2, 0.0);
   VFOenvelopeMix10.gain(3, 0.0);
   VFOenvelopeMix09.gain(2, 0.0);
   VFOenvelopeMix09.gain(3, 0.0);
   VFOenvelopeMix08.gain(2, 0.0);
   VFOenvelopeMix08.gain(3, 0.0);
   VFOenvelopeMix07.gain(2, 0.0);
   VFOenvelopeMix07.gain(3, 0.0);
   VFOenvelopeMix06.gain(2, 0.0);
   VFOenvelopeMix06.gain(3, 0.0);
   VFOenvelopeMix05.gain(2, 0.0);
   VFOenvelopeMix05.gain(3, 0.0);
   VFOenvelopeMix04.gain(2, 0.0);
   VFOenvelopeMix04.gain(3, 0.0);
   VFOenvelopeMix03.gain(2, 0.0);
   VFOenvelopeMix03.gain(3, 0.0);
   VFOenvelopeMix02.gain(2, 0.0);
   VFOenvelopeMix02.gain(3, 0.0);
   VFOenvelopeMix01.gain(2, 0.0);
   VFOenvelopeMix01.gain(3, 0.0);


   LFOsineFilter.frequency(0.0);
   LFOsquareFilter.frequency(0.0);
   LFOpulseFilter.frequency(0.0);
   LFOtriangleFilter.frequency(0.0);
   LFOsawFilter.frequency(0.0);
   LFOsampleholdFilter.frequency(0.0);

   LFOsineFilter.amplitude(1.0);
   LFOsquareFilter.amplitude(1.0);
   LFOpulseFilter.amplitude(1.0);
   LFOtriangleFilter.amplitude(1.0);
   LFOsawFilter.amplitude(1.0);
   LFOsampleholdFilter.amplitude(1.0);

   LFOsineFilter.begin(WAVEFORM_SINE);
   LFOsquareFilter.begin(WAVEFORM_SQUARE);
   LFOpulseFilter.begin(WAVEFORM_PULSE);
   LFOtriangleFilter.begin(WAVEFORM_TRIANGLE_VARIABLE);
   LFOsawFilter.begin(WAVEFORM_SAWTOOTH);
   LFOsampleholdFilter.begin(WAVEFORM_SAMPLE_HOLD);

   if (lfo_filt_sine_state)
   {
      LFOfilterMix1_1.gain(0, 1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state));
   } else {
      LFOfilterMix1_1.gain(0, 0.0);
   }
   if (lfo_filt_square_state)
   {
      LFOfilterMix1_1.gain(1, 1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state));
   } else {
      LFOfilterMix1_1.gain(1, 0.0);
   }
   if (lfo_filt_pulse_state)
   {
      LFOfilterMix1_1.gain(2, 1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state));
   } else {
      LFOfilterMix1_1.gain(2, 0.0);
   }
   if (lfo_filt_triangle_state)
   {
      LFOfilterMix1_1.gain(3, 1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state));
   } else {
      LFOfilterMix1_1.gain(3, 0.0);
   }
   if (lfo_filt_saw_state)
   {
      LFOfilterMix1_2.gain(0, 1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state));
   } else {
      LFOfilterMix1_2.gain(0, 0.0);
   }
   if (lfo_filt_samphold_state)
   {
      LFOfilterMix1_2.gain(1, 1.0 / (float)((int)lfo_filt_sine_state + (int)lfo_filt_square_state + (int)lfo_filt_pulse_state + (int)lfo_filt_triangle_state + (int)lfo_filt_saw_state  + (int)lfo_filt_samphold_state));
   } else {
      LFOfilterMix1_2.gain(1, 0.0);
   }
   LFOfilterMix1_2.gain(2, 0.0);
   LFOfilterMix1_2.gain(3, 0.0);
   

   LFOfilterMix1_3.gain(0, 1.0);
   LFOfilterMix1_3.gain(1, 1.0);
   LFOfilterMix1_3.gain(2, 0.0);
   LFOfilterMix1_3.gain(3, 0.0);


   LFOsineMod.frequency(0.0);
   LFOsquareMod.frequency(0.0);
   LFOpulseMod.frequency(0.0);
   LFOtriangleMod.frequency(0.0);
   LFOsawMod.frequency(0.0);
   LFOsampleholdMod.frequency(0.0);

   LFOsineMod.amplitude(1.0);
   LFOsquareMod.amplitude(1.0);
   LFOpulseMod.amplitude(1.0);
   LFOtriangleMod.amplitude(1.0);
   LFOsawMod.amplitude(1.0);
   LFOsampleholdMod.amplitude(1.0);

   LFOsineMod.begin(WAVEFORM_SINE);
   LFOsquareMod.begin(WAVEFORM_SQUARE);
   LFOpulseMod.begin(WAVEFORM_PULSE);
   LFOtriangleMod.begin(WAVEFORM_TRIANGLE_VARIABLE);
   LFOsawMod.begin(WAVEFORM_SAWTOOTH);
   LFOsampleholdMod.begin(WAVEFORM_SAMPLE_HOLD);

   set_lfo_mod_gain();

   LFOmodMixA.gain(0, 1.0);
   LFOmodMixA.gain(1, 1.0);
   LFOmodMixA.gain(2, 1.0);
   LFOmodMixA.gain(3, 0.125);

   LFOmodMixB.gain(0, 1.0);
   LFOmodMixB.gain(1, 1.0);
   LFOmodMixB.gain(2, 1.0);
   LFOmodMixB.gain(3, 0.125);


   mixStage2_1A.gain(0, 0.5);
   mixStage2_1A.gain(1, 0.5);
   mixStage2_1A.gain(2, 0.5);
   mixStage2_1A.gain(3, 0.5);

   mixStage2_2A.gain(0, 0.5);
   mixStage2_2A.gain(1, 0.5);
   mixStage2_2A.gain(2, 0.5);
   mixStage2_2A.gain(3, 0.5);

   mixStage2_3A.gain(0, 0.5);
   mixStage2_3A.gain(1, 0.5);
   mixStage2_3A.gain(2, 0.5);
   mixStage2_3A.gain(3, 0.5);

   mixStage2_4A.gain(0, 0.5);
   mixStage2_4A.gain(1, 0.5);
   mixStage2_4A.gain(2, 0.5);
   mixStage2_4A.gain(3, 0.5);


   finalMix1A.gain(0, 0.5);
   finalMix1A.gain(1, 0.5);
   finalMix1A.gain(2, 0.5);
   finalMix1A.gain(3, 0.5);

   VFOtuningA.amplitude(0.0);
   VFOtuningB.amplitude(0.0);
   PBend.amplitude(0.0);

   LFOpulseModDutyCycle.amplitude(-0.9);
   LFOpulseFilterDutyCycle.amplitude(-0.9);

   for (int i = 0; i < LIMIT_POLY; i++)
   {
      // make this note entry available for use
      poly_notes[i].channel = 0;
      poly_notes[i].base_pitch = 0;
      poly_notes[i].note_state = false;
   }

   AudioInterrupts();

   // update the display of all LEDs to their initial operational state
   write_leds_thru_shiftreg();

   // start the USBhost for MIDI inputs/devices
   usbhostMIDI.begin();

   // Initiate MIDI communications, listen to all channels
   MIDI.begin(MIDI_CHANNEL_OMNI);

   kill_all_notes();
}  // setup()


// show index of EEPROM reads/writes
void show_index(int index)
{
   if (index < 10)
   {
      Serial.print("0");
   } else {
      Serial.print((char)((index / 10) + 0x30));
   }

   Serial.print((char)((index % 10) + 0x30));
}  // show_index()


// MIDI message callback - active sensing via USB
void USB_handleActiveSensing(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Active Sensing - via USB");
#endif

   handleActiveSensing();
}  // USB_handleActiveSensing()


// MIDI message callback - after touch channel via USB
void USB_handleAfterTouchChannel(byte channel, byte pressure)
{
   // echo the After Touch Channel message to MIDI out
   MIDI.sendAfterTouch(pressure, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** After Touch Chan - via USB : ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  pressure=");
   if (pressure < 100)
   {
      Serial.print(" ");
   }
   if (pressure< 10)
   {
      Serial.print(" ");
   }
   Serial.println(pressure);
#endif

   handleAfterTouchChannel(channel, pressure);
}  // USB_handleAfterTouchChannel()


// MIDI message callback - after touch poly via USB
void USB_handleAfterTouchPoly(byte channel, byte note, byte pressure)
{
   // echo the After Touch Poly message to MIDI out
   MIDI.sendPolyPressure(note, pressure, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** After Touch Poly - via USB : ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  note =");
   if (note < 100)
   {
      Serial.print(" ");
   }
   if (note < 10)
   {
      Serial.print(" ");
   }
   Serial.print(note);

   Serial.print("  pressure=");
   if (pressure < 100)
   {
      Serial.print(" ");
   }
   if (pressure< 10)
   {
      Serial.print(" ");
   }
   Serial.println(pressure);
#endif

   handleAfterTouchPoly(channel, note, pressure);
}  // USB_handleAfterTouchPoly()


// MIDI message callback - clock via USB
void USB_handleClock(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Clock - via USB");
#endif

   handleClock();
}  // USB_handleClock()


// MIDI message callback - continue via USB
void USB_handleContinue(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Continue - via USB");
#endif

   handleContinue();
}  // USB_handleContinue()


// MIDI message callback - control change via USB
void USB_handleControlChange(byte channel, byte number, byte value)
{
   // echo the Control Change message to MIDI out
   MIDI.sendControlChange(number, value, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** Control Change - via USB :   ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  num  =");
   if (number < 100)
   {
      Serial.print(" ");
   }
   if (number < 10)
   {
      Serial.print(" ");
   }
   Serial.print(number);

   Serial.print("  value   =");
   if (value < 100)
   {
      Serial.print(" ");
   }
   if (value< 10)
   {
      Serial.print(" ");
   }
   Serial.println(value);
#endif

   handleControlChange(channel, number, value);
}  // USB_handleControlChange()


// MIDI message callback - note off via USB
void USB_handleNoteOff(byte channel, byte pitch, byte velocity)
{
   // echo the note off message to MIDI out
   MIDI.sendNoteOff(pitch, velocity, channel);

#ifdef DEBUG_NOTE_MSGS
   Serial.print("Note Off - via USB :             ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);
   Serial.print("  pitch=");
   if (pitch < 100)
   {
      Serial.print(" ");
   }
   if (pitch < 10)
   {
      Serial.print(" ");
   }
   Serial.println(pitch);
#endif

   handleNoteOff(channel, pitch, velocity);
}  // USB_handleNoteOff()


// MIDI message callback - note on via USB
void USB_handleNoteOn(byte channel, byte pitch, byte velocity)
{
   // echo the note on message to MIDI out
   MIDI.sendNoteOn(pitch, velocity, channel);

#ifdef DEBUG_NOTE_MSGS
   if (velocity == 0)
   {
      Serial.print("Note Off - via USB:             ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);

      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.println(pitch);
   } else {
      Serial.print("Note On:              ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);


      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.print(pitch);

      Serial.print("  velocity=");
      if (velocity < 100)
      {
         Serial.print(" ");
      }
      if (velocity < 10)
      {
         Serial.print(" ");
      }
      Serial.println(velocity);
      
      Serial.print(channel);
      Serial.print("  VFO A = ");
      Serial.print(fNotePitches[pitch] / octaveA_divisor);
      Serial.print("Hz   ");
      Serial.print("  VFO B = ");
      Serial.print(fNotePitches[pitch] / octaveB_divisor);
      Serial.println("Hz   ");
   }
#endif

   handleNoteOn(channel, pitch, velocity);
}  // USB_handleNoteOn


// MIDI message callback - pitch bend via USB
void USB_handlePitchBend(byte channel, int bend)
{
   // echo the Pitch Bend message to MIDI out
   MIDI.sendPitchBend(bend, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** Pitch Bend - via USB :       ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  bend =");
   if (bend < 100)
   {
      Serial.print(" ");
   }
   if (bend < 10)
   {
      Serial.print(" ");
   }
   Serial.println(bend);
#endif

   handlePitchBend(channel, bend);
}  // USB_handlePitchBend()


// MIDI message callback - program change via USB
void USB_handleProgramChange(byte channel, byte number)
{
   // echo the Program Change message to MIDI out
   MIDI.sendProgramChange(number, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** Program Change - via USB :   ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  num  =");
   if (number < 100)
   {
      Serial.print(" ");
   }
   if (number < 10)
   {
      Serial.print(" ");
   }
   Serial.println(number);
#endif

   handleProgramChange(channel, number);
}  // USB_handleProgramChange()


// MIDI message callback - song position via USB
void USB_handleSongPosition(unsigned beats)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Song Position - via USB :    beats=");
   if (beats < 100)
   {
      Serial.print(" ");
   }
   if (beats < 10)
   {
      Serial.print(" ");
   }
   Serial.println(beats);
#endif

   handleSongPosition(beats);
}  // USB_handleSongPosition()


// MIDI message callback - song select via USB
void USB_handleSongSelect(byte songnumber)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Song Select - via USB :      song=");
   if (songnumber < 100)
   {
      Serial.print(" ");
   }
   if (songnumber < 10)
   {
      Serial.print(" ");
   }
   Serial.println(songnumber);
#endif

   handleSongSelect(songnumber);
}  // USB_handleSongSelect()


// MIDI message callback - start via USB
void USB_handleStart(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Start - via USB");
#endif

   handleStart();
}  // USB_handleStart()


// MIDI message callback - stop via USB
void USB_handleStop(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Stop - via USB");
#endif

   handleStop();
}  // USB_handleStop()


// MIDI message callback - system exclusive via USB
void USB_handleSystemExclusive(byte * array, unsigned size)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** SYSEX - via USB :            size=");
   if (size < 100)
   {
      Serial.print(" ");
   }
   if (size < 10)
   {
      Serial.print(" ");
   }
   Serial.println(size);
#endif

   handleSystemExclusive(&(*array), size);
}  // USB_handleSystemExclusive()


// MIDI message callback - system reset via USB
void USB_handleSystemReset(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** System Reset - via USB");
#endif

   handleSystemReset();
}  // USB_handleSystemReset()


// MIDI message callback - timecode quarter frame via USB
void USB_handleTimeCodeQuarterFrame(byte data)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** TimeCodeQFrame - via USB :  data=");
   if (data < 100)
   {
      Serial.print(" ");
   }
   if (data < 10)
   {
      Serial.print(" ");
   }
   Serial.println(data);
#endif

   handleTimeCodeQuarterFrame(data);
}  // USB_handleTimeCodeQuarterFrame()


// MIDI message callback - tune request via USB
void USB_handleTuneRequest(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Tune Request - via USB");
#endif

   handleTuneRequest();
}  // USB_handleTuneRequest()


// MIDI message callback - active sensing via usbhostMIDI
void usbhostMIDI_handleActiveSensing(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Active Sensing - via usbhostMIDI");
#endif

   handleActiveSensing();
}  // usbhostMIDI_handleActiveSensing()


// MIDI message callback - after touch channel via usbhostMIDI
void usbhostMIDI_handleAfterTouchChannel(byte channel, byte pressure)
{
   // echo the After Touch Channel message to MIDI out
   MIDI.sendAfterTouch(pressure, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** After Touch Chan - via usbhostMIDI : ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  pressure=");
   if (pressure < 100)
   {
      Serial.print(" ");
   }
   if (pressure< 10)
   {
      Serial.print(" ");
   }
   Serial.println(pressure);
#endif

   handleAfterTouchChannel(channel, pressure);
}  // usbhostMIDI_handleAfterTouchChannel()


// MIDI message callback - after touch poly via usbhostMIDI
void usbhostMIDI_handleAfterTouchPoly(byte channel, byte note, byte pressure)
{
   // echo the After Touch Poly message to MIDI out
   MIDI.sendPolyPressure(note, pressure, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** After Touch Poly - via usbhostMIDI : ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  note =");
   if (note < 100)
   {
      Serial.print(" ");
   }
   if (note < 10)
   {
      Serial.print(" ");
   }
   Serial.print(note);

   Serial.print("  pressure=");
   if (pressure < 100)
   {
      Serial.print(" ");
   }
   if (pressure< 10)
   {
      Serial.print(" ");
   }
   Serial.println(pressure);
#endif

   handleAfterTouchPoly(channel, note, pressure);
}  // usbhostMIDI_handleAfterTouchPoly()


// MIDI message callback - clock via usbhostMIDI
void usbhostMIDI_handleClock(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Clock - via usbhostMIDI");
#endif

   handleClock();
}  // usbhostMIDI_handleClock()


// MIDI message callback - continue via usbhostMIDI
void usbhostMIDI_handleContinue(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Continue - via usbhostMIDI");
#endif

   handleContinue();
}  // usbhostMIDI_handleContinue()


// MIDI message callback - control change via usbhostMIDI
void usbhostMIDI_handleControlChange(byte channel, byte number, byte value)
{
   // echo the Control Change message to MIDI out
   MIDI.sendControlChange(number, value, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** Control Change - via usbhostMIDI :   ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  num  =");
   if (number < 100)
   {
      Serial.print(" ");
   }
   if (number < 10)
   {
      Serial.print(" ");
   }
   Serial.print(number);

   Serial.print("  value   =");
   if (value < 100)
   {
      Serial.print(" ");
   }
   if (value< 10)
   {
      Serial.print(" ");
   }
   Serial.println(value);
#endif

   handleControlChange(channel, number, value);
}  // usbhostMIDI_handleControlChange()


// MIDI message callback - note off via usbhostMIDI
void usbhostMIDI_handleNoteOff(byte channel, byte pitch, byte velocity)
{
   // echo the note off message to MIDI out
   MIDI.sendNoteOff(pitch, velocity, channel);

#ifdef DEBUG_NOTE_MSGS
   Serial.print("Note Off - via usbhostMIDI :             ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);
   Serial.print("  pitch=");
   if (pitch < 100)
   {
      Serial.print(" ");
   }
   if (pitch < 10)
   {
      Serial.print(" ");
   }
   Serial.println(pitch);
#endif

   handleNoteOff(channel, pitch, velocity);
}  // usbhostMIDI_handleNoteOff()


// MIDI message callback - note on via usbhostMIDI
void usbhostMIDI_handleNoteOn(byte channel, byte pitch, byte velocity)
{
   // echo the note on message to MIDI out
   MIDI.sendNoteOn(pitch, velocity, channel);

#ifdef DEBUG_NOTE_MSGS
   if (velocity == 0)
   {
      Serial.print("Note Off - via usbhostMIDI:             ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);

      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.println(pitch);
   } else {
      Serial.print("Note On:              ch=");
      if (channel < 10)
      {
         Serial.print("0");
      }
      Serial.print(channel);


      Serial.print("  pitch=");
      if (pitch < 100)
      {
         Serial.print(" ");
      }
      if (pitch < 10)
      {
         Serial.print(" ");
      }
      Serial.print(pitch);

      Serial.print("  velocity=");
      if (velocity < 100)
      {
         Serial.print(" ");
      }
      if (velocity < 10)
      {
         Serial.print(" ");
      }
      Serial.println(velocity);
      
      Serial.print(channel);
      Serial.print("  VFO A = ");
      Serial.print(fNotePitches[pitch] / octaveA_divisor);
      Serial.print("Hz   ");
      Serial.print("  VFO B = ");
      Serial.print(fNotePitches[pitch] / octaveB_divisor);
      Serial.println("Hz   ");
   }
#endif

   handleNoteOn(channel, pitch, velocity);
}  // usbhostMIDI_handleNoteOn


// MIDI message callback - pitch bend via usbhostMIDI
void usbhostMIDI_handlePitchBend(byte channel, int bend)
{
   // echo the Pitch Bend message to MIDI out
   MIDI.sendPitchBend(bend, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** Pitch Bend - via usbhostMIDI :       ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  bend =");
   if (bend < 100)
   {
      Serial.print(" ");
   }
   if (bend < 10)
   {
      Serial.print(" ");
   }
   Serial.println(bend);
#endif

   handlePitchBend(channel, bend);
}  // usbhostMIDI_handlePitchBend()


// MIDI message callback - program change via usbhostMIDI
void usbhostMIDI_handleProgramChange(byte channel, byte number)
{
   // echo the Program Change message to MIDI out
   MIDI.sendProgramChange(number, channel);

#ifdef DEBUG_CC_MSGS
   Serial.print("*** Program Change - via usbhostMIDI :   ch=");
   if (channel < 10)
   {
      Serial.print("0");
   }
   Serial.print(channel);

   Serial.print("  num  =");
   if (number < 100)
   {
      Serial.print(" ");
   }
   if (number < 10)
   {
      Serial.print(" ");
   }
   Serial.println(number);
#endif

   handleProgramChange(channel, number);
}  // usbhostMIDI_handleProgramChange()


// MIDI message callback - song position via usbhostMIDI
void usbhostMIDI_handleSongPosition(unsigned beats)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Song Position - via usbhostMIDI :    beats=");
   if (beats < 100)
   {
      Serial.print(" ");
   }
   if (beats < 10)
   {
      Serial.print(" ");
   }
   Serial.println(beats);
#endif

   handleSongPosition(beats);
}  // usbhostMIDI_handleSongPosition()


// MIDI message callback - song select via usbhostMIDI
void usbhostMIDI_handleSongSelect(byte songnumber)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** Song Select - via usbhostMIDI :      song=");
   if (songnumber < 100)
   {
      Serial.print(" ");
   }
   if (songnumber < 10)
   {
      Serial.print(" ");
   }
   Serial.println(songnumber);
#endif

   handleSongSelect(songnumber);
}  // usbhostMIDI_handleSongSelect()


// MIDI message callback - start via usbhostMIDI
void usbhostMIDI_handleStart(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Start - via usbhostMIDI");
#endif

   handleStart();
}  // usbhostMIDI_handleStart()


// MIDI message callback - stop via usbhostMIDI
void usbhostMIDI_handleStop(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Stop - via usbhostMIDI");
#endif

   handleStop();
}  // usbhostMIDI_handleStop()


// MIDI message callback - system exclusive via usbhostMIDI
void usbhostMIDI_handleSystemExclusive(byte * array, unsigned size)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** SYSEX - via usbhostMIDI :            size=");
   if (size < 100)
   {
      Serial.print(" ");
   }
   if (size < 10)
   {
      Serial.print(" ");
   }
   Serial.println(size);
#endif

   handleSystemExclusive(&(*array), size);
}  // usbhostMIDI_handleSystemExclusive()


// MIDI message callback - system reset via usbhostMIDI
void usbhostMIDI_handleSystemReset(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** System Reset - via usbhostMIDI");
#endif

   handleSystemReset();
}  // usbhostMIDI_handleSystemReset()


// MIDI message callback - timecode quarter frame via usbhostMIDI
void usbhostMIDI_handleTimeCodeQuarterFrame(byte data)
{
#ifdef DEBUG_CC_MSGS
   Serial.print("*** TimeCodeQFrame - via usbhostMIDI :  data=");
   if (data < 100)
   {
      Serial.print(" ");
   }
   if (data < 10)
   {
      Serial.print(" ");
   }
   Serial.println(data);
#endif

   handleTimeCodeQuarterFrame(data);
}  // usbhostMIDI_handleTimeCodeQuarterFrame()


// MIDI message callback - tune request via usbhostMIDI
void usbhostMIDI_handleTuneRequest(void)
{
#ifdef DEBUG_CC_MSGS
   Serial.println("*** Tune Request - via usbhostMIDI");
#endif

   handleTuneRequest();
}  // usbhostMIDI_handleTuneRequest()


// display the current state of all LEDs
void write_leds_thru_shiftreg(void)
{
   AudioNoInterrupts();

   // disable shift register output enable
   analogWrite(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, 0);

   // write each LED state sequentially into the shift register
   for (int led_index = 0; led_index < NUM_LEDS; led_index++)
   {
      // set the shift register data
      digitalWrite(SHIFTREG_DATA_PIN, *shiftreg_output_led_ref[led_index]);

      // delay long enough for the data to settle (spec says 125ns)
      //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
      delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

      // activate the shift register clock (which will also temporarily light the on-board LED)
      digitalWrite(SHIFTREG_CLOCK_PIN, HIGH);

      // delay long enough for the data to be consistently clocked into the shift register (spec says 100ns)
      //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
      delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

      // deactivate the shift register clock
      digitalWrite(SHIFTREG_CLOCK_PIN, LOW);

      // delay long enough for the data to be consistently clocked into the shift register (spec says 100ns)
      //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
      delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

   }

   // need to toggle the shift register clock two extra times (once to account for the 1-bit delay induced by
   //    connecting the shift-clock & data-clock together, & a second time to bypass one unused output in the
   //    shift register chain - of course, Murphy would have it that the unused output is at the beginning of
   //    the chain, so it affects *every* update - if it were at the end of the chain, it could be ignored !!)

   // set the shift register data LOW for the extra bits & leave it inactive
   digitalWrite(SHIFTREG_DATA_PIN, LOW);

   // delay long enough for the data to settle (spec says 125nsec)
   //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
   delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

   // activate the shift register clock (which will also temporarily light the on-board LED)
   digitalWrite(SHIFTREG_CLOCK_PIN, HIGH);

   // delay long enough for the data to be consistently clocked into the shift register (spec says 100ns)
   //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
   delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

   // deactivate the shift register clock
   digitalWrite(SHIFTREG_CLOCK_PIN, LOW);

   // delay long enough for the data to be consistently clocked into the shift register (spec says 100ns)
   //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
   delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

   // activate the shift register clock (which will also temporarily light the on-board LED)
   digitalWrite(SHIFTREG_CLOCK_PIN, HIGH);

   // delay long enough for the data to be consistently clocked into the shift register (spec says 100ns)
   //    (knowing that values less than delayMicroseconds(3) are not guaranteed to work consistently)
   delayMicroseconds(SHIFTREG_DELAY_MICROSECONDS);

   // deactivate the shift register clock
   digitalWrite(SHIFTREG_CLOCK_PIN, LOW);

   // enable shift register output enable
   analogWrite(SHIFTREG_LOW_OUTPUT_ENABLE_PIN, (255 - led_intensity));

   AudioInterrupts();
}  // write_leds_thru_shiftreg()


// EOF placeholder
