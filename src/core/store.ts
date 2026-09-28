import type { Analysis, DiffStatEntry, PullRequest, Signals } from "./types.ts";

export interface ReviewEntry {
  pr: PullRequest;
  analyzer: string;
  analysis: Analysis;
  signals: Signals;
  analyzedAt: string;
  /** The PR got new commits after this analysis (e.g. the re-analysis failed) */
  stale: boolean;
}

/** Where results are kept so they can be read after the sync finishes */
export interface ResultStore {
  savePR(pr: PullRequest, diffStat: DiffStatEntry[]): void;
  /** Marks every PR not in `openKeys` as closed (kept for history) */
  markClosedExcept(openKeys: string[]): void;
  hasAnalysis(prKey: string, commit: string, analyzer: string): boolean;
  saveAnalysis(pr: PullRequest, analyzer: string, signals: Signals, analysis: Analysis): void;
  /** Open PRs with their latest analysis by this analyzer */
  listOpen(analyzer: string): ReviewEntry[];
  close(): void;
}
