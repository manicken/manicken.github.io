// Compile test for the Teensy Dynamic Audio package (teensy-dynamic/test.js).
//
// A minimal live firmware: OSC messages over SLIP on a serial port go to OSCAudio,
// which creates, connects and controls audio objects while it runs (/teensy*/dynamic/...
// and /teensy*/audio/...), and the replies go back the same way.
//
// It needs what only the package has, so it fails to compile with the official Teensy package:
// - the Dynamic Audio core (SAFE_RELEASE is defined only there);
// - the Dynamic Audio library (AudioMixer, the mixer with any number of inputs);
// - OSCAudio.
// OSCAudio's own examples are not used because they don't compile against its current version.
//
// USB type: Serial + MIDI + Audio (OSCAudio wraps AudioInputUSB / AudioOutputUSB, which only exist with Audio).

#include <Audio.h>
#include <OSCBundle.h>
#include <SLIPEncodedSerial.h>
#include "OSCAudioBase.h"

#if !defined(SAFE_RELEASE)
#error "not the Dynamic Audio core: SAFE_RELEASE is not defined"
#endif

// a hardware serial port, as in OSCAudio's examples: the OSC library's SLIP class for the
// USB serial port (SLIPEncodedUSBSerial) only exists with the USB type "Serial"
SLIPEncodedSerial slip(Serial7);

// one object made at compile time, the rest come over OSC
OSCAudioMixer mixer("mixer", 4);

static OSCBundle* replies;   // the reply bundle of the message being handled

// OSCAudio calls this (for debugging) when objects are made: the sketch must define it
void listObjects(void) {
    for (OSCAudioBase* obj = OSCAudioBase::getFirst(); obj != NULL; obj = obj->getNext())
        Serial.printf("%s is at %08X\n", obj->name, (uint32_t)obj);
}

static void routeAudio(OSCMessage& msg, int addressOffset)   { OSCAudioBase::routeAll(msg, addressOffset, *replies); }
static void routeDynamic(OSCMessage& msg, int addressOffset) { OSCAudioBase::routeDynamic(msg, addressOffset, *replies); }

static void handle(OSCMessage& msg, OSCBundle& reply) {
    replies = &reply;
    if (msg.hasError()) return;
    msg.route("/teensy*/audio", routeAudio);
    msg.route("/teensy*/dynamic", routeDynamic);
}

void setup() {
    Serial.begin(115200);
    slip.begin(115200);
    AudioMemory(50);
}

void loop() {
    // read one SLIP packet: a bundle ("#bundle") or a single message ("/...")
    OSCBundle bundle;
    OSCMessage msg;
    char first = 0;
    while (!slip.endofPacket()) {
        int n = slip.available();
        while (n-- > 0) {
            char c = slip.read();
            if (first == 0) first = c;
            if (first == '#') bundle.fill((uint8_t)c);
            else msg.fill((uint8_t)c);
        }
    }

    OSCBundle reply;
    uint64_t timetag = 0;
    reply.setTimetag((uint8_t*)&timetag).add("/reply");
    if (first == '#') {
        if (!bundle.hasError())
            for (int i = 0; i < bundle.size(); i++) handle(*bundle.getOSCMessage(i), reply);
    } else if (first == '/') {
        handle(msg, reply);
    } else {
        return;
    }
    slip.beginPacket();
    reply.send(slip);
    slip.endPacket();
}
