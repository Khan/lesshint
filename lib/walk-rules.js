/**
 * Walk through the rules of the Less AST, and run a callback on each one.
 */
var async = require("async");

function walkRules(node, nodeCallback, doneCallback, depth) {
    if (depth === undefined) {
        depth = 0;
    }

    var callbacks = [];

    // While we will hit every "rule" as defined by the Less AST, we only
    // concern ourselves with actual CSS rules (e.g. "a { ... }"), which
    // have a "selectors" field.
    if (node.selectors) {
        callbacks.push(function(done) {
            nodeCallback(node, done, depth);
        });
    }

    // Recursively check nested rules
    if (node.rules) {
        node.rules.forEach(function(rule) {
            callbacks.push(function(done) {
                walkRules(rule, nodeCallback, done, depth + 1);
            });
        });
    }

    async.parallel(callbacks, doneCallback);
}

module.exports = walkRules;
