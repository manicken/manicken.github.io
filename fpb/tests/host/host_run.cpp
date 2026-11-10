// Host test for the FPB firmware code (FPB.cpp + FPB_ops.cpp), built with a PC compiler.
//
//   host_run <file.fpb> <blocks> <input.f32|-> <output.f32> <params.txt|-> [chunk]
//
// The container is fed to the loader in pieces of `chunk` bytes (default 7) to exercise the push parser.
// input.f32: planar float32, nIn channels x blocks*128 samples. output.f32: same layout for the outputs.
// params.txt: lines "<block> <index> <value>", applied before that block is processed.
// On a load error it prints "ERR <name> <section> <index>" and exits with 2.
#include "../../teensy/FPB/src/FPB.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <vector>

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
    if (argc < 6) { fprintf(stderr, "usage: host_run file.fpb blocks input.f32|- output.f32 params.txt|- [chunk]\n"); return 1; }
    std::vector<uint8_t> fpb = readFile(argv[1]);
    int blocks = atoi(argv[2]);
    size_t chunk = argc > 6 ? (size_t)atoi(argv[6]) : 7;
    if (chunk == 0) chunk = 1;

    FPB_Loader loader;
    loader.begin();
    int err = FPB_OK;
    for (size_t pos = 0; pos < fpb.size() && !err; pos += chunk) {
        size_t n = fpb.size() - pos < chunk ? fpb.size() - pos : chunk;
        err = loader.feed(fpb.data() + pos, n);
    }
    FPB_Program* p = err ? nullptr : loader.finish();
    if (!p) {
        int e = loader.error();
        printf("ERR %s %u %u\n", fpb_error_name(e), (unsigned)loader.errorSection(), (unsigned)loader.errorIndex());
        return 2;
    }

    const int N = 128;
    int nIn = p->numInputs(), nOut = p->numOutputs();
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
        if (!f) { fprintf(stderr, "cannot open %s\n", argv[5]); return 1; }
        P q;
        while (fscanf(f, "%d %d %f", &q.block, &q.index, &q.value) == 3) params.push_back(q);
        fclose(f);
    }

    std::vector<float> out((size_t)nOut * blocks * N, 0.0f);
    std::vector<const float*> ip(nIn ? nIn : 1);
    std::vector<float*> op(nOut ? nOut : 1);
    for (int b = 0; b < blocks; b++) {
        for (const P& q : params) if (q.block == b) p->setParam((uint16_t)q.index, q.value);
        for (int c = 0; c < nIn; c++) ip[c] = in.data() + ((size_t)c * blocks + b) * N;
        for (int c = 0; c < nOut; c++) op[c] = out.data() + ((size_t)c * blocks + b) * N;
        p->process(ip.data(), op.data(), N);
    }

    FILE* f = fopen(argv[4], "wb");
    if (!f) { fprintf(stderr, "cannot write %s\n", argv[4]); return 1; }
    fwrite(out.data(), 4, out.size(), f);
    fclose(f);
    printf("OK in=%d out=%d params=%u fast=%u dma=%u ext=%u any=%u\n", nIn, nOut, (unsigned)p->numParams(),
           (unsigned)p->memoryUsed(0), (unsigned)p->memoryUsed(1), (unsigned)p->memoryUsed(2), (unsigned)p->memoryUsed(3));
    delete p;
    return 0;
}
