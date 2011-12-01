/**
* @constructor
*/
captionator.TextTrackCue = function TextTrackCue(id, startTime, endTime, text, settings, pauseOnExit, track) {
	// Set up internal data store
	this.id = id;
	this.track = track instanceof captionator.TextTrack ? track : null;
	this.startTime = parseFloat(startTime);
	this.endTime = parseFloat(endTime) >= this.startTime ? parseFloat(endTime) : this.startTime;
	this.text = typeof(text) === "string" || text instanceof captionator.CaptionatorCueStructure ? text : "";
	this.settings = typeof(settings) === "string" ? settings : "";
	this.intSettings = {};
	this.pauseOnExit = !!pauseOnExit;
	this.wasActive = false;

	// Parse settings & set up cue defaults

	// A writing direction, either horizontal (a line extends horizontally and is positioned vertically,
	// with consecutive lines displayed below each other), vertical growing left (a line extends vertically
	// and is positioned horizontally, with consecutive lines displayed to the left of each other), or
	// vertical growing right (a line extends vertically and is positioned horizontally, with consecutive
	// lines displayed to the right of each other).
	// Values:
	// horizontal, vertical, vertical-lr
	this.direction = "horizontal";

	// A boolean indicating whether the line's position is a line position (positioned to a multiple of the
	// line dimensions of the first line of the cue), or whether it is a percentage of the dimension of the video.
	this.snapToLines = true;

	// Either a number giving the position of the lines of the cue, to be interpreted as defined by the
	// writing direction and snap-to-lines flag of the cue, or the special value auto, which means the
	// position is to depend on the other active tracks.
	this.linePosition = "auto";

	// A number giving the position of the text of the cue within each line, to be interpreted as a percentage
	// of the video, as defined by the writing direction.
	this.textPosition = 50;

	// A number giving the size of the box within which the text of each line of the cue is to be aligned, to
	// be interpreted as a percentage of the video, as defined by the writing direction.
	this.size = 0;

	// An alignment for the text of each line of the cue, either start alignment (the text is aligned towards its
	// start side), middle alignment (the text is aligned centered between its start and end sides), end alignment
	// (the text is aligned towards its end side). Which sides are the start and end sides depends on the
	// Unicode bidirectional algorithm and the writing direction. [BIDI]
	// Values:
	// start, middle, end
	this.alignment = "middle";

	// Parse VTT Settings...
	if (this.settings.length) {
		var intSettings = this.intSettings;
		var currentCue = this;
		settings = settings.split(/\s+/).filter(function(settingItem) { return settingItem.length > 0;});
		if (settings instanceof Array) {
			settings.forEach(function(cueItem) {
				var settingMap = {"D":"direction","L":"linePosition","T":"textPosition","A":"alignment","S":"size"};
				cueItem = cueItem.split(":");
				if (settingMap[cueItem[0]]) {
					intSettings[settingMap[cueItem[0]]] = cueItem[1];
				}
			
				if (settingMap[cueItem[0]] in currentCue) {
					currentCue[settingMap[cueItem[0]]] = cueItem[1];
				}
			});
		}
	}
	
	if (this.linePosition.match(/\%/)) {
		this.snapToLines = false;
	}

	// Functions defined by spec (getters, kindof)
	this.getCueAsSource = function getCueAsSource() {
		// Choosing the below line instead will mean that the raw, unprocessed source will be returned instead.
		// Not really sure which is the correct behaviour.
		// return this.text instanceof captionator.CaptionatorCueStructure? this.text.cueSource : this.text;
		return String(this.text);
	};

	this.getCueAsHTML = function getCueAsHTML() {
		var DOMFragment = document.createDocumentFragment();
		var DOMNode = document.createElement("div");
		DOMNode.innerHTML = String(this.text);
		
		Array.prototype.forEach.call(DOMNode.childNodes,function(child) {
			DOMFragment.appendChild(child.cloneNode(true));
		});
	
		return DOMFragment;
	};

	this.isActive = function() {
		var currentTime = 0;
		if (this.track instanceof captionator.TextTrack) {
			if ((this.track.mode === captionator.TextTrack.SHOWING || this.track.mode === captionator.TextTrack.HIDDEN) && this.track.readyState === captionator.TextTrack.LOADED) {
				try {
					currentTime = this.track.videoNode.currentTime;
					
					if (this.startTime <= currentTime && this.endTime >= currentTime) {
						// Fire enter event if we were not active and now are
						if (!this.wasActive) {
							this.wasActive = true;
							this.onenter();
						}

						return true;
					}
				} catch(Error) {
					return false;
				}
			}
		}
		
		// Fire exit event if we were active and now are not
		if (this.wasActive) {
			this.wasActive = false;
			this.onexit();
		}

		return false;
	};

	if (Object.prototype.__defineGetter__) {
		this.__defineGetter__("active", this.isActive);
	} else if (Object.defineProperty) {
		Object.defineProperty(this,"active",
			{get: this.isActive}
		);
	}
	
	this.toString = function toString() {
		return "TextTrackCue:" + this.id + "\n" + String(this.text);
	};
	
	// Events defined by spec
	this.onenter = function() {};
	this.onexit = function() {};
};