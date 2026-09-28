import { loadConfig } from "../config.ts";
import { createStore } from "../stores/index.ts";
import { buildApp } from "./app.ts";
import { startScheduler } from "./scheduler.ts";
import { SyncRunner } from "./sync-runner.ts";

const config = loadConfig();
const store = createStore(config.store, config.env);
const runner = new SyncRunner(config, store);
const schedule = startScheduler(config.env, runner);
const app = buildApp({ store, runner, schedule });

const port = Number(config.env.PORT) || 3000;
// Localhost by default: sync spends API credits, so don't expose it on the network by accident
const host = config.env.HOST?.trim() || "127.0.0.1";

await app.listen({ port, host });

async function shutdown(signal: string) {
  app.log.info(`${signal} received, shutting down`);
  schedule?.stop();
  await app.close();
  await runner.idle();
  store.close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
