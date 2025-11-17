(function () {
  const service = function () {

    const canParamBecomeArray = (param) => [...param.matchAll(/^(?=.*%)(?=.*\bIN\b)(?=.*=)(?=.*,).*$/g)]?.length > 0;

    this.getArrayIdRecords = (searchParams) => {
      if (!searchParams) throw new Error("SearchParams assenti");

      const idRecordParam = searchParams.get('idRecord');

      if (!idRecordParam) throw new Error("Parametro idRecord assente");

      if (!canParamBecomeArray(idRecordParam)) return [];

      const withoutInclusion = idRecordParam.split(/(%25|IN|=|%3D|,|%)/).filter((subStr) => typeof subStr === 'string' && !subStr.match(/(%25|IN|=|%3D|,|%)/));
      const asStringsArray = withoutInclusion.filter(str => typeof str === 'string' && str.match(/[0-9]/));
      const asNumsArray = asStringsArray.map(str => parseInt(str, 10));

      return asNumsArray;
    };

    this.getIntIdRecord = (searchParams) => {
      if (!searchParams) throw new Error("SearchParams assenti");

      const idRecordParam = searchParams.get('idRecord');

      if (!idRecordParam) throw new Error("Parametro idRecord assente");

      if (canParamBecomeArray(idRecordParam)) {
        const array = this.getArrayIdRecords(searchParams);

        return array[0];
      }
      
      return parseInt(idRecordParam, 10);
    };

    this.validateIdRecordParam = (idRecord) => {
      if (!idRecord) {
        throw new Error('idRecord mancante', typeof idRecord);
      };

      if (Array.isArray(idRecord)) {
        return `=%25IN=${idRecord.toString()}`;
      }

      return `=%25=${idRecord}`;
    };

    this.makeVistaRowsQueryParams = (queryKey, idRecord) => {
      if (!idRecord) {
        throw new Error('idRecord mancante', typeof idRecord);
      };

      if (!queryKey) {
        throw new Error('queryKey mancante', typeof queryKey);
      };

      if (!queryKey) return null;

      if (!Array.isArray(idRecord)) {
        return `${queryKey}${this.validateIdRecordParam(idRecord)}`;
      }

      return idRecord.map((idR) => `${queryKey}${this.validateIdRecordParam(idR)}`)
     };

  };

  window.angular
    .module('reportApp.report')
    .service('handleIdRecordsParams', [
      service
    ]);
})();