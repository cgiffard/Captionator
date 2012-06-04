/*
	captionator.parseCaptions(string captionData, object options)

	Accepts and parses SRT caption/subtitle data. Will extend for WebVTT shortly. Perhaps non-JSON WebVTT will work already?
	This function has been intended from the start to (hopefully) loosely parse both. I'll patch it as required.

	First parameter: Entire text data (UTF-8) of the retrieved SRT/WebVTT file. This parameter is mandatory. (really - what did
	you expect it was going to do without it!)

	Second parameter: Captionator internal options object. See the documentation for allowed values.

	RETURNS:

	An array of TextTrackCue Objects in initial state.
*/

// NODE->
// A code to enable parsing captions in node

var jsdom = require("jsdom");
var document = jsdom.jsdom("<html><body></body></html>",null,{
		"features": {
			"QuerySelector": true
		}
	});

var captionator = {};
captionator.TextTrackCue = require("./captionator.class.texttrackcue.js").TextTrackCue;
captionator.CaptionatorCueStructure = require("./captionator.class.cuestructure.js").CaptionatorCueStructure;

var runningInNode = true;

// <-NODE


exports.parseCaptions = function(captionData, options) {
	// Be liberal in what you accept from others...
	options = options instanceof Object ? options : {};
	var fileType = "", subtitles = [];
	var cueStyles = "";
	var cueDefaults = [];

	// Set up timestamp parsers - SRT does WebVTT timestamps as well.
	var SUBTimestampParser			= /^(\d+)?:?(\d+):(\d+)\.(\d+)\,(\d+)?:?(\d+):(\d+)\.(\d+)\s*(.*)/;
	var SBVTimestampParser			= /^(\d+)?:?(\d+):(\d+)\.(\d+)\,(\d+)?:?(\d+):(\d+)\.(\d+)\s*(.*)/;
	var SRTTimestampParser			= /^(\d+)?:?(\d+):(\d+)[\.\,](\d+)\s+\-\-\>\s+(\d+)?:?(\d+):(\d+)[\.\,](\d+)\s*(.*)/;
	var SRTChunkTimestampParser		= /(\d+)?:?(\d+):(\d+)[\.\,](\d+)/;
	var GoogleTimestampParser		= /^([\d\.]+)\s+\+([\d\.]+)\s*(.*)/;
	var LRCTimestampParser			= /^\[(\d+)?:?(\d+)\:(\d+)\.(\d{2,3})\]\s*(.*?)$/;
	var WebVTTDEFAULTSCueParser		= /^(DEFAULTS|DEFAULT)\s+\-\-\>\s+(.*)/g;
	var WebVTTSTYLECueParser		= /^(STYLE|STYLES)\s+\-\-\>\s*\n([\s\S]*)/g;
	var WebVTTCOMMENTCueParser		= /^(COMMENT|COMMENTS)\s+\-\-\>\s+(.*)/g;
	var TTMLCheck					= /<tt\s+xml/ig;
	var TTMLTimestampParserAdv		= /^(\d+)?:?(\d+):(\d+)\.(\d+)/;
	var TTMLTimestampParserHuman	= /^([\d\.]+)[smhdwy]/ig; // Under development, will need to study TTML spec more. :)
	
	if (captionData) {
		// This function parses and validates cue HTML/VTT tokens, and converts them into something understandable to the renderer.
		var processCaptionHTML = function processCaptionHTML(inputHTML) {
			var cueStructure = new captionator.CaptionatorCueStructure(inputHTML,options),
				cueSplit = [],
				splitIndex,
				currentToken,
				currentContext,
				stack = [],
				stackIndex = 0,
				chunkTimestamp,
				timeData,
				lastCueTime; // Useful for LRC, which does not specify an end time
			
			var hasRealTextContent = function(textInput) {
				return !!textInput.replace(/[^a-z0-9]+/ig,"").length;
			};
			
			// Process out special cue spans
			cueSplit = inputHTML.split(/(<\/?[^>]+>)/ig);
			
			currentContext = cueStructure;
			for (splitIndex in cueSplit) {
				if (cueSplit.hasOwnProperty(splitIndex)) {
					currentToken = cueSplit[splitIndex];
					
					if (currentToken.substr(0,1) === "<") {
						if (currentToken.substr(1,1) === "/") {
							// Closing tag
							var TagName = currentToken.substr(2).split(/[\s>]+/g)[0];
							if (stack.length > 0) {
								// Scan backwards through the stack to determine whether we've got an open tag somewhere to close.
								var stackScanDepth = 0;
								for (stackIndex = stack.length-1; stackIndex >= 0; stackIndex --) {
									var parentContext = stack[stackIndex][stack[stackIndex].length-1];
									stackScanDepth = stackIndex;
									if (parentContext.token === TagName) { break; }
								}
							
								currentContext = stack[stackScanDepth];
								stack = stack.slice(0,stackScanDepth);
							} else {
								// Tag mismatch!
							}
						} else {
							// Opening Tag
							// Check whether the tag is valid according to the WebVTT specification
							// If not, don't allow it (unless the sanitiseCueHTML option is explicitly set to false)
						
							if ((	currentToken.substr(1).match(SRTChunkTimestampParser)	||
									currentToken.match(/^<v\s+[^>]+>/i)						||
									currentToken.match(/^<c[a-z0-9\-\_\.]+>/)				||
									currentToken.match(/^<(b|i|u|ruby|rt)>/))				||
								options.sanitiseCueHTML !== false) {
								
								var tmpObject = {
									"token":	currentToken.replace(/[<\/>]+/ig,"").split(/[\s\.]+/)[0],
									"rawToken":	currentToken,
									"children":	[]
								};
								
								if (tmpObject.token === "v") {
									tmpObject.voice = currentToken.match(/^<v\s*([^>]+)>/i)[1];
								} else if (tmpObject.token === "c") {
									tmpObject.classes = currentToken
															.replace(/[<\/>\s]+/ig,"")
															.split(/[\.]+/ig)
															.slice(1)
															.filter(hasRealTextContent);
								} else if (!!(chunkTimestamp = tmpObject.rawToken.match(SRTChunkTimestampParser))) {
									cueStructure.isTimeDependent = true;
									timeData = chunkTimestamp.slice(1);
									tmpObject.timeIn =	parseInt((timeData[0]||0) * 60 * 60,10) +	// Hours
														parseInt((timeData[1]||0) * 60,10) +		// Minutes
														parseInt((timeData[2]||0),10) +				// Seconds
														parseFloat("0." + (timeData[3]||0));		// MS
								}
							
								currentContext.push(tmpObject);
								stack.push(currentContext);
								currentContext = tmpObject.children;
							}
						}
					} else {
						// Text string
						if (options.sanitiseCueHTML !== false) {
							currentToken = currentToken
											.replace(/</g,"&lt;")
											.replace(/>/g,"&gt;")
											.replace(/\&/g,"&amp;");
							
							if (!options.ignoreWhitespace) {
								currentToken = currentToken.replace(/\n+/g,"<br />");
							}
						}
					
						currentContext.push(currentToken);
					}
				}
			}

			return cueStructure;
		};
		
		// This function takes chunks of text representing cues, and converts them into cue objects.
		var parseCaptionChunk = function parseCaptionChunk(subtitleElement,objectCount) {
			var subtitleParts, timeIn, timeOut, html, timeData, subtitlePartIndex, cueSettings = "", id, specialCueData;
			var timestampMatch, tmpCue;

			// WebVTT Special Cue Logic
			if ((specialCueData = WebVTTDEFAULTSCueParser.exec(subtitleElement))) {
				cueDefaults = specialCueData.slice(2).join("");
				cueDefaults = cueDefaults.split(/\s+/g).filter(function(def) { return def && !!def.length; });
				return null;
			} else if ((specialCueData = WebVTTSTYLECueParser.exec(subtitleElement))) {
				cueStyles += specialCueData[specialCueData.length-1];
				return null;
			} else if ((specialCueData = WebVTTCOMMENTCueParser.exec(subtitleElement))) {
				return null; // At this stage, we don't want to do anything with these.
			}

			if (fileType === "LRC") {
				subtitleParts = [
					subtitleElement.substr(0,subtitleElement.indexOf("]")+1),
					subtitleElement.substr(subtitleElement.indexOf("]")+1)
				];
			} else {
				subtitleParts = subtitleElement.split(/\n/g);
			}
		
			// Trim off any blank lines (logically, should only be max. one, but loop to be sure)
			while (!subtitleParts[0].replace(/\s+/ig,"").length && subtitleParts.length > 0) {
				subtitleParts.shift();
			}
		
			if (subtitleParts[0].match(/^\s*[a-z0-9\-]+\s*$/ig)) {
				// The identifier becomes the cue ID (when *we* load the cues from file. Programatically created cues can have an ID of whatever.)
				id = String(subtitleParts.shift().replace(/\s*/ig,""));
			} else {
				// We're not parsing a format with an ID prior to each caption like SRT or WebVTT
				id = objectCount;
			}
		
			for (subtitlePartIndex = 0; subtitlePartIndex < subtitleParts.length; subtitlePartIndex ++) {
				var timestamp = subtitleParts[subtitlePartIndex];
				
				if ((timestampMatch = SRTTimestampParser.exec(timestamp)) ||
					(timestampMatch = SUBTimestampParser.exec(timestamp)) ||
					(timestampMatch = SBVTimestampParser.exec(timestamp))) {
					
					// WebVTT / SRT / SUB (VOBSub) / YouTube SBV style timestamp
					
					timeData = timestampMatch.slice(1);
					
					timeIn =	parseInt((timeData[0]||0) * 60 * 60,10) +	// Hours
								parseInt((timeData[1]||0) * 60,10) +		// Minutes
								parseInt((timeData[2]||0),10) +				// Seconds
								parseFloat("0." + (timeData[3]||0));		// MS
					
					timeOut =	parseInt((timeData[4]||0) * 60 * 60,10) +	// Hours
								parseInt((timeData[5]||0) * 60,10) +		// Minutes
								parseInt((timeData[6]||0),10) +				// Seconds
								parseFloat("0." + (timeData[7]||0));		// MS
					
					if (timeData[8]) {
						cueSettings = timeData[8];
					}
			
				} else if (!!(timestampMatch = GoogleTimestampParser.exec(timestamp))) {
					
					// Google's proposed WebVTT timestamp style
					timeData = timestampMatch.slice(1);
					
					timeIn = parseFloat(timeData[0]);
					timeOut = timeIn + parseFloat(timeData[1]);

					if (timeData[2]) {
						cueSettings = timeData[2];
					}

				} else if (!!(timestampMatch = LRCTimestampParser.exec(timestamp))) {
					timeData = timestampMatch.slice(1,timestampMatch.length-1);

					timeIn =	parseInt((timeData[0]||0) * 60 * 60,10) +	// Hours
								parseInt((timeData[1]||0) * 60,10) +		// Minutes
								parseInt((timeData[2]||0),10) +				// Seconds
								parseFloat("0." + (timeData[3]||0));		// MS
					
					timeOut = timeIn;
				}
				
				// We've got the timestamp - return all the other unmatched lines as the raw subtitle data
				subtitleParts = subtitleParts.slice(0,subtitlePartIndex).concat(subtitleParts.slice(subtitlePartIndex+1));
				break;
			}

			if (!timeIn && !timeOut) {
				// We didn't extract any time information. Assume the cue is invalid!
				return null;
			}

			// Consolidate cue settings, convert defaults to object
			var compositeCueSettings =
				cueDefaults
					.reduce(function(previous,current,index,array){
						previous[current.split(":")[0]] = current.split(":")[1];
						return previous;
					},{});
			
			// Loop through cue settings, replace defaults with cue specific settings if they exist
			compositeCueSettings =
				cueSettings
					.split(/\s+/g)
					.filter(function(set) { return set && !!set.length; })
					// Convert array to a key/val object
					.reduce(function(previous,current,index,array){
						previous[current.split(":")[0]] = current.split(":")[1];
						return previous;
					},compositeCueSettings);
			
			// Turn back into string like the TextTrackCue constructor expects
			// Update: This is braindead. Why did I do this?
			cueSettings = "";
			for (var key in compositeCueSettings) {
				if (compositeCueSettings.hasOwnProperty(key)) {
					cueSettings += !!cueSettings.length ? " " : "";
					cueSettings += key + ":" + compositeCueSettings[key];
				}
			}
			
			// The remaining lines are the subtitle payload itself (after removing an ID if present, and the time);
			html = options.processCueHTML === false ? subtitleParts.join("\n") : processCaptionHTML(subtitleParts.join("\n"));
			tmpCue = new captionator.TextTrackCue(id, timeIn, timeOut, html, cueSettings, false, null);
			tmpCue.styleData = cueStyles;
			return tmpCue;
		};
		
		var processTTMLTimestamp = function processTTMLTimestamp(timestamp)  {
			var timeData, timeValue = 0;
			if (typeof(timestamp) !== "string") return 0;

			if ((timeData = TTMLTimestampParserAdv.exec(timestamp))) {
				timeData = timeData.slice(1);
				timeValue =	parseInt((timeData[0]||0) * 60 * 60,10) +	// Hours
							parseInt((timeData[1]||0) * 60,10) +		// Minutes
							parseInt((timeData[2]||0),10) +				// Seconds
							parseFloat("0." + (timeData[3]||0));		// MS
			}

			return timeValue;
		};

		var parseXMLChunk = function parseXMLChunk(xmlNode,index) {
			var timeDataIn, timeDataOut, html, tmpCue, timeIn = 0, timeOut = 0;
			var timestampIn = String(xmlNode.getAttribute("begin"));
			var timestampOut = String(xmlNode.getAttribute("end"));
			var id = xmlNode.getAttribute("id") || index;

			timeIn = processTTMLTimestamp(timestampIn);
			timeOut = processTTMLTimestamp(timestampOut);

			html = options.processCueHTML === false ? xmlNode.innerHTML : processCaptionHTML(xmlNode.innerHTML);
			return new captionator.TextTrackCue(id, timeIn, timeOut, html, {}, false, null);
		};

		// Begin parsing --------------------
		subtitles = captionData
						.replace(/\r\n/g,"\n")
						.replace(/\r/g,"\n");
		
		if (TTMLCheck.exec(captionData)) {
			// We're dealing with TTML
			// Simple, ugly way of getting QSA on our data.
			var TTMLElement = document.createElement("ttml");
			TTMLElement.innerHTML = captionData;

			var captionElements = [].slice.call(TTMLElement.querySelectorAll("[begin],[end]"),0);
			var captions = captionElements.map(parseXMLChunk);
			
			return captions;
		} else {
			// We're dealing with a line-based format
			// Check whether any of the lines match an LRC format

			if (captionData.split(/\n+/g).reduce(function(prev,current,index,array) {
					return prev || !!LRCTimestampParser.exec(current);
				},false)) {
				
				// LRC file... split by single line
				subtitles = subtitles.split(/\n+/g);
				fileType = "LRC";
			} else {
				subtitles = subtitles.split(/\n\n+/g);
			}
			
			subtitles = subtitles.filter(function(lineGroup) {
								if (lineGroup.match(/^WEBVTT(\s*FILE)?/ig)) {
									fileType = "WebVTT";
									return false;
								} else {
									if (lineGroup.replace(/\s*/ig,"").length) {
										return true;
									}
									return false;
								}
							})
							.map(parseCaptionChunk)
							.filter(function(cue) {
								// In the parseCaptionChunk function, we return null for special and malformed cues,
								// and cues we want to ignore, rather than expose to JS. Filter these out now.
								if (cue !== null) {
									return true;
								}

								return false;
							});
			
			if (fileType === "LRC") {
				// Post-process to get appropriate end-times for LRC cues
				// LRC cue end times are not explicitly set, they are
				// implicit based on the start time of the next cue.
				// We also then do a pass to strip blank cues.

				subtitles
					.forEach(function(cue,index) {
						var thisCueStartTime = 0, lastCue;
						if (index > 0) {
							thisCueStartTime = cue.startTime;
							lastCue = subtitles[--index];

							if (lastCue.endTime < thisCueStartTime) {
								lastCue.endTime = thisCueStartTime;
							}
						}
					});
				
				subtitles = subtitles.filter(function(cue) {
						if (cue.text.toString().replace(/\s*/,"").length > 0) {
							return true;
						}

						return false;
					});
			}

			return subtitles;
		}

		return [];
	} else {
		throw new Error("Required parameter captionData not supplied.");
	}
};