(function () {
  const service = function (
    fetch,
    apiURLs,
    prepareHeaders
  ) {
    const get = (idScheda, idRecord, tenant) => {
      const url = `${apiURLs.getBasePath(tenant)}/avatars/${idScheda}/${idRecord}`;

      return fetch({
        headers: prepareHeaders(),
        method: 'GET',
        responseType: 'blob',
        transformResponse: function (data) {
          return new Blob([data]);
        },
        url
      }).then(response => URL.createObjectURL(response.data));
    };

    return {
      get
    };
  };

  angular
    .module('reportApp.xdb')
    .service('avatars', [
      'fetch',
      'apiURLs',
      'prepareHeaders',
      service
    ]);
})();
