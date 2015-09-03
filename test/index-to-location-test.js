/**
 * Tests the indexToLocation module
 */
var assert = require("assert");
var indexToLocation = require("../lib/index-to-location");

describe("Index to location", function() {
    var code =
        "12345\n" +
        "54321\n" +
        "67890\n" +
        "09876";

    it("should correctly point to the first line", function() {
        // First character
        assert(1 === indexToLocation(code, 0).line);

        // Last character
        assert(1 === indexToLocation(code, 4).line);
    });

    it("should correctly point to subsequent lines", function() {
        assert(2 === indexToLocation(code, 6).line);
        assert(3 === indexToLocation(code, 12).line);
        assert(4 === indexToLocation(code, 18).line);
    });

    it("should interpret newline characters on the next line", function() {
        // New line
        assert(2 === indexToLocation(code, 5).line);

        // New line
        assert(3 === indexToLocation(code, 11).line);
    });

    it("should cap off extreme values", function() {
        assert(1 === indexToLocation(code, -1).line);
        assert(4 === indexToLocation(code, 1000).line);
    });
});
