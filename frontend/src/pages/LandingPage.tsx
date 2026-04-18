import { Hero } from "../components/Hero";
import { ModuleText } from "../components/ModuleText";
import { Newsletter } from "../components/Newsletter";
import { Principles } from "../components/Principles";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PlaceholderSections } from "../components/PlaceholderSections";
import { UseCaseGrid } from "../components/UseCaseGrid";

export function LandingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ink focus:text-canvas"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <ModuleText />
        <UseCaseGrid />
        <Principles />
        <PlaceholderSections />
        <Newsletter />
      </main>
      <SiteFooter />
    </>
  );
}
