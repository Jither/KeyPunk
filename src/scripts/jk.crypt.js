/* global sjcl */

/**
 * Encryption/decryption functions (for synced storage).
 * Also provides key derivation for both encrypt/decrypt AND master password.
 */

(function(jk) {

	"use strict";

	var KEY_LENGTH = 256,
		SALT_ITERATIONS = 2048,
		TAG_STRENGTH = 64, // Tags aren't used at the moment. In any case, 64 should be enough
		AES_MODE = "ccm";

	jk.crypt = (function(chromeHelper, utils) {

		function pbkdf2(password, salt, iterations, bitLength)
		{
			var result;

			if (chromeHelper.isExtension())
			{
				// Chrome extension lifetime will defeat sjcl's cache, so we have our own:
				var cache = chromeHelper.cache("pbkdf2");

				if (!cache)
				{
					// Create cache if it doesn't exist
					cache = {};
					chromeHelper.cache("pbkdf2", cache);
				}

				var cacheKey = utils.format("{0}::{1}::{2}", password, salt, iterations);
				var cacheEntry = cache[cacheKey];

				result = cacheEntry || sjcl.misc.pbkdf2(password, salt, iterations);
				cache[cacheKey] = result;
			}
			else
			{
				var params = {
					salt: salt,
					iter: iterations
				};

				params = sjcl.misc.cachedPbkdf2(password, params);
				result = params.key;
			}
			return result.slice(0, bitLength / 32);
		}

		function strPbkdf2(password, salt, iterations, bitLength)
		{
			if (typeof(salt) === "string")
			{
				salt = sjcl.codec.hex.toBits(salt);
			}
			var result = pbkdf2(password, salt, iterations, bitLength);
			return sjcl.codec.base64.fromBits(result);
		}

		function encrypt(password, value)
		{
			var salt = sjcl.random.randomWords(2, 0),
				iv = sjcl.random.randomWords(4, 0),
				plaintext = sjcl.codec.utf8String.toBits(value),
				adata = sjcl.codec.utf8String.toBits("");

			var key = pbkdf2(password, salt, SALT_ITERATIONS, KEY_LENGTH);

			var aes = new sjcl.cipher.aes(key);

			var ciphertext = sjcl.mode[AES_MODE].encrypt(aes, plaintext, iv, adata, TAG_STRENGTH);

			// Combine salt, IV and ciphertext into value:
			var parts = [
				sjcl.codec.base64.fromBits(salt),
				sjcl.codec.base64.fromBits(iv),
				sjcl.codec.base64.fromBits(ciphertext)
			];
			return parts.join(";");
		}

		function decrypt(password, value)
		{
			// Split value into salt, IV and ciphertext:
			var parts = value.split(";");
			if (parts.length !== 3)
			{
				throw "Cannot decrypt: Missing parts";
			}
			
			var salt = sjcl.codec.base64.toBits(parts[0]),
				iv = sjcl.codec.base64.toBits(parts[1]),
				ciphertext = sjcl.codec.base64.toBits(parts[2]),
				adata = sjcl.codec.utf8String.toBits("");

			var key = pbkdf2(password, salt, SALT_ITERATIONS, KEY_LENGTH);

			var aes = new sjcl.cipher.aes(key);
    		try
    		{
    			var plaintext = sjcl.mode[AES_MODE].decrypt(aes, ciphertext, iv, adata, TAG_STRENGTH);
      			return sjcl.codec.utf8String.fromBits(plaintext);
    		}
    		catch (e)
    		{
    			throw "Cannot decrypt: " + e;
    		}

    		return null;
		}

		return {
			pbkdf2: pbkdf2,
			strPbkdf2: strPbkdf2,
			encrypt: encrypt,
			decrypt: decrypt
		};
	}(jk.chrome, jk.utils));
}(window.keypunk = window.keypunk || {}));