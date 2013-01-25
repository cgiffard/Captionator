//	Variables you might want to tweak
var minimumFontSize = 10;				//	We don't want the type getting any smaller than this.
var minimumLineHeight = 16;				//	As above, in points
var fontSizeVerticalPercentage = 4.5;	//	Caption font size is 4.5% of the video height
var lineHeightRatio = 1.5;				//	Caption line height is 1.3 times the font size
var cueBackgroundColour	= [0,0,0,0.5];	//	R,G,B,A
var objectsCreated = false;				//	We don't want to create objects twice, or instanceof won't work

var captionator = {};
window.captionator = captionator;