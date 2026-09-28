import Fastify from "fastify";
import type { ResultStore } from "../core/store.ts";
import { InvalidFilterError, rankEntries } from "../query.ts";
import type { ScheduleInfo } from "./scheduler.ts";
import type { SyncRunner } from "./sync-runner.ts";

export interface AppDeps {
  store: ResultStore;
  runner: SyncRunner;
  /** The automatic sync, if enabled */
  schedule?: ScheduleInfo;
}

export function buildApp({ store, runner, schedule }: AppDeps) {
  const app = Fastify({ logger: { level: "info" } });

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    if (err instanceof InvalidFilterError) return reply.code(400).send({ error: err.message });
    app.log.error(err);
    return reply.code(err.statusCode ?? 500).send({ error: err.message });
  });

  app.get("/api/health", async () => ({ ok: true }));

  /** Open PRs, most attention first. ?level= and ?risk= are minimum levels */
  app.get<{ Querystring: { level?: string; risk?: string } }>("/api/prs", async (req) =>
    rankEntries(store.listOpen(), req.query),
  );

  app.get<{ Params: { workspace: string; repo: string; id: string } }>(
    "/api/prs/:workspace/:repo/:id",
    async (req, reply) => {
      const { workspace, repo, id } = req.params;
      const entry = store.listOpen().find((e) => e.pr.key === `${workspace}/${repo}#${id}`);
      return entry ?? reply.code(404).send({ error: "PR not found or not analyzed yet" });
    },
  );

  app.get("/api/status", async () => ({
    running: runner.running,
    schedule: schedule ? { cron: schedule.cron, timezone: schedule.timezone, nextRun: schedule.nextRun() } : null,
    lastRuns: store.listRuns(10),
  }));

  /** Starts a sync in the background; poll /api/status to follow it */
  app.post<{ Body: { limit?: unknown } | undefined }>("/api/sync", async (req, reply) => {
    const limit = req.body?.limit;
    if (limit !== undefined && !(Number.isInteger(limit) && (limit as number) >= 0)) {
      return reply.code(400).send({ error: "limit must be a non-negative integer" });
    }
    if (!runner.start("manual", limit as number | undefined)) {
      return reply.code(409).send({ error: "A sync is already running", running: runner.running });
    }
    return reply.code(202).send({ started: true, running: runner.running });
  });

  return app;
}
