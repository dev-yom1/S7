import assert from 'node:assert/strict';
import test from 'node:test';
import { checkForUpdate, installUpdate, isNewerVersion, parseVersion } from '../src/updater.js';

test('npm stable versions parse', () => {
  assert.deepEqual(parseVersion('0.3.1'), [0, 3, 1]);
  assert.equal(parseVersion('v0.3.1'), null);
  assert.equal(parseVersion('0.3.1-beta'), null);
});

test('newer version comparison', () => {
  assert.equal(isNewerVersion('0.3.0', '0.3.1'), true);
  assert.equal(isNewerVersion('0.3.1', '0.3.1'), false);
});

test('update check uses npm latest metadata', async () => {
  let seenUrl;
  const result = await checkForUpdate('0.3.0', async (url) => {
    seenUrl = String(url);
    return new Response(JSON.stringify({ version: '0.3.1' }), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  assert.match(seenUrl, /registry\.npmjs\.org\/salta7-cli-node\/latest/);
  assert.equal(result.latestVersion, '0.3.1');
  assert.equal(result.source, 'npm');
  assert.equal(result.updateAvailable, true);
});

test('npm 404 means package is not published', async () => {
  const result = await checkForUpdate('0.3.0', async () => new Response('', { status: 404 }));
  assert.equal(result.releaseFound, false);
  assert.equal(result.source, 'npm');
});

test('update timeout stays active while reading response body', async () => {
  const fetchImpl = async (_url, { signal }) => ({
    status: 200,
    ok: true,
    json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once: true })),
  });
  await assert.rejects(() => checkForUpdate('0.3.0', fetchImpl, 5), /timed out/);
});

test('installUpdate uses npm global install without a shell', async () => {
  let seen;
  const execFileImpl = async (file, args, options) => { seen = { file, args, options }; };
  const result = await installUpdate('0.3.1', { execFileImpl });
  assert.equal(result.version, '0.3.1');
  assert.deepEqual(seen.args, ['install', '--global', 'salta7-cli-node@0.3.1']);
  assert.equal(seen.options.shell, false);
});
