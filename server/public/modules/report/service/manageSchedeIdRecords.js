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

  };

  window.angular
    .module('reportApp.report')
    .service('manageSchedeIdRecords', [
      service
    ]);
})();