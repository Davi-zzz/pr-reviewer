# reviewer

Finds the open Bitbucket Cloud pull requests where you are a reviewer and triages each one:

- **Summary** of what the PR does
- **Impact**: the areas of the system it touches
- **Risk**: how likely it is to break production and how badly (`low` / `medium` / `high` / `critical`, scored 1–10), with the specific risk factors
- **Attention**: how carefully you need to review it (`low` / `medium` / `high`), plus what to look at first

Results are stored in SQLite (`data/reviewer.db`), so you can check them later without watching the run.

## Setup

Requires Node 20.12+ and pnpm 10.34.5.

```sh
npx pnpm@10.34.5 install
cp .env.example .env   # then fill it in
```

### Bitbucket API token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens and choose **Create API token with scopes**.
2. Select **Bitbucket** and grant read access to **account**, **repositories** and **pull requests**.
3. Put the token in `BITBUCKET_API_TOKEN` and your workspace slug (`bitbucket.org/<workspace>/...`) in `BITBUCKET_WORKSPACE`.
4. If you get a 401 with Bearer auth, also set `BITBUCKET_EMAIL` so the tool uses Basic auth (email + token).

By default every repo in the workspace is checked. If there are many repos, set `BITBUCKET_REPOS` to the ones you review.

### Claude
Set `ANTHROPIC_API_KEY` in `.env`, or run `ant auth login`. The default model is `claude-opus-5` (`CLAUDE_MODEL`), at effort `high` (`CLAUDE_EFFORT`).

> The PR diffs are sent to the Anthropic API. Make sure your company allows that.

## Usage

```sh
pnpm smoke               # try the analyzer on a built-in sample PR (no Bitbucket needed)
pnpm sync --limit 2      # first run: analyze only 2 PRs to check everything works
pnpm sync                # analyze all new or changed PRs
pnpm list                # open PRs, most attention first
pnpm list --level high --risk high   # only the ones that matter (minimum levels)
```

`sync` only analyzes PRs whose latest commit hasn't been analyzed yet, so running it repeatedly is cheap. If a PR gets new commits and its re-analysis fails, `list` still shows the previous analysis marked **stale**. `ANALYZER=heuristic` uses plain rules with no LLM. It's free, which makes it handy for testing the Bitbucket connection.

### Dashboard and API with Docker

```sh
docker compose up --build -d   # dashboard: http://localhost:8080, API: http://localhost:3000
```

- `api` runs the HTTP API (`/api/prs`, `/api/prs/:workspace/:repo/:id`, `/api/status`, `POST /api/sync`) and the automatic sync on `SYNC_CRON` (e.g. `0 9,14 * * 1-5`, in `SYNC_TIMEZONE`; `SYNC_LIMIT` caps PRs per scheduled run). It reads `.env`.
- `web` is the dashboard in `front/`, served by nginx, which forwards `/api` to `api`.
- Results live in the `reviewer-data` Docker volume, separate from `data/` used by the CLI on your machine.
- Both ports listen on localhost only, since a sync spends API credits.

Without Docker: `pnpm server` (API on :3000) and `pnpm dev` inside `front/` (dashboard on :5173).

**Cost (Opus 5, $5 / $25 per million input/output tokens):** roughly $0.08–0.35 per PR analysis, depending on diff size. `sync` prints the tokens used. Lockfiles and generated files are never sent. Very large diffs are reduced to the most sensitive files, and the model and `list` (`⚠ partial diff`) both say which files were left out.

## Architecture

```
src/
  core/          types + interfaces only (PRSource, Analyzer, ResultStore)
  sources/       where PRs come from          -> SOURCE=bitbucket-cloud
  analyzers/     how a PR is judged           -> ANALYZER=claude | heuristic
    shared/      rule-based signals, diff preparation, provider-neutral prompt + zod schema
  stores/        where results are kept       -> STORE=sqlite
  sync.ts        source -> cache check -> analyzer -> store
  cli.ts         sync | list | smoke
```

Each implementation is registered by name in its folder's `index.ts` and reads its own settings from the environment.

### Adding another LLM (e.g. Kiro)
1. Create `src/analyzers/<name>/index.ts` exporting `create<Name>Analyzer(env): Analyzer`.
2. Reuse `shared/diff.ts` (`prepareDiff`) and `shared/prompt.ts` (`SYSTEM_PROMPT`, `buildUserMessage`, `AnalysisOutputSchema`, `toAnalysis`). For a CLI-based LLM, run it as a subprocess with the prompt and validate its JSON output with `AnalysisOutputSchema.parse`.
3. Register it in `src/analyzers/index.ts` and set `ANALYZER=<name>`.

Nothing else changes. Results from different analyzers are stored side by side.

## Not verified yet
These parts of the Bitbucket API were written from its known `/2.0` shape but haven't been run against a real workspace yet:
- the `reviewers.uuid` filter on the PR listing
- Bearer auth with scoped API tokens
- the exact token scope names
