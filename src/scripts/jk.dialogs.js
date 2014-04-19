/**
 * Modal dialogs (replacements for alert, confirm, prompt)
 */

(function(jk, $) {

	"use strict";

	jk.dialogs = (function(utils) {
		
		function alert(message)
		{
			var task = new $.Deferred();

			var $dlg = makeDialog("KeyPunk",
			{
				"OK": function() { task.resolve(); }
			});

			$dlg.append(utils.format('<p>{0}</p>', message));

			return task.promise();
		}
		
		function prompt(message)
		{
			var task = new $.Deferred();

			var $input = $('<input type="text" />');

			var $dlg = makeDialog("KeyPunk",
			{
				"OK": function() { task.resolve($input.val()); },
				"Cancel": function() { task.resolve(false); }
			});

			$dlg.append(utils.format('<p>{0}</p>', message));
			$dlg.append($input);
			$input.focus();

			return task.promise();
		}

		function confirm(message)
		{
			var task = new $.Deferred();

			var $dlg = makeDialog("KeyPunk",
			{
				"Yes": function() { task.resolve(true); },
				"No": function() { task.resolve(false); }
			});

			$dlg.append(utils.format('<p>{0}</p>', message));

			return task.promise();
		}

		function makeDialog(headerText, buttons)
		{
			var $result = $('<div class="dialog"></div>');
			var $header = $(utils.format('<h3>{0}</h3>', headerText));
			var $content = $('<div class="content"></div>');
			var $buttons = $('<div class="buttons"></div>');

			for (var key in buttons)
			{
				var $button = $(utils.format('<button>{0}</button>', key));
				$button.data("callback", buttons[key]);
				$button.click(buttonClicked);
				$buttons.append($button);
			}

			$result.append($header);
			$result.append($content);
			$result.append($buttons);
			$("body").append($result);
			return $content;
		}

		function buttonClicked(event)
		{
			// $(this) would suffice for this - still undecided.
			// event.currentTarget may be more clear and fixes an unneeded jshint warning.
			var $this = $(event.currentTarget);
			var $dlg = $this.closest(".dialog");
			var callback = $this.data("callback");
			$dlg.remove();
			callback();
		}

		return {
			alert: alert,
			prompt: prompt,
			confirm: confirm
		};

	}(jk.utils));

}(window.keypunk = window.keypunk || {}, jQuery));