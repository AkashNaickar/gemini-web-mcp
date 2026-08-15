# Contributing to Gemini Web MCP

Thank you for your interest in contributing to **Gemini Web MCP**! 🚀

---

## 🛠️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gemini-web-mcp.git
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

4. **Run interactive development chat:**
   ```bash
   npm run chat
   ```

5. **Build TypeScript:**
   ```bash
   npm run build
   ```

---

## 🧪 Testing

Test individual queries from terminal:
```bash
npm run test:prompt -- "What is the speed of light?"
```

Check MCP Server stdio handshake:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npm start
```

---

## 📜 Pull Request Guidelines

1. Ensure code is formatted and TypeScript builds with `npm run build` (0 errors).
2. Avoid sending raw logging statements to `stdout` in server modules (use `console.error` for debug output to keep the MCP stdio JSON stream clean).
3. Keep selectors resilient and language-agnostic.
4. Submit your pull request with a descriptive title and summary of changes.
