const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const pino = require('pino-http')();
const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'http://localhost:8080';
const DOMAIN = process.env.DOMAIN || 'http://localhost:8080';

const printer = require('./lib/printer')({
  puppeteer,
  logger
});

const auth = require('./lib/auth')(URL, logger);

const app = express();

app.use(bodyParser.json());
app.use(pino);

app.get('/', function (req, res) {
  res.send('Hello from Puppeteer Report');
});

app.post('/print/:tenantId/:templateId/:recordId', async (req, res) => {
  req.log.info('Print Request started');
  try {
    const authorization = req.headers.authorization;
    const timeZone = req.headers['time-zone'];

    const {
      templateId,
      recordId,
      tenantId
    } = req.params;

    const authenticated = await auth.check({
      timeZone,
      token: authorization,
      tenantId,
      logger
    });

    if (!authenticated) {
      res.status(401);
      res.send();
      logger.error('Unauthorized');
      return;
    }

    const token = authorization.split(' ')[1];

    const buffer = await printer.pdf({
      body: req.body,
      tenantId,
      templateId,
      recordId,
      token,
      domain: DOMAIN,
      timeZone
    });

    res.type('application/pdf');
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
