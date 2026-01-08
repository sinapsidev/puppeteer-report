'use strict';
(function () {
    window.angular.module('reportApp.report').directive('idRecord', function (campiSchedaService, schedeDataStore, $compile, visteDataService, vistaDataStore) {
        return {
            restrict: 'A',
            priority: 1,
            scope: true,
            transclude: true,
            link: {
                post(scope, element, attrs, _controller, transclude) {
                    let transcludeFnScope = null;

                    const idRecord = parseInt(attrs.idRecord, 10);

                    scope.$watch(() => scope.$parent.loading, function (newValue, oldValue) {
                        transcludeFnScope = scope.$parent.$new();
                        Object.assign(transcludeFnScope, {
                            loading: newValue,
                            idRecord,
                        });

                        if (!newValue && oldValue) {
                            const { visteCorrelate, idViste } = vistaDataStore.getData();
                            const { idScheda, infoScheda } = schedeDataStore.getData();

                            const vistaRowsPromisesList = visteDataService.getVistaRowsPromisesList(idViste, idRecord, visteCorrelate);

                            const processVistaPromises = (responses) => { 
                                if (!responses?.length) return [];

                                const visteWithData = responses.filter((vista) => vista?.data);

                                return visteWithData.map(function (vista) {
                                                const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === vista?.data?.id; }) || {};

                                                return visteDataService.createReportVistaObject({ vistaCorrelata, vistaResult: vista.data });
                                            }) ?? [];
                            }; 

                            const compileNewScopeContent = (promisesList) => {
                                return Promise.all(promisesList)
                                    .then((res) => {
                                        const vistaScopeObjects = processVistaPromises(res);
                                        const campiSchedaObject = campiSchedaService.getCampiSchedaObject({idRecord, idScheda, infoScheda});

                                        return {
                                            vistaScopeObjects,
                                            campiSchedaObject
                                        }
                                    })
                                    .then((reportData) => {
                                        reportData.vistaScopeObjects.forEach(function (vistaScopeObj) {
                                            Object.assign(transcludeFnScope, vistaScopeObj);
                                        });

                                        Object.assign(transcludeFnScope, reportData.campiSchedaObject);

                                        const parentElement = element.parent();

                                        transclude(transcludeFnScope, function (clone) {
                                            const elementClone = angular.element(clone);
                                            element.append($compile(elementClone)(transcludeFnScope));
                                        }, parentElement);

                                    })
                                    .finally(() => {
                                        if (!scope.$$phase) {
                                            scope.$parent.$digest();
                                        }
                                    });
                            };

                            vistaRowsPromisesList?.length > 0 && compileNewScopeContent(vistaRowsPromisesList);
                        }

                        if (newValue && transcludeFnScope) {
                            transcludeFnScope.$destroy();
                        }

                    })
                }
            },
        }
    },
    );
})();