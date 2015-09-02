/**
 * The main module to run the linters.
 */
var less = require("less");

var abcLint = require("./lib/abc-lint");
var nestingLint = require("./lib/nesting-lint");

module.exports = function(code) {
    less.parse(code, function(err, ast) {
        var errors = [];

        // Run the tests
        abcLint(code, ast, function(error) {
            errors.push(error);
        });
        nestingLint(code, ast, function(error) {
            errors.push(error);
        });

        // Report any errors
        if (errors.length) {
            errors.forEach(function(error) {
                console.log(error);
            });

            process.exit(1);
        }
    });
};
