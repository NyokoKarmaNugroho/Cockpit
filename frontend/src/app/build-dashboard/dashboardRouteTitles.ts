/** Title for `/build-dashboard` index (sidebar + header). */
export const DASHBOARD_INDEX_TITLE = "Intel Dashboard";

/** Labels for `/build-dashboard/:segment` (sidebar + header). */
export const DASHBOARD_SEGMENT_LABELS = {
  search: "Search",
  investigations: "Tracer",
  studio: "OSINT Studio",
  history: "History",
  cases: "Cases",
  api: "API",
  settings: "Settings",
} as const;

export type DashboardSegment = keyof typeof DASHBOARD_SEGMENT_LABELS;

/** Center header label for the active workspace route under `/build-dashboard`. */
export function dashboardRouteTitle(pathname: string): string {
  const base = "/build-dashboard";
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/\/$/, "") : pathname;

  if (rest === "" || rest === "/") {
    return DASHBOARD_INDEX_TITLE;
  }

  const segment = rest.replace(/^\//, "").split("/")[0] ?? "";
  const label = DASHBOARD_SEGMENT_LABELS[segment as DashboardSegment];
  return label ?? "Cockpit";
}
