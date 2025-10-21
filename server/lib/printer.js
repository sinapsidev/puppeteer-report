const timeoutUtils = require('./timeout');
const urlBuilder = require('./urlBuilder');
const CCdocx = require('./cloudConvert');
const os = require('os');
const pathNode = require('path');
const getApiCss = require('./getApiTemplateCss')

const URL_BLACKLIST = [
  '.stripe',
  '.maps.googleapis'
];

const applyNetworkLogging = async (page, logger) => {
  await page.setRequestInterception(true);

  page
    .on('console', message =>
      console.log(`${message.type().substr(0, 3).toUpperCase()}: ${message.text()}`));

  page.on('request', async (request) => {
    if (URL_BLACKLIST.some((url) => request.url().includes(url))) {
      logger.info('Aborting request to ' + request.url() + ' because it is blacklisted');
      request.abort();
    } else {
      request.continue();
    }
  });

  page.on('requestfailed', async (request) => {
    if (!URL_BLACKLIST.some((url) => request.url().includes(url))) {
      logger.error(request.url() + ' ' + request.failure().errorText);
    }
  });
};

const create = async ({ timeout, logger, networkLogging, cluster }) => {
  console.log("create getApiCss type", typeof getApiCss);

  const getApiAddedStyles = async ({ domain, tenantId, templateId, token, timeZone }) => {

    logger.info('GET API ADDED STYLES OK')
    
    const style = await getApiCss.getApiTemplateCss({ domain, tenantId, templateId, token, timeZone });

    return style;
  }

  const preparePage = async ({
    token,
    page,
    url,
    timeZone,
    body,
    apiCss
  }) => {
    // console.log('PREPARE PAGE getApiCss', Object.keys(getApiCss), (() => getApiCss.getApiCssCopy())());
    console.log('PREPARE PAGE apiCss',apiCss);

    await page.setDefaultNavigationTimeout(0); // disable timeout
    if (networkLogging) {
      await applyNetworkLogging(page, logger);
    }

    const { valoriCampiEditabili } = body;

    logger.debug(`Passing fields to the page: ${JSON.stringify(valoriCampiEditabili)}`);

    await page.evaluateOnNewDocument((token) => {
      function writeCookie (name, value, options = {}) {
        if (!name) {
          return '';
        }

        if (!value) {
          return '';
        }

        const expires = options.expires;
        const path = '/';

        let str = encodeURIComponent(name) + '=' + encodeURIComponent(value);
        str += path ? ';path=' + path : '';
        str += options.domain ? ';domain=' + options.domain : '';
        str += expires ? ';expires=' + expires.toUTCString() : '';
        str += options.secure ? ';secure' : '';
        str += options.samesite ? ';samesite=' + options.samesite : '';

        document.cookie = str;
      }

      writeCookie('_t_052022', token, { secure: true });
    }, token || '');

    await page.evaluateOnNewDocument((valoriCampiEditabili) => {
      const VALORI_KEY = 'ngStorage-__valoriCampiEditabili';
      window.localStorage.setItem(VALORI_KEY, JSON.stringify(valoriCampiEditabili));
    }, valoriCampiEditabili || {});

    try {
      await page.emulateTimezone(timeZone);
    } catch (error) {
      console.error(error);
    }

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

    const { FOOTER_TEMPLATE, HAS_FOOTER, FOOTER_H } = await page.evaluate((addedStyle) => {

      console.log('---PAGE EVALUATE---', addedStyle)

      const SBECCO = 20;

      const FOOTER_TEMPLATE = document.querySelector('#footer').innerHTML;
      const HEADER_TEMPLATE = document.querySelector('#header').innerHTML;
      const BODY_TEMPLATE = document.querySelector('#body').innerHTML;

      const HAS_FOOTER = !!FOOTER_TEMPLATE;
      const HAS_HEADER = !!HEADER_TEMPLATE;

      const FOOTER_H = HAS_FOOTER ? document.querySelector('#footer').getBoundingClientRect().height : 0;
      const HEADER_H = HAS_HEADER ? document.querySelector('#header').getBoundingClientRect().height : 0;

      const getCustomCSS = function (headerHeight, addedStyle) {
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

            ${addedStyle ?? ""}
          }

          div[data-ng-repeat]:not(:has(div.avoid-break)) {
            -webkit-column-break-inside: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
            orphans: 0;
            widows: 4;
          }

          div.avoid-break {
            -webkit-column-break-inside: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
            orphans: 0;
            widows: 4;
          }

          ${addedStyle ?? ""}
          `;
        return CUSTOM_CSS;
      };

      const CUSTOM_CSS = getCustomCSS(HEADER_H, addedStyle);
      
      const newStyleTag = document.createElement("style");
      
        newStyleTag.innerHTML = CUSTOM_CSS;
      document.head.appendChild(newStyleTag)
      
      console.log('---DOCUMENT---', `${document.head.innerHTML}`)

      const getHTMLReportFromContent = function (bodyHTML, headerHTML) {  
        return `
            <div id="header" class="page-header">
              <div class="standard-padding">${headerHTML}</div>
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

      const TEMPLATE = getHTMLReportFromContent(BODY_TEMPLATE, HEADER_TEMPLATE);
      document.querySelector('body').innerHTML = `${TEMPLATE}`;

      return {
        FOOTER_TEMPLATE,
        HAS_FOOTER,
        FOOTER_H
      };
    }, apiCss);

    const IS_LANDSCAPE = WIDTH > HEIGHT;

    const PAGE_CSS = `@page { size: ${WIDTH} ${HEIGHT} ${(IS_LANDSCAPE ? 'landscape' : '')}; } ${apiCss}`;
    
    await page.addStyleTag(
      { content: PAGE_CSS }
    );

    const {
      printMode
    } = body;

    console.log(Date.now());

    const config = {
      preferCSSPageSize: true,
      printBackground: true,
      timeout: 0,
      path: pathNode.join(os.tmpdir(), printMode == 'pdf' ? Date.now() + '.pdf' : Date.now() + '.jpg')
    };

    if (IS_LANDSCAPE) {
      config.landscape = true;
    }

    if (HAS_FOOTER) {
      config.displayHeaderFooter = true;
      config.margin = {
        top: 0,
        right: 0,
        left: 0,
        bottom: FOOTER_H || 40
      };
      config.footerTemplate = `<div style="width: 100%; background-color: #fff; font-size: 9px; text-align: center; padding: 5px 0 0 0; font-family: Arial; color: #444;">${FOOTER_TEMPLATE}</div>`;
    }

    if (IS_PAGE_NUMBER_VISIBLE) {
      config.margin = {
        top: 0,
        right: 0,
        left: 0,
        bottom: FOOTER_H ? FOOTER_H + 40 : 40
      };
      config.footerTemplate = `<div style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        ${config.footerTemplate}
        <div style="width: 100%; margin-top: 10px; font-size: 9px; text-align: center; padding: 5px 0 0 0; font-family: Arial; color: #444;">
          Pagina <span class="pageNumber"></span> di <span class="totalPages"></span>
        </div>
      </div>`;
    }

    return {
      page,
      config
    };
  };

  const _image = (page) => {
    return page.screenshot({
      type: 'jpeg',
      encoding: 'binary',
      quality: 100,
      omitBackground: false,
      fullPage: true
    });
  };

  const _pdf = (page, config) => {
    return page.pdf(config);
  };

  const _docx = async (page, config) => {
    const pdf = await page.pdf(config);
    const docx = await CCdocx(pdf, 'docx');
    return docx;
  };

  const processPage = ({
    token,
    page,
    url,
    timeZone,
    body,
    apiCss
  }) => {
    console.log('PROCESS PAGE apiCss', apiCss)
    // console.log('PROCESS PAGE getApiCss', Object.keys(getApiCss), getApiCss.getApiCssCopy())

    return Promise.race([
      preparePage({
        token,
        page,
        url,
        timeZone,
        body,
        apiCss
      }),
      timeoutUtils.resolve(timeout, page).then(() => {
        throw new Error('timeout');
      }),
      page.waitForSelector('#madewithlove', { timeout: 0, visible: true }).then(() => {
        throw new Error('Logout');
      }),
      page.waitForSelector('#report-error', { timeout: 0 }).then(() => {
        throw new Error('Report error');
      })
    ]);
  };

  const GENERATORS = {
    jpg: _image,
    pdf: _pdf,
    docx: _docx
  };

  const MIME_TYPES = {
    jpg: 'image/jpeg',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  cluster.task(async ({
    page, data: {
      port,
      templateId,
      recordId,
      tenantId,
      token,
      timeZone,
      body,
      domain,
      apiCss
    }
  }) => {

    console.log('GET API CSS CLUSTER TASK', apiCss)
    // console.log('GET API CSS CLUSTER TASK', Object.keys(getApiCss), getApiCss.getApiCssCopy())

    const start = Date.now();
    const {
      printMode
    } = body;

    const generator = GENERATORS[printMode] || _pdf;
    const contentType = MIME_TYPES[printMode] || 'application/pdf';

    const url = urlBuilder({
      port,
      domain,
      tenantId,
      templateId,
      recordId
    });

    logger.info(`Opening ${url}`);

    const { config } = await processPage({
      token,
      page,
      url,
      timeZone,
      body,
      apiCss
    });

    const buffer = await generator(page, config);

    const end = Date.now();

    logger.info(`Processed page ${url} in ${end - start}ms`);

    return {
      contentType,
      buffer
    };
  });

  const print = async ({
    port,
    templateId,
    recordId,
    tenantId,
    token,
    timeZone,
    body,
    domain,
    v2,
    apiCss
  }) => {
    // console.log("print getApiCss type", Object.keys(getApiCss), getApiCss.getApiCssCopy());
    console.log("print apiCss type", apiCss);

    return await cluster.execute({
      port,
      templateId,
      recordId,
      tenantId,
      token,
      timeZone,
      body,
      domain,
      v2,
      apiCss
    });
  };

  return {
    print,
    getApiAddedStyles
  };
};

module.exports = create;
