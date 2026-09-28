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

  // Created on first use, so commands that never call Claude don't need credentials.
  // Resolves ANTHROPIC_API_KEY, or an `ant auth login` profile.
  let client: Anthropic | undefined;
  const getClient = () => (client ??= new Anthropic());

  return {
    name: `claude:${model}`,

    async analyze(ctx) {
      const diff = prepareDiff(await ctx.getDiff());

      const response = await getClient()
        .beta.messages.parse({
          model,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          output_config: { effort, format: betaZodOutputFormat(AnalysisOutputSchema) },
          // If a safety classifier declines, the API retries on a fallback model in the same call
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserMessage(ctx, diff) }],
        })
        .catch((err: unknown) => {
          throw explainError(err);
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

function explainError(err: unknown): unknown {
  if (err instanceof Anthropic.AuthenticationError) {
    return new Error("Claude rejected the credentials (401). Check ANTHROPIC_API_KEY.");
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new Error(`Claude denied the request (403): ${err.message}`);
  }
  // Thrown by the SDK before any request when it finds no key or profile
  if (err instanceof Error && !(err instanceof Anthropic.APIError) && /authentication method/i.test(err.message)) {
    return new Error("No Claude credentials found. Set ANTHROPIC_API_KEY in .env, or run `ant auth login`.");
  }
  return err;
}
