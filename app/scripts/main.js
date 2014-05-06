console.log(jQuery);

var key = "apikey=587705ba5ff4d0cabadddbbbe5cb3545";
var entity = "characters?";
var limit = "limit=100";
var baseUrl = "http://gateway.marvel.com:80/v1/public/";

var filter = "nameStartsWith=l"

var url = baseUrl + entity + limit + "&" + filter + "&" + key;

$.ajax({
	url: url,
	cache: true,
	dataFilter: function(data, type) {
		if(type === 'json') {
			var parsed = JSON.parse(data);
			var chars = parsed.data.results;
			chars = $.grep(chars, function(char, i) {
				if(char.thumbnail.path.match("available")) {
					return false;
				}
				return true;
			})
			parsed.data.results = chars;
		}

		return JSON.stringify(parsed);
	},
	dataType: "json",
	type: "GET",
	success: function(data) {
		var chars = data.data.results;
		console.log(chars);

		chars.forEach(function(character) {
			var name = character.name;
			var des = character.description;
			var thumbnailPath = character.thumbnail.path;
			var thumbnailExt = character.thumbnail.extension;

			thumbnailPath += "/portrait_small" + "." + thumbnailExt;
			$('.marketing').append('<h6>' + name + '</h6>');
			$('.marketing').append('<img src="' + thumbnailPath + '"/>')

		})
	}
})