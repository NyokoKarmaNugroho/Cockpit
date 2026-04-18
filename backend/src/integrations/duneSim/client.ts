/**
 * Dune Sim API — https://docs.sim.dune.com
 * Auth: header `X-Sim-Api-Key` (SIM_API_KEY).
 */
const DEFAULT_BASE = "https://api.sim.dune.com";

export function getSimApiKey(): string {
  const key = process.env.SIM_API_KEY?.trim();
  if (!key) {
    throw new Error("SIM_API_KEY is not set");
  }
  return key;
}

export function simBaseUrl(): string {
  return process.env.SIM_API_BASE_URL?.trim() || DEFAULT_BASE;
}

export async function simGet(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<unknown> {
  const key = getSimApiKey();
  const url = new URL(path.startsWith("http") ? path : `${simBaseUrl().replace(/\/$/, "")}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      "X-Sim-Api-Key": key,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `Sim API ${res.status}: ${typeof body === "object" && body !== null && "message" in body ? String((body as { message?: string }).message) : text.slice(0, 200)}`,
    );
    throw err;
  }
  return body;
}
