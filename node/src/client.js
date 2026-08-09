import net from 'node:net';

export const DEFAULT_BASE_URL = 'https://salta7-store.ngrok.app';
export const DEFAULT_TIMEOUT_MS = 30_000;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export class CLIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CLIError';
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
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new CLIError('Invalid API base URL.');
  }
  if (parsed.protocol === 'https:') return parsed.toString().replace(/\/$/, '');
  if (parsed.protocol === 'http:') {
    if (allowInsecureHttp && isLoopback(parsed.hostname)) {
      return parsed.toString().replace(/\/$/, '');
    }
    if (allowInsecureHttp) throw new CLIError('Insecure HTTP is allowed only for localhost/loopback addresses.');
    throw new CLIError('HTTPS is required for the API base URL.');
  }
  throw new CLIError('Invalid API base URL.');
}

export class Salta7Client {
  constructor({
    baseUrl = DEFAULT_BASE_URL,
    token = process.env.SALTA7_TOKEN,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 3,
    allowInsecureHttp = false,
    fetchImpl = globalThis.fetch,
  } = {}) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new CLIError('timeout must be greater than 0.');
    if (!Number.isInteger(retries) || retries < 1) throw new CLIError('retries must be at least 1.');
    if (typeof fetchImpl !== 'function') throw new CLIError('This Node.js runtime does not provide fetch().');
    this.baseUrl = validateBaseUrl(baseUrl, { allowInsecureHttp });
    this.token = token;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.fetchImpl = fetchImpl;
  }

  headers(auth = false) {
    const headers = { 'user-agent': 'salta7-cli-node/0.1.0', accept: 'application/json' };
    if (auth) {
      if (!this.token) throw new CLIError('This command requires an API token. Set SALTA7_TOKEN or pass --token.');
      headers.authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, path, { auth = false, query, body, retryable = method === 'GET' } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const attempts = retryable ? this.retries : 1;
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers: {
            ...this.headers(auth),
            ...(body ? { 'content-type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        const text = await response.text();
        let payload = text;
        if (text) {
          try { payload = JSON.parse(text); } catch { /* keep text */ }
        } else {
          payload = null;
        }
        if (response.ok) return payload;
        if (attempt < attempts && RETRYABLE.has(response.status)) {
          const retryAfter = Number(response.headers.get('retry-after'));
          const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : Math.min(10_000, 1000 * 2 ** (attempt - 1));
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        const detail = typeof payload === 'object' && payload ? (payload.detail ?? payload.error ?? JSON.stringify(payload)) : String(payload ?? '');
        throw new CLIError(`HTTP ${response.status}: ${detail}`);
      } catch (error) {
        if (error instanceof CLIError) throw error;
        lastError = error;
        if (attempt >= attempts) {
          const message = error?.name === 'AbortError' ? `Request timed out after ${this.timeoutMs}ms.` : `Network error: ${error?.message ?? error}`;
          throw new CLIError(message);
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw new CLIError(`Network error: ${lastError?.message ?? 'unknown error'}`);
  }

  prices() { return this.request('GET', '/prices'); }
  stock(account) { return this.request('GET', '/stock', { query: { account } }); }
  balance() { return this.request('GET', '/balance', { auth: true }); }
  history() { return this.request('GET', '/history', { auth: true }); }
  historyItems(txId) { return this.request('GET', '/history/items', { auth: true, query: { tx_id: txId } }); }
  buy(account, amount, clientTxId) {
    return this.request('POST', '/buy', { auth: true, query: { account, amount, client_tx_id: clientTxId }, retryable: true });
  }
  taskQuote() { return this.request('GET', '/task/quote'); }
  taskProducts(tool) { return this.request('GET', '/task/products', { auth: true, query: tool ? { tool } : undefined }); }
  taskActive() { return this.request('GET', '/task/active', { auth: true }); }
  taskStatus(jobId) { return this.request('GET', '/task/status', { auth: true, query: { job_id: jobId } }); }
  taskHistory(tool, limit = 10) { return this.request('GET', '/task/history', { auth: true, query: { tool, limit } }); }
  taskItems(jobId, byot = false) { return this.request('GET', byot ? '/task/byot/items' : '/task/items', { auth: true, query: { job_id: jobId } }); }
  taskByotQuote(tokens, boostsNeeded = 0, humanize = false) {
    return this.request('POST', '/task/byot/quote', { auth: true, body: { tokens, boosts_needed: boostsNeeded, humanize }, retryable: false });
  }
  taskCreate(payload) { return this.request('POST', '/task/create', { auth: true, body: payload, retryable: false }); }
}
