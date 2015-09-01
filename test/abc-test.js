var assert = require("assert");
var less = require("less");

var abcLint = require("../lib/abc-lint");

// Run the ABC linter on a given snippet of Less code
function lintCode(code) {
    var errors = [];

    less.parse(code, function(err, ast) {
        abcLint(code, ast, function(err) {
            errors.push(err);
        });
    });

    return errors;
}

describe("ABC linter", function() {
    it("should pass for alphabetized properties", function() {
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

    it("should fail when properties are out of order", function() {
        var lessCode = [
            "a {",
            "   margin: 0;",
            "   background-color: black;",
            "   color: white;",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 1);

        // Grab the line number from the error message
        var lineNo = errors[0].split(" ").slice(-1)[0];
        assert(Number(lineNo) === 3);
    });

    it("should pass for declarations with a single property", function() {
        var lessCode = [
            "p,",
            "a {",
            "   color: white;",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass when properties are nested and in order", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "",
            "   p {",
            "       color: red;",
            "       padding-top: 5px;",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should fail when properties are nested and out of order", function() {
        var lessCode = [
            "a {",
            "   background-color: black;",
            "   color: white;",
            "   margin: 0;",
            "",
            "   p {",
            "       color: red;",
            "       background-color: green;",
            "   }",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 1);

        // Grab the line number from the error message
        var lineNo = errors[0].split(" ").slice(-1)[0];
        assert(Number(lineNo) === 8);
    });

    // TODO: Consider variables as well, they should be above all declarations
    it("should ignore variables", function() {
        var lessCode = [
            "a {",
            "   width: 40px;",
            "   @abc: 400;",
            "   color: white;",
            "}",
        ].join("\n");

        var errors = lintCode(lessCode);
        assert(errors.length === 1);

        // Grab the line number from the error message
        var lineNo = errors[0].split(" ").slice(-1)[0];
        assert(Number(lineNo) === 4);
    })
});
