/* jshint node:true */

module.exports = function(grunt)
{
	"use strict";

	require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		cryptoBanner: grunt.file.read("src/scripts/crypto/_banner.js"),
		extensionDest: "bin/chrome-extension",

		htmlhint:
		{
			options:
			{
				"tag-pair": true,
				"tagname-lowercase": true,
				"attr-lowercase": true,
				"attr-value-double-quotes": true,
				"doctype-first": true,
				"spec-char-escape": true,
				"id-unique": true,
				"head-script-disabled": true,
				"style-disabled": true
			},
			src: ["src/index.html", "src/options.html"]
		},
		jshint:
		{
			options:
			{
				camelcase: true,
				curly: true,
				eqeqeq: true,
				freeze: true,
				immed: true,
				indent: true,
				latedef: "nofunc",
				newcap: true,
				noarg: true,
				nonew: true,
				// disabled because jshint doesn't support consistently using double quotes - but single quotes when string is HTML
				// quotmark: "double",
				undef: true,
				unused: true,
				strict: true,
				trailing: true,

				browser: true,
				jquery: true,

				globals:
				{
					"_": true,
				}
			},
			files:
			{
				src:
				[
					"gruntfile.js",
					"src/scripts/jk.*.js",
					"test/test.*.js"
				]
			}
		},
		clean:
		{
			extension: ["<%= extensionDest %>"]
		},
		copy:
		{
			extension:
			{
				files:
				[
					{ src: "src/manifest.json", dest: "<%= extensionDest %>/manifest.json" },
					{ expand: true, cwd: "src/styles/", src: "*.css", dest: "<%= extensionDest %>/styles/" },
					{ expand: true, cwd: "src/images/", src: "*.*", dest: "<%= extensionDest %>/images/" },
					{ expand: true, cwd: "src/scripts/", src: "*.*", dest: "<%= extensionDest %>/scripts/", filter: function(src) { return !grunt.file.isMatch({ matchBase: true }, "jk.*.js", src); } },
					{ src: "src/scripts/crypto/sjcl.js", dest: "<%= extensionDest %>/scripts/sjcl.js" }
				]
			}
		},
		uglify:
		{
			crypto:
			{
				options:
				{
					banner: "<%= cryptoBanner %>"
				},
				files:
				{
					"<%= extensionDest %>/scripts/crypto.min.js":
					[
						"src/scripts/crypto/core.js",
						"src/scripts/crypto/x64-core.js",
						"src/scripts/crypto/hmac.js",
						"src/scripts/crypto/ripemd160.js",
						"src/scripts/crypto/sha1.js",
						"src/scripts/crypto/sha256.js",
						"src/scripts/crypto/sha512.js",
						"src/scripts/crypto/sha224.js",
						"src/scripts/crypto/sha384.js",
						"src/scripts/crypto/sha3.js"
					]
				}
			},
			extension:
			{
				files:
				{
					"<%= extensionDest %>/scripts/jk.shared.min.js":
					[
						"src/scripts/jk.constants.js",
						"src/scripts/jk.utils.js",
						"src/scripts/jk.chrome.js",
						"src/scripts/jk.log.js",
						"src/scripts/jk.crypt.js",
						"src/scripts/jk.storage.js",
						"src/scripts/jk.settings.js",
						"src/scripts/jk.core.js",
						"src/scripts/jk.profiles.js",
						"src/scripts/jk.dialogs.js"
					],
					"<%= extensionDest %>/scripts/jk.popup.min.js":
					[
						"src/scripts/jk.ui.js",
						"src/scripts/jk.main.js"
					],
					"<%= extensionDest %>/scripts/jk.options.min.js":
					[
						"src/scripts/jk.options.js"
					]
				}
			}
		},
		processhtml:
		{
			extension:
			{
				files:
				{
					"<%= extensionDest %>/index.html": ["src/index.html"],
					"<%= extensionDest %>/options.html": ["src/options.html"]
				}
			}
		}
	});

	grunt.registerTask("default", ["jshint", "htmlhint"]);
	grunt.registerTask("extension", ["jshint", "htmlhint", "copy:extension", "uglify:crypto", "uglify:extension", "processhtml:extension"]);
	grunt.registerTask("clean-extension", ["clean:extension", "extension"]);
};