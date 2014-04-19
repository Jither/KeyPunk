/**
 * Chrome extension options page.
 */

(function(jk, $) {

	"use strict";

	jk.options = (function(settings, profiles, storage, dialogs, constants, utils, log) {
		
		var 
			$showPassword		= $("#show-password"),
			$useKdf 			= $("#use-kdf"),
			$kdf 				= $("#kdf"),
			$kdfIterations 		= $("#kdf-iterations"),
			$kdfSalt			= $("#kdf-salt"),

			$syncedDataAvailable= $("#synced-data-available"),
			$sync 				= $("#sync"),
			$clearSyncStorage	= $("#clear-sync-storage"),

			_clientSynced,
			_syncedDataAvailable
			;

		function init()
		{
			$kdf.empty();
			for (var kdf in constants.KEY_DERIVATION_FUNCTIONS)
			{
				var display = constants.KEY_DERIVATION_FUNCTIONS[kdf].display;
				var option = $(utils.format('<option value="{0}">{1}</option>', kdf, display));
				$kdf.append(option);
			}

			$showPassword.on("change", showPasswordChanged);

			$useKdf.on("change", useKdfChanged);
			$kdf.on("change", kdfChanged);
			$kdfIterations.on("change", kdfIterationsChanged);
			$kdfSalt.on("change", kdfSaltChanged);

			$sync.on("change", syncChanged);
			$clearSyncStorage.click(clearSyncStorageClicked);

			$.when(
				settings.load().done(updateState),
				storage.clientSynced().done(clientSyncedLoaded),
				storage.isSyncedDataAvailable().done(syncedDataAvailableLoaded)
			).then(
				loaded,
				loadFailed
			);
		}

		function loaded()
		{
			updateState();
			updateSyncState();
		}

		function loadFailed(error)
		{
			switch (error)
			{
				case constants.ERRORS.decrypt:
					dialogs.alert("Failed loading settings. Password is likely wrong.");
					break;
				default:
					dialogs.alert("Failed loading settings: " + error);
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
			var salt = $kdfSalt.val();
			settings.kdfSalt(salt);
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
						dialogs.prompt("Please enter password to use for synchronization").done(
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

		function _enableSync(syncKey)
		{
			log.debug("Enabling synchronization...");

			// Load profiles in case they need to be synced "up"
			profiles.load().done(profilesLoaded);

			function profilesLoaded()
			{
				storage.startSync(syncKey).done(syncStarted);
			}

			function syncStarted(syncDataAvailable)
			{
				if (syncDataAvailable)
				{
					// Synced data is available - sync "down"
					settings.load()
					.then(
						synced,
						syncFailed
					);
				}
				else
				{
					// No synced data - sync "up"
					$.when(
						storage.initSyncedData(),
						settings.save(),
						profiles.save()
					).then(
						synced
					);
				}
			}

			function synced()
			{
				_syncedDataAvailable = true;
				_clientSynced = true;
				updateSyncState();
			}

			function syncFailed(error)
			{
				var message;

				switch (error)
				{
					case constants.ERRORS.decrypt:
						message = "Failed to start synchronization. Check your password.";
						break;
					default:
						message = "Failed to start synchronization: " + error;
						break;
				}
				
				dialogs.alert(message);
				_disableSync();
			}
		}

		function disableSync()
		{
			dialogs.confirm("Are you sure you want to disable synchronization?").done(
				function(yes)
				{
					if (yes)
					{
						profiles.load().done(_disableSync);
					}
					else
					{
						updateSyncState();
					}
				}
			);
		}

		function _disableSync()
		{
			log.debug("Disabling synchronization...");

			var task = $.Deferred();

			// Disable sync
			storage.stopSync().done(
				function()
				{
					// Save settings locally
					settings.save();
					profiles.save();
					_clientSynced = false;
					updateSyncState();
					task.resolve();
				}
			);

			return task.promise();
		}

		function clearSyncStorageClicked()
		{
			dialogs.confirm("Are you sure you want to clear synchronized storage? This will make ALL synchronized clients lose their settings.").done(
				function(yes)
				{
					if (yes)
					{
						_disableSync().done(
							function()
							{
								storage.clearSync().done(
									function()
									{
										_syncedDataAvailable = false;
										updateSyncState();
									}
								);
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

		function updateState()
		{
			var useKdf = settings.useKdf();

			$showPassword.prop("checked", settings.showPassword());
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