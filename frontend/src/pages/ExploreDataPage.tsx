import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

/**
 * Methodology note: treating an investigation export like a dataset—grain, quality, dimensions—
 * before it goes to legal or regulators. Not a substitute for counsel or your own controls.
 */

export function ExploreDataPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Compliance-ready exports — Cockpit";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ink focus:text-canvas"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="min-h-[70vh] bg-canvas">
        <div className="border-b border-ink/10 bg-grid-fade">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Blog · Data readiness</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-normal tracking-tight text-ink sm:text-5xl">
              Compliance-ready exports and review checkpoints
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-muted">
              Regulators and internal committees rarely ask for a screenshot—they ask what the export <em>is</em>, how it
              was produced, and whether the numbers reconcile. The same questions you would ask when profiling a dataset
              before analysis apply here: grain, coverage, and quality.
            </p>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <section aria-labelledby="grain-heading" className="scroll-mt-24">
            <h2 id="grain-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Start with grain
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Every export has an implicit <strong className="font-medium text-ink/90">grain</strong>: one row per
              transfer, per day, per alert, per address snapshot, and so on. If the grain is wrong, every downstream
              table, chart, and narrative is wrong. Before you attach citations or send a package upstream, state the
              grain in one sentence and check that every row obeys it.
            </p>
          </section>

          <section aria-labelledby="profile-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="profile-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Profile the export like you would a table
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              The same profiling habits that analysts use on warehouse tables help catch issues before they become
              exhibit problems:
            </p>
            <ul className="mt-6 list-disc space-y-3 pl-5 text-base leading-relaxed text-ink-muted marker:text-ink/40">
              <li>
                <strong className="font-medium text-ink/90">Coverage</strong> — time range (min/max dates), chain or
                asset scope, and whether anything was filtered out after retrieval.
              </li>
              <li>
                <strong className="font-medium text-ink/90">Completeness</strong> — null rates on key fields; fields
                that should be unique (e.g. transaction id) should not have duplicates unless the grain allows it.
              </li>
              <li>
                <strong className="font-medium text-ink/90">Cardinality</strong> — categorical columns with
                suspiciously few or too many distinct values relative to what the case narrative claims.
              </li>
              <li>
                <strong className="font-medium text-ink/90">Cross-checks</strong> — totals and subtotals reconcile;
                screening flags line up with the underlying transfers you cite.
              </li>
            </ul>
          </section>

          <section aria-labelledby="citations-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="citations-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Citations, human gates, and logs
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              A defensible package ties each conclusion to retrievable evidence: explorer links, transaction
              identifiers, and timestamps that a third party can reproduce. Where policy requires it, insert explicit
              human review steps—who looked at what, when, and what changed—so the export is not only accurate but{' '}
              <em>auditable</em>. System logs (ingestion, agent tool calls, export generation) are part of the story,
              not an afterthought.
            </p>
          </section>

          <section aria-labelledby="limits-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="limits-heading" className="font-display text-xl font-semibold text-ink">
              What this is not
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              This page is a methodology sketch, not legal advice. Jurisdictions and regulators differ; your compliance
              and legal teams own sign-off criteria. Cockpit’s product surfaces evolve—verify current capabilities in
              app and in your order documentation.
            </p>
          </section>

          <nav
            className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-10 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8"
            aria-label="Continue reading"
          >
            <Link
              to="/blog"
              className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
            >
              OSINT &amp; Bellingcat toolkit
            </Link>
            <Link
              to="/pricing"
              className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
            >
              Pricing
            </Link>
            <Link
              to="/#blog"
              className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
            >
              ← All blog teasers
            </Link>
          </nav>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
