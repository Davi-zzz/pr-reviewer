import type { PRSource } from "../../core/source.ts";
import { requireEnv, type DiffStatEntry, type Env, type PullRequest } from "../../core/types.ts";
import { BitbucketClient, BitbucketError } from "./client.ts";

const REPO_CONCURRENCY = 5;

interface RawPullRequest {
  id: number;
  title: string;
  description?: string;
  author?: { display_name?: string };
  links: { html: { href: string } };
  source: { branch: { name: string }; commit: { hash: string } };
  destination: { branch: { name: string } };
  created_on: string;
  updated_on: string;
}

interface RawDiffStat {
  status: string;
  lines_added?: number;
  lines_removed?: number;
  old?: { path: string } | null;
  new?: { path: string } | null;
}

export function createBitbucketCloudSource(env: Env): PRSource {
  const workspace = requireEnv(env, "BITBUCKET_WORKSPACE");
  const client = new BitbucketClient(
    requireEnv(env, "BITBUCKET_API_TOKEN"),
    env.BITBUCKET_EMAIL?.trim() || undefined,
  );
  const configuredRepos = (env.BITBUCKET_REPOS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const ws = encodeURIComponent(workspace);
  const prPath = (pr: PullRequest) =>
    `/repositories/${ws}/${encodeURIComponent(pr.repo)}/pullrequests/${pr.id}`;

  async function listRepos(): Promise<string[]> {
    if (configuredRepos.length > 0) return configuredRepos;
    const slugs: string[] = [];
    for await (const repo of client.paginate<{ slug: string }>(`/repositories/${ws}?pagelen=100`)) {
      slugs.push(repo.slug);
    }
    return slugs;
  }

  async function listRepoPRs(repo: string, userUuid: string): Promise<PullRequest[]> {
    const q = `state="OPEN" AND reviewers.uuid="${userUuid}"`;
    const path = `/repositories/${ws}/${encodeURIComponent(repo)}/pullrequests?pagelen=50&q=${encodeURIComponent(q)}`;
    const prs: PullRequest[] = [];
    for await (const raw of client.paginate<RawPullRequest>(path)) {
      prs.push(toPullRequest(workspace, repo, raw));
    }
    return prs;
  }

  return {
    name: "bitbucket-cloud",

    async listReviewing() {
      const me = await client.getJson<{ uuid: string }>("/user");
      const repos = await listRepos();

      const results = await mapLimit(repos, REPO_CONCURRENCY, async (repo) => {
        try {
          return await listRepoPRs(repo, me.uuid);
        } catch (err) {
          // Bad credentials affect every repo, so stop; anything else skips just this repo
          if (err instanceof BitbucketError && err.status === 401) throw err;
          console.warn(`  ! skipped repo ${repo}: ${(err as Error).message}`);
          return [];
        }
      });
      return results.flat();
    },

    async getDiffStat(pr) {
      const entries: DiffStatEntry[] = [];
      for await (const raw of client.paginate<RawDiffStat>(`${prPath(pr)}/diffstat?pagelen=500`)) {
        entries.push({
          path: raw.new?.path ?? raw.old?.path ?? "(unknown)",
          oldPath: raw.old?.path !== raw.new?.path ? raw.old?.path : undefined,
          status: raw.status,
          linesAdded: raw.lines_added ?? 0,
          linesRemoved: raw.lines_removed ?? 0,
        });
      }
      return entries;
    },

    getDiff(pr) {
      return client.getText(`${prPath(pr)}/diff`);
    },
  };
}

function toPullRequest(workspace: string, repo: string, raw: RawPullRequest): PullRequest {
  return {
    key: `${workspace}/${repo}#${raw.id}`,
    workspace,
    repo,
    id: raw.id,
    title: raw.title,
    description: raw.description ?? "",
    author: raw.author?.display_name ?? "unknown",
    url: raw.links.html.href,
    sourceBranch: raw.source.branch.name,
    destBranch: raw.destination.branch.name,
    commit: raw.source.commit.hash,
    createdOn: raw.created_on,
    updatedOn: raw.updated_on,
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
