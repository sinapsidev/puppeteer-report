const create = async ({ puppeteer, logger }) => {
  const preparePage = async ({
    browser,
    templateId,
    recordId,
    tenantId,
    token,
    timeZone,
    body,
    domain,
    loginV2 = false
  }) => {
    const url = `${domain}/#!/${tenantId}/report/${templateId}/${recordId}?token=${token}`;
    logger.info(`Opening ${url}`);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); // disable timeout

    const { valoriCampiEditabili } = body;

    logger.info(`Passing fields to the page: ${JSON.stringify(valoriCampiEditabili)}`);

    await page.evaluateOnNewDocument((valoriCampiEditabili) => {
      const VALORI_KEY = 'ngStorage-__valoriCampiEditabili';
      window.localStorage.setItem(VALORI_KEY, JSON.stringify(valoriCampiEditabili));
    }, valoriCampiEditabili || {});

    await page.evaluateOnNewDocument((loginV2) => {
      try {
        const LOGINV2_KEY = 'ngStorage-__loginV2';
        window.localStorage.setItem(LOGINV2_KEY, loginV2);
      } catch (e) {
        console.error(e);
      }
    }, loginV2);

    await page.emulateTimezone(timeZone);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

    const WIDTH = body.width + 'mm';
    const HEIGHT = body.height + 'mm';
    const IS_PAGE_NUMBER_VISIBLE = body.insertPageNumber;

    await page.waitForSelector('#header', { timeout: 0, visible: true });
    await page.waitForSelector('#footer', { timeout: 0, visible: true });
    await page.waitForSelector('#body', { timeout: 0, visible: true });

    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll('img'));
      await Promise.all(selectors.filter(img => !img.complete).map(img => {
        return new Promise((resolve, reject) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', reject);
        });
      }));
    });

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

    await page.addStyleTag(
      { content: PAGE_CSS }
    );

    const config = {
      preferCSSPageSize: true,
      printBackground: true,
      timeout: 0
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

    return {
      page,
      config
    };
  };

  const pdf = async ({
    browser,
    templateId,
    recordId,
    tenantId,
    token,
    timeZone,
    body,
    domain,
    loginV2 = false
  }) => {
    const {
      page,
      config
    } = await preparePage({
      browser,
      templateId,
      recordId,
      tenantId,
      token,
      timeZone,
      body,
      domain,
      loginV2
    });

    const buffer = await page.pdf(config);

    await browser.close();

    return buffer;
  };

  const image = async ({
    browser,
    templateId,
    recordId,
    tenantId,
    token,
    timeZone,
    body,
    domain,
    loginV2 = false
  }) => {
    const {
      page
    } = await preparePage({
      browser,
      templateId,
      recordId,
      tenantId,
      token,
      timeZone,
      body,
      domain,
      loginV2
    });

    const buffer = await await page.screenshot({
      type: 'jpeg',
      encoding: 'binary',
      quality: 100,
      omitBackground: false,
      fullPage: true
    });

    await browser.close();

    return buffer;
  };

  const print = async ({
    templateId,
    recordId,
    tenantId,
    token,
    timeZone,
    body,
    domain,
    loginV2 = false
  }) => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'] });

    const {
      printImage
    } = body;

    const generator = printImage ? image : pdf;
    const contentType = printImage ? 'image/jpeg' : 'application/pdf';

    const buffer = await generator({
      browser,
      templateId,
      recordId,
      tenantId,
      token,
      timeZone,
      body,
      domain,
      loginV2
    });

    await browser.close();

    return {
      contentType,
      buffer
    };
  };

  return {
    print
  };
};

module.exports = create;
