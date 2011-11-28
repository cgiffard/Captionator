// Captionator.js Build Jakefile
//
// usage: (obviously you should omit the jake install if you already have it!)
//
// npm install jake
// npm install uglify-js
// jake
//
// That should be it.

var globalCopyright = "";
var uglifyParser	= require("uglify-js").parser,
	uglifyProcessor	= require("uglify-js").uglify,
	fs				= require("fs");

desc("Builds Captionator.js including a minified variant to JS directory.");
task("default", [], function() {
	jake.Task.build.invoke();
	// jake.Task["lint"].invoke();
	jake.Task.minify.invoke();
});

desc("Builds Captionator.js as an unimified file.");
file("build",[],function() {
	directory("js");

	console.log("Building Captionator.js...");

	var buildBuffer = "";
	var jsFiles = [], classes = [], general = [], header = [], copyright = [];
		jsFiles = fs.readdirSync("./source").filter(function(file) {
			return !!file.match(/\.js$/i);
		});
	
	function globFiles(inputArray) {
		return inputArray.map(function(item) {
			try {
				console.log("Reading infile " + item);
				return fs.readFileSync("./source/" + item).toString("utf8");
			} catch(error) {
				fail("Failed to read file for globbing: " + item,1);
			}
		});
	}

	function combine(input,indentation) {
		var buf = "";
		var indent = "";

		// Set up indentation
		while (indent.length < indentation) {
			indent += "\t";
		}

		input.forEach(function(item) {
			buf += "\n" + indent + item.split("\n").join("\n" + indent);
			buf += "\n";
		});

		return buf;
	}

	classes = globFiles(jsFiles.filter(function(item) {
			return !!item.match(/captionator\.class/i);
		}));
	
	general = globFiles(jsFiles.filter(function(item) {
			return !!item.match(/captionator\.general/i);
		}));
	
	header = globFiles(jsFiles.filter(function(item) {
			return !!item.match(/captionator\.header/i);
		}));
	
	copyright = globFiles(jsFiles.filter(function(item) {
			return !!item.match(/captionator\.copyright/i);
		}));
	
	console.log("Combining...");

	// Combine!
	// Get all the copyright headers in
	buildBuffer += combine(copyright,0);
	globalCopyright = combine(copyright,0);

	// Start closure
	buildBuffer += ";(function(){\n";

	// Append header code
	buildBuffer += combine(header,1);

	// Append classes
	buildBuffer += combine(classes,1);

	// Append general functions
	buildBuffer += combine(general,1);

	// End closure
	buildBuffer += "\n})();\n";

	// Output file...
	fs.writeFileSync("./js/captionator.js",buildBuffer);
	console.log("Output result to captionator.js.");
},true);

desc("Minifies an already built Captionator.js.");
task("minify",["build"],function() {
	console.log("Minifying...");
	fs.readFile("./js/captionator.js",function(err,data) {
		if (err) {
			fail("Unable to read unminified captionator.js infile.",1);
		} else {
			var unminifiedLength = data.length;
			var captionatorData = data.toString("utf8");
			var ast = uglifyParser.parse(captionatorData);
			ast = uglifyProcessor.ast_mangle(ast);
			ast = uglifyProcessor.ast_squeeze(ast);
			var captionatorMinified = globalCopyright + "\n\n" + uglifyProcessor.gen_code(ast);

			console.log("Minified. Old size: %d. New size: %d. Saved %d%!",unminifiedLength,captionatorMinified.length,Math.round((1-(captionatorMinified.length/unminifiedLength))*100));

			fs.writeFileSync("./js/captionator-min.js",captionatorMinified);
			console.log("Output result to captionator-min.js.");
		}
	});
},true);

desc("Tests/lints Captionator.js.");
task("test",["build"],function() {
	fail("I haven't built the test suite yet! Oh no! (You could build it, you know.)",0);
});