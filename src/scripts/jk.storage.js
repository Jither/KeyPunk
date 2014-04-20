/* global chrome */

/**
 * Abstraction of storage for profiles and global settings.
 * This supports storage through Chrome's Storage API, falling back to
 * LocalStorage when running as a page in the browser.
 *
 * Also takes care of client side encryption when storing in synced storage.
 *
 * Because Chrome limits the size of saved items when using synced storage,
 * we also abstract away the need to divide items into parts if the size
 * exceeds the quota.
 */

(function(jk, $) {

	"use strict";
	jk.storage = (function(crypt, utils, constants, log) {

		var _chromeStorage = window.chrome && chrome.storage,
			// Local part size is used for testing parts division without actually syncing.
			LOCAL_PART_SIZE = 2048,
			ENCRYPT_SYNCED_DATA = true,
			// When stored values are divided into parts, the key contains a JSON stringified array of
			// the part keys, prefixed by PARTS_INDICATOR - e.g. ::parts::["key1", "key2", "key3"]
			PARTS_INDICATOR = "::parts::";

		function load(key, forceLocal)
		{
			var task = new $.Deferred();

			if (_chromeStorage)
			{
				// Chrome extension - use Chrome API
				//log.debug("load key '{0}' from Chrome storage", key);

				loadFromExtensionStorage(task, key, forceLocal);
			}
			else
			{
				// Page in browser - use LocalStorage API
				log.debug("key '{0}': load from browser LocalStorage", key);

				var value = localStorage.getItem(key);
				// LocalStorage returns null for unknown keys,
				// so no need to handle that explicitly.
				loaded(task, key, value, null);
			}

			return task.promise();
		}

		function save(key, value, forceLocal)
		{
			var task = new $.Deferred();

			value = JSON.stringify(value);
			if (_chromeStorage)
			{
				// Chrome extension - use Chrome API
				saveToExtensionStorage(task, key, value, forceLocal);
			}
			else
			{
				// Page in browser - user LocalStorage API
				localStorage.setItem(key, value);
				saved(task, key);
			}

			return task.promise();
		}

		function _error(task, errorType, message)
		{
			task.reject({ type: errorType, message: message });
		}

		// Promise: Gets client synchronization status (true if client synchronizes, false otherwise).
		function clientSynced()
		{
			var task = new $.Deferred();

			if (!_chromeStorage)
			{
				task.resolve(false);
				return task.promise();
			}

			loadSynchronizationInfo()
			.done(
				function(response)
				{
					task.resolve(response.synced);
				}
			)
			.fail(task.reject);

			return task.promise();
		}

		function startSync(syncKey)
		{
			var task = new $.Deferred();

			var values = { synced: true, syncKey: syncKey };
			
			storageSet(chrome.storage.local, values, "starting client synchronization")
				.done(
					function() {
						isSyncedDataAvailable()
						.done(function(dataAvailable) {
							task.resolve(dataAvailable);
						})
						.fail(task.reject);
					})
				.fail(task.reject);

			return task.promise();
		}

		function stopSync()
		{
			var task = new $.Deferred();

			storageRemove(chrome.storage.local, ["synced", "syncKey"], "stopping client synchronization")
				.done(task.resolve)
				.fail(task.reject);

			return task.promise();
		}

		function initSyncedData()
		{
			var task = new $.Deferred();

			if (_chromeStorage)
			{
				storageSet(chrome.storage.sync, { synced: true }, "initializing synchronized storage")
					.done(task.resolve)
					.fail(task.reject);
			}
			else
			{
				_error(task, constants.ERRORS.syncNotSupported);
			}

			return task.promise();
		}

		function clearSync()
		{
			var task = new $.Deferred();

			if (_chromeStorage)
			{
				storageClear(chrome.storage.sync, "clearing synchronized storage")
					.done(task.resolve)
					.fail(task.reject);
			}
			else
			{
				_error(task, constants.ERRORS.syncNotSupported);
			}

			return task.promise();
		}

		// Promise: Returns true if data exists in synced storage, false otherwise.
		function isSyncedDataAvailable()
		{
			var task = new $.Deferred();

			if (!_chromeStorage)
			{
				task.resolve(false);
				return task.promise();
			}

			storageGet(chrome.storage.sync, "synced").done(
				function(response)
				{
					task.resolve(!!response.synced);
				}
			);

			return task.promise();
		}

		function getStorageName(storage)
		{
			return storage === chrome.storage.sync ? "SYNC storage" : "LOCAL storage";
		}

		function getPartKeys(value)
		{
			if (!value)
			{
				return null;
			}

			if (value.substr(0, PARTS_INDICATOR.length) === PARTS_INDICATOR)
			{
				return JSON.parse(value.substr(PARTS_INDICATOR.length));
			}

			return null;
		}

		function _makeContext(defaultMessage, args, argsMessageIndex)
		{
			var result = defaultMessage;
			if (args.length > argsMessageIndex)
			{
				var params = Array.prototype.slice.call(args, 2);
				result = utils.format.apply(window, params);
				log.debug(result);
			}
			return result;
		}

		function storageGet(storage, keys) // , description, params
		{
			var context = _makeContext("reading value of '{0}' from storage", arguments, 2);

			var task = new $.Deferred();

			storage.get(keys, function(response)
			{
				var error = chrome.runtime.lastError;

				if (error)
				{
					var message = utils.format("Error {0}: {1}", context, error);
					log.error(message);
					_error(task, constants.ERRORS.storage, message);
					return;
				}

				task.resolve(response);
			});

			return task.promise();
		}

		function storageSet(storage, values)
		{
			var context = _makeContext("writing value of '{0}' to storage", arguments, 2);

			var task = new $.Deferred();

			storage.set(values, function()
			{
				var error = chrome.runtime.lastError;

				if (error)
				{
					var message = utils.format("Error {0}: {1}", context, error);
					log.error(message);
					_error(task, constants.ERRORS.storage, message);
					return;
				}

				task.resolve();
			});

			return task.promise();
		}

		function storageRemove(storage, keys)
		{
			var context = _makeContext("removing '{0}' from storage", arguments, 2);

			var task = new $.Deferred();

			storage.remove(keys, function()
			{
				var error = chrome.runtime.lastError;
				
				if (error)
				{
					var message = utils.format("Error {0}: {1}", context, error);
					log.error(message);
					_error(task, constants.ERRORS.storage, message);
					return;
				}

				task.resolve();
			});

			return task.promise();
		}

		function storageClear(storage)
		{
			var context = _makeContext("clearing storage", arguments, 1);

			var task = new $.Deferred();

			storage.clear(function() {
				var error = chrome.runtime.lastError;

				if (error)
				{
					var message = utils.format("Error {0}: {1}", context, error);
					log.error(message);
					_error(task, constants.ERRORS.storage, message);
					return;
				}

				task.resolve();
			});

			return task.promise();
		}


		function getMaxItemSize(storage)
		{
			// We subtract 100 bytes to be on the safe side.
			// NOTE: This only works reliably when encrypting data. Otherwise, content may
			// be e.g. UTF-8, which makes character length vs. byte length unpredictable.
			return (storage.QUOTA_BYTES_PER_ITEM - 100) || LOCAL_PART_SIZE;
		}

		function loadSynchronizationInfo()
		{
			return storageGet(chrome.storage.local, ["synced", "syncKey"]);
		}

		function loadFromExtensionStorage(task, key, forceLocal)
		{
			if (forceLocal)
			{
				doLoad(task, chrome.storage.local, key);
				return;
			}

			loadSynchronizationInfo()
			.done(
				function(response)
				{
					var synced = response.synced;
					var cryptKey = response.syncKey;

					var storage = synced && !forceLocal ? chrome.storage.sync : chrome.storage.local;

					doLoad(task, storage, key, cryptKey);
				}
			).fail(task.reject);
		}

		function doLoad(task, storage, key, cryptKey)
		{
			storageGet(storage, key, "key '{0}': loading from {1}", key, getStorageName(storage))
			.done(
				function(response)
				{
					log.debug("key '{0}': loaded from storage", key);

					var value = response[key];
					var partKeys = getPartKeys(value);

					if (!partKeys)
					{
						// Our value is a single, normal key - and already loaded
						log.debug("key '{0}': is a single value.", key);
						loaded(task, key, value, cryptKey);
						return;
					}

					// Our value is split into parts, so get those:
					loadParts(task, storage, key, partKeys, cryptKey);
				}
			).fail(task.reject);
		}

		function loadParts(task, storage, key, partKeys, cryptKey)
		{
			storageGet(storage, partKeys, "key '{0}': multiple parts - loading...", key)
			.done(
				function(response)
				{
					var result = "";
					for (var i = 0; i < partKeys.length; i++)
					{
						result += response[partKeys[i]];
					}
					loaded(task, key, result, cryptKey);
				}
			).fail(task.reject);
		}

		function saveToExtensionStorage(task, key, value, forceLocal)
		{
			if (forceLocal)
			{
				doSave(task, chrome.storage.local, key, value);
				return;
			}

			loadSynchronizationInfo()
			.done(
				function(response)
				{
					var synced = response.synced;
					var cryptKey = response.syncKey;

					var storage = synced ? chrome.storage.sync : chrome.storage.local;

					doSave(task, storage, key, value, cryptKey);
				}
			)
			.fail(task.reject);
		}

		function doSave(task, storage, key, value, cryptKey)
		{
			log.debug("key '{0}': saving to {1}", key, getStorageName(storage));

			storageGet(storage, [key], "key '{0}': getting old values...", key).done
			(
				function(response)
				{
					var partKeys = getPartKeys(response[key]);

					// Remove old keys
					if (partKeys)
					{
						storage.remove(partKeys);
					}

					var maxItemSize = getMaxItemSize(storage);

					if (cryptKey && ENCRYPT_SYNCED_DATA)
					{
						log.debug("key '{0}': encrypting data...", key);
						value = crypt.encrypt(cryptKey, value);
					}

					if (value.length < maxItemSize)
					{
						// Size of value is small enough to fit, so just store it normally:
						log.debug("key '{0}': storing as single value.", key);
						var values = {};
						values[key] = value;
						storageSet(storage, values).done(function() { saved(task, key); });
					}
					else
					{
						saveParts(task, storage, key, value);
					}
				}
			).fail(task.reject);
		}

		function saveParts(task, storage, key, value)
		{
			var maxItemSize = getMaxItemSize(storage);

			// Length of value exceeds quota, so split it into parts and
			// store the part keys in the main key:
			var parts = [];
			var partIndex = 0;
			var values = {};
			while (value.length > 0)
			{
				var part = value.substr(0, maxItemSize);
				var partKey = key + partIndex++;
				parts.push(partKey);
				values[partKey] = part;

				value = value.substr(maxItemSize);
			}
			log.debug("key '{0}': storing as {1} parts.", key, parts.length);

			values[key] = PARTS_INDICATOR + JSON.stringify(parts);

			storageSet(storage, values).done(function() { saved(task, key); });
		}

		function loaded(task, key, value, cryptKey)
		{
			log.debug("key '{0}': value acquired.", key);
			if (!value)
			{
				task.resolve(null);
			}
			else
			{
				if (cryptKey)
				{
					log.debug("key '{0}': decrypting...", key);
					try
					{
						value = crypt.decrypt(cryptKey, value);
					}
					catch (error)
					{
						var message = utils.format("Error decrypting '{0}': {1}", key, error);
						_error(task, constants.ERRORS.decrypt, message);
						return;
					}
				}

				log.debug("key '{0}': returning value.", key);
				
				task.resolve(JSON.parse(value));
			}
		}

		function saved(task, key)
		{
			log.debug("key '{0}': value saved to storage.", key);
			task.resolve();
		}

		return {
			load: load,
			save: save,
			clientSynced: clientSynced,
			startSync: startSync,
			stopSync: stopSync,
			clearSync: clearSync,
			initSyncedData: initSyncedData,
			isSyncedDataAvailable: isSyncedDataAvailable,
		};
	}(jk.crypt, jk.utils, jk.constants, jk.log));

}(window.keypunk = window.keypunk || {}, jQuery));