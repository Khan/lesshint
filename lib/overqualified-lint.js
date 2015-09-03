/**
 * Tests that selectors are not overqualified (in the form of element.class or
 * element#id)
 */
function overqualifiedLint(cssAST, sourceMap, reportError) {
    cssAST.walkRules(function(rule) {
        // A regex to detect overqualified selectors in the form of
        //     element#id or element.class
        //
        // The regex is built as follows:
        //     (^|[^\w#\.]): Either the beginning of the line, or a character
        //                   besides a word character, "#", or ".". This
        //                   denotes the position just before the element.
        //     \w+: The element, such as "div"
        //     [#\.]: Either "#" or ".", the start of the id or class
        //     [\w\-\_]+: The id or class name
        var OVERQUALIFIED_REGEX = /(^|[^\w#\.])\w+[#\.][\w\-\_]+/g;
        var match;

        while ((match = OVERQUALIFIED_REGEX.exec(rule.selector)) !== null) {
            var startIndex = rule.source.start;

            // From the source map consumer, fetch the original position
            // of where this extra class/id is defined
            var lessIndex = sourceMap.originalPositionFor({
                line: startIndex.line,

                // We add the magic `lastIndex` to the column, this is where
                // the id or class starts
                column: startIndex.column + OVERQUALIFIED_REGEX.lastIndex,
            });

            reportError(
                "Overqualified selector (" + match[0].trim() + ") found " +
                lessIndex.line + ":" + lessIndex.column);
        }
    });
}

module.exports = overqualifiedLint;
