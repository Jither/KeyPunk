/* global chrome */

/**
 * Chrome extension specific functionality.
 * Eventually, more of the Chrome stuff should be moved here.
 */

(function(jk) {

	"use strict";

	jk.chrome = (function()
	{
		function isExtension()
		{
			return window.chrome && chrome.extension;
		}

		// Stores value in background page cache
		function cache(key, value)
		{
			var bg = chrome.extension.getBackgroundPage();

			if (typeof(value) !== "undefined")
			{
				bg.keypunkState.cache(key, value);
			}

			return bg.keypunkState.cache(key);
		}

		// Gets the currently focused tab in Chrome and passes it to a specified callback.
		function getCurrentTab(callback)
		{
			if (window.chrome && chrome.tabs)
			{
				chrome.tabs.query({ active: true, lastFocusedWindow: true}, function(tabs) { callback(tabs[0]); });
			}
		}

		function fillPasswords(password)
		{
			getCurrentTab(function(tab)
			{
				chrome.tabs.sendMessage(tab.id, { cmd: "setPassword", password: password });
			});
		}

		function hasPasswordInputs(callback)
		{
			getCurrentTab(function(tab) {
				chrome.tabs.sendMessage(tab.id, { cmd: "hasPasswordInputs" }, callback);
			});
		}

		function openOptions()
		{
			chrome.tabs.create({'url': chrome.extension.getURL("options.html") } );
		}

		return {
			isExtension: isExtension,
			cache: cache,
			getCurrentTab: getCurrentTab,
			fillPasswords: fillPasswords,
			hasPasswordInputs: hasPasswordInputs,
			openOptions: openOptions
		};
	}());

}(window.keypunk = window.keypunk || {}));