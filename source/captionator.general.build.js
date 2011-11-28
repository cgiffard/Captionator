/*
	captionator.rebuildCaptions(HTMLVideoElement videoElement)

	Loops through all the TextTracks for a given element and manages their display (including generation of container elements.)

	First parameter: HTMLVideoElement object with associated TextTracks

	RETURNS:

	Nothing.

*/
captionator.rebuildCaptions = function(videoElement) {
	var trackList = videoElement.textTracks || [];
	var options = videoElement._captionatorOptions instanceof Object ? videoElement._captionatorOptions : {};
	var currentTime = videoElement.currentTime;
	var compositeActiveCues = [];
	var cuesChanged = false;
	var activeCueIDs = [];
	var cueSortArray = [];

	// Work out what cues are showing...
	trackList.forEach(function(track,trackIndex) {
		if (track.mode === captionator.TextTrack.SHOWING && track.readyState === captionator.TextTrack.LOADED) {
			cueSortArray = [].slice.call(track.activeCues,0);
			
			// Do a reverse sort
			// Since the available cue render area is a square which decreases in size
			// (away from each side of the video) with each successive cue added,
			// and we want cues which are older to be displayed above cues which are newer,
			// we sort active cues within each track so that older ones are rendered first.
			
			cueSortArray = cueSortArray.sort(function(cueA, cueB) {
				if (cueA.startTime > cueB.startTime) {
					return -1;
				} else {
					return 1;
				}
			});
			
			compositeActiveCues = compositeActiveCues.concat(cueSortArray);
		}
	});

	// Determine whether cues have changed - we generate an ID based on track ID, cue ID, and text length
	activeCueIDs = compositeActiveCues.map(function(cue) {return cue.track.id + "." + cue.id + ":" + cue.text.toString(currentTime).length;});
	cuesChanged = !captionator.compareArray(activeCueIDs,videoElement._captionator_previousActiveCues);

	// If they've changed, we re-render our cue canvas.
	if (cuesChanged || videoElement._captionator_dirtyBit) {
		// If dirty bit was set, it certainly isn't now.
		videoElement._captionator_dirtyBit = false;

		// Destroy internal tracking variable (which is used for caption rendering)
		videoElement._captionator_availableCueArea = null;
		
		// Internal tracking variable to determine whether our composite active cue list for the video has changed
		videoElement._captionator_previousActiveCues = activeCueIDs;
		
		// Get the canvas ready if it isn't already
		captionator.styleCueCanvas(videoElement);
		videoElement._containerObject.innerHTML = "";
	
		// Now we render the cues
		compositeActiveCues.forEach(function(cue) {
			var cueNode = document.createElement("div");
			var cueInner = document.createElement("span");
			cueInner.className = "captionator-cue-inner";
			cueNode.id = String(cue.id).length ? cue.id : captionator.generateID();
			cueNode.className = "captionator-cue";
			cueNode.appendChild(cueInner);
			cueInner.innerHTML = cue.text.toString(currentTime);
			videoElement._containerObject.appendChild(cueNode);
			captionator.styleCue(cueNode,cue,videoElement);
		});
	}
};