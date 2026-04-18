import { Link } from "react-router-dom";
import { GetStartedTrigger } from "./GetStartedTrigger";
import { ArrowRight } from "./icons";
import { LoopingBlurTypewriter } from "./TextType";

const HERO_HEADLINE_PHRASES = [
  "The analyst-grade agent harness",
  "Trace flows with evidence you can defend",
  "Deterministic rules, accountable humans",
  "Grounded data for serious investigations",
] as const;

/** Hero sized for full-viewport presentation (e.g. 1920×1080 minus 64px header). */
export function Hero() {
  return (
    <section
      id="get-started"
      className="relative scroll-mt-16 min-h-[calc(100svh-4rem)] overflow-hidden bg-grid-fade bg-canvas"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.06),_transparent_55%)]" />
      <div
        className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1920px] flex-col justify-center px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16 2xl:px-24"
      >
        <div className="max-w-3xl xl:max-w-4xl 2xl:max-w-[42rem]">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted sm:mb-6 sm:text-sm 2xl:mb-8 2xl:text-base">
            Blockchain intelligence agents
          </p>
          <h1 className="text-balance font-serif text-4xl font-normal leading-[1.12] tracking-tight text-ink sm:text-5xl sm:leading-[1.1] lg:text-6xl xl:text-7xl 2xl:text-8xl 2xl:leading-[1.05]">
            <LoopingBlurTypewriter
              phrases={HERO_HEADLINE_PHRASES}
              typingSpeed={40}
              startDelay={320}
              betweenPhraseDelay={180}
              holdMs={2600}
              blurOutMs={520}
            />
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:mt-8 sm:text-xl lg:text-2xl lg:leading-relaxed 2xl:mt-10 2xl:max-w-3xl 2xl:text-[1.375rem]">
            Built for investigations that must survive scrutiny.
          </p>
          <nav
            className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12 2xl:mt-14 2xl:gap-5"
            aria-label="Hero actions"
          >
            <GetStartedTrigger className="inline-flex min-h-[44px] min-w-[140px] touch-manipulation items-center justify-center bg-accent px-7 py-3.5 text-base font-semibold text-canvas transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas 2xl:min-h-[52px] 2xl:px-8 2xl:text-lg [-webkit-tap-highlight-color:transparent]" />
            <Link
              to="/pricing"
              className="group inline-flex min-h-[44px] touch-manipulation items-center gap-2 border border-ink/25 px-6 py-3.5 text-base font-semibold text-ink transition-colors duration-200 hover:border-ink/50 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas 2xl:min-h-[52px] 2xl:gap-3 2xl:px-8 2xl:text-lg [-webkit-tap-highlight-color:transparent]"
            >
              View pricing
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none 2xl:h-5 2xl:w-5" />
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
