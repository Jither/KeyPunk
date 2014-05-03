/* jshint node:true */

module.exports = function(grunt)
{
	"use strict";

	require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		cryptoBanner: grunt.file.read("src/scripts/crypto/_banner.js"),
		webDest: "bin/web",
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
			web: ["<%= webDest %>"],
			extension: ["<%= extensionDest %>"]
		},
		copy:
		{
			common:
			{
				files:
				[
					{ expand: true, cwd: "src/styles/", src: "*.css", dest: "<%= taskDest %>/styles/" },
					{ expand: true, cwd: "src/images/", src: "*.*", dest: "<%= taskDest %>/images/" },
					{ expand: true, cwd: "src/scripts/", src: "*.*", dest: "<%= taskDest %>/scripts/", filter: function(src) {
						return	!grunt.file.isMatch({ matchBase: true }, "jk.*.js", src)	&&
								!grunt.file.isMatch({ matchBase: true }, "ZeroClipboard.*", src);
					}},
					{ src: "src/scripts/crypto/sjcl.js", dest: "<%= taskDest %>/scripts/sjcl.js" }
				]
			},
			extension:
			{
				files:
				[
					{ src: "src/manifest.json", dest: "<%= taskDest %>/manifest.json" }
				]
			},
			web:
			{
				files:
				[
					{ expand: true, cwd: "src/scripts", src: "ZeroClipboard.*", dest: "<%= taskDest %>/scripts/" }
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
					"<%= taskDest %>/scripts/crypto.min.js":
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
			common:
			{
				files:
				{
					"<%= taskDest %>/scripts/jk.shared.min.js":
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
					"<%= taskDest %>/scripts/jk.popup.min.js":
					[
						"src/scripts/jk.ui.js",
						"src/scripts/jk.main.js"
					],
					"<%= taskDest %>/scripts/jk.options.min.js":
					[
						"src/scripts/jk.options.js"
					]
				}
			},
			extension:
			{
				files:
				{
					"<%= taskDest %>/scripts/jk.contentscript.js": ["src/scripts/jk.contentscript.js"],
					"<%= taskDest %>/scripts/jk.background.js": ["src/scripts/jk.background.js"]
				}
			}
		},
		processhtml:
		{
			options: {
				strip: true
			},
			extension: {
				files:
				{
					"<%= taskDest %>/index.html": ["src/index.html"],
					"<%= taskDest %>/options.html": ["src/options.html"]
				}
			},
			web: {
				files:
				{
					"<%= taskDest %>/index.html": ["src/index.html"],
					"<%= taskDest %>/options.html": ["src/options.html"]
				}
			}
		}
	});

	grunt.registerTask("init", "Initializes target properties", function(target) {
		var dest;
		grunt.log.writeln("Target:", target);
		switch (target)
		{
			case "web": dest = grunt.config.get("webDest"); break;
			case "extension": dest = grunt.config.get("extensionDest"); break;
		}
		grunt.log.writeln("Setting destination to:", dest);
		grunt.config.set("taskDest", dest);
	});
	
	grunt.registerTask("default", ["jshint", "htmlhint"]);
	
	grunt.registerTask("common", [
		"default",
		"copy:common",
		"uglify:crypto",
		"uglify:common"
	]);
	
	grunt.registerTask("extension", [
		"init:extension",
		"common",
		"copy:extension",
		"uglify:extension",
		"processhtml:extension"
	]);
	
	grunt.registerTask("web", [
		"init:web",
		"common",
		"copy:web",
		"processhtml:web"
	]);
	
	grunt.registerTask("clean-extension", [
		"clean:extension",
		"extension"]
	);
	
	grunt.registerTask("clean-web", [
		"clean:web",
		"web"
	]);
};