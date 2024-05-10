(function () {
  'use strict';

  angular.module('reportApp.report').service('reportService', [
    'xdbHttpService',
    'apiURLs',
    function (
      xdbHttpService,
      apiURLs
    ) {
      const TEMPLATE_BASE_URL = 'templates';

      const getInfoBase = function () {
        const url = `${apiURLs.getBasePath()}/${TEMPLATE_BASE_URL}/info-base`;
        return xdbHttpService
          .fetch({
            method: 'GET',
            url
          }).then(function (res) {
            return res.data;
          });
      };

      const getTemplate = function (id) {
        return xdbHttpService
          .fetch({
            method: 'GET',
            url: getUrlTemplate(id)
          }).then(function (res) {
            return res.data;
          });
      };

      const getVisteTemplate = function (id) {
        const url = `${apiURLs.getBasePath()}/${TEMPLATE_BASE_URL}/${id}/viste`;
        return xdbHttpService
          .fetch({
            method: 'GET',
            url
          }).then(function (res) {
            return res.data;
          });
      };

      const getUrlTemplate = (id) => `${apiURLs.getBasePath()}/${TEMPLATE_BASE_URL}/printmode/${id}`;

      const getDatiSchedaDiRiferimento = function (idScheda) {
        const url = `${apiURLs.getBasePath()}/${TEMPLATE_BASE_URL}/schede`;
        return xdbHttpService
          .fetch({
            method: 'GET',
            url
          }).then(function (res) {
            return res.data.find(function (e) {
              return e.idScheda === idScheda;
            });
          });
      };

      return {
        getInfoBase,
        getTemplate,
        getVisteTemplate,
        getDatiSchedaDiRiferimento
      };
    }
  ]);
})();
