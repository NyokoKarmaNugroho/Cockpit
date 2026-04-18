import { DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";
import { DashboardStubPage } from "../components/DashboardStubPage";

export function SearchPage() {
  return (
    <DashboardStubPage
      title={DASHBOARD_SEGMENT_LABELS.search}
      description="Search addresses, entities, and labels across investigations. Connect data sources in Settings when you are ready to run live queries."
    />
  );
}
