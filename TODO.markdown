TODO
----

* API Reference Docs
* Fix language parsing
* **DONE!** <strike>Allow dynamic re-enabling and disabling of subtitles (possibly through the Multitrack API - below)</strike>
* **DONE!** <strike>Test with proper WebVTT files & confirm support for them</strike>
* Add (option to prepend) timestamps to generated transcript
* **DONE!** Formalise and document options argument
* **DONE!** <strike>Ensure non-breakingness in old browsers (i.e. won't work - but won't cause script errors either)</strike>
* Investigate (safari) webkit embedded subtitles API and determine whether to switch off embedded subtitles if Captionator present, or to use the embedded subtitles instead
* **DONE!** <strike>The W3C or the WHATWG haven't really been clear on the `track` element's `kind` property. Determine an appropriate behaviour for it.</strike>
* **DONE!** <strike>Test with more than one video on a page (it should already work - ...or does it?)</strike>
* Positional collision detection for subtitles, preventing overlaps. How this should be implemented is a bit of a debate.
* **DONE!** <strike>Enable use of external renderer</strike>
* Fix `oncuechange` event firing
* Implement `addCue` and `removeCue` events _properly_ for TextTrack objects

## Big Stuff ##

* **80%** Include compatibility with the in-development JS TimedTextTrack API described by [this WHATWG Document](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html).
* Respect extra cue settings as described by WebVTT (currently Captionator reads in, but ignores, most of the cue settings.)
* Implement animation options
* Support audio and video tracks too (!!!) _(Underway)_
* Include QUnit test framework & tests file
* Externalise & modularise parser, possibly move WebSRT parser to a different file (this won't affect the published API at all)
* Write a parser for TTML

## Bugs ##

* **FIXED** Something's up in firefox: [Firefox error 'setting a property that only has a getter' when calling Array.prototype.slice](http://stackoverflow.com/questions/5087755/firefox-error-setting-a-property-that-only-has-a-getter-when-calling-array-prot)
* **FIXED** Script inefficiently reapplies subtitle data with every event call (not by design)
* **FIXED** A bug where captions (which had not yet been downloaded and parsed) were not being rebuilt when the video was paused