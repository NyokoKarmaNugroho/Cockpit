const FALLBACK_API_BASE_URL = "http://localhost:8787";
const DEFAULT_WORKSPACE_ID = "cockpit-default-workspace";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL);
export const DEFAULT_ANALYSIS_WORKSPACE_ID = DEFAULT_WORKSPACE_ID;
export const API_FETCH_CREDENTIALS: RequestCredentials = "include";

const HEALTH_PATH = "/health";
const DEFAULT_FETCH_TIMEOUT_MS = 12_000;

export const CASE_STATUS_VALUES = ["active", "monitoring", "closed", "archived"] as const;
export const CASE_PRIORITY_VALUES = ["low", "medium", "high", "critical"] as const;

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export async function checkApiHealth(options?: { timeoutMs?: number }): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  try {
    const response = await fetch(`${API_BASE_URL}${HEALTH_PATH}`, {
      method: "GET",
      credentials: API_FETCH_CREDENTIALS,
      signal: createTimeoutSignal(timeoutMs),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type AnalysisStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AnalysisRunSummary = {
  id: string;
  workspaceId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
};

export type AnalysisRun = AnalysisRunSummary & {
  prompt: string;
  resultText?: string | null;
  errorMessage?: string | null;
  completedAt?: string | null;
};

export type AnalysisStreamEvent =
  | { type: "status"; status: AnalysisStatus; at: string }
  | { type: "token"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; summary: string }
  | { type: "error"; message: string }
  | { type: "done"; analysisId: string };

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug?: string;
  role: string;
  createdAt: string;
};

export type IntegrationStatusItem = {
  id: string;
  label: string;
  category: "model" | "data" | "osint" | "platform";
  configured: boolean;
  envVars: string[];
  note: string;
};

export type CaseStatus = (typeof CASE_STATUS_VALUES)[number];
export type CasePriority = (typeof CASE_PRIORITY_VALUES)[number];

export type CaseSummary = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  status: CaseStatus;
  priority: CasePriority;
  analysisCount: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
};

export type CaseDetails = CaseSummary & {
  analyses: AnalysisRunSummary[];
};

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

export async function createAnalysis(input: {
  prompt: string;
  workspaceId?: string;
  title?: string;
  clientRequestId?: string;
}): Promise<AnalysisRun> {
  const response = await fetch(`${API_BASE_URL}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      workspaceId: input.workspaceId ?? DEFAULT_ANALYSIS_WORKSPACE_ID,
      prompt: input.prompt,
      title: input.title,
      clientRequestId: input.clientRequestId,
    }),
  });

  const payload = (await parseJsonOrThrow(response)) as { analysis: AnalysisRun };
  return payload.analysis;
}

export async function getAnalysis(id: string): Promise<AnalysisRun> {
  const response = await fetch(`${API_BASE_URL}/analyses/${id}`, {
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
  });
  return (await parseJsonOrThrow(response)) as AnalysisRun;
}

export async function listAnalyses(workspaceId = DEFAULT_ANALYSIS_WORKSPACE_ID): Promise<AnalysisRunSummary[]> {
  const params = new URLSearchParams({ workspaceId });
  const response = await fetch(`${API_BASE_URL}/analyses?${params.toString()}`, {
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
  });
  const payload = (await parseJsonOrThrow(response)) as { items: AnalysisRunSummary[] };
  return payload.items;
}

export function createAnalysisStream(analysisId: string): EventSource {
  return new EventSource(`${API_BASE_URL}/analyses/${analysisId}/stream`, {
    withCredentials: true,
  });
}

export async function listIntegrationStatuses(): Promise<IntegrationStatusItem[]> {
  const response = await fetch(`${API_BASE_URL}/settings/integrations`, {
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
  });
  const payload = (await parseJsonOrThrow(response)) as { items: IntegrationStatusItem[] };
  return payload.items;
}

export async function renameWorkspace(workspaceId: string, name: string): Promise<WorkspaceSummary> {
  const response = await fetch(`${API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
    body: JSON.stringify({ name }),
  });
  const payload = (await parseJsonOrThrow(response)) as { workspace: WorkspaceSummary };
  return payload.workspace;
}

export async function listCases(workspaceId = DEFAULT_ANALYSIS_WORKSPACE_ID): Promise<CaseSummary[]> {
  const params = new URLSearchParams({ workspaceId });
  const response = await fetch(`${API_BASE_URL}/cases?${params.toString()}`, {
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
  });
  const payload = (await parseJsonOrThrow(response)) as { items: CaseSummary[] };
  return payload.items;
}

export async function createCase(input: {
  workspaceId?: string;
  title: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
}): Promise<CaseDetails> {
  const response = await fetch(`${API_BASE_URL}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
    body: JSON.stringify({
      workspaceId: input.workspaceId ?? DEFAULT_ANALYSIS_WORKSPACE_ID,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
    }),
  });
  const payload = (await parseJsonOrThrow(response)) as { case: CaseDetails };
  return payload.case;
}

export async function getCaseDetails(caseId: string): Promise<CaseDetails> {
  const response = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}`, {
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
  });
  const payload = (await parseJsonOrThrow(response)) as { case: CaseDetails };
  return payload.case;
}

export async function updateCaseDetails(
  caseId: string,
  patch: Partial<Pick<CaseDetails, "title" | "description" | "status" | "priority">>,
): Promise<CaseDetails> {
  const response = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
    body: JSON.stringify(patch),
  });
  const payload = (await parseJsonOrThrow(response)) as { case: CaseDetails };
  return payload.case;
}

export async function addAnalysisToCase(caseId: string, analysisId: string): Promise<CaseDetails> {
  const response = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
    body: JSON.stringify({ analysisId }),
  });
  const payload = (await parseJsonOrThrow(response)) as { case: CaseDetails };
  return payload.case;
}

export async function removeAnalysisFromCase(caseId: string, analysisId: string): Promise<CaseDetails> {
  const response = await fetch(`${API_BASE_URL}/cases/${encodeURIComponent(caseId)}/analyses/${encodeURIComponent(analysisId)}`, {
    method: "DELETE",
    credentials: API_FETCH_CREDENTIALS,
    signal: createTimeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
  });
  const payload = (await parseJsonOrThrow(response)) as { case: CaseDetails };
  return payload.case;
}
