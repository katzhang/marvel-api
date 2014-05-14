console.log(jQuery);

var key = "apikey=587705ba5ff4d0cabadddbbbe5cb3545";
var entity = "characters?";
var limit = "limit=100";
var baseUrl = "http://gateway.marvel.com:80/v1/public/";

var url = baseUrl + entity + limit  + "&" + key;

var characters = [];

var dataParsed;

function ajaxCall(filterLetter, offset) {

	var filter = "nameStartsWith=" + filterLetter;
	var filteredUrl = !offset ? url + "&" + filter : url + "&" + filter + "&offset=" + offset;

	console.log(filteredUrl);

	return $.ajax({
		url: filteredUrl,
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
			console.log(data);
			dataParsed = data.data.results;

			dataParsed.forEach(function(character) {
				var name = character.name;
				var des = character.description;
				var charId = character.id;
				var thumbnailPath = character.thumbnail.path;
				var thumbnailExt = character.thumbnail.extension;
				var storiesNum = character.stories.available;

				thumbnailPath += "/standard_xlarge" + "." + thumbnailExt;

				characters.push({"charName": name, "charId": charId,"value": storiesNum, "imgPath": thumbnailPath});

			})
		}
	})
}

function init() {
	var alphabet = "abcdefghijklmnopqrstuvwxyz".split('');
	var ajaxCalls = [];

	for(var i = 0; i < alphabet.length; i++) {
		ajaxCalls.push(ajaxCall(alphabet[i]));
	}

	ajaxCalls.push(ajaxCall('s', 100))

	$.when.apply(this, ajaxCalls).done(function() {
		console.log(characters);
		console.log(dataParsed);
		bindData({name: 'marvel', children: characters});
	})
}

init();


// $.when(ajaxCall('s'), ajaxCall('s', 100)).done(function() {
// 	console.log(characters);
// 	bindData({name: 'marvel', children: characters});
// })

var diameter = 1024;
var format = d3.format(",d");
var color = d3.scale.category20c();

var bubble = d3.layout.pack()
	.sort(null)
	.size([diameter, diameter])
	.padding(1.5);

var svg = d3.select("body").append("svg")
	.attr("width", diameter)
	.attr("height", diameter)
	.attr("class", "bubble");

var defs = svg.append('svg:defs');

// console.log(bubble.nodes(characters));

function bindData(charsData) {
	var node = svg.selectAll(".node")
		.data(bubble.nodes(charsData)
      	.filter(function(d) { return !d.children; }))
		.enter().append("g")
		.attr("class", "node")
		.attr("data-char-id", function(d) { return d.charId })
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")"
		});

	node.append("title")
		.text(function(d) { return d.charName + ":" + format(d.value); });

	node.append("circle")
    	.attr("r", function(d) { return d.r; })
       	.style("fill", function(d) { return addPatterns(d) });
}

function addPatterns(character) {
	defs.append('pattern')
		.attr('id', character.charId)
		.attr('width', '100%')
		.attr('height', '100%')
		.append('image')
		.attr('xlink:href', character.imgPath)
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', character.r*2)
		.attr('height', character.r*2);

	return "url(/#" + character.charId + ")"
}

d3.select(self.frameElement).style("height", diameter + "px");

$('svg').on('click', 'g', function() {
	console.log('g clicked');
	var charId = $(this).data('char-id');
	var character;
	console.log(charId);


	// for(var i = 0; i < dataParsed.length; i++) {
	// 	if(dataParsed[i].id === charId) {
	// 		console.log('id same');
	// 		character = dataParsed[i];
	// 	}
	// }

	// var eventsUrl = character.events.collectionURI;

	$.ajax({
		url: "http://gateway.marvel.com:80/v1/public/characters/1009610/series" + "?" + key,
		type: "GET",
		success: function(data) {
			parseSeries(data);
		}
	})

})


function parseSeries(data) {
	var series = data.data.results;
	var seriesParsed = [];

	series.forEach(function(serie) {
		var title = serie.title;
		var id = serie.id;
		var startYear = serie.startYear;

		seriesParsed.push({seriesTitle: title, seriesId: id, seriesStartYear: startYear});
	})

	console.log(seriesParsed);
}

























