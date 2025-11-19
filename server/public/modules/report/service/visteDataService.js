'use strict';
(function () {

    function service(handleIdRecordsParams) {
        this.makeVistaRowsQueryParams = (queryKey, idRecord) => {
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
            const q = this.makeVistaRowsQueryParams(foreignKeyVista, idRecord);

            return {
                idVista,
                limit,
                foreignKeyVista,
                offset: 0,
                sort: null,
                q
            }
        };
    };

    window.angular.module('reportApp.report').service('visteDataService', ['handleIdRecordsParams', service]);
})();