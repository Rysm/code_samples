(function() {
	'use strict';

	angular.module("risk_levels_widget_app", ['nvd3', "datiphyApp.framework", 'angularWidget', 'angular.filter'])
	.config(['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	}])
	.config(function(widgetsProvider) {
		widgetsProvider.addServiceToShare('dashboard_widget_service', {
			'remove_widget': 2
		});
	})
	.controller("risk_levels_widget_ctrl", risk_levels_widget_ctrl);

	risk_levels_widget_ctrl.$inject = ['$scope', '$http', '$interval', '$filter', "dashboard_widget_service"];
	function risk_levels_widget_ctrl($scope, $http, $interval, $filter, dashboard_widget_service) {
		$scope.enabled_meters = ['threats', 'anomalies', 'vulnerabilities'];  //['risk', 'efficiency', 'throughput'];
		$scope.is_loading = true;

		$scope.get_data = function () {
			$http({
				method: 'GET',
				url: '/site_survey/risk_levels/',
				responseType: 'json',
				params: {
					types: $scope.enabled_meters.join(',')
				}
			}).then(function (response) {
				$scope.has_error = null;
				$scope.is_loading = false;
				var data = response.data;

				if (!angular.isArray(data)) {
					data = [data];
				}
				$scope.data = data.map($scope.format_data);
			}, function (rejection) {
				$scope.has_error = rejection;
				$scope.is_loading = false;
			});
		};

		$scope.toggle_meter = function (meter) {
			if ($scope.enabled_meters.indexOf(meter) != -1) {
				if ($scope.enabled_meters.length === 1) {
					$scope.enabled_meters = ['threats', 'anomalies', 'vulnerabilities'];  //['risk', 'efficiency', 'throughput'];
				} else {
					$scope.enabled_meters.splice($scope.enabled_meters.indexOf(meter), 1);
				}
			} else {
				$scope.enabled_meters.push(meter);
			}

			$scope.get_data();

			return meter;
		};

		$scope.format_data = function (gauge) {
			var colors = ["#6ea640", "#f2d43d", "#f28b30", "#f24b3b", "#f21526"];
			if (gauge.type === 'anomalies') {
				colors.reverse();
			}
			gauge.label = $filter('ucfirst')(gauge.label);
			gauge.zones = gauge.zones.map(function (d, i) {
				d.color = colors[i];
				return d;
			});
			return gauge;
		};

		$scope.data = [];

		$scope.options = {
			"chart": {
				type: 'gaugeChart',
				margin: {
					left: 25,
					right: 25,
					top: 25,
					bottom: 25
				},
				height: 250,
				bandWidthRatio: 0.05,
				startAngle: 30,
				endAngle: 330,
				showTitle: true,
				duration: 650
			}
		};

		$scope.get_data();
		$scope.hook = $interval($scope.get_data, 60000);

		$scope.remove_widget = function() {
			dashboard_widget_service.remove_widget("risk_levels");
		};

		var ping_until_ready = function(){
			var can_get_id = document.getElementById("gaugeDiv");
			if(can_get_id){
				var selectGauges = d3.selectAll(".nv-gaugeWrap").on("click", function(d,i){
					window.location="/events/";
				});
			}
			else{
				console.log("risk_levels.js/ping_until_ready]");
				setTimeout(ping_until_ready, 1000);
			}
		};

		ping_until_ready();

	}
})();
//itshighn
