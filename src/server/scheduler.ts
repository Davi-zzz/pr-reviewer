import { Cron } from "croner";
import type { Env } from "../core/types.ts";
import type { SyncRunner } from "./sync-runner.ts";

export interface ScheduleInfo {
  cron: string;
  timezone: string;
  nextRun(): string | null;
  stop(): void;
}

/**
 * Runs sync on SYNC_CRON (e.g. "0 9,14 * * 1-5" = 9:00 and 14:00 on weekdays) in
 * SYNC_TIMEZONE. SYNC_LIMIT optionally caps how many PRs each scheduled run analyzes.
 * Returns undefined when SYNC_CRON is not set.
 */
export function startScheduler(env: Env, runner: SyncRunner): ScheduleInfo | undefined {
  const cron = env.SYNC_CRON?.trim();
  if (!cron) return undefined;
  const timezone = env.SYNC_TIMEZONE?.trim() || "America/Sao_Paulo";
  const limit = env.SYNC_LIMIT?.trim() ? Number(env.SYNC_LIMIT) : undefined;
  if (limit !== undefined && !(Number.isInteger(limit) && limit >= 0)) {
    throw new Error(`Invalid SYNC_LIMIT "${env.SYNC_LIMIT}": use a non-negative integer`);
  }

  const job = new Cron(cron, { timezone }, () => {
    if (!runner.start("schedule", limit)) console.warn("[schedule] skipped: a sync is already running");
  });

  const info: ScheduleInfo = {
    cron,
    timezone,
    nextRun: () => job.nextRun()?.toISOString() ?? null,
    stop: () => job.stop(),
  };
  console.log(`[schedule] sync on "${cron}" (${timezone}), next run ${info.nextRun()}`);
  return info;
}
