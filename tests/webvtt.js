// Test written for node and jake.
// Run from jake:
//
// jake test[webvtt-parsing]
//

var fs = require("fs");

// Include the parser
var parseCaptions = require("../source/captionator.general.parser.js").parseCaptions;

var test = function() {
	var ttmlData = fs.readFileSync("video/acid.vtt").toString("utf8");
	var parsedCaptions = parseCaptions(ttmlData);
	var testResults = {"passed": true, "errors": []};
	
	if (parsedCaptions.length !== 1344) {
		testResults.errors.push("Number of captions did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[0].text.toString() !== "This WebVTT acid test will verify rendering and parsing compatibility with the WebVTT standard.") {
		testResults.errors.push("Text of first caption did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[10].text.toString() != "<b>This text should be bold</b><br /><i>This text should be italic</i><br /><u>This text should be underlined</u>") {
		testResults.errors.push("Text of eleventh caption did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[14].text.toString() != "<span class='webvtt-span webvtt-class-span title'><b>Test 5:</b> Cue alignment</span>") {
		testResults.errors.push("Text of fifteenth caption did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[0].startTime !== 0) {
		testResults.errors.push("Start time of first cue did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[0].endTime !== 10) {
		testResults.errors.push("End time of first cue did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[15].startTime !== 110) {
		testResults.errors.push("Start time of sixteenth cue did not meet expectations.");
		testResults.passed = false;
	}
	
	if (parsedCaptions[15].endTime !== 115) {
		testResults.errors.push("End time of sixteenth cue did not meet expectations.");
		testResults.passed = false;
	}
	
	
	// Lots more WebVTT tests to come
	
	return testResults;
};

exports.test = test;
exports.name = "WebVTT Parsing Test";
exports.description = "Tests WebVTT parsing of a given file against key expectations - number of cues extracted, cue content, etc.";
