// remainder (FBC kRemReal: x - n*y, n rounded to even) and % (kFmodf: fmod) on the same signal
process = _ <: remainder(_ * 4, 0.37), (_ * 4) % 0.37;
