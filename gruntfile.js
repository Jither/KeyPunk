module.exports = function(grunt)
{
	require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		cryptoBanner: grunt.file.read("src/scripts/crypto/_banner.js"),

		htmlhint:
		{
			build:
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
			}
		},
		jshint:
		{
			build:
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
			}
		},
		uglify:
		{
			build:
			{
				options:
				{
					banner: "<%= cryptoBanner %>"
				},
				files:
				{
					"src/scripts/crypto/crypto.min.js":
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
			}
		}
	});

	grunt.registerTask("default", []);
};