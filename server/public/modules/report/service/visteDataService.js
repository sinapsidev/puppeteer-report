'use strict';
(function () {

    function service(handleIdRecordsParams) {

        this.getVistaRowsParams = ({ idVista, idRecord, vistaCorrelata }) => {
            const foreignKeyVista = vistaCorrelata.campoVistaPerFiltro;
            const limit = foreignKeyVista ? -1 : 1000;
            const q = handleIdRecordsParams.makeVistaRowsQueryParams(foreignKeyVista, idRecord);

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