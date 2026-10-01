#!/usr/bin/env node
import { runInteractiveChat, runSingleCommand } from './test-cli.js';
import { runLogin } from './login.js';
import { GeminiDriver } from './gemini-driver.js';
import { loadSession } from './session.js';
import { startMcpServer } from './mcp-server.js';
import { openUrlInBrowser } from './open-url.js';
import { parseCliArgs } from './args.js';
import { VERSION } from './version.js';

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
  const command = parseCliArgs(process.argv.slice(2));

  switch (command.kind) {
    case 'mcp':
      await startMcpServer();
      return;

    case 'help':
      printHelp();
      process.exit(0);
      break;

    case 'version':
      console.log(`gemini-web-mcp v${VERSION}`);
      process.exit(0);
      break;

    case 'login':
      await runLogin();
      return;

    case 'chat': {
      const driver = new GeminiDriver();
      await runInteractiveChat(driver);
      return;
    }

    case 'link': {
      const session = loadSession();
      if (session.lastChatUrl) {
        console.log(`\n🔗 Current Active Chat Link: ${session.lastChatUrl}\n`);
      } else {
        console.log('\nℹ️ No active chat thread found. Run a prompt first.\n');
      }
      process.exit(0);
      break;
    }

    case 'open': {
      const session = loadSession();
      if (session.lastChatUrl) {
        console.log(`\n🌐 Opening in browser: ${session.lastChatUrl}\n`);
        openUrlInBrowser(session.lastChatUrl);
      } else {
        console.log('\nℹ️ No active chat thread found to open.\n');
      }
      process.exit(0);
      break;
    }

    case 'status': {
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
      break;
    }

    case 'ask': {
      if (command.args.length === 0) {
        console.error('Error: Please provide a prompt. Example: gemini-web-mcp ask "Hello"');
        process.exit(1);
      }
      const driver = new GeminiDriver();
      await runSingleCommand(command.args, driver);
      return;
    }

    case 'prompt': {
      // Fallback: treat unknown args as a direct prompt.
      const driver = new GeminiDriver();
      await runSingleCommand(command.args, driver);
      return;
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
