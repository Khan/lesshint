/**
 * Walk through the rules of the Less AST, and run a callback on each one.
 */

function walkRules(node, callback) {
    // While we will hit every "rule" as defined by the Less AST, we only
    // concern ourselves with actual CSS rules (e.g. "a { ... }"), which
    // have a "selectors" field.
    if (node.selectors) {
        callback(node);
    }

    // Recursively check nested rules
    if (node.rules) {
        node.rules.forEach(function(rule) {
            walkRules(rule, callback);
        });
    }
}

module.exports = walkRules;
