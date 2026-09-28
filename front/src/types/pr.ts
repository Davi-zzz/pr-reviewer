/**
 * Types for PR Sentinel / PR Risk Intelligence
 * Designed for seamless REST API integration
 */

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiffLine {
  type: 'deletion' | 'addition' | 'annotation' | 'context';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  annotation?: {
    title: string;
    confidence: string;
    description: string;
  };
}

export interface HighestRiskBlock {
  file: string;
  lineRange: string;
  riskWeight: number; // 0-100
  hazardType: string;
  hazardDescription: string;
  additions: number;
  deletions: number;
  diffLines: DiffLine[];
  suggestedFix: {
    title: string;
    description?: string;
    code: string;
  };
}

export interface ChangedFileRisk {
  id: string;
  file: string;
  description: string;
  additions: number;
  deletions: number;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  diffSnippet?: DiffLine[];
}

export interface AffectedService {
  name: string;
  description: string;
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface PRReport {
  id: string;
  prNumber: number;
  repo: string;
  title: string;
  status: 'open' | 'merged' | 'closed';
  semver: 'MAJOR' | 'MINOR' | 'PATCH';
  openedAt: string;
  author: string;
  authorAvatar?: string;
  baseBranch: string;
  headBranch: string;
  commitsCount: number;
  filesChangedCount: number;
  additions: number;
  deletions: number;
  githubUrl: string;
  tags: string[];
  summary: {
    whatChanged: string;
    whyItChanged: string;
    architecturalTradeoffs: string;
    rollbackStrategy: string;
  };
  highestRisk: HighestRiskBlock;
  changedFiles: ChangedFileRisk[];
  affectedContext: {
    services: AffectedService[];
    touchedTables: string[];
  };
}

export interface ApiConfig {
  endpoint: string;
  authToken: string;
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
}
