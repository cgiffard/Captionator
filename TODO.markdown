TODO
----

* Fix language parsing
* Where UA language doesn't match first, use the language of the document
* **DONE!** <s>Allow dynamic re-enabling and disabling of subtitles (possibly through the Multitrack API - below)</s>
* Test with proper WebVTT files & confirm support for them
* Add (option to prepend) timestamps to generated transcript
* **50%** Formalise and document options argument
* Ensure non-breakingness in old browsers (i.e. won't work - but won't cause script errors either)
* Investigate (safari) webkit embedded subtitles API and determine whether to switch off embedded subtitles if Captionator present, or to use the embedded subtitles instead
* **DONE!** <s>The W3C or the WHATWG haven't really been clear on the `track` element's `kind` property. Determine an appropriate behaviour for it.</s>
* **DONE!** <s>Test with more than one video on a page (it should already work - ...or does it?)</s>
* Positional collision detection for subtitles, preventing overlaps. How this should be implemented is a bit of a debate.

**Big Stuff**

* Include compatibility with the in-development JS Multitrack API described by [this W3C Document](http://www.w3.org/WAI/PF/HTML/wiki/Media_MultitrackAPI).
* Implement animation options
* Support audio and video tracks too (!!!)

**Bugs**

* **FIXED** Something's up in firefox: [Firefox error 'setting a property that only has a getter' when calling Array.prototype.slice](http://stackoverflow.com/questions/5087755/firefox-error-setting-a-property-that-only-has-a-getter-when-calling-array-prot)
* **FIXED** Script inefficiently reapplies subtitle data with every event call (not by design)