import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  findSystemBrowser,
  resolveGeminiUrl,
  resolveHeadless,
  resolveTimeoutMs,
  resolveUserDataDir,
} from '../src/config-helpers.js';

test('resolveUserDataDir honours an explicit USER_DATA_DIR', () => {
  const result = resolveUserDataDir({
    env: { USER_DATA_DIR: './my-profile' },
    cwd: '/work',
    homeDir: '/home/user',
    projectRoot: '/work/repo',
    exists: () => false,
  });
  assert.equal(result, path.resolve('/work', './my-profile'));
});

test('resolveUserDataDir prefers an existing local project profile', () => {
  const projectRoot = '/work/repo';
  const localDir = path.resolve(projectRoot, '.user-data-dir');
  const result = resolveUserDataDir({
    env: {},
    cwd: projectRoot,
    homeDir: '/home/user',
    projectRoot,
    exists: (candidate) => candidate === localDir,
  });
  assert.equal(result, localDir);
});

test('resolveUserDataDir falls back to the global home profile', () => {
  const result = resolveUserDataDir({
    env: {},
    cwd: '/work/repo',
    homeDir: '/home/user',
    projectRoot: '/work/repo',
    exists: () => false,
  });
  assert.equal(result, path.join('/home/user', '.gemini-web-mcp', 'profile'));
});

test('findSystemBrowser honours CHROME_EXECUTABLE_PATH when it exists', () => {
  const custom = '/opt/browsers/chrome';
  const result = findSystemBrowser({
    env: { CHROME_EXECUTABLE_PATH: custom },
    platform: 'linux',
    exists: (candidate) => candidate === custom,
  });
  assert.equal(result, custom);
});

test('findSystemBrowser ignores CHROME_EXECUTABLE_PATH when missing', () => {
  const result = findSystemBrowser({
    env: { CHROME_EXECUTABLE_PATH: '/opt/missing/chrome' },
    platform: 'linux',
    exists: () => false,
  });
  assert.equal(result, undefined);
});

test('findSystemBrowser discovers a Linux Chromium binary', () => {
  const result = findSystemBrowser({
    env: {},
    platform: 'linux',
    exists: (candidate) => candidate === '/usr/bin/chromium',
  });
  assert.equal(result, '/usr/bin/chromium');
});

test('findSystemBrowser discovers macOS Chrome', () => {
  const expected = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const result = findSystemBrowser({
    env: {},
    platform: 'darwin',
    exists: (candidate) => candidate === expected,
  });
  assert.equal(result, expected);
});

test('findSystemBrowser discovers Windows Chrome from Program Files', () => {
  const programFiles = 'C:\\Program Files';
  const expected = path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe');
  const result = findSystemBrowser({
    env: { ProgramFiles: programFiles },
    platform: 'win32',
    exists: (candidate) => candidate === expected,
  });
  assert.equal(result, expected);
});

test('findSystemBrowser returns undefined on an unknown platform', () => {
  const result = findSystemBrowser({
    env: {},
    platform: 'aix',
    exists: () => true,
  });
  assert.equal(result, undefined);
});

test('resolveHeadless defaults to true and only false disables it', () => {
  assert.equal(resolveHeadless({}), true);
  assert.equal(resolveHeadless({ HEADLESS: 'true' }), true);
  assert.equal(resolveHeadless({ HEADLESS: 'false' }), false);
});

test('resolveTimeoutMs parses a valid value and falls back on garbage', () => {
  assert.equal(resolveTimeoutMs({}), 60000);
  assert.equal(resolveTimeoutMs({ TIMEOUT_MS: '120000' }), 120000);
  assert.equal(resolveTimeoutMs({ TIMEOUT_MS: 'not-a-number' }), 60000);
  assert.equal(resolveTimeoutMs({ TIMEOUT_MS: '0' }), 60000);
});

test('resolveGeminiUrl uses the default and allows an override', () => {
  assert.equal(resolveGeminiUrl({}), 'https://gemini.google.com/app');
  assert.equal(
    resolveGeminiUrl({ GEMINI_BASE_URL: 'https://example.test/app' }),
    'https://example.test/app'
  );
});
