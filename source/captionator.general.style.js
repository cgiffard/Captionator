/*
	captionator.getNodeMetrics(DOMNode)

	Calculates and returns a number of sizing and position metrics from a DOMNode of any variety (though this function is intended
	to be used with HTMLVideoElements.) Returns the height of the default controls on a video based on user agent detection
	(As far as I know, there's no way to dynamically calculate the height of browser UI controls on a video.)

	First parameter: DOMNode from which to calculate sizing metrics. This parameter is mandatory.

	RETURNS:

	An object with the following properties:
		left: The calculated left offset of the node
		top: The calculated top offset of the node
		height: The calculated height of the node
		width: The calculated with of the node
		controlHeight: If the node is a video and has the `controls` attribute present, the height of the UI controls for the video. Otherwise, zero.

*/

captionator.getNodeMetrics = function(DOMNode) {
	var nodeComputedStyle = window.getComputedStyle(DOMNode,null);
	var offsetObject = DOMNode;
	var offsetTop = DOMNode.offsetTop, offsetLeft = DOMNode.offsetLeft;
	var width = DOMNode, height = 0;
	var controlHeight = 0;
	
	width = parseInt(nodeComputedStyle.getPropertyValue("width"),10);
	height = parseInt(nodeComputedStyle.getPropertyValue("height"),10);
	
	// Slightly verbose expression in order to pass JSHint
	while (!!(offsetObject = offsetObject.offsetParent)) {
		offsetTop += offsetObject.offsetTop;
		offsetLeft += offsetObject.offsetLeft;
	}

	if (DOMNode.hasAttribute("controls")) {
		// Get heights of default control strip in various browsers
		// There could be a way to measure this live but I haven't thought/heard of it yet...
		var UA = navigator.userAgent.toLowerCase();
		if (UA.indexOf("chrome") !== -1) {
			controlHeight = 32;
		} else if (UA.indexOf("opera") !== -1) {
			controlHeight = 25;
		} else if (UA.indexOf("firefox") !== -1) {
			controlHeight = 28;
		} else if (UA.indexOf("ie 9") !== -1 || UA.indexOf("ipad") !== -1) {
			controlHeight = 44;
		} else if (UA.indexOf("safari") !== -1) {
			controlHeight = 25;
		}
	} else if (DOMNode._captionatorOptions) {
		var tmpCaptionatorOptions = DOMNode._captionatorOptions;
		if (tmpCaptionatorOptions.controlHeight) {
			controlHeight = parseInt(tmpCaptionatorOptions.controlHeight,10);
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

/*
	captionator.applyStyles(DOMNode, Style Object)

	A fast way to apply multiple CSS styles to a DOMNode.

	First parameter: DOMNode to style. This parameter is mandatory.

	Second parameter: A key/value object where the keys are camel-cased variants of CSS property names to apply,
	and the object values are CSS property values as per the spec. This parameter is mandatory.

	RETURNS:

	Nothing.

*/

captionator.applyStyles = function(StyleNode, styleObject) {
	for (var styleName in styleObject) {
		if ({}.hasOwnProperty.call(styleObject, styleName)) {
			StyleNode.style[styleName] = styleObject[styleName];
		}
	}
};

/*
	captionator.checkDirection(text)

	Determines whether the text string passed into the function is an RTL (right to left) or LTR (left to right) string.

	First parameter: Text string to check. This parameter is mandatory.

	RETURNS:

	The text string 'rtl' if the text is a right to left string, 'ltr' if the text is a left to right string, or an empty string
	if the direction could not be determined.

*/
captionator.checkDirection = function(text) {
	// Inspired by http://www.frequency-decoder.com/2008/12/12/automatically-detect-rtl-text
	// Thanks guys!
	var ltrChars            = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF'+'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
		rtlChars            = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
		ltrDirCheckRe       = new RegExp('^[^'+rtlChars+']*['+ltrChars+']'),
		rtlDirCheckRe       = new RegExp('^[^'+ltrChars+']*['+rtlChars+']');

	return !!rtlDirCheckRe.test(text) ? 'rtl' : (!!ltrDirCheckRe.test(text) ? 'ltr' : '');
};

/*
	captionator.styleCue(DOMNode, cueObject, videoNode)

	Styles and positions cue nodes according to the WebVTT specification.

	First parameter: The DOMNode representing the cue to style. This parameter is mandatory.

	Second parameter: The TextTrackCue itself.

	Third Parameter: The HTMLVideoElement with which the cue is associated. This parameter is mandatory.

	RETURNS:

	Nothing.

*/
captionator.styleCue = function(DOMNode, cueObject, videoElement) {
	// Variables for maintaining render calculations
	var cueX = 0, cueY = 0, cueWidth = 0, cueHeight = 0, cueSize, cueAlignment, cuePaddingLR = 0, cuePaddingTB = 0;
	var baseFontSize, basePixelFontSize, baseLineHeight, tmpHeightExclusions;
	var videoHeightInLines, videoWidthInLines, pixelLineHeight, verticalPixelLineHeight, charactersPerLine = 0, characterCount = 0;
	var characters = 0, lineCount = 0, finalLineCharacterCount = 0, finalLineCharacterHeight = 0, currentLine = 0;
	var characterX, characterY, characterPosition = 0;
	var options = videoElement._captionatorOptions || {};
	var videoMetrics;
	var maxCueSize = 100, internalTextPosition = 50, textBoundingBoxWidth = 0, textBoundingBoxPercentage = 0, autoSize = true;
	var plainCueText = "", plainCueTextContainer;
	
	// In future, support cue-granular language detection method
	var cueLanguage = cueObject.track.language;
	
	// Function to facilitate vertical text alignments in browsers which do not support writing-mode
	// (sadly, all the good ones!)
	var spanify = function(DOMNode) {
		if (DOMNode.spanified) return DOMNode.characterCount;
		
		var stringHasLength = function(textString) { return !!textString.length; };
		var spanCode = "<span class='captionator-cue-character'>";
		var nodeIndex, currentNode, currentNodeValue, replacementFragment, characterCount = 0;
		var styleSpan = function(span) {
			characterCount ++;
			captionator.applyStyles(span,{
				"display":		"block",
				"lineHeight":	"auto",
				"height":		basePixelFontSize + "px",
				"width":		verticalPixelLineHeight + "px",
				"textAlign":	"center"
			});
		};
		
		for (nodeIndex in DOMNode.childNodes) {
			if (DOMNode.childNodes.hasOwnProperty(nodeIndex) && !DOMNode.childNodes[nodeIndex].nospan) {
				currentNode = DOMNode.childNodes[nodeIndex];
				if (currentNode.nodeType === 3) {
					replacementFragment = document.createDocumentFragment();
					currentNodeValue = currentNode.nodeValue;
					
					replacementFragment.appendChild(document.createElement("span"));
					
					replacementFragment.childNodes[0].innerHTML =
							spanCode +
							currentNodeValue
								.split(/(.)/)
								.filter(stringHasLength)
								.join("</span>" + spanCode) +
							"</span>";
					
					[].slice.call(replacementFragment.querySelectorAll("span.captionator-cue-character"),0).forEach(styleSpan);
					
					currentNode.parentNode.replaceChild(replacementFragment,currentNode);
				} else if (DOMNode.childNodes[nodeIndex].nodeType === 1) {
					characterCount += spanify(DOMNode.childNodes[nodeIndex]);
				}
			}
		}
		
		// We have to know when we've already split this thing up into spans,
		// so we don't end up creating more and more sub-spans when we restyle the node
		DOMNode.characterCount = characterCount;
		DOMNode.spanified = true;
		
		return characterCount;
	};

	// Set up the cue canvas
	videoMetrics = captionator.getNodeMetrics(videoElement);
	
	// Define storage for the available cue area, diminished as further cues are added
	// Cues occupy the largest possible area they can, either by width or height
	// (depending on whether the `direction` of the cue is vertical or horizontal)
	// Cues which have an explicit position set do not detract from this area.
	// It is the subtitle author's responsibility to ensure they don't overlap if
	// they decide to override default positioning!
	
	if (!videoElement._captionator_availableCueArea) {
		videoElement._captionator_availableCueArea = {
			"bottom": (videoMetrics.height-videoMetrics.controlHeight),
			"right": videoMetrics.width,
			"top": 0,
			"left": 0,
			"height": (videoMetrics.height-videoMetrics.controlHeight),
			"width": videoMetrics.width
		};
	}

	if (cueObject.direction === "horizontal") {
		// Calculate text bounding box
		// (isn't useful for vertical cues, because we're doing all glyph positioning ourselves.)
		captionator.applyStyles(DOMNode,{
			"width": "auto",
			"position": "static",
			"display": "inline-block",
			"padding": "1em"
		});

		textBoundingBoxWidth = parseInt(DOMNode.offsetWidth,10);
		textBoundingBoxPercentage = Math.floor((textBoundingBoxWidth / videoElement._captionator_availableCueArea.width) * 100);
		textBoundingBoxPercentage = textBoundingBoxPercentage <= 100 ? textBoundingBoxPercentage : 100;
	}

	// Calculate font metrics
	baseFontSize = ((videoMetrics.height * (fontSizeVerticalPercentage/100))/96)*72;
	baseFontSize = baseFontSize >= minimumFontSize ? baseFontSize : minimumFontSize;
	basePixelFontSize = Math.floor((baseFontSize/72)*96);
	baseLineHeight = Math.floor(baseFontSize * lineHeightRatio);
	baseLineHeight = baseLineHeight > minimumLineHeight ? baseLineHeight : minimumLineHeight;
	pixelLineHeight = Math.ceil((baseLineHeight/72)*96);
	verticalPixelLineHeight	= pixelLineHeight;
	
	if (pixelLineHeight * Math.floor(videoMetrics.height / pixelLineHeight) < videoMetrics.height) {
		pixelLineHeight = Math.floor(videoMetrics.height / Math.floor(videoMetrics.height / pixelLineHeight));
		baseLineHeight = Math.ceil((pixelLineHeight/96)*72);
	}
	
	if (pixelLineHeight * Math.floor(videoMetrics.width / pixelLineHeight) < videoMetrics.width) {
		verticalPixelLineHeight = Math.ceil(videoMetrics.width / Math.floor(videoMetrics.width / pixelLineHeight));
	}
	
	// Calculate render area height & width in lines
	videoHeightInLines = Math.floor(videoElement._captionator_availableCueArea.height / pixelLineHeight);
	videoWidthInLines = Math.floor(videoElement._captionator_availableCueArea.width / verticalPixelLineHeight);
	
	// Calculate cue size and padding
	if (parseFloat(String(cueObject.size).replace(/[^\d\.]/ig,"")) === 0) {
		// We assume (given a size of 0) that no explicit size was set.
		// Depending on settings, we either use the WebVTT default size of 100% (the Captionator.js default behaviour),
		// or the proportion of the video the text bounding box takes up (widthwise) as a percentage (proposed behaviour, LeanBack's default)
		if (options.sizeCuesByTextBoundingBox === true) {
			cueSize = textBoundingBoxPercentage;
		} else {
			cueSize = 100;
			autoSize = false;
		}
	} else {
		autoSize = false;
		cueSize = parseFloat(String(cueObject.size).replace(/[^\d\.]/ig,""));
		cueSize = cueSize <= 100 ? cueSize : 100;
	}
	
	cuePaddingLR = cueObject.direction === "horizontal" ? Math.floor(videoMetrics.width * 0.01) : 0;
	cuePaddingTB = cueObject.direction === "horizontal" ? 0 : Math.floor(videoMetrics.height * 0.01);
	
	if (cueObject.linePosition === "auto") {
		cueObject.linePosition = cueObject.direction === "horizontal" ? videoHeightInLines : videoWidthInLines;
	} else if (String(cueObject.linePosition).match(/\%/)) {
		cueObject.snapToLines = false;
		cueObject.linePosition = parseFloat(String(cueObject.linePosition).replace(/\%/ig,""));
	}
	
	if (cueObject.direction === "horizontal") {
		cueHeight = pixelLineHeight;

		if (cueObject.textPosition !== "auto" && autoSize) {
			internalTextPosition = parseFloat(String(cueObject.textPosition).replace(/[^\d\.]/ig,""));
			
			// Don't squish the text
			if (cueSize - internalTextPosition > textBoundingBoxPercentage) {
				cueSize -= internalTextPosition;
			} else {
				cueSize = textBoundingBoxPercentage;
			}
		}

		if (cueObject.snapToLines === true) {
			cueWidth = videoElement._captionator_availableCueArea.width * (cueSize/100);
		} else {
			cueWidth = videoMetrics.width * (cueSize/100);
		}

		if (cueObject.textPosition === "auto") {
			cueX = ((videoElement._captionator_availableCueArea.right - cueWidth) / 2) + videoElement._captionator_availableCueArea.left;
		} else {
			internalTextPosition = parseFloat(String(cueObject.textPosition).replace(/[^\d\.]/ig,""));
			cueX = ((videoElement._captionator_availableCueArea.right - cueWidth) * (internalTextPosition/100)) + videoElement._captionator_availableCueArea.left;
		}
		
		if (cueObject.snapToLines === true) {
			cueY = ((videoHeightInLines-1) * pixelLineHeight) + videoElement._captionator_availableCueArea.top;
		} else {
			tmpHeightExclusions = videoMetrics.controlHeight + pixelLineHeight + (cuePaddingTB*2);
			cueY = (videoMetrics.height - tmpHeightExclusions) * (cueObject.linePosition/100);
		}
		
	} else {
		// Basic positioning
		cueY = videoElement._captionator_availableCueArea.top;
		cueX = videoElement._captionator_availableCueArea.right - verticalPixelLineHeight;
		cueWidth = verticalPixelLineHeight;
		cueHeight = videoElement._captionator_availableCueArea.height * (cueSize/100);
		
		// Split into characters, and continue calculating width & positioning with new info
		characterCount = spanify(DOMNode);
		characters = [].slice.call(DOMNode.querySelectorAll("span.captionator-cue-character"),0);
		charactersPerLine = Math.floor((cueHeight-cuePaddingTB*2)/basePixelFontSize);
		cueWidth = Math.ceil(characterCount/charactersPerLine) * verticalPixelLineHeight;
		lineCount = Math.ceil(characterCount/charactersPerLine);
		finalLineCharacterCount = characterCount - (charactersPerLine * (lineCount - 1));
		finalLineCharacterHeight = finalLineCharacterCount * basePixelFontSize;
		
		// Work out CueX taking into account linePosition...
		if (cueObject.snapToLines === true) {
			cueX = cueObject.direction === "vertical-lr" ? videoElement._captionator_availableCueArea.left : videoElement._captionator_availableCueArea.right - cueWidth;
		} else {
			var temporaryWidthExclusions = cueWidth + (cuePaddingLR * 2);
			if (cueObject.direction === "vertical-lr") {
				cueX = (videoMetrics.width - temporaryWidthExclusions) * (cueObject.linePosition/100);
			} else {
				cueX = (videoMetrics.width-temporaryWidthExclusions) - ((videoMetrics.width - temporaryWidthExclusions) * (cueObject.linePosition/100));
			}
		}
		
		// Work out CueY taking into account textPosition...
		if (cueObject.textPosition === "auto") {
			cueY = ((videoElement._captionator_availableCueArea.bottom - cueHeight) / 2) + videoElement._captionator_availableCueArea.top;
		} else {
			cueObject.textPosition = parseFloat(String(cueObject.textPosition).replace(/[^\d\.]/ig,""));
			cueY = ((videoElement._captionator_availableCueArea.bottom - cueHeight) * (cueObject.textPosition/100)) + 
					videoElement._captionator_availableCueArea.top;
		}
		
		// Iterate through the characters and position them accordingly...
		currentLine = 0;
		characterPosition = 0;
		characterX = 0;
		characterY = 0;
		
		characters.forEach(function(characterSpan,characterCount) {
			if (cueObject.direction === "vertical-lr") {
				characterX = verticalPixelLineHeight * currentLine;
			} else {
				characterX = cueWidth - (verticalPixelLineHeight * (currentLine+1));
			}
			
			if (cueObject.alignment === "start" || (cueObject.alignment !== "start" && currentLine < lineCount-1)) {
				characterY = (characterPosition * basePixelFontSize) + cuePaddingTB;
			} else if (cueObject.alignment === "end") {
				characterY = ((characterPosition * basePixelFontSize)-basePixelFontSize) + ((cueHeight+(cuePaddingTB*2))-finalLineCharacterHeight);
			} else if (cueObject.alignment === "middle") {
				characterY = (((cueHeight - (cuePaddingTB*2))-finalLineCharacterHeight)/2) + (characterPosition * basePixelFontSize);
			}
			
			// Because these are positioned absolutely, screen readers don't read them properly.
			// Each of the characters is set to be ignored, and the entire text is duplicated in a hidden element to ensure
			// it is read correctly.
			characterSpan.setAttribute("aria-hidden","true");

			captionator.applyStyles(characterSpan,{
				"position": "absolute",
				"top": characterY + "px",
				"left": characterX + "px"
			});
			
			if (characterPosition >= charactersPerLine-1) {
				characterPosition = 0;
				currentLine ++;
			} else {
				characterPosition ++;
			}
		});
		
		// Get the plain cue text
		if (!DOMNode.accessified) {
			plainCueText = cueObject.text.getPlain(videoElement.currentTime);
			plainCueTextContainer = document.createElement("div");
			plainCueTextContainer.innerHTML = plainCueText;
			plainCueTextContainer.nospan = true;
			DOMNode.appendChild(plainCueTextContainer);
			DOMNode.accessified = true;
		
			// Now hide it. Don't want it interfering with cue display
			captionator.applyStyles(plainCueTextContainer,{
				"position": "absolute",
				"overflow": "hidden",
				"width": "1px",
				"height": "1px",
				"opacity": "0",
				"textIndent": "-999em"
			});
		}
	}
	
	if (cueObject.direction === "horizontal") {
		if (captionator.checkDirection(String(cueObject.text)) === "rtl") {
			cueAlignment = {"start":"right","middle":"center","end":"left"}[cueObject.alignment];
		} else {	
			cueAlignment = {"start":"left","middle":"center","end":"right"}[cueObject.alignment];
		}
	}

	captionator.applyStyles(DOMNode,{
		"position": "absolute",
		"overflow": "hidden",
		"width": cueWidth + "px",
		"height": cueHeight + "px",
		"top": cueY + "px",
		"left": cueX + "px",
		"padding": cuePaddingTB + "px " + cuePaddingLR + "px",
		"textAlign": cueAlignment,
		"backgroundColor": "rgba(" + cueBackgroundColour.join(",") + ")",
		"direction": captionator.checkDirection(String(cueObject.text)),
		"lineHeight": baseLineHeight + "pt",
		"boxSizing": "border-box"
	});
	
	if (cueObject.direction === "vertical" || cueObject.direction === "vertical-lr") {
		// Work out how to shrink the available render area
		// If subtracting from the right works out to a larger area, subtract from the right.
		// Otherwise, subtract from the left.	
		if (((cueX - videoElement._captionator_availableCueArea.left) - videoElement._captionator_availableCueArea.left) >=
			(videoElement._captionator_availableCueArea.right - (cueX + cueWidth))) {
			
			videoElement._captionator_availableCueArea.right = cueX;
		} else {
			videoElement._captionator_availableCueArea.left = cueX + cueWidth;
		}
		
		videoElement._captionator_availableCueArea.width =
			videoElement._captionator_availableCueArea.right - 
			videoElement._captionator_availableCueArea.left;
		
	} else {
		// Now shift cue up if required to ensure it's all visible
		if (DOMNode.scrollHeight > DOMNode.offsetHeight * 1.2) {
			if (cueObject.snapToLines) {
				var upwardAjustmentInLines = 0;
				while (DOMNode.scrollHeight > DOMNode.offsetHeight * 1.2) {
					cueHeight += pixelLineHeight;
					DOMNode.style.height = cueHeight + "px";
					upwardAjustmentInLines ++;
				}
				
				cueY = cueY - (upwardAjustmentInLines*pixelLineHeight);
				DOMNode.style.top = cueY + "px";
			} else {
				// Not working by lines, so instead of shifting up, simply throw out old cueY calculation
				// and completely recalculate its value
				var upwardAjustment = (DOMNode.scrollHeight - cueHeight);
				cueHeight = (DOMNode.scrollHeight + cuePaddingTB);
				tmpHeightExclusions = videoMetrics.controlHeight + cueHeight + (cuePaddingTB*2);
				cueY = (videoMetrics.height - tmpHeightExclusions) * (cueObject.linePosition/100);
				
				DOMNode.style.height = cueHeight + "px";
				DOMNode.style.top = cueY + "px";
			}
		}
					
		// Work out how to shrink the available render area
		// If subtracting from the bottom works out to a larger area, subtract from the bottom.
		// Otherwise, subtract from the top.
		if (((cueY - videoElement._captionator_availableCueArea.top) - videoElement._captionator_availableCueArea.top) >=
			(videoElement._captionator_availableCueArea.bottom - (cueY + cueHeight)) &&
			videoElement._captionator_availableCueArea.bottom > cueY) {
			
			videoElement._captionator_availableCueArea.bottom = cueY;
		} else {
			if (videoElement._captionator_availableCueArea.top < cueY + cueHeight) {
				videoElement._captionator_availableCueArea.top = cueY + cueHeight;
			}
		}
		
		videoElement._captionator_availableCueArea.height =
			videoElement._captionator_availableCueArea.bottom - 
			videoElement._captionator_availableCueArea.top;
	}
	
	// DEBUG->

	// DEBUG FUNCTIONS
	// This function can be used for debugging WebVTT captions. It will not be
	// included in production versions of Captionator.
	// -----------------------------------------------------------------------
	if (options.debugMode) {
		var debugCanvas, debugContext;
		var generateDebugCanvas = function() {
			if (!debugCanvas) {
				if (videoElement._captionatorDebugCanvas) {
					debugCanvas = videoElement._captionatorDebugCanvas;
					debugContext = videoElement._captionatorDebugContext;
				} else {
					debugCanvas = document.createElement("canvas");
					debugCanvas.setAttribute("width",videoMetrics.width);
					debugCanvas.setAttribute("height",videoMetrics.height - videoMetrics.controlHeight);
					document.body.appendChild(debugCanvas);
					captionator.applyStyles(debugCanvas,{
						"position": "absolute",
						"top": videoMetrics.top + "px",
						"left": videoMetrics.left + "px",
						"width": videoMetrics.width + "px",
						"height": (videoMetrics.height - videoMetrics.controlHeight) + "px",
						"zIndex": 3000
					});
			
					debugContext = debugCanvas.getContext("2d");
					videoElement._captionatorDebugCanvas = debugCanvas;
					videoElement._captionatorDebugContext = debugContext;
				}
			}
		};
		
		var clearDebugCanvas = function() {
			generateDebugCanvas();
			debugCanvas.setAttribute("width",videoMetrics.width);
		};
		
		var drawLines = function() {
			var lineIndex;
			
			// Set up canvas for drawing debug information
			generateDebugCanvas();
			
			debugContext.strokeStyle = "rgba(255,0,0,0.5)";
			debugContext.lineWidth = 1;
			
			// Draw horizontal line dividers
			debugContext.beginPath();
			for (lineIndex = 0; lineIndex < videoHeightInLines; lineIndex ++) {
				debugContext.moveTo(0.5,(lineIndex*pixelLineHeight)+0.5);
				debugContext.lineTo(videoMetrics.width,(lineIndex*pixelLineHeight)+0.5);
			}
			
			debugContext.closePath();
			debugContext.stroke();
			debugContext.beginPath();
			debugContext.strokeStyle = "rgba(0,255,0,0.5)";
			
			// Draw vertical line dividers
			// Right to left, vertical
			for (lineIndex = videoWidthInLines; lineIndex >= 0; lineIndex --) {
				debugContext.moveTo((videoMetrics.width-(lineIndex*verticalPixelLineHeight))-0.5,-0.5);
				debugContext.lineTo((videoMetrics.width-(lineIndex*verticalPixelLineHeight))-0.5,videoMetrics.height);
			}
			
			debugContext.closePath();
			debugContext.stroke();
			debugContext.beginPath();
			debugContext.strokeStyle = "rgba(255,255,0,0.5)";
			
			// Draw vertical line dividers
			// Left to right, vertical
			for (lineIndex = 0; lineIndex <= videoWidthInLines; lineIndex ++) {
				debugContext.moveTo((lineIndex*verticalPixelLineHeight)+0.5,-0.5);
				debugContext.lineTo((lineIndex*verticalPixelLineHeight)+0.5,videoMetrics.height);
			}
			
			debugContext.stroke();
			
			videoElement.linesDrawn = true;
		};
		
		var drawAvailableArea = function() {
			generateDebugCanvas();
			
			debugContext.fillStyle = "rgba(100,100,255,0.5)";
			
			debugContext.fillRect(
					videoElement._captionator_availableCueArea.left,
					videoElement._captionator_availableCueArea.top,
					videoElement._captionator_availableCueArea.right,
					videoElement._captionator_availableCueArea.bottom);
			debugContext.stroke();
			
		};
		
		clearDebugCanvas();
		drawAvailableArea();
		drawLines();
	}
	// END DEBUG FUNCTIONS
	// <-DEBUG
};

/*
	captionator.styleCueCanvas(VideoNode)

	Styles and positions a canvas (not a <canvas> object - just a div) for displaying cues on a video.
	If the HTMLVideoElement in question does not have a canvas, one is created for it.

	First parameter: The HTMLVideoElement for which the cue canvas will be styled/created. This parameter is mandatory.

	RETURNS:

	Nothing.

*/
captionator.styleCueCanvas = function(videoElement) {
	var baseFontSize, baseLineHeight;
	var containerObject, descriptionContainerObject;
	var containerID, descriptionContainerID;
	var options = videoElement._captionatorOptions instanceof Object ? videoElement._captionatorOptions : {};

	if (!(videoElement instanceof HTMLVideoElement)) {
		throw new Error("Cannot style a cue canvas for a non-video node!");
	}
	
	if (videoElement._containerObject) {
		containerObject = videoElement._containerObject;
		containerID = containerObject.id;
	}
	
	if (videoElement._descriptionContainerObject) {
		descriptionContainerObject = videoElement._descriptionContainerObject;
		descriptionContainerID = descriptionContainerObject.id;
	}
	
	if (!descriptionContainerID) {
		// Contain hidden descriptive captions
		descriptionContainerObject = document.createElement("div");
		descriptionContainerObject.className = "captionator-cue-descriptive-container";
		descriptionContainerID = captionator.generateID();
		descriptionContainerObject.id = descriptionContainerID;
		videoElement._descriptionContainerObject = descriptionContainerObject;
		
		// ARIA LIVE for descriptive text
		descriptionContainerObject.setAttribute("aria-live","polite");
		descriptionContainerObject.setAttribute("aria-atomic","true");
		descriptionContainerObject.setAttribute("role","region");
		
		// Stick it in the body
		document.body.appendChild(descriptionContainerObject);
		
		// Hide the descriptive canvas...
		captionator.applyStyles(descriptionContainerObject,{
			"position": "absolute",
			"overflow": "hidden",
			"width": "1px",
			"height": "1px",
			"opacity": "0",
			"textIndent": "-999em"
		});
	}

	if (!containerObject) {
		// visually display captions
		containerObject = document.createElement("div");
		containerObject.className = "captionator-cue-canvas";
		containerID = captionator.generateID();
		containerObject.id = containerID;
		
		// We can choose to append the canvas to an element other than the body.
		// If this option is specified, we no longer use the offsetTop/offsetLeft of the video
		// to define the position, we just inherit it.
		//
		// options.appendCueCanvasTo can be an HTMLElement, or a DOM query.
		// If the query fails, the canvas will be appended to the body as normal.
		// If the query is successful, the canvas will be appended to the first matched element.

		if (options.appendCueCanvasTo) {
			var canvasParentNode = null;

			if (options.appendCueCanvasTo instanceof HTMLElement) {
				canvasParentNode = options.appendCueCanvasTo;
			} else if (typeof(options.appendCueCanvasTo) === "string") {
				try {
					var canvasSearchResult = document.querySelectorAll(options.appendCueCanvasTo);
					if (canvasSearchResult.length > 0) {
						canvasParentNode = canvasSearchResult[0];
					} else { throw null; /* Bounce to catch */ }
				} catch(error) {
					canvasParentNode = document.body;
					options.appendCueCanvasTo = false;
				}
			} else {
				canvasParentNode = document.body;
				options.appendCueCanvasTo = false;
			}

			canvasParentNode.appendChild(containerObject);
		} else {
			document.body.appendChild(containerObject);
		}

		videoElement._containerObject = containerObject;
		
		// No aria live, as descriptions aren't placed in this container.
		// containerObject.setAttribute("role","region");
		
	} else if (!containerObject.parentNode) {
		document.body.appendChild(containerObject);
	}

	// Set up the cue canvas
	var videoMetrics = captionator.getNodeMetrics(videoElement);

	// Set up font metrics
	baseFontSize = ((videoMetrics.height * (fontSizeVerticalPercentage/100))/96)*72;
	baseFontSize = baseFontSize >= minimumFontSize ? baseFontSize : minimumFontSize;
	baseLineHeight = Math.floor(baseFontSize * lineHeightRatio);
	baseLineHeight = baseLineHeight > minimumLineHeight ? baseLineHeight : minimumLineHeight;

	// Style node!
	captionator.applyStyles(containerObject,{
		"position": "absolute",
		"overflow": "hidden",
		"zIndex": 100,
		"height": (videoMetrics.height - videoMetrics.controlHeight) + "px",
		"width": videoMetrics.width + "px",
		"top": (options.appendCueCanvasTo ? 0 : videoMetrics.top) + "px",
		"left": (options.appendCueCanvasTo ? 0 : videoMetrics.left) + "px",
		"color": "white",
		"fontFamily": "Verdana, Helvetica, Arial, sans-serif",
		"fontSize": baseFontSize + "pt",
		"lineHeight": baseLineHeight + "pt",
		"boxSizing": "border-box"
	});
};