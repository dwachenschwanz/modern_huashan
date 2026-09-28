/*
 * The JWT renewal interval outlives a logout unless something stops it:
 * logging out is a route change, so auth.js's `beforeunload` handler never
 * runs, and a live interval keeps writing a fresh token into the storage the
 * logout just cleared. These tests cover that specific hazard, at this level
 * rather than in the browser suite, because the interval only starts after a
 * real form login and the browser fixture signs in by seeding the session.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = {
  location: { origin: 'http://localhost' },
  SmartOrg: class SmartOrg {
    constructor() {
      this.protocols = {};
    }
  },
  addEventListener() {},
};
globalThis.document = { addEventListener() {}, querySelectorAll: () => [] };

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};

const RENEW_TIMEOUT = 30 * 60 * 1000;

const { autoAuthService } = await import('../src/core/auth.js');

function trackFetch() {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return { json: async () => ({ token: 'renewed' }) };
  };
  return calls;
}

test('the renewal interval stops when the session is torn down', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const calls = trackFetch();

  autoAuthService.startAutoAuth();
  t.mock.timers.tick(RENEW_TIMEOUT + 1);
  assert.equal(calls.length, 1, 'a running session should renew its token');

  autoAuthService.stopAutoAuth();
  t.mock.timers.tick(RENEW_TIMEOUT * 3);
  assert.equal(calls.length, 1, 'renewal kept running after the session ended');
});

test('a later login arms a new renewal interval', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const calls = trackFetch();

  autoAuthService.startAutoAuth();
  autoAuthService.stopAutoAuth();

  // stopAutoAuth clears the handle, not just the interval, so this re-arms.
  autoAuthService.startAutoAuth();
  t.mock.timers.tick(RENEW_TIMEOUT + 1);
  assert.equal(calls.length, 1, 'signing back in should renew again');

  autoAuthService.stopAutoAuth();
});
