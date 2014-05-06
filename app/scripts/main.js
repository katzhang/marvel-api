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

			thumbnailPath += "/portrait_small" + "." + thumbnailExt;

			characters.push({name: name, value: storiesNum, imgPath: thumbnailPath});

			$('.marketing').append('<h6>' + name + '</h6>');
			$('.marketing').append('<img src="' + thumbnailPath + '"/>')

		})

		console.log(characters);
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

function bindData(charsData) {
	var node = svg.selectAll(".node")
		.data(bubble.nodes(charsData)
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("title")
		.text(function(d) { return d.className + ":" + format(d.value); });

	node.append("circle")
    	.attr("r", function(d) { return d.r; })
       	.style("fill", function(d) { return color(d.packageName); });

  	node.append("text")
      	.attr("dy", ".3em")
      	.style("text-anchor", "middle")
      	.text(function(d) { return d.className.substring(0, d.r / 3); });
}

bindData(characters);

// function classes(root) {
//   var classes = [];

//   function recurse(name, node) {
//     if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
//     else classes.push({packageName: name, className: node.name, value: node.size});
//   }

//   recurse(null, root);
//   return {children: classes};
// }

d3.select(self.frameElement).style("height", diameter + "px");

























