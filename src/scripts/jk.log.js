/* global console */

/**
 * Tiny logging framework for KeyPunk
 */

(function(jk) {

	"use strict";
	 
	var ENABLED = true;

	jk.log = (function() {
		if (!ENABLED || !window.console)
		{
			return {
				debug: function() {},
				dump: function() {},
				error: function() {}
			};
		}

		function dump()
		{
			console.log.apply(console, arguments);
		}

		function debug()
		{
			console.log(jk.utils.format.apply(window, arguments));
		}

		function error()
		{
			console.error(jk.utils.format.apply(window, arguments));
		}

		return {
			debug: debug,
			dump: dump,
			error: error
		};
	}());
}(window.keypunk = window.keypunk || {}));