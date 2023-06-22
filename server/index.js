const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const pino = require('pino-http')();
const fetch = require('node-fetch');
const request = require('request');
const DOPPIO_TOKEN = '3651be64a62c0b2dac6d10cf';

const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

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
app.use(pino);

printerFactory({
  puppeteer,
  logger
}).then(printer => {
  app.get('/', function (req, res) {
    res.send('Hello from Puppeteer Report');
  });

  app.post('/print/test/:tenantId/:templateId/:recordId', async (req, res) => {
    const authorization = req.headers.authorization;
    const token = authorization.split(' ')[1];

    const {
      templateId,
      recordId,
      tenantId
    } = req.params;

    const url = `${DOMAIN}/#!/${tenantId}/report/${templateId}/${recordId}?token=${token}`;

    const options = {
      encoding: null,
      method: 'POST',
      url: 'https://api.doppio.sh/v1/render/pdf/direct',
      headers: {
        Authorization: `Bearer ${DOPPIO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: {
          pdf: {
            printBackground: true
          },
          goto: {
            url
          }
        }
      })
    };

    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
      res.type('application/pdf');
      res.send(response.body);
    });
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
        timeZone,
        loginV2: profile.authVersion === 2
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
