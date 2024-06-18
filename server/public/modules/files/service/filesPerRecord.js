(function () {
  const service = function (
    xdbApiConstants,
    xdbHttpService,
    apiURLs
  ) {
    const invariant = (condition, message) => {
      if (!condition) {
        throw new Error(message);
      }
    };

    const download = (idScheda, idRecord, file) => {
      invariant(idScheda, 'Id scheda necessario');
      invariant(idRecord, 'idRecord necessario');
      invariant(file, 'file necessario');

      const url = `${apiURLs.getBasePath()}/${xdbApiConstants.DATABASEURL}/resources/${idScheda}/${idRecord}/files/${file.id}`;

      return xdbHttpService
        .fetch({
          method: 'GET',
          url,
          responseType: 'blob',
          transformResponse: function (data) {
            return new window.Blob([data]);
          }
        }).then(r => window.URL.createObjectURL(r.data));
    };

    const list = (idScheda, idRecord, folder) => {
      invariant(idScheda, 'Id scheda necessario');
      invariant(idRecord, 'idRecord necessario');
      const url = `${apiURLs.getBasePath()}/${xdbApiConstants.DATABASEURL}/resources/${idScheda}/${idRecord}/files?folder=${folder || ''}`;
      return xdbHttpService
        .fetch({
          method: 'GET',
          url
        })
        .then(r => r.data);
    };

    return {
      list,
      download
    };
  };

  window.angular.module('reportApp.files')
    .service('filesPerRecord', [
      'xdbApiConstants',
      'xdbHttpService',
      'apiURLs',
      service
    ]);
})();
