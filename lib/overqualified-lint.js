/**
 * Tests that selectors are not overqualified
 */
var indexToLine = require("./index-to-line");
var walkRules = require("./walk-rules");

function overqualifiedLint(ast, smc, reportError) {
    ast.walkRules(function(rule) {
        var OVERQUALIFIED_REGEX = /\b[\w\-\_]+(#|\.)/g;
        var match;

        while ((match = OVERQUALIFIED_REGEX.exec(rule.selector)) !== null) {
            console.log(rule)
            console.log(match[0])
            console.log(OVERQUALIFIED_REGEX.lastIndex);
        }
    });
}

module.exports = overqualifiedLint;
