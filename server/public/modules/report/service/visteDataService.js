'use strict';
(function () {

    function service(reportHelpers, xdbApiService, handleIdRecordsParams) {
        this.makeVistaRowsParams = (queryKey, idRecord) => {
            if (!idRecord) {
                throw new Error('idRecord mancante', typeof idRecord);
            };

            if (!queryKey) {
                throw new Error('queryKey mancante', typeof queryKey);
            };

            if (!queryKey) return null;

            if (!Array.isArray(idRecord)) {
                return `${queryKey}${handleIdRecordsParams.validateIdRecordParam(idRecord)}`;
            }

            return idRecord.map((idR) => `${queryKey}${handleIdRecordsParams.validateIdRecordParam(idR)}`)
        };

        this.getVistaRowsParams = ({ idVista, idRecord, vistaCorrelata }) => {
            const foreignKeyVista = vistaCorrelata.campoVistaPerFiltro;
            const limit = foreignKeyVista ? -1 : 1000;
            const q = this.makeVistaRowsParams(foreignKeyVista, idRecord);

            return {
                idVista,
                limit,
                foreignKeyVista,
                offset: 0,
                sort: null,
                q
            }
        };

        this.callVistaRowByIdRecord = ({ idVista, idRecord, vistaCorrelata }) => {
            const vistaParamsObj = this.getVistaRowsParams({
                idVista,
                idRecord,
                vistaCorrelata
            });

            return xdbApiService.getVistaRows(
                vistaParamsObj.idVista,
                vistaParamsObj.limit,
                vistaParamsObj.offset,
                vistaParamsObj.sort,
                vistaParamsObj.q,
            )
        };

        this.createReportVistaObject = ({ vistaCorrelata, vistaResult }) => {
            if (!Object.entries(vistaResult).length) return {};

            const infoVista = {
                  idVista: vistaResult.id,
                  idRecord: vistaResult.records?.[0]?.["ID"],
                  etichettaVista: vistaCorrelata.etichettaVista
            };
            
            const vistaToReportData = reportHelpers.mapVistaToReportData(infoVista, vistaResult);

            return vistaToReportData;
        }
    };

    window.angular.module('reportApp.report').service('visteDataService', ['reportHelpers', 'xdbApiService', 'handleIdRecordsParams', service]);
})();