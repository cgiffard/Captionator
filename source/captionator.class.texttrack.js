// Set up objects & types
// As defined by http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html
/**
* @constructor
*/
captionator.TextTrack = function TextTrack(id,kind,label,language,trackSource,isDefault) {

	this.onload = function () {};
	this.onerror = function() {};
	this.oncuechange = function() {};

	this.id = id || "";
	this.internalMode = captionator.TextTrack.OFF;
	this.cues = new captionator.TextTrackCueList(this);
	this.activeCues = new captionator.ActiveTextTrackCueList(this.cues,this);
	this.kind = kind || "subtitles";
	this.label = label || "";
	this.language = language || "";
	this.src = trackSource || "";
	this.readyState = captionator.TextTrack.NONE;
	this.internalDefault = isDefault || false;
	
	// Create getters and setters for mode
	this.getMode = function() {
		return this.internalMode;
	};
	
	this.setMode = function(value) {
		var allowedModes = [captionator.TextTrack.OFF,captionator.TextTrack.HIDDEN,captionator.TextTrack.SHOWING], containerID, container;
		if (allowedModes.indexOf(value) !== -1) {
			if (value !== this.internalMode) {
				this.internalMode = value;
		
				if (this.readyState === captionator.TextTrack.NONE && this.src.length > 0 && value > captionator.TextTrack.OFF) {
					this.loadTrack(this.src,null);
				}
				
				// Refresh all captions on video
				this.videoNode._captionator_dirtyBit = true;
				captionator.rebuildCaptions(this.videoNode);
			
				if (value === captionator.TextTrack.OFF) {
					// make sure the resource is reloaded next time (Is this correct behaviour?)
					this.cues.length = 0; // Destroy existing cue data (bugfix)
					this.readyState = captionator.TextTrack.NONE;
				}
			}
		} else {
			throw new Error("Illegal mode value for track: " + value);
		}
	};

	// Create getter for default
	this.getDefault = function() {
		return this.internalDefault;
	};

	if (Object.prototype.__defineGetter__) {
		this.__defineGetter__("mode", this.getMode);
		this.__defineSetter__("mode", this.setMode);
		this.__defineGetter__("default", this.getDefault);
	} else if (Object.defineProperty) {
		Object.defineProperty(this,"mode",
			{get: this.getMode, set: this.setMode}
		);
		Object.defineProperty(this,"default",
			{get: this.getDefault}
		);
	}

	this.loadTrack = function(source, callback) {
		var captionData, ajaxObject = new XMLHttpRequest();
		if (this.readyState === captionator.TextTrack.LOADED) {
			if (callback instanceof Function) {
				callback(captionData);
			}
		} else {
			this.src = source;
			this.readyState = captionator.TextTrack.LOADING;
		
			var currentTrackElement = this;
			ajaxObject.open('GET', source, true);
			ajaxObject.onreadystatechange = function (eventData) {
				if (ajaxObject.readyState === 4) {
					if(ajaxObject.status === 200) {
						var TrackProcessingOptions = currentTrackElement.videoNode._captionatorOptions || {};
						if (currentTrackElement.kind === "metadata") {
							// People can load whatever data they please into metadata tracks.
							// Don't process it.
							TrackProcessingOptions.processCueHTML = false;
							TrackProcessingOptions.sanitiseCueHTML = false;
						}
						
						captionData = captionator.parseCaptions(ajaxObject.responseText,TrackProcessingOptions);
						currentTrackElement.readyState = captionator.TextTrack.LOADED;
						currentTrackElement.cues.loadCues(captionData);
						currentTrackElement.activeCues.refreshCues.apply(currentTrackElement.activeCues);
						currentTrackElement.videoNode._captionator_dirtyBit = true;
						captionator.rebuildCaptions(currentTrackElement.videoNode);
						currentTrackElement.onload.call(this);
					
						if (callback instanceof Function) {
							callback.call(currentTrackElement,captionData);
						}
					} else {
						// Throw error handler, if defined
						currentTrackElement.readyState = captionator.TextTrack.ERROR;
						currentTrackElement.onerror();
					}
				}
			};
			try {
				ajaxObject.send(null);
			} catch(Error) {
				// Throw error handler, if defined
				currentTrackElement.readyState = captionator.TextTrack.ERROR;
				currentTrackElement.onerror(Error);
			}
		}
	};

	// mutableTextTrack.addCue(cue)
	// Adds the given cue to mutableTextTrack's text track list of cues.
	// Raises an exception if the argument is null, associated with another text track, or already in the list of cues.

	this.addCue = function(cue) {
		if (cue && cue instanceof captionator.TextTrackCue) {
			this.cues.addCue(cue);
		} else {
			throw new Error("The argument is null or not an instance of TextTrackCue.");
		}
	};

	// mutableTextTrack.removeCue(cue)
	// Removes the given cue from mutableTextTrack's text track list of cues.
	// Raises an exception if the argument is null, associated with another text track, or not in the list of cues.

	this.removeCue = function() {
	
	};
};

// Define constants for TextTrack.readyState
captionator.TextTrack.NONE = 0;
captionator.TextTrack.LOADING = 1;
captionator.TextTrack.LOADED = 2;
captionator.TextTrack.ERROR = 3;
// Define constants for TextTrack.mode
captionator.TextTrack.OFF = 0;
captionator.TextTrack.HIDDEN = 1;
captionator.TextTrack.SHOWING = 2;