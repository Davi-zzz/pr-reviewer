import type { Analysis, DiffStatEntry, PullRequest, Signals } from "./types.ts";

export interface AnalysisContext {
  pr: PullRequest;
  diffStat: DiffStatEntry[];
  signals: Signals;
  /** Fetched lazily: analyzers that don't need the diff never download it */
  getDiff(): Promise<string>;
}

/** Turns a PR into a summary, impact, risk and attention level (an LLM or plain rules) */
export interface Analyzer {
  /** Stored with each result; changing it forces a re-analysis */
  readonly name: string;
  analyze(ctx: AnalysisContext): Promise<Analysis>;
}
