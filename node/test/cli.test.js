import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { run } from '../src/cli.js';

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}
function close(server) { return new Promise((resolve) => server.close(resolve)); }

test('Japanese help is available', async () => {
  const lines = [];
  const code = await run(['--lang', 'ja', '--help'], { log: (v) => lines.push(v), error: (v) => lines.push(v) });
  assert.equal(code, 0);
  assert.match(lines.join('\n'), /使い方/);
});

test('task boost creates Python-compatible payload with Humanize', async () => {
  let body;
  let authorization;
  const server = http.createServer((req, res) => {
    authorization = req.headers.authorization;
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      body = JSON.parse(raw);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ job_id: 'job-1', status: 'queued' }));
    });
  });
  const port = await listen(server);
  try {
    const code = await run([
      '--base-url', `http://127.0.0.1:${port}`, '--allow-insecure-http', '--token', 'secret', '--json',
      'task', 'boost', '--mode', 'stock', '--invite', 'abc', '--boosts', '4', '--random-name', '--hypesquad', 'brilliance',
    ]);
    assert.equal(code, 0);
    assert.equal(authorization, 'Bearer secret');
    assert.deepEqual(body, {
      tool: 'boost', mode: 'stock', invite: 'abc', boosts: 4,
      humanize: { name: { source: 'random' }, hypesquad: { source: 'custom', value: '2' } },
    });
  } finally { await close(server); }
});

test('BYOT join sends token list and optional Humanize config', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 's7-node-'));
  const tokenFile = join(dir, 'tokens.txt');
  await writeFile(tokenFile, 'token-one\ntoken-two\n', 'utf8');
  let body;
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => { body = JSON.parse(raw); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"job_id":"job-2","status":"queued"}'); });
  });
  const port = await listen(server);
  try {
    const code = await run([
      '--base-url', `http://127.0.0.1:${port}`, '--allow-insecure-http', '--token', 'secret', '--json',
      'task', 'join', '--mode', 'byot', '--invite', 'abc', '--tokens-file', tokenFile, '--random-bio',
    ]);
    assert.equal(code, 0);
    assert.deepEqual(body.tokens, ['token-one', 'token-two']);
    assert.deepEqual(body.humanize.bio, { source: 'random' });
    assert.equal(body.tool, 'join');
    assert.equal(body.mode, 'byot');
  } finally { await close(server); await rm(dir, { recursive: true, force: true }); }
});

test('Hindi and Korean help localize headings', async () => {
  for (const [lang, expected] of [['hi', 'उपयोग'], ['ko', '사용법']]) {
    const lines = [];
    const code = await run(['--lang', lang, '--help'], { log: (v) => lines.push(v), error: (v) => lines.push(v) });
    assert.equal(code, 0);
    assert.match(lines.join('\n'), new RegExp(expected));
  }
});
