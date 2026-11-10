// FPB verifier VM: runs a container in JS with the same semantics as the firmware (float32 slots).
// Used by the tool to check a compiled patch against its source before it is sent to the Teensy.
//
// RED.fpb.vm.load(bytes, table) -> { error, errorName, ... } or a program:
//   program.setParam(index, value), program.getParam(index)
//   program.process(inputs, outputs, n)    inputs/outputs: arrays of Float32Array (one per channel)
RED.fpb = RED.fpb || {};
RED.fpb.vm = (function () {
    "use strict";

    var core = RED.fpb.core;

    function load(bytes, table) {
        var d = RED.fpb.format.decode(bytes, table);
        if (d.error) return d;
        var h = d.header;
        function prepare(list) {
            return list.map(function (ins) {
                var fn = core.OP_IMPL[ins.op.name];
                if (!fn) throw new Error("FPB vm: no JS implementation of op '" + ins.op.name + "'");
                return { fn: fn, o: ins.ops };
            });
        }
        var blk = prepare(d.blk), smp = prepare(d.smp);
        var F = d.F, I = d.I, A = d.arrays.map(function (a) { return a.data; });
        var nIn = h.nIn, nOut = h.nOut;

        return {
            error: 0,
            header: h,
            numInputs: nIn,
            numOutputs: nOut,
            numParams: d.params.length,
            F: F, I: I, A: A,
            setParam: function (k, v) { if (k < d.params.length) F[d.params[k]] = v; },
            getParam: function (k) { return F[d.params[k]]; },
            process: function (inputs, outputs, n) {
                var j, c, s;
                for (j = 0; j < blk.length; j++) { s = blk[j]; s.fn(F, I, A, s.o); }
                for (var k = 0; k < n; k++) {
                    for (c = 0; c < nIn; c++) F[c] = inputs[c][k];
                    for (j = 0; j < smp.length; j++) { s = smp[j]; s.fn(F, I, A, s.o); }
                    for (c = 0; c < nOut; c++) outputs[c][k] = F[nIn + c];
                }
            }
        };
    }

    return { load: load };
})();
