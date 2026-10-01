import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { VERSION } from '../src/version.js';

interface Manifest {
  version: string;
}

test('VERSION matches the version declared in package.json', () => {
  const manifestUrl = new URL('../package.json', import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(manifestUrl, 'utf-8')) as Manifest;
  assert.equal(VERSION, manifest.version);
});

test('VERSION looks like a semantic version', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+/);
});
