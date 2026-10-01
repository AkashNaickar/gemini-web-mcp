import readline from 'node:readline';
import { GeminiDriver } from './gemini-driver.js';
import { loadSession, saveSession } from './session.js';
import { openUrlInBrowser } from './open-url.js';
import { parsePromptArgs } from './args.js';

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Interactive REPL multi-turn chat session with warm browser context
 */
export async function runInteractiveChat(driver: GeminiDriver): Promise<void> {
  console.log('='.repeat(65));
  console.log('💬 Gemini Web - Interactive Multi-Turn Chat');
  console.log('='.repeat(65));
  console.log('• Type your message and press [ENTER]');
  console.log('• Type /link or /url to view the direct chat link');
  console.log('• Type /open to open the current chat in your web browser');
  console.log('• Type /new to start a new chat thread');
  console.log('• Type /exit to quit\n');

  const rl = createReadline();
  let currentChatUrl: string | undefined = loadSession().lastChatUrl;

  if (currentChatUrl) {
    console.log(`🔗 Resuming active chat: ${currentChatUrl}\n`);
  }

  const askQuestion = (): void => {
    rl.question('\n\x1b[36mYou >\x1b[0m ', async (userInput) => {
      const input = userInput.trim();

      if (!input) {
        askQuestion();
        return;
      }

      if (input.toLowerCase() === '/exit' || input.toLowerCase() === 'exit') {
        console.log('\nClosing chat session...');
        rl.close();
        await driver.close();
        process.exit(0);
      }

      if (input.toLowerCase() === '/link' || input.toLowerCase() === '/url') {
        if (currentChatUrl) {
          console.log(`\n🔗 Current Chat Link: \x1b[34m${currentChatUrl}\x1b[0m`);
        } else {
          console.log('\nℹ️ No active chat thread yet. Send a message first.');
        }
        askQuestion();
        return;
      }

      if (input.toLowerCase() === '/open') {
        if (currentChatUrl) {
          console.log(`\n🌐 Opening in browser: ${currentChatUrl}`);
          openUrlInBrowser(currentChatUrl);
        } else {
          console.log('\nℹ️ No active chat thread to open. Send a message first.');
        }
        askQuestion();
        return;
      }

      if (input.toLowerCase() === '/new' || input.toLowerCase() === 'new') {
        console.log('\n🔄 Starting a new chat thread...');
        currentChatUrl = undefined;
        saveSession({ lastChatUrl: undefined });
        await driver.startNewChat();
        console.log('Fresh conversation started.');
        askQuestion();
        return;
      }

      process.stdout.write('\n\x1b[33mGemini is thinking...\x1b[0m\r');
      const startTime = Date.now();

      try {
        const result = await driver.askGemini(input, {
          chatUrl: currentChatUrl,
          newChat: !currentChatUrl,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (result.success) {
          currentChatUrl = result.url;
          saveSession({ lastChatUrl: result.url });

          console.log(`\n\x1b[32mGemini (${elapsed}s):\x1b[0m`);
          console.log('-'.repeat(60));
          console.log(result.markdown);
          console.log('-'.repeat(60));
          console.log(`🔗 Chat Link: \x1b[34m${result.url}\x1b[0m`);
        } else {
          console.log(`\n\x1b[31mError:\x1b[0m ${result.error}`);
        }
      } catch (err) {
        console.error('\nError:', err);
      }

      askQuestion();
    });
  };

  askQuestion();
}

/**
 * Single-shot command line runner that maintains persistent conversation history
 */
export async function runSingleCommand(args: string[], driver: GeminiDriver): Promise<void> {
  const { link, open, isNewChat: isNewChatFlag, prompt } = parsePromptArgs(args);

  // Check for standalone link / open commands
  if (link) {
    const session = loadSession();
    if (session.lastChatUrl) {
      console.log(`\n🔗 Current Active Chat Link: ${session.lastChatUrl}\n`);
    } else {
      console.log('\nℹ️ No active chat thread found in session. Run a prompt first.\n');
    }
    process.exit(0);
  }

  if (open) {
    const session = loadSession();
    if (session.lastChatUrl) {
      console.log(`\n🌐 Opening in browser: ${session.lastChatUrl}\n`);
      openUrlInBrowser(session.lastChatUrl);
    } else {
      console.log('\nℹ️ No active chat thread found in session to open.\n');
    }
    process.exit(0);
  }

  console.log('='.repeat(65));
  console.log('🤖 Gemini Web Driver - CLI Test Runner');
  console.log('='.repeat(65));

  const session = loadSession();
  const chatUrl = isNewChatFlag ? undefined : session.lastChatUrl;

  if (isNewChatFlag) {
    console.log('Mode: Starting a NEW conversation thread');
  } else if (chatUrl) {
    console.log(`Mode: Continuing existing thread (${chatUrl})`);
  } else {
    console.log('Mode: Starting fresh conversation');
  }

  console.log(`Prompt: "${prompt}"\n`);
  console.log('Sending request to Gemini in background...');

  const startTime = Date.now();
  try {
    const result = await driver.askGemini(prompt, {
      newChat: isNewChatFlag || !chatUrl,
      chatUrl: isNewChatFlag ? undefined : chatUrl,
    });

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    if (result.success) {
      saveSession({ lastChatUrl: result.url });

      console.log(`\n✅ Response received in ${elapsedSeconds}s:\n`);
      console.log('-'.repeat(60));
      console.log(result.markdown);
      console.log('-'.repeat(60));
      console.log(`\n🔗 Chat Link: ${result.url}`);
      console.log('\n💡 Tip: Run `npm run link` or `npm run open` to view this conversation in your browser.');
    } else {
      console.error(`\n❌ Request failed: ${result.error}`);
      if (result.error?.includes('Not logged in')) {
        console.log('\n💡 Run `npm run login` to authenticate.');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    await driver.close();
    process.exit(0);
  }
}
