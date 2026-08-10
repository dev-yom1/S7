import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const execFileAsync = promisify(execFile);
export const PACKAGE = 'salta7-cli-node';
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE}/latest`;
const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)$/;
export const UPDATE_TIMEOUT_MS = 10_000;

export function parseVersion(version) {
  const match = String(version).trim().match(VERSION_RE);
  return match ? match.slice(1).map(Number) : null;
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

export async function checkForUpdate(currentVersion, fetchImpl = globalThis.fetch, timeoutMs = UPDATE_TIMEOUT_MS) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Update check timeout must be greater than 0.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(REGISTRY_URL, {
      headers: { accept: 'application/json', 'user-agent': 'salta7-cli-node' },
      signal: controller.signal,
    });
    if (response.status === 404) {
      return { releaseFound: false, updateAvailable: false, currentVersion, source: 'npm' };
    }
    if (!response.ok) throw new Error(`npm update check failed: HTTP ${response.status}`);
    const metadata = await response.json();
    const latestVersion = String(metadata?.version ?? '').trim();
    if (!parseVersion(latestVersion)) throw new Error('npm latest version is not a stable semantic version.');
    return {
      releaseFound: true,
      updateAvailable: isNewerVersion(currentVersion, latestVersion),
      currentVersion,
      latestVersion,
      tagName: latestVersion,
      source: 'npm',
    };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`npm update check timed out after ${timeoutMs}ms.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function installUpdate(versionValue, { execFileImpl = execFileAsync } = {}) {
  const parsed = parseVersion(versionValue);
  if (!parsed) throw new Error('Refusing to install an invalid npm version.');
  const version = parsed.join('.');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await execFileImpl(npm, ['install', '--global', `${PACKAGE}@${version}`], { shell: false });
  return { version, package: PACKAGE, source: 'npm' };
}
