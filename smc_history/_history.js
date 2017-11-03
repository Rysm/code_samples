(function(window,document) {
	'use strict';
/// HELPER  FUNCTIONS

	function printAssocArrayCollection(assocArray){
		for(var key in assocArray){
			console.log("key: " + key + " value: " + assocArray[key]);
		}
		return "";
	}

/// ANGULAR MODULE

	angular.module("smc_history_widget_app",
		          ["datiphyApp.framework", 'nvd3',
		           'smc_app',
		           'angularWidget', 'angular.filter'])
		.controller("smc_history_widget_controller", smc_history_widget_controller);


	smc_history_widget_controller.$inject = ['$scope', '$rootScope', '$compile', '$http', '$interval', '$filter'
//		          , 'smc_data_service' //
	];

	function smc_history_widget_controller($scope, $rootScope, $compile, $http, $interval, $filter
//	                      , data_service //
	) {

		var _data;
		var _chart;
		var _chart_Reference;

		$scope.data = [];
		$scope.server_hour_mapper = {}; // maps name to array of data associated with that server. 
		$scope.active_duration = 'day';

		$scope.tab_array=["cpu", "mem", "transactions", "events"];

		$scope.processData = function(data_input){
			for(var i=0; i<$scope.data.length;i++){
				var serverList = $scope.data[i].servers;
				for(var j=0; j<serverList.length;j++){
					if(!$scope.server_hour_mapper[serverList[j].name]){
						$scope.server_hour_mapper[serverList[j].name] = [];
					}
					$scope.server_hour_mapper[serverList[j].name].push(serverList[j]);
				}
			}
		};


		$scope.card_data = [{
			"type": "asset",
			"icon": "fa-user",
			"risk": "low",
			"title": "Oracle DB",
			"items": [{
				"title":  "Test",
				"value": "Test" 
/*			}, {
				"title":  "Test2",
				"value": "Test2"
			}, {
				"title":  "Test3",
				"value": "Test3"
*/			}],
			"addendum": []
		}];


		///     NV EXAMPLE:
		$scope.get_data = function () {
			var promise = $http({
				method: 'GET',
				url: '/Content/Scripts/Dummy/historical_stat_sample_data.json', 
				responseType: 'json'
			});

			promise.then(function (response) {
				$scope.data = response.data;
				$scope.processData(response.data);

				nv.addGraph($scope.createGraphProperties);
/*				// Pullan asked to remove bar chart
				nv.addGraph({//$scope.multi_bar_graph_create
					generate: $scope.multi_bar_graph_create,
					callback: $scope.multi_bar_graph_callback
				});
//*/
			}, function (rejection) {
				$scope.has_error = rejection;
			});
		};

		$scope.switch_duration = function (duration) {
			switch (duration) {
				case 'prev': break;
				case 'next': break;
				default: $scope.active_duration = duration;
				         break;
			}
			// $scope.nv.update(); // alfredt: this doesn't seem to exist.
			var x_axis_name = "Hour of the Day";
			var time_duration_data = _data[$scope.active_tab].slice(0);
			switch(duration){
				case "hour":
					_chart.forceX([0, 60]);
					x_axis_name = "Last Hour"
					
					_data = $scope.assemble_data( 60 );

					break;
				case "day":
					_chart.forceX([0, 24]);
					
					_data = $scope.assemble_data();

					break;
				case "week":
					_chart.forceX([0, 7]);
					x_axis_name = "Day of the Week"

					_data = $scope.assemble_data( 7 );

					break;
				case "month":
					_chart.forceX([0, 30]);
					x_axis_name = "Day of the Month"

					_data = $scope.assemble_data( 30 );
					break;
			}

			_chart.xAxis.axisLabel( x_axis_name );
///*

			_chart_Reference.datum( _data[$scope.active_tab] )
				.transition().duration(500)
				.call(_chart);
			
//			nv.utils.windowResize(_chart.update);
//*/
		};

		$scope.active_tab = 0;
		$scope.switch_tab = function (tab) {
			$scope.active_tab = tab;
			$('#history_widget_id ul li:eq('+tab+') a').tab('show');

			var y_axis_name = "Default";
			switch($scope.active_tab){
				case 0: y_axis_name = "CPU"; break;
				case 1: y_axis_name = "Memory"; break;
				case 2: y_axis_name = "Transactions"; break;
				case 3: y_axis_name = "Events"; break;
			}

			_chart.yAxis.axisLabel( y_axis_name );
///*
			console.log("create_graph: set y axis.");

			d3.select('#chart1').select('svg')
				.datum(_data[$scope.active_tab])
				.call(_chart);

			_chart.update();
//*/
		};

		$scope.remove_widget = function () {
			console.log("[smc_history] remove widget");
			$('body').trigger('dashboard.remove_widget', 'history');
		};
		$scope.$on('handleBroadcast', function() {
			console.log("[smc_history] on_handlebroadcast.");
		});
		$rootScope.$on('handleBroadcast', function() {
			console.log("[smc_history] root/on_handlebroadcast.");
		});

/////////////////

		$scope.assemble_barchart_data = function() {

			var _dataCollection  = [];
			var _dataCollection2 = [];
			for(var key in $scope.server_hour_mapper){
				var _dataToPush = [];
				var _dataToPush2 = [];

				// key = machine, 0-23
				for(var i = 0; i < $scope.server_hour_mapper[key].length; i++){
					var server_data = $scope.server_hour_mapper[key][i]
					if(server_data){
						_dataToPush.push( { x: i, y: server_data.cpu });
						_dataToPush2.push({ x: i, y: server_data.mem });
					}
					else{
						console.log("no server data found for: key: " + key + " i: " + i);
					}
				}
				_dataCollection.push( _dataToPush );
				_dataCollection2.push(_dataToPush2);
			}

			var _colorCollection = [ "#f00", "#0f0",
			                         "#00f", "#ff0",
			                         "#0ff", "#f0f" ];

			var _colorCollection2 = [ "#700", "#070",
			                          "#007", "#770",
			                          "#077", "#707" ];

			var _i = 0;
			var retArray = [];
			for(var _key in $scope.server_hour_mapper){
				retArray.push({
					key: _key + "_cpu", 
					values: _dataCollection[_i],
					color: _colorCollection[_i],
					size: 5
				});

				retArray.push({
					key: _key + "_mem",
					values: _dataCollection2[_i],
					color: _colorCollection2[_i],
					size: 5
				});

				_i = Math.min(_dataCollection.length-1, _i + 1);
			}
			return retArray;
		}
		$scope.assemble_data = function( time_to_go_to ) {
			var _dataCollection  = [];
			var _dataCollection2 = [];
			var _dataCollection3 = [];
			var _dataCollection4 = [];
			for(var key in $scope.server_hour_mapper){ // "6" servers.
				var _dataToPush = [];
				var _dataToPush_1 = [];
				var _dataToPush_2 = [];
				var _dataToPush_3 = [];

				var k = 0;
				
				var time_duration = (time_to_go_to) ? time_to_go_to : $scope.server_hour_mapper[key].length;
				var shmLength = $scope.server_hour_mapper[key].length;
				for(var i = 0; i < time_duration; i++){ // 24 hours


					var times_to_iterate = 1;


					if( i == 0 ){ times_to_iterate = 2; }
					for(var j = 0; j < times_to_iterate; j++){

						k += (j > 0) ? 1 : 0;
						_dataToPush.push(  { x: i+k, y: $scope.server_hour_mapper[key][ i % shmLength ].cpu         });
						_dataToPush_1.push({ x: i+k, y: $scope.server_hour_mapper[key][ i % shmLength ].mem         });
						_dataToPush_2.push({ x: i+k, y: $scope.server_hour_mapper[key][ i % shmLength ].transaction });
						_dataToPush_3.push({ x: i+k, y: $scope.server_hour_mapper[key][ i % shmLength ].event       });
					}
				}
				
				//console.log( "_dataToPush.length: " + _dataToPush.length );

				_dataCollection.push( _dataToPush);   // cpu
				_dataCollection2.push(_dataToPush_1); // mem
				_dataCollection3.push(_dataToPush_2); // transaction
				_dataCollection4.push(_dataToPush_3); // event
			}
		
			var _colorCollection = ["#ff7f0e", "#2ca02c",
			                        "#2222ff", "#667711",
			                        "#EF9CFB", "#EF1234",
			                        "#EF9876"];
			var _i = 0;
			var retArray = [], cpuArray = [], memArray = [], transArray = [], eventArray = [];
			for(var _key in $scope.server_hour_mapper){
		
				var template = {key: _key, strokeWidth: 2,
					values: _dataCollection[_i],
					color: _colorCollection[_i]
				};
				cpuArray.push(template);

				template = $.extend({}, template);
				template.values = _dataCollection2[_i];
				memArray.push(template);

				template = $.extend({}, template);
				template.values = _dataCollection3[_i];
				transArray.push(template);

				template = $.extend({}, template);
				template.values = _dataCollection4[_i];
				eventArray.push(template);

				// alfredt: increment to next server key. (6)
				_i = Math.min(_dataCollection.length-1, _i + 1);

			}

			retArray.push(cpuArray);
			retArray.push(memArray);
			retArray.push(transArray);
			retArray.push(eventArray);

			return retArray;
		};
/*
		$scope.show_history_card = function(){
			$('#modal').modal('show');
		}
//*/

		$scope.update_card_data = function( index ){
			index = index;// -1;
			console.log("[smc_history] update_card_data("+ index +") data["+$scope.active_tab+"].length: " + _data[$scope.active_tab].length);
			for(var i = 0; i < $scope.card_data.length; i++){
				$scope.card_data[i].title = _data[$scope.active_tab][ index ]["key"];
				$scope.card_data[i].items[0].title = $scope.tab_array[$scope.active_tab];
				$scope.card_data[i].items[0].value = $scope.tab_array[$scope.active_tab];
//				printAssocArrayCollection ( $scope.card_data[i] );
			}
			
		}


		///
		// NO LONGER USED.
		$scope.multi_bar_graph_create = function() {
///*
            var width  = 800, //nv.utils.windowSize().width,
                height = 500; //nv.utils.windowSize().height;
//*/
			if(document.getElementById("history_widget_id") != null) {
				width = document.getElementById("history_widget_id").getBoundingClientRect().width - 20;
			}

			var chart = nv.models.smc_multiBarChart() // nv.models.multiBarChart()
//			            .width(width).height(height)
//						.attr({style: "width:100%;height:500px"})
//			            .stacked(true);
						.options({
							stacked: true,
							useInteractiveGuideline: false // all verses hover over individual lines.
						});

            chart.dispatch.on('renderEnd', function(){ console.log('Render Complete'); });
            var svg = d3.select('#chart2')//.append('svg').attr({ "style": "height:500px" })
//			            .attr('width', width).attr('height', height)
			            .datum( $scope.assemble_barchart_data /*test_data*/ )


			console.log("[multi_bar_graph_create] calling chart");

            svg.transition().duration(0).call(chart);

			nv.utils.windowResize(chart.update);

            return chart;

		}

		$scope.multi_bar_graph_callback = function( graph ){

            nv.utils.windowResize(function() {
                var width  = 800; // nv.utils.windowSize().width;
                var height = 500; // nv.utils.windowSize().height;

				if(document.getElementById("history_widget_id") != null) {
					width = document.getElementById("history_widget_id").getBoundingClientRect().width - 20;
				}

                graph.width(width).height(height);

                d3.select('#chart2')
//					.attr('width', width).attr('height', height)
                    .transition().duration(0)
                    .call(graph);
            });

		}

		var get_tick_format = function (duration) {
			var ref = {"hour": [60, "mm", "minutes"],
			           "day": [24, "h", "hours"],
			           "week": [7, "ddd", "days"],
			           "month": [moment().daysInMonth(), "D", "days"],
			           "year": [12, "MMM", "months"],
			           "decade": [10, "YYYY", "years"],
			           "default": [0, "X", "seconds"]};

			if (!ref.hasOwnProperty(duration)) { return ref.default; }
			else { return ref[duration]; }
		};

		/////
		// Creates the CUSTOM NVD3 line graph
		/////
		$scope.createGraphProperties = function() {


			_chart = nv.models.smc_lineChart()
				.options({
/*
					xAxis: {
						tickFormat: function (d) {
							var format = get_tick_format($scope.active_duration);
							return moment().subtract(format[0] - d, format[2]).format(format[1]);
						},
						tickValues: d3.range(0, get_tick_format($scope.active_duration)[0], 5)
						axisLabel: "Hour of Day",
						tickFormat: function(d){ 
							return d3.format(',');
						}
					},
//*/
					margin: { left: 100, top: 50 },
					transitionDuration: 300,
					showLegend: true, // hide legend using custom thing.... I guess.
					useInteractiveGuideline: true // all verses hover over individual lines.
				})
				.forceY([0])
			;
///*
			// chart sub-models (ie. xAxis, yAxis, etc) when accessed directly,
			// return themselves, not the parent chart, so need to chain separately
			_chart.xAxis
				.axisLabel("Hour of Day")
//				.tickValues( d3.range(0, get_tick_format($scope.active_duration)[0] ) )
				.tickFormat(d3.format(','));
//*/
			_chart.yAxis
				.axisLabel("CPU") //'CPU/Mem/Transaction/Events')
//				.tickValues( d3.range(0, 1000) ) //
				.tickFormat(function (d) {
					if (d == null) { return 'N/A'; }
					return d3.format(',')(d);
				});
			
//			_chart.xAxis.scale().domain([0, 24]);
			_chart.yAxis.scale().domain([0, 1000]);

			// alfredt: grab data.
			_data = $scope.assemble_data();

			_chart_Reference = d3.select('#chart1').append('svg')
				.datum(_data[$scope.active_tab])
				.attr({	"style": "height:500px"	})
				.call(_chart);

			nv.utils.windowResize(_chart.update);

			d3.select('#chart1').selectAll(".nv-line-hidden") //nv-line")
				.attr({
					"data-ng-click": function(d,i){ return "update_card_data(" + i + ")"; }, //"show_history_card()",
					"ng-click": function(d,i){ return "update_card_data(" + i + ")"; }, //"show_history_card()",
					"datiphy-cards-toggle": "",
					"data-target": "#history_cards_id",
				});

			// recompile to add "ng-click" event to lines.
			var transforms = [].slice.call( document.getElementById('chart1')
				.getElementsByTagName('path') );
//			console.log( "Found "+transforms.length+ " line paths to recompile." );
			for(var i=0; i<transforms.length; i++){
				$compile( transforms[i] )($scope);
			}

			_chart.lines.dispatch.on('elementClick', function(e){

				if( e.length ){ for(var i = 0; i < e.length; i++){
					if(e[i].highlight){
						console.log("elementClick, found highlight index: " + i);
//						printAssocArrayCollection( e[i] );
					}
//					if(i == 0){ printAssocArrayCollection( e[0] ); }
/*
					printAssocArrayCollection( e[i].series );
					console.log("////////////////////////////////////////////////////////////");
//*/
				}}
				else{
//					printAssocArrayCollection( e );
				}
			});

			return _chart;
		
		};

/////// INSTRUCTIONS TO EXECUTE /////
		$scope.get_data();
/////// INSTRUCTIONS TO EXECUTE /////
	}

})(window,document);
