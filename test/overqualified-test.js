/**
 * Tests the nesting linter.
 */
var assert = require("assert");
var less = require("less");
var postcss = require("postcss");
var sourceMap = require("source-map");

var overqualifiedLint = require("../lib/overqualified-lint");

// Run the nesting linter on a given snippet of Less code
function lintCode(code) {
    var errors = [];
    var options = {
        sourceMap: {
            outputSourceFiles: true,
        },
    };

    less.render(code, options, function(err, result) {
        var smc = new sourceMap.SourceMapConsumer(result.map);
        var ast = postcss.parse(result.css);
        overqualifiedLint(ast, smc, function(err) {
            errors.push(err);
        });
    });

    return errors;
}

describe("Nesting linter", function() {
    it("should fail multiple times when exceeding the limit", function() {
        var lessCode = [
            "div {",
            "   &#id {",
            "       color: red;",
            "   }",
            "",
            "   &.class {",
            "       color: green;",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 2);
        console.log(errors)
    });
});
