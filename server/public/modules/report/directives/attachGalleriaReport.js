
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
      '$location',
      '$compile',
      'handleIdRecordsParams',
      'xdbApiService',
      'filesPerCampo', function (
        $location,
        $compile,
        handleIdRecordsParams,
        xdbApiService,
        filesPerCampo
      ) {
        return {
          restrict: 'A',
          scope: {
            attachGalleriaReport: '=',
            record: '='
          },
          link: function ($scope, $element, attributes) {

            const searchParams = $location.search();
            const idRecordParam = searchParams?.idRecord;
            const idRecordVistaInt = handleIdRecordsParams.getIntIdRecord(idRecordParam);
            const idRecordVistaList = handleIdRecordsParams.getArrayIdRecords(idRecordParam);

            const digest = () => {
              if (!!scope.$$phase) return;

              $scope.$parent.$digest();
            };

            const updateImgElement = ({ idRecordVista }) => {
              try {

                if ([attributes?.attachGalleriaReport,
                attributes?.risorsa,
                attributes?.campo].some((data) => !data)) throw new Error(`Parametri mancanti: \n {\n attachGalleriaReport: ${attributes?.attachGalleriaReport},\n risorsa: ${attributes?.risorsa}, \n filtro: ${attributes?.filtro}, \n campo: ${attributes?.campo} \n}`);

                return loadImages({
                  idVista: attributes?.attachGalleriaReport,
                  idRecord: idRecordVista,
                  nomeRisorsa: attributes?.risorsa,
                  foreignKeyVista: attributes?.filtro,
                  xdbApiService,
                  filesPerCampo,
                  idCampo: attributes?.campo
                })
                  .then(images => {
                    const div = document.createElement('div');
                    div.className = 'report-gallery';

                    for (let index = 0; index < images.length; index++) {
                      const container = document.createElement('div');
                      container.className = 'report-gallery__image-container';
                      const element = images[index];
                      const caption = document.createElement('p');
                      caption.className = 'report-gallery__caption';
                      caption.innerText = `Immagine ${index + 1}`;
                      container.appendChild(element);
                      container.appendChild(caption);
                      div.appendChild(container);
                    }

                    return angular.element(div);
                  })
              } catch (error) {
                console.error(error?.message);
                return;
              }
            };

            if (!Number.isInteger($scope?.record) && idRecordVistaList?.length > 0) {
              return idRecordVistaList.forEach((idR, index) => { 
                if (index > 0) { 
                  return updateImgElement({ idRecordVista: idR })
                    .then((newEl) => {
                      const parent = angular.element($element.parent());
                      const clone = angular.element($element.clone(true));

                      clone.appendTo(parent);
                      clone.replaceWith($compile(newEl)($scope));
                  })
                  .finally(() => {
                    digest();
                  });
                }
                
                return updateImgElement({ idRecordVista: idR })
                  .then((newEl) => {
                    $element.append($compile(newEl)($scope));
                  })
                  .finally(() => {
                    digest();
                  });
              });
            }

            if (!Number.isInteger($scope?.record) && !idRecordVistaList?.length) {
              return updateImgElement({ idRecordVista: idRecordVistaInt })
                .then((newEl) => {
                  $element.append($compile(newEl)($scope));
                })
                .finally(() => {  
                 digest();
                });
            }

            updateImgElement({ idRecordVista: $scope.record }).then((newEl) => {
                  $element.append($compile(newEl)($scope));
                })
                .finally(() => {  
                 digest();
                });
          }
        };
      }]);
})();
