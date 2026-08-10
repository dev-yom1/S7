import assert from 'node:assert/strict';
import test from 'node:test';
import { printResult, sanitize } from '../src/output.js';

test('sanitize masks nested secrets for human output', () => {
  assert.deepEqual(sanitize({ nested: { token: 'abcdefghijkl' } }), { nested: { token: 'abc…jkl' } });
});

test('JSON output preserves API response exactly', () => {
  const lines = [];
  const value = { token: 'email:password:secret-token', nested: { authorization: 'Bearer abcdefghijk' } };
  printResult(value, { json: true }, { log: (line) => lines.push(line) });
  assert.deepEqual(JSON.parse(lines.join('\n')), value);
});

test('JSONL output preserves API response exactly', () => {
  const lines = [];
  const value = { token: 'secret-token' };
  printResult(value, { jsonl: true }, { log: (line) => lines.push(line) });
  assert.equal(lines.length, 1);
  assert.deepEqual(JSON.parse(lines[0]), value);
});
