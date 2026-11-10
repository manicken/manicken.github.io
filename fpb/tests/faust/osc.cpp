/* ------------------------------------------------------------
name: "osc"
Code generated with Faust 2.88.0 (https://faust.grame.fr)
Compilation options: -lang cpp -fpga-mem-th 4 -ct 1 -cn osc -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 0
------------------------------------------------------------ */

#ifndef  __osc_H__
#define  __osc_H__

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
#define FAUSTCLASS osc
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

class oscSIG0 {
	
  private:
	
	int iVec0[2];
	int iRec0[2];
	int fSampleRate;
	
  public:
	
	int getNumInputsoscSIG0() {
		return 0;
	}
	int getNumOutputsoscSIG0() {
		return 1;
	}
	
	void instanceInitoscSIG0(int sample_rate) {
		fSampleRate = sample_rate;
		for (int l0 = 0; l0 < 2; l0 = faust_wrap_add(l0, 1)) {
			iVec0[l0] = 0;
		}
		for (int l1 = 0; l1 < 2; l1 = faust_wrap_add(l1, 1)) {
			iRec0[l1] = 0;
		}
	}
	
	void filloscSIG0(int count, float* table) {
		for (int i1 = 0; i1 < count; i1 = faust_wrap_add(i1, 1)) {
			iVec0[0] = 1;
			iRec0[0] = (faust_wrap_add(iVec0[1], iRec0[1])) % 65536;
			table[i1] = std::sin(9.58738e-05f * static_cast<float>(iRec0[0]));
			iVec0[1] = iVec0[0];
			iRec0[1] = iRec0[0];
		}
	}

};

static oscSIG0* newoscSIG0() { return (oscSIG0*)new oscSIG0(); }
static void deleteoscSIG0(oscSIG0* dsp) { delete dsp; }

static float ftbl0oscSIG0[65536];

class osc : public dsp {
	
 private:
	
	int iVec1[2];
	FAUSTFLOAT fHslider0;
	int fSampleRate;
	float fConst0;
	float fRec1[2];
	FAUSTFLOAT fHslider1;
	
 public:
	osc() {
	}
	
	osc(const osc&) = default;
	
	virtual ~osc() = default;
	
	osc& operator=(const osc&) = default;
	
	void metadata(Meta* m) { 
		m->declare("basics.lib/name", "Faust Basic Element Library");
		m->declare("basics.lib/version", "1.23.0");
		m->declare("compile_options", "-lang cpp -fpga-mem-th 4 -ct 1 -cn osc -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 0");
		m->declare("filename", "osc.dsp");
		m->declare("maths.lib/author", "GRAME");
		m->declare("maths.lib/copyright", "GRAME");
		m->declare("maths.lib/license", "LicenseRef-LGPL-2.1-or-later-with-Faust-exception");
		m->declare("maths.lib/name", "Faust Math Library");
		m->declare("maths.lib/version", "2.9.0");
		m->declare("name", "osc");
		m->declare("oscillators.lib/name", "Faust Oscillator Library");
		m->declare("oscillators.lib/version", "1.8.0");
		m->declare("platform.lib/name", "Generic Platform Library");
		m->declare("platform.lib/version", "1.3.0");
	}

	virtual int getNumInputs() {
		return 0;
	}
	virtual int getNumOutputs() {
		return 1;
	}
	
	static void classInit(int sample_rate) {
		oscSIG0* sig0 = newoscSIG0();
		sig0->instanceInitoscSIG0(sample_rate);
		sig0->filloscSIG0(65536, ftbl0oscSIG0);
		deleteoscSIG0(sig0);
	}
	
	virtual void instanceConstants(int sample_rate) {
		fSampleRate = sample_rate;
		fConst0 = 1.0f / std::min<float>(1.92e+05f, std::max<float>(1.0f, static_cast<float>(fSampleRate)));
	}
	
	virtual void instanceResetUserInterface() {
		fHslider0 = static_cast<FAUSTFLOAT>(4.4e+02f);
		fHslider1 = static_cast<FAUSTFLOAT>(0.5f);
	}
	
	virtual void instanceClear() {
		for (int l2 = 0; l2 < 2; l2 = faust_wrap_add(l2, 1)) {
			iVec1[l2] = 0;
		}
		for (int l3 = 0; l3 < 2; l3 = faust_wrap_add(l3, 1)) {
			fRec1[l3] = 0.0f;
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
	
	virtual osc* clone() {
		return new osc(*this);
	}
	
	virtual int getSampleRate() {
		return fSampleRate;
	}
	
	virtual void buildUserInterface(UI* ui_interface) {
		ui_interface->openVerticalBox("osc");
		ui_interface->declare(&fHslider0, "scale", "log");
		ui_interface->declare(&fHslider0, "unit", "Hz");
		ui_interface->addHorizontalSlider("freq", &fHslider0, FAUSTFLOAT(4.4e+02f), FAUSTFLOAT(2e+01f), FAUSTFLOAT(2e+04f), FAUSTFLOAT(1.0f));
		ui_interface->addHorizontalSlider("gain", &fHslider1, FAUSTFLOAT(0.5f), FAUSTFLOAT(0.0f), FAUSTFLOAT(1.0f), FAUSTFLOAT(0.01f));
		ui_interface->closeBox();
	}
	
	virtual void compute(int count, FAUSTFLOAT** RESTRICT inputs, FAUSTFLOAT** RESTRICT outputs) {
		FAUSTFLOAT* output0 = outputs[0];
		float fSlow0 = fConst0 * static_cast<float>(fHslider0);
		float fSlow1 = static_cast<float>(fHslider1);
		for (int i0 = 0; i0 < count; i0 = faust_wrap_add(i0, 1)) {
			iVec1[0] = 1;
			float fTemp0 = ((faust_wrap_sub(1, iVec1[1])) ? 0.0f : fSlow0 + fRec1[1]);
			fRec1[0] = fTemp0 - std::floor(fTemp0);
			output0[i0] = static_cast<FAUSTFLOAT>(fSlow1 * ftbl0oscSIG0[std::max<int>(0, std::min<int>(static_cast<int>(65536.0f * fRec1[0]), 65535))]);
			iVec1[1] = iVec1[0];
			fRec1[1] = fRec1[0];
		}
	}

};

#endif
