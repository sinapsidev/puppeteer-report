(function () {
  const service = function (
    token,
    moment
  ) {
    const AUTH_HEADER_NAME = 'Authorization';

    const createAuthHeaders = (token) => {
      const headers = {};
      headers[AUTH_HEADER_NAME] = 'Bearer ' + token;
      return headers;
    };

    const createTimezoneHeaders = () => ({
      'Time-Zone': moment.tz.guess()
    });

    return (headers = {}) => {
      if (!token.isAuthenticated()) {
        return Object.assign(
          {},
          headers
        );
      }

      return Object.assign(
        {},
        createTimezoneHeaders(),
        createAuthHeaders(token.get()),
        headers
      );
    };
  };
  angular.module('reportApp.common')
    .factory('prepareHeaders', [
      'token',
      'moment',
      service
    ]);
})();
