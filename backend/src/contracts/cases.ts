import type { AnalysisRunSummary } from "./analyses.js";
import type { IsoDateTimeString } from "./common.js";

export type CaseStatus = "active" | "monitoring" | "closed" | "archived";
export type CasePriority = "low" | "medium" | "high" | "critical";

export type CaseSummaryDto = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  status: CaseStatus;
  priority: CasePriority;
  analysisCount: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  lastActivityAt: IsoDateTimeString;
};

export type CaseDto = CaseSummaryDto & {
  analyses: AnalysisRunSummary[];
};

export type CreateCaseRequest = {
  workspaceId: string;
  title: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
};

export type UpdateCaseRequest = {
  title?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
};

export type LinkAnalysisToCaseRequest = {
  analysisId: string;
};
