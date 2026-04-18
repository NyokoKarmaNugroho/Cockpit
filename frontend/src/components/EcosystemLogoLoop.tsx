/**
 * Infinite horizontal logo strip (marquee), in the spirit of React Bits “Logo Loop”
 * — CSS-only, no extra runtime deps. Partner names are illustrative for the landing page.
 */

const LOGOS: readonly {
  src: string;
  label: string;
  imgClass?: string;
  /** Wide marks read tiny at default height — give them more body. */
  size?: "default" | "lg" | "xl";
}[] = [
  /** White wordmark — invert to read on `bg-canvas`. */
  { src: "/logo-white-no-globe.svg", label: "Cockpit", imgClass: "brightness-0" },
  { src: "/Sim_Logo_Rectangle/Sim_Logo_Black_White.svg", label: "Sim", size: "xl" },
  { src: encodeURI("/Logo Horizontal (Light).png"), label: "Partner", size: "lg" },
  { src: "/Bellingcat/Bellingcat_idvCvXN9GZ_1.svg", label: "Bellingcat", size: "lg" },
  { src: "/rpc-fast-black-logo.svg", label: "RPC Fast" },
  { src: "/Helius-Horizontal-Logo-Black.svg", label: "Helius" },
  { src: "/payai-logo.svg", label: "PayAI", size: "lg" },
];

function logoSizeClass(size: "default" | "lg" | "xl" | undefined): string {
  switch (size) {
    case "xl":
      return "h-14 w-auto max-h-[60px] max-w-[min(380px,55vw)] object-contain sm:h-16 sm:max-h-[72px] sm:max-w-[min(420px,48vw)]";
    case "lg":
      return "h-12 w-auto max-h-[52px] max-w-[min(300px,48vw)] object-contain sm:h-14 sm:max-h-[60px] sm:max-w-[min(340px,42vw)]";
    default:
      return "h-10 w-auto max-h-11 max-w-[min(240px,42vw)] object-contain sm:h-11 sm:max-h-12 sm:max-w-[min(280px,38vw)]";
  }
}

function LogoImg({
  src,
  imgClass,
  size = "default",
}: {
  src: string;
  imgClass?: string;
  size?: "default" | "lg" | "xl";
}) {
  const sizeCls = logoSizeClass(size);
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${sizeCls} opacity-[0.72] grayscale ${imgClass ?? ""}`}
    />
  );
}

export function EcosystemLogoLoop() {
  const loop = [...LOGOS, ...LOGOS];

  return (
    <div className="mt-10">
      <p id="ecosystem-logos-desc" className="sr-only">
        Illustrative logos of infrastructure and data providers; not an endorsement or partnership claim.
      </p>
      {/* Static layout when reduced motion is requested */}
      <div
        className="hidden flex-wrap items-center justify-center gap-x-10 gap-y-6 py-4 motion-reduce:flex"
        role="list"
        aria-describedby="ecosystem-logos-desc"
      >
        {LOGOS.map((logo) => (
          <div key={logo.src} role="listitem" className="flex items-center justify-center" title={logo.label}>
            <LogoImg src={logo.src} imgClass={logo.imgClass} size={logo.size} />
          </div>
        ))}
      </div>

      {/* Infinite marquee: duplicated row + translateX(-50%); hidden when prefers-reduced-motion */}
      <div
        className="relative overflow-hidden py-6 motion-reduce:hidden"
        role="presentation"
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-canvas to-transparent sm:w-20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-canvas to-transparent sm:w-20"
          aria-hidden
        />
        <div className="flex w-max items-center gap-x-14 will-change-transform animate-logo-marquee hover:[animation-play-state:paused] sm:gap-x-20">
          {loop.map((logo, i) => (
            <div
              key={`${logo.src}-${i}`}
              className="flex min-h-[60px] h-16 shrink-0 items-center justify-center sm:min-h-[72px] sm:h-[72px]"
              title={logo.label}
            >
              <LogoImg src={logo.src} imgClass={logo.imgClass} size={logo.size} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
