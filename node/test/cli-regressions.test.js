import assert from 'node:assert/strict';
import test from 'node:test';
import { run } from '../src/cli.js';

test('stock accepts an explicit product without interactive discovery', async () => {
  const lines = [];
  let selected;
  const client = { stock: async (product) => { selected = product; return { product, stock: 1 }; } };
  const code = await run(['--json', 'stock', 'nitro'], { log: (v) => lines.push(v), error: (v) => lines.push(v) }, { isTTY: false }, { clientOverride: client, globalOverride: { json: true, jsonl: false, compact: false, noColor: true, revealSecrets: false, lang: 'en' } });
  assert.equal(code, 0);
  assert.equal(selected, 'nitro');
  assert.equal(JSON.parse(lines[0]).product, 'nitro');
});

test('doctor fails when token is missing', async () => {
  const lines = [];
  const client = { prices: async () => [] };
  const code = await run(
    ['doctor'],
    { log: (value) => lines.push(value), error: (value) => lines.push(value) },
    { isTTY: false },
    {
      clientOverride: client,
      globalOverride: {
        baseUrl: 'https://example.test', allowInsecureHttp: false, token: null,
        json: false, jsonl: false, compact: false, noColor: true, revealSecrets: false, lang: 'en',
      },
    },
  );
  assert.equal(code, 1);
});

test('JSON update --yes installs and emits final JSON result', async () => {
  const lines = [];
  let installed;
  const code = await run(
    ['--json', 'update', '--yes'],
    { log: (value) => lines.push(value), error: (value) => lines.push(value) },
    { isTTY: false },
    {
      clientOverride: {},
      globalOverride: { json: true, jsonl: false, compact: false, noColor: true, revealSecrets: false, lang: 'en' },
      checkForUpdateOverride: async () => ({ releaseFound: true, updateAvailable: true, currentVersion: '0.3.1', latestVersion: '0.3.2', source: 'npm' }),
      installUpdateOverride: async (version) => { installed = version; return { version, package: 'salta7-cli-node', source: 'npm' }; },
    },
  );
  assert.equal(code, 0);
  assert.equal(installed, '0.3.2');
  assert.equal(lines.length, 1);
  const result = JSON.parse(lines[0]);
  assert.equal(result.version, '0.3.2');
});
