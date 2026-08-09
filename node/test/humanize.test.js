import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHumanizeConfig, normalizeHypesquad, validateHumanize } from '../src/humanize.js';

test('random-all matches Python semantics and excludes banner', async () => {
  const result = await buildHumanizeConfig({ randomAll: true });
  assert.deepEqual(Object.keys(result).sort(), ['avatar', 'bio', 'hypesquad', 'name', 'pronouns']);
  assert.equal(result.avatar.source, 'random');
});

test('explicit CLI values override legacy humanize JSON', async () => {
  const result = await buildHumanizeConfig({
    humanizeJson: JSON.stringify({ name: { source: 'random' } }),
    name: 'Node User',
    hypesquad: 'balance',
  });
  assert.deepEqual(result.name, { source: 'custom', value: 'Node User' });
  assert.deepEqual(result.hypesquad, { source: 'custom', value: '3' });
});

test('banner is custom-only', () => {
  assert.throws(() => validateHumanize({ banner: { source: 'random' } }));
});

test('hypesquad aliases normalize', () => {
  assert.equal(normalizeHypesquad('bravery'), '1');
  assert.equal(normalizeHypesquad('2'), '2');
});
