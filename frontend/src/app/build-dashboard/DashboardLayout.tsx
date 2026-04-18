import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAnalysis } from "../../context/AnalysisContext";
import { DashboardWalletBar } from "./DashboardWalletBar";
import { DashboardComposer } from "./DashboardComposer";
import { DashboardSidebar } from "./DashboardSidebar";
import { dashboardRouteTitle } from "./dashboardRouteTitles";
import { IconChevronDown, IconMenu, IconMore } from "./DashboardIcons";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { clearActiveAnalysis } = useAnalysis();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const workspaceTitle = dashboardRouteTitle(location.pathname);

  return (
    <div className="flex h-svh min-h-0 w-full max-w-[100vw] overflow-hidden bg-zinc-950 text-zinc-100">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <DashboardSidebar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <main
        id="cockpit-dashboard-main"
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950"
        aria-label="Investigation workspace"
      >
        <header className="relative flex h-14 shrink-0 items-center border-b border-white/[0.06] bg-zinc-950/95 px-3 backdrop-blur-sm sm:px-5">
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <button
              type="button"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-zinc-300 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 md:hidden"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-14 sm:px-20">
            <button
              type="button"
              className="pointer-events-auto inline-flex max-w-full min-w-0 items-center gap-1 truncate rounded-lg px-2 py-1.5 text-sm font-medium text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-haspopup="listbox"
              aria-label={`Workspace: ${workspaceTitle}. Switch workspace`}
            >
              <span className="truncate">{workspaceTitle}</span>
              <IconChevronDown className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            </button>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <DashboardWalletBar />
            <button
              type="button"
              onClick={clearActiveAnalysis}
              className="inline-flex min-h-11 min-w-[6.5rem] items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              New analysis
            </button>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-label="More options"
            >
              <IconMore />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>

        <DashboardComposer />
      </main>
    </div>
  );
}
