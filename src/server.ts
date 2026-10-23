// A NorthTalk Host: an HTTP server whose counter Script answers each request.
// The Script's visits Store is kept in SQLite, so counts outlive the process.
//
//   node src/server.ts [--port 8787] [--database counter.sqlite]
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createCore, fromValue, ScriptError, storeCapability, text } from '@northtalk/ts';
import { newDrivenGroup } from '@northtalk/ts/driver';
import { openSqliteDatabase } from '@northtalk/ts/sqlite';
import { sessionQuotas } from '@northtalk/ts/store';

const source = readFileSync(new URL('counter.talk', import.meta.url), 'utf8');

const storeOps = ['get', 'set', 'delete', 'keys', 'increment', 'swap', 'watch', 'unwatch'];

export type CounterServer = {
  readonly url: string;
  close(): Promise<void>;
};

export const startServer = async (
  o: { database: string; port?: number },
): Promise<CounterServer> => {
  const db = openSqliteDatabase(o.database, { stores: sessionQuotas });
  const { group, drive } = newDrivenGroup(createCore(), { name: 'counter' });
  const visits = storeCapability(
    db.stores!,
    Object.fromEntries(storeOps.map(op => [op, { fuel: 4 }])),
  );
  const script = group.load({
    name: 'counter',
    source,
    grants: { visits: visits.grant('all', 'visits') },
  });

  // POST /hit/<name> counts a hit; GET /count/<name> reads the count.
  const server: Server = createServer(async (request, response) => {
    const [, route, name] = (request.url ?? '').split('/');
    const message =
      request.method === 'POST' && route === 'hit'
        ? 'hit'
        : request.method === 'GET' && route === 'count'
          ? 'count'
          : undefined;
    if (!message || !name) {
      response.writeHead(404).end('not found');
      return;
    }
    try {
      const count = await script.invoke(message, text(decodeURIComponent(name)));
      response
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ name, count: Number(fromValue(count)) }));
    } catch (error) {
      const status = error instanceof ScriptError ? 422 : 500;
      response.writeHead(status).end(String(error));
    }
  });
  await new Promise<void>(resolve => server.listen(o.port ?? 0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise(resolve => server.close(resolve));
      await drive.close('server shutdown');
      db.close();
    },
  };
};

const option = (name: string) => {
  const at = process.argv.indexOf(name);
  return at < 0 ? undefined : process.argv[at + 1];
};

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!)) {
  const { url } = await startServer({
    database: option('--database') ?? 'counter.sqlite',
    port: Number(option('--port') ?? 8787),
  });
  console.log(`counter listening on ${url}`);
}
