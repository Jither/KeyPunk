/**
 * Main script...
 *
 * Yeah, this is mostly a hodgepodge of stuff that should be elsewhere
 * but had no elsewhere to be.
 *
 * The init() function *is*, however, where everything starts. Mostly.
 */

(function(jk, $) {

	"use strict";

	jk.main = (function(settings, profiles, ui, log) {

		function init()
		{
			log.debug("main init");

			ui.init();
			
			log.debug("main load");

			$.when(
				settings.load(),
				profiles.load()
			).then(
				loaded,
				loadFailed
			);
		}
		
		function loaded()
		{
			log.debug("main loaded");
			
			ui.bind();
		}

		function loadFailed(error)
		{
			ui.loadFailed(error);
		}

		return {
			init: init
		};
	}(jk.settings, jk.profiles, jk.ui, jk.log));

	jk.main.init();

}(window.keypunk = window.keypunk || {}, jQuery));