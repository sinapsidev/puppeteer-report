(function () {
    const service = function () {
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

        const buildTableFromSchedaObj = (schedaObj) => {
          // STRUCTURAL DOM ELEMENTS
          const table = document.createElement('table');
          table.setAttribute('border', '1');
          table.style = {
            borderCollapse: "collapse",
            width: "100%"
          };
          const colGroup = document.createElement('colgroup');
          Array.from({ length: 2 }).forEach((_v, index) => {
            const col = document.createElement('col');
            col.setAttribute('width', index < 1 ? '40%' : '70%');
            colGroup.appendChild(col);
          })
          table.insertAdjacentElement('afterbegin', colGroup);
          const tbody = document.createElement('tbody');
          // DOM ELEMENTS BASED ON DATA
          const objEntries = Object.entries(schedaObj);
          const cellStyle = {
            paddingLeft: "1%",
            textAlign: "left",
            textTransform: "capitalize",
            whiteSpace: "wrap",
            overflow: "hidden",
          };
          objEntries.forEach(([key, value]) => {
            const tbodyRow = document.createElement('tr');
            tbodyRow.style = {
              minHeight: "18px",
            };
            const keyTd = document.createElement('td');
            keyTd.textContent = [...key.replace('/[campo_]|_/gi', ' ')
              .matchAll(/[^0-9|a-zA-Z]/gi)]
              .toString()
              .toUpperCase();
            keyTd.style = { ...cellStyle, fontWeight: "bold" };
            const valueTd = document.createElement('td');
            valueTd.textContent = value + "";
            valueTd.style = cellStyle;
            tbodyRow.insertAdjacentElement('afterbegin', keyTd);
            tbodyRow.insertAdjacentElement('beforeEnd', valueTd);
            tbody.insertAdjacentElement('beforeend', tbodyRow);
          })
          return table;
        }; 

        this.getTableFromSchedaObj = (scope, idRecord) => {
            const schedaKey = Object.keys(scope).find((key) => key.startsWith('scheda_') && key.includes(`_${idRecord}`));
            
            if (!schedaKey) throw new Error(`Proprietà dello $scope per idRecord ${scope.infoBase.idRecord} non trovata`);
                  
            const schedaObj = JSON.stringify(scope[schedaKey]);

            const table = buildTableFromSchedaObj(schedaObj);

            return table;
        }
    };

    window.angular
        .module('reportApp.report')
        .service('manageSchedeIdRecords', [
            service
        ]);
})();