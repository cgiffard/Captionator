// Captionator internal cue structure object
/**
* @constructor
*/
captionator.CaptionatorCueStructure = function CaptionatorCueStructure(cueSource,options) {
	var cueStructureObject = this;
	this.isTimeDependent = false;
	this.cueSource = cueSource;
	this.options = options;
	this.processedCue = null;
	this.toString = function toString(currentTimestamp) {
		if (options.processCueHTML !== false) {
			var processLayer = function(layerObject,depth) {
				if (cueStructureObject.processedCue === null) {
					var compositeHTML = "", itemIndex, cueChunk;
					for (itemIndex in layerObject) {
						if (itemIndex.match(/^\d+$/) && layerObject.hasOwnProperty(itemIndex)) {
							// We're not a prototype function or local property, and we're in range
							cueChunk = layerObject[itemIndex];
							// Don't generate text from the token if it has no contents
							if (cueChunk instanceof Object && cueChunk.children && cueChunk.children.length) {
								if (cueChunk.token === "v") {
									compositeHTML +="<q data-voice=\"" + cueChunk.voice.replace(/[\"]/g,"") + "\" class='voice " +
													"speaker-" + cueChunk.voice.replace(/[^a-z0-9]+/ig,"-").toLowerCase() + " webvtt-span' " + 
													"title=\"" + cueChunk.voice.replace(/[\"]/g,"") + "\">" +
													processLayer(cueChunk.children,depth+1) +
													"</q>";
								} else if(cueChunk.token === "c") {
									compositeHTML +="<span class='webvtt-span webvtt-class-span " + cueChunk.classes.join(" ") + "'>" +
													processLayer(cueChunk.children,depth+1) +
													"</span>";
								} else if(cueChunk.timeIn > 0) {
									// If a timestamp is unspecified, or the timestamp suggests this token is valid to display, return it
									if ((currentTimestamp === null || currentTimestamp === undefined) ||
										(currentTimestamp > 0 && currentTimestamp >= cueChunk.timeIn)) {
								
										compositeHTML +="<span class='webvtt-span webvtt-timestamp-span' " +
														"data-timestamp='" + cueChunk.token + "' data-timestamp-seconds='" + cueChunk.timeIn + "'>" +
														processLayer(cueChunk.children,depth+1) +
														"</span>";
										
									} else if (currentTimestamp < cueChunk.timeIn) {
										// Deliver tag hidden, with future class
										compositeHTML +="<span class='webvtt-span webvtt-timestamp-span webvtt-cue-future' style='opacity: 0;' " +
														"data-timestamp='" + cueChunk.token + "' data-timestamp-seconds='" + cueChunk.timeIn + "'>" +
														processLayer(cueChunk.children,depth+1) +
														"</span>";
									}
								} else {
									compositeHTML +=cueChunk.rawToken +
													processLayer(cueChunk.children,depth+1) +
													"</" + cueChunk.token + ">";
								}
							} else if (cueChunk instanceof String || typeof(cueChunk) === "string" || typeof(cueChunk) === "number") {
								compositeHTML += cueChunk;
							} else {
								// Didn't match - file a bug!
							}
						}
					}
					
					if (!cueStructureObject.isTimeDependent && depth === 0) {
						cueStructureObject.processedCue = compositeHTML;
					}
				
					return compositeHTML;
				} else {
					return cueStructureObject.processedCue;
				}
			};
			return processLayer(this,0);
		} else {
			return cueSource;
		}
	};
};
captionator.CaptionatorCueStructure.prototype = [];