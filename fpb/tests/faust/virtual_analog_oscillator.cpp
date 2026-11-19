/* ------------------------------------------------------------
name: "virtual_analog_oscillator"
Code generated with Faust 2.94.1 (https://faust.grame.fr)
Compilation options: -lang cpp -fpga-mem-th 4 -ct 1 -cn virtual_analog_oscillator -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 0
------------------------------------------------------------ */

#ifndef  __virtual_analog_oscillator_H__
#define  __virtual_analog_oscillator_H__

#ifndef FAUSTFLOAT
#define FAUSTFLOAT float
#endif 

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <math.h>
#ifndef FAUST_INT_WRAP
#define FAUST_INT_WRAP
inline int faust_wrap_add(int a, int b) { return int((unsigned int)a + (unsigned int)b); }
inline int faust_wrap_sub(int a, int b) { return int((unsigned int)a - (unsigned int)b); }
inline int faust_wrap_mul(int a, int b) { return int((unsigned int)a * (unsigned int)b); }
#endif


#ifndef FAUSTCLASS 
#define FAUSTCLASS virtual_analog_oscillator
#endif

#ifdef __APPLE__ 
#define exp10f __exp10f
#define exp10 __exp10
#endif

#if defined(_WIN32)
#define RESTRICT __restrict
#else
#define RESTRICT __restrict__
#endif

static float virtual_analog_oscillator_faustpower2_f(float value_f) {
	return value_f * value_f;
}
static float virtual_analog_oscillator_faustpower3_f(float value_f) {
	return value_f * value_f * value_f;
}

class virtual_analog_oscillator : public dsp {
	
 private:
	
	FAUSTFLOAT fVslider0;
	FAUSTFLOAT fHslider0;
	float fVec0[2];
	int fSampleRate;
	float fConst0;
	float fConst1;
	int iVec1[4];
	float fRec0[2];
	FAUSTFLOAT fVslider1;
	FAUSTFLOAT fEntry0;
	float fConst2;
	FAUSTFLOAT fHslider1;
	float fVec2[2];
	FAUSTFLOAT fVslider2;
	float fRec2[2];
	float fVec3[3];
	int iRec3[2];
	int iRec1[2];
	float fConst3;
	float fVec4[2];
	float fVec5[3];
	float fConst4;
	float fVec6[2];
	float fConst5;
	FAUSTFLOAT fVslider3;
	float fVec7[3];
	int iRec5[2];
	int iRec4[2];
	float fVec8[2];
	float fVec9[3];
	float fVec10[2];
	FAUSTFLOAT fVslider4;
	float fVec11[3];
	int iRec7[2];
	int iRec6[2];
	float fVec12[2];
	float fVec13[3];
	float fVec14[2];
	float fConst6;
	FAUSTFLOAT fVslider5;
	float fVec15[2];
	int iRec9[2];
	int iRec8[2];
	float fVec16[2];
	int IOTA0;
	float fVec17[16384];
	float fConst7;
	float fVec18[2];
	int iRec11[2];
	int iRec10[2];
	float fVec19[2];
	float fVec20[16384];
	float fVec21[2];
	int iRec13[2];
	int iRec12[2];
	float fVec22[2];
	float fVec23[16384];
	float fConst8;
	FAUSTFLOAT fVslider6;
	float fConst9;
	float fRec14[2];
	float fRec15[2];
	float fRec16[2];
	FAUSTFLOAT fVslider7;
	FAUSTFLOAT fCheckbox0;
	float fVec24[2];
	float fVec25[2];
	float fVec26[2];
	FAUSTFLOAT fVslider8;
	float fVec27[2];
	float fRec17[2];
	float fVec28[16384];
	float fVec29[16384];
	float fVec30[16384];
	FAUSTFLOAT fVslider9;
	int iRec19[2];
	float fRec18[4];
	
 public:
	virtual_analog_oscillator() {
	}
	
	virtual_analog_oscillator(const virtual_analog_oscillator&) = default;
	
	virtual ~virtual_analog_oscillator() = default;
	
	virtual_analog_oscillator& operator=(const virtual_analog_oscillator&) = default;
	
	void metadata(Meta* m) { 
		m->declare("basics.lib/name", "Faust Basic Element Library");
		m->declare("basics.lib/version", "1.23.9");
		m->declare("compile_options", "-lang cpp -fpga-mem-th 4 -ct 1 -cn virtual_analog_oscillator -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 0");
		m->declare("demos.lib/name", "Faust Demos Library");
		m->declare("demos.lib/version", "1.8.2");
		m->declare("demos.lib/virtual_analog_oscillator_demo:author", "Julius O. Smith III");
		m->declare("demos.lib/virtual_analog_oscillator_demo:licence", "MIT");
		m->declare("filename", "virtual_analog_oscillator.dsp");
		m->declare("filters.lib/fir:author", "Julius O. Smith III");
		m->declare("filters.lib/fir:copyright", "Copyright (C) 2003-2019 by Julius O. Smith III <jos@ccrma.stanford.edu>");
		m->declare("filters.lib/fir:license", "LicenseRef-STK-4.3");
		m->declare("filters.lib/iir:author", "Julius O. Smith III");
		m->declare("filters.lib/iir:copyright", "Copyright (C) 2003-2019 by Julius O. Smith III <jos@ccrma.stanford.edu>");
		m->declare("filters.lib/iir:license", "LicenseRef-STK-4.3");
		m->declare("filters.lib/name", "Faust Filters Library");
		m->declare("filters.lib/pole:author", "Julius O. Smith III");
		m->declare("filters.lib/pole:copyright", "Copyright (C) 2003-2019 by Julius O. Smith III <jos@ccrma.stanford.edu>");
		m->declare("filters.lib/pole:license", "LicenseRef-STK-4.3");
		m->declare("filters.lib/version", "1.13.6");
		m->declare("maths.lib/author", "GRAME");
		m->declare("maths.lib/copyright", "GRAME");
		m->declare("maths.lib/license", "LicenseRef-LGPL-2.1-or-later-with-Faust-exception");
		m->declare("maths.lib/name", "Faust Math Library");
		m->declare("maths.lib/version", "2.9.5");
		m->declare("name", "virtual_analog_oscillator");
		m->declare("noises.lib/name", "Faust Noise Generator Library");
		m->declare("noises.lib/version", "1.9.2");
		m->declare("oscillators.lib/lf_sawpos:author", "Bart Brouns, revised by Stéphane Letz");
		m->declare("oscillators.lib/lf_sawpos:licence", "LicenseRef-STK-4.3");
		m->declare("oscillators.lib/name", "Faust Oscillator Library");
		m->declare("oscillators.lib/sawN:author", "Julius O. Smith III");
		m->declare("oscillators.lib/sawN:license", "LicenseRef-STK-4.3");
		m->declare("oscillators.lib/version", "1.9.6");
		m->declare("platform.lib/name", "Generic Platform Library");
		m->declare("platform.lib/version", "1.3.2");
		m->declare("signals.lib/name", "Faust Routing Library");
		m->declare("signals.lib/version", "1.8.2");
	}

	virtual int getNumInputs() {
		return 1;
	}
	virtual int getNumOutputs() {
		return 1;
	}
	
	static void classInit(int sample_rate) {
	}
	
	virtual void instanceConstants(int sample_rate) {
		fSampleRate = sample_rate;
		fConst0 = std::min<float>(1.92e+05f, std::max<float>(5e+01f, static_cast<float>(fSampleRate)));
		fConst1 = 1.0f - 44.1f / fConst0;
		fConst2 = 1.0f / fConst0;
		fConst3 = 0.25f * fConst0;
		fConst4 = 0.041666668f / fConst0;
		fConst5 = 2.0f / fConst0;
		fConst6 = 0.083333336f * fConst0;
		fConst7 = 0.5f * fConst0;
		fConst8 = 1.3333334f / fConst0;
		fConst9 = 1.0f - 48.0f / fConst0;
	}
	
	virtual void instanceResetUserInterface() {
		fVslider0 = static_cast<FAUSTFLOAT>(0.0f);
		fHslider0 = static_cast<FAUSTFLOAT>(-2e+01f);
		fVslider1 = static_cast<FAUSTFLOAT>(1.0f);
		fEntry0 = static_cast<FAUSTFLOAT>(2.0f);
		fHslider1 = static_cast<FAUSTFLOAT>(49.0f);
		fVslider2 = static_cast<FAUSTFLOAT>(0.1f);
		fVslider3 = static_cast<FAUSTFLOAT>(-0.1f);
		fVslider4 = static_cast<FAUSTFLOAT>(0.1f);
		fVslider5 = static_cast<FAUSTFLOAT>(0.0f);
		fVslider6 = static_cast<FAUSTFLOAT>(0.0f);
		fVslider7 = static_cast<FAUSTFLOAT>(0.0f);
		fCheckbox0 = static_cast<FAUSTFLOAT>(0.0f);
		fVslider8 = static_cast<FAUSTFLOAT>(0.5f);
		fVslider9 = static_cast<FAUSTFLOAT>(0.0f);
	}
	
	virtual void instanceClear() {
		for (int l0 = 0; l0 < 2; l0 = faust_wrap_add(l0, 1)) {
			fVec0[l0] = 0.0f;
		}
		for (int l1 = 0; l1 < 4; l1 = faust_wrap_add(l1, 1)) {
			iVec1[l1] = 0;
		}
		for (int l2 = 0; l2 < 2; l2 = faust_wrap_add(l2, 1)) {
			fRec0[l2] = 0.0f;
		}
		for (int l3 = 0; l3 < 2; l3 = faust_wrap_add(l3, 1)) {
			fVec2[l3] = 0.0f;
		}
		for (int l4 = 0; l4 < 2; l4 = faust_wrap_add(l4, 1)) {
			fRec2[l4] = 0.0f;
		}
		for (int l5 = 0; l5 < 3; l5 = faust_wrap_add(l5, 1)) {
			fVec3[l5] = 0.0f;
		}
		for (int l6 = 0; l6 < 2; l6 = faust_wrap_add(l6, 1)) {
			iRec3[l6] = 0;
		}
		for (int l7 = 0; l7 < 2; l7 = faust_wrap_add(l7, 1)) {
			iRec1[l7] = 0;
		}
		for (int l8 = 0; l8 < 2; l8 = faust_wrap_add(l8, 1)) {
			fVec4[l8] = 0.0f;
		}
		for (int l9 = 0; l9 < 3; l9 = faust_wrap_add(l9, 1)) {
			fVec5[l9] = 0.0f;
		}
		for (int l10 = 0; l10 < 2; l10 = faust_wrap_add(l10, 1)) {
			fVec6[l10] = 0.0f;
		}
		for (int l11 = 0; l11 < 3; l11 = faust_wrap_add(l11, 1)) {
			fVec7[l11] = 0.0f;
		}
		for (int l12 = 0; l12 < 2; l12 = faust_wrap_add(l12, 1)) {
			iRec5[l12] = 0;
		}
		for (int l13 = 0; l13 < 2; l13 = faust_wrap_add(l13, 1)) {
			iRec4[l13] = 0;
		}
		for (int l14 = 0; l14 < 2; l14 = faust_wrap_add(l14, 1)) {
			fVec8[l14] = 0.0f;
		}
		for (int l15 = 0; l15 < 3; l15 = faust_wrap_add(l15, 1)) {
			fVec9[l15] = 0.0f;
		}
		for (int l16 = 0; l16 < 2; l16 = faust_wrap_add(l16, 1)) {
			fVec10[l16] = 0.0f;
		}
		for (int l17 = 0; l17 < 3; l17 = faust_wrap_add(l17, 1)) {
			fVec11[l17] = 0.0f;
		}
		for (int l18 = 0; l18 < 2; l18 = faust_wrap_add(l18, 1)) {
			iRec7[l18] = 0;
		}
		for (int l19 = 0; l19 < 2; l19 = faust_wrap_add(l19, 1)) {
			iRec6[l19] = 0;
		}
		for (int l20 = 0; l20 < 2; l20 = faust_wrap_add(l20, 1)) {
			fVec12[l20] = 0.0f;
		}
		for (int l21 = 0; l21 < 3; l21 = faust_wrap_add(l21, 1)) {
			fVec13[l21] = 0.0f;
		}
		for (int l22 = 0; l22 < 2; l22 = faust_wrap_add(l22, 1)) {
			fVec14[l22] = 0.0f;
		}
		for (int l23 = 0; l23 < 2; l23 = faust_wrap_add(l23, 1)) {
			fVec15[l23] = 0.0f;
		}
		for (int l24 = 0; l24 < 2; l24 = faust_wrap_add(l24, 1)) {
			iRec9[l24] = 0;
		}
		for (int l25 = 0; l25 < 2; l25 = faust_wrap_add(l25, 1)) {
			iRec8[l25] = 0;
		}
		for (int l26 = 0; l26 < 2; l26 = faust_wrap_add(l26, 1)) {
			fVec16[l26] = 0.0f;
		}
		IOTA0 = 0;
		for (int l27 = 0; l27 < 16384; l27 = faust_wrap_add(l27, 1)) {
			fVec17[l27] = 0.0f;
		}
		for (int l28 = 0; l28 < 2; l28 = faust_wrap_add(l28, 1)) {
			fVec18[l28] = 0.0f;
		}
		for (int l29 = 0; l29 < 2; l29 = faust_wrap_add(l29, 1)) {
			iRec11[l29] = 0;
		}
		for (int l30 = 0; l30 < 2; l30 = faust_wrap_add(l30, 1)) {
			iRec10[l30] = 0;
		}
		for (int l31 = 0; l31 < 2; l31 = faust_wrap_add(l31, 1)) {
			fVec19[l31] = 0.0f;
		}
		for (int l32 = 0; l32 < 16384; l32 = faust_wrap_add(l32, 1)) {
			fVec20[l32] = 0.0f;
		}
		for (int l33 = 0; l33 < 2; l33 = faust_wrap_add(l33, 1)) {
			fVec21[l33] = 0.0f;
		}
		for (int l34 = 0; l34 < 2; l34 = faust_wrap_add(l34, 1)) {
			iRec13[l34] = 0;
		}
		for (int l35 = 0; l35 < 2; l35 = faust_wrap_add(l35, 1)) {
			iRec12[l35] = 0;
		}
		for (int l36 = 0; l36 < 2; l36 = faust_wrap_add(l36, 1)) {
			fVec22[l36] = 0.0f;
		}
		for (int l37 = 0; l37 < 16384; l37 = faust_wrap_add(l37, 1)) {
			fVec23[l37] = 0.0f;
		}
		for (int l38 = 0; l38 < 2; l38 = faust_wrap_add(l38, 1)) {
			fRec14[l38] = 0.0f;
		}
		for (int l39 = 0; l39 < 2; l39 = faust_wrap_add(l39, 1)) {
			fRec15[l39] = 0.0f;
		}
		for (int l40 = 0; l40 < 2; l40 = faust_wrap_add(l40, 1)) {
			fRec16[l40] = 0.0f;
		}
		for (int l41 = 0; l41 < 2; l41 = faust_wrap_add(l41, 1)) {
			fVec24[l41] = 0.0f;
		}
		for (int l42 = 0; l42 < 2; l42 = faust_wrap_add(l42, 1)) {
			fVec25[l42] = 0.0f;
		}
		for (int l43 = 0; l43 < 2; l43 = faust_wrap_add(l43, 1)) {
			fVec26[l43] = 0.0f;
		}
		for (int l44 = 0; l44 < 2; l44 = faust_wrap_add(l44, 1)) {
			fVec27[l44] = 0.0f;
		}
		for (int l45 = 0; l45 < 2; l45 = faust_wrap_add(l45, 1)) {
			fRec17[l45] = 0.0f;
		}
		for (int l46 = 0; l46 < 16384; l46 = faust_wrap_add(l46, 1)) {
			fVec28[l46] = 0.0f;
		}
		for (int l47 = 0; l47 < 16384; l47 = faust_wrap_add(l47, 1)) {
			fVec29[l47] = 0.0f;
		}
		for (int l48 = 0; l48 < 16384; l48 = faust_wrap_add(l48, 1)) {
			fVec30[l48] = 0.0f;
		}
		for (int l49 = 0; l49 < 2; l49 = faust_wrap_add(l49, 1)) {
			iRec19[l49] = 0;
		}
		for (int l50 = 0; l50 < 4; l50 = faust_wrap_add(l50, 1)) {
			fRec18[l50] = 0.0f;
		}
	}
	
	virtual void init(int sample_rate) {
		classInit(sample_rate);
		instanceInit(sample_rate);
	}
	
	virtual void instanceInit(int sample_rate) {
		instanceConstants(sample_rate);
		instanceResetUserInterface();
		instanceClear();
	}
	
	virtual virtual_analog_oscillator* clone() {
		return new virtual_analog_oscillator(*this);
	}
	
	virtual int getSampleRate() {
		return fSampleRate;
	}
	
	virtual void buildUserInterface(UI* ui_interface) {
		ui_interface->declare(0, "0", "");
		ui_interface->declare(0, "tooltip", "See Faust's oscillators.lib for documentation and references");
		ui_interface->openVerticalBox("VIRTUAL ANALOG OSCILLATORS");
		ui_interface->declare(0, "0", "");
		ui_interface->openHorizontalBox("Signal Levels");
		ui_interface->declare(&fVslider1, "0", "");
		ui_interface->declare(&fVslider1, "style", "vslider");
		ui_interface->addVerticalSlider("Sawtooth", &fVslider1, FAUSTFLOAT(1.0f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->declare(0, "1", "");
		ui_interface->openVerticalBox("Pulse Train");
		ui_interface->declare(&fCheckbox0, "0", "");
		ui_interface->declare(&fCheckbox0, "tooltip", "When checked, use 3rd-order aliasing suppression (up from 2)     See if you can hear a difference with the freq high and swept");
		ui_interface->addCheckButton("Order 3", &fCheckbox0);
		ui_interface->declare(&fVslider7, "1", "");
		ui_interface->declare(&fVslider7, "style", "vslider");
		ui_interface->addVerticalSlider("0x00", &fVslider7, FAUSTFLOAT(0.0f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->declare(&fVslider8, "2", "");
		ui_interface->declare(&fVslider8, "style", "knob");
		ui_interface->addVerticalSlider("Duty Cycle", &fVslider8, FAUSTFLOAT(0.5f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->closeBox();
		ui_interface->declare(&fVslider5, "2", "");
		ui_interface->declare(&fVslider5, "style", "vslider");
		ui_interface->addVerticalSlider("Square", &fVslider5, FAUSTFLOAT(0.0f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->declare(&fVslider6, "3", "");
		ui_interface->declare(&fVslider6, "style", "vslider");
		ui_interface->addVerticalSlider("Triangle", &fVslider6, FAUSTFLOAT(0.0f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->declare(&fVslider9, "4", "");
		ui_interface->declare(&fVslider9, "style", "vslider");
		ui_interface->declare(&fVslider9, "tooltip", "Pink Noise (or 1/f noise) is         Constant-Q Noise, meaning that it has the same total power in every octave         (uses only amplitude controls)");
		ui_interface->addVerticalSlider("Pink Noise", &fVslider9, FAUSTFLOAT(0.0f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->declare(&fVslider0, "5", "");
		ui_interface->declare(&fVslider0, "style", "vslider");
		ui_interface->addVerticalSlider("Ext Input", &fVslider0, FAUSTFLOAT(0.0f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->closeBox();
		ui_interface->declare(0, "1", "");
		ui_interface->openHorizontalBox("Signal Parameters");
		ui_interface->declare(0, "0", "");
		ui_interface->openVerticalBox("0x00");
		ui_interface->declare(&fHslider0, "1", "");
		ui_interface->declare(&fHslider0, "style", "hslider");
		ui_interface->declare(&fHslider0, "tooltip", "Sawtooth waveform amplitude");
		ui_interface->declare(&fHslider0, "unit", "dB");
		ui_interface->addHorizontalSlider("Mix Amplitude", &fHslider0, FAUSTFLOAT(-2e+01f), FAUSTFLOAT(-1.2e+02f), FAUSTFLOAT(1e+01f), FAUSTFLOAT(0.1f));
		ui_interface->declare(&fHslider1, "2", "");
		ui_interface->declare(&fHslider1, "style", "hslider");
		ui_interface->declare(&fHslider1, "tooltip", "Sawtooth         frequency as a Piano Key (PK) number (A440 = key 49)");
		ui_interface->declare(&fHslider1, "unit", "PK");
		ui_interface->addHorizontalSlider("Frequency", &fHslider1, FAUSTFLOAT(49.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(88.0f), FAUSTFLOAT(0.01f));
		ui_interface->closeBox();
		ui_interface->declare(&fVslider3, "3", "");
		ui_interface->declare(&fVslider3, "style", "knob");
		ui_interface->declare(&fVslider3, "tooltip", "Percentage frequency-shift up or down for second oscillator");
		ui_interface->declare(&fVslider3, "unit", "%%");
		ui_interface->addVerticalSlider("Detuning 1", &fVslider3, FAUSTFLOAT(-0.1f), FAUSTFLOAT(-1e+01f), FAUSTFLOAT(1e+01f), FAUSTFLOAT(0.01f));
		ui_interface->declare(&fVslider4, "4", "");
		ui_interface->declare(&fVslider4, "style", "knob");
		ui_interface->declare(&fVslider4, "tooltip", "Percentage frequency-shift up or down for third detuned oscillator");
		ui_interface->declare(&fVslider4, "unit", "%%");
		ui_interface->addVerticalSlider("Detuning 2", &fVslider4, FAUSTFLOAT(0.1f), FAUSTFLOAT(-1e+01f), FAUSTFLOAT(1e+01f), FAUSTFLOAT(0.01f));
		ui_interface->declare(&fVslider2, "5", "");
		ui_interface->declare(&fVslider2, "scale", "log");
		ui_interface->declare(&fVslider2, "style", "knob");
		ui_interface->declare(&fVslider2, "tooltip", "Portamento (frequency-glide) time-constant in seconds");
		ui_interface->declare(&fVslider2, "unit", "sec");
		ui_interface->addVerticalSlider("Portamento", &fVslider2, FAUSTFLOAT(0.1f), FAUSTFLOAT(0.001f), FAUSTFLOAT(1e+01f), FAUSTFLOAT(0.001f));
		ui_interface->declare(&fEntry0, "6", "");
		ui_interface->declare(&fEntry0, "tooltip", "Order of sawtooth aliasing     suppression");
		ui_interface->addNumEntry("Saw Order", &fEntry0, FAUSTFLOAT(2.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(4.0f), FAUSTFLOAT(1.0f));
		ui_interface->closeBox();
		ui_interface->closeBox();
	}
	
	virtual void compute(int count, FAUSTFLOAT** RESTRICT inputs, FAUSTFLOAT** RESTRICT outputs) {
		FAUSTFLOAT* input0 = inputs[0];
		FAUSTFLOAT* output0 = outputs[0];
		float fSlow0 = static_cast<float>(fVslider0);
		float fSlow1 = std::pow(1e+01f, 0.05f * static_cast<float>(fHslider0));
		float fSlow2 = 0.33333334f * static_cast<float>(fVslider1);
		int iSlow3 = static_cast<int>(static_cast<float>(fEntry0) + -1.0f);
		int iSlow4 = iSlow3 >= 2;
		int iSlow5 = iSlow3 >= 1;
		float fSlow6 = std::pow(2.0f, 0.083333336f * (static_cast<float>(fHslider1) + -49.0f));
		float fSlow7 = 4.4e+02f * fSlow6;
		float fSlow8 = ((0) ? 0.0f : std::exp(-(fConst2 / ((0) ? 1.0f : static_cast<float>(fVslider2)))));
		int iSlow9 = iSlow3 >= 3;
		float fSlow10 = 0.01f * static_cast<float>(fVslider3) + 1.0f;
		float fSlow11 = 0.01f * static_cast<float>(fVslider4) + 1.0f;
		float fSlow12 = fConst6 * static_cast<float>(fVslider5);
		float fSlow13 = fConst8 * static_cast<float>(fVslider6);
		float fSlow14 = static_cast<float>(fVslider7);
		float fSlow15 = static_cast<float>(fCheckbox0);
		float fSlow16 = 0.33333334f * fSlow15;
		float fSlow17 = static_cast<float>(fVslider8);
		float fSlow18 = 1.0f - fSlow17;
		float fSlow19 = fConst6 * (1.0f - fSlow15);
		float fSlow20 = static_cast<float>(fVslider9);
		for (int i0 = 0; i0 < count; i0 = faust_wrap_add(i0, 1)) {
			fVec0[0] = fSlow1;
			iVec1[0] = 1;
			fRec0[0] = fConst1 * (std::min<float>(3.4028235e+38f, fVec0[1] - fSlow1) + fRec0[1]);
			int iTemp0 = faust_wrap_sub(1, iVec1[1]);
			fVec2[0] = fSlow6;
			fRec2[0] = fSlow8 * (std::min<float>(3.4028235e+38f, -(4.4e+02f * (fSlow6 - fVec2[1]))) + fRec2[1]);
			float fTemp1 = fSlow7 + fRec2[0];
			float fTemp2 = std::max<float>(2e+01f, std::fabs(fTemp1));
			fVec3[0] = fTemp2;
			float fTemp3 = fConst2 * fTemp2;
			float fTemp4 = 1.0737418e+09f * (fTemp3 - std::rint(fTemp3));
			float fTemp5 = std::floor(fTemp4);
			int iTemp6 = faust_wrap_add(iRec3[1], static_cast<int>(16777216.0f * (fTemp4 - fTemp5)));
			iRec3[0] = ((iTemp0) ? 0 : iTemp6 & 16777215);
			iRec1[0] = ((iTemp0) ? 0 : (faust_wrap_add(faust_wrap_add(iRec1[1], static_cast<int>(fTemp5)), iTemp6 >> 24)) & 1073741823);
			float fTemp7 = -1.0f + 1.1920929e-07f * static_cast<float>(iRec1[0] >> 6);
			float fTemp8 = static_cast<float>(iVec1[1]);
			float fTemp9 = virtual_analog_oscillator_faustpower2_f(fTemp7);
			fVec4[0] = fTemp9;
			float fTemp10 = static_cast<float>(iVec1[2]);
			float fTemp11 = static_cast<float>(iRec1[0]) + 5.9604645e-08f * static_cast<float>(iRec3[0]);
			float fTemp12 = 1.8626451e-09f * fTemp11;
			float fTemp13 = -1.0f + fTemp12;
			float fTemp14 = std::min<float>(3.4028235e+38f, fConst0 / fTemp2);
			fVec5[0] = fTemp14;
			float fTemp15 = 9.313226e-10f * fTemp11;
			float fTemp16 = fTemp2 + fVec3[1];
			float fTemp17 = fConst2 * fTemp16;
			float fTemp18 = fTemp15 - fTemp17;
			float fTemp19 = std::min<float>(fTemp18, 0.0f);
			float fTemp20 = std::min<float>(1.0f - fTemp17 + fTemp15, 0.0f);
			float fTemp21 = 2.0f - fTemp17 + fTemp15;
			int iTemp22 = fTemp21 < 0.0f;
			float fTemp23 = fTemp15 - (fTemp17 + std::floor(fTemp18));
			float fTemp24 = -1.0f + 2.0f * fTemp23;
			float fTemp25 = -1.0f + 2.0f * fTemp21;
			float fTemp26 = fTemp14 + fVec5[1];
			float fTemp27 = fTemp15 - fTemp3;
			float fTemp28 = std::min<float>(fTemp27, 0.0f);
			float fTemp29 = 1.0f - fTemp3 + fTemp15;
			int iTemp30 = fTemp29 < 0.0f;
			float fTemp31 = fTemp15 - (fTemp3 + std::floor(fTemp27));
			float fTemp32 = -1.0f + 2.0f * fTemp31;
			float fTemp33 = -1.0f + 2.0f * fTemp29;
			float fTemp34 = static_cast<float>(iVec1[3]);
			float fTemp35 = virtual_analog_oscillator_faustpower2_f(fTemp24);
			float fTemp36 = virtual_analog_oscillator_faustpower2_f(fTemp25);
			float fTemp37 = fTemp16 + fVec3[2];
			float fTemp38 = fConst2 * fTemp37;
			float fTemp39 = fTemp15 - fTemp38;
			float fTemp40 = 3.0f - fTemp38 + fTemp15;
			float fTemp41 = virtual_analog_oscillator_faustpower2_f(-1.0f + 2.0f * (fTemp15 - (fTemp38 + std::floor(fTemp39))));
			float fTemp42 = virtual_analog_oscillator_faustpower2_f(-1.0f + 2.0f * fTemp40);
			float fTemp43 = virtual_analog_oscillator_faustpower2_f(fTemp32);
			float fTemp44 = virtual_analog_oscillator_faustpower2_f(fTemp33);
			float fTemp45 = fTemp14 * (fTemp2 - fVec3[1]);
			fVec6[0] = fTemp45;
			float fTemp46 = -1.0f - fConst5 * fTemp16 + fTemp12;
			float fTemp47 = -1.0f - fConst5 * fTemp37 + fTemp12;
			float fTemp48 = -1.0f - fConst5 * fTemp2 + fTemp12;
			float fTemp49 = fSlow10 * fTemp1;
			float fTemp50 = std::max<float>(2e+01f, std::fabs(fTemp49));
			fVec7[0] = fTemp50;
			float fTemp51 = fConst2 * fTemp50;
			float fTemp52 = 1.0737418e+09f * (fTemp51 - std::rint(fTemp51));
			float fTemp53 = std::floor(fTemp52);
			int iTemp54 = faust_wrap_add(iRec5[1], static_cast<int>(16777216.0f * (fTemp52 - fTemp53)));
			iRec5[0] = ((iTemp0) ? 0 : iTemp54 & 16777215);
			iRec4[0] = ((iTemp0) ? 0 : (faust_wrap_add(faust_wrap_add(iRec4[1], static_cast<int>(fTemp53)), iTemp54 >> 24)) & 1073741823);
			float fTemp55 = -1.0f + 1.1920929e-07f * static_cast<float>(iRec4[0] >> 6);
			float fTemp56 = virtual_analog_oscillator_faustpower2_f(fTemp55);
			fVec8[0] = fTemp56;
			float fTemp57 = static_cast<float>(iRec4[0]) + 5.9604645e-08f * static_cast<float>(iRec5[0]);
			float fTemp58 = 1.8626451e-09f * fTemp57;
			float fTemp59 = -1.0f + fTemp58;
			float fTemp60 = std::min<float>(3.4028235e+38f, fConst0 / fTemp50);
			fVec9[0] = fTemp60;
			float fTemp61 = 9.313226e-10f * fTemp57;
			float fTemp62 = fTemp50 + fVec7[1];
			float fTemp63 = fConst2 * fTemp62;
			float fTemp64 = fTemp61 - fTemp63;
			float fTemp65 = std::min<float>(fTemp64, 0.0f);
			float fTemp66 = std::min<float>(1.0f - fTemp63 + fTemp61, 0.0f);
			float fTemp67 = 2.0f - fTemp63 + fTemp61;
			int iTemp68 = fTemp67 < 0.0f;
			float fTemp69 = fTemp61 - (fTemp63 + std::floor(fTemp64));
			float fTemp70 = -1.0f + 2.0f * fTemp69;
			float fTemp71 = -1.0f + 2.0f * fTemp67;
			float fTemp72 = fTemp60 + fVec9[1];
			float fTemp73 = fTemp61 - fTemp51;
			float fTemp74 = std::min<float>(fTemp73, 0.0f);
			float fTemp75 = 1.0f - fTemp51 + fTemp61;
			int iTemp76 = fTemp75 < 0.0f;
			float fTemp77 = fTemp61 - (fTemp51 + std::floor(fTemp73));
			float fTemp78 = -1.0f + 2.0f * fTemp77;
			float fTemp79 = -1.0f + 2.0f * fTemp75;
			float fTemp80 = virtual_analog_oscillator_faustpower2_f(fTemp70);
			float fTemp81 = virtual_analog_oscillator_faustpower2_f(fTemp71);
			float fTemp82 = fTemp62 + fVec7[2];
			float fTemp83 = fConst2 * fTemp82;
			float fTemp84 = fTemp61 - fTemp83;
			float fTemp85 = 3.0f - fTemp83 + fTemp61;
			float fTemp86 = virtual_analog_oscillator_faustpower2_f(-1.0f + 2.0f * (fTemp61 - (fTemp83 + std::floor(fTemp84))));
			float fTemp87 = virtual_analog_oscillator_faustpower2_f(-1.0f + 2.0f * fTemp85);
			float fTemp88 = virtual_analog_oscillator_faustpower2_f(fTemp78);
			float fTemp89 = virtual_analog_oscillator_faustpower2_f(fTemp79);
			float fTemp90 = fTemp60 * (fTemp50 - fVec7[1]);
			fVec10[0] = fTemp90;
			float fTemp91 = -1.0f - fConst5 * fTemp62 + fTemp58;
			float fTemp92 = -1.0f - fConst5 * fTemp82 + fTemp58;
			float fTemp93 = -1.0f - fConst5 * fTemp50 + fTemp58;
			float fTemp94 = fSlow11 * fTemp1;
			float fTemp95 = std::max<float>(2e+01f, std::fabs(fTemp94));
			fVec11[0] = fTemp95;
			float fTemp96 = fConst2 * fTemp95;
			float fTemp97 = 1.0737418e+09f * (fTemp96 - std::rint(fTemp96));
			float fTemp98 = std::floor(fTemp97);
			int iTemp99 = faust_wrap_add(iRec7[1], static_cast<int>(16777216.0f * (fTemp97 - fTemp98)));
			iRec7[0] = ((iTemp0) ? 0 : iTemp99 & 16777215);
			iRec6[0] = ((iTemp0) ? 0 : (faust_wrap_add(faust_wrap_add(iRec6[1], static_cast<int>(fTemp98)), iTemp99 >> 24)) & 1073741823);
			float fTemp100 = -1.0f + 1.1920929e-07f * static_cast<float>(iRec6[0] >> 6);
			float fTemp101 = virtual_analog_oscillator_faustpower2_f(fTemp100);
			fVec12[0] = fTemp101;
			float fTemp102 = static_cast<float>(iRec6[0]) + 5.9604645e-08f * static_cast<float>(iRec7[0]);
			float fTemp103 = 1.8626451e-09f * fTemp102;
			float fTemp104 = -1.0f + fTemp103;
			float fTemp105 = std::min<float>(3.4028235e+38f, fConst0 / fTemp95);
			fVec13[0] = fTemp105;
			float fTemp106 = 9.313226e-10f * fTemp102;
			float fTemp107 = fTemp95 + fVec11[1];
			float fTemp108 = fConst2 * fTemp107;
			float fTemp109 = fTemp106 - fTemp108;
			float fTemp110 = std::min<float>(fTemp109, 0.0f);
			float fTemp111 = std::min<float>(1.0f - fTemp108 + fTemp106, 0.0f);
			float fTemp112 = 2.0f - fTemp108 + fTemp106;
			int iTemp113 = fTemp112 < 0.0f;
			float fTemp114 = fTemp106 - (fTemp108 + std::floor(fTemp109));
			float fTemp115 = -1.0f + 2.0f * fTemp114;
			float fTemp116 = -1.0f + 2.0f * fTemp112;
			float fTemp117 = fTemp105 + fVec13[1];
			float fTemp118 = fTemp106 - fTemp96;
			float fTemp119 = std::min<float>(fTemp118, 0.0f);
			float fTemp120 = 1.0f - fTemp96 + fTemp106;
			int iTemp121 = fTemp120 < 0.0f;
			float fTemp122 = fTemp106 - (fTemp96 + std::floor(fTemp118));
			float fTemp123 = -1.0f + 2.0f * fTemp122;
			float fTemp124 = -1.0f + 2.0f * fTemp120;
			float fTemp125 = virtual_analog_oscillator_faustpower2_f(fTemp115);
			float fTemp126 = virtual_analog_oscillator_faustpower2_f(fTemp116);
			float fTemp127 = fTemp107 + fVec11[2];
			float fTemp128 = fConst2 * fTemp127;
			float fTemp129 = fTemp106 - fTemp128;
			float fTemp130 = 3.0f - fTemp128 + fTemp106;
			float fTemp131 = virtual_analog_oscillator_faustpower2_f(-1.0f + 2.0f * (fTemp106 - (fTemp128 + std::floor(fTemp129))));
			float fTemp132 = virtual_analog_oscillator_faustpower2_f(-1.0f + 2.0f * fTemp130);
			float fTemp133 = virtual_analog_oscillator_faustpower2_f(fTemp123);
			float fTemp134 = virtual_analog_oscillator_faustpower2_f(fTemp124);
			float fTemp135 = fTemp105 * (fTemp95 - fVec11[1]);
			fVec14[0] = fTemp135;
			float fTemp136 = -1.0f - fConst5 * fTemp107 + fTemp103;
			float fTemp137 = -1.0f - fConst5 * fTemp127 + fTemp103;
			float fTemp138 = -1.0f - fConst5 * fTemp95 + fTemp103;
			float fTemp139 = std::max<float>(fTemp1, 23.44895f);
			float fTemp140 = std::max<float>(2e+01f, std::fabs(fTemp139));
			fVec15[0] = fTemp140;
			float fTemp141 = fConst2 * fTemp140;
			float fTemp142 = 1.0737418e+09f * (fTemp141 - std::rint(fTemp141));
			float fTemp143 = std::floor(fTemp142);
			int iTemp144 = faust_wrap_add(iRec9[1], static_cast<int>(16777216.0f * (fTemp142 - fTemp143)));
			iRec9[0] = ((iTemp0) ? 0 : iTemp144 & 16777215);
			iRec8[0] = ((iTemp0) ? 0 : (faust_wrap_add(faust_wrap_add(iRec8[1], static_cast<int>(fTemp143)), iTemp144 >> 24)) & 1073741823);
			float fTemp145 = virtual_analog_oscillator_faustpower2_f(-1.0f + 1.1920929e-07f * static_cast<float>(iRec8[0] >> 6));
			fVec16[0] = fTemp145;
			float fTemp146 = fTemp8 * (fTemp145 - fVec16[1]) / fTemp140;
			fVec17[IOTA0 & 16383] = fTemp146;
			float fTemp147 = std::max<float>(0.0f, std::min<float>(8191.0f, fConst7 / fTemp139));
			int iTemp148 = static_cast<int>(fTemp147);
			float fTemp149 = std::floor(fTemp147);
			float fTemp150 = fTemp146 - fVec17[(faust_wrap_sub(IOTA0, iTemp148)) & 16383] * (1.0f - fTemp147 + fTemp149) - (fTemp147 - fTemp149) * fVec17[(faust_wrap_sub(IOTA0, faust_wrap_add(1, iTemp148))) & 16383];
			float fTemp151 = std::max<float>(fTemp49, 23.44895f);
			float fTemp152 = std::max<float>(2e+01f, std::fabs(fTemp151));
			fVec18[0] = fTemp152;
			float fTemp153 = fConst2 * fTemp152;
			float fTemp154 = 1.0737418e+09f * (fTemp153 - std::rint(fTemp153));
			float fTemp155 = std::floor(fTemp154);
			int iTemp156 = faust_wrap_add(iRec11[1], static_cast<int>(16777216.0f * (fTemp154 - fTemp155)));
			iRec11[0] = ((iTemp0) ? 0 : iTemp156 & 16777215);
			iRec10[0] = ((iTemp0) ? 0 : (faust_wrap_add(faust_wrap_add(iRec10[1], static_cast<int>(fTemp155)), iTemp156 >> 24)) & 1073741823);
			float fTemp157 = virtual_analog_oscillator_faustpower2_f(-1.0f + 1.1920929e-07f * static_cast<float>(iRec10[0] >> 6));
			fVec19[0] = fTemp157;
			float fTemp158 = fTemp8 * (fTemp157 - fVec19[1]) / fTemp152;
			fVec20[IOTA0 & 16383] = fTemp158;
			float fTemp159 = std::max<float>(0.0f, std::min<float>(8191.0f, fConst7 / fTemp151));
			int iTemp160 = static_cast<int>(fTemp159);
			float fTemp161 = std::floor(fTemp159);
			float fTemp162 = fTemp158 - fVec20[(faust_wrap_sub(IOTA0, iTemp160)) & 16383] * (1.0f - fTemp159 + fTemp161) - (fTemp159 - fTemp161) * fVec20[(faust_wrap_sub(IOTA0, faust_wrap_add(1, iTemp160))) & 16383];
			float fTemp163 = std::max<float>(fTemp94, 23.44895f);
			float fTemp164 = std::max<float>(2e+01f, std::fabs(fTemp163));
			fVec21[0] = fTemp164;
			float fTemp165 = fConst2 * fTemp164;
			float fTemp166 = 1.0737418e+09f * (fTemp165 - std::rint(fTemp165));
			float fTemp167 = std::floor(fTemp166);
			int iTemp168 = faust_wrap_add(iRec13[1], static_cast<int>(16777216.0f * (fTemp166 - fTemp167)));
			iRec13[0] = ((iTemp0) ? 0 : iTemp168 & 16777215);
			iRec12[0] = ((iTemp0) ? 0 : (faust_wrap_add(faust_wrap_add(iRec12[1], static_cast<int>(fTemp167)), iTemp168 >> 24)) & 1073741823);
			float fTemp169 = virtual_analog_oscillator_faustpower2_f(-1.0f + 1.1920929e-07f * static_cast<float>(iRec12[0] >> 6));
			fVec22[0] = fTemp169;
			float fTemp170 = fTemp8 * (fTemp169 - fVec22[1]) / fTemp164;
			fVec23[IOTA0 & 16383] = fTemp170;
			float fTemp171 = std::max<float>(0.0f, std::min<float>(8191.0f, fConst7 / fTemp163));
			int iTemp172 = static_cast<int>(fTemp171);
			float fTemp173 = std::floor(fTemp171);
			float fTemp174 = fTemp170 - fVec23[(faust_wrap_sub(IOTA0, iTemp172)) & 16383] * (1.0f - fTemp171 + fTemp173) - (fTemp171 - fTemp173) * fVec23[(faust_wrap_sub(IOTA0, faust_wrap_add(1, iTemp172))) & 16383];
			fRec14[0] = fConst3 * fTemp150 + fConst9 * fRec14[1];
			fRec15[0] = fConst3 * fTemp162 + fConst9 * fRec15[1];
			fRec16[0] = fConst3 * fTemp174 + fConst9 * fRec16[1];
			float fTemp175 = static_cast<float>(iRec8[0]) + 5.9604645e-08f * static_cast<float>(iRec9[0]);
			float fTemp176 = std::min<float>(3.4028235e+38f, fConst0 / fTemp140);
			fVec24[0] = fTemp176;
			float fTemp177 = 9.313226e-10f * fTemp175;
			float fTemp178 = fConst2 * (fTemp140 + fVec15[1]);
			float fTemp179 = fTemp177 - fTemp178;
			float fTemp180 = 2.0f - fTemp178 + fTemp177;
			float fTemp181 = fTemp177 - (fTemp178 + std::floor(fTemp179));
			float fTemp182 = fTemp177 - fTemp141;
			float fTemp183 = 1.0f - fTemp141 + fTemp177;
			float fTemp184 = fTemp177 - (fTemp141 + std::floor(fTemp182));
			float fTemp185 = 0.16666667f * (3.0f * (-1.0f + 1.8626451e-09f * fTemp175) - fConst2 * (4.0f * fTemp140 + 2.0f * fVec15[1])) * (1.0f + fConst2 * fVec15[1] * fTemp176) + fTemp176 * (fVec24[1] * (virtual_analog_oscillator_faustpower2_f(std::min<float>(fTemp179, 0.0f)) + virtual_analog_oscillator_faustpower2_f(std::min<float>(1.0f - fTemp178 + fTemp177, 0.0f)) + ((fTemp180 < 0.0f) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp181) + 2.0f * (fTemp180 - fTemp181) - virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp180)) : 0.0f)) - (fTemp176 + fVec24[1]) * (virtual_analog_oscillator_faustpower2_f(std::min<float>(fTemp182, 0.0f)) + ((fTemp183 < 0.0f) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp184) + 2.0f * (fTemp183 - fTemp184) - virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp183)) : 0.0f)));
			float fTemp186 = static_cast<float>(iRec10[0]) + 5.9604645e-08f * static_cast<float>(iRec11[0]);
			float fTemp187 = std::min<float>(3.4028235e+38f, fConst0 / fTemp152);
			fVec25[0] = fTemp187;
			float fTemp188 = 9.313226e-10f * fTemp186;
			float fTemp189 = fConst2 * (fTemp152 + fVec18[1]);
			float fTemp190 = fTemp188 - fTemp189;
			float fTemp191 = 2.0f - fTemp189 + fTemp188;
			float fTemp192 = fTemp188 - (fTemp189 + std::floor(fTemp190));
			float fTemp193 = fTemp188 - fTemp153;
			float fTemp194 = 1.0f - fTemp153 + fTemp188;
			float fTemp195 = fTemp188 - (fTemp153 + std::floor(fTemp193));
			float fTemp196 = 0.16666667f * (3.0f * (-1.0f + 1.8626451e-09f * fTemp186) - fConst2 * (4.0f * fTemp152 + 2.0f * fVec18[1])) * (1.0f + fConst2 * fVec18[1] * fTemp187) + fTemp187 * (fVec25[1] * (virtual_analog_oscillator_faustpower2_f(std::min<float>(fTemp190, 0.0f)) + virtual_analog_oscillator_faustpower2_f(std::min<float>(1.0f - fTemp189 + fTemp188, 0.0f)) + ((fTemp191 < 0.0f) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp192) + 2.0f * (fTemp191 - fTemp192) - virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp191)) : 0.0f)) - (fTemp187 + fVec25[1]) * (virtual_analog_oscillator_faustpower2_f(std::min<float>(fTemp193, 0.0f)) + ((fTemp194 < 0.0f) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp195) + 2.0f * (fTemp194 - fTemp195) - virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp194)) : 0.0f)));
			float fTemp197 = static_cast<float>(iRec12[0]) + 5.9604645e-08f * static_cast<float>(iRec13[0]);
			float fTemp198 = std::min<float>(3.4028235e+38f, fConst0 / fTemp164);
			fVec26[0] = fTemp198;
			float fTemp199 = 9.313226e-10f * fTemp197;
			float fTemp200 = fConst2 * (fTemp164 + fVec21[1]);
			float fTemp201 = fTemp199 - fTemp200;
			float fTemp202 = 2.0f - fTemp200 + fTemp199;
			float fTemp203 = fTemp199 - (fTemp200 + std::floor(fTemp201));
			float fTemp204 = fTemp199 - fTemp165;
			float fTemp205 = 1.0f - fTemp165 + fTemp199;
			float fTemp206 = fTemp199 - (fTemp165 + std::floor(fTemp204));
			float fTemp207 = 0.16666667f * (3.0f * (-1.0f + 1.8626451e-09f * fTemp197) - fConst2 * (4.0f * fTemp164 + 2.0f * fVec21[1])) * (1.0f + fConst2 * fVec21[1] * fTemp198) + fTemp198 * (fVec26[1] * (virtual_analog_oscillator_faustpower2_f(std::min<float>(fTemp201, 0.0f)) + virtual_analog_oscillator_faustpower2_f(std::min<float>(1.0f - fTemp200 + fTemp199, 0.0f)) + ((fTemp202 < 0.0f) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp203) + 2.0f * (fTemp202 - fTemp203) - virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp202)) : 0.0f)) - (fTemp198 + fVec26[1]) * (virtual_analog_oscillator_faustpower2_f(std::min<float>(fTemp204, 0.0f)) + ((fTemp205 < 0.0f) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp206) + 2.0f * (fTemp205 - fTemp206) - virtual_analog_oscillator_faustpower3_f(-1.0f + 2.0f * fTemp205)) : 0.0f)));
			fVec27[0] = fSlow17;
			fRec17[0] = 0.99f * (std::min<float>(3.4028235e+38f, fVec27[1] - fSlow17) + fRec17[1]);
			float fTemp208 = fSlow18 - fRec17[0];
			float fTemp209 = std::max<float>(0.0f, std::min<float>(8191.0f, fConst0 * (fTemp208 / fTemp163)));
			float fTemp210 = std::floor(fTemp209);
			float fTemp211 = fTemp209 - fTemp210;
			float fTemp212 = fTemp10 * fTemp207;
			fVec28[IOTA0 & 16383] = fTemp212;
			int iTemp213 = static_cast<int>(fTemp209);
			int iTemp214 = faust_wrap_add(1, iTemp213);
			float fTemp215 = std::max<float>(0.0f, std::min<float>(8191.0f, fConst0 * (fTemp208 / fTemp151)));
			float fTemp216 = std::floor(fTemp215);
			float fTemp217 = fTemp215 - fTemp216;
			float fTemp218 = fTemp10 * fTemp196;
			fVec29[IOTA0 & 16383] = fTemp218;
			int iTemp219 = static_cast<int>(fTemp215);
			int iTemp220 = faust_wrap_add(1, iTemp219);
			float fTemp221 = fTemp10 * fTemp185;
			fVec30[IOTA0 & 16383] = fTemp221;
			float fTemp222 = std::max<float>(0.0f, std::min<float>(8191.0f, fConst0 * (fTemp208 / fTemp139)));
			int iTemp223 = static_cast<int>(fTemp222);
			float fTemp224 = std::floor(fTemp222);
			float fTemp225 = 1.0f - fTemp222 + fTemp224;
			float fTemp226 = fTemp222 - fTemp224;
			int iTemp227 = faust_wrap_add(1, iTemp223);
			float fTemp228 = 1.0f - fTemp215 + fTemp216;
			float fTemp229 = 1.0f - fTemp209 + fTemp210;
			iRec19[0] = faust_wrap_add(12345, faust_wrap_mul(1103515245, iRec19[1]));
			fRec18[0] = 0.5221894f * fRec18[3] + 4.656613e-10f * static_cast<float>(iRec19[0]) + 2.494956f * fRec18[1] - 2.0172658f * fRec18[2];
			output0[i0] = static_cast<FAUSTFLOAT>(fSlow0 * static_cast<float>(input0[i0]) + (fSlow1 + fRec0[0]) * (fSlow2 * (((iSlow4) ? ((iSlow9) ? fTemp34 * fTemp14 * (0.33333334f * (fVec5[1] * ((fTemp26 + fVec5[2]) * (virtual_analog_oscillator_faustpower3_f(fTemp19) + virtual_analog_oscillator_faustpower3_f(fTemp20) + ((iTemp22) ? 0.015625f * (fTemp35 * (-2.0f + fTemp35) - fTemp36 * (-2.0f + fTemp36)) : 0.0f)) - fVec5[2] * (virtual_analog_oscillator_faustpower3_f(std::min<float>(fTemp39, 0.0f)) + virtual_analog_oscillator_faustpower3_f(std::min<float>(1.0f - fTemp38 + fTemp15, 0.0f)) + virtual_analog_oscillator_faustpower3_f(std::min<float>(2.0f - fTemp38 + fTemp15, 0.0f)) + ((fTemp40 < 0.0f) ? 0.015625f * (fTemp41 * (-2.0f + fTemp41) - fTemp42 * (-2.0f + fTemp42)) : 0.0f))) - (fTemp14 * fTemp26 + virtual_analog_oscillator_faustpower2_f(fVec5[1])) * (virtual_analog_oscillator_faustpower3_f(fTemp28) + ((iTemp30) ? 0.015625f * (fTemp43 * (-2.0f + fTemp43) - fTemp44 * (-2.0f + fTemp44)) : 0.0f))) + fConst4 * (fConst2 * fTemp14 * fTemp16 * fTemp37 * (4.0f * fTemp13 - fConst2 * (6.0f * fTemp2 + 4.0f * fVec3[1] + 2.0f * fVec3[2])) - 0.5f * (fTemp45 - fVec6[1]) * (-2.0f + fTemp46 * (fTemp46 + fTemp47) + fTemp48 * (fTemp48 + fTemp46) + fTemp47 * (fTemp48 + fTemp47)))) : fTemp10 * (0.16666667f * (3.0f * fTemp13 - fConst2 * (4.0f * fTemp2 + 2.0f * fVec3[1])) * (1.0f + fConst2 * fVec3[1] * fTemp14) + fTemp14 * (fVec5[1] * (virtual_analog_oscillator_faustpower2_f(fTemp19) + virtual_analog_oscillator_faustpower2_f(fTemp20) + ((iTemp22) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(fTemp24) + 2.0f * (fTemp21 - fTemp23) - virtual_analog_oscillator_faustpower3_f(fTemp25)) : 0.0f)) - fTemp26 * (virtual_analog_oscillator_faustpower2_f(fTemp28) + ((iTemp30) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(fTemp32) + 2.0f * (fTemp29 - fTemp31) - virtual_analog_oscillator_faustpower3_f(fTemp33)) : 0.0f))))) : ((iSlow5) ? fConst3 * (fTemp8 * (fTemp9 - fVec4[1]) / fTemp2) : fTemp7)) + ((iSlow4) ? ((iSlow9) ? fTemp34 * fTemp60 * (0.33333334f * (fVec9[1] * ((fTemp72 + fVec9[2]) * (virtual_analog_oscillator_faustpower3_f(fTemp65) + virtual_analog_oscillator_faustpower3_f(fTemp66) + ((iTemp68) ? 0.015625f * (fTemp80 * (-2.0f + fTemp80) - fTemp81 * (-2.0f + fTemp81)) : 0.0f)) - fVec9[2] * (virtual_analog_oscillator_faustpower3_f(std::min<float>(fTemp84, 0.0f)) + virtual_analog_oscillator_faustpower3_f(std::min<float>(1.0f - fTemp83 + fTemp61, 0.0f)) + virtual_analog_oscillator_faustpower3_f(std::min<float>(2.0f - fTemp83 + fTemp61, 0.0f)) + ((fTemp85 < 0.0f) ? 0.015625f * (fTemp86 * (-2.0f + fTemp86) - fTemp87 * (-2.0f + fTemp87)) : 0.0f))) - (fTemp60 * fTemp72 + virtual_analog_oscillator_faustpower2_f(fVec9[1])) * (virtual_analog_oscillator_faustpower3_f(fTemp74) + ((iTemp76) ? 0.015625f * (fTemp88 * (-2.0f + fTemp88) - fTemp89 * (-2.0f + fTemp89)) : 0.0f))) + fConst4 * (fConst2 * fTemp60 * fTemp62 * fTemp82 * (4.0f * fTemp59 - fConst2 * (6.0f * fTemp50 + 4.0f * fVec7[1] + 2.0f * fVec7[2])) - 0.5f * (fTemp90 - fVec10[1]) * (-2.0f + fTemp91 * (fTemp91 + fTemp92) + fTemp93 * (fTemp93 + fTemp91) + fTemp92 * (fTemp93 + fTemp92)))) : fTemp10 * (0.16666667f * (3.0f * fTemp59 - fConst2 * (4.0f * fTemp50 + 2.0f * fVec7[1])) * (1.0f + fConst2 * fVec7[1] * fTemp60) + fTemp60 * (fVec9[1] * (virtual_analog_oscillator_faustpower2_f(fTemp65) + virtual_analog_oscillator_faustpower2_f(fTemp66) + ((iTemp68) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(fTemp70) + 2.0f * (fTemp67 - fTemp69) - virtual_analog_oscillator_faustpower3_f(fTemp71)) : 0.0f)) - fTemp72 * (virtual_analog_oscillator_faustpower2_f(fTemp74) + ((iTemp76) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(fTemp78) + 2.0f * (fTemp75 - fTemp77) - virtual_analog_oscillator_faustpower3_f(fTemp79)) : 0.0f))))) : ((iSlow5) ? fConst3 * (fTemp8 * (fTemp56 - fVec8[1]) / fTemp50) : fTemp55)) + ((iSlow4) ? ((iSlow9) ? fTemp34 * fTemp105 * (0.33333334f * (fVec13[1] * ((fTemp117 + fVec13[2]) * (virtual_analog_oscillator_faustpower3_f(fTemp110) + virtual_analog_oscillator_faustpower3_f(fTemp111) + ((iTemp113) ? 0.015625f * (fTemp125 * (-2.0f + fTemp125) - fTemp126 * (-2.0f + fTemp126)) : 0.0f)) - fVec13[2] * (virtual_analog_oscillator_faustpower3_f(std::min<float>(fTemp129, 0.0f)) + virtual_analog_oscillator_faustpower3_f(std::min<float>(1.0f - fTemp128 + fTemp106, 0.0f)) + virtual_analog_oscillator_faustpower3_f(std::min<float>(2.0f - fTemp128 + fTemp106, 0.0f)) + ((fTemp130 < 0.0f) ? 0.015625f * (fTemp131 * (-2.0f + fTemp131) - fTemp132 * (-2.0f + fTemp132)) : 0.0f))) - (fTemp105 * fTemp117 + virtual_analog_oscillator_faustpower2_f(fVec13[1])) * (virtual_analog_oscillator_faustpower3_f(fTemp119) + ((iTemp121) ? 0.015625f * (fTemp133 * (-2.0f + fTemp133) - fTemp134 * (-2.0f + fTemp134)) : 0.0f))) + fConst4 * (fConst2 * fTemp105 * fTemp107 * fTemp127 * (4.0f * fTemp104 - fConst2 * (6.0f * fTemp95 + 4.0f * fVec11[1] + 2.0f * fVec11[2])) - 0.5f * (fTemp135 - fVec14[1]) * (-2.0f + fTemp136 * (fTemp136 + fTemp137) + fTemp138 * (fTemp138 + fTemp136) + fTemp137 * (fTemp138 + fTemp137)))) : fTemp10 * (0.16666667f * (3.0f * fTemp104 - fConst2 * (4.0f * fTemp95 + 2.0f * fVec11[1])) * (1.0f + fConst2 * fVec11[1] * fTemp105) + fTemp105 * (fVec13[1] * (virtual_analog_oscillator_faustpower2_f(fTemp110) + virtual_analog_oscillator_faustpower2_f(fTemp111) + ((iTemp113) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(fTemp115) + 2.0f * (fTemp112 - fTemp114) - virtual_analog_oscillator_faustpower3_f(fTemp116)) : 0.0f)) - fTemp117 * (virtual_analog_oscillator_faustpower2_f(fTemp119) + ((iTemp121) ? 0.041666668f * (virtual_analog_oscillator_faustpower3_f(fTemp123) + 2.0f * (fTemp120 - fTemp122) - virtual_analog_oscillator_faustpower3_f(fTemp124)) : 0.0f))))) : ((iSlow5) ? fConst3 * (fTemp8 * (fTemp101 - fVec12[1]) / fTemp95) : fTemp100))) + fSlow12 * (fTemp150 + fTemp162 + fTemp174) + fSlow13 * fTemp1 * (fRec14[0] + fSlow10 * fRec15[0] + fSlow11 * fRec16[0]) + fSlow14 * (fSlow16 * (fTemp10 * (fTemp185 + fTemp196 + fTemp207) - (fTemp211 * fVec28[(faust_wrap_sub(IOTA0, iTemp214)) & 16383] + fTemp217 * fVec29[(faust_wrap_sub(IOTA0, iTemp220)) & 16383] + fVec30[(faust_wrap_sub(IOTA0, iTemp223)) & 16383] * fTemp225 + fTemp226 * fVec30[(faust_wrap_sub(IOTA0, iTemp227)) & 16383] + fVec29[(faust_wrap_sub(IOTA0, iTemp219)) & 16383] * fTemp228 + fVec28[(faust_wrap_sub(IOTA0, iTemp213)) & 16383] * fTemp229)) + fSlow19 * (fTemp146 - fTemp225 * fVec17[(faust_wrap_sub(IOTA0, iTemp223)) & 16383] - fTemp226 * fVec17[(faust_wrap_sub(IOTA0, iTemp227)) & 16383] + (fTemp158 - fTemp228 * fVec20[(faust_wrap_sub(IOTA0, iTemp219)) & 16383] - fTemp217 * fVec20[(faust_wrap_sub(IOTA0, iTemp220)) & 16383]) + (fTemp170 - fTemp229 * fVec23[(faust_wrap_sub(IOTA0, iTemp213)) & 16383] - fTemp211 * fVec23[(faust_wrap_sub(IOTA0, iTemp214)) & 16383]))) + fSlow20 * (0.049922034f * fRec18[0] + 0.0506127f * fRec18[2] - (0.095993534f * fRec18[1] + 0.004408786f * fRec18[3]))));
			fVec0[1] = fVec0[0];
			for (int j0 = 3; j0 > 0; j0 = faust_wrap_sub(j0, 1)) {
				iVec1[j0] = iVec1[faust_wrap_sub(j0, 1)];
			}
			fRec0[1] = fRec0[0];
			fVec2[1] = fVec2[0];
			fRec2[1] = fRec2[0];
			fVec3[2] = fVec3[1];
			fVec3[1] = fVec3[0];
			iRec3[1] = iRec3[0];
			iRec1[1] = iRec1[0];
			fVec4[1] = fVec4[0];
			fVec5[2] = fVec5[1];
			fVec5[1] = fVec5[0];
			fVec6[1] = fVec6[0];
			fVec7[2] = fVec7[1];
			fVec7[1] = fVec7[0];
			iRec5[1] = iRec5[0];
			iRec4[1] = iRec4[0];
			fVec8[1] = fVec8[0];
			fVec9[2] = fVec9[1];
			fVec9[1] = fVec9[0];
			fVec10[1] = fVec10[0];
			fVec11[2] = fVec11[1];
			fVec11[1] = fVec11[0];
			iRec7[1] = iRec7[0];
			iRec6[1] = iRec6[0];
			fVec12[1] = fVec12[0];
			fVec13[2] = fVec13[1];
			fVec13[1] = fVec13[0];
			fVec14[1] = fVec14[0];
			fVec15[1] = fVec15[0];
			iRec9[1] = iRec9[0];
			iRec8[1] = iRec8[0];
			fVec16[1] = fVec16[0];
			IOTA0 = faust_wrap_add(IOTA0, 1);
			fVec18[1] = fVec18[0];
			iRec11[1] = iRec11[0];
			iRec10[1] = iRec10[0];
			fVec19[1] = fVec19[0];
			fVec21[1] = fVec21[0];
			iRec13[1] = iRec13[0];
			iRec12[1] = iRec12[0];
			fVec22[1] = fVec22[0];
			fRec14[1] = fRec14[0];
			fRec15[1] = fRec15[0];
			fRec16[1] = fRec16[0];
			fVec24[1] = fVec24[0];
			fVec25[1] = fVec25[0];
			fVec26[1] = fVec26[0];
			fVec27[1] = fVec27[0];
			fRec17[1] = fRec17[0];
			iRec19[1] = iRec19[0];
			for (int j1 = 3; j1 > 0; j1 = faust_wrap_sub(j1, 1)) {
				fRec18[j1] = fRec18[faust_wrap_sub(j1, 1)];
			}
		}
	}

};

#endif
