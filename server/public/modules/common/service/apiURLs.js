(function () {
  const service = function (
    configService,
    currentUser
  ) {
    const getBasePath = (tenant) => {
      return `${configService.BACKENDURL}api/v2/${tenant || currentUser.tenant()}`;
    };

    const getHubUrl = (tenant) => {
      return `${configService.BACKENDURL}hub/v2/${tenant || currentUser.tenant()}`;
    };

    const getThreadsURL = (tenant) => {
      return `${configService.BACKENDURL}api/threads/v2/${tenant || currentUser.tenant()}`;
    };

    const getGeoUrl = (tenant) => {
      return `${configService.BACKENDURL}geo/${tenant || currentUser.tenant()}`;
    };

    const getCommentsUrl = (tenant) => {
      return `${configService.BACKENDURL}comments/${tenant || currentUser.tenant()}`;
    };

    return {
      getCommentsUrl,
      getGeoUrl,
      getThreadsURL,
      getBasePath,
      getHubUrl
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = service;
  } else {
    window.angular.module('reportApp.common')
      .service('apiURLs', [
        'configService',
        'currentUser',
        service
      ]);
  }
})();
