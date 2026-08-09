import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitize } from '../src/output.js';

test('nested secrets are masked', () => {
  const result = sanitize({ error: { token: 'abcdefghijklmnop', reason: 'bad' } });
  assert.notEqual(result.error.token, 'abcdefghijklmnop');
  assert.equal(result.error.reason, 'bad');
});
