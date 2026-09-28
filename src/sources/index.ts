import type { PRSource } from "../core/source.ts";
import type { Env } from "../core/types.ts";
import { createBitbucketCloudSource } from "./bitbucket-cloud/index.ts";

/** Add a new source here and select it with SOURCE=<name> */
const sources: Record<string, (env: Env) => PRSource> = {
  "bitbucket-cloud": createBitbucketCloudSource,
};

export function createSource(name: string, env: Env): PRSource {
  const factory = sources[name];
  if (!factory) throw new Error(`Unknown SOURCE "${name}". Available: ${Object.keys(sources).join(", ")}`);
  return factory(env);
}
