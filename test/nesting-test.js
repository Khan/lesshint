/**
 * Tests the nesting linter.
 */
var assert = require("assert");
var less = require("less");

var nestingLint = require("../lib/nesting-lint");

// Run the nesting linter on a given snippet of Less code
function lintCode(code) {
    var errors = [];

    less.parse(code, function(err, ast) {
        nestingLint(code, ast, function(err) {
            errors.push(err);
        });
    });

    return errors;
}

describe("Nesting linter", function() {
    it("should pass for single rules", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for single-nested rules", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "",
            "   &:hover {",
            "       color: red;",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for twice-nested rules", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "",
            "   &:hover {",
            "       color: red;",
            "",
            "       &.disabled {",
            "           color: gray;",
            "       }",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for three-times-nested rules", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "",
            "   &:hover {",
            "       color: red;",
            "",
            "       &.disabled {",
            "           color: gray;",
            "",
            "           &.main {",
            "               font-weight: bold;",
            "           }",
            "       }",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should fail for four-times-nested rules", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "",
            "   &:hover {",
            "       color: red;",
            "",
            "       &.disabled {",
            "           color: gray;",
            "",
            "           &.main {",
            "               font-weight: bold;",
            "",
            "               i,",
            "               em {",
            "                   font-weight: 200;",
            "               }",
            "",
            "               span {}",
            "           }",
            "       }",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 2);

        // Grab the line numbers from the error messages
        var lineNo;

        lineNo = errors[0].split(" ").slice(-1)[0];
        assert(Number(lineNo) === 15);

        var lineNo = errors[1].split(" ").slice(-1)[0];
        assert(Number(lineNo) === 20);
    });
});
