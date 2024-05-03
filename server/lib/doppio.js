const { Doppio } = require('doppio-nodejs');
const urlBuilder = require('./urlBuilder');


const doppioClient = new Doppio("86266031871e4d364c33a1f7"); //process.env.DOPPIO_API_KEY


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

        const { printImage } = body;

        const contentType = printImage ? 'image/jpeg' : 'application/pdf';

        const url = urlBuilder({
            domain,
            tenantId,
            templateId,
            recordId,
            v2
        });

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
                    printBackground: true
                },
                goto: {
                    url,
                    options: {
                        waitUntil: ['networkidle2']
                    }
                },
                // setExtraHTTPHeaders: {
                //     Authorization: `Bearer ${token}`,
                // },
                // "authenticate": {
                //     "username": "string",
                //     "password": "string"
                //   },
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