console.log(jQuery);

var key = "apikey=587705ba5ff4d0cabadddbbbe5cb3545";
var entity = "characters?";
var limit = "limit=100";
var baseUrl = "http://gateway.marvel.com:80/v1/public/";

var filter = "nameStartsWith=l"

var url = baseUrl + entity + limit + "&" + filter + "&" + key;

$.ajax({
	url: url,
	type: "GET",
	success: function(data) {
		console.log(data);
	}
})