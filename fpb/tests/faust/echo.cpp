/* ------------------------------------------------------------
name: "echo"
Code generated with Faust 2.88.0 (https://faust.grame.fr)
Compilation options: -lang cpp -fpga-mem-th 4 -ct 1 -cn echo -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 0
------------------------------------------------------------ */

#ifndef  __echo_H__
#define  __echo_H__

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
#define FAUSTCLASS echo
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


class echo : public dsp {
	
 private:
	
	int IOTA0;
	FAUSTFLOAT fHslider0;
	int fSampleRate;
	float fConst0;
	FAUSTFLOAT fHslider1;
	float fRec0[131072];
	
 public:
	echo() {
	}
	
	echo(const echo&) = default;
	
	virtual ~echo() = default;
	
	echo& operator=(const echo&) = default;
	
	void metadata(Meta* m) { 
		m->declare("compile_options", "-lang cpp -fpga-mem-th 4 -ct 1 -cn echo -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 0");
		m->declare("delays.lib/name", "Faust Delay Library");
		m->declare("delays.lib/version", "1.2.0");
		m->declare("filename", "echo.dsp");
		m->declare("maths.lib/author", "GRAME");
		m->declare("maths.lib/copyright", "GRAME");
		m->declare("maths.lib/license", "LicenseRef-LGPL-2.1-or-later-with-Faust-exception");
		m->declare("maths.lib/name", "Faust Math Library");
		m->declare("maths.lib/version", "2.9.0");
		m->declare("name", "echo");
		m->declare("platform.lib/name", "Generic Platform Library");
		m->declare("platform.lib/version", "1.3.0");
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
		fConst0 = 0.001f * std::min<float>(1.92e+05f, std::max<float>(1.0f, static_cast<float>(fSampleRate)));
	}
	
	virtual void instanceResetUserInterface() {
		fHslider0 = static_cast<FAUSTFLOAT>(2.5e+02f);
		fHslider1 = static_cast<FAUSTFLOAT>(0.4f);
	}
	
	virtual void instanceClear() {
		IOTA0 = 0;
		for (int l0 = 0; l0 < 131072; l0 = faust_wrap_add(l0, 1)) {
			fRec0[l0] = 0.0f;
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
	
	virtual echo* clone() {
		return new echo(*this);
	}
	
	virtual int getSampleRate() {
		return fSampleRate;
	}
	
	virtual void buildUserInterface(UI* ui_interface) {
		ui_interface->openVerticalBox("echo");
		ui_interface->declare(&fHslider0, "unit", "ms");
		ui_interface->addHorizontalSlider("delay", &fHslider0, FAUSTFLOAT(2.5e+02f), FAUSTFLOAT(1.0f), FAUSTFLOAT(1e+03f), FAUSTFLOAT(1.0f));
		ui_interface->addHorizontalSlider("feedback", &fHslider1, FAUSTFLOAT(0.4f), FAUSTFLOAT(0.0f), FAUSTFLOAT(0.95f), FAUSTFLOAT(0.01f));
		ui_interface->closeBox();
	}
	
	virtual void compute(int count, FAUSTFLOAT** RESTRICT inputs, FAUSTFLOAT** RESTRICT outputs) {
		FAUSTFLOAT* input0 = inputs[0];
		FAUSTFLOAT* output0 = outputs[0];
		int iSlow0 = faust_wrap_add(static_cast<int>(std::min<float>(65536.0f, std::max<float>(0.0f, fConst0 * static_cast<float>(fHslider0)))), 1);
		float fSlow1 = static_cast<float>(fHslider1);
		for (int i0 = 0; i0 < count; i0 = faust_wrap_add(i0, 1)) {
			fRec0[IOTA0 & 131071] = static_cast<float>(input0[i0]) + fSlow1 * fRec0[(faust_wrap_sub(IOTA0, iSlow0)) & 131071];
			output0[i0] = static_cast<FAUSTFLOAT>(fRec0[IOTA0 & 131071]);
			IOTA0 = faust_wrap_add(IOTA0, 1);
		}
	}

};

#endif
