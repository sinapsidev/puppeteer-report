(function () {
  const service = function (
    storageService
  ) {
    let _userData;
    let selectedTenant;

    const USERDATA_KEY = '__userdata';

    const getUserDataKey = tenant => `${USERDATA_KEY}_${tenant}`;

    const getTenantFromHash = hash => parseInt(hash.split('/')[1]);

    const tenant = () => {
      return selectedTenant;
    };

    const changeTenant = (tenant) => {
      selectedTenant = tenant;
      storageService.saveLocalStorage(getUserDataKey(selectedTenant), _userData);
    };

    const autoload = () => {
      const tenantFromHash = getTenantFromHash(window.location.hash);

      if (tenantFromHash) {
        selectedTenant = tenantFromHash;
      }
    };

    autoload();

    return {
      tenant,
      changeTenant
    };
  };

  angular.module('reportApp.auth')
    .service('currentUser', [
      'storageService',
      service
    ]);
})();
