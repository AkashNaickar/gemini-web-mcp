import { chromium } from 'playwright';
import { config } from './config.js';
import fs from 'node:fs';

async function diagnose() {
  console.log('Launching browser with profile...');
  const context = await chromium.launchPersistentContext(config.userDataDir, {
    headless: true,
    executablePath: config.executablePath,
    userAgent: config.userAgent,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  const page = context.pages()[0] || (await context.newPage());
  console.log('Navigating to ' + config.geminiUrl);
  await page.goto(config.geminiUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('Current URL:', page.url());
  const title = await page.title();
  console.log('Page Title:', title);

  // Take screenshot
  const screenshotBuffer = await page.screenshot({ path: 'scratch_gemini_view.png' });
  console.log('Screenshot saved to scratch_gemini_view.png');

  // Dump all interactive elements and textareas
  const info = await page.evaluate(() => {
    const editables = Array.from(document.querySelectorAll('[contenteditable="true"], textarea, rich-textarea, input')).map(el => ({
      tag: el.tagName,
      className: el.className,
      id: el.id,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      placeholder: el.getAttribute('placeholder') || el.getAttribute('data-placeholder'),
    }));

    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText?.trim()?.slice(0, 30),
      ariaLabel: b.getAttribute('aria-label'),
      className: b.className,
      testId: b.getAttribute('data-test-id'),
    }));

    return { editables, buttons: buttons.slice(0, 20) };
  });

  console.log('Editables:', JSON.stringify(info.editables, null, 2));
  console.log('Buttons:', JSON.stringify(info.buttons, null, 2));

  await context.close();
}

diagnose().catch(console.error);
