import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { ResultStore, ReviewEntry, SyncRun } from "../../core/store.ts";
import type { Analysis, DiffStatEntry, Env, PullRequest, Signals } from "../../core/types.ts";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prs (
  key            TEXT PRIMARY KEY,
  workspace      TEXT NOT NULL,
  repo           TEXT NOT NULL,
  pr_id          INTEGER NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  author         TEXT NOT NULL,
  url            TEXT NOT NULL,
  source_branch  TEXT NOT NULL,
  dest_branch    TEXT NOT NULL,
  commit_hash    TEXT NOT NULL,
  created_on     TEXT NOT NULL,
  updated_on     TEXT NOT NULL,
  diffstat_json  TEXT NOT NULL,
  is_open        INTEGER NOT NULL DEFAULT 1,
  last_seen_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analyses (
  pr_key                 TEXT NOT NULL REFERENCES prs(key),
  commit_hash            TEXT NOT NULL,
  analyzer               TEXT NOT NULL,
  model                  TEXT,
  attention              TEXT NOT NULL,
  risk_level             TEXT NOT NULL,
  risk_score             INTEGER NOT NULL,
  summary                TEXT NOT NULL,
  impact_areas_json      TEXT NOT NULL,
  risk_factors_json      TEXT NOT NULL,
  attention_reasons_json TEXT NOT NULL,
  review_focus_json      TEXT NOT NULL,
  signals_json           TEXT NOT NULL,
  diff_truncated         INTEGER NOT NULL,
  input_tokens           INTEGER,
  output_tokens          INTEGER,
  created_at             TEXT NOT NULL,
  PRIMARY KEY (pr_key, commit_hash, analyzer)
);

CREATE TABLE IF NOT EXISTS runs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger      TEXT NOT NULL,
  analyzer     TEXT NOT NULL,
  started_at   TEXT NOT NULL,
  finished_at  TEXT NOT NULL,
  status       TEXT NOT NULL,
  error        TEXT,
  result_json  TEXT
);
`;

interface Row {
  key: string;
  workspace: string;
  repo: string;
  pr_id: number;
  title: string;
  description: string;
  author: string;
  url: string;
  source_branch: string;
  dest_branch: string;
  commit_hash: string;
  created_on: string;
  updated_on: string;
  analyzer: string;
  model: string | null;
  attention: Analysis["attention"];
  risk_level: Analysis["risk"]["level"];
  risk_score: number;
  summary: string;
  impact_areas_json: string;
  risk_factors_json: string;
  attention_reasons_json: string;
  review_focus_json: string;
  signals_json: string;
  diff_truncated: number;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  analyzed_commit: string;
}

interface RunRow {
  trigger: SyncRun["trigger"];
  analyzer: string;
  started_at: string;
  finished_at: string;
  status: SyncRun["status"];
  error: string | null;
  result_json: string | null;
}

export function createSqliteStore(env: Env): ResultStore {
  const path = env.DB_PATH?.trim() || "data/reviewer.db";
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);

  const upsertPR = db.prepare(`
    INSERT INTO prs (key, workspace, repo, pr_id, title, description, author, url, source_branch, dest_branch,
                     commit_hash, created_on, updated_on, diffstat_json, is_open, last_seen_at)
    VALUES (@key, @workspace, @repo, @id, @title, @description, @author, @url, @sourceBranch, @destBranch,
            @commit, @createdOn, @updatedOn, COALESCE(@diffStatJson, '[]'), 1, @now)
    ON CONFLICT(key) DO UPDATE SET
      title = excluded.title, description = excluded.description, author = excluded.author, url = excluded.url,
      source_branch = excluded.source_branch, dest_branch = excluded.dest_branch, commit_hash = excluded.commit_hash,
      updated_on = excluded.updated_on, is_open = 1, last_seen_at = excluded.last_seen_at,
      diffstat_json = CASE WHEN @diffStatJson IS NULL THEN prs.diffstat_json ELSE excluded.diffstat_json END
  `);

  const insertAnalysis = db.prepare(`
    INSERT OR REPLACE INTO analyses (pr_key, commit_hash, analyzer, model, attention, risk_level, risk_score, summary,
      impact_areas_json, risk_factors_json, attention_reasons_json, review_focus_json, signals_json, diff_truncated,
      input_tokens, output_tokens, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    savePR(pr: PullRequest, diffStat?: DiffStatEntry[]) {
      upsertPR.run({
        ...pr,
        diffStatJson: diffStat ? JSON.stringify(diffStat) : null,
        now: new Date().toISOString(),
      });
    },

    markClosedExcept(openKeys: string[]) {
      db.prepare("UPDATE prs SET is_open = 0 WHERE key NOT IN (SELECT value FROM json_each(?))").run(
        JSON.stringify(openKeys),
      );
    },

    hasAnalysis(prKey: string, commit: string, analyzer: string) {
      return !!db
        .prepare("SELECT 1 FROM analyses WHERE pr_key = ? AND commit_hash = ? AND analyzer = ?")
        .get(prKey, commit, analyzer);
    },

    saveAnalysis(pr: PullRequest, analyzer: string, signals: Signals, a: Analysis) {
      insertAnalysis.run(
        pr.key,
        pr.commit,
        analyzer,
        a.model ?? null,
        a.attention,
        a.risk.level,
        a.risk.score,
        a.summary,
        JSON.stringify(a.impactAreas),
        JSON.stringify(a.risk.factors),
        JSON.stringify(a.attentionReasons),
        JSON.stringify(a.reviewFocus),
        JSON.stringify(signals),
        a.diffTruncated ? 1 : 0,
        a.usage?.inputTokens ?? null,
        a.usage?.outputTokens ?? null,
        new Date().toISOString(),
      );
    },

    listOpen(analyzer?: string): ReviewEntry[] {
      const rows = db
        .prepare(
          `SELECT p.*, a.analyzer, a.model, a.attention, a.risk_level, a.risk_score, a.summary, a.impact_areas_json,
                  a.risk_factors_json, a.attention_reasons_json, a.review_focus_json, a.signals_json, a.diff_truncated,
                  a.input_tokens, a.output_tokens, a.created_at, a.commit_hash AS analyzed_commit
           FROM prs p
           JOIN analyses a ON a.pr_key = p.key AND (@analyzer IS NULL OR a.analyzer = @analyzer)
             AND a.created_at = (SELECT MAX(created_at) FROM analyses
                                 WHERE pr_key = p.key AND (@analyzer IS NULL OR analyzer = @analyzer))
           WHERE p.is_open = 1`,
        )
        .all({ analyzer: analyzer ?? null }) as Row[];
      return rows.map(toEntry);
    },

    saveRun(run: SyncRun) {
      db.prepare(
        `INSERT INTO runs (trigger, analyzer, started_at, finished_at, status, error, result_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        run.trigger,
        run.analyzer,
        run.startedAt,
        run.finishedAt,
        run.status,
        run.error ?? null,
        run.result ? JSON.stringify(run.result) : null,
      );
    },

    listRuns(limit: number): SyncRun[] {
      const rows = db.prepare("SELECT * FROM runs ORDER BY id DESC LIMIT ?").all(limit) as RunRow[];
      return rows.map((r) => ({
        trigger: r.trigger,
        analyzer: r.analyzer,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        status: r.status,
        error: r.error ?? undefined,
        result: r.result_json ? JSON.parse(r.result_json) : undefined,
      }));
    },

    close() {
      db.close();
    },
  };
}

function toEntry(row: Row): ReviewEntry {
  return {
    pr: {
      key: row.key,
      workspace: row.workspace,
      repo: row.repo,
      id: row.pr_id,
      title: row.title,
      description: row.description,
      author: row.author,
      url: row.url,
      sourceBranch: row.source_branch,
      destBranch: row.dest_branch,
      commit: row.commit_hash,
      createdOn: row.created_on,
      updatedOn: row.updated_on,
    },
    analyzer: row.analyzer,
    analysis: {
      summary: row.summary,
      impactAreas: JSON.parse(row.impact_areas_json),
      risk: { level: row.risk_level, score: row.risk_score, factors: JSON.parse(row.risk_factors_json) },
      attention: row.attention,
      attentionReasons: JSON.parse(row.attention_reasons_json),
      reviewFocus: JSON.parse(row.review_focus_json),
      model: row.model ?? undefined,
      diffTruncated: row.diff_truncated === 1,
      usage:
        row.input_tokens != null ? { inputTokens: row.input_tokens, outputTokens: row.output_tokens ?? 0 } : undefined,
    },
    signals: JSON.parse(row.signals_json),
    analyzedAt: row.created_at,
    stale: row.analyzed_commit !== row.commit_hash,
  };
}
