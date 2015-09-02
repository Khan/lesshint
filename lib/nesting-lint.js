/**
 * Tests that rules are not nested too deeply.
 */
var indexToLine = require("./index-to-line");
var walkRules = require("./walk-rules");

const NESTING_LIMIT = 4;

function nestingLint(code, ast, reportError) {
    walkRules(ast, function(rule, depth) {
        if (depth > NESTING_LIMIT) {
            var index = rule.selectors[0].elements[0].index;
            reportError(
                "Nesting limit (" + NESTING_LIMIT + ") exceeded on line " +
                indexToLine(code, index));
        }
    });
}

module.exports = nestingLint;
