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

**Enabling and disabling subtitle tracks programatically**

Documentation soon!