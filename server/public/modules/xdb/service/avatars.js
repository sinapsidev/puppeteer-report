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
          return new window.Blob([data]);
        },
        url
      }).then(response => URL.createObjectURL(response.data));
    };

    return {
      get
    };
  };

  window.angular
    .module('reportApp.xdb')
    .service('avatars', [
      'fetch',
      'apiURLs',
      'prepareHeaders',
      service
    ]);
})();
