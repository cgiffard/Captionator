# Video and Audio tracks (MediaTrack) #

**NOTE: THIS IS SUBJECT TO CHANGE.**

Captionator has experimental support for HTML5 video and Audio tracks (designed both for assistive purposes, and for enriching existing media.)

Some use cases for additional audio & video tracks might include:

* Directors commentary
* Sign language picture-in-picture video
* Audio description for blind / vision impaired users
* Alternate video angle (useful for concerts etc)
* Alternate video track for a conference, with the slides
* (For movie special features) - video track showing storyboards

Captionator allows you to make use of this additional media without writing infinity-million lines of code.

**Caveat:**
This stuff is totally non-standard. I'll be pushing for an implementation similar to this one, and will adjust captionator to mimic any standards which are drafted, but for the time being, I have to invent how this should work!

**Rationale:**
It's important to provide a way of including and manipulating out-of-band (_and_ in-band, but I can't do that with JS) media tracks, including, but not limited to those use cases mentioned above. I think that providing an implementation as close as possible to the current TextTrack draft is a good idea, as much of the TextTrack implementation philosophy works with respect to media tracks, and keeping things consistent reduces confusion and the learning curve, and provides greater opportunities to integrate the two APIs later down the track. (No pun intended!)

##The long and short of it##

	<track kind="audiodescription" src="audio/audiodescription-en.wav" type="audio/wav" srclang="en" label="English Descriptive Audio" />
	<track kind="audiodescription" src="audio/audiodescription-ja.wav" type="audio/wav" srclang="ja" label="Japanese Descriptive Audio" />
	<track kind="commentary" src="audio/directorscommentary-en.wav" type="audio/wav" srclang="en" label="Director's Commentary" />
	<track kind="alternate" src="video/storyboards.ogv" type="video/ogg" srclang="en" label="Storyboards" />
	<track kind="signlanguage" src="video/signlanguage.ogv" type="video/ogg" srclang="en" label="Sign Language" />
	
Essentially, Captionator provides Media Track support in much the same way it provides text track support - through the `<track>` element. Both the way it interprets the `MediaTrack` `<track>` elements and the API it provides to manipulate them is subtly different, though based around the same principles and ideas.
	
Instead of providing a `.track` property on `HTMLVideoElement` objects, Captionator instead puts these elements in a very similar property called `mediaTracks`, containing `MediaTrack` objects instead of `TextTrack` objects. The reasons for this are twofold:

* Because of its non-standard implementation, Captionator endeavours to separate it from the standards-based `TextTrack` API (while keeping its implementation as similar to the `TextTrack` API as possible.)
* Developers may not necessarily want to see `MediaTrack` objects in the track list when they're expecting `TextTrack` objects. Keeping the two types separate means it's easier to loop through and parse each type of track. If you want to see `MediaTrack` objects, you just look in the `.mediaTrack` property instead.

Many of the properties of these tracks are the same, though:

* `label` - String - describes the track (in plain human language)
* `language` - BCP47 language string which describes the track
* `kind` - Resource type (one of `audiodescription`, `commentary`, `alternate`, `signlanguage`.)
* `mode` - the most important property (probably!) - determines whether captionator will fetch and render the resource.
* `readyState` - indicates whether the resource is loaded (one of NONE/0, LOADING/1, LOADED/2, or ERROR/3)
* `videoNode` - the HTMLVideoElement which the track relates to/extends. (Not in the WHATWG spec.)

The `MediaTrack` object has some extensions on this basic set:

* `mediaElement` - The audio or video element responsible for displaying the MediaTrack itself
* `type` - The MIME type of the element

Captionator will automatically sync `MediaTrack` objects to the playback of your master media element, prioritising their display according to whether you have enabled them or not.

## Enabling and Disabling MediaTracks ##

Essentially, this procedure works the same way enabling and disabling regular `TextTrack` objects does:

	myVideo.mediaTracks[2].mode = 2; // SHOWING (Either video is visible or audio is audible)
	myVideo.mediaTracks[2].mode = 1; // HIDDEN (Elements are not visible or audible)
	myVideo.mediaTracks[2].mode = 0; // OFF

**Setting MediaTracks as Showing By Default**

For now, this can only be done in markup (I don't think there's any point in doing this at runtime in JavaScript, because there's no functional difference to just changing the track mode.) It's pretty straightforward - just add the boolean attribute 'default'.

	<track kind="commentary" src="audio/directorscommentary-en.wav" type="audio/wav" srclang="en" label="Director's Commentary" default />

## What the Track Types Mean ##

Captionator implements a number of different track types in extension to the ones defined by the WHATWG spec. Below are the MediaTrack specific extensions, what they are, and how you should use them.

* **`audiodescription`**
	
	_Audio Only._ Refers specifically to Audio Descriptions provided for the express purpose of explaining visual content in a video to people with vision impairments. Do not use this track for other forms of audio.
	
	Captionator will ensure `audiodescription` track audio is audible and synced to the playback state of the master element, but will not display an independent interface for controlling the audio (ala the `controls` attribute.)
		
* **`commentary`**
	
	_Audio Only._ Use for additional commentary, which enriches the original video (such as a Director's commentary for a movie) but is not required for accessibility purposes. Do not use this track type to provide assistive features.
	
	Captionator will ensure `commentary` track audio is audible and synced to the playback state of the master element, but will not display an independent interface for controlling the audio (ala the `controls` attribute.)

* **`alternate`**
	
	_Audio & Video._ Provide additional (alternate) audio and video tracks exclusively for enriching the user experience, **not** providing assistive features. Alternate angles and views, different soundtracks, etc. are all good uses of this track type. Here are some more examples:
	* Providing other camera angles for sporting events or concerts
	* Alternate soundtracks, or isolating individual instruments in a music video
	* Showing slides or other video material as part of a presentation, where the primary media element is a video/audio recording of the presenter
	* A video track showing storyboards timed to the movie playing in the master media element
	
	Remember that you should provide additional assistive tracks for any 'content enrichment' (I just made that up - but you know what I mean!) tracks you create.
	
	Be aware that Captionator will mute the audio of the master media element if an audio alternate track is selected to play. Multiple audio tracks may play at once, but it may sound awful! This does not apply with video - alternate video tracks will play without silencing the audio of their master media element. For this reason, you should avoid encoding audio into them.
	
	Captionator will display alternate video over the master element, obscuring its contents. Audio is audible and synced to the playback state of the master element, but no audio interface is displayed.

* **`signlanguage`**
	
	_Video Only._ A video of a person providing a sign-language simultaneous translation of the content playing in the master media element.
	
	Captionator will render this video as picture-in-picture, with the video taking up approximately a quarter of the available area in the master video. For this reason, you should ensure that even at small sizes, your `signLanguage` track is clear and free of visual distraction, and that the person signing takes up as much of the frame as possible (as long as you can still see all the gestures!)

## Browser Format Support ##

**NOTE: Due to some browser parser limitations, this syntax doesn't work yet. It will, but in the meantime, if you need `<source>` support, use a synchronised element.**

"But what about Safari/IE? They don't support ogg/vorbis! And Firefox doesn't support MP3! I don't want to deliver my audio as enormous wav/PCM files!"

Luckily for you, there's an alternate syntax:

	<track kind="commentary" srclang="en" label="Director's Commentary">
		<source src="audio/commentary.ogg" type="audio/ogg" />
		<source src="audio/commentary.mp3" type="audio/mp3" />
		<source src="audio/commentary.wav" type="audio/wav" />
	</track>
	
This works exactly the same way that the `<source>` tags work when nested within regular HTML5 video and audio elements.

## Synchronised Media Elements ##

Captionator also implements [proposal six from the Media Multitrack API](http://www.w3.org/WAI/PF/HTML/wiki/Media_Multitrack_Media_API#.286.29_Synchronize_separate_media_elements_through_attributes). You can set the attribute `syncMaster` on any video or audio you'd like to be synchronised to a video track managed by Captionator:

	captionator.captionify(document.getElementByID("myVideo"));
	...
	<video id="mySynchronisedVideo" syncMaster="myVideo">
		...
	</video>

That's all there is to it! Captionator will automatically pick up on any new elements you add.