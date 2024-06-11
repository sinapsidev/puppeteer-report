(function () {
  const service = function () {
    const waitForSelector = function (selector, timeout, base) {
      let interval;
      const DELAY = 50;
      const d = base || document;

      return new Promise(function (resolve, reject) {
        const start = Date.now();
        const element = d.querySelector(selector);
        if (element) {
          resolve(element);
        }

        interval = window.setInterval(function () {
          const element = d.querySelector(selector);
          if (element) {
            resolve(element);
            window.clearInterval(interval);
          }

          if (!timeout) {
            return;
          }

          if (Date.now() - start > timeout) {
            reject(new Error('Element not foud'));
            window.clearInterval(interval);
          }
        }, DELAY);
      });
    };

    return {
      waitForSelector
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = service;
  } else {
    window.angular.module('reportApp.common')
      .service('domUtilsService', [
        service]);
  }
})();
