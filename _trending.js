(function(window, document, undefined) {
	'use strict';

	angular.module('trending_widget_app', ['nvd3'])
	.config(['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	}])
	.config(function(widgetsProvider) {
		widgetsProvider.addServiceToShare('dashboard_widget_service', {
			'remove_widget': 2,
			"set_extent": 2,
			"get_timelines": 0
		});
	})
	.controller('trending_widget_controller', trending_widget_controller);

	trending_widget_controller.$inject = ['$scope', '$interval', '$http', 'dashboard_widget_service']; //, 'widgetConfig'
	function trending_widget_controller($scope, $interval, $http, dashboard_widget_service) { //, widgetConfig
//		$scope.timelines = dashboard_widget_service.get_timelines();
		$scope.remove_widget = function() {
			dashboard_widget_service.remove_widget("trending");
		};

		$scope.graph_data = null;
/*
[{ // "Sensitive Data",
	"date": "2012-07-20", "bucket": 800, "count": 119
}, { // "Sensitive Data"
	"date": "2012-07-21", "bucket": 800, "count": 123
}, { // "Sensitive Data"
	"date": "2012-07-22", "bucket": 800, "count": 198
}, { // "Data Usage"
	"date": "2012-07-20", "bucket": 900, "count": 123,
}, {
	"date": "2012-07-21", "bucket": 900, "count": 165,
}, {
	"date": "2012-07-22", "bucket": 900, "count": 83,
}, {// "Protected System"
	"date": "2012-07-20", "bucket": 1000, "count": 113,
}, {
	"date": "2012-07-21", "bucket": 1000, "count": 265,
}, {
	"date": "2012-07-22", "bucket": 1000, "count": 53,
}];
//*/

		function CreateTrendingTooltip(){
			var _svg = d3.select("#trending_div").selectAll("svg");
			var _tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function(d) {
					var span_color = "<span style='color:red'>"
					if( d.count > 0){
						span_color = "<span style='color:white'> Count: ";
						return span_color + d.count + "</span>";
					}
					else {
						return span_color + "inactive </span>";
					}
				})
			;
			if(_svg && _tip){
				_svg.call(_tip);
			}
			return _tip;
		}
		function NavigateToAlternatePage(){
			window.location="/events/";
		}

		$scope.trending_tooltip = null;

		$scope.get_data = function(){
			var promise = $http({
				method: 'GET',
			    //url: '/Content/Scripts/Dummy/trending.json',
				url: '/site_survey/get_trending_instance/',
				responseType: 'json'
			});
			promise.then(function (response) {
				$scope.graph_data = response.data;
				$scope.init_heatmap();
			}, function (rejection) {});
		}

        // SOURCE: http://bl.ocks.org/mbostock/3202354
		$scope.init_heatmap = function () {

//			console.log("[trending_js/init_heatmap]");

		    var margin = { top: 20, right: 130, bottom: 20, left: 150 },
            width  = 550 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;
			var LEGEND_WIDTH = 40, TILE_PAD = 4, TARGET_LEGEND = 4;
			var graph_data = [];

		    // The size of the buckets in the CSV data file.
		    // This could be inferred from the data if it weren't sparse.
		    var xStep = 1/*864e5,*/;//, yStep = 100;

			if(document.getElementById("trending_div") != null) {
				var boundingRect = document.getElementById("trending_div").getBoundingClientRect();
				width  = boundingRect.width - margin.left - margin.right - LEGEND_WIDTH;
			}

			function process_json_data(){
				for( var i = 0; i < $scope.graph_data.length; i++){
					if($scope.graph_data[i].count)
					for(var j = 0; j < $scope.graph_data[i].count.length; j++){
						var data_to_push = {};
						data_to_push.hour   = j;
						data_to_push.bucket = $scope.graph_data[i].bucket;
						data_to_push.count  = $scope.graph_data[i].count[j];
						graph_data.push(data_to_push);
					}
				}

				// Coerce the CSV data to the appropriate types.
				graph_data.forEach(function(d) {
					d.hour   = d.hour;
					d.bucket = d.bucket; //+
					d.count  = +d.count;
				});

//				console.log("graph_data is length: " + graph_data.length);
			} process_json_data();

		    var x = d3.scale.linear().range([0, width]), //d3.time.scale().range([0, width]),
				y = d3.scale.ordinal().rangeRoundBands([height, 0], .1)
//				y = d3.scale.linear().range([height, 0]),
				//changes to the colors have been made quantitive scales
			;

			var hour_extend = d3.extent(graph_data, function (d) {  return d.hour; });
//			var bucket_extend = d3.extent(graph_data, function (d) {  return d.bucket; });

			var test_domain_max = d3.max(graph_data, function (d) { return d.count; });
			test_domain_max = test_domain_max - (test_domain_max % TARGET_LEGEND);

		    // Compute the scale domains.
		    x.domain( hour_extend );
		    y.domain( graph_data.map( function(d){ return d.bucket } ) ); // y.domain( bucket_extend );

		    // Extend the x- and y-domain to fit the last bucket.
		    // For example, the y-bucket 3200 corresponds to values [3200, 3300].
		    x.domain([x.domain()[0], +x.domain()[1] + xStep]);
//		    y.domain([y.domain()[0],  y.domain()[1] + yStep]);

            var z = d3.scale.threshold().domain( [(0 * test_domain_max / 4),  //linear
				                                (1 * test_domain_max / 4),
				                                (2 * test_domain_max / 4),
				                                (3 * test_domain_max / 4)] )
			    //blue scheme
				//.range(["white", "lightskyblue", "dodgerblue", "mediumblue", "navy"]);
				//lighter greys
//				.range(["white", "#EDEDED", "#DEDEDE", "#D3D3D3", "#C9C9C9"])
				.range(["white", "#D3D3D3", "#C9C9C9", "#A0A0A0", "#777777"])

			;
			var color_to_class_name_mapper = function(c){
				switch(c){
					case "#EDEDED": return "color_class_1";
					case "#DEDEDE": return "color_class_2";
					case "#D3D3D3": return "color_class_3";
					case "#C9C9C9": return "color_class_4";
					case "#A0A0A0": return "color_class_5";
					case "#777777": return "color_class_6";
					default: return c;
				}
			}

		    var svg = d3.select("#trending_div").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom ) //+ height_buffer)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			if(!$scope.trending_tooltip) $scope.trending_tooltip = CreateTrendingTooltip();


		    // Display the tiles for each non-zero bucket.
		    // See http://bl.ocks.org/3074470 for an alternative implementation.

		    svg.selectAll(".trending_tile")
				.data(graph_data)
				.enter().append("rect")
					.attr("class", function(d){ //classed({
						var c = "trending_tile";
						c += (" " + color_to_class_name_mapper( z(d.count) ) );
						return c;
					})
					.attr("x", function (d) { return x(d.hour) + TILE_PAD; })
					.attr("y", function (d) { return y(d.bucket); })// + yStep); })
					.attr("width", x(xStep) - x(0) - TILE_PAD )
					.attr("height", y.rangeBand() - TILE_PAD ) //y(0) - y(yStep)
					.style("fill", function (d) { return z(d.count); })
//					.style("fill", function (d) { return z_domain(d.count); }) //ordiColor
					//////
					.style("stroke", "white")
					.style("stroke-width", 0)
					.on("click", function(d,i){ NavigateToAlternatePage(); } )
					.on("mouseover", function(d,i){
						$scope.trending_tooltip.show(d, document.getElementById("title-header"));
						d3.select(this).style("stroke", "black");
						d3.select(this).style("stroke-width", 2);
					})
					.on("mouseout",  function(d,i){
						$scope.trending_tooltip.hide(d);
						d3.select(this).style("stroke", "white");
						d3.select(this).style("stroke-width", 0);
					})
			;

			var legendX = width+LEGEND_WIDTH;
			var legendY = height/2;
		    // Add a legend for the color values
		    var legend = svg.selectAll(".legend")
							.data( z.domain() ) // .data( z.ticks(6).slice(1).reverse() )
							.enter().append("g")
								.attr("class", "legend")
								.attr("transform", function (d, i) {
									return "translate(" + (legendX) + "," + (height/2 - (i * 20))  + ")";
								});

			//Function for changing opacity of all rectangles
			//Pass in the color of the tile I'm hovering over
			//Select all the tiles
			//Reduce opacity of all that aren't the same color.

			function highlight(d,i){
				var legendTooltip = ["0 - 25", "26 - 50", "51 - 75", "76 - 100"];
				var focusColor =  color_to_class_name_mapper( z(d) );
				d3.selectAll(".trending_tile").style("opacity", 0.1);
				d3.selectAll('.'+focusColor).style("opacity", 1);
				d3.select("."+legLabels[i]).text( legendTooltip[i] );
			};

			//reset
			function revert(d,i){
				d3.selectAll(".trending_tile").style("opacity", 1);
				d3.select("."+legLabels[i]).text( legLabels[i] );
			};

			//new tags
			var legLabels = ["None", "Low", "Medium", "High"];

			legend.append("text")
				.attr("x", 32)
				.attr("y", 15)
				.attr("dy", ".35em")
				.data(legLabels)
				.attr("class", function(d,i){ return legLabels[i]; })
				.text(function (d,i) { return legLabels[i]; });

				legend.append("rect")
					.attr("width", 20)
					.attr("height", 20)
					.style( "fill", function (d){ return z(d + 1);})
					.on("mouseenter", highlight)
					.on("mouseout",	revert);

			// SOURCE: http://bl.ocks.org/mbostock/4323929
			function custom_y_axis_format(d) {
				switch(d){
					//case 100: return "Sensitive Data-1";
					//case 200: return "Sensitive Data-2";
					//case 300: return "Restricted Access";
					//case 400: return "Escalated Privileges";
					//case 500: return "Data Usage";
					//case 600: return "Protected System";
					//case 700: return "Overall";
					default: //console.log("[custom_y_axis_format] d: "+ d);
						return d;
				}
			}
//*/

			function custom_x_axis_format(d){
/*
				//pm cases
				if(d > 11 && d<24){
					var pmVal = "";
					if (d!=12) pmVal =  d - 12;
					else       pmVal = "12p";
					return     pmVal;
				} else if (d!=24){
					if (d!==0) return d;
					else       return "12a"
				}
				else return "12a"
*/
				return d;
			}

			// alfredt: from orig.
			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.tickFormat(custom_x_axis_format)
//				.ticks(d3.timeDay) //.ticks(d3.time.days) // years)
//				.tickFormat(formatDate) //6, 0)
			;

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left") // "right");
				.tickFormat(custom_y_axis_format)
//				.tickSize(width) //
//				.tickValues(["Sensitive Data-1", "Sensitive Data-2", "Restricted Access", "Escalated Privileges", "Data Usage", "Protected System" "Overall" ])
			;

			var customAxis = function (g) {
				g.selectAll("text")
				.attr("x",  -10)
				.attr("dy", -4);
			};

//*
			var gx = svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
			.append("text")
				.attr("class", "label")
				.attr("x", width/2)
				.attr("y", 40)
				.attr("text-anchor", "end")
				.text("Hour")
			;
//*/

			var gy = svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.call(customAxis)
/*
			.append("text")
				.attr("class", "label")
				.attr("x", -10)
				.attr("y", -10)
				.attr("dy", ".71em")
				.attr("text-anchor", "end")
				//.attr("transform", "rotate(-90)")
				.text("Events")
			;
*/
		};

		var ping_until_ready = function(){
			var can_get_id = document.getElementById("trending_div");
			if(can_get_id){
//				init_heatmap();
				$scope.get_data();
			}
			else{
				console.log("[trending_js/ping_until_ready]");
				setTimeout(ping_until_ready, 1000);
			}
		};

		ping_until_ready();

	} // end of controller

})(window, document);
