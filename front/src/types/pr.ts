/**
 * View model of the dashboard, built from the API's ReviewEntry by services/adapter.ts
 */

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AttentionLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiffLine {
  type: 'deletion' | 'addition' | 'context';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface HighestRiskBlock {
  file: string;
  lineRange: string;
  hazardType: string;
  hazardDescription: string;
  additions: number;
  deletions: number;
  diffLines: DiffLine[];
  suggestedFix: {
    title: string;
    code: string;
  };
}

export interface ChangedFileRisk {
  id: string;
  file: string;
  status: string;
  description: string;
  additions: number;
  deletions: number;
  /** 1-10, null when the analysis didn't rate this file */
  riskScore: number | null;
  riskLevel: RiskLevel | null;
}

export interface PRReport {
  id: string;
  prNumber: number;
  repo: string;
  title: string;
  author: string;
  openedAt: string;
  baseBranch: string;
  headBranch: string;
  filesChangedCount: number;
  additions: number;
  deletions: number;
  prUrl: string;
  tags: string[];
  attention: AttentionLevel;
  risk: { level: RiskLevel; score: number };
  stale: boolean;
  diffTruncated: boolean;
  analyzer: string;
  analyzedAt: string;
  summary: {
    whatChanged: string;
    whyItChanged: string;
    riskFactors: string[];
    reviewFocus: string[];
  };
  highestRisk: HighestRiskBlock | null;
  changedFiles: ChangedFileRisk[];
  impactAreas: string[];
  attentionReasons: string[];
}
