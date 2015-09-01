/**
 * Convert a character index to a line number
 */
function indexToLine(code, index) {
    var lines = code.split("\n");

    for (var i = 0; i < lines.length; i++) {
        if (index < lines[i].length) {
            return i + 1;
        } else {
            index -= lines[i].length;
        }
    }
}

module.exports = indexToLine;
