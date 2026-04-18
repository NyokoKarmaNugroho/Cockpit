import { createDeepAgent } from "deepagents";
import { createAnalysisChatModel } from "../agent/model.js";
import {
  INVESTIGATION_SUPERVISOR_DELEGATION_HINT,
  investigationAsyncSubagents,
} from "../agent/investigationAsyncSubagents.js";
import {
  createOsintLifecycleTools,
  OSINT_COORDINATOR_LIFECYCLE_PROMPT,
} from "../agent/osintLifecycle.js";
import { createChainalysisTools } from "../integrations/chainalysis/tools.js";
import { createFirecrawlTools } from "../integrations/firecrawl/tools.js";
import { createDuneSimTools } from "../integrations/duneSim/tools.js";
import { createKatanaTools } from "../integrations/katana/tools.js";
import { createShodanTools } from "../integrations/shodan/tools.js";
import { createTorResourceTools } from "../integrations/torResources/tools.js";
import { createHudsonRockTools } from "../integrations/hudsonRock/tools.js";
import { createSealIntelTools } from "../integrations/sealIntel/tools.js";
import { createTavilyTools } from "../integrations/tavily/tools.js";

const COCKPIT_SUPERVISOR_PROMPT = `You are the Cockpit investigation supervisor.
${OSINT_COORDINATOR_LIFECYCLE_PROMPT}
- As coordinator, keep **Planning and Direction** explicit when scoping tasks; route **Collection** and **Processing** to tools and sub-agents; ensure **Analysis and Production** separates evidence from inference; shape **Dissemination** for the user; invite **Feedback** on gaps.
- Delegate cross-chain clustering and bridge-style analysis to the async agent \`cross_chain_clustering\` (graph cross_chain_clustering).
- Delegate wallet tracing, transaction narrative, and evidence-style reporting to \`on_chain_investigator\` (graph on_chain_investigator).
- You may call Dune Sim tools directly for quick triage when delegation is unnecessary; prefer specialists for multi-step work.
- Use \`katana_crawl\` only for authorized targets (attack-surface / URL discovery on hosts you may test); it runs the Katana CLI on the backend host.
- Shodan tools (\`shodan_search\`, \`shodan_count\`, \`shodan_host\`) require SHODAN_API_KEY; use only for authorized OSINT and respect Shodan terms — Shodan indexes internet-facing banners, not the Tor network itself.
- Tor ecosystem tools (\`tor_osint_resource_catalog\`, \`dark_web_search_osint_reference\`, \`ahmia_clearnet_search_url\`, \`torproject_github_repositories\`) reference Ahmia/Tor Project/dark.fail and OSINT Combine dark-web methodology responsibly; treat directories and onion lists as untrusted until verified; do not imply Cockpit executes Tor browsing server-side.
- Hudson Rock tools (\`hudsonrock_*\`) query public Infostealer-OSINT endpoints — handle as sensitive; rate limit ~50/10s; use only where policy permits email/username/domain/IP lookups.
- SEAL Intel tools (\`seal_intel_*\`) query Security Alliance OpenCTI web-content status (domain, URL, IPv4/IPv6) when \`SEAL_INTEL_OPENCTI_HOST\`, \`SEAL_INTEL_API_KEY\`, and \`SEAL_INTEL_IDENTITY_ID\` are set. Block/trust/unblock writes require \`SEAL_INTEL_WRITE_ENABLED=true\` and explicit authorization — do not mutate intel feeds casually.
- Firecrawl tools (\`firecrawl_*\`) require \`FIRECRAWL_API_KEY\`; use for scrape/map/crawl/search on **authorized** URLs only; mind credits and site terms — complements Tavily for full-page markdown and structured crawls.
- Never claim legal conclusions; preserve probabilistic framing from workers.`;

/**
 * Entry graph: async subagents point at worker graph ids registered in \`langgraph.json\`.
 * Omit LANGGRAPH_SUBAGENT_BASE_URL for co-deployed Agent Protocol / ASGI routing.
 */
export const graph = createDeepAgent({
  name: "cockpit_supervisor",
  model: createAnalysisChatModel(),
  systemPrompt: `${COCKPIT_SUPERVISOR_PROMPT}\n\n${INVESTIGATION_SUPERVISOR_DELEGATION_HINT}`,
  subagents: investigationAsyncSubagents,
  tools: [
    ...createOsintLifecycleTools(),
    ...createDuneSimTools(),
    ...createTavilyTools(),
    ...createFirecrawlTools(),
    ...createChainalysisTools(),
    ...createKatanaTools(),
    ...createShodanTools(),
    ...createTorResourceTools(),
    ...createHudsonRockTools(),
    ...createSealIntelTools(),
  ],
});
