(function () {
  const service = function ($log) {
    const config = {};

    // Parametri
    config.MOCKED = false;

    const urlParams = new URLSearchParams(window.location.search);

    const queryDomain = urlParams.get('domain');

    config.BACKENDURL = queryDomain ? queryDomain + '/' : 'https://logicawebdev2.snps.it/';
    config.BASEAPIURL = config.BACKENDURL + 'api';
    config.BASEHUBURL = config.BACKENDURL + 'hub';

    config.MOCKBASEURL = '/mocks';
    config.GMAP_V3_URL = 'https://maps.googleapis.com/maps/api/js';
    config.GMAP_V1_EMBED_URL = 'https://www.google.com/maps/embed/v1/directions';
    config.GMAP_API_KEY = 'AIzaSyBYg5HCIKAyWhDf6lsif3wSzXv96OOK66Q';
    config.HTTPS_COOKIES = false;
    config.LOG_ENABLED = false;
    config.OLD_FIELDS_STYLE = true;

    config.getHubUrl = function (risorsa, id, params) {
      let parametri = '';
      if (params != null) parametri = '?' + params;
      let url = '';
      if (config.MOCKED === true) {
        if (id == null) url = config.MOCKBASEURL + '/' + risorsa + '.json';
        else url = config.MOCKBASEURL + '/' + risorsa + '_' + id + '.json';
      } else {
        if (id == null) url = config.BASEHUBURL + '/' + risorsa + parametri;
        else url = config.BASEHUBURL + '/' + risorsa + '/' + id + parametri;
      }
      if (config.LOG_ENABLED) $log.log('CALLED URL: ' + url);
      return url;
    };

    config.getGoogleMapsUrl = function () {
      return config.GMAP_V3_URL + '?key=' + config.GMAP_API_KEY + '&libraries=places';
    };

    config.getGoogleMapsEmbedWithDirectionsUrl = function () {
      return config.GMAP_V1_EMBED_URL + '?key=' + config.GMAP_API_KEY;
    };

    config.getGoogleMapsKey = function () {
      return config.GMAP_API_KEY;
    };

    return config;
  };

  window.angular.module('reportApp.common')
    .factory('configService', [
      '$log',
      service
    ]);
})();
