import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

/**
 * Educational overview of how address- and transaction-level risk exposure screening is commonly modeled.
 * Taxonomy and thresholds vary by provider and jurisdiction—verify against your vendor SLA and legal counsel.
 */

const RISK_TAG_ROWS: readonly { tag: string; summary: string }[] = [
  {
    tag: "Sanctions exposure",
    summary:
      "Addresses publicly associated with parties listed on government or multilateral sanctions programs (for example, consolidated blocked-persons lists).",
  },
  {
    tag: "Terrorism financing",
    summary: "Addresses tied to financing of terrorism as described in public designations or enforcement narratives.",
  },
  {
    tag: "Human trafficking",
    summary: "Addresses linked to proceeds or infrastructure used in human trafficking, per public reporting or law-enforcement attributions.",
  },
  {
    tag: "Drug trafficking",
    summary: "Addresses tied to illicit production, movement, or sale of controlled substances where labels reflect public cases or intelligence summaries.",
  },
  {
    tag: "Exploit / attack infrastructure",
    summary: "Addresses involved in known exploits, draining schemes, or laundering of stolen protocol funds.",
  },
  {
    tag: "Fraud & scams",
    summary: "Addresses used in deceptive schemes—phishing, advance-fee fraud, romance or investment scams, honeypots, and similar patterns.",
  },
  {
    tag: "Ransomware",
    summary: "Addresses controlled by ransomware operators or used to collect ransom payments.",
  },
  {
    tag: "CSAM-related payments",
    summary: "Addresses associated with payment rails for child sexual abuse material, where such attribution exists in public or law-enforcement sources.",
  },
  {
    tag: "Money laundering (suspected)",
    summary: "Addresses flagged in typologies consistent with layering or integration of illicit proceeds (heuristic or model-based).",
  },
  {
    tag: "Mixing / privacy services",
    summary: "Addresses belonging to mixers, privacy pools, or other services whose primary effect is to obscure asset trails.",
  },
  {
    tag: "Darknet marketplaces",
    summary: "Addresses operated by or for illicit marketplaces on anonymous networks.",
  },
  {
    tag: "Other darknet commerce",
    summary: "Addresses tied to illicit goods or services sold outside mainstream marketplaces (for example, weapons or credential sales), where publicly labeled.",
  },
  {
    tag: "Issuer- or protocol-level freeze",
    summary: "Addresses blocked at the token-contract or issuer level (stablecoin freeze lists, etc.).",
  },
  {
    tag: "Gambling",
    summary: "Addresses belonging to unlicensed or high-risk gambling operators, where your policy treats them as material.",
  },
  {
    tag: "High-risk VASP / weak KYC",
    summary: "Addresses associated with virtual-asset service providers that lack adequate customer due diligence under your policy framework.",
  },
  {
    tag: "High-risk jurisdiction (FATF-style lists)",
    summary: "Entities domiciled in jurisdictions appearing on public FATF “call for action” or “increased monitoring” lists, when your rules map those lists to elevated risk.",
  },
  {
    tag: "Increased monitoring jurisdiction (FATF-style lists)",
    summary: "Entities domiciled in jurisdictions under heightened monitoring in public AML/CFT evaluations, when your policy treats that as a distinct tier.",
  },
];

export function RiskExposureMethodologyPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Risk exposure screening — methodology — Cockpit";
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Methodology</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-normal tracking-tight text-ink sm:text-5xl">
              Risk exposure screening
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-muted">
              Many compliance stacks score “exposure” by combining <strong className="font-medium text-ink/90">labeled addresses</strong>,{" "}
              <strong className="font-medium text-ink/90">graph traversals</strong>, and{" "}
              <strong className="font-medium text-ink/90">policy rules</strong>. The ideas below describe common patterns—not a
              promise that Cockpit or any third party implements them identically.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <section aria-labelledby="tags-heading" className="scroll-mt-24">
            <h2 id="tags-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Risk tags (illustrative)
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Providers maintain taxonomies of <dfn>risk tags</dfn>—short labels attached to addresses, clusters, or entities.
              Names and definitions differ by vendor; the table is a neutral summary for onboarding and engineering design,
              not an exhaustive legal taxonomy.
            </p>
            <div className="mt-8 overflow-x-auto rounded-lg border border-ink/10">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 bg-canvas-subtle/80">
                    <th scope="col" className="px-4 py-3 font-display font-semibold text-ink">
                      Tag (illustrative)
                    </th>
                    <th scope="col" className="px-4 py-3 font-display font-semibold text-ink">
                      Typical meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RISK_TAG_ROWS.map((row) => (
                    <tr key={row.tag} className="border-b border-ink/10 last:border-b-0">
                      <th scope="row" className="whitespace-nowrap px-4 py-3 align-top font-medium text-ink">
                        {row.tag}
                      </th>
                      <td className="px-4 py-3 align-top text-ink-muted">{row.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="metrics-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="metrics-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Exposure amount and exposure share
            </h2>
            <dl className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
              <div>
                <dt className="font-medium text-ink">Exposure amount</dt>
                <dd className="mt-1">
                  The notional value (often in USD) of assets that have touched, passed through, or remain associated with a
                  labeled risk source within the scope of the rule (for example, inbound flow over N hops).
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Exposure share</dt>
                <dd className="mt-1">
                  That exposure amount expressed as a fraction of relevant flow—such as total inflows or outflows in the
                  window your policy defines—so analysts can see concentration, not only absolutes.
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="address-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="address-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Address-level checks (common patterns)
            </h2>
            <ol className="mt-6 list-decimal space-y-8 pl-5 text-base leading-relaxed text-ink-muted marker:text-ink/50">
              <li>
                <strong className="font-medium text-ink/90">Direct label match</strong> — The screened wallet itself carries
                one or more risk tags from the provider’s graph (for example, a sanctions designation surfaced on-chain or
                via the vendor’s entity layer).
              </li>
              <li>
                <strong className="font-medium text-ink/90">Indirect exposure via fund flow</strong> — The engine walks
                sends and receives up to a configurable depth. If any counterparty or intermediate hop matches a tag, and
                amount or direction satisfies your thresholds, the address is flagged according to your rule pack.
              </li>
              <li>
                <strong className="font-medium text-ink/90">Policy denylist</strong> — Your organization maintains a list of
                addresses that must always fail or always trigger review; the check is a straight interaction test against
                that list (sometimes combined with direction and minimum value filters).
              </li>
            </ol>
          </section>

          <section aria-labelledby="tx-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="tx-heading" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Transaction- and transfer-level checks
            </h2>
            <ol className="mt-6 list-decimal space-y-8 pl-5 text-base leading-relaxed text-ink-muted marker:text-ink/50">
              <li>
                <strong className="font-medium text-ink/90">Participant screening</strong> — Evaluate the addresses that
                appear as senders, recipients, or contract parties in the transfer against your tag set and lists.
                <span className="mt-2 block text-sm text-ink-faint">
                  When you screen in a <em>deposit</em> vs <em>withdrawal</em> mental model, many products only apply certain
                  rules to the counterparty that matches your firm’s “customer side” of the rail (implementation-specific).
                </span>
              </li>
              <li>
                <strong className="font-medium text-ink/90">Flow tracing from the transfer</strong> — Starting from the
                screened transfer, trace upstream or downstream value movement to see whether it touches tagged
                infrastructure within configured hops and limits.
              </li>
              <li>
                <strong className="font-medium text-ink/90">Denylist touch</strong> — Fail or escalate if the transfer
                directly interacts with an address on your internal denylist, independent of third-party tags.
              </li>
            </ol>
            <p className="mt-8 text-sm leading-relaxed text-ink-faint">
              Deposit/withdrawal semantics, hop counts, and which endpoint is “the customer” are product-specific—configure
              and test them against your travel-rule and CDD procedures.
            </p>
          </section>

          <section aria-labelledby="disclaimer-heading" className="mt-14 border-t border-ink/10 pt-12">
            <h2 id="disclaimer-heading" className="font-display text-xl font-semibold text-ink">
              Disclaimer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              This page is general educational material. It is not legal, sanctions, or compliance advice. List names,
              tag definitions, and screening outcomes depend on your data vendor, jurisdiction, and internal policies.
            </p>
          </section>

          <nav
            className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-10 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8"
            aria-label="Related pages"
          >
            <Link
              to="/explore-data"
              className="font-medium text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-ink-muted"
            >
              Compliance-ready exports
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
              ← Blog teasers
            </Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
