import assert from 'node:assert/strict';
import test from 'node:test';
import { isNewerVersion, parseVersion } from '../src/updater.js';

test('stable versions parse', () => {
  assert.deepEqual(parseVersion('v2.5.0'), [2, 5, 0]);
  assert.equal(parseVersion('nightly'), null);
});

test('newer versions compare', () => {
  assert.equal(isNewerVersion('2.4.0', '2.5.0'), true);
  assert.equal(isNewerVersion('2.5.0', '2.4.0'), false);
});
