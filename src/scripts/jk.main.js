/**
 * Main script... 
 * Where everything in the popup (or index.html if running as a simple browser page) starts
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