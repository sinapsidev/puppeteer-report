(function () {
  'use strict';

  window.angular.module('reportApp', [
    // MODULES
    'reportApp.auth',
    'reportApp.common',
    'reportApp.files',
    'reportApp.report',
    'reportApp.xdb',
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
      'handleIdRecordsParams',
      'reportHelpers',
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
        filesPerCampo,
        handleIdRecordsParams,
        reportHelpers
      ) {
        const ID_SCHEDA_CONFIGURAZIONE = 90;

        const getErrorMessage = (error) => {
          if (error && error.message) {
            return error.message;
          }
          return `Errore sconosciuto: ${typeof error} ${error}`;
        };

        const printError = e => {
          const message = getErrorMessage(e);
          console.error(message);
          const div = document.createElement('div');
          div.id = 'report-error';
          document.body.appendChild(div);
          $scope.error = message;
        };

        const getCampiSchedaObject = (res, idRecord, infoScheda) => {
          if (!Array.isArray(idRecord)) {
            const resScheda = res.splice(0, 1);

            return Object.assign($scope, reportHelpers.mapSchedaToReportData(infoScheda, resScheda[0].data));
          }

          const resScheda = res.splice(0, idRecord.length);

          const objToAssign = {};

          resScheda.forEach((record, index) => {
            // TO-DO: MODIFICARE QUESTA RIGA PER LAVORARE SULLA CREAZIONE DI REPORT CONTENENTI DATI DI UNA STESSA SCHEDA 
            // MA MULTIPLI ID RECORDS
            if (index > 0) return;

            Object.assign(objToAssign, reportHelpers.mapSchedaToReportData(infoScheda, record.data));
          })

          return objToAssign;
        };

        try {
          const url = new URL(window.location.href);
          const searchParams = url.searchParams;
          const idTemplate = parseInt(searchParams.get('idTemplate'), 10);
          const intIdRecord = handleIdRecordsParams.getIntIdRecord(searchParams);
          const arrayIdRecords = handleIdRecordsParams.getArrayIdRecords(searchParams);
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

            Object.assign($scope.infoBase, {
              idRecord: intIdRecord,
              idRecords: arrayIdRecords,
            });

            idScheda = reportHelpers.getIdScheda(template);
            idViste = reportHelpers.getIdViste(template);

            idViste = [...new Set(idViste)];

            return reportService.getDatiSchedaDiRiferimento(idScheda);
          }).then(function (res) {
            infoScheda = res;

            const promises = [];
            if (idScheda && arrayIdRecords.length > 0) {
              arrayIdRecords.forEach((idR, index) => {
                // TO-DO: MODIFICARE QUESTA RIGA PER LAVORARE SULLA CREAZIONE DI REPORT CONTENENTI DATI DI UNA STESSA SCHEDA 
                // MA MULTIPLI ID RECORDS
                if (index > 0) return;

                promises.push(xdbApiService.getValoriCampiScheda(idScheda, idR));
              })
            } else if (idScheda && !arrayIdRecords.length) {
              promises.push(xdbApiService.getValoriCampiScheda(idScheda, intIdRecord));
            }

            const vistaRowsParamsList = idViste.map(function (idVista) {
              const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === idVista; }) || {};
              const foreignKeyVista = vistaCorrelata.campoVistaPerFiltro;
              const limit = foreignKeyVista ? -1 : 1000;

              return {
                idVista,
                limit,
                foreignKeyVista,
                offset: 0,
                sort: null,
              }
            });

            const vistaRowsPromisesList = vistaRowsParamsList.reduce((promisesArray, vistaRowsParams) => {
              const resultArr = [...promisesArray];
              const foreignKeyVista = vistaRowsParams?.foreignKeyVista;

              if (arrayIdRecords.length > 0) {
                const multipleIdsQuery = handleIdRecordsParams.makeVistaRowsQueryParams(foreignKeyVista, arrayIdRecords);

                multipleIdsQuery.forEach((idQ, index) => {
                  // TO-DO: MODIFICARE QUESTA RIGA PER LAVORARE SULLA CREAZIONE DI REPORT CONTENENTI DATI DI VISTE MULTIPLE
                  if (index > 0) return;

                  resultArr.push(xdbApiService.getVistaRows(
                    vistaRowsParams.idVista,
                    vistaRowsParams.limit,
                    vistaRowsParams.offset,
                    vistaRowsParams.sort,
                    idQ
                  ));
                });

                return resultArr;
              }

              const singleIdQuery = handleIdRecordsParams.makeVistaRowsQueryParams(foreignKeyVista, intIdRecord);
              resultArr.push(xdbApiService.getVistaRows(
                vistaRowsParams.idVista,
                vistaRowsParams.limit,
                vistaRowsParams.offset,
                vistaRowsParams.sort,
                singleIdQuery
              ));

              return resultArr;

            }, []) ?? [];

            promises.push(...vistaRowsPromisesList);
            if (promises.length) {
              return Promise.all(promises);
            }
          }).then(function (res) {
            if (res && idScheda) {
              const objToAssign = getCampiSchedaObject(res, arrayIdRecords.length > 0 ? arrayIdRecords : intIdRecord, infoScheda);

              Object.assign($scope, objToAssign);
            }

            if (res && res.length) {
              res.forEach(function (vista) {
                const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === vista?.data?.id; }) || {};

                const infoVista = {
                  idVista: vista?.data?.id,
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
              const q = filtroPerCampo ? `${filtroPerCampo}${handleIdRecordsParams.validateIdRecordParam(intIdRecord)}` : null;
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
                  .get(idSschedaPerAvatar, intIdRecord)
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
