import type { DiffStatEntry, PullRequest } from "./types.ts";

/** Where pull requests come from (Bitbucket Cloud today, others later) */
export interface PRSource {
  readonly name: string;
  /** Open PRs where the current user is a reviewer */
  listReviewing(): Promise<PullRequest[]>;
  getDiffStat(pr: PullRequest): Promise<DiffStatEntry[]>;
  /** Unified diff of the whole PR */
  getDiff(pr: PullRequest): Promise<string>;
}
