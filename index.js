var LimiteGeo = 
    ee.Geometry.Polygon(
        [[[-45.133385873216525, -20.761156760832304],
          [-45.133385873216525, -21.065825861544432],
          [-44.73444483317746, -21.065825861544432],
          [-44.73444483317746, -20.761156760832304]]], null, false);



/*
  AUTOR:         JEAN CARLOS DE OLIVEIRA
  GUIDER:        VANESSA CRISTINA OLIVEIRA DE SOUZA
  UNIVERSIDADE:  UNIVERSIDADE FEDERAL DE ITAJUBÁ
  
  TEMA:          UTILIZAÇÃO DO GOOGLE EARTH ENGINE NA INDICAÇÃO GEOGRÁFICA 
                 DE PRODUTOS AGRÍCOLAS - UM ESTUDO DE CASO NA CAFEICULTURA 
                 DO CAMPO DAS VERTENTES EM MINAS GERAIS
  
  CENÁRIO:       SANTO ANTÔNIO DO AMPARO / MINAS GERAIS - BRASIL
  LAT/LONG:      -20.946277, -44.913145 

*/

// ---------------------------  GERAL
var area = ee.FeatureCollection("users/slackershin/SantoAntonioDoAmparo"); // GEOMETRIA DA REGIÃO
var areaCafe = ee.FeatureCollection("users/slackershin/SantoAntonioDoAmparoCafe"); // GEOMETRIA DA REGIÃO DE CAFÉ
var areaSolos = ee.FeatureCollection("users/slackershin/SantoAntoniodoAmparoSolos"); // GEOMETRIA DA REGIÃO DE SOLOS
//var areaVeg = ee.FeatureCollection("users/slackershin/SantoAntonioDoAmparoVegCultivada"); // GEOMETRIA DA REGIÃO DE VEGETACAOCULTIVADA

var paleta    = [
    ['#6296ff', '#015d02', '#fbff06', '#fd1a04'],                                // 4 classes
    ['#6296ff', '#015d02', '#a9cc00', '#fbff06', '#fd1a04'],                     // 5 classes
    ['#6296ff', '#015d02', '#a9cc00', '#fbff06', '#ffc200', '#fd1a04'],          // 6 classes
    ['#6296ff', '#015d02', '#a9cc00', '#fbff06', '#ffc200', 'fd7700', '#fd1a04'], // 7 classes
    ['#083ca3', '#6296ff', '#015d02', '#a9cc00', '#fbff06', '#ffc200', 'fd7700', '#fd1a04'], // 8 classes
    ['#083ca3', '#6296ff', '#015d02', '#a9cc00', '#47ff44', '#fbff06', '#ffc200', 'fd7700', '#fd1a04'] // 9 classes
];


var LONG = -44.913145, LAT = -20.946277; // Localização - SANTO ANTÔNIO DO AMPARO

var dataMin = ee.Date("2018-10-01"), dataMax = ee.Date("2019-10-01");

var planoDeInformacao = ee.Image(1);

Map.setCenter(LONG, LAT, 11); // CENTRALIZAR O MAPA NA REGIÃO DA CIDADE


//----------------------------  MAPA DE ELEVAÇÂO  ---------------------------------------------------------------------------------//
print("----------------------  MAPA DE ELEVAÇÂO --------------------------");
// ELEVACAO
var srtm = ee.Image('USGS/SRTMGL1_003').clip(area).rename('elevacao');

var elevacao = srtm.select('elevacao');

// CALCULA A ELEVACAO MIN E MAXIMA
var MINALT = elevacao.reduceRegion({ reducer: ee.Reducer.min(),	geometry: area, scale: 30 }) .get('elevacao') .getInfo();
var MAXALT = elevacao.reduceRegion({ reducer: ee.Reducer.max(), geometry: area,	scale: 30 }) .get('elevacao') .getInfo();


print("ELEVACAO MIN: " + MINALT + " - MAX: " + MAXALT);

// ALTERAÇAO NOS VALORES MAX E MIN PARA MELHOR DISTRIBUIÇÃO DAS CLASSIFICACOES NO MAPA
var MINALT = MINALT - (MINALT%100) + 50;
var MAXALT = MAXALT - (MAXALT%100) + 50;

// CLASSIFICACAO DO MAPA
var classesDeElevacao = Array();

for (var i = MINALT+ 100; i < MAXALT; i += 100) { classesDeElevacao.push(i); }

print("CLASSES DE ELEVAÇÃO:\n" + classesDeElevacao)

planoDeInformacao = planoDeInformacao.addBands(elevacao);

planoDeInformacao = planoDeInformacao.addBands(srtm.gt(ee.Image(classesDeElevacao)).reduce('sum').rename("classesElevacao"));

planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesElevacao').clip(areaCafe).rename("elevacaoCafe"));

//print("AREA TOTAL DO CAFÉ X ELEVACAO X CLASSE EM KM²");
//for (i = 0; i <= classesDeElevacao.length; i++) {
//	print(i + ": " + ee.Number ((ee.Image(1).mask(planoDeInformacao.select('elevacaoCafe').eq(i)))
//                    .multiply(ee.Image.pixelArea())
//                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//                    .get('constant')) 
//                    .divide(1e6).getInfo().toFixed(6));
//}

Map.addLayer(planoDeInformacao.select('elevacao'),{ min: MINALT, max: MAXALT, palette: paleta[classesDeElevacao.length-3] }, 'MAPA DE ELEVAÇÃO', false);
Map.addLayer(planoDeInformacao.select('classesElevacao')  ,{min: 0,	max: classesDeElevacao.length, palette: paleta[classesDeElevacao.length-3] }, 'MAPA DE CLASSES DE ELEVAÇÃO', false);
Map.addLayer(planoDeInformacao.select('elevacaoCafe'), { min: 0,	max: classesDeElevacao.length, palette: paleta[classesDeElevacao.length-3]  }, 'MAPA: CAFÉ X ELEVAÇÃO', false);

//Export.image.toDrive({image: planoDeInformacao.select('elevacao').clip(area), description: 'ELEVACAO', region: LimiteGeo, scale: 30, folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('classesElevacao').toDouble(), region: LimiteGeo, scale: 30, description: 'ELEVACAOCLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('elevacaoCafe').toDouble(), region: LimiteGeo, scale: 30, description: 'ELEVACAOCAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});
 

//----------------------------  MAPA DE DELIVIDADE ---------------------------------------------------------------------------------//
print("----------------------  MAPA DE DECLIVIDADE --------------------------");
// DECLIVIDADE
var declive = ee.Terrain.slope(elevacao).rename("declive");

planoDeInformacao = planoDeInformacao.addBands(declive);

// CALCULA A DECLIVIDADE MIN E MAXIMA  
var MINDECL = declive.reduceRegion({reducer: ee.Reducer.min(),geometry: area,scale: 30}).get('declive').getInfo();
var MAXDECL = declive.reduceRegion({reducer: ee.Reducer.max(),geometry: area,scale: 30}).get('declive').getInfo();
print("DECLIVIDADE MIN: " + MINDECL +  " MAX: " + MAXDECL);

var classesDeDeclividade = [3, 8, 20, 45, 75];
//0 - 3 Plano
//3 - 8 Suave ondulado
//8 - 20 Ondulado
//20 - 45 Forte ondulado; 
//45 - 75  Montanhoso
// 75 + Escarpado

print("CLASSES DE DECLIVIDADE:\n" + classesDeDeclividade)

planoDeInformacao = planoDeInformacao.addBands(declive.gt(ee.Image(classesDeDeclividade)).reduce('sum').rename("classesDeclividade"));
planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesDeclividade').clip(areaCafe).rename("cafeDeclividade"));

//print("AREA TOTAL DO CAFÉ X DECLIVIDADE X CLASSE EM KM²");
//var cafeDeclividade = [];
//for (var i = 0; i <= classesDeDeclividade.length; i++) {
//	// CALCULA A AREA DE CADA CLASSE DE CAFÉ ALTITUDE
//	print(i + ": " + ee.Number((ee.Image(1).mask(planoDeInformacao.select('cafeDeclividade').eq(i)))
//                    .multiply(ee.Image.pixelArea())
//                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//                    .get('constant')) 
//                    .divide(1e6).getInfo().toFixed(5));
//}

//Map.addLayer(planoDeInformacao.select('declive'),{min: MINDECL, max: MAXDECL, palette: paleta[(classesDeDeclividade.length-3)]}, 'MAPA DE DECLIVIDADE', false);
////Map.addLayer(planoDeInformacao.select('classesDeclividade')  ,{min: 0,	max: classesDeDeclividade.length, palette: paleta[(classesDeDeclividade.length-3)] }, 'MAPA DE CLASSES DE DECLIVIDADE', false);
////Map.addLayer(planoDeInformacao.select('cafeDeclividade'), { min: 0,	max: classesDeDeclividade.length ,palette: paleta[classesDeDeclividade.length-3]}, 'MAPA: CAFÉ X DECLIVIDADE', false);

//Export.image.toDrive({image: planoDeInformacao.select('declive'), description: 'DECLIVIDADE', region: LimiteGeo, scale: 30, folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('classesDeclividade').toDouble(), region: LimiteGeo, scale: 30, description: 'DECLIVIDADECLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('cafeDeclividade').toDouble(), region: LimiteGeo, scale: 30, description: 'DECLIVIDADECAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});
 
 

//----------------------------  MAPA HILLSHADE ---------------------------------------------------------------------------------//
print("----------------------  MAPA HILLSHADE --------------------------");
// DECLIVIDADE
var hillshade = ee.Terrain.hillshade(elevacao);

planoDeInformacao = planoDeInformacao.addBands(hillshade.rename("hillshade"));

// CALCULA A DECLIVIDADE MIN E MAXIMA  
var MINHILL = hillshade.reduceRegion({reducer: ee.Reducer.min(),geometry: area,scale: 30}).get('hillshade').getInfo();
var MAXHILL = hillshade.reduceRegion({reducer: ee.Reducer.max(),geometry: area,scale: 30}).get('hillshade').getInfo();
print("HILLSHADE MIN: " + MINHILL +  " MAX: " + MAXHILL);

var classesDeHillshade = [64, 128, 192];

print("CLASSES DE HILLSHADE:\n" + classesDeHillshade)

planoDeInformacao = planoDeInformacao.addBands(hillshade.gt(ee.Image(classesDeHillshade)).reduce('sum').rename("classesDeHill"));

planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesDeHill').clip(areaCafe).rename("cafeHIllshade"));

//print("AREA TOTAL DO CAFÉ X HILLSHADE X CLASSE EM KM²");
//for (var i = 0; i <= classesDeHillshade.length; i++) {
	// CALCULA A AREA DE CADA CLASSE DE CAFÉ ALTITUDE
//	print(i + ": " + ee.Number((ee.Image(1).mask(planoDeInformacao.select('cafeHIllshade').eq(i)))
//                    .multiply(ee.Image.pixelArea())
//                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//                    .get('constant')) 
//                    .divide(1e6).getInfo().toFixed(5));
//}

//Map.addLayer(planoDeInformacao.select('hillshade'),{min: MINHILL, max: 255, palette: paleta[(classesDeHillshade.length-3)]}, 'MAPA DE HILLSHADE', false);
////Map.addLayer(planoDeInformacao.select('classesDeHill')  ,{min: 0,	max: classesDeHillshade.length, palette: paleta[(classesDeHillshade.length-3)] }, 'MAPA DE CLASSES DE HILLSHADE', false);
////Map.addLayer(planoDeInformacao.select('cafeHIllshade'), { min: 0,	max: classesDeHillshade.length ,palette: paleta[classesDeHillshade.length-3]}, 'MAPA: CAFÉ X HILLSHADE', false);

//Export.image.toDrive({image: planoDeInformacao.select('hillshade'), description: 'HILLSHADE', region: LimiteGeo, scale: 30, folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('classesDeHill').toDouble(), region: LimiteGeo, scale: 30, description: 'HILLSHAECLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('cafeHIllshade').toDouble(), region: LimiteGeo, scale: 30, description: 'HILLSHADECAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});
 
 
//----------------------------  MAPA ASPECT ---------------------------------------------------------------------------------//
print("----------------------  MAPA ASPECT --------------------------");
// DECLIVIDADE
var aspect = ee.Terrain.aspect(elevacao);

planoDeInformacao = planoDeInformacao.addBands(aspect.rename("aspect"));

// CALCULA A DECLIVIDADE MIN E MAXIMA  
var MINASP = aspect.reduceRegion({reducer: ee.Reducer.min(),geometry: area,scale: 30}).get('aspect').getInfo();
var MAXASP = aspect.reduceRegion({reducer: ee.Reducer.max(),geometry: area,scale: 30}).get('aspect').getInfo();
print("ASPECT MIN: " + MINASP +  " MAX: " + MAXASP);

var classesDeaspect =  [25.5, 67.5, 112.5, 157.5, 202.5, 247.5, 295.5, 337.5];

print("CLASSES DE ASPECT:\n" + classesDeaspect)

planoDeInformacao = planoDeInformacao.addBands(aspect.gt(ee.Image(classesDeaspect)).reduce('sum').rename("classesDeAsp"));

planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesDeAsp').clip(areaCafe).rename("cafeaspect"));

//print("AREA TOTAL DO CAFÉ X aspect X CLASSE EM KM²");
//for (var i = 0; i <= classesDeaspect.length; i++) {
	// CALCULA A AREA DE CADA CLASSE DE CAFÉ ALTITUDE
//	print(i + ": " + ee.Number((ee.Image(1).mask(planoDeInformacao.select('cafeaspect').eq(i)))
//                    .multiply(ee.Image.pixelArea())
//                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//                    .get('constant')) 
//                    .divide(1e6).getInfo().toFixed(5));
//}

//Map.addLayer(planoDeInformacao.select('aspect'),{min: 0, max: 360, palette: paleta[classesDeaspect.length-3]}, 'MAPA DE ASPECT', false);
////Map.addLayer(planoDeInformacao.select('classesDeAsp')  ,{min: 0,	max: classesDeaspect.length, palette: paleta[classesDeaspect.length-3] }, 'MAPA DE CLASSES DE ASPECT', false);
////Map.addLayer(planoDeInformacao.select('cafeaspect'), { min: 0,	max: classesDeaspect.length ,palette: paleta[classesDeaspect.length-3]}, 'MAPA: CAFÉ X ASPECT', false);

//Export.image.toDrive({image: planoDeInformacao.select('aspect'), description: 'ASPECT', region: LimiteGeo, scale: 30, folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('classesDeAsp').toDouble(), region: LimiteGeo, scale: 30, description: 'ASPECTCLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('cafeaspect').toDouble(), region: LimiteGeo, scale: 30, description: 'ASPECTECAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});


//----------------------------  MAPA DE PRECIPITAÇÃO  ---------------------------------------------------------------------------------//
print("----------------------  MAPA DE PRECIPITAÇÃO --------------------------");

var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY') 
.filter(ee.Filter.date(dataMin, dataMax))
;

print(chirps);

var precipitation = chirps.mean().clip(area).select('precipitation').rename("precipitacao");
planoDeInformacao = planoDeInformacao.addBands(precipitation);

// PRECIPITAÇÃO MAXIMAMINALT
var MINPREC = precipitation.reduceRegion({reducer: ee.Reducer.min(), geometry: area, scale: 30}).get('precipitacao').getInfo();
var MAXPREC = precipitation.reduceRegion({reducer: ee.Reducer.max(), geometry: area, scale: 30}).get('precipitacao').getInfo();

print("Precipitação Média Anual:\nmin: " + MINPREC +  " max: " + MAXPREC);

// CLASSIFICACAO DO MAPA
var classesDePrecipitacao = Array();

var saltos = (MAXPREC-MINPREC)/4; // AROXIMADAMENTE 4, o floor arredonda para cima.

for(i=1; MINPREC+(i*saltos) < MAXPREC; i++){
  classesDePrecipitacao.push(ee.Number(MINPREC + (i*saltos)).multiply(1e6).toInt().divide(1e6).getInfo());
}

planoDeInformacao = planoDeInformacao.addBands(precipitation.gt(ee.Image(classesDePrecipitacao)).reduce('sum').rename("classesDePrecipitacao"));
print("CLASSES DE PRECIPITAÇÃO: \n" + classesDePrecipitacao);

planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesDePrecipitacao').clip(areaCafe).rename("cafePrecipitacao"));

print("AREA TOTAL DO CAFÉ X PRECIPITACAO X CLASSE EM KM²");

//for (var i = 0; i <= classesDePrecipitacao.length; i++) {
//	print(i + ": " + ee.Number ((ee.Image(1).mask(planoDeInformacao.select('cafePrecipitacao').eq(i)))
//          .multiply(ee.Image.pixelArea())
//          .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//          .get('constant'))
//          .divide(1e6).getInfo().toFixed(8));
//}


//Map.addLayer(precipitation, {	min: MINPREC, max: MAXPREC,	palette: paleta[0], }, 'MAPA: PRECIPITAÇÃO',false);
////Map.addLayer(planoDeInformacao.select('classesDePrecipitacao')  ,{min: 0,	max: 3, palette: paleta[0] }, 'MAPA DE CLASSES DE PRECIPITAÇÃO', false);
////Map.addLayer(planoDeInformacao.select("cafePrecipitacao"), { min: 0, max: 3, palette: paleta[0]}, 'MAPA: CAFÉ X PRECIPITAÇÃO', false);

//Export.image.toDrive({image: planoDeInformacao.select('precipitacao').toDouble(), description: 'PRECIPITACAO', region: LimiteGeo, scale: 30, folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('classesDePrecipitacao').toDouble(), region: LimiteGeo, scale: 30, description: 'PRECIPITACAOCLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('cafePrecipitacao').toDouble(), region: LimiteGeo, scale: 30, description: 'PRECIPITACAOCAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});



//----------------------------  MAPA DE TEMPERATURA   ---------------------------------------------------------------------------------//
print("----------------------  MAPA DE TEMPERATURA --------------------------");

var usgs = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA') 
.filterBounds(area)
.filter(ee.Filter.date(dataMin, dataMax)) 
;

var periodo = ee.List.sequence(0, 12);

var collectYear = ee.ImageCollection(periodo
  .map(function(y) {
    return usgs
    .filterBounds(area)
    .filterDate(dataMin.advance(y,'month'),(dataMin).advance(ee.Number(y).add(1), 'month'))
    .sort('CLOUD_COVER').first();
    }));

print (collectYear);

var temperatura = usgs.mean().clip(area).select("B10").subtract(273.5);

planoDeInformacao = planoDeInformacao.addBands(temperatura.rename("temperatura"));

// CALCULA A DECLIVIDADE MIN E MAXIMA  
var MINTEMP =temperatura.reduceRegion({	reducer: ee.Reducer.min(), geometry: area, scale: 30}).get('B10').getInfo();
var MAXTEMP = temperatura.reduceRegion({	reducer: ee.Reducer.max(), geometry: area, scale: 30}).get('B10').getInfo();

print("TEMPERATURA MIN: " + MINTEMP + " MAX: " + MAXTEMP);

var MINTEMP = Math.floor(MINTEMP);
var MAXTEMP = Math.round(MAXTEMP);

var classesDeTemperatura = [], classesDeTemperaturaTitulo = [];

var saltos = Math.round((MAXTEMP-MINTEMP)/6); // AROXIMADAMENTE 4, o floor arredonda para cima.

MINTEMP = MINTEMP + (saltos);

for(var i=0; (MINTEMP+(i*saltos)) < (MAXTEMP-saltos); i++){
  classesDeTemperatura.push( (MINTEMP) + (i*saltos));
}

planoDeInformacao = planoDeInformacao.addBands(temperatura.gt(ee.Image(classesDeTemperatura)).reduce('sum').rename("classesDeTemperatura"));

print("CLASSES DE TEMPERATURA: \n" + classesDeTemperatura)

print("AREA TOTAL DO CAFÉ X TEMPERTURA X CLASSE EM KM²");
planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesDeTemperatura').clip(areaCafe).rename("cafeTemperatura"));   

//for (i = 0; i <= classesDeTemperatura.length; i++) {
//	// ADQUIRE A AREA EM KM² DA REGIÃO
//	print(i + ": " + ee.Number ((ee.Image(1).mask(planoDeInformacao.select('cafeTemperatura').eq(i)))
//                    .multiply(ee.Image.pixelArea())
//                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//                    .get('constant')) 
//                    .divide(1e6).getInfo().toFixed(5));
//}
   
//Map.addLayer(temperatura,{min: MINTEMP, max: MAXTEMP, palette: paleta[classesDeTemperatura.length-3]}, 'MAPA DE TEMPERATURA', false);
////Map.addLayer(planoDeInformacao.select('classesDeTemperatura'), {	min: 0,	max: classesDeTemperatura.length, palette: paleta[classesDeTemperatura.length-3]}, 'CLASSES DE TEMPERATURA', false);
////Map.addLayer(planoDeInformacao.select('cafeTemperatura'), { min: 0,	max: classesDeTemperatura.length, palette: paleta[classesDeTemperatura.length-3]}, 'MAPA: CAFÉ X TEMPERATURA', false);

//Export.image.toDrive({image: planoDeInformacao.select('temperatura').toDouble(), description: 'TEMPERATURA', region: LimiteGeo, scale: 30, folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('classesDeTemperatura').toDouble(), region: LimiteGeo, scale: 30, description: 'TEMPERATURACLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('cafeTemperatura').toDouble(), region: LimiteGeo, scale: 30, description: 'TEMPERATURACAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});
 
 

 //----------------------------  MAPA SOLO ---------------------------------------------------------------------------------//
print("----------------------  MAPA SOLO --------------------------");
// SOLOS

// EXTRAIR OS VALORES DOS TIPOS DE SOLOS DA FEATURECOLLETION
var classesDeSolo = ee.List(areaSolos.aggregate_array("UM")).distinct().getInfo();

print("Tipos de Solo:\n"  + classesDeSolo);

// MAP SOBRE A FEATURECOLLECTION PARA TRANSFORMAR A BANDA STRING PRA INT
/*var areaSolosMod = areaSolos.map(function(feature) {
    var ft = feature.get('UM');
    return feature.set({
      UM: ee.Number(ee.String(ft).replace('LVAd', '1').replace('PVAd', '2').decodeJSON()).int()});
});*/

var areaSolosMod = areaSolos.map(function(feature) {
    var ft = feature.get('UM');
    return feature.set({
      UM: ee.List(classesDeSolo).indexOf(ft)});
});

var classesDeSoloInt = ee.List(areaSolosMod.aggregate_array("UM")).distinct().getInfo();
print("Classes de Solo:\n"  + classesDeSoloInt);

// REALIZA A TRANSFORMAÇÃO DA FEATURECOLLETION PARA IMAGEM
var areaSolosImg = areaSolosMod.reduceToImage({
    properties: ['UM'],
    reducer: ee.Reducer.first(),
})

planoDeInformacao = planoDeInformacao.addBands(areaSolosImg.gt(ee.Image(classesDeSoloInt)).reduce('sum').rename("classesDeSolo"));


planoDeInformacao = planoDeInformacao.addBands(planoDeInformacao.select('classesDeSolo').clip(areaCafe).rename("cafeSolo"));

//print("AREA TOTAL DO CAFÉ X SOLOS X CLASSE EM KM²");
//for (var i = 0; i < classesDeSoloInt.length; i++) {
	// CALCULA A AREA DE CADA CLASSE DE CAFÉ ALTITUDE
//	print(i + ": " + ee.Number((ee.Image(1).mask(planoDeInformacao.select('cafeSolo').eq(i)))
//                    .multiply(ee.Image.pixelArea())
//                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
//                    .get('constant')) 
//                    .divide(1e6).getInfo().toFixed(5));
//}

//Map.addLayer(planoDeInformacao.select('classesDeSolo'),{min: 0,	max: classesDeSoloInt.length-1, palette: paleta[(classesDeSoloInt.length-4)] }, 'MAPA DE CLASSES DE SOLO', false);
////Map.addLayer(planoDeInformacao.select('cafeSolo'), { min: 0,	max: classesDeSoloInt.length-1 ,palette: paleta[classesDeSoloInt.length-4]}, 'MAPA: CAFÉ X SOLO', false);

//Export.image.toDrive({image : planoDeInformacao.select('classesDeSolo').toDouble(), region: LimiteGeo, scale: 30, description: 'SOLOCLASSES', folder: 'GEE/SANTOANTONIODOAMPARO/'});
//Export.image.toDrive({image : planoDeInformacao.select('cafeSolo').toDouble(), region: LimiteGeo, scale: 30, description: 'SOLOCAFE', folder: 'GEE/SANTOANTONIODOAMPARO/'});
 

 
 // REGRAS PARA O TRABALHO //
 
var reqAltMin = 2, reqAltMax = 2;
var reqDeclMin = 2, reqDeclMax = 2;
var reqSolo = ['LVAd15'];
var reqTempMin = 2, reqTempMax = 2;
var reqPrecMin = 1, reqPrecMax = 1;

// ALTITUDE A CLASSIFICAR
var reqAltitudeMask = planoDeInformacao.select('classesElevacao')
                .mask(planoDeInformacao.select('classesElevacao').lte(ee.Image([reqAltMax]))
                .mask(planoDeInformacao.select('classesElevacao').gte(ee.Image([reqAltMin]))))

Map.addLayer(reqAltitudeMask, {}, "ELEVACAO");


// DECLIVIDADE
var reqDeclividadeMask = planoDeInformacao.select('classesDeclividade')
                .mask(planoDeInformacao.select('classesDeclividade').lte(ee.Image([reqDeclMax]))
                .mask(planoDeInformacao.select('classesDeclividade').gte(ee.Image([reqDeclMin]))))

Map.addLayer(reqDeclividadeMask, {}, "DECLIVIDADE");

// TEMPERATURA
var reqTemperaturaMask = planoDeInformacao.select('classesDeTemperatura')
                .mask(planoDeInformacao.select('classesDeTemperatura').lte(ee.Image([reqTempMax]))
                .mask(planoDeInformacao.select('classesDeTemperatura').gte(ee.Image([reqTempMin]))))

Map.addLayer(reqTemperaturaMask, {}, "TEMPERATURA");

// PRECIPITACAO
var reqPrecipitacaoMask = planoDeInformacao.select('classesDePrecipitacao')
                .mask(planoDeInformacao.select('classesDePrecipitacao').lte(ee.Image([reqPrecMax]))
                .mask(planoDeInformacao.select('classesDePrecipitacao').gte(ee.Image([reqPrecMin]))))

Map.addLayer(reqPrecipitacaoMask, {}, "PRECIPITACAO");

// SOLOS
reqSolo = reqSolo.map(function(e){
    return ee.List(classesDeSolo).indexOf(e);
});

var reqSolosMask = planoDeInformacao.select('classesDeSolo').mask( 
  ee.ImageCollection(reqSolo.map(function(e){
            return planoDeInformacao.select('classesDeSolo').mask
                      (planoDeInformacao.select('classesDeSolo').eq(ee.Image([e]))).multiply(0).add(1)
  })).median()
);

//Map.addLayer(reqSolosMask, {}, "SOLOS");

var resultante = ee.Image(1);

resultante = resultante.mask(
                reqAltitudeMask.mask(
                          reqDeclividadeMask.mask(
                            reqSolosMask.mask(
                              reqTemperaturaMask.mask(
                                reqPrecipitacaoMask)))));
                            
//Map.addLayer(resultante, {min: 0, max: 1, }, "Resultante");

Export.image.toDrive({image : resultante.toDouble(), region: LimiteGeo, scale: 30, description: 'RESULTANTE', folder: 'GEE/SANTOANTONIODOAMPARO/'});

var resultanteCafeContemplas   = ee.Image(1);
var resultanteCafeContempladas = ee.Image(1);

resultanteCafeContempladas = resultanteCafeContempladas.mask(resultante.eq(ee.Image([1]))).clip(areaCafe);

resultanteCafeContemplas =  resultanteCafeContempladas.mask(resultante.eq(ee.Image([1]))).clip(area);

Map.addLayer(resultanteCafeContemplas, {}, "resultanteCafeContemplas");
Map.addLayer(resultanteCafeContempladas, {}, "resultanteCafeContempladas");


Export.image.toDrive({image : resultanteCafeContempladas.toDouble(), region: LimiteGeo, scale: 30, description: 'resultanteCafeContempladas', folder: 'GEE/SANTOANTONIODOAMPARO/'});
Export.image.toDrive({image : resultanteCafeContemplas.toDouble(), region: LimiteGeo, scale: 30, description: 'resultanteCafeContemplas', folder: 'GEE/SANTOANTONIODOAMPARO/'});

/*
print("resultanteCafeContempladas");
	print(ee.Number((ee.Image(1).mask(resultanteCafeContempladas))
                    .multiply(ee.Image.pixelArea())
                    .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
                    .get('constant')) 
                    .divide(1e6).getInfo().toFixed(5));

*/

//print("resultanteCafeContemplas");
//	print(ee.Number((ee.Image(1).mask(resultanteCafeContemplas))
   //                 .multiply(ee.Image.pixelArea())
    //                .reduceRegion(ee.Reducer.sum(),LimiteGeo,30,null,null,false,1e13)
   //                 .get('constant')) 
     //               .divide(1e6).getInfo().toFixed(5));

