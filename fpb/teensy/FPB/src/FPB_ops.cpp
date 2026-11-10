// FPB op implementations and the op table.
// Semantics must match red/fpb/fpb-core.js (OP_IMPL), which the tool uses to verify compiled patches.

// No fused multiply-add contraction: madd/msub round the product and the sum separately, exactly as
// the verifier VM and the Faust reference do. (GCC would otherwise emit vfma on the Cortex-M7.)
#pragma GCC optimize ("fp-contract=off")

#include "FPB_ops.h"
#include "FPB_oplist.h"
#include <math.h>
#include <string.h>

#define F(k)    (*(float*)s->p[k])
#define I(k)    (*(int32_t*)s->p[k])
#define A(k)    (*(const FPB_ArrayRef*)s->p[k])
#define NEXT(n) return (const FPB_Step*)&s->p[n]
#define OPFN(name) static const FPB_Step* fpb_##name(const FPB_Step* s)

static inline int32_t wrap(uint32_t v) { return (int32_t)v; }

static inline int32_t f2i(float x) {
    if (!(x == x)) return 0;                        // NaN
    if (x >= 2147483647.0f) return INT32_MAX;
    if (x <= -2147483648.0f) return INT32_MIN;
    return (int32_t)x;                              // truncates toward zero
}

const FPB_Step* fpb_end(const FPB_Step*) { return nullptr; }
OPFN(reserved) { (void)s; return nullptr; }         // never runs: the loader rejects reserved ops

// ---- core ----
OPFN(mov)      { F(0) = F(1);                      NEXT(2); }
OPFN(add)      { F(0) = F(1) + F(2);               NEXT(3); }
OPFN(sub)      { F(0) = F(1) - F(2);               NEXT(3); }
OPFN(mul)      { F(0) = F(1) * F(2);               NEXT(3); }
OPFN(div)      { F(0) = F(1) / F(2);               NEXT(3); }
OPFN(neg)      { F(0) = -F(1);                     NEXT(2); }
OPFN(madd)     { F(0) = F(1) * F(2) + F(3);        NEXT(4); }
OPFN(msub)     { F(0) = F(3) - F(1) * F(2);        NEXT(4); }
OPFN(min)      { float a = F(1), b = F(2); F(0) = (b < a) ? b : a; NEXT(3); }   // as std::min(a, b)
OPFN(max)      { float a = F(1), b = F(2); F(0) = (a < b) ? b : a; NEXT(3); }   // as std::max(a, b)
OPFN(abs)      { F(0) = fabsf(F(1));               NEXT(2); }
OPFN(select)   { F(0) = I(1) ? F(2) : F(3);        NEXT(4); }
OPFN(lt)       { I(0) = F(1) <  F(2);              NEXT(3); }
OPFN(le)       { I(0) = F(1) <= F(2);              NEXT(3); }
OPFN(gt)       { I(0) = F(1) >  F(2);              NEXT(3); }
OPFN(ge)       { I(0) = F(1) >= F(2);              NEXT(3); }
OPFN(eq)       { I(0) = F(1) == F(2);              NEXT(3); }
OPFN(ne)       { I(0) = F(1) != F(2);              NEXT(3); }
OPFN(copysign) { F(0) = copysignf(F(1), F(2));     NEXT(3); }

// ---- math ----
OPFN(floor)    { F(0) = floorf(F(1));              NEXT(2); }
OPFN(ceil)     { F(0) = ceilf(F(1));               NEXT(2); }
OPFN(round)    { F(0) = roundf(F(1));              NEXT(2); }
OPFN(rint)     { F(0) = rintf(F(1));               NEXT(2); }
OPFN(sqrt)     { F(0) = sqrtf(F(1));               NEXT(2); }
OPFN(sin)      { F(0) = sinf(F(1));                NEXT(2); }
OPFN(cos)      { F(0) = cosf(F(1));                NEXT(2); }
OPFN(tan)      { F(0) = tanf(F(1));                NEXT(2); }
OPFN(asin)     { F(0) = asinf(F(1));               NEXT(2); }
OPFN(acos)     { F(0) = acosf(F(1));               NEXT(2); }
OPFN(atan)     { F(0) = atanf(F(1));               NEXT(2); }
OPFN(atan2)    { F(0) = atan2f(F(1), F(2));        NEXT(3); }
OPFN(exp)      { F(0) = expf(F(1));                NEXT(2); }
OPFN(log)      { F(0) = logf(F(1));                NEXT(2); }
OPFN(log10)    { F(0) = log10f(F(1));              NEXT(2); }
OPFN(pow)      { F(0) = powf(F(1), F(2));          NEXT(3); }
OPFN(fmod)     { F(0) = fmodf(F(1), F(2));         NEXT(3); }
OPFN(sinh)     { F(0) = sinhf(F(1));               NEXT(2); }
OPFN(cosh)     { F(0) = coshf(F(1));               NEXT(2); }
OPFN(tanh)     { F(0) = tanhf(F(1));               NEXT(2); }
OPFN(asinh)    { F(0) = asinhf(F(1));              NEXT(2); }
OPFN(acosh)    { F(0) = acoshf(F(1));              NEXT(2); }
OPFN(atanh)    { F(0) = atanhf(F(1));              NEXT(2); }

// ---- int (wrapping two's complement, no UB) ----
OPFN(imov)     { I(0) = I(1);                                          NEXT(2); }
OPFN(iadd)     { I(0) = wrap((uint32_t)I(1) + (uint32_t)I(2));         NEXT(3); }
OPFN(isub)     { I(0) = wrap((uint32_t)I(1) - (uint32_t)I(2));         NEXT(3); }
OPFN(imul)     { I(0) = wrap((uint32_t)I(1) * (uint32_t)I(2));         NEXT(3); }
OPFN(idiv)     { int32_t a = I(1), b = I(2);
                 I(0) = (b == 0) ? 0 : (b == -1) ? wrap(0u - (uint32_t)a) : a / b; NEXT(3); }
OPFN(irem)     { int32_t a = I(1), b = I(2);
                 I(0) = (b == 0 || b == -1) ? 0 : a % b;               NEXT(3); }
OPFN(iand)     { I(0) = I(1) & I(2);                                   NEXT(3); }
OPFN(ior)      { I(0) = I(1) | I(2);                                   NEXT(3); }
OPFN(ixor)     { I(0) = I(1) ^ I(2);                                   NEXT(3); }
OPFN(ishl)     { I(0) = wrap((uint32_t)I(1) << (I(2) & 31));           NEXT(3); }
OPFN(ishr)     { I(0) = I(1) >> (I(2) & 31);                           NEXT(3); }
OPFN(iushr)    { I(0) = wrap((uint32_t)I(1) >> (I(2) & 31));           NEXT(3); }
OPFN(imin)     { int32_t a = I(1), b = I(2); I(0) = (b < a) ? b : a;   NEXT(3); }
OPFN(imax)     { int32_t a = I(1), b = I(2); I(0) = (a < b) ? b : a;   NEXT(3); }
OPFN(iabs)     { int32_t a = I(1); I(0) = (a < 0) ? wrap(0u - (uint32_t)a) : a; NEXT(2); }
OPFN(iselect)  { I(0) = I(1) ? I(2) : I(3);                            NEXT(4); }
OPFN(ilt)      { I(0) = I(1) <  I(2);                                  NEXT(3); }
OPFN(ile)      { I(0) = I(1) <= I(2);                                  NEXT(3); }
OPFN(igt)      { I(0) = I(1) >  I(2);                                  NEXT(3); }
OPFN(ige)      { I(0) = I(1) >= I(2);                                  NEXT(3); }
OPFN(ieq)      { I(0) = I(1) == I(2);                                  NEXT(3); }
OPFN(ine)      { I(0) = I(1) != I(2);                                  NEXT(3); }
OPFN(ftoi)     { I(0) = f2i(F(1));                                     NEXT(2); }
OPFN(itof)     { F(0) = (float)I(1);                                   NEXT(2); }

// ---- arrays (index checked: out of range reads 0, writes are dropped) ----
OPFN(rdf) { const FPB_ArrayRef& a = A(1); uint32_t k = (uint32_t)I(2);
            F(0) = (k < a.len) ? ((const float*)a.base)[k] : 0.0f;     NEXT(3); }
OPFN(wrf) { const FPB_ArrayRef& a = A(0); uint32_t k = (uint32_t)I(1);
            if (k < a.len) ((float*)a.base)[k] = F(2);
            NEXT(3); }
OPFN(rdi) { const FPB_ArrayRef& a = A(1); uint32_t k = (uint32_t)I(2);
            I(0) = (k < a.len) ? ((const int32_t*)a.base)[k] : 0;      NEXT(3); }
OPFN(wri) { const FPB_ArrayRef& a = A(0); uint32_t k = (uint32_t)I(1);
            if (k < a.len) ((int32_t*)a.base)[k] = I(2);
            NEXT(3); }

// ---- the table ----
#define PURE     FPB_PURE
#define STATEFUL FPB_STATEFUL
#define ARRAY    FPB_ARRAY

#define FPB_OP(idx, name, sig, fl)  { #name, sig, (uint8_t)(fl), fpb_##name },
#define FPB_RES(idx)                { "", "", FPB_RESERVED, fpb_reserved },
#define FPB_DEL(idx, name, sig)     { #name, sig, FPB_REMOVED, fpb_reserved },
const FPB_OpDef FPB_OPS[] FPB_FLASH = { FPB_OP_LIST };
#undef FPB_OP
#undef FPB_RES
#undef FPB_DEL

const uint16_t FPB_OP_COUNT = sizeof(FPB_OPS) / sizeof(FPB_OPS[0]);
static_assert(sizeof(FPB_OPS) / sizeof(FPB_OPS[0]) <= 255, "at most 255 ops (opcode is u8)");

// compile-time checks: the index argument equals the position, names and signatures fit
#define FPB_OP(idx, name, sig, fl)  idx,
#define FPB_RES(idx)                idx,
#define FPB_DEL(idx, name, sig)     idx,
static constexpr uint8_t fpb_index_check[] = { FPB_OP_LIST };
#undef FPB_OP
#undef FPB_RES
#undef FPB_DEL
static constexpr bool fpb_indices_in_order() {
    for (size_t i = 0; i < sizeof(fpb_index_check); i++) if (fpb_index_check[i] != i) return false;
    return true;
}
static_assert(fpb_indices_in_order(), "FPB_OP_LIST: an index argument does not match its position");

#define FPB_OP(idx, name, sig, fl) \
    static_assert(sizeof(#name) <= FPB_NAME_LEN, "op name too long: " #name); \
    static_assert(sizeof(sig) <= FPB_SIG_LEN, "op signature too long: " #name);
#define FPB_RES(idx)
#define FPB_DEL(idx, name, sig) FPB_OP(idx, name, sig, 0)
FPB_OP_LIST
#undef FPB_OP
#undef FPB_RES
#undef FPB_DEL

#define FPB_GROUP(name, first) { name, first },
const FPB_GroupDef FPB_GROUPS[] FPB_FLASH = { FPB_GROUP_LIST };
#undef FPB_GROUP
const uint8_t FPB_GROUP_COUNT = sizeof(FPB_GROUPS) / sizeof(FPB_GROUPS[0]);

uint16_t fpb_fingerprint(const char* name, const char* sig) {
    uint32_t h = 2166136261u;
    for (const char* c = name; *c; c++) { h ^= (uint8_t)*c; h *= 16777619u; }
    h ^= 0; h *= 16777619u;
    for (const char* c = sig; *c; c++)  { h ^= (uint8_t)*c; h *= 16777619u; }
    return (uint16_t)((h >> 16) ^ (h & 0xFFFF));
}

uint8_t fpb_sig_arity(const char* sig) {
    uint8_t n = 0;
    for (const char* c = sig; *c; c++) if (*c != '=') n++;
    return n;
}
