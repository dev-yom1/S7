import assert from 'node:assert/strict';
import test from 'node:test';
import { _test, run } from '../src/cli.js';

test('productEntries accepts Python-compatible wrapper keys', () => {
  for (const key of ['products', 'items', 'data', 'results']) {
    const entries = _test.productEntries({ [key]: [{ product: 'nitro' }] });
    assert.equal(entries[0].name, 'nitro');
  }
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
        baseUrl: 'https://example.test',
        allowInsecureHttp: false,
        token: null,
        json: false,
        jsonl: false,
        compact: false,
        lang: 'en',
      },
    },
  );
  assert.equal(code, 1);
});

test('JSON update --yes installs and emits one final JSON result', async () => {
  const lines = [];
  let installed;
  const code = await run(
    ['--json', 'update', '--yes'],
    { log: (value) => lines.push(value), error: (value) => lines.push(value) },
    { isTTY: false },
    {
      clientOverride: {},
      checkForUpdateOverride: async () => ({
        releaseFound: true,
        updateAvailable: true,
        currentVersion: '0.3.1',
        latestVersion: '0.3.2',
        source: 'npm',
      }),
      installUpdateOverride: async (version) => {
        installed = version;
        return { version, package: 'salta7-cli-node', source: 'npm' };
      },
    },
  );
  assert.equal(code, 0);
  assert.equal(installed, '0.3.2');
  assert.equal(lines.length, 1);
  assert.match(lines[0], /"installed":true/);
});
