const { Cluster } = require('puppeteer-cluster');

const create = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: process.env.MAX_CONCURRENCY || 8,
    retryDelay: 5000,
    retryLimit: 3,
    timeout: 90000,
    monitor: true,
    puppeteerOptions: {
      headless: true,
      waitForInitialPage: false,
      args: [
        '--no-startup-window',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote'
      ],
      env: {
        TZ: 'Europe/Rome'
      }
    }
  });

  return cluster;
};

module.exports = create;
