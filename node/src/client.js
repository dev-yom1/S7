import net from 'node:net';
import { t } from './i18n.js';

export const DEFAULT_BASE_URL = 'https://salta7-store.ngrok.app';
export const DEFAULT_TIMEOUT_MS = 30_000;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 10_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class CLIError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'CLIError';
    this.status = status;
    this.data = data;
  }
}

function isLoopback(hostname) {
  if (!hostname) return false;
  if (hostname.toLowerCase() === 'localhost') return true;
  if (net.isIP(hostname) === 4) return hostname.startsWith('127.');
  if (net.isIP(hostname) === 6) return hostname === '::1';
  return false;
}

export function validateBaseUrl(baseUrl, { allowInsecureHttp = false } = {}) {
  let parsed;
  try { parsed = new URL(baseUrl); } catch { throw new CLIError('Invalid API base URL.'); }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new CLIError('API base URL must not contain credentials, query parameters, or a fragment.');
  const normalized = parsed.toString().replace(/\/$/, '');
  if (parsed.protocol === 'https:') return normalized;
  if (parsed.protocol === 'http:') {
    if (allowInsecureHttp && isLoopback(parsed.hostname)) return normalized;
    if (allowInsecureHttp) throw new CLIError('Insecure HTTP is allowed only for localhost/loopback addresses.');
    throw new CLIError('HTTPS is required for the API base URL.');
  }
  throw new CLIError('Invalid API base URL.');
}

export function retryDelayMs(retryAfter, attempt, nowMs = Date.now()) {
  if (retryAfter !== null && retryAfter !== undefined && String(retryAfter).trim() !== '') {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, seconds * 1000));
    const dateMs = Date.parse(retryAfter);
    if (Number.isFinite(dateMs)) return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, dateMs - nowMs));
  }
  return Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** (attempt - 1));
}

export class Salta7Client {
  constructor({ baseUrl = DEFAULT_BASE_URL, token = process.env.SALTA7_TOKEN, timeoutMs = DEFAULT_TIMEOUT_MS, retries = 3, allowInsecureHttp = false, fetchImpl = globalThis.fetch, sleepImpl = sleep } = {}) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new CLIError(t('timeoutPositive'));
    if (!Number.isInteger(retries) || retries < 1) throw new CLIError(t('retriesPositive'));
    if (typeof fetchImpl !== 'function') throw new CLIError('This Node.js runtime does not provide fetch().');
    this.baseUrl = validateBaseUrl(baseUrl, { allowInsecureHttp });
    this.token = token; this.timeoutMs = timeoutMs; this.retries = retries; this.fetchImpl = fetchImpl; this.sleepImpl = sleepImpl;
  }

  headers(auth = false) {
    const headers = { 'user-agent': 'salta7-cli-node/0.3.3', accept: 'application/json' };
    if (auth) { if (!this.token) throw new CLIError(t('tokenRequired')); headers.authorization = `Bearer ${this.token}`; }
    return headers;
  }

  async request(method, path, { auth = false, query, body, retryable = method === 'GET' } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    const attempts = retryable ? this.retries : 1;
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, { method, headers: { ...this.headers(auth), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
        const text = await response.text();
        let payload = text;
        if (text) { try { payload = JSON.parse(text); } catch { /* keep text */ } } else payload = null;
        if (response.ok) return payload;
        if (attempt < attempts && RETRYABLE.has(response.status)) {
          await this.sleepImpl(retryDelayMs(response.headers.get('retry-after'), attempt));
          continue;
        }
        const detail = typeof payload === 'object' && payload ? (payload.detail ?? payload.error ?? JSON.stringify(payload)) : String(payload ?? '');
        throw new CLIError(`HTTP ${response.status}: ${detail}`, { status: response.status, data: payload });
      } catch (error) {
        if (error instanceof CLIError) throw error;
        lastError = error;
        if (attempt >= attempts) {
          const message = error?.name === 'AbortError' ? `Request timed out after ${this.timeoutMs}ms.` : `Network error: ${error?.message ?? error}`;
          throw new CLIError(message);
        }
        await this.sleepImpl(retryDelayMs(null, attempt));
      } finally { clearTimeout(timer); }
    }
    throw new CLIError(`Network error: ${lastError?.message ?? 'unknown error'}`);
  }

  prices() { return this.request('GET', '/prices'); }
  stock(account) { return this.request('GET', '/stock', { query: { account } }); }
  balance() { return this.request('GET', '/balance', { auth: true }); }
  history() { return this.request('GET', '/history', { auth: true }); }
  historyItems(txId) { return this.request('GET', '/history/items', { auth: true, query: { tx_id: txId } }); }
  buy(account, amount, clientTxId) { return this.request('POST', '/buy', { auth: true, query: { account, amount, client_tx_id: clientTxId }, retryable: true }); }
  taskQuote() { return this.request('GET', '/task/quote'); }
  taskProducts(tool) { return this.request('GET', '/task/products', { auth: true, query: tool ? { tool } : undefined }); }
  taskActive() { return this.request('GET', '/task/active', { auth: true }); }
  taskStatus(jobId) { return this.request('GET', '/task/status', { auth: true, query: { job_id: jobId } }); }
  taskHistory(tool, limit = 10) { return this.request('GET', '/task/history', { auth: true, query: { task: tool, limit } }); }
  taskItems(jobId, byot = false) { return this.request('GET', byot ? '/task/byot/items' : '/task/items', { auth: true, query: { job_id: jobId } }); }
  taskByotQuote(tokens, boostsNeeded = 0, humanize = false) { return this.request('POST', '/task/byot/quote', { auth: true, body: { tokens, boosts_needed: boostsNeeded, humanize }, retryable: false }); }
  taskCreate(payload) { return this.request('POST', '/task/create', { auth: true, body: payload, retryable: false }); }
}
