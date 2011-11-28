/**
 * @constructor
 */
captionator.TextTrackCueList = function TextTrackCueList(track) {
	this.track = track instanceof captionator.TextTrack ? track : null;

	this.getCueById = function(cueID) {
		return this.filter(function(currentCue) {
			return currentCue.id === cueID;
		})[0];
	};

	this.loadCues = function(cueData) {
		for (var cueIndex = 0; cueIndex < cueData.length; cueIndex ++) {
			cueData[cueIndex].track = this.track;
			Array.prototype.push.call(this,cueData[cueIndex]);
		}
	};

	this.addCue = function(cue) {
		if (cue && cue instanceof captionator.TextTrackCue) {
			if (cue.track === this.track || !cue.track) {
				// TODO: Check whether cue is already in list of cues.
				// TODO: Sort cue list based on TextTrackCue.startTime.
				Array.prototype.push.call(this,cue);
			} else {
				throw new Error("This cue is associated with a different track!");
			}
		} else {
			throw new Error("The argument is null or not an instance of TextTrackCue.");
		}
	};

	this.toString = function() {
		return "[TextTrackCueList]";
	};
};
captionator.TextTrackCueList.prototype = [];

/**
 * @constructor
 */
captionator.ActiveTextTrackCueList = function ActiveTextTrackCueList(textTrackCueList,textTrack) {
	// Among active cues:

	// The text track cues of a media element's text tracks are ordered relative to each
	// other in the text track cue order, which is determined as follows: first group the
	// cues by their text track, with the groups being sorted in the same order as their
	// text tracks appear in the media element's list of text tracks; then, within each
	// group, cues must be sorted by their start time, earliest first; then, any cues with
	// the same start time must be sorted by their end time, earliest first; and finally,
	// any cues with identical end times must be sorted in the order they were created (so
	// e.g. for cues from a WebVTT file, that would be the order in which the cues were
	// listed in the file).

	this.refreshCues = function() {
		if (textTrackCueList.length) {
			var cueList = this;
			var cueListChanged = false;
			var oldCueList = [].slice.call(this,0);
			this.length = 0;
			
			textTrackCueList.forEach(function(cue) {
				if (cue.active) {
					cueList.push(cue);

					if (cueList[cueList.length-1] !== oldCueList[cueList.length-1]) {
						cueListChanged = true;
					}
				}
			});

			if (cueListChanged) {
				try {
					textTrack.oncuechange();
				} catch(error){}
			}
		}
	};

	this.toString = function() {
		return "[ActiveTextTrackCueList]";
	};

	this.refreshCues();
};
captionator.ActiveTextTrackCueList.prototype = new captionator.TextTrackCueList(null);