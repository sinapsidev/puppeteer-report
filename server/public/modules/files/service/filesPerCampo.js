(function () {
  const service = function (
    xdbApiConstants,
    xdbHttpService,
    apiURLs
  ) {
    const VALID_EXTENSIONS = ['.jpg', '.png', '.jpeg', '.bmp', '.gif'];

    const isImage = (nome) => {
      if (!nome) {
        return false;
      }

      return VALID_EXTENSIONS.some(ext => nome.toLowerCase().endsWith(ext));
    };

    const download = (nomeRisorsa, idRecord, idCampo) => {
      const url = `${apiURLs.getBasePath()}/${xdbApiConstants.FILEBASEURL}/${nomeRisorsa}/${idRecord}/campo/${idCampo}`;

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
    return {
      download,
      isImage
    };
  };

  window.angular.module('reportApp.files')
    .service('filesPerCampo', [
      'xdbApiConstants',
      'xdbHttpService',
      'apiURLs',
      service
    ]);
})();
