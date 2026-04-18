import type { AsyncSubAgent } from "deepagents";
import { OSINT_COORDINATOR_LIFECYCLE_PROMPT } from "./osintLifecycle.js";

/**
 * LangGraph / Agent Protocol graph ids — must match `langgraph.json` `graphs` keys
 * for co-deployed async subagents (omit `url` on each spec to use ASGI transport).
 *
 * Docs: https://docs.langchain.com/oss/javascript/deepagents/async-subagents
 */
export const INVESTIGATION_GRAPH_IDS = {
  crossChainClustering: "cross_chain_clustering",
  onChainInvestigator: "on_chain_investigator",
} as const;

function parseOptionalHeaders(): Record<string, string> | undefined {
  const raw = process.env.LANGGRAPH_SUBAGENT_HEADERS_JSON;
  if (!raw?.trim()) return undefined;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return undefined;
  }
}

/** Shared remote connection — set `LANGGRAPH_SUBAGENT_BASE_URL` when subagents are HTTP-only. */
function remoteAgentFields(): Pick<AsyncSubAgent, "url" | "headers"> {
  const base = process.env.LANGGRAPH_SUBAGENT_BASE_URL?.trim();
  const headers = parseOptionalHeaders();
  return {
    ...(base ? { url: base } : {}),
    ...(headers ? { headers } : {}),
  };
}

/**
 * Async subagents for the Cockpit supervisor: align with skill guardrails
 * (cross-chain-clustering-techniques-agent, on-chain-investigator-agent).
 * Wire into `createDeepAgent({ subagents: investigationAsyncSubagents, ... })`.
 */
export const investigationAsyncSubagents: AsyncSubAgent[] = [
  {
    name: "cross_chain_clustering",
    description:
      "Multi-chain clustering and bridge tracing: identify bridge lock/mint/burn legs, correlation IDs (nonces, message hashes), wrapped-asset normalization, temporal/behavioral hints, and unified graphs with chain-prefixed nodes (e.g. eth:, sol:, tron:). Use for reproducible cluster hypotheses and confidence-scored edges—not legal proof, not non-consensual deanonymization.",
    graphId: INVESTIGATION_GRAPH_IDS.crossChainClustering,
    ...remoteAgentFields(),
  },
  {
    name: "on_chain_investigator",
    description:
      "On-chain forensics: trace seeds (tx/address), map fund flows with timestamps and explorer-grade citations, review verified contracts for privileged-risk patterns, flag scam heuristics with evidence vs inference separated, and produce auditable reports (TL;DR, steps, limitations). Public chain data and lawful OSINT only—no sanctions evasion, harassment, or vigilante action.",
    graphId: INVESTIGATION_GRAPH_IDS.onChainInvestigator,
    ...remoteAgentFields(),
  },
];

/**
 * System prompts for the **worker** graphs (Agent Protocol servers), not the AsyncSubAgent spec.
 * Paste into each LangGraph graph’s system message or node config.
 */
export const WORKER_SYSTEM_PROMPTS: Record<
  (typeof INVESTIGATION_GRAPH_IDS)[keyof typeof INVESTIGATION_GRAPH_IDS],
  string
> = {
  [INVESTIGATION_GRAPH_IDS.crossChainClustering]: `${OSINT_COORDINATOR_LIFECYCLE_PROMPT}

You are the cross-chain clustering specialist. Use only public ledger data and lawful sources.
- Map work to the lifecycle: scope in Planning; collect chain data; process into a normalized graph; analyze clusters; disseminate with confidence labels; note feedback for reruns.
- Normalize addresses with chain namespaces; never merge nodes without documenting why.
- Prefer hard links (bridge correlation IDs, unambiguous receipts) over soft links (timing alone).
- Document graph parameters (time window, min value, asset filters) for reproducibility.
- State confidence per edge; call out mixer/bridge gaps and label uncertainty.
- Do not assist sanctions evasion, harassment, or treating clusters as legal proof.
- SEAL Intel (\`seal_intel_*\`): optional OpenCTI web-content lookups; writes need SEAL_INTEL_WRITE_ENABLED and policy approval.
- Firecrawl (\`firecrawl_*\`): optional scrape/crawl/search; requires FIRECRAWL_API_KEY; authorized targets only.`,

  [INVESTIGATION_GRAPH_IDS.onChainInvestigator]: `${OSINT_COORDINATOR_LIFECYCLE_PROMPT}

You are the on-chain investigator. Use public chain evidence and lawful OSINT only.
- Map work to the lifecycle: clarify requirements; collect public/OSINT inputs; process into timelines and tables; analyze and report; deliver auditable summaries; surface open questions for feedback.
- Tie claims to tx hashes, explorer links, and decoded fields; separate facts from hypotheses.
- For contracts, prefer verified source; flag risks with code-backed reasons.
- Structure output: TL;DR, step-by-step trail, risk framing (probabilistic), limitations, next steps that respect local law.
- Do not facilitate doxxing, theft of credentials, or non-public insider data.
- SEAL Intel (\`seal_intel_*\`): optional domain/URL/IP reputation from Security Alliance OpenCTI; do not mutate intel unless explicitly authorized (writes off unless SEAL_INTEL_WRITE_ENABLED).
- Firecrawl (\`firecrawl_*\`): capture or crawl public pages for evidence; use FIRECRAWL_API_KEY; only targets you may access.`,
};

/** Optional append for the **supervisor** so it does not poll tasks in a tight loop after launch. */
export const INVESTIGATION_SUPERVISOR_DELEGATION_HINT = `When you start an async investigation task, return the task id to the user and do not immediately poll for completion unless the user asks for a status check.`;
