(function () {
  const TOKEN_KEY = '_t_052022';

  const service = function (
    storageService
  ) {
    const getSavedToken = function () {
      return storageService.loadCookie(TOKEN_KEY);
    };

    return {
      getSavedToken
    };
  };

  angular.module('reportApp.auth')
    .service('tokenService', [
      'storageService',
      service]);
})();
