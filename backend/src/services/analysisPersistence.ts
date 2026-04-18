import type { AnalysisRunDto, AnalysisRunSummary, AnalysisStreamEvent } from "../contracts/analyses.js";
import type { IsoDateTimeString, Paginated } from "../contracts/common.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";
import { ensureCockpitBootstrap, getDefaultWorkspaceKey } from "./cockpitBootstrap.js";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export type ResolvedWorkspace = {
  workspaceUuid: string;
  userId: string;
  /** String the API returns as workspaceId (external_key or id string). */
  clientWorkspaceKey: string;
};

export async function resolveWorkspace(clientWorkspaceId: string): Promise<ResolvedWorkspace> {
  await ensureCockpitBootstrap();
  const sb = getSupabaseAdmin();

  if (isUuid(clientWorkspaceId)) {
    const { data: ws, error } = await sb
      .from("workspaces")
      .select("id, owner_user_id, external_key")
      .eq("id", clientWorkspaceId)
      .maybeSingle();
    if (error) throw error;
    if (!ws) throw new Error("workspace_not_found");
    return {
      workspaceUuid: ws.id as string,
      userId: ws.owner_user_id as string,
      clientWorkspaceKey: (ws.external_key as string | null) ?? (ws.id as string),
    };
  }

  const { data: ws, error } = await sb
    .from("workspaces")
    .select("id, owner_user_id, external_key")
    .eq("external_key", clientWorkspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!ws) throw new Error("workspace_not_found");
  return {
    workspaceUuid: ws.id as string,
    userId: ws.owner_user_id as string,
    clientWorkspaceKey: clientWorkspaceId,
  };
}

function rowToDto(
  row: {
    id: string;
    workspace_id: string;
    prompt: string;
    title: string | null;
    status: string;
    result_report: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  },
  clientWorkspaceKey: string,
): AnalysisRunDto {
  return {
    id: row.id,
    workspaceId: clientWorkspaceKey,
    title: row.title?.trim() || row.prompt.replace(/\s+/g, " ").trim().slice(0, 120),
    prompt: row.prompt,
    status: row.status as AnalysisRunDto["status"],
    resultText: row.result_report,
    errorMessage: row.error_message,
    createdAt: row.created_at as IsoDateTimeString,
    updatedAt: row.updated_at as IsoDateTimeString,
    completedAt: row.completed_at as IsoDateTimeString | null,
  };
}

export async function dbInsertAnalysis(
  resolved: ResolvedWorkspace,
  row: {
    id: string;
    prompt: string;
    title: string;
    status: string;
    clientRequestId?: string | null;
  },
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("analyses").insert({
    id: row.id,
    workspace_id: resolved.workspaceUuid,
    user_id: resolved.userId,
    prompt: row.prompt,
    title: row.title,
    status: row.status,
    client_request_id: row.clientRequestId ?? null,
  });
  if (error) throw error;
}

export async function dbUpdateAnalysis(
  id: string,
  patch: {
    status?: string;
    result_report?: string | null;
    error_message?: string | null;
    completed_at?: string | null;
    updated_at?: string;
  },
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("analyses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function dbAppendEvent(analysisId: string, event: AnalysisStreamEvent): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("analysis_events").insert({
    analysis_id: analysisId,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
  if (error) console.error("[analysisPersistence] analysis_events insert failed:", error.message);
}

export async function dbGetAnalysis(id: string, fallbackClientWorkspaceKey?: string): Promise<AnalysisRunDto | undefined> {
  await ensureCockpitBootstrap();
  const sb = getSupabaseAdmin();
  const { data: row, error } = await sb.from("analyses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) return undefined;

  const wsId = row.workspace_id as string;
  const { data: ws } = await sb.from("workspaces").select("external_key").eq("id", wsId).maybeSingle();
  const key =
    fallbackClientWorkspaceKey ??
    ((ws?.external_key as string | null) || getDefaultWorkspaceKey());

  return rowToDto(row as Parameters<typeof rowToDto>[0], key);
}

export async function dbListAnalyses(clientWorkspaceId: string): Promise<Paginated<AnalysisRunSummary>> {
  await ensureCockpitBootstrap();
  const resolved = await resolveWorkspace(clientWorkspaceId);
  const sb = getSupabaseAdmin();
  const { data: rows, error } = await sb
    .from("analyses")
    .select("id, title, status, created_at, updated_at, prompt")
    .eq("workspace_id", resolved.workspaceUuid)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const items: AnalysisRunSummary[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    workspaceId: resolved.clientWorkspaceKey,
    title:
      (r.title as string | null)?.trim() ||
      String(r.prompt ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120),
    status: r.status as AnalysisRunSummary["status"],
    createdAt: r.created_at as IsoDateTimeString,
    updatedAt: r.updated_at as IsoDateTimeString,
  }));

  return { items, nextCursor: null };
}

export async function dbFetchEvents(analysisId: string): Promise<AnalysisStreamEvent[]> {
  const sb = getSupabaseAdmin();
  const { data: rows, error } = await sb
    .from("analysis_events")
    .select("payload, type")
    .eq("analysis_id", analysisId)
    .order("ts", { ascending: true });
  if (error) throw error;
  const out: AnalysisStreamEvent[] = [];
  for (const r of rows ?? []) {
    const payload = r.payload as AnalysisStreamEvent;
    if (payload && typeof payload === "object" && "type" in payload) {
      out.push(payload);
    }
  }
  return out;
}
