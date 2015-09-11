/**
 * Tests that color values are backed by a variable
 */
var async = require("async");
var parseColor = require("parse-color");
var traverse = require("traverse");

var indexToLocation = require("./index-to-location");
var walk = require("./walker").walk;

// Extract inline color values from a given rule
function getColorValues(rule) {
    var colors = [];

    traverse(rule.value).forEach(function(node) {
        if (this.isLeaf) {
            if (/#[0-9A-Fa-f]{3,6}/.test(node)) {
                // Can we point to this #?
                colors.push(parseColor(node).rgba);
            }
        } else {
            try {
                if (node.name === "rgb") {
                    var rgb = node.args.map(function(arg) {
                        return arg.value[0].value;
                    });

                    colors.push(rgb.concat([1]));
                } else if (node.name === "rgba") {
                    var rgba = node.args.map(function(arg) {
                        return arg.value[0].value;
                    });

                    colors.push(rgba);
                } else if (node.rgb) {
                    // as arguments to a function
                    var rgba = node.rgb.concat([node.alpha]);
                    colors.push(rgba);
                }
            } catch (e) {
                // oh well
            }
        }
    });

    return colors;
}

function findInlineColors(root, callback, next) {
    walk(root, function(rule, depth, done) {
        // Ignore variables
        if (rule.variable) {
            return done();
        }

        // Extract the colors from the rule and invoke the callback with them
        var colors = getColorValues(rule);

        if (colors && colors.length) {
            colors.forEach(function(color) {
                callback(color, rule.index);
            });
        }

        done();
    }, next);
}

// Walk the AST and store
function readColorVariables(root, storeColor, callback) {
    walk(root, function(rule, depth, done) {
        if (rule.variable === true) {
            getColorValues(rule).forEach(function(color) {
                storeColor(rule.name, rule.index, color);
            });
        }

        done();
    }, callback);
}

// A very naive color distance formula, using the euclidean distance in
// 4-space
function euclideanColorDistance(colorA, colorB) {
    return Math.sqrt(
        // RGB
        Math.pow(colorA[0] - colorB[0], 2) +
        Math.pow(colorA[1] - colorB[1], 2) +
        Math.pow(colorA[2] - colorB[2], 2) +

        // Alpha
        Math.pow(colorA[3] * 255 - colorB[3] * 255, 2)
    );
}

function findClosestColor(inlineColor, storedColors) {
    // Find the closest color
    var closestColor, closestColorDistance;
    storedColors.forEach(function(storedColor) {
        var distance = euclideanColorDistance(
            storedColor.color, inlineColor);

        if (closestColorDistance === undefined ||
                distance < closestColorDistance) {
            closestColorDistance = distance;
            closestColor = storedColor;
        }
    });

    return {
        color: closestColor,
        distance: closestColorDistance,
    };
}

function colorVariableLint(code, ast, callback) {
    var storedColors = [];
    var violations = [];

    async.series([
        function(done) {
            readColorVariables(ast, function(name, index, color) {
                storedColors.push({
                    name: name,
                    location: indexToLocation(code, index),
                    color: color,
                });
            }, done);
        },

        function(done) {
            findInlineColors(ast, function(inlineColor, index) {
                var location = indexToLocation(code, index);
                var message = "Inline color " + inlineColor + " found";

                // See if there is a matching
                var match = findClosestColor(inlineColor, storedColors);

                if (match) {
                    // 35 is chosen somewhat arbitrarily
                    if (match.distance < 35) {
                        message += ". Did you mean " + match.color.name +
                            " from line " + match.color.location.line + "?";
                    }
                }

                violations.push({
                    line: location.line,
                    character: location.column,
                    code: -1,
                    reason: message,
                });
            }, done);
        },
    ], function(err) {
        callback(err, violations);
    });
}

module.exports = colorVariableLint;
