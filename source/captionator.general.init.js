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
captionator.captionify = function(element,defaultLanguage,options) {
	var videoElements = [], elementIndex = 0;
	options = options instanceof Object? options : {};

	// Override defaults if options are present...
	if (options.minimumFontSize && typeof(options.minimumFontSize) === "number") {
		minimumFontSize = options.minimumFontSize;
	}

	if (options.minimumLineHeight && typeof(options.minimumLineHeight) === "number") {
		minimumLineHeight = options.minimumLineHeight;
	}
	
	if (options.fontSizeVerticalPercentage && typeof(options.fontSizeVerticalPercentage) === "number") {
		fontSizeVerticalPercentage = options.fontSizeVerticalPercentage;
	}
	
	if (options.lineHeightRatio && typeof(options.lineHeightRatio) !== "number") {
		lineHeightRatio = options.lineHeightRatio;
	}

	if (options.cueBackgroundColour && options.cueBackgroundColour instanceof Array) {
		cueBackgroundColour = options.cueBackgroundColour;
	}
	
	/* Feature detection block */
	// VirtualMediaContainer is an element designed to provide a media interface to Captionator
	// where the browser doesn't support native HTML5 video (it might wrap a flash movie, for example)
	if (!HTMLVideoElement && !(element instanceof VirtualMediaContainer) && !options.forceCaptionify) {
		// Browser doesn't support HTML5 video - die here.
		return false;
	}
	
	// Browser supports native track API
	// This should catch Chrome latest and IE10.
	if ((typeof(document.createElement("video").addTextTrack) === "function" || typeof(document.createElement("video").addTrack) === "function") && !options.forceCaptionify) {
		return false;
	}
	
	// if requested by options, export the object types
	if (!objectsCreated && options.exportObjects) {
		window.TextTrack = captionator.TextTrack;
		window.TextTrackCueList = captionator.TextTrackCueList;
		window.ActiveTextTrackCueList = captionator.ActiveTextTrackCueList;
		window.TextTrackCue = captionator.TextTrackCue;
		
		// Next time captionator.captionify() is called, the objects are already available to us.
		objectsCreated = true;
	}

	if (!element || element === false || element === undefined || element === null) {
		videoElements = [].slice.call(document.getElementsByTagName("video"),0); // select and convert to array
	} else {
		if (element instanceof Array) {
			for (elementIndex = 0; elementIndex < element.length; elementIndex ++) {
				if (typeof(element[elementIndex]) === "string") {
					videoElements = videoElements.concat([].slice.call(document.querySelectorAll(element[elementIndex]),0)); // select and convert to array
				} else if (element[elementIndex].constructor === HTMLVideoElement) {
					videoElements.push(element[elementIndex]);
				}
			}
		} else if (typeof(element) === "string") {
			videoElements = [].slice.call(document.querySelectorAll(element),0); // select and convert to array
		} else if (element.constructor === HTMLVideoElement) {
			videoElements.push(element);
		}
	}
	
	if (videoElements.length) {
		videoElements.forEach(function(videoElement) {
			videoElement.addTextTrack = function(id,kind,label,language,src,type,isDefault) {
				var allowedKinds = ["subtitles","captions","descriptions","captions","metadata","chapters"]; // WHATWG SPEC
				
				var textKinds = allowedKinds.slice(0,7);
				var newTrack;
				id = typeof(id) === "string" ? id : "";
				label = typeof(label) === "string" ? label : "";
				language = typeof(language) === "string" ? language : "";
				isDefault = typeof(isDefault) === "boolean" ? isDefault : false; // Is this track set as the default?

				// If the kind isn't known, throw DOM syntax error exception
				if (!allowedKinds.filter(function (currentKind){
						return kind === currentKind ? true : false;
					}).length) {
					throw captionator.createDOMException(12,"DOMException 12: SYNTAX_ERR: You must use a valid kind when creating a TimedTextTrack.","SYNTAX_ERR");

				} else {
					newTrack = new captionator.TextTrack(id,kind,label,language,src,null);
					if (newTrack) {
						if (!(videoElement.textTracks instanceof Array)) {
							videoElement.textTracks = [];
						}

						videoElement.textTracks.push(newTrack);
						return newTrack;
					} else {
						return false;
					}
				}
			};

			captionator.processVideoElement(videoElements[elementIndex],defaultLanguage,options);
		});

		return true;
	} else {
		return false;
	}
};