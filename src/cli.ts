import { parseArgs } from "node:util";
import { createAnalyzer } from "./analyzers/index.ts";
import { loadConfig } from "./config.ts";
import type { ReviewEntry } from "./core/store.ts";
import { ATTENTION_LEVELS, RISK_LEVELS, type AttentionLevel, type RiskLevel } from "./core/types.ts";
import { runSmoke } from "./smoke.ts";
import { createSource } from "./sources/index.ts";
import { createStore } from "./stores/index.ts";
import { sync } from "./sync.ts";

const USAGE = `Usage:
  pnpm sync [--limit N]                 fetch your review PRs and analyze new/changed ones
  pnpm list [--level high] [--risk critical]   show stored results (filters are minimums)
  pnpm smoke                            run the analyzer on a built-in sample PR (no Bitbucket needed)`;

const ICON: Record<AttentionLevel, string> = { high: "🔴", medium: "🟡", low: "🟢" };

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { values } = parseArgs({
    args: rest,
    options: {
      limit: { type: "string" },
      level: { type: "string" },
      risk: { type: "string" },
    },
  });
  const config = loadConfig();

  switch (command) {
    case "sync": {
      const limit = values.limit ? Number(values.limit) : undefined;
      if (limit !== undefined && !(limit >= 0)) throw new Error("--limit must be a number");

      const source = createSource(config.source, config.env);
      const analyzer = createAnalyzer(config.analyzer, config.env);
      const store = createStore(config.store, config.env);
      try {
        const r = await sync(source, analyzer, store, { limit });
        console.log(
          `\n${r.total} PR(s): ${r.analyzed} analyzed, ${r.cached} cached, ${r.failed} failed` +
            (r.skippedByLimit ? `, ${r.skippedByLimit} left for later (--limit)` : "") +
            (r.inputTokens ? ` | tokens: ${r.inputTokens} in / ${r.outputTokens} out` : ""),
        );
        if (r.failed > 0) process.exitCode = 1;
      } finally {
        store.close();
      }
      break;
    }

    case "list": {
      const minAttention = parseLevel(values.level, ATTENTION_LEVELS, "--level");
      const minRisk = parseLevel(values.risk, RISK_LEVELS, "--risk");
      const store = createStore(config.store, config.env);
      try {
        const entries = store
          .listOpen()
          .filter((e) => ATTENTION_LEVELS.indexOf(e.analysis.attention) >= minAttention)
          .filter((e) => RISK_LEVELS.indexOf(e.analysis.risk.level) >= minRisk)
          .sort(
            (a, b) =>
              ATTENTION_LEVELS.indexOf(b.analysis.attention) - ATTENTION_LEVELS.indexOf(a.analysis.attention) ||
              b.analysis.risk.score - a.analysis.risk.score,
          );
        if (entries.length === 0) console.log("No analyzed open PRs. Run `pnpm sync` first.");
        entries.forEach(printEntry);
      } finally {
        store.close();
      }
      break;
    }

    case "smoke": {
      const analyzer = createAnalyzer(config.analyzer, config.env);
      console.log(`Running ${analyzer.name} on the built-in sample PR...`);
      console.log(JSON.stringify(await runSmoke(analyzer), null, 2));
      break;
    }

    default:
      console.log(USAGE);
      if (command) process.exitCode = 1;
  }
}

function parseLevel(value: string | undefined, levels: readonly string[], flag: string): number {
  if (!value) return 0;
  const index = levels.indexOf(value);
  if (index < 0) throw new Error(`${flag} must be one of: ${levels.join(", ")}`);
  return index;
}

function printEntry({ pr, analysis: a, analyzer, stale }: ReviewEntry) {
  const flags = [a.diffTruncated && "⚠ partial diff", stale && "⚠ stale: new commits since analysis"]
    .filter(Boolean)
    .join("  ");
  const list = (items: string[]) => items.map((i) => `      - ${i}`).join("\n");

  console.log(`
${ICON[a.attention]} ${a.attention.toUpperCase()} attention · RISK ${a.risk.level} ${a.risk.score}/10 · ${pr.workspace}/${pr.repo}#${pr.id}  ${flags}
   ${pr.title} (by ${pr.author})
   ${pr.url}
   ${a.summary}
   Impact: ${a.impactAreas.join(", ") || "-"}${a.risk.factors.length ? `\n   Risk factors:\n${list(a.risk.factors)}` : ""}${a.reviewFocus.length ? `\n   Review first:\n${list(a.reviewFocus)}` : ""}
   (${analyzer})`);
}

main().catch((err) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
});
