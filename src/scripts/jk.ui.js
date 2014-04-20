/** 
 * (Mostly) all of the UI stuff.
 * 
 * This has been through Knockout.JS, Angular, etc. before finally deciding
 * it was architectural overkill and only complicated matters. Now it's pure
 * jQuery.
 */

(function(jk, $) {

	"use strict";

	jk.ui = (function(settings, profiles, core, chromeHelper, dialogs, utils, constants, log) {
		var
			// MAIN
			$master 			= $("#master"),
			$confirmRow 		= $("#confirm-row"),
			$confirm			= $("#confirm"),
			$input				= $("#input"),
			$profile			= $("#profile"),
			$showPassword		= $("#show-password"),
			$output				= $("#output"),
			$outputPassword		= $("#output-password"),
			$outputClipboard	= $("#output-clipboard"),
			$status 			= $("#status"),

			$checksum			= $("#checksum"),
			$copy 				= $("#copy"),
			$fill 				= $("#fill"),

			// PROFILES
			$profilesProfile	= $("#profiles-profile"),
			$algorithm 			= $("#algorithm"),
			$hmac				= $("#hmac"),
			$passwordLength 	= $("#password-length"),
			$alphabet 			= $("#alphabet"),
			$domains			= $("#domains"),
			$modifier 			= $("#modifier"),
			$useAllSets 		= $("#use-all-sets"),

			$save 				= $("#save"),
			$duplicate			= $("#duplicate"),
			$rename				= $("#rename"),
			$remove				= $("#remove"),

			// REWIRE
			$rewireInput 		= $("#rewire-input"),

			// SHARED
			$navigation			= $("nav"),
			$sectionLinks		= $("nav ul li a"),
			$sections			= $("section"),
			$profiles 			= $(".profile"),

			$fatalErrorMessage	= $("#fatal-error-message"),

			_currentSection,
			_profiles,
			_editorProfileId,
			_hasPasswordInputs,
			_rewiredInput,
			_rewiredInputDictionary,
			_currentOutput
			;

		function init()
		{
			setCurrentSection("main");

			$sectionLinks.click(function(e) {
				setCurrentSection(this.hash.substr(1));
				e.preventDefault();
			});
		}

		function bind()
		{
			log.debug("ui bind");
			_profiles = profiles.getAll();

			bindMain();
			bindProfiles();
			bindRewire();

			updateProfiles();
			updateStateMain();

			$(profiles).on("status", function(e) { status(e.message); });
			$(settings).on("change", settingsChanged);

			updateRewiredInputDictionary(settings.rewireInput());
			reflectUrlInInput();
			checkForPasswordInputs();

			updateOutput();

			if (!isPasswordValid())
			{
				$master.focus();
			}
			else
			{
				$input.focus();
			}

			status("Ready");
		}

		function loadFailed(error)
		{
			switch (error.type)
			{
				case constants.ERRORS.decrypt:
					fatalError("Failed decrypting settings/profiles. Please check your synchronization password.");
					break;
				default:
					fatalError(error.message);
					break;
			}
		}

		function fatalError(error)
		{
			$fatalErrorMessage.text(error);
			$navigation.hide();
			setCurrentSection("fatal-error");
		}

		function setCurrentSection(section)
		{
			_currentSection = section;
			$sections.each(function() {
				$(this).toggle(this.id === _currentSection);
			});

			$sectionLinks.each(function() {
				$(this).toggleClass("active", $(this).attr("href").substr(1) === _currentSection);
			});
		}

		function settingsChanged(e)
		{
			switch (e.key)
			{
				case "rewireInput":
					updateRewiredInputDictionary(e.value);
					break;
			}
		}

		// MAIN
		
		function bindMain()
		{
			log.debug("ui bind main");

			$master.on("input", passwordChanged);
			$confirm.on("input", passwordChanged);
			$input.on("input", inputChanged);
			$input.on("keypress", inputKeyPressed);
			$profile.on("change", mainProfileChanged);
			$showPassword.on("change", showPasswordChanged);

			$copy.click(copyClicked);
			$fill.click(fillPasswords);
			$checksum.click(checksumClicked);

			var masterPassword = settings.masterPassword();
			$master.val(masterPassword);
			$confirm.val(masterPassword);

			$showPassword.prop("checked", settings.showPassword());
		}

		function isPasswordValid()
		{
			var master = $master.val();
			if (!master)
			{
				return false;
			}
			var checksum = settings.masterChecksum();
			if (!!checksum)
			{
				return checksum === getMasterChecksum(master);
			}
			return master === $confirm.val();
		}

		function passwordChanged()
		{
			if (isPasswordValid())
			{
				settings.masterPassword($master.val());
			}
			updateOutput();
			updateStateMain();
		}

		function inputChanged()
		{
			var input = $input.val();

			_rewiredInput = _rewiredInputDictionary[input];
			updateRewiredState();

			var profileId = profiles.getProfileIdForInput(_rewiredInput || input);
			if (profileId)
			{
				$profile.val(profileId);
			}

			updateOutput();
			updateStateMain();
		}

		function inputKeyPressed(e)
		{
			switch (e.which)
			{
				case 13:
					fillPasswords();
					break;
			}
		}

		function updateRewiredState()
		{
			var isRewired = !!_rewiredInput;
			$input.attr("title", isRewired ? utils.format("Rewired to {0}", _rewiredInput) : null);
			$input.toggleClass("rewired", isRewired);
		}

		function mainProfileChanged()
		{
			updateOutput();
		}

		function showPasswordChanged()
		{
			var showPassword = $showPassword.prop("checked");
			settings.showPassword(showPassword);
			updateStateMain();
		}

		function updateStateMain()
		{
			var hasChecksum = !!settings.masterChecksum();

			var passwordValid = isPasswordValid();
			$master.toggleClass("error", !passwordValid);
			$master.toggleClass("verified", passwordValid && hasChecksum);
			$confirm.toggleClass("error", !passwordValid);

			var showPassword = $showPassword.prop("checked");
			$output.toggle(showPassword);
			$outputPassword.toggle(!showPassword);

			var hasOutput = !!_currentOutput;
			$copy.prop("disabled", !hasOutput);
			$fill.prop("disabled", !(hasOutput && _hasPasswordInputs));
			
			$checksum.prop("disabled", !passwordValid && !hasChecksum);
			$checksum.text(hasChecksum ? "Clear checksum" : "Save checksum");
			$confirmRow.toggle(!hasChecksum);
		}

		function updateOutput()
		{
			var output = "";
			if (isPasswordValid())
			{
				var profile = profiles.getById($profile.val());
				var masterPassword = $master.val();
				var input = _rewiredInput || $input.val();
				var s = {
					useKdf: settings.useKdf(),
					kdf: settings.kdf(),
					kdfIterations: settings.kdfIterations(),
					kdfSalt: settings.kdfSalt()
				};
				output = core.generate(masterPassword, input, s, profile);
			}

			_currentOutput = output;
			$output.val(output);
			$outputPassword.val(output);
			$outputClipboard.val(output);
		}

		// Copies output field content to clipboard.
		function copyClicked()
		{
			log.debug("copy");
			$outputClipboard.focus().select();
			document.execCommand("SelectAll");
			document.execCommand("Copy");

			status("Password copied to clipboard");
		}

		// Fills password fields on current tab with output
		function fillPasswords()
		{
			log.debug("fill");

			if (!_currentOutput || !_hasPasswordInputs)
			{
				return;
			}

			chromeHelper.fillPasswords(_currentOutput);
			window.close();
		}

		function getMasterChecksum(masterPassword)
		{
			if (!masterPassword)
			{
				return null;
			}
			var hash = core.getHash("sha2-512", masterPassword);
			return hash.toString().substr(0, 4);
		}

		function checksumClicked()
		{
			var checksum = settings.masterChecksum();
			if (checksum)
			{
				settings.masterChecksum(null);
			}
			else
			{
				settings.masterChecksum(getMasterChecksum($master.val()));
			}
			updateStateMain();
		}

		// Gets current URL, extracts the domain, and puts it in the input field
		function reflectUrlInInput()
		{
			chromeHelper.getCurrentTab(function(tab)
			{
				var url = tab.url;

				var domain = utils.getDomain(url);

				$input.val(domain);
				inputChanged();
			});
		}

		// For Chrome extension, checks if the current page has password fields and informs the UI
		function checkForPasswordInputs()
		{
			chromeHelper.hasPasswordInputs(function (hasPasswordInputs) {
				_hasPasswordInputs = hasPasswordInputs;
				updateStateMain();
			});
		}

		// PROFILES
		
		function bindProfiles()
		{
			log.debug("ui bind profiles");

			for (var algorithm in constants.HASH_FUNCTIONS)
			{
				var option = $(utils.format(
					'<option value="{0}">{1}</option>', 
					algorithm, 
					constants.HASH_FUNCTIONS[algorithm].display)
				);
				$algorithm.append(option);
			}

			$profilesProfile.on("change", profilesProfileChanged);

			$save.click(saveClicked);
			$duplicate.click(duplicateClicked);
			$rename.click(renameClicked);
			$remove.click(removeClicked);

			setEditorProfile(profiles.DEFAULT_ID);
		}

		function profilesProfileChanged()
		{
			var id = $profilesProfile.val();

			setEditorProfile(id);
		}

		function setEditorProfile(id)
		{
			var profile = _profiles[id];
			loadProfile(profile);
			$profilesProfile.val(id);
			updateStateProfiles();
		}

		function loadProfile(profile)
		{
			_editorProfileId = profile.id;
			$algorithm.val(profile.algorithm.name);
			$hmac.prop("checked", profile.algorithm.hmac);
			$passwordLength.val(profile.passwordLength);
			$alphabet.val(utils.arrayToLines(profile.alphabet));
			$domains.val(utils.arrayToLines(profile.domains));
			$modifier.val(profile.modifier);
			$useAllSets.prop("checked", profile.useAllSets);
		}

		function saveProfile()
		{
			return {
				id: _editorProfileId,
				algorithm: {
					name: $algorithm.val(),
					hmac: $hmac.prop("checked")
				},
				passwordLength: $passwordLength.val(),
				alphabet: utils.linesToArray($alphabet.val()),
				domains: utils.linesToArray($domains.val()),
				modifier: $modifier.val(),
				useAllSets: $useAllSets.prop("checked")
			};
		}

		function saveClicked()
		{
			profiles.updateProfile(_editorProfileId, saveProfile());
			updateOutput();
		}

		function duplicateClicked()
		{
			var profile = saveProfile();
			profile = profiles.duplicateProfile(profile);
			updateProfiles();
			setEditorProfile(profile.id);
		}

		function renameClicked()
		{
			dialogs.prompt(utils.format("Rename profile '{0}' to:", _editorProfileId)).done(
				function(newId)
				{
					if (!newId)
					{
						return;
					}
					try
					{
						profiles.renameProfile(_editorProfileId, newId);
					}
					catch (error)
					{
						dialogs.alert("Profile name must be unique.");
						return;
					}

					updateProfiles();
					setEditorProfile(newId);
				}
			);
		}

		function removeClicked()
		{
			dialogs.confirm(utils.format("Are you sure you wish to delete the profile '{0}'?", _editorProfileId)).done(
				function(yes)
				{
					if (yes)
					{
						profiles.removeProfile(_editorProfileId);
						updateProfiles();
						setEditorProfile(profiles.DEFAULT_ID);
					}
				}
			);
		}

		function updateStateProfiles()
		{
			var isDefault = _editorProfileId === profiles.DEFAULT_ID;
			$domains.prop("disabled", isDefault);
			$rename.prop("disabled", isDefault);
			$remove.prop("disabled", isDefault);
		}

		// REWIRE

		function bindRewire()
		{
			log.debug("ui bind rewire");

			$rewireInput.on("change", rewireInputChanged);
			$rewireInput.val(settings.rewireInput());
		}

		function rewireInputChanged()
		{
			var rewireInput = $rewireInput.val();
			settings.rewireInput(rewireInput);
		}

		function updateRewiredInputDictionary(value)
		{
			// TODO: Use a different separator than colon in future - will clash if we get support for ipv6
			_rewiredInputDictionary = utils.linesToDict(value, ":");
		}

		// SHARED

		function updateProfiles()
		{
			// TODO: Keep main tab's selection when re-populating
			$profiles.empty();

			for (var id in _profiles)
			{
				var profile = _profiles[id];
				var option = $(utils.format('<option value="{0}">{1}</option>', profile.id, profile.id));
				$profiles.append(option);
			}
		}

		// STATUS BAR

		var timeoutClearStatus;

		function clearStatus()
		{
			$status.text("");
		}

		function status(message)
		{
			clearTimeout(timeoutClearStatus);
			$status.text(message);
			timeoutClearStatus = setTimeout(clearStatus, 3000);
		}

		return {
			init: init,
			bind: bind,
			loadFailed: loadFailed
		};
	}(jk.settings, jk.profiles, jk.core, jk.chrome, jk.dialogs, jk.utils, jk.constants, jk.log));

}(window.keypunk = window.keypunk || {}, jQuery));