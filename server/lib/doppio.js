const { Doppio } = require('doppio-nodejs');
const urlBuilder = require('./urlBuilder');


const doppioClient = new Doppio(process.env.DOPPIO_API_KEY);


const doppio = async (logger, {
    templateId,
    recordId,
    tenantId,
    body,
    token,
    domain,
    v2
}) => {
    try {
        const start = Date.now();

        const { printImage, width, height, insertPageNumber } = body;

        const contentType = printImage ? 'image/jpeg' : 'application/pdf';

        const url = urlBuilder({ domain, tenantId, templateId, recordId, v2 });

        logger.info(`Fetching ${url} to Doppio`);

        let response
        if (printImage) {
            response = await doppioClient.renderScreenshotDirect({
                screenshot: {
                    captureBeyondViewport: true,
                    fullPage: true,
                    omitBackground: false,
                    quality: 100,
                    type: "webp"
                },
                goto: {
                    url,
                    options: {
                        waitUntil: ['networkidle0']
                    }
                },
                setExtraHTTPHeaders: {
                    Authorization: `Bearer ${token}`,
                }
            });
        }
        else {
            response = await doppioClient.renderPdfDirect({
                pdf: {
                    printBackground: true,
                    width,
                    height,
                    landscape: !!(width > height),
                    displayHeaderFooter: insertPageNumber,
                    footerTemplate:  insertPageNumber ? '<div style="width: 100%; font-size: 9px; text-align: center; padding: 5px 0 0 0; font-family: Arial; color: #444;">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></div>': '',
                    margin: insertPageNumber ? {
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 40
                    } : {},
                },
                goto: {
                    url,
                    options: {
                        waitUntil: ['networkidle0']
                    }
                },
                setCookies: [
                    {
                        name: '_t_052022',
                        value: token,
                        domain: domain.split("://")[1],
                        path: '/',
                        secure: true,
                    }
                ],
            });
        }

        const buffer = Buffer.from(response)

        const end = Date.now();
        logger.info(`Processed page ${url} in ${end - start}ms`);

        return {
            contentType,
            buffer
        };
    } catch (e) {
        logger.error(e.message);
        throw e;
    }
};

module.exports.print = doppio