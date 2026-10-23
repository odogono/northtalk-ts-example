import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../examples/limits/main.ts';

test('a runaway Run hits its Fuel limit and the Script carries on', async () => {
  assert.deepEqual(await run(), [
    'sum 10 = 55',
    'sum 1000000 failed: send failed (limit fault)',
    'sum 3 = 6',
    'broken did not load: unexpected token at 2:7',
  ]);
});
