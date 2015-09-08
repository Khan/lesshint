/**
 * The main module to run the linters.
 */
var async = require("async");
var less = require("less");
var postcss = require("postcss");
var sourceMap = require("source-map");

var abcLint = require("./lib/abc-lint");
var overqualifiedLint = require("./lib/overqualified-lint");
var nestingLint = require("./lib/nesting-lint");

const CSS_LINTERS = [overqualifiedLint];
const LESS_LINTERS = [abcLint, nestingLint];

module.exports = function(filename, code) {
    var errors = [];
    function reportError(error) {
        errors.push(error);
    }

    function runLessLinters(done) {
        less.parse(code, function(err, ast) {
            if (err) {
                return done(err);
            }

            LESS_LINTERS.forEach(function(linter) {
                linter(code, ast, reportError);
            });

            done();
        });
    }

    function runCSSLinters(done) {
        var options = {
            sourceMap: {
                outputSourceFiles: true,
            },
        };

        less.render(code, options, function(err, result) {
            if (err) {
                return done(err);
            }

            // Establish a SourceMapConsumer to point to the original less
            var smc = new sourceMap.SourceMapConsumer(result.map);
            var ast = postcss.parse(result.css);
            CSS_LINTERS.forEach(function(linter) {
                linter(ast, smc, reportError);
            });

            done();
        });
    }

    // Run the linter groups in parallel
    async.parallel([runLessLinters, runCSSLinters], function(err) {
        if (err) {
            // Parsing error
            var location = "(" + err.line + ":" + err.column + ")";
            console.log(location + " Error parsing: unrecognized input");
            process.exit(1);
        }

        // Report any errors
        if (errors.length) {
            errors.forEach(function(error) {
                var location = "(" + error.line + ":" + error.character + ")";
                console.log(location + " " + error.reason);
            });

            process.exit(1);
        }
    });
};
