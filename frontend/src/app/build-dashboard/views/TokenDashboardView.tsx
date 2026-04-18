import { useAnalysis } from "../../../context/AnalysisContext";
import { IconSparkles } from "../DashboardIcons";

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

export function TokenDashboardView() {
  const { activeAnalysis, analyses, isHistoryLoading, workspaceId, apiConnectionStatus, apiBaseUrl } = useAnalysis();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col items-center justify-center gap-3 text-center sm:mb-2">
        <IconSparkles className="h-8 w-8 text-zinc-500" aria-hidden />
        <h1 id="dashboard-hero-heading" className="max-w-lg text-balance text-xl font-semibold leading-snug text-zinc-100 sm:text-2xl">
          What do you want to investigate?
        </h1>
        <p className="max-w-xl text-sm text-zinc-400">
          Workspace <span className="font-medium text-zinc-200">{workspaceId}</span>
          {apiConnectionStatus === "ready"
            ? " — API online."
            : apiConnectionStatus === "checking"
              ? " — checking API…"
              : ` — API unreachable (${apiBaseUrl}).`}
          {" "}Submit a prompt below to run an analysis.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-inner">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-zinc-100">Current analysis</h2>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${statusTone(
                activeAnalysis?.analysis.status ?? "queued",
              )}`}
            >
              {activeAnalysis?.analysis.status ?? "idle"}
            </span>
          </div>

          {activeAnalysis ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Prompt</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">{activeAnalysis.analysis.prompt}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live result</p>
                <div className="mt-2 min-h-40 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm leading-7 text-zinc-200 whitespace-pre-wrap">
                  {activeAnalysis.liveText || activeAnalysis.analysis.resultText || "Streaming output will appear here…"}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              No analysis is running yet. Use the composer at the bottom of the screen to start one.
            </p>
          )}
        </article>

        <article className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-inner">
          <h2 className="text-base font-semibold text-zinc-100">Recent runs</h2>
          {isHistoryLoading ? (
            <p className="mt-4 text-sm text-zinc-400">Loading recent analyses…</p>
          ) : analyses.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {analyses.slice(0, 5).map((item) => (
                <li key={item.id} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">No analyses yet. Your first run will appear here.</p>
          )}
        </article>
      </section>

      {activeAnalysis?.toolActivity.length ? (
        <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5 shadow-inner">
          <h2 className="text-base font-semibold text-zinc-100">Tool activity</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {activeAnalysis.toolActivity.slice(-6).map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
