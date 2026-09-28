import type { Analysis, DiffStatEntry, PullRequest, Signals, SyncResult } from "./types.ts";

export type SyncTrigger = "cli" | "manual" | "schedule";

/** One execution of sync, kept so a UI can show "last sync: 09:00 ✓" or why it failed */
export interface SyncRun {
  trigger: SyncTrigger;
  analyzer: string;
  startedAt: string;
  finishedAt: string;
  status: "ok" | "error";
  /** Set when the run failed before finishing (e.g. Bitbucket unreachable) */
  error?: string;
  result?: SyncResult;
}

export interface ReviewEntry {
  pr: PullRequest;
  analyzer: string;
  analysis: Analysis;
  /** Every changed file with +/- counts (the analysis may rate only some of them) */
  diffStat: DiffStatEntry[];
  signals: Signals;
  analyzedAt: string;
  /** The PR got new commits after this analysis (e.g. the re-analysis failed) */
  stale: boolean;
}

/** Where results are kept so they can be read after the sync finishes */
export interface ResultStore {
  /** Upserts the PR and marks it open; without `diffStat` the stored one is kept */
  savePR(pr: PullRequest, diffStat?: DiffStatEntry[]): void;
  /** Marks every PR not in `openKeys` as closed (kept for history) */
  markClosedExcept(openKeys: string[]): void;
  hasAnalysis(prKey: string, commit: string, analyzer: string): boolean;
  saveAnalysis(pr: PullRequest, analyzer: string, signals: Signals, analysis: Analysis): void;
  /** Open PRs with their latest analysis (from `analyzer`, or from any analyzer) */
  listOpen(analyzer?: string): ReviewEntry[];
  saveRun(run: SyncRun): void;
  /** Most recent first */
  listRuns(limit: number): SyncRun[];
  close(): void;
}
