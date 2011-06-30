Captionator
===========

**Simple closed-captioning polyfill for HTML5. Just 5KB when gzipped!**

**Implements WHATWG TimedTextTrack Specification! Works in Firefox 3.5+, IE9, Safari 4+, Chrome, Opera 11... basically any browser which supports HTML5 Video!**

This basic polyfill aims to add support for the HTML5 video `<track>` element.

It currently includes rudimentary support for multiple language subtitle tracks,
auto-selected based on the user-agent language and implements the draft WHATWG
track API.

It is designed to be js-library independent (but I might port it to jQuery later,
as the raw DOM is chunky indeed.) It currently works in browsers which offer support
for HTML5 video, and relies on some JavaScript (ECMAScript 5) features you won't
find in older browsers (but they don't support HTML5 video anyway.)
  
After including the library, adding captions to your video is pretty simple:

	<script type="text/javascript" src="js/captionator-min.js"></script>
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
	
	var track = document.getElementById("myVideo").tracks[0];
	track.generateTranscript("#divForTranscript"); // Doesn't *have* to be a div, of course!

If you've got specific requirements about which videos get captioned, and in what
language(s), there are some extra options:

	captionator.captionify(videoElementsToCaption,defaultLanguage,options);

The first parameter can be an array of selectors or DOMElements, or a single selector
string or DOMElement. The second parameter is a language string.

You can use the options parameter to specify your own render function for captions, if you
don't like captionator's inbuilt renderer:

	captionator.captionify(["#yourVideoElement1","#yourVideoElement2"],"de",{ renderer: myFunction });
	
(More on this below!)

Multiple subtitles and custom render functions
---------------------------------

**Specifying a custom renderer**

It's pretty straightforward to manage multiple enabled subtitle tracks. Take this set of track elements
for example:

	<track kind="captions" src="subs/english-subs.srt" srclang="en" label="English Subtitles" default />
	<track kind="captions" src="subs/german-subs.srt" srclang="de" label="German Subtitles" />
	<track kind="captions" src="subs/japanese-subs.srt" srclang="ja" label="Japanese Subtitles" />

In this case, the English subtitles are enabled by default. Unless you specify a custom renderer,
Captionator will automatically generate as many separate containers as are required for enabled tracks, set up
the relevant events and styles.

Should you wish to specify your own renderer, you can use the following syntax when calling `captionator.captionify`:

	captionator.captionify(null,null,{
		"renderer": function(yourHTMLVideoElement) {
			...
		}
	});

The renderer function you define is executed, and passed the HTMLVideoElement whenever it fires a
`timeupdate` event. You can use the `TextTrack.activeCues` to determine what cues should be displayed at any given time.

The event data for the video timeupdate event is *not* passed to your function. This is because you are defining
a renderer, not an event handler. Should future Captionator updates require caption re-rendering on different events
(or in places not triggered by events at all) code which depends on event information will not function correctly.

### Enabling and disabling subtitle tracks programatically: A Quick Guide ###

You can find a demonstration of this feature in the example file.

**Getting Tracks**

Captionator simply makes a new property (array) available through javascript on the HTMLVideoElement:

	var myVideo = document.getElementById("myVideo");
	var myTracks = myVideo.tracks;
	
By extension, getting access to the track you want is as simple as:

	var firstSubtitleTrack = myVideo.tracks[0];
	
Each track defines the following user accessible properties:

* `label` - String - describes the track (in plain human language)
* `language` - BCP47 language string which describes the track
* `kind` - Resource type (one of `subtitles`, `captions`, `chapters`, `descriptions`, `metadata`.)
* `readyState` - indicates whether the resource is loaded (one of NONE/0, LOADING/1, LOADED/2, or ERROR/3)
* `mode` - the most important property (probably!) - determines whether captionator will fetch and render the resource.
* `videoNode` - the HTMLVideoElement which the track relates to/extends. (Not in the WHATWG spec.)

Ergo, to access the property `language` from the third track, you'd use the following code:

	var thirdTrackLanguage = myVideo.tracks[2].language;
	
To enable or disable a track:

	myVideo.tracks[2].mode = captionator.TextTrack.SHOWING;
	myVideo.tracks[2].mode = captionator.TextTrack.HIDDEN;
	myVideo.tracks[2].mode = captionator.TextTrack.OFF;

The track is then enabled/disabled when the video fires a `timeupdate` event, or when a track mode changes.
You can update it immediately like so:

	captionator.rebuildCaptions(myVideo);

(Where `myVideo` is an instance of a captioned HTMLVideoElement)

For a more advanced example, see the subtitle selector in the example file.

### Options ###

The following lists options which you can pass to captionator:

* `enableCaptionsByDefault` (Boolean) - determines whether to show captions by default, if a caption language matches the user's UA language or is selected for display according to the rules outlined in the [WHATWG specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html). Tracks with the `enabled` attribute set to `true` will be displayed regardless of this option.
* `enableDescriptionsByDefault` (Boolean) - as above, except for `description` track types instead of `caption` or `subtitle` types.
* `exportObjects` (Boolean) - instructs Captionator to export its own implementation of the TimedTextTrack objects (TextTrack, TextTrackCue, etc.) and their relevant constants into the global scope. Captionator ordinarily keeps these within its own object. You might find this useful for creating code which utilises `instanceof` conditionals, or creates instances of these objects itself, which you want to be native-TextTrack-support-agnostic. (Phew, what a mouthful.)
* `renderer` (Function) - sets an alternative renderer for captions & subtitles. You can utilise the WHATWG TimedTextTrack specification to manipulate or get information about the tracks themselves.

Video and Audio tracks (MediaTrack)
-----------------------------------

Captionator has experimental support for HTML5 video and Audio tracks (designed both for assistive purposes, and for enriching existing media.)

This is a documentation category in and of itself, so I've moved it to [MediaTrack.markdown](https://github.com/cgiffard/Captionator/blob/master/MediaTrack.markdown).


New Features
---------------

* Support for `aria-describedby`, `aria-live`, and `aria-atomic`
* Now implements the WHATWG draft [Timed Text Track specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html), which is far more up to date and better documented.
* Through the spec, supports dynamic subtitle manipulation (as demonstrated in the example file)
* Supports multiple (simultaneously playing) video files on a page, each with an unlimited number of tracks
* Adaptively scales default subtitle UI to fit video
* Supports `MediaTrack` tracks, with additional audio & video, picture in picture etc.
* Supports synchronised media with the `syncMaster` attribute!

Licence
----------------

You may copy and use this library as you see fit (including commercial use) and modify it, as long as you retain my attribution comment (which includes my name, link to this github page, and library version) at the top of the script. You may not, under any circumstances, claim you wrote this library, or remove my attribution. (Fair's fair!)

I'd appreciate it if you'd contribute patches back, but you don't have to.