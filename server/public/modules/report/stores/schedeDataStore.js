'use strict';
(function () {
    // nonostante sia vero che il concetto di store non esisteva ancora per le versioni
    // 1.x di Angular, lo ripropongo ugualmente attraverso l'uso di questo service
    // come tale

    const service = function () {
        this.data = {
            idScheda: -1,
        };

        this.getData = () => ({ ...this.data });

        this.setData = function (newObj) {
            const canUpdateObject = () => {
                const newObjKeys = Object.keys(newObj);
                const oldObjKeys = Object.keys(this.data);

                return newObjKeys.every((key) => oldObjKeys.includes(key));
            };

            if (!canUpdateObject()) throw new Error(`Non è possibile aggiornare l\'oggetto in schedeDataStore con {${Object.keys(newObj)}}`);

            const dataUpdated = { ...this.data, ...newObj };

            this.data = dataUpdated;
        };
    };

    window.angular.module('reportApp.report').service('schedeDataStore', [service]);
})();