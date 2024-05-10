const { Doppio } = require('doppio-nodejs');
const urlBuilder = require('./urlBuilder');


const doppioClient = new Doppio(process.env.DOPPIO_API_KEY);

const footerTemplate = '<div style="width: 100%; font-size: 9px; text-align: center; padding: 5px 0 0 0; font-family: Arial; color: #444;">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></div>';
const footerTemplateEncoded = Buffer.from(footerTemplate).toString('base64')

const doppio = async (logger, {
    port,
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

        const url = urlBuilder({ port, domain, tenantId, templateId, recordId, v2 });

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
console.log(url)
            response = await doppioClient.renderPdfDirect({
                pdf: {
                    printBackground: true,
                    // width,
                    // height,
                    // landscape: !!(width > height),
                    // displayHeaderFooter: insertPageNumber,
                    // footerTemplate:  insertPageNumber ? footerTemplateEncoded: '',
                    // margin: insertPageNumber ? {
                    //     top: 0,
                    //     right: 0,
                    //     left: 0,
                    //     bottom: 40
                    // } : {},
                },
                setExtraHTTPHeaders: {
                    'ngrok-skip-browser-warning': 0
                },
                goto: {
                    // url,
                    // url: 'https://logicadev2.snps.it/#!/0/report/-54/223590',
                    url: 'https://b95c-93-149-39-162.ngrok-free.app/public/index.html?idTemplate=-54&idRecord=223590&tenantId=0&domain=https%3A%2F%2Flogicadev2.snps.it',
                    options: {
                        waitUntil: ['load']
                    }
                },
                setCookies: [
                    {
                        name: '_t_052022',
                        value: token,
                        domain: domain,  //.split("://")[1],     // domain non va bene perchè contine 'https://...'
                        path: '/',
                        secure: true,
                    }
                ],
            });
        }
console.log(response)
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