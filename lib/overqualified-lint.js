/**
 * Tests that selectors are not overqualified
 */
var indexToLine = require("./index-to-line");
var walkRules = require("./walk-rules");

function overqualifiedLint(ast, smc, reportError) {
    ast.walkRules(function(rule) {
        var OVERQUALIFIED_REGEX = /\b[\w\-\_]+([#|\.][\w\-\_]+)/g;
        var match;

        while ((match = OVERQUALIFIED_REGEX.exec(rule.selector)) !== null) {
            var startIndex = rule.source.start;
            var lessIndex = smc.originalPositionFor({
                line: startIndex.line,
                column: startIndex.column + OVERQUALIFIED_REGEX.lastIndex,
            });

            reportError(
                "Overqualified selector (" + match[0] + ") found " +
                lessIndex.line + ":" + lessIndex.column);
        }
    });
}

module.exports = overqualifiedLint;
