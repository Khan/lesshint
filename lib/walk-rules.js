/**
 * Walk through the rules of the Less AST, and run a callback on each one.
 */
var async = require("async");

/**
 * Walk through the rules of the AST and run a callback on each node with a
 * "selectors" field, representing a proper Less rule like "tag { ... }"
 *
 * @param {object} node - the Less AST node
 * @param {function} nodeCallback - an async function to run on each node that
 *      accepts the node, the current traversal depth, and a callback
 * @param {function} doneCallback - a callback to run when the node has been
 *      traversed
 * @param {number} [depth=0] - the depth of the traversal (default: 0)
 */
function walkRules(node, nodeCallback, doneCallback, depth) {
    if (depth === undefined) {
        depth = 0;
    }

    var callbacks = [];

    // While we will hit every "rule" as defined by the Less AST, we only
    // concern ourselves with actual Less rules (e.g. "a.active { ... }"),
    // which have a "selectors" field.
    if (node.selectors) {
        callbacks.push(function(done) {
            nodeCallback(node, depth, done);
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
