console.log(jQuery);

$.ajax({
	url: "http://gateway.marvel.com:80/v1/public/characters?apikey=587705ba5ff4d0cabadddbbbe5cb3545",
	type: "GET"
})