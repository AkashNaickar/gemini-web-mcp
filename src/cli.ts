#!/usr/bin/env node
import { runInteractiveChat, runSingleCommand, openUrlInBrowser } from './test-cli.js';
import { runLogin } from './login.js';
import { GeminiDriver } from './gemini-driver.js';
import { loadSession } from './session.js';
import { startMcpServer } from './mcp-server.js';

const VERSION = '1.0.0';

function printHelp(): void {
  console.log(`
🌐 Gemini Web MCP (v${VERSION})
Bridge any AI agent or terminal to gemini.google.com using your personal Google account.

USAGE:
  gemini-web-mcp [command] [options]

COMMANDS:
  (no args)             Start MCP Server over stdio (for AI Agents / Claude / Antigravity)
  login                 Launch interactive Google account login & save session
  chat                  Start real-time multi-turn terminal chat REPL
  ask "<prompt>"        Ask Gemini a question from terminal (maintains conversation memory)
  ask --new "<prompt>"  Start a fresh conversation thread
  link                  Display current active conversation web link
  open                  Open current conversation in your default web browser
  status                Check if local Google session is authenticated
  help, --help, -h      Show this help message
  --version, -v         Show version

EXAMPLES:
  $ gemini-web-mcp login
  $ gemini-web-mcp ask "What are 3 tips for learning TypeScript?"
  $ gemini-web-mcp chat
  $ gemini-web-mcp open

MCP AGENT CONFIG (e.g. Claude Desktop / Antigravity):
  {
    "mcpServers": {
      "gemini-web": {
        "command": "gemini-web-mcp"
      }
    }
  }
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  // 1. If called without args or with mcp flag in a non-TTY/piped environment, run MCP server
  if (!command || command === 'mcp' || command === '--stdio') {
    // If standard input is not a TTY or no command given, launch MCP server
    await startMcpServer();
    return;
  }

  // 2. CLI Helper Commands
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(`gemini-web-mcp v${VERSION}`);
    process.exit(0);
  }

  if (command === 'login' || command === 'auth') {
    await runLogin();
    return;
  }

  if (command === 'chat' || command === 'interactive' || command === 'repl') {
    const driver = new GeminiDriver();
    await runInteractiveChat(driver);
    return;
  }

  if (command === 'link' || command === 'url') {
    const session = loadSession();
    if (session.lastChatUrl) {
      console.log(`\n🔗 Current Active Chat Link: ${session.lastChatUrl}\n`);
    } else {
      console.log('\nℹ️ No active chat thread found. Run a prompt first.\n');
    }
    process.exit(0);
  }

  if (command === 'open') {
    const session = loadSession();
    if (session.lastChatUrl) {
      console.log(`\n🌐 Opening in browser: ${session.lastChatUrl}\n`);
      openUrlInBrowser(session.lastChatUrl);
    } else {
      console.log('\nℹ️ No active chat thread found to open.\n');
    }
    process.exit(0);
  }

  if (command === 'status' || command === 'check') {
    const driver = new GeminiDriver();
    console.log('Checking Google session status on gemini.google.com...');
    const status = await driver.checkAuthStatus({ headless: true, navigate: true });
    await driver.close();

    if (status.isLoggedIn) {
      console.log('\n✅ Authenticated: Session is active and ready.');
    } else {
      console.log('\n❌ Unauthenticated: Please run `gemini-web-mcp login` to sign in.');
    }
    process.exit(0);
  }

  if (command === 'ask') {
    const promptArgs = args.slice(1);
    if (promptArgs.length === 0) {
      console.error('Error: Please provide a prompt. Example: gemini-web-mcp ask "Hello"');
      process.exit(1);
    }
    const driver = new GeminiDriver();
    await runSingleCommand(promptArgs, driver);
    return;
  }

  // Fallback: treat unknown args as a direct prompt
  const driver = new GeminiDriver();
  await runSingleCommand(args, driver);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
