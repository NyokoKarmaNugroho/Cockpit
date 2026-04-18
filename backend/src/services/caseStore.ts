import type { AnalysisRunDto, AnalysisRunSummary } from "../contracts/analyses.js";
import type {
  CaseDto,
  CasePriority,
  CaseStatus,
  CaseSummaryDto,
  CreateCaseRequest,
  UpdateCaseRequest,
} from "../contracts/cases.js";
import type { IsoDateTimeString, Paginated } from "../contracts/common.js";
import { getSupabaseAdmin, isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";
import { getAnalysisRun } from "./analysisRunStore.js";
import { resolveWorkspace, type ResolvedWorkspace } from "./analysisPersistence.js";

const CASE_STATUS_VALUES = ["active", "monitoring", "closed", "archived"] as const;
const CASE_PRIORITY_VALUES = ["low", "medium", "high", "critical"] as const;

type MemoryCaseRecord = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: CaseStatus;
  priority: CasePriority;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  analysisIds: string[];
};

type DbCaseRow = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

type DbAnalysisRow = {
  id: string;
  title: string | null;
  prompt: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const memoryCases = new Map<string, MemoryCaseRecord>();

function nowIso(): IsoDateTimeString {
  return new Date().toISOString();
}

function isCaseStatus(value: string): value is CaseStatus {
  return (CASE_STATUS_VALUES as readonly string[]).includes(value);
}

function isCasePriority(value: string): value is CasePriority {
  return (CASE_PRIORITY_VALUES as readonly string[]).includes(value);
}

function normalizeTitle(title: string): string {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new Error("case_title_required");
  }
  return normalized;
}

function normalizeDescription(description?: string | null): string | null {
  const normalized = description?.trim() ?? "";
  return normalized ? normalized : null;
}

function normalizeStatus(status?: string): CaseStatus {
  if (!status) return "active";
  if (!isCaseStatus(status)) {
    throw new Error("invalid_case_status");
  }
  return status;
}

function normalizePriority(priority?: string): CasePriority {
  if (!priority) return "medium";
  if (!isCasePriority(priority)) {
    throw new Error("invalid_case_priority");
  }
  return priority;
}

function toAnalysisSummary(run: AnalysisRunDto): AnalysisRunSummary {
  return {
    id: run.id,
    workspaceId: run.workspaceId,
    title: run.title,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

function deriveAnalysisTitle(row: DbAnalysisRow): string {
  const explicit = row.title?.trim();
  if (explicit) return explicit;
  return row.prompt.replace(/\s+/g, " ").trim().slice(0, 120);
}

function maxIso(a: string, b: string): IsoDateTimeString {
  return a > b ? (a as IsoDateTimeString) : (b as IsoDateTimeString);
}

function buildCaseSummary(base: {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: CaseStatus;
  priority: CasePriority;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}, analyses: AnalysisRunSummary[]): CaseSummaryDto {
  const lastActivityAt = analyses.reduce((latest, analysis) => maxIso(latest, analysis.updatedAt), base.updatedAt);
  return {
    id: base.id,
    workspaceId: base.workspaceId,
    title: base.title,
    description: base.description,
    status: base.status,
    priority: base.priority,
    analysisCount: analyses.length,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    lastActivityAt,
  };
}

async function buildMemoryCaseDto(record: MemoryCaseRecord): Promise<CaseDto> {
  const analyses = (
    await Promise.all(
      record.analysisIds.map(async (analysisId) => {
        const run = await getAnalysisRun(analysisId);
        if (!run) return null;
        return toAnalysisSummary(run);
      }),
    )
  )
    .filter((item): item is AnalysisRunSummary => item !== null)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return {
    ...buildCaseSummary(
      {
        id: record.id,
        workspaceId: record.workspaceId,
        title: record.title,
        description: record.description,
        status: record.status,
        priority: record.priority,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      analyses,
    ),
    analyses,
  };
}

async function getMemoryCase(id: string): Promise<CaseDto | undefined> {
  const record = memoryCases.get(id);
  if (!record) return undefined;
  return buildMemoryCaseDto(record);
}

async function listCasesMemory(workspaceId: string): Promise<Paginated<CaseSummaryDto>> {
  const items = (
    await Promise.all(
      [...memoryCases.values()]
        .filter((record) => record.workspaceId === workspaceId)
        .map(async (record) => {
          const detail = await buildMemoryCaseDto(record);
          const { analyses: _analyses, ...summary } = detail;
          return summary;
        }),
    )
  ).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return { items, nextCursor: null, total: items.length };
}

function getMemoryCaseRecord(id: string): MemoryCaseRecord {
  const record = memoryCases.get(id);
  if (!record) {
    throw new Error("case_not_found");
  }
  return record;
}

async function createCaseMemory(input: CreateCaseRequest): Promise<CaseDto> {
  const ts = nowIso();
  const record: MemoryCaseRecord = {
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    title: normalizeTitle(input.title),
    description: normalizeDescription(input.description),
    status: normalizeStatus(input.status),
    priority: normalizePriority(input.priority),
    createdAt: ts,
    updatedAt: ts,
    analysisIds: [],
  };
  memoryCases.set(record.id, record);
  return buildMemoryCaseDto(record);
}

async function updateCaseMemory(id: string, patch: UpdateCaseRequest): Promise<CaseDto> {
  const record = getMemoryCaseRecord(id);
  if (patch.title !== undefined) record.title = normalizeTitle(patch.title);
  if (patch.description !== undefined) record.description = normalizeDescription(patch.description);
  if (patch.status !== undefined) record.status = normalizeStatus(patch.status);
  if (patch.priority !== undefined) record.priority = normalizePriority(patch.priority);
  record.updatedAt = nowIso();
  return buildMemoryCaseDto(record);
}

async function addAnalysisToCaseMemory(caseId: string, analysisId: string): Promise<CaseDto> {
  const record = getMemoryCaseRecord(caseId);
  const run = await getAnalysisRun(analysisId);
  if (!run) {
    throw new Error("analysis_not_found");
  }
  if (run.workspaceId !== record.workspaceId) {
    throw new Error("analysis_workspace_mismatch");
  }
  if (!record.analysisIds.includes(analysisId)) {
    record.analysisIds.push(analysisId);
    record.updatedAt = nowIso();
  }
  return buildMemoryCaseDto(record);
}

async function removeAnalysisFromCaseMemory(caseId: string, analysisId: string): Promise<CaseDto> {
  const record = getMemoryCaseRecord(caseId);
  const nextIds = record.analysisIds.filter((id) => id !== analysisId);
  if (nextIds.length !== record.analysisIds.length) {
    record.analysisIds = nextIds;
    record.updatedAt = nowIso();
  }
  return buildMemoryCaseDto(record);
}

async function dbLoadWorkspaceKey(workspaceUuid: string): Promise<string> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("workspaces").select("id, external_key").eq("id", workspaceUuid).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("workspace_not_found");
  return ((data.external_key as string | null) ?? (data.id as string)) as string;
}

async function dbLoadAnalyses(analysisIds: string[], workspaceId: string): Promise<AnalysisRunSummary[]> {
  if (!analysisIds.length) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("analyses")
    .select("id, title, prompt, status, created_at, updated_at")
    .in("id", analysisIds);
  if (error) throw error;

  const summaryById = new Map<string, AnalysisRunSummary>();
  for (const row of data ?? []) {
    const item = row as DbAnalysisRow;
    summaryById.set(item.id, {
      id: item.id,
      workspaceId,
      title: deriveAnalysisTitle(item),
      status: item.status as AnalysisRunSummary["status"],
      createdAt: item.created_at as IsoDateTimeString,
      updatedAt: item.updated_at as IsoDateTimeString,
    });
  }

  return analysisIds
    .map((analysisId) => summaryById.get(analysisId) ?? null)
    .filter((item): item is AnalysisRunSummary => item !== null)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

async function dbLoadCaseAnalysisIds(caseId: string): Promise<string[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("case_analysis_links")
    .select("analysis_id, added_at")
    .eq("case_id", caseId)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => String(row.analysis_id));
}

async function dbBuildCaseDto(row: DbCaseRow, workspaceId: string): Promise<CaseDto> {
  const analysisIds = await dbLoadCaseAnalysisIds(row.id);
  const analyses = await dbLoadAnalyses(analysisIds, workspaceId);
  return {
    ...buildCaseSummary(
      {
        id: row.id,
        workspaceId,
        title: row.title,
        description: row.description,
        status: normalizeStatus(row.status),
        priority: normalizePriority(row.priority),
        createdAt: row.created_at as IsoDateTimeString,
        updatedAt: row.updated_at as IsoDateTimeString,
      },
      analyses,
    ),
    analyses,
  };
}

async function dbGetCaseRow(caseId: string): Promise<DbCaseRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("cases").select("*").eq("id", caseId).maybeSingle();
  if (error) throw error;
  return (data as DbCaseRow | null) ?? null;
}

async function dbGetCaseResolved(caseId: string): Promise<{ row: DbCaseRow; workspaceId: string }> {
  const row = await dbGetCaseRow(caseId);
  if (!row) {
    throw new Error("case_not_found");
  }
  const workspaceId = await dbLoadWorkspaceKey(row.workspace_id);
  return { row, workspaceId };
}

async function createCaseDb(input: CreateCaseRequest): Promise<CaseDto> {
  const resolved = await resolveWorkspace(input.workspaceId);
  const sb = getSupabaseAdmin();
  const payload = {
    workspace_id: resolved.workspaceUuid,
    user_id: resolved.userId,
    title: normalizeTitle(input.title),
    description: normalizeDescription(input.description),
    status: normalizeStatus(input.status),
    priority: normalizePriority(input.priority),
  };
  const { data, error } = await sb.from("cases").insert(payload).select("*").single();
  if (error) throw error;
  return dbBuildCaseDto(data as DbCaseRow, resolved.clientWorkspaceKey);
}

async function listCasesDb(workspaceId: string): Promise<Paginated<CaseSummaryDto>> {
  const resolved = await resolveWorkspace(workspaceId);
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("cases")
    .select("*")
    .eq("workspace_id", resolved.workspaceUuid)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const items = await Promise.all(
    (data as DbCaseRow[] | null | undefined)?.map(async (row) => {
      const detail = await dbBuildCaseDto(row, resolved.clientWorkspaceKey);
      const { analyses: _analyses, ...summary } = detail;
      return summary;
    }) ?? [],
  );

  return { items, nextCursor: null, total: items.length };
}

async function getCaseDb(caseId: string): Promise<CaseDto | undefined> {
  const row = await dbGetCaseRow(caseId);
  if (!row) return undefined;
  const workspaceId = await dbLoadWorkspaceKey(row.workspace_id);
  return dbBuildCaseDto(row, workspaceId);
}

async function updateCaseDb(caseId: string, patch: UpdateCaseRequest): Promise<CaseDto> {
  const existing = await dbGetCaseResolved(caseId);
  const nextPatch: Record<string, string | null> = { updated_at: nowIso() };
  if (patch.title !== undefined) nextPatch.title = normalizeTitle(patch.title);
  if (patch.description !== undefined) nextPatch.description = normalizeDescription(patch.description);
  if (patch.status !== undefined) nextPatch.status = normalizeStatus(patch.status);
  if (patch.priority !== undefined) nextPatch.priority = normalizePriority(patch.priority);

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("cases").update(nextPatch).eq("id", caseId).select("*").single();
  if (error) throw error;
  return dbBuildCaseDto(data as DbCaseRow, existing.workspaceId);
}

async function dbEnsureAnalysisBelongsToWorkspace(analysisId: string, resolved: ResolvedWorkspace): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("analyses").select("id, workspace_id").eq("id", analysisId).maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("analysis_not_found");
  }
  if ((data.workspace_id as string) !== resolved.workspaceUuid) {
    throw new Error("analysis_workspace_mismatch");
  }
}

async function addAnalysisToCaseDb(caseId: string, analysisId: string): Promise<CaseDto> {
  const existing = await dbGetCaseResolved(caseId);
  const resolved = await resolveWorkspace(existing.workspaceId);
  await dbEnsureAnalysisBelongsToWorkspace(analysisId, resolved);

  const sb = getSupabaseAdmin();
  const { data: link } = await sb
    .from("case_analysis_links")
    .select("case_id")
    .eq("case_id", caseId)
    .eq("analysis_id", analysisId)
    .maybeSingle();
  if (!link) {
    const { error: insertError } = await sb.from("case_analysis_links").insert({ case_id: caseId, analysis_id: analysisId });
    if (insertError) throw insertError;
    const updatedAt = nowIso();
    const { error: updateError } = await sb.from("cases").update({ updated_at: updatedAt }).eq("id", caseId);
    if (updateError) throw updateError;
  }

  const refreshed = await getCaseDb(caseId);
  if (!refreshed) throw new Error("case_not_found");
  return refreshed;
}

async function removeAnalysisFromCaseDb(caseId: string, analysisId: string): Promise<CaseDto> {
  const existing = await dbGetCaseResolved(caseId);
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("case_analysis_links").delete().eq("case_id", caseId).eq("analysis_id", analysisId);
  if (error) throw error;
  const { error: updateError } = await sb.from("cases").update({ updated_at: nowIso() }).eq("id", caseId);
  if (updateError) throw updateError;
  return dbBuildCaseDto(await dbGetCaseRow(caseId).then((row) => {
    if (!row) throw new Error("case_not_found");
    return row;
  }), existing.workspaceId);
}

export async function listCases(workspaceId: string): Promise<Paginated<CaseSummaryDto>> {
  if (!isSupabaseAnalysesEnabled()) {
    return listCasesMemory(workspaceId);
  }
  return listCasesDb(workspaceId);
}

export async function getCase(caseId: string): Promise<CaseDto | undefined> {
  if (!isSupabaseAnalysesEnabled()) {
    return getMemoryCase(caseId);
  }
  return getCaseDb(caseId);
}

export async function createCase(input: CreateCaseRequest): Promise<CaseDto> {
  if (!isSupabaseAnalysesEnabled()) {
    return createCaseMemory(input);
  }
  return createCaseDb(input);
}

export async function updateCase(caseId: string, patch: UpdateCaseRequest): Promise<CaseDto> {
  if (!isSupabaseAnalysesEnabled()) {
    return updateCaseMemory(caseId, patch);
  }
  return updateCaseDb(caseId, patch);
}

export async function addAnalysisToCase(caseId: string, analysisId: string): Promise<CaseDto> {
  if (!isSupabaseAnalysesEnabled()) {
    return addAnalysisToCaseMemory(caseId, analysisId);
  }
  return addAnalysisToCaseDb(caseId, analysisId);
}

export async function removeAnalysisFromCase(caseId: string, analysisId: string): Promise<CaseDto> {
  if (!isSupabaseAnalysesEnabled()) {
    return removeAnalysisFromCaseMemory(caseId, analysisId);
  }
  return removeAnalysisFromCaseDb(caseId, analysisId);
}
