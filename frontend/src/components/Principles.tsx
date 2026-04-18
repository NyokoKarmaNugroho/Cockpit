const principles = [
  {
    n: "01",
    title: "Data quality",
    body: "Strong models amplify weak data. Cockpit is built to prioritize breadth, depth, and accuracy in what agents retrieve and cite.",
  },
  {
    n: "02",
    title: "Context & reasoning",
    body: "Investigation and compliance expertise is encoded in workflows so agents reach correct conclusions faster.",
  },
  {
    n: "03",
    title: "Auditable automation",
    body: "Deterministic paths for critical decisions: same inputs and rules yield the same outcome. Exploratory mode when you need signals, clearly labeled.",
  },
  {
    n: "04",
    title: "Humans in control",
    body: "Automation levels are explicit. High-stakes outcomes stay reviewable by the people accountable for them.",
  },
  {
    n: "05",
    title: "Ground truth & clustering",
    body: "Conservative attribution where evidence supports it; deterministic clustering from verified seeds—rebuildable and peer-reviewable.",
  },
  {
    n: "06",
    title: "OSINT & time windows",
    body: "Pair chain intelligence with organized open-source context and precise time-bounded transaction review.",
  },
  {
    n: "07",
    title: "Multi-agent operations",
    body: "Orchestrate monitors, analyzers, and escalation paths so leads surface to humans with full context.",
  },
  {
    n: "08",
    title: "Evidence you can defend",
    body: "Exports bundle citations, chain references, and human checkpoints so reviews, audits, and counsel see the same story the agent saw.",
  },
];

export function Principles() {
  return (
    <section id="principles" className="border-t border-ink/10 bg-canvas-subtle py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl">
          Principles that keep agents accountable
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          Language models become mission-ready agents with evidence, speed, and human control.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p) => (
            <article
              key={p.n}
              className="border border-ink/10 bg-canvas-raised p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{p.n}</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
