/* global chrome */

/**
 * Chrome extension content script.
 * This takes care of communicating whether a page has password inputs
 * as well as allowing the popup to fill them out.
 */

(function() {

	"use strict";

	function messageReceived(request, sender, sendResponse)
	{
		switch (request.cmd)
		{
			case "hasPasswordInputs":
				sendResponse({ hasPasswordInputs: hasPasswordInputs() });
				break;
			case "setPassword":
				setPassword(request.password);
				break;
		}
	}

	function getPasswordInputs()
	{
		// No need to load jQuery on every page for this...
		return document.querySelectorAll("input[type=password]");
	}

	function hasPasswordInputs()
	{
		return getPasswordInputs().length > 0;
	}

	function setPassword(password)
	{
		var inputs = getPasswordInputs();

		for (var i = 0; i < inputs.length; i++)
		{
			inputs[i].value = password;
		}
	}

	chrome.runtime.onMessage.addListener(messageReceived);

}());