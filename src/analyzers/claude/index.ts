import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Analyzer } from "../../core/analyzer.ts";
import type { Env } from "../../core/types.ts";
import { prepareDiff } from "../shared/diff.ts";
import { AnalysisOutputSchema, SYSTEM_PROMPT, buildUserMessage, toAnalysis } from "../shared/prompt.ts";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

export function createClaudeAnalyzer(env: Env): Analyzer {
  const model = env.CLAUDE_MODEL?.trim() || "claude-opus-5";
  const effort = (env.CLAUDE_EFFORT?.trim() || "high") as Effort;
  if (!EFFORTS.includes(effort)) {
    throw new Error(`Invalid CLAUDE_EFFORT "${effort}". Use one of: ${EFFORTS.join(", ")}`);
  }

  // Resolves ANTHROPIC_API_KEY, or an `ant auth login` profile
  const client = new Anthropic();

  return {
    name: `claude:${model}`,

    async analyze(ctx) {
      const diff = prepareDiff(await ctx.getDiff());

      const response = await client.beta.messages.parse({
        model,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort, format: betaZodOutputFormat(AnalysisOutputSchema) },
        // If a safety classifier declines, the API retries on a fallback model in the same call
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(ctx, diff) }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error(`Claude declined to analyze ${ctx.pr.key} (${response.stop_details?.category ?? "no category"})`);
      }
      if (response.stop_reason === "max_tokens") {
        throw new Error(`Claude's answer for ${ctx.pr.key} was cut off (max_tokens)`);
      }
      if (!response.parsed_output) {
        throw new Error(`Claude returned no valid analysis for ${ctx.pr.key} (stop_reason: ${response.stop_reason})`);
      }

      return toAnalysis(response.parsed_output, {
        model: response.model,
        diffTruncated: diff.truncated,
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      });
    },
  };
}
