/*
	Subclassing DOMException so we can reliably throw it without browser intervention. This is quite hacky. See SO post:
	http://stackoverflow.com/questions/5136727/manually-artificially-throwing-a-domexception-with-javascript
*/
captionator.createDOMException = function(code,message,name) {
	try {
		//	Deliberately cause a DOMException error
		document.querySelectorAll("div/[]");
	} catch(Error) {
		//	Catch it and subclass it
		/**
		* @constructor
		*/
		var CustomDOMException = function CustomDOMException(code,message,name){ this.code = code; this.message = message; this.name = name; };
		CustomDOMException.prototype = Error;
		return new CustomDOMException(code,message,name);
	}
};

/*
	captionator.compareArray(array1, array2)

	Rough and ready array comparison function we can use to easily determine
	whether cues have changed or not.

	First parameter: The first aray to compare

	Second parameter: The second array to compare
	
	RETURNS:

	True if the arrays are the same length and all elements in each array are the strictly equal (index for index.)
	False in all other circumstances.
	Returns false if either parameter is not an instance of Array().

*/
captionator.compareArray = function compareArray(array1,array2) {
	//	If either of these arguments aren't arrays, we consider them unequal
	if (!(array1 instanceof Array) || !(array2 instanceof Array)) { return false; }
	//	If the lengths are different, we consider then unequal
	if (array1.length !== array2.length) { return false; }
	//	Loop through, break at first value inequality
	for (var index in array1) {
		if (array1.hasOwnProperty(index)) {
			if (array1[index] !== array2[index]) { return false; }
		}
	}
	//	If we haven't broken, they're the same!
	return true;
};

/*
	captionator.generateID([number ID length])

	Generates a randomised string prefixed with the word captionator. This function is used internally to keep track of
	objects and nodes in the DOM.

	First parameter: A number of random characters/numbers to generate. This defaults to 10.

	RETURNS:

	The generated ID string.

*/
captionator.generateID = function(stringLength) {
	var idComposite = "";
	stringLength = stringLength ? stringLength : 10;
	while (idComposite.length < stringLength) {
		idComposite += String.fromCharCode(65 + Math.floor(Math.random()*26));
	}

	return "captionator" + idComposite;
};