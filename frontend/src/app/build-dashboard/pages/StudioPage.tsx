import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAnalysis } from "../../../context/AnalysisContext";
import { useSession } from "../../../context/SessionContext";
import type { AnalysisRunSummary } from "../../../lib/api";
import { DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";
import { IconArrowRight, IconSparkles, IconStudio } from "../DashboardIcons";

type JourneyTemplate = {
  id: string;
  label: string;
  tagline: string;
  summary: string;
  sourceHint: string;
  outputs: string[];
  defaultSubject: string;
  defaultObjective: string;
  suggestedDeliverable: string;
  promptLead: string;
};

type CardProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

const JOURNEYS: JourneyTemplate[] = [
  {
    id: "wallet-triage",
    label: "Wallet risk triage",
    tagline: "Produce a case-ready briefing for an address, wallet, or cluster.",
    summary:
      "Use this workflow for first-pass scoping when an investigator needs risk posture, meaningful counterparties, and the fastest next pivots.",
    sourceHint: "On-chain history, exposure signals, labels, recent counterparties, and behavioral anomalies",
    outputs: ["Risk posture", "Priority counterparties", "Evidence gaps"],
    defaultSubject: "Suspicious Solana wallet, address cluster, or treasury wallet",
    defaultObjective:
      "Explain the most relevant risk indicators, identify the transfers or counterparties that warrant immediate review, and outline the next investigative pivots.",
    suggestedDeliverable: "Case-ready briefing with risk posture, supporting indicators, and follow-up actions.",
    promptLead: "Prepare a wallet risk triage brief for the subject below.",
  },
  {
    id: "entity-profile",
    label: "Entity dossier",
    tagline: "Assemble an investigator-grade profile for a person, company, or protocol.",
    summary:
      "Use this workflow when you need a structured dossier that consolidates public footprint, related entities, and confidence-qualified observations.",
    sourceHint: "Corporate footprint, public web presence, linked identities, products, counterparties, and associated entities",
    outputs: ["Executive profile", "Relationship map", "Confidence notes"],
    defaultSubject: "Exchange, company, protocol, operating entity, or named individual",
    defaultObjective:
      "Build an evidence-led entity profile that highlights the most material relationships, products, exposure context, and verification gaps.",
    suggestedDeliverable: "Executive OSINT dossier with confidence statements and recommended validation steps.",
    promptLead: "Assemble an investigator-grade entity dossier for the subject below.",
  },
  {
    id: "incident-response",
    label: "Incident assessment",
    tagline: "Turn a raw alert into an operational response brief.",
    summary:
      "Use this workflow when a lead comes from a phishing report, breach, malware signal, fraud claim, or any developing incident that needs immediate framing.",
    sourceHint: "Threat indicators, public incident reporting, leaked context, infrastructure clues, and victim statements",
    outputs: ["Situation brief", "Working hypotheses", "Immediate actions"],
    defaultSubject: "Domain, wallet, handle, or operation associated with a new alert",
    defaultObjective:
      "Frame the incident, rank the most plausible investigative hypotheses, and prioritise the actions that should happen in the next hour.",
    suggestedDeliverable: "Operational response brief covering immediate, near-term, and follow-up actions.",
    promptLead: "Prepare an incident assessment brief for the lead below.",
  },
  {
    id: "network-mapping",
    label: "Network mapping",
    tagline: "Understand how wallets, entities, and operators connect across a lead set.",
    summary:
      "Use this workflow when the main objective is to surface relationships, repeated patterns, and high-value nodes worth tracing in more depth.",
    sourceHint: "Entities, wallets, aliases, organisations, repeated flows, and relationship patterns",
    outputs: ["Network narrative", "Core nodes", "Tracer pivots"],
    defaultSubject: "Wallet group, threat actor alias, suspicious ecosystem, or investigation cluster",
    defaultObjective:
      "Describe the strongest relationships, recurring patterns, and which entities or nodes should be prioritised for follow-up tracing.",
    suggestedDeliverable: "Relationship-led briefing with node priorities for deeper graph analysis.",
    promptLead: "Map the relationship network for the target below.",
  },
];

function statusTone(status: string): string {
  switch (status) {
    case "completed":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    case "failed":
      return "text-rose-300 bg-rose-500/10 border-rose-500/20";
    case "running":
      return "text-sky-300 bg-sky-500/10 border-sky-500/20";
    default:
      return "text-zinc-300 bg-white/5 border-white/10";
  }
}

function connectionTone(status: "checking" | "ready" | "unreachable"): string {
  switch (status) {
    case "ready":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    case "unreachable":
      return "text-rose-300 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-zinc-300 bg-white/5 border-white/10";
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function StudioCard({ title, eyebrow, action, children }: CardProps) {
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

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-2 text-sm text-zinc-400">{hint}</p>
    </div>
  );
}

function JourneyButton({
  journey,
  selected,
  onSelect,
}: {
  journey: JourneyTemplate;
  selected: boolean;
  onSelect: (template: JourneyTemplate) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(journey)}
      className={`rounded-3xl border p-4 text-left transition ${
        selected
          ? "border-sky-400/40 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]"
          : "border-white/8 bg-black/15 hover:border-white/15 hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{journey.label}</p>
          <p className="mt-1 text-sm text-zinc-400">{journey.tagline}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          Workflow
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{journey.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {journey.outputs.map((item) => (
          <span key={item} className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
            {item}
          </span>
        ))}
      </div>
    </button>
  );
}

function RecentRunItem({ item }: { item: AnalysisRunSummary }) {
  return (
    <li className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {relativeTime(item.updatedAt)} · {new Date(item.updatedAt).toLocaleString()}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusTone(item.status)}`}>
          {item.status}
        </span>
      </div>
    </li>
  );
}

export function StudioPage() {
  const {
    workspaceId,
    analyses,
    activeAnalysis,
    submitPrompt,
    isSubmitting,
    isHistoryLoading,
    apiConnectionStatus,
    apiBaseUrl,
    clearActiveAnalysis,
  } = useAnalysis();
  const { user, bootstrap } = useSession();

  const [selectedJourneyId, setSelectedJourneyId] = useState(JOURNEYS[0]?.id ?? "wallet-triage");
  const [subject, setSubject] = useState(JOURNEYS[0]?.defaultSubject ?? "");
  const [objective, setObjective] = useState(JOURNEYS[0]?.defaultObjective ?? "");
  const [deliverable, setDeliverable] = useState(JOURNEYS[0]?.suggestedDeliverable ?? "");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  const selectedJourney = useMemo(
    () => JOURNEYS.find((item) => item.id === selectedJourneyId) ?? JOURNEYS[0],
    [selectedJourneyId],
  );

  const completedRuns = useMemo(() => analyses.filter((item) => item.status === "completed").length, [analyses]);
  const liveToolCount = activeAnalysis?.toolActivity.length ?? 0;
  const canLaunch = apiConnectionStatus === "ready" && !isSubmitting && subject.trim().length > 0;

  const promptPreview = useMemo(() => {
    const cleanSubject = subject.trim();
    const cleanObjective = objective.trim() || selectedJourney.defaultObjective;
    const cleanDeliverable = deliverable.trim() || selectedJourney.suggestedDeliverable;

    return [
      selectedJourney.promptLead,
      "",
      `Subject under review: ${cleanSubject || "[describe the wallet, entity, domain, operator, or cluster]"}`,
      `Collection objective: ${cleanObjective}`,
      `Evidence focus: ${selectedJourney.sourceHint}`,
      `Requested deliverable: ${cleanDeliverable}`,
      "",
      "Please return:",
      "1. An executive summary suitable for investigators or compliance stakeholders.",
      "2. The strongest observable signals or evidence candidates.",
      "3. Key assumptions, confidence gaps, and items requiring verification.",
      "4. Recommended next pivots using cases, tracer, and follow-up OSINT.",
    ].join("\n");
  }, [deliverable, objective, selectedJourney, subject]);

  function handleSelectJourney(next: JourneyTemplate) {
    setSelectedJourneyId(next.id);
    setSubject(next.defaultSubject);
    setObjective(next.defaultObjective);
    setDeliverable(next.suggestedDeliverable);
    setCopyMessage(null);
    setLaunchMessage(null);
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(promptPreview);
      setCopyMessage("Briefing prompt copied.");
    } catch {
      setCopyMessage("Unable to copy the briefing prompt from this browser.");
    }
  }

  async function handleRunPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canLaunch) return;

    try {
      await submitPrompt(promptPreview);
      setLaunchMessage("Briefing launched. Monitor the execution feed below.");
    } catch (error) {
      setLaunchMessage(error instanceof Error ? error.message : "Failed to launch briefing.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%),rgba(24,24,27,0.72)] p-6 shadow-[0_20px_80px_-32px_rgba(0,0,0,0.85)] sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
              <IconStudio className="h-4 w-4 text-sky-300" aria-hidden />
              {DASHBOARD_SEGMENT_LABELS.studio}
            </div>
            <h1 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Convert raw leads into case-ready intelligence briefs.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Select an investigative workflow, define the subject and collection objective, then let Cockpit prepare an AI briefing with live execution telemetry, saved outputs, and direct handoff paths into cases or tracer.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-300">
              <span className={`rounded-full border px-2.5 py-1 ${connectionTone(apiConnectionStatus)}`}>
                {apiConnectionStatus === "ready"
                  ? "API operational"
                  : apiConnectionStatus === "checking"
                    ? "Checking API"
                    : "API unavailable"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                Workspace {bootstrap?.workspace.name ?? workspaceId}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {user ? "Session-backed workspace" : "Anonymous workspace"}
              </span>
            </div>
          </div>

          <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
            <MetricCard label="Workflows" value={String(JOURNEYS.length)} hint="Structured starts for common investigative scenarios." />
            <MetricCard label="Saved runs" value={String(analyses.length)} hint={isHistoryLoading ? "Refreshing stored outputs…" : `${completedRuns} completed analyses on record.`} />
            <MetricCard label="Live telemetry" value={String(liveToolCount)} hint={activeAnalysis ? "The active run is emitting execution updates." : "No active execution stream."} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <StudioCard title="Select an investigative workflow" eyebrow="Workflow selection">
          <div className="grid gap-3 md:grid-cols-2">
            {JOURNEYS.map((journey) => (
              <JourneyButton
                key={journey.id}
                journey={journey}
                selected={journey.id === selectedJourney.id}
                onSelect={handleSelectJourney}
              />
            ))}
          </div>
        </StudioCard>

        <StudioCard title="How investigators use Studio" eyebrow="Operating model">
          <ol className="space-y-3">
            {[
              "Start from a wallet, entity, domain, alias, or incident signal that requires rapid scoping.",
              "Choose the workflow that matches the operational question so the model can frame evidence and outputs correctly.",
              "Review the execution feed and retain the strongest briefing in History for later reference.",
              "Promote validated findings into Cases or move to Tracer when the next step is graph-based follow-up.",
            ].map((item, index) => (
              <li key={item} className="flex gap-3 rounded-2xl border border-white/5 bg-black/20 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-zinc-200">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed text-zinc-300">{item}</p>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-dashed border-sky-400/25 bg-sky-500/5 p-4 text-sm text-sky-100/90">
            Studio is optimised for first-pass scoping and briefing. Use <Link to="/build-dashboard/history" className="font-medium underline decoration-sky-500/50 underline-offset-2">History</Link>, <Link to="/build-dashboard/cases" className="font-medium underline decoration-sky-500/50 underline-offset-2">Cases</Link>, and <Link to="/build-dashboard/investigations" className="font-medium underline decoration-sky-500/50 underline-offset-2">Tracer</Link> to convert that brief into a managed investigative workflow.
          </div>
        </StudioCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <StudioCard title="Compose the intelligence brief" eyebrow="Briefing setup">
          <form className="space-y-4" onSubmit={(event) => void handleRunPrompt(event)}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-zinc-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Subject under review</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Wallet, entity, domain, alias, operator…"
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
              <label className="block text-sm text-zinc-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Requested deliverable</span>
                <input
                  value={deliverable}
                  onChange={(event) => setDeliverable(event.target.value)}
                  placeholder="Executive brief, case memo, validation checklist…"
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
                />
              </label>
            </div>

            <label className="block text-sm text-zinc-300">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">Collection objective</span>
              <textarea
                rows={4}
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                placeholder="What should the model determine first, and what decision should this brief support?"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-relaxed text-zinc-100 outline-none transition focus:border-zinc-500"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {selectedJourney.outputs.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {item}
                </span>
              ))}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                Evidence focus: {selectedJourney.sourceHint}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canLaunch}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-950" />
                ) : (
                  <IconSparkles className="h-4 w-4" aria-hidden />
                )}
                {isSubmitting ? "Launching…" : "Run briefing"}
              </button>
              <button
                type="button"
                onClick={() => void handleCopyPrompt()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-200 hover:bg-white/5"
              >
                Copy briefing prompt
              </button>
              {copyMessage ? <p className="text-sm text-zinc-400">{copyMessage}</p> : null}
              {launchMessage ? <p className="text-sm text-zinc-400">{launchMessage}</p> : null}
            </div>
          </form>
        </StudioCard>

        <StudioCard
          title="Briefing prompt preview"
          eyebrow="Prompt contract"
          action={
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
              Case-ready
            </span>
          }
        >
          <div className="rounded-3xl border border-white/5 bg-black/25 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{promptPreview}</pre>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-400">
            API endpoint: <span className="font-medium text-zinc-200">{apiBaseUrl}</span>
          </div>
        </StudioCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <StudioCard
          title="Execution feed"
          eyebrow="Live telemetry"
          action={
            activeAnalysis ? (
              <button
                type="button"
                onClick={clearActiveAnalysis}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
              >
                Clear active run
              </button>
            ) : null
          }
        >
          {activeAnalysis ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${statusTone(activeAnalysis.analysis.status)}`}>
                  {activeAnalysis.analysis.status}
                </span>
                <p className="text-sm text-zinc-400">Updated {new Date(activeAnalysis.analysis.updatedAt).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Prompt contract</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-200">{activeAnalysis.analysis.prompt}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Draft output</p>
                <div className="mt-2 min-h-48 whitespace-pre-wrap text-sm leading-7 text-zinc-100">
                  {activeAnalysis.liveText || activeAnalysis.analysis.resultText || "Streaming output will appear here…"}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tool telemetry</p>
                {activeAnalysis.toolActivity.length ? (
                  <ul className="mt-2 space-y-2">
                    {activeAnalysis.toolActivity.slice(-8).map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">The model has not emitted tool telemetry yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm leading-relaxed text-zinc-400">
              No active run yet. Launch a briefing above, or continue exploratory drafting in the global composer below.
            </div>
          )}
        </StudioCard>

        <StudioCard title="Recent outputs and follow-on actions" eyebrow="Operational handoff">
          {isHistoryLoading ? (
            <p className="text-sm text-zinc-400">Loading stored outputs…</p>
          ) : analyses.length ? (
            <ul className="space-y-3">
              {analyses.slice(0, 5).map((item) => (
                <RecentRunItem key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">No stored briefings yet. Your first Studio run will appear here.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/build-dashboard/history"
              className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <p className="text-sm font-semibold text-zinc-100">Open History</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Review prior briefs, compare timestamps, and recover the most useful analytical outputs.</p>
            </Link>
            <Link
              to="/build-dashboard/cases"
              className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <p className="text-sm font-semibold text-zinc-100">Promote to Cases</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Move validated outputs into a managed case record with notes, status, and linked analyses.</p>
            </Link>
            <Link
              to="/build-dashboard/investigations"
              className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <p className="text-sm font-semibold text-zinc-100">Pivot to Tracer</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Inspect relationships, flows, and high-value nodes when the next step requires graph analysis.</p>
            </Link>
            <Link
              to="/build-dashboard/settings"
              className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <p className="text-sm font-semibold text-zinc-100">Check readiness</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">Confirm API health, workspace context, and connector readiness before deeper investigation.</p>
            </Link>
          </div>
        </StudioCard>
      </section>
    </div>
  );
}
