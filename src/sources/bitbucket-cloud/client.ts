const BASE_URL = "https://api.bitbucket.org/2.0";
const MAX_RETRIES = 3;

export class BitbucketError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

interface Page<T> {
  values: T[];
  next?: string;
}

/** Minimal Bitbucket Cloud REST client: auth, pagination, rate-limit retries */
export class BitbucketClient {
  private readonly authHeader: string;

  constructor(token: string, email?: string) {
    // Atlassian API tokens work as Bearer; Basic (email:token) is the fallback
    this.authHeader = email
      ? `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`
      : `Bearer ${token}`;
  }

  async getJson<T>(pathOrUrl: string): Promise<T> {
    const res = await this.request(pathOrUrl, "application/json");
    return (await res.json()) as T;
  }

  async getText(pathOrUrl: string): Promise<string> {
    const res = await this.request(pathOrUrl, "text/plain");
    return res.text();
  }

  /** Follows `next` links until every page has been read */
  async *paginate<T>(pathOrUrl: string): AsyncGenerator<T> {
    let url: string | undefined = pathOrUrl;
    while (url) {
      const page: Page<T> = await this.getJson<Page<T>>(url);
      yield* page.values;
      url = page.next;
    }
  }

  private async request(pathOrUrl: string, accept: string): Promise<Response> {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${BASE_URL}${pathOrUrl}`;

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, {
        headers: { Authorization: this.authHeader, Accept: accept },
      });
      if (res.ok) return res;

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get("retry-after")) || 2 ** attempt * 5;
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      const body = (await res.text()).slice(0, 300);
      if (res.status === 401) {
        throw new BitbucketError(
          "Bitbucket rejected the credentials (401). Check BITBUCKET_API_TOKEN; if Bearer auth fails, also set BITBUCKET_EMAIL to use Basic auth.",
          401,
        );
      }
      if (res.status === 403) {
        throw new BitbucketError(
          `Bitbucket denied access (403) to ${url}. The API token may be missing a read scope (account, repository, pull request). ${body}`,
          403,
        );
      }
      throw new BitbucketError(`Bitbucket ${res.status} on ${url}: ${body}`, res.status);
    }
  }
}
