'use strict';
(function () {
    const service = function () {
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
        const deSanitizeId = function (number) {
            const string = number + '';
            return string.toLowerCase().replace(/\[.*\]/g, '').split('pers').join('-');
        };

        const sanitizeSlug = function (string) {
            if (!string) {
                return '_' + new Date().getTime();
            }
            return string.replace(/\([^()]*\)/g, '').replace(/\s+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').toLowerCase().split(' ').join('_');
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

        const mapSchedaToReportData = (infoScheda, valori) => {
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

        return {
            sanitizeSlug,
            getIdScheda,
            getIdViste,
            mapSchedaToReportData
        };
    };

    window.angular
        .module('reportApp.report')
        .service('reportHelpers', [
            service
        ]);
})();