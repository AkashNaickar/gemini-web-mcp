import { chromium, type BrowserContext, type Page } from 'playwright';
import TurndownService from 'turndown';
import { config } from './config.js';

export interface GeminiResponse {
  markdown: string;
  url: string;
  success: boolean;
  error?: string;
}

export interface AskOptions {
  newChat?: boolean;
  chatUrl?: string;
  files?: string[];
  timeoutMs?: number;
}

export class GeminiDriver {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private turndown: TurndownService;
  private isProcessing = false;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Custom rule to preserve code blocks with languages
    this.turndown.addRule('fencedCodeBlocks', {
      filter: ['pre'],
      replacement: (_content, node) => {
        const element = node as HTMLElement;
        const codeElement = element.querySelector('code');
        const code = codeElement ? codeElement.textContent || '' : element.textContent || '';
        const langMatch =
          element.className.match(/language-(\w+)/) ||
          (codeElement && codeElement.className.match(/language-(\w+)/));
        const lang = langMatch ? langMatch[1] : '';
        return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
      },
    });
  }

  /**
   * Initializes persistent browser context with anti-detection flags
   */
  public async init(headless = config.headless): Promise<Page> {
    if (this.context && this.page && !this.page.isClosed()) {
      return this.page;
    }

    try {
      this.context = await chromium.launchPersistentContext(config.userDataDir, {
        headless,
        executablePath: config.executablePath,
        userAgent: config.userAgent,
        viewport: { width: 1280, height: 850 },
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-infobars',
          '--disable-dev-shm-usage',
        ],
      });

      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

      // Prevent webdriver flag detection
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      return this.page;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('ProcessSingleton') || msg.includes('profile is already in use')) {
        throw new Error(
          'Browser profile is currently locked by another active session (e.g. an open `gemini-web-mcp chat` terminal or MCP server). Please close the other session to proceed.'
        );
      }
      throw err;
    }
  }

  /**
   * Checks if user is currently logged in to Gemini
   */
  public async checkAuthStatus(
    options: { headless?: boolean; navigate?: boolean } = {}
  ): Promise<{ isLoggedIn: boolean; currentUrl: string }> {
    const headless = options.headless ?? true;
    const navigate = options.navigate ?? true;

    const page = await this.init(headless);

    if (navigate) {
      await page.goto(config.geminiUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.timeoutMs,
      });
      await page.waitForTimeout(1500);
    }

    const currentUrl = page.url();
    const isAccountsPage = currentUrl.includes('accounts.google.com');
    if (isAccountsPage) {
      return { isLoggedIn: false, currentUrl };
    }

    const hasInput = await this.findInputSelector(page);
    return {
      isLoggedIn: Boolean(hasInput),
      currentUrl,
    };
  }

  /**
   * Navigates to a fresh chat
   */
  public async startNewChat(): Promise<void> {
    const page = await this.init();
    await page.goto(config.geminiUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.timeoutMs,
    });
    await page.waitForTimeout(1000);
  }

  /**
   * Dispatches a prompt to Gemini and extracts the response in Markdown
   */
  public async askGemini(prompt: string, options: AskOptions = {}): Promise<GeminiResponse> {
    if (this.isProcessing) {
      throw new Error('Gemini driver is currently busy processing another request. Please wait.');
    }

    this.isProcessing = true;
    try {
      const page = await this.init();

      if (options.newChat) {
        await this.startNewChat();
      } else if (options.chatUrl) {
        const currentUrl = page.url();
        if (currentUrl !== options.chatUrl) {
          await page.goto(options.chatUrl, {
            waitUntil: 'domcontentloaded',
            timeout: config.timeoutMs,
          });
          await page.waitForTimeout(1200);
        }
      } else {
        const currentUrl = page.url();
        if (!currentUrl.includes('gemini.google.com')) {
          await page.goto(config.geminiUrl, {
            waitUntil: 'domcontentloaded',
            timeout: config.timeoutMs,
          });
          await page.waitForTimeout(1000);
        }
      }

      // Check for login requirement
      if (page.url().includes('accounts.google.com')) {
        return {
          success: false,
          markdown: '',
          url: page.url(),
          error: 'Not logged in. Please run `gemini-web-mcp login` to authenticate with your Google account.',
        };
      }

      // 1. Locate Input Box
      const inputSelector = await this.waitForInputSelector(
        page,
        options.timeoutMs || config.timeoutMs
      );
      if (!inputSelector) {
        return {
          success: false,
          markdown: '',
          url: page.url(),
          error: 'Could not locate Gemini chat input box on the page. You may need to authenticate.',
        };
      }

      // 2. Count existing response blocks before submitting
      const initialResponseCount = await page.$$eval(
        '.markdown, message-content, model-response, [data-test-id="model-turn"]',
        (els) => els.length
      );

      // 3. Handle File Attachments if provided
      if (options.files && options.files.length > 0) {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(options.files);
          await page.waitForTimeout(1500);
        }
      }

      // 4. Focus and insert prompt into input box
      const inputHandle = await page.$(inputSelector);
      if (!inputHandle) {
        throw new Error('Input box element not found.');
      }

      await inputHandle.click();
      await page.waitForTimeout(100);

      // Insert text
      await page.keyboard.insertText(prompt);
      await page.waitForTimeout(200);

      // 5. Submit prompt
      await this.submitPrompt(page);

      // 6. Wait for Response Generation & Streaming to Complete
      const markdown = await this.waitForResponseCompletion(
        page,
        initialResponseCount,
        options.timeoutMs || config.timeoutMs
      );

      // Brief delay for URL update
      await page.waitForTimeout(500);

      return {
        success: true,
        markdown,
        url: page.url(),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        markdown: '',
        url: this.page ? this.page.url() : '',
        error: errorMsg,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Closes browser context and frees resources
   */
  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
    }
  }

  // --- Private Helper Methods ---

  private async findInputSelector(page: Page): Promise<string | null> {
    const candidateSelectors = [
      'div.ql-editor[role="textbox"]',
      'div[contenteditable="true"][role="textbox"]',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"]',
      'div[aria-label*="prompt" i]',
      'div[aria-label*="ask" i]',
      'textarea',
      'rich-textarea',
    ];

    for (const selector of candidateSelectors) {
      const el = await page.$(selector);
      if (el) {
        return selector;
      }
    }
    return null;
  }

  private async waitForInputSelector(page: Page, timeout: number): Promise<string | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const selector = await this.findInputSelector(page);
      if (selector) return selector;
      await page.waitForTimeout(300);
    }
    return null;
  }

  private async submitPrompt(page: Page): Promise<void> {
    const sendButtonSelectors = [
      'button[data-test-id="send-button"]',
      'button.send-button',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Envoyer" i]',
      'button[aria-label*="Senden" i]',
      'button[aria-label*="Enviar" i]',
      'button[aria-label*="送信" i]',
      'button[aria-label*="发送" i]',
    ];

    for (const selector of sendButtonSelectors) {
      const btn = await page.$(selector);
      if (btn && (await btn.isVisible()) && (await btn.isEnabled())) {
        await btn.click();
        return;
      }
    }

    // Fallback: press Enter on keyboard
    await page.keyboard.press('Enter');
  }

  private async waitForResponseCompletion(
    page: Page,
    initialCount: number,
    timeout: number
  ): Promise<string> {
    const startTime = Date.now();

    // Allow submission request to register in DOM
    await page.waitForTimeout(1000);

    let lastExtractedHtml = '';
    let lastExtractedText = '';
    let stableChecks = 0;

    while (Date.now() - startTime < timeout) {
      const status = await page.evaluate((initCount) => {
        // 1. Check if an active Stop button is VISIBLE (multi-lingual)
        const stopButtons = Array.from(
          document.querySelectorAll(
            'button.stop-generating-button, button[aria-label*="Stop" i], button[aria-label*="Pause" i], button[aria-label*="Stopp" i], button[aria-label*="Arrêter" i], button[aria-label*="Detener" i], button[aria-label*="停止" i]'
          )
        );
        const isStopVisible = stopButtons.some((b) => {
          const el = b as HTMLElement;
          const s = window.getComputedStyle(el);
          return (
            s.display !== 'none' &&
            s.visibility !== 'hidden' &&
            s.opacity !== '0' &&
            el.offsetWidth > 0
          );
        });

        // 2. Find all model response nodes
        const responseNodes = Array.from(
          document.querySelectorAll(
            '.markdown, message-content, model-response, [data-test-id="model-turn"], .model-response-text'
          )
        );

        const currentTurnCount = responseNodes.length;
        let latestHtml = '';
        let latestText = '';

        if (responseNodes.length > 0) {
          const last = responseNodes[responseNodes.length - 1];
          const clone = last.cloneNode(true) as HTMLElement;
          clone
            .querySelectorAll('button, mat-icon, .action-buttons, .response-actions')
            .forEach((n) => n.remove());
          latestHtml = clone.innerHTML.trim();
          latestText = (clone.textContent || '').trim();
        }

        // 3. Check if response action buttons (Copy / Good response / Share) are visible
        const actionButtons = Array.from(
          document.querySelectorAll(
            'button[aria-label*="Copy" i], button[aria-label*="Copier" i], button[aria-label*="Kopieren" i], button[aria-label*="Good response" i], button[aria-label*="Share" i]'
          )
        );
        const hasVisibleActionBar = actionButtons.some((b) => {
          const el = b as HTMLElement;
          const s = window.getComputedStyle(el);
          return (
            s.display !== 'none' &&
            s.visibility !== 'hidden' &&
            s.opacity !== '0' &&
            el.offsetWidth > 0
          );
        });

        return {
          isStopVisible,
          hasVisibleActionBar,
          currentTurnCount,
          isNewTurnPresent: currentTurnCount > initCount,
          latestHtml,
          latestText,
        };
      }, initialCount);

      // Verify we have non-empty response content
      if (status.latestText.length > 0) {
        lastExtractedHtml = status.latestHtml;

        if (status.latestText === lastExtractedText) {
          stableChecks++;

          const isComplete =
            (!status.isStopVisible && status.hasVisibleActionBar) ||
            (!status.isStopVisible && stableChecks >= 2);

          if (isComplete) {
            return this.turndown.turndown(lastExtractedHtml);
          }
        } else {
          stableChecks = 0;
          lastExtractedText = status.latestText;
        }
      }

      await page.waitForTimeout(400);
    }

    if (lastExtractedHtml) {
      return this.turndown.turndown(lastExtractedHtml);
    }

    throw new Error(`Timed out waiting for Gemini response (${timeout}ms).`);
  }
}
