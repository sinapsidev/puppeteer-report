'use strict';
(function () {

    function service(xdbApiService, reportHelpers) {
        const getCampiSchedaObject = async ({ idRecord, idScheda, infoScheda }) => { 
            try { 
                const shouldNotContinue = [
                    !Number.isInteger(idRecord),
                    !Number.isInteger(idScheda),
                    !infoScheda
                ].some((c) => c);

                if (shouldNotContinue) throw new Error("Controllare che i tipi dei parametri inseriti in getCampiSchedaObject siano corretti. Tipi corretti: \n {\n idRecord: number\n idScheda: number \n infoScheda: { \n idScheda: number \n nomeScheda: string \n } \n}");

                const valoriCampiScheda = await xdbApiService.getValoriCampiScheda(idScheda, idRecord);

                if (valoriCampiScheda.status < 200 && valoriCampiScheda.status >= 300) {
                    console.log('data', Object.entries(valoriCampiScheda).toString());
                    throw new Error(`Non ci sono valori validi nella scheda con id ${idScheda} per record con id ${idRecord}`)
                };

                const dataToScopeObj = reportHelpers.mapSchedaToReportData(infoScheda, valoriCampiScheda?.data);

                return dataToScopeObj;

            } catch (error) {
                console.error(error.message);
                return {};
            }
        };

        return {
            getCampiSchedaObject,
        }
    };

    window.angular.module('reportApp.report').service('campiSchedaService', ['xdbApiService', 'reportHelpers', service]);
})();