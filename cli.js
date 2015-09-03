#!/usr/bin/env node

var fs = require("fs");
var linter = require("./");

if (process.argv.length < 3) {
    console.log("USAGE: lesshint [file]");
    process.exit(1);
}

var code = fs.readFileSync(process.argv[2], "utf-8");
linter(process.argv[2], code);
