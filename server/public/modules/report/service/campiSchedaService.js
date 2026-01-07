'use strict';
(function () {

    function service(xdbApiService, reportHelpers) {
        const getCampiSchedaObject = async ({ idRecord, idScheda, infoScheda }) => { 
            const valoriCampiScheda = await xdbApiService.getValoriCampiScheda(idScheda, idRecord);

            if (!valoriCampiScheda?.data) return {};

            return Object.assign({}, reportHelpers.mapSchedaToReportData(infoScheda, valoriCampiScheda?.data));
        };

        return {
            getCampiSchedaObject,
        }
    };

    window.angular.module('reportApp.report').service('campiSchedaService', ['xdbApiService', 'reportHelpers', service]);
})();