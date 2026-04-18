import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

/**
 * Points investigators to Bellingcat’s public toolkit and official “about” pages
 * (data principles, editorial standards, funding). We do not mirror tool lists here.
 */

export function BlogPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Blog — Cockpit";
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Blog</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-normal tracking-tight text-ink sm:text-5xl">
              Notes for investigators
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-muted">
              Chain tracing is one layer. Many cases also need maps, imagery, archives, and open-web context—without
              mixing fact with guesswork.
            </p>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <section id="bellingcat-toolkit" aria-labelledby="bellingcat-heading" className="scroll-mt-24">
            <h2 id="bellingcat-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Bellingcat Online Open Source Investigation Toolkit
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Bellingcat maintains a curated, living catalog of OSINT tools and references—maps, imagery, social,
              archives, and other categories—synced from GitBook to GitHub. It is a useful <strong className="font-medium text-ink/90">directory</strong> when you need to
              broaden beyond on-chain work, not a substitute for your own policy, legal review, or tool terms of service.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-muted">
              <li>
                <a
                  href="https://bellingcat.gitbook.io/toolkit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
                >
                  Browse the toolkit (GitBook)
                </a>
                <span className="text-ink-faint"> — public book, updated from the project.</span>
              </li>
              <li>
                <a
                  href="https://github.com/bellingcat/toolkit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
                >
                  GitHub repository
                </a>
                <span className="text-ink-faint"> — source and automation that regenerate lists; verify specifics on GitBook.</span>
              </li>
            </ul>
            <p className="mt-8 text-sm font-medium text-ink">
              Official policies and transparency
            </p>
            <ul className="mt-3 space-y-3 text-sm text-ink-muted">
              <li>
                <a
                  href="https://www.bellingcat.com/about/principles-for-data-collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
                >
                  Principles for Data Collection
                </a>
                <span className="text-ink-faint"> — public interest, harm, verification, and sharing.</span>
              </li>
              <li>
                <a
                  href="https://www.bellingcat.com/about/editorial-standards-practices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
                >
                  Editorial Standards &amp; Practices
                </a>
                <span className="text-ink-faint"> — values, accuracy, transparency, privacy, corrections.</span>
              </li>
              <li>
                <a
                  href="https://www.bellingcat.com/about/funding-and-how-to-support-bellingcat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
                >
                  Funding and How to Support Bellingcat
                </a>
                <span className="text-ink-faint"> — funding model, principles, and how to donate.</span>
              </li>
            </ul>
            <p className="mt-8 rounded-lg border border-ink/10 bg-canvas-subtle/80 p-4 text-sm leading-relaxed text-ink-muted">
              We cite this as a public index, not an endorsement of every listed tool’s safety, accuracy, or fitness for
              your jurisdiction. Check API keys, rate limits, and local rules before you rely on a workflow in production.
            </p>
          </section>

          <section aria-labelledby="ethics-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="ethics-heading" className="font-display text-xl font-semibold text-ink">
              Ethics and proportionality
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Open-source investigation can harm people when misused. Prefer lawful, ethical practice: no harassment,
              non-consensual doxxing, or sanctions evasion. Escalate to qualified professionals where the stakes or legal
              uncertainty warrant it.
            </p>
            <p className="mt-6 text-sm text-ink-muted">
              For journalism-oriented context on synthetic media and false narratives, see the{" "}
              <a
                href="https://gijn.org/resource/tech-focus-project-investigating-ai-disinformation/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
              >
                Global Investigative Journalism Network (GIJN) Tech Focus: Investigating AI Disinformation
              </a>
              .
            </p>
          </section>

          <nav
            className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-10 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8"
            aria-label="Continue reading"
          >
            <Link
              to="/"
              className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
            >
              ← Home
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
              Landing blog strip
            </Link>
          </nav>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
