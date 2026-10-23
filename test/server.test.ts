import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { startServer } from '../src/server.ts';

const call = async (url: string, method: string) => {
  const response = await fetch(url, { method });
  assert.equal(response.status, 200);
  return (await response.json()) as { count: number; name: string };
};

test('counts hits per name, and keeps them in SQLite across restarts', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'northtalk-example-'));
  const database = join(dir, 'counter.sqlite');
  try {
    let server = await startServer({ database });
    try {
      assert.equal((await call(`${server.url}/count/home`, 'GET')).count, 0);
      assert.equal((await call(`${server.url}/hit/home`, 'POST')).count, 1);
      assert.equal((await call(`${server.url}/hit/home`, 'POST')).count, 2);
      assert.equal((await call(`${server.url}/hit/about`, 'POST')).count, 1);
      assert.equal((await fetch(`${server.url}/nope`)).status, 404);
    } finally {
      await server.close();
    }
    server = await startServer({ database });
    try {
      assert.equal((await call(`${server.url}/count/home`, 'GET')).count, 2);
    } finally {
      await server.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
