import { Composio } from "@composio/core";
import { LangchainProvider } from "@composio/langchain";

export function getComposioApiKey(): string {
  const key = process.env.COMPOSIO_API_KEY?.trim();
  if (!key) {
    throw new Error("COMPOSIO_API_KEY is not set");
  }
  return key;
}

/** Composio SDK with LangChain-native tools (DynamicStructuredTool). */
export function createComposioClient(): Composio<LangchainProvider> {
  return new Composio({
    apiKey: getComposioApiKey(),
    provider: new LangchainProvider(),
  });
}
