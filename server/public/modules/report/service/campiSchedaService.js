'use strict';
(function () {

    function service(xdbApiService, reportHelpers) {
        const getCampiSchedaObject = async ({ idRecord, idScheda, infoScheda }) => { 
            const shouldNotContinue = [
                !Number.isInteger(idRecord),
                !Number.isInteger(idScheda),
                !infoScheda
            ].some((c) => c);
            
            if (shouldNotContinue) return {};

            const valoriCampiScheda = await xdbApiService.getValoriCampiScheda(idScheda, idRecord);

            if (!valoriCampiScheda?.data) return {};

            const dataToScopeObj = reportHelpers.mapSchedaToReportData(infoScheda, valoriCampiScheda?.data);

            return dataToScopeObj;
        };

        return {
            getCampiSchedaObject,
        }
    };

    window.angular.module('reportApp.report').service('campiSchedaService', ['xdbApiService', 'reportHelpers', service]);
})();