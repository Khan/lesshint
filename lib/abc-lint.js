/**
 * Tests that Less properties are listed in alphabetical order.
 */
var indexToLocation = require("./index-to-location");
var walkRules = require("./walk-rules");

function abcLint(code, ast, reportError) {
    walkRules(ast, function(rule) {
        var lastName = "";
        var maybeDecl;

        // `rule.rules` corresponds to _all_ of the things inside of the rule,
        // including declarations (i.e. "color: red"), variables, or even
        // nested rules.
        for (var i = 0; i < rule.rules.length; i++) {
            maybeDecl = rule.rules[i];

            // TODO: Check the order of variables as well
            if (maybeDecl.variable) {
                continue;
            }

            // Declarations have a name field, which is a single-item array
            // containining { value: "someName" }.
            if (maybeDecl.name && maybeDecl.name.length) {
                // Check that the declaration names appear alphabetically
                if (maybeDecl.name[0].value < lastName) {
                    var location = indexToLocation(code, maybeDecl.index);

                    reportError({
                        line: location.line,
                        character: location.column,
                        code: -1,
                        reason: "Declaration listed out of order",
                    });

                    // Only report once per rule
                    return;
                } else {
                    lastName = maybeDecl.name[0].value;
                }
            }
        }
    });
}

module.exports = abcLint;
