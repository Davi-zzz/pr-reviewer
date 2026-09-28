import type { DiffStatEntry, PullRequest, Signals } from "../../core/types.ts";

/** Sensitive areas: a touched file adds the points once per category */
export const CATEGORIES: { name: string; points: number; pattern: RegExp }[] = [
  { name: "migrations", points: 25, pattern: /(^|\/)(migrations?|migrate)\/|schema\.prisma$|\.sql$|(^|\/)db\/schema/i },
  { name: "auth", points: 25, pattern: /auth|security|permission|oauth|jwt|password|crypto|session/i },
  { name: "payments", points: 25, pattern: /payment|billing|invoice|checkout|refund|stripe|wallet/i },
  {
    name: "infra",
    points: 15,
    pattern: /(^|\/)(bitbucket-pipelines\.yml|Dockerfile|docker-compose[^/]*\.ya?ml|\.github\/|terraform\/|k8s\/|helm\/)|\.tf$/i,
  },
  { name: "config", points: 10, pattern: /(^|\/)(\.env[^/]*|config\/|settings\.|application\.(ya?ml|properties))/i },
  {
    name: "dependencies",
    points: 10,
    pattern: /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|pom\.xml|build\.gradle(\.kts)?|go\.mod|Gemfile|composer\.json|Cargo\.toml)$/i,
  },
  { name: "public-api", points: 10, pattern: /(^|\/)(api|routes?|controllers?|graphql|proto|openapi|swagger)(\/|\.)/i },
];

/** Categories that make a PR high-risk on their own */
export const HIGH_RISK_CATEGORIES = new Set(["migrations", "auth", "payments"]);

const NOISE =
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|poetry\.lock|Cargo\.lock|go\.sum|composer\.lock|Gemfile\.lock)$|\.min\.(js|css)$|\.map$|(^|\/)__snapshots__\/|\.snap$|(^|\/)(dist|build|generated)\//i;

const TEST = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[cm]?[jt]sx?$|_test\.(go|py)$|Test\.(java|kt)$/i;

/** Lockfiles, build output, snapshots: large but rarely worth reading */
export function isNoisePath(path: string): boolean {
  return NOISE.test(path);
}

export function computeSignals(pr: PullRequest, diffStat: DiffStatEntry[]): Signals {
  const files = diffStat.filter((f) => !isNoisePath(f.path));
  const linesChanged = files.reduce((sum, f) => sum + f.linesAdded + f.linesRemoved, 0);
  const reasons: string[] = [];
  let score = 0;

  if (linesChanged > 1000) {
    score += 40;
    reasons.push(`very large change (${linesChanged} lines)`);
  } else if (linesChanged > 300) {
    score += 25;
    reasons.push(`large change (${linesChanged} lines)`);
  } else if (linesChanged > 50) {
    score += 10;
  }

  if (files.length > 30) {
    score += 20;
    reasons.push(`${files.length} files changed`);
  } else if (files.length > 10) {
    score += 10;
    reasons.push(`${files.length} files changed`);
  }

  const categories: string[] = [];
  for (const category of CATEGORIES) {
    const hits = files.filter((f) => category.pattern.test(f.path) || (f.oldPath && category.pattern.test(f.oldPath)));
    if (hits.length === 0) continue;
    categories.push(category.name);
    score += category.points;
    reasons.push(`touches ${category.name}: ${hits.slice(0, 3).map((f) => f.path).join(", ")}${hits.length > 3 ? ", ..." : ""}`);
  }

  const deleted = files.filter((f) => f.status === "removed").length;
  if (deleted > 0) {
    score += Math.min(deleted * 5, 15);
    reasons.push(`${deleted} file(s) deleted`);
  }

  const touchesTests = files.some((f) => TEST.test(f.path));
  if (!touchesTests && categories.some((c) => HIGH_RISK_CATEGORIES.has(c))) {
    score += 10;
    reasons.push("sensitive change without test changes");
  }

  if (!pr.description.trim()) {
    score += 5;
    reasons.push("no description");
  }

  const ageDays = (Date.now() - Date.parse(pr.createdOn)) / 86_400_000;
  if (ageDays > 3) {
    score += 5;
    reasons.push(`waiting for ${Math.floor(ageDays)} days`);
  }

  return { filesChanged: files.length, linesChanged, categories, topDirs: topDirs(files), score, reasons };
}

function topDirs(files: DiffStatEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const f of files) {
    const parts = f.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, Math.min(2, parts.length - 1)).join("/") : "(root)";
    counts.set(dir, (counts.get(dir) ?? 0) + f.linesAdded + f.linesRemoved + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dir]) => dir);
}
