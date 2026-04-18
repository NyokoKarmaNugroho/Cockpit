import { useEffect, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetStarted } from "../context/GetStartedContext";

export function GetStartedModal() {
  const navigate = useNavigate();
  const { isOpen, close } = useGetStarted();
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-20 sm:pt-24"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg border border-ink/15 bg-canvas p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
            Get started
          </h2>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] text-sm text-ink-muted hover:text-ink"
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Start with Cockpit’s public product surfaces while the self-serve dashboard is unavailable in this build.
          Review the methodology, pricing, and data-readiness materials to understand the workflow.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-canvas hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            onClick={() => {
              navigate("/explore-data", { replace: true });
              close();
            }}
          >
            Explore data guide
          </button>
          <Link
            to="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink/20 px-4 text-sm font-semibold text-ink transition hover:border-ink/35 hover:bg-ink/5"
            onClick={close}
          >
            View pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
