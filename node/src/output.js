import { t } from './i18n.js';

const SENSITIVE_KEYS = new Set(['token', 'tokens', 'item_data', 'authorization', 'api_token', 'password', 'pass']);
const ANSI = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', brightCyan: '\x1b[96m', white: '\x1b[97m',
};
const PRIORITY = ['title', 'name', 'product', 'account', 'price', 'amount', 'quantity', 'status', 'id', 'format', 'stock', 'warranty', 'description', 'details', 'admin_only'];
const LOGO = String.raw`   _____  _____
  / ___/ /__  /
  \__ \    / /
 ___/ /   / /
/____/   /_/`;

function mask(value) {
  const text = String(value ?? '');
  if (!text || text.length <= 8) return '***';
  return `${text.slice(0, 3)}…${text.slice(-3)}`;
}

export function sanitize(value, { revealSecrets = false, key = '' } = {}) {
  if (revealSecrets) return value;
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    if (Array.isArray(value)) return t('common.redacted_items', { count: value.length });
    return mask(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v, { key: k })]));
  return value;
}

function colorEnabled(noColor, io) {
  if (noColor || process.env.NO_COLOR !== undefined || process.env.TERM === 'dumb') return false;
  return Boolean(io?.isTTY ?? process.stdout?.isTTY);
}
function paint(text, styles, enabled) {
  const rendered = String(text);
  if (!enabled || !styles?.length) return rendered;
  return `${styles.map((s) => ANSI[s] ?? '').join('')}${rendered}${ANSI.reset}`;
}
export function printLogo(version, { noColor = false } = {}, io = console) {
  const enabled = colorEnabled(noColor, io);
  io.log(paint(LOGO, ['bold', 'brightCyan'], enabled));
  io.log(`  ${paint('S A L T A 7   C L I', ['bold', 'white'], enabled)}  ${paint(`v${version}`, ['dim'], enabled)}`);
  io.log(`  ${paint(t('logo.tagline'), ['dim'], enabled)}`);
  io.log('');
}
function timeText() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function prettyLabel(key) {
  const translated = t(`field.${String(key).toLowerCase()}`);
  if (translated !== `field.${String(key).toLowerCase()}`) return translated;
  return String(key).replaceAll('_', ' ').replace(/\bId\b/gi, 'ID').replace(/\bApi\b/gi, 'API').replace(/\bUrl\b/gi, 'URL').replace(/\bByot\b/gi, 'BYOT').replace(/\b\w/g, (m) => m.toUpperCase());
}
function scalar(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
function orderedEntries(obj) {
  const keys = Object.keys(obj).filter((k) => obj[k] !== null && obj[k] !== '' && !(Array.isArray(obj[k]) && obj[k].length === 0));
  return [...PRIORITY.filter((k) => keys.includes(k)), ...keys.filter((k) => !PRIORITY.includes(k))].map((k) => [k, obj[k]]);
}
function logLine(io, icon, message, enabled) {
  const style = { '✓': 'green', '⟳': 'cyan', '!': 'yellow', '✗': 'red', '•': 'dim' }[icon];
  io.log(`${paint(`[${timeText()}]`, ['dim'], enabled)} ${paint(icon, style ? [style] : [], enabled)} ${message}`);
}
function banner(io, title, enabled) {
  io.log(`${paint('⚡ S7', ['bold', 'brightCyan'], enabled)} ${paint('•', ['dim'], enabled)} ${paint(title, ['bold'], enabled)}\n`);
}
export function printMenuHeader(version, { noColor = false } = {}, io = console) {
  const enabled = colorEnabled(noColor, io);
  io.log(`${paint('⚡ S7', ['bold', 'brightCyan'], enabled)} ${paint('•', ['dim'], enabled)} ${paint(t('menu.title'), ['bold'], enabled)} ${paint(`v${version}`, ['dim'], enabled)}`);
  io.log(paint('─'.repeat(42), ['dim'], enabled));
}
function renderFields(io, obj, enabled, indent = 11) {
  const entries = orderedEntries(obj);
  const width = Math.min(16, Math.max(0, ...entries.map(([k]) => [...prettyLabel(k)].length)));
  for (const [key, value] of entries) {
    const label = prettyLabel(key).padEnd(width, ' ');
    if (Array.isArray(value)) {
      io.log(`${' '.repeat(indent)}${paint(label, ['dim'], enabled)}  ${t('common.item_count', { count: value.length })}`);
      value.forEach((item, index) => {
        if (item && typeof item === 'object') renderCard(io, item, index + 1, enabled, indent + 2);
        else io.log(`${' '.repeat(indent + 2)}${index + 1}. ${scalar(item)}`);
      });
    } else if (value && typeof value === 'object') {
      io.log(`${' '.repeat(indent)}${paint(label, ['dim'], enabled)}  ${JSON.stringify(value)}`);
    } else {
      io.log(`${' '.repeat(indent)}${paint(label, ['dim'], enabled)}  ${scalar(value)}`);
    }
  }
}
function renderCard(io, obj, index, enabled, indent = 11) {
  const title = obj.title ?? obj.name ?? obj.product ?? `#${index}`;
  io.log(`${' '.repeat(indent)}${paint(`${index}.`, ['dim'], enabled)} ${paint(title, ['bold', 'cyan'], enabled)}`);
  const body = Object.fromEntries(orderedEntries(obj).filter(([k]) => !['title', 'name'].includes(k)));
  renderFields(io, body, enabled, indent + 2);
  io.log('');
}
function taskCounts(obj) {
  const humanize = String(obj?.tool ?? obj?.task ?? '').toLowerCase() === 'humanize' || obj?.humanized !== undefined;
  const requested = Number(obj?.boosts_requested ?? obj?.boosts ?? obj?.quantity ?? obj?.requested ?? obj?.total);
  const delivered = Number(humanize ? obj?.humanized : (obj?.boosts_delivered ?? obj?.delivered));
  return {
    requested: Number.isFinite(requested) ? requested : null,
    delivered: Number.isFinite(delivered) ? delivered : null,
    noun: t(humanize ? 'task.humanized' : 'task.delivered'),
  };
}
function progressBar(done, total, enabled, width = 16) {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return '';
  const filled = Math.round(Math.max(0, Math.min(1, done / total)) * width);
  return paint(`${'█'.repeat(filled)}${'░'.repeat(width - filled)}`, [done >= total ? 'green' : 'cyan'], enabled);
}
function renderTaskStatus(io, obj, enabled) {
  const status = String(obj?.status ?? t('common.unknown')).toLowerCase();
  const { requested, delivered, noun } = taskCounts(obj);
  const progress = delivered !== null ? `${delivered}${requested !== null ? `/${requested}` : ''} ${noun}` : '';
  const bar = requested !== null && delivered !== null ? `  ${progressBar(delivered, requested, enabled)}` : '';
  const map = {
    running: ['⟳', 'task.running', 'cyan'], completed: ['✓', 'task.completed', 'green'], partial: ['!', 'task.partial', 'yellow'], failed: ['✗', 'task.failed', 'red'], cancelled: ['✗', 'task.cancelled', 'red'], canceled: ['✗', 'task.cancelled', 'red'],
  };
  const [icon, key, style] = map[status] ?? ['•', null, 'dim'];
  const label = key ? t(key) : status;
  logLine(io, icon, `${paint(label, ['bold', style], enabled)}${progress ? ` ${progress}` : ''}${bar}`, enabled);
  const extra = Object.fromEntries(Object.entries(obj).filter(([k]) => !['status', 'boosts_requested', 'boosts', 'quantity', 'requested', 'total', 'boosts_delivered', 'delivered', 'humanized'].includes(k)));
  if (Object.keys(extra).length) renderFields(io, extra, enabled);
}

export function printResult(value, { json = false, jsonl = false, compact = false, revealSecrets = false, noColor = false, title } = {}, io = console) {
  if (json || jsonl || compact) {
    io.log(JSON.stringify(value, null, (compact || jsonl) ? 0 : 2));
    return;
  }
  const enabled = colorEnabled(noColor, io);
  const safe = sanitize(value, { revealSecrets });
  const renderedTitle = title ?? t('common.result');
  banner(io, renderedTitle, enabled);
  if (safe && typeof safe === 'object' && !Array.isArray(safe) && typeof safe.status === 'string' && ['running', 'completed', 'partial', 'failed', 'cancelled', 'canceled'].includes(safe.status.toLowerCase())) {
    renderTaskStatus(io, safe, enabled);
    return;
  }
  if (Array.isArray(safe)) {
    logLine(io, '✓', `${renderedTitle} (${t('common.item_count', { count: safe.length })})`, enabled);
    safe.forEach((item, index) => {
      if (item && typeof item === 'object') renderCard(io, item, index + 1, enabled);
      else io.log(`           ${index + 1}. ${scalar(item)}`);
    });
    return;
  }
  if (safe && typeof safe === 'object') {
    logLine(io, safe.success === false ? '✗' : '✓', renderedTitle, enabled);
    renderFields(io, safe, enabled);
    return;
  }
  logLine(io, '✓', `${renderedTitle}: ${scalar(safe)}`, enabled);
}
