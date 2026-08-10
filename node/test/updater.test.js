import assert from 'node:assert/strict';
import test from 'node:test';
import { checkForUpdate, isNewerVersion, parseVersion } from '../src/updater.js';

test('stable versions parse', () => {
  assert.deepEqual(parseVersion('v2.5.0'), [2, 5, 0]);
  assert.equal(parseVersion('v2.5.0-beta'), null);
});
test('newer version comparison', () => {
  assert.equal(isNewerVersion('0.2.0', '0.2.1'), true);
  assert.equal(isNewerVersion('0.2.1', '0.2.1'), false);
});
test('404 means no public release', async () => {
  const result = await checkForUpdate('0.2.0', async () => new Response('', { status: 404 }));
  assert.equal(result.releaseFound, false);
});
test('update check aborts on timeout', async () => {
  const fetchImpl = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    reject(error);
  }, { once: true }));
  await assert.rejects(() => checkForUpdate('0.2.0', fetchImpl, 5), /timed out/);
});
