import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import process from 'node:process';
import { CLIError, DEFAULT_BASE_URL, Salta7Client } from './client.js';
import { printResult } from './output.js';
import { checkForUpdate } from './updater.js';

export const VERSION = '0.1.0';

function usage() {
  return `Salta7 CLI Node (${VERSION})\n\nUsage:\n  s7-node [global options] <command> [args]\n\nGlobal options:\n  --base-url URL\n  --token TOKEN\n  --timeout SECONDS\n  --retries N\n  --allow-insecure-http\n  --json\n  --compact\n  --reveal-secrets\n\nCommands:\n  prices\n  stock <product>\n  balance\n  buy <product> <amount> [--yes]\n  history\n  history-items <tx_id>\n  update --check\n  task quote\n  task products [--tool join|humanize]\n  task active\n  task status <job_id>\n  task history [--tool ...] [--limit N]\n  task items <job_id> [--byot]\n  task byot-quote --tokens-file FILE [--boosts-needed N] [--humanize]\n`;
}

function parseArgs(argv) {
  const global = {
    baseUrl: process.env.SALTA7_BASE_URL ?? DEFAULT_BASE_URL,
    token: process.env.SALTA7_TOKEN,
    timeoutMs: 30_000,
    retries: 3,
    allowInsecureHttp: false,
    json: false,
    compact: false,
    revealSecrets: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base-url') global.baseUrl = argv[++i];
    else if (arg === '--token') global.token = argv[++i];
    else if (arg === '--timeout') global.timeoutMs = Number(argv[++i]) * 1000;
    else if (arg === '--retries') global.retries = Number(argv[++i]);
    else if (arg === '--allow-insecure-http') global.allowInsecureHttp = true;
    else if (arg === '--json') global.json = true;
    else if (arg === '--compact') { global.compact = true; global.json = true; }
    else if (arg === '--reveal-secrets') global.revealSecrets = true;
    else rest.push(arg);
  }
  return { global, rest };
}

function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function loadTokens(path) {
  const text = await fs.readFile(path, 'utf8');
  const tokens = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (tokens.length === 0) throw new CLIError('Tokens file is empty.');
  if (tokens.length > 100) throw new CLIError('The API accepts at most 100 BYOT tokens per task.');
  return tokens;
}

export async function run(argv = process.argv.slice(2), io = console) {
  const { global, rest } = parseArgs(argv);
  if (rest.length === 0 || rest.includes('--help') || rest.includes('-h')) {
    io.log(usage());
    return 0;
  }
  if (rest.includes('--version')) {
    io.log(VERSION);
    return 0;
  }
  const client = new Salta7Client(global);
  const output = (value) => printResult(value, global);
  const [command, ...args] = rest;
  try {
    if (command === 'prices') output(await client.prices());
    else if (command === 'stock') output(await client.stock(args[0]));
    else if (command === 'balance') output(await client.balance());
    else if (command === 'history') output(await client.history());
    else if (command === 'history-items') output(await client.historyItems(args[0]));
    else if (command === 'buy') {
      const account = args[0];
      const amount = Number(args[1]);
      if (!account || !Number.isInteger(amount) || amount < 1 || amount > 10_000) throw new CLIError('buy requires a product and amount between 1 and 10000.');
      if (!args.includes('--yes')) throw new CLIError('Node CLI currently requires --yes for buy.');
      output(await client.buy(account, amount, crypto.randomUUID()));
    } else if (command === 'update') {
      output(await checkForUpdate(VERSION));
    } else if (command === 'task') {
      const [sub, ...subArgs] = args;
      if (sub === 'quote') output(await client.taskQuote());
      else if (sub === 'products') output(await client.taskProducts(optionValue(subArgs, '--tool')));
      else if (sub === 'active') output(await client.taskActive());
      else if (sub === 'status') output(await client.taskStatus(subArgs[0]));
      else if (sub === 'history') output(await client.taskHistory(optionValue(subArgs, '--tool'), Number(optionValue(subArgs, '--limit', 10))));
      else if (sub === 'items') output(await client.taskItems(subArgs[0], subArgs.includes('--byot')));
      else if (sub === 'byot-quote') {
        const file = optionValue(subArgs, '--tokens-file');
        if (!file) throw new CLIError('task byot-quote requires --tokens-file.');
        output(await client.taskByotQuote(await loadTokens(file), Number(optionValue(subArgs, '--boosts-needed', 0)), subArgs.includes('--humanize')));
      } else throw new CLIError(`Unknown task command: ${sub ?? ''}`);
    } else throw new CLIError(`Unknown command: ${command}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.error(`Error: ${message}`);
    return 1;
  }
}
