import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

const DashboardLayout = lazy(async () => ({ default: (await import("./app/build-dashboard/DashboardLayout")).DashboardLayout }));
const ApiPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/ApiPage")).ApiPage }));
const CasesPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/CasesPage")).CasesPage }));
const HistoryPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/HistoryPage")).HistoryPage }));
const InvestigationsPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/InvestigationsPage")).InvestigationsPage }));
const SearchPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/SearchPage")).SearchPage }));
const SettingsPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/SettingsPage")).SettingsPage }));
const StudioPage = lazy(async () => ({ default: (await import("./app/build-dashboard/pages/StudioPage")).StudioPage }));
const TokenDashboardView = lazy(async () => ({ default: (await import("./app/build-dashboard/views/TokenDashboardView")).TokenDashboardView }));
const BlogPage = lazy(async () => ({ default: (await import("./pages/BlogPage")).BlogPage }));
const ExploreDataPage = lazy(async () => ({ default: (await import("./pages/ExploreDataPage")).ExploreDataPage }));
const LandingPage = lazy(async () => ({ default: (await import("./pages/LandingPage")).LandingPage }));
const PricingPage = lazy(async () => ({ default: (await import("./pages/PricingPage")).PricingPage }));
const RiskExposureMethodologyPage = lazy(async () => ({
  default: (await import("./pages/RiskExposureMethodologyPage")).RiskExposureMethodologyPage,
}));

function RouteFallback({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-6xl items-center justify-center px-6 py-10">
      <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 px-5 py-4 text-sm text-zinc-400 shadow-inner">
        {message}
      </div>
    </div>
  );
}

function withSuspense(node: ReactNode, message: string) {
  return <Suspense fallback={<RouteFallback message={message} />}>{node}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={withSuspense(<LandingPage />, "Loading landing page…")} />
      <Route path="/blog" element={withSuspense(<BlogPage />, "Loading blog…")} />
      <Route path="/explore-data" element={withSuspense(<ExploreDataPage />, "Loading dataset explorer…")} />
      <Route
        path="/methodology/risk-exposure"
        element={withSuspense(<RiskExposureMethodologyPage />, "Loading methodology…")}
      />
      <Route path="/pricing" element={withSuspense(<PricingPage />, "Loading pricing…")} />
      <Route path="/build-dashboard" element={withSuspense(<DashboardLayout />, "Loading dashboard workspace…")}>
        <Route index element={withSuspense(<TokenDashboardView />, "Loading dashboard overview…")} />
        <Route path="search" element={withSuspense(<SearchPage />, "Loading search workspace…")} />
        <Route path="investigations" element={withSuspense(<InvestigationsPage />, "Loading tracer…")} />
        <Route path="studio" element={withSuspense(<StudioPage />, "Loading OSINT Studio…")} />
        <Route path="history" element={withSuspense(<HistoryPage />, "Loading history…")} />
        <Route path="cases" element={withSuspense(<CasesPage />, "Loading cases…")} />
        <Route path="api" element={withSuspense(<ApiPage />, "Loading API workspace…")} />
        <Route path="settings" element={withSuspense(<SettingsPage />, "Loading settings…")} />
      </Route>
    </Routes>
  );
}
