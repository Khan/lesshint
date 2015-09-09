/**
 * The main module to run the linters.
 */
var async = require("async");
var flatten = require("lodash.flatten");
var less = require("less");
var postcss = require("postcss");
var sourceMap = require("source-map");

var abcLint = require("./lib/abc-lint");
var overqualifiedLint = require("./lib/overqualified-lint");
var nestingLint = require("./lib/nesting-lint");

const CSS_LINTERS = [overqualifiedLint];
const LESS_LINTERS = [abcLint, nestingLint];

module.exports = function(filename, code) {
    function runLessLinters(done) {
        less.parse(code, function(err, ast) {
            if (err) {
                return done(err);
            }

            var callbacks = [];

            LESS_LINTERS.forEach(function(linter) {
                callbacks.push(function(callback) {
                    linter(code, ast, callback);
                });
            });

            // Run the linters in parallel
            return async.parallel(callbacks, done);
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

            var callbacks = [];

            // Establish a SourceMapConsumer to point to the original less
            var smc = new sourceMap.SourceMapConsumer(result.map);
            var ast = postcss.parse(result.css);
            CSS_LINTERS.forEach(function(linter) {
                callbacks.push(function(callback) {
                    linter(ast, smc, callback);
                });
            });

            // Run the linters in parallel
            return async.parallel(callbacks, done);
        });
    }

    // Run the linter groups in parallel
    async.parallel([runLessLinters, runCSSLinters], function(err, results) {
        if (err) {
            // Parsing error
            var location = "(" + err.line + ":" + err.column + ")";
            console.log(location + " Error parsing: unrecognized input");
            process.exit(1);
        }

        // `results` is a deeply-nested structure due to multiple
        // `async.parallel` calls. Flatten the results, with the `isDeep`
        // parameter set to true.
        var flatResults = flatten(results, true);

        // Report any errors
        if (flatResults.length) {
            flatResults.forEach(function(error) {
                var location = "(" + error.line + ":" + error.character + ")";
                console.log(location + " " + error.reason);
            });

            process.exit(1);
        }
    });
};
