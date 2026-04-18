import { tavily } from "@tavily/core";

export function getTavilyApiKey(): string {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) throw new Error("TAVILY_API_KEY is not set");
  return key;
}

export type TavilyClient = ReturnType<typeof tavily>;

export function createTavilyClient(apiKey?: string): TavilyClient {
  return tavily({ apiKey: apiKey ?? getTavilyApiKey() });
}

