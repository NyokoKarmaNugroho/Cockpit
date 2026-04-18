import { Link } from "react-router-dom";
import { PRICING_USAGE_ITEMS } from "./pricingUsageContent";

/**
 * Semantic usage explainer: `section` + `h2`, definition list in a responsive grid,
 * visible focus on the home link (Web Interface Guidelines).
 */
export function PricingUsageSection() {
  return (
    <section
      className="mt-14 border-t border-ink/10 pt-10"
      aria-labelledby="pricing-usage-heading"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Usage model</p>
        <h2
          id="pricing-usage-heading"
          className="mt-2 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-ink text-balance sm:text-[1.65rem]"
        >
          How usage maps to price
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Four dimensions drive what you consume. Numbers on cards above are envelopes—not
          per-seat software tax—so teams scale with real work.
        </p>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
        {PRICING_USAGE_ITEMS.map((item, index) => (
          <div
            key={item.title}
            className="group flex min-w-0 gap-3 rounded-xl border border-ink/10 bg-canvas-subtle/50 p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-out hover:border-ink/25 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] motion-reduce:transition-none"
          >
            <span
              className="mt-0.5 inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border border-ink/15 bg-canvas font-mono text-[11px] font-medium tabular-nums text-ink-muted motion-safe:transition-colors motion-safe:group-hover:border-ink/25 motion-safe:group-hover:text-ink"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <dt className="font-display text-[0.9375rem] font-semibold leading-snug text-ink">{item.title}</dt>
              <dd className="mt-2.5 text-sm leading-relaxed text-ink-muted [text-wrap:pretty]">{item.body}</dd>
            </div>
          </div>
        ))}
      </dl>

      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-ink-faint [text-wrap:pretty]">
        Free tier is $0 (fair-use limits may apply). Paid tiers show indicative USD list prices for planning;
        taxes, regulated-entity add-ons, and custom data may apply. Not an offer where prohibited.
      </p>

      <p className="mt-8">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-ink underline decoration-ink/25 underline-offset-[6px] transition-[color,decoration-color] hover:text-ink-muted hover:decoration-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          ← Back to home
        </Link>
      </p>
    </section>
  );
}
