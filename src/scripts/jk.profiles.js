/** 
 * Profile management.
 * 
 * Not very well-isolated.
 */

(function(jk, $, _) {

	"use strict";

	jk.profiles = (function (storage, log) {
		var DEFAULT_ID = "Default";
		
		var profiles;
		
		function updateProfile(id, values)
		{
			storeProfileValues(id, values);
			
			save();
		}

		function duplicateProfile(values)
		{
			var id = getUniqueProfileId();
			var profile = {};
			profiles[id] = profile;
			
			storeProfileValues(id, values);

			save();

			return profile;
		}

		function renameProfile(id, newId)
		{
			if (!isProfileIdUnique(newId))
			{
				throw "Profile name must be unique";
			}
			var profile = profiles[id];
			delete profiles[id];
			profile.id = newId;
			profiles[newId] = profile;

			save();

			return profile;
		}

		function removeProfile(id)
		{
			var profile = profiles[id];
			delete profiles[id];

			save();

			return profile;
		}

		function storeProfileValues(id, values)
		{
			var profile = profiles[id];
			profile.id = id;
			profile.algorithm = values.algorithm;
			profile.passwordLength = values.passwordLength;
			profile.alphabet = values.alphabet;
			profile.domains = values.domains;
			profile.modifier = values.modifier;
			profile.useAllSets = values.useAllSets;
		}

		function getUniqueProfileId()
		{
			var index = 0;
			var result = "";
			while (true)
			{
				index++;
				result = "Profile " + index;
				if (isProfileIdUnique(result))
				{
					return result;
				}
			}
		}

		function isProfileIdUnique(id)
		{
			return typeof profiles[id] === "undefined";
		}

		function load()
		{
			var promise = storage.load("profiles");
			promise.done(loaded);
			promise.fail(loadFailed);
			return promise;
		}

		function loaded(data)
		{
			if (data)
			{
				profiles = data;
			}
			else
			{
				profiles = {};
				profiles[DEFAULT_ID] =
				{
					id: DEFAULT_ID,
					algorithm: { name: "sha2-256", hmac: true },
					passwordLength: 16,
					alphabet: ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789", "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
					domains: null,
					modifier: null,
					useAllSets: true,
				};
			}
		}

		function loadFailed(error)
		{
			log.error("Failed loading profiles: {0}", error);
			notifyStatus("Failed loading profiles");
		}

		function save()
		{
			notifyStatus("Saving profiles...");
			var promise = storage.save("profiles", profiles);
			promise.always(saved);
			return promise;
		}

		function saved(error)
		{
			if (!error)
			{
				notifyStatus("Profiles saved");
			}
			else
			{
				log.error("Profile save error: {0}", error);
				notifyStatus("Failed saving profiles");
			}
		}

		function getProfileIdForInput(input)
		{
			for (var id in profiles)
			{
				var profile = profiles[id];
				if (_(profile.domains).contains(input))
				{
					return id;
				}
			}
			return null;
		}

		function notifyStatus(message)
		{
			$(jk.profiles).trigger({ type: "status", message: message });
		}

		function getAll()
		{
			return profiles;
		}

		function exportData()
		{
			return profiles;
		}

		function importData(data)
		{
			var task = $.Deferred();

			$.extend(profiles, data);
			save().then(task.resolve);

			return task.promise();
		}

		function getById(id)
		{
			return profiles[id];
		}

		return {
			DEFAULT_ID: DEFAULT_ID,

			load: load,
			save: save,
			updateProfile: updateProfile,
			duplicateProfile: duplicateProfile,
			renameProfile: renameProfile,
			removeProfile: removeProfile,
			getAll: getAll,
			getById: getById,
			getProfileIdForInput: getProfileIdForInput,
			importData: importData,
			exportData: exportData
		};
	}(jk.storage, jk.log));
	
}(window.keypunk = window.keypunk || {}, jQuery, _));