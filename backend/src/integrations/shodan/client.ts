/**
 * Shodan REST API (server-side only — API key via query param; never expose in frontend).
 * OpenAPI: https://developer.shodan.io/api/openapi.json
 *
 * Use only on authorized targets and per Shodan account terms / applicable law.
 */

const SHODAN_BASE = "https://api.shodan.io";

export function getShodanApiKey(): string {
  const key = process.env.SHODAN_API_KEY?.trim();
  if (!key) {
    throw new Error("SHODAN_API_KEY is not set");
  }
  return key;
}

function buildUrl(path: string, params: Record<string, string | number | boolean | undefined>): URL {
  const url = new URL(path.replace(/^\//, ""), SHODAN_BASE.endsWith("/") ? SHODAN_BASE : `${SHODAN_BASE}/`);
  url.searchParams.set("key", getShodanApiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (typeof v === "boolean") {
      url.searchParams.set(k, v ? "true" : "false");
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function shodanJson(path: string, params: Record<string, string | number | boolean | undefined>): Promise<unknown> {
  const url = buildUrl(path, params);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error?: string }).error)
        : typeof body === "object" && body !== null && "message" in body
          ? String((body as { message?: string }).message)
          : text.slice(0, 400);
    throw new Error(`Shodan API ${res.status}: ${msg}`);
  }
  return body;
}

/** GET /shodan/host/search — search banners (consumes query credits per Shodan rules). */
export async function shodanHostSearch(
  query: string,
  options?: { page?: number; facets?: string },
): Promise<unknown> {
  return shodanJson("/shodan/host/search", {
    query,
    page: options?.page,
    facets: options?.facets,
  });
}

/** GET /shodan/host/count — total + facets only; no host rows (no query credits per Shodan docs). */
export async function shodanHostCount(query: string, options?: { facets?: string }): Promise<unknown> {
  return shodanJson("/shodan/host/count", {
    query,
    facets: options?.facets,
  });
}

/** GET /shodan/host/{ip} — services on a host. */
export async function shodanHostIp(
  ip: string,
  options?: { history?: boolean; minify?: boolean },
): Promise<unknown> {
  const trimmed = ip.trim();
  if (!trimmed) {
    throw new Error("ip is required");
  }
  const path = `/shodan/host/${encodeURIComponent(trimmed)}`;
  return shodanJson(path, {
    history: options?.history,
    minify: options?.minify,
  });
}

/**
 * Reference queries for locating infrastructure that may relate to Tor / .onion hosting
 * (Shodan index + filters change over time — validate on shodan.io/search and filter docs).
 * These are search strings for use with {@link shodanHostSearch}, not separate API endpoints.
 */
export const SHODAN_ONION_RESEARCH_QUERY_TECHNIQUES = [
  {
    technique: 1,
    name: "SSL/TLS certificate material",
    description:
      "Search indexed certificate subjects/SANs and TLS-related banners where operators leak onion-like identifiers or mis-issue certs for hidden services.",
    example_queries: ['ssl.cert.subject.cn:"onion"', 'ssl:"onion"'],
  },
  {
    technique: 2,
    name: "HTTP content and titles",
    description:
      "Search HTTP HTML/title fields for literal .onion strings or gateway/proxy pages that reference onion addresses.",
    example_queries: ["http.html:.onion", 'http.title:".onion"'],
  },
  {
    technique: 3,
    name: "Hostnames and banners",
    description:
      "Search hostnames or generic banner text for onion-like hostnames or Tor-related software strings combined with your org filters.",
    example_queries: ["hostname:.onion", "tor"],
  },
] as const;
