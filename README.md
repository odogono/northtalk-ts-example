# northtalk-ts-example

Examples of embedding [NorthTalk](https://github.com/odogono/odgn-talk) in an application through [`@northtalk/ts`](https://www.npmjs.com/package/@northtalk/ts), as an outside project would. They depend only on the published package, and each has a test in [`test/`](test/).

| Example                                                   | What it shows                                                                                                                                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`minimal`](examples/minimal/main.ts)                     | The smallest embedding: load a Script, send it a Request, pump the Group by hand, read the answer.                                                                                            |
| [`capabilities`](examples/capabilities/main.ts)           | Host Capabilities defined with `defineCapability`: an immediate Operation, a suspending one backed by a Promise and cancelled through its `AbortSignal`, and typed errors the Script catches. |
| [`messages-and-time`](examples/messages-and-time/main.ts) | Messages delivered without an answer, Script variables, `wait` on the real Clock through `@northtalk/ts/driver`, and `say` through the `console` Standard Capability.                         |
| [`limits`](examples/limits/main.ts)                       | Running untrusted Scripts: a Fuel limit stops a runaway Run without harming the Script, and load errors report their position.                                                                |
| [`save-restore`](examples/save-restore/main.ts)           | Saving a Group's state as bytes and restoring it, with the Host handing back its Grants.                                                                                                      |
| [`http-counter`](examples/http-counter/server.ts)         | A `node:http` server whose Script answers each request and keeps counts in a SQLite Store through `@northtalk/ts/sqlite`, so they outlive the process.                                        |

## Running them

They run unchanged under Node 24.10 or later, which runs TypeScript directly, and under Bun. `@northtalk/ts/sqlite` needs `node:sqlite`'s `setAuthorizer`, which sets the Node floor.

```sh
npm ci
node examples/minimal/main.ts
node examples/capabilities/main.ts
npm start                # the HTTP counter, on port 8787, in counter.sqlite
npm test
npm run typecheck

bun install
bun examples/minimal/main.ts
bun test
```

With the HTTP counter running:

```sh
curl -X POST localhost:8787/hit/home
curl localhost:8787/count/home
```
