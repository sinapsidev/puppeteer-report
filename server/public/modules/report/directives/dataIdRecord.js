'use strict';
(function () {
    window.angular.module('reportApp.report').directive('dataIdRecord', ['visteDataService', 'vistaDataStore', function (visteDataService, vistaDataStore) {
        return {
            restrict: 'A',
            scope: {
                idRecord: '=dataIdRecord',
            },
            link(scope) {
                const { idViste, visteCorrelate } = vistaDataStore.getData();

                console.log('---DIRECTIVE OK--- IDVISTE---', idViste, visteCorrelate);

                const vistaRowsPromisesList = idViste.map(function (idVista) {
                    const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === idVista; }) || {};

                    const query = visteDataService.callVistaRowByIdRecord({
                        idVista,
                        idRecord: intIdRecord,
                        vistaCorrelata
                    });

                    return query;
                });

                Promise.all(vistaRowsPromisesList)
                    .then((res) => {
                        if (!res?.length) return;

                        return res.map(function (vista) {
                            const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === vista?.data?.id; }) || {};

                            const vistaToReportData = visteDataService.createReportVistaObject({ vistaCorrelata, vistaResult: vista?.data });

                            return vistaToReportData;
                        }) ?? [];
                    })
                    .then((reportData) => {
                        return reportData.forEach(function (vistaScopeObj) {
                            Object.assign(scope, vistaScopeObj);
                        })
                    });
            },
        }
    },
    ]);
})();