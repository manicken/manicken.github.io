var ObjectExtensions = (function() {

    Array.prototype.pushArray = function (other_array) {
        /* You should include a test to check whether other_array really is an array */
        //console.warn(typeof other_array);
        other_array.forEach(function(v) {this.push(v)}, this);
    }

    String.prototype.replaceAllVal = function (oldVal, newVal) {
        return this.split(oldVal).join(newVal);
    }

    String.prototype.EqualToAny = function (...strings) {
        for (var i = 0; i < strings.length; i++)
            if (this == strings[i]) return true;
        return false;
    }

return {};

})();