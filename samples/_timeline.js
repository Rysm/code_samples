(function(window, document, undefined) {
	'use strict';

	angular.module('timeline_widget_app', ['nvd3', "datiphyApp.framework"
		, 'angularWidget', 'angular.filter'])
	.config(['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	}])
	.config(function(widgetsProvider) {
		widgetsProvider.addServiceToShare('dashboard_widget_service', {
			"get_timelines":   0
			, "remove_widget": 1
			, "set_extent":    2
			, "add_widget":    3
		});
	})
	.controller('timeline_widget_controller', timeline_widget_controller);

	timeline_widget_controller.$inject = ['$scope', '$interval', '$http', 'dashboard_widget_service', 'widgetConfig'];
	function timeline_widget_controller($scope, $interval, $http, dashboard_widget_service, widgetConfig) {
		$scope.data = [];
		$scope.timelines = dashboard_widget_service.get_timelines();
		$scope.active_tab = 0;
		$scope.active_duration = 'hour';

		$scope.card_data = [{
			"type": "asset",
			"icon": "fa-user",
			"risk": "low",
			"title": "Oracle DB",
			"tags": [],
			"items": [],
			"addendum": []
		}];

		var previous_widget = null;
		$scope.update_card_data = function( widget_to_use ){
//			console.log("update_card_data");
//			dashboard_widget_service.remove_widget("timeline");
			if(previous_widget){
				dashboard_widget_service.remove_widget(previous_widget);
			}
			if(widget_to_use){
				dashboard_widget_service.add_widget( widget_to_use );
			}
			previous_widget = widget_to_use;
		};

		var get_tick_format = function (duration) {
			var ref = {"hour": [60, "mm", "minutes"]
				     , "day": [24, "h", "hours"]
				     , "week": [7, "ddd", "days"]
				     , "month": [moment().daysInMonth(), "D", "days"]
				     , "quarter": [3, "MMM", "months"]
				     , "year": [12, "MMM", "months"]
				     , "decade": [10, "YYYY", "years"]
				     , "default": [0, "X", "seconds"]};

			if (!ref.hasOwnProperty(duration)) { return ref.default; }
			else { return ref[duration]; }
		};

		$scope.options = {
			chart: {
				type: 'timelineChart',
				margin: {
					left: 30,
					top: 20
				},
				height: 150,
				duration: 500,
				useInteractiveGuideline: true,
				useBrush: false,
				yAxis: {
					ticks: 0
				},
				xAxis: {
					tickFormat: function (d) {
						var format = get_tick_format($scope.active_duration);
						return moment().subtract(format[0] - d, format[2]).format(format[1]);
					},
					tickValues: d3.range(0, get_tick_format($scope.active_duration)[0], 5)
				},
				dispatch: {
					brush: function(e) {
						console.log("[options/dispatch/brush]");
						dashboard_widget_service.set_extent(e.extent[0], e.extent[1]);
					},
					tooltipShow: function(e){
						console.log("[options/dispatch/tooltipShow]");
					}
				}
			}
		};

		$scope.get_data = function(timeline, index) {
			var promise = $http({
				method: 'GET',
				url: timeline.url,
				responseType: 'json',
				data: timeline.hasOwnProperty('data') ? timeline.data : {}
			});

			promise.then(function(response) {
				$scope.has_error = null;
				var data = response.data.map(function(el) {
					var stream = {};
					stream.key = el.name;
					stream.values = el.values.map(function(d) {
						return {
							x: d.x,
							y: d.y
						};
					});
					if (el.hasOwnProperty('color')) {
						stream.color = el.color;
					}
					return stream;
				});


				var matched = $scope.timelines.findIndex(function(el) {
					return el.url == timeline.url;
				});
				$scope.timelines[matched].serverids = response.data.map(function(el) {
					return el.id;
				});

				$scope.data[index].data = data;

				//Ps.update(document.getElementById('Demo'));
				var _width = document.getElementById('demo-perfect-scroll').offsetWidth;
				$("#demo-btn-group").width(_width);
				$('#demo-btn-group').perfectScrollbar(); //'update'
				Ps.initialize(document.getElementById('demo-btn-group'));

			}, function(rejection) {
				$scope.has_error = rejection;
			});

			return timeline;
		};

		$scope.load_data = function () {
			$scope.time_now = moment();
			$scope.data = $scope.timelines.map($scope.get_data);
		};

		$scope.switch_tab = function (tab) {
			$scope.active_tab = tab;
			$('.timeline-widget ul li:eq('+tab+') a').tab('show');
		};

		$scope.switch_duration = function (duration) {
			switch (duration) {
				case 'prev':
					break;
				case 'next':
					break;
				default:
					$scope.active_duration = duration;
					break;
			}
			$scope.nv.update();
		};

		$scope.$watch("active_tab", function(newValue, oldValue) {
			if (newValue != oldValue) {
				$scope.load_data();
			}
		});

		$scope.hook = $interval(function () {
			$scope.load_data();
		}, 60000);

		$scope.load_data();

		$scope.remove_widget = function() {
			dashboard_widget_service.remove_widget("timeline");
		};


	}
})(window, document);
