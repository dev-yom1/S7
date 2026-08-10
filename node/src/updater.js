const REPO = 'dev-yom1/S7';
const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;
export const UPDATE_TIMEOUT_MS = 10_000;

export function parseVersion(version) {
  const match = String(version).trim().match(VERSION_RE);
  return match ? match.slice(1).map(Number) : null;
}

export function isNewerVersion(current, latest) {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i += 1) if (b[i] !== a[i]) return b[i] > a[i];
  return false;
}

export async function checkForUpdate(currentVersion, fetchImpl = globalThis.fetch, timeoutMs = UPDATE_TIMEOUT_MS) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Update check timeout must be greater than 0.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'salta7-cli-node' },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`GitHub update check timed out after ${timeoutMs}ms.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
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
  return { tagName, note: 'Automatic installation is not enabled until the Node package is published.' };
}
