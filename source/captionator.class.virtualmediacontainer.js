/**
* @constructor
*/
var VirtualMediaContainer = function(targetObject) {
	this.targetObject = targetObject;
	this.currentTime = 0;
	var timeupdateEventHandler = function() {};

	this.addEventListener = function(event,handler,ignore) {
		if (event === "timeupdate" && handler instanceof Function) {
			this.timeupdateEventHandler = handler;
		}
	};

	this.attachEvent = function(event,handler) {
		if (event === "timeupdate" && handler instanceof Function) {
			this.timeupdateEventHandler = handler;
		}
	};

	this.updateTime = function(newTime) {
		if (!isNaN(newTime)) {
			this.currentTime = newTime;
			timeupdateEventHandler();
		}
	};
	
	
};