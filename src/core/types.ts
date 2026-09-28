export type AttentionLevel = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export const ATTENTION_LEVELS: readonly AttentionLevel[] = ["low", "medium", "high"];
export const RISK_LEVELS: readonly RiskLevel[] = ["low", "medium", "high", "critical"];

export interface PullRequest {
  /** Unique across sources, e.g. "workspace/repo#42" */
  key: string;
  workspace: string;
  repo: string;
  id: number;
  title: string;
  description: string;
  author: string;
  url: string;
  sourceBranch: string;
  destBranch: string;
  /** Head commit of the source branch; a new commit means a new analysis */
  commit: string;
  createdOn: string;
  updatedOn: string;
}

export interface DiffStatEntry {
  path: string;
  oldPath?: string;
  /** added | removed | modified | renamed | ... */
  status: string;
  linesAdded: number;
  linesRemoved: number;
}

/** Rule-based facts about a PR, computed without an LLM */
export interface Signals {
  filesChanged: number;
  linesChanged: number;
  /** Sensitive areas touched, e.g. "migrations", "auth" */
  categories: string[];
  topDirs: string[];
  /** Points from the rules; higher means riskier */
  score: number;
  reasons: string[];
}

export interface Analysis {
  summary: string;
  impactAreas: string[];
  risk: {
    level: RiskLevel;
    /** 1-10 */
    score: number;
    factors: string[];
  };
  attention: AttentionLevel;
  attentionReasons: string[];
  reviewFocus: string[];
  /** Per-file risk, riskiest first; files not listed were not rated */
  files: FileRisk[];
  /** The single riskiest block of changed code, or null when nothing stands out */
  highestRisk: HighestRisk | null;
  /** Model that produced it, if any */
  model?: string;
  diffTruncated: boolean;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface FileRisk {
  path: string;
  level: RiskLevel;
  /** 1-10 */
  score: number;
  description: string;
}

export interface DiffLine {
  type: "addition" | "deletion" | "context";
  oldLine?: number;
  newLine?: number;
  content: string;
}

export interface HighestRisk {
  file: string;
  /** Line range in the new version of the file */
  startLine: number;
  endLine: number;
  /** Short name of the problem, e.g. "Authorization bypass" */
  hazard: string;
  description: string;
  suggestedFix: { title: string; code: string };
  /** The real diff around that range (cut from the PR diff, not written by the model) */
  diffLines: DiffLine[];
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

/** Environment variables; each module reads its own settings from here */
export type Env = Record<string, string | undefined>;

export function requireEnv(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required setting ${name} (see .env.example)`);
  return value;
}
