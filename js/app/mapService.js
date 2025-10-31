(function() {
'use strict';

/**
 * Map Service
 */
angular.module('app').factory('mapService', map_service);

var map							= null;		//map
var backgroundMap				= null;		//backgroundMap 1- CartoDB light, 2- CartoDB dark
var backgroundMapUrl			= 'https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
var customLayer					= null;		//wms layer
var highLightLayer				= null;		//layer for highlighted town
var highLightSource				= null;		//source for highlifgted polygon
var viewProjection 				= null;
var viewResolution 				= null;
var raster						= null;		//background raster
var filename 					= "mapService.js";
var lastMouseMove				= new Date().getTime()+5000;
var currentLayer				= null;		//current WMS layer
var	baseHref 					= null;
var urlWMS						= null;		//WMS service url
var urlWMSqgis					= null;		//WMS service url qgis
var highLightStyle				= null;		//ol.style for highlighted feature
var currentZoomLevel			= 14;
var mainLayer					= null;		//main layer, in this case dbwater_rend is a layer that contains layers
var layers						= null;		//layers contained in mainLayer (dbwater_rend)
var zoomTrigger					= null;		//zoom level for trigger active layer change
var activeLayer 				= null;
var iconLayer					= null;
var iconPoint					= null;
var parcelaLayer				= null;
var parcelaSource				= null;
var placesService 				= null;
var renderedLayers				= {};
var qgisSources					= {};
var qgisSublayerSources 		= {};
var layerSwitcher;
var mainBar, subBar, mainToggle, catastroLayer;
var baseLayers;
var mapid, mapname;
var QGIS_PROJECT_FILE;
var overlays;

// Measure
// http://openlayers.org/en/latest/examples/measure.html
var sketch;
var helpTooltipElement;
var helpTooltip;
var measureTooltipElement;
var measureTooltip;
var continuePolygonMsg = 'Click per continuar dibuixant el polígon';
var continueLineMsg = 'Click per continuar dibuixant la línea';
var helpMsg = 'Clica per iniciar el dibuix';
var draw;
var measureSource;
var measureActive = false;
var printSource, printLayer, translatePrintBox, 
	printTemplate = "DinA4";

map_service.$inject 	= [ 
    '$http',
    '$rootScope'
];

function map_service($http,$rootScope){
	if (!ol) return {};

	function resize(){
		log("resize()");
		if(map){
			map.updateSize();
		}
	}

	function init(_baseHref,_urlWMS,_urlWMSqgis,_backgroundMap,_zoomTrigger,_placesService,_mapid,_mapname){
		log("init("+_baseHref+","+_urlWMS+","+_urlWMSqgis+","+backgroundMap+","+_zoomTrigger+")");

		//****************************************************************
    	//***********************      LOAD MAP    ***********************
    	//****************************************************************
		backgroundMap				= _backgroundMap;
		baseHref 					= _baseHref;
		urlWMS						= _urlWMS;
		urlWMSqgis					= _urlWMSqgis;
		zoomTrigger					= _zoomTrigger;
		placesService 				= _placesService;
		var projection 				= ol.proj.get('EPSG:4326');
		var extent    				= [-1.757,40.306,3.335,42.829];
		urlWMSqgis					= _urlWMSqgis;
		mapid						= _mapid;
		mapname						= _mapname;
		QGIS_PROJECT_FILE			= "/home/ubuntu"+baseHref+mapid+".qgs";

		console.log(QGIS_PROJECT_FILE);

		// register projection
		proj4.defs("EPSG:25831", "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0+units=m +no_defs");
		if (ol.proj.proj4 && ol.proj.proj4.register) { ol.proj.proj4.register(proj4); }
	
		//background raster
		raster 					= new ol.layer.Tile({ });
		//view
		var view = new ol.View({
								//projection: projection,
		  						//extent: extent,
		  						center: [199042,5077018],
		  						zoom: currentZoomLevel,
		  						minZoom: 13,
		  						maxZoom: 20
		});

		var resolutionsBG 		= new Array(18);
		var matrixIdsBG 		= new Array(18);
		var projectionExtentBG 	= projection.getExtent();
		var sizeBG = ol.extent.getWidth(projectionExtentBG) / 512;
		for (var z = 0; z < 18; ++z) {
			// generate resolutions and matrixIds arrays for this WMTS
			resolutionsBG[z] = sizeBG / Math.pow(2, z);
			matrixIdsBG[z] = "EPSG:4326:" + z;
		}

		let baseLayerNull = new ol.layer.Tile({
								name: 'baseLayerNull',
			                    title: 'Cap fons',
			                    type: 'base'
			                });

		let baseLayerTopo = new ol.layer.Tile({
								name: 'baseLayerTopo',
		                        title: 'Topogràfic 1:5.000 (by ICGC)',
		                        type: 'base',
		                        visible: false,
		                        source: new ol.source.TileWMS({
									url: 'https://geoserveis.icgc.cat/servei/catalunya/topografia-territorial/wmsservice?',
						            params: {
						            	'LAYERS': 'topografia-territorial', 
						            	'VERSION': '1.1.1'
						            },
						            attributions: 'Institut Cartogràfic i Geològic de Catalunya CC-BY-SA-3'
						        })
		                    });

		let baseLayerFoto = new ol.layer.Tile({
		                        title: 'Ortofoto (by ICGC)',
		                        type: 'base',
		                        visible: false,
		                        source: new ol.source.WMTS({
									url: 'https://www.ign.es/wmts/pnoa-ma',
					                layer: 'OI.OrthoimageCoverage',
									matrixSet: 'EPSG:4326',
									//matrixSet: 'EPSG:3857',
									format: 'image/png',
									projection: ol.proj.get('EPSG:4326'),
									tileGrid: new ol.tilegrid.WMTS({
									  origin: ol.extent.getTopLeft(projectionExtentBG),
									  resolutions: resolutionsBG,
									  matrixIds: matrixIdsBG
									}),
									style: 'default',
						            attributions: 'Institut Cartogràfic i Geològic de Catalunya CC-BY-SA-3'
							 	})
		                    });

		let baseLayerDark = new ol.layer.Tile({
		                        title: 'OpenStreetMap, estilo Dark Matter (by Carto)',
		                        type: 'base',
		                        visible: false,
		                        source: new ol.source.XYZ({
		                        	url: 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
		                        	attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/about-carto/">CARTO</a>',
		                        })
		                    });

		let baseLayerPositron = new ol.layer.Tile({
		                        title: 'OpenStreetMap, estilo Positron (by Carto)',
		                        type: 'base',
		                        visible: true,
		                        source: new ol.source.XYZ({
		                        	url: 'https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
		                        	attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/about-carto/">CARTO</a>',
		                        })
		                    });

		baseLayers = [
			baseLayerNull,
			baseLayerTopo,
			baseLayerFoto,
			baseLayerDark,
			baseLayerPositron
		];

		// load QGS project definition from parsed file
		$.when(
            $.getJSON("js/data/"+mapid+".qgs.json", {})   
            .done (function( data ) {

	            overlays = data;

				//map
				map = new ol.Map({
	        			/*controls: ol.control.defaults().extend([
							new ol.control.ScaleLine({
							units: 'degrees'
						})
					]),*/				
					target: 'map',
					layers: [
						new ol.layer.Group({
			                'title': 'Capes de referència',
			                layers: baseLayers
			            }),
			            new ol.layer.Group({
			                title: 'Capes temàtiques',
			                layers: getLayerOverlays()
			            })
					]
				});

				map.set("urlWMSqgis", urlWMSqgis);
				map.set("QGIS_PROJECT_FILE", QGIS_PROJECT_FILE);

		        //map.addLayer(raster);
		        map.setView(view);
				viewProjection = view.getProjection();
				viewResolution = view.getResolution();

				setHighLightStyle();
				setQgisLayerSources();
				setQgisSubLayerSources();

				layerSwitcher = new ol.control.LayerSwitcher({ 
					target: document.getElementById("layerswitcher"),
					urlWMSqgis: urlWMSqgis,
					QGIS_PROJECT_FILE: QGIS_PROJECT_FILE
				});
			    map.addControl(layerSwitcher);
			    layerSwitcher.panel.onmouseout = function (e) {
		            //overwrite default behaviour to keep layerswitcher open
		        }

		    	//****************************************************************
		    	//***********************     CLICK EVENT  ***********************
		    	//****************************************************************
		    
				map.on('click', function(evt) {
					//log("click coordinates: "+evt.coordinate);

					if (!measureActive) {
						selectFeatureInfo(evt.coordinate);
						showIcon(evt.coordinate);
					}
				});

				map.on('pointermove', function(evt) {

					if (measureActive) {
						pointerMoveHandler(evt);
					}
					/*else {
						// change mouse pointer when hovering
						if (evt.dragging) {
							return;
						}
						let hit = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
							return true;
						});
						map.getTargetElement().style.cursor = hit ? 'pointer' : '';
					}*/
				});

				$(document).keyup(function(e) {
					if (e.keyCode == 27) { // escape
				    	map.removeInteraction(draw);
				    	map.removeOverlay(measureTooltip);
				    	removeHelpTooltip();
				    	$('.tooltip').addClass('hidden');
				    	mainToggle.toggle();
				    	removeMeasure();
					}
				});

				$( document ).ready(function() {
					layerSwitcher.showPanel();
				});
		    	
		    	//****************************************************************
		    	//******************  EVENT ZOOM LEVEL CHANGE  *******************
		    	//****************************************************************
		    	
		    	/*map.on('moveend', function(evt){
			    	var newZoomLevel = map.getView().getZoom();
			    	if (newZoomLevel != currentZoomLevel){
				      	currentZoomLevel = newZoomLevel;
				    }
			    });*/

		    	//****************************************************************
		    	//******************  MEASURE TOOL  ******************************
		    	//****************************************************************

				measureSource = new ol.source.Vector();

		    	var measureLayer = new ol.layer.Vector({
					source: measureSource,
					style: new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(255, 255, 255, 0.2)'
						}),
						stroke: new ol.style.Stroke({
							color: '#ffcc33',
							width: 2
						}),
						image: new ol.style.Circle({
							radius: 7,
							fill: new ol.style.Fill({
						  		color: '#ffcc33'
							})
						})
					})
		      	});

		        map.addLayer(measureLayer);

				initMeasureBar();

		    })
		    .fail(function(data) {    
                console.log("json error in "+mapid+".qgs.json");  
            })
        ).then(function() { 
            console.log("json file "+mapid+".json loaded!");
        });
	}

	function getLayerOverlays(external=false) {
		var layers = [];

        if (!external) {
	        layers.push(getMUC2Overlay());
	        layers.push(getMUCOverlay());
        	layers.push(getCatastroOverlay());
		}

	    for (var i=overlays.length-1; i>=0; i--) {

	    	var layer = overlays[i];

	    	var layer_name = null, 
	    		url = null,
	    		type = null,
	    		projection = null,
	    		version = null,
	    		transparent = null;

	    	if (!external && !layer.external) {

	    		// intern server (qgis or mapproxy)
	    		if (layer.mapproxy) {
		    		layer_name = layer.mapproxy;	// mapproxy
		    		url = urlWMS;
	    		}
	    		else {
		    		layer_name = layer.name;	// qgis
		    		url = urlWMSqgis;
	    		}
	    		type = layer.type;
	    		projection = 'EPSG:3857';
	    		version = '1.3.0';
	    		transparent = true;
	    	}
	    	else if (external && layer.external) {
	    		//console.log(external, layer.mapproxy, layer_name, url, layer_name && url);
	    		// extern server (wms)
	    		url = layer.wmsUrl;
	    		layer_name = layer.wmsLayers;
	    		type = "orto";
	    		projection = layer.wmsProjection;
	    		version = '1.1.1';
	    		transparent = false;
	    	}

	    	if (layer_name && url) {

				var layerSource = new ol.source.TileWMS({
					url: 		url,
					projection: projection,
					params: {
								'LAYERS': layer_name,
								'TRANSPARENT': transparent,
								'VERSION': version,
					},
					serverType: 'qgis',									
					//gutter: 	256
				});

	            let newLayer = 
	            	new ol.layer.Tile({
	            		title: layer.name,
	            		qgisname: layer.qgisname,
	            		mapproxy: layer.mapproxy,
	            		type: type,
						source: layerSource,
						showlegend: layer.showlegend,
	                    visible: layer.visible,
		                hidden: layer.hidden,
		                children: layer.children,
		                fields: layer.fields,
		                indentifiable: layer.indentifiable,
					});
				layers.push(newLayer);
				if (layer.name != "") {
					renderedLayers[layer.name] = newLayer;
				}
			}
		}

		return layers;
	}

	function getCatastroOverlay() {
        catastroLayer = new ol.layer.Tile({
            title: 'Cadastre',
            visible: false,
            source: new ol.source.TileWMS({
            	url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx',
	            params: {
	            	'LAYERS': 'catastro', 
	            	'TILED': true,
	            	'SRS': 'EPSG:3857'
	            },
	            //serverType: 'geoserver'
	        })
        });
        return catastroLayer;
	}

	function getMUCOverlay() {
		var layerTitle = 'Mapa Urbanístic de Catalunya (classificació)';

		qgisSources[layerTitle] = new ol.source.TileWMS({
           	url: 'https://dtes.gencat.cat/webmap/MUC/service.svc/get',
            params: {
            	'LAYERS': 'MUC_2CLAS', 
            	'TILED': true,
            },
            projection: 'EPSG:25831',
            //serverType: 'geoserver'
        });

        var muc = new ol.layer.Tile({
            title: layerTitle,
            visible: false,
            type: 'personal',
            source: qgisSources[layerTitle]
        });

        renderedLayers[layerTitle] = muc;

        return muc;
	}

	function getMUC2Overlay() {
		var layerTitle = 'Mapa Urbanístic de Catalunya (qualificació, sectors)';

		qgisSources[layerTitle] = new ol.source.TileWMS({
        	url: 'https://dtes.gencat.cat/webmap/MUC/service.svc/get',
            params: {
            	'LAYERS': 'MUC_4QUAL, MUC_3SECT', 
            	'TILED': true,
            },
            projection: 'EPSG:25831',
            //serverType: 'geoserver'
        });

        var muc = new ol.layer.Tile({
            title: layerTitle,
            visible: false,
            type: 'personal',
            source: qgisSources[layerTitle]
        });

        renderedLayers[layerTitle] = muc;

        return muc;
	}

	function setQgisLayerSources() {
		overlays.forEach(function(layer, i) {

			if (layer.name != "" && !layer.external) {

				let queryLayers = "";
		    	if (layer.indentifiable) {
		    		queryLayers = layer.name;
		    	}

		    	//console.log("group", layer.indentifiable, layer.name, urlWMSqgis);
            
	            qgisSources[layer.name] = 

					new ol.source.TileWMS({
						url: 		urlWMSqgis,
						params: {
									'LAYERS': layer.name,
									'TRANSPARENT': true,
									'QUERY_LAYERS': queryLayers,
						},
						serverType: 'qgis'  										
					});
			}
        });
	}

	// workaround to GetFeatureInfo
	function setQgisSubLayerSources() {
		overlays.forEach(function(layer, i) {

			if (layer.name != "" && 
				layer.hasOwnProperty('children')) {

				qgisSublayerSources[layer.name] = [];

				layer.children.forEach(function(sublayer, i) {

					if (sublayer.indentifiable) {

			    		//console.log("subgroup", layer.name, sublayer.name);

			            var source = new ol.source.TileWMS({
							url: 		urlWMSqgis,
							params: {
										'LAYERS': sublayer.name,
										'TRANSPARENT': true,
										'QUERY_LAYERS': sublayer.name,
							},
							serverType: 'qgis'  										
						});
						qgisSublayerSources[layer.name].push(source);
					}
				});
			}
        });
	}

	/* select feature info */
	function selectFeatureInfo(coordinates){

		log("selectFeature()", coordinates);

		//empty infoPanel
		$('#infoPanel .content').empty();
		$('#infoPanel .content-catastro').empty();
		$('#infoPanel .content-coord').empty();
		
		if(highLightSource){
	    	highLightSource.clear();
	    }

	    // load feature info process, check if all loaded
	    var itemsProcessed = 0;
	    var itemsTotal = 0;
	    var itemsResult = false;

	    Object.keys(qgisSources).forEach(function(key){

    		if (renderedLayers[key] && renderedLayers[key].getVisible()) {

    			//console.log(renderedLayers[key].get("title"));

	    		//console.log(key, source, coordinates);

				if (key.indexOf("Mapa Urbanístic de Catalunya") != -1) {
					// request to external server
					// workaround to avoid CORS

					var source = qgisSources[key];
					var url = source.getGetFeatureInfoUrl(
						coordinates, map.getView().getResolution(), viewProjection,
						{
							'INFO_FORMAT': 'text/xml', 
							'FEATURE_COUNT': 100,
							'FI_LINE_TOLERANCE': 10,
							'FI_POINT_TOLERANCE': 10,
							'FI_POLYGON_TOLERANCE': 0
						}
					);

					url = "https://go.yuri.at/cors/muc.php?url="+escape(url);

					$http.get(url).then(function(response){

					    if(response) {
					    	var xmlDoc = $.parseXML(response.data), 
								$xml = $(xmlDoc);
							
							$($xml.find('Layer')).each(function(){
								if ($(this).children().length > 0) {
									var layer = $(this);
									var layerName = layer.attr('Name');

									// copied from localhost requests to maintain standard
									var feature = layer;
									var id = feature.find('Attribute[Name="ID"]').text();

									//console.log(layerName, id);

									if (layerName != undefined && id != undefined) {

										$("#infoPanel").show();
									    $rootScope.$broadcast('featureInfoReceived',url);

										switch (layerName) {
											case "MUC_2CLAS":
								    			var html = "<h3>Mapa Urbanístic de Catalunya (classificació)</h3>";
												var codi = feature.find('Attribute[Name="CODI_CLAS_MUC"]').text();														
												var desc = feature.find('Attribute[Name="DESC_CLAS_MUC"]').text();														
												var codi_ajunt = feature.find('Attribute[Name="CODI_CLAS_AJUNT"]').text();														
												var desc_ajunt = feature.find('Attribute[Name="DESC_CLAS_AJUNT"]').text();														

												html += getHtmlP("Codi", codi);
												html += getHtmlP("Descripció", desc);
												html += getHtmlP("Codi Ajuntament", codi_ajunt);
												html += getHtmlP("Descripció Ajuntament", desc_ajunt);
												break;

											case "MUC_3SECT":
								    			var html = "<h3>Mapa Urbanístic de Catalunya (sectors)</h3>";
												var desc = feature.find('Attribute[Name="DESC_SECTOR_MUC"]').text();														

												var codi = feature.find('Attribute[Name="CODI_SECTOR_MUC"]').text();														
												var desc = feature.find('Attribute[Name="DESC_SECTOR_MUC"]').text();														
												var codi_ajunt = feature.find('Attribute[Name="CODI_SECTOR_AJUNT"]').text();														
												var desc_ajunt = feature.find('Attribute[Name="DESC_SECTOR_AJUNT"]').text();														

												html += getHtmlP("Codi", codi);
												html += getHtmlP("Descripció", desc);
												html += getHtmlP("Codi Ajuntament", codi_ajunt);
												html += getHtmlP("Descripció Ajuntament", desc_ajunt);
												break;

											case "MUC_4QUAL":
								    			var html = "<h3>Mapa Urbanístic de Catalunya (qualificació)</h3>";
												var desc = feature.find('Attribute[Name="DESC_QUAL_MUC"]').text();														

												var codi = feature.find('Attribute[Name="CODI_QUAL_MUC"]').text();														
												var desc = feature.find('Attribute[Name="DESC_QUAL_MUC"]').text();														
												var codi_ajunt = feature.find('Attribute[Name="CODI_QUAL_AJUNT"]').text();														
												var desc_ajunt = feature.find('Attribute[Name="DESC_QUAL_AJUNT"]').text();														

												html += getHtmlP("Codi", codi);
												html += getHtmlP("Descripció", desc);
												html += getHtmlP("Codi Ajuntament", codi_ajunt);
												html += getHtmlP("Descripció Ajuntament", desc_ajunt);
												break;
										}

										// for testing only: link to full info
									    //html += '<a target="_blank" href="' + url + '">.</a>';

										$('#infoPanel .content').append(html);
									}
								}
							});
						}
					});
				}

				else {
		    		// request to qgis server on localhost
		    		var sources = [];
		    		var url = "";
		    		var infoLayers = {};

		    		// get sublayers instead of layers GetFeatureInfo
		    		var sublayers = renderedLayers[key].get("children");
		    		//console.log(key, renderedLayers[key], sublayers);

		    		if (sublayers !== undefined) {
						//console.log(key, " -> GetFeatureInfo for sublayers: ", sublayers);
		    			sources = qgisSublayerSources[key];
		    			//console.log(sources);

		    			sublayers.forEach(function(sublayer) {
		    				infoLayers[sublayer.name] = sublayer["fields"];
		    			});
		    		}
		    		else if (renderedLayers[key].get("indentifiable")) {
		    			sources = [qgisSources[key]];
		    			infoLayers[key] = renderedLayers[key].get("fields");
					}
	    			//console.log("infoLayers", sources, infoLayers);

					sources.forEach(function(source, i) {

						//console.log(i, coordinates, source.getUrls(), source.getParams(), source.getProperties());

		    			// layer source
			    		url = source.getFeatureInfoUrl(
							coordinates, map.getView().getResolution(), map.getView().getProjection(),
							{
								'INFO_FORMAT': 'text/xml', 
								'FEATURE_COUNT': 100,
								'FI_LINE_TOLERANCE': 10,
								'FI_POINT_TOLERANCE': 10,
								'FI_POLYGON_TOLERANCE': 0,

							}
						);

						if (url) {
							log("url", url);
							itemsTotal++;

							$http.get(url+"&MAP="+QGIS_PROJECT_FILE).then(function(response){

								if(response) {

							    	var xmlDoc = $.parseXML(response.data), 
										$xml = $(xmlDoc);

									itemsProcessed++;
									
									$($xml.find('Layer')).each(function(){

										if ($(this).children().length > 0) {
											let layer = $(this);
											let layerName = layer.attr('name');

											//console.log(layerName);
											
											$(layer.find('Feature')).each(function(){

												if ($(this).children().length > 0) {

													itemsResult = true;

													let feature = $(this);
													let id = feature.find('Attribute[name="id"]').attr('value');
													if (id == undefined && layerName == "Activitats") 
														id = feature.find('Attribute[name="id_activitat"]').attr('value');

													if (layerName != undefined && id != undefined) {

													    $rootScope.$broadcast('featureInfoReceived',url);

														/*let ruta = 'files/';

														if (layerName.startsWith("@")) {
															layerName = layerName.substring(2);
														}
														let html = "<h3>"+layerName+"</h3>";

														let l = source.getParams()['LAYERS'];

														if (infoLayers[l] != undefined) {

															infoLayers[l].forEach(function(field){
																let value = feature.find('Attribute[name="'+field.name+'"]').attr('value');

																if (value.startsWith("../links/")) {
																	html += getHtmlA(field.name, "Veure fitxa", value);
																}
																else if (value.startsWith("http")) {
																	html += getHtmlAblank(field.name, "Veure fitxa", value);
																}
																else {
																	html += getHtmlP(field.name, value);
																}
															});

															// for testing only: link to full info
														    //html += '<a target="_blank" href="' + url + '">.</a>';

														    $('#infoPanel .content').append(html);
														}*/

														switch (layerName) {
															case "Patrimoni":
																var html = "<h3>Elements de patrimoni</h3>";
																var codi = feature.find('Attribute[name="Codi"]').attr('value');
																var nom = feature.find('Attribute[name="Nom"]').attr('value');
																var desc = feature.find('Attribute[name="Tipus"]').attr('value');
																var norm = feature.find('Attribute[name="Enllaç fitxa"]').attr('value');

																html += getHtmlP("Codi", codi);
																html += getHtmlP("Nom", nom);
																html += getHtmlP("Tipus", desc);
																html += getHtmlA("Fitxa", "Veure fitxa", norm, layerName);
																break;	

															case "Masies i cases rurals":
																var html = "<h3>Qualificacions: "+layerName+"</h3>";
																var nom = feature.find('Attribute[name="Nom"]').attr('value');
																var desc = feature.find('Attribute[name="Tipus"]').attr('value');
																var anne = feature.find('Attribute[name="Enllaç annex"]').attr('value');
																var norm = feature.find('Attribute[name="Enllaç normes"]').attr('value');
																
																html += getHtmlP("Nom", nom);
																html += getHtmlP("Tipus", desc);
																html += getHtmlA("Annex", "Veure annex", anne, layerName);
																html += getHtmlA("Normativa", "Veure normativa", norm, layerName);
																break;

															case "Catàleg":
												    			var html = "<h3>"+layerName+"</h3>";
																var codi = feature.find('Attribute[name="Codi"]').attr('value');
																var nom = feature.find('Attribute[name="Nom"]').attr('value');
																var desc = feature.find('Attribute[name="Tipus"]').attr('value');
																var fitxa = feature.find('Attribute[name="Enllaç fitxa"]').attr('value');
																var cod_tipus = feature.find('Attribute[name="cod_tipus"]').attr('value');
																var norm = feature.find('Attribute[name="Enllaç normes"]').attr('value');
																

																html += getHtmlP("Codi", codi);
																html += getHtmlP("Nom", nom);
																html += getHtmlP("Tipus", desc);
																html += getHtmlA("Fitxa", "Veure fitxa", fitxa, layerName);
																html += getHtmlP("Codi tipus", cod_tipus);
																html += getHtmlA("Normativa", "Veure normativa", norm, layerName);
																break;


															case "Corredors ambientals":
															case "Protecció dels rius":
															case "Aqüifers d'interès":
												    			var html = "<h3>"+layerName+"</h3>";
																var desc = feature.find('Attribute[name="Descripció"]').attr('value');
																var norm = feature.find('Attribute[name="Enllaç normes"]').attr('value');
																var link = feature.find('Attribute[name="Enllaç disposicions generals"]').attr('value');
																

																html += getHtmlP("Descripció", desc);
																html += getHtmlA("Normativa", "Veure normativa", norm, layerName);
																html += getHtmlA("Disposicions generals", "Veure disposicions generals", link, layerName);
																break;

															case "Àmbits al SU":
												    			var html = "<h3>Àmbits</h3>";
																var nom = feature.find('Attribute[name="Nom"]').attr('value');
																var norm = feature.find('Attribute[name="Enllaç normes"]').attr('value');
																var clau = feature.find('Attribute[name="Enllaç clau associada"]').attr('value');
																var generals = feature.find('Attribute[name="Enllaç disposicions comunes"]').attr('value');
																var especific = feature.find('Attribute[name="Enllaç disposicions específiques"]').attr('value');
																var usos = feature.find('Attribute[name="Enllaç usos generals"]').attr('value');

																html += getHtmlP("Nom", nom);
																html += getHtmlA("Normativa", "Veure normativa", norm, layerName);
																html += getHtmlA("Clau associada", "Veure clau associada", clau, layerName);
																html += getHtmlA("Disposicions generals", "Veure disposicions generals", generals, layerName);
																html += getHtmlA("Disposicions específiques", "Veure disposicions específiques", especific, layerName);
																html += getHtmlA("Usos", "Veure usos", usos, layerName);														
																break;

															case "Zones SU":
																var html = "<h3>Qualificacions: "+layerName+"</h3>";
																var desc = feature.find('Attribute[name="Descripció"]').attr('value');
																var clau = feature.find('Attribute[name="Clau urbanística"]').attr('value');
																var link = feature.find('Attribute[name="Enllaç clau"]').attr('value');
																var comunes = feature.find('Attribute[name="Enllaç disposicions comunes"]').attr('value');
																var especific = feature.find('Attribute[name="Enllaç disposicions específiques"]').attr('value');
																var taul = feature.find('Attribute[name="Enllaç taula usos"]').attr('value');
																var usos = feature.find('Attribute[name="Enllaç usos generals"]').attr('value');
																var us = feature.find('Attribute[name="Enllaç us"]').attr('value');

																html += getHtmlP("Descripció", desc);
																html += getHtmlP("Clau", clau);
																html += getHtmlA("Clau", "Veure clau", link, layerName);
																html += getHtmlA("Disposicions comunes", "Veure disposicions comunes", comunes, layerName);
																html += getHtmlA("Disposicions específiques", "Veure disposicions específiques", especific, layerName);
																html += getHtmlA("Taula usos", "Veure taula usos", taul, layerName);
																html += getHtmlA("Usos", "Veure usos generals", usos, layerName);
																html += getHtmlA("Aparcament", "Veure ús aparcament", us, layerName);
																break;

															case "Desenvolupament":
																var html = "<h3>Sectors</h3>";
																var nom = feature.find('Attribute[name="Nom"]').attr('value');
																var dese = feature.find('Attribute[name="Desenvolupament"]').attr('value');
																var pau = feature.find('Attribute[name="PAU"]').attr('value');
																var norm = feature.find('Attribute[name="Enllaç criteris ordenació"]').attr('value');
																var disp = feature.find('Attribute[name="Enllaç disposició general"]').attr('value');
																var taul = feature.find('Attribute[name="Enllaç taula"]').attr('value');

																html += getHtmlP("Nom", nom);
																html += getHtmlP("Desenvolupament", dese);
																html += getHtmlP("PAU", pau);
																html += getHtmlA("Normativa", "Veure normativa", norm, layerName);
																html += getHtmlA("Disposicions generals", "Veure disposicions generals", disp, layerName);
																html += getHtmlA("Taula", "Veure taula resum", taul, layerName);
																break;

															case "Zones SNU":
																var html = "<h3>Qualificacions: "+layerName+"</h3>";
																var desc = feature.find('Attribute[name="Descripció"]').attr('value');
																var clau = feature.find('Attribute[name="Clau"]').attr('value');
																var link = feature.find('Attribute[name="Enllaç clau"]').attr('value');
																var comunes = feature.find('Attribute[name="Enllaç disposicions comunes"]').attr('value');

																html += getHtmlP("Descripció", desc);
																html += getHtmlP("Clau", clau);
																html += getHtmlA("Normativa", "Veure normativa", link, layerName);
																html += getHtmlA("Disposicons generals", "Veure disposicons generals", comunes, layerName);
																break;

															case "Règim del sòl":
												    			var html = "<h3>"+layerName+"</h3>";
																var desc = feature.find('Attribute[name="descripcio"]').attr('value');

																html += getHtmlP("Descripció", desc);
																break;

															case "Volumetries (pol)":
												    			var html = "<h3>Condicions d'edificació</h3>";
																var desc = feature.find('Attribute[name="alcada"]').attr('value');
																var pe = feature.find('Attribute[name="pe"]').attr('value');

																html += getHtmlP("Alçada edificable", desc);
																html += getHtmlP("Profunditat edificable (m)", pe);
																break;

															case "Ús d'habitatge en planta baixa":
												    			var html = "<h3>"+layerName+"</h3>";
																var desc = feature.find('Attribute[name="descripcio"]').attr('value');
																var img = feature.find('Attribute[name="quadre"]').attr('value');
																var link = feature.find('Attribute[name="link"]').attr('value');
																console.log(desc,img,link);

																html += getHtmlP("Descripció", desc);
																html += getHtmlA("Quadre", "Veure quadre", img, layerName);
																html += getHtmlA("Normativa", "Veure normativa", link, layerName);
																break;

															default:
																console.log("no info for layer", layerName);
														}

														$('#infoPanel .content').append(html);
													}
												}
											});
										}
									});
								}

							    if(itemsProcessed === itemsTotal) {
							    	$('#loading').removeClass('spinner');

							    	if (!itemsResult) {
										$('#infoPanel .content').append("<strong>No s'ha trobat cap informació</strong>");
							    	}
							    }
							});
						}
					});
				}
		    }
		});

		if (catastroLayer.getVisible()) {

			// add cataster reference
			log("getCatasterRefFromCoord: "+coordinates[0]+":"+coordinates[1]);

			let coords = ol.proj.transform([coordinates[0], coordinates[1]], 'EPSG:3857', ol.proj.get('EPSG:25831'));

			placesService.getCatasterRefFromCoord(coords[0],coords[1]).then(function(data) {

				//console.log(data.message);

				if (data.message && data.message.refcat !== undefined) {
					// show cadastre info
					var html = "<h3>Cadastre (OVC)</h3>";
					html += "<p>Referencia catastral de la parcela:</p>";
					//html += "<p><a target='_blank' href='https://www1.sedecatastro.gob.es/CYCBienInmueble/SECListaBienes.aspx?del=8&muni=240&rc1="+data.message.pcat1+"&rc2="+data.message.pcat2+"'>"+data.message.refcat+"</a></p>";
					html += "<p><a target='_blank' href='https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?del=8&muni=240&rc1="+data.message.pcat1+"&rc2="+data.message.pcat2+"'>"+data.message.refcat+"</a></p>";

					if (iconLayer !== null) {
						$('#infoPanel .content-catastro').append(html);
					    $("#infoPanel").show();
					}
				}
			})
			.catch(function (error) {
			 	log("error in getCatasterRefFromPoligon: ", error);
		    });
		}

	    let coordsTxt = "<h3>Coordenades identificades</h3>";
	    let coords = ol.proj.transform([coordinates[0], coordinates[1]], 'EPSG:3857', ol.proj.get('EPSG:25831'));
	    //coordsTxt += "<p>X=" + coords[0].toFixed(1);
	    //coordsTxt += " Y=" + coords[1].toFixed(1);
	    coordsTxt += "<p>X=" + coords[0].toLocaleString('es-ES', { decimal: ',', useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });
	    coordsTxt += " Y=" + coords[1].toLocaleString('es-ES', { decimal: ',', useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });
	    coordsTxt += "</p>";
	    $('#infoPanel .content-coord').append(coordsTxt);
	    //$("#infoPanel").show();
	}

	function getHtmlP(label, content) {
		if (content != 'NULL' && content != '')
			return "<p>"+label+": "+content+"</p>";
		else
			return "";
	}

	function getHtmlA(label, linktext, link, layerName) {
		var ruta = "files/poum/";

		//console.log(layerName, label);

		switch (layerName) {
			case "Àmbits al SU":
			case "Zones SU":
				ruta += "Zones SU/";
				switch (label) {
					case "Clau":
					case "Claus":
					case "Clau associada":
						ruta += "Claus/";
						break;
					case "Normativa":
						if (layerName == "Àmbits al SU") {
							ruta += layerName + "/";
						}
						break;
				}
				break;
			case "Zones SNU":
				ruta += layerName + "/";
				switch (label) {
					case "Normativa":
						ruta += "Claus/";
				}
				break;
			case "Desenvolupament":
				ruta += layerName + "/";
				break;
			case "Catàleg":
				ruta += layerName + "/";
				switch (label) {
					case "Fitxa":
						ruta += "arquitectonic/";
				}
				break;
			case "Patrimoni":
				ruta += "Catàleg/";
				switch (label) {
					case "Fitxa":
						ruta += "arqueologic/";
				}
				break;
			case "Masies i cases rurals":
				ruta += "Catàleg/masies/";
				break;
			case "Ús d'habitatge en planta baixa":
				ruta += "Zones SU/";
				break;
		}

		if (link && link.indexOf("../") !== -1) 
			link = link.substring(3);

		if (link && link != 'NULL')
			return "<p>"+label+": <a target='_blank' href='"+ruta+link+"'>"+linktext+"</a></p>";
		else
			return "";
	}

	function zoomToCoord(x,y) {

		// check if in bounds of layers with: 
		// SELECT ST_Extent(geom) from limit_admin.limit_tm;
        // result: "BOX(395663.366865052 4584945.39405494,401112.263709581 4591360.48264577)"
		if (x > 395663.366865052 && x < 401112.263709581 && y > 4584945.39405494 && y < 4591360.48264577) {

			//log("zoomToCoord:"+x+":"+y);

			// convert from EPSG:25831 to EPSG:3857
			var coord = ol.proj.transform([x, y], ol.proj.get('EPSG:25831'), 'EPSG:3857');

			map.getView().animate({
				zoom: map.getView().getMaxZoom(), 
				center: coord
			}, function(e){

				// show feature info if radio selected
				if ($('input[name=searchinfo]:checked').val() === "info") {
					selectFeatureInfo(coord);
				}

				return true;
			});

			// show icon
			showIcon(coord);
		}
		else {
			log("zoomToCoord problem, x or y out of bounds: "+x+":"+y);
		}
	}

	// highlight geom of parcela
	function highlightPoligon(geom) {
		if (geom) {
			log("highlightPoligon: "+geom);

			if (parcelaLayer === null) {

				parcelaSource = new ol.source.Vector({
			        features: (new ol.format.GeoJSON()).readFeatures(geom)
			    });

				parcelaLayer = new ol.layer.Vector({
			        source: parcelaSource,
			        style: new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: 'yellow',
						width: 1
						}),
						fill: new ol.style.Fill({
							color: 'rgba(255, 255, 0, 0.1)'
						})
					})
			    });

				map.addLayer(parcelaLayer);
			}

			else {
				parcelaSource.clear();
				parcelaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(geom));
			}
		}
	}

	function showIcon(coord) {

		log("showIcon:"+coord[0]+":"+coord[1]);

		if (iconLayer === null) {
			iconPoint = new ol.geom.Point(coord);
			iconLayer = new ol.layer.Vector({
				source: new ol.source.Vector({
					features: [
						new ol.Feature({
					        geometry: iconPoint,
						})
					]
				}),
				style: new ol.style.Style({
			        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
						anchor: [0.5, 0],
						anchorOrigin: 'bottom-left',
						color: [255,0,0,1],
						src: 'tpl/default/img/marker.png'
				    }))
				})
			});
			map.addLayer(iconLayer);
		}
		else {
			iconPoint.setCoordinates(coord);
		}
	}

	function setVisibleLayer(layerName, visible) {
		//log("setVisibleLayer "+layerName+" ["+visible+"]");
		renderedLayers[layerName].setVisible(visible);
	}

	//log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename});
	}
	
	function setHighLightStyle(){
		var _myStroke = new ol.style.Stroke({
			color : 'rgba(108, 141, 168, 1)',
			width : 6 
		});
			
		highLightStyle = new ol.style.Style({
			stroke : _myStroke,
			//fill : _myFill
		});
	}

	// Measure bar
	function initMeasureBar() {
		subBar = new ol.control.Bar({
			toggleOne: true,
			autoDeactivate: true,
			controls:[	
				new ol.control.Toggle({
					//html:'<i class="fa fa-arrows-h"></i>', 
					html: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="https://www.w3.org/2000/svg"><g transform="translate(0 -8)"><path d="m1.5000001 20.5h21v7h-21z" style="overflow:visible;fill:#c7c7c7;fill-rule:evenodd;stroke:#5b5b5c;stroke-width:.99999994;stroke-linecap:square"/><path d="m4.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m7.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m10.5 20v6" fill="none" stroke="#5b5b5c"/><path d="m13.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m16.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m19.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m2.5 13v4" fill="none" stroke="#415a75"/><path d="m21.5 13v4" fill="none" stroke="#415a75"/><path d="m2 15h20" fill="none" stroke="#415a75" stroke-width="1.99999988"/></g></svg>',
					//autoActivate: true,
					onToggle: function(b) { 
						//console.log("Button 1 "+(b?"activated":"deactivated")); 
						measureActive = b;
						enableInteraction(b, true);
					} 
				}),
				new ol.control.Toggle({
					//html:'<i class="fa fa-arrows-alt"></i>', 
					html: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="https://www.w3.org/2000/svg"><g transform="translate(0 -8)"><path d="m1.5000001 20.5h21v7h-21z" style="overflow:visible;fill:#c7c7c7;fill-rule:evenodd;stroke:#5b5b5c;stroke-width:.99999994;stroke-linecap:square"/><path d="m4.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m7.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m10.5 20v6" fill="none" stroke="#5b5b5c"/><path d="m13.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m16.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m19.5 21v3" fill="none" stroke="#5b5b5c"/><path d="m2.5 9.5h5v2h14v7.5h-6.5v-5h-5v3.5h-7.5z" fill="#6d97c4" fill-rule="evenodd" stroke="#415a75"/></g></svg>',
					onToggle: function(b) { 
						//console.log("Button 2 "+(b?"activated":"deactivated")); 
						measureActive = b;
						enableInteraction(b, false);
					}
				})
			]
		});
		mainToggle = new ol.control.Toggle({
			html: 'M',
			bar: subBar,
			onToggle: function(b) {
				//console.log("main button "+(b?"activated":"deactivated"))
				if (!b) {
					removeMeasure();
					this.toggle();
				}
			}
		});
		mainBar = new ol.control.Bar({
			autoDeactivate: true,
			controls: [mainToggle],
			className: "ol-bottom ol-left measureBar"
		});
		map.addControl ( mainBar );
	}

	/****************************************/
	// Distance and area messurement
	/****************************************/
    function enableInteraction(enable, distance) {
    	//console.log(enable,measureActive);
    	enable ? addInteraction(distance) : removeMeasure();
    }

    function addInteraction(distance) {
        var type = (distance ? 'LineString' : 'Polygon');
        draw = new ol.interaction.Draw({
			source: measureSource,
			type: type,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 0.5)',
					lineDash: [10, 10],
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: 'rgba(0, 0, 0, 0.7)'
					}),
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.2)'
					})
				})
	    	})
    	});

		map.addInteraction(draw);

        createMeasureTooltip();
        createHelpTooltip();

        var listener;

		draw.on('drawstart',
	        function(evt) {
				// set sketch
				sketch = evt.feature;

				var tooltipCoord = evt.coordinate;

				listener = sketch.getGeometry().on('change', function(evt) {
				var geom = evt.target;
				var output;
				if (geom instanceof ol.geom.Polygon) {
					output = formatArea(geom);
					tooltipCoord = geom.getInteriorPoint().getCoordinates();
				} else if (geom instanceof ol.geom.LineString) {
					output = formatLength(geom);
					tooltipCoord = geom.getLastCoordinate();
				}
				measureTooltipElement.innerHTML = output;
				measureTooltip.setPosition(tooltipCoord);
				});
	        }, this);

	    draw.on('drawend',
	    	function() {
				measureTooltipElement.className = 'tooltip tooltip-static';
				measureTooltip.setOffset([0, -7]);
				// unset sketch
				sketch = null;
				// unset tooltip so that a new one can be created
				measureTooltipElement = null;
				createMeasureTooltip();
	      		ol.Observable.unByKey(listener);
	        }, this);
    }

    function removeMeasure() {
    	measureActive = false;
    	map.removeInteraction(draw);
    	map.removeOverlay(measureTooltip);
    	removeHelpTooltip();
    	$('.tooltip').addClass('hidden');
    	mainToggle.toggle();
    	measureSource.clear();
    	mainBar.setActive(false);
    }

	function createHelpTooltip() {
        removeHelpTooltip();
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'tooltip hidden';
        helpTooltip = new ol.Overlay({
          element: helpTooltipElement,
          offset: [15, 0],
          positioning: 'center-left'
        });
        map.addOverlay(helpTooltip);

        map.getViewport().addEventListener('mouseout', helpTooltipEventListener);
    }

    var helpTooltipEventListener = function() {
       	helpTooltipElement.classList.add('hidden');
    }

    function removeHelpTooltip() {
        map.removeOverlay(helpTooltip);
	    map.getViewport().removeEventListener('mouseout', helpTooltipEventListener);
	}

    function createMeasureTooltip() {
        if (measureTooltipElement) {
        	measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        measureTooltip = new ol.Overlay({
			element: measureTooltipElement,
			offset: [0, -15],
			positioning: 'bottom-center'
        });
        map.addOverlay(measureTooltip);
    }

	var pointerMoveHandler = function(evt) {
		if (evt.dragging) {
			return;
		}

		if (sketch) {
			var geom = (sketch.getGeometry());
			if (geom instanceof ol.geom.Polygon) {
				helpMsg = continuePolygonMsg;
			} else if (geom instanceof ol.geom.LineString) {
				helpMsg = continueLineMsg;
			}
		}

	    if (helpTooltipElement && helpTooltipElement !== undefined) {
			helpTooltipElement.innerHTML = helpMsg;
			helpTooltip.setPosition(evt.coordinate);
			helpTooltipElement.classList.remove('hidden');
		}
	};

    var formatLength = function(line) {
        var length = ol.sphere.getLength(line);
        var output;
        if (length > 100) {
          output = (Math.round(length / 1000 * 100) / 100) +
              ' ' + 'km';
        } else {
          output = (Math.round(length * 100) / 100) +
              ' ' + 'm';
        }
        return output;
    };	

    var formatArea = function(polygon) {
        var area = ol.sphere.getArea(polygon);
        var output;
        if (area > 10000) {
          output = (Math.round(area / 1000000 * 100) / 100) +
              ' ' + 'km<sup>2</sup>';
        } else {
          output = (Math.round(area * 100) / 100) +
              ' ' + 'm<sup>2</sup>';
        }
        return output;
    };

    // GetPrint request
    /*$("#menu").on("click", ".print", function(){
    	var bbox = map.getView().calculateExtent().join(',');
        var url = urlWMSqgis+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPrint&FORMAT=pdf&TRANSPARENT=true&LAYERS=POUM%20SSA&CRS=EPSG:3857&map0:STYLES=&map0:extent='+bbox+'&TEMPLATE=DinA4%201:500&DPI=120';
		$(this).attr("target", "_blank");
        window.open(url);
        return false;
    });*/

        $(".infoPanelLinks .btn-print").on("click", function(){
        window.frames['printinfo'].focus();
		window.frames['printinfo'].print();
    });

	/****************************************/
	// print
	/****************************************/
    $("#menu").on("click", ".reports", function(){
        cancelPrintBox();
    });
    $("#menu").on("click", ".layers", function(){
        cancelPrintBox();
    });
    $("#menu").on("click", ".search", function(){
        cancelPrintBox();
    });

    $("#menu").on("click", ".print", function(){
        //cancelPrintBox();
        //initPrintBox();
        selectPrintTemplate();
    });

    $(".window.print").on("click", "h2 .fa-times", function(){
        $(this).closest(".window").hide();
        cancelPrintBox();
    });

    $(".window.print").on("click", ".btn-cancel", function(){
        $(this).closest(".window").hide();
        cancelPrintBox();
    });

    $(".window.print").on("click", ".btn-print", function(){
        printPrint();
    });

    $(".window.print").on("change", "#printSize", function(){
    	selectPrintTemplate();
    });
    $(".window.print").on("change", "#printScale", function(){
    	selectPrintTemplate();
    });

	// actual screen scale
	// https://gis.stackexchange.com/questions/242424/how-to-get-map-units-to-find-current-scale-in-openlayers
	function screenScale() {
		var unit = map.getView().getProjection().getUnits();
		var resolution = map.getView().getResolution();
		var inchesPerMetre = 39.3700787;
		var dpi = 96;

		return resolution * ol.proj.Units.METERS_PER_UNIT[unit] * inchesPerMetre * dpi;
	}

	// print map resolution in m/px
	// https://gis.stackexchange.com/questions/158435/how-to-get-current-scale-in-openlayers-3#answer-158518
	function printResolution(scale) {
		var unit = map.getView().getProjection().getUnits();
		var inchesPerMetre = 39.3700787;
		var dpi = 120;

		return scale / (ol.proj.Units.METERS_PER_UNIT[unit] * inchesPerMetre * dpi);
	}

	function initPrintBox() {

		var size = $("#printSize option:selected").data("dim");
		var scale = $("#printScale").val(); 
    	var w = Number(size[0])*printResolution(scale)/screenScale()*18000;
    	var h = Number(size[1])*printResolution(scale)/screenScale()*18000;

		var bounds = map.getView().calculateExtent([w,h]);
		var printBox = [
			[bounds[0], bounds[1]],
			[bounds[0], bounds[3]],
			[bounds[2], bounds[3]],
			[bounds[2], bounds[1]],
			[bounds[0], bounds[1]]
		];
		var printPolygon = new ol.geom.Polygon([printBox]);
		var printFeature = new ol.Feature(printPolygon);

		/*printFeature.on('change',function(){
			console.log('Feature Moved To:' + this.getGeometry().getCoordinates());
		},printFeature);*/

   	    printSource = new ol.source.Vector({wrapX: false});
		printSource.addFeature(printFeature);

		printLayer = new ol.layer.Vector({
			source: printSource,
			zIndex: 1000,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(88,38,123,0.3)' 
				}),
				stroke: new ol.style.Stroke({
					color: 'rgb(88,38,123)',
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 2,
					fill: new ol.style.Fill({
						color: 'rgb(88,38,123)' 
					})
				})
			})
		});
		map.addLayer(printLayer);

		// make box draggable
		translatePrintBox = new ol.interaction.Translate({
	        features: new ol.Collection([printFeature])
	    });

		printLayer.setVisible(true);
		map.addInteraction(translatePrintBox);
	}

	function cancelPrintBox() {
		if (printSource) {
			map.removeInteraction(translatePrintBox);
			printSource.clear();
			printLayer.setVisible(false);
		}
	}

	function printPrint() {
		// print selected area
		$(this).attr("target", "_blank");

    	//var url = urlWMSqgis+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPrint&FORMAT=pdf&TRANSPARENT=true&LAYERS='+mapname+'&CRS=EPSG:3857&map0:STYLES=&map0:extent='+printSource.getExtent()+'&TEMPLATE='+printTemplate+'&DPI=120';

		// get visible layers
		var visibleLayers = [];
		Object.keys(renderedLayers).forEach(function(key){
			
			if (renderedLayers[key].getVisible()) {
				//if ((key !== "@ Capes topografiques - gris" && mapid !== "ortofotos_historial") &&
				if (key !== "@ Capes topografiques - gris" &&
					key !== "@ Capes topografiques AMB" &&
					key !== "@ Capes ortofotografiques" &&
					key !== "@ Catastro") {

					console.log(key, renderedLayers[key].getVisible(), renderedLayers[key].get("qgisname"));

					//visibleLayers.push(key);
					visibleLayers.push(renderedLayers[key].get("qgisname"));
				}
				else if (key === "@ Catastro" && catastroLayer.getVisible()) {

					//console.log(key, catastroLayer.getVisible());
					visibleLayers.push("@ Catastro");
				}
			}
		});

		baseLayers.forEach(function(layer, i) {
			if (layer.getVisible() && layer.get("title") !== "Cap fons") {
            	//console.log(layer.get("qgistitle"));
				visibleLayers.splice(0, 0, layer.get("qgistitle"));
            }
        });
		//console.log(visibleLayers.toString());

    	var url = urlWMSqgis+'?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPrint&FORMAT=pdf&TRANSPARENT=true&LAYERS='+visibleLayers.toString()+'&CRS=EPSG:3857&map0:STYLES=&map0:extent='+printSource.getExtent()+'&TEMPLATE='+printTemplate+'&DPI=120&map0:scale='+$("#printScale").val()+"&MAP="+QGIS_PROJECT_FILE;

		console.log(url);

        window.open(url, mapname+" Sant Sadurnì");
	}

    function selectPrintTemplate() {
		// select values
		var paper = $("#printSize").val();
		var dim = $("#printSize option:selected").data("dim");
		var scale = parseInt($("#printScale").val());
		var resolution = 120;

		printTemplate = paper;

		console.log(paper, dim, scale, printTemplate);

		if (printSource) {
			printSource.clear();
		}
    	initPrintBox();

        return false;
    }

    // public API	
	var returnFactory 	= {
					    		map				: map, // ol.Map
								init			: init,
								zoomToCoord		: zoomToCoord,
								highlightPoligon: highlightPoligon,
								resize			: resize,
								setVisibleLayer	: setVisibleLayer
						};
	return returnFactory;
}
})();