import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Resolves the universal profile / data directory across Windows, macOS, and Linux
 */
function resolveUserDataDir(): string {
  if (process.env.USER_DATA_DIR) {
    return path.resolve(process.cwd(), process.env.USER_DATA_DIR);
  }

  // Use cross-platform user home directory storage for universal global persistence
  const homeDir = os.homedir();
  const globalProfileDir = path.join(homeDir, '.gemini-web-mcp', 'profile');

  // If local project directory has an existing profile, prioritize it for backwards compatibility
  const localProjectDir = path.resolve(PROJECT_ROOT, '.user-data-dir');
  if (fs.existsSync(localProjectDir)) {
    return localProjectDir;
  }

  return globalProfileDir;
}

/**
 * Cross-platform browser auto-discovery (Windows, macOS, Linux)
 */
function findSystemBrowser(): string | undefined {
  if (process.env.CHROME_EXECUTABLE_PATH && fs.existsSync(process.env.CHROME_EXECUTABLE_PATH)) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }

  const platform = os.platform();
  const candidatePaths: string[] = [];

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

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
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Graceful fallback: return undefined so Playwright uses its installed Chromium binary
  return undefined;
}

export interface AppConfig {
  userDataDir: string;
  sessionDir: string;
  headless: boolean;
  timeoutMs: number;
  geminiUrl: string;
  executablePath?: string;
  userAgent?: string;
}

const resolvedUserDataDir = resolveUserDataDir();

export const config: AppConfig = {
  userDataDir: resolvedUserDataDir,
  sessionDir: path.dirname(resolvedUserDataDir),
  headless: process.env.HEADLESS !== 'false',
  timeoutMs: parseInt(process.env.TIMEOUT_MS || '60000', 10),
  geminiUrl: process.env.GEMINI_BASE_URL || 'https://gemini.google.com/app',
  executablePath: findSystemBrowser(),
  userAgent: process.env.USER_AGENT || undefined,
};
