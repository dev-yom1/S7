import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import process from 'node:process';
import { CLIError, DEFAULT_BASE_URL, Salta7Client } from './client.js';
import { buildHumanizeConfig } from './humanize.js';
import { setLanguage, t } from './i18n.js';
import { printResult } from './output.js';
import { checkForUpdate } from './updater.js';

export const VERSION = '0.2.0';
const TERMINAL = new Set(['completed', 'partial', 'failed', 'cancelled', 'canceled']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function languageFromArgv(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--lang=')) return argv[i].slice(7);
    if (argv[i] === '--lang' && argv[i + 1]) return argv[i + 1];
  }
  return 'auto';
}

function usage() {
  return `Salta7 CLI Node (${VERSION}) — ${t('description')}\n\n${t('usage')}:\n  s7-node [global options] <command> [args]\n\n${t('globalOptions')}:\n  --lang auto|en|ja|ko|hi\n  --base-url URL\n  --token TOKEN\n  --timeout SECONDS\n  --retries N\n  --allow-insecure-http\n  --json | --jsonl | --compact\n  --reveal-secrets\n\n${t('commands')}:\n  prices\n  stock <product>\n  balance\n  buy <product> <amount> [--yes]\n  history\n  history-items <tx_id>\n  update --check\n  task quote\n  task products [--tool join|humanize]\n  task active\n  task status <job_id> [--watch] [--interval SECONDS]\n  task history [--tool boost|join|humanize] [--limit N]\n  task items <job_id> [--byot]\n  task byot-quote --tokens-file FILE [--boosts-needed N] [--humanize]\n  task boost --mode stock|byot --invite INVITE [options]\n  task join --mode stock|byot --invite INVITE [options]\n  task humanize --mode stock|byot [options]\n\nHumanize options:\n  --random-all --random-avatar --avatar-url URL --avatar-file FILE\n  --banner-file FILE --banner-data DATA_URL\n  --random-name --name TEXT --random-bio --bio TEXT\n  --random-pronouns --pronouns TEXT --random-hypesquad --hypesquad VALUE\n  --humanize-json JSON_OR_@FILE\n`;
}

function takeValue(argv, index, name) {
  const arg = argv[index];
  if (arg.startsWith(`${name}=`)) return [arg.slice(name.length + 1), index];
  if (arg === name) {
    if (argv[index + 1] === undefined) throw new CLIError(`${name} requires a value.`);
    return [argv[index + 1], index + 1];
  }
  return undefined;
}

function parseArgs(argv) {
  const global = {
    baseUrl: process.env.SALTA7_BASE_URL ?? DEFAULT_BASE_URL,
    token: process.env.SALTA7_TOKEN,
    timeoutMs: 30_000,
    retries: 3,
    allowInsecureHttp: false,
    json: false,
    jsonl: false,
    compact: false,
    revealSecrets: false,
    lang: languageFromArgv(argv),
  };
  const rest = [];
  const valueOptions = new Map([
    ['--base-url', (v) => { global.baseUrl = v; }],
    ['--token', (v) => { global.token = v; }],
    ['--timeout', (v) => { global.timeoutMs = Number(v) * 1000; }],
    ['--retries', (v) => { global.retries = Number(v); }],
    ['--lang', (v) => { global.lang = v; }],
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    let handled = false;
    for (const [name, setter] of valueOptions) {
      const found = takeValue(argv, i, name);
      if (found) { setter(found[0]); i = found[1]; handled = true; break; }
    }
    if (handled) continue;
    if (arg === '--allow-insecure-http') global.allowInsecureHttp = true;
    else if (arg === '--json') global.json = true;
    else if (arg === '--jsonl') global.jsonl = true;
    else if (arg === '--compact') { global.compact = true; global.json = true; }
    else if (arg === '--reveal-secrets') global.revealSecrets = true;
    else rest.push(arg);
  }
  return { global, rest };
}

function parseCommandOptions(args) {
  const options = {};
  const positional = [];
  const boolean = new Set([
    '--yes', '-y', '--byot', '--humanize', '--watch', '--wait', '--random-all', '--random-avatar', '--random-name', '--random-bio', '--random-pronouns', '--random-hypesquad',
  ]);
  const valueNames = new Set([
    '--tool', '--limit', '--tokens-file', '--boosts-needed', '--mode', '--invite', '--boosts', '--product', '--quantity', '--interval', '--client-tx-id',
    '--avatar-url', '--avatar-file', '--banner-file', '--banner-data', '--name', '--bio', '--pronouns', '--hypesquad', '--humanize-json',
  ]);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (boolean.has(arg)) { options[arg.replace(/^-+/, '')] = true; continue; }
    const eq = arg.indexOf('=');
    const name = eq >= 0 ? arg.slice(0, eq) : arg;
    if (valueNames.has(name)) {
      const value = eq >= 0 ? arg.slice(eq + 1) : args[++i];
      if (value === undefined) throw new CLIError(`${name} requires a value.`);
      options[name.slice(2)] = value;
    } else positional.push(arg);
  }
  return { options, positional };
}

function integer(value, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : Number.NaN;
}

async function loadTokens(file) {
  if (!file) throw new CLIError(t('tokensFileRequired'));
  let text;
  try { text = await fs.readFile(file, 'utf8'); }
  catch { throw new CLIError(t('readFile', { path: file })); }
  const tokens = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (tokens.length === 0) throw new CLIError(t('tokensEmpty'));
  if (tokens.length > 100) throw new CLIError(t('tokensMax'));
  return tokens;
}

function humanizeValues(options) {
  return {
    randomAll: options['random-all'], randomAvatar: options['random-avatar'], avatarUrl: options['avatar-url'], avatarFile: options['avatar-file'],
    bannerFile: options['banner-file'], bannerData: options['banner-data'], randomName: options['random-name'], name: options.name,
    randomBio: options['random-bio'], bio: options.bio, randomPronouns: options['random-pronouns'], pronouns: options.pronouns,
    randomHypesquad: options['random-hypesquad'], hypesquad: options.hypesquad, humanizeJson: options['humanize-json'],
  };
}

async function waitForJob(client, jobId, intervalSeconds, output) {
  if (!jobId) throw new CLIError(t('jobIdRequired'));
  if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) throw new CLIError(t('intervalPositive'));
  let last = '';
  while (true) {
    const job = await client.taskStatus(jobId);
    const signature = JSON.stringify([job?.status, job?.boosts_delivered, job?.delivered, job?.humanized, job?.failed_count, job?.error, job?.message, job?.reason]);
    const status = String(job?.status ?? '').toLowerCase();
    if (signature !== last || TERMINAL.has(status)) output(job);
    last = signature;
    if (TERMINAL.has(status)) return job;
    await sleep(intervalSeconds * 1000);
  }
}

async function maybeWait(client, result, options, output) {
  output(result);
  if (!options.wait) return;
  if (!result || typeof result !== 'object' || !result.job_id) throw new CLIError(t('noJobId'));
  if (!TERMINAL.has(String(result.status ?? '').toLowerCase())) await waitForJob(client, String(result.job_id), Number(options.interval ?? 10), output);
}

export async function run(argv = process.argv.slice(2), io = console) {
  setLanguage(languageFromArgv(argv));
  let parsed;
  try { parsed = parseArgs(argv); }
  catch (error) { io.error(`${t('error')}: ${error.message}`); return 1; }
  const { global, rest } = parsed;
  setLanguage(global.lang);
  if (rest.length === 0 || rest.includes('--help') || rest.includes('-h')) { io.log(usage()); return 0; }
  if (rest.includes('--version')) { io.log(VERSION); return 0; }

  try {
    const client = new Salta7Client(global);
    const output = (value) => printResult(value, global);
    const [command, ...args] = rest;
    if (command === 'prices') output(await client.prices());
    else if (command === 'stock') {
      if (!args[0]) throw new CLIError('stock requires a product.');
      output(await client.stock(args[0]));
    } else if (command === 'balance') output(await client.balance());
    else if (command === 'history') output(await client.history());
    else if (command === 'history-items') {
      if (!args[0]) throw new CLIError('history-items requires tx_id.');
      output(await client.historyItems(args[0]));
    } else if (command === 'buy') {
      const { options, positional } = parseCommandOptions(args);
      const account = positional[0];
      const amount = Number(positional[1]);
      if (!account || !Number.isInteger(amount) || amount < 1 || amount > 10_000) throw new CLIError(t('amountInvalid'));
      if (!options.yes && !options.y) throw new CLIError(t('purchaseYes'));
      output(await client.buy(account, amount, options['client-tx-id'] ?? crypto.randomUUID()));
    } else if (command === 'update') output(await checkForUpdate(VERSION));
    else if (command === 'task') {
      const [sub, ...subArgs] = args;
      const { options, positional } = parseCommandOptions(subArgs);
      if (sub === 'quote') output(await client.taskQuote());
      else if (sub === 'products') output(await client.taskProducts(options.tool));
      else if (sub === 'active') output(await client.taskActive());
      else if (sub === 'status') {
        const jobId = positional[0];
        if (!jobId) throw new CLIError(t('jobIdRequired'));
        if (options.watch) await waitForJob(client, jobId, Number(options.interval ?? 10), output);
        else output(await client.taskStatus(jobId));
      } else if (sub === 'history') {
        const limit = integer(options.limit, 10);
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new CLIError('limit must be between 1 and 100.');
        output(await client.taskHistory(options.tool, limit));
      } else if (sub === 'items') {
        if (!positional[0]) throw new CLIError(t('jobIdRequired'));
        output(await client.taskItems(positional[0], Boolean(options.byot)));
      } else if (sub === 'byot-quote') {
        const boostsNeeded = integer(options['boosts-needed'], 0);
        if (!Number.isInteger(boostsNeeded) || boostsNeeded < 0) throw new CLIError(t('boostsNegative'));
        output(await client.taskByotQuote(await loadTokens(options['tokens-file']), boostsNeeded, Boolean(options.humanize)));
      } else if (sub === 'boost') {
        const mode = options.mode ?? 'stock';
        if (!['stock', 'byot'].includes(mode) || !options.invite) throw new CLIError('boost requires --mode stock|byot and --invite.');
        const payload = { tool: 'boost', mode, invite: options.invite };
        if (mode === 'stock') {
          const boosts = integer(options.boosts);
          if (!Number.isInteger(boosts) || boosts < 1 || boosts > 40) throw new CLIError(t('boostStock'));
          payload.boosts = boosts;
        } else {
          payload.tokens = await loadTokens(options['tokens-file']);
          const boostsNeeded = integer(options['boosts-needed'], 0);
          if (!Number.isInteger(boostsNeeded) || boostsNeeded < 0) throw new CLIError(t('boostsNegative'));
          payload.boosts_needed = boostsNeeded;
        }
        const humanize = await buildHumanizeConfig(humanizeValues(options));
        if (humanize) payload.humanize = humanize;
        await maybeWait(client, await client.taskCreate(payload), options, output);
      } else if (sub === 'join') {
        const mode = options.mode ?? 'stock';
        if (!['stock', 'byot'].includes(mode) || !options.invite) throw new CLIError('join requires --mode stock|byot and --invite.');
        const payload = { tool: 'join', mode, invite: options.invite };
        if (mode === 'stock') {
          const quantity = integer(options.quantity);
          if (!options.product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new CLIError(t('joinStock'));
          Object.assign(payload, { product: options.product, quantity });
        } else payload.tokens = await loadTokens(options['tokens-file']);
        const humanize = await buildHumanizeConfig(humanizeValues(options));
        if (humanize) payload.humanize = humanize;
        await maybeWait(client, await client.taskCreate(payload), options, output);
      } else if (sub === 'humanize') {
        const mode = options.mode ?? 'stock';
        if (!['stock', 'byot'].includes(mode)) throw new CLIError('humanize requires --mode stock|byot.');
        const payload = { tool: 'humanize', mode, humanize: await buildHumanizeConfig(humanizeValues(options), { required: true }) };
        if (mode === 'stock') {
          const quantity = integer(options.quantity);
          if (!options.product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new CLIError(t('humanizeStock'));
          Object.assign(payload, { product: options.product, quantity });
        } else payload.tokens = await loadTokens(options['tokens-file']);
        await maybeWait(client, await client.taskCreate(payload), options, output);
      } else throw new CLIError(t('unknownTask', { command: sub ?? '' }));
    } else throw new CLIError(t('unknownCommand', { command }));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.error(`${t('error')}: ${message}`);
    return 1;
  }
}
