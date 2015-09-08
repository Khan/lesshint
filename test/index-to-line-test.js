/**
 * Tests the indexToLine module
 */
var assert = require("assert");
var indexToLine = require("../lib/index-to-line");

describe("Index-to-line", function() {
    var code =
        "12345\n" +
        "54321\n" +
        "67890\n" +
        "09876";

    it("should correctly point to the first line", function() {
        // First character
        assert(1 === indexToLine(code, 0));

        // Last character
        assert(1 === indexToLine(code, 4));
    });

    it("should correctly point to subsequent lines", function() {
        assert(2 === indexToLine(code, 6));
        assert(3 === indexToLine(code, 12));
        assert(4 === indexToLine(code, 18));
    });

    it("should interpret newline characters on the next line", function() {
        // New line
        assert(2 === indexToLine(code, 5));

        // New line
        assert(3 === indexToLine(code, 11));
    });

    it("should cap off extreme values", function() {
        assert(1 === indexToLine(code, -1));
        assert(4 === indexToLine(code, 1000));
    });
});
