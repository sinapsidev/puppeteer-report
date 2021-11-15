const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 5000;
const URL = process.env.URL || 'http://localhost:8080';
const DOMAIN = process.env.DOMAIN || 'http://localhost:8080';

const auth = require('./lib/auth')(URL);

const app = express();

app.use(bodyParser.json());

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

    const authenticated = await auth.check({
      timeZone,
      token: authorization,
      tenantId
    });

    if (!authenticated) {
      res.status(401);
      res.send();
      console.error('Unauthorized');
      return;
    }

    const token = authorization.split(' ')[1];

    const url = `${DOMAIN}/#!/${tenantId}/report/${templateId}/${recordId}?token=${token}`;
    console.log(url);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'] });
    const page = await browser.newPage();

    await page.emulateTimezone(timeZone);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

    const WIDTH = req.body.width + 'mm';
    const HEIGHT = req.body.height + 'mm';
    const IS_PAGE_NUMBER_VISIBLE = req.body.insertPageNumber;

    await page.waitForSelector('#header', { timeout: 0 });
    await page.waitForSelector('#footer', { timeout: 0 });
    await page.waitForSelector('#body', { timeout: 0 });

    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll("img"));
      await Promise.all(selectors.map(img => {
        if (img.complete) return;
        return new Promise((resolve, reject) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', reject);
        });
      }));
    })

    await page.evaluate(() => {
      const SBECCO = 20;

      const HEADER_TEMPLATE = document.querySelector('#header').innerHTML;
      const FOOTER_TEMPLATE = document.querySelector('#footer').innerHTML;
      const BODY_TEMPLATE = document.querySelector('#body').innerHTML;

      const HAS_HEADER = !!HEADER_TEMPLATE;
      const HAS_FOOTER = !!FOOTER_TEMPLATE;

      const HEADER_H = HAS_HEADER ? document.querySelector('#header').getBoundingClientRect().height : 0;
      const FOOTER_H = HAS_FOOTER ? document.querySelector('#footer').getBoundingClientRect().height : 0;

      const getCustomCSS = function (headerHeight, footerHeight) {
        const CUSTOM_CSS = `
        .document-preview__frame__page-break-after {
          width: 100%;
          border: none;
          cursor: default;
          display: block;
          height: 1px;
          margin-top: 0;
          page-break-after: always !important;
        }

        .page-header, .page-header-space {
          height: ${headerHeight ? headerHeight + SBECCO : '0'}px;
        }

        .page-footer, .page-footer-space {
          height: ${footerHeight ? footerHeight + SBECCO : '0'}px;
        }

        .page-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #fff;
        }

        .page-header {
          position: fixed;
          top: 0mm;
          width: 100%;
          background-color: #fff;
        }
        
        .page-body {
          table-layout: fixed;
        }

        span {
          white-space: pre-line;
        }

        .standard-padding {
          padding: ${SBECCO / 2}px;
        }
      
        .page {
          page-break-after: always;
        }

        @media print {
          thead {display: table-header-group;} 
          tfoot {display: table-footer-group;}
          button {display: none;}
          body {margin: 0;}
        }

        `;
        return CUSTOM_CSS;
      };

      const CUSTOM_CSS = getCustomCSS(HEADER_H, FOOTER_H);

      const getHTMLReportFromContent = function (bodyHTML, headerHTML, footerHTML) {
        return `
          <style>${CUSTOM_CSS}</style>


          <div id="header" class="page-header">
            <div class="standard-padding">${headerHTML}</div>
          </div>
      
          <div id="footer" class="page-footer">
            <div class="standard-padding">${footerHTML}</div>
          </div>

          <table class="page-body">
            <thead>
              <tr>
                <td>
                  <div class="page-header-space"></div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr style="line-height: 0.01; height: 1px; opacity: 0;">
                <td style="line-height: 0.01; height: 1px; opacity: 0;">
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                  ________________________________
                </td>
              </tr>
              <tr>
                <td>
                  <div class="standard-padding content">
                    ${bodyHTML}
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div class="page-footer-space"></div>
                </td>
              </tr>
            </tfoot>
          </table>

        `;
      };

      const TEMPLATE = getHTMLReportFromContent(BODY_TEMPLATE, HEADER_TEMPLATE, FOOTER_TEMPLATE);
      document.querySelector('body').innerHTML = `${TEMPLATE}`;
    });

    const IS_LANDSCAPE = WIDTH > HEIGHT;

    const PAGE_CSS = `@page { size: ${WIDTH} ${HEIGHT} ${(IS_LANDSCAPE ? 'landscape' : '')}; }`;

    console.log(PAGE_CSS);

    await page.addStyleTag(
      { content: PAGE_CSS }
    );

    const config = {
      preferCSSPageSize: true,
      printBackground: true
    };

    if (IS_LANDSCAPE) {
      config.landscape = true;
    }

    if (IS_PAGE_NUMBER_VISIBLE) {
      config.displayHeaderFooter = true;
      config.footerTemplate = '<div style="width: 100%; font-size: 9px; text-align: center; padding: 5px 0 0 0; font-family: Arial; color: #444;">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></div>';
      config.margin = {
        top: 0,
        right: 0,
        left: 0,
        bottom: 40
      };
    }

    const buffer = await page.pdf(config);
    await browser.close();
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
