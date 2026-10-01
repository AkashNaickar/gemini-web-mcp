# Contributing to Gemini Web MCP

Thanks for your interest in contributing to **Gemini Web MCP**!

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). For security
problems, do **not** open a public issue — follow [SECURITY.md](SECURITY.md) instead.

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

1. Branch off `main` using a short, descriptive name (for example `fix/login-timeout` or `feat/streaming-events`).
2. Ensure TypeScript builds and type-checks with zero errors (`npm run build`, `npm run typecheck`).
3. Keep the test suite green (`npm test`) and add tests for new pure logic.
4. Avoid sending raw logging to `stdout` in server modules (use `console.error` for debug output to keep the MCP stdio JSON stream clean).
5. Keep selectors resilient and language-agnostic.
6. Never commit `.env` files, browser profiles, session files, or credentials. CI runs gitleaks and will fail on a detected secret.
7. Fill in the pull request template and submit with a descriptive title and a summary of the changes. CI must be green before merge.

## Commit messages

Write short, imperative commit subjects that explain the change, and match the existing
history style (for example `fix: handle missing chat container` or
`docs: clarify environment variables`). Group related changes into small, logical commits.

## Reporting bugs and requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE) so reports include the version, environment,
and reproduction steps. Redact cookies, tokens, and personal data from any logs you paste.
