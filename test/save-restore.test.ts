import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../examples/save-restore/main.ts';

test('a restored Group keeps its Script variables', () => {
  const lines = run();
  assert.deepEqual(
    lines.filter(line => line.startsWith('seen')),
    ['seen 1 so far', 'seen 2 so far', 'seen 3 so far'],
  );
});
