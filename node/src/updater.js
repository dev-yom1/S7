import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const execFileAsync = promisify(execFile);
const REPO = 'dev-yom1/S7';
const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(version) {
  const match = String(version).trim().match(VERSION_RE);
  if (!match) return null;
  return match.slice(1).map(Number);
}

export function isNewerVersion(current, latest) {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) {
    if (b[i] !== a[i]) return b[i] > a[i];
  }
  return false;
}

export async function checkForUpdate(currentVersion, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'salta7-cli-node' },
  });
  if (response.status === 404) return { releaseFound: false, updateAvailable: false, currentVersion };
  if (!response.ok) throw new Error(`GitHub update check failed: HTTP ${response.status}`);
  const release = await response.json();
  const tagName = String(release.tag_name ?? '');
  const parsed = parseVersion(tagName);
  if (!parsed) throw new Error('Latest GitHub release tag is not a stable semantic version.');
  const latestVersion = parsed.join('.');
  return { releaseFound: true, updateAvailable: isNewerVersion(currentVersion, latestVersion), currentVersion, latestVersion, tagName };
}

export async function installUpdate(tagName) {
  if (!parseVersion(tagName)) throw new Error('Refusing to install an invalid release tag.');
  const source = `https://github.com/${REPO}/archive/refs/tags/${tagName.startsWith('v') ? tagName : `v${tagName}`}.tar.gz`;
  await execFileAsync(process.execPath, [process.env.npm_execpath ?? ''], { timeout: 1000 }).catch(() => {});
  return { source, note: 'Node package publication is not configured yet; install from the release archive after the Node package is published.' };
}
