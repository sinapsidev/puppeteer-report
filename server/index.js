const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

const Fastify = require('fastify');
const fetch = require('node-fetch');
const browserFactory = require('./lib/browser')(logger);

// async functions
const jobs = require('./lib/async-queue/jobs.js');
if (process.env.NODE_ENV !== 'production') { require('./lib/async-queue/uiDashboard.js')(jobs.getQueue()); }

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'http://localhost:8080';
const DOMAIN = process.env.DOMAIN || 'http://localhost:8080';
const PRINT_TIMEOUT = process.env.PRINT_TIMEOUT || 45 * 1000;
const NETWORK_LOGGING = process.env.NETWORK_LOGGING || true;
const CLIENT_ID = process.env.CLIENT_ID || 'puppeteerReport';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '951259b6-69a3-4c45-8f5b-3ed06e5103d9';

const printerFactory = require('./lib/printer');

const auth = require('./lib/auth')({
  fetch,
  baseUrl: URL,
  logger
});

const app = Fastify({
  logger: true
});

printerFactory({
  networkLogging: NETWORK_LOGGING,
  timeout: PRINT_TIMEOUT,
  browserFactory,
  logger
}).then(async (printer) => {
  jobs.startWorker(printer.print);

  app.get('/', async function (req, res) {
    return { hello: 'Hello from Puppeteer Report' };
  });

  const doPrintRequest = async (req, res, v2) => {
    try {
      const authorization = req.headers.authorization;
      const timeZone = req.headers['time-zone'];

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

      const result = await printer.print({
        v2,
        body: req.body,
        tenantId,
        templateId,
        recordId,
        token,
        domain: DOMAIN,
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
    await doPrintRequest(req, res, false);
  });

  app.post('/print/v2/:tenantId/:templateId/:recordId', async (req, res) => {
    await doPrintRequest(req, res, true);
  });

  /* async calls */
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
          domain: DOMAIN,
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

  app.get('/print/jobs/status/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;

      const status = await jobs.getJobStaus(jobId);

      res.send({ status });
    } catch (e) {
      console.error(e.message);
      res.code(500).send(e.message);
    }
  });

  app.get('/print/jobs/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;

      const result = await jobs.getJobResult(jobId);

      res.send({ result });
    } catch (e) {
      console.error(e.message);
      res.code(500).send(e.message);
    }
  });

  try {
    await app.listen({ port: PORT,  host: '0.0.0.0' });
    console.log('Puppeteer Report ready with Fastify on port ', PORT);
  } catch (e) {
    app.log.error(e);
    logger.error(e);
    process.exit(1);
  }
});
