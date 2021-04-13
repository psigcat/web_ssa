(function() {
'use strict';

/**
 * Main Controller
 */
angular.module('app').controller('mainController', Controller);

Controller.$inject = [
    'mapService', 
    'loggerService',
    'placesService', 
    '$timeout', 
    '$scope'
];

	function Controller(mapService, loggerService, placesService, $timeout, $scope) {

		//****************************************************************
    	//***********************     APP SETUP      *********************
    	//****************************************************************
		
		$scope.backgroundmap				= 1;
		$scope.infoPanel					= false;			//show/hide panel with town info
		$scope.windowReports				= false;			//show/hide reports panel
		$scope.windowReport1				= false;			//show/hide report1 panel
		var baseHref,
			token,
			urlWMS,
			urlWMSqgis,
			isMobile,
			mapid,
			mapname,
			mouseX,
			mouseY,
			zoomTrigger 					= 14,								//zoom level for trigger active layer change
			version							= "1.0.0",

			carrersNames = null,
            carrersNamesArray = null;

			//$('#info').hide();
		$scope.initApp	= function(_baseHref,_urlWMS,_urlWMSqgis,_environment,_token,_isMobile,_mapid,_mapname){
		
			baseHref			= _baseHref;
			token				= _token;
			urlWMS				= _urlWMS;
			urlWMSqgis			= _urlWMSqgis;
			isMobile			= parseInt(_isMobile);
			mapid				= _mapid;
			mapname				= _mapname;
			//logger service init
			loggerService.init(_environment);
			log("init("+_baseHref+","+urlWMS+","+urlWMSqgis+","+_environment+","+_token+","+_isMobile+","+_mapid+","+_mapname+")");
	
			// search initialisation
			placesService.init(baseHref,_token);
			
			// map initialisation
			mapService.init(urlWMS,urlWMSqgis,$scope.backgroundmap,zoomTrigger,placesService,mapid,mapname);

			// load carrers
            $.when(
                $.getJSON("js/data/carrers.json", {})   
                .done (function( data ) {
                    $scope.carrersNames = data;
                    $scope.carrersNamesArray = Object.keys(data);
                })
                .fail(function(data) {    
                    console.log("json error in carrers.json");  
                })
            ).then(function() { 
                //console.log("json file carrers.json loaded!");
            });

            // search carrer autocompletion
            $("#searchCarrer").autocomplete({
                source: function( request, response ) {
                    response( $.ui.autocomplete.filter(
                        $scope.carrersNamesArray, $scope.extractLast( request.term ) ) );
                },
                focus: function(event, ui) {
                    $(this).val(ui.item.label);
                    return false;
                },
                select: function(event, ui) {
                    var id = $scope.carrersNames[ui.item.label];
                    //console.log("look up carrer", id);
                    $scope.searchCarrersNum(id);
                    return false;      
                }
            });

		    // search number selection
            $("#searchNumero").on("change", function() {
                var x = Number(this.options[this.selectedIndex].getAttribute('data-x'));
                var y = Number(this.options[this.selectedIndex].getAttribute('data-y'));
                
                if ($scope.isNumeric(x) && $scope.isNumeric(y)) {
					mapService.zoomToCoord(x,y);
				}

                return false;
            });

            // search poligons list fill
            $.when(
                $.get("js/data/poligons.txt", {})   
                .done (function( data ) {
                	var poligons = data.split("\n");
                	for (var i in poligons) {
				    	$("#searchPoligon").append('<option value="'+poligons[i]+'">'+poligons[i]+'</option>');
				    }
                })
                .fail(function(data) {    
                    console.log("error in poligons.txt");  
                })
            ).then(function() { 
                console.log("file poligons.txt loaded!");
            });

		    // search poligon selection
            $("#searchPoligon").on("change", function() {
            	//console.log(this.options[this.selectedIndex].value);
                var value = this.options[this.selectedIndex].value;
                
                if (value) {
					log("getCatasterRefFromPoligon: "+value);

					placesService.getCatasterRefFromPoligon(value).then(function(data) {
						console.log(data);
						$("#searchParcela").empty();
                        $("#searchParcela").append('<option value="-1">-  Triï una opció  -</option>');

					    // add results to select
					    for (var i in data.message) {
					    	$("#searchParcela").append('<option data-x="'+data.message[i].x+'" data-y="'+data.message[i].y+'" data-geom="'+$scope.htmlEntities(data.message[i].geom)+'">'+data.message[i].parcela+'</option>');
					    }
					})
					.catch(function (error) {
					 	log("error in getCatasterRefFromPoligon: ", error);
				    });
				}

                return false;
            });


		    // search parcela selection
            $("#searchParcela").on("change", function() {
                var x = Number(this.options[this.selectedIndex].getAttribute('data-x'));
                var y = Number(this.options[this.selectedIndex].getAttribute('data-y'));
                var geom = this.options[this.selectedIndex].getAttribute('data-geom');

                if ($scope.isNumeric(x) && $scope.isNumeric(y)) {
					mapService.zoomToCoord(x,y);
					mapService.highlightPoligon(geom);
				}

                return false;
            });


            $(".btn-searchCatasterRef").click(function() {
				var $ref = $("#searchReferencia").val();

				placesService.getCatasterRef($ref).then(function(data) {
					//console.log(data.message);
					//console.log(data.message.pcat1, data.message.pcat2);
					//console.log(data.message.x, data.message.y);
					mapService.zoomToCoord(data.message.x,data.message.y);
					mapService.highlightPoligon(data.message.geom);
				})
				.catch(function (error) {
				 	log("error in getCatasterRef:", error);
			    });
			});

			$(".btn-searchLoc").click(function() {
				var x = Number($("#searchX").val());
				var y = Number($("#searchY").val());

				if ($scope.isNumeric(x) && $scope.isNumeric(y)) {
					mapService.zoomToCoord(x,y);
				}
			});

		}
		
		$scope.searchResultsContainer = window.document.querySelector('.window.search');
		
		//****************************************************************
    	//*********************      SELECT TOWN       *******************
    	//****************************************************************
	
		$scope.$on('featureInfoReceived', function(event, data) {

			log("featureInfoReceived",data);

			//show window
			$scope.infoPanel = true;
			$("#infoPanel").show();
	    });

		//****************************************************************
    	//***********************        SEARCH        *******************
    	//****************************************************************

		$scope.searchCarrersNum	= function($id) {
			log("getStreetNum: "+$id);

			placesService.getStreetNum($id).then(function(data) {
				//log("getStreetNum received num: ", data.total);

				/*console.log(data.message);
				var reg = data.message.sort(function(a, b){
				    return a.num - b.num;
				});
				console.log(reg);*/

			    // add results to select
			    $("#searchNumero").empty();
			    $("#searchNumero").append('<option value="-1">-  Triï una opció  -</option>');
			    for (var i in data.message) {
			    	var geom = JSON.parse(data.message[i].geom);
			    	$("#searchNumero").append('<option data-x="'+geom.coordinates[0][0]+'" data-y="'+geom.coordinates[0][1]+'">'+data.message[i].num+'</option>');
			    }
			})
			.catch(function (error) {
			 	log("error in getStreetNum: ", error);
		    });
		};

		// search helper functions for autocomplete
        $scope.split = function( val ) {
            return val.split( /,\s*/ );
        };

        $scope.extractLast = function( term ) {
            return $scope.split( term ).pop();
        };

        $scope.isNumeric = function(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		};

		$scope.htmlEntities = function(str) {
		    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		/*
		$scope.searchCatasterRef = function() {
			var $ref = $("#searchReferencia").val();
			console.log("searchCatasterRef", $ref);

			placesService.getCatasterRef($ref).then(function(data) {
				console.log(data.message);
				//console.log(data.message.pcat1, data.message.pcat2);
				//console.log(data.message.x, data.message.y);
				mapService.zoomToCoord(data.message.x,data.message.y);
				mapService.highlightPoligon(data.message.geom);
			})
			.catch(function (error) {
			 	log("error in getCatasterRef:", error);
		    });
		};

		$scope.searchLoc = function() {
			var x = Number($("#searchX").val());
			var y = Number($("#searchY").val());

			if ($scope.isNumeric(x) && $scope.isNumeric(y)) {
				mapService.zoomToCoord(x,y);
			}
		};
		*/

		//****************************************************************
    	//***********************        REPORTS       *******************
    	//****************************************************************

		$scope.toggleReports 	= function(what){
			log("toggleReports("+what+")");
			if(parseInt(what)===0){
				$scope.windowReports = false;
			}else{
				$scope.windowReports = true;
			}
		}

		$scope.toggleReport 	= function(what, num){
			log("toggleReport"+num+"("+what+")");
			if(parseInt(what)===0){
				$scope.windowReport1 = false;
			}else{
				$scope.windowReport1 = true;
			}			
		}

		//****************************************************************
    	//***********************   HELPER METHODS   *********************
    	//****************************************************************

		//log event
		$scope.$on('logEvent', function (event, data){
			if(data.extradata){
				log(data.evt,data.extradata);
			}else{
				log(data.file+" "+data.evt);	
			}			
		});
		
		function log(evt,extradata){
			if(extradata){
				loggerService.log("app_ssa -> MainController.js v."+version,evt,extradata);
			}else{
				loggerService.log("app_ssa -> MainController.js v."+version,evt);	
			}			
		}
	}
})();