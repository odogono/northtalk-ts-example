import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createShop } from '../examples/capabilities/main.ts';

test('immediate and suspending Operations, and their errors', async () => {
  const aborted: string[] = [];
  const shop = createShop({
    prices: new Map([
      ['apple', 3],
      ['pear', 4],
      ['plum', 5],
    ]),
    reserve: (sku, quantity, signal) => {
      if (sku === 'pear') return Promise.reject(new Error('none left'));
      if (sku === 'plum') {
        // Answers only when aborted, which the call's maxPendingMs does.
        return new Promise((_, reject) =>
          signal.addEventListener('abort', () => {
            aborted.push(sku);
            reject(signal.reason);
          }),
        );
      }
      return Promise.resolve(`R-${quantity}-${sku}`);
    },
  });
  try {
    assert.deepEqual(await shop.order('apple', 2), {
      sku: 'apple',
      total: '6',
      reservation: 'R-2-apple',
    });
    assert.deepEqual(await shop.order('pear', 1), {
      sku: 'pear',
      total: '4',
      failed: 'out of stock',
    });
    assert.deepEqual(await shop.order('plum', 1), {
      sku: 'plum',
      total: '5',
      failed: 'timeout',
    });
    assert.deepEqual(aborted, ['plum']);
    await assert.rejects(shop.order('kiwi', 1), {
      code: 'send failed',
      reason: 'errored',
    });
  } finally {
    await shop.close();
  }
});
