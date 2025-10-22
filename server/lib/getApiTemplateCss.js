const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});
const fetch = require('node-fetch');

const factory = ({ fetch, logger }) => {

  const TEMPLATE_BASE_URL = 'templates';

  const getApiTemplateCss = async function ({ domain, tenantId, templateId, token, timeZone }) {

    const url = `https://${domain}/api/v2/${tenantId}/${TEMPLATE_BASE_URL}/${templateId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Time-Zone': timeZone
        }
      })

      if (response.status !== 200) throw new Error('Richiesta completata senza successo ', response);

      const dataJson = await response.json();

      const customStyle = await dataJson.customStyle;

      return customStyle;
    } catch (error) {
      logger.error(error)

      return "";
    }
  }

  return {
    getApiTemplateCss,
  }
}

const service = factory({ fetch, logger });

module.exports = service;