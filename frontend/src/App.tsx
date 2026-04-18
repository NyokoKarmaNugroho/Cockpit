import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

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
    </Routes>
  );
}
