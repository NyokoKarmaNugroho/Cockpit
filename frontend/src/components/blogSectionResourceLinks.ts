/** Landing #blog strip — resource destinations. */

export const BLOG_RESOURCE_ROUTES = [
  { to: "/blog", label: "Blog & OSINT resources" },
  { to: "/explore-data", label: "Compliance exports guide" },
  { to: "/methodology/risk-exposure", label: "Risk exposure methodology" },
  { to: "/pricing", label: "Pricing & tiers" },
] as const;

/** Third-party guides (open in a new tab). */
export const BLOG_RESOURCE_EXTERNAL = [
  {
    href: "https://gijn.org/resource/tech-focus-project-investigating-ai-disinformation/",
    label: "GIJN: Investigating AI disinformation",
  },
] as const;

export const BLOG_RESOURCE_HASH_LINKS = [{ href: "#newsletter", label: "Email updates" }] as const;
