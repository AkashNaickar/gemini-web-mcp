import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHttpUrl, resolveOpenCommand } from '../src/open-url.js';

test('isSafeHttpUrl accepts http and https URLs', () => {
  assert.equal(isSafeHttpUrl('https://gemini.google.com/app'), true);
  assert.equal(isSafeHttpUrl('http://localhost:3000/thread/abc'), true);
});

test('isSafeHttpUrl rejects non-http schemes and malformed input', () => {
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<h1>x</h1>'), false);
  assert.equal(isSafeHttpUrl('not a url'), false);
  assert.equal(isSafeHttpUrl(''), false);
});

test('resolveOpenCommand builds the Windows command', () => {
  assert.deepEqual(resolveOpenCommand('win32', 'https://example.test'), {
    file: 'cmd',
    args: ['/c', 'start', '', 'https://example.test'],
  });
});

test('resolveOpenCommand builds the macOS command', () => {
  assert.deepEqual(resolveOpenCommand('darwin', 'https://example.test'), {
    file: 'open',
    args: ['https://example.test'],
  });
});

test('resolveOpenCommand builds the Linux command', () => {
  assert.deepEqual(resolveOpenCommand('linux', 'https://example.test'), {
    file: 'xdg-open',
    args: ['https://example.test'],
  });
});
