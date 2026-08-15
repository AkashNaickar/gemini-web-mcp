import readline from 'node:readline';
import { GeminiDriver } from './gemini-driver.js';
import { config } from './config.js';

async function promptEnter(question: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, () => {
      rl.close();
      resolve();
    });
  });
}

export async function runLogin(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🤖 Gemini Web MCP - Google Account Authentication Setup');
  console.log('='.repeat(60));
  console.log(`\nLocal Profile Directory: ${config.userDataDir}\n`);
  console.log('1. Launching visible browser window...');

  const driver = new GeminiDriver();
  const page = await driver.init(false); // Launch in visible/headed mode

  console.log('2. Opening https://gemini.google.com/app ...');
  await page.goto(config.geminiUrl, { waitUntil: 'domcontentloaded' });

  console.log('\n------------------------------------------------------------');
  console.log('👉 ACTION REQUIRED:');
  console.log('   1. In the opened browser window, sign in to your Google account.');
  console.log('   2. Complete 2FA / verification if prompted.');
  console.log('   3. Make sure you can see the Gemini chat interface.');
  console.log('   4. Return to this terminal and press [ENTER] below.');
  console.log('------------------------------------------------------------\n');

  await promptEnter('Press [ENTER] in this terminal once you have finished signing in: ');

  console.log('\nValidating session...');
  await page.waitForTimeout(1500);

  // Check auth status on current page without forcing navigation
  const status = await driver.checkAuthStatus({ headless: false, navigate: false });

  if (status.isLoggedIn) {
    console.log('\n✅ Authentication successful! Session cookies saved to profile directory.');
    console.log('You can now run `gemini-web-mcp chat` or start the MCP server.');
  } else {
    console.log(`\nCurrent URL: ${status.currentUrl}`);
    console.log('⚠️ Could not verify Gemini chat screen.');
    console.log('If your login is still in progress, you can run `gemini-web-mcp login` again.');
  }

  console.log('\nClosing browser...');
  await driver.close();
}
