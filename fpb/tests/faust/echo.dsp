import("stdfaust.lib");
d  = hslider("delay[unit:ms]", 250, 1, 1000, 1) * ma.SR / 1000;
fb = hslider("feedback", 0.4, 0, 0.95, 0.01);
process = + ~ (de.delay(65536, d) * fb);
