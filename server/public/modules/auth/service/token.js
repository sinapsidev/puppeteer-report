(function () {
  const service = function (
    tokenService
  ) {
    const isAuthenticated = () => {
      return Boolean(get());
    };

    const get = () => {
      return tokenService.getSavedToken();
    };

    return {
      isAuthenticated,
      get
    };
  };

  angular.module('reportApp.auth')
    .service('token', [
      'tokenService',
      service]);
})();
