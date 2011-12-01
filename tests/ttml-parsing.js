// Test written for node and jake.
// Run from jake:
//
// jake test ttml-parsing
//

var fs = require("fs");

// Include the parser
var parseCaptions = require("../source/captionator.general.parser.js").parseCaptions;

var test = function() {
	var ttmlData = fs.readFileSync("video/ttml-govt.xml").toString("utf8");

	parseCaptions(ttmlData);
};

exports.test = test;