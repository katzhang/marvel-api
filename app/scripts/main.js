console.log(jQuery);

var key = "apikey=587705ba5ff4d0cabadddbbbe5cb3545";
var entity = "characters?";
var limit = "limit=100";
var baseUrl = "http://gateway.marvel.com:80/v1/public/";

var filter = "nameStartsWith=l"

var url = baseUrl + entity + limit + "&" + filter + "&" + key;

var characters = [];

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
			var storiesNum = character.stories.available;

			thumbnailPath += "/standard_xlarge" + "." + thumbnailExt;

			characters.push({"charName": name, "value": storiesNum, "imgPath": thumbnailPath});

			// $('.marketing').append('<h6>' + name + '</h6>');
			// $('.marketing').append('<img src="' + thumbnailPath + '"/>')

		})

		characters = {name: "marvel", children: characters};
		// characters = {"children": characters};

		console.log(characters);
		bindData(characters);
	}
})

var diameter = 960;
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
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")"
		});

	node.append("title")
		.text(function(d) { return d.name + ":" + format(d.value); });

	node.append("circle")
    	.attr("r", function(d) { return d.r; })
       	.style("fill", function(d) { return addPatterns(d) });

    addPatterns

  	node.append("text")
      	.attr("dy", ".3em")
      	.style("text-anchor", "middle")
      	.text(function(d) { return d.name.substring(0, d.r / 3); });
}

function addPatterns(character) {
	defs.append('pattern')
		.attr('id', 'url' + character.imgPath)
		.attr('width', '100%')
		.attr('height', '100%')
		.append('image')
		.attr('xlink:href', character.imgPath)
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', character.r*2)
		.attr('height', character.r*2);

	return "url(/#url" + character.imgPath + ")"
}

d3.select(self.frameElement).style("height", diameter + "px");

























