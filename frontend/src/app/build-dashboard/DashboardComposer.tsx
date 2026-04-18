import { useState } from "react";
import { useAnalysis } from "../../context/AnalysisContext";
import {
  IconArrowRight,
  IconMic,
  IconPaperclip,
  IconPlus,
  IconSliders,
  IconSparkles,
} from "./DashboardIcons";

/** Perplexity-style: centered prompt + rounded-2xl composer, toolbar row with context pill + submit. */
function connectionHint(
  status: "checking" | "ready" | "unreachable",
  apiBaseUrl: string,
): string {
  if (status === "checking") return `Checking API (${apiBaseUrl})…`;
  if (status === "unreachable")
    return `Cannot reach API at ${apiBaseUrl}. Set VITE_API_BASE_URL and ensure the backend is running with CORS for this origin.`;
  return `API reachable — analyses and SSE stream use ${apiBaseUrl}.`;
}

export function DashboardComposer() {
  const [value, setValue] = useState("");
  const {
    submitPrompt,
    isSubmitting,
    errorMessage,
    apiConnectionStatus,
    apiBaseUrl,
    refreshAnalyses,
  } = useAnalysis();
  const canSubmit = apiConnectionStatus === "ready" && !isSubmitting;

  return (
    <div
      className="shrink-0 border-t border-white/[0.06] bg-zinc-950/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm"
      data-print="hide"
    >
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-4 sm:px-6">
        <h2 className="mb-5 text-center text-xl font-medium tracking-tight text-zinc-100 md:text-2xl">
          What should we investigate?
        </h2>

        {errorMessage ? (
          <div
            className="mb-4 rounded-xl border border-amber-500/25 bg-amber-950/40 px-3 py-2.5 text-center text-sm text-amber-100/95"
            role="alert"
          >
            <p className="font-medium text-amber-50/95">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void refreshAnalyses()}
              className="mt-2 text-xs font-medium text-amber-200/90 underline decoration-amber-500/50 underline-offset-2 hover:text-white"
            >
              Retry loading analyses
            </button>
          </div>
        ) : null}

        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const prompt = value.trim();
            if (!prompt || !canSubmit) return;
            await submitPrompt(prompt);
            setValue("");
          }}
        >
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.04]">
            <label htmlFor="dashboard-prompt" className="sr-only">
              Investigation prompt
            </label>
            <div className="grid grid-rows-[1fr_auto] gap-0 px-3 pt-3">
              <textarea
                id="dashboard-prompt"
                name="prompt-textarea"
                rows={2}
                placeholder="Ask anything…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!canSubmit}
                className="max-h-[40vh] min-h-[52px] resize-none border-0 bg-transparent pl-1 pr-1 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px] sm:text-base"
              />
              <p className="col-span-full pb-2 pl-1 text-xs text-zinc-500">
                Type <kbd className="rounded bg-zinc-800/80 px-1 py-0.5 font-mono text-[10px] text-zinc-400">@</kbd>{" "}
                for connectors and sources
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-2 border-t border-white/[0.06] px-3 py-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  aria-label="Add files or tools"
                >
                  <IconPlus />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-dashed border-white/[0.12] bg-zinc-950/50 pl-2 pr-3 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04]"
                  aria-haspopup="dialog"
                >
                  <span className="text-zinc-500">
                    <IconSparkles />
                  </span>
                  <span className="truncate">Harness</span>
                  <span className="text-zinc-500" aria-hidden>
                    +
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  aria-label="Attach"
                >
                  <IconPaperclip />
                </button>
              </div>

              <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                <button
                  type="button"
                  className="inline-flex h-8 min-w-[5.25rem] items-center justify-center gap-1 rounded-full border border-white/[0.08] bg-zinc-950/80 px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05]"
                  aria-haspopup="listbox"
                  aria-label="Model or mode"
                >
                  Auto
                  <span className="text-[10px] text-zinc-500" aria-hidden>
                    ▾
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
                  aria-label="Dictation"
                >
                  <IconMic />
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || !value.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                  aria-label={isSubmitting ? "Running analysis" : "Run analysis"}
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-950" />
                  ) : (
                    <IconArrowRight />
                  )}
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  aria-label="Composer settings"
                >
                  <IconSliders />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-zinc-500">
            {errorMessage ? null : connectionHint(apiConnectionStatus, apiBaseUrl)}
          </p>
        </form>
      </div>
    </div>
  );
}
