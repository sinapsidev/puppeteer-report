'use strict';
(function () {
  const service = function (
    xdbHttpService,
    xdbApiConstants,
    apiURLs
  ) {
    const DATABASEURL = xdbApiConstants.DATABASEURL;

    this.getValoriCampiScheda = function (idScheda, idRecord) {
      const url = `${apiURLs.getBasePath()}/${DATABASEURL}/scheda/${idScheda}?idRecord=${idRecord}`;
      return xdbHttpService
        .fetch({
          method: 'GET',
          url
        });
    };

    this.getVistaRows = function (idVista, limit, offset, sort, q) {
      let urlParams = 'limit=' + limit + '&offset=' + offset;

      if (sort) {
        urlParams += '&orderBy=' + sort;
      }

      if (q) {
        urlParams += '&' + q;
      }

      const url = `${apiURLs.getBasePath()}/${DATABASEURL}/vista-rows/${idVista}?${urlParams}`;

      return xdbHttpService
        .fetch({
          method: 'GET',
          url
        });
    };
  };

  angular.module('reportApp.xdb')
    .service('xdbApiService', [
      'xdbHttpService',
      'xdbApiConstants',
      'apiURLs',
      service]);
})();
