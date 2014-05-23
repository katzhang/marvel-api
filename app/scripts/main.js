var Marvel = {

	config: {
		key: "587705ba5ff4d0cabadddbbbe5cb3545",
		baseUrl: "http://gateway.marvel.com:80/v1/public/",
		limit: "100",
		imgFormat: "standard_xlarge"
	},

	data: {
		characters: [],
		series: []
	},

	apiCall: function(url, callBack, filter) {

		var settings = {
			url: url,
			cache: true,
			success: function(data) {
				callBack(data);
			}
		};

		if(filter) settings[dataFilter] = filter;

		return $.ajax(settings);
	},

	parseData: function(data, output, outputKeys) {
		var results = data.data.results;

		results.forEach(function(result) {

		})
	}

}

var key = "apikey=587705ba5ff4d0cabadddbbbe5cb3545";
var entity = "characters?";
var limit = "limit=100";
var baseUrl = "http://gateway.marvel.com:80/v1/public/";

var url = baseUrl + entity + limit  + "&" + key;

var characters = [];

var dataParsed = [];

// var seriesYear = [{date: '2001', close: 10}, {date: '2004', close: 12}, {date: '2007', close: 15}];

function ajaxCall(filterLetter, offset) {

	var filter = "nameStartsWith=" + filterLetter;
	var filteredUrl = !offset ? url + "&" + filter : url + "&" + filter + "&offset=" + offset;

	return $.ajax({

	   xhr: function() {
	        var xhr = new window.XMLHttpRequest();

	       xhr.addEventListener("progress", function(e) {
				var percent = e.loaded / e.position * 100;
		        $('.progress-bar').attr('aria-valuenow', percent);
		        $('.progress-bar').css('width', percent + '%');
	       }, false);

	       return xhr;
	    },
		url: filteredUrl,
		beforeSend: function(XHR) {
			XHR.onprogress = function(e) {
				console.log(e.loaded);
			}
		},
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
		// xhrFields: {
		// 	onprogress: function(e) {

		// 		console.log(e);
		// 		console.log(e.loaded/e.position * 100);
		// 	}
		// },
		success: function(data, status, XHR) {
			var results = data.data.results;

			// console.log(XHR.getAllResponseHeaders());

			results.forEach(function(character) {
				var name = character.name;
				var des = character.description;
				var charId = character.id;
				var thumbnailPath = character.thumbnail.path;
				var thumbnailExt = character.thumbnail.extension;
				var storiesNum = character.stories.available;

				thumbnailPath += "/standard_xlarge" + "." + thumbnailExt;

				characters.push({"charName": name, "charId": charId,"value": storiesNum, "imgPath": thumbnailPath});

				dataParsed.push(character);

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
		.attr("data-toggle", "modal")
		.attr("data-target", ".bs-example-modal-lg")
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

var seriesParsed = [];
var ajaxSeriesCalls = [];

$('svg').on('click', 'g', function(e) {
	var charId = $(this).data('char-id');
	var character;

	console.log(charId);
	$('.modal-content').html(charId);


	for(var i = 0; i < dataParsed.length; i++) {
		if(dataParsed[i].id == charId) {
			character = dataParsed[i];
		}
	}

	var eventsUrl = character.series.collectionURI;
	var url = eventsUrl + "?" + key + '&limit=100';
	var total;

	$.ajax({
		url: url,
		type: "GET",
		success: function(data) {
			console.log(data)
			total = data.data.total;
			console.log(total);
			parseSeriesHelper(data);

			for(var i = 1; i < total/100; i++) {
				ajaxSeriesCalls.push(callSeries(url, total, i));
			}

			$.when.apply(this, ajaxSeriesCalls).done(function() {
				var lineData = parseSeries();
				lineChart(lineData, '.modal-content');
			})

			// callSeries(url, total);
		}
	})


})


function callSeries(url, total, i) {

	// for(var i = 1; i < total/100; i++) {
	return $.ajax({
			url: url + '&offset=' + i*100,
			type: "GET",
			success: function(data) {
				console.log(data)
				console.log('total: ' + total);
				parseSeriesHelper(data);

				// if(i > total/100) {
				// 	console.log('larger than');
				// 	var lineData = parseSeries();
				// 	lineChart(lineData, '.modal-content');
				// }
			}
		})
	// }


}


function countProp(array) {
	var output = [];

	for(var i = 0; i < array.length; i++) {
		var obj = array[i];

		var needNew = output.every(function(el, index) {
						return el['date'] != obj.seriesStartYear;
					});

		if(needNew) {
			output.push({date: obj.seriesStartYear.toString(), close: 1});
		} else {
			output.forEach(function(el, index) {
				if(el.date == obj.seriesStartYear) {
					el.close += 1;
				}
			})
		}
		

	}

	return output;
}

function parseSeriesHelper(data) {
	var series = data.data.results;

	series.forEach(function(serie) {
		var title = serie.title;
		var id = serie.id;
		var startYear = serie.startYear;

		seriesParsed.push({seriesTitle: title, seriesId: id, seriesStartYear: startYear});
	})

	console.log(seriesParsed);
}


function parseSeries() {

	var lineData = countProp(seriesParsed);

	lineData.sort(function(a,b) {
		return a.date - b.date;
	})

	return lineData;
}

function lineChart(data, context) {
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
	    width = 960 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	var parseDate = d3.time.format("%Y").parse;

	// var parseDate = d3.time.format("%d-%b-%y").parse;

	var x = d3.time.scale()
	    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left");

	var line = d3.svg.line()
	    .x(function(d) { return x(d.date); })
	    .y(function(d) { return y(d.close); });

	var svg = d3.select(context).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	data.forEach(function(d) {
		d.date = parseDate(d.date);
		d.close = +d.close;

	})



	  x.domain(d3.extent(data, function(d) { console.log(d); return d.date; }));
	  y.domain(d3.extent(data, function(d) { return d.close; }));

	  svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	  svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Price ($)");

	  svg.append("path")
	      .datum(data)
	      .attr("class", "line")
	      .attr("d", line);
}


























