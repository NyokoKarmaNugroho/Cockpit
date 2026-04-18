import type {
  AnalysisRunDto,
  AnalysisRunSummary,
  AnalysisStreamEvent,
  CreateAnalysisRequest,
} from "../contracts/analyses.js";
import type { IsoDateTimeString, Paginated } from "../contracts/common.js";
import { runAnalysis } from "../agent/runAnalysis.js";
import { isSupabaseAnalysesEnabled } from "../lib/supabaseAdmin.js";
import {
  dbAppendEvent,
  dbFetchEvents,
  dbGetAnalysis,
  dbInsertAnalysis,
  dbListAnalyses,
  dbUpdateAnalysis,
  resolveWorkspace,
} from "./analysisPersistence.js";

function nowIso(): IsoDateTimeString {
  return new Date().toISOString();
}

type RunRecord = {
  dto: AnalysisRunDto;
  eventLog: AnalysisStreamEvent[];
  listeners: Set<(e: AnalysisStreamEvent) => void>;
  started: boolean;
};

const runs = new Map<string, RunRecord>();

function deriveTitle(prompt: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  const oneLine = prompt.replace(/\s+/g, " ").trim();
  return oneLine.length <= 120 ? oneLine : `${oneLine.slice(0, 117)}…`;
}

function pushEvent(record: RunRecord, event: AnalysisStreamEvent): void {
  record.eventLog.push(event);
  for (const listener of record.listeners) {
    listener(event);
  }
  if (isSupabaseAnalysesEnabled()) {
    void dbAppendEvent(record.dto.id, event);
  }
}

function createMemoryRecord(dto: AnalysisRunDto): RunRecord {
  return {
    dto,
    eventLog: [],
    listeners: new Set(),
    started: false,
  };
}

export async function createAnalysisRun(body: CreateAnalysisRequest): Promise<AnalysisRunDto> {
  if (!isSupabaseAnalysesEnabled()) {
    return createAnalysisRunMemory(body);
  }

  const resolved = await resolveWorkspace(body.workspaceId);
  const id = crypto.randomUUID();
  const ts = nowIso();
  const title = deriveTitle(body.prompt, body.title);
  const dto: AnalysisRunDto = {
    id,
    workspaceId: resolved.clientWorkspaceKey,
    title,
    prompt: body.prompt,
    status: "queued",
    resultText: null,
    errorMessage: null,
    createdAt: ts,
    updatedAt: ts,
    completedAt: null,
  };

  await dbInsertAnalysis(resolved, {
    id,
    prompt: body.prompt,
    title,
    status: "queued",
    clientRequestId: body.clientRequestId ?? null,
  });

  const record = createMemoryRecord(dto);
  runs.set(id, record);

  queueMicrotask(() => {
    void processRun(id);
  });

  return { ...dto };
}

function createAnalysisRunMemory(body: CreateAnalysisRequest): AnalysisRunDto {
  const id = crypto.randomUUID();
  const ts = nowIso();
  const dto: AnalysisRunDto = {
    id,
    workspaceId: body.workspaceId,
    title: deriveTitle(body.prompt, body.title),
    prompt: body.prompt,
    status: "queued",
    resultText: null,
    errorMessage: null,
    createdAt: ts,
    updatedAt: ts,
    completedAt: null,
  };

  const record = createMemoryRecord(dto);
  runs.set(id, record);

  queueMicrotask(() => {
    void processRun(id);
  });

  return { ...dto };
}

async function processRun(id: string): Promise<void> {
  const record = runs.get(id);
  if (!record || record.started) return;
  record.started = true;

  const { dto } = record;
  dto.status = "running";
  dto.updatedAt = nowIso();
  pushEvent(record, { type: "status", status: "running", at: nowIso() });

  if (isSupabaseAnalysesEnabled()) {
    try {
      await dbUpdateAnalysis(id, { status: "running", updated_at: dto.updatedAt });
    } catch (e) {
      console.error("[analysisRunStore] dbUpdateAnalysis running failed:", e);
    }
  }

  try {
    const text = await runAnalysis({
      analysisId: id,
      prompt: dto.prompt,
      emit: (e) => pushEvent(record, e),
    });
    dto.resultText = text;
    dto.status = "completed";
    dto.errorMessage = null;
    dto.completedAt = nowIso();
    dto.updatedAt = nowIso();

    if (isSupabaseAnalysesEnabled()) {
      await dbUpdateAnalysis(id, {
        status: "completed",
        result_report: text,
        error_message: null,
        completed_at: dto.completedAt,
        updated_at: dto.updatedAt,
      });
    }
  } catch (err) {
    dto.status = "failed";
    dto.errorMessage = err instanceof Error ? err.message : "Analysis failed";
    dto.completedAt = nowIso();
    dto.updatedAt = nowIso();

    if (isSupabaseAnalysesEnabled()) {
      try {
        await dbUpdateAnalysis(id, {
          status: "failed",
          error_message: dto.errorMessage,
          completed_at: dto.completedAt,
          updated_at: dto.updatedAt,
        });
      } catch (e) {
        console.error("[analysisRunStore] dbUpdateAnalysis failed failed:", e);
      }
    }
  }
}

export async function getAnalysisRun(id: string): Promise<AnalysisRunDto | undefined> {
  const r = runs.get(id);
  if (r) return { ...r.dto };
  if (isSupabaseAnalysesEnabled()) {
    try {
      return (await dbGetAnalysis(id)) ?? undefined;
    } catch (e) {
      console.error("[analysisRunStore] dbGetAnalysis:", e);
      return undefined;
    }
  }
  return undefined;
}

export async function listAnalysisRuns(workspaceId: string): Promise<Paginated<AnalysisRunSummary>> {
  if (!isSupabaseAnalysesEnabled()) {
    const items: AnalysisRunSummary[] = [];
    for (const { dto } of runs.values()) {
      if (dto.workspaceId !== workspaceId) continue;
      items.push({
        id: dto.id,
        workspaceId: dto.workspaceId,
        title: dto.title,
        status: dto.status,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      });
    }
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { items, nextCursor: null };
  }

  try {
    return await dbListAnalyses(workspaceId);
  } catch (e) {
    console.error("[analysisRunStore] dbListAnalyses:", e);
    throw e;
  }
}

export async function subscribeAnalysisEvents(
  id: string,
  onEvent: (e: AnalysisStreamEvent) => void,
): Promise<(() => void) | null> {
  const record = runs.get(id);
  if (record) {
    const handler = (e: AnalysisStreamEvent) => {
      onEvent(e);
    };
    record.listeners.add(handler);
    const unsub = () => {
      record.listeners.delete(handler);
    };
    for (const e of record.eventLog) {
      onEvent(e);
    }
    return unsub;
  }

  if (!isSupabaseAnalysesEnabled()) return null;

  try {
    const row = await dbGetAnalysis(id);
    if (!row) return null;
    const events = await dbFetchEvents(id);
    for (const e of events) {
      onEvent(e);
    }
    return () => {};
  } catch (e) {
    console.error("[analysisRunStore] subscribeAnalysisEvents db replay:", e);
    return null;
  }
}
