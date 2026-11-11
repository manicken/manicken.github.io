// A stand-in for the faust compiler, used by server-test.js:
//   --version                      prints a version
//   ... <name>.dsp -o <out.fbc>    copies fpb/tests/faust/<name>.fbc to out.fbc
// A .dsp that contains the word ERROR fails like faust does (message on stderr, exit 1).
"use strict";
const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
if (args.includes("--version")) { console.log("FAUST Version 0.0.0-fake"); process.exit(0); }
const dsp = args.find(a => a.endsWith(".dsp"));
const out = args[args.indexOf("-o") + 1];
const text = fs.readFileSync(dsp, "utf8");
if (/ERROR/.test(text)) { console.error(dsp + " : 3 : ERROR : syntax error, unexpected IDENT"); process.exit(1); }
const name = path.basename(dsp, ".dsp");
if (args.includes("cpp")) { fs.writeFileSync(out, "// fake C++ for " + name + "\n"); process.exit(0); }
const fbc = path.join(__dirname, "faust", name + ".fbc");
if (!fs.existsSync(fbc)) { console.error("fake-faust: no " + fbc); process.exit(1); }
fs.copyFileSync(fbc, out);
