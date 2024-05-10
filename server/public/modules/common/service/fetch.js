(function () {
  angular.module('reportApp.common')
    .factory('fetch', [
      '$http',
      $http => {
        return $http;
      }
    ]);
})();
