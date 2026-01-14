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

                    const processVistaPromises = ({ scopeCopy, visteCorrelate, idViste }) => {
                        const vistaRowsPromisesList = visteDataService.getVistaRowsPromisesList(idViste, idRecord, visteCorrelate);

                        if (!vistaRowsPromisesList?.length) return;

                        return Promise.all(vistaRowsPromisesList)
                            .catch(() => { })
                            .then(function (responses) {
                                if (!responses?.length) return [];

                                const visteWithData = responses.filter((vista) => vista?.data);

                                return visteWithData.map(function (vista) {
                                    const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === vista?.data?.id; }) || {};

                                    return visteDataService.createReportVistaObject({ vistaCorrelata, vistaResult: vista.data });
                                }) ?? [];
                            })
                            .then(function (vistaScopeObjects) {
                                return vistaScopeObjects.forEach(function (vistaScopeObj) {
                                    Object.assign(scopeCopy, vistaScopeObj);
                                });
                            });
                    };

                    const processSchedaPromise = ({ infoScheda, idScheda, scopeCopy }) => {
                        if (!infoScheda || !idScheda) return;
                        
                        return Promise.resolve(campiSchedaService.getCampiSchedaObject({ idRecord, idScheda, infoScheda }))
                            .then(function (schedaObj) {
                                if (!Object.entries(schedaObj)?.length) return;

                                Object.assign(scopeCopy, schedaObj);

                                return;
                            })
                            .catch((error) => {
                                return console.error(error?.message);
                            });
                    };

                    const compileNewScopeContent = ({ promisesList, scopeCopy }) => {
                        if (!scopeCopy || !promisesList?.length) return;

                        return Promise.allSettled(promisesList)
                            .then((fulfilledSummary) => {

                                if (fulfilledSummary.every((summary) => summary.status === "rejected")) {
                                    const rejectedPromises = fulfilledSummary.map((summary) => summary?.reason)?.filter((reason) => Boolean(reason));

                                    return rejectedPromises.forEach((reason) => {
                                        throw new Error(`Errore nella directive idRecord. \n ${reason}`)
                                    });
                                };

                                const parentElement = element.parent();

                                return transclude(scopeCopy, function (clone) {
                                    const elementClone = angular.element(clone);
                                    element.append($compile(elementClone)(scopeCopy));
                                }, parentElement);
                            })
                            .catch((error) => {
                                console.error(error.message);
                            })
                            .finally(() => {
                                if (!scope.$$phase) {
                                    scope.$parent.$digest();
                                }
                            });
                    };

                    scope.$watch(() => scope.$parent.loading, function (newValue, oldValue) {
                        transcludeFnScope = scope.$parent.$new();
                        Object.assign(transcludeFnScope, {
                            loading: newValue,
                            infoBase: {
                                ...scope.$parent?.infoBase,
                                idRecord,
                            },
                        });

                        if (!newValue && oldValue) {
                            const { visteCorrelate, idViste } = vistaDataStore.getData();
                            const { idScheda, infoScheda } = schedeDataStore.getData();

                            const promisesList = [
                                processVistaPromises({
                                    idViste,
                                    scopeCopy: transcludeFnScope,
                                    visteCorrelate
                                }),
                                processSchedaPromise({
                                    idScheda,
                                    infoScheda,
                                    scopeCopy: transcludeFnScope,
                                })
                            ];

                            compileNewScopeContent({ promisesList, scopeCopy: transcludeFnScope });
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