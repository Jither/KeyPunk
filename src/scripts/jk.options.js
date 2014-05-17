/**
 * Chrome extension options page.
 */

(function(jk, $) {

	"use strict";

	jk.options = (function(settings, profiles, storage, dialogs, constants, utils, log) {
		
		var 
			$showPassword		= $("#show-password"),
			$storeMasterPassword= $("#store-master-password"),

			$useKdf 			= $("#use-kdf"),
			$kdf 				= $("#kdf"),
			$kdfIterations 		= $("#kdf-iterations"),
			$kdfSalt			= $("#kdf-salt"),

			$optionsSync		= $("#options-sync"),
			$syncedDataAvailable= $("#synced-data-available"),
			$sync 				= $("#sync"),
			$clearSyncStorage	= $("#clear-sync-storage"),

			$import				= $("#import"),
			$export				= $("#export"),

			_clientSynced,
			_syncedDataAvailable,

			rxHexString = /^(?:[0-9a-f][0-9a-f])+$/i
			;

		function init()
		{
			$optionsSync.toggle(storage.canSync());
			$kdf.empty();
			for (var kdf in constants.KEY_DERIVATION_FUNCTIONS)
			{
				var display = constants.KEY_DERIVATION_FUNCTIONS[kdf].display;
				var option = $(utils.format('<option value="{0}">{1}</option>', kdf, display));
				$kdf.append(option);
			}

			$showPassword.on("change", showPasswordChanged);
			$storeMasterPassword.on("change", storeMasterPasswordChanged);

			$useKdf.on("change", useKdfChanged);
			$kdf.on("change", kdfChanged);
			$kdfIterations.on("change", kdfIterationsChanged);
			$kdfSalt.on("change", kdfSaltChanged);

			$sync.on("change", syncChanged);
			$clearSyncStorage.click(clearSyncStorageClicked);

			$import.click(importClicked);
			$export.click(exportClicked);

			$.when(
				settings.load().done(updateState),
				storage.clientSynced().done(clientSyncedLoaded),
				storage.isSyncedDataAvailable().done(syncedDataAvailableLoaded)
			)
			.done(loaded)
			.fail(loadFailed);
		}

		function loaded()
		{
			updateState();
			updateSyncState();
		}

		function loadFailed(error)
		{
			switch (error.type)
			{
				case constants.ERRORS.decrypt:
					dialogs.alert("Failed loading settings. Password is likely wrong.");
					break;
				default:
					dialogs.alert("Failed loading settings: " + error.message);
					break;
			}
		}

		function clientSyncedLoaded(isSynced)
		{
			_clientSynced = isSynced;
		}

		function syncedDataAvailableLoaded(isAvailable)
		{
			_syncedDataAvailable = isAvailable;
		}

		function storeMasterPasswordChanged()
		{
			settings.storeMasterPassword($storeMasterPassword.prop("checked"));
		}

		function showPasswordChanged()
		{
			settings.showPassword($showPassword.prop("checked"));
		}

		function useKdfChanged()
		{
			settings.useKdf($useKdf.prop("checked"));
			updateState();
		}

		function kdfChanged()
		{
			settings.kdf($kdf.val());
		}

		function kdfIterationsChanged()
		{
			settings.kdfIterations(parseInt($kdfIterations.val()));
		}

		function kdfSaltChanged()
		{
			var salt = $kdfSalt.val().trim();
			var valid = rxHexString.test(salt);
			log.dump(salt, valid);
			$kdfSalt.toggleClass("error", !valid);
			if (valid)
			{
				settings.kdfSalt(salt);
			}
		}

		function syncChanged()
		{
			if ($sync.prop("checked"))
			{
				enableSync();
			}
			else
			{
				disableSync();
			}
		}

		function enableSync()
		{
			var message = _syncedDataAvailable ?
				"Are you sure you want to enable synchronization? Any settings made locally will be overwritten." :
				"Are you sure you want to enable synchronization?";

			dialogs.confirm(message).done(
				function(yes)
				{
					if (yes)
					{
						dialogs.prompt("Please enter password to use for synchronization")
						.done(
							function(syncKey)
							{
								if (syncKey)
								{
									_enableSync(syncKey);
								}
								else
								{
									updateSyncState();
								}
							}
						);
					}
					else
					{
						updateSyncState();
					}
				}
			);
		}

		function disableSync()
		{
			dialogs.confirm("Are you sure you want to disable synchronization?").done(
				function(yes)
				{
					if (yes)
					{
						_disableSync(/* loadProfiles */ true)
							.fail(disableSyncFailed);
					}
					else
					{
						updateSyncState();
					}
				}
			);

			function disableSyncFailed(error)
			{
				dialogs.alert("Failed disabling synchronization: " + error.message);
			}
		}

		function _enableSync(syncKey)
		{
			// The steps are more readable with underscores 
			/* jshint camelcase:false */

			log.debug("Enabling synchronization...");

			// Load profiles in case they need to be synced "up"
			profiles.load()
				.done(step1_startSync)
				.fail(syncFailed);

			function step1_startSync()
			{
				storage.startSync(syncKey)
					.done(step2_initialSync)
					.fail(syncFailed);
			}

			function step2_initialSync(syncDataAvailable)
			{
				if (syncDataAvailable)
				{
					// Synced data is available - sync "down"
					settings.load()
						.done(step3_updateState)
						.fail(syncFailed);
				}
				else
				{
					// No synced data - sync "up"
					$.when(
						storage.initSyncedData(),
						settings.save(),
						profiles.save()
					)
						.done(step3_updateState)
						.fail(syncFailed);
				}
			}

			function step3_updateState()
			{
				_syncedDataAvailable = true;
				_clientSynced = true;
				updateSyncState();
			}

			function syncFailed(error)
			{
				var message;

				switch (error.type)
				{
					case constants.ERRORS.decrypt:
						message = "Failed to start synchronization. Check your password.";
						break;
					default:
						message = "Failed to start synchronization: " + error.message;
						break;
				}
				
				dialogs.alert(message);
				_disableSync(/* transferProfiles */ false);
			}
		}

		function _disableSync(transferProfiles)
		{
			// The steps are more readable with underscores 
			/* jshint camelcase:false */

			log.debug("Disabling synchronization...");

			var task = $.Deferred();

			if (transferProfiles)
			{
				profiles.load()
					.done(step1_stopSync)
					.fail(task.reject);
			}
			else
			{
				step1_stopSync();
			}

			function step1_stopSync()
			{
				storage.stopSync()
					.done(step2_syncAndUpdateState)
					.fail(task.reject);
			}

			function step2_syncAndUpdateState()
			{
				// Save settings locally
				settings.save();
				profiles.save();
				_clientSynced = false;
				updateSyncState();
				task.resolve();
			}

			return task.promise();
		}

		function clearSyncStorageClicked()
		{
			// The steps are more readable with underscores 
			/* jshint camelcase:false */

			dialogs.confirm("Are you sure you want to clear synchronized storage? This will make ALL synchronized clients lose their settings.").done(
				function(yes)
				{
					if (yes)
					{
						step1_disableSync();
					}
					else
					{
						updateSyncState();
					}
				}
			);

			function step1_disableSync()
			{
				_disableSync(/* transferProfiles */ true)
					.done(step2_clearSync)
					.fail(clearSyncFailed);
				}

			function step2_clearSync()
			{
				storage.clearSync()
					.done(step3_updateState)
					.fail(clearSyncFailed);
			}

			function step3_updateState()
			{
				_syncedDataAvailable = false;
				updateSyncState();
			}

			function clearSyncFailed(error)
			{
				dialogs.alert("Failed clearing synchronized data: " + error.message);
				updateSyncState();
			}
		}

		function importClicked()
		{
			// The steps are more readable with underscores 
			/* jshint camelcase:false */

			profiles.load()
				.done(step1_showDialog)
				.fail(importFailed);

			function step1_showDialog()
			{
				dialogs.importData()
					.done(step2_parse);
			}

			function step2_parse(json)
			{
				if (!json) 
				{
					return;
				}
				
				var values;
				try
				{
					values = JSON.parse(json);
				}
				catch (error)
				{
					dialogs.alert("Error in import data: " + error);
					return;
				}

				settings.importData(values.settings);
				profiles.importData(values.profiles);
			}

			function importFailed(error)
			{
				dialogs.alert("Error during import: " + error.message);
			}
		}

		function exportClicked()
		{
			// The steps are more readable with underscores 
			/* jshint camelcase:false */

			profiles.load()
				.done(step1_exportData)
				.fail(exportFailed);

			function step1_exportData()
			{
				var values =
				{
					settings: settings.exportData(),
					profiles: profiles.exportData()
				};

				dialogs.exportData(JSON.stringify(values, null, "    "));
			}

			function exportFailed(error)
			{
				dialogs.alert("Error during export: " + error.message);
			}
		}

		function updateState()
		{
			var useKdf = settings.useKdf();

			$showPassword.prop("checked", settings.showPassword());
			$storeMasterPassword.prop("checked", settings.storeMasterPassword());
			
			$kdf.val(settings.kdf());
			$kdfIterations.val(settings.kdfIterations());
			$kdfSalt.val(settings.kdfSalt());

			$useKdf.prop("checked", useKdf);
			$kdf.prop("disabled", !useKdf);
			$kdfIterations.prop("disabled", !useKdf);
			$kdfSalt.prop("disabled", !useKdf);
		}

		function updateSyncState()
		{
			$sync.prop("checked", _clientSynced);
			$syncedDataAvailable.text(_syncedDataAvailable ? "Synchronized data available." : "Synchronized data not set up.");
			$clearSyncStorage.prop("disabled", !_syncedDataAvailable);
		}

		return {
			init: init
		};
	}(jk.settings, jk.profiles, jk.storage, jk.dialogs, jk.constants, jk.utils, jk.log));

	jk.options.init();

}(window.keypunk = window.keypunk || {}, jQuery));