# gemini-website-mcp

Use your actual Google Gemini web session inside AI coding agents and your terminal.

```
   ___ ___ __  __ ___ _  _ ___   __      _____ ___   __  __  ___ ___ 
  / __| __|  \/  |_ _| \| |_ _|  \ \    / / __| _ ) |  \/  |/ __| _ \
 | (_ | _|| |\/| || || .` || |    \ \/\/ /| _|| _ \ | |\/| | (__|  _/
  \___|___|_|  |_|___|_|\_|___|    \_/\_/ |___|___/ |_|  |_|\___|_|  
```

[![npm version](https://img.shields.io/npm/v/gemini-website-mcp.svg?color=cb3837)](https://www.npmjs.com/package/gemini-website-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Most Gemini API wrappers require credit cards, paid API keys, or deal with restricted model tiers that strip out web grounding, Canvas, code execution, and Workspace integrations.

`gemini-website-mcp` bridges your AI coding assistants (Claude Desktop, Cursor, Antigravity, Windsurf) directly to the real `gemini.google.com` interface using your existing Google account.

---

## What it does

- **Direct Web Access**: Lets your coding agent leverage live Google Search grounding, Python code runners, and document upload features available on the web UI.
- **Zero API Key Hassle**: Authenticate once in a real browser window. Your session cookies stay on your local disk.
- **Thread Memory**: Keeps conversation context across multiple turns automatically.
- **Works via npx**: No need to clone the repo or build binaries.
- **Built on open MCP standards**: Connects to any Model Context Protocol client over standard IO.

---

## 30-Second Quickstart

### 1. Log in once
Open a terminal and run:

```bash
npx -y gemini-website-mcp login
```

A Chrome window pops up. Sign into your Google account (including 2FA if you have it enabled). Once you see the Gemini chat box, switch back to the terminal and press `Enter`. Your session is saved locally in `~/.gemini-web-mcp/`.

### 2. Chat from your terminal
Try asking a question right away:

```bash
npx -y gemini-website-mcp chat
```

Or shoot a one-off prompt:

```bash
npx -y gemini-website-mcp ask "Find the latest benchmarks for DeepSeek R1 and summarize them"
```

---

## Hooking into AI Coding Agents

Add the server to your agent's MCP config file.

### Antigravity (`~/.gemini/config/mcp_config.json`)
```json
{
  "mcpServers": {
    "gemini-web": {
      "command": "gemini-website-mcp"
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-web": {
      "command": "npx",
      "args": ["-y", "gemini-website-mcp"]
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "gemini-web": {
      "command": "npx",
      "args": ["-y", "gemini-website-mcp"]
    }
  }
}
```

---

## CLI Commands

| Command | Description |
| :--- | :--- |
| `gemini-website-mcp login` | Opens browser for one-time Google login |
| `gemini-website-mcp chat` | Starts real-time multi-turn terminal chat REPL |
| `gemini-website-mcp ask "<prompt>"` | Asks a question, continuing the last conversation |
| `gemini-website-mcp ask --new "<prompt>"` | Starts a fresh conversation thread |
| `gemini-website-mcp link` | Prints the web link for the active thread |
| `gemini-website-mcp open` | Opens the current thread in your default browser |
| `gemini-website-mcp status` | Verifies your session auth status |

---

## Available MCP Tools

When your agent connects to the MCP server, it gets access to these tools:

1. `ask_gemini_web`: Sends a prompt to Gemini web, waits for response streaming, and returns clean Markdown.
   - `prompt` (string, required): The prompt text.
   - `new_chat` (boolean, optional): Set to `true` to force a new thread.
   - `timeout_seconds` (number, optional): Max wait time (default: 60).

2. `gemini_upload_and_analyze`: Uploads a local file or image to Gemini web for multimodal review.
   - `prompt` (string, required): Instructions for analyzing the file.
   - `file_path` (string, required): Path to the image or document.

3. `get_current_chat_url`: Returns the direct URL to the conversation on `gemini.google.com`.

4. `check_gemini_session_status`: Checks if your local Google login is active.

---

## How It Works

1. **Persistent Browser Session**: Playwright spins up a background browser instance pointing to a persistent user profile directory (`~/.gemini-web-mcp/profile`).
2. **Stealth Flags**: Runs with anti-automation flags and proper user-agent headers so Google does not flag headless sessions.
3. **DOM Stream Observer**: Watches the response container and detects when the stop/streaming indicators disappear, instantly converting the rendered HTML into GitHub-flavored Markdown via Turndown.
4. **Zero Cloud Leaks**: Your login cookies and conversation history never leave your own machine.

---

## Environment Configuration

Optional overrides via environment variables or a local `.env` file:

```ini
# Path to store cookies and profile data (default: ~/.gemini-web-mcp/profile)
USER_DATA_DIR=~/.gemini-web-mcp/profile

# Show the browser window while executing (true/false, default: true)
HEADLESS=true

# Request timeout in milliseconds (default: 60000)
TIMEOUT_MS=60000

# Optional custom Chrome or Chromium binary path
CHROME_EXECUTABLE_PATH=
```

---

## Local Development

```bash
git clone https://github.com/akashnaickar/gemini-website-mcp.git
cd gemini-web-mcp
npm install
npx playwright install chromium
npm run build
npm link
```

---

## License

MIT (c) 2026 Akash Naickar
