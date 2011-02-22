Captionator
-----------

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

You can use the options parameter to specify where you want the captions to go:

	captionator.captionify(["#yourVideoElement1","#yourVideoElement2","de",{ container: "#captionContainer" });

The container itself won't be touched, but its contents will be destroyed and recreated
as the user seeks through the video file.