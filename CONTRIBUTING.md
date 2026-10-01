# Contributing to Gemini Web MCP

Thanks for your interest in contributing to **Gemini Web MCP**!

---

## Development setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AkashNaickar/gemini-web-mcp.git
   cd gemini-web-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Authenticate your Google account:**
   ```bash
   npm run login
   ```

4. **Run the interactive development chat:**
   ```bash
   npm run chat
   ```

5. **Build and type-check TypeScript:**
   ```bash
   npm run build
   npm run typecheck
   ```

---

## Testing

Run the unit test suite:
```bash
npm test
```

Send individual queries from the terminal:
```bash
npm run test:prompt -- "What is the speed of light?"
```

Check the MCP server stdio handshake:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npm start
```

---

## Pull request guidelines

1. Ensure TypeScript builds and type-checks with zero errors (`npm run build`, `npm run typecheck`).
2. Keep the test suite green (`npm test`) and add tests for new pure logic.
3. Avoid sending raw logging to `stdout` in server modules (use `console.error` for debug output to keep the MCP stdio JSON stream clean).
4. Keep selectors resilient and language-agnostic.
5. Submit your pull request with a descriptive title and a summary of the changes.
