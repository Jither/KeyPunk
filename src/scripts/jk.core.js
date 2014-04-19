/* global CryptoJS */

/**
 * The actual password generator (the engine room)
 */

(function(jk, _) {

	 "use strict";

	jk.core = (function(settings, crypt)
	{
		function generate(masterPassword, input, algorithm, length, alphabetSets, modifier, mustUseCharactersFromAllSets)
		{
			var result;

			var masterKey = makeMasterKey(masterPassword);

			result = _generate(masterKey, input, algorithm, length, alphabetSets, modifier);

			// Only enforce characters from all alphabet sets if the length
			// of the password is actually enough to hold a character from each set.
			mustUseCharactersFromAllSets = mustUseCharactersFromAllSets && length >= alphabetSets.length;

			if (mustUseCharactersFromAllSets)
			{
				result = ensureCharactersFromAllSets(result, alphabetSets);
			}

			return result;
		}

		function makeMasterKey(password)
		{
			if (!settings.useKdf())
			{
				// No key-derivation - just use password
				return password;
			}

			// Note that our key derivation function does caching of keys, even in the case where
			// Chrome extension lifetime undermines SJCL's own cache.

			var kdf = settings.kdf();
			var iterations = settings.kdfIterations();
			var salt = settings.kdfSalt();
			
			var key;			
			switch (kdf)
			{
				case "pbkdf2-sha-256":
					key = crypt.strPbkdf2(password, salt, iterations, 256);
					break;
				default:
					throw "Unknown key derivation function: " + kdf;
			}

			return key;
		}

		function ensureCharactersFromAllSets(value, alphabetSets)
		{
			var chars = value.split("");

			// Create map for each alphabet set used in the value:
			// - index of characters from the set (index)
			// - the actual characters used (chr)
			var usedSets = _(chars)
				.chain()
				.map(function(chr, index)
				{
					return {
						index: index,
						chr: chr,
						set: _.find(alphabetSets, function(set) {
							return set.indexOf(chr) >= 0;
						}),
					};
				})
				.groupBy("set")
				.value();

			// Find alphabet sets missing from result:
			var missingSets = _(alphabetSets).filter(function(set) { return typeof usedSets[set] === "undefined"; });

			// For each missing set, replace first char of most occurring
			// set with equivalent char from the missing set:
			_(missingSets).each(function(set) {
				var setToReplace = _(usedSets).max(function(usedSet) { return usedSet.length; });
				var charToReplace = setToReplace.shift();
				var index = charToReplace.index;
				var oldValue = charToReplace.set.indexOf(charToReplace.chr);
				var newValue = oldValue % set.length;
				value = value.substr(0, index) + set.charAt(newValue) + value.substr(index + 1);
			});

			return value;
		}

		function _generate(masterPassword, input, algorithm, length, alphabetSets, modifier)
		{
			var alphabet = alphabetSets.join("");
			
			input = input || "";
			input += modifier || "";

			var result = "";

			// To support any length, even exceeding the hash size, we may do multiple iterations.
			// The first iteration uses the plain input value as "message" for the hash, second iteration
			// appends "1", third iteration "2", etc.
			var iterationNumber = 1;
			while (result.length < length)
			{
				// Add iteration number if not first iteration:
				var message = input + (iterationNumber > 1 ? iterationNumber : "");
				
				// Hash a password value based on master password (key) and the input (message, e.g. domain name)
				var hash = getHash(algorithm.name, message, masterPassword, algorithm.hmac);

				result += hashToAlphabet(hash.words, alphabet);

				iterationNumber++;
			}

			return result.substring(0, length);
		}

		function getHash(algorithmName, message, key, useHMAC)
		{
			var algorithm;
			var cfg;
			switch (algorithmName)
			{
				case "sha1": 		algorithm = CryptoJS.algo.SHA1; break;
				
				case "sha2-224": 	algorithm = CryptoJS.algo.SHA224; break;
				case "sha2-256": 	algorithm = CryptoJS.algo.SHA256; break;
				case "sha2-384": 	algorithm = CryptoJS.algo.SHA384; break;
				case "sha2-512": 	algorithm = CryptoJS.algo.SHA512; break;

				case "keccak-224":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 224 }; break;
				case "keccak-256":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 256 }; break;
				case "keccak-384":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 384 }; break;
				case "keccak-512":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 512 }; break;

				case "sha3-224":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 224, spec: true }; break;
				case "sha3-256":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 256, spec: true }; break;
				case "sha3-384":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 384, spec: true }; break;
				case "sha3-512":	algorithm = CryptoJS.algo.SHA3; cfg = { outputLength: 512, spec: true }; break;

				case "ripemd-160": 	algorithm = CryptoJS.algo.RIPEMD160; break;
				default: 			throw "Unknown hash algorithm";
			}

			if (useHMAC)
			{
				/*if ([SHA3_224, SHA3_256, SHA3_384].indexOf(algorithmName) >= 0)
				{
					throw "HMAC for SHA-3 is only supported for 512 bit hash length";
				}*/
				var hmacAlgo = CryptoJS.algo.HMAC.create(algorithm, key, cfg);
				return hmacAlgo.finalize(message);
			}
			else
			{
				var input = key ? key + message : message;
				var algo = algorithm.create(cfg);
				return algo.finalize(input);
			}
		}

		function hashToAlphabet(hash, alphabet)
		{
			// Convert integral hash array to alphabet.
			// In a language/framework with native support for big integers, the algorithm
			// is simply to repeatedly divide the hash array (interpreted as a big-endian big integer)
			// by the alphabet length, and using the division remainder (modulo) as index into the
			// alphabet array. Here, we do it manually by long division.
			var result = "";
			var alphabetLength = alphabet.length;
			var hashLength = hash.length;
			var startIndex = 0;

			while (startIndex < hashLength)
			{
				var remainder = 0;
				for (var index = startIndex; index < hashLength; index++)
				{
					// The maximum accurate integer value in JavaScript is 9007199254740992.
					// The maximum value we'll get here is 4294967296 + alphabetLength * 4294967296.
					// In other words, we'll be safe up to an alphabet length of:
					// 9007199254740992 = (alphabetLength + 1) * 4294967296 =>
					// alphabetLength + 1 = 9007199254740992 / 4294967296 = 2097152 =>
					// alphabetLength = 2097151
					//
					// That's an OK safety margin, I think.

					// CryptoJS uses signed integers - >>> 0 converts to unsigned:
					var value = (hash[index] >>> 0) + remainder * 4294967296;
					var quotient = Math.floor(value / alphabetLength);
					remainder = value % alphabetLength;
					hash[index] = quotient;
				}

				result += alphabet[remainder];

				// In the next iteration, skip all indices that have ended up zero:
				startIndex = 0;
				while (startIndex < hashLength && hash[startIndex] === 0)
				{
					startIndex++;
				}
			}
			return result;
		}

		return {
			generate: generate,
			getHash: getHash
		};
	}(jk.settings, jk.crypt));
}(window.keypunk = window.keypunk || {}, _));