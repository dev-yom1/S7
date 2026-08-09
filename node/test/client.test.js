import assert from 'node:assert/strict';
import test from 'node:test';
import { CLIError, Salta7Client, validateBaseUrl } from '../src/client.js';

test('HTTPS is accepted', () => {
  assert.equal(validateBaseUrl('https://example.test/'), 'https://example.test');
});

test('external HTTP is rejected', () => {
  assert.throws(() => validateBaseUrl('http://example.test'), CLIError);
});

test('loopback HTTP requires explicit opt-in', () => {
  assert.throws(() => validateBaseUrl('http://127.0.0.1:8000'), CLIError);
  assert.equal(validateBaseUrl('http://127.0.0.1:8000/', { allowInsecureHttp: true }), 'http://127.0.0.1:8000');
});

test('timeout must be positive', () => {
  assert.throws(() => new Salta7Client({ timeoutMs: 0 }), CLIError);
});

test('authenticated requests use Bearer auth', async () => {
  let seenAuthorization;
  const fetchImpl = async (_url, options) => {
    seenAuthorization = options.headers.authorization;
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const client = new Salta7Client({ token: 'secret-token', fetchImpl });
  await client.balance();
  assert.equal(seenAuthorization, 'Bearer secret-token');
});

test('task products matches Python CLI and requires auth', async () => {
  const client = new Salta7Client({
    fetchImpl: async () => new Response('{}', { status: 200 }),
  });
  await assert.rejects(() => client.taskProducts(), CLIError);
});
