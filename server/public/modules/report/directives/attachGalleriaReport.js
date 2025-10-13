
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
      'xdbApiService',
      'filesPerCampo', function (
        xdbApiService,
        filesPerCampo
      ) {
        return {
          restrict: 'A',
          scope: {
            attachGalleriaReport: '=',
            record: '='
          },
          link: function ($scope, $element) {
            const url = new URL(window.location.href);
            const searchParams = url.searchParams;
            const _idRecord = parseInt(searchParams.get('idRecord'), 10);

            const idVista = $scope.attachGalleriaReport;
            const {
              filtro,
              campo,
              risorsa
            } = $element[0].dataset;

            const idRecord = $scope.record || _idRecord;

            loadImages({
              idVista,
              idRecord,
              nomeRisorsa: risorsa,
              foreignKeyVista: filtro,
              xdbApiService,
              filesPerCampo,
              idCampo: campo
            }).then(images => {
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

              $element[0].replaceWith(div);
            });
          }
        };
      }]);
})();
