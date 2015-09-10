/**
 * Tests that color values are backed by a variable
 */
var async = require("async");
var parseColor = require("parse-color");

var indexToLocation = require("./index-to-location");
var walkAST = require("./walker").walkAST;

// Extract inline color values from a given rule
function getColorValues(rule) {
    if (!rule.value) {
        return;
    }

    // Values can be deeply-nested in interesting ways, so we'll just skip all
    // of that and search a JSONified version
    var ruleValue = JSON.stringify(rule.value);
    var result = [];

    // Match inline colors declared as a hexadecimal
    var hashMatches = ruleValue.match(/#[0-9A-Fa-f]{3,6}/g);
    if (hashMatches) {
        result = result.concat(hashMatches);
    }

    // Match inline colors declared as rgb(...)/rgba(...)
    var rgbaMatches = ruleValue.match(/"name":"rgba?",.+?"index"/g);
    if (rgbaMatches) {
        var objs = rgbaMatches.map(function(match) {
            var obj = JSON.parse(match.slice(
                /rgba/.test(match) ? 21 : 20,
                -8));

            var rgba = obj.map(function(field) {
                return field.value[0].value;
            });

            return (/rgba/.test(match) ? "rgba(" : "rgb(") +
                rgba.join(",") + ")";
        });

        result = result.concat(objs);
    }

    // When colors are used as arguments to a function, LESS will parse them
    // into an {"rgb": [...]} json field
    var parsedRgbMatches = ruleValue.match(/"rgb":\[.+?\]/g);
    if (parsedRgbMatches) {
        result = result.concat(parsedRgbMatches.map(function(m) {
            return "rgb(" + m.slice(7, -1) + ")";
        }));
    }

    return result;
}

function findInlineColors(root, callback, next) {
    walkAST(root, function(rule, depth, done) {
        // Ignore variables
        if (!rule.variable) {
            // Extract the colors from the rule and invoke the callback with them
            var colors = getColorValues(rule);
            if (colors && colors.length) {
                colors.forEach(function(color) {
                    callback(color, rule.index);
                });
            }
        }

        done();
    }, next);
}

function readColorVariables(root, callback, next) {
    walkAST(root, function(rule, depth, done) {
        if (rule.variable === true) {
            var d = rule.value.value[0].value[0];

            if (d.rgb) {
                callback(rule.name, rule.index, d.rgb.concat([1]));
            } else if (d.name && d.name === "rgb") {
                var rgb = d.args.map(function(arg) {
                    return arg.value[0].value;
                });

                callback(rule.name, rule.index, rgb.concat([1]));
            } else if (d.name && d.name === "rgba") {
                var rgba = d.args.map(function(arg) {
                    return arg.value[0].value;
                });

                callback(rule.name, rule.index, rgba);
            }
        }

        done();
    }, next);
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
    var colorObj = parseColor(inlineColor).rgba;

    if (!colorObj) {
        return null;
    }

    // Find the closest color
    var closestColor, closestColorDistance;
    storedColors.forEach(function(storedColor) {
        var distance = euclideanColorDistance(
            storedColor.color, colorObj);

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
