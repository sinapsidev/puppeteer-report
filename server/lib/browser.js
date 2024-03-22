const puppeteer = require('puppeteer');

let instance = null;

const get = async () => {
  if (!instance) {
    const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'] });

    instance = browser;
  }

  return instance;
};

module.exports = get;
