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
				for (var captionID = 0; captionID < captionData.length; captionID ++) {
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
		var trackList = [], trackIndex = 0;
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
								"kind":			trackElement.getAttribute("kind"),
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
								
								// Style up
								var videoControlHeight = 32;
								var videoComputedStyle = window.getComputedStyle(eventData.srcElement,null);
								captionContainer.style.position = "absolute";
								captionContainer.style.width = parseInt(videoComputedStyle.getPropertyValue("width"),10) + "px";
								captionContainer.style.height = Math.floor(parseInt(videoComputedStyle.getPropertyValue("height"),10)*0.15) + "px";
								captionContainer.style.backgroundColor = "rgba(0,0,0,0.5)";
								captionContainer.style.left = eventData.srcElement.offsetLeft + "px";
								captionContainer.style.top = ((eventData.srcElement.offsetTop + parseInt(videoComputedStyle.getPropertyValue("height"),10)) - (parseInt(captionContainer.style.height,10) + videoControlHeight)) + "px";
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
		captionator.parseCaptions(string captionData)
		
		Accepts and parses SRT caption/subtitle data. Will extend for WebVTT shortly. Perhaps non-JSON WebVTT will work already?
		
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
		if (captionData) {
			var subtitles = captionData
							.replace(/\r\n/g,"\n")
							.replace(/\r/g,"\n")
							.split(/\n\n/g)
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
					// console.log("Error loading captions\n");
				}
			}
		};
		ajaxObject.send(null);
		
	}
};