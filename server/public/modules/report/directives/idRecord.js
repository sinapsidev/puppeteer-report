'use strict';
(function () {
    window.angular.module('reportApp.report').directive('idRecord', function ($compile, visteDataService, vistaDataStore) {
        return {
            restrict: 'A',
            priority: 0,
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
                        })

                        if (!newValue && oldValue) {
                            const { visteCorrelate, idViste } = vistaDataStore.getData();
    
                            const vistaRowsPromisesList = visteDataService.getVistaRowsPromisesList(idViste, idRecord, visteCorrelate);
    
    
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