import { TorProject } from "./constants.js";

export type GitHubRepoSummary = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count?: number;
  pushed_at?: string | null;
};

function githubToken(): string | undefined {
  const t = process.env.GITHUB_TOKEN?.trim();
  return t || undefined;
}

/**
 * List public repositories for the Tor Project GitHub org (unauthenticated: strict rate limit).
 * @see https://docs.github.com/en/rest/repos/repos#list-organization-repositories
 */
export async function listTorProjectRepos(options?: {
  page?: number;
  perPage?: number;
}): Promise<{ repos: GitHubRepoSummary[]; linkHeader?: string | null }> {
  const page = Math.min(Math.max(options?.page ?? 1, 1), 500);
  const perPage = Math.min(Math.max(options?.perPage ?? 20, 1), 100);
  const url = new URL(TorProject.githubApiOrgRepos);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("type", "public");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = githubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { headers });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: string }).message)
        : text.slice(0, 300);
    throw new Error(`GitHub API ${res.status}: ${msg}`);
  }
  if (!Array.isArray(body)) {
    throw new Error("GitHub API: expected array of repositories");
  }
  const repos: GitHubRepoSummary[] = body.map((r: Record<string, unknown>) => ({
    name: String(r.name ?? ""),
    full_name: String(r.full_name ?? ""),
    html_url: String(r.html_url ?? ""),
    description: r.description != null ? String(r.description) : null,
    stargazers_count: typeof r.stargazers_count === "number" ? r.stargazers_count : undefined,
    pushed_at: r.pushed_at != null ? String(r.pushed_at) : null,
  }));
  const linkHeader = res.headers.get("link");
  return { repos, linkHeader };
}

export function buildAhmiaClearnetSearchUrl(query: string): URL {
  const q = query.trim();
  const u = new URL("search/", "https://ahmia.fi/");
  u.searchParams.set("q", q);
  return u;
}
