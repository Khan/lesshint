/**
 * Tests the ABC linter.
 */
var assert = require("assert");
var less = require("less");

var abcLint = require("../lib/abc-lint");

// Run the ABC linter on a given snippet of Less code
function lintCode(code, callback) {
    less.parse(code, function(err, ast) {
        if (err) {
            return callback(err);
        }

        abcLint(code, ast, callback);
    });
}

describe("ABC linter", function() {
    it("should pass for alphabetized properties", function(done) {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;
            }
        `.trim();

        lintCode(lessCode, function(err, violations) {
            if (err) {
                throw err;
            }

            assert(violations.length === 0);
            done();
        });
    });

    it("should fail when properties are out of order", function(done) {
        var lessCode = `
            a {
                margin: 0;
                background-color: black;
                color: white;
            }
        `.trim();

        lintCode(lessCode, function(err, violations) {
            if (err) {
                throw err;
            }

            assert(violations.length === 1);
            assert(violations[0].line === 3);
            done();
        });
    });

    it("should pass for declarations with a single property", function(done) {
        var lessCode = `
            p,
            a {
                color: white;
            }
        `.trim();

        lintCode(lessCode, function(err, violations) {
            if (err) {
                throw err;
            }

            assert(violations.length === 0);
            done();
        });
    });

    it("should pass when properties are nested and in order", function(done) {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;

                p {
                    color: red;
                    padding-top: 5px;
                }
            }
        `.trim();

        lintCode(lessCode, function(err, violations) {
            if (err) {
                throw err;
            }

            assert(violations.length === 0);
            done();
        });
    });

    it("should fail when properties are nested and out of order", function(done) {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;

                p {
                    color: red;
                    background-color: green;
                }
            }
        `.trim();

        lintCode(lessCode, function(err, violations) {
            if (err) {
                throw err;
            }

            assert(violations.length === 1);
            assert(violations[0].line === 8);
            done();
        });
    });

    // TODO: Consider variables as well, they should be above all declarations
    it("should ignore variables", function(done) {
        var lessCode = `
            a {
                width: 40px;
                @abc: 400;
                color: white;
            }
        `.trim();

        lintCode(lessCode, function(err, violations) {
            if (err) {
                throw err;
            }

            assert(violations.length === 1);
            assert(violations[0].line === 4);
            done();
        });
    });
});
