// Test written for node and jake.
// Run from jake:
//
// jake test[ttml-parsing]
//

var fs = require("fs");

// Include the parser
var parseCaptions = require("../source/captionator.general.parser.js").parseCaptions;

var test = function() {
	var ttmlData = fs.readFileSync("video/ttml-govt.xml").toString("utf8");
	var parsedCaptions = parseCaptions(ttmlData);
	var testResults = {"passed": true, "errors": []};
	
	if (parsedCaptions.length !== 76) {
		testResults.errors.push("Number of captions did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[0].text.toString() !== "Located in Melbourne’s western suburbs the Western") {
		testResults.errors.push("Text of first caption did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[10].text.toString() != "Australian Government’s Building the Education") {
		testResults.errors.push("Text of eleventh caption did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[0].startTime !== 8.904) {
		testResults.errors.push("Start time of first cue did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[0].endTime !== 11.542) {
		testResults.errors.push("End time of first cue did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[15].startTime !== 56.812) {
		testResults.errors.push("Start time of sixteenth cue did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[15].endTime !== 59.973) {
		testResults.errors.push("End time of sixteenth cue did not meet expectations.");
		testResults.passed = false;
	}
	
	return testResults;
};

exports.test = test;
exports.name = "TTML Parsing Test";
exports.description = "Tests TTML parsing of a given file against key expectations - number of cues extracted, cue content, etc.";