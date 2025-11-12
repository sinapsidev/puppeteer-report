(function () {
  const service = function (xdbApiService, reportService) {
    this.getValidIdRecord = (searchParams) => {
      if (!searchParams) throw new Error("SearchParams assenti");

      const idRecordParam = searchParams.get('idRecord');

      if (!idRecordParam) throw new Error("Parametro idRecord assente");

      const hasQueryParamsValues = [...idRecordParam.matchAll(/(%25|IN|=|%3D|,)/g)]

      if (!hasQueryParamsValues?.length) {
        return parseInt(idRecordParam, 10);
      }

      const withoutInclusion = idRecordParam.split(/(%25|IN|=|%3D|,|%)/).filter((subStr) => typeof subStr === 'string' && !subStr.match(/(%25|IN|=|%3D|,|%)/));
      const asStringsArray = withoutInclusion.filter(str => typeof str === 'string' && str.match(/[0-9]/));
      const asNumsArray = asStringsArray.map(str => parseInt(str, 10));

      return asNumsArray;
    };

    this.validateIdRecordParam = (idRecord) => {
      if (!idRecord) {
        throw new Error('idRecord mancante', idRecord);
      };

      if (Array.isArray(idRecord)) {
        return `=%25IN=${idRecord.toString()}`;
      }

      return `=%25=${idRecord}`;
    };

    const getCampiSchedaValues = async (idRecord, templateId) => {
      try {
        const printModeInstructions = await reportService.getPrintModeInstructions(templateId);
        const templateIdScheda = await printModeInstructions?.idScheda;

        if (!templateIdScheda) throw new Error('Id scheda da idRecord non presente. Tipo templateIdScheda: ', typeof templateIdScheda);

        const valoriCampiScheda = await xdbApiService.getValoriCampiScheda(templateIdScheda, idRecord);

        if (!valoriCampiScheda) throw new Error('Valori per campi scheda non presenti. Tipo valoriCampiScheda: ', typeof valoriCampiScheda);

        return valoriCampiScheda?.data;
      } catch (error) {
        console.error('Errore nell\'ottenere campi scheda.\n', error.message)
        return null;
      }
    };

    this.buildTableFromSchedaObj = async (idRecord, templateId) => {
      try {
        // GET CAMPI SCHEDA VALUES
        const campiSchedaValues = await getCampiSchedaValues(idRecord, templateId);

        if (!campiSchedaValues) throw new Error('campiSchedaValues non esistenti. Tipo campiSchedaValues: ', typeof campiSchedaValues);

        // STRUCTURAL DOM ELEMENTS
        const table = window.document.createElement('table');
        table.setAttribute('border', '1');
        table.style = {
          borderCollapse: "collapse",
          width: "100%"
        };
        const colGroup = window.document.createElement('colgroup');
        Array.from({ length: 2 }).forEach((_v, index) => {
          const col = window.document.createElement('col');
          col.setAttribute('width', index < 1 ? '40%' : '70%');
          colGroup.appendChild(col);
        })
        table.insertAdjacentElement('afterbegin', colGroup);
        const tbody = window.document.createElement('tbody');
        table.insertAdjacentElement('beforeend', tbody);

        // DOM ELEMENTS BASED ON DATA
        const cellStyle = {
          paddingLeft: "1%",
          textAlign: "left",
          textTransform: "capitalize",
          whiteSpace: "wrap",
          overflow: "hidden",
        };
        campiSchedaValues.forEach((campo) => {
          const tbodyRow = window.document.createElement('tr');
          tbodyRow.style = {
            minHeight: "18px",
          };

          const keyTd = window.document.createElement('td');
          keyTd.textContent = campo?.etichetta.toUpperCase();
          keyTd.style = { ...cellStyle, fontWeight: "bold" };
          const valueTd = window.document.createElement('td');

          valueTd.textContent = campo?.dettagli;
          valueTd.style = cellStyle;
          tbodyRow.insertAdjacentElement('afterbegin', keyTd);
          tbodyRow.insertAdjacentElement('beforeEnd', valueTd);
          tbody.insertAdjacentElement('beforeend', tbodyRow);
        })

        return table;
      } catch (error) {
        console.error("Errore nella creazione della tabella da idRecord.\n", error?.message);
        const emptySpan = window.document.createElement('span');
        return emptySpan;
      }
    };

  };

  window.angular
    .module('reportApp.report')
    .service('manageSchedeIdRecords', [
      'xdbApiService',
      'reportService',
      service
    ]);
})();