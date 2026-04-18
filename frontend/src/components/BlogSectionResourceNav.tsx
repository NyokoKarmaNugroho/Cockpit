import { Link } from "react-router-dom";
import {
  BLOG_RESOURCE_EXTERNAL,
  BLOG_RESOURCE_HASH_LINKS,
  BLOG_RESOURCE_ROUTES,
} from "./blogSectionResourceLinks";

const pillBase =
  "inline-flex min-h-[44px] max-w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow] motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas motion-reduce:transition-none";

const pillDefault = `${pillBase} border-ink/15 bg-canvas text-ink hover:border-ink/25 hover:bg-canvas-subtle/80`;

const pillCta = `${pillBase} border-accent/35 bg-accent/[0.08] text-ink hover:border-accent/50 hover:bg-accent/[0.12]`;

/**
 * Grouped resource links for the landing blog section — pills for scanability; accent on newsletter CTA.
 */
export function BlogSectionResourceNav() {
  return (
    <nav className="mt-10 border-t border-ink/10 pt-8" aria-label="Blog resources and email updates">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Resources</p>
          <ul className="mt-4 flex list-none flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-2.5">
            {BLOG_RESOURCE_ROUTES.map((item) => (
              <li key={item.to} className="min-w-0">
                <Link to={item.to} className={`${pillDefault} min-w-0 shrink`}>
                  <span className="text-balance">{item.label}</span>
                </Link>
              </li>
            ))}
            {BLOG_RESOURCE_EXTERNAL.map((item) => (
              <li key={item.href} className="min-w-0">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pillDefault} min-w-0 shrink`}
                >
                  <span className="text-balance">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 border-t border-ink/10 pt-6 sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Stay in the loop</p>
          <ul className="mt-4 flex list-none flex-col gap-2.5">
            {BLOG_RESOURCE_HASH_LINKS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={`${pillCta} w-full sm:w-auto`}>
                  <span className="text-balance">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
