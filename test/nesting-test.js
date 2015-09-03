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
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;
            }
        `

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for single-nested rules", function() {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;

                &:hover {
                    color: red;
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for twice-nested rules", function() {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;

                &:hover {
                    color: red;

                    &.disabled {
                        color: gray;
                    }
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for three-times-nested rules", function() {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;

                &:hover {
                    color: red;

                    &.disabled {
                        color: gray;

                        &.main {
                            font-weight: bold;
                        }
                    }
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should fail for four-times-nested rules", function() {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;

                &:hover {
                    color: red;

                    &.disabled {
                       color: gray;

                        &.main {
                            font-weight: bold;

                            i,
                            em {
                                font-weight: 200;
                            }

                            span {}
                        }
                    }
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 2);

        assert(errors[0].line === 15);
        assert(errors[1].line === 20);
    });

    it("should fail multiple times when exceeding the limit", function() {
        var lessCode = `
            a {
                & + a {
                    & + a {
                        & + a {
                            & + a {   // Too far begin failing here
                                & + a {
                                    & + a {
                                       color: red;
                                    }
                                }
                           }
                        }
                    }
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 3);

        assert(errors[0].line === 5);
        assert(errors[1].line === 6);
        assert(errors[2].line === 7);
    });
});
