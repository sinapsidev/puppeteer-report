const path = require('node:path');
const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

const Fastify = require('fastify');
const fetch = require('node-fetch');
const browserFactory = require('./lib/browser')(logger);
const doppio = require('./lib/doppio.js');

// async functions
const jobs = require('./lib/async-queue/jobs.js');
if (process.env.NODE_ENV !== 'production') { require('./lib/async-queue/uiDashboard.js')(jobs.getQueue()); }

const PORT = process.env.PORT || 5000;
const PRINT_TIMEOUT = process.env.PRINT_TIMEOUT || 45 * 1000;
const NETWORK_LOGGING = process.env.NETWORK_LOGGING || true;
const MONITORING = process.env.MONITORING || false;
const CLIENT_ID = process.env.CLIENT_ID || 'puppeteerReport';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '951259b6-69a3-4c45-8f5b-3ed06e5103d9';

const printerFactory = require('./lib/printer');
const clusterFactory = require('./lib/cluster');

const auth = require('./lib/auth')({
  fetch,
  logger
});

const app = Fastify({
  logger: true
});

app.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/'
});

clusterFactory(MONITORING).then(async (cluster) => {
  printerFactory({
    networkLogging: NETWORK_LOGGING,
    timeout: PRINT_TIMEOUT,
    cluster,
    logger
  }).then(async (printer) => {
    jobs.startWorker(printer.print);

    app.get('/public', async (req, res) => {
      return res.sendFile('index.html');
    });

    app.get('/', async function (req, res) {
      return { hello: 'Hello from Puppeteer Report' };
    });

    const doPrintRequest = async (req, res) => {
      try {
        const authorization = req.headers.authorization;
        const timeZone = req.headers['time-zone'];
        const domain = req.headers['x-domain'] || 'logicadev2.snps.it';

        const {
          tenantId,
          templateId,
          recordId
        } = req.params;

        const profile = await auth.getProfile({
          domain,
          timeZone,
          token: authorization,
          tenantId
        });

        if (!profile) {
          logger.error('Unauthorized');
          res.code(401).send({});
          return;
        }

        const authResult = await auth.serviceAuth({
          domain,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        });

        const token = authResult.access_token;

        const result = await printer.print({
          port: PORT,
          body: req.body,
          tenantId,
          templateId,
          recordId,
          token,
          domain,
          timeZone
        });

        const {
          buffer,
          contentType
        } = result;

        res.type(contentType).send(buffer);
      } catch (e) {
        console.error(e.message);
        res.code(500).send(e.message);
      }
    };

    app.post('/print/:tenantId/:templateId/:recordId', async (req, res) => {
      await doPrintRequest(req, res);
    });

    app.post('/print/v2/:tenantId/:templateId/:recordId', async (req, res) => {
      await doPrintRequest(req, res);
    });

    /* async calls
    app.post('/print/jobs/:tenantId/:templateId/:recordId', async (req, res) => {
      try {
        const authorization = req.headers.authorization;
        const timeZone = req.headers['time-zone'];
        const requireNotification = !!(req.query.notify === 'true' || req.query.needNotification === 'true' || req.query.requireNotification === 'true' || jobs.defaultNotify === 'true');

        const {
          tenantId,
          templateId,
          recordId
        } = req.params;

        const profile = await auth.getProfile({
          timeZone,
          token: authorization,
          tenantId
        });

        if (!profile) {
          logger.error('Unauthorized');
          res.code(401).send({});
          return;
        }

        const authResult = await auth.serviceAuth({
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        });

        const token = authResult.access_token;

        const { status, jobId } = await jobs.startJob({
          printerArgs: {
            body: req.body,
            tenantId,
            templateId,
            recordId,
            token,
            domain,
            timeZone,
            tokenUser: authorization.split(' ')[1]
          },
          requireNotification
        }, 10);

        res.send({
          status,
          jobId
        });
      } catch (e) {
        console.error(e.message);
        res.code(500).send(e.message);
      }
    });

    app.get('/print/jobs/status/:jobId/:tenantId', async (req, res) => {
      try {
        const { jobId, tenantId } = req.params;
        const authorization = req.headers.authorization;
        const timeZone = req.headers['time-zone'];

        const profile = await auth.getProfile({
          timeZone,
          token: authorization,
          tenantId
        });

        if (!profile) {
          logger.error('Unauthorized');
          res.code(401).send({});
          return;
        }

        const status = await jobs.getJobStaus(jobId);

        res.send({ status });
      } catch (e) {
        console.error(e.message);
        res.code(500).send(e.message);
      }
    });

    app.get('/print/jobs/:jobId/:tenantId', async (req, res) => {
      try {
        const { jobId, tenantId } = req.params;
        const authorization = req.headers.authorization;
        const timeZone = req.headers['time-zone'];

        const profile = await auth.getProfile({
          timeZone,
          token: authorization,
          tenantId
        });

        if (!profile) {
          logger.error('Unauthorized');
          res.code(401).send({});
          return;
        }

        const result = await jobs.getJobResult(jobId);

        res.send({ result });
      } catch (e) {
        console.error(e.message);
        res.code(500).send(e.message);
      }
    });
    */

    try {
      await app.listen({ port: PORT, host: '0.0.0.0' });
      console.log('Puppeteer Report ready with Fastify on port ', PORT);
    } catch (e) {
      app.log.error(e);
      logger.error(e);
      process.exit(1);
    }
  });
});
