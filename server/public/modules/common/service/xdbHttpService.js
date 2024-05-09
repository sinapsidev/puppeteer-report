(function () {
  const service = function (
    fetch,
    $q,
    prepareHeaders
  ) {
    let errorListeners = [];

    const addErrorListener = function (cb) {
      errorListeners.push(cb);
      return function () {
        errorListeners = _.filter(errorListeners, function (toCheck) {
          return toCheck !== cb;
        });
      };
    };

    const executeFetch = (args, tryToRefresh = false) => {
      console.time(args.url);
      return fetch(args)
        .then(function (results) {
          // check response code
          const respCode = parseInt(results.status);
          console.timeEnd(args.url);

          if (respCode >= 200 && respCode <= 299) {
            return results;
          }
        })
        .catch(function (results) {
          return $q.reject(results);
        });
    };

    const fetchHttp = function (args) {
      args.headers = prepareHeaders(args.headers);
      return executeFetch(args, true);
    };

    return {
      fetch: fetchHttp,
      addErrorListener
    };
  };

  angular.module('reportApp.common')
    .service('xdbHttpService', [
      'fetch',
      '$q',
      'prepareHeaders',
      service
    ]);
})();
