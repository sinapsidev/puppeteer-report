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
const startDashboard = require('./lib/async-queue/uiDashboard.js')(jobs.getQueue());
await jobs.startWorker()

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'http://localhost:8080';
const DOMAIN = process.env.DOMAIN || 'http://localhost:8080';
const PRINT_TIMEOUT = process.env.PRINT_TIMEOUT || 15 * 1000;

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
  timeout: PRINT_TIMEOUT,
  browserFactory,
  logger
}).then(async (printer) => {
  app.get('/', async function (req, res) {
    return { hello: 'Hello from Puppeteer Report' };
  });

  /* sync call */
  app.post('/print/:tenantId/:templateId/:recordId', async (req, res) => {
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

      const token = authorization.split(' ')[1];

      const result = await printer.print({
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
  });

  /* async calls */
  app.post('/jobs/:tenantId/:templateId/:recordId', async (req, res) => {
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

      const token = authorization.split(' ')[1];

      const { status, jobId } = await jobs.startJob({
        args: {
          body: req.body,
        tenantId,
        templateId,
        recordId,
        token,
        domain: DOMAIN,
        timeZone
        },
        printer: printer,
      }, 10);

      res.send({
        status,
        jobId,
      });
    } catch (e) {
      console.error(e.message);
      res.code(500).send(e.message);
    }
  });

  app.get('/jobs/status/:jobId', async (req, res) => {
    try {

      const { jobId } = req.params;

      const status = jobs.getJobStaus(jobId);

      res.send({ status })

    } catch (e) {
      console.error(e.message);
      res.code(500).send(e.message);
    }
  });

  app.get('/jobs/:jobId', async (req, res) => {
    try {

      const { jobId } = req.params;

      const result = jobs.getJobResult(jobId);

      res.send({ result })

    } catch (e) {
      console.error(e.message);
      res.code(500).send(e.message);
    }
  });


  try {
    await app.listen({ port: PORT });
    console.log('Puppeteer Report ready with Fastify on port ', PORT);
  } catch (e) {
    app.log.error(e);
    logger.error(e);
    process.exit(1);
  }
});
