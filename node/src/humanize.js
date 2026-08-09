import fs from 'node:fs/promises';
import path from 'node:path';
import { CLIError } from './client.js';
import { t } from './i18n.js';

const RANDOM_FIELDS = ['avatar', 'name', 'bio', 'pronouns', 'hypesquad'];
const HUMANIZE_FIELDS = new Set(['avatar', 'banner', 'name', 'bio', 'pronouns', 'hypesquad']);
const HYPESQUAD = new Map([['1','1'], ['bravery','1'], ['2','2'], ['brilliance','2'], ['3','3'], ['balance','3']]);
const MIME_BY_EXT = new Map([['.png','image/png'], ['.jpg','image/jpeg'], ['.jpeg','image/jpeg'], ['.gif','image/gif'], ['.webp','image/webp']]);

export function normalizeHypesquad(value) {
  const normalized = HYPESQUAD.get(String(value).trim().toLowerCase());
  if (!normalized) throw new CLIError(t('hypesquadInvalid'));
  return normalized;
}

export function validateHumanize(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config) || Object.keys(config).length === 0) throw new CLIError(t('humanizeRequired'));
  const unknown = Object.keys(config).filter((field) => !HUMANIZE_FIELDS.has(field));
  if (unknown.length) throw new CLIError(t('humanizeUnknown', { fields: unknown.sort().join(', ') }));
  for (const [field, spec] of Object.entries(config)) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new CLIError(t('humanizeSpec', { field }));
    if (!['random', 'custom'].includes(spec.source)) throw new CLIError(t('humanizeSource', { field }));
    if (field === 'banner' && spec.source === 'random') throw new CLIError(t('bannerCustom'));
    if (spec.source === 'custom' && !Object.hasOwn(spec, 'value')) throw new CLIError(t('customValue', { field }));
    const custom = spec.source === 'custom' ? spec.value : undefined;
    if (field === 'name' && typeof custom === 'string' && [...custom].length > 32) throw new CLIError(t('nameLength'));
    if (field === 'bio' && typeof custom === 'string' && [...custom].length > 190) throw new CLIError(t('bioLength'));
    if (field === 'pronouns' && typeof custom === 'string' && [...custom].length > 40) throw new CLIError(t('pronounsLength'));
    if (field === 'hypesquad' && spec.source === 'custom' && !['1','2','3'].includes(String(custom))) throw new CLIError(t('hypesquadInvalid'));
  }
  return config;
}

async function readText(file) {
  try { return await fs.readFile(file, 'utf8'); }
  catch { throw new CLIError(t('readFile', { path: file })); }
}

export async function imageFileToDataUrl(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = MIME_BY_EXT.get(ext);
  if (!mime) throw new CLIError(t('imageType', { path: file }));
  let data;
  try { data = await fs.readFile(file); } catch { throw new CLIError(t('imageNotFound', { path: file })); }
  return `data:${mime};base64,${data.toString('base64')}`;
}

async function loadLegacy(value) {
  if (!value) return {};
  const raw = value.startsWith('@') ? await readText(value.slice(1)) : value;
  let parsed;
  try { parsed = JSON.parse(raw); } catch (error) { throw new CLIError(t('jsonInvalid', { error: error.message })); }
  return validateHumanize(parsed);
}

export async function buildHumanizeConfig(values, { required = false } = {}) {
  const config = { ...(await loadLegacy(values.humanizeJson)) };
  if (values.randomAll) for (const field of RANDOM_FIELDS) config[field] = { source: 'random' };

  if (values.randomAvatar) config.avatar = { source: 'random' };
  else if (values.avatarUrl) {
    const value = String(values.avatarUrl).trim();
    if (!/^(https?:\/\/|data:image\/)/i.test(value)) throw new CLIError(t('avatarInvalid'));
    config.avatar = { source: 'custom', value };
  } else if (values.avatarFile) config.avatar = { source: 'custom', value: await imageFileToDataUrl(values.avatarFile) };

  if (values.bannerFile) config.banner = { source: 'custom', value: await imageFileToDataUrl(values.bannerFile) };
  else if (values.bannerData) {
    const value = String(values.bannerData).trim();
    if (!/^data:image\//i.test(value)) throw new CLIError(t('bannerInvalid'));
    config.banner = { source: 'custom', value };
  }

  for (const field of ['name', 'bio', 'pronouns']) {
    const cap = field[0].toUpperCase() + field.slice(1);
    if (values[`random${cap}`]) config[field] = { source: 'random' };
    else if (values[field] !== undefined) config[field] = { source: 'custom', value: values[field] };
  }
  if (values.randomHypesquad) config.hypesquad = { source: 'random' };
  else if (values.hypesquad !== undefined) config.hypesquad = { source: 'custom', value: normalizeHypesquad(values.hypesquad) };

  if (Object.keys(config).length === 0) {
    if (required) throw new CLIError(t('humanizeRequired'));
    return undefined;
  }
  return validateHumanize(config);
}
