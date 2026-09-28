import type { ReviewEntry } from "./core/store.ts";
import { ATTENTION_LEVELS, RISK_LEVELS } from "./core/types.ts";

export interface EntryFilter {
  /** Minimum attention level, e.g. "medium" keeps medium and high */
  level?: string;
  /** Minimum risk level */
  risk?: string;
}

/** Filters by minimum levels and sorts by attention, then risk score (shared by CLI and API) */
export function rankEntries(entries: ReviewEntry[], filter: EntryFilter = {}): ReviewEntry[] {
  const minAttention = parseLevel(filter.level, ATTENTION_LEVELS, "level");
  const minRisk = parseLevel(filter.risk, RISK_LEVELS, "risk");
  return entries
    .filter((e) => ATTENTION_LEVELS.indexOf(e.analysis.attention) >= minAttention)
    .filter((e) => RISK_LEVELS.indexOf(e.analysis.risk.level) >= minRisk)
    .sort(
      (a, b) =>
        ATTENTION_LEVELS.indexOf(b.analysis.attention) - ATTENTION_LEVELS.indexOf(a.analysis.attention) ||
        b.analysis.risk.score - a.analysis.risk.score,
    );
}

export class InvalidFilterError extends Error {}

function parseLevel(value: string | undefined, levels: readonly string[], name: string): number {
  if (!value) return 0;
  const index = levels.indexOf(value);
  if (index < 0) throw new InvalidFilterError(`${name} must be one of: ${levels.join(", ")}`);
  return index;
}
