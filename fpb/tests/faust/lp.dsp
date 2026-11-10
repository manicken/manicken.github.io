import("stdfaust.lib");
fc = hslider("cutoff[unit:Hz][scale:log]", 1000, 20, 20000, 1);
q  = hslider("q", 0.707, 0.1, 10, 0.01);
process = fi.resonlp(fc, q, 1);
