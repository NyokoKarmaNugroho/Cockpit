/**
 * SEAL Intel — WebContentClient over Security Alliance OpenCTI (GraphQL).
 * SDK: https://github.com/security-alliance/seal-intel-sdk
 *
 * Requires SEAL_INTEL_OPENCTI_HOST (e.g. https://sealisac.org), SEAL_INTEL_API_KEY,
 * and SEAL_INTEL_IDENTITY_ID (STIX id: identity--uuid) for created-by attribution.
 */
import { OpenCTIClient } from "@security-alliance/opencti-client";
import { WebContentClient } from "@security-alliance/seal-intel-sdk";
import type { WebContent } from "@security-alliance/seal-intel-sdk/web-content";
import type { Identifier } from "@security-alliance/stix/2.1";

const DOMAIN_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const IDENTITY_RE =
  /^identity--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cachedClient: WebContentClient | null = null;

function isSealIntelEnabled(): boolean {
  const v = process.env.SEAL_INTEL_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return v === "true" || v === "1" || v === "yes";
}

export function sealIntelOpenCtiHost(): string {
  const raw = process.env.SEAL_INTEL_OPENCTI_HOST?.trim();
  if (!raw) {
    throw new Error(
      "SEAL Intel is not configured: set SEAL_INTEL_OPENCTI_HOST (OpenCTI base URL, e.g. https://sealisac.org)",
    );
  }
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    throw new Error("SEAL_INTEL_OPENCTI_HOST must be a valid HTTP(S) URL");
  }
}

function apiKey(): string {
  const k = process.env.SEAL_INTEL_API_KEY?.trim();
  if (!k) {
    throw new Error("SEAL Intel is not configured: set SEAL_INTEL_API_KEY");
  }
  return k;
}

function defaultIdentity(): Identifier<"identity"> {
  const id = process.env.SEAL_INTEL_IDENTITY_ID?.trim();
  if (!id) {
    throw new Error(
      "SEAL Intel is not configured: set SEAL_INTEL_IDENTITY_ID to your OpenCTI Identity STIX id (identity--UUID)",
    );
  }
  if (!IDENTITY_RE.test(id)) {
    throw new Error("SEAL_INTEL_IDENTITY_ID must match STIX format identity--<UUID>");
  }
  return id as Identifier<"identity">;
}

export function getSealWebContentClient(): WebContentClient {
  if (!isSealIntelEnabled()) {
    throw new Error("SEAL Intel tools are disabled (set SEAL_INTEL_ENABLED=true)");
  }
  if (cachedClient) return cachedClient;
  const host = sealIntelOpenCtiHost();
  const opencti = new OpenCTIClient(host, apiKey());
  cachedClient = new WebContentClient(opencti, defaultIdentity());
  return cachedClient;
}

function assertDomain(domain: string): string {
  const s = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  if (s.length < 3 || s.length > 253 || !DOMAIN_RE.test(s)) {
    throw new Error("Invalid domain-name value");
  }
  return s;
}

function assertHttpUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Invalid url: must be absolute http(s)");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Invalid url: only http and https are allowed");
  }
  return u.toString();
}

function assertIpv4(ip: string): string {
  const s = ip.trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) throw new Error("Invalid ipv4-addr");
  const parts = s.split(".").map((p) => Number(p));
  if (!parts.every((n) => n >= 0 && n <= 255)) throw new Error("Invalid ipv4-addr");
  return s;
}

function assertIpv6(ip: string): string {
  const s = ip.trim();
  if (s.length < 3 || s.length > 45 || !s.includes(":")) {
    throw new Error("Invalid ipv6-addr");
  }
  return s;
}

export type ObservableType = WebContent["type"];

export function parseWebContent(observableType: ObservableType, value: string): WebContent {
  const v = value.trim();
  switch (observableType) {
    case "domain-name":
      return { type: "domain-name", value: assertDomain(v) };
    case "url":
      return { type: "url", value: assertHttpUrl(v) };
    case "ipv4-addr":
      return { type: "ipv4-addr", value: assertIpv4(v) };
    case "ipv6-addr":
      return { type: "ipv6-addr", value: assertIpv6(v) };
    default: {
      const _exhaustive: never = observableType;
      return _exhaustive;
    }
  }
}

export function isSealIntelWriteEnabled(): boolean {
  const v = process.env.SEAL_INTEL_WRITE_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
