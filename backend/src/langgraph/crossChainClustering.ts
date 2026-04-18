import { createDeepAgent } from "deepagents";
import { createAnalysisChatModel } from "../agent/model.js";
import { createOsintLifecycleTools } from "../agent/osintLifecycle.js";
import {
  INVESTIGATION_GRAPH_IDS,
  WORKER_SYSTEM_PROMPTS,
} from "../agent/investigationAsyncSubagents.js";
import { createDuneSimTools } from "../integrations/duneSim/tools.js";
import { createHudsonRockTools } from "../integrations/hudsonRock/tools.js";
import { createSealIntelTools } from "../integrations/sealIntel/tools.js";

/**
 * LangGraph deployment id must match `graphId` in async subagent specs
 * (`cross_chain_clustering`).
 */
export const graph = createDeepAgent({
  name: INVESTIGATION_GRAPH_IDS.crossChainClustering,
  model: createAnalysisChatModel(),
  systemPrompt: WORKER_SYSTEM_PROMPTS[INVESTIGATION_GRAPH_IDS.crossChainClustering],
  tools: [
    ...createOsintLifecycleTools(),
    ...createDuneSimTools(),
    ...createHudsonRockTools(),
    ...createSealIntelTools(),
  ],
});
