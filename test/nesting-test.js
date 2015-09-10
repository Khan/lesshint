/**
 * Tests the nesting linter.
 */
var assert = require("assert");
var less = require("less");

var nestingLint = require("../lib/nesting-lint");

// Run the nesting linter on a given snippet of Less code
function lintCode(code, callback) {
    less.parse(code, function(err, ast) {
        if (err) {
            throw err;
        }

        nestingLint(code, ast, function(err, violations) {
            if (err) {
                throw err;
            }

            callback(violations);
        });
    });
}

describe("Nesting linter", function() {
    it("should pass for single rules", function(done) {
        var lessCode = `
            a {
                background-color: black;
                color: white;
                margin: 0;
            }
        `.trim();

        lintCode(lessCode, function(violations) {
            assert(violations.length === 0);
            done();
        });
    });

    it("should pass for single-nested rules", function(done) {
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

        lintCode(lessCode, function(violations) {
            assert(violations.length === 0);
            done();
        });
    });

    it("should pass for twice-nested rules", function(done) {
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

        lintCode(lessCode, function(violations) {
            assert(violations.length === 0);
            done();
        });
    });

    it("should pass for three-times-nested rules", function(done) {
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

        lintCode(lessCode, function(violations) {
            assert(violations.length === 0);
            done();
        });
    });

    it("should fail for four-times-nested rules", function(done) {
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

        lintCode(lessCode, function(violations) {
            assert(violations.length === 2);
            assert(violations[0].line === 15);
            assert(violations[1].line === 20);
            done();
        });
    });

    it("should fail multiple times when exceeding the limit", function(done) {
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

        lintCode(lessCode, function(violations) {
            assert(violations.length === 3);
            assert(violations[0].line === 5);
            assert(violations[1].line === 6);
            assert(violations[2].line === 7);
            done();
        });
    });
});
