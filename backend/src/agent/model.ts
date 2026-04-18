import { ChatOpenRouter } from "@langchain/openrouter";

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const INVALID_MODEL_IDS = new Set(["openai/free", "openrouter/free", "free"]);

function resolveOpenRouterModel(): string {
  const configured = process.env.OPENROUTER_MODEL?.trim();
  if (!configured) {
    return DEFAULT_OPENROUTER_MODEL;
  }

  if (INVALID_MODEL_IDS.has(configured)) {
    console.warn(
      `[cockpit-api] Ignoring invalid OPENROUTER_MODEL="${configured}". Falling back to ${DEFAULT_OPENROUTER_MODEL}.`,
    );
    return DEFAULT_OPENROUTER_MODEL;
  }

  return configured;
}

/**
 * Single place for OpenRouter chat model configuration.
 * Exa / RAG / Composio can be wired into prompts or tools later per PRD.
 */
export function createAnalysisChatModel(): ChatOpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  return new ChatOpenRouter({
    model: resolveOpenRouterModel(),
    apiKey,
    temperature: Number(process.env.OPENROUTER_TEMPERATURE ?? "0.2"),
    siteUrl: process.env.OPENROUTER_SITE_URL,
    siteName: process.env.OPENROUTER_SITE_NAME ?? "Cockpit",
  });
}
