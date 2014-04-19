/** 
 * Utility functions
 */

(function(jk, _) {

	"use strict";

	jk.utils = (function(constants)
	{
		function format(text)
		{
			var s = text,
				i = arguments.length;

			while (i-- > 1)
			{
				s = s.replace(new RegExp("\\{" + (i - 1) + "\\}", "gm"), arguments[i]);
			}
			return s;
		}

		function linesToArray(lines)
		{
			var items = (lines || "").split("\n");
			items = _(items)
				.chain()
				.map(function(item) { return item.trim(); })
				.compact()
				.value();

			return items;
		}

		function arrayToLines(arr)
		{
			return arr ? arr.join("\n") : "";
		}

		function linesToDict(lines, separator)
		{
			var items = linesToArray(lines);
			var result = _(items)
				.chain()
				.map(function(item) {
					// Can't use split here - we want item split into exactly two regardless of more separators:
					var splitIndex = item.indexOf(separator);
					
					if (splitIndex < 0)
					{
						return null;
					}

					return [item.substr(0, splitIndex).trim(), item.substr(splitIndex + 1).trim()];
				})
				.compact() // Remove invalid lines
				.object()
				.value();

			return result;
		}

		var rxDomain = /^https?\:\/\/([^/:?#]+)(?:[/:?#]|$)/i;
		var rxIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

		function getDomain(url)
		{
			// Extract domain from URL
			var matches = rxDomain.exec(url);

			if (!matches || matches.length < 2)
			{
				return;
			}

			var domain = matches[1];

			// If domain is an IP address, return the entire address:
			if (rxIp.test(domain))
			{
				return domain;
			}

			var domainParts = domain.split(".");

			var result = "";

			var partIndex = 0;
			var partCount = domainParts.length;

			while (partIndex < partCount)
			{
				// Only include more than two domain parts if we have a multi-part top level domain:
				if  (partIndex >= 2 && constants.TL_DOMAINS.indexOf(result) < 0)
				{
					break;
				}

				if (result.length > 0)
				{
					result = "." + result;
				}
				result = domainParts[partCount - (partIndex + 1)] + result;

				partIndex++;
			}

			return result;
		}

		return {
			format: format,
			linesToArray: linesToArray,
			arrayToLines: arrayToLines,
			linesToDict: linesToDict,
			getDomain: getDomain
		};

	}(jk.constants));

}(window.keypunk = window.keypunk || {}, _));