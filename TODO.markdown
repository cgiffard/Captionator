TODO
----

* Fix Japanese, Korean, Chinese text line breaking in vertical captions
* Fix BCP-47 language string parsing
* Enable WebVTT inline style support (already parsed, but ignored by renderer)
* **50% - `addCue` complete** Implement <strike>`addCue`</strike> and `removeCue` events _properly_ for TextTrack objects
* **DONE!** <strike>API Reference Docs</strike>
* **DONE!** <strike>Allow dynamic re-enabling and disabling of subtitles (possibly through the Multitrack API - below)</strike>
* **DONE!** <strike>Test with proper WebVTT files & confirm support for them</strike>
* **DONE!** <strike>Formalise and document options argument</strike>
* **DONE!** <strike>Ensure non-breakingness in old browsers (i.e. won't work - but won't cause script errors either)</strike>
* **DONE!** <strike>The W3C or the WHATWG haven't really been clear on the `track` element's `kind` property. Determine an appropriate behaviour for it.</strike>
* **DONE!** <strike>Test with more than one video on a page (it should already work - ...or does it?)</strike>
* **DONE!** Positional collision detection for subtitles, preventing overlaps. How this should be implemented is a bit of a debate.
* **DONE!** <strike>Enable use of external renderer</strike>
* **DONE!** <strike>Fix `oncuechange` event firing</strike>

## Big Stuff ##

* Include QUnit test framework & tests file
* Externalise & modularise parser, enabling import of alternate parsers into captionator core
	* Write a parser for TTML
	* **50%** Write a parser for LRC
* Implement animation options
* **DONE!** <strike>WebVTT Support! (Just compatibility checking to do now!)</strike>
* **DONE!** <strike>Include compatibility with the in-development JS TimedTextTrack API described by [this WHATWG Document](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html).</strike>
* **DONE!** Respect extra cue settings as described by WebVTT (currently Captionator reads in, but ignores, most of the cue settings.)

## Bugs ##

* **FIXED** <strike>Something's up in firefox: [Firefox error 'setting a property that only has a getter' when calling Array.prototype.slice](http://stackoverflow.com/questions/5087755/firefox-error-setting-a-property-that-only-has-a-getter-when-calling-array-prot)</strike>
* **FIXED** <strike>Script inefficiently reapplies subtitle data with every event call (not by design)</strike>
* **FIXED** <strike>A bug where captions (which had not yet been downloaded and parsed) were not being rebuilt when the video was paused</strike>
* **FIXED** <strike>(Google chrome) fails to apply subtitles properly starting in v.10, despite the changes being reflected in the DOM</strike>