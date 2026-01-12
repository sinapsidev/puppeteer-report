
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
          transclude: true,
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

            const createNewElement = ({ idRecordVista }) => {
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

            // wrappare tutto in scope.$watch? y/n

            // non c'è bisogno di fare questa catena di ifs 
            // Meglio fare 3 callbacks separate e poi un'unica fn con switch, od object + if

            const compileFromAttrsValue = () => {
              return createNewElement({ idRecordVista: record })
                .then((newEl) => {
                  $element.append($compile(newEl)($scope));
                })
                .finally(() => {
                  digest();
                })
            };

            const compileFromParamList = async () => {
              try {

              if (!idRecordVistaList?.length) throw new Error("Non è associato più di un id record al search param idRecord");

              const parentEl = $element.parent();
              const firstIdRecord = idRecordVistaList[0];
              const followingIds = idRecordVistaList.splice(1, idRecordVistaList.length); 

                  const firstImage = await createNewElement({ idRecordVista: firstIdRecord });
                  const followingImages = followingIds.map(async (idRecord) => {
                    return await createNewElement({idRecordVista: idRecord})
                  });

                  $element.replaceWith($compile(firstImage)($scope)); 
                  followingImages.forEach(async (element) => {
                    parentEl.append($compile(element)($scope));
                  })
                } catch (error) {
                  console.error(error?.message);

                  return;
                } finally {
                  digest();
                }
              };

            const compileFromParamValue = () => {
              return createNewElement({ idRecordVista: idRecordVistaInt })
                .then((newEl) => {
                  $element.append($compile(newEl)($scope));
                })
                .finally(() => {
                  digest();
                });
            };
            
          }
        };
      }]);
})();
