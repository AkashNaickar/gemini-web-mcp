import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'node:path';
import fs from 'node:fs';
import { GeminiDriver } from './gemini-driver.js';
import { loadSession } from './session.js';
import { VERSION } from './version.js';

export async function startMcpServer(): Promise<void> {
  const driver = new GeminiDriver();

  const cleanup = async () => {
    await driver.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const server = new Server(
    {
      name: 'gemini-web-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const TOOLS: Tool[] = [
    {
      name: 'ask_gemini_web',
      description:
        'Send a query to the Gemini web interface (gemini.google.com) and return the response in clean Markdown. Uses your active Google session with access to web search grounding, code execution, and Gemini capabilities.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt or question to send to Gemini.',
          },
          new_chat: {
            type: 'boolean',
            description:
              'Whether to start a fresh chat conversation thread. Defaults to false (continues current thread).',
            default: false,
          },
          timeout_seconds: {
            type: 'number',
            description:
              'Maximum time to wait for Gemini to finish generating (in seconds). Defaults to 60.',
            default: 60,
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_upload_and_analyze',
      description:
        'Upload a local image or document file to gemini.google.com and ask Gemini to analyze it.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The instruction or question about the uploaded file.',
          },
          file_path: {
            type: 'string',
            description:
              'Absolute or relative path to the file to upload (image, PDF, document, etc.).',
          },
          new_chat: {
            type: 'boolean',
            description: 'Whether to start in a fresh conversation. Defaults to true.',
            default: true,
          },
        },
        required: ['prompt', 'file_path'],
      },
    },
    {
      name: 'get_current_chat_url',
      description:
        'Retrieve the direct URL/link to the current active Gemini web conversation thread.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'check_gemini_session_status',
      description:
        'Verify whether the local browser profile has an active authenticated session on gemini.google.com.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'ask_gemini_web') {
        const prompt = String(args?.prompt || '');
        const newChat = Boolean(args?.new_chat);
        const timeoutSeconds = Number(args?.timeout_seconds) || 60;

        if (!prompt.trim()) {
          return {
            content: [{ type: 'text', text: 'Error: Prompt parameter cannot be empty.' }],
            isError: true,
          };
        }

        const result = await driver.askGemini(prompt, {
          newChat,
          timeoutMs: timeoutSeconds * 1000,
        });

        if (!result.success) {
          return {
            content: [{ type: 'text', text: `Gemini Web Error: ${result.error}` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `${result.markdown}\n\n---\n*Chat URL:* ${result.url}`,
            },
          ],
        };
      }

      if (name === 'gemini_upload_and_analyze') {
        const prompt = String(args?.prompt || '');
        const filePath = String(args?.file_path || '');
        const newChat = args?.new_chat !== false;

        const resolvedPath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(resolvedPath)) {
          return {
            content: [{ type: 'text', text: `Error: File not found at path: ${resolvedPath}` }],
            isError: true,
          };
        }

        const result = await driver.askGemini(prompt, {
          newChat,
          files: [resolvedPath],
        });

        if (!result.success) {
          return {
            content: [{ type: 'text', text: `Gemini Web Upload Error: ${result.error}` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `${result.markdown}\n\n---\n*Chat URL:* ${result.url}`,
            },
          ],
        };
      }

      if (name === 'get_current_chat_url') {
        const session = loadSession();
        return {
          content: [
            {
              type: 'text',
              text: session.lastChatUrl || 'No active chat thread found.',
            },
          ],
        };
      }

      if (name === 'check_gemini_session_status') {
        const status = await driver.checkAuthStatus({ headless: true, navigate: true });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  authenticated: status.isLoggedIn,
                  url: status.currentUrl,
                  statusMessage: status.isLoggedIn
                    ? 'Session is authenticated and ready to receive prompts.'
                    : 'Session is unauthenticated. Run `gemini-web-mcp login` to sign in.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Execution failed: ${errorMsg}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gemini Web MCP Server running on stdio transport.');
}
