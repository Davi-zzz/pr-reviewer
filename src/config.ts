import { fileURLToPath } from "node:url";
import type { Env } from "./core/types.ts";

/** Project root, so scheduled runs work no matter which directory they start in */
export const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));

export interface AppConfig {
  source: string;
  analyzer: string;
  store: string;
  /** Passed to every module; each reads its own settings */
  env: Env;
}

export function loadConfig(): AppConfig {
  process.chdir(PROJECT_ROOT);
  try {
    process.loadEnvFile(".env");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  // An empty `ANTHROPIC_API_KEY=` line would shadow `ant auth login` credentials
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("ANTHROPIC_") && value === "") delete process.env[key];
  }

  const env = process.env;
  return {
    source: env.SOURCE?.trim() || "bitbucket-cloud",
    analyzer: env.ANALYZER?.trim() || "claude",
    store: env.STORE?.trim() || "sqlite",
    env,
  };
}
