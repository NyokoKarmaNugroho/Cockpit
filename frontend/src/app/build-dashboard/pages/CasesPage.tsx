import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAnalysis } from "../../../context/AnalysisContext";
import {
  addAnalysisToCase,
  CASE_PRIORITY_VALUES,
  CASE_STATUS_VALUES,
  createCase,
  getCaseDetails,
  listCases,
  removeAnalysisFromCase,
  type CaseDetails,
  type CaseSummary,
  updateCaseDetails,
} from "../../../lib/api";
import { DashboardStubPage } from "../components/DashboardStubPage";
import { DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";

type PanelProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

function Panel({ title, eyebrow, action, children }: PanelProps) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          {eyebrow ? <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p> : null}
          <h2 className="mt-1 text-base font-semibold text-zinc-100">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function statusTone(status: CaseSummary["status"]): string {
  switch (status) {
    case "active":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    case "monitoring":
      return "text-sky-300 bg-sky-500/10 border-sky-500/20";
    case "closed":
      return "text-zinc-300 bg-white/5 border-white/10";
    case "archived":
      return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  }
}

function priorityTone(priority: CaseSummary["priority"]): string {
  switch (priority) {
    case "critical":
      return "text-rose-300 bg-rose-500/10 border-rose-500/20";
    case "high":
      return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    case "medium":
      return "text-sky-300 bg-sky-500/10 border-sky-500/20";
    case "low":
      return "text-zinc-300 bg-white/5 border-white/10";
  }
}

function toSummary(detail: CaseDetails): CaseSummary {
  return {
    id: detail.id,
    workspaceId: detail.workspaceId,
    title: detail.title,
    description: detail.description,
    status: detail.status,
    priority: detail.priority,
    analysisCount: detail.analysisCount,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    lastActivityAt: detail.lastActivityAt,
  };
}

function mergeCaseSummary(list: CaseSummary[], next: CaseSummary): CaseSummary[] {
  const filtered = list.filter((item) => item.id !== next.id);
  return [next, ...filtered].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function CasesPage() {
  const { workspaceId, analyses, isHistoryLoading, refreshAnalyses } = useAnalysis();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [casesLoading, setCasesLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStatus, setCreateStatus] = useState<CaseSummary["status"]>("active");
  const [createPriority, setCreatePriority] = useState<CaseSummary["priority"]>("medium");
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftStatus, setDraftStatus] = useState<CaseSummary["status"]>("active");
  const [draftPriority, setDraftPriority] = useState<CaseSummary["priority"]>("medium");
  const [saveBusy, setSaveBusy] = useState(false);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);

  const loadCases = useCallback(
    async (preferredCaseId?: string | null) => {
      setCasesLoading(true);
      try {
        const items = await listCases(workspaceId);
        setCases(items);
        setPageError(null);
        setSelectedCaseId((current) => {
          if (preferredCaseId === null) return items[0]?.id ?? null;
          if (preferredCaseId) return preferredCaseId;
          if (current && items.some((item) => item.id === current)) return current;
          return items[0]?.id ?? null;
        });
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load cases.");
      } finally {
        setCasesLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    setSelectedCase(null);
    void loadCases(null);
  }, [loadCases]);

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    void getCaseDetails(selectedCaseId)
      .then((item) => {
        if (cancelled) return;
        setSelectedCase(item);
        setCases((current) => mergeCaseSummary(current, toSummary(item)));
        setPageError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setPageError(error instanceof Error ? error.message : "Failed to load case details.");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCaseId]);

  useEffect(() => {
    setDraftTitle(selectedCase?.title ?? "");
    setDraftDescription(selectedCase?.description ?? "");
    setDraftStatus(selectedCase?.status ?? "active");
    setDraftPriority(selectedCase?.priority ?? "medium");
    setSelectedAnalysisId("");
    setDetailMessage(null);
  }, [selectedCase?.id, selectedCase?.title, selectedCase?.description, selectedCase?.status, selectedCase?.priority]);

  const availableAnalyses = useMemo(() => {
    const linkedIds = new Set(selectedCase?.analyses.map((item) => item.id) ?? []);
    return analyses.filter((item) => !linkedIds.has(item.id));
  }, [analyses, selectedCase?.analyses]);

  const stats = useMemo(
    () => ({
      total: cases.length,
      active: cases.filter((item) => item.status === "active" || item.status === "monitoring").length,
      archived: cases.filter((item) => item.status === "archived").length,
      linkedAnalyses: cases.reduce((sum, item) => sum + item.analysisCount, 0),
    }),
    [cases],
  );

  const editorDirty = useMemo(() => {
    if (!selectedCase) return false;
    return (
      draftTitle.trim() !== selectedCase.title.trim() ||
      draftDescription.trim() !== (selectedCase.description ?? "").trim() ||
      draftStatus !== selectedCase.status ||
      draftPriority !== selectedCase.priority
    );
  }, [draftDescription, draftPriority, draftStatus, draftTitle, selectedCase]);

  function applyCaseUpdate(item: CaseDetails) {
    setSelectedCase(item);
    setSelectedCaseId(item.id);
    setCases((current) => mergeCaseSummary(current, toSummary(item)));
  }

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateBusy(true);
    setCreateMessage(null);
    try {
      const created = await createCase({
        workspaceId,
        title: createTitle,
        description: createDescription,
        status: createStatus,
        priority: createPriority,
      });
      applyCaseUpdate(created);
      setCreateTitle("");
      setCreateDescription("");
      setCreateStatus("active");
      setCreatePriority("medium");
      setCreateMessage("Case created.");
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : "Failed to create case.");
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleSaveCase() {
    if (!selectedCase) return;
    setSaveBusy(true);
    setDetailMessage(null);
    try {
      const updated = await updateCaseDetails(selectedCase.id, {
        title: draftTitle,
        description: draftDescription,
        status: draftStatus,
        priority: draftPriority,
      });
      applyCaseUpdate(updated);
      setDetailMessage("Case updated.");
    } catch (error) {
      setDetailMessage(error instanceof Error ? error.message : "Failed to update case.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleAttachAnalysis() {
    if (!selectedCase || !selectedAnalysisId) return;
    setLinkBusy(true);
    setDetailMessage(null);
    try {
      const updated = await addAnalysisToCase(selectedCase.id, selectedAnalysisId);
      applyCaseUpdate(updated);
      setDetailMessage("Analysis linked to case.");
    } catch (error) {
      setDetailMessage(error instanceof Error ? error.message : "Failed to link analysis.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleRemoveAnalysis(analysisId: string) {
    if (!selectedCase) return;
    setLinkBusy(true);
    setDetailMessage(null);
    try {
      const updated = await removeAnalysisFromCase(selectedCase.id, analysisId);
      applyCaseUpdate(updated);
      setDetailMessage("Analysis removed from case.");
    } catch (error) {
      setDetailMessage(error instanceof Error ? error.message : "Failed to remove analysis.");
    } finally {
      setLinkBusy(false);
    }
  }

  return (
    <DashboardStubPage
      title={DASHBOARD_SEGMENT_LABELS.cases}
      description="Group analysis runs into reusable investigation cases, maintain status and priority, and attach evidence from workspace history."
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cases</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active or monitoring</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Archived</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{stats.archived}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Linked analyses</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{stats.linkedAnalyses}</p>
        </div>
      </section>

      {pageError ? <p className="text-sm text-rose-300">{pageError}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <Panel title="Create case" eyebrow="New investigation folder">
            <form className="space-y-3" onSubmit={(event) => void handleCreateCase(event)}>
              <label className="block text-sm text-zinc-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Title</span>
                <input
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  placeholder="Suspicious wallet cluster review"
                />
              </label>
              <label className="block text-sm text-zinc-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Description</span>
                <textarea
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  placeholder="Scope, hypothesis, owners, and next steps."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Status</span>
                  <select
                    value={createStatus}
                    onChange={(event) => setCreateStatus(event.target.value as CaseSummary["status"])}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  >
                    {CASE_STATUS_VALUES.map((status) => (
                      <option key={status} value={status} className="bg-zinc-950 text-zinc-100">
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Priority</span>
                  <select
                    value={createPriority}
                    onChange={(event) => setCreatePriority(event.target.value as CaseSummary["priority"])}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  >
                    {CASE_PRIORITY_VALUES.map((priority) => (
                      <option key={priority} value={priority} className="bg-zinc-950 text-zinc-100">
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={createBusy || !createTitle.trim()}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createBusy ? "Creating…" : "Create case"}
                </button>
                {createMessage ? <p className="text-sm text-zinc-400">{createMessage}</p> : null}
              </div>
            </form>
          </Panel>

          <Panel
            title="Case queue"
            eyebrow="Workspace cases"
            action={
              <button
                type="button"
                onClick={() => void loadCases()}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
              >
                Refresh
              </button>
            }
          >
            {casesLoading ? (
              <p className="text-sm text-zinc-400">Loading cases…</p>
            ) : cases.length ? (
              <div className="space-y-3">
                {cases.map((item) => {
                  const isActive = item.id === selectedCaseId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCaseId(item.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-sky-500/30 bg-sky-500/10"
                          : "border-white/5 bg-black/20 hover:border-white/15 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">Updated {new Date(item.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusTone(item.status)}`}>
                            {item.status}
                          </span>
                          <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${priorityTone(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{item.description ?? "No case notes yet."}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{item.analysisCount} linked analyses</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
                No cases yet for workspace <span className="font-medium text-zinc-200">{workspaceId}</span>. Create one to start grouping runs.
              </div>
            )}
          </Panel>
        </div>

        <Panel
          title={selectedCase ? selectedCase.title : "Case details"}
          eyebrow="Selected case"
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refreshAnalyses()}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
              >
                {isHistoryLoading ? "Refreshing…" : "Refresh history"}
              </button>
            </div>
          }
        >
          {detailLoading ? (
            <p className="text-sm text-zinc-400">Loading case details…</p>
          ) : selectedCase ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${statusTone(selectedCase.status)}`}>
                  {selectedCase.status}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${priorityTone(selectedCase.priority)}`}>
                  {selectedCase.priority}
                </span>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                  {selectedCase.analysisCount} analyses
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-400">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Created</p>
                  <p className="mt-2 text-zinc-100">{new Date(selectedCase.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-400">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Last activity</p>
                  <p className="mt-2 text-zinc-100">{new Date(selectedCase.lastActivityAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Case title</span>
                  <input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  />
                </label>
                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Notes</span>
                  <textarea
                    value={draftDescription}
                    onChange={(event) => setDraftDescription(event.target.value)}
                    className="min-h-32 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-zinc-300">
                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Status</span>
                    <select
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value as CaseSummary["status"])}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                    >
                      {CASE_STATUS_VALUES.map((status) => (
                        <option key={status} value={status} className="bg-zinc-950 text-zinc-100">
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-zinc-300">
                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Priority</span>
                    <select
                      value={draftPriority}
                      onChange={(event) => setDraftPriority(event.target.value as CaseSummary["priority"])}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                    >
                      {CASE_PRIORITY_VALUES.map((priority) => (
                        <option key={priority} value={priority} className="bg-zinc-950 text-zinc-100">
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={saveBusy || !editorDirty || !draftTitle.trim()}
                    onClick={() => void handleSaveCase()}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saveBusy ? "Saving…" : "Save changes"}
                  </button>
                  {detailMessage ? <p className="text-sm text-zinc-400">{detailMessage}</p> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">Linked analyses</p>
                    <p className="mt-1 text-sm text-zinc-400">Attach existing runs from workspace history to this case.</p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                    <select
                      value={selectedAnalysisId}
                      onChange={(event) => setSelectedAnalysisId(event.target.value)}
                      className="min-h-11 min-w-[16rem] rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                    >
                      <option value="" className="bg-zinc-950 text-zinc-100">
                        Select analysis from history
                      </option>
                      {availableAnalyses.map((analysis) => (
                        <option key={analysis.id} value={analysis.id} className="bg-zinc-950 text-zinc-100">
                          {analysis.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={linkBusy || !selectedAnalysisId}
                      onClick={() => void handleAttachAnalysis()}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {linkBusy ? "Updating…" : "Attach analysis"}
                    </button>
                  </div>
                </div>

                {selectedCase.analyses.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedCase.analyses.map((analysis) => (
                      <div key={analysis.id} className="rounded-2xl border border-white/5 bg-zinc-950/60 px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-100">{analysis.title}</p>
                            <p className="mt-1 text-xs text-zinc-500">{new Date(analysis.updatedAt).toLocaleString()}</p>
                          </div>
                          <button
                            type="button"
                            disabled={linkBusy}
                            onClick={() => void handleRemoveAnalysis(analysis.id)}
                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-xs font-medium text-zinc-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-400">No analyses linked yet. Refresh history if you just completed a run.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-zinc-400">
              Select a case from the queue or create a new one to start managing linked analyses.
            </div>
          )}
        </Panel>
      </div>
    </DashboardStubPage>
  );
}
