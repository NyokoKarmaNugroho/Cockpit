import type { UserDto } from "./user.js";
import type { WorkspaceDto } from "./workspace.js";
import type { AnalysisRunSummary } from "./analyses.js";

/** GET /dashboard/bootstrap — single round-trip after wallet session exists */
export type DashboardBootstrapResponse = {
  user: UserDto;
  workspace: WorkspaceDto;
  /** Feature flags / plan gates for UI */
  flags: {
    composerEnabled: boolean;
    jupiterProxyEnabled: boolean;
    liveChainQueriesEnabled: boolean;
  };
  /** Plan label for display; optional until billing exists */
  plan?: {
    id: string;
    label: string;
    creditsRemaining?: number | null;
  };
  recentAnalyses: AnalysisRunSummary[];
};
