import type { Analyzer } from "../../core/analyzer.ts";
import type { AttentionLevel, RiskLevel } from "../../core/types.ts";
import { HIGH_RISK_CATEGORIES } from "../shared/signals.ts";

/** No LLM: turns the rule-based signals into an analysis. Free, instant, shallow. */
export function createHeuristicAnalyzer(): Analyzer {
  return {
    name: "heuristic",

    async analyze({ signals }) {
      const attention: AttentionLevel = signals.score >= 60 ? "high" : signals.score >= 30 ? "medium" : "low";

      // Rules can't tell a real incident risk from a scary-looking path, so never "critical"
      const risky = signals.categories.filter((c) => HIGH_RISK_CATEGORIES.has(c));
      const riskLevel: RiskLevel = risky.length > 0 ? "high" : signals.categories.length > 0 ? "medium" : "low";
      const baseScore = { low: 2, medium: 5, high: 7, critical: 9 }[riskLevel];
      const riskScore = baseScore + (signals.linesChanged > 300 ? 1 : 0);

      const where = signals.topDirs.length ? `, mostly in ${signals.topDirs.join(", ")}` : "";
      const touches = signals.categories.length ? ` Touches: ${signals.categories.join(", ")}.` : "";

      return {
        summary: `Changes ${signals.filesChanged} file(s), ${signals.linesChanged} line(s)${where}.${touches}`,
        impactAreas: [...signals.categories, ...signals.topDirs],
        risk: {
          level: riskLevel,
          score: riskScore,
          factors: signals.reasons.filter((r) => r.startsWith("touches") || r.includes("without test")),
        },
        attention,
        attentionReasons: signals.reasons,
        reviewFocus: [],
        diffTruncated: false,
      };
    },
  };
}
