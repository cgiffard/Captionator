Captionator
===========

**Simple closed-captioning polyfill for HTML5**

This basic polyfill aims to add support for the HTML5 video `<track>` element.

It currently includes rudimentary support for multiple language subtitle tracks,
auto-selected based on the user-agent language.

It is designed to be js-library independent (but I might port it to jQuery later,
as the raw DOM is chunky indeed.) It currently works in browsers which offer support
for HTML5 video, and relies on some JavaScript features you won't find in older
browsers. (I thought this was perfectly reasonable!)
  
After including the library, adding captions to your video is pretty simple:

	<script type="text/javascript" src="js/captions.js"></script>
	<script type="text/javascript">
		window.addEventListener("load",function(eventData) {
			captionator.captionify();
		});
	</script>

It's also easy to generate a transcript once a video has been captioned if required:

	captionator.generateTranscript("#yourVideoElement","#divForTranscript");

If you've got specific requirements about which videos get captioned, and in what
language(s), there are some extra options:

	captionator.captionify(videoElementsToCaption,defaultLanguage,options);

The first parameter can be an array of selectors or DOMElements, or a single selector
string or DOMElement. The second parameter is a language string.

You can use the options parameter to specify a container in which you want Captionator to insert your captions:

	captionator.captionify(["#yourVideoElement1","#yourVideoElement2"],"de",{ container: "#captionContainer" });

The container itself won't be touched, but its contents will be destroyed and recreated
as the user seeks through the video file.

Multiple subtitles and containers
---------------------------------

**Specifying containers**

It's pretty straightforward to manage multiple enabled subtitle tracks. Take this set of track elements
for example:

	<track kind="captions" src="subs/english-subs.srt" srclang="en" label="English Subtitles" enabled="true" />
	<track kind="captions" src="subs/german-subs.srt" srclang="de" label="German Subtitles" enabled="true" />
	<track kind="captions" src="subs/japanese-subs.srt" srclang="ja" label="Japanese Subtitles" />
	<track kind="lyrics" src="subs/japanese-lyrics.srt" srclang="ja" label="Lyrics" enabled="true" />
	
In this case, three sets of subtitles are enabled by default. Unless you specify a specific container for each one,
Captionator will automatically generate as many separate containers as are required for enabled tracks.

Should you wish to specify your own containers for a number of (or every) subtitle track, you can use the following syntax
when calling `captionator.captionify`:

	captionator.captionify(null,null,{
		"container": [
			"#englishSubtitles",
			null,
			null,
			"#japaneseLyrics"
		]
	});

Each element in the array matches to the track element with the same index (i.e. the 0th element matches to the first track,
the 3rd element matches the fourth track etc.)

Null or empty elements trigger automatically generated containers - so in the example above, the German and Japanese subtitle
tracks (when enabled) would have automatically generated containers.

### Enabling and disabling subtitle tracks programatically ###

You can find a demonstration of this feature in the example file.

** Getting Tracks **

Captionator simply makes a new property (array) available through javascript on the HTMLVideoElement:

	var myVideo = document.getElementsById("myVideo");
	var myTracks = myVideo.tracks;
	
By extension, getting access to the track you want is as simple as:

	var firstSubtitleTrack = myVideo.tracks[0];
	
Each track defines the following user accessible properties:

* `label` - String - describes the track (in plain human language)
* `name` - same as above (for W3 spec compatibility)
* `src` - URI for the resource
* `type` - MIME Content type for the resource (e.g. text/srt)
* `language` - BCP47 language string which describes the track
* `kind` - Resource type (e.g. `subtitle`, `caption`, `lyrics`, `karaoke`, `alternate`, `chapters`, etc. See full list [here](http://www.w3.org/WAI/PF/HTML/wiki/Media_Multiple_Text_Tracks_API#Available_Roles))
* `role` - as above - maintained for W3 spec compatibility
* `enabled` - the most important property (probably!) - determines whether captionator will fetch and render the resource.
* `videoElement` - the HTMLVideoElement which the track relates to/extends

Ergo, to access the property `language` from the third track, you'd use the following code:

	var thirdTrackLanguage = myVideo.tracks[2].language;
	
To enable or disable a track:

	myVideo.tracks[2].enabled = true;
	myVideo.tracks[2].enabled = false;

The track is then enabled/disabled when the video throws a `timeupdate` event. You can update it immediately like so:

	captionator.rebuildCaptions(myVideo);

(Where `myVideo` is an instance of a captioned HTMLVideoElement)

For a more advanced example, see the subtitle selector in the example file.

New Features
---------------

* Support for `aria-describedby`
* Implements the W3 draft Multitrack Media API proposal: http://www.w3.org/WAI/PF/HTML/wiki/Media_MultitrackAPI
* Through the spec, supports dynamic subtitle toggling (as demonstrated in the example file)
* Supports multiple (simultaneously playing) video files on a page, each with an unlimited number of tracks
* Adaptively scales default subtitle UI to fit video