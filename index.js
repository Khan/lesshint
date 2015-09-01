var abcLint = require("./lib/abc-lint");
var less = require("less");

module.exports = function(code) {
    less.parse(code, function(err, ast) {
        var errors = [];

        // Run the tests
        abcLint(code, ast, function(error) {
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
