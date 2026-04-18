/**
 * Chainalysis public Sanctions API (server-side only — no browser CORS).
 *
 * Docs (signup, rate limits, ToU): https://public.chainalysis.com
 * In-repo reference: `backend/dataset/Chainalysis.md`
 *
 * Not a legal determination; follow your compliance program and official government lists.
 */
const SANCTIONS_BASE = "https://public.chainalysis.com/api/v1";

export type ChainalysisSanctionsIdentification = {
  category: string | null;
  name: string | null;
  description: string | null;
  url: string | null;
};

export type ChainalysisSanctionsAddressResponse = {
  identifications: ChainalysisSanctionsIdentification[];
};

export function getChainalysisApiKey(): string {
  const key = process.env.CHAINALYSIS_API_KEY?.trim();
  if (!key) {
    throw new Error("CHAINALYSIS_API_KEY is not set");
  }
  return key;
}

/**
 * GET /address/{addressToCheck} — `identifications` is empty when no sanctions match.
 * Rate limit: 5000 requests / 5 minutes per key (403 when throttled).
 */
export async function checkChainalysisSanctionsAddress(
  addressToCheck: string,
  options?: { apiKey?: string }
): Promise<ChainalysisSanctionsAddressResponse> {
  const apiKey = options?.apiKey ?? getChainalysisApiKey();
  const path = `${SANCTIONS_BASE}/address/${encodeURIComponent(addressToCheck)}`;
  const res = await fetch(path, {
    headers: {
      "X-API-Key": apiKey,
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
    const hint = res.status === 403 ? " (possible rate limit: 5000 req / 5 min)" : "";
    const msg =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: string }).message)
        : text.slice(0, 300);
    throw new Error(`Chainalysis Sanctions API ${res.status}${hint}: ${msg}`);
  }
  const parsed = body as Partial<ChainalysisSanctionsAddressResponse>;
  if (!parsed || !Array.isArray(parsed.identifications)) {
    throw new Error("Chainalysis Sanctions API: unexpected response shape");
  }
  return { identifications: parsed.identifications };
}
