(function () {
  const ONE_HOUR = 60 * 60 * 1000;

  const service = function ($localStorage, $sessionStorage, $cookies, configService) {
    const saveSessionStorage = (key, obj) => {
      $sessionStorage[key] = obj;
    };

    const loadSessionStorage = (key) => $sessionStorage[key];

    const deleteSessionStorage = (key) => {
      delete $sessionStorage[key];
    };

    const saveLocalStorage = (key, obj) => {
      $localStorage[key] = obj;
    };

    const saveLocalStorageWithExpiry = (key, value, timeToLive = ONE_HOUR) => {
      const item = {
        value,
        expiry: moment().valueOf() + timeToLive
      };
      $localStorage[key] = item;
    };

    const cleanExpiredData = () => {
      Object.keys($localStorage).forEach(key => {
        if ($localStorage[key] && $localStorage[key].expiry && (moment().valueOf() > $localStorage[key].expiry)) {
          delete $localStorage[key];
        }
      });
    };

    const loadLocalStorage = (key) => $localStorage[key];

    const loadLocalStorageWithExpiry = (key) => $localStorage[key] ? $localStorage[key].value : null;

    const deleteLocalStorage = (key) => {
      delete $localStorage[key];
    };

    const deletePrefixLocalStorage = (prefix) => {
      Object.keys($localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => delete $localStorage[k]);
    };

    const saveCookie = (key, obj) => {
      if (configService.HTTPS_COOKIES === true) $cookies.put(key, obj, { secure: true });
      else $cookies.put(key, obj);
    };

    const loadCookie = (key) => {
      return $cookies.get(key);
    };

    const deleteCookie = (key) => {
      $cookies.remove(key);
    };

    return {
      saveSessionStorage,
      loadSessionStorage,
      deleteSessionStorage,
      saveLocalStorage,
      saveLocalStorageWithExpiry,
      loadLocalStorage,
      loadLocalStorageWithExpiry,
      deleteLocalStorage,
      deletePrefixLocalStorage,
      saveCookie,
      loadCookie,
      deleteCookie,
      cleanExpiredData
    };
  };

  angular.module('reportApp.common')
    .service('storageService', [
      '$localStorage',
      '$sessionStorage',
      '$cookies',
      'configService',
      service]);
})();
