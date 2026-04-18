import { useEffect } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { GetStartedTrigger } from "../components/GetStartedTrigger";
import { PricingUsageSection } from "../components/PricingUsageSection";

/**
 * List-price style tiers aligned with common B2B blockchain analytics / agent API packaging
 * (per-seat + usage envelopes). Figures are illustrative list prices, not a quote.
 */
const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever · no card",
    blurb: "Try agents, Tracer, and exports on a small monthly envelope—upgrade anytime.",
    cta: "Start free",
    highlighted: false,
    features: [
      "1 seat",
      "2k agent tool calls / month (resets monthly)",
      "Solana + EVM via standard RPC",
      "Tracer: 1 active canvas",
      "Docs, status page & community support",
    ],
  },
  {
    name: "Starter",
    price: "$99",
    cadence: "per month",
    blurb: "Solo analysts and proof-of-value pilots.",
    cta: "Get started",
    highlighted: false,
    features: [
      "1 seat",
      "25k agent tool calls / month",
      "Core chains (Solana, EVM)",
      "Tracer: 3 active canvases",
      "Email support (best effort)",
    ],
  },
  {
    name: "Team",
    price: "$349",
    cadence: "per month",
    blurb: "Investigation pods with shared evidence trails.",
    cta: "Get started",
    highlighted: true,
    features: [
      "Up to 5 seats",
      "150k agent tool calls / month",
      "Multi-chain + priority RPC lane",
      "Tracer: unlimited canvases",
      "Risk / sanctions screening bundle (fair use)",
      "Shared workspace & export audit logs",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual agreements typical",
    blurb: "Regulated teams needing SLAs and custom data estates.",
    cta: "Contact sales",
    highlighted: false,
    features: [
      "Unlimited seats (named)",
      "Custom agent & usage envelopes",
      "Dedicated support & review windows",
      "VPC / data residency options (where available)",
      "Custom integrations & DPAs",
    ],
  },
];

export function PricingPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Pricing — Cockpit";
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Pricing</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-normal tracking-tight text-ink sm:text-5xl">
              Blockchain intelligence agents
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-muted">
              <strong className="font-medium text-ink/90">Free</strong> is included: $0 with a starter envelope.
              Paid tiers use usage-based monthly envelopes. List prices in USD; annual prepay and volume
              discounts are available.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((tier) => (
              <section
                key={tier.name}
                className={`flex flex-col border p-6 sm:p-8 ${
                  tier.highlighted
                    ? "border-ink bg-canvas shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ring-1 ring-ink/10"
                    : "border-ink/15 bg-canvas-subtle/40"
                }`}
                aria-labelledby={`tier-${tier.name}`}
              >
                <h2 id={`tier-${tier.name}`} className="font-display text-xl font-semibold text-ink">
                  {tier.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{tier.blurb}</p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-serif text-4xl font-normal tracking-tight text-ink">{tier.price}</span>
                  {tier.cadence ? (
                    <span className="text-sm text-ink-muted">{tier.cadence}</span>
                  ) : null}
                </div>
                <ul className="mt-8 flex-1 space-y-3 text-sm leading-relaxed text-ink-muted">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/40" aria-hidden />
                      <span className="text-ink/90">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {tier.name === "Enterprise" ? (
                    <a
                      href="mailto:support@daemonprotocol.com?subject=Cockpit%20Enterprise%20pricing"
                      className={`inline-flex min-h-[44px] w-full items-center justify-center px-4 text-sm font-semibold transition-opacity hover:opacity-90 ${
                        tier.highlighted
                          ? "bg-accent text-canvas"
                          : "border border-ink/25 bg-canvas text-ink hover:border-ink/40"
                      }`}
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <GetStartedTrigger
                      className={`inline-flex min-h-[44px] w-full items-center justify-center px-4 text-sm font-semibold transition-opacity hover:opacity-90 ${
                        tier.highlighted
                          ? "bg-accent text-canvas"
                          : "border border-ink/25 bg-canvas text-ink hover:border-ink/40"
                      }`}
                    >
                      {tier.cta}
                    </GetStartedTrigger>
                  )}
                </div>
              </section>
            ))}
          </div>

          <PricingUsageSection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
