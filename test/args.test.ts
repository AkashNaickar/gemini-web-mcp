import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCliArgs, parsePromptArgs } from '../src/args.js';

test('parseCliArgs treats a missing command as the MCP server', () => {
  assert.deepEqual(parseCliArgs([]), { kind: 'mcp' });
  assert.deepEqual(parseCliArgs(['mcp']), { kind: 'mcp' });
  assert.deepEqual(parseCliArgs(['--stdio']), { kind: 'mcp' });
});

test('parseCliArgs treats an empty first argument as the MCP server', () => {
  assert.deepEqual(parseCliArgs(['']), { kind: 'mcp' });
});

test('parseCliArgs recognises help aliases', () => {
  for (const alias of ['help', '--help', '-h', 'HELP']) {
    assert.deepEqual(parseCliArgs([alias]), { kind: 'help' });
  }
});

test('parseCliArgs recognises version aliases', () => {
  for (const alias of ['version', '--version', '-v']) {
    assert.deepEqual(parseCliArgs([alias]), { kind: 'version' });
  }
});

test('parseCliArgs recognises login, chat and session commands', () => {
  assert.deepEqual(parseCliArgs(['login']), { kind: 'login' });
  assert.deepEqual(parseCliArgs(['auth']), { kind: 'login' });
  assert.deepEqual(parseCliArgs(['chat']), { kind: 'chat' });
  assert.deepEqual(parseCliArgs(['repl']), { kind: 'chat' });
  assert.deepEqual(parseCliArgs(['interactive']), { kind: 'chat' });
  assert.deepEqual(parseCliArgs(['link']), { kind: 'link' });
  assert.deepEqual(parseCliArgs(['url']), { kind: 'link' });
  assert.deepEqual(parseCliArgs(['open']), { kind: 'open' });
  assert.deepEqual(parseCliArgs(['status']), { kind: 'status' });
  assert.deepEqual(parseCliArgs(['check']), { kind: 'status' });
});

test('parseCliArgs is case-insensitive for the command token', () => {
  assert.deepEqual(parseCliArgs(['LOGIN']), { kind: 'login' });
  assert.deepEqual(parseCliArgs(['Status']), { kind: 'status' });
});

test('parseCliArgs forwards the remaining tokens for ask', () => {
  assert.deepEqual(parseCliArgs(['ask', 'hello', 'world']), {
    kind: 'ask',
    args: ['hello', 'world'],
  });
  assert.deepEqual(parseCliArgs(['ask']), { kind: 'ask', args: [] });
});

test('parseCliArgs falls back to a direct prompt for unknown tokens', () => {
  assert.deepEqual(parseCliArgs(['why', 'is', 'the', 'sky', 'blue']), {
    kind: 'prompt',
    args: ['why', 'is', 'the', 'sky', 'blue'],
  });
});

test('parsePromptArgs extracts the --new flag and joins the prompt', () => {
  assert.deepEqual(parsePromptArgs(['--new', 'hello', 'there']), {
    link: false,
    open: false,
    isNewChat: true,
    prompt: 'hello there',
  });
  assert.deepEqual(parsePromptArgs(['-n', 'hi']), {
    link: false,
    open: false,
    isNewChat: true,
    prompt: 'hi',
  });
});

test('parsePromptArgs recognises link aliases', () => {
  for (const flag of ['--link', '-l', '/link', '/url']) {
    const parsed = parsePromptArgs([flag]);
    assert.equal(parsed.link, true, `${flag} should set link`);
  }
});

test('parsePromptArgs recognises open aliases', () => {
  for (const flag of ['--open', '/open']) {
    const parsed = parsePromptArgs([flag]);
    assert.equal(parsed.open, true, `${flag} should set open`);
  }
});

test('parsePromptArgs leaves ordinary prompt text untouched', () => {
  assert.deepEqual(parsePromptArgs(['What', 'is', '2+2?']), {
    link: false,
    open: false,
    isNewChat: false,
    prompt: 'What is 2+2?',
  });
});
