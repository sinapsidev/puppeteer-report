const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});
const fetch = require('node-fetch');

const factory = ({ fetch, logger }) => {

  const TEMPLATE_BASE_URL = 'templates';

  const getApiTemplateCss = async function ({ domain, tenantId, templateId, token, timeZone }) {
    const argsExist = [domain, tenantId, templateId, token, timeZone];

    if(argsExist.some((arg) => !arg)) throw new Error(`Ci sono dei parametri obbligatori mancanti. Parametri presenti: \n- domain: ${domain}, \n- tenantId: ${tenantId}, \n- templateId: ${templateId}, \n- token: ${token}, \n- timeZone: ${timeZone}`);

    const url = `https://${domain}/api/v2/${tenantId}/${TEMPLATE_BASE_URL}/${templateId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Time-Zone': timeZone
        }
      })

      if (response.status >= 300 || response.status < 200) {
        const errorBody = await response.text();

        throw new Error(`Richiesta completata senza successo ${response.status}: ${errorBody}`);
      }

      const dataJson = await response.json();

      const customStyle = dataJson.customStyle ?? "";

      return customStyle;
    } catch (error) {
      logger.error({ error, url, templateId }, 'Errore nel recupero del template CSS')

      return "";
    }
  }

  return {
    getApiTemplateCss,
  }
}

const service = factory({ fetch, logger });

module.exports = service;