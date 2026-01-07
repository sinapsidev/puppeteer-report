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
      '$compile',
      'currentUser',
      'campiEditabiliReport',
      'storageService',
      'domUtilsService',
      'handleIdRecordsParams',
      'reportHelpers',
      'visteDataService',
      'vistaDataStore',
      'schedeDataStore',
      'campiSchedaService',
      function (
        $scope,
        avatars,
        reportService,
        $compile,
        currentUser,
        campiEditabiliReport,
        storageService,
        domUtilsService,
        handleIdRecordsParams,
        reportHelpers,
        visteDataService,
        vistaDataStore,
        schedeDataStore,
        campiSchedaService
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

            vistaDataStore.setData({idRecord: intIdRecord, idRecords: arrayIdRecords, visteCorrelate, idViste});
            (idScheda && infoScheda) && schedeDataStore.setData({idScheda, infoScheda});

            return reportService.getDatiSchedaDiRiferimento(idScheda);
          }).then(function (res) {
            infoScheda = res;

            const promises = [];

            const vistaRowsPromisesList = visteDataService.getVistaRowsPromisesList(idViste, intIdRecord, visteCorrelate);

            promises.push(...vistaRowsPromisesList);
            if (promises.length) {
              return Promise.all(promises);
            }
          }).then(function (res) {
            if (idScheda) {
              campiSchedaService.getCampiSchedaObject({ infoScheda, idRecord: intIdRecord, idScheda }).then((objToAssign) => {
                Object.assign($scope, objToAssign);
              });
            }

            if (res && res.length) {
              res.forEach(function (vista) {
                const vistaCorrelata = visteCorrelate.find(function (v) { return v.idVista === vista?.data?.id; }) || {};

                const vistaToReportData = visteDataService.createReportVistaObject({vistaCorrelata, vistaResult: vista?.data});

                Object.assign($scope, vistaToReportData);
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

            return campiEditabiliReport.applyValues(valoriCampiEditabili)
            
          }).catch(function (e) {
            printError(e);
          }).finally(function () {
            $scope.$applyAsync(function () {
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
                  $scope.loading = false;
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
