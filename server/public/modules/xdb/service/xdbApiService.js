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
      const urlParams = [limit ? `limit=${limit}` : "", offset ? `&offset=${offset}` : "", sort ? `&orderBy=${sort}` : "", q ? `&${q}` : ""].filter((string) => string.length > 0).join("");

      const url = `${apiURLs.getBasePath()}/${DATABASEURL}/vista-rows/${idVista}?${urlParams}`;

      return xdbHttpService
        .fetch({
          method: 'GET',
          url
        });
    };
  };

  window.angular.module('reportApp.xdb')
    .service('xdbApiService', [
      'xdbHttpService',
      'xdbApiConstants',
      'apiURLs',
      service]);
})();
