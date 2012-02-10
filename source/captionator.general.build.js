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
		
		// Clear old nodes from canvas
		var oldNodes =
			[].slice.call(videoElement._descriptionContainerObject.getElementsByTagName("div"),0)
			.concat([].slice.call(videoElement._containerObject.getElementsByTagName("div"),0));
		
		oldNodes.forEach(function(node) {
			// If the cue doesn't think it's active...
			if (node.cueObject && !node.cueObject.active) {
				
				// Mark cue as not rendered
				node.cueObject.rendered = false;
				
				// Delete node reference
				node.cueObject.domNode = null;
				
				// Delete node
				node.parentElement.removeChild(node);
			}
		});
	
		// Now we render the cues
		compositeActiveCues.forEach(function(cue) {
			var cueNode, cueInner;
			
			if (!cue.rendered && cue.track.kind !== "metadata") {
				// Create, ID, and Class all the bits
				cueNode = document.createElement("div");
				cueInner = document.createElement("span");
				cueInner.className = "captionator-cue-inner";
				cueNode.id = String(cue.id).length ? cue.id : captionator.generateID();
				cueNode.className = "captionator-cue";
				cueNode.appendChild(cueInner);
				cueNode.cueObject = cue;
				cue.domNode = cueNode;
				
				// Set the language
				// Will eventually move to a cue-granular method of specifying language
				cueNode.setAttribute("lang",cue.track.language);
				
				// Plonk the cue contents in
				cueNode.currentText = cue.text.toString(currentTime);
				cueInner.innerHTML = cueNode.currentText;
				
				// Mark cue as rendered
				cue.rendered = true;
			
				if (cue.track.kind === "descriptions") {
					// Append descriptions to the hidden descriptive canvas instead
					// No styling required for these.
					videoElement._descriptionContainerObject.appendChild(cueNode);
				} else {
					// Append everything else to the main cue canvas.
					videoElement._containerObject.appendChild(cueNode);
				}
				
			} else {
				// If the cue is already rendered, get the node out
				cueNode = cue.domNode;
				cueInner = cueNode.getElementsByClassName("captionator-cue-inner")[0];
				
				// But first check it to determine whether its own content has changed
				if (cue.text.toString(currentTime) !== cueNode.currentText) {
					cueNode.currentText = cue.text.toString(currentTime); 
					cueInner.innerHTML = cueNode.currentText;
					
					// Reset spanning pointer to maintain our layout
					cueInner.spanified = false;
				}
			}
			
			if (cue.track.kind !== "descriptions" && cue.track.kind !== "metadata") {
				// Re-style cue...
				captionator.styleCue(cueNode,cue,videoElement);
			}
		});
	}
};