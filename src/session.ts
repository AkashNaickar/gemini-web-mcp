import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

export interface SessionData {
  lastChatUrl?: string;
  updatedAt?: string;
}

function getSessionFilePath(): string {
  const targetDir = config.sessionDir || path.dirname(config.userDataDir);
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch {
      // Ignore directory creation errors
    }
  }
  return path.join(targetDir, 'session.json');
}

export function loadSession(): SessionData {
  try {
    const sessionFile = getSessionFilePath();
    if (fs.existsSync(sessionFile)) {
      return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    }
  } catch {
    // Ignore read errors
  }
  return {};
}

export function saveSession(data: SessionData): void {
  try {
    const sessionFile = getSessionFilePath();
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch {
    // Ignore write errors
  }
}
