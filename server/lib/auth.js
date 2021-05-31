const fetch = require('node-fetch');

const factory = (baseUrl) => {
  const check = async (token, timeZone) => {
    const url = `${baseUrl}/api/data/me`;

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
      console.error(e);
      return false;
    }
  };

  return {
    check
  };
};

module.exports = factory
;
