const factory = ({ fetch, baseUrl, logger }) => {
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

      if (response.status !== 200) {
        return false;
      }

      const body = await response.json();
      return {
        ...body,
        authVersion: 1
      };
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

      if (response.status !== 200) {
        return false;
      }

      const body = await response.json();
      return {
        ...body,
        authVersion: 2
      };
    } catch (e) {
      logger.error(e);
      return false;
    }
  };

  return {
    getProfile: async ({ token, timeZone, tenantId }) => {
      const profileV1 = await checkV1(token, timeZone);
      if (profileV1) {
        return profileV1;
      }

      const profileV2 = await checkV2(tenantId, token, timeZone);

      return profileV2;
    }
  };
};

module.exports = factory
;
