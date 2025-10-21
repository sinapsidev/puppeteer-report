const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});
const fetch = require('node-fetch');

const factory = ({ fetch, logger }) => {

  const TEMPLATE_BASE_URL = 'templates';

  let style = "";

const getApiTemplateCss = async function ({domain, tenantId, templateId, token, timeZone}) {
  
  const url = `${domain}/api/v2/${tenantId}/${TEMPLATE_BASE_URL}/${templateId}`;

  try { 
    const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: token,
          'Time-Zone': timeZone
        }
    })

    if (response.status !== 200) throw new Error('Richiesta completata senza successo: stato ', response.status);

    const data = await response.data.json();

    const customStyle = await data.customStyle;

    style = customStyle;    
  } catch (error) {
    logger.error(error)
  }  
  }

  const getApiCssCopy = () => style;

  return {
    getApiTemplateCss: ({domain, tenantId, templateId, token, timeZone}) => getApiTemplateCss({domain, tenantId, templateId, token, timeZone}),
    getApiCssCopy
  }
}

const service = factory({fetch, logger});

module.exports = service;