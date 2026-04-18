import { DASHBOARD_INDEX_TITLE, DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";
import { TracerFlowCanvas } from "../views/TracerFlowCanvas";

/** Tracer: interactive flow canvas (demo graph) — distinct Cockpit chrome, not a third-party UI clone. */
export function InvestigationsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col -mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <div className="sr-only">
        <h1>{DASHBOARD_SEGMENT_LABELS.investigations}</h1>
        <p>
          Visual trace canvas for Solana-style address flows. {DASHBOARD_INDEX_TITLE} shows sample metrics elsewhere; this
          view is a layout prototype until live indexers are connected.
        </p>
      </div>
      <div className="flex min-h-[min(720px,calc(100svh-13rem))] flex-1 flex-col">
        <TracerFlowCanvas />
      </div>
    </div>
  );
}
