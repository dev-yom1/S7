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
