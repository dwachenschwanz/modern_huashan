import assert from 'node:assert/strict';
import test from 'node:test';

const windowListeners = new Map();
globalThis.window = {
  location: { origin: 'http://localhost' },
  SmartOrg: class SmartOrg {
    constructor() {
      this.protocols = {};
    }
  },
  setTimeout,
  clearTimeout,
  addEventListener(type, listener) {
    windowListeners.set(type, listener);
  },
};
globalThis.document = {
  addEventListener() {},
  querySelectorAll() {
    return [];
  },
};

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
};

const { TheUte } = await import('../src/core/textUtils.js');
const { HuashanApiError, huashan, isRequestAborted } = await import('../src/api/huashanClient.js');
const { addRoute, startRouter } = await import('../src/core/router.js');
const { restoreSmartOrgCredentials } = await import('../src/core/session.js');
const { smartorg } = await import('../src/core/config.js');

function envelope(value, status = '1', name = 'Result', token) {
  return {
    token,
    commands: [{
      name,
      parameters: [{ value: TheUte.pack(value) }, { value: status }],
    }],
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test.beforeEach(() => {
  storage.clear();
});

test('parses structured object results and stores refreshed tokens', async () => {
  globalThis.fetch = async () => jsonResponse(envelope(JSON.stringify({ MENU: [] }), '1', 'Result', 'new-token'));

  const response = await huashan.getTemplates('credentials');

  assert.equal(response.status, true);
  assert.deepEqual(response.result, { MENU: [] });
  assert.equal(response.credentials, 'credentials');
  assert.equal(storage.get('JWT-TOKEN'), 'new-token');
});

test('preserves successful non-JSON results as strings', async () => {
  globalThis.fetch = async () => jsonResponse(envelope('plain result'));

  const response = await huashan.getTemplates('credentials');

  assert.equal(response.result, 'plain result');
});

test('preserves newline-delimited revision JSON for per-line parsing', async () => {
  const revisions = '{"commitNum":"first"}\n{"commitNum":"second"}';
  globalThis.fetch = async () => jsonResponse(envelope(revisions));

  const response = await huashan.getRevisions('credentials', 'template');

  assert.equal(response.status, true);
  assert.equal(response.result, revisions);
});

test('restores SmartOrg HMAC credentials from persisted Kirk credentials', () => {
  const secret = '0123456789abcdef0123456789abcdef';
  const kreds = TheUte.pack(`user_with_underscores_${secret}`);

  assert.equal(restoreSmartOrgCredentials(kreds), true);
  assert.deepEqual(smartorg.protocols.credentials, {
    username: 'user_with_underscores',
    secret,
  });
});

test('returns decoded backend messages for application-level failures', async () => {
  globalThis.fetch = async () => jsonResponse(envelope('Request was rejected', '0'));

  const response = await huashan.getTemplates('credentials');

  assert.equal(response.status, false);
  assert.equal(response.msg, 'Request was rejected');
});

test('rejects malformed command envelopes with a typed error', async () => {
  globalThis.fetch = async () => jsonResponse({ commands: [] });

  await assert.rejects(
    () => huashan.getTemplates('credentials'),
    (error) => error instanceof HuashanApiError && error.code === 'INVALID_ENVELOPE'
  );
});

test('rejects invalid JSON responses with a typed error', async () => {
  globalThis.fetch = async () => new Response('<html>not json</html>', { status: 200 });

  await assert.rejects(
    () => huashan.getTemplates('credentials'),
    (error) => error instanceof HuashanApiError && error.code === 'INVALID_JSON'
  );
});

test('includes HTTP details and removes stale tokens after authorization failures', async () => {
  storage.set('JWT-TOKEN', 'stale-token');
  globalThis.fetch = async () => jsonResponse({ message: 'Session expired' }, 401);

  await assert.rejects(
    () => huashan.getTemplates('credentials'),
    (error) => (
      error instanceof HuashanApiError &&
      error.code === 'HTTP_ERROR' &&
      error.status === 401 &&
      error.message.includes('Session expired')
    )
  );
  assert.equal(storage.has('JWT-TOKEN'), false);
});

test('cancels in-flight API requests when navigation starts', async () => {
  let requestPromise;
  globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });

  addRoute('/pending-request', () => {
    requestPromise = huashan.getTemplates('credentials');
    return () => {};
  });
  addRoute('/next-view', () => () => {});

  globalThis.window.location.hash = '#/pending-request';
  startRouter({});
  await new Promise((resolve) => setTimeout(resolve, 0));

  globalThis.window.location.hash = '#/next-view';
  await windowListeners.get('hashchange')();

  await assert.rejects(requestPromise, (error) => isRequestAborted(error));
});
