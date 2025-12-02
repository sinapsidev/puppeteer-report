'use strict';
(function () {
    window.angular.module('reportApp.report').directive('idRecord', function ($timeout, $compile, visteDataService, vistaDataStore) {
        return {
            restrict: 'A',
            scope: true,
            transclude: true,
            link: {
                post(scope, element, attrs, _controller, transclude) {
                    let transcludeFnScope;
                    let elementClone;

                    transclude(function (clone, transcludeScope) {
                        elementClone = angular.element(clone);
                        transcludeFnScope = transcludeScope;
                    });
                    

                    $timeout(function () {
                          const { visteCorrelate, idViste } = vistaDataStore.getData();

                        const vistaRowsPromisesList = idViste.map(function (idVista) {
                            const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === idVista; }) || {};

                            const query = visteDataService.callVistaRowByIdRecord({
                                idVista,
                                idRecord: attrs.idRecord,
                                vistaCorrelata,
                            });

                            return query;
                        });

                        const compileNewScopeContent = (promisesList) => {
                            return Promise.all(promisesList)
                                .then((res) => {
                                    if (!res?.length) return;

                                    return res
                                        .filter((vista) => vista?.data)
                                        .map(function (vista) {
                                            const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === vista?.data?.id; }) || {};

                                            return visteDataService.createReportVistaObject({ vistaCorrelata, vistaResult: vista.data });
                                        }) ?? [];
                                })
                                .then((reportData) => {
                                    reportData.forEach(function (vistaScopeObj) {
                                        Object.assign(transcludeFnScope, vistaScopeObj);
                                    })

                                    element.srcHTML = elementClone.srcHTML;
                                    element.append($compile(elementClone)(transcludeFnScope));
                                })
                                .finally(() => {
                                    if (!scope.$$phase) {
                                        scope.$parent.$digest();
                                    }
                                });
                        };

                        compileNewScopeContent(vistaRowsPromisesList);

                    }, 100)
                }
            },
        }
    },
    );
})();