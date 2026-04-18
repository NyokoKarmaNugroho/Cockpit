/**
 * Curated Tor / dark-web ecosystem pointers for investigator agents.
 * Verify URLs over time; phishing and clone sites exist — never trust a single directory alone.
 */

export const AhmiaRepos = {
  index: "https://github.com/ahmia/ahmia-index",
  crawler: "https://github.com/ahmia/ahmia-crawler",
  site: "https://github.com/ahmia/ahmia-site",
} as const;

export const TorProject = {
  home: "https://www.torproject.org/",
  /** GitHub organization listing (browser); API: GET /orgs/torproject/repos */
  githubOrg: "https://github.com/orgs/torproject/repositories",
  githubApiOrgRepos: "https://api.github.com/orgs/torproject/repos",
} as const;

export const AhmiaClearnet = {
  /** Public search UI (JavaScript-heavy; results relate to Tor hidden services). */
  searchBase: "https://ahmia.fi/search/",
  about: "https://ahmia.fi/about/",
  blacklist: "https://ahmia.fi/blacklist/",
} as const;

/** Third-party link directory — treat as untrusted; verify .onion addresses from multiple sources. */
export const DarkFail = {
  url: "https://dark.fail/",
} as const;

export const RESOURCE_NOTES = {
  ahmia:
    "Ahmia indexes Tor hidden services for search. Clearnet UI at ahmia.fi; accessing linked .onion services requires Tor Browser. Abuse: see ahmia.fi/blacklist/.",
  torProject: "The Tor Project maintains Tor Browser and core software; source and repos live under the torproject GitHub org.",
  darkFail:
    "dark.fail is an independent link list. Assume risk of phishing/typosquatting; cross-check onions with official project sites and PGP-signed announcements where available.",
} as const;
