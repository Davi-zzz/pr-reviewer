import { computeSignals } from "./analyzers/shared/signals.ts";
import type { Analyzer } from "./core/analyzer.ts";
import { mapLimit } from "./core/concurrency.ts";
import type { PRSource } from "./core/source.ts";
import type { ResultStore } from "./core/store.ts";

export interface SyncOptions {
  /** Max PRs to analyze this run (cached ones don't count) */
  limit?: number;
  concurrency?: number;
}

export interface SyncResult {
  total: number;
  analyzed: number;
  cached: number;
  skippedByLimit: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
}

export async function sync(
  source: PRSource,
  analyzer: Analyzer,
  store: ResultStore,
  { limit = Infinity, concurrency = 3 }: SyncOptions = {},
): Promise<SyncResult> {
  console.log(`Fetching open PRs where you are a reviewer (${source.name})...`);
  const prs = await source.listReviewing();
  console.log(`Found ${prs.length} PR(s). Analyzer: ${analyzer.name}`);

  const result: SyncResult = {
    total: prs.length,
    analyzed: 0,
    cached: 0,
    skippedByLimit: 0,
    failed: 0,
    inputTokens: 0,
    outputTokens: 0,
  };

  const pending = [];
  for (const pr of prs) {
    if (store.hasAnalysis(pr.key, pr.commit, analyzer.name)) {
      store.savePR(pr);
      result.cached++;
    } else {
      pending.push(pr);
    }
  }

  const toAnalyze = pending.slice(0, limit);
  for (const pr of pending.slice(toAnalyze.length)) store.savePR(pr);
  result.skippedByLimit = pending.length - toAnalyze.length;

  await mapLimit(toAnalyze, concurrency, async (pr) => {
    try {
      const diffStat = await source.getDiffStat(pr);
      store.savePR(pr, diffStat);
      const signals = computeSignals(pr, diffStat);
      const analysis = await analyzer.analyze({ pr, diffStat, signals, getDiff: () => source.getDiff(pr) });
      store.saveAnalysis(pr, analyzer.name, signals, analysis);

      result.analyzed++;
      result.inputTokens += analysis.usage?.inputTokens ?? 0;
      result.outputTokens += analysis.usage?.outputTokens ?? 0;
      console.log(`  ✓ ${pr.key}  attention ${analysis.attention}, risk ${analysis.risk.level} ${analysis.risk.score}/10`);
    } catch (err) {
      result.failed++;
      console.error(`  ✗ ${pr.key}: ${(err as Error).message}`);
    }
  });

  store.markClosedExcept(prs.map((pr) => pr.key));
  return result;
}
