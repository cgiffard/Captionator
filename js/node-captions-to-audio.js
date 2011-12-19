#!/usr/bin/env node

// Run this file with node.js. (You'll need Mac OS X for speech synthesis, and sox for audio processing.)
// It is designed to generate a synchronised text track base on your subtitles / text cues in SRT format.
// I'm committing this to the repository for completeness. Be warned though, it's barely tested and pretty hacky.
// You could probably switch `say` out for `espeech` on linux.

// Get sox with homebrew.
// Do: brew install sox

// usage: node node-captions-to-audio.js yourcaptionfile.srt
// OR:
// ./node-captions-to-audio.js yourcaptionfile.srt
//
// It'll put files in the current working directory (sorry!)

var sys				= require('sys'),
	exec			= require('child_process').exec,
	exit			= process.exit,
	fs				= require("fs")
	parseCaptions	= require("../source/captionator.general.parser.js").parseCaptions;
	

// Load captions
var fileToLoad = process.argv[2];
var captionData, captions;
var fileName = __filename.split(/[\/\\]/g).pop();
var totalCues = 0;
var cuesSaid = 0;
var outFile = "";

if (!fileToLoad) {
	console.error("You must provide an SRT file to load.");
	console.log("Usage: $>node " + fileName + " mysubs.srt");
	exit(1);
} else {
	outFile = fileToLoad.split(".srt").shift().split(/[\/\\]/g).pop() + ".wav";
}

try {
	console.log("Outputting spoken text to ",outFile + ".");
	console.log("Speaking cues...");
	if (captionData = fs.readFileSync(fileToLoad)) {
		captionData = captionData.toString("utf8");
		captions = parseCaptions(captionData);
		totalCues = captions.length;
		captions.forEach(function(caption,index) {
			var safeText = caption.text.toString().replace(/'/ig,"").replace(/\!/ig,".").replace(/<[^>]+>/ig,"");
			
			var captionID = caption.id;
			if (captionID < 10) {
				captionID = "00" + captionID;
			} else if (captionID < 100) {
				captionID = "0" + captionID;
			}
			
			var sayCommand = "say -o 'audio-cue-" + captionID + " " + caption.startTime + "-" + caption.endTime + ".aiff' ' " + safeText + "'";
			//console.log(sayCommand);
			exec(sayCommand,function(error, stdout, stderr) {
				if (error) {
					console.error("Failed to say cue! (The ID was: " + caption.id + ")");
					cuesSaid ++;
				} else {
					console.log("Said cue successfully. " + Math.floor((cuesSaid / totalCues)*100) + "%");
					captions[index].audioFile = "audio-cue-" + captionID + " " + caption.startTime + "-" + caption.endTime + ".aiff";
					
					// We've said the cue - find the length
					var cueReadingLength = 0;
					exec("soxi -D '" + captions[index].audioFile + "'",function(error, stdout, stderr) {
						if (!error) {
							cueReadingLength = parseFloat(stdout);
						}
						
						captions[index].cueReadingLength = cueReadingLength;
						
						cuesSaid ++;
						if (cuesSaid === totalCues) {
							console.log("Finished. Stitching file...");
							cuesSaid ++;
							stitchAudio(captions);
						}
					});
				}
				
				if (cuesSaid === totalCues) {
					console.log("Finished. Stitching file...");
					cuesSaid ++;
					stitchAudio(captions);
				}
			});
		})
	}
} catch (Error) {
	console.error("The file you provided could not be located, or failed to load.");
	exit(2);
}

function stitchAudio(captions) {
	var soxCommand = "sox -m ";
	var captionIndex, cueDuration;
	
	for (captionIndex = 0; captionIndex < captions.length; captionIndex ++) {
		if (captions[captionIndex]) {
			cueDuration = (captions[captionIndex].startTime - captions[captionIndex].endTime) - 0.35; // Allow quarter of a second's breathing room
			
			// Defaults
			var speedAjustment = 1;
			var pitchAjustment = 0;
			var cueReadingLength = captions[captionIndex].cueReadingLength || 0;
			
			if (cueReadingLength > cueDuration) {
				speedAjustment = Math.floor((cueReadingLength / cueDuration)*100)/100;
				pitchAjustment = Math.round(Math.log(1000/(1000*speedAjustment))/Math.log(Math.pow(2,1/1200)));
			}
			
			if (pitchAjustment < 0) {
				pitchAjustment = " pitch " + pitchAjustment;
			} else {
				pitchAjustment = "";
			}
			
			if (speedAjustment > 1) {
				speedAjustment = " speed " + speedAjustment;
			} else {
				speedAjustment = "";
			}
			
			soxCommand += '"|sox \'' + captions[captionIndex].audioFile +
						'\' -p ' + speedAjustment + pitchAjustment + ' pad ' + captions[captionIndex].startTime + '" ';
		}
	}
	
	soxCommand += " " + outFile + " gain 30";
	// console.log(soxCommand);
	exec(soxCommand,function(error, stdout, stderr) {
		if (error) {
			console.error("Whoops - an error occurred: ",stderr);
		} else {
			console.log("Cleaning up...");
			var cuesCleaned = 0;
			captions.forEach(function(caption,index) {
				fs.unlink(captions[index].audioFile,function(error) {
					cuesCleaned ++; // Just ignore failures for now
					
					if (cuesCleaned == captions.length) {
						console.log("Done! Enjoy the reading.");
						exit(0);
					}
				});
			});
		}
	});
}