/**
 * Hudson Rock Community OSINT API (Infostealer-related signals).
 * Docs as provided by Hudson Rock: open community endpoints, ~50 requests / 10s.
 * Base: https://cavalier.hudsonrock.com/api/json/v2/osint-tools/
 *
 * Use only for lawful investigations and with organizational policy on PII/credentials.
 */

const DEFAULT_BASE = "https://cavalier.hudsonrock.com/api/json/v2/osint-tools";

export function hudsonRockBaseUrl(): string {
  const raw = process.env.HUDSON_ROCK_BASE_URL?.trim();
  return (raw || DEFAULT_BASE).replace(/\/$/, "");
}

function isHudsonRockEnabled(): boolean {
  const v = process.env.HUDSON_ROCK_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return v === "true" || v === "1" || v === "yes";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function assertEmail(email: string): string {
  const s = email.trim();
  if (s.length > 320 || !EMAIL_RE.test(s)) {
    throw new Error("Invalid email format");
  }
  return s;
}

function assertUsername(username: string): string {
  const s = username.trim();
  if (s.length < 1 || s.length > 200 || /[\r\n\0]/.test(s)) {
    throw new Error("Invalid username");
  }
  return s;
}

function assertDomain(domain: string): string {
  const s = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  if (s.length < 3 || s.length > 253 || !DOMAIN_RE.test(s)) {
    throw new Error("Invalid domain");
  }
  return s;
}

function assertIp(ip: string): string {
  const s = ip.trim();
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    const parts = s.split(".").map((p) => Number(p));
    if (parts.every((n) => n >= 0 && n <= 255)) return s;
  }
  // IPv6 loose check (contains colons)
  if (s.includes(":") && s.length >= 3 && s.length <= 45) {
    return s;
  }
  throw new Error("Invalid IP address");
}

export type HudsonRockEndpoint =
  | "search-by-email"
  | "search-by-username"
  | "search-by-domain"
  | "urls-by-domain"
  | "search-by-ip";

export async function hudsonRockGet(
  endpoint: HudsonRockEndpoint,
  queryParam: { name: string; value: string },
): Promise<unknown> {
  if (!isHudsonRockEnabled()) {
    throw new Error("Hudson Rock tools are disabled (set HUDSON_ROCK_ENABLED=true)");
  }
  const base = hudsonRockBaseUrl();
  const url = new URL(`${base}/${endpoint}`);
  url.searchParams.set(queryParam.name, queryParam.value);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Cockpit-Backend/1.0",
    },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 2000) };
  }
  if (!res.ok) {
    const msg =
      res.status === 429
        ? "Rate limited (Hudson Rock: ~50 requests / 10s); retry with backoff."
        : typeof body === "object" && body !== null && "message" in body
          ? String((body as { message?: string }).message)
          : text.slice(0, 400);
    throw new Error(`Hudson Rock API ${res.status}: ${msg}`);
  }
  return body;
}

export async function searchByEmail(email: string): Promise<unknown> {
  return hudsonRockGet("search-by-email", { name: "email", value: assertEmail(email) });
}

export async function searchByUsername(username: string): Promise<unknown> {
  return hudsonRockGet("search-by-username", { name: "username", value: assertUsername(username) });
}

export async function searchByDomain(domain: string): Promise<unknown> {
  return hudsonRockGet("search-by-domain", { name: "domain", value: assertDomain(domain) });
}

export async function urlsByDomain(domain: string): Promise<unknown> {
  return hudsonRockGet("urls-by-domain", { name: "domain", value: assertDomain(domain) });
}

export async function searchByIp(ip: string): Promise<unknown> {
  return hudsonRockGet("search-by-ip", { name: "ip", value: assertIp(ip) });
}
