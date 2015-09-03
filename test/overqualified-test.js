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

describe("Overqualified linter", function() {
    it("should pass for elements without ids and classes", function() {
        var lessCode = `
            ul {
                color: red;

                li {
                    padding: 0;
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should pass for ids and classes without elements", function() {
        var lessCode = `
            #id {
                color: red;
            }

            .class1.class2 {
                color: green;
            }

            #main.class {
                color: gray;
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });

    it("should fail for element#id", function() {
        var lessCode = `
            div#main {
                color: black;
            }

            div {
                p,
                &#id {
                    color: red;
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 2);

        assert(errors[0].line === 1);
        assert(errors[0].reason.indexOf("div#main") > -1);

        assert(errors[1].line === 7);
        assert(errors[1].reason.indexOf("div#id") > -1);
    });

    it("should fail for element.class", function() {
        var lessCode = `
            div.centered {
                margin: 0 auto;
            }

            .main > div {
                &.class,

                &.second {
                    color: green;
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 3);

        assert(errors[0].line === 1);
        assert(errors[0].reason.indexOf("div.centered") > -1);

        assert(errors[1].line === 6);
        assert(errors[1].reason.indexOf("div.class") > -1);
    });

    it("should fail once per selector part", function() {
        var lessCode = `
            div.centered.padded {
                margin: 0 auto;
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 1);
        assert(errors[0].reason.indexOf("padded") === -1);
    });

    it("should pass for nested selectors", function() {
        // NOTE: "div #id" is still unnecessary, but not for the purposes of
        // this linter
        var lessCode = `
            div {
                #id {
                    color: red;
                }
            }
        `.trim();

        var errors = lintCode(lessCode);
        assert(errors.length === 0);
    });
});
