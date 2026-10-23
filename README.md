# northtalk-ts-example

A small HTTP server that embeds [NorthTalk](https://github.com/odogono/odgn-talk) through [`@northtalk/ts`](https://www.npmjs.com/package/@northtalk/ts), as an outside project would. It depends only on the published package.

The server loads one Script, [`src/counter.talk`](src/counter.talk), and grants it one Capability: `visits`, a Store kept in a SQLite database through `@northtalk/ts/sqlite`, so counts outlive the process. Each HTTP request becomes a Request to the Script through `@northtalk/ts/driver`.

| Endpoint | What it does |
| --- | --- |
| `POST /hit/<name>` | Counts a hit for `name` and answers `{"name", "count"}`. |
| `GET /count/<name>` | Answers the count for `name`, 0 if it has none. |

## Running it

It runs unchanged under Node 24.10 or later, which runs the TypeScript directly, and under Bun. `@northtalk/ts/sqlite` needs `node:sqlite`'s `setAuthorizer`, which sets the Node floor.

```sh
npm ci
npm start                # node src/server.ts, on port 8787, in counter.sqlite
npm test
npm run typecheck

bun install
bun src/server.ts
bun test
```

```sh
curl -X POST localhost:8787/hit/home
curl localhost:8787/count/home
```

`--port` and `--database` change the defaults.
