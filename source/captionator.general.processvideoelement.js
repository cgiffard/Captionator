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

captionator.processVideoElement = function(videoElement,defaultLanguage,options) {
	var trackList = [];
	var language = navigator.language || navigator.userLanguage;
	var globalLanguage = defaultLanguage || language.split("-")[0];
	options = options instanceof Object? options : {};

	if (!videoElement.captioned) {
		videoElement._captionatorOptions = options;
		videoElement.className += (videoElement.className.length ? " " : "") + "captioned";
		videoElement.captioned = true;
	
		// Check whether video element has an ID. If not, create one
		if (videoElement.id.length === 0) {
			videoElement.id = captionator.generateID();
		}
	
		var enabledDefaultTrack = false;
		[].slice.call(videoElement.querySelectorAll("track"),0).forEach(function(trackElement) {
			var sources = null;
			if (trackElement.querySelectorAll("source").length > 0) {
				sources = trackElement.querySelectorAll("source");
			} else {
				sources = trackElement.getAttribute("src");
			}
		
			var trackObject = videoElement.addTextTrack(
									(trackElement.getAttribute("id")||captionator.generateID()),
									trackElement.getAttribute("kind"),
									trackElement.getAttribute("label"),
									trackElement.getAttribute("srclang").split("-")[0],
									sources,
									trackElement.getAttribute("type"),
									trackElement.hasAttribute("default")); // (Christopher) I think we can get away with this given it's a boolean attribute anyway
		
			trackElement.track = trackObject;
			trackObject.trackNode = trackElement;
			trackObject.videoNode = videoElement;
			trackList.push(trackObject);
		
			// Now determine whether the track is visible by default.
			// The comments in this section come straight from the spec...
			var trackEnabled = false;
			
			// If the text track kind is subtitles or captions and the user has indicated an interest in having a track
			// with this text track kind, text track language, and text track label enabled, and there is no other text track
			// in the media element's list of text tracks with a text track kind of either subtitles or captions whose text track mode is showing
			// ---> Let the text track mode be showing.
			
			if ((trackObject.kind === "subtitles" || trackObject.kind === "captions") &&
				(defaultLanguage === trackObject.language && options.enableCaptionsByDefault)) {
				if (!trackList.filter(function(trackObject) {
						if ((trackObject.kind === "captions" || trackObject.kind === "subtitles") && defaultLanguage === trackObject.language && trackObject.mode === captionator.TextTrack.SHOWING) {
							return true;
						} else {
							return false;
						}
					}).length) {
					trackEnabled = true;
				}
			}
			
			// If the text track kind is chapters and the text track language is one that the user agent has reason to believe is
			// appropriate for the user, and there is no other text track in the media element's list of text tracks with a text track
			// kind of chapters whose text track mode is showing
			// ---> Let the text track mode be showing.
			
			if (trackObject.kind === "chapters" && (defaultLanguage === trackObject.language)) {
				if (!trackList.filter(function(trackObject) {
						if (trackObject.kind === "chapters" && trackObject.mode === captionator.TextTrack.SHOWING) {
							return true;
						} else {
							return false;
						}
					}).length) {
					trackEnabled = true;
				}
			}
			
			// If the text track kind is descriptions and the user has indicated an interest in having text descriptions
			// with this text track language and text track label enabled, and there is no other text track in the media element's
			// list of text tracks with a text track kind of descriptions whose text track mode is showing
			
			if (trackObject.kind === "descriptions" && (options.enableDescriptionsByDefault === true) && (defaultLanguage === trackObject.language)) {
				if (!trackList.filter(function(trackObject) {
						if (trackObject.kind === "descriptions" && trackObject.mode === captionator.TextTrack.SHOWING) {
							return true;
						} else {
							return false;
						}
					}).length) {
					trackEnabled = true;
				}
			}
			
			// If there is a text track in the media element's list of text tracks whose text track mode is showing by default,
			// the user agent must furthermore change that text track's text track mode to hidden.
			
			if (trackEnabled === true) {
				trackList.forEach(function(trackObject) {
					if(trackObject.trackNode.hasAttribute("default") && trackObject.mode === captionator.TextTrack.SHOWING) {
						trackObject.mode = captionator.TextTrack.HIDDEN;
					}
				});
			}
		
			// If the track element has a default attribute specified, and there is no other text track in the media element's
			// list of text tracks whose text track mode is showing or showing by default
			// Let the text track mode be showing by default.
		
			if (trackElement.hasAttribute("default")) {
				if (!trackList.filter(function(trackObject) {
						if (trackObject.trackNode.hasAttribute("default") && trackObject.trackNode !== trackElement) {
							return true;
						} else {
							return false;
						}
					}).length) {
					trackEnabled = true;
					trackObject.internalDefault = true;
				}
			}
		
			// Otherwise
			// Let the text track mode be disabled.
		
			if (trackEnabled === true) {
				trackObject.mode = captionator.TextTrack.SHOWING;
			}
		});
		
		videoElement.addEventListener("timeupdate", function(eventData){
			var videoElement = eventData.target;
			// update active cues
			try {
				videoElement.textTracks.forEach(function(track) {
					track.activeCues.refreshCues.apply(track.activeCues);
				});
			} catch(error) {}
		
			// External renderer?
			if (options.renderer instanceof Function) {
				options.renderer.call(captionator,videoElement);
			} else {
				captionator.rebuildCaptions(videoElement);
			}
		}, false);

		window.addEventListener("resize", function(eventData) {
			videoElement._captionator_dirtyBit = true; // mark video as dirty, force captionator to rerender captions
			captionator.rebuildCaptions(videoElement);
		},false);

		// Hires mode
		if (options.enableHighResolution === true) {
			window.setInterval(function captionatorHighResProcessor() {
				try {
					videoElement.textTracks.forEach(function(track) {
						track.activeCues.refreshCues.apply(track.activeCues);
					});
				} catch(error) {}
			
				// External renderer?
				if (options.renderer instanceof Function) {
					options.renderer.call(captionator,videoElement);
				} else {
					captionator.rebuildCaptions(videoElement);
				}
			},20);
		}
	}

	return videoElement;
};