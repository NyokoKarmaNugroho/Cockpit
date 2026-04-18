import { Link } from "react-router-dom";
import { BlogSectionResourceNav } from "./BlogSectionResourceNav";
import { EcosystemLogoLoop } from "./EcosystemLogoLoop";

/** Teaser topics for the landing “Blog” section — `to` when a page exists. */
const BLOG_TEASERS: readonly {
  title: string;
  excerpt: string;
  to?: string;
  cta?: string;
}[] = [
  {
    title: "OSINT beyond the chain: Bellingcat’s investigation toolkit",
    excerpt:
      "A public directory of open-source tools—maps, imagery, archives, and more—to pair with chain tracing. We link to the official GitBook and GitHub; we don’t mirror the catalog here.",
    to: "/blog",
    cta: "Read",
  },
  {
    title: "Tracing fund flows with blockchain intelligence agents",
    excerpt:
      "How analysts combine graph steps, retrieval, and screening in one auditable workflow—without losing the chain of custody.",
  },
  {
    title: "Compliance-ready exports and review checkpoints",
    excerpt:
      "What to expect when your team needs citations, human gates, and logs that match how regulators ask questions.",
    to: "/explore-data",
    cta: "Read",
  },
  {
    title: "Release notes & methodology",
    excerpt:
      "Product updates, data-source notes, and how we think about coverage across Solana, EVM, and partner feeds.",
  },
];

/** Anchor targets for mobile nav (Learn / Ecosystem / Blog, etc.). */
export function PlaceholderSections() {
  return (
    <>
      <section
        id="ecosystem"
        className="scroll-mt-24 border-t border-ink/10 bg-canvas py-16 sm:py-20"
        aria-labelledby="ecosystem-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2
            id="ecosystem-heading"
            className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl"
          >
            Ecosystem
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">
            Integrations, data partners, and deployment patterns—details coming soon.
          </p>
          <EcosystemLogoLoop />
        </div>
      </section>
      <section
        id="blog"
        className="scroll-mt-24 border-t border-ink/10 bg-canvas-subtle py-16 sm:py-20"
        aria-labelledby="blog-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="max-w-2xl">
            <h2
              id="blog-heading"
              className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl"
            >
              Blog
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Practical notes on blockchain intelligence methodology, product releases, and how teams run investigations
              with agents—from tracing flows to compliance-ready exports.
            </p>
          </header>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 lg:gap-8">
            {BLOG_TEASERS.map((post) => (
              <li key={post.title}>
                <article className="flex h-full flex-col border border-ink/10 bg-canvas p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                  <h3 className="font-display text-base font-semibold leading-snug text-ink text-balance">{post.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted [text-wrap:pretty]">{post.excerpt}</p>
                  {post.to ? (
                    <Link
                      to={post.to}
                      className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
                    >
                      {post.cta ?? "Read"} →
                    </Link>
                  ) : (
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink-faint">Coming soon</p>
                  )}
                </article>
              </li>
            ))}
          </ul>

          <BlogSectionResourceNav />
        </div>
      </section>
    </>
  );
}
