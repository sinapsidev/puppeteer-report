const fetch = require('node-fetch');

const factory = (baseUrl, logger) => {
  const checkV1 = async (token, timeZone) => {
    const url = `${baseUrl}/api/data/me`;
    logger.info(`Checking token ${token} with v1 on ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: token,
          'Time-Zone': timeZone
        }
      });

      return response.status === 200;
    } catch (e) {
      logger.error(e);
      return false;
    }
  };

  const checkV2 = async (tenantId, token, timeZone) => {
    const url = `${baseUrl}/api/v2/${tenantId}/data/me`;

    logger.info(`Checking token ${token} with v2 on ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: token,
          'Time-Zone': timeZone
        }
      });

      return response.status === 200;
    } catch (e) {
      logger.error(e);
      return false;
    }
  };

  return {
    check: async ({ token, timeZone, tenantId }) => {
      const validV1 = await checkV1(token, timeZone);
      if (validV1) {
        return true;
      }

      const validV2 = await checkV2(tenantId, token, timeZone);

      return validV2;
    }
  };
};

module.exports = factory
;
