/**
 * The main module to run the linters.
 */
var async = require("async");
var flatten = require("lodash.flatten");
var less = require("less");
var postcss = require("postcss");
var sourceMap = require("source-map");

var abcLint = require("./lib/abc-lint");
var colorVariableLint = require("./lib/color-variable-lint");
var overqualifiedLint = require("./lib/overqualified-lint");
var nestingLint = require("./lib/nesting-lint");

const CSS_LINTERS = [overqualifiedLint];
const LESS_LINTERS = [abcLint, colorVariableLint, nestingLint];

module.exports = function(filename, code, options, next) {
    options = options || {};

    // If there's no code to lint, return 0 errors.
    if (!code.trim()) {
        return next(0);
    }

    function runLessLinters(done) {
        less.parse(code, function(err, ast) {
            if (err) {
                return done(err);
            }

            var callbacks = [];
            LESS_LINTERS.forEach(function(lessLinter) {
                callbacks.push(function(callback) {
                    try {
                        lessLinter(code, ast, options, callback);
                    } catch (err) {
                        // Critical failure, fail with a stack trace for
                        // debugging
                        console.log(err.stack);
                        process.exit(1);
                    }
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

            // If no map exists, this function has compiled into empty CSS,
            // so we can safely do nothing.
            if (!result.map) {
                return done(null, []);
            }

            var callbacks = [];

            // Establish a SourceMapConsumer to point to the original less
            var smc = new sourceMap.SourceMapConsumer(result.map);
            var ast = postcss.parse(result.css);
            CSS_LINTERS.forEach(function(cssLinter) {
                callbacks.push(function(callback) {
                    try {
                        cssLinter(ast, smc, options, callback);
                    } catch (err) {
                        // Critical failure, fail with a stack trace for
                        // debugging
                        console.log(err.stack);
                        process.exit(1);
                    }
                });
            });

            // Run the linters in parallel
            return async.parallel(callbacks, done);
        });
    }

    function defaultReporter(entries) {
        entries.forEach(function(entry) {
            var error = entry.error;
            console.log(
                "(" + error.line + ":" + error.character + ") " +
                error.reason);
        });
    }

    var reporter = options.reporter || defaultReporter;

    // Run the linter groups in parallel
    async.parallel([runLessLinters, runCSSLinters], function(err, results) {
        if (err) {
            var reason = err.message;
            var line = err.line;
            var character = err.column + 1;     // 1-indexed

            // If `err.filename` is something other than "input," the error
            // is in an @imported file. Display this filename in the error
            // message.
            if (err.filename !== "input") {
                reason = "Error parsing " + err.filename + ": " + reason;

                // TODO: Get the line/col of `filename` that leads to this
                // problematic import
                line = 1;
                character = 1;
            }

            // Parsing error, report a single error with code "E0"
            reporter([{
                file: err.filename,
                error: {
                    line: line,
                    character: character,
                    code: "E0",
                    reason: reason,
                },
            }]);

            // Report 1 error
            return next(1);
        }

        // `results` is a deeply-nested structure due to multiple
        // `async.parallel` calls. Flatten the results, with the `isDeep`
        // parameter set to true.
        var flatResults = flatten(results, true);

        // Report any errors
        if (flatResults.length) {
            reporter(flatResults.map(function(error) {
                return {
                    file: filename,
                    error: error,
                };
            }));

            // Report `flatResults.length` errors
            next(flatResults.length);
        } else {
            // Report zero errors
            next(0);
        }
    });
};
