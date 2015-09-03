/**
 * Tests that rules are not nested too deeply.
 */
var indexToLocation = require("./index-to-location");
var walkRules = require("./walk-rules");

var NESTING_LIMIT = 4;

function nestingLint(code, ast, reportError) {
    walkRules(ast, function(rule, depth) {
        if (depth > NESTING_LIMIT) {
            // Fetch the character index of this rule, which is the index of
            // the first element (i.e. "p") of the first selector
            // (i.e. ".first, .second { }").
            //
            // Both of these fields are guaranteed to exist.
            var index = rule.selectors[0].elements[0].index;
            var location = indexToLocation(code, index);

            reportError({
                line: location.line,
                character: location.column,
                code: -1,
                reason: "Nesting limit (" + NESTING_LIMIT + ") exceeded",
            });
        }
    });
}

module.exports = nestingLint;
