Captionator
===========

**Simple closed-captioning polyfill for HTML5**

This basic polyfill aims to add support for the HTML5 video `<track>` element.

It currently includes rudimentary support for multiple language subtitle tracks,
auto-selected based on the user-agent language and implements the draft WHATWG
track API.

It is designed to be js-library independent (but I might port it to jQuery later,
as the raw DOM is chunky indeed.) It currently works in browsers which offer support
for HTML5 video, and relies on some JavaScript (ECMAScript 5) features you won't
find in older browsers (but they don't support HTML5 video anyway.)
  
After including the library, adding captions to your video is pretty simple:

	<script type="text/javascript" src="js/captions.js"></script>
	<script type="text/javascript">
		window.addEventListener("load",function(eventData) {
			captionator.captionify();
		});
	</script>

This will not only caption your video (this example will caption every element on 
the page with Timed Text Tracks available to it,) but it will also provide a `.tracks`
property on your video element(s) - which you can use to dynamically manipulate the track
data as per the WHATWG specification.

It's also easy to generate a transcript once a video has been captioned if required:

	captionator.generateTranscript("#yourVideoElement","#divForTranscript");

If you've got specific requirements about which videos get captioned, and in what
language(s), there are some extra options:

	captionator.captionify(videoElementsToCaption,defaultLanguage,options);

The first parameter can be an array of selectors or DOMElements, or a single selector
string or DOMElement. The second parameter is a language string.

You can use the options parameter to specify your own render function for captions, if you
don't like captionator's inbuilt renderer:

	captionator.captionify(["#yourVideoElement1","#yourVideoElement2"],"de",{ renderer: myFunction });
	
(More on this below!)

Multiple subtitles and containers
---------------------------------

**Specifying containers**

It's pretty straightforward to manage multiple enabled subtitle tracks. Take this set of track elements
for example:

	<track kind="captions" src="subs/english-subs.srt" srclang="en" label="English Subtitles" default />
	<track kind="captions" src="subs/german-subs.srt" srclang="de" label="German Subtitles" />
	<track kind="captions" src="subs/japanese-subs.srt" srclang="ja" label="Japanese Subtitles" />

In this case, the English subtitles are enabled by default. Unless you specify a custom renderer,
Captionator will automatically generate as many separate containers as are required for enabled tracks.

Should you wish to specify your own renderer, you can use the following syntax when calling `captionator.captionify`:

	captionator.captionify(null,null,{
		"renderer": function(yourHTMLVideoElement) {
			...
		}
	});

Each element in the array matches to the track element with the same index (i.e. the 0th element matches to the first track,
the 3rd element matches the fourth track etc.)

Null or empty elements trigger automatically generated containers - so in the example above, the German and Japanese subtitle
tracks (when enabled) would have automatically generated containers.

### Enabling and disabling subtitle tracks programatically ###

**IMPORTANT: SUBJECT TO CHANGE - switching from W3 spec to [WHATWG spec](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#timed-text-tracks)**

You can find a demonstration of this feature in the example file.

**Getting Tracks**

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

The track is then enabled/disabled when the video fires a `timeupdate` event. You can update it immediately like so:

	captionator.rebuildCaptions(myVideo);

(Where `myVideo` is an instance of a captioned HTMLVideoElement)

For a more advanced example, see the subtitle selector in the example file.

### Options ###

The following lists options which you can pass to captionator:

* `enableCaptionsByDefault` (Boolean) - determines whether to show captions by default, if a caption language matches the user's UA language or is selected for display according to the rules outlined in the [WHATWG specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html). Tracks with the `enabled` attribute set to `true` will be displayed regardless of this option.
* `exportObjects` (Boolean) - instructs Captionator to export its own implementation of the TimedTextTrack objects (TextTrack, TextTrackCue, etc.) into the global scope. Captionator ordinarily keeps these within its own object. You might find this useful for creating code which utilises `instanceof` conditionals, or creates instances of these objects itself, which you want to be native-TextTrack-support-agnostic. (Phew, what a mouthful.)

**Temporarily Disabled**

The following items are temporarily disabled while the WHATWG spec is implemented (as opposed to the W3 spec previously used)

* `container`(Array | String | DOMObject) - defines either a single element or a list of elements which captionator will append the captions to instead of automatically generating its own elements.


New Features
---------------

* Support for `aria-describedby`, `aria-live`, and `aria-atomic`
* <s>Implements the W3 draft Multitrack Media API proposal: http://www.w3.org/WAI/PF/HTML/wiki/Media_MultitrackAPI</s>
* Now implements the WHATWG draft [Timed Text Track specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html), which is far more up to date and better documented.
* Through the spec, supports dynamic subtitle toggling (as demonstrated in the example file)
* Supports multiple (simultaneously playing) video files on a page, each with an unlimited number of tracks
* Adaptively scales default subtitle UI to fit video