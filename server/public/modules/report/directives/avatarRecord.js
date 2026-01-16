'use strict';
(function () {
    window.angular.module('reportApp.report').directive('avatarRecord', function ($compile, avatars, schedeDataStore, $document) {
        return {
            restrict: 'A',
            scope: false,
            transclude: true,
            link: {
                post(scope, element, attrs, _controller, transclude) {
                    const { idScheda } = schedeDataStore.getData();
                    const idRecord = scope.infoBase.idRecord;
                    const idSchedaPerAvatar = parseInt(attrs.avatarRecord, 10) ?? idScheda;
                    const loading = scope.loading;
                    const isValidValue = (value) => value !== undefined && value !== null;

                    scope.$watch(() => [idRecord, idSchedaPerAvatar, loading], function (newValue, oldValue) {
                        if (newValue.every((val) => isValidValue(val))) {
                            const compileImg = function () {
                                return avatars
                                    .get(idSchedaPerAvatar, idRecord)
                                    .catch(() => { })
                                    .then(url => {
                                        if (!url) return;

                                        const div = $document[0].createElement('div');
                                        div.style.width = `${element[0].offsetWidth}px`;
                                        div.style.height = `${element[0].offsetHeight}px`;
                                        div.style.backgroundImage = `url('${url}')`;
                                        div.style.backgroundPosition = 'center';
                                        div.style.backgroundSize = 'cover';

                                        return div;
                                    })
                                    .then((div) => {
                                        if (!div) return;

                                        transclude(function (_clone, _transcludedScope) {
                                            const angularDiv = angular.element(div);

                                            element?.replaceWith($compile(angularDiv)(scope));
                                        });

                                    })
                                    .catch(() => {})
                                    .finally(() => {
                                        if (!scope.$$phase) {
                                            scope.$parent.$digest();
                                        }
                                    });
                            };

                            angular.isElement(element) && compileImg();
                        }
                    }, true)
                }
            }
        }
    })
})();