import type { IsoDateTimeString } from "./common.js";

export type AnalysisStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

/** Short row for lists / bootstrap */
export type AnalysisRunSummary = {
  id: string;
  workspaceId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

/** POST /analyses */
export type CreateAnalysisRequest = {
  workspaceId: string;
  /** User prompt from composer or “New analysis” */
  prompt: string;
  /** Optional explicit title; else derived server-side */
  title?: string;
  /** Client correlation id for idempotency (optional) */
  clientRequestId?: string;
};

export type CreateAnalysisResponse = {
  analysis: AnalysisRunDto;
};

/** GET /analyses/:id */
export type AnalysisRunDto = {
  id: string;
  workspaceId: string;
  title: string;
  prompt: string;
  status: AnalysisStatus;
  /** Final or latest synthesized report (markdown/plain) */
  resultText?: string | null;
  errorMessage?: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  completedAt?: IsoDateTimeString | null;
};

/** GET /analyses?workspaceId=… */
export type ListAnalysesQuery = {
  workspaceId: string;
  cursor?: string;
  limit?: number;
};

/** GET /analyses/:id/stream (SSE) — event union */
export type AnalysisStreamEvent =
  | { type: "status"; status: AnalysisStatus; at: IsoDateTimeString }
  | { type: "token"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; summary: string }
  | { type: "error"; message: string }
  | { type: "done"; analysisId: string };
