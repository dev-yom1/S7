import assert from 'node:assert/strict';
import test from 'node:test';
import { setLanguage } from '../src/i18n.js';
import { printResult, sanitize } from '../src/output.js';

test('sanitize masks nested secrets for human output', () => {
  setLanguage('en');
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

test('Japanese human output uses translated banner and field labels', () => {
  setLanguage('ja');
  const lines = [];
  printResult({ name: 'leo', balance_usd: 12.4, admin_only: false }, { noColor: true, title: '残高' }, { log: (line) => lines.push(line), isTTY: false });
  const text = lines.join('\n');
  assert.match(text, /⚡ S7 • 残高/);
  assert.match(text, /名前/);
  assert.match(text, /管理者限定/);
  assert.match(text, /いいえ/);
  assert.doesNotMatch(text, /┌─ Result/);
});

test('task status resembles Python progress output and localizes state', () => {
  setLanguage('ja');
  const lines = [];
  printResult({ status: 'running', boosts_requested: 14, boosts_delivered: 4 }, { noColor: true, title: 'タスク状態' }, { log: (line) => lines.push(line), isTTY: false });
  const text = lines.join('\n');
  assert.match(text, /⚡ S7 • タスク状態/);
  assert.match(text, /⟳ 実行中/);
  assert.match(text, /4\/14 配信済み/);
  assert.match(text, /█|░/);
});
