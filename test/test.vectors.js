(function() {
	function fileChanged()
	{
		var file = this.files[0];
		var reader = new FileReader();
		reader.onload = fileRead;
		reader.readAsText(file);
	}

	function fileRead(e)
	{
		var json = e.currentTarget.result;
		var vectorCollection = JSON.parse(json);
		startTestCollection(vectorCollection);
	}

	var fileInput = $("#file");
	fileInput.change(fileChanged);
}());

var settings = {
	useKdf: false
};

function startTestCollection(vectorCollection)
{
	var alphabets = vectorCollection.alphabets;
	var testSets = vectorCollection.testSets;

	testSets.forEach(function(testSet) {
		startTestSet(testSet, alphabets);
	});
}

function profileToString(profile)
{
	return keypunk.utils.format("{0}{1} - alphabet: '{2}', useAllSets: {3}, modifier: {4}, passwordLength: {5}", 
		profile.algorithm.name,
		profile.algorithm.hmac ? " (HMAC)" : "",
		profile.alphabet.join(""),
		profile.useAllSets,
		profile.modifier,
		profile.passwordLength
	);
}

function startTestSet(testSet, alphabets)
{
	var tvProfile = testSet.profile;
	var tests = testSet.tests;

	var profile = {
		algorithm: {
			name: tvProfile.algo,
			hmac: tvProfile.hmac
		},
		alphabet: alphabets[tvProfile.alph],
		useAllSets: tvProfile.uas,
		modifier: tvProfile.mod,
		passwordLength: tvProfile.len
	};

	startTest(profile, tests);
}

function startTest(profile, tests)
{
	test(profileToString(profile), function() {
		tests.forEach(function(testItem)
		{
			var mpw = testItem.mpw;
			var vectors = testItem.vectors;
			for (var input in vectors)
			{
				equal(keypunk.core.generate(mpw, input, settings, profile), vectors[input], "master password: '" + mpw + "', input: '" + input + "'");
			}
		});
	});

}