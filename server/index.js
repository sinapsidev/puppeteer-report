const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const browserFactory = require('./lib/browser')(logger);

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'http://localhost:8080';
const DOMAIN = process.env.DOMAIN || 'http://localhost:8080';

const printerFactory = require('./lib/printer');

const auth = require('./lib/auth')({
  fetch,
  baseUrl: URL,
  logger
});

const app = express();

app.use(bodyParser.json());

printerFactory({
  browserFactory,
  logger
}).then(printer => {
  app.get('/', function (req, res) {
    res.send('Hello from Puppeteer Report');
  });

  app.post('/print/:tenantId/:templateId/:recordId', async (req, res) => {
    try {
      const authorization = req.headers.authorization;
      const timeZone = req.headers['time-zone'];

      const {
        templateId,
        recordId,
        tenantId
      } = req.params;

      const profile = await auth.getProfile({
        timeZone,
        token: authorization,
        tenantId
      });

      if (!profile) {
        res.status(401);
        res.send();
        logger.error('Unauthorized');
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

      res.type(contentType);
      res.send(buffer);
    } catch (e) {
      console.error(e.message);
      res.status(500);
      res.send(e.message);
    }
  });

  app.listen(PORT, function () {
    console.log('Puppeteer Report ready on port ', PORT);
  });
});
