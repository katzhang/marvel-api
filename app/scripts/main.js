var Ma = {

	config: {
		alphabet: "abcdefghijklmnopqrstuvwxyz",
		baseUrl: "http://gateway.marvel.com:80/v1/public/",
		key: "587705ba5ff4d0cabadddbbbe5cb3545",
		limit: "100",
		imgFormat: "standard_xlarge",
		charDataKeys: [
			'name',
			'description',
			'id',
			['thumbnail', 'path'],
			['thumbnail', 'extension'],
			['stories', 'available'],
			['series', 'collectionURI']
		]
	},

	data: {
		characters: [],
		series: []
	},

	ajaxCalls: [],
	ajaxSeriesCalls: [],

	apiCall: function(url, callBack, dataFilter) {
		var settings = {
			url: url,
			cache: true,
			dataType: "json",
			success: function(data) {
				callBack(data);
			}
		};
		if(dataFilter) settings['dataFilter'] = dataFilter;
		return $.ajax(settings);
	},

	dataFilter: function(data, type) {
		if(type === 'json') {
			var parsed = JSON.parse(data);
			var chars = parsed.data.results;
			chars = $.grep(chars, function(char, i) {
				if(char.thumbnail && char.thumbnail.path.match("available")) {
					return false;
				}
				return true;
			})
			parsed.data.results = chars;
		}

		return JSON.stringify(parsed);
	},

	generateUrl: function(entity, filter, offset) {
		var url = Ma.config.baseUrl + entity + 'limit=' + Ma.config.limit + '&' + 'apikey=' + Ma.config.key + '&' + filter;
		return offset ? url + offset : url;
	},

	parseCharData: function(data, valueKey) {
		var results = data.data.results;
		var outputKeys = Ma.config.charDataKeys;

		results.forEach(function(result) {
			var parsedResult = {};
			outputKeys.forEach(function(key) {
				if(Array.isArray(key) && result[key[0]]) {
					parsedResult[key[0] + key[1]] = result[key[0]][key[1]];
				} else {
					parsedResult[key] = result[key];
				}
			})

			parsedResult['value'] = result.stories.available;

			Ma.data.characters.push(parsedResult);
		})
	},

	bindBubbleData: function(data) {
		var diameter = 1024;
		var cbDiameter = $('.character-bubbles').height();
		var format = d3.format(",d");
		var color = d3.scale.category20c();

		var bubble = d3.layout.pack()
			.sort(null)
			.size([cbDiameter, cbDiameter])
			.padding(1.5);

		var svg = d3.select(".character-bubbles").append("svg")
			.attr("width", cbDiameter)
			.attr("height", cbDiameter)
			.attr("class", "bubble");

		var defs = svg.append('svg:defs');

		var node = svg.selectAll(".node")
			.data(bubble.nodes(data)
	      	.filter(function(d) { return !d.children; }))
			.enter().append("g")
			.attr("class", "node")
			.attr("data-char-id", function(d) { return d.id })
			.attr("data-toggle", "modal")
			.attr("data-target", ".bs-example-modal-lg")
			.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")"
			});

		node.append("title")
			.text(function(d) { return d.name + ":" + format(d.storiesavailable); });

		node.append("circle")
	    	.attr("r", function(d) { return d.r; })
	       	.style("fill", function(d) { return Ma.addPatternsToBubble(defs, d) });

	    d3.select(self.frameElement).style("height", cbDiameter + "px");
	},

	addPatternsToBubble: function(defs, character) {
		defs.append('pattern')
			.attr('id', character.id)
			.attr('width', '100%')
			.attr('height', '100%')
			.append('image')
			.attr('xlink:href', character.thumbnailpath + '/' + Ma.config.imgFormat + '.' + character.thumbnailextension)
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', character.r*2)
			.attr('height', character.r*2);

		return "url(/#" + character.id + ")"
	},

	init: function() {
		var alphabetArray = Ma.config.alphabet.split('');

		for(var i = 0; i < alphabetArray.length; i++) {
			var callUrl = Ma.generateUrl('characters?', 'nameStartsWith=' + alphabetArray[i]);
			var call = Ma.apiCall(callUrl, Ma.parseCharData, Ma.dataFilter);
			Ma.ajaxCalls.push(call);
		}

		var altUrl = Ma.generateUrl('characters?', 'nameStartsWith=s', '&offset=100');

		Ma.ajaxCalls.push(Ma.apiCall(altUrl, Ma.parseCharData, Ma.dataFilter));

		$.when.apply(Ma, Ma.ajaxCalls).done(function() {
			console.log(Ma.data.characters);
			Ma.bindBubbleData({name: 'marvel', children: Ma.data.characters});
			Ma.seriesEventHandler();
		})

	},

	callSeries: function(url, total, i, charId) {
		return $.ajax({
				url: url + '&offset=' + i*100,
				type: "GET",
				success: function(data) {
					console.log(data)
					console.log('total: ' + total);
					Ma.parseSeriesDataHelper(data, charId);
				}
			})
	},

	parseSeriesDataHelper: function(data, charId) {
		var series = data.data.results;

		series.forEach(function(serie) {
			var title = serie.title;
			var id = serie.id;
			var startYear = serie.startYear;

			if(startYear > 0) {
				Ma.data.series[charId].push({seriesTitle: title, seriesId: id, seriesStartYear: startYear});
			}

		})

		console.log(Ma.data.series);
	},

	parseSeriesData: function(charId) {
		var lineData = Ma.countProp(Ma.data.series[charId]);
		lineData.sort(function(a,b) {
			return a.date - b.date;
		})
		return lineData;
	},

	countProp: function(array) {
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
	},

	bindLineChart: function(data, context) {
		var margin = {top: 20, right: 20, bottom: 30, left: 50},
		    // width = 960 - margin.left - margin.right,
		    // height = 500 - margin.top - margin.bottom;

			width = $('.modal-content').width() - margin.left - margin.right, height = 400;

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

		  console.log(width);
		  console.log(height);

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

	},

	seriesEventHandler: function() {
		$('svg').on('click', 'g', function(e) {
			var charId = $(this).data('char-id');
			var charData = Ma.data.characters;
			var character;

			console.log(charId);
			$('.modal-content').html(charId);


			for(var i = 0; i < charData.length; i++) {
				if(charData[i].id == charId) {
					character = charData[i];
				}
			}

			var eventsUrl = character.seriescollectionURI;
			var url = eventsUrl + "?" + 'apikey=' + Ma.config.key + '&limit=100';
			console.log(url);
			var total;

			$.ajax({
				url: url,
				dataType: "json",
				type: "GET",
				success: function(data, charId) {
					console.log(data)
					total = data.data.total;
					Ma.data.series[charId] = [];
					console.log(total);
					Ma.parseSeriesDataHelper(data, charId);

					for(var i = 1; i < total/100; i++) {
						Ma.ajaxSeriesCalls.push(Ma.callSeries(url, total, i, charId));
					}

					$.when.apply(this, Ma.ajaxSeriesCalls).done(function() {
						var lineData = Ma.parseSeriesData(charId);
						Ma.bindLineChart(lineData, '.modal-content');
					})

					// callSeries(url, total);
				}
			})


		})
	}

}



Ma.init();



























