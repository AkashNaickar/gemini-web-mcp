# Security Policy

## Supported versions

Security fixes are applied to the latest published release on npm
([`gemini-website-mcp`](https://www.npmjs.com/package/gemini-website-mcp)) and to the
`main` branch. Older pre-1.0 snapshots are not supported.

## Reporting a vulnerability

Please report suspected vulnerabilities **privately** using GitHub's
[private vulnerability reporting](https://github.com/AkashNaickar/gemini-web-mcp/security/advisories/new).
Do not open a public issue for a security problem, and never include live credentials,
cookies, or session files in a report.

Helpful details:

- Affected version (`gemini-web-mcp --version` or the npm version).
- A description of the impact and the component involved (CLI, stdio MCP server,
  Playwright driver, or local session storage).
- Reproduction steps or a minimal proof of concept.
- Whether the issue is already public.

We aim to acknowledge reports within a few days and will keep you updated on the fix and
any coordinated disclosure. This is a volunteer-maintained project, so timelines are best
effort.

## Scope and handling of local data

`gemini-web-mcp` drives a local Chromium profile with Playwright and stores authentication
cookies and conversation history **on your machine** (default `~/.gemini-web-mcp/`). It does
not transmit those files to any third party operated by this project.

Reports we are especially interested in:

- Leakage of session cookies or credentials outside the local profile directory.
- Command injection or unsafe file handling in the CLI/MCP tools (for example
  `gemini_upload_and_analyze`).
- Injection or output pollution that breaks the MCP stdio JSON-RPC stream.
- Supply-chain concerns in the build or release pipeline.

## Handling secrets in contributions

Never commit `.env` files, browser profiles, session files, or API keys. The repository runs
[gitleaks](.github/workflows/gitleaks.yml) on every push and pull request; a detected secret
fails CI. If you believe a credential was committed, do not open a public issue — use the
private advisory link above.
