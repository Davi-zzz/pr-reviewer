import type { ReviewEntry } from '../types/api';
import type { AttentionLevel, ChangedFileRisk, PRReport, RiskLevel } from '../types/pr';

const upper = <T extends string>(s: string) => s.toUpperCase() as T;

/** Maps an API entry to the dashboard's view model */
export function toPRReport(entry: ReviewEntry): PRReport {
  const { pr, analysis: a, diffStat } = entry;
  const rated = new Map(a.files.map((f) => [f.path, f]));

  const changedFiles: ChangedFileRisk[] = diffStat
    .map((f) => {
      const r = rated.get(f.path);
      return {
        id: f.path,
        file: f.path,
        status: f.status,
        description: r?.description ?? (f.oldPath ? `renamed from ${f.oldPath}` : f.status),
        additions: f.linesAdded,
        deletions: f.linesRemoved,
        riskScore: r?.score ?? null,
        riskLevel: r ? upper<RiskLevel>(r.level) : null,
      };
    })
    // Riskiest first; unrated files (lockfiles, files left out of the diff) at the end
    .sort((x, y) => (y.riskScore ?? 0) - (x.riskScore ?? 0));

  const hr = a.highestRisk;

  return {
    id: pr.key,
    prNumber: pr.id,
    repo: `${pr.workspace}/${pr.repo}`,
    title: pr.title,
    author: pr.author,
    openedAt: pr.createdOn,
    baseBranch: pr.destBranch,
    headBranch: pr.sourceBranch,
    filesChangedCount: diffStat.length,
    additions: diffStat.reduce((sum, f) => sum + f.linesAdded, 0),
    deletions: diffStat.reduce((sum, f) => sum + f.linesRemoved, 0),
    prUrl: pr.url,
    tags: entry.signals.categories.map((c) => `[${c}]`),
    attention: upper<AttentionLevel>(a.attention),
    risk: { level: upper<RiskLevel>(a.risk.level), score: a.risk.score },
    stale: entry.stale,
    diffTruncated: a.diffTruncated,
    analyzer: entry.analyzer,
    analyzedAt: entry.analyzedAt,
    summary: {
      whatChanged: a.summary,
      whyItChanged: pr.description.trim(),
      riskFactors: a.risk.factors,
      reviewFocus: a.reviewFocus,
    },
    highestRisk: hr && {
      file: hr.file,
      lineRange: `${hr.startLine}-${hr.endLine}`,
      hazardType: hr.hazard,
      hazardDescription: hr.description,
      additions: hr.diffLines.filter((l) => l.type === 'addition').length,
      deletions: hr.diffLines.filter((l) => l.type === 'deletion').length,
      diffLines: hr.diffLines.map((l) => ({
        type: l.type,
        oldLineNumber: l.oldLine,
        newLineNumber: l.newLine,
        content: l.content,
      })),
      suggestedFix: hr.suggestedFix,
    },
    changedFiles,
    impactAreas: a.impactAreas,
    attentionReasons: a.attentionReasons,
  };
}
