
(function () {
  const htmlToTemplate = (html) => {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;

    const content = template.content;
    return content;
  };

  const loadImages = async ({ idVista, idRecord, nomeRisorsa, foreignKeyVista, xdbApiService, filesPerCampo, idCampo }) => {
    const q = foreignKeyVista ? (foreignKeyVista + '=%25=' + idRecord) : null;
    const res = await xdbApiService.getVistaRows(idVista, -1, 0, null, q);
    const images = (res?.data?.records || []).filter(file => filesPerCampo.isImage(file.nome));
    return Promise.all(images.map(async image => {
      const url = await filesPerCampo
        .download(
          nomeRisorsa,
          image.ID,
          idCampo
        );
      return htmlToTemplate(`
        <div class="report-gallery__item2" style="background-image: url('${url}')">
        </div>`.trim()
      );
    }));
  };

  window.angular.module('reportApp.report')
    .directive('attachGalleriaReport', [
      '$compile',
      'xdbApiService',
      'filesPerCampo', function (
        $compile,
        xdbApiService,
        filesPerCampo
      ) {
        return {
          restrict: 'A',
          transclude: true,
          scope: {
            attachGalleriaReport: '=',
            record: '='
          },
          link: function ($scope, $element) {
            const infoBase = $scope.$parent.infoBase;
            const shouldHandleManyIds = !$scope.record && infoBase?.idRecords?.length > 0;

            const idVista = $scope.attachGalleriaReport;
            const {
              filtro,
              campo,
              risorsa
            } = $element[0].dataset;

            const createNewElement = function (imagesData) {
              const div = document.createElement('div');
              div.className = 'report-gallery';
              for (let index = 0; index < imagesData.length; index++) {
                const container = document.createElement('div');
                container.className = 'report-gallery__image-container';
                const element = imagesData[index];
                const caption = document.createElement('p');
                caption.className = 'report-gallery__caption';
                caption.innerText = `Immagine ${index + 1}`;
                container.appendChild(element);
                container.appendChild(caption);
                div.appendChild(container);
              }

              return div;
            };

            const replaceWithManyEls = function () {
              const idRecords = infoBase?.idRecords;

              const imageContainerStyle = `width: 100%; height: 100%; padding: 5px; display: grid; grid-template-columns: repeat(auto-fill, minmax(${Math.floor((100 / (!idRecords?.length ? 1 : idRecords?.length)))}%, 100%)); grid-template-rows: repeat(${!idRecords?.length ? 1 : idRecords?.length}, 1fr); grid-gap: 0px;`;

              const container = document.createElement("div")
              container.setAttribute("style", imageContainerStyle);

              const promisesList = idRecords?.map((id) => {
                return loadImages({
                  idVista,
                  idRecord: id,
                  nomeRisorsa: risorsa,
                  foreignKeyVista: filtro,
                  xdbApiService,
                  filesPerCampo,
                  idCampo: campo
                })
                  .catch(() => { })
                  .then((images) => {
                    const imageDiv = createNewElement(images);
                    imageDiv.setAttribute('id', `image-${id}-${risorsa}`);

                    if (!angular.isElement(imageDiv)) return;

                    container.appendChild(imageDiv);
                  })
              });

              return Promise.allSettled(promisesList)
                .then((results) => {
                  if (results.some((res) => res.status === "fulfilled")) {
                    $element.append($compile(angular.element(container))($scope));
                  }
                });
            };

            const replaceWithSingleEl = function () {
              const idRecord = $scope.record || infoBase?.idRecord;

              return loadImages({
                idVista,
                idRecord,
                nomeRisorsa: risorsa,
                foreignKeyVista: filtro,
                xdbApiService,
                filesPerCampo,
                idCampo: campo
              }).then(images => {
                const imageDiv = createNewElement(images);

                $element.append($compile(angular.element(imageDiv))($scope));
              });
            };

            const insertNewElement = function (hasManyIds) {
              if (hasManyIds) return replaceWithManyEls();

              return replaceWithSingleEl();
            };

            $scope.$watch(() => $scope.$parent.loading, function (newVal, oldVal) {
              if (!newVal && oldVal) {
                $scope.$apply(
                  insertNewElement(shouldHandleManyIds)
                );
              }

              if (newVal && !oldVal) {
                $scope.$destroy();
              }
            }, true);

          }
        };
      }]);
})();
