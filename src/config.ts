import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  findSystemBrowser,
  resolveGeminiUrl,
  resolveHeadless,
  resolveTimeoutMs,
  resolveUserDataDir,
  type EnvLike,
} from './config-helpers.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export interface AppConfig {
  userDataDir: string;
  sessionDir: string;
  headless: boolean;
  timeoutMs: number;
  geminiUrl: string;
  executablePath?: string;
  userAgent?: string;
}

const env = process.env as EnvLike;

const resolvedUserDataDir = resolveUserDataDir({
  env,
  cwd: process.cwd(),
  homeDir: os.homedir(),
  projectRoot: PROJECT_ROOT,
  exists: fs.existsSync,
});

export const config: AppConfig = {
  userDataDir: resolvedUserDataDir,
  sessionDir: path.dirname(resolvedUserDataDir),
  headless: resolveHeadless(env),
  timeoutMs: resolveTimeoutMs(env),
  geminiUrl: resolveGeminiUrl(env),
  executablePath: findSystemBrowser({
    env,
    platform: os.platform(),
    exists: fs.existsSync,
  }),
  userAgent: env.USER_AGENT || undefined,
};
