const factory = ({ fetch, baseUrl, logger }) => {
  const checkV2 = async (tenantId, token, timeZone) => {
    const url = `${baseUrl}/api/v2/${tenantId}/data/me`;

    logger.debug(`Checking token ${token} with v2 on ${url}`);
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
    getProfile: ({ token, timeZone, tenantId }) => {
      return checkV2(tenantId, token, timeZone);
    }
  };
};

module.exports = factory;
