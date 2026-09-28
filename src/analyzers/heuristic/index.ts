import type { Analyzer } from "../../core/analyzer.ts";
import type { AttentionLevel, FileRisk, RiskLevel } from "../../core/types.ts";
import { ANALYSIS_VERSION } from "../shared/prompt.ts";
import { CATEGORIES, HIGH_RISK_CATEGORIES, isNoisePath } from "../shared/signals.ts";

const SCORE: Record<RiskLevel, number> = { low: 2, medium: 5, high: 7, critical: 9 };

/** No LLM: turns the rule-based signals into an analysis. Free, instant, shallow. */
export function createHeuristicAnalyzer(): Analyzer {
  return {
    name: `heuristic:v${ANALYSIS_VERSION}`,

    async analyze({ signals, diffStat }) {
      const attention: AttentionLevel = signals.score >= 60 ? "high" : signals.score >= 30 ? "medium" : "low";

      // Rules can't tell a real incident risk from a scary-looking path, so never "critical"
      const risky = signals.categories.filter((c) => HIGH_RISK_CATEGORIES.has(c));
      const riskLevel: RiskLevel = risky.length > 0 ? "high" : signals.categories.length > 0 ? "medium" : "low";
      const riskScore = SCORE[riskLevel] + (signals.linesChanged > 300 ? 1 : 0);

      const files: FileRisk[] = diffStat
        .filter((f) => !isNoisePath(f.path))
        .map((f) => {
          const hits = CATEGORIES.filter((c) => c.pattern.test(f.path)).map((c) => c.name);
          const level: RiskLevel = hits.some((c) => HIGH_RISK_CATEGORIES.has(c)) ? "high" : hits.length ? "medium" : "low";
          return {
            path: f.path,
            level,
            score: SCORE[level],
            description: hits.length ? `Touches ${hits.join(", ")}` : `${f.status}, +${f.linesAdded}/-${f.linesRemoved}`,
          };
        })
        .sort((a, b) => b.score - a.score);

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
        reviewFocus: files.filter((f) => f.level !== "low").map((f) => f.path),
        files,
        highestRisk: null,
        diffTruncated: false,
      };
    },
  };
}
