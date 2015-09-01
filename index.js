var less = require("less");

module.exports = function(code) {
    less.parse(code, function(err, ast) {
        // Noop
        process.exit(0);
    });
};
