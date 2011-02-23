var captionator = {
	/*
		captionator.captionify([selector string array | DOMElement array | selector string | singular dom element ],
								[defaultLanguage - string in BCP47],
								[options - JS Object])
		
		Adds closed captions to video elements. The first, second and third parameter are both optional.
		
		First parameter: Use an array of either DOMElements or selector strings (compatible with querySelectorAll.)
		All of these elements will be captioned if tracks are available. If this parameter is omitted, all video elements
		present in the DOM will be captioned if tracks are available.
		
		Second parameter: BCP-47 string for default language. If this parameter is omitted, the User Agent's language
		will be used to choose a track.
		
		Third parameter: as yet unused - will implement animation settings and some other global options with this
		parameter later.
		
		
		RETURNS:
		
		False on immediate failure due to input being malformed, otherwise true (even if the process fails later.)
		Because of the asynchronous download requirements, this function can't really return anything meaningful.
		
		
	*/
	"captionify": function(element,defaultLanguage,options) {
		"use strict";
		var videoElements = [], elementIndex = 0;
		options = options instanceof Object? options : {};
		
		if (!HTMLVideoElement) {
			// Browser doesn't support HTML5 - die here.
			return false;
		} else {
			// Browser supports native track API
			if (typeof(document.createElement("video").addtrack) == "function") {
				return false;
			}
		}
		
		if (!element || element === false || element === undefined || element === null) {
			videoElements = [].slice.call(document.getElementsByTagName("video"),0); // select and convert to array
		} else {
			if (element instanceof Array) {
				for (elementIndex = 0; elementIndex < element.length; elementIndex ++) {
					if (typeof(element[elementIndex]) == "string") {
						videoElements = videoElements.concat([].slice.call(document.querySelectorAll(element[elementIndex]),0)); // select and convert to array
					} else if (element[elementIndex].constructor == HTMLVideoElement) {
						videoElements.push(element[elementIndex]);
					}
				}
			} else if (typeof(element) == "string") {
				videoElements = [].slice.call(document.querySelectorAll(element),0); // select and convert to array
			} else if (element.constructor == HTMLVideoElement) {
				videoElements.push(element);
			}
		}
		
		if (videoElements.length) {
			for (elementIndex = 0; elementIndex < videoElements.length; elementIndex ++) {
				captionator.processVideoElement(videoElements[elementIndex],defaultLanguage,options);
			}
			return true;
		} else {
			return false;
		}
	},
	/*
		captionator.generateTranscript(selector string | singular DOMElement,
										transcriptDestination selector string | singular DOMElement,
										[defaultLanguage - string in BCP47],
										[options - JS Object])
		
		Generates a transcript based on a given video file (chooses a track element according to UA language or value
		of the variable defaultLanguage)
		
		First parameter: Use a selector string which will select a single element, or a DOMElement.
		
		Second parameter: BCP-47 string for default language. If this parameter is omitted, the User Agent's language
		will be used to choose a track.
		
		Third parameter: as yet unused - will implement greater control over generated transcripts later.
		
		
		RETURNS:
		
		False on immediate failure due to input being malformed, otherwise true (even if the process fails later.)
		Because of the asynchronous download requirements, this function can't really return anything meaningful.
		
		
	*/
	"generateTranscript": function(videoElement,transcriptDestination,defaultLanguage,options) {
		"use strict";
		var globalLanguage = defaultLanguage || navigator.language.split("-")[0];
		var captionID;
		options = options instanceof Object? options : {};
		
		if (typeof(videoElement) == "string") {
			videoElement = document.querySelectorAll(videoElement)[0]; // if there's more than one element, return first
		}
		
		if (typeof(transcriptDestination) == "string") {
			transcriptDestination = document.querySelectorAll(transcriptDestination)[0];
		}
		
		if (videoElement.constructor == HTMLVideoElement && typeof(transcriptDestination) == "object") {
			var trackSource = [].splice.call(videoElement.querySelectorAll("track"),0)
								.filter(function(trackElement) {
									return trackElement.getAttribute("srclang").split("-")[0] == globalLanguage ? true : false;
								})[0]
								.getAttribute("src");
			
			captionator.fetchCaptions(trackSource,function(captionData) {
				for (captionID = 0; captionID < captionData.length; captionID ++) {
					transcriptDestination.innerHTML += "<p class='transcriptLine'>" + captionData[captionID].html + "</p>";
				}
			});
		} else {
			return false;
		}
	},
	/*
		captionator.processVideoElement(videoElement <HTMLVideoElement>,
								[defaultLanguage - string in BCP47],
								[options - JS Object])
		
		Processes track items within an HTMLVideoElement. The second and third parameter are both optional.
		
		First parameter: Mandatory HTMLVideoElement object.
		
		Second parameter: BCP-47 string for default language. If this parameter is omitted, the User Agent's language
		will be used to choose a track.
		
		Third parameter: as yet unused - will implement animation settings and some other global options with this
		parameter later.
		
		RETURNS:
		
		Reference to the HTMLVideoElement.
		
		
	*/
	"processVideoElement": function(videoElement,defaultLanguage,options) {
		"use strict";
		var trackList = [];
		var globalLanguage = defaultLanguage || navigator.language.split("-")[0];
		options = options instanceof Object? options : {};
		
		if (!videoElement.captioned) {
			videoElement.className += (videoElement.className.length ? " " : "") + "captioned";
			videoElement.captioned = true;
			
			// Get tracks for video element
			trackList = [].splice.call(videoElement.querySelectorAll("track"),0)
						.map(function(trackElement) {
							return {
								"label":		trackElement.getAttribute("label"),
								"src":			trackElement.getAttribute("src"),
								"lang":			trackElement.getAttribute("srclang").split("-")[0],
								"kind":			(trackElement.getAttribute("kind")||trackElement.getAttribute("role")),
								"defaultTitle":	(trackElement.getAttribute("srclang").split("-")[0] == globalLanguage ? true : false),
								"videoElement":	videoElement
							};
						});
			
			videoElement.trackList = trackList;
			videoElement.subtitlesReady = false;
			videoElement.currentSubtitleTrack = 0;
			
			trackList.forEach(function(trackElement,trackIndex) {
				if (trackElement.defaultTitle) {
					captionator.fetchCaptions(trackElement.src, function(captionData) {
						trackElement.captionData = captionData;
						trackElement.videoElement.subtitlesReady = true;
						trackElement.videoElement.currentSubtitleTrack = trackIndex;
					});
					
					videoElement.addEventListener("timeupdate", function(eventData){
						if (eventData.srcElement.subtitlesReady) {
							var currentTime = eventData.srcElement.currentTime;
							var currentTrack = eventData.srcElement.currentSubtitleTrack;
							var captionData = eventData.srcElement.trackList[currentTrack].captionData;
							var subtitlesToDisplay = [], subtitleText;
							var subtitleIndex;
							var captionContainer = null;
							
							if (options.container) {
								captionContainer = options.container;
							} else {
								captionContainer = "#captions";
							}
							
							if (typeof(captionContainer) == "string") {
								captionContainer = document.querySelectorAll(captionContainer)[0];
							}

							if (typeof(captionContainer) != "object") {
								captionContainer = document.createElement("div");
								captionContainer.id = "captions";
								eventData.srcElement.parentNode.appendChild(captionContainer);
								eventData.srcElement.setAttribute("aria-describedby","captions");
								captionator.styleContainer(captionContainer, eventData.srcElement.trackList[currentTrack].kind, eventData.srcElement, false);
							}
							
							if (captionData.length) {
								for (subtitleIndex = 0; subtitleIndex < captionData.length; subtitleIndex ++) {
									if (currentTime >= captionData[subtitleIndex].timeIn &&
										currentTime <= captionData[subtitleIndex].timeOut) {
										subtitlesToDisplay.push(captionData[subtitleIndex].html);
									}
								}
								
								subtitleText = "<div class='captionator-title'>" + subtitlesToDisplay.join("</div><div class='captionator-title'>") + "</div>";
								if (!subtitlesToDisplay.length) {
									
									if (captionContainer.innerHTML.length) {
										captionContainer.innerHTML = "";
										captionContainer.style.display = "none";
									}
								} else {
									if (captionContainer.innerHTML != subtitleText) {
										captionContainer.innerHTML = subtitleText;
										captionContainer.style.display = "block";
									}
								}
							}
						}
					});
				}
			});
		}
		
		return videoElement;
	},
	/*
		captionator.styleContainer(DOMNode, kind / role, videoElement, [boolean applyClassesOnly])
		
		Styles autogenerated caption containers according to the kind or 'role' (in the W3 spec) of the track.
		This function is not intended to allow easy application of arbitrary styles, but rather centralise all styling within
		the script (enabling easy removal of styles for replacement with CSS classes if desired.)
		
		First parameter: DOMNode to style. This parameter is mandatory.
		
		Second parameter: Role of the DOMNode. This parameter is mandatory.
		
		Third parameter: HTMLVideoElement to which the caption is attached. This is used to position the caption container appropriately.
		
		Fourth parameter: Optional boolean specifying whether to apply styles or just classes (classes are applied in both circumstances.)
		A false value will style the element - true values will only apply classes.
		
		RETURNS:
		
		Nothing.
		
	*/
	"styleContainer": function(DOMNode, kind, videoElement, applyClassesOnly) {
		"use strict";
		var applyStyles = function(StyleNode, styleObject) {
			for (var styleName in styleObject) {
				if ({}.hasOwnProperty.call(styleObject, styleName)) {
					StyleNode.style[styleName] = styleObject[styleName];
				}
			}
		};
		
		var getVideoMetrics = function(DOMNode) {
			var videoComputedStyle = window.getComputedStyle(DOMNode,null);
			var offsetObject = DOMNode;
			var offsetTop = DOMNode.offsetTop, offsetLeft = DOMNode.offsetLeft;
			var width = DOMNode, height = 0;
			var controlHeight = 0;
			
			width = parseInt(videoComputedStyle.getPropertyValue("width"),10);
			height = parseInt(videoComputedStyle.getPropertyValue("height"),10);
			
			while (offsetObject = offsetObject.offsetParent) {
				offsetTop += offsetObject.offsetTop;
				offsetLeft += offsetObject.offsetLeft;
			}
			
			if (DOMNode.hasAttribute("controls")) {
				// Get heights of default control strip in various browsers
				// There could be a way to measure this live but I haven't thought/heard of it yet...
				if (navigator.userAgent.toLowerCase().indexOf("chrome") !== -1) {
					controlHeight = 32;
				} else if (navigator.userAgent.toLowerCase().indexOf("firefox") !== -1) {
					controlHeight = 28;
				} else if (navigator.userAgent.toLowerCase().indexOf("ie9") !== -1) {
					controlHeight = 31;
				} else if (navigator.userAgent.toLowerCase().indexOf("safari") !== -1) {
					controlHeight = 25;
				}
			}
			
			return {
				left: offsetLeft,
				top: offsetTop,
				width: width,
				height: height,
				controlHeight: controlHeight
			};
		};
		
		if (DOMNode instanceof HTMLElement && videoElement instanceof HTMLVideoElement) {
			var videoMetrics = getVideoMetrics(videoElement);
			var captionHeight = 0;
			switch (kind) {
				case "caption":
				case "captions":
				case "subtitle":
					// Simple display, darkened rectangle, white or light text, down the bottom of the video container.
					// This is basically the default style.
					captionHeight = Math.ceil(videoMetrics.height * 0.15 < 30 ? 30 : videoMetrics.height * 0.15);
					applyStyles(DOMNode,{
						"display":			"block",
						"position":			"absolute",
						"width":			(videoMetrics.width - 40) + "px",
						"height":			captionHeight + "px",
						"backgroundColor":	"rgba(0,0,0,0.5)",
						"left":				videoMetrics.left + "px",
						"top":				(videoMetrics.top + videoMetrics.height) - (captionHeight + videoMetrics.controlHeight) + "px",
						"fontSize":			(captionHeight <= 50 ? ((captionHeight * 0.7) / 96) * 72 : ((captionHeight * 0.3) / 96) * 72) + "pt",
						"lineHeight":		(captionHeight <= 50 ? (captionHeight / 96) * 72 : ((captionHeight / 2) / 96) * 72) + "pt",
						"color":			"white",
						"textShadow":		"black 0px 0px 5px",
						"fontFamily":		"Helvetica, Arial, sans-serif",
						"fontWeight":		"bold",
						"textAlign":		"center",
						"paddingLeft":		"20px",
						"paddingRight":		"20px",
					});
					
				break;
				case "textaudiodesc":
					// No idea what this is supposed to look like...
				break;
				case "karaoke":
				case "lyrics":
					// Decided to put both of these together (they're basically the same thing, save for the bouncing ball!)
				
					captionHeight = (videoMetrics.height * 0.1 < 20 ? 20 : videoMetrics.height * 0.1);
					applyStyles(DOMNode,{
						"display":			"block",
						"position":			"absolute",
						"width":			(videoMetrics.width - 40) + "px",
						"minHeight":		captionHeight + "px",
						"backgroundColor":	"rgba(0,0,0,0.5)",
						"left":				videoMetrics.left + "px",
						"top":				videoMetrics.top + "px",
						"fontSize":			(captionHeight <= 50 ? ((captionHeight * 0.5) / 96) * 72 : ((captionHeight * 0.2) / 96) * 72) + "pt",
						"lineHeight":		(captionHeight <= 50 ? (captionHeight / 96) * 72 : ((captionHeight / 2) / 96) * 72) + "pt",
						"color":			"gold",
						"fontStyle":		"oblique",
						"textShadow":		"black 0px 0px 5px",
						"fontFamily":		"Helvetica, Arial, sans-serif",
						"fontWeight":		"lighter",
						"textAlign":		"center",
						"paddingLeft":		"20px",
						"paddingRight":		"20px",
					});
				
				break;
				case "chapters":
				
				break;
				case "tickertext":
					// Stock ticker style, smaller than regular subtitles to fit more in.
				
				break;
				default:
					// Whoah, we didn't prepare for this one. Just class it with the requested name and move on.
			}
			
			DOMNode.className += (DOMNode.className.length ? " " : "") + "captionator-kind-" + kind;
		}
	},
	/*
		captionator.parseCaptions(string captionData)
		
		Accepts and parses SRT caption/subtitle data. Will extend for WebVTT shortly. Perhaps non-JSON WebVTT will work already?
		This function has been intended from the start to (hopefully) loosely parse both. I'll patch it as required.
		
		First parameter: Entire text data (UTF-8) of the retrieved SRT/WebVTT file. This parameter is mandatory.
		
		RETURNS:
		
		An array of objects in the following format:
		
		Subtitle {
			timeIn: Number in milliseconds - time that the caption is displayed
			timeOut: Number in milliseconds - time that the caption is hidden
			text: HTML-free text from caption (this is only a cursory clean - don't expect this to be XSS-safe)
			html: HTML-inclusive data for rich captions
		}
		
	*/
	"parseCaptions": function(captionData) {
		"use strict";
		// Be liberal in what you accept from others...
		if (captionData) {
			var subtitles = captionData
							.replace(/\r\n/g,"\n")
							.replace(/\r/g,"\n")
							.split(/\n\n/g)
							.filter(function(lineGroup) {
								if (lineGroup.match(/WEBVTT FILE/ig)) {
									// This is useless - we just don't care as we'll be treating SRT and WebVTT the same anyway.
									return false;
								} else {
									return true;
								}
							})
							.map(function(subtitleElement) {
								var subtitleParts = subtitleElement.split(/\n/g);
								var timeIn, timeOut, text, html, timeData, subtitlePartIndex;
								
								if (subtitleParts[0].match(/^\s*\d+\s*$/ig)) {
									subtitleParts.shift(0);
								}
								
								for (subtitlePartIndex = 0; subtitlePartIndex < subtitleParts.length; subtitlePartIndex ++) {
									if (subtitleParts[subtitlePartIndex].match(/^\d{2}:\d{2}:\d{2}[\.\,]\d+/)) {
										timeData = subtitleParts[subtitlePartIndex].split(/\s+/ig,4);
										timeIn = parseFloat(((timeData[0].split(/[:\,\.]/ig)[0] * 60 * 60) +
															(timeData[0].split(/[:\,\.]/ig)[1] * 60) +
															parseInt(timeData[0].split(/[:\,\.]/ig)[2],10)) + "." +
															parseInt(timeData[0].split(/[:\,\.]/ig)[3],10));
										
										timeOut = parseFloat(((timeData[2].split(/[:\,\.]/ig)[0] * 60 * 60) +
															(timeData[2].split(/[:\,\.]/ig)[1] * 60) +
															parseInt(timeData[2].split(/[:\,\.]/ig)[2],10)) + "." +
															parseInt(timeData[2].split(/[:\,\.]/ig)[3],10));
										
										subtitleParts = subtitleParts.slice(0,subtitlePartIndex).concat(subtitleParts.slice(subtitlePartIndex+1));
										break;
									}
								}
								
								// The remaining lines are the subtitle payload itself (after removing an ID if present, and the time);
								html = subtitleParts.join("\n");
								text = html.replace(/<[^>]+>/ig,"");
								
								return {
									timeIn: timeIn,
									timeOut: timeOut,
									text: text,
									html: html
								};
							});
			
			return subtitles;
		} else {
			throw new Error("Required parameter captionData not supplied.");
		}
	},
	/* 
		captionator.fetchCaptions(string captionURI, function callback)
		
		Gets and parses valid SRT/WebVTT files.
		
		First parameter: String URL to valid SRT/WebVTT file.
		
		Second parameter: Callback function which accepts parsed subtitles as its first argument.
		
	*/
	"fetchCaptions": function(captionURI, callback) {
		"use strict";
		var captionData, ajaxObject = new XMLHttpRequest();
		
		ajaxObject.open('GET', captionURI, true);
		ajaxObject.onreadystatechange = function (eventData) {
			if (ajaxObject.readyState == 4) {
				if(ajaxObject.status == 200) {
					captionData = captionator.parseCaptions(ajaxObject.responseText);
					
					if (callback instanceof Function) {
						callback(captionData);
					}
				} else {
					//console.log("Error loading captions\n");
				}
			}
		};
		ajaxObject.send(null);
		
	}
};