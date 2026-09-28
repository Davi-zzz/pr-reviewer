import { createAnalyzer } from "../analyzers/index.ts";
import type { AppConfig } from "../config.ts";
import type { ResultStore, SyncTrigger } from "../core/store.ts";
import { createSource } from "../sources/index.ts";
import { sync } from "../sync.ts";

export interface RunningSync {
  trigger: SyncTrigger;
  startedAt: string;
}

/** Runs one sync at a time in the background, for the API and the scheduler */
export class SyncRunner {
  private current: (RunningSync & { done: Promise<void> }) | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly store: ResultStore,
  ) {}

  get running(): RunningSync | null {
    return this.current && { trigger: this.current.trigger, startedAt: this.current.startedAt };
  }

  /** Starts a sync without waiting for it; returns false if one is already running */
  start(trigger: SyncTrigger, limit?: number): boolean {
    if (this.current) return false;
    const startedAt = new Date().toISOString();
    const done = this.run(trigger, startedAt, limit).finally(() => {
      this.current = null;
    });
    this.current = { trigger, startedAt, done };
    return true;
  }

  /** Resolves when the running sync (if any) finishes */
  async idle(): Promise<void> {
    await this.current?.done;
  }

  private async run(trigger: SyncTrigger, startedAt: string, limit?: number): Promise<void> {
    const { config, store } = this;
    try {
      // Built per run, so a missing setting fails this sync instead of the whole server
      const source = createSource(config.source, config.env);
      const analyzer = createAnalyzer(config.analyzer, config.env);
      const r = await sync(source, analyzer, store, { trigger, limit });
      console.log(`[sync:${trigger}] done: ${r.analyzed} analyzed, ${r.cached} cached, ${r.failed} failed`);
    } catch (err) {
      const message = (err as Error).message;
      console.error(`[sync:${trigger}] failed: ${message}`);
      // sync() records its own failures; this covers errors before it starts (e.g. missing settings)
      if (!store.listRuns(1).some((run) => run.startedAt >= startedAt)) {
        store.saveRun({
          trigger,
          analyzer: config.analyzer,
          startedAt,
          finishedAt: new Date().toISOString(),
          status: "error",
          error: message,
        });
      }
    }
  }
}
