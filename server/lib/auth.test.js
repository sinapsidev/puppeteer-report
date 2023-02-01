const t = require('tap');
const authFactory = require('./auth');

const logger = {
  info: () => {},
  error: () => {}
};

t.test('auth', t => {
  t.test('when a v2 check works, returns the v2 element', async t => {
    const mockFetch = (url) => {
      return Promise.resolve({
        ok: true,
        status: 200,
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

    t.equal(result.authVersion,2);

    t.end();
  });

  t.test('when a v2 check does not work, returns the v1 element if working', async t => {
    const mockFetch = (url) => {
      if (!url.includes('v2')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        });
      }

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

    t.equal(result.authVersion, 1);

    t.end();
  });

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
