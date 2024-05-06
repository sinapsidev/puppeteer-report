const { Cluster } = require('puppeteer-cluster');

const create = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    retryDelay: 5000,
    retryLimit: 3,
    timeout: 90000
  });

  return cluster;
};

module.exports = create;
