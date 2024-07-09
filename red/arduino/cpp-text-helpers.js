
if (TEXT == undefined)
    var TEXT = {};
/**
* this take a multiline text, 
* break it up into linearray, 
* @param {string} text text seperated by newlines
* @param {string|number} increment if this is a string then that is added before every line, if it's a number then it specifies the number of spaces added before every line
* @returns {string} string
*/
TEXT.incrementTextLines = function(text, increment) {
    var lines = text.split("\n");
    var newText = "";
    if (typeof increment == "number")
        increment = TEXT.getNrOfSpaces(increment);
    for (var i = 0; i < lines.length; i++) {
        newText += increment + lines[i] + "\n";
    }
    return newText;
};
/**
 * 
 * @param {string[]} lines 
 * @param {string|number} increment if this is a string then that is added before every line, if it's a number then it specifies the number of spaces added before every line
 * @returns 
 */
TEXT.incrementLines = function(lines, increment)
{
    var newLines = [];
    if (typeof increment == "number")
        increment = TEXT.getNrOfSpaces(increment);
    for (var i = 0; i < lines.length; i++) {
        newLines.push(increment + lines[i]);
    }
    return newLines;
}

TEXT.getNrOfSpaces = function(count) {
    var str = "";
    for (var i = 0; i < count; i++)
        str += " ";
    return str;
}