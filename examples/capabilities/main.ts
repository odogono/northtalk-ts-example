// Host Capabilities: the only way a Script reaches the application.
//
// - `catalogue.price` is immediate: its Host function answers during the Pump.
// - `warehouse.reserve` is suspending: it returns a Promise, the Script waits
//   for it, and the call's AbortSignal fires if the call is abandoned.
// - Typed errors (`out of stock`) reach the Script, which can catch them.
// - Arguments and results are typed from their Shapes as plain JS values.
import { readFileSync } from 'node:fs';
import {
  createCore,
  defineCapability,
  fromValue,
  ScriptError,
  shape,
  text,
  num,
} from '@northtalk/ts';
import { newDrivenGroup } from '@northtalk/ts/driver';

/** The application's own services, which the Grants bind to. */
export type Shop = {
  prices: Map<string, number>;
  reserve(sku: string, quantity: number, signal: AbortSignal): Promise<string>;
};

// Capabilities are defined once; each Grant supplies a binding.
const catalogue = defineCapability<Shop>()('catalogue', {
  price: {
    mode: 'immediate',
    args: [shape.text],
    result: shape.number,
    errors: [{ code: 'unknown sku' }],
    cost: { fuel: 10 },
    do: (call, sku) => {
      const price = call.binding.prices.get(sku);
      if (price === undefined) {
        throw new ScriptError('unknown sku', `No price for ${sku}`);
      }
      return num(price);
    },
  },
});

const warehouse = defineCapability<Shop>()('warehouse', {
  reserve: {
    mode: 'suspending',
    args: [shape.text, shape.number],
    result: shape.text,
    errors: [{ code: 'out of stock' }],
    cost: { fuel: 20 },
    maxPendingMs: 1000,
    run: async (call, sku, quantity) => {
      try {
        return await call.binding.reserve(sku, Number(quantity), call.signal);
      } catch (error) {
        throw new ScriptError('out of stock', String(error));
      }
    },
  },
});

export const createShop = (shop: Shop) => {
  const { group, drive } = newDrivenGroup(createCore(), { name: 'shop' });
  const script = group.load({
    name: 'inventory',
    source: readFileSync(new URL('inventory.talk', import.meta.url), 'utf8'),
    grants: {
      catalogue: catalogue.grant(['price'], shop),
      warehouse: warehouse.grant(['reserve'], shop),
    },
  });
  return {
    order: async (sku: string, quantity: number) =>
      fromValue(await script.invoke('order', text(sku), num(quantity)), {
        numbers: 'string',
      }),
    close: () => drive.close('shop closed'),
  };
};

if (import.meta.main) {
  let next = 1;
  const shop = createShop({
    prices: new Map([
      ['apple', 3],
      ['pear', 4],
    ]),
    reserve: async (sku, quantity) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (sku === 'pear') throw new Error('no pears left');
      return `R-${next++} (${quantity} × ${sku})`;
    },
  });
  try {
    console.log(await shop.order('apple', 2));
    console.log(await shop.order('pear', 1));
    // An uncaught Script error fails the Request: a `send failed` ScriptError.
    await shop
      .order('plum', 1)
      .catch((error: ScriptError) =>
        console.log('refused:', error.code, error.reason),
      );
  } finally {
    await shop.close();
  }
}
