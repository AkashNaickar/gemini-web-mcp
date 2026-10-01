import path from 'node:path';

/**
 * Pure configuration resolution helpers.
 *
 * All environment/filesystem access is injected so the logic can be unit-tested
 * without touching the real machine.
 */

export type EnvLike = Record<string, string | undefined>;

export interface UserDataDirOptions {
  env: EnvLike;
  cwd: string;
  homeDir: string;
  projectRoot: string;
  exists: (candidate: string) => boolean;
}

/**
 * Resolves the universal profile / data directory across Windows, macOS, Linux.
 */
export function resolveUserDataDir(options: UserDataDirOptions): string {
  const { env, cwd, homeDir, projectRoot, exists } = options;

  if (env.USER_DATA_DIR) {
    return path.resolve(cwd, env.USER_DATA_DIR);
  }

  // Local project profile takes priority for backwards compatibility.
  const localProjectDir = path.resolve(projectRoot, '.user-data-dir');
  if (exists(localProjectDir)) {
    return localProjectDir;
  }

  return path.join(homeDir, '.gemini-web-mcp', 'profile');
}

export interface BrowserDiscoveryOptions {
  env: EnvLike;
  platform: string;
  exists: (candidate: string) => boolean;
}

/**
 * Cross-platform browser auto-discovery (Windows, macOS, Linux).
 * Returns undefined so Playwright can fall back to its bundled Chromium.
 */
export function findSystemBrowser(
  options: BrowserDiscoveryOptions
): string | undefined {
  const { env, platform, exists } = options;

  if (env.CHROME_EXECUTABLE_PATH && exists(env.CHROME_EXECUTABLE_PATH)) {
    return env.CHROME_EXECUTABLE_PATH;
  }

  const candidatePaths: string[] = [];

  if (platform === 'win32') {
    const localAppData = env.LOCALAPPDATA || '';
    const programFiles = env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    candidatePaths.push(
      path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(programFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(programFilesX86, 'Microsoft\\Edge\\Application\\msedge.exe')
    );
  } else if (platform === 'darwin') {
    candidatePaths.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  } else if (platform === 'linux') {
    candidatePaths.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    );
  }

  for (const candidate of candidatePaths) {
    if (exists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function resolveHeadless(env: EnvLike): boolean {
  return env.HEADLESS !== 'false';
}

export function resolveTimeoutMs(env: EnvLike): number {
  const parsed = Number.parseInt(env.TIMEOUT_MS || '60000', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;
}

export function resolveGeminiUrl(env: EnvLike): string {
  return env.GEMINI_BASE_URL || 'https://gemini.google.com/app';
}
