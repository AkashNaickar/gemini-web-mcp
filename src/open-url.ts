import { spawn } from 'node:child_process';

/**
 * Only http(s) URLs are ever handed to the operating system. This blocks
 * `file:`, `javascript:` and other schemes from being opened by external
 * processes.
 */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export interface OpenCommand {
  file: string;
  args: string[];
}

/**
 * Resolve the platform-specific command used to open a URL in the user's
 * default browser. Pure function for testability.
 */
export function resolveOpenCommand(
  platform: NodeJS.Platform | string,
  url: string
): OpenCommand {
  if (platform === 'win32') {
    // `start` is a cmd.exe builtin; the empty string is the window title.
    return { file: 'cmd', args: ['/c', 'start', '', url] };
  }
  if (platform === 'darwin') {
    return { file: 'open', args: [url] };
  }
  return { file: 'xdg-open', args: [url] };
}

/**
 * Open a URL in the default browser without going through a shell, so a hostile
 * URL can never be interpreted as shell syntax. Returns false for unsafe URLs.
 */
export function openUrlInBrowser(url: string): boolean {
  if (!isSafeHttpUrl(url)) {
    return false;
  }

  const { file, args } = resolveOpenCommand(process.platform, url);
  // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process -- no shell is involved and the URL is validated as http(s) above, then passed as a discrete argv element.
  const child = spawn(file, args, { detached: true, stdio: 'ignore' });
  child.unref();
  return true;
}
