<!DOCTYPE html>
<html>
	<head>
		<title>POUM de Sant Sadurní</title>

        <link rel="apple-touch-icon" sizes="180x180" href="http://mapa.psig.es/ssa/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="http://mapa.psig.es/ssa/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="http://mapa.psig.es/ssa/favicon-16x16.png">
        <link rel="manifest" href="http://mapa.psig.es/ssa/manifest.json">
        <link rel="mask-icon" href="http://mapa.psig.es/ssa/safari-pinned-tab.svg" color="#5bbad5">
        <link rel="shortcut icon" href="http://mapa.psig.es/ssa/favicon.ico">
        <meta name="msapplication-config" content="http://mapa.psig.es/ssa/browserconfig.xml">
        <meta name="theme-color" content="#ffffff">

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/openlayers/4.6.5/ol.css" type="text/css">
        <link rel="stylesheet" href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.1/bootstrap3-editable/css/bootstrap-editable.css" rel="stylesheet">
        <link rel="stylesheet" href="js/libs/ol-layerswitcher.css">
		<link rel="stylesheet" href="js/libs/font-awesome.min.css">
        <link rel="stylesheet" href="js/libs/ol-ext.min.css">
		<link rel="stylesheet" href="tpl/default/css/custom.css" type="text/css" charset="utf-8">
		<link rel="stylesheet" href="tpl/default/css/animate.css" type="text/css" charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta charset="utf-8" />
	</head>
	<body>
    	
        <div id="angularAppContainer" ng-app="app" ng-controller="mainController as mc" ng-init="initApp('<?php echo $baseHref; ?>','<?php echo $urlWMS; ?>','<?php echo $urlWMSqgis; ?>','<?php echo $env; ?>','<?php echo $token; ?>','<?php echo $isMobile; ?>')">
            
            <div class="window main">
                <div class="content">
                    <ul id="menu" class="list-unstyled list-inline">
                        <li><a href="<?php echo $baseHref?>"><img src="tpl/default/img/logo.png" class="hidden-xs" /></a></li>
                        <li><div class="vertical-line"></div></li>
                        <li><a href="#" class="reports"><img src="tpl/default/img/menuDoc.png" /></a></li>
                        <li><a href="#" class="layers"><img src="tpl/default/img/menuLayers.png" /></a></li>
                        <li><a href="#" class="search"><img src="tpl/default/img/menuSearch.png" /></a></li>
                        <li><a href="#" class="print"><img src="tpl/default/img/menuPrint.png" /></a></li>
                    </ul>
            
                </div>
            </div>
            
            <div class="window left-side reports">
                <h2>
                    <img src="tpl/default/img/menuDoc.png" class="ic" />
	                Informació addicional
	                <a href="#" class="pull-right" ng-click="toggleReports(0)"><i class="fa fa-fw fa-times"></i></a>
	            </h2>
	            <div class="content">
    	            <p>La documentació disponible en aquest lloc web no té cap valor normatiu. Només serveix de consulta i referència, i conté algunes interpretacions per poder fer la consulta telemàtica. Els únics documents amb valor normatiu són els propis expedients urbanístics aprovats definitivament i sempre i quan no hagin estat subjectes a una sentència ferma emesa per un tribunal de justícia.</p>
                    <p>Els documents oficials, amb validesa normativa es troben a la Direcció General d’Urbanisme de la Generalitat de Catalunya, que disposa de l'original d’aquests documents. També es pot consultar una còpia en PDF en aquest enllaç:</p>
                    <p><a href="http://ptop.gencat.cat/rpucportal/AppJava/cercaExpedient.do?reqCode=loadSenseCriteris" target="_blank"><img src="tpl/default/img/registre.png"></a> <a href="http://ptop.gencat.cat/rpucportal/AppJava/cercaExpedient.do?reqCode=loadSenseCriteris" target="_blank">Registre del planejament urbanístic de Catalunya</a></p>
                    <p>L'Ajuntament disposa, a més, d'una còpia en PDF estructurada del contingut del POUM defintivament aprovat per a la seva consulta en aquest enllaç:</p>
                    <p><a href="#" class="normativa-button"><img src="tpl/default/img/pdf.png"></a> <a href="#" class="normativa-button">Normativa urbanística completa</a></p>
                    <p>Es prohibeix qualsevol reproducció total o parcial si no ha estat expressament autoritzada per l’Ajuntament de Sant Sadurní d'Anoia.</p>
                    <p>Si disposeu d'informació més precisa o voleu enviar algun suggeriment feu-ho aquí.</p>
	            </div>
            </div>

            <div class="window right-side ng-cloak" ng-cloak ng-show="infoPanel" id="infoPanel">
                <h2>
	                INFO
	                <a href="#" class="pull-right"><i class="fa fa-fw fa-times"></i></a>
	            </h2>
                <div class="content"></div>
                <div class="content-coord"></div>                 
                <div class="content-catastro"></div>                 
                </div>                 
            </div>
            
            <div class="window left-side print">
                <h2>
                    <img src="tpl/default/img/menuPrint.png" class="ic" />
                    Impressió
                    <a href="#" class="pull-right"><i class="fa fa-fw fa-times"></i></a>
                </h2>
                <div class="content">
                    <h3>DIN A4</h3>
                    <ul>
                        <li><a href="#" class="format a4_500">1:500</a></li>
                        <li><a href="#" class="format a4_1000">1:1.000</a></li>
                    </ul>
                    <h3>DIN A3</h3>
                    <ul>
                        <li><a href="#" class="format a3_1000">1:1.000</a></li>
                        <li><a href="#" class="format a3_2000">1:2.000</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="window left-side search">
                <h2>
                    <img src="tpl/default/img/menuSearch.png" class="ic" />
                    Cercadors
                    <a href="#" class="pull-right"><i class="fa fa-fw fa-times"></i></a>
                </h2>
                <div class="content">
                    <h3>Cerca per carrer</h3>
                    <p>
                        <label for="searchCarrer">Carrer</label>
                        <input type="text" id="searchCarrer" name="searchCarrer" />
                    </p>
                    <p>
                        <label for="searchNumero">Número</label>
                        <select id="searchNumero" name="searchNumero">
                            <option value="-1"> - Escrigui un carrer - </option>
                        </select>
                    </p>

                    <h3>Cerca per referència cadastral</h3>
                    <p>Introduïu la referència cadastral i premeu el botó Buscar parcel·la (Ex 8867701CF9886N)</p>
                    <p>
                        <label for="searchReferencia">Referencia</label>
                        <input type="text" id="searchReferencia" name="searchReferencia" />
                    </p>
                    <p>
                        <button type="button" class="btn btn-default btn-searchCatasterRef" ng-click="searchCatasterRef()">Buscar parcel·la</button>
                    </p>

                    <h3>Cerca al cadastre de rústica</h3>
                    <p>
                        <label for="searchPoligon">Polígon</label>
                        <select id="searchPoligon" name="searchPoligon">
                            <option value="-1">-  Triï una opció  -</option>
                        </select>
                    </p>
                    <p>
                        <label for="searchParcela">Parcel·la</label>
                        <select id="searchParcela" name="searchParcela">
                            <option value="-1">-  Triï una opció  -</option>
                        </select>
                    </p>

                    <h3>Cerca per coordenades</h3>
                    <p>
                        <label for="searchX">X</label>
                        <input type="text" id="searchX" name="searchX" />
                    </p>
                    <p>
                        <label for="searchY">Y</label>
                        <input type="text" id="searchY" name="searchY" />
                    </p>
                    <p>
                        <button type="button" class="btn btn-default btn-searchLoc" ng-click="searchLoc()">Buscar localització</button>
                    </p>

                    <p>
                        <input type="radio" name="searchinfo" id="searchradio1" value="info" ng-checked="true" checked="checked">
                        <label for="searchradio1">Cerca i mostra informació</label>
                        <br />
                        <input type="radio" name="searchinfo" id="searchradio2" value="search">
                        <label for="searchradio2">Només Cerca</label>
                    </p>
                </div>
            </div>
            
            <div class="window left-side layers">
                <h2>
                    <img src="tpl/default/img/menuLayers.png" class="ic" />
                    Gestor de capes
                    <a href="#" class="pull-right"><i class="fa fa-fw fa-times"></i></a>
                </h2>
                <div id="layerswitcher" class="content">
                </div>
            </div>
            
            <div class="window left-side normativa">
                <h2>
                    Normativa urbanística completa
                    <a href="#" class="pull-right"><i class="fa fa-fw fa-times"></i></a>
                </h2>
                <div class="content">
                    <div class="row">
                        <iframe src="/ssa/normativas/" width="100%" height="575px" frameborder="0"></iframe>
                        <!--<iframe src="http://mapa.psig.es:8002/normativasSSA" width="100%" height="575px" frameborder="0"></iframe>-->
                    </div>
                </div>
            </div>
            
        	<div id="map"></div>
        </div>

        <!-- jquery -->
        <script src="https://code.jquery.com/jquery-2.2.4.min.js"
                integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44="
                crossorigin="anonymous"></script>
        <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"
                integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU="
                crossorigin="anonymous"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"
                integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa"
                crossorigin="anonymous"></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/x-editable/1.5.1/bootstrap3-editable/js/bootstrap-editable.min.js"></script>
        
        <script>
            $(window).ready(function(){
                
                // z-index of each window is incremented when is open,
                // in order to let the last window be ever visible.
                var lastZIndex = 1;
                
                // Gutter is the standard separator space (15 is the Bootstrap default)
                // Is used around the layout
                var gutter = 15;
                
                // Adjust the right window.
                // Used when window is loaded and resized.
                function adjustBaseWindows(){
                    //var width = $(window).width();
                    var winHeight = $(window).height();

                    var mainWindowPosition  = $(".window.main").position(),
                        mainWindowHeight    = $(".window.main").outerHeight(),
                        width = 350,
                        height = 600,
                        top = mainWindowPosition.top + mainWindowHeight + gutter,
                        right = gutter;

                    if ((winHeight - top - height) > top) {
                        top = (winHeight - height) / 2;
                    }
                    
                    $(".window.right-side").css({
                        "width": width,
                        "height": height,
                        "top": top,
                        "right": right
                        //"max-height": height-(gutter*2)
                    });
                }

                adjustBaseWindows();
                                
                $(window).resize(function(){
                    adjustBaseWindows();
                    setNormativaWindowPosition();
                });

                // Adjust the print window position.
                // Used when the window is opened.
                function setPrintWindowPosition(){
                    var mainWindowPosition  = $(".window.main").position();
                    var mainWindowHeight    = $(".window.main").outerHeight();
                    
                    var top  = mainWindowPosition.top + mainWindowHeight + gutter;
                    var left = gutter;
                    
                    $(".window.print").css({
                        "top": top,
                        "left": left,
                        "z-index": lastZIndex++,
                        "max-height": $(window).height() - top - gutter,
                    });
                }

                // Adjust the search window position.
                // Used when the window is opened.
                function setSearchWindowPosition(){
                    var mainWindowPosition  = $(".window.main").position();
                    var mainWindowHeight    = $(".window.main").outerHeight();
                    
                    var top  = mainWindowPosition.top + mainWindowHeight + gutter;
                    var left = gutter;
                    
                    $(".window.search").css({
                        "top": top,
                        "left": left,
                        "z-index": lastZIndex++,
                        "max-height": $(window).height() - top - gutter,
                    });
                }

                // Adjust the layers window position.
                // Used when the window is opened.
                function setLayersWindowPosition(){
                    var mainWindowPosition  = $(".window.main").position();
                    var mainWindowHeight    = $(".window.main").outerHeight();
                    
                    var top  = mainWindowPosition.top + mainWindowHeight + gutter;
                    var left = gutter;
                    
                    $(".window.layers").css({
                        "top": top,
                        "left": left,
                        "z-index": lastZIndex++
                    });
                }
                
                // Adjust the Normativa window position.
                // Used when the window is opened.
                function setNormativaWindowPosition(){
                    var mainWindowPosition  = $(".window.main").position();
                    var mainWindowHeight    = $(".window.main").outerHeight();
                    
                    var top  = mainWindowPosition.top + mainWindowHeight + gutter;
                    var left = gutter;

                    // fixed size
                    var width = 1160,
                        height = 600;
                    
                    $(".window.normativa").css({
                        "top": top,
                        "left": left,
                        "width": width,
                        "height": height,
                        "z-index": lastZIndex++
                    }).addClass('animated slideInLeft');
                }

                // Adjust the reports window position
                // Used when the window is opened.
                function setReportsWindowPosition(){
                    var mainWindowPosition  = $(".window.main").position();
                    var mainWindowHeight    = $(".window.main").outerHeight();
                    
                    var top  = mainWindowPosition.top + mainWindowHeight + gutter;
                    var left = gutter;
                    
                    $(".window.reports").css({
                        "top": top,
                        "left": left,
                        "max-height": $(window).height() - top,
                        "z-index": lastZIndex++
                    });
                }

                // Toggle the print window when the menu icon is pressed
                $("#menu").on("click", ".print", function(){
                    $(".window.left-side").hide();
                    $(".window.print").toggle();
                    setPrintWindowPosition();
                    return false;
                });

                // Toggle the search window when the menu icon is pressed
                $("#menu").on("click", ".search", function(){
                    $(".window.left-side").hide();
                    $(".window.search").toggle();
                    setSearchWindowPosition();
                    
                    if($(".window.search").is(':visible'))
                        $(".window.search input").focus();
                    
                    return false;
                });
                
                // Toggle the layers window when the menu icon is pressed
                $("#menu").on("click", ".layers", function(){
                    $(".window.left-side").hide();
                    $(".window.layers").toggle();
                    setLayersWindowPosition();
                    return false;
                });
                
                // Toggle the normativa window when the menu icon or
                // the right window button is pressed
                $(".normativa-button").on("click", function(){
                    $(".window.reports").toggle();
                    $(".window.normativa").toggle();
                    setNormativaWindowPosition();
                    return false;
                });

                // Toggle the reports window when the menu icon is pressed
                $("#menu").on("click", ".reports", function(){
                    $(".window.left-side").hide();
                    $(".window.reports").toggle();
                    setReportsWindowPosition();
                    return false;
                });

                // Close the current window when press the times icon on the top right corner.
                $(".window").on("click", "h2 .fa-times", function(){
                    if ($(this).parent().parent().parent().hasClass("left-side")) $(".window.normativa").hide();
                    $(this).closest(".window").hide();
                });
                
                // Collapse and expand the layers list on the layers window.
                $(".window.layers").on("click", "div.layers li > a", function(){
                    $(this).parent('li').toggleClass("open closed");
                    return false;
                });
            });
        </script>
        
    	<!-- Angular js -->
    	<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
    	
    	<!-- Open layers -->
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/openlayers/4.6.5/ol.js"></script>
        <script src="js/libs/ol-ext.min.js"></script>
        <script src="js/libs/ol-layerswitcher.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.4.4/proj4.js"></script>
        <script src="https://epsg.io/25831.js"></script>

        <!-- angular-bootstrap-ui -->
	    <script src="js/libs/angular-animate.min.js"></script>
	    <script src="js/libs/ui-bootstrap-tpls-2.5.0.min.js"></script> 
	    <script src="js/libs/angular-locale_es.es.js"></script> 

        <script src="js/libs/html2canvas.js"></script>
        <script src="js/libs/jspdf.min.js"></script>
        
        <!-- Application -->
    	<script src="js/app/app.js"></script>
    	<script src="js/app/MainController.js"></script>
    	<script src="js/app/mapService.js"></script>
    	<script src="js/common/placesService.js"></script>
    	<script src="js/common/loggerService.js"></script>
    	 
	</body>
</html>






	
