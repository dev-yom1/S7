import assert from 'node:assert/strict';
import test from 'node:test';
import { CLIError, Salta7Client, retryDelayMs, validateBaseUrl } from '../src/client.js';

test('HTTPS is accepted', () => assert.equal(validateBaseUrl('https://example.test/'), 'https://example.test'));
test('external HTTP is rejected', () => assert.throws(() => validateBaseUrl('http://example.test'), CLIError));
test('loopback HTTP requires explicit opt-in', () => {
  assert.throws(() => validateBaseUrl('http://127.0.0.1:8000'), CLIError);
  assert.equal(validateBaseUrl('http://127.0.0.1:8000/', { allowInsecureHttp: true }), 'http://127.0.0.1:8000');
});
test('base URL rejects query and fragment', () => {
  assert.throws(() => validateBaseUrl('https://example.test/api?x=1'), CLIError);
  assert.throws(() => validateBaseUrl('https://example.test/api#x'), CLIError);
});
test('timeout must be positive', () => assert.throws(() => new Salta7Client({ timeoutMs: 0 }), CLIError));
test('missing Retry-After uses exponential backoff', () => {
  assert.equal(retryDelayMs(null, 1), 1000);
  assert.equal(retryDelayMs(null, 2), 2000);
  assert.equal(retryDelayMs(null, 5), 10000);
});
test('numeric Retry-After is honored and capped', () => {
  assert.equal(retryDelayMs('2', 1), 2000);
  assert.equal(retryDelayMs('20', 1), 10000);
});
test('retryable HTTP response waits before retry', async () => {
  let calls = 0;
  const delays = [];
  const client = new Salta7Client({
    retries: 2,
    sleepImpl: async (ms) => delays.push(ms),
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? new Response('{}', { status: 503 }) : new Response('{}', { status: 200 });
    },
  });
  await client.prices();
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1000]);
});
test('network exception waits before retry', async () => {
  let calls = 0;
  const delays = [];
  const client = new Salta7Client({
    retries: 2,
    sleepImpl: async (ms) => delays.push(ms),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('offline');
      return new Response('{}', { status: 200 });
    },
  });
  await client.prices();
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1000]);
});
test('authenticated requests use Bearer auth', async () => {
  let auth;
  const client = new Salta7Client({ token: 'secret-token', fetchImpl: async (_url, options) => {
    auth = options.headers.authorization;
    return new Response('{}', { status: 200 });
  } });
  await client.balance();
  assert.equal(auth, 'Bearer secret-token');
});

test('task history sends the documented task query parameter', async () => {
  let requestedUrl;
  const client = new Salta7Client({
    token: 'secret-token',
    fetchImpl: async (url) => {
      requestedUrl = new URL(url);
      return new Response('[]', { status: 200 });
    },
  });
  await client.taskHistory('boost', 25);
  assert.equal(requestedUrl.pathname, '/task/history');
  assert.equal(requestedUrl.searchParams.get('task'), 'boost');
  assert.equal(requestedUrl.searchParams.get('tool'), null);
  assert.equal(requestedUrl.searchParams.get('limit'), '25');
});

for (const [status, detail] of [
  [400, 'Invalid amount'],
  [401, 'Invalid token'],
  [403, 'Insufficient balance'],
  [404, 'Product not found'],
  [409, 'Insufficient stock'],
  [429, 'Too many requests'],
]) {
  test(`HTTP ${status} preserves documented detail, status, and data`, async () => {
    const data = { detail };
    const client = new Salta7Client({
      token: 'secret-token',
      retries: 1,
      fetchImpl: async () => new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    });

    await assert.rejects(
      () => client.balance(),
      (error) => {
        assert.ok(error instanceof CLIError);
        assert.equal(error.message, `HTTP ${status}: ${detail}`);
        assert.equal(error.status, status);
        assert.deepEqual(error.data, data);
        return true;
      },
    );
  });
}
