import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface PackageManifest {
  version: string;
}

/**
 * Single source of truth for the package version: the value in package.json.
 * Reading it at runtime keeps the CLI `--version`, the MCP server handshake and
 * the published manifest from drifting apart.
 */
const pkg = require('../package.json') as PackageManifest;

export const VERSION: string = pkg.version;
