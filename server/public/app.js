(function () {
  'use strict';

  const getPlaceholdersScheda = function (template) {
    const matched = template.match(/{{scheda_[0-9a-zA-Z](.*?)}}/g) || [];
    const placeholdersScheda = matched.map(function (val) {
      return val.replace(/({{|}})/g, '');
    });
    return placeholdersScheda;
  };

  const getPlaceholdersViste = function (template) {
    const matched = template.match(/"item in vista_(.*?)"/g) || [];
    const placeholdersViste = matched.map(function (val) {
      return val.replace(/(ng-repeat=|"|item in )/g, '').replace(/ \| orderBy:'(.*?)'/g, '');
    });
    return placeholdersViste;
  };

  const getPlaceholdersVisteSingole = function (template) {
    const matched = template.match(/{{vista_(.*?)[0-9](.*?)}}/g) || [];

    const placeholdersViste = matched.map(function (val) {
      return val.replace(/({{|}})/g, '');
    });

    return placeholdersViste;
  };

  const getIdScheda = function (template) {
    const placeholdersScheda = getPlaceholdersScheda(template);
    const idsPlaceholders = placeholdersScheda.map(function (placeholder) {
      const schedaInfo = placeholder.split('.')[0];
      const schedaInfoArray = schedaInfo.split('_');
      const schedaInfoId = schedaInfoArray[schedaInfoArray.length - 1];
      return parseInt(schedaInfoId, 10);
    });

    return idsPlaceholders[0];
  };

  const getIdViste = function (template) {
    let placeholdersViste = getPlaceholdersViste(template);
    const placeholdersVisteSingole = getPlaceholdersVisteSingole(template);
    placeholdersViste = placeholdersViste.concat(placeholdersVisteSingole);
    const idsPlaceholders = placeholdersViste.map(function (placeholder) {
      const vistaInfo = deSanitizeId(placeholder.split('.')[0]);
      const vistaInfoArray = vistaInfo.split('_');
      const vistaInfoId = vistaInfoArray[vistaInfoArray.length - 1];
      return parseInt(vistaInfoId, 10);
    });

    return idsPlaceholders;
  };

  const sanitizeSlug = function (string) {
    if (!string) {
      return '_' + new Date().getTime();
    }
    return string.replace(/\([^()]*\)/g, '').replace(/\s+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').toLowerCase().split(' ').join('_');
  };

  const deSanitizeId = function (number) {
    const string = number + '';
    return string.toLowerCase().replace(/\[.*\]/g, '').split('pers').join('-');
  };

  const mapSchedaToReportData = function (infoScheda, valori) {
    const toReturn = {};
    valori.forEach(function (valore) {
      const content = valore.dettagli ? valore.dettagli : valore.valore;

      const schedaKey = 'scheda_' + sanitizeSlug(infoScheda.nomeScheda) + '_' + infoScheda.idScheda;
      const campoKey = 'campo_' + sanitizeSlug(valore.etichetta) + '_' + valore.idCampoScheda;

      if (!toReturn[schedaKey]) {
        toReturn[schedaKey] = {};
      }

      toReturn[schedaKey][campoKey] = content;
    });

    return toReturn;
  };

  const mapVistaToReportData = function (infoVista, valori) {
    const toReturn = {};
    const stringIdVista = infoVista.idVista + '';
    const idVistaSanitized = stringIdVista.replace(/-/g, 'pers');
    toReturn['vista_' + sanitizeSlug(infoVista.etichettaVista) + '_' + idVistaSanitized] = valori.records;

    return toReturn;
  };

  const reportHelpers = {
    getIdScheda,
    getIdViste,
    mapSchedaToReportData,
    mapVistaToReportData
  };

  window.angular.module('reportApp', [
    // MODULES
    'reportApp.auth',
    'reportApp.common',
    'reportApp.files',
    'reportApp.report',
    'reportApp.xdb'
  ]);

  window.angular.module('reportApp')
    .controller('myController', [
      '$scope',
      'avatars',
      'reportService',
      'xdbApiService',
      '$compile',
      'currentUser',
      'campiEditabiliReport',
      'storageService',
      'domUtilsService',
      'filesPerCampo',
      function (
        $scope,
        avatars,
        reportService,
        xdbApiService,
        $compile,
        currentUser,
        campiEditabiliReport,
        storageService,
        domUtilsService,
        filesPerCampo
      ) {
        const ID_SCHEDA_CONFIGURAZIONE = 90;

        const getErrorMessage = (error) => {
          if (error && error.message) {
            return error.message;
          }
          return 'Errore sconosciuto';
        };

        const printError = e => {
          const message = getErrorMessage(e);
          console.error(message);
          const div = document.createElement('div');
          div.id = 'report-error';
          document.body.appendChild(div);
          $scope.error = message;
        };

        try {
          const url = new URL(window.location.href);
          const searchParams = url.searchParams;
          const idTemplate = parseInt(searchParams.get('idTemplate'), 10);
          const idRecord = parseInt(searchParams.get('idRecord'), 10);
          const tenantId = parseInt(searchParams.get('tenantId'), 10);

          currentUser.changeTenant(tenantId);

          $scope.stampaDataOra = () => window.moment().toDate();

          let idScheda;
          let infoScheda;
          let idViste;
          let template;
          let visteCorrelate;
          let infoBase;

          $scope.loading = true;
          $scope.error = false;

          Promise.all([
            reportService.getTemplate(idTemplate),
            reportService.getVisteTemplate(idTemplate),
            reportService.getInfoBase()
          ]).then(function (res) {
            template = res[0];

            visteCorrelate = res[1].viste || [];
            infoBase = res[2];
            Object.assign($scope, {
              infoBase
            });
            $scope.infoBase.idRecord = idRecord;

            idScheda = reportHelpers.getIdScheda(template);
            idViste = reportHelpers.getIdViste(template);

            idViste = [...new Set(idViste)];

            return reportService.getDatiSchedaDiRiferimento(idScheda);
          }).then(function (res) {
            infoScheda = res;

            const promises = [];
            if (idScheda) {
              promises.push(xdbApiService.getValoriCampiScheda(idScheda, idRecord));
            }

            idViste.forEach(function (idVista) {
              const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === idVista; }) || {};
              const foreignKeyVista = vistaCorrelata.campoVistaPerFiltro;
              const q = foreignKeyVista ? (foreignKeyVista + '=%25=' + idRecord) : null;
              const limit = q ? -1 : 1000;
              promises.push(xdbApiService.getVistaRows(idVista, limit, 0, null, q));
            });

            if (promises.length) {
              return Promise.all(promises);
            }
          }).then(function (res) {
            if (res && idScheda) {
              const resScheda = res.splice(0, 1);
              Object.assign($scope, reportHelpers.mapSchedaToReportData(infoScheda, resScheda[0].data));
            }

            if (res && res.length) {
              res.forEach(function (vista, index) {
                const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === idViste[index]; }) || {};

                const infoVista = {
                  idVista: idViste[index],
                  etichettaVista: vistaCorrelata.etichettaVista
                };

                Object.assign($scope, reportHelpers.mapVistaToReportData(infoVista, vista.data));
              });
            }

            const body = document.querySelector('.report-wrapper');
            const elements = $compile(template)($scope);

            body.innerHTML = '';

            Array.from(elements).forEach(element => {
              body.appendChild(element);
            });

            const valoriCampiEditabili = storageService.loadLocalStorage('__valoriCampiEditabili') || {};

            const div = document.createElement('div');
            div.innerHTML = JSON.stringify(valoriCampiEditabili);
            body.appendChild(div);

            domUtilsService.waitForSelector('[data-attach-logo-aziendale]').then((reportCompanyLogo) => {
              const ID_RECORD = 1;
              avatars.get(ID_SCHEDA_CONFIGURAZIONE, ID_RECORD)
                .then((url) => {
                  reportCompanyLogo.src = `${url}`;
                });
            });

            domUtilsService.waitForSelector('[data-prima-foto-report]').then((primaFoto) => {
              const idVista = primaFoto.dataset.primaFotoReport;
              const nomeRisorsa = primaFoto.dataset.risorsa;
              const idCampo = primaFoto.dataset.campo;
              const filtroPerCampo = primaFoto.dataset.filtro;

              // genere la query per andare a recuperare i dati per una persona specifica
              const q = filtroPerCampo ? (filtroPerCampo + '=%25=' + idRecord) : null;
              xdbApiService.getVistaRows(idVista, 1, 0, null, q).then((res) => {
                const records = res.data.records ?? [];
                const image = records.filter(file => filesPerCampo.isImage(file.nome));
                filesPerCampo
                  .download(
                    nomeRisorsa,
                    image[0].ID,
                    idCampo
                  ).then((url) => {
                    primaFoto.src = `${url}`;
                  });
              });
            });

            reportService.getApiTemplateCss(parseInt(searchParams.get('idTemplate'), 10)).then((res) => {
              const withPrintInstructions = res.length > 0 ? `@media print {
             ${res} 
            }` : '';
              
              const styleTags = document.querySelectorAll("style");
              const styleTag = styleTags[styleTags.length - 1];

              if (!styleTag) {
                const newStyleTag = document.createElement('style');
                newStyleTag.textContent = res;
                document.head.appendChild(newStyleTag)
              } else {
                styleTag.textContent = `${styleTag.textContent}\n${res}\n${withPrintInstructions}`;
              }

            })

            return campiEditabiliReport.applyValues(valoriCampiEditabili).then(() => {
              const images = body.querySelectorAll('[data-avatar-record]');

              images.forEach(image => {
                const idSschedaPerAvatar = image.dataset.avatarRecord || idScheda;
                avatars
                  .get(idSschedaPerAvatar, idRecord)
                  .then(url => {
                    const div = document.createElement('div');
                    div.style.width = `${image.width}px`;
                    div.style.height = `${image.height}px`;
                    div.style.backgroundImage = `url('${url}')`;
                    div.style.backgroundPosition = 'center';
                    div.style.backgroundSize = 'cover';

                    image.replaceWith(div);
                  });
              });
            });

          }).catch(function (e) {
            printError(e);
          }).finally(function () {
            $scope.$applyAsync(function () {
              $scope.loading = false;
              const reportHeader = document.getElementById('header');
              if (reportHeader) {
                setTimeout(function () {
                  const headerHeight = reportHeader.offsetHeight;
                  const reportHeight = document.documentElement.clientHeight;
                  if (headerHeight / reportHeight > 0.15) {
                    window.top.postMessage('showReportHeaderWarning', '*');
                  } else {
                    window.top.postMessage('hideReportHeaderWarning', '*');
                  }
                }, 0);
              }
            });
          });

        } catch (error) {
          printError(error);
        }
      }
    ]);
})();
