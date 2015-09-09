/**
 * Tests that color values are backed by a variable
 */
var async = require("async");

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
                callback(rule.name, rule.index, d);
            } else if (d.name && d.name === "rgb") {
                var rgb = d.args.map(function(arg) {
                    return arg.value[0].value;
                });

                callback(rule.name, rule.index, {
                    rgb: rgb,
                    alpha: 1,
                });
            } else if (d.name && d.name === "rgba") {
                var rgba = d.args.map(function(arg) {
                    return arg.value[0].value;
                });

                callback(rule.name, rule.index, {
                    rgb: rgba.slice(0, 3),
                    alpha: rgba[3],
                });
            }
        }

        done();
    }, next);
}

function euclideanColorDistance(colorA, colorB) {
    return Math.sqrt(
        // Alpha - should be more important
        Math.pow(colorA.alpha * 255 - colorB.alpha * 255, 2) +

        // RGB
        Math.pow(colorA.rgb[0] - colorB.rgb[0], 2) +
        Math.pow(colorA.rgb[1] - colorB.rgb[1], 2) +
        Math.pow(colorA.rgb[2] - colorB.rgb[2], 2)
    );
}

function colorVariableLint(code, ast, callback) {
    var colors = [];
    var violations = [];

    async.series([
        function(done) {
            readColorVariables(ast, function(name, index, color) {
                colors.push({
                    name: name,
                    location: indexToLocation(code, index),
                    color: color,
                });
            }, done);
        },

        function(done) {
            findInlineColors(ast, function(color, index) {
                var colorObj;
                if (/^rgba/.test(color)) {
                    var rgba = color.slice(5, -1).split(",").map(function(item) {
                        return +item;
                    });

                    colorObj = {
                        rgb: rgba.slice(0, 3),
                        alpha: rgba[3],
                    };
                } else if (/^rgb/.test(color)) {
                    var rgb = color.slice(4, -1).split(",").map(function(item) {
                        return +item;
                    });

                    colorObj = {
                        rgb: rgb,
                        alpha: 1,
                    };
                } else if (/^#/.test(color)) {
                    // Remove the #
                    color = color.slice(1);

                    if (color.length === 3) {
                        var rgb = color.split("").map(function(component) {
                            return parseInt(component + component, 16);
                        });

                        colorObj = {
                            rgb: rgb,
                            alpha: 1,
                        };
                    } else if (color.length === 6) {
                        colorObj = {
                            rgb: [
                                parseInt(color.slice(0, 2), 16),
                                parseInt(color.slice(2, 4), 16),
                                parseInt(color.slice(4, 6), 16),
                            ],
                            alpha: 1,
                        };
                    } else {
                        return;
                    }
                } else {
                    return;
                }

                // Find the closest color
                var closestColor, closestColorDistance;
                colors.forEach(function(storedColor) {
                    var distance = euclideanColorDistance(
                        storedColor.color, colorObj);

                    if (closestColorDistance === undefined ||
                            distance < closestColorDistance) {
                        closestColorDistance = distance;
                        closestColor = storedColor;
                    }
                });

                var location = indexToLocation(code, index);
                var message = "Inline color " + color + " found";

                // 35 is chosen somewhat arbitrarily
                if (closestColorDistance < 35) {
                    message += ". Did you mean " + closestColor.name +
                        " from line " + closestColor.location.line + "?";
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
