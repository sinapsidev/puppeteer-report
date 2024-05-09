(function () {
  'use strict';
  angular.module('reportApp.report')
    .service('campiEditabiliReport', [
      '$q',
      function (
        $q
      ) {
        const checkboxStyle =
        'display: flex; float: left; justify-content: center; align-items: center; width: 20px; height: 20px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; margin-right: 5px';

        const textboxStyle =
        'min-width: 140px; height: 20px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; margin-left: 5px';

        const applyValues = (valori) => {
          return $q.resolve().then(() => {
            Array.from(document.querySelectorAll('[data-input-id]')).forEach(
              (div) => {
                const type = getType(div);
                const input = div.querySelector('div');
                switch (type) {
                  case 'text':
                  case 'date':
                  case 'dateTime':
                    input.style = textboxStyle;
                    input.innerHTML = valori[div.dataset.inputId]
                      ? valori[div.dataset.inputId]
                      : '';
                    break;
                  default:
                    input.style = checkboxStyle;
                    input.innerHTML = valori[div.dataset.inputId] ? 'x' : '';
                }
              }
            );
          });
        };

        const getType = (element) => element.getAttribute('data-input-type') || 'checkbox';

        return {
          applyValues
        };
      }
    ]);
})();
