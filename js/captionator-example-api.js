// This file shows how the TextTrack API can be used (with captionator) to generate an interface for video captions.

var generateTranscript = function() {
	
};

var generateMediaControls = function(videoElement) {
	if (!(videoElement instanceof HTMLVideoElement) || !videoElement.tracks) return null;
	
	var tableFragment = document.createDocumentFragment();
	// Set up table structure
	var table = document.createElement("table");
	var thead = document.createElement("thead");
	var tbody = document.createElement("tbody");
	
	thead.innerHTML =	"<tr>" +
						"	<th>Kind</th>" +
						"	<th>Label</th>" +
						"	<th>Language (<code>srclang/language</code>)</th>" +
						"	<th>Ready State (<code>readyState</code>)</th>" +
						"	<th>Visibility Mode (<code>mode</code>)</th>" +
						"	<th>Enabled</th>" +
						"</tr>";
	
	// Our functions that do most of the work
	
	var createRowHeader = function(headerText) {
		var tmpRowHeader = document.createElement("tr");
		tmpRowHeader.innerHTML = "<th colspan='6'>" + headerText + "</th>";
		tbody.appendChild(tmpRowHeader);
	};
	
	var createRowsForTrackList = function(trackList) {
		if (!trackList) return null;
		
		if (trackList.length) {
			for (trackIndex in trackList) {
				if (trackList.hasOwnProperty(trackIndex)) {
					(function() {
						var readyStateTD, modeTD, toggleTD, trackToggle;
						var currentTrack = trackList[trackIndex];
						var trackRow = document.createElement("tr");
						
						trackRow.innerHTML ="<td>" + currentTrack.kind + "</td>" +
											"<td>" + currentTrack.label + "</td>" +
											"<td>" + currentTrack.language + "</td>" +
											"<td>" + ["Not Loaded","Loading","Loaded","Error"][currentTrack.readyState] + "</td>" +
											"<td>" + ["Not Showing","Hidden","Showing"][currentTrack.mode] + "</td>" +
											"<td></td>";
						
						readyStateTD = trackRow.childNodes[trackRow.childNodes.length-3];
						modeTD = trackRow.childNodes[trackRow.childNodes.length-2];
						toggleTD = trackRow.childNodes[trackRow.childNodes.length-1];
						trackToggle = document.createElement("input");
						trackToggle.type = "checkbox";
						trackToggle.title = "Toggle track visibility";
						
						if (currentTrack.mode === 2) {
							trackToggle.checked = true;
						}
						
						toggleTD.appendChild(trackToggle);
						
						trackToggle.addEventListener("change",function(eventData) {
							currentTrack.mode = [0,2][Number(this.checked)];
							modeTD.innerHTML = ["Not Showing","Hidden","Showing"][currentTrack.mode];
						},false);
						
						currentTrack.onload = function(eventData) {
							readyStateTD.innerHTML = ["Not Loaded","Loading","Loaded","Error"][this.readyState];
							modeTD.innerHTML = ["Not Showing","Hidden","Showing"][currentTrack.mode];
						};
						currentTrack.onerror = currentTrack.onload;
					
						tbody.appendChild(trackRow);
					})();
				}
			}
		}
	};
	
	// Now make them go!
	
	createRowHeader("Text Tracks");
	createRowsForTrackList(videoElement.tracks);
	createRowHeader("Media Tracks");
	createRowsForTrackList(videoElement.mediaTracks);
	
	table.appendChild(thead);
	table.appendChild(tbody);
	tableFragment.appendChild(table);
	table.border = 1;
	table.cellPadding = 4;
	
	return tableFragment;
};