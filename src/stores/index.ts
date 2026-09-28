import type { ResultStore } from "../core/store.ts";
import type { Env } from "../core/types.ts";
import { createSqliteStore } from "./sqlite/index.ts";

/** Add a new store here and select it with STORE=<name> */
const stores: Record<string, (env: Env) => ResultStore> = {
  sqlite: createSqliteStore,
};

export function createStore(name: string, env: Env): ResultStore {
  const factory = stores[name];
  if (!factory) throw new Error(`Unknown STORE "${name}". Available: ${Object.keys(stores).join(", ")}`);
  return factory(env);
}
