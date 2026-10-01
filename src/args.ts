/**
 * Pure command-line argument parsing.
 *
 * Kept free of side effects (no process.exit, no I/O) so the CLI routing can be
 * unit-tested directly.
 */

export type CliCommand =
  | { kind: 'mcp' }
  | { kind: 'help' }
  | { kind: 'version' }
  | { kind: 'login' }
  | { kind: 'chat' }
  | { kind: 'link' }
  | { kind: 'open' }
  | { kind: 'status' }
  | { kind: 'ask'; args: string[] }
  | { kind: 'prompt'; args: string[] };

/**
 * Resolve the top-level command from raw argv (excluding node and script path).
 * Unknown arguments fall through to a direct one-shot prompt.
 */
export function parseCliArgs(argv: readonly string[]): CliCommand {
  const args = [...argv];
  const command = args[0]?.toLowerCase();

  if (!command || command === 'mcp' || command === '--stdio') {
    return { kind: 'mcp' };
  }
  if (command === 'help' || command === '--help' || command === '-h') {
    return { kind: 'help' };
  }
  if (command === '--version' || command === '-v' || command === 'version') {
    return { kind: 'version' };
  }
  if (command === 'login' || command === 'auth') {
    return { kind: 'login' };
  }
  if (command === 'chat' || command === 'interactive' || command === 'repl') {
    return { kind: 'chat' };
  }
  if (command === 'link' || command === 'url') {
    return { kind: 'link' };
  }
  if (command === 'open') {
    return { kind: 'open' };
  }
  if (command === 'status' || command === 'check') {
    return { kind: 'status' };
  }
  if (command === 'ask') {
    return { kind: 'ask', args: args.slice(1) };
  }

  return { kind: 'prompt', args };
}

export interface PromptArgs {
  /** Standalone `--link` / `-l` / `/link` / `/url` request. */
  link: boolean;
  /** Standalone `--open` / `/open` request. */
  open: boolean;
  /** Start a fresh conversation thread (`--new` / `-n`). */
  isNewChat: boolean;
  /** The remaining tokens joined into a single prompt string. */
  prompt: string;
}

/**
 * Parse the arguments passed to a one-shot `ask` / prompt invocation.
 */
export function parsePromptArgs(args: readonly string[]): PromptArgs {
  const link =
    args.includes('--link') ||
    args.includes('-l') ||
    args.includes('/link') ||
    args.includes('/url');

  const open = args.includes('--open') || args.includes('/open');

  const isNewChat = args.includes('--new') || args.includes('-n');

  const prompt = args
    .filter((arg) => arg !== '--new' && arg !== '-n')
    .join(' ');

  return { link, open, isNewChat, prompt };
}
