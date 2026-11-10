// Runs the C++ class that Faust itself generated (faust -lang cpp -cn <name>), as the reference for the
// whole chain. Same arguments and file formats as host_run (no chunk argument).
//
//   g++ -O2 -DFAUST_FILE="\"path/name.cpp\"" -DFAUST_CLASS=name host_faust.cpp -o host_faust_name
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <vector>
#include <cmath>
#include <algorithm>

#define FAUSTFLOAT float

struct Meta { void declare(const char*, const char*) {} };
struct Soundfile;
struct UI {
    std::vector<float*> zones;      // input widgets in UI order = FPB param index
    void openTabBox(const char*) {}
    void openHorizontalBox(const char*) {}
    void openVerticalBox(const char*) {}
    void closeBox() {}
    void addButton(const char*, float* z) { zones.push_back(z); }
    void addCheckButton(const char*, float* z) { zones.push_back(z); }
    void addVerticalSlider(const char*, float* z, float, float, float, float) { zones.push_back(z); }
    void addHorizontalSlider(const char*, float* z, float, float, float, float) { zones.push_back(z); }
    void addNumEntry(const char*, float* z, float, float, float, float) { zones.push_back(z); }
    void addHorizontalBargraph(const char*, float*, float, float) {}
    void addVerticalBargraph(const char*, float*, float, float) {}
    void addSoundfile(const char*, const char*, Soundfile**) {}
    void declare(float*, const char*, const char*) {}
};
struct dsp { virtual ~dsp() {} };

#include FAUST_FILE

static std::vector<uint8_t> readFile(const char* path) {
    std::vector<uint8_t> v;
    FILE* f = fopen(path, "rb");
    if (!f) { fprintf(stderr, "cannot open %s\n", path); exit(1); }
    uint8_t b[4096];
    size_t n;
    while ((n = fread(b, 1, sizeof(b), f)) > 0) v.insert(v.end(), b, b + n);
    fclose(f);
    return v;
}

int main(int argc, char** argv) {
    if (argc < 6) { fprintf(stderr, "usage: host_faust x blocks input.f32|- output.f32 params.txt|-\n"); return 1; }
    int blocks = atoi(argv[2]);
    static FAUST_CLASS d;
    UI ui;
    d.init(44117);
    d.buildUserInterface(&ui);
    const int N = 128;
    int nIn = d.getNumInputs(), nOut = d.getNumOutputs();
    std::vector<float> in((size_t)nIn * blocks * N, 0.0f);
    if (nIn && argv[3][0] != '-') {
        std::vector<uint8_t> raw = readFile(argv[3]);
        if (raw.size() != in.size() * 4) { fprintf(stderr, "input size mismatch\n"); return 1; }
        memcpy(in.data(), raw.data(), raw.size());
    }
    struct P { int block, index; float value; };
    std::vector<P> params;
    if (argv[5][0] != '-') {
        FILE* f = fopen(argv[5], "r");
        P q;
        while (f && fscanf(f, "%d %d %f", &q.block, &q.index, &q.value) == 3) params.push_back(q);
        if (f) fclose(f);
    }
    std::vector<float> out((size_t)nOut * blocks * N, 0.0f);
    std::vector<float*> ip(nIn ? nIn : 1), op(nOut ? nOut : 1);
    for (int b = 0; b < blocks; b++) {
        for (const P& q : params) if (q.block == b && q.index < (int)ui.zones.size()) *ui.zones[q.index] = q.value;
        for (int c = 0; c < nIn; c++) ip[c] = in.data() + ((size_t)c * blocks + b) * N;
        for (int c = 0; c < nOut; c++) op[c] = out.data() + ((size_t)c * blocks + b) * N;
        d.compute(N, ip.data(), op.data());
    }
    FILE* f = fopen(argv[4], "wb");
    fwrite(out.data(), 4, out.size(), f);
    fclose(f);
    printf("OK\n");
    return 0;
}
