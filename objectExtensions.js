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
    String.prototype.setCharAt = function(index, chr) {
        return this.substring(0, index) + chr + this.substring(index + chr.length);
    }

    function isValidIdentifierName(str)
    {
        // If first character is invalid
        if (!((str[0] >= 'a' && str[0] <= 'z')
            || (str[0]>= 'A' && str[0] <= 'Z')
            || str[0] == '_'))
            return false;
    
        // Traverse the string for the rest of the characters
        for (let i = 1; i < str.length; i++)
        {
            if (!((str[i] >= 'a' && str[i] <= 'z')
                || (str[i] >= 'A' && str[i] <= 'Z')
                || (str[i] >= '0' && str[i] <= '9')
                || str[i] == '_'))
                return false;
        }
    
        // String is a valid identifier
        return true;
    }