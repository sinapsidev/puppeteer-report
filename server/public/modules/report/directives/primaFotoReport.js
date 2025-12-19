'use strict';
(function () {
    window.angular.module('reportApp.report').directive('primaFotoReport', function ($timeout, handleIdRecordsParams, xdbApiService, filesPerCampo) {
        return {
            restrict: 'A',
            scope: false,
            transclude: true,
            link: {
                post(scope, element, attrs, _controller) {
                    const idFoto = parseInt(attrs.primaFotoReport, 10);
                    const idRecord = scope.idRecord ?? scope.infoBase.idRecord;
                    const nomeRisorsa = attrs.risorsa;
                    const idCampo = attrs.campo;
                    const filtroCampo = attrs.filtro;

                    const isValidValue = (value) => value !== undefined && value !== null;

                    $timeout(function () {
                            const compileImage = function () {

                            const q = filtroCampo ? `${filtroCampo}${handleIdRecordsParams.validateIdRecordParam(idRecord)}` : null;

                            return xdbApiService
                                .getVistaRows(idFoto, 1, 0, null, q)
                                .catch(() => { })
                                .then((res) => {

                                    const records = res.data.records ?? [];
                                    const image = records?.find(file => filesPerCampo.isImage(file.nome));

                                    if ([nomeRisorsa, image?.["ID"], idCampo].some((val) => !isValidValue(val))) return;

                                    return filesPerCampo
                                        .download(
                                            nomeRisorsa,
                                            image?.["ID"],
                                            idCampo
                                        )
                                        .catch(() => { })
                                        .then((url) => {
                                            if (!url) return;

                                            scope.$applyAsync(function () {
                                                element?.[0]?.setAttribute('src', `${url}`);
                                            });
                                        })
                                        .finally(() => {
                                            if (!scope.$$phase) {
                                                scope.$parent.$digest();
                                            }
                                        });
                                });
                        };

                        angular.isElement(element) && compileImage();
                    }, 1000)
                }
            }
        };
    });
})();