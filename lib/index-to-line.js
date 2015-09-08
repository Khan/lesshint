/**
 * Convert a character index to a line number
 */
function indexToLine(code, index) {
    var lines = code.split("\n");

    for (var i = 0; i < lines.length; i++) {
        if (index < lines[i].length) {
            // Return the current line index, plus 1 to be 1-indexed
            return i + 1;
        } else {
            // Subtract the number of characters in the line, plus 1 for "\n"
            index -= lines[i].length + 1;
        }
    }

    return lines.length;
}

module.exports = indexToLine;
