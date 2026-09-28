/** Shapes returned by the reviewer API (mirror of src/core in the parent project) */

export type ApiRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApiAttentionLevel = 'low' | 'medium' | 'high';

export interface ApiDiffLine {
  type: 'addition' | 'deletion' | 'context';
  oldLine?: number;
  newLine?: number;
  content: string;
}

export interface ReviewEntry {
  pr: {
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
    commit: string;
    createdOn: string;
    updatedOn: string;
  };
  analyzer: string;
  analysis: {
    summary: string;
    impactAreas: string[];
    risk: { level: ApiRiskLevel; score: number; factors: string[] };
    attention: ApiAttentionLevel;
    attentionReasons: string[];
    reviewFocus: string[];
    files: { path: string; level: ApiRiskLevel; score: number; description: string }[];
    highestRisk: {
      file: string;
      startLine: number;
      endLine: number;
      hazard: string;
      description: string;
      suggestedFix: { title: string; code: string };
      diffLines: ApiDiffLine[];
    } | null;
    model?: string;
    diffTruncated: boolean;
  };
  diffStat: { path: string; oldPath?: string; status: string; linesAdded: number; linesRemoved: number }[];
  signals: { categories: string[] };
  analyzedAt: string;
  stale: boolean;
}

export interface SyncRun {
  trigger: 'cli' | 'manual' | 'schedule';
  analyzer: string;
  startedAt: string;
  finishedAt: string;
  status: 'ok' | 'error';
  error?: string;
  result?: { total: number; analyzed: number; cached: number; failed: number; skippedByLimit: number };
}

export interface ApiStatus {
  running: { trigger: string; startedAt: string } | null;
  schedule: { cron: string; timezone: string; nextRun: string | null } | null;
  lastRuns: SyncRun[];
}
