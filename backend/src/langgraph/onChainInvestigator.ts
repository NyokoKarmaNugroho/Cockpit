import { createDeepAgent } from "deepagents";
import { createAnalysisChatModel } from "../agent/model.js";
import { createOsintLifecycleTools } from "../agent/osintLifecycle.js";
import {
  INVESTIGATION_GRAPH_IDS,
  WORKER_SYSTEM_PROMPTS,
} from "../agent/investigationAsyncSubagents.js";
import { createFirecrawlTools } from "../integrations/firecrawl/tools.js";
import { createDuneSimTools } from "../integrations/duneSim/tools.js";
import { createHudsonRockTools } from "../integrations/hudsonRock/tools.js";
import { createKatanaTools } from "../integrations/katana/tools.js";
import { createShodanTools } from "../integrations/shodan/tools.js";
import { createSealIntelTools } from "../integrations/sealIntel/tools.js";
import { createTorResourceTools } from "../integrations/torResources/tools.js";

/**
 * LangGraph deployment id must match `graphId` in async subagent specs
 * (`on_chain_investigator`).
 */
export const graph = createDeepAgent({
  name: INVESTIGATION_GRAPH_IDS.onChainInvestigator,
  model: createAnalysisChatModel(),
  systemPrompt: WORKER_SYSTEM_PROMPTS[INVESTIGATION_GRAPH_IDS.onChainInvestigator],
  tools: [
    ...createOsintLifecycleTools(),
    ...createDuneSimTools(),
    ...createFirecrawlTools(),
    ...createKatanaTools(),
    ...createShodanTools(),
    ...createTorResourceTools(),
    ...createHudsonRockTools(),
    ...createSealIntelTools(),
  ],
});
