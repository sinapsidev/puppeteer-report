
(function () {
  const htmlToTemplate = (html) => {
    const template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;

    const content = template.content;
    return content;
  };

  const loadImages = async ({ idScheda, idRecord, filesPerRecord, filesPerCampo }) => {
    const data = await filesPerRecord.list(idScheda, idRecord);
    const images = data.filter(file => filesPerCampo.isImage(file.name));

    return Promise.all(images.map(async image => {
      const url = await filesPerRecord.download(idScheda, idRecord, image);
      return htmlToTemplate(`
        <div class="report-gallery__item2" style="background-image: url('${url}')">
        </div>`.trim()
      );
    }));
  };

  window.angular.module('reportApp.report')
    .directive('attachFiles', [
      'filesPerRecord',
      'filesPerCampo',
      function (
        filesPerRecord,
        filesPerCampo
      ) {
        return {
          restrict: 'A',
          scope: {
            attachFiles: '='
          },
          link: function ($scope, $element, $attrs) {
            const url = new URL(window.location.href);
            const searchParams = url.searchParams;
            const idRecord = parseInt(searchParams.get('idRecord'), 10);

            const idScheda = $scope.attachFiles;

            loadImages({
              idScheda,
              idRecord,
              filesPerRecord,
              filesPerCampo
            }).then(images => {
              const div = document.createElement('div');
              div.className = 'report-gallery';
              for (let index = 0; index < images.length; index++) {
                const element = images[index];
                div.appendChild(element);
              }

              $element[0].replaceWith(div);
            });
          }
        };
      }]);
})();
