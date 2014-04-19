/**
 * Handling of all global settings
 * 
 * This divides settings into three storage areas:
 * - In-memory (local object for stand-alone webpage, background page for Chrome extension)
 * - Local (saved to disk)
 * - Synced (meaning either saved to disk OR synced, depending on user preference).
 */

(function(jk, $) {

	"use strict";

	jk.settings = (function(storage, profiles, chromeHelper, log) {
		var 
			// Used by standalone webpage
			_inMemorySettings = {},
			
			_syncedSettings = {
				showPassword: true,
				rewireInput: "",

				useKdf: true,
				kdf: "pbkdf2-sha-256",
				kdfSalt: "da7e9fb121449cacf9e022c78b487af0",
				kdfIterations: 1000
			},
			
			_localSettings = {
				masterChecksum: null,
				storeMasterPassword: true
			}
			;

		/**
		 * In-memory settings
		 */

		function inMemorySetting(key, value)
		{
			if (chromeHelper.isExtension())
			{
				return chromeHelper.cache(key, value);
			}
			else
			{
				if (typeof(value) !== "undefined")
				{
					_inMemorySettings[key] = value;
				}

				value = _inMemorySettings[key];

				return value;
			}
		}

		function masterPassword(value)
		{
			if (!storeMasterPassword())
			{
				return "";
			}

			return inMemorySetting("masterPassword", value);
		}

		/**
		 * Local settings
		 */
		function localSetting(key, value)
		{
			if (typeof(value) !== "undefined")
			{
				_localSettings[key] = value;
				storage.save("local_settings", _localSettings, /* forceLocal */ true);
				notifyChanged(key, value);
			}

			return _localSettings[key];
		}

		function localSettingsLoaded(settings)
		{
			if (settings)
			{
				$.extend(_localSettings, settings);
			}
		}

		function storeMasterPassword(value)
		{
			return localSetting("storeMasterPassword", value);
		}

		function masterChecksum(value)
		{
			return localSetting("masterChecksum", value);
		}

		/**
		 * (Potentially) Synced settings
		 */
		function syncedSetting(key, value)
		{
			if (typeof(value) !== "undefined")
			{
				_syncedSettings[key] = value;
				storage.save("settings", _syncedSettings);
				notifyChanged(key, value);
			}

			return _syncedSettings[key];
		}

		function syncedSettingsLoaded(settings)
		{
			if (settings)
			{
				$.extend(_syncedSettings, settings);
			}
		}

		function showPassword(value)
		{
			return syncedSetting("showPassword", value);
		}

		function rewireInput(value)
		{
			return syncedSetting("rewireInput", value);
		}

		function useKdf(value)
		{
			return syncedSetting("useKdf", value);
		}

		function kdf(value)
		{
			return syncedSetting("kdf", value);
		}

		function kdfSalt(value)
		{
			return syncedSetting("kdfSalt", value);
		}

		function kdfIterations(value)
		{
			return syncedSetting("kdfIterations", value);
		}

		/**
		 * Management
		 */

		function load()
		{
			var task = new $.Deferred();

			function taskFailed(error)
			{
				log.error("Failed loading settings: {0}", error);
				task.reject(error);
			}

			$.when(
				storage.load("local_settings", /* forceLocal */ true).then(
					localSettingsLoaded, 
					taskFailed
				),
				storage.load("settings").then(
					syncedSettingsLoaded, 
					taskFailed
				)
			)
			.then(task.resolve);

			return task.promise();
		}

		function save()
		{
			var task = new $.Deferred();

			$.when(
				storage.save("local_settings", _localSettings, /* forceLocal */ true),
				storage.save("settings", _syncedSettings)
			)
			.then(task.resolve, function(error) { task.fail(error); });

			return task.promise();
		}

		function notifyChanged(key, value)
		{
			$(jk.settings).trigger({ type: "change", key: key, value: value });
		}

		return {
			load: load,
			save: save,
			masterPassword: masterPassword,

			useKdf: useKdf,
			kdf: kdf,
			kdfSalt: kdfSalt,
			kdfIterations: kdfIterations,

			masterChecksum: masterChecksum,
			showPassword: showPassword,
			rewireInput: rewireInput,
		};
	}(jk.storage, jk.profiles, jk.chrome, jk.log));

}(window.keypunk = window.keypunk || {}, jQuery));