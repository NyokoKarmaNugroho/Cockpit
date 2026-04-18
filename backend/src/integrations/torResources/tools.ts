import { tool } from "langchain";
import { z } from "zod";
import {
  AhmiaClearnet,
  AhmiaRepos,
  DarkFail,
  RESOURCE_NOTES,
  TorProject,
} from "./constants.js";
import { buildAhmiaClearnetSearchUrl, listTorProjectRepos } from "./client.js";
import { OSINT_COMBINE_DARK_WEB_SEARCHING } from "./osintcombineDarkWebSearching.js";

export function createTorResourceTools() {
  const torOsintResourceCatalog = tool(
    async () => ({
      ahmia: {
        description: RESOURCE_NOTES.ahmia,
        clearnet: AhmiaClearnet,
        sourceRepositories: {
          ahmiaIndex: AhmiaRepos.index,
          ahmiaCrawler: AhmiaRepos.crawler,
          ahmiaSite: AhmiaRepos.site,
        },
      },
      torProject: {
        description: RESOURCE_NOTES.torProject,
        website: TorProject.home,
        githubOrganizationWeb: TorProject.githubOrg,
        githubApiListRepos: TorProject.githubApiOrgRepos,
      },
      darkFail: {
        url: DarkFail.url,
        description: RESOURCE_NOTES.darkFail,
      },
    }),
    {
      name: "tor_osint_resource_catalog",
      description:
        "Returns curated links: Ahmia (GitHub repos ahmia-index, ahmia-crawler, ahmia-site; clearnet search/about/blacklist), Tor Project homepage and GitHub org, and dark.fail with anti-phishing warnings. No network call; safe baseline for Tor/.onion OSINT context.",
      schema: z.object({}),
    },
  );

  const ahmiaClearnetSearchUrl = tool(
    async (input: { query: string }) => {
      const url = buildAhmiaClearnetSearchUrl(input.query);
      return {
        clearnet_search_url: url.toString(),
        note:
          "Ahmia’s public search UI is clearnet; opening indexed hidden services requires Tor Browser. Do not assume every returned .onion is legitimate—verify independently.",
      };
    },
    {
      name: "ahmia_clearnet_search_url",
      description:
        "Builds the Ahmia clearnet search URL for a query string (https://ahmia.fi/search/?q=…). Does not execute search server-side; use for analyst handoff or Tavily/crawl of public docs. Hidden-service browsing is client-side in Tor Browser.",
      schema: z.object({
        query: z.string().min(1).max(500).describe("Search terms for Ahmia hidden-service index"),
      }),
    },
  );

  const darkWebSearchOsintReference = tool(
    async () => ({
      ...OSINT_COMBINE_DARK_WEB_SEARCHING,
      agent_usage:
        "Use this structure to explain darknet vs dark web, safe-access patterns, multi-engine search strategy, directory/onion-watching pivots, and information-slippage framing. Do not scrape or access .onion URLs from the Cockpit server unless product policy explicitly allows; analyst actions belong in Tor Browser or approved environments.",
    }),
    {
      name: "dark_web_search_osint_reference",
      description:
        "Returns a structured OSINT methodology reference from OSINT Combine’s ‘Dark Web Searching’ (https://www.osintcombine.com/post/dark-web-searching): dark nets (Tor/I2P/Hyphanet/Zeronet), safe-browsing patterns, Tor search engines and onion directories (with caution notes), onion-watching resources, information slippage, and legal/safety reminders. Static data — no network call.",
      schema: z.object({}),
    },
  );

  const torprojectGithubRepositories = tool(
    async (input: { page?: number; per_page?: number }) => {
      const { repos, linkHeader } = await listTorProjectRepos({
        page: input.page,
        perPage: input.per_page,
      });
      return {
        repositories: repos,
        pagination_hint: linkHeader ?? null,
        note: "Optional GITHUB_TOKEN in backend env raises GitHub API rate limits for this org listing.",
      };
    },
    {
      name: "torproject_github_repositories",
      description:
        "Lists public GitHub repositories for the torproject organization (GET https://api.github.com/orgs/torproject/repos). Use to point investigations at official Tor code and docs repos.",
      schema: z.object({
        page: z.number().int().min(1).optional().describe("GitHub results page (default 1)"),
        per_page: z.number().int().min(1).max(100).optional().describe("Repos per page (default 20, max 100)"),
      }),
    },
  );

  return [
    torOsintResourceCatalog,
    darkWebSearchOsintReference,
    ahmiaClearnetSearchUrl,
    torprojectGithubRepositories,
  ] as const;
}
