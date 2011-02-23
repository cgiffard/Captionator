TODO
----

* Add support for `aria-describedby`
* Test with proper WebVTT files & confirm support for them
* Add timestamps to generated transcript
* Formalise and document options argument
* Ensure non-breakingness in old browsers (i.e. won't work - but won't cause script errors either)
* Investigate (safari) webkit embedded subtitles API and determine whether to switch off embedded subtitles if Captionator present, or to use the embedded subtitles instead
* The W3C or the WHATWG haven't really been clear on the `track` element's `kind` property. Determine an appropriate behaviour for it.


**Big Stuff**

* Include compatibility with the in-development JS Multitrack API described by [http://www.w3.org/WAI/PF/HTML/wiki/Media_MultitrackAPI][this W3C Document].
* Implement animation options