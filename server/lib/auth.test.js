const t = require('tap');
const authFactory = require('./auth');

const logger = {
  info: () => {},
  error: () => {}
};

t.test('auth', t => {
  t.test('if both versions don\'t work, return a falsy value', async t => {
    const mockFetch = (url) => {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({})
      });
    };

    const auth = authFactory({
      fetch: mockFetch,
      baseUrl: '',
      logger
    });

    const result = await auth.getProfile({
      token: '', timeZone: '', tenantId: ''
    });

    t.notOk(result);

    t.end();
  });

  t.end();
})
;
