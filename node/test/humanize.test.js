import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHumanizeConfig, normalizeHypesquad, validateHumanize } from '../src/humanize.js';

test('random-all excludes banner', async () => {
  const result = await buildHumanizeConfig({ randomAll: true });
  assert.deepEqual(Object.keys(result).sort(), ['avatar', 'bio', 'hypesquad', 'name', 'pronouns']);
});
test('explicit CLI overrides legacy JSON', async () => {
  const result = await buildHumanizeConfig({ humanizeJson: JSON.stringify({ name: { source: 'random' } }), name: 'Node User', hypesquad: 'balance' });
  assert.deepEqual(result.name, { source: 'custom', value: 'Node User' });
  assert.deepEqual(result.hypesquad, { source: 'custom', value: '3' });
});
test('banner is custom-only', () => assert.throws(() => validateHumanize({ banner: { source: 'random' } })));
test('hypesquad aliases normalize', () => assert.equal(normalizeHypesquad('bravery'), '1'));
test('avatar CLI sources are mutually exclusive', async () => {
  await assert.rejects(() => buildHumanizeConfig({ randomAvatar: true, avatarUrl: 'https://example.test/a.png' }), /mutually exclusive/);
});
test('banner CLI sources are mutually exclusive', async () => {
  await assert.rejects(() => buildHumanizeConfig({ bannerFile: 'a.png', bannerData: 'data:image/png;base64,AA==' }), /mutually exclusive/);
});
