import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetStarted } from "../context/GetStartedContext";
import { GetStartedTrigger } from "./GetStartedTrigger";

const learnLinks = [
  { label: "Learn BlockInt", href: "#learn-blockint" },
  { label: "Blog", href: "/blog" },
  { label: "Glossarium", href: "#glossarium" },
] as const;

/** In-app routes (no hash) — use React Router to avoid full reloads. */
function isSpaInternalPath(href: string) {
  return href.startsWith("/") && !href.includes("#");
}

const productItems = [
  { id: "daemonprotocol", label: "daemonprotocol", href: "https://daemonprotocol.com" as const },
  { id: "ares", label: "ares", href: "https://aressystem.dev" as const },
  { id: "obscura", label: "Obscura", href: "https://obscura-app.com" as const },
  { id: "khonsu", label: "Khonsu IDE", comingSoon: true as const },
] as const;

type DesktopNavItem = { label: string; to: string } | { label: string; href: string };

const desktopNavAnchors: DesktopNavItem[] = [
  { label: "Pricing", to: "/pricing" },
  { label: "Use cases", href: "#use-cases" },
];

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mobile: large section links (existing pattern). */
const mobileNav = [
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Contact", href: "mailto:hello@cockpit.io" },
  { label: "Get started", href: "#get-started" },
];

const getStartedDirectDashboard = import.meta.env.VITE_GET_STARTED_DIRECT_DASHBOARD === "true";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"product" | "learn" | null>(null);
  const navId = useId();
  const productMenuId = useId();
  const learnMenuId = useId();
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { open: openGetStarted, markGetStartedPressed } = useGetStarted();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMenu]);

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#"
          className="flex items-center gap-3 rounded-sm outline-none ring-ink ring-offset-2 ring-offset-canvas focus-visible:ring-2"
        >
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Cockpit
          </span>
        </a>

        <nav
          ref={desktopNavRef}
          className="hidden items-center gap-6 lg:gap-8 md:flex"
          aria-label="Primary"
        >
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              aria-expanded={openMenu === "product"}
              aria-haspopup="true"
              aria-controls={productMenuId}
              id={`${productMenuId}-trigger`}
              onClick={() => setOpenMenu((m) => (m === "product" ? null : "product"))}
            >
              Product
              <ChevronDown open={openMenu === "product"} />
            </button>
            {openMenu === "product" ? (
              <ul
                id={productMenuId}
                role="menu"
                aria-labelledby={`${productMenuId}-trigger`}
                className="absolute left-0 top-full z-50 mt-1 min-w-[260px] rounded-md border border-ink/10 bg-canvas py-2 shadow-lg"
              >
                {productItems.map((item) =>
                  "href" in item ? (
                    <li key={item.id} role="none">
                      <a
                        role="menuitem"
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 text-sm text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.id} role="none">
                      <span
                        role="menuitem"
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-baseline justify-between gap-2 px-4 py-2.5 text-sm text-ink-faint"
                      >
                        <span>{item.label}</span>
                        <span className="shrink-0 text-xs font-normal text-ink-muted">Coming soon</span>
                      </span>
                    </li>
                  )
                )}
              </ul>
            ) : null}
          </div>

          {desktopNavAnchors.map((item) =>
            "to" in item ? (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                {item.label}
              </a>
            ),
          )}

          <Link
            to={{ pathname: "/", hash: "docs" }}
            className="text-sm font-medium text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-sm"
          >
            Documentation
          </Link>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              aria-expanded={openMenu === "learn"}
              aria-haspopup="true"
              aria-controls={learnMenuId}
              id={`${learnMenuId}-trigger`}
              onClick={() => setOpenMenu((m) => (m === "learn" ? null : "learn"))}
            >
              Learn
              <ChevronDown open={openMenu === "learn"} />
            </button>
            {openMenu === "learn" ? (
              <ul
                id={learnMenuId}
                role="menu"
                aria-labelledby={`${learnMenuId}-trigger`}
                className="absolute left-0 top-full z-50 mt-1 min-w-[280px] rounded-md border border-ink/10 bg-canvas py-2 shadow-lg"
              >
                {learnLinks.map((item) => (
                  <li key={item.href} role="none">
                    {isSpaInternalPath(item.href) ? (
                      <Link
                        role="menuitem"
                        to={item.href}
                        className="block px-4 py-2.5 text-sm text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        role="menuitem"
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

        </nav>

        <div className="hidden md:block">
          <GetStartedTrigger className="inline-flex items-center justify-center bg-accent px-5 py-2 text-sm font-semibold text-canvas transition-opacity hover:opacity-90" />
        </div>

        <button
          type="button"
          className="inline-flex min-h-[34px] min-w-[60px] items-center justify-center border border-ink/20 px-3 py-2 text-sm font-medium text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-ink/35 md:hidden"
            aria-hidden
            onClick={close}
          />
          <nav
            id={navId}
            className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto bg-canvas md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div className="flex min-h-[min(100dvh-4rem,900px)] flex-1 flex-col px-4 pb-10 pt-2">
              <ul className="mobile-nav-list flex flex-col">
                <li className="border-b border-ink/10 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Product</p>
                  <ul className="mt-2 flex flex-col gap-0">
                    {productItems.map((item) =>
                      "href" in item ? (
                        <li key={item.id}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-11 items-center py-2 text-base font-medium text-ink-muted hover:text-ink"
                            onClick={close}
                          >
                            {item.label}
                          </a>
                        </li>
                      ) : (
                        <li key={item.id}>
                          <span className="flex min-h-11 flex-col justify-center py-2 text-base font-medium text-ink-faint">
                            <span>{item.label}</span>
                            <span className="text-sm font-normal text-ink-muted">Coming soon</span>
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </li>

                <li className="mobile-nav-item border-b border-ink/10">
                  <Link
                    to="/pricing"
                    className="mobile-nav-link flex min-h-[72px] items-center py-4 font-display text-2xl font-medium text-ink sm:text-[1.75rem]"
                    onClick={close}
                  >
                    Pricing
                  </Link>
                </li>
                <li className="mobile-nav-item border-b border-ink/10">
                  <a
                    href="#use-cases"
                    className="mobile-nav-link flex min-h-[72px] items-center py-4 font-display text-2xl font-medium text-ink sm:text-[1.75rem]"
                    onClick={close}
                  >
                    Use cases
                  </a>
                </li>

                <li className="mobile-nav-item border-b border-ink/10">
                  <Link
                    to={{ pathname: "/", hash: "docs" }}
                    className="mobile-nav-link flex min-h-[72px] items-center py-4 font-display text-2xl font-medium text-ink sm:text-[1.75rem]"
                    onClick={close}
                  >
                    Documentation
                  </Link>
                </li>

                <li className="border-b border-ink/10 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Learn</p>
                  <ul className="mt-2 flex flex-col gap-0">
                    {learnLinks.map((item) => (
                      <li key={item.href}>
                        {isSpaInternalPath(item.href) ? (
                          <Link
                            to={item.href}
                            className="flex min-h-11 items-center py-2 text-base font-medium text-ink-muted hover:text-ink"
                            onClick={close}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <a
                            href={item.href}
                            className="flex min-h-11 items-center py-2 text-base font-medium text-ink-muted hover:text-ink"
                            onClick={close}
                          >
                            {item.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>

                {mobileNav.map((item) => {
                  const isCta = item.label === "Get started";
                  if (isCta) {
                    return (
                      <li key={item.label} className="mobile-nav-item border-b border-ink/10">
                        <button
                          type="button"
                          className="mobile-nav-link flex min-h-[72px] w-full items-center py-4 text-left font-display text-2xl font-semibold text-ink sm:text-[1.75rem]"
                          onClick={() => {
                            markGetStartedPressed();
                            if (getStartedDirectDashboard) {
                              navigate("/build-dashboard");
                            } else {
                              openGetStarted();
                            }
                            close();
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={item.label} className="mobile-nav-item border-b border-ink/10">
                      <a
                        href={item.href}
                        className="mobile-nav-link flex min-h-[72px] items-center py-4 font-display text-2xl font-medium text-ink sm:text-[1.75rem]"
                        onClick={close}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="mobile-nav-meta mt-auto flex flex-col gap-6 border-t border-ink/10 pt-10">
                <a
                  href="mailto:hello@cockpit.io"
                  className="text-sm font-medium text-ink-muted hover:text-ink"
                  onClick={close}
                >
                  hello@cockpit.io
                </a>
                <p className="text-sm leading-relaxed text-ink-faint">
                  © {new Date().getFullYear()} Cockpit. Blockchain intelligence for teams that need
                  defensible outcomes.
                </p>
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
