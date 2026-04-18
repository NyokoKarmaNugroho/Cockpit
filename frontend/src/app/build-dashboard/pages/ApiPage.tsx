import { DASHBOARD_SEGMENT_LABELS } from "../dashboardRouteTitles";
import { DashboardStubPage } from "../components/DashboardStubPage";

export function ApiPage() {
  return (
    <DashboardStubPage
      title={DASHBOARD_SEGMENT_LABELS.api}
      description="Programmatic access to Cockpit investigations and webhooks. API keys and usage limits will be managed here."
    />
  );
}
