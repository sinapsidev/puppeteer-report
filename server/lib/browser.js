const puppeteer = require('puppeteer');

const create = (logger) => {
  const pool = [];
  const POOL_SIZE = 5;
  let index = 0;

  const get = async () => {
    if (!pool[index]) {
      logger.info(`Launching browser at ${index}`);
      const browser = await puppeteer.launch({
        headless: 'shell',
        userDataDir: './tmp',
        args: [
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--no-first-run',
          '--no-sandbox',
          '--no-zygote',
          '--single-process'
        ]
      });

      pool[index] = browser;
    } else {
      logger.info(`Reusing browser at ${index}`);
    }

    const browser = pool[index];
    index = (index + 1) % POOL_SIZE;

    return browser;
  };

  return get;
};

module.exports = create;