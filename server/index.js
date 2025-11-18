const path = require('node:path');
const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

const Fastify = require('fastify');
const fetch = require('node-fetch');

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
  prefix: '/print/public/'
});

const getPrintMode = (body, v1) => {
  if (!v1) {
    return body.printMode || 'pdf';
  }

  return body.printImage ? 'jpg' : 'pdf';
};

const boot = async (app) => {
  try {
    const cluster = await clusterFactory(MONITORING);
    const printer = await printerFactory({
      networkLogging: NETWORK_LOGGING,
      timeout: PRINT_TIMEOUT,
      cluster,
      logger
    });

    app.get('/public', async (req, res) => {
      return res.sendFile('index.html');
    });

    app.get('/', async function (req, res) {
      return { hello: 'Hello from Puppeteer Report' };
    });

    const doPrintRequest = async (req, res, v1 = true) => {
      try {
        const authorization = req.headers.authorization;
        const timeZone = req.headers['time-zone'];
        const domain = req.headers['x-domain'] || 'logicawebdev2.snps.it';

        const {
          tenantId,
          templateId,
          recordId: paramRecordId
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

        const printerApiStyle = await printer.getApiAddedStyles({ domain, tenantId, templateId, token: token, timeZone })

        const printMode = getPrintMode(req.body, v1);

        const body = {
          ...req.body,
          printMode
        };

        const recordId = paramRecordId || req.query.idRecord;

        if (!recordId) throw new Error('recordId non è presente né nel path né come parametro di ricerca.');

        const reqPath = { tenantId, templateId, recordId: paramRecordId };
        const queryParams = { ...req.query };

        const result = await printer.print({
          port: PORT,
          body,
          path: reqPath,
          queryParams,
          token,
          domain,
          timeZone,
          apiCss: printerApiStyle
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
      await doPrintRequest(req, res, true);
    });

    app.post('/print/v2/:tenantId/:templateId/:recordId?',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              tenantId: { type: 'string' },
              templateId: { type: 'string' },
              recordId: {type: 'string'}
            },
            required: ['tenantId', 'templateId']
          },
           querystring: {
        type: 'object',
        properties: {
          idRecord: { type: 'string' }
        }
      }
        }
      },
      async (req, res) => {
      await doPrintRequest(req, res, false);
    });

    app.post('/print/v2/:tenantId/:templateId/%IN=:recordId', async (req, res) => {
      await doPrintRequest(req, res, false);
    });

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log('Puppeteer Report ready with Fastify on port ', PORT);

  } catch (e) {
    app.log.error(e);
    logger.error(e);
    process.exit(1);
  }
};

boot(app);
