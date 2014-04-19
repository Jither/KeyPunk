/**
 * Chrome extension background page.
 * This is used for storing the master password when the popup is closed.
 * We don't want to store it elsewhere, since it's unencrypted.
 */

window.keypunkState = (function() {
	
	"use strict";

	var _cache = {};

	function cache(key, value)
	{
		if (typeof(value) !== "undefined")
		{
			_cache[key] = value;
		}

		return _cache[key];
	}

	return {
		cache: cache
	};
}());
