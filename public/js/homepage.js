
(function() {
	'use strict';

	$(document).ready(function() {
		var viewPortWidth = window.innerWidth;
		var viewPortHeight = window.innerHeight;

		var wrapper = $(".wrapper"),
				title = $("#title"),
				john = $("#john"),
				experience = $("#experience"),
				contact = $("#contact");

		console.log(viewPortHeight - title.height());
		wrapper.css("height", viewPortHeight + "px");
		john.css("height", viewPortHeight - title.height() + "px");
		experience.css("height", viewPortHeight - title.height() + "px");
		contact.css("height", viewPortHeight - title.height() + "px");
	});

}());
