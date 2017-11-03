(function(window,document) {
	'use strict';

	var debug = false; //false;

	var TOP_OFFSET = 65;
	var SVG_WIDTH  = 1920;
	var SVG_HEIGHT = 1600;
	var X_RAD = 250, Y_RAD = 80; // 240, 120

	// collections.
	var appIndexMapper = {};	// associated id <-> index
	var indexAppMapper = {};	// index <-> associated id
	var assocEntityArray = {};  // binds the index_id <-> DOM.
	var SampleDataTransactions = []; // all of the transactions

	var brush_svg = null;

//	var serverIndexMapper = {}; // no longer used.

	var ThingsToAnimate = []; // all of the transactions

	// This is the "class" that represents the line connects the servers.
	function ServerLineClass(server_from, server_to, query_count) { //has_cargo
		this.server_from = server_from;
		this.server_to   = server_to;
		this.query_count = query_count;
//		this.has_cargo   = has_cargo;


		this.bindHTMLObjects = function( from, to ) {
//			console.log("[ServerLineClass] bindHTMLObjects");
			if( from && to ) {
				this.from = from;
				this.to = to;

				this.linePath = d3.select("#transaction-container")
					.append("line")
						.attr("x1", this.from._x)
						.attr("y1", this.from._y)
						.attr("x2", this.to._x)
						.attr("y2", this.to._y)
						.attr("stroke-width", 1)
						.attr("stroke", "grey")
//						.attr("stroke", (this.has_cargo) ? "grey" : "red")
				;

				var x_translate = ((this.from._x + this.to._x) / 2);
				var y_translate = ((this.from._y + this.to._y) / 2);
				if(isNaN(x_translate) || isNaN(y_translate)){
					console.log("bindHTMLObjects: x" + x_translate + " y: " + y_translate );
					x_translate = 0;
					y_translate = 0;
				}
				this.textBoxTransform = d3.select("#transaction-container").append("g")
					.attr("transform", "translate("+x_translate+', '+y_translate+")");

				//rect dimensions also used for text alignment
				var rectW = 60;
				var rectH = 20;

				this.textBoxTransform.append("rect")
					.attr({ 'width': rectW, 'height': rectH
						, 'x': -30, 'y': -10
						, 'fill': "white"
						, "fill-opacity": 1.0 // 0.5
						, "stroke": "black"
						, "stroke-opacity": 1.0 //0.5
					});
				this.textBoxTransform.append("text")
	                .attr("dy", function(d, i){// .attr({ "dx": -10, "dy": 3 })
	                    return ( rectH/4 );
	                })
					.style("text-anchor", "middle")
					.text(""+this.query_count); // 400
			}
		};

		this.update = function(deltaTime) {
//			console.log("[ServerLineClass] Update");
			if( this.mark_for_cleanup ){
				this.cleanup();
			} else {
				// redraw the lines.
				if (this.linePath) {
					this.linePath
						.attr("x1", this.from._x)
						.attr("y1", this.from._y)
						.attr("x2", this.to._x)
						.attr("y2", this.to._y);

					var x_translate = ((this.from._x + this.to._x) / 2);
					var y_translate = ((this.from._y + this.to._y) / 2);
					if(isNaN(x_translate) || isNaN(y_translate)){
						console.log("bindHTMLObjects: x" + x_translate + " y: " + y_translate );
						x_translate = 0;
						y_translate = 0;
					}
					this.textBoxTransform
						.attr("transform", "translate("+x_translate+', '+y_translate+")");

//					this.textBoxTransform
//						.attr("transform", "translate("+ ((this.from._x + this.to._x) / 2)
//						                        + ', ' + ((this.from._y + this.to._y) / 2) +")");


				}
				else {
					this.bindHTMLObjects( assocEntityArray[this.server_from], assocEntityArray[this.server_to] );
				}
			}
		};


		this.reset = function(){ this.mark_for_cleanup = true; };
		this.cleanup = function(){
			if (this.linePath) {
//				http://stackoverflow.com/questions/10337640/how-to-access-the-dom-element-
//					that-correlates-to-a-d3-svg-object
				try{
					if(document.getElementById('transaction-container')){
						if(this.linePath[0] && this.linePath[0][0]){
							document.getElementById('transaction-container').removeChild(this.linePath[0][0]);
							document.getElementById('transaction-container').removeChild(this.textBoxTransform[0][0]);
						}
						else {// I'm pretty sure this isn't used.
							var linePathDOMElement = d3.select(this.linePath);
							if(linePathDOMElement){
								document.getElementById('transaction-container').removeChild(linePathDOMElement);
							}
							linePathDOMElement = d3.select(this.textBoxTransform);
							if(linePathDOMElement){
								document.getElementById('transaction-container').removeChild(linePathDOMElement);
							}
						}
					}
				}
				catch(err){
					console.log("Did not find Node: Fix Later: " + err);
				}
			}

			var index = ThingsToAnimate.indexOf(this);
			if(index > -1){
				ThingsToAnimate.splice(index, 1);
				debuglog("ThingsToAnimate.length: " + ThingsToAnimate.length);
			}
		};
	}

	/// Sample Data Transaction Class
	function SampleDataTransaction(transactionData, appID, serverID, rate){
		this.appID    = appID;
		this.serverID = serverID;
		this.transactionData = transactionData;

		this.rate = rate * .1; // transactionData["slot"]; // FILL DUMMY FOR NOW.
		this.interpolateT = 0;

		this.delay = transactionData["slot"];
		this.targetOpacity = 0;
		this.styleAppend="";

		this.isAlive = function(){ return this.interpolateT < 1; };
		this.bindHTMLObjects = function(htmlObj, from, to, styleAppend){
//*
			debuglog("[_velocity.js/bindHTMLObjects] htmlObj: " + htmlObj +
						" from: " + from + " to: " + to +
						" appID: " + appID + " serverID: " + serverID);
//*/
			this.targetOpacity = 0.5;
			this.htmlObj = htmlObj;

			this.styleAppend = styleAppend;


			this.from = from;
			this.to = to;
		}

		this.reset = function(){}
		this.cleanup = function() {

			if(document.getElementById('transaction-container')){
				document.getElementById('transaction-container').removeChild(this.htmlObj);
			}

///*
			var index = ThingsToAnimate.indexOf(this);
			if(index > -1){
				ThingsToAnimate.splice(index, 1);
			}

			// alfredt: from merge
			index = SampleDataTransactions.indexOf(this);
			if(index > -1){ SampleDataTransactions.splice(index, 1); }

			this.htmlObj = null;
//*/
		}

		this.update = function(deltaTime) {
			if(!this.from || !this.to) {
				debuglog("[_velocity.js/SampleDataTransaction: update(dt)] appID:"+ this.appID +
					" serverID: " + this.serverID + " Start or Destination is null.");
				return;
			}

			if( this.delay > 0 ) {
//				this.htmlObj.setAttribute("fill-opacity", 0); // this does nothing.
//				this.htmlObj.setAttribute("style", "opacity: 0;" + this.styleAppend);
				this.htmlObj.setAttribute("style", "opacity: 0;");

				this.delay -= deltaTime;
			}
			else if( this.isAlive() ) {
			 // alfredt: TURNING THIS OFF.
//				this.htmlObj.setAttribute("style", "opacity: " + this.targetOpacity);

				this.interpolateT += (deltaTime * this.rate ); // 0.05;
				if (this.interpolateT > 1) {
					this.interpolateT = 1;
				}
				// relative position
				var dataX, dataY;
				if(this.transactionData["out"]) {
					dataX = lerp(this.from._x, this.to._x, this.interpolateT);
					dataY = lerp(this.from._y, this.to._y, this.interpolateT);
				}
				else {
					dataX = lerp(this.to._x, this.from._x, this.interpolateT);
					dataY = lerp(this.to._y, this.from._y, this.interpolateT);
				}

				var xDiff = (this.to._x - this.from._x);
				var yDiff = (this.to._y - this.from._y);
				var xPos = xDiff > 0;
				var yPos = yDiff > 0;


				// radians
				var angleInRadians = -Math.atan(yDiff/xDiff);
				var offsetAngleToUse = (Math.PI/2) - angleInRadians;

				var offsetX = Math.cos(offsetAngleToUse) * (this.transactionData["out"] ? 25 : -25);
				var offsetY = Math.sin(offsetAngleToUse) * (this.transactionData["out"] ? 25 : -25);

				// flip
				if(!xPos) {
					offsetX *= -1;
					offsetY *= -1;
				}

				this.htmlObj._x = dataX + offsetX;
				this.htmlObj._y = dataY + offsetY;

//				syncHTMLPosToObjPos(this.htmlObj, true); //false);
			}
			else {// remove html element, then remove array reference to let this be garbage collected.
				this.cleanup();
			}
		}
	}

/// HELPER FUNCTIONS
	var m_uid = 0;
	function GetGuid(){
		m_uid += 1;
		return m_uid;
	}

	function debuglog(msg){ if(debug){ console.log(msg);  } }

	function clamp(value, min, max){
		return Math.min(Math.max(value, min), max);
	}

	function lerp(a, b, t) { return a + t * (b - a); }

	function printAssocArrayCollection(assocArray){
		for(var key in assocArray){
			console.log("key: " + key + " value: " + assocArray[key]);
		}
	}

	function syncHTMLPosToObjPos(oBall, isSvgElement) {
		if (isSvgElement === true) {
			oBall.setAttribute("cx", oBall._x);
			oBall.setAttribute("cy", oBall._y);

			var widthOffset = oBall.getAttribute("width");
			var heightOffset = oBall.getAttribute("height");

			oBall.setAttribute("x", oBall._x - (widthOffset / 2));
			oBall.setAttribute("y", oBall._y - (heightOffset / 2));
		}
		else {
			oBall.style.left = (oBall._x + canvasOffsetX) + 'px';
			oBall.style.top = (oBall._y + canvasOffsetY) + 'px';
		}
	}

/// ANGULAR MODULE
	angular.module("velocity_widget_app",
							 ["datiphyApp.framework", 'nvd3',
								'angularWidget', 'angular.filter'])
		.controller("velocity_widget_controller", velocity_widget_controller);

	function velocity_widget_controller($scope, $rootScope, $compile, $http, $interval, $filter ){
		this.$inject = ['$scope', '$rootScope', '$compile', '$http', '$interval', '$filter'];
/*
		$scope.dummy_options = [
			[{'name': "dummy_1"}],
			[{'name': "dummy_2"}],
			[{'name': "dummy_3"}]
		];
*/
		$scope.card_data = [{
			"type": "asset",
			"icon": "fa-user",
			"risk": "low",
			"title": "Oracle DB",
			"items": [{
				"title": "Created At",
				"value": "2016-05-24"
			}, {
				"title": "Last Seen",
				"value": "2016-05-14 SQL Injection"
			}, {
				"title": "Found In",
				"values": ["oracledb.salary", "oracledb.employees"]
			}],
			"addendum": []
		}];



		$scope.timer;
		$scope.is_loading_entities = true;
		$scope.executedOnce = false;

		$scope.data_entities = []; // raw data
//		$scope.nodeDictionary = {};
		$scope.behavior_analytics = [];
		$scope.selected = null;

		$scope.is_loading = function(){
			return $scope.is_loading_entities;
		}

		$scope.get_data_entities = function () {
			var promise = $http({
				method: 'GET',
//				url: '/Content/Scripts/Dummy/smc_sample_data.json',
//				url: '/Content/Scripts/Dummy/dashboard_velocity.json',
				url: '/site_survey/get_behavior_analytics',

				responseType: 'json'
			});

			promise.then(function (response) {
//				SampleDataTransactions.length = 0; // = [];

				$scope.has_error = null;
				$scope.is_loading_entities = false;

				$scope.data_entities = response.data;
				$scope.bind_real_data(response.data);

				if(timeline_brushHistory){
					timeline_brushHistory.resize_brush();
//					timeline_brushHistory.create_brush();
				}

				$scope.startAnimation();

			}, function (rejection) {
				$scope.has_error = rejection;
				$scope.is_loading_entities = false;
			});

		};

/////// ZOOM FUNCTIONALITY ////
// reference: http://bl.ocks.org/mbostock/3680999
		$scope.translateVar = [0,0];
		$scope.zOffset_x = 0, $scope.zOffset_y = 0;
		$scope.add_test_zoom = function(){
			var _offset_x = 360; var _offset_y = 150;

			$scope.initial_x = -SVG_WIDTH/2  + _offset_x;
			$scope.initial_y = -SVG_HEIGHT/2 + _offset_y;

			if(isNaN($scope.initial_x) || isNaN($scope.initial_y)){
				$scope.initial_x = 0;
				$scope.initial_y = 0;
			}

			var _zoomMin = 1, _zoomMax = 10;
			var _svg = d3.select("#svg-container") // bcc
				.attr("width", SVG_WIDTH)
				.attr("height", SVG_HEIGHT)
				.call(d3.behavior.zoom().scaleExtent([_zoomMin,_zoomMax]).on("zoom", zoom))
				.select("#zoom-container")
				.attr("transform", "translate(" + $scope.initial_x + "," + $scope.initial_y + ")");
			;

			_svg.select("rect")
				.attr({
					"class": "overlay",
					"width": SVG_WIDTH, "height": SVG_HEIGHT,
					"fill-opacity": 0.0 //2
				});

			function zoom() {
				var translateAmount = [0,0];
				var scaleAmount = d3.event.scale;
				if(!$scope.dragging_object){
					$scope.translateVar = d3.event.translate;

					$scope.initial_x += $scope.zOffset_x;
					$scope.initial_y += $scope.zOffset_y;

					$scope.zOffset_x = 0;
					$scope.zOffset_y = 0;
				}
				else{
					$scope.zOffset_x = $scope.translateVar[0] - d3.event.translate[0];
					$scope.zOffset_y = $scope.translateVar[1] - d3.event.translate[1];
				}

				translateAmount[0] = $scope.translateVar[0] + ($scope.initial_x * scaleAmount);
				translateAmount[1] = $scope.translateVar[1] + ($scope.initial_y * scaleAmount);
/*
				console.log("[zoom] dragging: " + $scope.dragging_object
					+ " d3.event.translate: "   + d3.event.translate
					+ " $scope.translateVar: "  + $scope.translateVar
					+ " translateAmount: "      + translateAmount
					+ " initial: ( "+$scope.initial_x+", "+$scope.initial_y+" )"
					+ " zOffset: ( "+$scope.zOffset_x+", "+$scope.zOffset_y+" )"
				);
//*/
				_svg.attr("transform", "translate(" + translateAmount + ")scale(" + scaleAmount + ")");
			}
		};
///////////

/////// EXPOSED TO HTML /////////
		var cleanup_servers = function(){
			var html_transactions = document.getElementById("app-entity-container");
			while(html_transactions.firstChild){
				html_transactions.removeChild( html_transactions.firstChild );
			}
		};

		$scope.remove_widget = function () {

			ThingsToAnimate.forEach(function(iter){ iter.cleanup(); });
			ThingsToAnimate.length = 0;

			SampleDataTransactions.length = 0;

			//clean up timers
			$scope.stopAnimation();


			// clean up html dom elements?
			var html_transactions = document.getElementById("transaction-container");
			while(html_transactions.firstChild){
				html_transactions.removeChild( html_transactions.firstChild );
			}

			var remove_callback = function(){
				$('body').trigger('dashboard.remove_widget', 'velocity');
			};

			setTimeout(remove_callback, 500);
		};

		$scope.startAnimation = function () {
			$scope.lastUpdate = Date.now();
			if (!$scope.timer) {
				$scope.timer = setInterval($scope.update, 0);
			}
		};
		$scope.stopAnimation = function () {
			if (!$scope.timer) return false;

			$scope.lastUpdate = Date.now();
			clearInterval($scope.timer);
			$scope.timer = null;
		};

		$scope.showCard = function(){
			if( !$scope.dragging_object ){
				$('#modal').modal('show');
			}
		}

/////////////////// BIND SAMPLE DATA FUNCTION ////////////////////////

		$scope.bind_real_data = function(dataset) {

			/////// Function Definitions. //////

			// drag behavior function
			function dragmove (d){
				$scope.dragging_object = true;

				var x = clamp(d3.event.x, 0, SVG_WIDTH); // temp
				var y = clamp(d3.event.y, 0, SVG_HEIGHT); // temp
				d3.select(this).attr("transform", "translate("+x+","+y+")");

				this._x = x;
				this._y = y;
			}
			var drag = d3.behavior.drag() .on("drag", dragmove);

			//

			function processUserDataBehavior(root){
				var server_tree = [];
				function processNode(nodeData, parentName){
					var _data = {};
					var _name = nodeData["name"];

					for(var key in nodeData){
						switch(key){
							//case "name":
							case "child":{
								debuglog("\tskip "+key+" element.");
								break;
							}
							default: {
								debuglog("\tadd data: " + key);
								_data[key] = nodeData[key];
								break;
							}
						}
					}
					_data["parent"] = parentName;
					return _data;
				}

				server_tree.push( processNode(root) );
				if( root["child"] ) {
					for(var i = 0; i < root["child"].length; i++){
						server_tree.push( processNode(root["child"][i], root["name"]) );
					}
				}
				$scope.behavior_analytics.push( server_tree ); //
//				return _data;
			}

			function bindVisualsToData(){
//				var _nodeDict_as_array = d3.entries($scope.nodeDictionary);
				var _elem = d3.select("#app-entity-container") // might want to rename this.
							.selectAll("g")
							.data( $scope.behavior_analytics[ $scope.selectedIndex ] ); //_nodeDict_as_array );
				//.value

				var _imageDimensions = 50;
				//Math.max(10, (80 - (10*Math.floor( _nodeDict_as_array.length / 5 ))));

				var _centerX = SVG_WIDTH / 2, _centerY = SVG_HEIGHT / 2; // TODO: TEMP HACK.

				// this needs to only be created once.
				if(!$scope.node_tool_tip){
					$scope.node_tool_tip = createNodeToolTips();
				}

				// create draggable server transforms
				var _elemEnter = _elem.enter()
					.append("g")
					.attr({
						"appNumber": function(d,i){
							var guid = GetGuid();
							appIndexMapper[d["name"]] = guid; //we shouldn't need this "guid"
							indexAppMapper[guid] = d["name"]; //we shouldn't need this "guid"
								return guid;
						},
						"ng-click": function(d,i) {
							return "updateCardInfo(" + appIndexMapper[ d["name"] ] + ")";
						},
						"datiphy-cards-toggle": "",
						"data-target": "#datiphy_cards_id",
						"transform": function(d,i){
							var x_radius = 0, y_radius = 0, _radius = 0, piPercent = 0;
							// alfredt: don't include policier
							if($scope.behavior_analytics[$scope.selectedIndex].length > 1){
								piPercent = 2 * Math.PI * (i / ($scope.behavior_analytics[ $scope.selectedIndex ].length - 1)); //_nodeDict_as_array
								switch (d["type"]) {

								    case "app":
								    case "observer": x_radius = X_RAD; y_radius = Y_RAD; break;

								    case "user":
								    case "extractor": x_radius = X_RAD; y_radius = Y_RAD; break;

								    case "database":
									case "policier":
							    	default: break;

								}
							}
							var _xVal = _centerX + (x_radius * Math.cos( piPercent ));
							var _yVal = _centerY + (y_radius * Math.sin( piPercent ));
							if(isNaN(_xVal) || isNaN(_yVal)){
								console.log("NAN ERROR.");
								_xVal = 0; _yVal = 0;
							}
							return "translate(" + _xVal + "," + _yVal + ")";
						}
					})
					.call(drag);

				_elemEnter.append("image")
					.attr({
						"height": _imageDimensions.toString(),
						"width": _imageDimensions.toString(),
						"image-rendering": "optimizeSpeed",
						"xlink:href": function(d){
							switch(d["type"]){
							    case "app":
									//
							    case "observer":
//									return "/Content/Images/satellite_demo/openclipart_org/server.png";
									//return "/Content/Images/satellite_demo/openclipart_org/server_resized.svg";
									return "/Content/Images/satellite_demo/openclipart_org/app.png";
							    case "user":
									//
							    case "extractor":
//									return "/Content/Images/satellite_demo/openclipart_org/extractor.png";
									//return "/Content/Images/satellite_demo/openclipart_org/User.svg";
									return "/Content/Images/satellite_demo/openclipart_org/User.png";
							    case "database":
									return "/Content/Images/satellite_demo/openclipart_org/database.png";
							    case "policier":
								default:
//									return "/Content/Images/satellite_demo/openclipart_org/policier.png";
									return "/Content/Images/satellite_demo/openclipart_org/server_resized_blue.svg";
							}
						}
					})
					.on("mouseover", function(d){
						$scope.node_tool_tip.show(d, document.getElementById("title-header"));
					})
					.on("mouseout", function(d){
						$scope.node_tool_tip.hide(d);
					})
				;

				_elemEnter.append("text")
					.attr({
						"dx": -(_imageDimensions / 2),
						"dy": -(_imageDimensions / 2)
					})
					.text(function (d) { return d["name"]; })
//					.append("datiphy-cards-toggle")
//					.attr({"data-target": "#datiphy_cards_id"})
				;

				// CPU/Mem Usage.
/*
_elemEnter.append("rect").attr({"x": 12, "y": -20, "width": 10, "height": 20, "fill": "black" });
_elemEnter.append("rect").attr({ "x": 12, "y": function(d){ var _cpu = d.value["cpu"] ? d.value["cpu"] : 0;
var _mem = d.value["mem"] ? d.value["mem"] : 0; return -Math.floor(Math.max(_cpu, _mem) / 5); },
"width": 10, "height": function(d){ var _cpu = d.value["cpu"] ? d.value["cpu"] : 0;
var _mem = d.value["mem"] ? d.value["mem"] : 0; return Math.floor(Math.max(_cpu, _mem) / 5);},
"fill": function(d){ var _cpu = d.value["cpu"]; var _mem = d.value["mem"];
var _value = Math.floor(Math.max(_cpu, _mem) / 10);
if(_value <= 3){ return "green"; } else if(_value <= 6){ return "yellow"; } else{ return "red"; } } });
*/
				// push into transaction data.
//				_elemEnter.each( function(d,i){
				_elem.each( function(d,i){
					if( d["parent"] ){
						var _id       = appIndexMapper[d["name"]];
						var _parentID = appIndexMapper[d["parent"]];
						ThingsToAnimate.push(new ServerLineClass(_id, _parentID, d["queries"]));
/*
						if( d["cargo"] ){
							debuglog( d["name"] + " has " + d["cargo"].length +
								" transactiThingsToAnimate.lengthons to create to parent: " + d["parent"] );
							var slc = new ServerLineClass( _id, _parentID, d["queries"] );
							ThingsToAnimate.push( slc );
							//for(var j=0; j < d["cargo"].length; j++) {
							//	var transaction = d["cargo"][j];
							//	var sdt = new SampleDataTransaction( transaction, _id,
							//		_parentID, d["cargo"].length // dummy rate: 3
							//	);
							//	SampleDataTransactions.push( sdt );
							//	ThingsToAnimate.push( sdt );
							//}
						}
						else{
							debuglog( d["name"] + "("+_id+") disconnected with: " +
								d["parent"] +"("+_parentID+")" );
							ThingsToAnimate.push( new ServerLineClass( _id, _parentID, "0") );
						}
//*/
					}
					else{
						debuglog("no 'parent'");
					}
				} );
			} // end bind visuals to data

			function postProcessVisuals(){
				var transforms = [].slice.call( document.getElementById('app-entity-container').getElementsByTagName('g') );
				for(var i=0; i<transforms.length; i++){
					var _appNumber    = transforms[i].getAttribute("appNumber");
					var imageTransform = transforms[i].getElementsByTagName('image')[0];

					var _transform_text = transforms[i].getAttribute("transform");
					var _translate_text = _transform_text.substr(10);
					var _value_arr = _translate_text.split(/[\s,()]+/); // split via regular expression.
					var _x_text = _value_arr[0];
					var _y_text = _value_arr[1];
					transforms[i]._x = Number(_x_text);
					transforms[i]._y = Number(_y_text);

					$compile( transforms[i] )($scope);

					var widthOffset  = imageTransform.getAttribute("width");
					var heightOffset = imageTransform.getAttribute("height");
					imageTransform.setAttribute("x", -(widthOffset / 2));
					imageTransform.setAttribute("y", -(heightOffset / 2));

					var keyToAdd = _appNumber;
					assocEntityArray[keyToAdd] = transforms[i];
				}

				// calculate the height scale for the bars at the bottom.
/*
				var _max_height = 1;
				for(var i = SampleDataTransactions.length; i--;){
					_max_height = Math.max(_max_height, Number(SampleDataTransactions[i].transactionData["count"]) );
				}
				// Create the SVG Elements for Each Transaction.
				d3.select("#transaction-container")
					.selectAll("image")
					.data(SampleDataTransactions)
					.enter()
					.append("image")
					.classed({
						"colorred":    function(d){ return d.transactionData["risk"] == "high"; },
						"coloryellow": function(d){ return d.transactionData["risk"] == "medium"; },
						"colorgreen":  function(d){ return d.transactionData["risk"] == "low"; }
					})
					.attr({
						"xlink:href": function(d){
							if(d.transactionData["count"] <= (_max_height * 0.25))
								return "/Content/Images/satellite_demo/openclipart_org/data_small_cargo.png"
							else if(d.transactionData["count"] <= (_max_height * 0.5))
								return "/Content/Images/satellite_demo/openclipart_org/data_medium_cargo.png"
							else return "/Content/Images/satellite_demo/openclipart_org/data_large_cargo.png"
						},
						"height": "32",
						"width": "32"
					})
					.each(function(d, i){ // attempt to call bind objects here.
						var appKey    = d.appID;
						var serverKey = d.serverID;
						d.bindHTMLObjects(this, assocEntityArray[appKey], assocEntityArray[serverKey], getStyle(d));
					})
					.on("mouseover", function(d){
						$scope.stopAnimation();
						$scope.transaction_tool_tip.show(d, document.getElementById("title-header"));
					})
					.on("mouseout", function(d){
						$scope.startAnimation();
						$scope.transaction_tool_tip.hide(d);
					})
				;
//*/
			}

			function createTransactionToolTips(){
				var _svg = d3.select("#svg-container");//bcc");
				var _tip = d3.tip()
						.attr('class', 'd3-tip')
						.offset([-10, 0])
						.html(function(d) {
							if(d){
								var span_color_white = "<span style='color:white'> ";
								var span_color_risk = "<span style='color:green'> Risk: ";
								switch(d.transactionData["risk"]){
									case "high":
										span_color_risk = "<span style='color:red'> Risk: ";
										break;
									case "medium":
										span_color_risk = "<span style='color:orange'> Risk: ";
										break;
								}
								return span_color_risk + d.transactionData["risk"] + "</span>"
									+ "<div>"
									+ span_color_white
									+ "Transaction Count: " + d.transactionData["count"] + "</span>"
									+ "</div>"
								;
							}
							else{
								return "";
							}
						});
				if( _svg && _tip ){
					_svg.call(_tip);
					return _tip;
				}
				return null;
			}

			function createNodeToolTips(){
				var _svg = d3.select("#svg-container"); //bcc
				var _tip = d3.tip()
						.attr('class', 'd3-tip')
						.offset([-10, 0])
						.html(function(d) {
/*
if(d.value["active"]){ var color_string_cpu = "<span style='color:white'>";
if(d.value["cpu"] >= 70){ color_string_cpu = "<span style='color:red'>"; }
else if(d.value["cpu"] >= 50){ color_string_cpu = "<span style='color:orange'>"; }
var color_string_mem = "<span style='color:white'>";
if(d.value["mem"] >= 70){ color_string_mem = "<span style='color:red'>"; }
else if(d.value["mem"] >= 50){ color_string_mem = "<span style='color:orange'>"; }
var string_transactions = ""; if(d.value["cargo"]){ string_transactions = "<div><span style='color:white'>"
+ "Transactions: " + d.value["cargo"].length + "</span></div>"; }
return color_string_cpu + "cpu-usage: "  + d.value["cpu"] + "</span>"
+  color_string_mem + " mem-usage: " + d.value["mem"] + "</span>" + string_transactions ; } else
*/
							return "<span style='color:red'> INSERT-DATA </span>";

						});
				_svg.call(_tip);
				return _tip;
			}

			// style definitions
			function getStyle (d){
				switch(d.transactionData["risk"]){
					case "high":   return "filter:url(#colorMatrixFilter_red);";
					case "medium": return "filter:url(#colorMatrixFilter_yellow);";
					case "low": // return "filter:url(#colorMatrixFilter_green);";
					default:	   return "filter:url(#colorMatrixFilter_green);";
				}
			}

//////////////////////////////////////////////////////////////////////////////////////////
//////////// Instructions to Execute. ////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

			if(!$scope.transaction_tool_tip){
				$scope.transaction_tool_tip = createTransactionToolTips();
			}

//			processNode(dataset);
			// data set no longer  starts with an associated array, but rather a normal array.
			if( $scope.behavior_analytics.length == 0 ){
				for( var i = 0; i < dataset.length; i++ ) processUserDataBehavior(dataset[i]);
				$scope.selected = $scope.behavior_analytics[0];
			}

			$scope.add_test_zoom();

			bindVisualsToData(); // servers.
			postProcessVisuals();
		};

//////////////////// END BIND SAMPLE DATA FUNCTION /////////////////////////////////

		$scope.timeElapsed = 0;
		$scope.lastUpdate  = Date.now();
		var shouldRedraw = false;
		$scope.update = function () {
			var now = Date.now();
			var deltaTime = ((now - $scope.lastUpdate) / 1000);
			$scope.timeElapsed += (deltaTime * 1000);
			$scope.lastUpdate = now;

//			console.log("[scope.update] ThingsToAnimate.length: " + ThingsToAnimate.length);

			for(var i=ThingsToAnimate.length; i--;) {
				ThingsToAnimate[i].update(deltaTime);
			}

			if($scope.timeElapsed > poll_time_window){
				$scope.behavior_analytics = []; //
				ThingsToAnimate.forEach(function(iter){ iter.reset(); })

				$scope.refresh_data();
				$scope.timeElapsed = 0;
			}

/*
			if(sharedService && shouldRedraw != sharedService.message){
				console.log("[resize-callback-smc_velocity] status: " + sharedService.message);
				timeline_brushHistory.resize_brush();
			}
			shouldRedraw = sharedService.message;
*/

			$scope.executedOnce = true;
			$scope.dragging_object = false;
		};

		$scope.refresh_data = function(){

			cleanup_servers();
//			$scope.behavior_analytics = [];

			$scope.stopAnimation();
			$scope.get_data_entities();

		};

		// TimeLineAnimation: is a "class" that contains the behavior
		// to animate the scrolling line showing the tie lapse
		// on the brush handles.
		function TimeLineAnimation(brushInput, tHeight, fxnCallBack){
			// reference to the brush zone to allow for ".resize" handles to be grabbed.
			this.brushInput = brushInput;

			this.fxnCallBack = fxnCallBack;

			// create the line variable.
			this.lineAnimate = this.brushInput.append("line")
				.attr("transform", "translate(0,0)")
				.attr({
					"x1": 0,
					"x2": 0,
					"y1": 0,
					"y2": tHeight,
					"stroke-width": 1,
					"stroke": "red"
				});

			this.interpolateT = 0;

			this.reset = function(){ this.interpolateT = 0; };
			this.cleanup = this.reset; // alfredt: temp

			this.syncInterpolation = function(t){ this.interpolateT = t; };

			this.update = function(deltaTime){

				this.interpolateT += (deltaTime * ( 1000 / poll_time_window ));

				var transforms = [];
				this.brushInput.selectAll(".resize")
					.each(function(){
						var resizeTransform = d3.select(this).attr("transform");
						var stringManipulation = resizeTransform.substr(10);
						stringManipulation = stringManipulation.substr(0, stringManipulation.length - 3);
						var xText = Number( stringManipulation );
						transforms.push(xText);
					});


				if(transforms.length >= 2){
					var xValue = lerp(transforms[1], transforms[0], this.interpolateT);
					this.lineAnimate.attr("transform", "translate(" + xValue + ",0)");
					this.fxnCallBack(this.interpolateT);
				}
			};
		}

		/***
		 * Draws the brush scrub at the bottom.
		 * TODO: add dynamic polling to grab new set of data.
		 * SOURCE: http://bl.ocks.org/mbostock/4349545
		 */
		function TimeLine_BrushHistory() {

			var brush_rect = null;
			var _brush = null;
			var _brushg = null;
			var _timelineAnim = null;

			this.resize_brush = function(){
				var oldTimeLineInterpolate = 0;
				if(_timelineAnim){
					oldTimeLineInterpolate = _timelineAnim.interpolateT;

					var index = ThingsToAnimate.indexOf(_timelineAnim);
					if( index > -1 ){
						ThingsToAnimate.splice(index, 1);
					}
				}

				// clean up dom elements.
				var base_html_brush = document.getElementById("brush");
				while(base_html_brush.firstChild){
					base_html_brush.removeChild(base_html_brush.firstChild);
				}

				this.create_brush();
				if(_timelineAnim){
					_timelineAnim.interpolateT = oldTimeLineInterpolate;
				}
			};

			this.brushstart = function() {
				brush_svg.classed("selecting", true);
			};

			this.brushmove = function() {
				var s = _brush.extent();
				if(brush_rect){
					brush_rect.classed("selected", function (d) {
						var xIndex = d.transactionData["slot"] * (1000 / poll_time_window);
						return s[0] <= xIndex && xIndex <= s[1];
					});
				}
			};

			this.brushend = function() {
				brush_svg.classed("selecting", !d3.event.target.empty());
			};
		}

		$scope.draw_legend = function( x, y, legendData, legendTitle ) {
			debuglog("[velocity.js/draw_legend()]");

			var _svg = d3.select("#svg-container");//bcc");
			var _legend = _svg.append('g')
							.attr({
								"class": "nv-legends",
								"transform": "translate("+x+","+y+")"
							});
			_legend.append("text")
				.attr({
					"dx": 10, "dy": 20,
//					"font-weight": 900
				})
				.text( legendTitle );

			var _TITLE_OFFSET = 35;

			var legends = _legend.selectAll(".nv-legend")
				.data(legendData)
				.enter()
				.append('g')
				.attr({
					"class": function(d, i) {
						return "nv-legend ordinal-" + i;
					},
					"transform": function(d,i){
						return "translate(0,"+ ((i * 20) + _TITLE_OFFSET) + ")";
					}
				});

			legends.append('rect')
				.attr({
					"width": 15,
					"height": 15,
					"fill": function (d) { return d.color; }
				});

			legends.append("text")
				.attr({
					"dx": 20,
					"dy": 15
				})
				.text( function(d){ return d.name; } );
		};

		// draws the brush
		var timeline_brushHistory = null;// new TimeLine_BrushHistory();

		var oldOnLoad = window.onload; // alfredt: hack.
		window.onload = function () {


			if (oldOnLoad) {
				oldOnLoad();
			}

			post_document_load();
			var old_document_on_load = window.document.body.onload;
			window.document.body.onload = function(){

				if(old_document_on_load){
					old_document_on_load();
				}
				post_document_load();
			};
		}

		function ping_until_can_execute(){
			if(!post_document_load_execution){
				post_document_load();
				if(!post_document_load_execution){
					debuglog("Did not succeed call again in 1 second...")
					setTimeout(ping_until_can_execute, 1000);
				}
			}
		}

		$scope.selectedIndex = 0;

		var post_document_load_execution = false;
		function post_document_load() {
			if(post_document_load_execution) return;
			post_document_load_execution = (document.getElementById("svg-container") != null);

			var alertChange = function() {
				// get the data value and index from the event
//				var selectedValue = d3.event.target.value;
				$scope.selectedIndex = d3.event.target.selectedIndex;
				var string_to_show = "You selected the option at index " + $scope.selectedIndex
//					+ ", with value attribute "	+ selectedValue
				;
				console.log(string_to_show); // alert

				// RESET
//				cleanup_servers();

				$scope.refresh_data();
				ThingsToAnimate.forEach(function(iter){ iter.reset(); })
				$scope.timeElapsed = 0;
			}

			//add this event listener to the first menu (as a whole):
			d3.select("#dropdown-list-velocity").on("change", alertChange);


			var legend_data_2 = [{ "color": "#008", "name": "Policier" }
				               , { "color": "#080", "name": "Extractor" }
				               , { "color": "#888", "name": "Observer" }];
			// alfredt: removing call to draw legend because reasons.
//			$scope.draw_legend( 0, 0, legend_data_2, "Legend");
		}

		//http://jsfiddle.net/simpulton/xqdxg/
		$rootScope.$on("rootScope:broadcast", function(){
			console.log("onRootScopeBroadcast: ");
		});

		$scope.$on("rootScope:broadcast", function(){
			console.log("onScopeBroadcast: " );
		});

//////// ACTIONS TO EXECUTE ////////////

		var poll_time_window = 60000;
		$scope.get_data_entities();

		ping_until_can_execute(); // no need to draw legend anymore.

/////////////////////////////////////////

/*
	var oldOnResize = window.onresize; // alfredt: hack.
	window.onresize = function(){

		var resize_content   = document.getElementById("div_smc_velocity");
		var resize_content_1 = document.getElementById("smc_velocity_cards");
		var resize_content_2 = document.getElementById("svg-container");

		var resize_content_3 = document.getElementById("brush-div");
		var BOTTOM_OFFSET = 120;
		var RIGHT_OFFSET  = 113;

		if( resize_content   && resize_content_1
		 && resize_content_2 && resize_content_3 ){
			var bounds = resize_content.getBoundingClientRect();

			resize_content_1.style.width  = bounds.width+"px";
			resize_content_1.style.height = (bounds.height - BOTTOM_OFFSET)+"px";
			resize_content_2.style.width  = bounds.width+"px";
			resize_content_2.style.height = (bounds.height - BOTTOM_OFFSET)+"px";

			resize_content_3.style.width = (bounds.width - RIGHT_OFFSET)+"px";
		}

		if(brush_svg != null){
			if(!brush_svg_transform_string_base){
				brush_svg_transform_string_base = brush_svg.attr("transform");
			}
			var scale_amount = 1;
			scale_amount = ((resize_content_3.getBoundingClientRect().width) / 500);
		}

		if(oldOnResize){
			oldOnResize();
		}
	};
*/

	}
	var brush_svg_transform_string_base = null;


})(window,document);
//zii
