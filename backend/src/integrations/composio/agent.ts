import type {
  Session,
  ToolRouterCreateSessionConfig,
} from "@composio/core";
import { LangchainProvider } from "@composio/langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { createComposioClient } from "./client.js";

function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set (required for ChatOpenAI in Composio agent)");
  }
  return key;
}

/**
 * Tool router session — `session.tools()` returns LangChain tools from Composio.
 */
export async function createComposioSession(
  externalUserId: string,
  config?: ToolRouterCreateSessionConfig,
): Promise<Session<unknown, unknown, LangchainProvider>> {
  const composio = createComposioClient();
  return composio.create(externalUserId, config);
}

export type CreateComposioToolkitAgentParams = {
  externalUserId: string;
  name: string;
  systemPrompt: string;
  /** e.g. `{ toolkits: ["gmail"], manageConnections: true }` — see Composio tool router docs */
  sessionConfig?: ToolRouterCreateSessionConfig;
  /** Passed to ChatOpenAI (default `gpt-4o`) */
  chatModel?: string;
};

/**
 * Mirrors the Composio + LangChain getting started flow: OpenAI chat model + native session tools.
 * Docs: https://docs.composio.dev/docs/providers/langchain
 */
export async function createComposioToolkitAgent(params: CreateComposioToolkitAgentParams) {
  const session = await createComposioSession(
    params.externalUserId,
    params.sessionConfig ?? { manageConnections: true },
  );
  const tools = await session.tools();

  const llm = new ChatOpenAI({
    model: params.chatModel ?? process.env.OPENAI_MODEL ?? "gpt-4o",
    apiKey: getOpenAIApiKey(),
  });

  return createAgent({
    name: params.name,
    systemPrompt: params.systemPrompt,
    model: llm,
    tools,
  });
}

export type AuthorizeToolkitParams = {
  externalUserId: string;
  toolkit: string;
  callbackUrl: string;
  /** When false, use OAuth redirect + `waitForConnection` (see Composio docs). */
  manageConnections?: boolean;
};

/**
 * Start OAuth / connection flow for a toolkit (e.g. `gmail`).
 * Returns `redirectUrl` and `waitForConnection()` as in Composio docs.
 */
export async function authorizeComposioToolkit(params: AuthorizeToolkitParams) {
  const session = await createComposioSession(params.externalUserId, {
    manageConnections: params.manageConnections ?? false,
  });
  return session.authorize(params.toolkit, {
    callbackUrl: params.callbackUrl,
  });
}
