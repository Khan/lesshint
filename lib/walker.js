/**
 * A series of utility functions for walking the Less AST.
 */
var async = require("async");


/**
 * Walk through the nodes of the AST and run a callback on each node with a
 * "selectors" field, representing a proper Less rule like "tag { ... }"
 *
 * @param {object} node - the Less AST node
 * @param {function} nodeCallback - an async function to run on each node that
 *      accepts the node, the current traversal depth, and a callback
 * @param {function} doneCallback - a callback to run when the node has been
 *      traversed
 * @param {number} [depth=0] - the depth of the traversal (default: 0)
 */
function walkAST(node, nodeCallback, doneCallback, depth) {
    if (depth === undefined) {
        depth = 0;
    }

    var callbacks = [];

    callbacks.push(function(done) {
        nodeCallback(node, depth, done);
    });

    // Recursively check nested rules
    if (node.rules) {
        node.rules.forEach(function(rule) {
            // Queue up another call to walkRules, this time assigning the
            // `doneCallback` to the `done` as required by `async.parallel`
            callbacks.push(function(done) {
                walkAST(rule, nodeCallback, done, depth + 1);
            });
        });
    }

    // Run the callbacks in parallel
    return async.parallel(callbacks, doneCallback);
}


// A specialized version of walkAST that only invokes a callback on nodes with
// a "selectors" field. This walks the colloquial "rules" of the structure,
// which represent Less declarations such as "a.active { ... }"
function walkRules(node, nodeCallback, doneCallback, depth) {
    walkAST(node, function(node, depth, done) {
        // While we will hit every "rule" as defined by the Less AST, we only
        // concern ourselves with actual Less rules (e.g. "a { ... }"), which
        // have a "selectors" field.
        if (node.selectors) {
            nodeCallback(node, depth, done);
        } else {
            // Otherwise, just invoke the `done` callback right away
            done();
        }
    }, doneCallback, depth);
}


module.exports = {
    walkAST: walkAST,
    walkRules: walkRules,
};
