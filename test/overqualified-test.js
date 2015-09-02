/**
 * Tests the nesting linter.
 */
var assert = require("assert");
var postcss = require("postcss");
var sourceMap = require("source-map");

var overqualifiedLint = require("../lib/overqualified-lint");

// Run the nesting linter on a given snippet of Less code
function lintCode(code) {
    var errors = [];
    less.render(code, options, function(err, result) {
        var smc = new sourceMap.SourceMapConsumer(result.map);
        var ast = postcss.parse(result.css);
        overqualifiedLint(ast, smc, function(err) {
            errors.push(err);
        });
    });
}

describe("Nesting linter", function() {
    it("should fail multiple times when exceeding the limit", function() {
        var lessCode = [
            "div#hello, b.red {",
            "   color: red;",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
    });
});
