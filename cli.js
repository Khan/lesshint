#!/usr/bin/env node
var fs = require("fs");
var path = require("path");

var lesshint = require("./");

if (process.argv.length < 3) {
    console.log("USAGE: lesshint [file]");
    process.exit(1);
}

var filename = process.argv[2];
var code = fs.readFileSync(filename, "utf-8");

var options = {
    ignore: ["third_party"],
};

// chdir() into the file's directory to make relative @import statements work
process.chdir(path.dirname(filename));
lesshint(filename, code, options);
