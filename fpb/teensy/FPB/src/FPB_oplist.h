// FPB op table: the single source of truth for the opcodes.
//
// FPB_OP(index, name, sig, flags)   a real op, implemented as fpb_<name> in FPB_ops.cpp
// FPB_RES(index)                    a reserved slot (the loader rejects it)
// FPB_DEL(index, name, sig)         an op that has been taken out; keeps its index (the loader rejects it)
//
// Rules (see specs/fpb-bytecode.md):
//  - The opcode is the position in this list; the index argument is only a check (static_assert).
//  - An index that has once held a real op never changes its meaning.
//  - Reserved slots may be filled later; nothing may move.
//  - Names: at most 11 chars. Signatures: at most 7 chars, "<written>=<read>", operand kinds f i a c.
//
// This file is also read by the tool (red/fpb/fpb-core.js parseOpList), so keep one entry per macro call
// and do not use other macros inside the list.

#define FPB_OP_LIST \
    FPB_RES(0) \
    /* ---- core 1..31 ---- */ \
    FPB_OP(1,  mov,      "f=f",   PURE) \
    FPB_OP(2,  add,      "f=ff",  PURE) \
    FPB_OP(3,  sub,      "f=ff",  PURE) \
    FPB_OP(4,  mul,      "f=ff",  PURE) \
    FPB_OP(5,  div,      "f=ff",  PURE) \
    FPB_OP(6,  neg,      "f=f",   PURE) \
    FPB_OP(7,  madd,     "f=fff", PURE) \
    FPB_OP(8,  msub,     "f=fff", PURE) \
    FPB_OP(9,  min,      "f=ff",  PURE) \
    FPB_OP(10, max,      "f=ff",  PURE) \
    FPB_OP(11, abs,      "f=f",   PURE) \
    FPB_OP(12, select,   "f=iff", PURE) \
    FPB_OP(13, lt,       "i=ff",  PURE) \
    FPB_OP(14, le,       "i=ff",  PURE) \
    FPB_OP(15, gt,       "i=ff",  PURE) \
    FPB_OP(16, ge,       "i=ff",  PURE) \
    FPB_OP(17, eq,       "i=ff",  PURE) \
    FPB_OP(18, ne,       "i=ff",  PURE) \
    FPB_OP(19, copysign, "f=ff",  PURE) \
    FPB_OP(20, mov2,     "ff=ff", PURE) \
    FPB_RES(21) FPB_RES(22) FPB_RES(23) FPB_RES(24) FPB_RES(25) \
    FPB_RES(26) FPB_RES(27) FPB_RES(28) FPB_RES(29) FPB_RES(30) FPB_RES(31) \
    /* ---- math 32..63 ---- */ \
    FPB_OP(32, floor,    "f=f",   PURE) \
    FPB_OP(33, ceil,     "f=f",   PURE) \
    FPB_OP(34, round,    "f=f",   PURE) \
    FPB_OP(35, rint,     "f=f",   PURE) \
    FPB_OP(36, sqrt,     "f=f",   PURE) \
    FPB_OP(37, sin,      "f=f",   PURE) \
    FPB_OP(38, cos,      "f=f",   PURE) \
    FPB_OP(39, tan,      "f=f",   PURE) \
    FPB_OP(40, asin,     "f=f",   PURE) \
    FPB_OP(41, acos,     "f=f",   PURE) \
    FPB_OP(42, atan,     "f=f",   PURE) \
    FPB_OP(43, atan2,    "f=ff",  PURE) \
    FPB_OP(44, exp,      "f=f",   PURE) \
    FPB_OP(45, log,      "f=f",   PURE) \
    FPB_OP(46, log10,    "f=f",   PURE) \
    FPB_OP(47, pow,      "f=ff",  PURE) \
    FPB_OP(48, fmod,     "f=ff",  PURE) \
    FPB_OP(49, sinh,     "f=f",   PURE) \
    FPB_OP(50, cosh,     "f=f",   PURE) \
    FPB_OP(51, tanh,     "f=f",   PURE) \
    FPB_OP(52, asinh,    "f=f",   PURE) \
    FPB_OP(53, acosh,    "f=f",   PURE) \
    FPB_OP(54, atanh,    "f=f",   PURE) \
    FPB_RES(55) FPB_RES(56) FPB_RES(57) FPB_RES(58) FPB_RES(59) \
    FPB_RES(60) FPB_RES(61) FPB_RES(62) FPB_RES(63) \
    /* ---- int 64..95 ---- */ \
    FPB_OP(64, imov,     "i=i",   PURE) \
    FPB_OP(65, iadd,     "i=ii",  PURE) \
    FPB_OP(66, isub,     "i=ii",  PURE) \
    FPB_OP(67, imul,     "i=ii",  PURE) \
    FPB_OP(68, idiv,     "i=ii",  PURE) \
    FPB_OP(69, irem,     "i=ii",  PURE) \
    FPB_OP(70, iand,     "i=ii",  PURE) \
    FPB_OP(71, ior,      "i=ii",  PURE) \
    FPB_OP(72, ixor,     "i=ii",  PURE) \
    FPB_OP(73, ishl,     "i=ii",  PURE) \
    FPB_OP(74, ishr,     "i=ii",  PURE) \
    FPB_OP(75, iushr,    "i=ii",  PURE) \
    FPB_OP(76, imin,     "i=ii",  PURE) \
    FPB_OP(77, imax,     "i=ii",  PURE) \
    FPB_OP(78, iabs,     "i=i",   PURE) \
    FPB_OP(79, iselect,  "i=iii", PURE) \
    FPB_OP(80, ilt,      "i=ii",  PURE) \
    FPB_OP(81, ile,      "i=ii",  PURE) \
    FPB_OP(82, igt,      "i=ii",  PURE) \
    FPB_OP(83, ige,      "i=ii",  PURE) \
    FPB_OP(84, ieq,      "i=ii",  PURE) \
    FPB_OP(85, ine,      "i=ii",  PURE) \
    FPB_OP(86, ftoi,     "i=f",   PURE) \
    FPB_OP(87, itof,     "f=i",   PURE) \
    FPB_RES(88) FPB_RES(89) FPB_RES(90) FPB_RES(91) \
    FPB_RES(92) FPB_RES(93) FPB_RES(94) FPB_RES(95) \
    /* ---- arrays 96..127 ---- */ \
    FPB_OP(96, rdf,      "f=ai",  ARRAY) \
    FPB_OP(97, wrf,      "=aif",  ARRAY | STATEFUL) \
    FPB_OP(98, rdi,      "i=ai",  ARRAY) \
    FPB_OP(99, wri,      "=aii",  ARRAY | STATEFUL) \
    FPB_OP(100, dlyrd,   "f=aii", ARRAY) \
    FPB_OP(101, rdfm,    "f=ai",  ARRAY) \
    FPB_OP(102, wrfm,    "=aif",  ARRAY | STATEFUL) \
    FPB_RES(103) FPB_RES(104) FPB_RES(105) \
    FPB_RES(106) FPB_RES(107) FPB_RES(108) FPB_RES(109) FPB_RES(110) FPB_RES(111) \
    FPB_RES(112) FPB_RES(113) FPB_RES(114) FPB_RES(115) FPB_RES(116) FPB_RES(117) \
    FPB_RES(118) FPB_RES(119) FPB_RES(120) FPB_RES(121) FPB_RES(122) FPB_RES(123) \
    FPB_RES(124) FPB_RES(125) FPB_RES(126) FPB_RES(127) \
    /* ---- fused 128..159 (super-instructions, none yet) ---- */ \
    FPB_RES(128) FPB_RES(129) FPB_RES(130) FPB_RES(131) FPB_RES(132) FPB_RES(133) \
    FPB_RES(134) FPB_RES(135) FPB_RES(136) FPB_RES(137) FPB_RES(138) FPB_RES(139) \
    FPB_RES(140) FPB_RES(141) FPB_RES(142) FPB_RES(143) FPB_RES(144) FPB_RES(145) \
    FPB_RES(146) FPB_RES(147) FPB_RES(148) FPB_RES(149) FPB_RES(150) FPB_RES(151) \
    FPB_RES(152) FPB_RES(153) FPB_RES(154) FPB_RES(155) FPB_RES(156) FPB_RES(157) \
    FPB_RES(158) FPB_RES(159)

// first index of each group, for the tool's palette (name, firstIndex)
#define FPB_GROUP_LIST \
    FPB_GROUP("core",   1) \
    FPB_GROUP("math",   32) \
    FPB_GROUP("int",    64) \
    FPB_GROUP("arrays", 96) \
    FPB_GROUP("fused",  128)
