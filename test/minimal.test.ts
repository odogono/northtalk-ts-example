import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test("minimal prints the Script's answer", () => {
  const main = fileURLToPath(
    new URL('../examples/minimal/main.ts', import.meta.url),
  );
  // process.execPath is node or bun, whichever runs the tests.
  assert.equal(
    execFileSync(process.execPath, [main], { encoding: 'utf8' }),
    'Hello, world!\n',
  );
});
