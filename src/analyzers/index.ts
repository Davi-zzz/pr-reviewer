import type { Analyzer } from "../core/analyzer.ts";
import type { Env } from "../core/types.ts";
import { createClaudeAnalyzer } from "./claude/index.ts";
import { createHeuristicAnalyzer } from "./heuristic/index.ts";

/** Add a new analyzer (LLM or not) here and select it with ANALYZER=<name> */
const analyzers: Record<string, (env: Env) => Analyzer> = {
  claude: createClaudeAnalyzer,
  heuristic: createHeuristicAnalyzer,
};

export function createAnalyzer(name: string, env: Env): Analyzer {
  const factory = analyzers[name];
  if (!factory) throw new Error(`Unknown ANALYZER "${name}". Available: ${Object.keys(analyzers).join(", ")}`);
  return factory(env);
}
