/**
 * Firecrawl — hosted scrape / map / crawl / search for LLM-ready web content.
 * SDK: https://github.com/firecrawl/firecrawl — https://docs.firecrawl.dev
 */
import Firecrawl from "@mendable/firecrawl-js";

export function isFirecrawlEnabled(): boolean {
  const v = process.env.FIRECRAWL_ENABLED?.trim().toLowerCase();
  if (!v) return true;
  return v === "true" || v === "1" || v === "yes";
}

export function getFirecrawlApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }
  return key;
}

export function createFirecrawlClient(): InstanceType<typeof Firecrawl> {
  if (!isFirecrawlEnabled()) {
    throw new Error("Firecrawl tools are disabled (set FIRECRAWL_ENABLED=true)");
  }
  const apiKey = getFirecrawlApiKey();
  const apiUrl = process.env.FIRECRAWL_API_URL?.trim();
  return new Firecrawl({
    apiKey,
    ...(apiUrl ? { apiUrl } : {}),
  });
}
