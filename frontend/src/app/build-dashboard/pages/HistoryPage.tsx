import { useAnalysis } from "../../../context/AnalysisContext";
import { DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";
import { DashboardStubPage } from "../components/DashboardStubPage";

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

export function HistoryPage() {
  const { analyses, isHistoryLoading, refreshAnalyses, errorMessage } = useAnalysis();

  return (
    <DashboardStubPage
      title={DASHBOARD_SEGMENT_LABELS.history}
      description="Saved analysis runs are now loaded from the backend. Refresh this list after new investigations or stream completions."
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">Backend-backed run history for the current workspace.</p>
        <button
          type="button"
          onClick={() => void refreshAnalyses()}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-medium text-zinc-200 hover:bg-white/5"
        >
          Refresh
        </button>
      </div>

      {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

      {isHistoryLoading ? (
        <p className="text-sm text-zinc-400">Loading analyses…</p>
      ) : analyses.length ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50">
          <table className="min-w-full divide-y divide-white/5 text-left text-sm text-zinc-300">
            <thead className="bg-black/20 text-xs uppercase tracking-[0.2em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {analyses.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-zinc-100">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-400">{new Date(item.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No runs yet. Submit a prompt from the composer to populate history.</p>
      )}
    </DashboardStubPage>
  );
}
